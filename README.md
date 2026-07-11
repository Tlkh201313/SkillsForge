# SkillsForge

SkillsForge is a local, cross-platform system for building, validating, routing, and running agent skills.

## Phase 0 foundation

This repository currently provides the foundation for the product:

- the canonical repository layout for skills, commands, agents, hooks, Forge, Orchestrator, adapters, schemas, scripts, tests, and docs;
- plugin and marketplace manifests under `.claude-plugin/`;
- JSON schemas for skill frontmatter and plugin manifests;
- a tested `node:test` runner at `scripts/test.mjs`;
- a tested skill validator at `scripts/validate-skill.mjs`;
- CI that runs validation and tests on push and pull request.

## Commands

```sh
npm test
npm run validate
node scripts/validate-skill.mjs --all
```

The `route`, `build`, and `sync` npm scripts are present for the future phases that activate those capabilities.

## Source boundary

`teacher (FABLE 5)/` is the read-only curriculum package and is intentionally ignored by git. Product source lives in this repository root beside that folder.
