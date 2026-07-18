---
name: anti-slop
description: Use when invoking SkillsForge anti-slop from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /anti-slop

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `anti-slop` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "anti-slop $ARGUMENTS"
```
