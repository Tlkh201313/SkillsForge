---
name: ops
description: Use when invoking SkillsForge ops from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /ops

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `ops` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "ops $ARGUMENTS"
```
