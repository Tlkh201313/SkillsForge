import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
export const SLIM_GAIN_REL = join('artifacts', 'skillsforge-slim-gain.json');

export async function runSlim(root, task, options = {}) {
  switch (task) {
    case 'status':
      return slimStatus(root, options);
    case 'diff':
      return slimDiff(root, options);
    case 'log':
      return slimLog(root, options);
    case 'test':
      return slimTest(root, options);
    case 'run':
      return slimRun(root, options);
    case 'rg':
      return slimRg(root, options);
    case 'gain':
      return slimGain(root, options);
    default:
      return { ok: false, task, error: `unknown slim task: ${task}` };
  }
}

export function formatSlimText(payload) {
  if (!payload.ok && payload.error) return `${payload.error}\n`;
  if (payload.task === 'gain') {
    const lines = [
      `commands\t${payload.commands ?? 0}`,
      `rawBytes\t${payload.rawBytes ?? 0}`,
      `slimBytes\t${payload.slimBytes ?? 0}`,
      `rawTokensEst\t${payload.rawTokensEst ?? 0}`,
      `slimTokensEst\t${payload.slimTokensEst ?? 0}`,
      `savedTokensEst\t${payload.savedTokensEst ?? 0}`,
      `savedRatio\t${payload.savedRatio ?? 0}`
    ];
    return `${lines.join('\n')}\n`;
  }
  if (payload.lines) return `${payload.lines.join('\n')}${payload.lines.length ? '\n' : ''}`;
  if (payload.text != null) return `${payload.text}${payload.text.endsWith('\n') ? '' : '\n'}`;
  return `${JSON.stringify(payload, null, 2)}\n`;
}

async function slimStatus(root, options = {}) {
  const raw = await runProcess('git', ['status', '--short', '--branch'], { cwd: root });
  const rawText = raw.stdout;
  const lines = rawText.trim().split(/\r?\n/).filter(Boolean);
  const branch = lines[0]?.replace(/^##\s*/, '') ?? 'unknown';
  const files = lines.slice(1).map((line) => line.replace(/^..\s+/, '').trim()).filter(Boolean);
  const limited = files.slice(0, options.limit ?? 80);
  // Compact: one branch line + bare paths (drop status codes / chatter)
  const compact = [`# ${branch} (${files.length})`, ...limited].join('\n') + (limited.length ? '\n' : '\n');
  await recordGain(root, { command: 'slim status', rawText, slimText: compact });
  return {
    ok: raw.status === 0,
    task: 'status',
    branch,
    dirty: files.length > 0,
    files: limited,
    lines: compact.trim().split('\n'),
    text: compact
  };
}

async function slimDiff(root, options = {}) {
  const [names, shortstat, full] = await Promise.all([
    runProcess('git', ['diff', '--name-only'], { cwd: root }),
    runProcess('git', ['diff', '--shortstat'], { cwd: root }),
    options.stat === true
      ? runProcess('git', ['diff', '--stat'], { cwd: root })
      : Promise.resolve({ status: 0, stdout: '', stderr: '' })
  ]);
  const files = names.stdout.trim().split(/\r?\n/).filter(Boolean);
  const limited = files.slice(0, options.limit ?? 80);
  const lines = [
    `# ${files.length} files`,
    shortstat.stdout.trim() || '(clean)',
    ...limited,
    ...(options.stat === true
      ? full.stdout.trim().split(/\r?\n/).filter(Boolean).slice(0, options.limit ?? 40)
      : [])
  ];
  const slimText = `${lines.join('\n')}\n`;
  // Compare against fuller porcelain when available
  const rawText = options.stat === true
    ? full.stdout || names.stdout
    : [names.stdout, shortstat.stdout].join('\n');
  await recordGain(root, { command: 'slim diff', rawText, slimText });
  return {
    ok: names.status === 0 && shortstat.status === 0,
    task: 'diff',
    files: limited,
    lines,
    text: slimText
  };
}

async function slimLog(root, options = {}) {
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 15));
  const raw = await runProcess('git', ['log', `-${limit}`, '--oneline', '--decorate'], { cwd: root });
  const lines = raw.stdout.trim().split(/\r?\n/).filter(Boolean);
  const slimText = `${lines.join('\n')}${lines.length ? '\n' : ''}`;
  await recordGain(root, { command: 'slim log', rawText: raw.stdout, slimText });
  return { ok: raw.status === 0, task: 'log', lines, text: slimText, limit };
}

async function slimTest(root, options = {}) {
  const argv = options.argv?.length ? options.argv : ['npm', 'test'];
  return slimRun(root, {
    ...options,
    argv,
    keepFail: true,
    dropPassNoise: true,
    label: 'slim test'
  });
}

async function slimRun(root, options = {}) {
  const argv = options.argv ?? [];
  if (!argv.length) return { ok: false, task: 'run', error: 'slim run requires -- <cmd> [args...]' };
  const [command, ...args] = argv;
  const raw = await runProcess(command, args, {
    cwd: root,
    timeoutMs: options.timeoutMs ?? 120000,
    shell: options.shell === true
  });
  const rawText = `${raw.stdout}${raw.stderr ? `\n${raw.stderr}` : ''}`;
  const slimText = compressCommandOutput(rawText, {
    maxLines: options.limit ?? 80,
    keepFail: options.keepFail === true || options.dropPassNoise === true,
    dropPassNoise: options.dropPassNoise === true
  });
  await recordGain(root, { command: options.label ?? `slim run ${command}`, rawText, slimText });
  return {
    ok: raw.status === 0,
    task: options.label?.startsWith('slim test') ? 'test' : 'run',
    status: raw.status,
    command: argv.join(' '),
    lines: slimText.trim().split(/\r?\n/).filter(Boolean),
    text: slimText,
    truncated: rawText.length > slimText.length
  };
}

async function slimRg(root, options = {}) {
  const argv = options.argv ?? [];
  if (!argv.length) return { ok: false, task: 'rg', error: 'slim rg requires -- <rg args...>' };
  const raw = await runProcess('rg', argv, { cwd: root, timeoutMs: 20000 });
  if (raw.status > 1) {
    return { ok: false, task: 'rg', error: raw.stderr || raw.stdout || 'rg failed', status: raw.status };
  }
  const limit = Math.max(1, Math.min(500, Number(options.limit) || 60));
  const allLines = raw.stdout.split(/\r?\n/).filter(Boolean);
  const byFile = new Map();
  for (const line of allLines) {
    const file = line.split(':')[0] ?? 'unknown';
    const list = byFile.get(file) ?? [];
    if (list.length < 5) list.push(line.slice(0, 240));
    byFile.set(file, list);
  }
  const lines = [];
  for (const [file, matches] of [...byFile.entries()].slice(0, limit)) {
    lines.push(`file\t${file}\t${matches.length}+`);
    for (const match of matches.slice(0, 3)) lines.push(`hit\t${match}`);
  }
  const slimText = `${lines.join('\n')}${lines.length ? '\n' : ''}`;
  await recordGain(root, { command: 'slim rg', rawText: raw.stdout, slimText });
  return {
    ok: true,
    task: 'rg',
    files: byFile.size,
    matches: allLines.length,
    lines,
    text: slimText,
    truncated: allLines.length > lines.length
  };
}

async function slimGain(root, options = {}) {
  if (options.reset === true) {
    const cleared = emptyGain();
    await writeGain(root, cleared);
    return { ok: true, task: 'gain', reset: true, ...summarizeGain(cleared) };
  }
  const ledger = await readGain(root);
  return { ok: true, task: 'gain', ...summarizeGain(ledger) };
}

export function compressCommandOutput(text, options = {}) {
  const maxLines = options.maxLines ?? 80;
  const source = String(text ?? '');
  if (!source) return '';
  let lines = source.split(/\r?\n/);
  // Drop trailing empty line from split so we do not invent content
  if (lines.length && lines[lines.length - 1] === '') lines = lines.slice(0, -1);
  if (options.dropPassNoise) {
    lines = lines.filter((line) => {
      if (/^\s*✔|^\s*✓|^\s*PASS\b|passing\b/i.test(line) && !/fail|error|✖|✗/i.test(line)) {
        return false;
      }
      return true;
    });
  }
  if (options.keepFail) {
    const fails = lines.filter((line) => /fail|error|✖|✗|AssertionError|not ok/i.test(line));
    if (fails.length) {
      const head = lines.slice(0, 20);
      const tail = lines.slice(-Math.max(20, maxLines - head.length));
      const merged = [...head, ...fails.slice(0, 40), ...tail];
      lines = [...new Set(merged)];
    }
  }
  if (lines.length <= maxLines) return lines.length ? `${lines.join('\n')}\n` : '';
  const headCount = Math.floor(maxLines * 0.6);
  const tailCount = maxLines - headCount - 1;
  const head = lines.slice(0, headCount);
  const tail = lines.slice(-tailCount);
  return `${head.join('\n')}\n... truncated ${lines.length - maxLines} lines ...\n${tail.join('\n')}\n`;
}

function summarizeGain(ledger) {
  const rawBytes = ledger.rawBytes ?? 0;
  const slimBytes = ledger.slimBytes ?? 0;
  const rawTokensEst = Math.ceil(rawBytes / 4);
  const slimTokensEst = Math.ceil(slimBytes / 4);
  const savedTokensEst = Math.max(0, rawTokensEst - slimTokensEst);
  const savedRatio = rawTokensEst === 0 ? 0 : Number((savedTokensEst / rawTokensEst).toFixed(3));
  return {
    commands: ledger.commands ?? 0,
    rawBytes,
    slimBytes,
    rawTokensEst,
    slimTokensEst,
    savedTokensEst,
    savedRatio,
    method: 'approx-chars/4',
    note: 'Estimated savings from ForgeSlim filters - not provider billing.'
  };
}

async function recordGain(root, { command, rawText, slimText }) {
  const ledger = await readGain(root);
  const rawBytes = Buffer.byteLength(String(rawText ?? ''), 'utf8');
  const slimBytes = Buffer.byteLength(String(slimText ?? ''), 'utf8');
  ledger.commands = (ledger.commands ?? 0) + 1;
  ledger.rawBytes = (ledger.rawBytes ?? 0) + rawBytes;
  ledger.slimBytes = (ledger.slimBytes ?? 0) + slimBytes;
  ledger.updatedAt = new Date().toISOString();
  ledger.events = [
    ...(ledger.events ?? []),
    {
      at: ledger.updatedAt,
      command,
      rawBytes,
      slimBytes,
      savedBytes: Math.max(0, rawBytes - slimBytes)
    }
  ].slice(-200);
  await writeGain(root, ledger);
  return ledger;
}

function emptyGain() {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    commands: 0,
    rawBytes: 0,
    slimBytes: 0,
    events: []
  };
}

async function readGain(root) {
  try {
    return JSON.parse(await readFile(join(root, SLIM_GAIN_REL), 'utf8'));
  } catch {
    return emptyGain();
  }
}

async function writeGain(root, ledger) {
  await mkdir(join(root, 'artifacts'), { recursive: true });
  await writeFile(join(root, SLIM_GAIN_REL), `${JSON.stringify(ledger, null, 2)}\n`);
}

function runProcess(command, args, options = {}) {
  return new Promise((resolveProcess) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      shell: options.shell === true,
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), options.timeoutMs ?? 30000);
    child.stdout?.on('data', (chunk) => { stdout = (stdout + chunk.toString()).slice(-400000); });
    child.stderr?.on('data', (chunk) => { stderr = (stderr + chunk.toString()).slice(-400000); });
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
