---
name: sec-owasp
description: Use when mapping a web or agent surface to OWASP-style risks with concrete repo checks instead of generic posters.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/sec-owasp/skillsforge.json"
---

# Sec Owasp

## Purpose

Map relevant OWASP-class risks to this repo/feature with commands and file evidence.

## When to Use

Web endpoints, HTML library UI, agent tool input, MCP argument handling.

## Phases

1. **Surface** — HTTP handlers, HTML sinks, shell args, path joins.
2. **Pick risks** — Only applicable classes (injection, XSS, path traversal, SSRF, authz).
3. **Probe** — Named checks (tests, grep, manual cases) — no invented pass rates.
4. **Fix or accept** — Each finding gets owner + verification.
5. **Record** — Findings in `docs/work/findings.md`.

## Exit

- Applicable risk list (not all 10 blindly)
- Evidence for each check run
- Open risks explicit

## Anti-patterns

- Pasting OWASP posters as done
- Fake scanner scores
- Skipping path confinement on `--home` / `--out`

## Handoff

→ `sec-input-validation` / path tests / `prove-outcome`.

