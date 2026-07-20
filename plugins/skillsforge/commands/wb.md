---
name: wb
description: Run token-friendly SkillsForge workbench commands for repo status, search, diff, and proof hints
argument-hint: "<status|tree|find|grep|diff|errors|bigfiles|recent|proof> [--json] [--query text] [--limit n]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:wb

Use the compact workbench when ForgeSlim/ForgeMap do not cover the need.
Prefer `/skillsforge:slim` for git/test/rg and `/skillsforge:map` for symbol/impact lookups first.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" wb $ARGUMENTS
```

Prefer `--json` when another tool needs structured output. Always pass `--limit` unless `--full` is required.
