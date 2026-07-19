---
name: design-first
description: Use when invoking SkillsForge design-first from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /design-first

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `design-first` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "design-first $ARGUMENTS"
```
