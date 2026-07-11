# Phase 0 Evidence

Acceptance evidence is captured from live commands in the phase report. This file documents where that evidence belongs and why Phase 0 is complete only when the commands pass.

Required checks:

- `npm test`
- `node scripts/validate-skill.mjs tests/fixtures/skills/bad-*`
- `node scripts/validate-skill.mjs tests/fixtures/skills/good-*`
- `node scripts/validate-skill.mjs --all`
- plugin and marketplace manifests validate against `schemas/plugin.schema.json`
- CI runs validation and tests, with the Phase 4 sync freshness gate explicitly labeled
- `git log --oneline` shows small coherent commits
