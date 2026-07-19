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

1. **Events** — Name the few events that matter (start/deny/fail/success).
2. **Fields** — Stable keys; ids not payloads.
3. **Redact** — Tokens, homedir dumps, raw skill bodies.
4. **Levels** — Compact default; `--full` / debug opt-in.
5. **Verify** — Failure case shows useful next step, not a stack-only wall.

## Exit

- Log contract sketched
- Default output stays token-friendly
- Secrets absent from sample output

## Anti-patterns

- Logging full request bodies with credentials
- Debug-by-default spam
- Inconsistent field names

## Handoff

→ `eng-error-handling` / `os-env` / `prove-outcome`.

