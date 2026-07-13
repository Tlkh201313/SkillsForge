import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { runBuild } from '../scripts/build.mjs';

test('build produces self-contained Claude plugin with receipt', async () => {
  await rm('dist', { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  const result = await runBuild();
  assert.equal(result.ok, true);
  const manifest = JSON.parse(await readFile('dist/claude-code/.claude-plugin/plugin.json', 'utf8'));
  assert.equal(manifest.name, 'skillsforge');
  const receipt = JSON.parse(await readFile('dist/trust-receipt.json', 'utf8'));
  assert.ok(receipt.skills.length >= 3);
  for (const s of receipt.skills) {
    assert.match(s.sha256, /^[a-f0-9]{64}$/);
    assert.ok(s.capabilities);
  }
});

test('build is deterministic across runs', async () => {
  const first = await runBuild();
  assert.equal(first.ok, true);
  const second = await runBuild();
  assert.equal(second.ok, true);
  assert.equal(first.receiptHash, second.receiptHash);
});

test('build fails on blocking policy finding', async () => {
  const result = await runBuild({ skillsRoot: 'tests/fixtures/policy' });
  assert.equal(result.ok, false);
  assert.ok(result.blocked.some((b) => b.rule === 'undeclared-exec'));
});
