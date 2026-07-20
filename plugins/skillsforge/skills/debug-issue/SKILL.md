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

Reproduce -> isolate -> fix -> prove, with evidence in `docs/work/findings.md` and commands that failed/passed.

## When to Use

Red tests, validate/policy failures, runtime errors, or routing surprises.

## Phases

1. **Reproduce** - Re-run the failing command (`skillsforge validate`, test runner, `doctor`, etc.); capture output.
2. **Isolate** - Bisect skill vs app vs env; for skills use `skillsforge compare --a --b` when sidecars diverge.
3. **Hypotheses** - Rank 1-3 causes; test the cheapest.
4. **Fix + verify** - Minimal fix; re-run the same failing command; note in findings.

## Exit

- Root cause stated with evidence
- Failing command now green (or waiver filed)
- No shotgun refactors

## Anti-patterns

- Fixing without reproduce
- Rationalizing flakiness (`no-rationalize`)
- Disabling hooks to "unblock"

## Handoff

-> `verify-before-done` / `review-diff`. Chronic skill issues -> `pressure-test-skill`.

## Output Contract

- Decision or artifact: concrete result for debug issue, including file path, command, or explicit no-change finding.
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

Prompt: "Do debug issue fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

