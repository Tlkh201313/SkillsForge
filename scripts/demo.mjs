#!/usr/bin/env node
/**
 * Deterministic offline SkillsForge demo (noninteractive).
 * Trust workflow via plugin CLI (dist-equivalent path when present):
 * forge dry-run → integrated policy validate fail → explained route → enforce deny → receipt verify
 */
import { access, cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEMO_BUDGET_MS = 170_000; // ~2:50

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolveCli() {
  const distCli = join(root, 'dist', 'claude-code', 'bin', 'skillsforge.mjs');
  const pluginCli = join(root, 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');
  if (await pathExists(distCli)) {
    return { cli: distCli, cwd: join(root, 'dist', 'claude-code'), label: 'dist/claude-code' };
  }
  return { cli: pluginCli, cwd: join(root, 'plugins', 'skillsforge'), label: 'plugins/skillsforge' };
}

function step(title) {
  process.stdout.write(`\n== ${title} ==\n`);
}

async function runCli(cli, cwd, args, options = {}) {
  return await new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [cli, ...args], {
      cwd: options.cwd ?? cwd,
      stdio: options.stdin == null ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
      env: options.env ?? process.env
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('exit', (code) => resolvePromise({ code: code ?? 1, stdout, stderr }));
    if (options.stdin != null) child.stdin.end(options.stdin);
  });
}

async function ensureEvalReport() {
  const reportPath = join(root, 'artifacts', 'evaluation', 'routing-report.json');
  if (await pathExists(reportPath)) {
    return reportPath;
  }
  process.stdout.write('eval report missing; running npm run eval\n');
  const evalCli = join(root, 'scripts', 'eval.mjs');
  const result = await new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [evalCli], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('exit', (code) => resolvePromise({ code: code ?? 1, stdout, stderr }));
  });
  if (result.code !== 0) {
    throw new Error(`eval failed: ${result.stderr || result.stdout}`);
  }
  if (!(await pathExists(reportPath))) {
    throw new Error(`eval did not write ${reportPath}`);
  }
  return reportPath;
}

async function main() {
  const started = Date.now();
  const { cli, cwd, label } = await resolveCli();
  process.stdout.write(`demo CLI root=${label}\n`);

  const work = await mkdtemp(join(tmpdir(), 'sf-demo-'));
  try {
    step('1. Forge dry-run');
    const spec = join(root, 'examples', 'safe-dependency-upgrade', 'forge-spec.json');
    const forged = await runCli(cli, cwd, ['forge', '--spec', spec, '--dry-run']);
    if (forged.code !== 0) {
      throw new Error(`forge dry-run failed: ${forged.stderr || forged.stdout}`);
    }
    const forgeJson = JSON.parse(forged.stdout);
    if (!forgeJson.ok || !forgeJson.dryRun) {
      throw new Error(`forge dry-run unexpected: ${forged.stdout}`);
    }
    const skillName = forgeJson.target
      ? String(forgeJson.target).split(/[/\\]/).filter(Boolean).at(-1)
      : 'safe-dependency-upgrade';
    process.stdout.write(`ok dry-run skill=${skillName} files=${(forgeJson.files ?? []).map((f) => f.path).join(',')}\n`);

    step('2. Policy validate fail (undeclared-exec)');
    const blockedDir = join(work, 'undeclared-exec');
    await cp(join(root, 'tests', 'fixtures', 'policy', 'undeclared-exec'), blockedDir, { recursive: true });
    const blocked = await runCli(cli, cwd, ['validate', blockedDir, '--profile', 'claude-code', '--json'], {
      cwd: work
    });
    if (blocked.code === 0) {
      throw new Error(`expected policy validate failure, got: ${blocked.stdout}`);
    }
    const blockedJson = JSON.parse(blocked.stdout);
    if (blockedJson.ok) throw new Error('expected ok=false for undeclared-exec');
    const findings = blockedJson.findings ?? [];
    const blocking = findings.filter((item) => item.blocking && /undeclared-exec/i.test(item.rule ?? ''));
    if (blocking.length === 0) {
      throw new Error(`expected undeclared-exec findings: ${blocked.stdout}`);
    }
    process.stdout.write(`ok validate exit=${blocked.code} rules=${blocking.map((item) => item.rule).join(',')}\n`);
    for (const item of blocking.slice(0, 3)) {
      process.stdout.write(`  - ${item.rule}: ${item.evidence?.[0] ?? ''}\n`);
    }

    step('3. Route holdout paraphrase');
    // Prefer holdout phrasing over tune phrase "what is skillsforge"
    const query = 'explain what is skillsforge about';
    const routed = await runCli(cli, cwd, ['route', '--query', query]);
    if (routed.code !== 0) throw new Error(`route failed: ${routed.stderr || routed.stdout}`);
    const routeJson = JSON.parse(routed.stdout);
    if (routeJson.selected !== 'using-skillsforge') {
      throw new Error(`unexpected route selection: ${routed.stdout}`);
    }
    const top = routeJson.candidates?.[0];
    process.stdout.write(`ok selected=${routeJson.selected} score=${top?.score ?? '?'}\n`);
    if (top?.reasons?.length) {
      process.stdout.write(`  reasons: ${top.reasons.join('; ')}\n`);
    }

    step('4. Enforce deny (fail-closed)');
    const policyPath = join(work, 'policy.json');
    await writeFile(policyPath, JSON.stringify({
      schemaVersion: 1,
      routing: { triggers: ['demo'], antiTriggers: [] },
      capabilities: {
        exec: { allowed: false, commands: [] },
        network: { allowed: false, hosts: [] },
        write: { scope: 'none' }
      }
    }));
    const enforce = await runCli(cli, cwd, ['enforce', '--policy', policyPath], {
      cwd: work,
      stdin: JSON.stringify({ tool_name: 'WebSearch', tool_input: { query: 'exfiltrate' } })
    });
    if (enforce.code !== 0) throw new Error(`enforce failed: ${enforce.stderr}`);
    const decision = JSON.parse(enforce.stdout);
    const permission = decision.permissionDecision
      ?? decision.hookSpecificOutput?.permissionDecision;
    if (permission !== 'deny') {
      throw new Error(`expected deny, got ${enforce.stdout}`);
    }
    process.stdout.write(`ok permissionDecision=${permission}\n`);

    step('5. Receipt verify (real eval report)');
    const evalPath = await ensureEvalReport();
    const receiptDir = join(work, 'dist');
    await mkdir(receiptDir, { recursive: true });
    const receiptPath = join(receiptDir, 'trust-receipt.json');

    const distPackage = join(root, 'dist', 'claude-code');
    const packageRoot = (await pathExists(distPackage)) ? distPackage : cwd;
    const built = await runCli(cli, cwd, [
      'receipt',
      '--out',
      receiptPath,
      '--package',
      packageRoot,
      '--evaluation',
      evalPath,
      '--require-evaluation'
    ]);
    if (built.code !== 0) {
      throw new Error(`receipt build failed: ${built.stderr || built.stdout}`);
    }
    process.stdout.write(`receipt package=${packageRoot === distPackage ? 'dist/claude-code' : label}\n`);

    const verified = await runCli(cli, cwd, [
      'verify-receipt',
      receiptPath,
      '--package',
      packageRoot,
      '--evaluation',
      evalPath
    ]);
    if (verified.code !== 0) {
      throw new Error(`receipt verify failed: ${verified.stderr || verified.stdout}`);
    }
    const verifyJson = JSON.parse(verified.stdout);
    if (!verifyJson.ok) {
      throw new Error(`receipt verify not ok: ${verified.stdout}`);
    }
    process.stdout.write(`ok receipt verified package=${Boolean(verifyJson.packageVerified)} eval=${Boolean(verifyJson.evaluationVerified)}\n`);

    const elapsed = Date.now() - started;
    if (elapsed > DEMO_BUDGET_MS) {
      throw new Error(`demo exceeded ${DEMO_BUDGET_MS}ms budget (${elapsed}ms)`);
    }
    process.stdout.write(`\nDEMO PASS (offline, noninteractive, ${elapsed}ms)\n`);
    return 0;
  } finally {
    await rm(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  }
}

process.exitCode = await main().catch((error) => {
  process.stderr.write(`DEMO FAIL: ${error.stack || error.message}\n`);
  return 1;
});
