---
name: runbook
description: Use when invoking SkillsForge runbook from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /runbook

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `runbook` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "runbook $ARGUMENTS"
```
