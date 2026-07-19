---
name: work-brief
description: Use when invoking SkillsForge work-brief from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /work-brief

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `work-brief` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "work-brief $ARGUMENTS"
```
