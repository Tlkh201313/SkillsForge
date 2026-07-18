---
name: e2e
description: Use when invoking SkillsForge e2e from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /e2e

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `e2e` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "e2e $ARGUMENTS"
```
