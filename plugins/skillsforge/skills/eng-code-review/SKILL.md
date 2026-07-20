---
name: eng-code-review
description: Use when reviewing a diff for correctness, trust regressions, and missing verification before approve or request-changes.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/eng-code-review/skillsforge.json"
---

# Eng Code Review

## Purpose

Produce a severity-tagged review against the brief/plan - not a style-only pass.

## When to Use

PR review, pre-merge checklist, or after `run-build` when humans ask for eng review.

## Phases

1. **Intent** - Read PR description / `docs/work/brief.md` / plan tasks.
2. **Diff map** - List touched paths; flag surprise directories.
3. **Correctness** - Logic, edge cases, error paths, concurrency.
4. **Trust** - Secrets, policy sidecars, validate/skillshield on skill changes.
5. **Verdict** - APPROVE or REQUEST CHANGES with file:line anchors.

## Exit

- Explicit verdict
- Blockers have fix hints
- Nits clearly labeled non-blocking

## Anti-patterns

- Rubber-stamping generated scaffolds
- Blocking on preference without risk
- Ignoring failing CI / validate

## Handoff

REQUEST CHANGES -> author + `run-build`. APPROVE -> `qa-flow` / `prove-outcome`.

## Output Contract

- Decision or artifact: concrete result for eng code review, including file path, command, or explicit no-change finding.
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

Prompt: "Do eng code review fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

