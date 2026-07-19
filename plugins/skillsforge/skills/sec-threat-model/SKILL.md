---
name: sec-threat-model
description: Use when you need a lightweight threat model for a feature or skill surface with assets, attackers, and mitigations before ship.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/sec-threat-model/skillsforge.json"
---

# Sec Threat Model

## Purpose

Produce a short, evidence-based threat model — assets, actors, abuse cases, mitigations — without fake compliance theater.

## When to Use

New trust boundary, skill with exec/network/write, auth changes, install/package paths.

## Phases

1. **Assets** — Data, credentials, package bytes, hook decisions.
2. **Actors** — Operator, malicious skill author, compromised MCP, confused agent.
3. **Abuse cases** — 3–7 concrete attacks (not generic OWASP laundry lists).
4. **Mitigations** — Map each abuse case to a control already in SkillsForge or the app.
5. **Residual risk** — Explicit accept/mitigate/transfer notes.

## Exit

- Written model under `docs/work/` or `docs/threat-model.md` section
- Residual risks listed
- Link to validate/package/hooks where relevant

## Anti-patterns

- Checkbox STRIDE with no repo evidence
- Claiming OS sandbox or third-party attestation
- Inventing CVE counts

## Handoff

→ `sec-secrets` / `sec-input-validation` / `prove-outcome`.

