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

1. **Snapshot** - Re-read plan + lock; pick the next unchecked task only.
2. **TDD slice** - Prefer `tdd-first` for the slice; implement; keep functions focused.
3. **SkillsForge touchpoints** - If editing skills: `validate` + `quality --skill`; never weaken `routing.mode` inventory.
4. **Progress** - Check off plan items; note commands in a running proof draft.

## Exit

- Task slice complete or blocked with reason
- Tests/validate run for touched surface
- No scope expansion beyond plan without brief/plan update

## Anti-patterns

- Rewriting unrelated modules
- Skipping red tests
- Quietly flipping skill routing to `auto`

## Handoff

-> `review-diff` then `qa-flow` / `prove-outcome`. Blockers -> `debug-issue`.

## Output Contract

- Decision or artifact: concrete result for run build, including file path, command, or explicit no-change finding.
- Evidence: exact source, command summary, or user-provided fact used.
- Risk: one caveat or "No material risk found".
- Next step: one SkillsForge command or skill only when it moves work forward.

## Verification

- Run the smallest relevant route, validate, lint, test, dry-run, or evidence command.
- If no command applies, state inspected evidence and why automated proof was unavailable.
- Separate verified facts from assumptions in the final answer.

## Failure Modes

- Missing evidence: stop and mark the result unverified.
- Conflicting instructions: follow the newest user instruction and state the conflict.
- Risky write/delete/install: require explicit confirmation before action.

## OG Output Pressure Test

Prompt: "Do run build fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

