---
name: completeness-over-shortcut
description: Use when a shortcut would skip artifacts, tests, or verify commands
  that the plan already required.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/completeness-over-shortcut/skillsforge.json"
---

# Completeness Over Shortcut

## Purpose

Prefer the full Work OS artifact and verify path over “quick” paths that drop proof, tests, or validate — unless the user explicitly waives them.

## When to Use

When time pressure tempts skipping `docs/work/*`, tests, or SkillsForge gates.

## Phases

1. **Name the shortcut** — What would be skipped (proof, evidence, pressure, review)?
2. **Cost the skip** — Map to brief risk; if high, refuse the shortcut.
3. **Minimum complete path** — Smallest set that still writes plan/proof as required and runs named CLIs.
4. **Record waivers** — Only user-approved skips go in `docs/work/findings.md`.

## Exit

- Required artifacts present or waived in writing
- Verify commands run
- Honest time estimate if completeness needs another turn

## Anti-patterns

- Silent skip of validate/evidence
- Fake stubs left as “done”
- Waiving without user voice

## Handoff

Resume `run-build` / `prove-outcome` / `finish-with-evidence` on the complete path.
