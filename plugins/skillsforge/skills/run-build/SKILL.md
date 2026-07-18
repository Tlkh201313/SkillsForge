---
name: run-build
description: Use when executing an approved plan to implement changes while
  recording progress against docs/work/plan.md checkpoints.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/run-build/skillsforge.json"
---

# Run Build

## Purpose

Implement the approved plan with smallest safe diffs, keeping plan checkpoints and TDD discipline honest.

## When to Use

When `docs/work/plan.md` (and design-lock if UI) are accepted and coding should start.

## Phases

1. **Snapshot** — Re-read plan + lock; pick the next unchecked task only.
2. **TDD slice** — Prefer `tdd-first` for the slice; implement; keep functions focused.
3. **SkillsForge touchpoints** — If editing skills: `validate` + `quality --skill`; never weaken `routing.mode` inventory.
4. **Progress** — Check off plan items; note commands in a running proof draft.

## Exit

- Task slice complete or blocked with reason
- Tests/validate run for touched surface
- No scope expansion beyond plan without brief/plan update

## Anti-patterns

- Rewriting unrelated modules
- Skipping red tests
- Quietly flipping skill routing to `auto`

## Handoff

→ `review-diff` then `qa-flow` / `prove-outcome`. Blockers → `debug-issue`.
