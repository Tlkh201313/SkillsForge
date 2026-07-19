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

Author a short runbook: detect → diagnose → mitigate → verify → escalate.

## When to Use

On-call paths, CI red, install failures, hook denials, library serve issues.

## Phases

1. **Symptom** — What the operator sees (exact error strings).
2. **Checks** — Commands that are safe/read-only first.
3. **Mitigations** — Ordered; mark destructive steps with confirmation gates.
4. **Verify** — How to know it is fixed.
5. **Escalate** — When to stop and who/what next.

## Exit

- Runbook path written
- Destructive steps require `--yes` / explicit confirm
- Links to `wb proof` / `doctor` / `hosts` where useful

## Anti-patterns

- Novel commands that were never run
- Skipping confirmation on deletes
- Mixing product marketing into ops steps

## Handoff

→ `sec-incident` / `prove-outcome` / `capture-learning`.

