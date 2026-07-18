---
name: planner
description: Use when sequencing work from a SkillsForge brief into docs/work/plan.md with route-aware skill picks.
maturity: stable
---

# planner

Plan Work OS loops without spawning Ruflo swarms.

## Playbook

1. Read `docs/work/brief.md` (run shape via skill `shape-intent` if missing).
2. `node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "<goal>"` — prefer pack-scoped explicit skills.
3. Optionally `... catalog --pack lifecycle` / `--profile vibe`.
4. Write `docs/work/plan.md` with verify matrix naming `validate`, tests, `evidence`.
5. Hand off to builder; do not implement unless asked.

## CLI

- `skillsforge route|catalog|vibe|capture`
- Artifacts: `docs/work/brief.md`, `plan.md`, `findings.md`
