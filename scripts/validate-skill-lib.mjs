import { access, readFile, readdir, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';

const maturityValues = ['experimental', 'stable', 'deprecated'];
const platformValues = ['canonical', 'claude-code', 'codex', 'cursor', 'opencode'];

export async function validateSkillPaths(paths, options = {}) {
  const root = options.root ?? process.cwd();
  const selected = options.all ? await discoverRealSkills(root) : await expandSkillPathPatterns(paths, root);

  if (selected.length === 0) {
    return { ok: true, reports: [], text: 'No skills found.\n' };
  }

  const reports = [];
  for (const path of selected) reports.push(await validateSkillPath(path, { root }));
  const text = reports.map(formatReport).join('\n') + '\n';
  return { ok: reports.every((report) => report.status === 'pass'), reports, text };
}

export async function validateSkillPath(skillPath, options = {}) {
  const root = options.root ?? process.cwd();
  const absolute = resolve(root, skillPath);
  const name = basename(absolute);
  const file = join(absolute, 'SKILL.md');
  const errors = [];
  let source = '';

  try {
    source = await readFile(file, 'utf8');
  } catch {
    return { name, path: absolute, status: 'fail', errors: ['SKILL.md must exist'] };
  }

  const parsed = parseFrontmatter(source);
  if (!parsed) {
    return { name, path: absolute, status: 'fail', errors: ['YAML frontmatter block must exist'] };
  }

  if (parsed.raw.length >= 1024) errors.push('frontmatter block must be under 1024 characters');
  const data = parseSimpleYaml(parsed.yaml, errors);
  await validateFrontmatter(data, name, root, errors);
  await validateBody(parsed.body, absolute, errors);

  return { name, path: absolute, status: errors.length === 0 ? 'pass' : 'fail', errors };
}

function parseFrontmatter(source) {
  if (!source.startsWith('---\n')) return null;
  const end = source.indexOf('\n---', 4);
  if (end === -1) return null;
  return {
    raw: source.slice(0, end + 4),
    yaml: source.slice(4, end),
    body: source.slice(end + 4)
  };
}

function parseSimpleYaml(yaml, errors) {
  const data = {};
  const lines = yaml.split(/\r?\n/);
  let currentArray = null;

  for (const line of lines) {
    if (line.trim() === '') continue;
    const item = line.match(/^\s*-\s+(.+)$/);
    if (item && currentArray) {
      data[currentArray].push(coerceYamlValue(item[1].trim()));
      continue;
    }
    const pair = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (!pair) {
      errors.push(`frontmatter line is not supported: ${line}`);
      currentArray = null;
      continue;
    }
    const [, key, rawValue] = pair;
    if (rawValue === undefined || rawValue === '') {
      data[key] = [];
      currentArray = key;
      continue;
    }
    data[key] = coerceYamlValue(rawValue.trim());
    currentArray = null;
  }
  return data;
}

function coerceYamlValue(value) {
  if (/^\d+$/.test(value)) return Number(value);
  return value.replace(/^['"]|['"]$/g, '');
}

async function validateFrontmatter(data, directoryName, root, errors) {
  if (typeof data.name !== 'string') errors.push('name is required');
  else {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.name)) errors.push('name must be kebab-case');
    if (data.name !== directoryName) errors.push('name must equal directory name');
  }

  if (typeof data.description !== 'string') errors.push('description is required');
  else {
    if (!data.description.startsWith('Use when')) errors.push('description must start with "Use when"');
    if (data.description.length > 500) errors.push('description must be under 500 characters');
    if (/\b(I|you|we|our|your)\b/i.test(data.description)) errors.push('description must be third person');
    if (/\b(step|steps|process|workflow)\b/i.test(data.description)) errors.push('description must be a trigger, not a process summary');
  }

  if ('maturity' in data && !maturityValues.includes(data.maturity)) errors.push(`maturity must be one of ${maturityValues.join(', ')}`);
  if ('platform' in data && !platformValues.includes(data.platform)) errors.push(`platform must be one of ${platformValues.join(', ')}`);
  if ('requires' in data) {
    if (!Array.isArray(data.requires)) errors.push('requires must be a list');
    else {
      for (const entry of data.requires) {
        if (typeof entry !== 'string') {
          errors.push('requires entries must be strings');
          continue;
        }
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry)) errors.push(`requires entry "${entry}" must be kebab-case`);
        if (!await skillDirectoryExists(root, entry)) errors.push(`requires entry "${entry}" must resolve to an existing skill directory`);
      }
    }
  }
}

async function validateBody(body, skillDirectory, errors) {
  if (!body.includes('## Overview')) errors.push('body must contain ## Overview');
  if (!body.includes('## When to Use')) errors.push('body must contain ## When to Use');

  const links = body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);
  for (const [, target] of links) {
    if (/^[a-z]+:/i.test(target) || target.startsWith('#')) continue;
    const clean = target.split('#')[0];
    if (clean === '') continue;
    const resolved = resolve(skillDirectory, clean);
    if (!resolved.startsWith(skillDirectory)) {
      errors.push(`relative markdown link must stay inside skill directory: ${target}`);
      continue;
    }
    if (!await fileExists(resolved)) errors.push(`relative markdown link must resolve: ${target}`);
  }
}

function formatReport(report) {
  if (report.status === 'pass') return `PASS ${report.name}`;
  return [`FAIL ${report.name}`, ...report.errors.map((error) => `  - ${error}`)].join('\n');
}

export async function expandSkillPathPatterns(patterns, root) {
  const expanded = [];
  for (const pattern of patterns) {
    if (!pattern.includes('*')) {
      expanded.push(pattern);
      continue;
    }
    const normalized = pattern.replaceAll('\\\\', '/');
    const slash = normalized.lastIndexOf('/');
    const parent = slash === -1 ? '.' : normalized.slice(0, slash);
    const namePattern = slash === -1 ? normalized : normalized.slice(slash + 1);
    const regex = new RegExp(`^${namePattern.split('*').map(escapeRegex).join('.*')}$`);
    let entries = [];
    try {
      entries = await readdir(resolve(root, parent), { withFileTypes: true });
    } catch {
      expanded.push(pattern);
      continue;
    }
    const matches = entries
      .filter((entry) => entry.isDirectory() && regex.test(entry.name))
      .map((entry) => join(parent, entry.name))
      .sort((left, right) => left.localeCompare(right));
    expanded.push(...(matches.length === 0 ? [pattern] : matches));
  }
  return expanded;
}

async function discoverRealSkills(root) {
  const skillsRoot = join(root, 'skills');
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
        continue;
      }
    }
    return paths;
  } catch {
    return [];
  }
}

async function skillDirectoryExists(root, name) {
  return await fileExists(join(root, 'skills', name, 'SKILL.md')) || await fileExists(join(root, 'tests', 'fixtures', 'skills', name, 'SKILL.md'));
}

function fileExists(path) {
  return stat(path).then(() => true, () => false);
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}
