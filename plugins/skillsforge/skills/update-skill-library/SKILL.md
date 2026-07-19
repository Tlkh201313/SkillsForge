---
name: update-skill-library
description: Use when installed skills changed and the local SkillsForge library
  HTML/AI index must be refreshed for the current session.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/update-skill-library/skillsforge.json"
---

# Update Skill Library

## Purpose

Refresh the local SkillsForge library artifacts after a skill is installed, removed, or changed outside the current index.

## When to Use

Use this when the user says they added skills, installed a plugin, removed a skill, switched host sessions, or wants the AI-readable library HTML updated.

## Phases

1. **Refresh** - Run `skillsforge lib update --json` or `node plugins/skillsforge/bin/skillsforge.mjs lib update --json`.
2. **Check** - Confirm the JSON reports `ok: true`, current skill count, workflow count, sources count, and output paths.
3. **Use AI index** - Point the agent to `artifacts/skillsforge-library/skillsforge-ai-index.html` for compact session-aware skill selection.
4. **Keep writes narrow** - Do not install, remove, or mutate skills from this skill. It only refreshes generated library artifacts.

## Exit

- `skillsforge-library.json`, `skillsforge-library.html`, and `skillsforge-ai-index.html` exist
- Counts are reported from command output only
- Any errors are shown without inventing missing stats

## Anti-patterns

- Recommending a skill that is absent from the refreshed index
- Deleting installed skill folders while updating the index
- Claiming marketplace, certification, or benchmark numbers not present in the command output

