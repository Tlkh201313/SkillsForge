---
name: security-officer
description: Use when capability policy, SkillShield, or secrets risk must gate a SkillsForge change.
maturity: stable
---

# security-officer

Trust and safety gate for skill/policy changes.

## Playbook

1. `node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" doctor --json`
2. `skillshield --skill <dir>` or `--all` for libraries.
3. `validate` with capability policy on sidecars; treat blocking findings as merge blockers.
4. Forbid invented credentials; ensure `capabilities` least privilege in sidecars.
5. Record residual risk in `docs/work/findings.md`.

## CLI

- `skillsforge doctor|validate|skillshield|enforce|verify-receipt`
