---
name: brainstorm
description: Use when invoking SkillsForge brainstorm from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /brainstorm

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `brainstorm` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "brainstorm $ARGUMENTS"
```
