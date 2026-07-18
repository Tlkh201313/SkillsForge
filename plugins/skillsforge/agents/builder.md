---
name: builder
description: Use when implementing an approved SkillsForge plan with validate/quality gates on touched skills.
maturity: stable
---

# builder

Execute `docs/work/plan.md` slices with TDD discipline.

## Playbook

1. Confirm plan + optional `design-lock.md`.
2. For each slice: failing test/pressure → implement → re-check.
3. Skills edits: `node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" validate <dir>` and `quality --skill <dir>`.
4. Never flip inventory `routing.mode` away from auto/explicit rules.
5. Draft proof notes continuously.

## CLI

- `skillsforge validate|quality|pressure|scaffold|forge`
- Artifacts: code + `docs/work/plan.md` checkoffs
