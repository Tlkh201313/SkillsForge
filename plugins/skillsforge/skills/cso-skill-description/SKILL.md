---
name: cso-skill-description
description: Use when editing a skill description so it starts with Use when and
  stays free of workflow-summary phrasing for CSO compliance.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/cso-skill-description/skillsforge.json"
---

# CSO Skill Description

## Purpose

Bring skill `description` fields in line with SkillsForge CSO: start with `Use when…`, ≤500 chars, and avoid workflow-summary wording that fails `quality` CSO checks.

## When to Use

When `skillsforge quality --skill <dir>` reports CSO failure, or before publishing a skill.

## Phases

1. **Score** — Run `skillsforge quality --skill <dir> --json` and inspect `csoOk` / checks.
2. **Rewrite description** — Trigger-oriented; no “first/then/step N/run the/dispatch” summary of the body.
3. **Keep body deep** — Phases stay in `SKILL.md` body, not frontmatter.
4. **Re-score** — Quality again; heroes still need ≥85 overall.

## Exit

- `csoOk: true`
- Description still matches real triggers
- No third-party text pasted into description

## Anti-patterns

- Stuffing the whole workflow into description
- Empty “Use when needed” stubs
- Changing `name` to pass frontmatter checks incorrectly

## Handoff

→ `author-capability` for broader structural fixes; `pressure-test-skill` if triggers are weak.
