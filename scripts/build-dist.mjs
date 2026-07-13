import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSkills } from '../lib/capabilities/skill-loader.mjs';
import { buildReceipt, normalizeEvaluation } from '../lib/capabilities/receipt.mjs';
import { runEvaluation } from './eval.mjs';
import { validateSkillPaths } from './validate-skill-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function runBuildDist(options = {}) {
  const buildRoot = options.root ?? root;
  const skills = options.skills ?? await loadAllSkills(buildRoot);

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
  const normalizedEval = normalizeEvaluation(evaluation);
  if (!normalizedEval) {
    return { ok: false, errors: ['holdout evaluation missing corpusSha256 + confusion counts'] };
  }
  if ((evaluation.precision ?? 0) < 0.9 || (evaluation.recall ?? 0) < 0.85) {
    return {
      ok: false,
      errors: [`holdout eval below thresholds P=${evaluation.precision} R=${evaluation.recall}`]
    };
  }

  const lossiness = skills.map(buildCursorLossiness);
  const invalidFullClaims = skills
    .filter((skill) => skill.sidecar?.compatibility?.cursor === 'full')
    .filter((skill) => lossiness.find((item) => item.name === skill.name)?.fields.some((field) => field.status === 'unsupported'))
    .map((skill) => skill.name);
  if (invalidFullClaims.length > 0) {
    return {
      ok: false,
      errors: invalidFullClaims.map((name) => `cursor compatibility claims full but packaging is lossy: ${name}`)
    };
  }

  const hostValidation = options.hostValidation ?? {
    status: 'skipped',
    tool: 'claude plugin validate --strict',
    reason: 'host validation not run during build-dist; see agent-config tests'
  };
  if (hostValidation.status === 'fail') {
    return { ok: false, errors: [`strict host validation failed: ${hostValidation.detail ?? 'unknown'}`] };
  }

  const sidecarSkills = skills.filter((skill) => skill.sidecar);
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

  const receipt = await buildReceipt(skills, {
    evaluation: normalizedEval,
    lossiness,
    hostValidation,
    requireEvaluation: true
  });
  if (!receipt.ok) return receipt;

  const distRoot = join(buildRoot, 'dist');
  await rm(distRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  await mkdir(join(distRoot, 'claude-code'), { recursive: true });
  await cp(join(buildRoot, 'plugins', 'skillsforge'), join(distRoot, 'claude-code'), { recursive: true });

  await mkdir(join(distRoot, 'cursor'), { recursive: true });
  for (const skill of skills) {
    const requiresNote = skill.requires.length
      ? `\n\n## Requires\n${skill.requires.map((name) => `- ${name}`).join('\n')}`
      : '';
    const content = `---\nname: ${skill.name}\ndescription: ${skill.description}\n---\n${skill.body.trim()}${requiresNote}\n`;
    await mkdir(join(distRoot, 'cursor', skill.name), { recursive: true });
    await writeFile(join(distRoot, 'cursor', skill.name, 'SKILL.md'), content);
    if (skill.sidecar) {
      const sourceSkillPath = join(buildRoot, 'plugins', 'skillsforge', 'skills', skill.name, 'SKILL.md');
      const distSkillPath = join(distRoot, 'claude-code', 'skills', skill.name, 'SKILL.md');
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

  const compiledPolicies = [];
  for (const skill of sidecarSkills) {
    const source = await readFile(
      join(buildRoot, 'plugins', 'skillsforge', 'skills', skill.name, 'SKILL.md'),
      'utf8'
    );
    if (/\bPreToolUse\b/.test(source)) compiledPolicies.push(skill.name);
  }

  await writeFile(join(distRoot, 'trust-receipt.json'), receipt.text);
  await writeFile(join(distRoot, 'cursor-lossiness.json'), `${JSON.stringify(lossiness, null, 2)}\n`);
  await writeFile(join(distRoot, 'build-report.json'), `${JSON.stringify({
    ok: true,
    receiptHash: receipt.receiptHash,
    evaluation: normalizedEval,
    hostValidation,
    compiledPolicies
  }, null, 2)}\n`);

  return { ok: true, receiptHash: receipt.receiptHash, evaluation: normalizedEval, lossiness, hostValidation };
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
  console.log(`BUILD DIST OK receipt=${result.receiptHash}`);
}
