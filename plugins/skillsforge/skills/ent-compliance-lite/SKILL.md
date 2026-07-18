---
name: ent-compliance-lite
description: Use when you need ent compliance lite in a SkillsForge enterprise workflow.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/ent-compliance-lite/skillsforge.json"
---

# Ent Compliance Lite

## Overview

Original SkillsForge skill for ent compliance lite (enterprise pack).

## Purpose

Deliver a trustworthy, repeatable outcome for Ent Compliance Lite without copying third-party skill bodies.

## When to Use

- Use when you need ent compliance lite in a SkillsForge enterprise workflow.
- Need ent compliance lite with trusted SkillsForge artifacts

## Phases

1. Clarify the goal and constraints.
2. Gather evidence from the repo or user.
3. Produce the artifact under docs/work/ or the stated path.
4. Verify against the exit criteria below.

## Exit

- Concrete artifact written (or explicit skip with reason)
- Risks and open questions listed
- Next SkillsForge skill or CLI command recommended

## Anti-patterns

- Skipping verification
- Inventing credentials or Session IDs
- Copying third-party SKILL.md text

## Handoff

Recommend `skillsforge route --pack enterprise` or the next lifecycle skill. Capture learnings with `skillsforge capture`.

## Common Mistakes

- Vague triggers that collide with other packs
- Workflow summaries inside the description field (breaks CSO)

## Pressure stub

See `pressure/` fixtures when this is a discipline skill.
