# Foundation

Phase 0 established the files and checks that later SkillsForge phases build on. v0.2.0 activates validate, route, eval, policy scan, and build.

## Repository layout

Canonical directories for the Library, Forge, adapters, schemas, scripts, tests, docs, plugin metadata, commands, agents, hooks, and CI.

## Validation

`npm run validate` validates real skills under `skills/`. Sidecars (`skillsforge.json`) are checked when present. Production `requires` resolve only against `skills/`, not test fixtures.

## Tests

`npm test` runs `scripts/test.mjs`, which discovers `tests/**/*.test.mjs` recursively and delegates to Node's built-in test runner.

## Routing and evidence

- `npm run route` / `node scripts/route.mjs "<query>"` — explainable selection
- `npm run eval` — frozen 80-case corpus → `artifacts/evaluation/`
- `npm run build` — policy gate + Claude package + Cursor lossiness + trust receipt under `dist/`
