---
name: video-rate
description: Use when invoking SkillsForge video-rate from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /video-rate

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `video-rate` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "video-rate $ARGUMENTS"
```
