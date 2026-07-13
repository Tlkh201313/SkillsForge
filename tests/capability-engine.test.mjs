import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeDependencies } from '../lib/capabilities/dependency-graph.mjs';
import { loadAllSkills, loadSkill } from '../lib/capabilities/skill-loader.mjs';
import { routeQuery } from '../lib/capabilities/router.mjs';
import { scanSkill } from '../lib/capabilities/policy.mjs';
import { forgeSkill } from '../lib/capabilities/forge.mjs';
import { enforcePolicy } from '../lib/capabilities/claude-policy-compiler.mjs';
import { verifySkillPaths } from '../lib/capabilities/verify.mjs';
import { runDoctor } from '../lib/capabilities/doctor.mjs';
import { runEvaluation } from '../scripts/eval.mjs';
import { main } from '../scripts/skillsforge-cli.mjs';
import { mkdir, mkdtemp, rm, writeFile, cp } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('loadAllSkills discovers plugin skills with sidecars', async () => {
  const skills = await loadAllSkills(process.cwd());
  assert.ok(skills.some((skill) => skill.name === 'using-skillsforge' && skill.sidecar));
  assert.ok(skills.some((skill) => skill.name === 'validate-agent-skill'));
});

test('dependency graph orders requires', () => {
  const result = analyzeDependencies([
    { name: 'app', requires: ['lib'] },
    { name: 'lib', requires: [] }
  ]);
  assert.deepEqual(result.order, ['lib', 'app']);
});

test('router prefers antiTrigger over false positive', () => {
  const skills = [
    {
      name: 'upgrade',
      description: 'Use when upgrading dependencies',
      maturity: 'stable',
      sidecar: {
        routing: { triggers: ['upgrade dependencies'], antiTriggers: ['security audit'] },
        capabilities: { exec: { allowed: false, commands: [] }, network: { allowed: false, hosts: [] }, write: { scope: 'skill' } }
      }
    },
    {
      name: 'audit',
      description: 'Use when auditing skills',
      maturity: 'stable',
      sidecar: {
        routing: { triggers: ['security audit'], antiTriggers: [] },
        capabilities: { exec: { allowed: false, commands: [] }, network: { allowed: false, hosts: [] }, write: { scope: 'none' } }
      }
    }
  ];
  const result = routeQuery('run a security audit of dependencies', skills);
  assert.equal(result.selected, 'audit');
});

test('policy flags undeclared exec content', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'sf-policy-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'SKILL.md'), '---\nname: x\ndescription: x\n---\n\nrun child_process.exec\n');
  await writeFile(join(root, 'skillsforge.json'), JSON.stringify({
    schemaVersion: 1,
    routing: { triggers: ['x'], antiTriggers: [] },
    capabilities: {
      exec: { allowed: false, commands: [] },
      network: { allowed: false, hosts: [] },
      write: { scope: 'skill' }
    }
  }));
  // bypass schema name equality by loading manually
  const skill = {
    name: 'x',
    directory: root,
    files: [join(root, 'SKILL.md'), join(root, 'skillsforge.json')],
    sidecar: JSON.parse(await (await import('node:fs/promises')).readFile(join(root, 'skillsforge.json'), 'utf8'))
  };
  const findings = await scanSkill(skill);
  assert.ok(findings.some((item) => item.rule === 'undeclared-exec-content' && item.blocking));
});

test('forge dry-run writes nothing', async (context) => {
  const outRoot = await mkdtemp(join(tmpdir(), 'sf-forge-'));
  context.after(() => rm(outRoot, { recursive: true, force: true }));
  const result = await forgeSkill({
    name: 'demo-skill',
    description: 'Use when demonstrating forge dry-run behavior.',
    overview: 'Dry run fixture.',
    whenToUse: ['Unit tests.'],
    routing: { triggers: ['forge dry run'], antiTriggers: [] },
    capabilities: {
      exec: { allowed: false, commands: [] },
      network: { allowed: false, hosts: [] },
      write: { scope: 'skill' }
    }
  }, { outRoot, dryRun: true });
  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  await assert.rejects(() => loadSkill(join(outRoot, 'demo-skill')));
});

test('enforce denies network tools when undeclared', () => {
  const decision = enforcePolicy(
    { tool_name: 'WebFetch', tool_input: { url: 'https://example.com' } },
    { capabilities: { exec: { allowed: false, commands: [] }, network: { allowed: false, hosts: [] }, write: { scope: 'none' } } }
  );
  assert.equal(decision.hookSpecificOutput.permissionDecision, 'deny');
});

test('CLI help exits 0', async () => {
  const code = await main(['help']);
  assert.equal(code, 0);
});

test('verifySkillPaths fails undeclared-exec with JSON finding fields', async () => {
  const result = await verifySkillPaths(['tests/fixtures/policy/undeclared-exec'], {
    root: process.cwd(),
    profile: 'canonical'
  });
  assert.equal(result.ok, false);
  assert.equal(result.structuralOk, true);
  const finding = result.findings.find((item) => item.rule.startsWith('undeclared-exec'));
  assert.ok(finding, result.findings.map((item) => item.rule).join(','));
  assert.equal(finding.blocking, true);
  assert.ok(finding.evidence.length > 0);
  assert.ok(finding.fix);
  assert.equal(finding.skill, 'undeclared-exec');
});

test('verifySkillPaths keeps sidecar-free portable skills structural-only', async () => {
  const result = await verifySkillPaths(['tests/fixtures/skills/good-basic'], {
    root: process.cwd(),
    profile: 'canonical'
  });
  assert.equal(result.ok, true);
  assert.equal(result.policyScanned, 0);
  assert.equal(result.findings.length, 0);
});

test('CLI validate undeclared-exec exits 1 with rule in JSON', () => {
  const result = spawnSync(
    process.execPath,
    [
      join(process.cwd(), 'scripts', 'skillsforge-cli.mjs'),
      'validate',
      'tests/fixtures/policy/undeclared-exec',
      '--json'
    ],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ok, false);
  const finding = output.findings.find((item) => item.rule.startsWith('undeclared-exec'));
  assert.ok(finding);
  assert.equal(finding.blocking, true);
  for (const key of ['rule', 'evidence', 'fix', 'blocking']) {
    assert.ok(key in finding, key);
  }
});

test('doctor fails when installed skill has blocking policy finding', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'sf-doctor-policy-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, '.claude-plugin'), { recursive: true });
  await writeFile(join(root, '.claude-plugin', 'plugin.json'), JSON.stringify({
    name: 'policy-doctor-fixture',
    version: '0.0.0'
  }));
  await mkdir(join(root, 'skills'), { recursive: true });
  await cp(
    join(process.cwd(), 'tests', 'fixtures', 'policy', 'undeclared-exec'),
    join(root, 'skills', 'undeclared-exec'),
    { recursive: true }
  );
  const result = await runDoctor(root);
  assert.equal(result.ok, false);
  const policy = result.checks.find((check) => check.name === 'capability policy');
  assert.equal(policy?.ok, false);
  assert.ok(result.findings.some((item) => item.rule.startsWith('undeclared-exec') && item.blocking));
});

test('production doctor still passes', async () => {
  const result = await runDoctor(process.cwd());
  assert.equal(result.ok, true, JSON.stringify(result.checks, null, 2));
  const policy = result.checks.find((check) => check.name === 'capability policy');
  assert.equal(policy?.ok, true);
});

test('CLI unknown command exits 2', async () => {
  const code = await main(['nope']);
  assert.equal(code, 2);
});

test('holdout evaluation meets thresholds', async () => {
  const report = await runEvaluation({ write: false });
  assert.ok(report.total >= 40);
  assert.equal(report.total, report.tp + report.fp + report.fn + report.tn);
  assert.ok(report.precision >= 0.9, `precision ${report.precision}`);
  assert.ok(report.recall >= 0.85, `recall ${report.recall}`);
});
