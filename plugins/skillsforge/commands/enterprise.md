---
name: enterprise
description: Use when invoking SkillsForge enterprise from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /enterprise

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `enterprise` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "enterprise $ARGUMENTS"
```
