import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkill, loadAllSkills } from '../core/skill-loader.mjs';

test('loadSkill merges frontmatter, body, and sidecar', async () => {
  const skill = await loadSkill('tests/fixtures/loader/alpha');
  assert.equal(skill.name, 'alpha');
  assert.equal(skill.maturity, 'stable');
  assert.deepEqual(skill.sidecar.routing.triggers, ['loader fixture']);
  assert.match(skill.body, /## Overview/);
});

test('loadSkill without sidecar yields null sidecar, not error', async () => {
  const skill = await loadSkill('tests/fixtures/skills/good-basic');
  assert.equal(skill.sidecar, null);
});

test('loadAllSkills reads skills directory', async () => {
  const skills = await loadAllSkills('tests/fixtures/loader');
  assert.equal(skills.length, 1);
});
