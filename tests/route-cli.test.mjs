import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

test('route CLI outputs JSON with selection and reasons', async () => {
  const { stdout } = await run('node', ['scripts/route.mjs', 'audit skill safety']);
  const result = JSON.parse(stdout);
  assert.equal(result.selected, 'verify-capability');
  assert.ok(result.candidates.length >= 3);
});

test('route CLI with no match exits 0 and explains fallback', async () => {
  const { stdout } = await run('node', ['scripts/route.mjs', 'bake a cake']);
  const result = JSON.parse(stdout);
  assert.equal(result.selected, null);
  assert.equal(result.fallback, 'no-skill-above-threshold');
});
