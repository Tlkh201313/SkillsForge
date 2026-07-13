import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { detectHosts, HOST_REGISTRY, resolveHostSelection } from '../lib/capabilities/hosts.mjs';

test('HOST_REGISTRY lists five known hosts with expected fidelity', () => {
  assert.equal(HOST_REGISTRY.length, 5);
  const byId = Object.fromEntries(HOST_REGISTRY.map((host) => [host.id, host]));
  assert.equal(byId['claude-code'].fidelity, 'full');
  assert.equal(byId.cursor.fidelity, 'portable');
  assert.equal(byId.codex.fidelity, 'portable');
  assert.equal(byId.opencode.fidelity, 'portable');
  assert.equal(byId.gemini.fidelity, 'portable');
});

test('detectHosts respects home override and only marks created dirs', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-hosts-'));
  context.after(() => rm(home, { recursive: true, force: true }));

  await mkdir(join(home, '.claude'), { recursive: true });
  await mkdir(join(home, '.cursor'), { recursive: true });

  const hosts = await detectHosts({ home });
  assert.equal(hosts.length, 5);
  for (const host of hosts) {
    assert.ok(host.detectDir.startsWith(home), `${host.id} detectDir outside home`);
    assert.ok(host.skillsDir.startsWith(home), `${host.id} skillsDir outside home`);
  }

  const byId = Object.fromEntries(hosts.map((host) => [host.id, host]));
  assert.equal(byId['claude-code'].detected, true);
  assert.equal(byId.cursor.detected, true);
  assert.equal(byId.codex.detected, false);
  assert.equal(byId.opencode.detected, false);
  assert.equal(byId.gemini.detected, false);
  assert.equal(byId['claude-code'].skillsDir, join(home, '.claude', 'skills'));
  assert.equal(byId.cursor.skillsDir, join(home, '.cursor', 'skills'));
});

test('resolveHostSelection returns selected hosts and unknown ids', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-hosts-sel-'));
  context.after(() => rm(home, { recursive: true, force: true }));
  await mkdir(join(home, '.gemini'), { recursive: true });

  const result = await resolveHostSelection(['gemini', 'nope'], { home });
  assert.equal(result.selected.length, 1);
  assert.equal(result.selected[0].id, 'gemini');
  assert.equal(result.selected[0].detected, true);
  assert.deepEqual(result.unknown, ['nope']);
});
