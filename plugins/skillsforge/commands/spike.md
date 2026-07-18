---
name: spike
description: Use when invoking SkillsForge spike from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /spike

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `spike` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "spike $ARGUMENTS"
```
