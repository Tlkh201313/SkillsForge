---
name: adr
description: Use when invoking SkillsForge adr from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /adr

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `adr` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "adr $ARGUMENTS"
```
