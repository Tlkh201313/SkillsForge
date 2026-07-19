import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { POWERSHELL_HELPERS } from '../lib/capabilities/powershell.mjs';

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

test('wb supports full output cap without treating it as a query option', () => {
  const result = run(['wb', 'tree', '--full', '--limit', '3', '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.task, 'tree');
  assert.equal(payload.limit, 3);
  assert.ok(Array.isArray(payload.files));
});

test('auto run requires explicit read-only mode', () => {
  const result = run(['auto', 'run', '--query', 'safe refactor code']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /requires --read-only/);
});

test('ps export confines --out and emits expected sf-* helpers', async (context) => {
  const outDir = await mkdtemp(join(tmpdir(), 'sf-ps-escape-'));
  context.after(() => rm(outDir, { recursive: true, force: true }));

  const escaped = run(['ps', 'export', '--out', outDir, '--json']);
  assert.equal(escaped.status, 1, escaped.stdout);
  assert.match(escaped.stderr, /powershell export path escapes root/);

  const ok = run(['ps', 'export', '--out', 'artifacts/powershell-test', '--json']);
  assert.equal(ok.status, 0, ok.stderr || ok.stdout);
  const payload = JSON.parse(ok.stdout);
  assert.equal(payload.ok, true);
  const names = payload.files.map((file) => file.name).sort();
  assert.deepEqual(names, POWERSHELL_HELPERS.map((helper) => helper.name).sort());
  assert.ok(names.includes('sf-status'));
  assert.ok(names.includes('sf-lib-update'));
  assert.ok(names.includes('sf-auto'));
});
