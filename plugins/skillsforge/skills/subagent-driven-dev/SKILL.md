---
name: subagent-driven-dev
description: Use when doing subagent driven dev work and you need bounded methodology-pack steps, stop conditions, and a verification check before shipping.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/subagent-driven-dev/skillsforge.json"
---

# Subagent Driven Dev

## Overview

Lean SkillsForge scaffold for subagent driven dev (methodology pack). Add domain examples and verification before calling it production-depth.

## Purpose

Deliver a trustworthy, repeatable outcome for Subagent Driven Dev without copying third-party skill bodies or overstating this scaffold's depth.

## When to Use

- Use when doing subagent driven dev work and you need bounded methodology-pack steps, stop conditions, and a verification check before shipping.
- Need subagent driven dev with trusted SkillsForge artifacts

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
