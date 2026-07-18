---
name: readme
description: Use when invoking SkillsForge readme from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /readme

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `readme` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "readme $ARGUMENTS"
```
