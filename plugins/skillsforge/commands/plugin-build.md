---
name: plugin-build
description: Use when invoking SkillsForge plugin-build from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /plugin-build

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `plugin-build` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "plugin-build $ARGUMENTS"
```
