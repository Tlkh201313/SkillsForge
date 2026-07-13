---
name: author-capability
description: Use when creating or editing a canonical SkillsForge skill so
  frontmatter, body sections, and the skillsforge.json sidecar pass validation
  on the first run.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/author-capability/skillsforge.json"
---

# Author a Capability

## Overview

Authoring contract for canonical skills: portable SKILL.md plus a schema-versioned skillsforge.json sidecar. Prefer the deterministic Forge CLI over hand-written files.

## When to Use

Before writing or modifying any skill under plugins/*/skills/.

## Authoring contract

1. Draft a forge-spec JSON object (name, description, overview, routing, capabilities). Do not invent free-form skill files first.
2. After the user approves the draft contents, write the spec to a temporary file only.
3. Run `skillsforge forge --spec <temp-file> --dry-run` and present the generated `SKILL.md` + `skillsforge.json` preview.
4. Obtain explicit approval to write. Never treat dry-run as permission to persist.
5. Only after approval, run `skillsforge forge --spec <temp-file> --write` (add `--force` only when the user clearly wants overwrite).
6. Run `skillsforge validate` on the generated directory and fix any failures before claiming success.
