---
name: unit-test
description: Use when invoking SkillsForge unit-test from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /unit-test

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `unit-test` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "unit-test $ARGUMENTS"
```
