import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';

const cli = join(process.cwd(), 'scripts', 'skillsforge-cli.mjs');

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
}

test('os-env reports safe machine facts as JSON', () => {
  const result = run(['os-env', '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.command, 'os-env');
  assert.equal(payload.platform, process.platform);
  assert.ok(Array.isArray(payload.envKeys));
  assert.ok(!Object.hasOwn(payload, 'env'));
});

test('os-find locates files with repo-safe defaults', () => {
  const result = run(['os-find', '--name', 'package.json', '--root', '.', '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.command, 'os-find');
  assert.ok(payload.matches.some((item) => item.path === 'package.json'));
});

test('os-run defaults to dry-run unless explicitly approved', () => {
  const result = run(['os-run', '--json', '--', process.execPath, '--version']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.command, 'os-run');
  assert.equal(payload.dryRun, true);
  assert.deepEqual(payload.argv, [process.execPath, '--version']);
});

test('os-open can plan platform launcher without opening anything', () => {
  const result = run(['os-open', 'README.md', '--dry-run', '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.command, 'os-open');
  assert.equal(payload.dryRun, true);
  assert.ok(payload.target.endsWith('README.md'));
  assert.ok(Array.isArray(payload.launcher));
});

test('os-clean is inventory-only in phase 1', () => {
  const result = run(['os-clean', '--root', '.', '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.command, 'os-clean');
  assert.equal(payload.dryRun, true);
  assert.ok(Array.isArray(payload.candidates));
});
