import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { compressCommandOutput, runSlim } from '../lib/capabilities/slim.mjs';

test('compressCommandOutput drops pass noise and keeps fails', () => {
  const raw = [
    '✔ ok one',
    '✔ ok two',
    '✖ fail boom',
    'AssertionError: expected true',
    '✔ ok three',
    'done'
  ].join('\n');
  const slim = compressCommandOutput(raw, { dropPassNoise: true, keepFail: true, maxLines: 40 });
  assert.match(slim, /fail boom/);
  assert.match(slim, /AssertionError/);
  assert.doesNotMatch(slim, /✔ ok one/);
});

test('slim gain tracks raw vs slim bytes', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'sf-slim-'));
  context.after(() => rm(root, { recursive: true, force: true }));

  const reset = await runSlim(root, 'gain', { reset: true });
  assert.equal(reset.ok, true);
  assert.equal(reset.commands, 0);

  // Long noisy output so slim is strictly smaller
  const noisy = Array.from({ length: 120 }, (_, i) => `✔ pass line ${i}`).join('\n')
    + '\n✖ fail boom\nAssertionError: expected true\n';
  const script = `process.stdout.write(${JSON.stringify(noisy)})`;
  const ran = await runSlim(root, 'run', {
    argv: [process.execPath, '-e', script],
    dropPassNoise: true,
    keepFail: true,
    limit: 40
  });
  assert.equal(ran.ok, true);
  assert.ok(ran.truncated || ran.text.length < noisy.length);

  const gain = await runSlim(root, 'gain');
  assert.equal(gain.ok, true);
  assert.ok(gain.commands >= 1);
  assert.ok(gain.rawBytes > 0);
  assert.ok(gain.rawBytes >= gain.slimBytes);
  assert.ok(gain.savedTokensEst >= 0);
  assert.equal(gain.method, 'approx-chars/4');
});

test('slim run requires command', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sf-slim-empty-'));
  const result = await runSlim(root, 'run', { argv: [] });
  assert.equal(result.ok, false);
  await rm(root, { recursive: true, force: true });
});
