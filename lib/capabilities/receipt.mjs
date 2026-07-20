import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { analyzeDependencies } from './dependency-graph.mjs';
import { POLICY_RULES, scanSkill } from './policy.mjs';

const SCANNER_VERSION = '0.4.3';
const RECEIPT_VERSION = '0.4.3';

export { SCANNER_VERSION, RECEIPT_VERSION };

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function toPosixRelative(from, file) {
  return relative(from, file).replaceAll('\\', '/');
}

function comparePosixPath(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function normalizeEvaluation(evaluation, options = {}) {
  if (!evaluation || typeof evaluation !== 'object') return null;
  const corpusSha256 = evaluation.corpusSha256 ?? null;
  if (!corpusSha256) return null;
  const reportSha256 = options.reportSha256
    ?? evaluation.reportSha256
    ?? (options.reportBytes ? sha256(options.reportBytes) : null);
  return {
    corpusSha256,
    reportSha256: reportSha256 ?? null,
    total: Number(evaluation.total) || 0,
    tp: Number(evaluation.tp) || 0,
    fp: Number(evaluation.fp) || 0,
    fn: Number(evaluation.fn) || 0,
    tn: Number(evaluation.tn) || 0
  };
}

export async function hashSkillFiles(skill) {
  const fileHashes = [];
  for (const file of skill.files ?? []) {
    const content = await readFile(file);
    fileHashes.push({
      path: toPosixRelative(skill.directory, file),
      sha256: sha256(content)
    });
  }
  fileHashes.sort((a, b) => comparePosixPath(a.path, b.path));
  const unitHash = sha256(fileHashes.map((item) => `${item.path}:${item.sha256}`).join('\n'));
  return { files: fileHashes, unitHash };
}

async function collectFilesRecursive(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collectFilesRecursive(path));
    else if (entry.isFile()) out.push(path);
  }
  return out;
}

export async function hashPackageTree(packageRoot) {
  const root = resolve(packageRoot);
  const files = await collectFilesRecursive(root);
  const fileHashes = [];
  for (const file of files) {
    const content = await readFile(file);
    fileHashes.push({
      path: toPosixRelative(root, file),
      sha256: sha256(content)
    });
  }
  fileHashes.sort((a, b) => comparePosixPath(a.path, b.path));
  const packageHash = sha256(fileHashes.map((item) => `${item.path}:${item.sha256}`).join('\n'));
  return { files: fileHashes, packageHash };
}

export async function buildReceipt(skills, options = {}) {
  const graph = analyzeDependencies(skills);
  if (graph.cycles.length || graph.missing.length || graph.duplicates.length) {
    return {
      ok: false,
      errors: [
        ...graph.cycles.map((cycle) => `dependency-cycle ${cycle.join(' -> ')}`),
        ...graph.missing.map((item) => `missing-dependency ${item.skill} -> ${item.requires}`),
        ...graph.duplicates.map((name) => `duplicate-name ${name}`)
      ]
    };
  }

  const units = [];
  const blocked = [];
  const unverified = [];
  for (const skill of skills) {
    const findings = await scanSkill(skill);
    const blocking = findings.filter((item) => item.blocking);
    if (blocking.length > 0) blocked.push(...blocking.map((item) => ({ skill: skill.name, ...item })));

    for (const item of findings.filter((finding) => !finding.blocking)) {
      unverified.push({
        skill: skill.name,
        rule: item.rule,
        evidence: item.evidence,
        limitation: item.limitation
      });
    }

    const { files: fileHashes, unitHash } = await hashSkillFiles(skill);
    units.push({
      name: skill.name,
      unitHash,
      files: fileHashes,
      capabilities: skill.sidecar?.capabilities ?? null,
      requires: skill.requires ?? [],
      findings: findings.map((item) => ({
        rule: item.rule,
        blocking: item.blocking,
        unverified: Boolean(item.unverified),
        evidence: item.evidence
      }))
    });
  }

  if (blocked.length > 0) {
    return { ok: false, errors: blocked.map((item) => `${item.skill}:${item.rule}`), blocked };
  }

  const evaluation = normalizeEvaluation(options.evaluation, {
    reportSha256: options.reportSha256,
    reportBytes: options.reportBytes
  });
  if (options.requireEvaluation && (!evaluation || !evaluation.reportSha256)) {
    return { ok: false, errors: ['missing holdout evaluation corpusSha256 + reportSha256 + confusion counts'] };
  }

  let packageInfo = null;
  if (options.packageRoot) {
    packageInfo = await hashPackageTree(options.packageRoot);
  }

  const receipt = {
    version: options.version ?? RECEIPT_VERSION,
    skills: units.sort((a, b) => comparePosixPath(a.name, b.name)),
    dependencyOrder: graph.order,
    package: packageInfo,
    evaluation,
    lossiness: options.lossiness ?? null,
    hostValidation: options.hostValidation ?? null,
    scanner: {
      version: SCANNER_VERSION,
      rules: [...POLICY_RULES]
    },
    unverified
  };

  assertNoTimestamps(receipt);

  const text = `${JSON.stringify(receipt, null, 2)}\n`;
  return { ok: true, receipt, receiptHash: sha256(text), text };
}

export async function verifyReceipt(receiptPath, skills, options = {}) {
  const expectedText = await readFile(receiptPath, 'utf8');
  const expected = JSON.parse(expectedText);
  const actualReceiptHash = sha256(expectedText);
  const packageOnly = Boolean(options.packageOnly);
  const requireEvaluation = options.requireEvaluation ?? !packageOnly;
  const mismatches = [];
  const unverified = [];

  if (options.expectedReceiptHash && actualReceiptHash !== options.expectedReceiptHash) {
    mismatches.push('receipt hash mismatch');
  }

  const packageRoot = options.packageRoot ?? null;
  const rebuilt = await buildReceipt(skills, {
    version: expected.version,
    evaluation: expected.evaluation,
    lossiness: Object.hasOwn(options, 'lossiness') ? options.lossiness : expected.lossiness,
    hostValidation: Object.hasOwn(options, 'hostValidation') ? options.hostValidation : expected.hostValidation,
    packageRoot,
    requireEvaluation: false
  });
  if (!rebuilt.ok) return { ok: false, errors: rebuilt.errors, mismatches: [], unverified: [] };

  for (const unit of expected.skills ?? []) {
    const actual = rebuilt.receipt.skills.find((item) => item.name === unit.name);
    if (!actual) mismatches.push(`missing skill ${unit.name}`);
    else {
      if (actual.unitHash !== unit.unitHash) mismatches.push(`unit hash mismatch ${unit.name}`);
      if (stableJson(pickSkillMetadata(actual)) !== stableJson(pickSkillMetadata(unit))) {
        mismatches.push(`skill metadata mismatch ${unit.name}`);
      }
    }
  }
  for (const unit of rebuilt.receipt.skills) {
    if (!(expected.skills ?? []).some((item) => item.name === unit.name)) {
      mismatches.push(`unexpected skill ${unit.name}`);
    }
  }

  if (expected.package?.packageHash) {
    if (!packageRoot) {
      mismatches.push('missing package root for package hash verification');
    } else if (rebuilt.receipt.package?.packageHash !== expected.package.packageHash) {
      mismatches.push('package hash mismatch');
    } else if (stableJson(rebuilt.receipt.package) !== stableJson(expected.package)) {
      mismatches.push('package metadata mismatch');
    }
  }

  compareDeterministicField(mismatches, 'dependencyOrder', rebuilt.receipt.dependencyOrder, expected.dependencyOrder);
  compareDeterministicField(mismatches, 'scanner', rebuilt.receipt.scanner, expected.scanner);
  compareDeterministicField(mismatches, 'unverified', rebuilt.receipt.unverified, expected.unverified);
  if (Object.hasOwn(options, 'lossiness')) {
    compareDeterministicField(mismatches, 'lossiness', rebuilt.receipt.lossiness, expected.lossiness);
  }
  if (Object.hasOwn(options, 'hostValidation')) {
    compareDeterministicField(mismatches, 'hostValidation', rebuilt.receipt.hostValidation, expected.hostValidation);
  }

  const hasExternalEval = Boolean(options.evaluation || options.evaluationPath || options.reportBytes);
  if (packageOnly) {
    unverified.push({
      kind: 'evaluation',
      reason: 'package-only mode skipped external evaluation authenticity check'
    });
  } else if (!hasExternalEval) {
    if (requireEvaluation) mismatches.push('missing external evaluation report');
    else {
      unverified.push({
        kind: 'evaluation',
        reason: 'external evaluation not provided'
      });
    }
  } else {
    const evalResult = await verifyEvaluationEvidence(expected.evaluation, options);
    mismatches.push(...evalResult.mismatches);
    unverified.push(...evalResult.unverified);
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    unverified,
    receiptHash: actualReceiptHash,
    packageVerified: !mismatches.some((item) => /unit hash|package hash|missing skill|unexpected skill|missing package root/i.test(item)),
    evaluationVerified: !packageOnly
      && hasExternalEval
      && !mismatches.some((item) => /evaluation|corpus|report sha/i.test(item))
  };
}

function pickSkillMetadata(unit) {
  return {
    files: unit.files ?? [],
    capabilities: unit.capabilities ?? null,
    requires: unit.requires ?? [],
    findings: unit.findings ?? []
  };
}

function compareDeterministicField(mismatches, label, actual, expected) {
  if (stableJson(actual) !== stableJson(expected)) {
    mismatches.push(`${label} mismatch`);
  }
}

function stableJson(value) {
  return JSON.stringify(sortStable(value));
}

function sortStable(value) {
  if (Array.isArray(value)) return value.map(sortStable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortStable(child)])
  );
}

async function verifyEvaluationEvidence(embedded, options) {
  const mismatches = [];
  const unverified = [];
  const hasExternal = Boolean(options.evaluation || options.evaluationPath || options.reportBytes);
  if (!hasExternal) {
    return { mismatches, unverified };
  }

  let reportBytes = options.reportBytes ?? null;
  let report = options.evaluation ?? null;
  if (options.evaluationPath) {
    reportBytes = reportBytes ?? await readFile(options.evaluationPath);
    report = report ?? JSON.parse(reportBytes.toString('utf8'));
  } else if (report && !reportBytes) {
    reportBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
  }

  if (!reportBytes || !report) {
    mismatches.push('missing external evaluation report');
    return { mismatches, unverified };
  }

  if (!embedded) {
    mismatches.push('receipt missing evaluation');
    return { mismatches, unverified };
  }

  const reportSha256 = sha256(reportBytes);
  const normalized = normalizeEvaluation(report, { reportSha256 });
  if (!normalized) {
    mismatches.push('external evaluation missing corpusSha256 + confusion counts');
    return { mismatches, unverified };
  }

  if (embedded.reportSha256 !== reportSha256) {
    mismatches.push('evaluation report sha256 mismatch');
  }
  if (embedded.corpusSha256 !== normalized.corpusSha256) {
    mismatches.push('evaluation corpus sha256 mismatch');
  }
  for (const key of ['total', 'tp', 'fp', 'fn', 'tn']) {
    if (Number(embedded[key]) !== Number(normalized[key])) {
      mismatches.push(`evaluation ${key} mismatch`);
    }
  }
  return { mismatches, unverified };
}

function assertNoTimestamps(receipt) {
  const serialized = JSON.stringify(receipt);
  if (/"createdAt"|"timestamp"|"durationMs"|"generatedAt"|"builtAt"/i.test(serialized)) {
    throw new Error('receipt hashed payload must not include timestamps');
  }
}
