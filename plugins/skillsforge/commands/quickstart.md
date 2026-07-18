---
name: quickstart
description: Use when invoking SkillsForge quickstart from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /quickstart

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `quickstart` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "quickstart $ARGUMENTS"
```
