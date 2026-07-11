import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { firstLine, isPlainObject, parseFrontmatter } from './frontmatter-lib.mjs';
import { expandFilePathPatterns } from './path-glob-lib.mjs';
import { registerSchemas, validateWithSchema } from './schema-lib.mjs';
import { schemas } from './schemas.generated.mjs';

const commandSchema = schemas['command.frontmatter'];
const commandSchemaRegistered = registerSchemas([commandSchema]);

export async function validateCommandPaths(paths, options = {}) {
  const root = options.root ?? process.cwd();
  const selected = await expandCommandPathPatterns(paths, root);
  if (selected.length === 0) {
    return { ok: false, reports: [], text: 'FAIL No commands found.\n' };
  }

  const reports = [];
  for (const path of selected) reports.push(await validateCommandPath(path, { root }));
  return {
    ok: reports.every((report) => report.status === 'pass'),
    reports,
    text: `${reports.map(formatReport).join('\n')}\n`
  };
}

export async function validateCommandPath(commandPath, options = {}) {
  const root = options.root ?? process.cwd();
  const absolute = resolve(root, commandPath);
  const name = basename(absolute, '.md');
  let source;

  try {
    source = await readFile(absolute, 'utf8');
  } catch {
    return failReport(name, absolute, ['command Markdown file must exist']);
  }

  const normalized = source.startsWith('\uFEFF') ? source.slice(1) : source;
  const parsed = parseFrontmatter(source);
  if (!parsed && /^---[\t ]*(?:\r?\n|$)/.test(normalized)) {
    return failReport(name, absolute, ['YAML frontmatter block must use complete --- delimiter lines']);
  }

  const errors = [];
  if (parsed) {
    const document = parseDocument(parsed.yaml, {
      prettyErrors: true,
      strict: true,
      uniqueKeys: true
    });
    if (document.errors.length > 0) {
      errors.push(...document.errors.map((error) => `invalid YAML: ${firstLine(error.message)}`));
    } else {
      const data = document.toJS();
      if (!isPlainObject(data)) {
        errors.push('frontmatter must be a YAML mapping');
      } else {
        await commandSchemaRegistered;
        const result = await validateWithSchema(commandSchema, data);
        errors.push(...result.errors.map((error) => `frontmatter ${error}`));
      }
    }
  }

  const body = parsed?.body ?? normalized;
  if (body.trim() === '') errors.push('body must contain command instructions');
  return errors.length === 0
    ? { name, path: absolute, status: 'pass', errors: [] }
    : failReport(name, absolute, errors);
}

export function expandCommandPathPatterns(patterns, root = process.cwd()) {
  return expandFilePathPatterns(patterns, root);
}

function formatReport(report) {
  if (report.status === 'pass') return `PASS ${report.name}`;
  return [`FAIL ${report.name}`, ...report.errors.map((error) => `  - ${error}`)].join('\n');
}

function failReport(name, path, errors) {
  return { name, path, status: 'fail', errors };
}
