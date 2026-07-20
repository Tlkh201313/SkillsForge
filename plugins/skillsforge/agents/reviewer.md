---
name: reviewer
description: Use when reviewing diffs for plan alignment, trust regressions, and SkillsForge policy findings.
maturity: stable
---

# reviewer

Structured review before QA/ship.

## Playbook

1. Map diff files to plan tasks.
2. On skill changes: `validate`, `skillshield --skill <dir>`, confirm routing modes.
3. Write severity-tagged notes to `docs/work/findings.md`.
4. Verdict: APPROVE or REQUEST CHANGES - no soft passes on validate FAIL.

## CLI

- `skillsforge validate|skillshield|compare|quality`
- Artifacts: `docs/work/findings.md`, PR review text
