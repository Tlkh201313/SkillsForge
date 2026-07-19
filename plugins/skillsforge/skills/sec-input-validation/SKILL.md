---
name: sec-input-validation
description: Use when validating untrusted input at CLI, MCP, or HTTP boundaries with allowlists and path confinement.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/sec-input-validation/skillsforge.json"
---

# Sec Input Validation

## Purpose

Treat CLI/MCP/HTTP args as hostile: allowlist, confine paths, reject NUL/escape.

## When to Use

New flags (`--home`, `--out`), MCP tools, HTML library mutation APIs.

## Phases

1. **Trust boundary** — Where input enters.
2. **Allowlist** — Enums, id patterns, absolute-vs-relative rules.
3. **Confine** — `isInside` / resolve-under-root patterns.
4. **Fail closed** — Invalid → exit 2 / deny, not best-effort.
5. **Tests** — Escape and NUL cases in unit tests.

## Exit

- Validation rules documented
- Escape tests pass
- No silent path coercion outside root

## Anti-patterns

- Blacklist-only filters
- `eval` on user strings
- Accepting `..` segments casually

## Handoff

→ path-confinement tests / `sec-owasp` / `prove-outcome`.

