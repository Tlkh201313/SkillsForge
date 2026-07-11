import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { expandFilePathPatterns } from './path-glob-lib.mjs';
import { registerSchemas, validateWithSchema } from './schema-lib.mjs';
import { schemas } from './schemas.generated.mjs';

const hooksSchema = schemas.hooks;
const officialEvents = new Set(hooksSchema.$defs.events.enum);
const hooksSchemaRegistered = registerSchemas([hooksSchema]);

export async function validateHooksPaths(paths, options = {}) {
  const root = options.root ?? process.cwd();
  const selected = await expandHooksPathPatterns(paths, root);
  if (selected.length === 0) {
    return { ok: false, reports: [], text: 'FAIL No hooks files found.\n' };
  }

  const reports = [];
  for (const path of selected) reports.push(await validateHooksPath(path, { root }));
  return {
    ok: reports.every((report) => report.status === 'pass'),
    reports,
    text: `${reports.map(formatReport).join('\n')}\n`
  };
}

export async function validateHooksPath(hooksPath, options = {}) {
  const root = options.root ?? process.cwd();
  const absolute = resolve(root, hooksPath);
  const name = basename(absolute);
  let source;

  try {
    source = await readFile(absolute, 'utf8');
  } catch {
    return failReport(name, absolute, ['hooks JSON file must exist']);
  }

  let data;
  try {
    data = JSON.parse(source);
  } catch {
    return failReport(name, absolute, ['hooks file contains invalid JSON']);
  }

  const targetedErrors = findTargetedErrors(data);
  if (targetedErrors.length > 0) return failReport(name, absolute, targetedErrors);

  await hooksSchemaRegistered;
  const result = await validateWithSchema(hooksSchema, data);
  return result.valid
    ? { name, path: absolute, status: 'pass', errors: [] }
    : failReport(name, absolute, result.errors);
}

export async function expandHooksPathPatterns(patterns, root = process.cwd()) {
  return expandFilePathPatterns(patterns, root);
}

function findTargetedErrors(data) {
  if (!isPlainObject(data?.hooks)) return [];
  const errors = [];
  for (const [event, groups] of Object.entries(data.hooks)) {
    if (!officialEvents.has(event)) {
      errors.push(`unknown event ${event}`);
      continue;
    }
    if (!Array.isArray(groups)) continue;
    for (const group of groups) {
      if (!Array.isArray(group?.hooks)) continue;
      for (const handler of group.hooks) {
        if (isPlainObject(handler) && handler.type === 'command' && !Object.hasOwn(handler, 'command')) {
          errors.push(`${event} command handler is missing required command`);
        }
      }
    }
  }
  return errors;
}

function formatReport(report) {
  if (report.status === 'pass') return `PASS ${report.name}`;
  return [`FAIL ${report.name}`, ...report.errors.map((error) => `  - ${error}`)].join('\n');
}

function failReport(name, path, errors) {
  return { name, path, status: 'fail', errors };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
