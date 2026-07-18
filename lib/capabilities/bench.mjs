import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadAllSkills } from './skill-loader.mjs';
import { routeQuery } from './router.mjs';
import { validateSkillPath } from '../../scripts/validate-skill-lib.mjs';

export async function runBench(root, options = {}) {
  const skills = await loadAllSkills(root);
  const queries = options.queries ?? [
    'validate this agent skill',
    'what is skillsforge',
    'forge a new capability skill',
    'route this query to a skill',
    'verify capability receipt'
  ];
  const routeSamples = [];
  const t0 = performance.now();
  for (const query of queries) {
    const start = performance.now();
    routeQuery(query, skills, { includeExplicit: false });
    routeSamples.push(performance.now() - start);
  }
  const validateSamples = [];
  for (const skill of skills.slice(0, Math.min(10, skills.length))) {
    const start = performance.now();
    await validateSkillPath(skill.directory, { root });
    validateSamples.push(performance.now() - start);
  }
  const summary = {
    skills: skills.length,
    route: stats(routeSamples),
    validate: stats(validateSamples),
    totalMs: Math.round(performance.now() - t0),
    ts: new Date().toISOString()
  };
  const outDir = join(root, 'artifacts', 'bench');
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, 'latest.json');
  await writeFile(outPath, `${JSON.stringify(summary, null, 2)}\n`);
  return { ok: true, path: outPath, summary };
}

function stats(samples) {
  if (samples.length === 0) return { count: 0, p50: 0, p95: 0, max: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
  return {
    count: samples.length,
    p50: Number(pct(50).toFixed(3)),
    p95: Number(pct(95).toFixed(3)),
    max: Number(sorted[sorted.length - 1].toFixed(3))
  };
}

export async function runScorecard(root) {
  const skills = await loadAllSkills(root);
  let catalogPacks = {};
  try {
    const { loadCatalog, listPacks } = await import('./catalog.mjs');
    const { catalog } = await loadCatalog(root);
    for (const pack of listPacks(catalog)) {
      catalogPacks[pack.id] = pack.skillCount;
    }
  } catch {
    catalogPacks = {};
  }
  const byPack = {};
  for (const skill of skills) {
    const pack = skill.sidecar?.routing?.pack ?? 'unpacked';
    byPack[pack] = (byPack[pack] ?? 0) + 1;
  }
  let bench = null;
  try {
    bench = JSON.parse(await readFile(join(root, 'artifacts', 'bench', 'latest.json'), 'utf8'));
  } catch {
    bench = null;
  }
  return {
    skills: skills.length,
    byPack,
    catalogPacks,
    bench
  };
}

export async function runCompose(root, workflowPath) {
  const workflow = JSON.parse(await readFile(workflowPath, 'utf8'));
  const skills = await loadAllSkills(root);
  const byName = new Map(skills.map((s) => [s.name, s]));
  const steps = workflow.steps ?? [];
  const results = [];
  for (const step of steps) {
    const skill = byName.get(step.skill);
    if (!skill) {
      results.push({ step: step.id ?? step.skill, ok: false, error: `missing skill ${step.skill}` });
      continue;
    }
    results.push({
      step: step.id ?? step.skill,
      ok: true,
      skill: skill.name,
      pack: skill.sidecar?.routing?.pack ?? null,
      note: step.note ?? 'invoke skill'
    });
  }
  return { ok: results.every((r) => r.ok), workflow: workflow.name ?? 'unnamed', results };
}

export async function runStocktake(root) {
  const skills = await loadAllSkills(root);
  let catalogSkills = new Set();
  try {
    const { loadCatalog, listPacks } = await import('./catalog.mjs');
    const { catalog } = await loadCatalog(root);
    for (const pack of listPacks(catalog)) {
      for (const id of pack.skills) catalogSkills.add(id);
    }
  } catch {
    catalogSkills = new Set();
  }
  const installed = new Set(skills.map((s) => s.name));
  const missing = [...catalogSkills].filter((id) => !installed.has(id)).sort();
  const extra = [...installed].filter((id) => catalogSkills.size && !catalogSkills.has(id)).sort();
  return {
    installed: installed.size,
    catalog: catalogSkills.size,
    missing,
    extra
  };
}

export async function listPressureFixtures(skillDir) {
  const dir = join(skillDir, 'pressure');
  try {
    const entries = await readdir(dir);
    return entries.filter((name) => name.endsWith('.json')).map((name) => join(dir, name));
  } catch {
    return [];
  }
}

export async function runPressure(skillDir, options = {}) {
  const fixtures = await listPressureFixtures(skillDir);
  if (fixtures.length === 0) {
    return { ok: options.allowMissing === true, skill: skillDir, fixtures: 0, results: [], error: 'no pressure fixtures' };
  }
  const results = [];
  for (const fixturePath of fixtures) {
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
    const baselineViolations = fixture.baselineViolations ?? [];
    const expectedCompliance = fixture.expectedCompliance ?? [];
    const withSkillOk = expectedCompliance.length > 0;
    results.push({
      fixture: fixturePath,
      baselineFailCount: baselineViolations.length,
      complianceChecks: expectedCompliance.length,
      ok: baselineViolations.length > 0 && withSkillOk
    });
  }
  return {
    ok: results.every((r) => r.ok),
    skill: skillDir,
    fixtures: fixtures.length,
    results,
    note: 'Pressure is a fixture gate (shape of baselineViolations/expectedCompliance); behavioral agent pressure is expanding.'
  };
}
