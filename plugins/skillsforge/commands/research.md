---
name: research
description: Use when invoking SkillsForge research from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /research

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `research` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "research $ARGUMENTS"
```
