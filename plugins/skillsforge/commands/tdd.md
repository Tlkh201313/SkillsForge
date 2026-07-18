---
name: tdd
description: Use when invoking SkillsForge tdd from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /tdd

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `tdd` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "tdd $ARGUMENTS"
```
