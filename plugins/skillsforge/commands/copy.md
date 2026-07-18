---
name: copy
description: Use when invoking SkillsForge copy from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /copy

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `copy` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "copy $ARGUMENTS"
```
