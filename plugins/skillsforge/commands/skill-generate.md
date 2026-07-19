---
name: skill-generate
description: Use when invoking SkillsForge skill-generate from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /skill-generate

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `skill-generate` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "skill-generate $ARGUMENTS"
```
