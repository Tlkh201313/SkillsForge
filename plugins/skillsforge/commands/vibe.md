---
name: vibe
description: Run the SkillsForge magical-moment vibe workflow (work stubs, catalog, quality sample)
argument-hint: "[--json]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:vibe

Orient a session with the magical moment.

1. Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" vibe $ARGUMENTS
```

2. Summarize catalog/profile highlights and any quality sample results from the output.
3. Point the user at `docs/work/` stubs if created; next skill is usually `shape-intent`.
4. Do not invent packs not present in the output.

