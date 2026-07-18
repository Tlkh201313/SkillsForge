---
name: deploy
description: Use when invoking SkillsForge deploy from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /deploy

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `deploy` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "deploy $ARGUMENTS"
```
