# PR draft — SkillsForge v0.3.0 capability engine

**Branch:** `feat/v0.3.0-capability-engine` → `main`  
**Status:** Materials only — do not open until asked.

## Summary

- Add capability engine on marketplace layout: sidecar IR, forge, explainable router, static policy scan, skill-scoped PreToolUse enforce, receipts, Cursor lossiness proof.
- Prove installability via marketplace `pluginRoot` tests and plugin-only cache-copy smoke (doctor / validate / route / forge dry-run / enforce / receipt verify).
- Harden release-contract CI (eval, build, dist, smoke, optional Claude plugin validate) and upload evidence artifacts.
- Ship judge-ready docs + offline `npm run demo` + 2:50 hackathon script.

## Evidence / claim boundaries

- Claude Code: full. Cursor: proof only. Codex/OpenCode: unsupported.
- Holdout routing gate: precision ≥ 0.95, recall ≥ 0.90 (see `artifacts/evaluation/routing-report.json`).
- Policy hooks are guardrails, not a sandbox (see `docs/threat-model.md`).

## Test plan

- [ ] `npm ci && npm test`
- [ ] `npm run eval`
- [ ] `npm run build && npm run build:check`
- [ ] `npm run build:dist && npm run smoke:dist`
- [ ] `npm run demo`
- [ ] `claude plugin validate plugins/skillsforge --strict` (when CLI available)
- [ ] `claude plugin validate . --strict` (when CLI available)

## Demo

- Script: `docs/hackathon-demo.md`
- Offline: `npm run demo`
- Video link: _(add before open)_
