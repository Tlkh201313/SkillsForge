---
name: eng
description: Use when invoking SkillsForge eng from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /eng

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `eng` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "eng $ARGUMENTS"
```
