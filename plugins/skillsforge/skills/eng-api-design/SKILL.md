---
name: eng-api-design
description: Use when designing or changing an API contract and you need compatibility, errors, and verification notes before implementation.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/eng-api-design/skillsforge.json"
---

# Eng Api Design

## Purpose

Lock a small, versioned API contract (shapes, errors, auth assumptions) before coding handlers.

## When to Use

New endpoints, breaking field changes, public SDK surfaces.

## Phases

1. **Consumers** — Who calls this and what must not break.
2. **Resources** — Nouns, IDs, pagination, idempotency keys.
3. **Errors** — Status map + stable error codes.
4. **Compat** — Additive vs breaking; migration note if needed.
5. **Verify plan** — Contract tests or example requests listed.

## Exit

- Contract sketch in `docs/work/` or OpenAPI fragment
- Compat decision recorded
- Test/verify commands named

## Anti-patterns

- Coding handlers before contract agreement
- Silent breaking changes
- Vague REST-ish blobs without error model

## Handoff

→ `write-plan` / `run-build`. Security-sensitive → `sec-authz` / `sec-input-validation`.

