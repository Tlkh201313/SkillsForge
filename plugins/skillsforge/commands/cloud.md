---
name: cloud
description: Use when invoking SkillsForge cloud from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /cloud

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `cloud` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "cloud $ARGUMENTS"
```
