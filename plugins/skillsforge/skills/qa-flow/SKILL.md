---
name: qa-flow
description: Use when exercising an end-to-end acceptance path against brief
  success criteria before proof and ship.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/qa-flow/skillsforge.json"
---

# QA Flow

## Purpose

Walk the user-visible or CLI-visible acceptance path from `docs/work/brief.md` success criteria and record results for proof.

## When to Use

After build/review, before `prove-outcome`.

## Phases

1. **Derive cases** - From brief success signals + plan verify matrix.
2. **Execute** - Manual or automated E2E; for SkillsForge itself include `vibe`, `route`, `validate --all` smoke as relevant.
3. **Log** - Pass/fail table into `docs/work/proof.md` or `findings.md`.
4. **Defects** - File blockers with repro; do not ship on failed critical paths.

## Exit

- Critical paths executed this session
- Blockers severity-tagged
- Explicit QA sign-off or fail

## Anti-patterns

- QA = "I clicked once"
- Ignoring brief criteria
- Testing only happy path when plan listed negatives

## Handoff

Pass -> `prove-outcome`. Fail -> `debug-issue` / `run-build`.

## Output Contract

- Decision or artifact: concrete result for qa flow, including file path, command, or explicit no-change finding.
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

Prompt: "Do qa flow fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

