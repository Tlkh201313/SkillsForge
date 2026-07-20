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

Block premature "done": re-check plan exit criteria, run named CLI checks, and update `docs/work/proof.md` before any ship language.

## When to Use

When the agent or user is ready to close a task/PR/skill change.

## Phases

1. **Diff the plan** - Compare `docs/work/plan.md` checkboxes/exit lines to reality; list gaps.
2. **Re-run gates** - At minimum: relevant tests; for skills `skillsforge validate` + `skillsforge quality --skill <dir>`; for trust `skillsforge doctor --json` if install surface changed.
3. **No-rationalize pass** - Apply `no-rationalize`: failures are failures; no story that "it's fine."
4. **Proof touch** - Append results to `docs/work/proof.md`.

## Exit

- All plan exit criteria marked met or explicitly deferred with owner
- Commands re-run in this session (not only historical)
- Clear DONE or NOT-DONE verdict

## Anti-patterns

- Declaring done on compile-only success
- Skipping flaky tests without recording risk
- Editing expected outputs to match bugs

## Handoff

DONE -> `prove-outcome` / `ship-release`. NOT-DONE -> `debug-issue` or `run-build` with a narrowed plan.

## Output Contract

- Decision or artifact: concrete result for verify before done, including file path, command, or explicit no-change finding.
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

Prompt: "Do verify before done fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

