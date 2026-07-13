---
name: validate-agent-skill
description: Validate Agent Skills packages and Claude Code skill extensions for
  metadata, YAML, naming, instructions, and local resource links. Use when
  creating, reviewing, debugging, or preparing a SKILL.md package for
  distribution.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/validate-agent-skill/skillsforge.json"
---

# Validate an Agent Skill

Validate the requested skill before judging its quality.

Requires the bundled SkillsForge command, or Node.js 20+ when used from a SkillsForge checkout.

1. Identify the skill directory containing `SKILL.md`.
2. Run `skillsforge-validate <skill-directory>` for the portable Agent Skills profile.
3. Use `skillsforge-validate --profile claude-code <skill-directory>` only when the skill intentionally uses Claude Code frontmatter extensions.
4. If the bundled command is unavailable in a SkillsForge checkout, run `node scripts/validate-skill.mjs <skill-directory>`.
5. Report failures before advisory improvements. Include the affected field or resource path and a concrete correction.
6. Do not edit the skill unless the user asked for changes.

Use `--json` when another tool needs structured diagnostics. Validation success proves structural conformance, not instruction quality; review triggering precision, safety, and workflow usefulness separately.
