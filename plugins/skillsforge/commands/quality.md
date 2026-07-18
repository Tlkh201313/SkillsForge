---
description: Score a skill directory 0–100 with SkillsForge quality checks
argument-hint: "--skill <dir> [--json]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:quality

Score skill authoring quality.

1. Require `--skill <dir>` in `$ARGUMENTS`.
2. Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" quality $ARGUMENTS
```

3. Heroes should be ≥85; others ≥70. Call out CSO failures on the description field.
4. Do not edit the skill unless the user asked for fixes.

