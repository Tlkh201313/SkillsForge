import test from 'node:test';
import assert from 'node:assert/strict';
import { runEvaluation } from '../scripts/eval.mjs';

test('evaluation reports confusion counts, not bare percentages', async () => {
  const report = await runEvaluation();
  assert.ok(report.total >= 80);
  assert.equal(report.total, report.tp + report.fp + report.fn + report.tn);
  assert.ok(Array.isArray(report.failures));
  for (const f of report.failures) {
    assert.ok(f.query && 'expected' in f && 'actual' in f);
  }
});
