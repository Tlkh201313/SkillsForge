import { access, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSkills } from '../lib/capabilities/skill-loader.mjs';
import { buildReceipt, normalizeEvaluation } from '../lib/capabilities/receipt.mjs';
import { exportPortableSkill } from '../lib/capabilities/export.mjs';
import { runEvaluation } from './eval.mjs';
import { validateSkillPaths } from './validate-skill-lib.mjs';
import { runHostValidation } from './host-validation.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function loadHostValidation(buildRoot, options) {
  if (options.hostValidation) return options.hostValidation;

  const envPath = process.env.SKILLSFORGE_HOST_VALIDATION;
  if (envPath) {
    const abs = resolve(buildRoot, envPath);
    return JSON.parse(await readFile(abs, 'utf8'));
  }

  const artifactPath = join(buildRoot, 'artifacts', 'host-validation.json');
  try {
    return JSON.parse(await readFile(artifactPath, 'utf8'));
  } catch {
    // fall through
  }

  if (process.env.SKILLSFORGE_HOST_VALIDATE === '1' || options.hostValidate) {
    // Pre-dist: marketplace + plugin only (dist validated by validate:host after build:dist)
    return await runHostValidation({
      root: buildRoot,
      paths: ['.', 'plugins/skillsforge'],
      requireDist: false
    });
  }

  return {
    status: 'skipped',
    tool: 'claude plugin validate --strict',
    reason: 'host validation not run during build-dist; run npm run validate:host after build:dist'
  };
}

export async function runBuildDist(options = {}) {
  const buildRoot = options.root ?? root;
  const sourceSkills = options.skills ?? await loadAllSkills(buildRoot);

  const validation = options.validation ?? await validateSkillPaths([], {
    root: buildRoot,
    all: true,
    allowEmpty: false,
    profile: 'claude-code'
  });
  if (!validation.ok) {
    return { ok: false, errors: [`validation failed:\n${validation.text.trim()}`] };
  }

  const evaluation = options.evaluation === undefined
    ? await runEvaluation({ root: buildRoot, write: true })
    : options.evaluation;
  const reportPath = join(buildRoot, 'artifacts', 'evaluation', 'routing-report.json');
  let reportBytes = options.reportBytes ?? null;
  if (!reportBytes) {
    try {
      reportBytes = await readFile(reportPath);
    } catch {
      if (evaluation && typeof evaluation === 'object') {
        reportBytes = Buffer.from(`${JSON.stringify(evaluation, null, 2)}\n`);
      }
    }
  }
  const normalizedEval = normalizeEvaluation(evaluation, {
    reportSha256: options.reportSha256 ?? evaluation?.reportSha256,
    reportBytes
  });
  if (!normalizedEval?.reportSha256) {
    return { ok: false, errors: ['holdout evaluation missing corpusSha256 + reportSha256 + confusion counts'] };
  }
  if ((evaluation.precision ?? 0) < 0.95 || (evaluation.recall ?? 0) < 0.9) {
    return {
      ok: false,
      errors: [`holdout eval below thresholds P=${evaluation.precision} R=${evaluation.recall}`]
    };
  }

  const lossiness = sourceSkills.map(buildCursorLossiness);
  const invalidFullClaims = sourceSkills
    .filter((skill) => skill.sidecar?.compatibility?.cursor === 'full')
    .filter((skill) => lossiness.find((item) => item.name === skill.name)?.fields.some((field) => field.status === 'unsupported'))
    .map((skill) => skill.name);
  if (invalidFullClaims.length > 0) {
    return {
      ok: false,
      errors: invalidFullClaims.map((name) => `cursor compatibility claims full but packaging is lossy: ${name}`)
    };
  }

  const hostValidation = await loadHostValidation(buildRoot, options);
  if (hostValidation.status === 'fail') {
    return { ok: false, errors: [`strict host validation failed: ${hostValidation.detail ?? 'unknown'}`] };
  }

  const sidecarSkills = sourceSkills.filter((skill) => skill.sidecar);
  const missingHooks = [];
  for (const skill of sidecarSkills) {
    const sourceSkillPath = join(buildRoot, 'plugins', 'skillsforge', 'skills', skill.name, 'SKILL.md');
    let source;
    try {
      source = await readFile(sourceSkillPath, 'utf8');
    } catch {
      return { ok: false, errors: [`source plugin missing sidecar skill ${skill.name}`] };
    }
    if (!/\bPreToolUse\b/.test(source)) {
      missingHooks.push(skill.name);
    }
  }
  if (missingHooks.length > 0) {
    return {
      ok: false,
      errors: missingHooks.map((name) => `source SKILL.md missing committed PreToolUse hooks: ${name}`)
    };
  }

  const distRoot = join(buildRoot, 'dist');
  const packageRoot = join(distRoot, 'claude-code');
  await rm(distRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  await mkdir(packageRoot, { recursive: true });
  await cp(join(buildRoot, 'plugins', 'skillsforge'), packageRoot, { recursive: true });

  await mkdir(join(distRoot, 'cursor'), { recursive: true });
  for (const skill of sourceSkills) {
    const exported = exportPortableSkill(skill);
    await mkdir(join(distRoot, 'cursor', skill.name), { recursive: true });
    for (const file of exported.files) {
      await writeFile(join(distRoot, 'cursor', skill.name, file.path), file.contents);
    }
    if (skill.sidecar) {
      const sourceSkillPath = join(buildRoot, 'plugins', 'skillsforge', 'skills', skill.name, 'SKILL.md');
      const distSkillPath = join(packageRoot, 'skills', skill.name, 'SKILL.md');
      try {
        await access(distSkillPath);
      } catch {
        return { ok: false, errors: [`Claude package is missing sidecar skill ${skill.name}`] };
      }
      const sourceBytes = await readFile(sourceSkillPath);
      const distBytes = await readFile(distSkillPath);
      if (!sourceBytes.equals(distBytes)) {
        return {
          ok: false,
          errors: [`dist SKILL.md is not byte-equivalent to source for ${skill.name}`]
        };
      }
    }
  }

  const packagedSkills = await loadAllSkills(packageRoot);
  const receipt = await buildReceipt(packagedSkills, {
    evaluation: normalizedEval,
    lossiness,
    hostValidation,
    packageRoot,
    requireEvaluation: true
  });
  if (!receipt.ok) return receipt;

  const compiledPolicies = [];
  for (const skill of sidecarSkills) {
    const source = await readFile(
      join(buildRoot, 'plugins', 'skillsforge', 'skills', skill.name, 'SKILL.md'),
      'utf8'
    );
    if (/\bPreToolUse\b/.test(source)) compiledPolicies.push(skill.name);
  }

  const codexRoot = join(distRoot, 'codex');
  await mkdir(codexRoot, { recursive: true });
  await cp(join(buildRoot, 'plugins', 'skillsforge'), codexRoot, { recursive: true });

  const codexProof = await proveCodexPackageParity(buildRoot, codexRoot);
  if (!codexProof.ok) return codexProof;

  const codexInterop = buildCodexInterop(sourceSkills, codexProof.skillSummaries);
  await writeFile(join(distRoot, 'codex-interop.json'), `${JSON.stringify(codexInterop, null, 2)}\n`);

  await writeFile(join(distRoot, 'trust-receipt.json'), receipt.text);
  await writeFile(join(distRoot, 'cursor-lossiness.json'), `${JSON.stringify(lossiness, null, 2)}\n`);
  await writeFile(join(distRoot, 'build-report.json'), `${JSON.stringify({
    ok: true,
    receiptHash: receipt.receiptHash,
    evaluation: normalizedEval,
    hostValidation,
    compiledPolicies,
    packageHash: receipt.receipt.package?.packageHash ?? null,
    codexInterop
  }, null, 2)}\n`);

  return {
    ok: true,
    receiptHash: receipt.receiptHash,
    packageHash: receipt.receipt.package?.packageHash ?? null,
    evaluation: normalizedEval,
    lossiness,
    hostValidation,
    codexInterop
  };
}

async function proveCodexPackageParity(buildRoot, codexRoot) {
  const sourceSkillsRoot = join(buildRoot, 'plugins', 'skillsforge', 'skills');
  const distSkillsRoot = join(codexRoot, 'skills');
  let entries = [];
  try {
    entries = await readdir(sourceSkillsRoot, { withFileTypes: true });
  } catch (error) {
    return { ok: false, errors: [`codex package missing skills root: ${error.message}`] };
  }

  const skillSummaries = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const sourceDir = join(sourceSkillsRoot, entry.name);
    const distDir = join(distSkillsRoot, entry.name);
    try {
      await access(join(sourceDir, 'SKILL.md'));
    } catch {
      continue;
    }

    const required = ['SKILL.md', join('agents', 'openai.yaml')];
    for (const rel of required) {
      const parity = await assertByteEqual(join(sourceDir, rel), join(distDir, rel), entry.name, rel);
      if (!parity.ok) return parity;
    }

    const hasSidecar = await pathExists(join(sourceDir, 'skillsforge.json'));
    if (hasSidecar) {
      const parity = await assertByteEqual(
        join(sourceDir, 'skillsforge.json'),
        join(distDir, 'skillsforge.json'),
        entry.name,
        'skillsforge.json'
      );
      if (!parity.ok) return parity;
    }

    for (const resource of ['scripts', 'references', 'assets']) {
      const sourceResource = join(sourceDir, resource);
      if (!(await pathExists(sourceResource))) continue;
      const parity = await assertDirByteEqual(sourceResource, join(distDir, resource), entry.name, resource);
      if (!parity.ok) return parity;
    }

    skillSummaries.push({
      name: entry.name,
      hasSidecar,
      openaiYaml: true
    });
  }

  try {
    await access(join(codexRoot, '.codex-plugin', 'plugin.json'));
  } catch {
    return { ok: false, errors: ['dist/codex missing .codex-plugin/plugin.json'] };
  }

  return { ok: true, skillSummaries };
}

function buildCodexInterop(sourceSkills, skillSummaries) {
  const accepted = [
    '.codex-plugin/plugin.json',
    'SKILL.md',
    'agents/openai.yaml',
    'scripts',
    'references',
    'assets'
  ];
  if (skillSummaries.some((item) => item.hasSidecar)) {
    accepted.push('skillsforge.json');
  }
  return {
    host: 'codex',
    accepted,
    transformed: [],
    ignored: [
      'Claude-only PreToolUse hooks embedded in SKILL.md (Codex packaging note: ignored for Codex runtime; use plugin-level hooks instead)'
    ],
    runtimeEnforced: false,
    losses: ['claude-skill-hooks'],
    usesSidecar: false,
    skills: skillSummaries.map((item) => item.name),
    note: 'Codex host install usesSidecar=false; openai.yaml is accepted for Codex skill interface metadata.'
  };
}

async function assertByteEqual(sourcePath, distPath, skillName, label) {
  let sourceBytes;
  let distBytes;
  try {
    sourceBytes = await readFile(sourcePath);
  } catch {
    return { ok: false, errors: [`codex source missing ${skillName}/${label}`] };
  }
  try {
    distBytes = await readFile(distPath);
  } catch {
    return { ok: false, errors: [`dist/codex missing ${skillName}/${label}`] };
  }
  if (!sourceBytes.equals(distBytes)) {
    return { ok: false, errors: [`dist/codex ${skillName}/${label} is not byte-equivalent to source`] };
  }
  return { ok: true };
}

async function assertDirByteEqual(sourceDir, distDir, skillName, label) {
  const sourceFiles = await listFilesRecursive(sourceDir);
  const distFiles = await listFilesRecursive(distDir);
  const sourceRels = new Set(sourceFiles.map((file) => file.rel));
  const distRels = new Set(distFiles.map((file) => file.rel));
  for (const rel of sourceRels) {
    if (!distRels.has(rel)) {
      return { ok: false, errors: [`dist/codex missing ${skillName}/${label}/${rel}`] };
    }
  }
  for (const rel of distRels) {
    if (!sourceRels.has(rel)) {
      return { ok: false, errors: [`dist/codex unexpected extra ${skillName}/${label}/${rel}`] };
    }
  }
  for (const file of sourceFiles) {
    const distFile = distFiles.find((item) => item.rel === file.rel);
    const sourceBytes = await readFile(file.abs);
    const distBytes = await readFile(distFile.abs);
    if (!sourceBytes.equals(distBytes)) {
      return {
        ok: false,
        errors: [`dist/codex ${skillName}/${label}/${file.rel} is not byte-equivalent to source`]
      };
    }
  }
  return { ok: true };
}

async function listFilesRecursive(rootDir) {
  const out = [];
  async function walk(current, prefix = '') {
    let entries = [];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const abs = join(current, entry.name);
      if (entry.isDirectory()) await walk(abs, rel);
      else out.push({ rel, abs });
    }
  }
  await walk(rootDir);
  return out;
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function buildCursorLossiness(skill) {
  const hasSidecar = Boolean(skill.sidecar);
  return {
    name: skill.name,
    effectiveCursorCompatibility: hasSidecar ? 'partial' : 'full',
    fields: [
      { field: 'name', status: 'mapped' },
      { field: 'description', status: 'mapped' },
      { field: 'body', status: 'mapped' },
      { field: 'routing.triggers', status: hasSidecar ? 'unsupported' : 'mapped' },
      { field: 'routing.antiTriggers', status: hasSidecar ? 'unsupported' : 'mapped' },
      { field: 'capabilities', status: hasSidecar ? 'unsupported' : 'mapped' },
      { field: 'requires', status: skill.requires.length ? 'transformed' : 'mapped' }
    ]
  };
}

// Re-export for callers that previously imported merge from build-dist.
export { mergeCompiledFrontmatter } from '../lib/capabilities/claude-policy-compiler.mjs';

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runBuildDist();
  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(`BUILD DIST OK receipt=${result.receiptHash} package=${result.packageHash}`);
}
