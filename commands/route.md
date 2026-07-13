---
name: route
description: Use when deciding which SkillsForge skill applies to a task and an explained, scored selection is needed
---

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/route.mjs" "<the user's task>"` from the plugin root and present the JSON result: the selected skill, each candidate's score with reasons, and the fallback explanation when nothing is selected. Never invent a selection the router did not make.
