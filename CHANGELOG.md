# Changelog

All notable changes to SkillsForge are recorded here.

## [0.3.0] - 2026-07-13

### Added

- Capability-engine integration on top of the marketplace architecture.
- Canonical `skillsforge.json` sidecar contract, deterministic forge, explainable routing, policy scanning, evidence receipts, and a self-contained runtime CLI.
- Skill-scoped Claude policy hooks compiled from declared capabilities.
- Holdout routing evaluation and cache-copy install smoke tests.
- Plugin slash commands: `validate`, `route`, `forge`, `doctor`, `verify-receipt`.
- Full CLI help text and README reference for all subcommands (including `install`, `package`, and `evidence`).
- Diagrams for plugin components, trust pipeline, fail-closed PreToolUse, holdout eval gate, and host installer flow.
- Interactive `skillsforge install` (CodeGraph-style TUI) to copy validated skills into Claude Code, Cursor, Codex, OpenCode, and Gemini host skill directories.

#### Build Week — Codex native trust pipeline

- Native Codex plugin packaging: `plugins/skillsforge/.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, per-skill `agents/openai.yaml`.
- `skillsforge package --host codex` — validate-first compiler that emits one guarded Codex plugin per skill (manifest, complete skill tree, hooks, immutable policy, receipt).
- Codex `PreToolUse` policy compiler and fail-closed runner for `Bash`, `apply_patch`, and `mcp__*` matchers (`codex-policy-compiler`, `codex-pre-tool-policy.mjs`).
- Package-fidelity host installs (complete skill directories; corrected Codex `~/.agents/skills` and OpenCode roots).
- Deterministic `skillsforge evidence` bundle for judge-grade trust/eval artifacts.
- Codex-first demo docs and examples: `examples/codex-unsafe-release/`, `examples/codex-safe-release/`, sub-three-minute script in `docs/hackathon-demo.md`.

### Changed

- Docs and marketplace copy focus on one capability / trust-engine plugin (`skillsforge`); eight-plugin family roadmap marked historical in `MASTER_PLAN.md`.
- README thesis is Codex-first Developer Tools: reviewable, least-privilege, measurable, tamper-evident Agent Skills — not feature-count parity.
- Host support matrix: Codex is **native plugin + guarded package**; Cursor/OpenCode/Gemini are package fidelity; Claude remains full.
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
