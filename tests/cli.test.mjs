import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';

const binary = join(process.cwd(), 'plugins', 'skillsforge', 'bin', 'skillsforge-validate');

test('bundled CLI validates a portable skill without installed runtime dependencies', () => {
  const result = spawnSync(process.execPath, [binary, 'tests/fixtures/skills/good-basic'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /PASS good-basic/);
});

test('bundled CLI emits machine-readable failures', () => {
  const result = spawnSync(process.execPath, [binary, '--json', 'tests/fixtures/skills/bad-link'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ok, false);
  assert.equal(output.reports[0].status, 'fail');
});
