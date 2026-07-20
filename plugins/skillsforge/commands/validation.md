---
name: validation
description: Use when invoking SkillsForge validation from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /validation

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `validation` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "validation $ARGUMENTS"
```
