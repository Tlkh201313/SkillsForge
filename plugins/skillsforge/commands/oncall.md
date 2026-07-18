---
name: oncall
description: Use when invoking SkillsForge oncall from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /oncall

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `oncall` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "oncall $ARGUMENTS"
```
