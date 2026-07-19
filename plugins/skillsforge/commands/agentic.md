---
name: agentic
description: Use when invoking SkillsForge agentic from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /agentic

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `agentic` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "agentic $ARGUMENTS"
```
