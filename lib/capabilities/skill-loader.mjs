import { access, readFile, readdir, realpath, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { parseFrontmatter } from '../../scripts/validate-skill-lib.mjs';
import { parseDocument } from 'yaml';
import { validateWithSchema } from '../../scripts/schema-lib.mjs';
import { schemas } from '../../scripts/schemas.generated.mjs';

const sidecarSchema = schemas['skillsforge.sidecar'];

export async function loadSkill(dir, options = {}) {
  const abs = resolve(options.root ?? process.cwd(), dir);
  const skillFile = join(abs, 'SKILL.md');
  const source = await readFile(skillFile, 'utf8');
  const parsed = parseFrontmatter(source);
  if (!parsed) throw new Error(`SKILL.md frontmatter missing in ${abs}`);

  const document = parseDocument(parsed.yaml, { prettyErrors: true, strict: true, uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join('; '));
  }
  const front = document.toJS() ?? {};
  const sidecarFile = join(abs, 'skillsforge.json');
  let sidecar = null;
  let sidecarExists = false;
  try {
    await access(sidecarFile);
    sidecarExists = true;
    sidecar = JSON.parse(await readFile(sidecarFile, 'utf8'));
    const result = await validateWithSchema(sidecarSchema, sidecar);
    if (!result.valid) {
      throw new Error(result.errors.map((error) => `skillsforge.json ${error}`).join('; '));
    }
  } catch (error) {
    if (sidecarExists) throw error;
  }

  const files = await collectFiles(abs);
  for (const file of files) {
    if (!await realPathIsInside(abs, file)) {
      throw new Error(`skill file escapes skill root: ${relative(abs, file)}`);
    }
  }

  return {
    name: typeof front.name === 'string' ? front.name : basename(abs),
    description: typeof front.description === 'string' ? front.description : '',
    body: parsed.body,
    directory: abs,
    skillFile,
    sidecarFile: sidecarExists ? sidecarFile : null,
    sidecar,
    requires: Array.isArray(sidecar?.requires) ? sidecar.requires : [],
    maturity: sidecar?.maturity ?? 'experimental',
    files
  };
}

/** In-memory skill index cache keyed by root + mtime fingerprint. */
const skillIndexCache = new Map();

export function clearSkillIndexCache() {
  skillIndexCache.clear();
}

async function skillsRootsFingerprint(skillsRoots) {
  const parts = [];
  for (const skillsRoot of skillsRoots) {
    try {
      const st = await stat(skillsRoot);
      parts.push(`${skillsRoot}:${st.mtimeMs}`);
      const entries = await readdir(skillsRoot, { withFileTypes: true });
      parts.push(String(entries.filter((e) => e.isDirectory()).length));
    } catch {
      parts.push(`${skillsRoot}:missing`);
    }
  }
  return parts.join('|');
}

export async function loadAllSkills(root, options = {}) {
  const absRoot = resolve(root);
  const skillsRoots = await discoverSkillsRoots(absRoot);
  const fingerprint = await skillsRootsFingerprint(skillsRoots);
  const cacheKey = absRoot;
  if (!options.noCache) {
    const hit = skillIndexCache.get(cacheKey);
    if (hit && hit.fingerprint === fingerprint) {
      return hit.skills;
    }
  }

  const skills = [];
  const errors = [];
  for (const skillsRoot of skillsRoots) {
    let entries = [];
    try {
      entries = await readdir(skillsRoot, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      const candidate = join(skillsRoot, entry.name);
      try {
        await access(join(candidate, 'SKILL.md'));
      } catch {
        continue;
      }
      try {
        skills.push(await loadSkill(candidate));
      } catch (error) {
        errors.push({ directory: candidate, message: error.message });
      }
    }
  }
  if (errors.length > 0) {
    const details = errors.map((error) => `${error.directory}: ${error.message}`).join('\n');
    throw new Error(`failed to load skills:\n${details}`);
  }
  skillIndexCache.set(cacheKey, { fingerprint, skills });
  return skills;
}

async function discoverSkillsRoots(root) {
  const roots = [join(root, 'skills')];
  const pluginsRoot = join(root, 'plugins');
  try {
    const plugins = await readdir(pluginsRoot, { withFileTypes: true });
    for (const plugin of plugins.sort((a, b) => a.name.localeCompare(b.name))) {
      if (plugin.isDirectory()) roots.push(join(pluginsRoot, plugin.name, 'skills'));
    }
  } catch {
    // optional
  }
  return roots;
}

async function collectFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collectFiles(path));
    else out.push(path);
  }
  return out.sort((left, right) => left.localeCompare(right));
}

function isInside(parent, candidate) {
  const path = relative(resolve(parent), resolve(candidate));
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path));
}

async function realPathIsInside(parent, candidate) {
  try {
    return isInside(await realpath(parent), await realpath(candidate));
  } catch {
    return false;
  }
}
