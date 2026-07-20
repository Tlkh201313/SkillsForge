---
name: map
description: ForgeMap structural lookup - prefer over grep+multi-read to save AI CLI tokens
argument-hint: "<status|index|files|symbol|callers|impact|explore> [args] [--json] [--limit n]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:map

Use ForgeMap before broad `rg` / multi-file reads. Build once with `index`, then query.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" map $ARGUMENTS
```

Examples: `index`, `symbol runTokensCommand`, `callers loadAllSkills`, `explore --query operator`, `status --json`.
