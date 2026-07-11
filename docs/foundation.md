# Foundation

Phase 0 establishes the files and checks that later SkillsForge phases build on.

## Repository layout

The product root contains canonical directories for the Library, Forge, Orchestrator, adapters, schemas, scripts, tests, docs, plugin metadata, commands, agents, hooks, and CI.

## Validation

`node scripts/validate-skill.mjs --all` validates real skills under `skills/`. The validator also accepts explicit skill paths, which Phase 0 uses for positive and negative fixtures.

## Tests

`npm test` runs `scripts/test.mjs`, which discovers `tests/**/*.test.mjs` recursively and delegates execution to Node's built-in test runner.
