---
name: testing
description: Use when invoking SkillsForge testing from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /testing

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `testing` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "testing $ARGUMENTS"
```
