import { readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { schemas } from './schemas.generated.mjs';
import { validateWithSchema } from './schema-lib.mjs';

const readmeBadgePattern = /img\.shields\.io\/badge\/version-([0-9]+\.[0-9]+\.[0-9]+)-/;

export async function validateRepository(root = process.cwd()) {
  const repositoryRoot = resolve(root);
  const errors = [];
  const passes = [];
  const versions = [];

  const marketplace = await readJson(join(repositoryRoot, '.claude-plugin', 'marketplace.json'), 'marketplace manifest', errors);
  if (marketplace) {
    await validateManifest('marketplace manifest', schemas.marketplace, marketplace, errors, passes);
  }

  const packageJson = await readJson(join(repositoryRoot, 'package.json'), 'package.json', errors);
  if (packageJson?.version) versions.push(['package.json', packageJson.version]);

  const version = await readText(join(repositoryRoot, 'VERSION'), 'VERSION', errors);
  if (version) versions.push(['VERSION', version.trim()]);

  const readme = await readText(join(repositoryRoot, 'README.md'), 'README.md', errors);
  if (readme) {
    const match = readme.match(readmeBadgePattern);
    if (match) versions.push(['README badge', match[1]]);
    else errors.push('README badge must contain a version-x.y.z badge');
  }

  for (const entry of marketplace?.plugins ?? []) {
    if (entry.version) versions.push([`marketplace entry ${entry.name}`, entry.version]);
    if (typeof entry.source !== 'string') {
      errors.push(`marketplace entry ${entry.name ?? '<unnamed>'} must use a local string source`);
      continue;
    }
    const pluginRoot = resolve(repositoryRoot, entry.source);
    if (!isInside(repositoryRoot, pluginRoot)) {
      errors.push(`marketplace entry ${entry.name} source must stay inside the repository`);
      continue;
    }
    const plugin = await readJson(join(pluginRoot, '.claude-plugin', 'plugin.json'), `plugin manifest ${entry.name}`, errors);
    if (!plugin) continue;
    await validateManifest(`plugin manifest ${entry.name}`, schemas.plugin, plugin, errors, passes);
    if (plugin.version) versions.push([`plugin manifest ${entry.name}`, plugin.version]);
  }

  const expected = versions.find(([label]) => label === 'VERSION')?.[1];
  if (expected) {
    const versionMismatches = [];
    for (const [label, actual] of versions) {
      if (actual !== expected) versionMismatches.push(`${label} version ${actual} does not match VERSION ${expected}`);
    }
    errors.push(...versionMismatches);
    if (versionMismatches.length === 0) passes.push(`version lockstep ${expected}`);
  }

  const ok = errors.length === 0;
  const text = ok
    ? `${passes.map((pass) => `PASS ${pass}`).join('\n')}\n`
    : `${errors.map((error) => `FAIL ${error}`).join('\n')}\n`;
  return { ok, errors, passes, version: expected ?? null, text };
}

async function validateManifest(label, schema, value, errors, passes) {
  const result = await validateWithSchema(schema, value);
  if (result.valid) passes.push(label);
  else for (const error of result.errors) errors.push(`${label}: ${error}`);
}

async function readJson(path, label, errors) {
  const source = await readText(path, label, errors);
  if (source === null) return null;
  try {
    return JSON.parse(source);
  } catch (error) {
    errors.push(`${label} contains invalid JSON: ${error.message}`);
    return null;
  }
}

async function readText(path, label, errors) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    errors.push(`${label} cannot be read: ${error.message}`);
    return null;
  }
}

function isInside(parent, candidate) {
  const path = relative(parent, candidate);
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path));
}
