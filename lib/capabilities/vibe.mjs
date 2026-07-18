import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { loadCatalog, catalogStats, listPacks, listProfiles } from './catalog.mjs';
import { scoreSkillQuality } from './quality.mjs';
import { loadAllSkills } from './skill-loader.mjs';

const ARTIFACTS = [
  'brief.md',
  'plan.md',
  'design-lock.md',
  'findings.md',
  'ship-notes.md',
  'proof.md',
  'learning.md'
];

export async function runVibe(root, options = {}) {
  const workRoot = join(root, 'docs', 'work');
  await mkdir(workRoot, { recursive: true });
  const created = [];
  for (const name of ARTIFACTS) {
    const path = join(workRoot, name);
    try {
      await access(path);
    } catch {
      await writeFile(path, `# ${name.replace('.md', '')}\n\n_Stub created by \`skillsforge vibe\`. Fill this in as you work._\n`);
      created.push(name);
    }
  }

  let catalogInfo = null;
  try {
    const { catalog } = await loadCatalog(root);
    catalogInfo = {
      stats: catalogStats(catalog),
      packs: listPacks(catalog).map((p) => ({ id: p.id, skills: p.skillCount })),
      profiles: listProfiles(catalog)
    };
  } catch (error) {
    catalogInfo = { error: error.message };
  }

  const skills = await loadAllSkills(root);
  const sample = skills.slice(0, 5);
  const quality = [];
  for (const skill of sample) {
    quality.push(await scoreSkillQuality(skill.directory, { root }));
  }
  const avg = quality.length
    ? Math.round(quality.reduce((sum, item) => sum + item.score, 0) / quality.length)
    : 0;

  const lines = [
    'SkillsForge vibe — magical moment',
    '',
    `Skills loaded: ${skills.length}`,
    catalogInfo.stats
      ? `Catalog: ${catalogInfo.stats.skills} skills across ${catalogInfo.stats.packs} packs (${catalogInfo.stats.profiles} profiles)`
      : `Catalog: unavailable (${catalogInfo.error})`,
    `Work artifacts: docs/work/ (${created.length ? `created ${created.join(', ')}` : 'already present'})`,
    `Sample quality avg (first ${quality.length} skills): ${avg}/100`,
    '',
    'Next:',
    '  skillsforge catalog --pack eng',
    '  skillsforge quality --skill plugins/skillsforge/skills/using-skillsforge',
    '  skillsforge route --query "validate this skill"',
    ''
  ];

  if (options.json) {
    return {
      ok: true,
      text: lines.join('\n'),
      data: { skills: skills.length, catalog: catalogInfo, created, quality, avg }
    };
  }
  return { ok: true, text: lines.join('\n'), data: { skills: skills.length, catalog: catalogInfo, created, quality, avg } };
}
