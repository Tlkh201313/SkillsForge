import { join } from 'node:path';
import { loadCatalog, listPacks, listProfiles, searchCatalog, catalogStats, skillsForPack, skillsForProfile } from '../../../lib/capabilities/catalog.mjs';
import { runVibe } from '../../../lib/capabilities/vibe.mjs';
import { scoreSkillQuality, lintSkill } from '../../../lib/capabilities/quality.mjs';
import { scaffoldSkill } from '../../../lib/capabilities/scaffold.mjs';
import { runBench, runScorecard, runCompose, runStocktake, runPressure } from '../../../lib/capabilities/bench.mjs';
import { runSkillShield } from '../../../lib/capabilities/skillshield.mjs';
import { loadAllSkills } from '../../../lib/capabilities/skill-loader.mjs';
import { resolveUnderRoot } from '../../../lib/capabilities/paths.mjs';
import {
  consumeFlag, consumeOption, resolveRuntimeRoot, resolveUserPath, usage, hasUnknownOption, pathExists
} from '../shared.mjs';

export async function runVibeCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const root = await resolveRuntimeRoot(options);
  const result = await runVibe(root, { json });
  if (json) process.stdout.write(`${JSON.stringify(result.data, null, 2)}\n`);
  else process.stdout.write(result.text);
  return result.ok ? 0 : 1;
}

export async function runCatalogCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const pack = consumeOption(args, '--pack');
  const profile = consumeOption(args, '--profile');
  const search = consumeOption(args, '--search');
  if (pack === null || profile === null || search === null) {
    process.stderr.write('option requires a value\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const { catalog } = await loadCatalog(root);
  let payload;
  if (search) payload = { search, hits: searchCatalog(catalog, search) };
  else if (pack) payload = { pack, skills: skillsForPack(catalog, pack) };
  else if (profile) payload = { profile, skills: skillsForProfile(catalog, profile) };
  else {
    payload = {
      stats: catalogStats(catalog),
      packs: listPacks(catalog),
      profiles: listProfiles(catalog)
    };
  }
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  }
  return 0;
}

export async function runQualityCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const skill = consumeOption(args, '--skill');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (!skill) {
    process.stderr.write('usage: skillsforge quality --skill <dir>\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let skillDir;
  try {
    skillDir = resolveUserPath(root, skill, allowAbsolute);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  const result = await scoreSkillQuality(skillDir, { root });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.pass ? 0 : 1;
}

export async function runLintSkillCommand(argv, options) {
  const args = [...argv];
  const skill = consumeOption(args, '--skill');
  const thresholdRaw = consumeOption(args, '--threshold');
  const hero = consumeFlag(args, '--hero');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (!skill) {
    process.stderr.write('usage: skillsforge lint-skill --skill <dir> [--threshold n] [--hero]\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let skillDir;
  try {
    skillDir = resolveUserPath(root, skill, allowAbsolute);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  const result = await lintSkill(skillDir, {
    root,
    threshold: thresholdRaw ? Number(thresholdRaw) : 70,
    hero
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

export async function runScaffoldCommand(argv, options) {
  const args = [...argv];
  const name = consumeOption(args, '--name');
  const pack = consumeOption(args, '--pack') ?? 'eng';
  const mode = consumeOption(args, '--mode') ?? 'explicit';
  const write = consumeFlag(args, '--write');
  const force = consumeFlag(args, '--force');
  if (!name) {
    process.stderr.write('usage: skillsforge scaffold --name <id> [--pack <id>] [--mode auto|explicit] [--write] [--force]\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const result = await scaffoldSkill(root, { name, pack, mode }, { write, force, dryRun: !write });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

export async function runBenchCommand(argv, options) {
  const root = await resolveRuntimeRoot(options);
  const result = await runBench(root);
  process.stdout.write(`${JSON.stringify(result.summary, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

export async function runScorecardCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const root = await resolveRuntimeRoot(options);
  const result = await runScorecard(root);
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatPackScorecard(result, { color: true })}\n`);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
  return 0;
}

export async function runComposeCommand(argv, options) {
  const args = [...argv];
  const workflow = consumeOption(args, '--workflow');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (!workflow) {
    process.stderr.write('usage: skillsforge compose --workflow <file>\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let workflowPath;
  try {
    workflowPath = resolveUnderRoot(root, workflow, { allowAbsolute });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  const result = await runCompose(root, workflowPath);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

export async function runStocktakeCommand(argv, options) {
  const root = await resolveRuntimeRoot(options);
  const result = await runStocktake(root);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.missing.length === 0 ? 0 : 1;
}

export async function runBatchCommand(argv, options) {
  const args = [...argv];
  const pack = consumeOption(args, '--pack');
  const action = consumeOption(args, '--action') ?? 'quality';
  if (!pack) {
    process.stderr.write('usage: skillsforge batch --pack <id> --action quality|validate|skillshield\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const { catalog } = await loadCatalog(root);
  const ids = skillsForPack(catalog, pack) ?? [];
  const reports = [];
  for (const id of ids) {
    const dir = join(root, 'plugins', 'skillsforge', 'skills', id);
    if (!(await pathExists(dir))) {
      reports.push({ id, ok: false, error: 'missing' });
      continue;
    }
    if (action === 'quality') reports.push({ id, ...(await scoreSkillQuality(dir, { root })) });
    else if (action === 'skillshield') reports.push({ id, ...(await runSkillShield(dir, { root })) });
    else {
      const { verifySkillPaths } = await import('../../../lib/capabilities/verify.mjs');
      const v = await verifySkillPaths([dir], { root, profile: 'claude-code' });
      reports.push({ id, ok: v.ok });
    }
  }
  const ok = reports.every((r) => r.ok || r.pass);
  process.stdout.write(`${JSON.stringify({ pack, action, ok, reports }, null, 2)}\n`);
  return ok ? 0 : 1;
}

export async function runPressureCommand(argv, options) {
  const args = [...argv];
  const skill = consumeOption(args, '--skill');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (!skill) {
    process.stderr.write('usage: skillsforge pressure --skill <dir>\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let skillDir;
  try {
    skillDir = resolveUserPath(root, skill, allowAbsolute);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  const result = await runPressure(skillDir);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}
