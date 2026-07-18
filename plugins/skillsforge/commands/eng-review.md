---
name: eng-review
description: Use when invoking SkillsForge eng-review from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /eng-review

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `eng-review` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "eng-review $ARGUMENTS"
```
