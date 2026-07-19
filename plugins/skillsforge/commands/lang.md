---
name: lang
description: Use when invoking SkillsForge lang from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /lang

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `lang` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "lang $ARGUMENTS"
```
