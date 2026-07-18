---
name: finance
description: Use when invoking SkillsForge finance from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /finance

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `finance` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "finance $ARGUMENTS"
```
