---
name: mobile
description: Use when invoking SkillsForge mobile from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /mobile

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `mobile` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "mobile $ARGUMENTS"
```
