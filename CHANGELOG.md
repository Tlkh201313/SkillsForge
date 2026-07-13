# Changelog

All notable changes to SkillsForge are recorded here.

## [0.3.0] - 2026-07-13

### Added

- Capability-engine integration on top of the marketplace architecture.
- Canonical `skillsforge.json` sidecar contract, deterministic forge, explainable routing, policy scanning, evidence receipts, and a self-contained runtime CLI.
- Skill-scoped Claude policy hooks compiled from declared capabilities.
- Holdout routing evaluation and cache-copy install smoke tests.
- Plugin slash commands: `validate`, `route`, `forge`, `doctor`, `verify-receipt`.
- Full CLI help text and README reference for all nine subcommands.
- Diagrams for plugin components, trust pipeline, fail-closed PreToolUse, and holdout eval gate.

### Changed

- Docs and marketplace copy focus on one capability / trust-engine plugin (`skillsforge`); eight-plugin family roadmap marked historical in `MASTER_PLAN.md`.
- Release gate is hard-fail: `validate:host` runs local `claude plugin validate --strict` (no soft-skip); CI release-contract + Windows smoke require demo, dist, and host validation.

### Fixed

- Honest one-vs-rest routing metrics (wrong skill = FP+FN) with separate exact-match accuracy; holdout gate raised to P≥0.95 / R≥0.90.
- Contiguous phrase routing with required trigger evidence, stronger anti-triggers, and #1/#2 score margin.

## [0.2.0] - 2026-07-11

### Changed

- Restructured as a multi-plugin marketplace; no action for installed users.
- Moved the existing validator plugin under `plugins/skillsforge` without changing its marketplace or skill names.
- Added repository-wide version lockstep checks and multi-plugin skill discovery.
- Embedded generated schemas in the standalone validator so installed plugins do not depend on repository source files.

## [0.1.0] - 2026-07-11

### Added

- A working `validate-agent-skill` Claude Code skill.
- Portable Agent Skills and explicit Claude Code validation profiles.
- Real YAML parsing and Draft 2020-12 JSON Schema validation.
- Human-readable and JSON diagnostics with stable exit codes.
- A generated standalone validator command for dependency-free plugin installs.
- Cross-platform tests, strict Claude plugin validation, and bundle freshness checks.
- MIT licensing and accurate installation, architecture, safety, and usage documentation.

### Fixed

- Corrected the Claude Code plugin and marketplace manifest structures.
- Replaced prefix-based path checks with separator-aware and real-path containment.
- Added support for BOM, CRLF, comments, quoted values, and multiline YAML.
- Made an empty production skill library fail validation by default.

### Removed

- Placeholder commands, agents, hooks, adapters, routing, synchronization, forge, and orchestration modules that did not implement their advertised behavior.
