---
name: docs-runbook
description: Use when writing an operational runbook with symptoms, checks, mitigations, and stop conditions an on-call or agent can follow.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/docs-runbook/skillsforge.json"
---

# Docs Runbook

## Purpose

Author a short runbook: detect -> diagnose -> mitigate -> verify -> escalate.

## When to Use

On-call paths, CI red, install failures, hook denials, library serve issues.

## Phases

1. **Symptom** - What the operator sees (exact error strings).
2. **Checks** - Commands that are safe/read-only first.
3. **Mitigations** - Ordered; mark destructive steps with confirmation gates.
4. **Verify** - How to know it is fixed.
5. **Escalate** - When to stop and who/what next.

## Exit

- Runbook path written
- Destructive steps require `--yes` / explicit confirm
- Links to `wb proof` / `doctor` / `hosts` where useful

## Anti-patterns

- Novel commands that were never run
- Skipping confirmation on deletes
- Mixing product marketing into ops steps

## Handoff

-> `sec-incident` / `prove-outcome` / `capture-learning`.

## Output Contract

- Decision or artifact: concrete result for docs runbook, including file path, command, or explicit no-change finding.
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

Prompt: "Do docs runbook fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

