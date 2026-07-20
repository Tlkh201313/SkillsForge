---
name: slim
description: ForgeSlim compressors for git/test/rg - prefer over raw shell dumps to save AI CLI tokens
argument-hint: "<status|diff|log|test|run|rg|gain> [args] [--json] [--limit n]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:slim

Compress command output before it hits the model. Prefer over raw `git status` / `git diff` / `npm test` / `rg`.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" slim $ARGUMENTS
```

Examples: `status`, `diff`, `test -- npm test`, `run -- npm run build`, `rg -- TODO lib`, `gain --json`.
