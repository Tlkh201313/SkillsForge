import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSkills } from '../lib/capabilities/skill-loader.mjs';
import { routeQuery } from '../lib/capabilities/router.mjs';

const modulePath = fileURLToPath(import.meta.url);
const repositoryRoot = resolve(dirname(modulePath), '..');

/** Release gate: holdout precision / recall. */
export const HOLDOUT_PRECISION_MIN = 0.95;
export const HOLDOUT_RECALL_MIN = 0.9;

function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}

/**
 * Honest one-vs-rest confusion for routing:
 * - expected A, got B (both non-null, different): FP + FN
 * - expected skill, got null: FN only
 * - expected null, got skill: FP only
 * - exact correct skill / null: TP / TN
 * exactMatchAccuracy is reported separately (exact label match rate).
 */
export function calculateMetrics(cases, select) {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  let exactMatches = 0;
  const failures = [];
  const latenciesMs = [];
  for (const { query, expected } of cases) {
    const started = performance.now();
    const actual = select(query);
    latenciesMs.push(performance.now() - started);
    if (expected === null && actual === null) {
      tn += 1;
      exactMatches += 1;
    } else if (expected === null && actual !== null) {
      fp += 1;
      failures.push({ query, expected, actual });
    } else if (expected !== null && actual === expected) {
      tp += 1;
      exactMatches += 1;
    } else if (expected !== null && actual === null) {
      fn += 1;
      failures.push({ query, expected, actual });
    } else {
      // Wrong non-null selection: one-vs-rest FP (predicted B) + FN (missed A).
      fp += 1;
      fn += 1;
      failures.push({ query, expected, actual });
    }
  }
  return {
    total: cases.length,
    tp,
    fp,
    fn,
    tn,
    exactMatchAccuracy: cases.length === 0 ? null : exactMatches / cases.length,
    precision: tp + fp === 0 ? null : tp / (tp + fp),
    recall: tp + fn === 0 ? null : tp / (tp + fn),
    latencyMs: {
      p50: percentile(latenciesMs, 50),
      p95: percentile(latenciesMs, 95)
    },
    failures
  };
}

export async function runEvaluation(options = {}) {
  const root = options.root ?? repositoryRoot;
  const corpusName = options.corpus ?? 'routing-holdout.json';
  const corpusPath = join(root, 'evaluation', corpusName);
  const corpusSource = await readFile(corpusPath);
  const corpus = JSON.parse(corpusSource.toString('utf8'));
  const skills = await loadAllSkills(root);
  const started = Date.now();
  const fullRouter = calculateMetrics(
    corpus.cases,
    (query) => routeQuery(query, skills).selected
  );
  const metadataOnlySkills = skills.map((skill) => ({ ...skill, sidecar: null }));
  const metadataOnlyBaseline = calculateMetrics(
    corpus.cases,
    (query) => routeQuery(query, metadataOnlySkills).selected
  );
  const report = {
    corpus: corpusName,
    frozen: corpus.frozen,
    corpusSha256: createHash('sha256').update(corpusSource).digest('hex'),
    ...fullRouter,
    fullRouter,
    metadataOnlyBaseline,
    comparison: {
      precisionDelta: fullRouter.precision === null || metadataOnlyBaseline.precision === null
        ? null
        : fullRouter.precision - metadataOnlyBaseline.precision,
      recallDelta: fullRouter.recall === null || metadataOnlyBaseline.recall === null
        ? null
        : fullRouter.recall - metadataOnlyBaseline.recall
    },
    durationMs: Date.now() - started,
  };
  if (options.write !== false) {
    await mkdir(join(root, 'artifacts', 'evaluation'), { recursive: true });
    await writeFile(join(root, 'artifacts', 'evaluation', 'routing-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const report = await runEvaluation();
  console.log(
    `routing: ${report.tp}+${report.tn}/${report.total} exact=${report.exactMatchAccuracy?.toFixed(2)} ` +
    `P=${report.precision?.toFixed(2)} R=${report.recall?.toFixed(2)} ` +
    `p50=${report.latencyMs?.p50?.toFixed(2)}ms p95=${report.latencyMs?.p95?.toFixed(2)}ms`
  );
  console.log(
    `metadata-only baseline: ${report.metadataOnlyBaseline.tp}+${report.metadataOnlyBaseline.tn}/${report.total} ` +
    `P=${report.metadataOnlyBaseline.precision == null ? 'n/a' : report.metadataOnlyBaseline.precision.toFixed(2)} ` +
    `R=${report.metadataOnlyBaseline.recall == null ? 'n/a' : report.metadataOnlyBaseline.recall.toFixed(2)}`
  );
  console.log(`corpusSha256=${report.corpusSha256} frozen=${report.frozen}`);
  process.exit(
    report.precision >= HOLDOUT_PRECISION_MIN && report.recall >= HOLDOUT_RECALL_MIN ? 0 : 1
  );
}
