---
name: next
description: Suggest next productive SkillsForge commands for the AI CLI from repo state
argument-hint: "[--json] [--limit n]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:next

When unsure what to run, ask SkillsForge instead of exploring blindly.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" next $ARGUMENTS
```
