#!/usr/bin/env node
/**
 * Deterministic offline SkillsForge demo (noninteractive).
 * Flow: forge dry-run → policy block → route → enforce deny → receipt verify
 */
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { forgeSkill } from '../lib/capabilities/forge.mjs';
import { scanSkill } from '../lib/capabilities/policy.mjs';
import { loadAllSkills, loadSkill } from '../lib/capabilities/skill-loader.mjs';
import { routeQuery } from '../lib/capabilities/router.mjs';
import { enforcePolicy } from '../lib/capabilities/claude-policy-compiler.mjs';
import { buildReceipt, verifyReceipt } from '../lib/capabilities/receipt.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');

function step(title) {
  process.stdout.write(`\n== ${title} ==\n`);
}

async function runCli(args, options = {}) {
  return await new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [cli, ...args], {
      cwd: options.cwd ?? root,
      stdio: options.stdin == null ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('exit', (code) => resolvePromise({ code: code ?? 1, stdout, stderr }));
    if (options.stdin != null) child.stdin.end(options.stdin);
  });
}

async function main() {
  const work = await mkdtemp(join(tmpdir(), 'sf-demo-'));
  try {
    step('1. Forge dry-run');
    const spec = JSON.parse(await readFile(join(root, 'examples', 'safe-dependency-upgrade', 'forge-spec.json'), 'utf8'));
    const forged = await forgeSkill(spec, { dryRun: true, write: false, outRoot: join(work, 'skills') });
    if (!forged.ok || !forged.dryRun) {
      throw new Error(`forge dry-run failed: ${JSON.stringify(forged)}`);
    }
    process.stdout.write(`ok dry-run skill=${spec.name} files=${forged.files.map((f) => f.path).join(',')}\n`);

    step('2. Policy block (undeclared exec fixture)');
    const blockedDir = join(work, 'undeclared-exec');
    await cp(join(root, 'tests', 'fixtures', 'policy', 'undeclared-exec'), blockedDir, { recursive: true });
    const blockedSkill = await loadSkill(blockedDir);
    const findings = await scanSkill(blockedSkill);
    const blocking = findings.filter((item) => item.blocking);
    if (blocking.length === 0) throw new Error('expected blocking policy findings');
    process.stdout.write(`ok blocked rules=${blocking.map((item) => item.rule).join(',')}\n`);
    for (const item of blocking.slice(0, 3)) {
      process.stdout.write(`  - ${item.rule}: ${item.evidence?.[0] ?? ''}\n`);
    }

    step('3. Route held-out paraphrase');
    const skills = await loadAllSkills(root);
    const routed = routeQuery('what is skillsforge', skills);
    if (routed.selected !== 'using-skillsforge') {
      throw new Error(`unexpected route selection: ${JSON.stringify(routed)}`);
    }
    const top = routed.candidates[0];
    process.stdout.write(`ok selected=${routed.selected} score=${top.score}\n`);
    process.stdout.write(`  reasons: ${top.reasons.join('; ')}\n`);

    step('4. Enforce deny (network without allow)');
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
    const enforce = await runCli(['enforce', '--policy', policyPath], {
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
    // Also assert library path matches CLI
    const libDecision = enforcePolicy(
      { tool_name: 'WebSearch', tool_input: { query: 'exfiltrate' } },
      { ...JSON.parse(await readFile(policyPath, 'utf8')), __skillRoot: work }
    );
    const libPermission = libDecision?.permissionDecision
      ?? libDecision?.hookSpecificOutput?.permissionDecision;
    if (libPermission !== 'deny') {
      throw new Error('library enforcePolicy did not deny');
    }
    process.stdout.write(`ok permissionDecision=${permission}\n`);

    step('5. Receipt verify');
    await mkdir(join(work, 'dist'), { recursive: true });
    const receiptPath = join(work, 'dist', 'trust-receipt.json');
    const receipt = await buildReceipt(skills, {
      evaluation: {
        corpusSha256: 'demo-offline-placeholder',
        reportSha256: 'demo-offline-report-placeholder',
        total: 0,
        tp: 0,
        fp: 0,
        fn: 0,
        tn: 0
      }
    });
    if (!receipt.ok) throw new Error(`receipt build failed: ${JSON.stringify(receipt.errors)}`);
    await writeFile(receiptPath, receipt.text);
    const verified = await verifyReceipt(receiptPath, skills, { packageOnly: true });
    if (!verified.ok) throw new Error(`receipt verify failed: ${JSON.stringify(verified)}`);
    process.stdout.write(`ok receiptHash=${verified.receiptHash}\n`);

    process.stdout.write('\nDEMO PASS (offline, noninteractive)\n');
    return 0;
  } finally {
    await rm(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  }
}

process.exitCode = await main().catch((error) => {
  process.stderr.write(`DEMO FAIL: ${error.stack || error.message}\n`);
  return 1;
});
