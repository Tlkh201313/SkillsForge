# PR draft — SkillsForge v0.3.0 capability engine

**Branch:** `feat/v0.3.0-capability-engine` → `main`  
**Status:** Materials only — do not open until asked.

## Summary

- Ship **one** plugin (`skillsforge`): capability / trust engine on marketplace layout — sidecar IR, forge, explainable router, static policy scan, skill-scoped PreToolUse guardrails, receipts, Cursor lossiness proof.
- Prove installability via marketplace `pluginRoot` tests and plugin-only cache-copy smoke (doctor / validate / route / forge dry-run / enforce / receipt verify).
- Harden release-contract CI (eval, build, dist, smoke, hard `validate:host`) and upload evidence artifacts.
- Align docs/marketplace claims: no family overclaim (no workflow / token ledger / domain packs).
- Ship judge-ready docs + offline `npm run demo` + 2:50 hackathon script.

## Evidence / claim boundaries

- One plugin: `skillsforge`.
- Claude Code: full (validation, routing, skill-scoped PreToolUse guardrails, receipts, eval).
- Cursor: lossy export proof only — not runtime policy parity.
- Codex / OpenCode: unsupported.
- Holdout routing gate: precision ≥ 0.95, recall ≥ 0.90 (see `artifacts/evaluation/routing-report.json`).
- Hooks = guardrails ≠ OS sandbox (see `docs/threat-model.md`).
- Anti-goals: MCP, LSP, monitors, token ledger, domain packs, multi-host parity, sandbox/attestation claims.

## Test plan

- [ ] `npm ci && npm test`
- [ ] `npm run eval`
- [ ] `npm run build && npm run build:check`
- [ ] `npm run build:dist && npm run smoke:dist`
- [ ] `npm run demo`
- [ ] `npm run validate:repo`
- [ ] `npm run validate:host` (requires dist; hard-fail `claude plugin validate --strict`)

## Demo

- Script: `docs/hackathon-demo.md`
- Offline: `npm run demo`
- Video link: _(add before open)_
