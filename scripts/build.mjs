import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSkills } from '../core/skill-loader.mjs';
import { analyzeDependencies } from '../core/dependency-graph.mjs';
import { validateSkillPaths } from './validate-skill-lib.mjs';
import { scanSkill } from '../policy/scan-skill.mjs';
import { emitClaude } from '../adapters/claude-code.mjs';
import { emitCursor } from '../adapters/cursor.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

async function emptyDist() {
  const dist = join(root, 'dist');
  await rm(dist, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  await mkdir(dist, { recursive: true });
}

export async function runBuild(options = {}) {
  const resolvedSkillsRoot = join(root, options.skillsRoot ?? 'skills');
  const skills = await loadAllSkills(resolvedSkillsRoot);

  if (skills.length === 0) {
    return { ok: false, blocked: [{ rule: 'no-skills', message: 'no skills found' }], receiptHash: null };
  }

  if (!options.skillsRoot) {
    const validation = await validateSkillPaths(
      skills.map((skill) => skill.dir),
      { root }
    );
    if (!validation.ok) {
      return {
        ok: false,
        blocked: validation.reports.filter((r) => r.status === 'fail').map((r) => ({
          rule: 'validation',
          skill: r.name,
          errors: r.errors
        })),
        receiptHash: null
      };
    }
  }

  const graph = analyzeDependencies(skills);
  if (graph.cycles.length || graph.missing.length || graph.duplicates.length) {
    return {
      ok: false,
      blocked: [
        ...graph.cycles.map((cycle) => ({ rule: 'dependency-cycle', cycle })),
        ...graph.missing.map((item) => ({ rule: 'missing-dependency', ...item })),
        ...graph.duplicates.map((name) => ({ rule: 'duplicate-name', name }))
      ],
      receiptHash: null
    };
  }

  const blocked = [];
  for (const skill of skills) {
    const findings = await scanSkill(skill);
    for (const finding of findings.filter((f) => f.blocking)) {
      blocked.push({ skill: skill.name, ...finding });
    }
  }
  if (blocked.length > 0) {
    return { ok: false, blocked, receiptHash: null };
  }

  await emptyDist();

  const claude = await emitClaude(skills, join(root, 'dist', 'claude-code'), { root });
  const cursor = await emitCursor(skills, join(root, 'dist', 'cursor'));

  let evaluation = null;
  try {
    evaluation = JSON.parse(await readFile(join(root, 'artifacts', 'evaluation', 'routing-report.json'), 'utf8'));
  } catch {
    // optional
  }

  const receipt = {
    version: '0.2.0',
    skills: await Promise.all(skills.map(async (skill) => ({
      name: skill.name,
      sha256: sha256(await readFile(join(skill.dir, 'SKILL.md'), 'utf8')),
      capabilities: skill.sidecar?.capabilities ?? null,
      requires: skill.requires,
      provenance: skill.sidecar?.provenance ?? null
    }))),
    dependencyOrder: graph.order,
    claude: { skillCount: claude.skillCount, emitted: claude.emitted },
    cursor: { emitted: cursor.emitted },
    evaluation: evaluation
      ? { total: evaluation.total, tp: evaluation.tp, fp: evaluation.fp, fn: evaluation.fn, tn: evaluation.tn }
      : null
  };

  const receiptText = `${JSON.stringify(receipt, null, 2)}\n`;
  await writeFile(join(root, 'dist', 'trust-receipt.json'), receiptText);
  await writeFile(join(root, 'dist', 'cursor-lossiness.json'), `${JSON.stringify(cursor.lossiness, null, 2)}\n`);
  await writeFile(join(root, 'dist', 'build-report.json'), `${JSON.stringify({
    ok: true,
    claude,
    cursor: { emitted: cursor.emitted, lossinessCount: cursor.lossiness.length }
  }, null, 2)}\n`);

  return {
    ok: true,
    blocked: [],
    receiptHash: sha256(receiptText),
    receipt
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = await runBuild();
  if (!result.ok) {
    console.error('BUILD BLOCKED');
    console.error(JSON.stringify(result.blocked, null, 2));
    process.exit(1);
  }
  console.log(`BUILD OK receipt=${result.receiptHash}`);
  console.log(`skills=${result.receipt.skills.length} order=${result.receipt.dependencyOrder.join(',')}`);
}
