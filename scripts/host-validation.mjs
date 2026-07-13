#!/usr/bin/env node
/**
 * Strict Claude host validation for release gates.
 * Spawns `claude plugin validate --strict` on marketplace / plugin / dist paths.
 * FAIL if Claude binary missing or any path fails. No soft-skip.
 */
import { access, mkdir, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { platform } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function resolveClaudeBinary(options = {}) {
  const base = options.root ?? root;
  const win = platform() === 'win32';
  const localNames = win
    ? ['claude.exe', 'claude']
    : ['claude', 'claude.exe'];
  const candidates = [
    ...localNames.map((name) => join(base, 'node_modules', '@anthropic-ai', 'claude-code', 'bin', name)),
    ...localNames.map((name) => join(base, 'node_modules', '.bin', name))
  ];
  return candidates;
}

async function firstExisting(paths) {
  for (const candidate of paths) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      try {
        await access(candidate, fsConstants.F_OK);
        return candidate;
      } catch {
        // continue
      }
    }
  }
  return null;
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      env: options.env ?? process.env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      resolvePromise({ code: 1, stdout, stderr, spawnError: error.message });
    });
    child.on('exit', (code) => resolvePromise({ code: code ?? 1, stdout, stderr }));
  });
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {object} [options]
 * @param {string} [options.root]
 * @param {string[]} [options.paths]
 * @param {boolean} [options.requireDist]
 * @returns {Promise<{status:'pass'|'fail', tool:string, paths:object[], detail?:string, claude?:string}>}
 */
export async function runHostValidation(options = {}) {
  const buildRoot = options.root ?? root;
  const requireDist = options.requireDist ?? false;
  const claude = await firstExisting(resolveClaudeBinary({ root: buildRoot }));
  const tool = 'claude plugin validate --strict';

  if (!claude) {
    return {
      status: 'fail',
      tool,
      paths: [],
      detail: 'claude binary unavailable (expected node_modules/@anthropic-ai/claude-code/bin)'
    };
  }

  const defaultPaths = ['.', 'plugins/skillsforge'];
  const distPath = 'dist/claude-code';
  const distAbs = join(buildRoot, distPath);
  const distPresent = await pathExists(distAbs);

  let targets = options.paths
    ? [...options.paths]
    : [...defaultPaths];

  if (!options.paths) {
    if (distPresent) targets.push(distPath);
    else if (requireDist) {
      return {
        status: 'fail',
        tool,
        claude,
        paths: [],
        detail: `required path missing: ${distPath} (run build:dist first)`
      };
    }
  }

  const results = [];
  for (const relative of targets) {
    const abs = resolve(buildRoot, relative);
    if (!(await pathExists(abs))) {
      results.push({
        path: relative,
        ok: false,
        code: 1,
        detail: 'path missing'
      });
      continue;
    }
    const attempt = await run(claude, ['plugin', 'validate', abs, '--strict'], { cwd: buildRoot });
    const ok = attempt.code === 0;
    results.push({
      path: relative,
      ok,
      code: attempt.code,
      detail: ok ? 'ok' : (attempt.stderr || attempt.stdout || attempt.spawnError || `exit ${attempt.code}`).trim().slice(0, 500)
    });
  }

  const failed = results.filter((item) => !item.ok);
  if (failed.length > 0) {
    return {
      status: 'fail',
      tool,
      claude,
      paths: results,
      detail: failed.map((item) => `${item.path}: ${item.detail}`).join('; ')
    };
  }

  return {
    status: 'pass',
    tool,
    claude,
    paths: results
  };
}

function parseArgs(argv) {
  const args = [...argv];
  const outIndex = args.indexOf('--out');
  let out = null;
  if (outIndex >= 0) {
    out = args[outIndex + 1] ?? null;
    args.splice(outIndex, out == null ? 1 : 2);
  }
  const requireDist = args.includes('--require-dist');
  const filtered = args.filter((item) => item !== '--require-dist' && !item.startsWith('--'));
  return { paths: filtered.length ? filtered : null, out, requireDist };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { paths, out, requireDist } = parseArgs(process.argv.slice(2));
  const result = await runHostValidation({ paths: paths ?? undefined, requireDist });
  const text = `${JSON.stringify(result, null, 2)}\n`;
  process.stdout.write(text);
  if (out) {
    const absOut = resolve(root, out);
    await mkdir(dirname(absOut), { recursive: true });
    await writeFile(absOut, text);
  }
  process.exit(result.status === 'pass' ? 0 : 1);
}
