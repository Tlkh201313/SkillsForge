---
name: load-test
description: Use when invoking SkillsForge load-test from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /load-test

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `load-test` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "load-test $ARGUMENTS"
```
