---
name: ci
description: Use when invoking SkillsForge ci from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /ci

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `ci` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "ci $ARGUMENTS"
```
