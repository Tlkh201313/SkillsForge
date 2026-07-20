import { access, readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { schemas } from './schemas.generated.mjs';
import { validateWithSchema } from './schema-lib.mjs';

const readmeBadgePattern = /img\.shields\.io\/badge\/version-([0-9]+\.[0-9]+\.[0-9]+)-/;
const SUPERLATIVE_PATTERN = /\b(fastest|best-in-class|#1\b|number one|world'?s best|guaranteed hackathon winner)\b/i;
const JUNK_README_PATTERN = /\bnpm run video:render\b|\bremoved source renderer\b|\bsource renderer is included\b/i;

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
    for (const [label, actual] of versions) {
      if (actual !== expected) errors.push(`${label} version ${actual} does not match VERSION ${expected}`);
    }
    if (!errors.some((error) => error.includes('version '))) passes.push(`version lockstep ${expected}`);
  }

  // Optional Codex plugin presence - warn/pass only; do not join Claude marketplace lockstep.
  await validateOptionalCodexPlugin(repositoryRoot, errors, passes);

  const fullRepo = await pathExists(join(repositoryRoot, 'plugins', 'skillsforge', 'skills', 'using-skillsforge', 'SKILL.md'));
  if (fullRepo) {
    if (readme) {
      await validateReadmeClaims(readme, repositoryRoot, errors, passes);
    }
    await validateDemoMedia(repositoryRoot, errors, passes);
    await validatePackageAllowlist(packageJson, errors, passes);
  }

  const ok = errors.length === 0;
  const text = ok
    ? `${passes.map((pass) => `PASS ${pass}`).join('\n')}\n`
    : `${errors.map((error) => `FAIL ${error}`).join('\n')}\n`;
  return { ok, errors, passes, version: expected ?? null, text };
}

async function validateOptionalCodexPlugin(repositoryRoot, errors, passes) {
  const codexPluginPath = join(repositoryRoot, 'plugins', 'skillsforge', '.codex-plugin', 'plugin.json');
  let source;
  try {
    source = await readFile(codexPluginPath, 'utf8');
  } catch {
    passes.push('codex plugin absent (optional)');
    return;
  }

  let plugin;
  try {
    plugin = JSON.parse(source);
  } catch (error) {
    errors.push(`codex plugin manifest contains invalid JSON: ${error.message}`);
    return;
  }

  if (!plugin?.name || !plugin?.version || !plugin?.description) {
    errors.push('codex plugin manifest must include name, version, and description');
    return;
  }
  const skills = String(plugin.skills ?? '');
  if (!(skills === './skills/' || skills === './skills') || skills.includes('..')) {
    errors.push('codex plugin skills path must be ./skills/ without path escape');
    return;
  }
  if (!plugin.interface?.displayName || !plugin.interface?.shortDescription) {
    errors.push('codex plugin interface requires displayName and shortDescription');
    return;
  }

  const marketPath = join(repositoryRoot, '.agents', 'plugins', 'marketplace.json');
  try {
    const market = JSON.parse(await readFile(marketPath, 'utf8'));
    const entry = (market.plugins ?? []).find((item) => item.name === 'skillsforge');
    if (!entry?.source?.path || !String(entry.source.path).includes('plugins/skillsforge')) {
      errors.push('codex marketplace entry must reference local plugins/skillsforge');
      return;
    }
    if (!entry.policy?.installation) {
      errors.push('codex marketplace entry must declare installation policy');
      return;
    }
  } catch (error) {
    errors.push(`codex marketplace cannot be read: ${error.message}`);
    return;
  }

  passes.push('codex plugin + marketplace present');
}

async function validateReadmeClaims(readme, repositoryRoot, errors, passes) {
  for (const match of readme.matchAll(/npx skillsforge/gi)) {
    const start = Math.max(0, match.index - 120);
    const ctx = readme.slice(start, match.index + match[0].length + 40);
    if (!/do not|not on npm|not published/i.test(ctx)) {
      errors.push('README advertises npx skillsforge without an explicit not-published warning');
      break;
    }
  }
  if (!/node plugins\/skillsforge\/bin\/skillsforge\.mjs demo/.test(readme)) {
    errors.push('README must show the repo binary demo path');
  }
  if (SUPERLATIVE_PATTERN.test(readme)) {
    errors.push('README contains unverifiable superlative marketing claims');
  }
  if (JUNK_README_PATTERN.test(readme)) {
    errors.push('README references removed renderer/video:render path without honesty note');
  }
  if (!errors.some((error) => error.startsWith('README'))) {
    passes.push('README claim hygiene');
  }
}

async function validateDemoMedia(repositoryRoot, errors, passes) {
  const required = [
    ['assets/skillsforge-demo-preview.gif', 'demo animated preview'],
    ['assets/skillsforge-demo-poster.png', 'demo poster'],
    ['assets/video/skillsforge-demo.mp4', 'demo mp4'],
    ['assets/skillsforge-banner.svg', 'banner svg']
  ];
  for (const [rel, label] of required) {
    try {
      await access(join(repositoryRoot, rel));
      passes.push(`media ${label}`);
    } catch {
      errors.push(`missing ${label} at ${rel}`);
    }
  }
}

async function validatePackageAllowlist(packageJson, errors, passes) {
  if (!packageJson?.files || !Array.isArray(packageJson.files)) {
    errors.push('package.json files allowlist missing');
    return;
  }
  const blocked = ['teacher (FABLE 5)', 'video/', '.worktrees/', 'node_modules/'];
  for (const entry of packageJson.files) {
    const normalized = String(entry).replaceAll('\\', '/');
    if (blocked.some((item) => normalized === item || normalized.startsWith(item))) {
      errors.push(`package.json files allowlist includes junk path: ${entry}`);
    }
  }
  if (!packageJson.files.includes('assets/skillsforge-demo-poster.png')) {
    errors.push('package.json files must include assets/skillsforge-demo-poster.png');
  }
  if (!packageJson.files.includes('assets/skillsforge-demo-preview.gif')) {
    errors.push('package.json files must include assets/skillsforge-demo-preview.gif');
  }
  if (!packageJson.files.includes('assets/video/skillsforge-demo.mp4')) {
    errors.push('package.json files must include assets/video/skillsforge-demo.mp4');
  }
  if (!errors.some((error) => error.includes('package.json files'))) {
    passes.push('package allowlist hygiene');
  }
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

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
