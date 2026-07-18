---
name: lib
description: Build or inspect the local SkillsForge skill library index and HTML UI
argument-hint: "<build|serve|check|remove> [--json] [--out dir] [--skill id] [--host id] [--dry-run]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:lib

Build or inspect the local skill library. Removal is dry-run unless the CLI receives explicit mutation flags.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" lib $ARGUMENTS
```

Use `lib build --json` for artifact paths and `lib check --skill <id>` for one skill.
