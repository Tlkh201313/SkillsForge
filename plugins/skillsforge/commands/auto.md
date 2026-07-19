---
name: auto
description: Recommend the smallest matching SkillsForge skill and workflow for a task
argument-hint: "<plan|run> --query text [--read-only] [--json]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:auto

Use auto mode to route a task without loading the whole catalog into context.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" auto $ARGUMENTS
```

`auto run` requires `--read-only`; writes, installs, and removals are not auto-executed.
