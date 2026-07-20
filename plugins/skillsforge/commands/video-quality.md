---
name: video-quality
description: Use when invoking SkillsForge video-quality from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /video-quality

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `video-quality` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "video-quality $ARGUMENTS"
```
