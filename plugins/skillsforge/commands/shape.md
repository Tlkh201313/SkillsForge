---
description: Shape work intent into docs/work/brief.md via the shape-intent skill
argument-hint: "[<goal text>]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:shape

Start the Work OS loop by shaping intent.

1. Route for confirmation:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "shape intent $ARGUMENTS"
```

2. Follow skill `shape-intent`: write `docs/work/brief.md` with problem, users, success criteria, non-goals.
3. Stop before planning/coding; name `plan-work` / `/skillsforge:plan` as next.

<!-- aliases: /work-brief -->

