---
name: verify
description: Use when invoking SkillsForge verify from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /verify

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `verify` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "verify $ARGUMENTS"
```
