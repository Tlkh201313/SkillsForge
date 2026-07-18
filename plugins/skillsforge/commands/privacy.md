---
name: privacy
description: Use when invoking SkillsForge privacy from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /privacy

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `privacy` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "privacy $ARGUMENTS"
```
