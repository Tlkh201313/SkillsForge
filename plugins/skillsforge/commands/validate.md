---
description: Validate an Agent Skills package with structural checks and capability policy scan
argument-hint: "<skill-directory> [--json] [--profile canonical|claude-code]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:validate

Validate the skill directory in `$ARGUMENTS` before judging quality.

1. Resolve the skill path from `$ARGUMENTS` (directory containing `SKILL.md`).
2. Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" validate --profile claude-code $ARGUMENTS
```

3. Report PASS/FAIL with concrete field or path corrections first.
4. Do not edit the skill unless the user asked for changes.
5. Use `--json` in `$ARGUMENTS` when another tool needs structured diagnostics.

Exit codes from the CLI: `0` success, `1` validation/policy failure, `2` bad usage.
