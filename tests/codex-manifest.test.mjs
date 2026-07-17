import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

test('Codex plugin.json has required identity and safe skills path', async () => {
  const pluginPath = join(repoRoot, 'plugins', 'skillsforge', '.codex-plugin', 'plugin.json');
  const plugin = JSON.parse(await readFile(pluginPath, 'utf8'));

  assert.equal(typeof plugin.name, 'string');
  assert.ok(plugin.name.length > 0);
  assert.match(String(plugin.version), SEMVER);
  assert.equal(typeof plugin.description, 'string');
  assert.ok(plugin.description.length > 0);

  assert.equal(typeof plugin.interface?.displayName, 'string');
  assert.ok(plugin.interface.displayName.length > 0);
  assert.equal(typeof plugin.interface?.shortDescription, 'string');
  assert.ok(plugin.interface.shortDescription.length > 0);

  const skills = String(plugin.skills ?? '');
  assert.ok(skills === './skills/' || skills === './skills', `unexpected skills path: ${skills}`);
  assert.ok(!skills.includes('..'), 'skills path must not escape with ..');
});

test('Codex marketplace.json points at local plugins/skillsforge with installation policy', async () => {
  const marketPath = join(repoRoot, '.agents', 'plugins', 'marketplace.json');
  const market = JSON.parse(await readFile(marketPath, 'utf8'));
  assert.equal(typeof market.name, 'string');

  const entry = (market.plugins ?? []).find((item) => item.name === 'skillsforge');
  assert.ok(entry, 'marketplace must list skillsforge');
  assert.equal(entry.source?.source, 'local');
  assert.match(String(entry.source?.path ?? ''), /plugins\/skillsforge/);
  assert.equal(entry.policy?.installation, 'AVAILABLE');
});

test('each production skill ships agents/openai.yaml with required Codex interface', async () => {
  const skillsRoot = join(repoRoot, 'plugins', 'skillsforge', 'skills');
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await access(join(skillsRoot, entry.name, 'SKILL.md'));
    } catch {
      continue;
    }
    count += 1;
    const yamlPath = join(skillsRoot, entry.name, 'agents', 'openai.yaml');
    const source = await readFile(yamlPath, 'utf8');
    const document = parseDocument(source, { prettyErrors: true, strict: true, uniqueKeys: true });
    assert.equal(document.errors.length, 0, `${entry.name}: ${document.errors.map((e) => e.message).join('; ')}`);
    const data = document.toJS() ?? {};
    assert.equal(typeof data.interface?.display_name, 'string', `${entry.name} missing display_name`);
    assert.ok(data.interface.display_name.length > 0);
    assert.equal(typeof data.interface?.short_description, 'string', `${entry.name} missing short_description`);
    assert.ok(data.interface.short_description.length > 0);
    assert.equal(typeof data.interface?.default_prompt, 'string', `${entry.name} missing default_prompt`);
    assert.ok(data.interface.default_prompt.length > 0);
    assert.equal(data.policy?.allow_implicit_invocation, true, `${entry.name} allow_implicit_invocation`);
  }

  assert.ok(count >= 5, `expected at least 5 production skills, found ${count}`);
});
