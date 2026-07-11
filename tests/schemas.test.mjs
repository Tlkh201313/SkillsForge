import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function loadJson(path) {
  return JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
}

function validate(schema, value) {
  const errors = [];
  if (schema.type === 'object' && (value === null || Array.isArray(value) || typeof value !== 'object')) {
    errors.push('value must be an object');
  }
  for (const name of schema.required ?? []) {
    if (!(name in value)) errors.push(`${name} is required`);
  }
  for (const [name, rules] of Object.entries(schema.properties ?? {})) {
    if (!(name in value)) continue;
    const actual = value[name];
    if (rules.type === 'array') {
      if (!Array.isArray(actual)) errors.push(`${name} must be an array`);
      continue;
    }
    if (rules.type && typeof actual !== rules.type) errors.push(`${name} must be ${rules.type}`);
    if (rules.enum && !rules.enum.includes(actual)) errors.push(`${name} must be one of ${rules.enum.join(', ')}`);
    if (rules.pattern && typeof actual === 'string' && !(new RegExp(rules.pattern).test(actual))) errors.push(`${name} must match ${rules.pattern}`);
    if (rules.maxLength && typeof actual === 'string' && actual.length > rules.maxLength) errors.push(`${name} must be at most ${rules.maxLength} characters`);
    if (rules.items?.type && Array.isArray(actual)) {
      actual.forEach((item, index) => {
        if (typeof item !== rules.items.type) errors.push(`${name}[${index}] must be ${rules.items.type}`);
      });
    }
  }
  return errors;
}

function assertSchemaShape(schema) {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.type, 'object');
  assert.ok(Array.isArray(schema.required));
  assert.equal(typeof schema.properties, 'object');
}

test('skill frontmatter schema accepts a valid skill and rejects invalid metadata', async () => {
  const schema = await loadJson('schemas/skill.frontmatter.schema.json');
  assertSchemaShape(schema);

  const valid = {
    name: 'example-skill',
    description: 'Use when an agent must handle a concrete repeatable workflow.',
    maturity: 'stable',
    platform: 'canonical',
    requires: ['using-skillsforge']
  };
  assert.deepEqual(validate(schema, valid), []);

  const invalid = {
    name: 'Example Skill',
    description: 'Run a process for things.',
    maturity: 'ancient',
    platform: 'spaceship',
    requires: ['using-skillsforge', 42]
  };
  assert.match(validate(schema, invalid).join('\n'), /name must match|description must match|maturity must be one of|platform must be one of|requires\[1\] must be string/);
});

test('plugin schema accepts product manifests and rejects incomplete manifests', async () => {
  const schema = await loadJson('schemas/plugin.schema.json');
  assertSchemaShape(schema);

  const plugin = await loadJson('.claude-plugin/plugin.json');
  const marketplace = await loadJson('.claude-plugin/marketplace.json');
  assert.deepEqual(validate(schema, plugin), []);
  assert.deepEqual(validate(schema, marketplace), []);

  assert.match(validate(schema, { name: 'skillsforge' }).join('\n'), /version is required|description is required|license is required/);
});
