---
description: Review the current diff against plan and SkillsForge trust rules
argument-hint: "[<focus area>]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:review

Structured diff review.

1. Inspect the change set (git/PR).
2. For touched skills:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" validate <skill-dir>
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" skillshield --skill <skill-dir>
```

3. Follow `review-diff`; write `docs/work/findings.md`; verdict APPROVE or REQUEST CHANGES.

