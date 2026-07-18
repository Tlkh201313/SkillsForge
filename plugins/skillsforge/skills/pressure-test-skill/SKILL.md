---
name: pressure-test-skill
description: Use when authoring or checking discipline skills so pressure fixtures
  fail before the skill body is considered done.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/pressure-test-skill/skillsforge.json"
---

# Pressure Test Skill

## Purpose

SkillsForge iron law for discipline skills: a failing `pressure/` fixture exists before the skill body is trusted — enforced via `skillsforge pressure --skill <dir>`.

## When to Use

When creating/editing methodology or other discipline skills, or when SkillShield/quality is not enough to prove behavior.

## Phases

1. **Baseline first** — Write `pressure/baseline.json` (and related fixtures) expecting known violations.
2. **Run pressure** — `skillsforge pressure --skill <dir>`; confirm red where required.
3. **Author/fix skill** — Use `author-capability` / forge; keep original SkillsForge prose only.
4. **Go green** — Re-pressure until fixtures match intent; also `skillsforge quality --skill <dir>` (hero ≥85).
5. **SkillShield** — `skillsforge skillshield --skill <dir>` for unsafe patterns.

## Exit

- Pressure command exercised with interpreted results
- Fixtures committed beside the skill
- Quality/CSO acceptable

## Anti-patterns

- Skill body without pressure fixtures for discipline packs
- Editing fixtures to hide real regressions
- Copying third-party pressure text

## Handoff

→ `validate-agent-skill` / `verify-capability`. Batch: `skillsforge batch --pack methodology --action pressure`.
