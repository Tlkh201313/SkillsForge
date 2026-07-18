---
name: crew
description: Use when invoking SkillsForge crew from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /crew

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `crew` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "crew $ARGUMENTS"
```
