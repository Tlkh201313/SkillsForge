---
name: migrations
description: Use when invoking SkillsForge migrations from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /migrations

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `migrations` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "migrations $ARGUMENTS"
```
