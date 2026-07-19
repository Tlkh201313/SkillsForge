import { access, readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveUnderRoot } from '../../lib/capabilities/paths.mjs';

export const modulePluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function isPluginRoot(root) {
  return await pathExists(join(root, '.claude-plugin', 'plugin.json'))
    && await pathExists(join(root, 'skills'));
}

export async function isRepositoryRoot(root) {
  return pathExists(join(root, 'plugins', 'skillsforge', '.claude-plugin', 'plugin.json'));
}

export async function resolveRuntimeRoot(options, { explicitPaths = false } = {}) {
  if (options.root) return options.root;
  if (explicitPaths) return process.cwd();
  const cwd = process.cwd();
  if (await isRepositoryRoot(cwd)) return cwd;
  if (await isPluginRoot(modulePluginRoot)) return modulePluginRoot;
  if (await isPluginRoot(cwd)) return cwd;
  return cwd;
}

export function consumeFlag(values, flag) {
  const index = values.indexOf(flag);
  if (index === -1) return false;
  values.splice(index, 1);
  return true;
}

export function consumeOption(values, flag) {
  const index = values.indexOf(flag);
  if (index === -1) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith('--')) {
    values.splice(index, 1);
    return null;
  }
  values.splice(index, 2);
  return value;
}

export function consumeOptions(values, flag) {
  const picked = [];
  for (;;) {
    const index = values.indexOf(flag);
    if (index === -1) return picked;
    const value = values[index + 1];
    if (!value || value.startsWith('--')) {
      values.splice(index, 1);
      return null;
    }
    picked.push(value);
    values.splice(index, 2);
  }
}

export function resolveUserPath(root, value, allowAbsolute = false) {
  return resolveUnderRoot(root, value, { allowAbsolute });
}

export async function resolvePackageRoot(root, packageOption) {
  if (packageOption) return resolve(packageOption);
  if (await isPluginRoot(root)) return root;
  const distPackage = join(root, 'dist', 'claude-code');
  if (await pathExists(join(distPackage, '.claude-plugin', 'plugin.json'))) return distPackage;
  if (await isRepositoryRoot(root)) return join(root, 'plugins', 'skillsforge');
  return root;
}

export function usage(message) {
  process.stderr.write(`${message}\n`);
  return 2;
}

export function hasUnknownOption(args) {
  return args.find((item) => item.startsWith('--'));
}

export function writeOsResult(payload, json, textFormatter, status = 0) {
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else process.stdout.write(textFormatter(payload));
  return status;
}

export function failOsResult(command, error, json) {
  return writeOsResult({ ok: false, command, error }, json, (payload) => `${payload.error}\n`, 1);
}

export function splitCommandArgs(argv) {
  const marker = argv.indexOf('--');
  if (marker === -1) return { options: argv, command: [] };
  return {
    options: argv.slice(0, marker),
    command: argv.slice(marker + 1)
  };
}

export function globToRegExp(glob) {
  const escaped = String(glob)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

export async function walkFind(root, dir, regex, matches, limit) {
  if (matches.length >= limit) return;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (matches.length >= limit) return;
    if (shouldSkipFindEntry(entry.name)) continue;
    const full = join(dir, entry.name);
    const rel = relative(root, full).replaceAll('\\', '/');
    const type = entry.isDirectory() ? 'dir' : entry.isFile() ? 'file' : 'other';
    if (regex.test(entry.name) || regex.test(rel)) matches.push({ path: rel, type });
    if (entry.isDirectory()) await walkFind(root, full, regex, matches, limit);
  }
}

export function shouldSkipFindEntry(name) {
  return new Set(['.git', '.codegraph', 'node_modules', '.worktrees', 'dist', 'artifacts']).has(name);
}

export function isUrlLike(value) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) || /^mailto:/i.test(value);
}

export function platformOpenCommand(target) {
  if (process.platform === 'win32') {
    return { command: 'powershell.exe', args: ['-NoProfile', '-Command', 'Start-Process', '-FilePath', target] };
  }
  if (process.platform === 'darwin') return { command: 'open', args: [target] };
  return { command: 'xdg-open', args: [target] };
}

export function runProcess(command, args, options = {}) {
  return new Promise((resolveProcess) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      shell: false,
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const limit = 200_000;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, options.timeoutMs ?? 30000);
    child.stdout?.on('data', (chunk) => {
      stdout = (stdout + chunk.toString()).slice(-limit);
    });
    child.stderr?.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-limit);
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolveProcess({ status: 127, stdout, stderr: error.message, timedOut });
    });
    child.on('close', (status, signal) => {
      clearTimeout(timer);
      resolveProcess({ status: status ?? 1, signal, stdout, stderr, timedOut });
    });
  });
}

export async function directorySize(path) {
  let info;
  try {
    info = await stat(path);
  } catch {
    return 0;
  }
  if (!info.isDirectory()) return info.size;
  let total = 0;
  let entries;
  try {
    entries = await readdir(path, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    total += await directorySize(join(path, entry.name));
  }
  return total;
}

