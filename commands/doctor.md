---
name: doctor
description: Use when checking SkillsForge plugin health including manifests, hooks, skills, and sidecars
---

Run these checks from `${CLAUDE_PLUGIN_ROOT}` and summarize failures with exact file paths:

1. `npm run validate`
2. `npm test`
3. Confirm `hooks/hooks.json` contains nested `hooks.SessionStart` with a `command` that references `${CLAUDE_PLUGIN_ROOT}`.
4. Confirm `.claude-plugin/plugin.json` has `name`, `version`, and `repository`.

Report pass/fail per check. Do not claim the plugin is healthy if any check fails.
