import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadJson, validateWithSchema } from '../scripts/schema-lib.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const fromRoot = (...parts) => join(root, ...parts);

test('canonical Agent Skills schema implements the portable frontmatter contract', async () => {
  const schema = fromRoot('schemas', 'skill.frontmatter.schema.json');
  const valid = {
    name: 'example-skill',
    description: 'Review API changes. Use when an agent needs a compatibility assessment.',
    license: 'MIT',
    compatibility: 'Requires git.',
    metadata: { author: 'example-org', version: '1.0' },
    'allowed-tools': 'Read Bash(git:*)'
  };
  assert.equal((await validateWithSchema(schema, valid)).valid, true);

  const invalidToolList = await validateWithSchema(schema, { ...valid, 'allowed-tools': ['Read'] });
  assert.equal(invalidToolList.valid, false);

  const invalid = {
    ...valid,
    name: 'Example--Skill',
    maturity: 'stable',
    metadata: { version: 1 }
  };
  const result = await validateWithSchema(schema, invalid);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /unsupported field maturity|pattern|must be string/);
});

test('skill profiles compose the canonical core without duplicating shared fields', async () => {
  const canonical = await loadJson(fromRoot('schemas', 'skill.frontmatter.schema.json'));
  const claude = await loadJson(fromRoot('schemas', 'claude-code.frontmatter.schema.json'));
  const shared = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'];

  assert.ok(canonical.$defs?.core);
  assert.deepEqual(Object.keys(canonical.$defs.core.properties), shared);
  assert.deepEqual(canonical.$defs.core.required, ['name', 'description']);
  assert.equal(canonical.unevaluatedProperties, false);
  assert.ok(canonical.allOf.some((entry) => entry.$ref === '#/$defs/core'));

  assert.equal(claude.unevaluatedProperties, false);
  assert.ok(claude.allOf.some((entry) => entry.$ref === `${canonical.$id}#/$defs/core`));
  const claudeOwnProperties = claude.allOf.flatMap((entry) => Object.keys(entry.properties ?? {}));
  assert.deepEqual(claudeOwnProperties.filter((property) => shared.includes(property)), []);
});

test('registers generated schemas repeatedly and resolves the Claude external core ref', async () => {
  const schemaLib = await import('../scripts/schema-lib.mjs');
  assert.equal(typeof schemaLib.registerSchemas, 'function');

  const canonicalPath = fromRoot('schemas', 'skill.frontmatter.schema.json');
  const claudePath = fromRoot('schemas', 'claude-code.frontmatter.schema.json');
  const canonical = await loadJson(canonicalPath);
  const claude = await loadJson(claudePath);
  await schemaLib.registerSchemas([canonical, claude]);
  await schemaLib.registerSchemas([canonicalPath, claudePath]);

  const valid = await validateWithSchema(claude, {
    name: 'claude-skill',
    description: 'Use Claude Code extensions.',
    'allowed-tools': ['Read', 'Bash(git:*)'],
    'disable-model-invocation': true
  });
  assert.equal(valid.valid, true, valid.errors.join('\n'));

  const invalid = await validateWithSchema(claudePath, {
    name: 'claude-skill',
    description: 'Reject fields outside either composed schema.',
    maturity: 'stable'
  });
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join('\n'), /unsupported field maturity/);
});

test('reuses a schema validator when the schema object is followed by its path', async () => {
  const schemaPath = fromRoot('schemas', 'plugin.schema.json');
  const schema = await loadJson(schemaPath);
  const plugin = await loadJson(fromRoot('plugins', 'skillsforge', '.claude-plugin', 'plugin.json'));

  assert.equal((await validateWithSchema(schema, plugin)).valid, true);
  assert.equal((await validateWithSchema(schemaPath, plugin)).valid, true);
});

test('plugin manifest matches the Claude Code metadata contract', async () => {
  const schema = fromRoot('schemas', 'plugin.schema.json');
  const plugin = await loadJson(fromRoot('plugins', 'skillsforge', '.claude-plugin', 'plugin.json'));
  assert.equal((await validateWithSchema(schema, plugin)).valid, true);

  const invalid = { ...plugin, author: 'SkillsForge' };
  const result = await validateWithSchema(schema, invalid);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /author.*object/);
});

test('marketplace manifest lists at least one sourced plugin', async () => {
  const schema = fromRoot('schemas', 'marketplace.schema.json');
  const marketplace = await loadJson(fromRoot('.claude-plugin', 'marketplace.json'));
  assert.equal((await validateWithSchema(schema, marketplace)).valid, true);

  const oldInvalidShape = {
    name: 'skillsforge',
    version: '0.1.0',
    plugin: './plugin.json'
  };
  const result = await validateWithSchema(schema, oldInvalidShape);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /owner|plugins|unsupported field/);
});
