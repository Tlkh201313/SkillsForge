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

test('bundled CLI validate fails undeclared-exec with policy JSON fields', () => {
  const result = spawnSync(
    process.execPath,
    [binary, '--json', 'tests/fixtures/policy/undeclared-exec'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ok, false);
  const finding = output.findings.find((item) => String(item.rule).startsWith('undeclared-exec'));
  assert.ok(finding, JSON.stringify(output.findings));
  assert.equal(finding.blocking, true);
  assert.ok(Array.isArray(finding.evidence));
  assert.ok(finding.fix);
});

test('bundled CLI help lists every subcommand', () => {
  const cli = join(process.cwd(), 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: true
  });
  assert.equal(build.status, 0, build.stderr || build.stdout);

  const result = spawnSync(process.execPath, [cli, 'help'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  for (const name of ['validate', 'doctor', 'route', 'forge', 'receipt', 'verify-receipt', 'enforce', 'eval', 'help']) {
    assert.match(result.stdout, new RegExp(`\\b${name}\\b`));
  }
});
