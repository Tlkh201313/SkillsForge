---
name: video-watch
description: Use when invoking SkillsForge video-watch from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /video-watch

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `video-watch` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "video-watch $ARGUMENTS"
```
