---
name: lock-design
description: Use when UI or UX decisions must be frozen in docs/work/design-lock.md
  before implementation thrash.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/lock-design/skillsforge.json"
---

# Lock Design

## Purpose

Freeze visual/interaction decisions in `docs/work/design-lock.md` so `run-build` does not renegotiate the UI every turn.

## When to Use

After shape/plan when UI is in scope, or when redesign churn is blocking ship.

## Phases

1. **Inventory decisions** — Layout, typography, key flows, a11y constraints, explicit non-goals (no purple-glow defaults unless brand requires).
2. **Write lock** — `docs/work/design-lock.md` with must-keep rules and open-optional items.
3. **Cross-check brief** — Ensure lock serves `docs/work/brief.md` success criteria.
4. **Gate** — Implementation may proceed only against the lock; changes require editing the lock first.

## Exit

- Design-lock file committed in spirit (written now)
- Builder-facing “do not invent” list
- Next: `run-build` / frontend skill via `route --pack design`

## Anti-patterns

- Locking nothing (“be tasteful”)
- Relitigating locked items mid-PR without updating the file
- Copying external design-skill essays

## Handoff

→ `run-build`. Design review later → design-reviewer agent / `review-diff` with screenshots in `docs/work/proof.md`.
