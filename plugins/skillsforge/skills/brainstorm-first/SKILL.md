---
name: brainstorm-first
description: Use when multiple approaches are still viable and the team needs a
  short option set with tradeoffs before locking a plan.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/brainstorm-first/skillsforge.json"
---

# Brainstorm First

## Purpose

Generate 2–4 distinct approaches with tradeoffs *before* `write-plan` / `plan-work`, and park the chosen direction in `docs/work/findings.md` or the brief.

## When to Use

Ambiguous product/tech choices, post-`shape-intent`, or when the user asks to explore options.

## Phases

1. **Constraints from brief** — Read `docs/work/brief.md`; brainstorm inside those walls.
2. **Diverge** — List approaches with effort, risk, and SkillsForge surface impact (new skills? new pack?).
3. **Converge** — Pick one with explicit “why not the others”; write to `docs/work/findings.md`.
4. **Gate** — Do not implement during brainstorm; hand to planning.

## Exit

- ≥2 real alternatives documented
- Chosen path + rejected paths recorded
- Next skill: `write-plan` or `plan-work`

## Anti-patterns

- Single-option “brainstorms”
- Implementing mid-ideation
- Pasting external ideation frameworks wholesale

## Handoff

→ `write-plan` / `plan-work`. If design-heavy → `lock-design`. If skill-gap found → `browse-catalog` then `scaffold`.
