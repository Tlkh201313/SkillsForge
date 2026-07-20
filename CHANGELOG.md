# Changelog

All notable changes to SkillsForge are recorded here.

## [0.4.3] - 2026-07-20

### Changed - Submission polish and host update guidance

- Recorded the Codex `/feedback` Session ID and broadened Build Week notes to cover product, design, docs, media, verification, and release planning, not only coding.
- Updated the visible inventory to **511** skills, **28** packs, **11** profiles, **100** workflows, **98** agents, and **140** command shims.
- Added explicit Codex and Claude Code update guidance while keeping plugin upgrades user-controlled.
- Documented Claude Code's lazy-load expectation: compact SessionStart hint first, route/recommend before loading individual skill bodies.

### Added - Lightweight version check

- `skillsforge version`, `skillsforge --version`, and `skillsforge -v` print the current CLI version without loading the skill catalog or library index.

## [0.4.2] - 2026-07-19

### Added - ForgeMap + ForgeSlim for AI CLIs

- `sf map` (ForgeMap): zero-dep lightweight JS/TS structural index under `artifacts/forgemap/index.json` with `status` / `index` / `files` / `symbol` / `callers` / `impact` / `explore`. Optionally enriches from `.codegraph/codegraph.db` via `node:sqlite` (fail open).
- `sf slim` (ForgeSlim): pure-JS output compressors for `status` / `diff` / `log` / `test` / `run` / `rg`, plus `slim gain` ledger at `artifacts/skillsforge-slim-gain.json` (chars/4 estimates - not provider billing).
- AI host steering: `AGENTS.md` token-budget section, `using-skillsforge` iron law, host specialist agents, slash commands `map`/`slim`/`digest`/`tokens`/`next`, MCP tools `map`/`slim`/`digest`/`next`/`tokens`.
- PowerShell helpers: `sf-map`, `sf-slim`, `sf-slim-gain`.
- Docs: `docs/forgemap-slim.md` (honest limits; no unverifiable multipliers).

### Changed - Operator tokens/digest

- `tokens --catalog` defaults to **repo skills only** (fast); pass `--installed` to include host-installed skills.
- `digest` reuses library recommend hits for token cost instead of rescanning the full catalog.
- `next` / `digest` hint `map index` / `slim status` / `map explore` when useful.
- Session tracker path `artifacts/skillsforge-token-session.json` documented as gitignored local state.

### Changed - Short CLI aliases

- `package.json` `bin` now exposes both `skillsforge` and `sf` (same binary). After `npm link`, type `sf demo` / `skillsforge help` instead of the long `node .../skillsforge.mjs` path.
- `ps export` also writes a passthrough `sf.ps1` helper.

### Changed - Work OS quality pass (Phase A)

- CLI `help` regrouped: Catalog & authoring -> Operator terminals -> Hosts & install -> Trust & ship -> Compat (os-*).
- `lib recommend` / `workflows recommend` use confidence thresholds; return `confidence`, `fallback: no-confident-match`, `alternatives`, `needsConfirmation`, and skill `riskFlags` instead of forcing weak matches.
- Library UI shows explicit "No confident match" empty state.
- `validate-repo` claim/media/package-allowlist hygiene for full repos; README claim + media tests.
- Skill index cache fingerprint includes per-skill `SKILL.md` / sidecar mtimes.
- Lean scaffold/gen-pack descriptions + pack-aware antiTriggers; regenerable scaffolds synced.
- Promoted 15 high-traffic eng/security/docs skills from lean scaffolds to concrete workflows (still experimental maturity).
- AGENTS.md productivity framing.

## [0.4.1] - 2026-07-19

### Changed - Productivity-first framing

- README, plugin manifests, marketplace, architecture, and banners now lead with the **Work OS** story (skills, packs, workflows, library, auto, wb) - trust validate/package/hooks/receipts is the safety layer underneath.
- Demo artifact renamed to `artifacts/demo-evidence/demo-scoreboard.json` (package-tree hash; not a full trust receipt).
- Judge docs drop dead `npx skillsforge` CTAs; submit docs retarget `main`.
- Threat/eval titles and CI evidence artifact bumped to v0.4; Codex `isMcpTool` matches `^mcp__` only.
- Full inventory doc: `docs/features.md` (+ `scripts/gen-features-md.mjs`).

## [0.4.0] - 2026-07-18

### Added - Workbench, Library, And Workflow Routing

- Catalog substrate: `catalog/skillsforge.catalog.yaml`, 26 packs, 10 profiles, pack-scoped routing (`routing.mode` / `routing.pack`).
- **367** cataloged skills with sidecars and host metadata, **98** agents, **124** commands, and **100** dry-run workflow definitions.
- Vibe CLI toolkit: `vibe`, `catalog`, `quality`, `lint-skill`, `bench`, `compose`, `watch`, `scorecard`, `scaffold`, `stocktake`, `batch`, `compare`, `pressure`, `skillshield`, `export-agents`, `capture`, `forge-from-capture`.
- Token-friendly workbench commands: `wb status|tree|find|grep|diff|errors|bigfiles|recent|proof`.
- Local skill library: `lib build|update|recommend` emits JSON, single-file HTML, AI index, and session-aware recommendations across repo and installed user skills; `lib serve` is localhost and read-only by default.
- Workflow router: `workflows list|show|recommend|run --dry-run|export-html` plus `auto plan` and `auto run --read-only`.
- PowerShell helper export: `ps export` writes local `sf-*.ps1` wrappers around compact repo, library, workflow, and auto CLI commands.
- Skill Authoring Factory: scaffold + CSO quality rubric + pressure fixtures for methodology/auto heroes.
- Cross-harness: `export-agents` writes `AGENTS.md`; Cursor rules under `plugins/skillsforge/rules/`.
- Docs: `docs/inspiration.md`, `docs/competitive-matrix.md`, `docs/skill-authoring.md`, `docs/work-os.md`, Work Artifact Contract under `docs/work/`.
- Generator: `npm run gen:packs` (`scripts/gen-pack-skills.mjs` + `scripts/pack-inventory.mjs`).

### Changed

- Default `route` only considers `routing.mode: auto` (or unset legacy) skills; use `--pack` / `--include-explicit` for domain packs.
- README inventory, demo poster, packaged MP4, universal host boundaries, and local workflow/library commands.

## [0.3.0] - 2026-07-13

### Added

- Capability-engine integration on top of the marketplace architecture.
- Canonical `skillsforge.json` sidecar contract, deterministic forge, explainable routing, policy scanning, evidence receipts, and a self-contained runtime CLI.
- Skill-scoped Claude policy hooks compiled from declared capabilities.
- Holdout routing evaluation and cache-copy install smoke tests.
- Plugin slash commands: `validate`, `route`, `forge`, `doctor`, `verify-receipt`.
- Full CLI help text and README reference for all subcommands, including `install`, `package`, and `evidence`.
- Diagrams for plugin components, trust pipeline, fail-closed PreToolUse, holdout eval gate, and host installer flow.
- Interactive `skillsforge install` to copy validated skills into Claude Code, Cursor, Codex, OpenCode, and Gemini host skill directories.

#### Build Week - Codex Native Trust Pipeline

- Native Codex plugin packaging: `plugins/skillsforge/.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, per-skill `agents/openai.yaml`.
- `skillsforge package --host codex` - validate-first compiler that emits one guarded Codex plugin per skill.
- Codex `PreToolUse` policy compiler and fail-closed runner for `Bash`, `apply_patch`, and `mcp__*` matchers (`codex-policy-compiler`, `codex-pre-tool-policy.mjs`).
- Package-fidelity host installs: complete skill directories plus corrected Codex `~/.agents/skills` and OpenCode roots.
- Deterministic `skillsforge evidence` bundle for trust and eval artifacts.
- Codex-first demo docs and examples: `examples/codex-unsafe-release/`, `examples/codex-safe-release/`, sub-three-minute script in `docs/hackathon-demo.md`.

### Changed

- Docs and marketplace copy focus on one capability / trust-engine plugin (`skillsforge`); eight-plugin family roadmap is historical.
- README thesis is Codex-first Developer Tools: reviewable, least-privilege, measurable, tamper-evident Agent Skills, not feature-count parity.
- Host support matrix: Codex is native plugin + guarded package; Cursor/OpenCode/Gemini are package fidelity; Claude remains full.
- Release gate is hard-fail: `validate:host` runs local `claude plugin validate --strict`; CI release-contract + Windows smoke require demo, dist, and host validation.

### Fixed

- Honest one-vs-rest routing metrics with separate exact-match accuracy; holdout gate raised to P>=0.95 / R>=0.90.
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

- Early command, agent, hook, adapter, routing, synchronization, forge, and orchestration scaffolds that did not implement their advertised behavior.
