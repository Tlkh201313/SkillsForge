---
description: Explain which installed SkillsForge skill best matches a natural-language query
argument-hint: "<query text>"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:route

Route the user query in `$ARGUMENTS` to the best matching installed skill.

1. Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "$ARGUMENTS"
```

2. Summarize the winner (or null), score margin, trigger hits, and anti-trigger hits.
3. Do not invent skills that are not in the JSON result.
4. If the top score lacks trigger evidence or margin, say so and stop recommending a skill.
