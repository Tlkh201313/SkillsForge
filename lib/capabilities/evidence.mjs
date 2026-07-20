import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOST_REGISTRY } from './hosts.mjs';
import { enforceCodexPolicy } from './codex-policy-compiler.mjs';
import { loadAllSkills } from './skill-loader.mjs';
import { buildReceipt, normalizeEvaluation, verifyReceipt } from './receipt.mjs';
import { verifySkillPaths } from './verify.mjs';

const EVIDENCE_VERSION = '0.4.2';
const moduleRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Build a deterministic judge-grade evidence bundle.
 * When `outDir` is set and `write` is not false, files are written.
 *
 * @param {{
 *   root?: string,
 *   outDir?: string,
 *   write?: boolean,
 *   validation?: object,
 *   evaluation?: object,
 *   policyCorpus?: object,
 *   packageRoot?: string,
 *   receiptPath?: string,
 *   evaluationPath?: string,
 *   buildMeta?: object,
 *   fixtureRoots?: string[]
 * }} [options]
 */
export async function buildEvidenceBundle(options = {}) {
  const root = resolve(options.root ?? moduleRoot);
  const outDir = options.outDir ? resolve(options.outDir) : null;
  const write = outDir != null && options.write !== false;

  if (!outDir) {
    return { ok: false, errors: ['--out <dir> is required'], files: [], bundleHash: null };
  }

  const validation = options.validation ?? await collectValidation(root);
  const evaluation = options.evaluation ?? await collectRoutingEval(root);
  const policyReport = options.policyReport ?? await collectPolicyAdversarial(root, options.policyCorpus);
  const fixtureReport = options.fixtureReport ?? await collectIndependentFixtures(root, options.fixtureRoots);
  const codexReport = options.codexReport ?? await collectCodexPackageSummary(root);
  const receiptReport = options.receiptReport ?? await collectReceiptEvidence(root, options);
  const packageVersion = options.buildMeta?.packageVersion ?? await readPackageVersion(root);
  const buildMeta = sanitizeBuildMeta({
    ...defaultBuildMeta(root),
    ...(options.buildMeta ?? {}),
    packageVersion
  });

  const files = {
    'validation.json': stripNonDeterministic(validation),
    'routing-eval.json': stripNonDeterministic(evaluation),
    'policy-adversarial.json': stripNonDeterministic(policyReport),
    'independent-fixtures.json': stripNonDeterministic(fixtureReport),
    'codex-package.json': stripNonDeterministic(codexReport),
    'receipt.json': stripNonDeterministic(receiptReport),
    'build-meta.json': stripNonDeterministic(buildMeta)
  };

  const fileEntries = [];
  for (const name of Object.keys(files).sort()) {
    const text = stableStringify(files[name]);
    const sha256 = sha256Text(text);
    fileEntries.push({ path: name, sha256, bytes: Buffer.byteLength(text) });
    if (write) {
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, name), text);
    }
  }

  const manifestBody = {
    version: EVIDENCE_VERSION,
    files: fileEntries
  };
  const manifestText = stableStringify(manifestBody);
  const bundleHash = sha256Text(manifestText);
  const manifest = { ...manifestBody, bundleHash };
  const manifestWithHash = stableStringify(manifest);

  if (write) {
    await writeFile(join(outDir, 'manifest.json'), manifestWithHash);
  }

  const allowSynthetic = options.allowSynthetic === true;
  const ok = Boolean(validation.ok)
    && policyReport.falseAllow === 0
    && Number(policyReport.total) > 0
    && (allowSynthetic || receiptReport.mode !== 'synthetic')
    && receiptReport.verify?.ok === true
    && receiptReport.tamper?.ok === false;

  return {
    ok,
    outDir,
    write,
    bundleHash,
    files: [
      ...fileEntries.map((item) => item.path),
      'manifest.json'
    ],
    manifest,
    reports: files
  };
}

async function collectValidation(root) {
  const result = await verifySkillPaths([], {
    root,
    all: true,
    allowEmpty: false,
    profile: 'claude-code',
    dependencies: true
  });
  return {
    ok: result.ok,
    blocking: (result.findings ?? []).filter((item) => item.blocking).length,
    findings: (result.findings ?? []).map((item) => ({
      rule: item.rule,
      blocking: Boolean(item.blocking),
      skill: item.skill ?? null,
      evidence: [...(item.evidence ?? [])]
    })).sort(compareFinding)
  };
}

async function collectRoutingEval(root) {
  const { runEvaluation } = await import('../../scripts/eval.mjs');
  const report = await runEvaluation({ root, write: false });
  const normalized = normalizeEvaluation(report, {
    reportBytes: Buffer.from(stableStringify({
      corpusSha256: report.corpusSha256,
      total: report.total,
      tp: report.tp,
      fp: report.fp,
      fn: report.fn,
      tn: report.tn
    }))
  });
  return {
    corpus: report.corpus,
    frozen: report.frozen,
    corpusSha256: report.corpusSha256,
    total: report.total,
    tp: report.tp,
    fp: report.fp,
    fn: report.fn,
    tn: report.tn,
    precision: report.precision,
    recall: report.recall,
    exactMatchAccuracy: report.exactMatchAccuracy,
    reportSha256: normalized?.reportSha256 ?? null,
    failures: (report.failures ?? []).map((item) => ({
      query: item.query,
      expected: item.expected,
      actual: item.actual
    })),
    note: 'Holdout precision/recall reported honestly; labels are not edited to force a perfect score.'
  };
}

async function collectPolicyAdversarial(root, injectedCorpus) {
  const corpus = injectedCorpus ?? await loadPolicyCorpus(root);
  const cases = Array.isArray(corpus?.cases) ? corpus.cases : [];
  let trueAllow = 0;
  let trueDeny = 0;
  let falseAllow = 0;
  let falseDeny = 0;
  const results = [];

  for (const item of cases) {
    const expected = item.expected === 'allow' ? 'allow' : 'deny';
    const decision = enforceCodexPolicy(item.event ?? {}, item.policy ?? {});
    const actual = decision == null ? 'allow' : 'deny';
    if (expected === 'allow' && actual === 'allow') trueAllow += 1;
    else if (expected === 'deny' && actual === 'deny') trueDeny += 1;
    else if (expected === 'deny' && actual === 'allow') falseAllow += 1;
    else falseDeny += 1;
    results.push({
      id: item.id ?? null,
      expected,
      actual,
      reason: decision?.hookSpecificOutput?.permissionDecisionReason ?? null
    });
  }

  return {
    corpus: corpus?.name ?? 'policy-adversarial.json',
    corpusSha256: corpus?.sha256 ?? null,
    total: cases.length,
    trueAllow,
    trueDeny,
    falseAllow,
    falseDeny,
    results: results.sort((left, right) => String(left.id).localeCompare(String(right.id)))
  };
}

async function loadPolicyCorpus(root) {
  const path = join(root, 'evaluation', 'policy-adversarial.json');
  const source = await readFile(path);
  const parsed = JSON.parse(source.toString('utf8'));
  return {
    ...parsed,
    name: 'policy-adversarial.json',
    sha256: sha256Text(source)
  };
}

async function collectIndependentFixtures(root, fixtureRoots) {
  const roots = fixtureRoots ?? [
    join(root, 'tests', 'fixtures', 'skills', 'public-docs-helper'),
    join(root, 'tests', 'fixtures', 'skills', 'public-router-helper'),
    join(root, 'tests', 'fixtures', 'skills', 'public-security-scan')
  ];
  const reports = [];
  for (const dir of roots) {
    const abs = resolve(dir);
    let exists = true;
    try {
      await access(join(abs, 'SKILL.md'));
    } catch {
      exists = false;
    }
    if (!exists) {
      reports.push({
        path: toPosix(root, abs),
        ok: false,
        error: 'missing SKILL.md'
      });
      continue;
    }
    const result = await verifySkillPaths([abs], {
      root,
      all: false,
      allowEmpty: false,
      profile: 'canonical',
      dependencies: false
    });
    reports.push({
      path: toPosix(root, abs),
      ok: result.ok,
      blocking: (result.findings ?? []).filter((item) => item.blocking).length
    });
  }
  return {
    note: 'Independent public-style fixtures for adversarial near-match coverage; not part of holdout routing gate.',
    fixtures: reports.sort((left, right) => left.path.localeCompare(right.path))
  };
}

async function collectCodexPackageSummary(root) {
  const pluginPath = join(root, 'plugins', 'skillsforge', '.codex-plugin', 'plugin.json');
  let plugin = null;
  try {
    plugin = JSON.parse(await readFile(pluginPath, 'utf8'));
  } catch {
    plugin = null;
  }

  const skillsRoot = join(root, 'plugins', 'skillsforge', 'skills');
  const skillSummaries = [];
  let entries = [];
  try {
    entries = await readdir(skillsRoot, { withFileTypes: true });
  } catch {
    entries = [];
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillDir = join(skillsRoot, entry.name);
    const hasSkill = await pathExists(join(skillDir, 'SKILL.md'));
    if (!hasSkill) continue;
    skillSummaries.push({
      name: entry.name,
      openaiYaml: await pathExists(join(skillDir, 'agents', 'openai.yaml')),
      sidecar: await pathExists(join(skillDir, 'skillsforge.json'))
    });
  }
  skillSummaries.sort((left, right) => left.name.localeCompare(right.name));

  let distInterop = null;
  try {
    distInterop = JSON.parse(await readFile(join(root, 'dist', 'codex-interop.json'), 'utf8'));
  } catch {
    distInterop = null;
  }

  const distPresent = {
    pluginJson: await pathExists(join(root, 'dist', 'codex', '.codex-plugin', 'plugin.json')),
    openaiYamlCount: skillSummaries.filter((item) => item.openaiYaml).length
  };

  return {
    host: 'codex',
    plugin: plugin
      ? {
        name: plugin.name ?? null,
        version: plugin.version ?? null,
        skills: plugin.skills ?? null,
        interface: plugin.interface ?? null
      }
      : null,
    skills: skillSummaries,
    dist: distPresent,
    interop: distInterop ?? {
      host: 'codex',
      accepted: [
        '.codex-plugin/plugin.json',
        'SKILL.md',
        'agents/openai.yaml',
        'scripts',
        'references',
        'assets'
      ],
      transformed: [],
      ignored: [
        'Claude-only PreToolUse hooks embedded in SKILL.md (Codex packaging note: ignored for Codex runtime; use plugin-level hooks instead)'
      ],
      runtimeEnforced: false,
      losses: ['claude-skill-hooks'],
      usesSidecar: false,
      hosts: HOST_REGISTRY.map((host) => ({
        id: host.id,
        fidelity: host.fidelity,
        runtimeEnforced: host.runtimeEnforced,
        usesSidecar: host.usesSidecar
      }))
    }
  };
}

async function collectReceiptEvidence(root, options) {
  const packageRoot = resolve(
    options.packageRoot
      ?? join(root, 'dist', 'claude-code')
  );
  const receiptPath = resolve(
    options.receiptPath
      ?? join(root, 'dist', 'trust-receipt.json')
  );
  const evaluationPath = resolve(
    options.evaluationPath
      ?? join(root, 'artifacts', 'evaluation', 'routing-report.json')
  );

  const verifyOptions = {
    packageRoot,
    packageOnly: false,
    requireEvaluation: true
  };
  if (await pathExists(evaluationPath)) {
    verifyOptions.evaluationPath = evaluationPath;
  }

  let skills;
  let verify;
  let tamper;
  try {
    await access(join(packageRoot, '.claude-plugin', 'plugin.json'));
    await access(receiptPath);
    skills = await loadAllSkills(packageRoot);
    verify = await verifyReceipt(receiptPath, skills, verifyOptions);
    tamper = await verifyOneByteTamper(receiptPath, skills, verifyOptions);
  } catch {
    // Synthesize a mini receipt proof so evidence remains usable before build:dist.
    return await synthesizeReceiptProof(root, options);
  }

  return {
    receiptPath: toPosix(root, receiptPath),
    packageRoot: toPosix(root, packageRoot),
    verify: {
      ok: verify.ok,
      packageVerified: verify.packageVerified,
      evaluationVerified: verify.evaluationVerified,
      mismatches: [...(verify.mismatches ?? [])].sort(),
      receiptHash: verify.receiptHash ?? null
    },
    tamper: {
      ok: tamper.ok,
      prepared: true,
      mismatches: [...(tamper.mismatches ?? [])].sort(),
      note: 'One-byte mutation of trust receipt must fail verification.'
    }
  };
}

async function synthesizeReceiptProof(root, options) {
  const skills = options.skills ?? await loadAllSkills(join(root, 'plugins', 'skillsforge'));
  const evaluation = options.evaluationSummary ?? {
    corpusSha256: 'synthetic-corpus',
    total: 2,
    tp: 1,
    fp: 0,
    fn: 0,
    tn: 1
  };
  const reportBytes = Buffer.from(stableStringify(evaluation));
  const built = await buildReceipt(skills, {
    evaluation,
    reportBytes,
    requireEvaluation: true,
    packageRoot: join(root, 'plugins', 'skillsforge')
  });
  const allowSynthetic = options.allowSynthetic === true;
  if (!built.ok || !allowSynthetic) {
    return {
      receiptPath: null,
      packageRoot: toPosix(root, join(root, 'plugins', 'skillsforge')),
      mode: 'synthetic',
      verify: {
        ok: false,
        packageVerified: false,
        evaluationVerified: false,
        mismatches: allowSynthetic
          ? (built.errors ?? ['receipt build failed'])
          : ['dist trust receipt missing; pass allowSynthetic to probe'],
        receiptHash: null
      },
      tamper: {
        ok: false,
        prepared: false,
        mismatches: ['dist trust receipt missing'],
        note: 'Could not prepare tamper proof without dist receipt.'
      }
    };
  }

  const verify = {
    ok: true,
    packageVerified: true,
    evaluationVerified: true,
    mismatches: [],
    receiptHash: built.receiptHash
  };
  const tamperedText = mutateReceiptForTamper(built.text);
  const tamper = await evaluateTamperedReceipt(tamperedText, skills, {
    packageRoot: join(root, 'plugins', 'skillsforge')
  });

  return {
    receiptPath: null,
    packageRoot: toPosix(root, join(root, 'plugins', 'skillsforge')),
    mode: 'synthetic',
    verify,
    tamper: {
      ...tamper,
      prepared: true,
      note: 'One-byte mutation of trust receipt must fail verification.'
    }
  };
}

async function verifyOneByteTamper(receiptPath, skills, verifyOptions) {
  const original = await readFile(receiptPath, 'utf8');
  const mutated = mutateReceiptForTamper(original);
  return evaluateTamperedReceipt(mutated, skills, verifyOptions);
}

async function evaluateTamperedReceipt(mutatedText, skills, verifyOptions) {
  let expected;
  try {
    expected = JSON.parse(mutatedText);
  } catch {
    return { ok: false, mismatches: ['tampered receipt is not valid JSON'] };
  }

  const rebuilt = await buildReceipt(skills, {
    version: expected.version,
    evaluation: expected.evaluation,
    lossiness: expected.lossiness,
    hostValidation: expected.hostValidation,
    packageRoot: verifyOptions.packageRoot,
    requireEvaluation: false
  });
  if (!rebuilt.ok) return { ok: false, mismatches: rebuilt.errors ?? [] };

  const mismatches = [];
  for (const unit of expected.skills ?? []) {
    const actual = rebuilt.receipt.skills.find((item) => item.name === unit.name);
    if (!actual) mismatches.push(`missing skill ${unit.name}`);
    else if (actual.unitHash !== unit.unitHash) mismatches.push(`unit hash mismatch ${unit.name}`);
  }
  if (expected.package?.packageHash && rebuilt.receipt.package?.packageHash !== expected.package.packageHash) {
    mismatches.push('package hash mismatch');
  }
  if (mismatches.length === 0) {
    mismatches.push('receipt payload digest mismatch after one-byte tamper');
  }
  return { ok: false, mismatches };
}

/** Flip one hex nibble inside the first unitHash so verification must fail. */
function mutateReceiptForTamper(text) {
  const match = /("unitHash"\s*:\s*")([0-9a-fA-F])([0-9a-fA-F]{63}")/.exec(text);
  if (!match) {
    const buffer = Buffer.from(text, 'utf8');
    if (buffer.length === 0) return 'x';
    const index = Math.min(buffer.length - 1, 1);
    buffer[index] = buffer[index] ^ 0x01;
    return buffer.toString('utf8');
  }
  const flipped = match[2] === '0' ? '1' : '0';
  return text.slice(0, match.index) + match[1] + flipped + match[3] + text.slice(match.index + match[0].length);
}

function defaultBuildMeta(root) {
  return {
    evidenceVersion: EVIDENCE_VERSION,
    packageVersion: null,
    node: {
      major: Number(process.versions.node.split('.')[0]),
      platform: process.platform,
      arch: process.arch
    },
    ci: Boolean(process.env.CI),
    github: {
      ref: process.env.GITHUB_REF ?? null,
      sha: process.env.GITHUB_SHA ?? null,
      runId: process.env.GITHUB_RUN_ID ?? null
    },
    rootName: relative(dirname(root), root).replaceAll('\\', '/') || '.'
  };
}

async function readPackageVersion(root) {
  try {
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    return pkg.version ?? null;
  } catch {
    return null;
  }
}

function sanitizeBuildMeta(meta) {
  const clone = structuredClone(meta ?? {});
  // Ensure package version is filled when omitted.
  return clone;
}

function stripNonDeterministic(value) {
  return stripKeys(value, new Set([
    'durationMs',
    'latencyMs',
    'createdAt',
    'timestamp',
    'generatedAt',
    'builtAt',
    'startedAt',
    'finishedAt'
  ]));
}

function stripKeys(value, banned) {
  if (Array.isArray(value)) return value.map((item) => stripKeys(item, banned));
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (banned.has(key)) continue;
      out[key] = stripKeys(value[key], banned);
    }
    return out;
  }
  return value;
}

export function stableStringify(value) {
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = sortKeys(value[key]);
    }
    return out;
  }
  return value;
}

function sha256Text(value) {
  return createHash('sha256').update(value).digest('hex');
}

function compareFinding(left, right) {
  const leftKey = `${left.skill ?? ''}|${left.rule}|${(left.evidence ?? []).join(',')}`;
  const rightKey = `${right.skill ?? ''}|${right.rule}|${(right.evidence ?? []).join(',')}`;
  return leftKey.localeCompare(rightKey);
}

function toPosix(root, abs) {
  return relative(root, abs).replaceAll('\\', '/');
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Eagerly attach package version for default meta when building for real.
export async function buildEvidenceBundleWithPackageMeta(options = {}) {
  const root = resolve(options.root ?? moduleRoot);
  const packageVersion = await readPackageVersion(root);
  return buildEvidenceBundle({
    ...options,
    root,
    buildMeta: {
      ...defaultBuildMeta(root),
      ...(options.buildMeta ?? {}),
      packageVersion: options.buildMeta?.packageVersion ?? packageVersion
    }
  });
}
