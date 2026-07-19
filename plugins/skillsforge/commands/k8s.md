---
name: k8s
description: Use when invoking SkillsForge k8s from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /k8s

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `k8s` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "k8s $ARGUMENTS"
```
