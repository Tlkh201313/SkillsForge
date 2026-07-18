import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { runPressure } from '../lib/capabilities/bench.mjs';
import { runSkillShield } from '../lib/capabilities/skillshield.mjs';
import { exportAgentsMd } from '../lib/capabilities/export-agents.mjs';
import { buildScaffoldFiles } from '../lib/capabilities/scaffold.mjs';

const root = process.cwd();

test('pressure fixtures exist for methodology skills', async () => {
  const dir = join(root, 'plugins', 'skillsforge', 'skills', 'tdd-first');
  const result = await runPressure(dir);
  assert.equal(result.ok, true);
  assert.ok(result.fixtures >= 1);
});

test('skillshield passes scaffolded eng skill', async () => {
  const dir = join(root, 'plugins', 'skillsforge', 'skills', 'eng-api-design');
  const result = await runSkillShield(dir, { root });
  assert.equal(result.ok, true);
});

test('export-agents writes AGENTS.md', async () => {
  const out = join(root, 'artifacts', 'AGENTS.generated.md');
  const result = await exportAgentsMd(root, { out });
  assert.equal(result.ok, true);
  assert.ok(result.skills >= 350);
});

test('scaffold files include CSO description and pack', () => {
  const files = buildScaffoldFiles({
    name: 'demo-skill',
    pack: 'eng',
    mode: 'explicit',
    description: 'Use when demoing scaffold output for SkillsForge.'
  });
  assert.match(files['SKILL.md'], /Use when demoing/);
  const sidecar = JSON.parse(files['skillsforge.json']);
  assert.equal(sidecar.routing.pack, 'eng');
  assert.equal(sidecar.routing.mode, 'explicit');
});
