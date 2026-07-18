---
name: design-review
description: Use when invoking SkillsForge design-review from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /design-review

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `design-review` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "design-review $ARGUMENTS"
```
