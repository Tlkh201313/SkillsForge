---
name: stocktake
description: Use when invoking SkillsForge stocktake from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /stocktake

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `stocktake` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" stocktake $ARGUMENTS
```
