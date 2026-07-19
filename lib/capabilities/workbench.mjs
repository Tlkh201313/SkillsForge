import { access, readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, relative, resolve } from 'node:path';
import { loadAllSkills } from './skill-loader.mjs';
import { loadWorkflows } from './workflows.mjs';

const SKIP = new Set(['.git', '.codegraph', 'node_modules', 'dist', 'artifacts', '.next', '.turbo']);

export async function runWorkbench(root, task, options = {}) {
  const full = options.full === true;
  const limit = clampLimit(options.limit, full ? 5000 : 80, full ? 5000 : 1000);
  switch (task) {
    case 'status':
      return workbenchStatus(root);
    case 'tree':
      return { ok: true, task, files: await listFiles(root, limit), limit };
    case 'find':
      return workbenchFind(root, options.query ?? options.name ?? '', limit);
    case 'grep':
      return workbenchGrep(root, options.query ?? '', limit, { full });
    case 'diff':
      return workbenchDiff(root);
    case 'errors':
      return workbenchGrep(root, options.query ?? 'TODO|FIXME|ERROR|FAIL|throw new Error', limit, { regex: true, full });
    case 'bigfiles':
      return workbenchBigFiles(root, limit);
    case 'recent':
      return workbenchRecent(root, limit);
    case 'proof':
      return workbenchProof(root);
    default:
      return { ok: false, task, error: `unknown wb task: ${task}` };
  }
}

export function formatWorkbenchText(payload) {
  if (!payload.ok) {
    if (payload.error) return `${payload.error}\n`;
    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      return payload.errors
        .map((item) => item.error ?? item.message ?? JSON.stringify(item))
        .join('\n') + '\n';
    }
  }
  if (payload.task === 'status') {
    return [
      `branch\t${payload.branch}`,
      `dirty\t${payload.dirty}`,
      `skills\t${payload.skills}`,
      `workflows\t${payload.workflows}`,
      ...payload.status.map((line) => `git\t${line}`)
    ].join('\n') + '\n';
  }
  if (payload.files) return payload.files.join('\n') + (payload.files.length ? '\n' : '');
  if (payload.matches) return payload.matches.map((item) => `${item.file}:${item.line}:${item.text}`).join('\n') + (payload.matches.length ? '\n' : '');
  if (payload.bigFiles) return payload.bigFiles.map((item) => `${item.bytes}\t${item.path}`).join('\n') + (payload.bigFiles.length ? '\n' : '');
  if (payload.lines) return payload.lines.join('\n') + (payload.lines.length ? '\n' : '');
  if (payload.commands) return payload.commands.join('\n') + '\n';
  return `${JSON.stringify(payload, null, 2)}\n`;
}

async function workbenchStatus(root) {
  const [git, skillsLoaded, workflowsLoaded] = await Promise.all([
    runProcess('git', ['status', '--short', '--branch'], { cwd: root }),
    loadAllSkills(root, { collectErrors: true }),
    loadWorkflows(root)
  ]);
  const lines = git.stdout.trim().split(/\r?\n/).filter(Boolean);
  const branch = lines[0]?.replace(/^##\s*/, '') ?? 'unknown';
  const errors = [
    ...skillsLoaded.errors.map((error) => ({
      source: 'skills',
      file: error.directory,
      error: error.message,
      optional: error.optional === true
    })),
    ...workflowsLoaded.errors
  ];
  const ok = git.status === 0 && skillsLoaded.ok && workflowsLoaded.ok;
  return {
    ok,
    task: 'status',
    branch,
    dirty: lines.length > 1,
    status: lines.slice(1),
    skills: skillsLoaded.skills.length,
    workflows: workflowsLoaded.workflows.length,
    errors
  };
}

async function workbenchFind(root, query, limit) {
  if (!query) return { ok: false, task: 'find', error: 'find requires --query or text' };
  const needle = String(query).toLowerCase();
  const matches = (await listFiles(root, 5000)).filter((file) => file.toLowerCase().includes(needle));
  const files = matches.slice(0, limit);
  return { ok: true, task: 'find', query, files, limit, truncated: matches.length > files.length };
}

async function workbenchGrep(root, query, limit, options = {}) {
  if (!query) return { ok: false, task: 'grep', error: 'grep requires --query or text' };
  const args = ['-n', '--glob', '!node_modules/**', '--glob', '!dist/**', '--glob', '!artifacts/**'];
  if (!options.regex) args.push('-F');
  args.push(String(query), '.');
  const result = await runProcess('rg', args, { cwd: root, timeoutMs: 10000 });
  if (result.status > 1) return { ok: false, task: 'grep', error: result.stderr || result.stdout };
  const lines = result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
  const matches = lines
    .slice(0, limit)
    .map((line) => {
      const [file, lineNo, ...rest] = line.split(':');
      return { file, line: Number(lineNo), text: rest.join(':').slice(0, options.full ? 2000 : 300) };
    });
  return { ok: true, task: 'grep', query, matches, limit, truncated: lines.length > matches.length };
}

async function workbenchDiff(root) {
  const [statResult, namesResult] = await Promise.all([
    runProcess('git', ['diff', '--stat'], { cwd: root }),
    runProcess('git', ['diff', '--name-only'], { cwd: root })
  ]);
  return {
    ok: statResult.status === 0 && namesResult.status === 0,
    task: 'diff',
    lines: [
      ...namesResult.stdout.trim().split(/\r?\n/).filter(Boolean).map((line) => `file\t${line}`),
      ...statResult.stdout.trim().split(/\r?\n/).filter(Boolean).map((line) => `stat\t${line}`)
    ]
  };
}

async function workbenchBigFiles(root, limit) {
  const files = [];
  await walkFiles(root, async (path) => {
    const info = await stat(path);
    files.push({ path: relative(root, path).replaceAll('\\', '/'), bytes: info.size });
  });
  files.sort((left, right) => right.bytes - left.bytes || left.path.localeCompare(right.path));
  return { ok: true, task: 'bigfiles', bigFiles: files.slice(0, limit), limit };
}

async function workbenchRecent(root, limit) {
  const result = await runProcess('git', ['log', `-${limit}`, '--oneline', '--decorate'], { cwd: root });
  return { ok: result.status === 0, task: 'recent', lines: result.stdout.trim().split(/\r?\n/).filter(Boolean) };
}

async function workbenchProof(root) {
  const commands = [
    'node plugins/skillsforge/bin/skillsforge.mjs demo',
    'node plugins/skillsforge/bin/skillsforge.mjs validate --all',
    'node plugins/skillsforge/bin/skillsforge.mjs evidence --out artifacts/evidence',
    'node plugins/skillsforge/bin/skillsforge.mjs lib build',
    'node plugins/skillsforge/bin/skillsforge.mjs workflows list --json'
  ];
  return { ok: true, task: 'proof', commands };
}

async function listFiles(root, limit) {
  const files = [];
  await walkFiles(root, (path) => {
    if (files.length < limit) files.push(relative(root, path).replaceAll('\\', '/'));
  });
  return files;
}

async function walkFiles(root, onFile) {
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (SKIP.has(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) await onFile(path);
    }
  }
  await walk(resolve(root));
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function runProcess(command, args, options = {}) {
  return new Promise((resolveProcess) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      shell: false,
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), options.timeoutMs ?? 30000);
    child.stdout?.on('data', (chunk) => { stdout = (stdout + chunk.toString()).slice(-200000); });
    child.stderr?.on('data', (chunk) => { stderr = (stderr + chunk.toString()).slice(-200000); });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolveProcess({ status: 127, stdout, stderr: error.message });
    });
    child.on('close', (status) => {
      clearTimeout(timer);
      resolveProcess({ status: status ?? 1, stdout, stderr });
    });
  });
}

function clampLimit(value, fallback, max = 1000) {
  return Math.max(1, Math.min(max, Number(value) || fallback));
}
