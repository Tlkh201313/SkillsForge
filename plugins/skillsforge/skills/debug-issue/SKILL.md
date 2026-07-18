---
name: debug-issue
description: Use when a failure needs root-cause analysis with reproduced evidence
  before applying a fix.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/debug-issue/skillsforge.json"
---

# Debug Issue

## Purpose

Reproduce → isolate → fix → prove, with evidence in `docs/work/findings.md` and commands that failed/passed.

## When to Use

Red tests, validate/policy failures, runtime errors, or routing surprises.

## Phases

1. **Reproduce** — Re-run the failing command (`skillsforge validate`, test runner, `doctor`, etc.); capture output.
2. **Isolate** — Bisect skill vs app vs env; for skills use `skillsforge compare --a --b` when sidecars diverge.
3. **Hypotheses** — Rank 1–3 causes; test the cheapest.
4. **Fix + verify** — Minimal fix; re-run the same failing command; note in findings.

## Exit

- Root cause stated with evidence
- Failing command now green (or waiver filed)
- No shotgun refactors

## Anti-patterns

- Fixing without reproduce
- Rationalizing flakiness (`no-rationalize`)
- Disabling hooks to “unblock”

## Handoff

→ `verify-before-done` / `review-diff`. Chronic skill issues → `pressure-test-skill`.
