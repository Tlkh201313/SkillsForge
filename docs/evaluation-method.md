# Evaluation method

## Routing corpus

- File: `evaluation/routing-corpus.json`
- Frozen date: field `frozen`
- Shape: `{ query, expected }` where `expected` is a skill name or `null`
- Minimum size: 80 cases (40 positive / 40 hard negative)

Protocol:

1. Freeze the corpus before tuning the router.
2. Tune triggers/antiTriggers/weights against the frozen set.
3. Never silently edit cases to improve a score; bump `frozen` and treat it as a new corpus version if cases must change.
4. Report TP/FP/FN/TN counts, not bare percentages alone.

Runner: `npm run eval` → `artifacts/evaluation/routing-report.json`

Exit code 0 requires precision ≥ 0.90 and recall ≥ 0.85.

## Policy suite

Fixtures under `tests/fixtures/policy/` cover undeclared exec, undeclared network, path escape, and honest declared exec.

## Build determinism

`npm run build` twice must produce the same `receiptHash`. Trust receipts omit timestamps.

## Baselines

Compare against:

1. Structural validator alone (presence, not routing quality)
2. Metadata-only description matching
3. Full SkillsForge router with sidecars

## Adoption claims

Do not convert lab metrics into “90% of developers.” Cohort persuasion requires an explicit sample (for example 27/30 restate value and start trial).
