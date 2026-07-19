---
name: design-before-code
description: Use when you need design before code in a SkillsForge methodology workflow.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/design-before-code/skillsforge.json"
---

# Design Before Code

## Overview

Lean SkillsForge scaffold for design before code (methodology pack). Add domain examples and verification before calling it production-depth.

## Purpose

Deliver a trustworthy, repeatable outcome for Design Before Code without copying third-party skill bodies or overstating this scaffold's depth.

## When to Use

- Use when you need design before code in a SkillsForge methodology workflow.
- Need design before code with trusted SkillsForge artifacts

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

Recommend `skillsforge route --pack methodology` or the next lifecycle skill. Capture learnings with `skillsforge capture`.

## Common Mistakes

- Vague triggers that collide with other packs
- Workflow summaries inside the description field (breaks CSO)

## Pressure stub

See `pressure/` fixtures when this is a discipline skill.
