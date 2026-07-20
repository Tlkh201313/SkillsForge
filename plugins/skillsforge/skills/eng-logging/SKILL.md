---
name: eng-logging
description: Use when adding structured logging so operators get actionable signals without secret leakage or noisy spam.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/eng-logging/skillsforge.json"
---

# Eng Logging

## Purpose

Add structured, redacted logs that help debug without dumping secrets or flooding agents.

## When to Use

New CLI commands, hooks, library serve, package/receipt paths.

## Phases

1. **Events** - Name the few events that matter (start/deny/fail/success).
2. **Fields** - Stable keys; ids not payloads.
3. **Redact** - Tokens, homedir dumps, raw skill bodies.
4. **Levels** - Compact default; `--full` / debug opt-in.
5. **Verify** - Failure case shows useful next step, not a stack-only wall.

## Exit

- Log contract sketched
- Default output stays token-friendly
- Secrets absent from sample output

## Anti-patterns

- Logging full request bodies with credentials
- Debug-by-default spam
- Inconsistent field names

## Handoff

-> `eng-error-handling` / `os-env` / `prove-outcome`.

## Output Contract

- Decision or artifact: concrete result for eng logging, including file path, command, or explicit no-change finding.
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

Prompt: "Do eng logging fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

