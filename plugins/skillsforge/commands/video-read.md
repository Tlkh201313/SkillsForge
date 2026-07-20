---
name: video-read
description: Use when invoking SkillsForge video-read from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /video-read

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `video-read` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "video-read $ARGUMENTS"
```
