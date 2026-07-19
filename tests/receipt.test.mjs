import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { POLICY_RULES } from '../lib/capabilities/policy.mjs';
import {
  buildReceipt,
  hashSkillFiles,
  normalizeEvaluation,
  verifyReceipt
} from '../lib/capabilities/receipt.mjs';

async function makeSkill(context, name, files, overrides = {}) {
  const directory = await mkdtemp(join(tmpdir(), `sf-receipt-${name}-`));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const paths = [];
  for (const [relativePath, content] of Object.entries(files)) {
    const absolute = join(directory, relativePath);
    await mkdir(join(absolute, '..'), { recursive: true });
    await writeFile(absolute, content);
    paths.push(absolute);
  }
  return {
    name,
    directory,
    files: paths,
    requires: overrides.requires ?? [],
    sidecar: overrides.sidecar ?? {
      capabilities: {
        exec: { allowed: false, commands: [] },
        network: { allowed: false, hosts: [] },
        write: { scope: 'none' }
      }
    }
  };
}

function reportBytesFor(evaluation) {
  return Buffer.from(`${JSON.stringify(evaluation, null, 2)}\n`);
}

const evaluation = {
  corpusSha256: 'abc123',
  total: 4,
  tp: 2,
  fp: 0,
  fn: 0,
  tn: 2,
  durationMs: 999,
  latencyMs: { p50: 1 }
};

const evaluationWithReport = {
  ...evaluation,
  reportSha256: createHash('sha256').update(reportBytesFor(evaluation)).digest('hex')
};

test('normalizeEvaluation keeps corpus hash + report sha + confusion counts only', () => {
  const bytes = reportBytesFor(evaluation);
  assert.deepEqual(normalizeEvaluation(evaluation, { reportBytes: bytes }), {
    corpusSha256: 'abc123',
    reportSha256: createHash('sha256').update(bytes).digest('hex'),
    total: 4,
    tp: 2,
    fp: 0,
    fn: 0,
    tn: 2
  });
  assert.equal(normalizeEvaluation({ total: 1 }), null);
});

test('sidecar or script mutation changes unit hash', async (context) => {
  const skill = await makeSkill(context, 'unit-a', {
    'SKILL.md': '---\nname: unit-a\ndescription: a\n---\n\nbody\n',
    'skillsforge.json': JSON.stringify({ schemaVersion: 1 }),
    'scripts/run.sh': 'echo hi\n'
  }, {
    sidecar: {
      capabilities: {
        exec: { allowed: true, commands: ['bash scripts/run.sh'] },
        network: { allowed: false, hosts: [] },
        write: { scope: 'skill' }
      }
    }
  });

  const before = await hashSkillFiles(skill);
  await writeFile(join(skill.directory, 'skillsforge.json'), JSON.stringify({ schemaVersion: 1, changed: true }));
  const afterSidecar = await hashSkillFiles(skill);
  assert.notEqual(afterSidecar.unitHash, before.unitHash);

  await writeFile(join(skill.directory, 'scripts', 'run.sh'), 'echo mutated\n');
  const afterScript = await hashSkillFiles(skill);
  assert.notEqual(afterScript.unitHash, afterSidecar.unitHash);
});

test('file order does not change unit hash', async (context) => {
  const skill = await makeSkill(context, 'order-a', {
    'SKILL.md': '---\nname: order-a\ndescription: a\n---\n\nbody\n',
    'skillsforge.json': '{}\n',
    'notes.md': 'n\n'
  });
  const forward = await hashSkillFiles(skill);
  skill.files = [...skill.files].reverse();
  const reverse = await hashSkillFiles(skill);
  assert.equal(reverse.unitHash, forward.unitHash);
  assert.deepEqual(
    reverse.files.map((item) => item.path),
    [...reverse.files.map((item) => item.path)].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
  );
  assert.ok(reverse.files.map((item) => item.path).includes('SKILL.md'));
});

test('receipt includes scanner inventory, dependency order, evaluation, and no timestamps', async (context) => {
  const lib = await makeSkill(context, 'lib', {
    'SKILL.md': '---\nname: lib\ndescription: lib\n---\n\nlib\n'
  });
  const app = await makeSkill(context, 'app', {
    'SKILL.md': '---\nname: app\ndescription: app\n---\n\napp\n'
  }, { requires: ['lib'] });

  const result = await buildReceipt([app, lib], {
    evaluation: evaluationWithReport,
    lossiness: [{ name: 'app', fields: [] }],
    hostValidation: { status: 'skipped', reason: 'test' },
    requireEvaluation: true
  });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.receipt.version, '0.4.1');
  assert.equal(result.receipt.scanner.version, '0.4.1');
  assert.deepEqual(result.receipt.dependencyOrder, ['lib', 'app']);
  assert.deepEqual(result.receipt.scanner.rules, [...POLICY_RULES]);
  assert.equal(result.receipt.evaluation.corpusSha256, 'abc123');
  assert.equal(result.receipt.evaluation.reportSha256, evaluationWithReport.reportSha256);
  assert.equal(result.receipt.evaluation.tp, 2);
  assert.equal(result.receipt.evaluation.durationMs, undefined);
  assert.equal(result.receipt.hostValidation.status, 'skipped');
  assert.ok(!/"durationMs"|"timestamp"|"createdAt"/i.test(result.text));
  assert.ok(result.receipt.skills.every((unit) => unit.files.every((file) => !file.path.includes('\\'))));
});

test('verifyReceipt detects skill file tampering', async (context) => {
  const skill = await makeSkill(context, 'verify-me', {
    'SKILL.md': '---\nname: verify-me\ndescription: v\n---\n\nok\n'
  });
  const built = await buildReceipt([skill], {
    evaluation: evaluationWithReport,
    packageRoot: skill.directory
  });
  assert.equal(built.ok, true);
  const receiptDir = await mkdtemp(join(tmpdir(), 'sf-receipt-out-'));
  context.after(() => rm(receiptDir, { recursive: true, force: true }));
  const receiptPath = join(receiptDir, 'trust-receipt.json');
  await writeFile(receiptPath, built.text);

  const ok = await verifyReceipt(receiptPath, [skill], {
    packageRoot: skill.directory,
    packageOnly: true
  });
  assert.equal(ok.ok, true, JSON.stringify(ok));
  assert.equal(ok.packageVerified, true);

  await writeFile(join(skill.directory, 'SKILL.md'), '---\nname: verify-me\ndescription: v\n---\n\nmutated\n');
  skill.files = [join(skill.directory, 'SKILL.md')];
  const bad = await verifyReceipt(receiptPath, [skill], {
    packageRoot: skill.directory,
    packageOnly: true
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.mismatches.some((item) => /mismatch/i.test(item)));
});

test('verifyReceipt checks an externally pinned receipt hash', async (context) => {
  const skill = await makeSkill(context, 'hash-pin', {
    'SKILL.md': '---\nname: hash-pin\ndescription: h\n---\n\nok\n'
  });
  const built = await buildReceipt([skill], {
    evaluation: evaluationWithReport,
    packageRoot: skill.directory
  });
  const receiptDir = await mkdtemp(join(tmpdir(), 'sf-receipt-hash-pin-'));
  context.after(() => rm(receiptDir, { recursive: true, force: true }));
  const receiptPath = join(receiptDir, 'trust-receipt.json');
  await writeFile(receiptPath, built.text);

  const ok = await verifyReceipt(receiptPath, [skill], {
    packageRoot: skill.directory,
    packageOnly: true,
    expectedReceiptHash: built.receiptHash
  });
  assert.equal(ok.ok, true, JSON.stringify(ok));
  assert.equal(ok.receiptHash, built.receiptHash);

  const bad = await verifyReceipt(receiptPath, [skill], {
    packageRoot: skill.directory,
    packageOnly: true,
    expectedReceiptHash: '0'.repeat(64)
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.mismatches.some((item) => /receipt hash mismatch/i.test(item)));
});

test('verifyReceipt detects deterministic metadata tampering', async (context) => {
  const lib = await makeSkill(context, 'meta-lib', {
    'SKILL.md': '---\nname: meta-lib\ndescription: l\n---\n\nlib\n'
  });
  const app = await makeSkill(context, 'meta-app', {
    'SKILL.md': '---\nname: meta-app\ndescription: a\n---\n\napp\n'
  }, { requires: ['meta-lib'] });
  const lossiness = [{ name: 'meta-app', fields: [{ field: 'hooks', status: 'unsupported' }] }];
  const hostValidation = { status: 'pass', tool: 'test', paths: [{ path: '.', ok: true }] };
  const built = await buildReceipt([app, lib], {
    evaluation: evaluationWithReport,
    lossiness,
    hostValidation
  });
  const tampered = JSON.parse(built.text);
  tampered.dependencyOrder = ['meta-app', 'meta-lib'];
  tampered.scanner.version = 'tampered';
  tampered.lossiness = [];
  tampered.hostValidation = { status: 'pass', tool: 'tampered' };
  tampered.skills[0].capabilities = { exec: { allowed: true, commands: ['sh evil.sh'] } };
  const receiptPath = join(app.directory, 'trust-receipt.json');
  await writeFile(receiptPath, `${JSON.stringify(tampered, null, 2)}\n`);

  const bad = await verifyReceipt(receiptPath, [app, lib], {
    packageOnly: true,
    lossiness,
    hostValidation
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.mismatches.some((item) => /dependencyOrder mismatch/i.test(item)));
  assert.ok(bad.mismatches.some((item) => /scanner mismatch/i.test(item)));
  assert.ok(bad.mismatches.some((item) => /lossiness mismatch/i.test(item)));
  assert.ok(bad.mismatches.some((item) => /hostValidation mismatch/i.test(item)));
  assert.ok(bad.mismatches.some((item) => /skill metadata mismatch meta-app/i.test(item)));
});

test('mutating compiled hook after receipt fails verify', async (context) => {
  const packageRoot = await mkdtemp(join(tmpdir(), 'sf-pkg-hook-'));
  context.after(() => rm(packageRoot, { recursive: true, force: true }));
  const skillDir = join(packageRoot, 'skills', 'hooked');
  await mkdir(skillDir, { recursive: true });
  const skillMd = `---
name: hooked
description: h
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: "node enforce.js"
---

body
`;
  await writeFile(join(skillDir, 'SKILL.md'), skillMd);
  await writeFile(join(skillDir, 'skillsforge.json'), JSON.stringify({
    schemaVersion: 1,
    maturity: 'experimental',
    requires: [],
    routing: { triggers: ['hooked'], antiTriggers: [] },
    capabilities: { exec: { allowed: false, commands: [] }, network: { allowed: false, hosts: [] }, write: { scope: 'none' } },
    compatibility: { 'claude-code': 'full', cursor: 'partial' }
  }));
  await mkdir(join(packageRoot, 'hooks'), { recursive: true });
  await writeFile(join(packageRoot, 'hooks', 'session-start.mjs'), 'export default 1\n');

  const { loadSkill } = await import('../lib/capabilities/skill-loader.mjs');
  const skill = await loadSkill(skillDir);
  const built = await buildReceipt([skill], {
    evaluation: evaluationWithReport,
    packageRoot
  });
  const receiptDir = await mkdtemp(join(tmpdir(), 'sf-hook-receipt-'));
  context.after(() => rm(receiptDir, { recursive: true, force: true }));
  const receiptPath = join(receiptDir, 'trust-receipt.json');
  await writeFile(receiptPath, built.text);

  const ok = await verifyReceipt(receiptPath, [skill], { packageRoot, packageOnly: true });
  assert.equal(ok.ok, true, JSON.stringify(ok));

  await writeFile(join(skillDir, 'SKILL.md'), skillMd.replace('node enforce.js', 'node evil.js'));
  const skillAfter = await loadSkill(skillDir);
  const bad = await verifyReceipt(receiptPath, [skillAfter], { packageRoot, packageOnly: true });
  assert.equal(bad.ok, false);
  assert.ok(bad.mismatches.some((item) => /unit hash|package hash/i.test(item)));
});

test('source-only receipt cannot verify differing package bytes', async (context) => {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'sf-src-'));
  const distRoot = await mkdtemp(join(tmpdir(), 'sf-dist-'));
  context.after(() => rm(sourceRoot, { recursive: true, force: true }));
  context.after(() => rm(distRoot, { recursive: true, force: true }));

  const writeSkill = async (root, body) => {
    const dir = join(root, 'skills', 'pack');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'SKILL.md'), `---\nname: pack\ndescription: p\n---\n\n${body}\n`);
  };
  await writeSkill(sourceRoot, 'source');
  await writeSkill(distRoot, 'dist-mutated');

  const { loadSkill } = await import('../lib/capabilities/skill-loader.mjs');
  const sourceSkill = await loadSkill(join(sourceRoot, 'skills', 'pack'));
  const distSkill = await loadSkill(join(distRoot, 'skills', 'pack'));
  const built = await buildReceipt([sourceSkill], {
    evaluation: evaluationWithReport,
    packageRoot: sourceRoot
  });
  const receiptPath = join(sourceRoot, 'trust-receipt.json');
  await writeFile(receiptPath, built.text);

  const bad = await verifyReceipt(receiptPath, [distSkill], {
    packageRoot: distRoot,
    packageOnly: true
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.mismatches.some((item) => /unit hash|package hash/i.test(item)));
});

test('tampered evaluation counts fail against external report', async (context) => {
  const skill = await makeSkill(context, 'eval-tamper', {
    'SKILL.md': '---\nname: eval-tamper\ndescription: e\n---\n\ne\n'
  });
  const report = { ...evaluation };
  const bytes = reportBytesFor(report);
  const built = await buildReceipt([skill], {
    evaluation: normalizeEvaluation(report, { reportBytes: bytes }),
    packageRoot: skill.directory
  });
  const receiptPath = join(skill.directory, 'trust-receipt.json');
  const tampered = JSON.parse(built.text);
  tampered.skills = built.receipt.skills;
  tampered.evaluation = { ...tampered.evaluation, tp: 99, tn: 0 };
  await writeFile(receiptPath, `${JSON.stringify(tampered, null, 2)}\n`);

  const bad = await verifyReceipt(receiptPath, [skill], {
    packageRoot: skill.directory,
    evaluationPath: null,
    reportBytes: bytes,
    evaluation: report,
    requireEvaluation: true
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.mismatches.some((item) => /evaluation tp mismatch/i.test(item)));
});

test('mismatched evaluation report sha fails', async (context) => {
  const skill = await makeSkill(context, 'sha-tamper', {
    'SKILL.md': '---\nname: sha-tamper\ndescription: e\n---\n\ne\n'
  });
  const report = { ...evaluation };
  const bytes = reportBytesFor(report);
  const built = await buildReceipt([skill], {
    evaluation: normalizeEvaluation(report, { reportBytes: bytes }),
    packageRoot: skill.directory
  });
  const receiptPath = join(skill.directory, 'trust-receipt.json');
  await writeFile(receiptPath, built.text);

  const otherBytes = reportBytesFor({ ...report, failures: ['x'] });
  const bad = await verifyReceipt(receiptPath, [skill], {
    packageRoot: skill.directory,
    reportBytes: otherBytes,
    evaluation: { ...report, failures: ['x'] },
    requireEvaluation: true
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.mismatches.some((item) => /report sha256 mismatch/i.test(item)));
});

test('missing external evaluation fails release verify; package-only marks unverified', async (context) => {
  const skill = await makeSkill(context, 'needs-ext', {
    'SKILL.md': '---\nname: needs-ext\ndescription: n\n---\n\nn\n'
  });
  const built = await buildReceipt([skill], {
    evaluation: evaluationWithReport,
    packageRoot: skill.directory
  });
  const receiptDir = await mkdtemp(join(tmpdir(), 'sf-ext-eval-'));
  context.after(() => rm(receiptDir, { recursive: true, force: true }));
  const receiptPath = join(receiptDir, 'trust-receipt.json');
  await writeFile(receiptPath, built.text);

  const release = await verifyReceipt(receiptPath, [skill], {
    packageRoot: skill.directory,
    requireEvaluation: true
  });
  assert.equal(release.ok, false);
  assert.ok(release.mismatches.some((item) => /missing external evaluation/i.test(item)));

  const smoke = await verifyReceipt(receiptPath, [skill], {
    packageRoot: skill.directory,
    packageOnly: true
  });
  assert.equal(smoke.ok, true, JSON.stringify(smoke));
  assert.ok(smoke.unverified.some((item) => item.kind === 'evaluation'));
});

test('missing evaluation blocks release receipts when required', async (context) => {
  const skill = await makeSkill(context, 'needs-eval', {
    'SKILL.md': '---\nname: needs-eval\ndescription: n\n---\n\nn\n'
  });
  const result = await buildReceipt([skill], { requireEvaluation: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /evaluation/i);
});

test('requireEvaluation rejects evaluation without reportSha256', async (context) => {
  const skill = await makeSkill(context, 'no-report-sha', {
    'SKILL.md': '---\nname: no-report-sha\ndescription: n\n---\n\nn\n'
  });
  const result = await buildReceipt([skill], {
    evaluation: { corpusSha256: 'x', total: 1, tp: 0, fp: 0, fn: 0, tn: 1 },
    requireEvaluation: true
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /reportSha256/i);
});
