---
name: next
description: Use when invoking SkillsForge next from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /next

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `next` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "next $ARGUMENTS"
```
