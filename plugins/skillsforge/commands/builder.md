---
name: builder
description: Use when invoking SkillsForge builder from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /builder

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `builder` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "builder $ARGUMENTS"
```
