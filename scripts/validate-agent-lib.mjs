import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { firstLine, isPlainObject, parseFrontmatter } from './frontmatter-lib.mjs';
import { expandFilePathPatterns } from './path-glob-lib.mjs';
import { registerSchemas, validateWithSchema } from './schema-lib.mjs';
import { schemas } from './schemas.generated.mjs';

const agentSchema = schemas['agent.frontmatter'];
const agentSchemaRegistered = registerSchemas([agentSchema]);

export async function validateAgentPaths(paths, options = {}) {
  const root = options.root ?? process.cwd();
  const selected = await expandAgentPathPatterns(paths, root);
  if (selected.length === 0) {
    return { ok: false, reports: [], text: 'FAIL No agents found.\n' };
  }

  const reports = [];
  for (const path of selected) reports.push(await validateAgentPath(path, { root }));
  return {
    ok: reports.every((report) => report.status === 'pass'),
    reports,
    text: `${reports.map(formatReport).join('\n')}\n`
  };
}

export async function validateAgentPath(agentPath, options = {}) {
  const root = options.root ?? process.cwd();
  const absolute = resolve(root, agentPath);
  const name = basename(absolute, '.md');
  const errors = [];
  let source;

  try {
    source = await readFile(absolute, 'utf8');
  } catch {
    return failReport(name, absolute, ['agent Markdown file must exist']);
  }

  const parsed = parseFrontmatter(source);
  if (!parsed) {
    return failReport(name, absolute, ['YAML frontmatter block must exist and use complete --- delimiter lines']);
  }

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
      await agentSchemaRegistered;
      const schemaResult = await validateWithSchema(agentSchema, data);
      errors.push(...schemaResult.errors.map((error) => `frontmatter ${error}`));
      if (typeof data.name === 'string' && data.name !== name) errors.push('name must equal file basename');
    }
  }

  if (parsed.body.trim() === '') errors.push('body must contain agent instructions');
  return errors.length === 0
    ? { name, path: absolute, status: 'pass', errors: [] }
    : failReport(name, absolute, errors);
}

export async function expandAgentPathPatterns(patterns, root = process.cwd()) {
  return expandFilePathPatterns(patterns, root);
}

function formatReport(report) {
  if (report.status === 'pass') return `PASS ${report.name}`;
  return [`FAIL ${report.name}`, ...report.errors.map((error) => `  - ${error}`)].join('\n');
}

function failReport(name, path, errors) {
  return { name, path, status: 'fail', errors };
}
