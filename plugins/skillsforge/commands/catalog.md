---
description: List or search SkillsForge packs, profiles, and skills
argument-hint: "[--pack <id>] [--profile <id>] [--search <text>] [--json]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:catalog

Browse the SkillsForge catalog.

1. Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" catalog $ARGUMENTS
```

2. Report ids from the CLI only; recommend `route` or `install --list` as follow-ups.
3. Use `--json` when another tool needs structured data.

