import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { runOutputProof, PROOF_SKILLS, RUBRIC } from '../lib/capabilities/output-proof.mjs';

test('output proof compares the same task without inventing model metrics', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'skillsforge-output-proof-'));
  try {
    const result = await runOutputProof(process.cwd(), { outDir });
    assert.equal(result.ok, true);
    assert.deepEqual(result.selectedSkills, PROOF_SKILLS);
    assert.equal(result.summary.baseline.score, 0);
    assert.equal(result.summary.skillsforge.score, RUBRIC.length);
    assert.match(result.note, /does not claim an LLM benchmark/i);
    assert.equal(result.checks.length, RUBRIC.length);
    const markdown = await readFile(join(outDir, 'output-proof.md'), 'utf8');
    const json = JSON.parse(await readFile(join(outDir, 'output-proof.json'), 'utf8'));
    assert.match(markdown, /Baseline response/);
    assert.match(markdown, /SkillsForge-assisted response/);
    assert.match(markdown, /contract coverage only/i);
    assert.equal(json.version, '0.4.3');
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});
