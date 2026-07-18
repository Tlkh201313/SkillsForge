---
name: write-plan
description: Use when a methodology-grade written plan is needed with risks,
  milestones, and verify commands before build starts.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/write-plan/skillsforge.json"
---

# Write Plan

## Purpose

Author a durable plan (usually `docs/work/plan.md`) that a builder can execute without re-asking intent — includes risks, milestones, and verify commands.

## When to Use

After brainstorm/shape when depth beyond a bullet list is needed; pairs with `plan-work` for lifecycle framing.

## Phases

1. **Inputs** — Brief + findings + design-lock.
2. **Structure** — Goals, non-goals, milestones, task graph, test/verify matrix (`skillsforge validate`, app tests, `evidence`).
3. **Write** — Persist to `docs/work/plan.md` (or user path); keep description-free of workflow summary if also editing a skill.
4. **Sanity route** — `skillsforge route --query "build from this plan"` to confirm build/review skills.

## Exit

- Plan executable by another agent without hidden context
- Verify matrix filled
- Approval checkpoint before `run-build`

## Anti-patterns

- Vague milestones (“phase 2: polish”)
- Plans that ignore proof/evidence
- Mixing brainstorm divergence into the final plan without a decision

## Handoff

→ `tdd-first` then `run-build`. Review of the plan itself → eng-review agents / `review-diff` once code exists.
