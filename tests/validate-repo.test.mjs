import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateRepository } from '../scripts/validate-repo-lib.mjs';

test('current repository passes repository validation', async () => {
  const result = await validateRepository(process.cwd());
  assert.equal(result.ok, true, result.text);
  assert.equal(result.version, '0.2.0');
});

test('every lockstep version source is enforced', async (context) => {
  const parent = await mkdtemp(join(tmpdir(), 'skillsforge-repo-'));
  context.after(() => rm(parent, { recursive: true, force: true }));
  const cases = [
    ['VERSION', { versionFile: '9.9.9' }],
    ['package.json', { packageVersion: '9.9.9' }],
    ['plugin manifest skillsforge', { pluginVersion: '9.9.9' }],
    ['marketplace entry skillsforge', { entryVersion: '9.9.9' }],
    ['README badge', { readmeVersion: '9.9.9' }]
  ];

  for (const [label, overrides] of cases) {
    await context.test(`rejects ${label} drift`, async () => {
      const root = join(parent, label.replaceAll(/[^a-z0-9]+/gi, '-').toLowerCase());
      await writeFixtureRepository(root, overrides);
      const result = await validateRepository(root);
      assert.equal(result.ok, false, `${label} unexpectedly passed`);
      assert.match(result.errors.join('\n'), new RegExp(escapeRegex(label)));
    });
  }
});

test('unrelated version wording does not suppress lockstep pass reporting', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'skillsforge-repo-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFixtureRepository(root, { unrelatedVersionError: true });

  const result = await validateRepository(root);

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /unsupported field version note/);
  assert.ok(result.passes.includes('version lockstep 0.1.0'));
});

async function writeFixtureRepository(root, overrides = {}) {
  const expected = '0.1.0';
  const pluginRoot = join(root, 'plugins', 'skillsforge', '.claude-plugin');
  await mkdir(pluginRoot, { recursive: true });
  await mkdir(join(root, '.claude-plugin'), { recursive: true });

  const author = { name: 'Tlkh201313', url: 'https://github.com/Tlkh201313' };
  const plugin = {
    name: 'skillsforge',
    version: overrides.pluginVersion ?? expected,
    description: 'Validate and review portable Agent Skills packages.',
    author,
    homepage: 'https://github.com/Tlkh201313/SkillsForge',
    repository: 'https://github.com/Tlkh201313/SkillsForge',
    license: 'MIT',
    keywords: ['skills', 'validation']
  };
  const marketplace = {
    name: 'skillsforge-marketplace',
    description: 'Fixture marketplace.',
    owner: author,
    metadata: { pluginRoot: './plugins' },
    plugins: [{
      name: 'skillsforge',
      source: './plugins/skillsforge',
      version: overrides.entryVersion ?? expected,
      description: plugin.description,
      author,
      homepage: plugin.homepage,
      repository: plugin.repository,
      license: 'MIT',
      keywords: ['skills', 'validation'],
      strict: true
    }]
  };
  if (overrides.unrelatedVersionError) marketplace['version note'] = 'unrelated';

  await Promise.all([
    writeFile(join(root, 'VERSION'), `${overrides.versionFile ?? expected}\n`),
    writeFile(join(root, 'package.json'), `${JSON.stringify({ name: 'skillsforge', version: overrides.packageVersion ?? expected }, null, 2)}\n`),
    writeFile(join(root, 'README.md'), `![Version](https://img.shields.io/badge/version-${overrides.readmeVersion ?? expected}-7c3aed)\n`),
    writeFile(join(root, '.claude-plugin', 'marketplace.json'), `${JSON.stringify(marketplace, null, 2)}\n`),
    writeFile(join(pluginRoot, 'plugin.json'), `${JSON.stringify(plugin, null, 2)}\n`)
  ]);
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');
}
