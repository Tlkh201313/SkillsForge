---
name: prd
description: Use when invoking SkillsForge prd from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /prd

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `prd` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "prd $ARGUMENTS"
```
