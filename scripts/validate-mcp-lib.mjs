import { readFile } from 'node:fs/promises';
import { basename, posix, resolve, win32 } from 'node:path';
import { isPlainObject } from './frontmatter-lib.mjs';
import { expandFilePathPatterns } from './path-glob-lib.mjs';
import { registerSchemas, validateWithSchema } from './schema-lib.mjs';
import { schemas } from './schemas.generated.mjs';

const mcpSchema = schemas.mcp;
const mcpSchemaRegistered = registerSchemas([mcpSchema]);

export async function validateMcpPaths(paths, options = {}) {
  const root = options.root ?? process.cwd();
  const selected = await expandMcpPathPatterns(paths, root);
  if (selected.length === 0) {
    return { ok: false, reports: [], text: 'FAIL No MCP files found.\n' };
  }

  const reports = [];
  for (const path of selected) reports.push(await validateMcpPath(path, { root }));
  return {
    ok: reports.every((report) => report.status === 'pass'),
    reports,
    text: `${reports.map(formatReport).join('\n')}\n`
  };
}

export async function validateMcpPath(mcpPath, options = {}) {
  const root = options.root ?? process.cwd();
  const absolute = resolve(root, mcpPath);
  const name = basename(absolute);
  let source;

  try {
    source = await readFile(absolute, 'utf8');
  } catch {
    return failReport(name, absolute, ['MCP JSON file must exist']);
  }

  let data;
  try {
    data = JSON.parse(source);
  } catch {
    return failReport(name, absolute, ['MCP file contains invalid JSON']);
  }

  const targetedErrors = findTargetedErrors(data);
  if (targetedErrors.length > 0) return failReport(name, absolute, targetedErrors);

  await mcpSchemaRegistered;
  const result = await validateWithSchema(mcpSchema, data);
  return result.valid
    ? { name, path: absolute, status: 'pass', errors: [] }
    : failReport(name, absolute, result.errors);
}

export function expandMcpPathPatterns(patterns, root = process.cwd()) {
  return expandFilePathPatterns(patterns, root);
}

function findTargetedErrors(data) {
  if (!isPlainObject(data?.mcpServers)) return [];
  const errors = [];
  for (const [serverName, server] of Object.entries(data.mcpServers)) {
    if (!isPlainObject(server)) continue;
    if (!Object.hasOwn(server, 'type') && Object.hasOwn(server, 'url')) {
      errors.push(`server ${serverName}: URL requires explicit type`);
      continue;
    }
    if ((server.type === undefined || server.type === 'stdio') && !Object.hasOwn(server, 'command')) {
      errors.push(`server ${serverName}: missing required command`);
      continue;
    }
    if (server.type === undefined || server.type === 'stdio') {
      errors.push(...findPortablePathErrors(serverName, server));
    }
  }
  return errors;
}

function findPortablePathErrors(serverName, server) {
  const candidates = [
    ['command', server.command, false],
    ['cwd', server.cwd, false],
    ...Array.isArray(server.args)
      ? server.args.map((value, index) => [`args[${index}]`, value, true])
      : [],
    ...isPlainObject(server.env)
      ? Object.entries(server.env).map(([key, value]) => [`env.${key}`, value, false])
      : []
  ];

  return candidates
    .filter(([, value, isArgument]) => typeof value === 'string' && isMachineAbsolutePath(value, { isArgument }))
    .map(([field]) => `server ${serverName}: field ${field} contains machine-absolute path`);
}

function isMachineAbsolutePath(value, options = {}) {
  const candidate = value.trim();
  if (options.isArgument && isSlashSwitch(candidate)) return false;
  return win32.isAbsolute(candidate) || posix.isAbsolute(candidate);
}

function isSlashSwitch(value) {
  return /^\/[A-Za-z][A-Za-z0-9_-]*$/.test(value);
}

function formatReport(report) {
  if (report.status === 'pass') return `PASS ${report.name}`;
  return [`FAIL ${report.name}`, ...report.errors.map((error) => `  - ${error}`)].join('\n');
}

function failReport(name, path, errors) {
  return { name, path, status: 'fail', errors };
}
