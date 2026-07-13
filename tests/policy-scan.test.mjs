import test from 'node:test';
import assert from 'node:assert/strict';
import { scanSkill } from '../policy/scan-skill.mjs';
import { loadSkill } from '../core/skill-loader.mjs';

test('flags undeclared executable content', async () => {
  const findings = await scanSkill(await loadSkill('tests/fixtures/policy/undeclared-exec'));
  assert.ok(findings.some((f) => f.rule === 'undeclared-exec' && f.blocking));
});

test('flags undeclared network references', async () => {
  const findings = await scanSkill(await loadSkill('tests/fixtures/policy/undeclared-network'));
  assert.ok(findings.some((f) => f.rule === 'undeclared-network' && f.blocking));
});

test('declared capabilities produce no blocking findings', async () => {
  const findings = await scanSkill(await loadSkill('tests/fixtures/policy/honest-exec'));
  assert.equal(findings.filter((f) => f.blocking).length, 0);
});

test('flags path escape links', async () => {
  const findings = await scanSkill(await loadSkill('tests/fixtures/policy/path-escape'));
  assert.ok(findings.some((f) => f.rule === 'path-escape' && f.blocking));
});
