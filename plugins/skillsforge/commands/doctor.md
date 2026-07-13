---
description: Run SkillsForge plugin and installed-skill health checks
argument-hint: "[--json]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:doctor

Diagnose the installed SkillsForge plugin and its production skills.

`$ARGUMENTS` may include `--json` (recommended) or be empty.

1. Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" doctor $ARGUMENTS
```

If `$ARGUMENTS` is empty, default to JSON:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" doctor --json
```

2. Summarize each check (`PASS`/`FAIL`) with the detail string.
3. If `ok` is false, list blocking policy or structural findings and stop before qualitative advice.
4. Do not edit plugin files unless the user asked for fixes.
