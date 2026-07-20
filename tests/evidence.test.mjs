import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  buildEvidenceBundle,
  stableStringify
} from '../lib/capabilities/evidence.mjs';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

const fixedBuildMeta = Object.freeze({
  evidenceVersion: '0.4.3',
  packageVersion: '0.4.3',
  node: { major: 22, platform: 'test', arch: 'x64' },
  ci: false,
  github: { ref: null, sha: null, runId: null },
  rootName: 'skillsforge'
});

const fixedReports = {
  validation: { ok: true, blocking: 0, findings: [] },
  evaluation: {
    corpus: 'routing-holdout.json',
    frozen: '2026-07-13',
    corpusSha256: 'abc',
    total: 4,
    tp: 2,
    fp: 0,
    fn: 0,
    tn: 2,
    precision: 1,
    recall: 1,
    exactMatchAccuracy: 1,
    reportSha256: 'def',
    failures: [],
    note: 'Holdout precision/recall reported honestly; labels are not edited to force a perfect score.'
  },
  policyCorpus: {
    name: 'policy-adversarial.json',
    sha256: 'policy-sha',
    cases: [
      {
        id: 'allow-ok',
        expected: 'allow',
        event: { tool_name: 'Bash', tool_input: { command: 'node scripts/ok.mjs' } },
        policy: {
          schemaVersion: 1,
          capabilities: {
            exec: { allowed: true, commands: ['node scripts/ok.mjs'] },
            network: { allowed: false, hosts: [] },
            write: { scope: 'skill' },
            mcp: { allowed: false, tools: [] }
          },
          __skillRoot: '/tmp/sf-policy-skill',
          __projectRoot: '/tmp/sf-policy-project'
        }
      },
      {
        id: 'deny-chain',
        expected: 'deny',
        event: { tool_name: 'Bash', tool_input: { command: 'node scripts/ok.mjs; rm -rf /' } },
        policy: {
          schemaVersion: 1,
          capabilities: {
            exec: { allowed: true, commands: ['node scripts/ok.mjs'] },
            network: { allowed: false, hosts: [] },
            write: { scope: 'skill' },
            mcp: { allowed: false, tools: [] }
          },
          __skillRoot: '/tmp/sf-policy-skill',
          __projectRoot: '/tmp/sf-policy-project'
        }
      }
    ]
  },
  fixtureReport: {
    note: 'Independent public-style fixtures for adversarial near-match coverage; not part of holdout routing gate.',
    fixtures: [
      { path: 'tests/fixtures/skills/public-docs-helper', ok: true, blocking: 0 }
    ]
  },
  codexReport: {
    host: 'codex',
    plugin: { name: 'skillsforge', version: '0.4.3', skills: './skills/', interface: { displayName: 'SkillsForge', shortDescription: 'x' } },
    skills: [{ name: 'using-skillsforge', openaiYaml: true, sidecar: true }],
    dist: { pluginJson: true, openaiYamlCount: 1 },
    interop: { host: 'codex', accepted: ['SKILL.md'], transformed: [], ignored: [], runtimeEnforced: false, losses: [], usesSidecar: false }
  },
  receiptReport: {
    receiptPath: 'dist/trust-receipt.json',
    packageRoot: 'dist/claude-code',
    verify: {
      ok: true,
      packageVerified: true,
      evaluationVerified: true,
      mismatches: [],
      receiptHash: 'receipt-hash'
    },
    tamper: {
      ok: false,
      prepared: true,
      mismatches: ['unit hash mismatch using-skillsforge'],
      note: 'One-byte mutation of trust receipt must fail verification.'
    }
  },
  buildMeta: fixedBuildMeta
};

test('stableStringify sorts object keys deterministically', () => {
  assert.equal(
    stableStringify({ b: 1, a: { d: 2, c: 3 } }),
    stableStringify({ a: { c: 3, d: 2 }, b: 1 })
  );
});

test('evidence bundle hash is stable for identical inputs', async (context) => {
  const dir = await mkdtemp(join(tmpdir(), 'sf-evidence-'));
  context.after(() => rm(dir, { recursive: true, force: true }));

  const first = await buildEvidenceBundle({
    root: repoRoot,
    outDir: join(dir, 'a'),
    write: true,
    ...fixedReports
  });
  const second = await buildEvidenceBundle({
    root: repoRoot,
    outDir: join(dir, 'b'),
    write: true,
    ...fixedReports
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.bundleHash, second.bundleHash);
  assert.ok(first.bundleHash && /^[0-9a-f]{64}$/.test(first.bundleHash));

  const manifestA = JSON.parse(await readFile(join(dir, 'a', 'manifest.json'), 'utf8'));
  const manifestB = JSON.parse(await readFile(join(dir, 'b', 'manifest.json'), 'utf8'));
  assert.equal(manifestA.bundleHash, manifestB.bundleHash);
  assert.deepEqual(
    manifestA.files.map((item) => item.path),
    manifestB.files.map((item) => item.path)
  );
});

test('evidence bundle records tamper detection failure path', async (context) => {
  const dir = await mkdtemp(join(tmpdir(), 'sf-evidence-tamper-'));
  context.after(() => rm(dir, { recursive: true, force: true }));

  const result = await buildEvidenceBundle({
    root: repoRoot,
    outDir: dir,
    write: true,
    ...fixedReports
  });
  assert.equal(result.ok, true);

  const receipt = JSON.parse(await readFile(join(dir, 'receipt.json'), 'utf8'));
  assert.equal(receipt.verify.ok, true);
  assert.equal(receipt.tamper.ok, false);
  assert.equal(receipt.tamper.prepared, true);
  assert.ok(receipt.tamper.mismatches.length > 0);
});

test('live evidence run writes expected files and detects policy false-allow denominator', async (context) => {
  const dir = await mkdtemp(join(tmpdir(), 'sf-evidence-live-'));
  context.after(() => rm(dir, { recursive: true, force: true }));

  const result = await buildEvidenceBundle({
    root: repoRoot,
    outDir: dir,
    write: true,
    buildMeta: fixedBuildMeta,
    // dist/ is gitignored and other tests may rebuild it concurrently. This unit-level
    // evidence probe must not depend on shared dist state; the release check covers
    // real dist receipt verification after build:dist.
    packageRoot: join(dir, 'missing-package'),
    receiptPath: join(dir, 'missing-receipt.json'),
    allowSynthetic: true
  });

  assert.equal(result.ok, true, JSON.stringify({
    ok: result.ok,
    receipt: result.reports?.['receipt.json'],
    policy: result.reports?.['policy-adversarial.json']
  }, null, 2));
  for (const name of [
    'manifest.json',
    'validation.json',
    'routing-eval.json',
    'policy-adversarial.json',
    'independent-fixtures.json',
    'codex-package.json',
    'receipt.json',
    'build-meta.json'
  ]) {
    const text = await readFile(join(dir, name), 'utf8');
    assert.ok(text.length > 2, name);
    assert.equal(text.includes('"durationMs"'), false, name);
    assert.equal(text.includes('"latencyMs"'), false, name);
  }

  const policy = JSON.parse(await readFile(join(dir, 'policy-adversarial.json'), 'utf8'));
  assert.ok(policy.total >= 10);
  assert.equal(policy.falseAllow, 0);
  assert.equal(typeof policy.falseDeny, 'number');

  const routing = JSON.parse(await readFile(join(dir, 'routing-eval.json'), 'utf8'));
  assert.ok(routing.precision == null || routing.precision <= 1);
  assert.ok(routing.recall == null || routing.recall <= 1);
  assert.match(routing.note, /honestly/i);

  const receipt = JSON.parse(await readFile(join(dir, 'receipt.json'), 'utf8'));
  assert.equal(receipt.verify.ok, true);
  assert.equal(receipt.tamper.ok, false);
  assert.ok(receipt.mode == null || receipt.mode === 'synthetic');
});

test('evidence ok fails closed on empty policy corpus', async (context) => {
  const dir = await mkdtemp(join(tmpdir(), 'sf-evidence-empty-'));
  context.after(() => rm(dir, { recursive: true, force: true }));
  const result = await buildEvidenceBundle({
    root: repoRoot,
    outDir: dir,
    write: true,
    ...fixedReports,
    policyCorpus: { name: 'empty', sha256: 'x', cases: [] }
  });
  assert.equal(result.ok, false);
  assert.equal(result.reports['policy-adversarial.json'].total, 0);
});

test('evidence ok fails closed on synthetic receipt mode', async (context) => {
  const dir = await mkdtemp(join(tmpdir(), 'sf-evidence-synth-'));
  context.after(() => rm(dir, { recursive: true, force: true }));
  const result = await buildEvidenceBundle({
    root: repoRoot,
    outDir: dir,
    write: true,
    ...fixedReports,
    receiptReport: {
      mode: 'synthetic',
      receiptPath: null,
      packageRoot: 'plugins/skillsforge',
      verify: {
        ok: true,
        packageVerified: true,
        evaluationVerified: true,
        mismatches: [],
        receiptHash: 'synthetic'
      },
      tamper: {
        ok: false,
        prepared: true,
        mismatches: ['x'],
        note: 'synthetic'
      }
    }
  });
  assert.equal(result.ok, false);
});
