---
name: author-capability
description: Use when creating or editing a canonical SkillsForge skill so
  frontmatter, body sections, and the skillsforge.json sidecar pass validation
  before the skill is trusted.
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

## Purpose

Produce a portable `SKILL.md` plus schema-versioned `skillsforge.json` that pass `skillsforge validate` and score ≥70 on `skillsforge quality` (heroes ≥85) without hand-waving frontmatter.

## When to Use

Before writing or modifying any skill under `plugins/*/skills/`.

## Phases

1. **Spec, not files** — Draft a forge-spec JSON (name, description starting with `Use when…`, overview, routing triggers/antiTriggers, capabilities). Do not invent free-form skill trees first.
2. **Dry-run forge** — After the user approves the draft contents, write the spec to a temp file and run `skillsforge forge --spec <temp> --dry-run`. Present planned `SKILL.md` / `skillsforge.json` paths.
3. **Write only on approval** — Run `skillsforge forge --spec <temp> --write` (`--force` only when overwrite is explicit). Never treat dry-run as permission to persist.
4. **Gate** — Run `skillsforge validate --profile claude-code <skill-dir>` then `skillsforge quality --skill <skill-dir>`. Fix blocking findings before claiming success.
5. **Optional pressure** — For discipline skills, add `pressure/` fixtures and run `skillsforge pressure --skill <dir>` before merge.

## Exit

- Validate exit 0 on the skill directory
- Quality score reported; heroes must be ≥85
- Sidecar `routing.mode` matches inventory (`auto` only for the seven auto heroes)
- Description passes CSO (starts with `Use when…`, no workflow summary)

## Anti-patterns

- Hand-copying third-party `SKILL.md` bodies
- Writing skills without a sidecar when the pack expects one
- Putting workflow steps inside the description field
- Skipping forge dry-run

## Handoff

Recommend `skillsforge route --query "validate skill"` → `validate-agent-skill`, or `skillsforge skillshield --skill <dir>` before packaging. For catalog visibility, run `skillsforge catalog --search <name>`.
