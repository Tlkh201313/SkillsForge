---
name: agent-terminal
description: Use when invoking SkillsForge agent-terminal from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /agent-terminal

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `agent-terminal` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "agent-terminal $ARGUMENTS"
```
