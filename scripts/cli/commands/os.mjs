import { readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import {
  consumeFlag, consumeOption, resolveRuntimeRoot, usage, hasUnknownOption,
  writeOsResult, failOsResult, splitCommandArgs, globToRegExp, walkFind,
  isUrlLike, platformOpenCommand, runProcess, directorySize, pathExists, resolveUserPath
} from '../shared.mjs';

export async function runOsEnvCommand(argv) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const name = consumeOption(args, '--name');
  if (name === null) return usage('--name requires a value');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);

  if (name) {
    const exists = Object.hasOwn(process.env, name);
    return writeOsResult({
      ok: exists,
      command: 'os-env',
      name,
      exists,
      value: exists ? process.env[name] : null
    }, json, ({ value }) => `${value ?? ''}\n`, exists ? 0 : 1);
  }

  const pathEntries = String(process.env.PATH ?? process.env.Path ?? '')
    .split(process.platform === 'win32' ? ';' : ':')
    .filter(Boolean);
  return writeOsResult({
    ok: true,
    command: 'os-env',
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    cwd: process.cwd(),
    shell: process.env.SHELL ?? process.env.ComSpec ?? null,
    home: process.env.HOME ?? process.env.USERPROFILE ?? null,
    pathEntries,
    envKeys: Object.keys(process.env).sort()
  }, json, (payload) => [
    `platform=${payload.platform}`,
    `arch=${payload.arch}`,
    `node=${payload.node}`,
    `cwd=${payload.cwd}`,
    `shell=${payload.shell ?? ''}`,
    `pathEntries=${payload.pathEntries.length}`,
    `envKeys=${payload.envKeys.length}`
  ].join('\n') + '\n');
}

export async function runOsFindCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  const name = consumeOption(args, '--name');
  const rootOption = consumeOption(args, '--root') ?? '.';
  const limitValue = consumeOption(args, '--limit') ?? '200';
  if (name === null) return usage('--name requires a value');
  if (rootOption === null) return usage('--root requires a value');
  if (limitValue === null) return usage('--limit requires a value');
  if (!name) return usage('usage: skillsforge os-find --name <glob> [--root <dir>] [--json]');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);

  const repoRoot = await resolveRuntimeRoot(options);
  let root;
  try {
    root = resolveUserPath(repoRoot, rootOption, allowAbsolute);
  } catch (error) {
    return failOsResult('os-find', error.message, json);
  }
  const limit = Math.max(1, Math.min(1000, Number(limitValue) || 200));
  const regex = globToRegExp(name);
  const matches = [];
  await walkFind(root, root, regex, matches, limit);
  return writeOsResult({
    ok: true,
    command: 'os-find',
    root,
    pattern: name,
    limit,
    truncated: matches.length >= limit,
    matches
  }, json, (payload) => payload.matches.map((item) => `${item.type}\t${item.path}`).join('\n') + (payload.matches.length ? '\n' : ''));
}

export async function runOsPortsCommand(argv) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  const attempts = process.platform === 'win32'
    ? [['netstat', ['-ano', '-p', 'tcp']]]
    : [['lsof', ['-nP', '-iTCP', '-sTCP:LISTEN']], ['netstat', ['-an']]];
  for (const [command, commandArgs] of attempts) {
    const result = await runProcess(command, commandArgs, { timeoutMs: 5000 });
    if (result.status === 0 && result.stdout.trim()) {
      const lines = result.stdout.split(/\r?\n/).filter(Boolean).slice(0, 200);
      return writeOsResult({
        ok: true,
        command: 'os-ports',
        probe: [command, ...commandArgs].join(' '),
        lines
      }, json, (payload) => payload.lines.join('\n') + '\n');
    }
  }
  return failOsResult('os-ports', 'no port probe command succeeded', json);
}

export async function runOsOpenCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const dryRun = consumeFlag(args, '--dry-run');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  const target = args.shift();
  if (!target) return usage('usage: skillsforge os-open <path-or-url> [--dry-run] [--json]');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);

  const repoRoot = await resolveRuntimeRoot(options);
  let resolved = target;
  if (!isUrlLike(target)) {
    try {
      resolved = resolveUserPath(repoRoot, target, allowAbsolute);
    } catch (error) {
      return failOsResult('os-open', error.message, json);
    }
  }
  const launcher = platformOpenCommand(resolved);
  const payload = {
    ok: true,
    command: 'os-open',
    dryRun,
    target: resolved,
    launcher: [launcher.command, ...launcher.args]
  };
  if (dryRun) {
    return writeOsResult(payload, json, (item) => `${item.launcher.join(' ')}\n`);
  }
  const result = await runProcess(launcher.command, launcher.args, { timeoutMs: 10000 });
  return writeOsResult({ ...payload, result }, json, () => result.stderr || result.stdout || '', result.status === 0 ? 0 : 1);
}

export async function runOsRunCommand(argv, options) {
  const split = splitCommandArgs(argv);
  const args = [...split.options];
  const json = consumeFlag(args, '--json');
  const dryRunFlag = consumeFlag(args, '--dry-run');
  const yes = consumeFlag(args, '--yes');
  const cwdOption = consumeOption(args, '--cwd') ?? '.';
  const timeoutValue = consumeOption(args, '--timeout-ms') ?? '30000';
  if (cwdOption === null) return usage('--cwd requires a value');
  if (timeoutValue === null) return usage('--timeout-ms requires a value');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  if (split.command.length === 0) return usage('usage: skillsforge os-run [--yes|--dry-run] -- <cmd> [args...]');

  const root = await resolveRuntimeRoot(options);
  let cwd;
  try {
    cwd = resolveUserPath(root, cwdOption, true);
  } catch (error) {
    return failOsResult('os-run', error.message, json);
  }
  const [command, ...commandArgs] = split.command;
  const timeoutMs = Math.max(1000, Math.min(300000, Number(timeoutValue) || 30000));
  const dryRun = dryRunFlag || !yes;
  const payload = {
    ok: true,
    command: 'os-run',
    dryRun,
    cwd,
    timeoutMs,
    argv: [command, ...commandArgs]
  };
  if (dryRun) {
    return writeOsResult(payload, json, (item) => `${item.argv.join(' ')}\n`);
  }
  const result = await runProcess(command, commandArgs, { cwd, timeoutMs });
  return writeOsResult({ ...payload, result, ok: result.status === 0 }, json, () => result.stdout + result.stderr, result.status === 0 ? 0 : 1);
}

export async function runOsCopyPathCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  const target = args.shift();
  if (!target) return usage('usage: skillsforge os-copy-path <path> [--json]');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  const root = await resolveRuntimeRoot(options);
  try {
    const resolved = resolveUserPath(root, target, allowAbsolute);
    return writeOsResult({ ok: true, command: 'os-copy-path', path: resolved }, json, (payload) => `${payload.path}\n`);
  } catch (error) {
    return failOsResult('os-copy-path', error.message, json);
  }
}

export async function runOsCleanCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  const rootOption = consumeOption(args, '--root') ?? '.';
  if (rootOption === null) return usage('--root requires a value');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);

  const repoRoot = await resolveRuntimeRoot(options);
  let root;
  try {
    root = resolveUserPath(repoRoot, rootOption, allowAbsolute);
  } catch (error) {
    return failOsResult('os-clean', error.message, json);
  }
  const names = ['node_modules', 'dist', 'artifacts', 'coverage', '.next', '.turbo', 'tests/.tmp-runner'];
  const candidates = [];
  for (const name of names) {
    const path = resolve(root, name);
    if (await pathExists(path)) {
      candidates.push({
        path,
        relativePath: relative(root, path).replaceAll('\\', '/'),
        bytes: await directorySize(path)
      });
    }
  }
  return writeOsResult({
    ok: true,
    command: 'os-clean',
    dryRun: true,
    root,
    candidates,
    note: 'phase 1 inventory only; no files deleted'
  }, json, (payload) => payload.candidates.map((item) => `${item.bytes}\t${item.relativePath}`).join('\n') + (payload.candidates.length ? '\n' : ''));
}
