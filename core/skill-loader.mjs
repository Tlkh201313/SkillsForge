import { readFile, readdir } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

export async function loadSkill(dir) {
  const abs = resolve(dir);
  const source = await readFile(join(abs, 'SKILL.md'), 'utf8');
  const end = source.indexOf('\n---', 4);
  const yaml = source.slice(4, end);
  const body = source.slice(end + 4);
  const front = {};
  let listKey = null;
  for (const line of yaml.split(/\r?\n/)) {
    const item = line.match(/^\s*-\s+(.+)$/);
    if (item && listKey) {
      front[listKey].push(item[1].trim());
      continue;
    }
    const pair = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (!pair) continue;
    if (pair[2] === undefined || pair[2] === '') {
      front[pair[1]] = [];
      listKey = pair[1];
      continue;
    }
    front[pair[1]] = pair[2].trim();
    listKey = null;
  }
  let sidecar = null;
  try {
    sidecar = JSON.parse(await readFile(join(abs, 'skillsforge.json'), 'utf8'));
  } catch {
    // optional sidecar
  }
  return {
    name: front.name ?? basename(abs),
    description: front.description ?? '',
    maturity: front.maturity ?? 'experimental',
    platform: front.platform ?? 'canonical',
    requires: Array.isArray(front.requires) ? front.requires : [],
    dir: abs,
    body,
    sidecar
  };
}

export async function loadAllSkills(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const skills = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    try {
      skills.push(await loadSkill(join(root, entry.name)));
    } catch {
      // skip non-skill directories
    }
  }
  return skills;
}
