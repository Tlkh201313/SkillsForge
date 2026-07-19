---
name: work-plan
description: Use when invoking SkillsForge work-plan from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /work-plan

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `work-plan` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "work-plan $ARGUMENTS"
```
