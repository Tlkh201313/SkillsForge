import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('sidecar schema declares routing, capabilities, compat', async () => {
  const schema = JSON.parse(await readFile('schemas/skillsforge.sidecar.schema.json', 'utf8'));
  assert.equal(schema.type, 'object');
  assert.ok(schema.properties.routing.properties.triggers);
  assert.ok(schema.properties.routing.properties.antiTriggers);
  assert.ok(schema.properties.capabilities.properties.exec);
  assert.ok(schema.properties.compat);
  assert.deepEqual(schema.required, ['routing', 'capabilities']);
});
