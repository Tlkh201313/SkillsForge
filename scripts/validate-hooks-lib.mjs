import { readFile, readdir } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
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
  const expanded = [];
  for (const pattern of [...new Set(patterns)]) {
    if (!pattern.includes('*')) {
      expanded.push(pattern);
      continue;
    }

    const normalized = pattern.replaceAll('\\', '/');
    const slash = normalized.lastIndexOf('/');
    const parent = slash === -1 ? '.' : normalized.slice(0, slash);
    const namePattern = slash === -1 ? normalized : normalized.slice(slash + 1);
    const regex = new RegExp(`^${namePattern.split('*').map(escapeRegex).join('.*')}$`);
    let entries;
    try {
      entries = await readdir(resolve(root, parent), { withFileTypes: true });
    } catch {
      expanded.push(pattern);
      continue;
    }

    const matches = entries
      .filter((entry) => entry.isFile() && regex.test(entry.name))
      .map((entry) => parent === '.' ? entry.name : `${parent}/${entry.name}`)
      .sort((left, right) => left.localeCompare(right));
    expanded.push(...(matches.length === 0 ? [pattern] : matches));
  }
  return expanded;
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

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}
