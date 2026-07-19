---
name: triage
description: Use when invoking SkillsForge triage from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /triage

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `triage` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "triage $ARGUMENTS"
```
