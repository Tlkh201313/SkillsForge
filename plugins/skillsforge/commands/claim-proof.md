---
name: claim-proof
description: Use when invoking SkillsForge claim-proof from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /claim-proof

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge `claim-proof` workflow.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "claim-proof $ARGUMENTS"
```
