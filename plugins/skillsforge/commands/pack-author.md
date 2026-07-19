---
name: pack-author
description: Use when invoking SkillsForge pack-author from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /pack-author

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `pack-author` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "pack-author $ARGUMENTS"
```
