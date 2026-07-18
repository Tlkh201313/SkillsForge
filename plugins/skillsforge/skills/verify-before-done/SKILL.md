---
name: verify-before-done
description: Use when the agent is about to declare a task finished and must
  re-run checks against the plan and proof criteria.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/verify-before-done/skillsforge.json"
---

# Verify Before Done

## Purpose

Block premature “done”: re-check plan exit criteria, run named CLI checks, and update `docs/work/proof.md` before any ship language.

## When to Use

When the agent or user is ready to close a task/PR/skill change.

## Phases

1. **Diff the plan** — Compare `docs/work/plan.md` checkboxes/exit lines to reality; list gaps.
2. **Re-run gates** — At minimum: relevant tests; for skills `skillsforge validate` + `skillsforge quality --skill <dir>`; for trust `skillsforge doctor --json` if install surface changed.
3. **No-rationalize pass** — Apply `no-rationalize`: failures are failures; no story that “it’s fine.”
4. **Proof touch** — Append results to `docs/work/proof.md`.

## Exit

- All plan exit criteria marked met or explicitly deferred with owner
- Commands re-run in this session (not only historical)
- Clear DONE or NOT-DONE verdict

## Anti-patterns

- Declaring done on compile-only success
- Skipping flaky tests without recording risk
- Editing expected outputs to match bugs

## Handoff

DONE → `prove-outcome` / `ship-release`. NOT-DONE → `debug-issue` or `run-build` with a narrowed plan.
