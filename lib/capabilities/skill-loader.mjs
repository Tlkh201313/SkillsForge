import { access, readFile, readdir, realpath, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
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
  const home = resolve(options.home ?? homedir());
  const skillsRoots = await discoverSkillsRoots(absRoot, options);
  const fingerprint = await skillsRootsFingerprint(skillsRoots);
  const cacheKey = [
    absRoot,
    options.includeInstalled === true ? 'installed' : 'repo',
    home
  ].join('|');
  if (!options.noCache) {
    const hit = skillIndexCache.get(cacheKey);
    if (hit && hit.fingerprint === fingerprint) {
      if (options.collectErrors === true) {
        return { skills: hit.skills, errors: hit.errors ?? [], ok: (hit.coreErrors ?? 0) === 0 };
      }
      return hit.skills;
    }
  }

  const skills = [];
  const errors = [];
  const coreErrors = [];
  for (const skillsRoot of skillsRoots) {
    const optional = options.includeInstalled === true
      && isOptionalInstalledRoot(skillsRoot, absRoot, home);
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
        const skill = await loadSkill(candidate);
        skill.sourceRoot = skillsRoot;
        skills.push(skill);
      } catch (error) {
        const item = { directory: candidate, message: error.message, optional };
        errors.push(item);
        if (!optional) coreErrors.push(item);
      }
    }
  }

  skillIndexCache.set(cacheKey, {
    fingerprint,
    skills,
    errors,
    coreErrors: coreErrors.length
  });

  if (options.collectErrors === true) {
    return { skills, errors, ok: coreErrors.length === 0 };
  }

  // Tolerate load failures only for optional installed-host roots.
  if (coreErrors.length > 0 && options.tolerateErrors !== true) {
    const details = coreErrors.map((error) => `${error.directory}: ${error.message}`).join('\n');
    throw new Error(`failed to load skills:\n${details}`);
  }
  return skills;
}

function isOptionalInstalledRoot(skillsRoot, absRoot, home) {
  return isInside(home, skillsRoot) && !isInside(absRoot, skillsRoot);
}

export async function discoverSkillsRoots(root, options = {}) {
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
  if (options.includeInstalled === true) {
    const home = resolve(options.home ?? homedir());
    roots.push(
      join(home, '.codex', 'skills'),
      join(home, '.codex', 'skills', '.system'),
      join(home, '.agents', 'skills'),
      join(home, '.claude', 'skills'),
      join(home, '.cursor', 'skills'),
      join(home, '.config', 'opencode', 'skills'),
      join(home, '.zcode', 'skills'),
      join(home, '.hermes', 'skills'),
      join(home, '.gemini', 'skills')
    );
    roots.push(...await discoverCachedSkillRoots(join(home, '.codex', 'plugins', 'cache')));
  }
  return dedupePaths(roots);
}

async function discoverCachedSkillRoots(cacheRoot) {
  const roots = [];
  const maxDepth = 8;
  async function walk(dir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    if (basename(dir) === 'skills' && await hasSkillChildren(dir)) {
      roots.push(dir);
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      await walk(join(dir, entry.name), depth + 1);
    }
  }
  await walk(resolve(cacheRoot), 0);
  return roots;
}

async function hasSkillChildren(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await access(join(dir, entry.name, 'SKILL.md'));
      return true;
    } catch {
      // not a skill dir
    }
  }
  return false;
}

function dedupePaths(paths) {
  const seen = new Set();
  const out = [];
  for (const path of paths.map((item) => resolve(item))) {
    const key = process.platform === 'win32' ? path.toLowerCase() : path;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(path);
  }
  return out;
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
