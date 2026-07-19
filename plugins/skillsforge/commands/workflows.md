---
name: workflows
description: List, show, recommend, or dry-run SkillsForge workflow definitions
argument-hint: "<list|show|recommend|run|export-html> [--json] [--query text] [--id workflow-id] [--dry-run]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:workflows

Use workflows to select a bounded, reusable plan for the task.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" workflows $ARGUMENTS
```

`workflows run` is dry-run only and must include `--dry-run`.
