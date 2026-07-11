import { access, readFile, readdir, realpath, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';
import { validateWithSchema } from './schema-lib.mjs';
import { skillSchemasByProfile } from './schemas.generated.mjs';

const adjacentSkillsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'skills');

export async function validateSkillPaths(paths, options = {}) {
  const root = options.root ?? process.cwd();
  const profile = options.profile ?? 'canonical';
  const selected = options.all ? await discoverRealSkills(root) : await expandSkillPathPatterns(paths, root);

  if (selected.length === 0) {
    const ok = options.allowEmpty === true;
    return {
      ok,
      reports: [],
      text: ok ? 'No skills found.\n' : 'FAIL No skills found.\n'
    };
  }

  const reports = [];
  for (const path of selected) reports.push(await validateSkillPath(path, { root, profile }));
  const text = `${reports.map(formatReport).join('\n')}\n`;
  return { ok: reports.every((report) => report.status === 'pass'), reports, text };
}

export async function validateSkillPath(skillPath, options = {}) {
  const root = options.root ?? process.cwd();
  const profile = options.profile ?? 'canonical';
  const schema = skillSchemasByProfile[profile];
  if (!schema) throw new Error(`Unknown validation profile: ${profile}`);

  const absolute = resolve(root, skillPath);
  const name = basename(absolute);
  const file = join(absolute, 'SKILL.md');
  const errors = [];
  let source;

  try {
    source = await readFile(file, 'utf8');
  } catch {
    return failReport(name, absolute, ['SKILL.md must exist']);
  }

  const parsed = parseFrontmatter(source);
  if (!parsed) return failReport(name, absolute, ['YAML frontmatter block must exist and use complete --- delimiter lines']);

  const document = parseDocument(parsed.yaml, {
    prettyErrors: true,
    strict: true,
    uniqueKeys: true
  });
  if (document.errors.length > 0) {
    errors.push(...document.errors.map((error) => `invalid YAML: ${firstLine(error.message)}`));
  }

  let data;
  if (document.errors.length === 0) {
    data = document.toJS();
    if (!isPlainObject(data)) {
      errors.push('frontmatter must be a YAML mapping');
    } else {
      const schemaResult = await validateWithSchema(schema, data);
      errors.push(...schemaResult.errors.map((error) => `frontmatter ${error}`));
      if (typeof data.name === 'string' && data.name !== name) errors.push('name must equal directory name');
    }
  }

  await validateBody(parsed.body, absolute, errors);
  return errors.length === 0
    ? { name, path: absolute, profile, status: 'pass', errors: [] }
    : failReport(name, absolute, errors, profile);
}

export function parseFrontmatter(source) {
  const normalized = source.startsWith('\uFEFF') ? source.slice(1) : source;
  const match = normalized.match(/^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/);
  if (!match) return null;
  return {
    yaml: match[1],
    body: normalized.slice(match[0].length)
  };
}

async function validateBody(body, skillDirectory, errors) {
  if (body.trim() === '') errors.push('body must contain skill instructions');

  const links = body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);
  for (const [, rawTarget] of links) {
    const target = normalizeMarkdownTarget(rawTarget);
    if (target === '' || target.startsWith('#') || /^(https?|mailto):/i.test(target)) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) {
      errors.push(`markdown link uses unsupported URI scheme: ${rawTarget}`);
      continue;
    }

    const clean = target.split('#')[0];
    if (clean === '') continue;
    const resolved = resolve(skillDirectory, clean);
    if (!isInside(skillDirectory, resolved)) {
      errors.push(`relative markdown link must stay inside skill directory: ${rawTarget}`);
      continue;
    }
    if (!await fileExists(resolved)) {
      errors.push(`relative markdown link must resolve: ${rawTarget}`);
      continue;
    }
    if (!await realPathIsInside(skillDirectory, resolved)) {
      errors.push(`relative markdown link resolves outside skill directory: ${rawTarget}`);
    }
  }
}

function normalizeMarkdownTarget(rawTarget) {
  const withoutTitle = rawTarget.trim().replace(/^<|>$/g, '').split(/\s+["']/)[0];
  try {
    return decodeURIComponent(withoutTitle);
  } catch {
    return withoutTitle;
  }
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

function formatReport(report) {
  if (report.status === 'pass') return `PASS ${report.name} (${report.profile})`;
  return [`FAIL ${report.name}`, ...report.errors.map((error) => `  - ${error}`)].join('\n');
}

export async function expandSkillPathPatterns(patterns, root) {
  const expanded = [];
  for (const pattern of pathsWithoutDuplicates(patterns)) {
    if (!pattern.includes('*')) {
      expanded.push(pattern);
      continue;
    }

    const normalized = pattern.replaceAll('\\', '/');
    const slash = normalized.lastIndexOf('/');
    const parent = slash === -1 ? '.' : normalized.slice(0, slash);
    const namePattern = slash === -1 ? normalized : normalized.slice(slash + 1);
    const regex = new RegExp(`^${namePattern.split('*').map(escapeRegex).join('.*')}$`);
    let entries;
    try {
      entries = await readdir(resolve(root, parent), { withFileTypes: true });
    } catch {
      expanded.push(pattern);
      continue;
    }
    const matches = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !regex.test(entry.name)) continue;
      const candidate = join(parent, entry.name);
      if (await fileExists(resolve(root, candidate, 'SKILL.md'))) matches.push(candidate);
    }
    matches.sort((left, right) => left.localeCompare(right));
    expanded.push(...(matches.length === 0 ? [pattern] : matches));
  }
  return expanded;
}

async function discoverRealSkills(root) {
  const skillsRoots = [join(root, 'skills'), adjacentSkillsRoot];
  const pluginsRoot = join(root, 'plugins');
  try {
    const plugins = await readdir(pluginsRoot, { withFileTypes: true });
    for (const plugin of plugins) {
      if (plugin.isDirectory()) skillsRoots.push(join(pluginsRoot, plugin.name, 'skills'));
    }
  } catch {
    // A standalone skill library or installed plugin may not have a plugins directory.
  }

  const paths = [];
  for (const skillsRoot of pathsWithoutDuplicates(skillsRoots)) {
    paths.push(...await discoverSkillsInDirectory(skillsRoot));
  }
  return pathsWithoutDuplicates(paths);
}

async function discoverSkillsInDirectory(skillsRoot) {
  try {
    const entries = await readdir(skillsRoot, { withFileTypes: true });
    const paths = [];
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (!entry.isDirectory()) continue;
      const candidate = join(skillsRoot, entry.name);
      try {
        await access(join(candidate, 'SKILL.md'));
        paths.push(candidate);
      } catch {
        // A non-skill directory under skills/ is ignored.
      }
    }
    return paths;
  } catch {
    return [];
  }
}

function failReport(name, path, errors, profile = 'canonical') {
  return { name, path, profile, status: 'fail', errors };
}

function fileExists(path) {
  return stat(path).then(() => true, () => false);
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function firstLine(value) {
  return value.split('\n')[0];
}

function isPlainObject(value) {
  return value !== null && !Array.isArray(value) && typeof value === 'object';
}

function pathsWithoutDuplicates(paths) {
  return [...new Set(paths)];
}
