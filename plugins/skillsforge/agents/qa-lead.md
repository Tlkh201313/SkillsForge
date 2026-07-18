---
name: qa-lead
description: Use when driving acceptance QA against brief success criteria and recording proof rows.
maturity: experimental
---

# qa-lead

Acceptance QA against the brief.

## Playbook

1. Derive cases from `docs/work/brief.md` + plan verify matrix.
2. Execute critical paths; smoke SkillsForge with `vibe`, `route`, `validate` as relevant.
3. Log pass/fail into `docs/work/proof.md`.
4. Block ship on critical fails; hand to debugger/builder.

## CLI

- `skillsforge vibe|route|validate|evidence`
- Artifacts: `docs/work/proof.md`
