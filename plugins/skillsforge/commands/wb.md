---
name: wb
description: Run token-friendly SkillsForge workbench commands for repo status, search, diff, and proof hints
argument-hint: "<status|tree|find|grep|diff|errors|bigfiles|recent|proof> [--json] [--query text] [--limit n]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:wb

Use the compact workbench before broad manual file reads.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" wb $ARGUMENTS
```

Prefer `--json` when another tool needs structured output.
