---
description: Deterministically forge a skill package from a forge-spec JSON file
argument-hint: "<path-to-forge-spec.json>"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:forge

Generate a skill from the forge-spec path in `$ARGUMENTS`. Always dry-run first.

1. Confirm `$ARGUMENTS` points at a forge-spec JSON file.
2. Dry-run (default; writes nothing):

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" forge --spec $ARGUMENTS --dry-run
```

3. Show the planned `SKILL.md` / `skillsforge.json` paths and any policy findings.
4. Only after the user explicitly confirms, write:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" forge --spec $ARGUMENTS --write
```

5. Use `--force` only when the user asks to overwrite an existing skill directory.
6. Never write without a confirmed dry-run result.
