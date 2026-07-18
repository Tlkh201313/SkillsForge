---
name: lock-design
description: Use when invoking SkillsForge lock-design from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /lock-design

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `lock-design` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "lock-design $ARGUMENTS"
```
