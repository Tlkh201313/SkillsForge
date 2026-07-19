---
name: pack-roles
description: Use when invoking SkillsForge pack-roles from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /pack-roles

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `pack-roles` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "pack-roles $ARGUMENTS"
```
