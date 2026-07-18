---
name: secrets
description: Use when invoking SkillsForge secrets from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /secrets

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `secrets` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "secrets $ARGUMENTS"
```
