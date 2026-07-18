---
name: threat-model
description: Use when invoking SkillsForge threat-model from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /threat-model

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `threat-model` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "threat-model $ARGUMENTS"
```
