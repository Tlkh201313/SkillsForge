---
name: mobile-android-release
description: Use when you need mobile android release in a SkillsForge mobile workflow.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/mobile-android-release/skillsforge.json"
---

# Mobile Android Release

## Overview

Lean SkillsForge scaffold for mobile android release (mobile pack). Add domain examples and verification before calling it production-depth.

## Purpose

Deliver a trustworthy, repeatable outcome for Mobile Android Release without copying third-party skill bodies or overstating this scaffold's depth.

## When to Use

- Use when you need mobile android release in a SkillsForge mobile workflow.
- Need mobile android release with trusted SkillsForge artifacts

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

Recommend `skillsforge route --pack mobile` or the next lifecycle skill. Capture learnings with `skillsforge capture`.

## Common Mistakes

- Vague triggers that collide with other packs
- Workflow summaries inside the description field (breaks CSO)

## Pressure stub

See `pressure/` fixtures when this is a discipline skill.
