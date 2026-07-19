---
name: legal
description: Use when invoking SkillsForge legal from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /legal

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `legal` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "legal $ARGUMENTS"
```
