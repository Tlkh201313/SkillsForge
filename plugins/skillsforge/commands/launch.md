---
name: launch
description: Use when invoking SkillsForge launch from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /launch

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `launch` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "launch $ARGUMENTS"
```
