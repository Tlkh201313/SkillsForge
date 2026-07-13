---
name: route-capability
description: Use when deciding which SkillsForge skill applies to a task and an
  explained, scored selection is needed.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/route-capability/skillsforge.json"
---

# Route a Capability

## Overview

Explainable SkillsForge routing over declared triggers, anti-triggers, description overlap, and maturity. Selection must come from the bundled router used by `skillsforge route` (same implementation as `lib/capabilities/router.mjs`).

## When to Use

When multiple skills could apply, or when a selection needs scored reasons.

## Instructions

1. Run `skillsforge route --query "<the user's task>"` (do not reimplement scoring).
2. Present the selected skill (or null), threshold, candidate scores with reasons, rejected alternatives, and fallback reason.
3. Never invent a selection the router did not make.
4. If scores collide, trust the router's alphabetical tie-break.
