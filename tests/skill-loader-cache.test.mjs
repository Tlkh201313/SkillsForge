import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { clearSkillIndexCache, loadAllSkills } from '../lib/capabilities/skill-loader.mjs';

test('skill index cache invalidates when SKILL.md mtime changes', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-fingerprint-'));
  context.after(async () => {
    clearSkillIndexCache();
    await rm(home, { recursive: true, force: true });
  });

  const pluginSkills = join(home, 'plugins', 'skillsforge', 'skills', 'fp-skill');
  await mkdir(pluginSkills, { recursive: true });
  const skillFile = join(pluginSkills, 'SKILL.md');
  await writeFile(skillFile, `---
name: fp-skill
description: Use when testing skill index fingerprint invalidation for cache freshness.
---

# Fp Skill
`);

  clearSkillIndexCache();
  const first = await loadAllSkills(home, { home, noCache: false });
  assert.equal(first.length, 1);
  assert.equal(first[0].name, 'fp-skill');

  await writeFile(skillFile, `---
name: fp-skill
description: Use when testing skill index fingerprint invalidation after a body edit.
---

# Fp Skill Updated
`);
  // Ensure mtime advances on filesystems with coarse timestamps.
  const future = new Date(Date.now() + 2000);
  await utimes(skillFile, future, future);

  const second = await loadAllSkills(home, { home, noCache: false });
  assert.equal(second.length, 1);
  assert.match(second[0].body, /Fp Skill Updated/);
});
