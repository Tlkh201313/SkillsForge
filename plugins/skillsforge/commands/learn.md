---
name: learn
description: Use when invoking SkillsForge learn from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /learn

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `learn` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "learn $ARGUMENTS"
```
