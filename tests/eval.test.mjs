import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateMetrics, HOLDOUT_PRECISION_MIN, HOLDOUT_RECALL_MIN, runEvaluation } from '../scripts/eval.mjs';
import { routeQuery } from '../lib/capabilities/router.mjs';
import { loadAllSkills } from '../lib/capabilities/skill-loader.mjs';

test('routing corpora meet size targets', async () => {
  const [tune, holdout] = await Promise.all([
    runEvaluation({ corpus: 'routing-tune.json', write: false }),
    runEvaluation({ corpus: 'routing-holdout.json', write: false })
  ]);

  assert.ok(tune.total >= 60, `tune corpus has ${tune.total} cases`);
  assert.ok(holdout.total >= 40, `holdout corpus has ${holdout.total} cases`);
  assert.match(tune.corpusSha256, /^[a-f0-9]{64}$/);
  assert.match(holdout.corpusSha256, /^[a-f0-9]{64}$/);
});

test('honest confusion: wrong non-null selection increments both fp and fn', () => {
  const forced = new Map([
    ['q-wrong', 'verify-capability'],
    ['q-fn', null],
    ['q-fp', 'author-capability'],
    ['q-tp', 'author-capability'],
    ['q-tn', null]
  ]);
  const metrics = calculateMetrics(
    [
      { query: 'q-wrong', expected: 'author-capability' },
      { query: 'q-fn', expected: 'author-capability' },
      { query: 'q-fp', expected: null },
      { query: 'q-tp', expected: 'author-capability' },
      { query: 'q-tn', expected: null }
    ],
    (query) => forced.get(query)
  );

  assert.equal(metrics.tp, 1);
  assert.equal(metrics.tn, 1);
  assert.equal(metrics.fp, 2);
  assert.equal(metrics.fn, 2);
  assert.equal(metrics.exactMatchAccuracy, 0.4);
  assert.ok(metrics.tp + metrics.fp + metrics.fn + metrics.tn > metrics.total);
  assert.equal(metrics.precision, 1 / 3);
  assert.equal(metrics.recall, 1 / 3);
});

test('holdout full router meets thresholds and reports metadata baseline', async () => {
  const report = await runEvaluation({ write: false });

  assert.ok(report.total >= 40, `holdout corpus has ${report.total} cases`);
  assert.ok(
    report.tp + report.fp + report.fn + report.tn >= report.total,
    'confusion counts cover all cases (wrong-skill may double-count)'
  );
  assert.equal(typeof report.exactMatchAccuracy, 'number');
  assert.ok(report.exactMatchAccuracy >= 0 && report.exactMatchAccuracy <= 1);
  assert.ok(report.precision >= HOLDOUT_PRECISION_MIN, `precision ${report.precision}`);
  assert.ok(report.recall >= HOLDOUT_RECALL_MIN, `recall ${report.recall}`);
  assert.equal(typeof report.frozen, 'string');
  assert.match(report.corpusSha256, /^[a-f0-9]{64}$/);
  assert.equal(typeof report.latencyMs.p50, 'number');
  assert.equal(typeof report.latencyMs.p95, 'number');
  assert.ok(report.latencyMs.p95 >= report.latencyMs.p50);
  assert.deepEqual(report.fullRouter, {
    total: report.total,
    tp: report.tp,
    fp: report.fp,
    fn: report.fn,
    tn: report.tn,
    exactMatchAccuracy: report.exactMatchAccuracy,
    precision: report.precision,
    recall: report.recall,
    latencyMs: report.latencyMs,
    failures: report.failures
  });
  assert.equal(report.metadataOnlyBaseline.total, report.total);
  assert.ok(
    report.recall > report.metadataOnlyBaseline.recall,
    `full recall ${report.recall} should beat metadata-only ${report.metadataOnlyBaseline.recall}`
  );
  assert.equal(
    report.comparison.recallDelta,
    report.recall - report.metadataOnlyBaseline.recall
  );
  assert.equal(report.metadataOnlyBaseline.tp, 0);
  assert.equal(report.metadataOnlyBaseline.fp, 0);
});

test('holdout rejects lexical collision negatives', async () => {
  const skills = await loadAllSkills(process.cwd());
  for (const query of [
    'deploy skill marketplace frontend',
    'forge steel parts for a capability bracket',
    'validate agent payroll records'
  ]) {
    const result = routeQuery(query, skills);
    assert.equal(result.selected, null, query);
  }
});
