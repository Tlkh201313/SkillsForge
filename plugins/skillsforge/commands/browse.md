---
name: browse
description: Use when invoking SkillsForge browse from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /browse

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `browse` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "browse $ARGUMENTS"
```
