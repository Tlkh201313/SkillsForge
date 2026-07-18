import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { validateWithSchema } from '../../scripts/schema-lib.mjs';
import { schemas } from '../../scripts/schemas.generated.mjs';

const catalogSchema = schemas['skillsforge.catalog'];

export async function loadCatalog(root) {
  const abs = resolve(root);
  const catalogPath = join(abs, 'catalog', 'skillsforge.catalog.yaml');
  const source = await readFile(catalogPath, 'utf8');
  const document = parseDocument(source, { prettyErrors: true, strict: true, uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join('; '));
  }
  const catalog = document.toJS();
  if (catalogSchema) {
    const result = await validateWithSchema(catalogSchema, catalog);
    if (!result.valid) {
      throw new Error(result.errors.map((error) => `catalog ${error}`).join('; '));
    }
  }
  return { path: catalogPath, catalog };
}

export function listPacks(catalog) {
  return Object.entries(catalog.packs ?? {}).map(([id, pack]) => ({
    id,
    description: pack.description,
    skillCount: pack.skills?.length ?? 0,
    skills: [...(pack.skills ?? [])]
  })).sort((a, b) => a.id.localeCompare(b.id));
}

export function listProfiles(catalog) {
  return Object.entries(catalog.profiles ?? {}).map(([id, profile]) => ({
    id,
    description: profile.description,
    packs: [...(profile.packs ?? [])]
  })).sort((a, b) => a.id.localeCompare(b.id));
}

export function skillsForProfile(catalog, profileId) {
  const profile = catalog.profiles?.[profileId];
  if (!profile) return null;
  const skills = new Set();
  for (const packId of profile.packs) {
    for (const skill of catalog.packs?.[packId]?.skills ?? []) skills.add(skill);
  }
  return [...skills].sort();
}

export function skillsForPack(catalog, packId) {
  const pack = catalog.packs?.[packId];
  if (!pack) return null;
  return [...(pack.skills ?? [])];
}

export function searchCatalog(catalog, query) {
  const q = String(query ?? '').toLowerCase().trim();
  if (!q) return [];
  const hits = [];
  for (const [packId, pack] of Object.entries(catalog.packs ?? {})) {
    for (const skill of pack.skills ?? []) {
      if (skill.includes(q) || packId.includes(q) || pack.description?.toLowerCase().includes(q)) {
        hits.push({ skill, pack: packId });
      }
    }
  }
  return hits.sort((a, b) => a.skill.localeCompare(b.skill));
}

export function catalogStats(catalog) {
  const packs = listPacks(catalog);
  const skillSet = new Set();
  for (const pack of packs) for (const skill of pack.skills) skillSet.add(skill);
  return {
    packs: packs.length,
    profiles: listProfiles(catalog).length,
    skills: skillSet.size
  };
}
