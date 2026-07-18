---
name: no-rationalize
description: Use when failures, flaky tests, or policy denies appear and the agent
  must not invent stories that excuse skipping the fix.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/no-rationalize/skillsforge.json"
---

# No Rationalize

## Purpose

Keep failure honest: treat red tests, validate exit 1, skillshield hits, and hook denies as blockers — not narrative problems to smooth over.

## When to Use

Any time a check fails or the agent starts explaining why the failure “doesn’t count.”

## Phases

1. **Quote the failure** — Paste the relevant CLI line / finding `rule` + `evidence`.
2. **Classify** — Product bug, test bug, env issue, or policy correctly denying — pick one with evidence.
3. **Fix or escalate** — Implement fix, fix the test, or ask the user; do not mark done.
4. **Re-run** — Same command that failed must pass (or user accepts a tracked waiver in `docs/work/findings.md`).

## Exit

- Failure text preserved in proof/findings
- Either green re-run or explicit user-approved waiver
- Zero “works on my machine” closures without data

## Anti-patterns

- Softening severity in summaries
- Deleting assertions
- Blaming “the linter” without logs

## Handoff

→ `debug-issue` for root cause, `verify-before-done` after fix, `pressure-test-skill` if a skill should have caught it.
