---
name: retention
description: Use when invoking SkillsForge retention from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /retention

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `retention` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "retention $ARGUMENTS"
```
