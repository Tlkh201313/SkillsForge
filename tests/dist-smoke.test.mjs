import assert from 'node:assert/strict';
import test from 'node:test';
import { access, cp, mkdtemp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

async function runNode(args, options = {}) {
  return await new Promise((resolvePromise) => {
    const child = spawn(process.execPath, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: options.stdin == null ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('exit', (code) => resolvePromise({ code: code ?? 1, stdout, stderr }));
    if (options.stdin != null) {
      child.stdin.end(options.stdin);
    }
  });
}

async function cachePluginOnly(context) {
  await access(join(repoRoot, 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs'));
  const cache = await mkdtemp(join(tmpdir(), 'sf-cache-'));
  context.after(() => rm(cache, { recursive: true, force: true }));
  const pluginRoot = join(cache, 'skillsforge');
  await cp(join(repoRoot, 'plugins', 'skillsforge'), pluginRoot, { recursive: true });
  return { cache, pluginRoot, cli: join(pluginRoot, 'bin', 'skillsforge.mjs') };
}

async function assertSidecarSkillsHavePreToolUse(pluginRoot) {
  const skillsRoot = join(pluginRoot, 'skills');
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await access(join(skillsRoot, entry.name, 'skillsforge.json'));
    } catch {
      continue;
    }
    count += 1;
    const source = await readFile(join(skillsRoot, entry.name, 'SKILL.md'), 'utf8');
    assert.match(source, /\bPreToolUse\b/, `${entry.name} missing PreToolUse`);
    assert.match(source, new RegExp(`skills/${entry.name}/skillsforge\\.json`));
  }
  assert.ok(count >= 1, 'expected at least one sidecar skill');
}

test('cached plugin CLI works without repository root modules', async (context) => {
  const { cache, pluginRoot, cli } = await cachePluginOnly(context);

  await assertSidecarSkillsHavePreToolUse(pluginRoot);

  const session = await runNode([join(pluginRoot, 'hooks', 'session-start.mjs')], { cwd: cache });
  assert.equal(session.code, 0, session.stderr);
  assert.match(session.stdout, /SkillsForge active/);
  assert.ok(session.stdout.length < 180, `session-start output too long: ${session.stdout.length}`);
  assert.doesNotMatch(session.stdout, /Token budget|Phases|Quick Reference/);

  const doctor = await runNode([cli, 'doctor', '--json'], { cwd: pluginRoot });
  assert.equal(doctor.code, 0, doctor.stderr || doctor.stdout);
  const doctorJson = JSON.parse(doctor.stdout);
  assert.equal(doctorJson.ok, true);

  const fixtureRoot = join(cache, 'good-with-sidecar');
  await cp(join(repoRoot, 'tests', 'fixtures', 'skills', 'good-with-sidecar'), fixtureRoot, { recursive: true });
  const validate = await runNode([cli, 'validate', fixtureRoot], { cwd: cache });
  assert.equal(validate.code, 0, validate.stderr || validate.stdout);
  assert.match(validate.stdout, /PASS/);

  const route = await runNode([cli, 'route', '--query', 'what is skillsforge'], { cwd: pluginRoot });
  assert.equal(route.code, 0, route.stderr || route.stdout);
  assert.match(route.stdout, /using-skillsforge/);

  const specPath = join(cache, 'forge-spec.json');
  await cp(join(repoRoot, 'tests', 'fixtures', 'forge', 'safe-upgrade.spec.json'), specPath);
  const forge = await runNode([cli, 'forge', '--spec', specPath, '--dry-run'], { cwd: pluginRoot });
  assert.equal(forge.code, 0, forge.stderr || forge.stdout);
  assert.match(forge.stdout, /"dryRun"\s*:\s*true/);

  const receipt = await runNode([cli, 'receipt', '--out', join(cache, 'trust-receipt.json')], { cwd: pluginRoot });
  assert.equal(receipt.code, 0, receipt.stderr || receipt.stdout);
  const verify = await runNode([cli, 'verify-receipt', join(cache, 'trust-receipt.json'), '--package-only'], { cwd: pluginRoot });
  assert.equal(verify.code, 0, verify.stderr || verify.stdout);
  assert.match(verify.stdout, /"ok"\s*:\s*true/);
  assert.match(verify.stdout, /package-only|unverified/i);

  const policy = {
    schemaVersion: 1,
    routing: { triggers: ['x'], antiTriggers: [] },
    capabilities: { exec: { allowed: false, commands: [] }, network: { allowed: false, hosts: [] }, write: { scope: 'none' } }
  };
  const policyPath = join(cache, 'policy.json');
  await writeFile(policyPath, JSON.stringify(policy));
  const enforce = await runNode([cli, 'enforce', '--policy', policyPath], {
    cwd: cache,
    stdin: JSON.stringify({ tool_name: 'WebSearch', tool_input: { query: 'x' } })
  });
  assert.equal(enforce.code, 0, enforce.stderr || enforce.stdout);
  assert.match(enforce.stdout, /"permissionDecision"\s*:\s*"deny"/);
});

test('cache-copy does not require repository lib or scripts modules', async (context) => {
  const { cache, pluginRoot, cli } = await cachePluginOnly(context);
  // Prove the cached tree is plugin-only: no repo-level lib/scripts adjacent to the plugin copy.
  await assert.rejects(() => access(join(cache, 'lib')));
  await assert.rejects(() => access(join(cache, 'scripts')));
  await assert.rejects(() => access(join(pluginRoot, '..', '..', 'lib', 'capabilities')));

  const doctor = await runNode([cli, 'doctor', '--json'], { cwd: pluginRoot });
  assert.equal(doctor.code, 0, doctor.stderr || doctor.stdout);

  await mkdir(join(cache, 'scratch'), { recursive: true });
  const fixture = join(cache, 'scratch', 'good-basic');
  await cp(join(repoRoot, 'tests', 'fixtures', 'skills', 'good-basic'), fixture, { recursive: true });
  const validate = await runNode([cli, 'validate', fixture, '--json'], { cwd: cache });
  assert.equal(validate.code, 0, validate.stderr || validate.stdout);
  const report = JSON.parse(validate.stdout);
  assert.equal(report.ok, true);
});

test('dist/claude-code sidecar skills ship committed PreToolUse hooks', async () => {
  const distPlugin = join(repoRoot, 'dist', 'claude-code');
  const distCodex = join(repoRoot, 'dist', 'codex');
  // Rebuild so dist CLI matches source (doctor must use claude-code profile).
  const build = await runNode([join(repoRoot, 'scripts', 'build-dist.mjs')], { cwd: repoRoot });
  assert.equal(build.code, 0, build.stderr || build.stdout);
  await access(distPlugin);
  await access(distCodex);
  await access(join(repoRoot, 'dist', 'codex-interop.json'));

  const skillsRoot = join(distCodex, 'skills');
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  let openaiCount = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await access(join(skillsRoot, entry.name, 'SKILL.md'));
    } catch {
      continue;
    }
    await access(join(skillsRoot, entry.name, 'agents', 'openai.yaml'));
    openaiCount += 1;
  }
  assert.ok(openaiCount >= 1, 'dist/codex skills must include agents/openai.yaml');

  const commandNames = ['validate', 'route', 'forge', 'doctor', 'verify-receipt'];
  for (const name of commandNames) {
    await access(join(distPlugin, 'commands', `${name}.md`));
  }

  await assertSidecarSkillsHavePreToolUse(distPlugin);

  const cli = join(distPlugin, 'bin', 'skillsforge.mjs');
  const doctor = await runNode([cli, 'doctor', '--json'], { cwd: distPlugin });
  assert.equal(doctor.code, 0, doctor.stderr || doctor.stdout);
  assert.equal(JSON.parse(doctor.stdout).ok, true);

  const receiptPath = join(repoRoot, 'dist', 'trust-receipt.json');
  const evalPath = join(repoRoot, 'artifacts', 'evaluation', 'routing-report.json');
  const verify = await runNode([
    cli,
    'verify-receipt',
    receiptPath,
    '--package',
    distPlugin,
    '--evaluation',
    evalPath
  ], { cwd: distPlugin });
  assert.equal(verify.code, 0, verify.stderr || verify.stdout);
  const verifyJson = JSON.parse(verify.stdout);
  assert.equal(verifyJson.ok, true);
  assert.equal(verifyJson.packageVerified, true);
  assert.equal(verifyJson.evaluationVerified, true);
});
