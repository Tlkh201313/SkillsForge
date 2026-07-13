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

test('shipped shim accepts Claude Code profile for Claude-only skill', () => {
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: true
  });
  assert.equal(build.status, 0, build.stderr || build.stdout);

  const result = spawnSync(
    process.execPath,
    [binary, '--profile', 'claude-code', 'tests/fixtures/skills/good-claude-extension'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /PASS/);
});

test('shipped shim rejects Claude-only skill under canonical profile', () => {
  const result = spawnSync(
    process.execPath,
    [binary, '--profile', 'canonical', 'tests/fixtures/skills/good-claude-extension'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(result.stdout, /FAIL/);
});

test('shipped shim rejects unknown validation profile', () => {
  const result = spawnSync(
    process.execPath,
    [binary, '--profile', 'weird', 'tests/fixtures/skills/good-basic'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stderr, /Unknown profile/);
});

test('shipped shim rejects missing --profile value', () => {
  const result = spawnSync(
    process.execPath,
    [binary, '--profile'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stderr, /requires a value/);
});
