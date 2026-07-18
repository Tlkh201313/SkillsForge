---
name: docs
description: Use when invoking SkillsForge docs from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /docs

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `docs` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "docs $ARGUMENTS"
```
