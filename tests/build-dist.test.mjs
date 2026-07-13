import assert from 'node:assert/strict';
import { access, cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadAllSkills } from '../lib/capabilities/skill-loader.mjs';
import { buildCursorLossiness, runBuildDist } from '../scripts/build-dist.mjs';

async function fixtureRepo(context) {
  const root = await mkdtemp(join(tmpdir(), 'sf-build-dist-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'plugins'), { recursive: true });
  await cp(join(process.cwd(), 'plugins', 'skillsforge'), join(root, 'plugins', 'skillsforge'), { recursive: true });
  await mkdir(join(root, 'evaluation'), { recursive: true });
  await writeFile(join(root, 'evaluation', 'routing-holdout.json'), JSON.stringify({
    frozen: '2026-07-13',
    cases: [
      { query: 'what is skillsforge', expected: 'using-skillsforge' },
      { query: 'unrelated weather forecast tonight', expected: null }
    ]
  }));
  return root;
}

function okEval(overrides = {}) {
  return {
    precision: 1,
    recall: 1,
    corpusSha256: 'abc123',
    total: 2,
    tp: 1,
    fp: 0,
    fn: 0,
    tn: 1,
    ...overrides
  };
}

test('buildCursorLossiness never treats sidecar routing as full Cursor support', () => {
  const lossy = buildCursorLossiness({
    name: 'with-sidecar',
    requires: [],
    sidecar: { routing: { triggers: ['x'] } }
  });
  assert.equal(lossy.effectiveCursorCompatibility, 'partial');
  assert.ok(lossy.fields.some((field) => field.field === 'routing.triggers' && field.status === 'unsupported'));
});

test('runBuildDist rejects cursor full claims when packaging is lossy', async (context) => {
  const root = await fixtureRepo(context);
  const sidecarPath = join(root, 'plugins', 'skillsforge', 'skills', 'using-skillsforge', 'skillsforge.json');
  const sidecar = JSON.parse(await readFile(sidecarPath, 'utf8'));
  sidecar.compatibility.cursor = 'full';
  await writeFile(sidecarPath, `${JSON.stringify(sidecar, null, 2)}\n`);

  const skills = await loadAllSkills(root);
  const result = await runBuildDist({
    root,
    skills,
    evaluation: okEval({ corpusSha256: 'deadbeef' }),
    validation: { ok: true, text: 'PASS\n' },
    hostValidation: { status: 'skipped', reason: 'test' }
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /cursor compatibility claims full/);
});

test('runBuildDist fails when holdout evaluation is missing', async (context) => {
  const root = await fixtureRepo(context);
  const skills = await loadAllSkills(root);
  const result = await runBuildDist({
    root,
    skills,
    evaluation: { precision: 1, recall: 1, total: 1 },
    validation: { ok: true, text: 'PASS\n' },
    hostValidation: { status: 'skipped', reason: 'test' }
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /corpusSha256|evaluation/i);
});

test('runBuildDist fails on validation errors', async (context) => {
  const root = await fixtureRepo(context);
  const skills = await loadAllSkills(root);
  const result = await runBuildDist({
    root,
    skills,
    evaluation: okEval({ corpusSha256: 'abc', total: 1, tn: 0 }),
    validation: { ok: false, text: 'FAIL bad-skill\n' },
    hostValidation: { status: 'skipped', reason: 'test' }
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /validation failed/i);
});

test('runBuildDist writes receipt without timestamps when gates pass', async (context) => {
  const root = await fixtureRepo(context);
  const skills = await loadAllSkills(root);
  const result = await runBuildDist({
    root,
    skills,
    evaluation: okEval({ durationMs: 1234 }),
    validation: { ok: true, text: 'PASS\n' },
    hostValidation: { status: 'skipped', reason: 'test' }
  });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  const receipt = JSON.parse(await readFile(join(root, 'dist', 'trust-receipt.json'), 'utf8'));
  assert.equal(receipt.evaluation.corpusSha256, 'abc123');
  assert.equal(receipt.evaluation.durationMs, undefined);
  assert.ok(!/"durationMs"|"timestamp"|"createdAt"/i.test(JSON.stringify(receipt)));
  assert.ok(receipt.skills.length >= 1);
  assert.ok(receipt.scanner.rules.includes('undeclared-exec-file'));
});

test('runBuildDist keeps dist SKILL.md byte-equal to source with PreToolUse', async (context) => {
  const root = await fixtureRepo(context);
  const skills = await loadAllSkills(root);
  const result = await runBuildDist({
    root,
    skills,
    evaluation: okEval(),
    validation: { ok: true, text: 'PASS\n' },
    hostValidation: { status: 'skipped', reason: 'test' }
  });
  assert.equal(result.ok, true, JSON.stringify(result.errors));

  const skillsRoot = join(root, 'plugins', 'skillsforge', 'skills');
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await access(join(skillsRoot, entry.name, 'skillsforge.json'));
    } catch {
      continue;
    }
    const sourcePath = join(skillsRoot, entry.name, 'SKILL.md');
    const distPath = join(root, 'dist', 'claude-code', 'skills', entry.name, 'SKILL.md');
    const source = await readFile(sourcePath, 'utf8');
    const dist = await readFile(distPath, 'utf8');
    assert.equal(dist, source, `${entry.name} dist SKILL.md mutated`);
    assert.match(source, /\bPreToolUse\b/, `${entry.name} source missing PreToolUse`);
  }

  const report = JSON.parse(await readFile(join(root, 'dist', 'build-report.json'), 'utf8'));
  assert.ok(Array.isArray(report.compiledPolicies));
  assert.ok(report.compiledPolicies.includes('using-skillsforge'));
});
