# OpenAI Build Week — SkillsForge provenance

**Track:** Developer Tools  
**Project:** SkillsForge — Agent Skills trust pipeline for Codex  
**Build window:** 2026-07-13 09:00 PT → 2026-07-21 17:00 PT  
**Branch:** `fix/trust-hardening-from-review`

## Codex / GPT-5.6 Session ID (required)

> **Action required:** Open Codex (CLI or IDE), start a new thread after the build-window start, perform the core Build Week work with **Codex + GPT-5.6**, then run `/feedback` in that thread and paste the Session ID below.

| Field | Value |
|---|---|
| Codex `/feedback` Session ID | `REPLACE_WITH_CODEX_FEEDBACK_SESSION_ID` |
| Model | GPT-5.6 (via Codex) |
| Qualifying thread started | _fill after session_ |

### How to obtain the Session ID

1. Install/open [Codex](https://developers.openai.com/codex/).
2. Start a **new** conversation after July 13, 09:00 PT.
3. Do the Build Week implementation work in that thread (native plugin, package command, Codex hooks, evidence).
4. In that same thread, run `/feedback`.
5. Copy the returned Session ID into this file and the Devpost submission form.
6. Commit: `docs: record Build Week Codex Session ID`.

Without a real Session ID, Stage One compliance fails. Do **not** invent a Session ID.

## Pre-existing vs Build Week work

### Pre-existing (before Build Week / already on `main`)

- Claude Code marketplace plugin, skills, slash commands, SessionStart + PreToolUse hooks
- CLI: `validate`, `doctor`, `route`, `forge`, `receipt`, `verify-receipt`, `enforce`, `eval`, `install`, `help`
- Sidecar capability IR, static policy scan, explainable routing, holdout eval, trust receipts
- Host installer (initial portable-copy version), CI release contract

### Built / extended during Build Week (this branch)

- Native Codex plugin packaging (`.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`)
- Full-fidelity Agent Skill installs across hosts (complete packages, corrected Codex/OpenCode roots)
- `skillsforge package --host codex` — one guarded skill → native Codex plugin
- Codex `PreToolUse` policy compiler + fail-closed hook runner
- Deterministic `skillsforge evidence` bundle + stronger eval fixtures
- Codex-first demo, examples, and documentation

## How Codex and GPT-5.6 were used

Replace this section with specifics from the qualifying Codex thread once available. Intended narrative:

- Codex + GPT-5.6 authored and iterated the native Codex plugin contracts, package compiler, and hook policy mapping.
- Codex reviewed Official Codex plugin/skills/hooks docs against the implementation.
- Human partner directed architecture (one guarded skill per plugin, honest claim boundaries) and ran CI/demo rehearsal.

## Evidence artifacts

After `npm run check`:

- `artifacts/evaluation/routing-report.json`
- `dist/trust-receipt.json`
- `dist/codex/` (native plugin package)
- Evidence bundle from `skillsforge evidence --out artifacts/evidence/`

## Claim boundaries

- Hooks = host guardrails, **not** an OS sandbox.
- Static policy scan = best-effort text analysis.
- Receipts = reproducible unsigned hashes (tamper evidence, not attestation).
- Routing metrics apply to the frozen holdout corpus only.
