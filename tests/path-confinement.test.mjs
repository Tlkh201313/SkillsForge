import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertSkillId, isInside, resolveUnderRoot } from '../lib/capabilities/paths.mjs';
import { scaffoldSkill } from '../lib/capabilities/scaffold.mjs';
import { exportAgentsMd, captureLearning, redactSecrets } from '../lib/capabilities/export-agents.mjs';
import { routeQuery } from '../lib/capabilities/router.mjs';

test('assertSkillId rejects traversal and path separators', () => {
  assert.throws(() => assertSkillId('../../evil'));
  assert.throws(() => assertSkillId('foo/bar'));
  assert.throws(() => assertSkillId('foo\\bar'));
  assert.throws(() => assertSkillId('Foo-Bar'));
  assert.equal(assertSkillId('safe-skill'), 'safe-skill');
});

test('resolveUnderRoot rejects absolute escape by default', () => {
  const root = process.cwd();
  assert.throws(() => resolveUnderRoot(root, join(tmpdir(), 'sf-escape-out.md')));
  assert.throws(() => resolveUnderRoot(root, join('..', 'outside.txt')));
  const ok = resolveUnderRoot(root, join('artifacts', 'safe.txt'));
  assert.equal(isInside(root, ok), true);
});

test('scaffold rejects traversal names and confined write succeeds', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sf-scaffold-'));
  try {
    await mkdir(join(root, 'plugins', 'skillsforge', 'skills'), { recursive: true });
    const bad = await scaffoldSkill(root, { name: '../../evil', pack: 'eng' }, { write: true, force: true });
    assert.equal(bad.ok, false);
    assert.match(bad.error, /invalid skill id/);

    const slash = await scaffoldSkill(root, { name: 'foo/bar', pack: 'eng' }, { write: true });
    assert.equal(slash.ok, false);

    const good = await scaffoldSkill(root, {
      name: 'confined-demo',
      pack: 'eng',
      mode: 'explicit',
      description: 'Use when testing confined scaffold writes.'
    }, { write: true, force: true });
    assert.equal(good.ok, true);
    assert.equal(isInside(root, good.target), true);
    const sidecar = JSON.parse(await readFile(join(good.target, 'skillsforge.json'), 'utf8'));
    assert.equal(sidecar.routing.pack, 'eng');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('export-agents rejects out path outside root', async () => {
  const root = process.cwd();
  const result = await exportAgentsMd(root, { out: join('..', 'escape-agents.md'), dryRun: true });
  assert.equal(result.ok, false);
  assert.match(result.error, /escapes|rejected/i);
});

test('capture redacts secrets before write', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sf-capture-'));
  try {
    const insight = 'token sk-abcdefghijklmnopqrstuvwxyz ghp_abcdefghijklmnopqrstuvwxyz12 AKIAIOSFODNN7EXAMPLE';
    assert.match(redactSecrets(insight), /\[REDACTED\]/);
    const result = await captureLearning(root, { insight, key: 'secret-test' });
    assert.equal(result.ok, true);
    const raw = await readFile(result.path, 'utf8');
    assert.doesNotMatch(raw, /sk-abcdefghijklmnopqrstuvwxyz/);
    assert.doesNotMatch(raw, /ghp_abcdefghijklmnopqrstuvwxyz12/);
    assert.doesNotMatch(raw, /AKIAIOSFODNN7EXAMPLE/);
    assert.match(raw, /\[REDACTED\]/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('pack route selects eng skill; global route excludes explicit', () => {
  const skills = [
    {
      name: 'eng-api-design',
      description: 'Use when designing APIs',
      maturity: 'stable',
      sidecar: {
        routing: {
          mode: 'explicit',
          pack: 'eng',
          triggers: ['design an api', 'api design'],
          antiTriggers: []
        }
      }
    },
    {
      name: 'validate-agent-skill',
      description: 'Use when validating agent skills',
      maturity: 'stable',
      sidecar: {
        routing: {
          mode: 'auto',
          pack: 'trust',
          triggers: ['validate agent skill', 'validate this skill'],
          antiTriggers: []
        }
      }
    }
  ];
  const global = routeQuery('design an api for payments', skills);
  assert.notEqual(global.selected, 'eng-api-design');

  const packed = routeQuery('design an api for payments', skills, { pack: 'eng' });
  assert.equal(packed.selected, 'eng-api-design');

  const unpackagedAlwaysInFixed = routeQuery('design an api for payments', [
    ...skills,
    {
      name: 'orphan-skill',
      description: 'orphan',
      maturity: 'stable',
      sidecar: {
        routing: {
          mode: 'auto',
          pack: null,
          triggers: ['design an api'],
          antiTriggers: []
        }
      }
    }
  ], { pack: 'eng' });
  assert.notEqual(unpackagedAlwaysInFixed.selected, 'orphan-skill');
});
