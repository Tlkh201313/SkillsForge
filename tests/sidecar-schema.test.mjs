import assert from 'node:assert/strict';
import test from 'node:test';
import { schemas } from '../scripts/schemas.generated.mjs';
import { validateWithSchema } from '../scripts/schema-lib.mjs';

const schema = schemas['skillsforge.sidecar'];

const valid = {
  schemaVersion: 1,
  maturity: 'stable',
  requires: [],
  routing: {
    triggers: ['create an agent skill'],
    antiTriggers: ['write application code']
  },
  capabilities: {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: 'skill' }
  },
  compatibility: {
    'claude-code': 'full',
    cursor: 'partial'
  },
  provenance: {
    source: 'original',
    license: 'MIT'
  }
};

test('sidecar schema accepts a complete capability declaration', async () => {
  const result = await validateWithSchema(schema, valid);
  assert.deepEqual(result.errors, []);
});

test('sidecar schema rejects unknown fields', async () => {
  const result = await validateWithSchema(schema, { ...valid, extra: true });
  assert.match(result.errors.join('\n'), /unsupported field extra/);
});

test('sidecar schema rejects empty trigger lists', async () => {
  const result = await validateWithSchema(schema, {
    ...valid,
    routing: { triggers: [], antiTriggers: [] }
  });
  assert.match(result.errors.join('\n'), /triggers/);
});

test('sidecar schema rejects invalid hosts', async () => {
  const result = await validateWithSchema(schema, {
    ...valid,
    capabilities: {
      ...valid.capabilities,
      network: { allowed: true, hosts: ['https://bad'] }
    }
  });
  assert.match(result.errors.join('\n'), /hosts/);
});

test('sidecar schema accepts optional network.searchAllowed', async () => {
  const result = await validateWithSchema(schema, {
    ...valid,
    capabilities: {
      ...valid.capabilities,
      network: { allowed: true, searchAllowed: true, hosts: ['api.example.com'] }
    }
  });
  assert.deepEqual(result.errors, []);
});
