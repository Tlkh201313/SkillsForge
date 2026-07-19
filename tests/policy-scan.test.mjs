import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadSkill } from '../lib/capabilities/skill-loader.mjs';
import { POLICY_RULES, scanSkill } from '../lib/capabilities/policy.mjs';
import { verifySkillPaths } from '../lib/capabilities/verify.mjs';

const fixtureRoot = join(process.cwd(), 'tests', 'fixtures', 'policy');

function capabilities(overrides = {}) {
  return {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: 'skill' },
    ...overrides
  };
}

async function tempSkill(context, files, caps = capabilities()) {
  const directory = await mkdtemp(join(tmpdir(), 'skillsforge-policy-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const paths = [];
  for (const [name, content] of Object.entries(files)) {
    const path = join(directory, name);
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, content);
    paths.push(path);
  }
  return {
    name: 'policy-test',
    directory,
    files: paths,
    sidecar: { capabilities: caps },
    requires: []
  };
}

function assertBlocking(findings, rule) {
  const finding = findings.find((item) => item.rule === rule);
  assert.ok(finding, `expected ${rule}; got ${findings.map((item) => item.rule).join(', ')}`);
  assert.equal(finding.blocking, true);
  assert.equal(finding.blocked, true);
  assert.ok(finding.evidence.length > 0);
  assert.ok(finding.fix);
  assert.notEqual(finding.declared, undefined);
  assert.notEqual(finding.detected, undefined);
}

test('policy rules inventory is complete', () => {
  for (const rule of [
    'undeclared-exec-file',
    'undeclared-exec-content',
    'undeclared-network',
    'undeclared-host',
    'write-scope-escape',
    'symlink-escape',
    'oversized-unscanned-file'
  ]) {
    assert.ok(POLICY_RULES.includes(rule), rule);
  }
});

test('capability declaration key exec in sidecar is not process-execution content', async () => {
  const skill = await loadSkill(join(process.cwd(), 'plugins', 'skillsforge', 'skills', 'using-skillsforge'));
  const findings = await scanSkill(skill);
  assert.equal(
    findings.some((item) => item.rule === 'undeclared-exec-content'),
    false,
    findings.map((item) => `${item.rule}:${item.evidence.join(',')}`).join('; ')
  );
});

test('undeclared executable file and content block while declared fixture is safe', async () => {
  const unsafe = await scanSkill(await loadSkill(join(fixtureRoot, 'undeclared-exec')));
  assertBlocking(unsafe, 'undeclared-exec-file');
  assertBlocking(unsafe, 'undeclared-exec-content');

  const multi = await scanSkill(await loadSkill(join(fixtureRoot, 'multi-exec')));
  assertBlocking(multi, 'undeclared-exec-file');
  assert.ok(multi.some((item) => item.evidence.some((value) => value.endsWith('.mjs'))));
  assert.ok(multi.some((item) => item.evidence.some((value) => value.endsWith('.js'))));
  assert.ok(multi.some((item) => item.evidence.some((value) => value.endsWith('.ps1'))));
  assert.ok(multi.some((item) => item.evidence.some((value) => value.endsWith('.py'))));

  const safe = await scanSkill(await loadSkill(join(fixtureRoot, 'honest-exec')));
  assert.equal(safe.some((item) => item.rule.startsWith('undeclared-exec')), false);
});

test('undeclared network blocks while declared host is safe', async () => {
  const unsafe = await scanSkill(await loadSkill(join(fixtureRoot, 'undeclared-network')));
  assertBlocking(unsafe, 'undeclared-network');
  assert.ok(unsafe.some((item) => item.evidence.some((value) => String(value).includes('endpoints.json'))));
  assert.ok(unsafe.some((item) => item.evidence.some((value) => String(value).includes('fetch.py'))));

  const safe = await scanSkill(await loadSkill(join(fixtureRoot, 'safe-network')));
  assert.equal(safe.some((item) => item.rule === 'undeclared-network'), false);
  assert.equal(safe.some((item) => item.rule === 'undeclared-host'), false);
});

test('undeclared network host blocks while allowlisted host is safe', async () => {
  const unsafe = await scanSkill(await loadSkill(join(fixtureRoot, 'undeclared-host')));
  assertBlocking(unsafe, 'undeclared-host');
  assert.ok(unsafe.some((item) => item.detected?.host === 'evil.example.com'));

  const safe = await scanSkill(await loadSkill(join(fixtureRoot, 'safe-network')));
  assert.equal(safe.some((item) => item.rule === 'undeclared-host'), false);
});

test('write scope escape blocks while skill-relative write is safe', async () => {
  const unsafe = await scanSkill(await loadSkill(join(fixtureRoot, 'path-escape')));
  assertBlocking(unsafe, 'write-scope-escape');

  const safe = await scanSkill(await loadSkill(join(fixtureRoot, 'safe-write')));
  assert.equal(safe.some((item) => item.rule === 'write-scope-escape'), false);
});

test('Windows backslash path escape flags write-scope-escape', async (context) => {
  const skill = await tempSkill(context, {
    'SKILL.md': 'Write ..\\outside\\secret.txt then finish'
  });
  assertBlocking(await scanSkill(skill), 'write-scope-escape');
});

test('symlink escape blocks while internal symlink is safe', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'skillsforge-symlink-'));
  const outside = await mkdtemp(join(tmpdir(), 'skillsforge-outside-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  context.after(() => rm(outside, { recursive: true, force: true }));
  const outsideFile = join(outside, 'outside.txt');
  const insideFile = join(directory, 'inside.txt');
  const escapeLink = join(directory, 'escape.txt');
  const insideLink = join(directory, 'inside-link.txt');
  await writeFile(outsideFile, 'outside');
  await writeFile(insideFile, 'inside');

  let symlinkAvailable = true;
  try {
    await symlink(outsideFile, escapeLink, 'file');
    await symlink(insideFile, insideLink, 'file');
  } catch (error) {
    symlinkAvailable = false;
    context.diagnostic?.(`symlink creation unavailable: ${error.code ?? error.message}`);
  }

  // Path-safety coverage must still run even when symlink creation is forbidden.
  const pathSkill = await tempSkill(context, {
    'SKILL.md': 'Write /etc/passwd and ../../escape.txt'
  });
  assertBlocking(await scanSkill(pathSkill), 'write-scope-escape');

  if (!symlinkAvailable) {
    assert.ok(POLICY_RULES.includes('symlink-escape'));
    return;
  }

  const skill = {
    name: 'symlink-test',
    directory,
    files: [escapeLink, insideLink],
    sidecar: { capabilities: capabilities() },
    requires: []
  };
  assertBlocking(await scanSkill(skill), 'symlink-escape');
  skill.files = [insideLink];
  const safe = await scanSkill(skill);
  assert.equal(safe.some((item) => item.rule === 'symlink-escape'), false);
});

test('oversized text blocks while a small text file is scanned', async () => {
  const unsafe = await scanSkill(await loadSkill(join(fixtureRoot, 'oversized')));
  assertBlocking(unsafe, 'oversized-unscanned-file');

  const safe = await scanSkill(await loadSkill(join(fixtureRoot, 'safe-oversized')));
  assert.equal(safe.some((item) => item.rule === 'oversized-unscanned-file'), false);
});

test('binary files are recorded as unverified without blocking', async (context) => {
  const skill = await tempSkill(context, { 'asset.bin': Buffer.from([1, 2, 3]) });
  const findings = await scanSkill(skill);
  const unverified = findings.find((item) => item.rule === 'unverified-binary');
  assert.equal(unverified?.unverified, true);
  assert.equal(unverified?.blocking, false);
});

test('no blanket host exemptions; only declared allowlist hosts pass', async (context) => {
  const skill = await tempSkill(
    context,
    { 'SKILL.md': 'Fetch https://github.com/foo and https://api.anthropic.com/v1' },
    capabilities({ network: { allowed: true, hosts: ['api.example.com'] } })
  );
  const findings = await scanSkill(skill);
  const hosts = findings.filter((item) => item.rule === 'undeclared-host').map((item) => item.detected.host);
  assert.ok(hosts.includes('github.com'));
  assert.ok(hosts.includes('api.anthropic.com'));
});

test('verify orchestrator surfaces undeclared-exec as blocking findings', async () => {
  const result = await verifySkillPaths([join(fixtureRoot, 'undeclared-exec')], {
    root: process.cwd(),
    profile: 'canonical'
  });
  assert.equal(result.ok, false);
  assert.equal(result.structuralOk, true);
  assertBlocking(
    result.findings.map((item) => ({ ...item, blocked: item.blocking, declared: item.declared ?? null, detected: item.detected ?? null })),
    'undeclared-exec-file'
  );
  for (const key of ['rule', 'evidence', 'fix', 'blocking']) {
    assert.ok(key in result.findings[0], key);
  }
});
