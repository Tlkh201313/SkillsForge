# Changelog

## 0.2.0 — Capability engineering MVP

- Working Claude Code plugin surface: skills, commands, verified SessionStart hook.
- Three canonical dogfood skills with sidecars.
- Deterministic explainable router + CLI.
- Frozen 80-case routing evaluation corpus and `npm run eval`.
- Capability policy scanner with adversarial fixtures.
- Deterministic Claude build with trust receipt.
- Cursor export proof with per-field lossiness accounting.
- Golden demo fixture under `examples/safe-dependency-upgrade/`.
- Docs: architecture, threat model, evaluation method, reference ledger.

## 0.1.0 — Foundation

- Established the SkillsForge repository scaffold.
- Added plugin and marketplace manifests.
- Added skill frontmatter and plugin manifest schemas.
- Added a tested skill validator with positive and negative fixtures.
- Added a recursive `node:test` runner.
- Added CI for validation and tests.
