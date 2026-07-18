---
name: status
description: Use when invoking SkillsForge status from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /status

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `status` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "status $ARGUMENTS"
```
