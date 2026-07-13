import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { analyzeDependencies } from './dependency-graph.mjs';
import { POLICY_RULES, scanSkill } from './policy.mjs';

const SCANNER_VERSION = '0.3.0';
const RECEIPT_VERSION = '0.3.0';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function toPosixRelative(skillDirectory, file) {
  return relative(skillDirectory, file).replaceAll('\\', '/');
}

export function normalizeEvaluation(evaluation) {
  if (!evaluation || typeof evaluation !== 'object') return null;
  const corpusSha256 = evaluation.corpusSha256 ?? null;
  if (!corpusSha256) return null;
  return {
    corpusSha256,
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

function comparePosixPath(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
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
        limitation: item.fix
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

  const evaluation = normalizeEvaluation(options.evaluation);
  if (options.requireEvaluation && !evaluation) {
    return { ok: false, errors: ['missing holdout evaluation corpusSha256 + confusion counts'] };
  }

  const receipt = {
    version: options.version ?? RECEIPT_VERSION,
    skills: units.sort((a, b) => comparePosixPath(a.name, b.name)),
    dependencyOrder: graph.order,
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
  const expected = JSON.parse(await readFile(receiptPath, 'utf8'));
  const rebuilt = await buildReceipt(skills, {
    version: expected.version,
    evaluation: expected.evaluation,
    lossiness: expected.lossiness,
    hostValidation: expected.hostValidation
  });
  if (!rebuilt.ok) return { ok: false, errors: rebuilt.errors };
  const mismatches = [];
  const expectedHash = sha256(`${JSON.stringify(expected, null, 2)}\n`);
  if (rebuilt.receiptHash !== expectedHash) mismatches.push('receipt payload mismatch');
  for (const unit of expected.skills ?? []) {
    const actual = rebuilt.receipt.skills.find((item) => item.name === unit.name);
    if (!actual) mismatches.push(`missing skill ${unit.name}`);
    else if (actual.unitHash !== unit.unitHash) mismatches.push(`unit hash mismatch ${unit.name}`);
  }
  for (const unit of rebuilt.receipt.skills) {
    if (!(expected.skills ?? []).some((item) => item.name === unit.name)) {
      mismatches.push(`unexpected skill ${unit.name}`);
    }
  }
  return {
    ok: mismatches.length === 0,
    mismatches,
    receiptHash: rebuilt.receiptHash
  };
}

function assertNoTimestamps(receipt) {
  const serialized = JSON.stringify(receipt);
  if (/"createdAt"|"timestamp"|"durationMs"|"generatedAt"|"builtAt"/i.test(serialized)) {
    throw new Error('receipt hashed payload must not include timestamps');
  }
}
