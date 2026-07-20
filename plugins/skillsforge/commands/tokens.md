---
name: tokens
description: Estimate skill/catalog context tokens (chars/4) before loading bodies into an AI CLI
argument-hint: "[--catalog|--skill <id>|--path <file>] [--limit n] [--json] [--installed]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:tokens

Check context cost before pasting skill bodies. Default `--catalog` is repo skills only.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" tokens $ARGUMENTS
```
