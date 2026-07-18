---
description: Run acceptance QA against brief success criteria and log proof rows
argument-hint: "[<flow name>]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:qa

Acceptance QA for the brief.

1. Derive cases from `docs/work/brief.md`.
2. Smoke SkillsForge when relevant:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" vibe
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" validate --all
```

3. Follow `qa-flow`; append results to `docs/work/proof.md`.
4. Block ship on critical failures.

