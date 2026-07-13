import test from 'node:test';
import assert from 'node:assert/strict';
import { emitCursor } from '../adapters/cursor.mjs';
import { loadAllSkills } from '../core/skill-loader.mjs';
import { rm } from 'node:fs/promises';

test('cursor export accounts for every canonical field', async () => {
  await rm('dist/cursor-test', { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  const skills = await loadAllSkills('skills');
  const { lossiness } = await emitCursor(skills, 'dist/cursor-test');
  const fields = [
    'name',
    'description',
    'body',
    'maturity',
    'platform',
    'requires',
    'routing.triggers',
    'routing.antiTriggers',
    'capabilities'
  ];
  for (const skill of lossiness) {
    for (const field of fields) {
      const entry = skill.fields.find((f) => f.field === field);
      assert.ok(entry, `${skill.name} missing accounting for ${field}`);
      assert.ok(['mapped', 'transformed', 'unsupported'].includes(entry.status));
    }
  }
});
