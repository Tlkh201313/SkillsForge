---
name: security
description: Use when invoking SkillsForge security from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /security

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `security` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "security $ARGUMENTS"
```
