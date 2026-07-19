---
name: eng-error-handling
description: Use when designing failure paths so errors are typed, logged without secrets, and recoverable with clear operator next steps.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/eng-error-handling/skillsforge.json"
---

# Eng Error Handling

## Purpose

Make failures actionable: stable codes, no secret leakage, and recovery steps.

## When to Use

CLI exit codes, API errors, hook deny messages, library serve failures.

## Phases

1. **Taxonomy** — User error vs system vs policy deny.
2. **Contracts** — Exit codes / HTTP / JSON error shape.
3. **Redaction** — Strip tokens/paths as needed.
4. **Recovery** — Next command the operator should run.
5. **Tests** — Failure-path tests for at least one case each.

## Exit

- Error contract documented
- Tests cover deny/invalid usage
- No secret-bearing logs in happy examples

## Anti-patterns

- Swallowing errors
- Dumping full env on failure
- Vague "something went wrong"

## Handoff

→ `eng-logging` / `run-build` / `prove-outcome`.

