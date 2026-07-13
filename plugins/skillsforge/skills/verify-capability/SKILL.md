---
name: verify-capability
description: Use when checking whether a skill is safe and correct, including
  validation failures, undeclared capabilities, dependency cycles, and routing
  regressions.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/verify-capability/skillsforge.json"
---

# Verify a Capability

## Overview

Verification contract: structural validation, capability policy scan, dependency analysis, routing evaluation, and receipt checks. Explain evidence only; never edit files or override policy.

`skillsforge validate` and `skillsforge doctor` both run the verify orchestrator: structural checks first, then capability policy scan for skills that ship a `skillsforge.json` sidecar. Sidecar-free portable skills stay structural-only. Blocking policy findings fail the command (exit 1). Doctor also fails when any installed skill has a blocking capability finding.

## When to Use

Before packaging, after editing any skill, and whenever a routing or policy result looks wrong.

## Checks

1. Run `skillsforge doctor --json` first (or `skillsforge validate --json` for a single skill path). Both include capability policy scanning when sidecars are present.
2. Treat deterministic JSON output as authoritative (`ok`, `reports`, `findings` with `rule`, `evidence`, `fix`, `blocking`). Explain failures with exact fields, files, rules, and remediation; do not invent status.
3. Run `skillsforge eval` when routing changed.
4. Run `skillsforge receipt` and `skillsforge verify-receipt` when packaging or integrity is in question.
5. Never claim sandboxing, certification, or safety beyond scanner/hook evidence.
6. Never edit skill files, sidecars, or receipts while verifying.
