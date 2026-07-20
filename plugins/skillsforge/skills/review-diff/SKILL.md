---
name: review-diff
description: Use when a change set needs a structured review against the brief,
  plan, and SkillsForge trust rules before merge or ship.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/review-diff/skillsforge.json"
---

# Review Diff

## Purpose

Review the actual diff for correctness, trust regressions, and plan alignment - produce findings in `docs/work/findings.md` or PR notes.

## When to Use

After `run-build`, before QA/ship, or on request for eng review.

## Phases

1. **Scope** - `git diff` / PR files; map each to a plan task.
2. **Trust lens** - Skills changes: confirm validate cleanliness, no secret leakage, `skillsforge skillshield --skill` on touched skills, routing modes intact.
3. **Correctness** - Logic bugs, missing tests, broken exit criteria.
4. **Write findings** - Severity-tagged list; blockers vs nits.

## Exit

- Explicit APPROVE / REQUEST CHANGES
- Blockers reference files and fix hints
- Link to proof gaps if tests missing

## Anti-patterns

- Style-only reviews when trust broken
- Approving with failing validate
- Rubber-stamping generated skill boilerplate

## Handoff

REQUEST CHANGES -> `run-build` / `no-rationalize`. APPROVE -> `qa-flow` or `prove-outcome`.

## Output Contract

- Decision or artifact: concrete result for review diff, including file path, command, or explicit no-change finding.
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

Prompt: "Do review diff fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

