---
name: eng-refactor-safe
description: Use when refactoring production code and you need a bounded blast radius, tests, and an explicit rollback note before merging.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/eng-refactor-safe/skillsforge.json"
---

# Eng Refactor Safe

## Purpose

Refactor code with the smallest useful scope, keep behavior covered by verification, and leave a rollback note.

## When to Use

- Behavior-preserving refactors (extract, rename, move, simplify)
- Hotspots with flaky or missing tests that must be addressed first

## When Not to Use

- New product behavior (use feature skills / `plan-work`)
- Drive-by multi-folder cleanup without a verification command

## Phases

1. **Bound** - Name files/modules in scope; list out-of-scope neighbors.
2. **Characterize** - Identify the verification command (unit/integration/manual script).
3. **Change** - One logical step at a time; no unrelated formatting churn.
4. **Verify** - Run the named gate; capture pass/fail evidence.
5. **Rollback note** - Document how to revert (commit SHA or feature flag).

## Exit

- Diff limited to the stated scope
- Verification command listed and run
- Rollback path written in PR notes or `docs/work/findings.md`

## Anti-patterns

- Refactoring without a failing/passing check
- Mixing behavior changes into a "refactor" PR
- Touching generated skill dumps for style only

## Handoff

-> `review-diff` then `run-build`. If tests missing -> `tdd-first` / testing pack.

## Output Contract

- Decision or artifact: concrete result for eng refactor safe, including file path, command, or explicit no-change finding.
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

Prompt: "Do eng refactor safe fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

