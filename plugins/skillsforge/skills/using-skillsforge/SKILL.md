---
name: using-skillsforge
description: Use when a SkillsForge session starts and the agent needs to know
  which SkillsForge commands, checks, and evidence surfaces are available.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/using-skillsforge/skillsforge.json"
---

# Using SkillsForge

## Overview

SkillsForge validates, forges, routes, policy-scans, and packages portable Agent Skills with evidence receipts.

## When to Use

At session start, or whenever unsure which SkillsForge command applies.

## Commands

- `skillsforge doctor`
- `skillsforge validate`
- `skillsforge route --query "<task>"`
- `skillsforge forge --spec <file> --dry-run`
- `skillsforge receipt --out <file>`
- `skillsforge verify-receipt <file>`
