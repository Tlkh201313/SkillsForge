import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSkills } from '../lib/capabilities/skill-loader.mjs';
import { routeQuery } from '../lib/capabilities/router.mjs';

const modulePath = fileURLToPath(import.meta.url);
const repositoryRoot = resolve(dirname(modulePath), '..');

function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}

function calculateMetrics(cases, select) {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  const failures = [];
  const latenciesMs = [];
  for (const { query, expected } of cases) {
    const started = performance.now();
    const actual = select(query);
    latenciesMs.push(performance.now() - started);
    if (expected === null && actual === null) tn++;
    else if (expected === null && actual !== null) {
      fp++;
      failures.push({ query, expected, actual });
    } else if (expected !== null && actual === expected) tp++;
    else {
      fn++;
      failures.push({ query, expected, actual });
    }
  }
  return {
    total: cases.length,
    tp,
    fp,
    fn,
    tn,
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
  console.log(`routing: ${report.tp}+${report.tn}/${report.total} P=${report.precision?.toFixed(2)} R=${report.recall?.toFixed(2)} p50=${report.latencyMs?.p50?.toFixed(2)}ms p95=${report.latencyMs?.p95?.toFixed(2)}ms`);
  console.log(`metadata-only baseline: ${report.metadataOnlyBaseline.tp}+${report.metadataOnlyBaseline.tn}/${report.total} P=${report.metadataOnlyBaseline.precision?.toFixed(2)} R=${report.metadataOnlyBaseline.recall?.toFixed(2)}`);
  console.log(`corpusSha256=${report.corpusSha256} frozen=${report.frozen}`);
  process.exit(report.precision >= 0.9 && report.recall >= 0.85 ? 0 : 1);
}
