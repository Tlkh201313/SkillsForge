---
name: digest
description: One-shot AI CLI briefing - status + recommend + token cost + next commands
argument-hint: "--query <text> [--json] [--limit n]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:digest

Prefer this at task start instead of loading many skills or dumping repo state.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" digest $ARGUMENTS
```
