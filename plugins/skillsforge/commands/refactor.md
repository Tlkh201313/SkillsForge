---
name: refactor
description: Use when invoking SkillsForge refactor from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /refactor

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `refactor` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "refactor $ARGUMENTS"
```
