---
name: plan-work
description: Use when turning an approved brief into a sequenced work plan with
  checkpoints under docs/work/plan.md.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/plan-work/skillsforge.json"
---

# Plan Work

## Purpose

Convert `docs/work/brief.md` into an actionable plan at `docs/work/plan.md` with ordered tasks, owners/skills, and proof checkpoints.

## When to Use

After shape-intent (or when a brief already exists) and before `run-build` / implementation.

## Phases

1. **Read inputs** - Load `docs/work/brief.md` (and `design-lock.md` if present). Refuse to invent a plan that contradicts the brief.
2. **Decompose** - Write `docs/work/plan.md` with phases, tasks, dependencies, and "done when" checks that name real commands (`validate`, `quality`, tests, `evidence`).
3. **Route skills** - For each major task, note a SkillsForge skill or `skillsforge route --query "..."` hint; keep domain skills `explicit`.
4. **Risk register** - List top risks and the verify/prove step that catches each.

## Exit

- Plan file updated with ordered tasks and exit checks
- Explicit link back to brief success criteria
- Next skill named (`lock-design`, `run-build`, or `tdd-first`)

## Anti-patterns

- Plans that only say "implement feature"
- Skipping proof/evidence checkpoints
- Auto-routing every eng skill

## Handoff

-> `lock-design` if UI/UX unsettled; else `tdd-first` / `run-build`. On plan review asks -> `review-diff` later, `write-plan` for methodology-depth planning.

## Output Contract

- Decision or artifact: concrete result for plan work, including file path, command, or explicit no-change finding.
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

Prompt: "Do plan work fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

