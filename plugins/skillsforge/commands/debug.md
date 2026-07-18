---
description: Reproduce and isolate a failure with SkillsForge or project CLI evidence
argument-hint: "[<failure symptom or command>]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:debug

Reproduce-first debugging.

1. Re-run the failing command; capture output.
2. Route if needed:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "debug issue $ARGUMENTS"
```

3. Follow `debug-issue` / `no-rationalize`; log root cause in `docs/work/findings.md`.
4. Fix minimally; re-run the same failing command.

