import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSkills } from '../core/skill-loader.mjs';
import { routeQuery } from '../router/index.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

export async function runEvaluation() {
  const corpus = JSON.parse(await readFile(join(root, 'evaluation', 'routing-corpus.json'), 'utf8'));
  const skills = await loadAllSkills(join(root, 'skills'));
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  const failures = [];
  for (const { query, expected } of corpus.cases) {
    const actual = routeQuery(query, skills).selected;
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
  const total = corpus.cases.length;
  const precision = tp + fp === 0 ? null : tp / (tp + fp);
  const recall = tp + fn === 0 ? null : tp / (tp + fn);
  return { total, tp, fp, fn, tn, precision, recall, failures, frozen: corpus.frozen };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = await runEvaluation();
  await mkdir(join(root, 'artifacts', 'evaluation'), { recursive: true });
  await writeFile(join(root, 'artifacts', 'evaluation', 'routing-report.json'), JSON.stringify(report, null, 2));
  console.log(`routing: ${report.tp}+${report.tn} correct of ${report.total} (P=${report.precision?.toFixed(2)}, R=${report.recall?.toFixed(2)})`);
  console.log(`failures: ${report.failures.length} — see artifacts/evaluation/routing-report.json`);
  if (report.failures.length > 0) {
    for (const failure of report.failures.slice(0, 10)) {
      console.log(`  - "${failure.query}" expected=${failure.expected} actual=${failure.actual}`);
    }
  }
  process.exit(report.precision >= 0.9 && report.recall >= 0.85 ? 0 : 1);
}
