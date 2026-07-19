---
name: incident
description: Use when invoking SkillsForge incident from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /incident

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `incident` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "incident $ARGUMENTS"
```
