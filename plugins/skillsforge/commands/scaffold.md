---
description: Dry-run or write a new original skill scaffold with sidecar and openai.yaml
argument-hint: "--name <id> [--pack <id>] [--mode auto|explicit] [--write] [--force]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:scaffold

Scaffold an original skill (prefer dry-run).

1. Confirm `$ARGUMENTS` includes `--name <id>`.
2. Dry-run (default):

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" scaffold $ARGUMENTS
```

3. Show planned paths; only add `--write` after user approval.
4. After write: `validate` + `quality --skill`; set `routing.mode` per inventory (almost always `explicit`).

