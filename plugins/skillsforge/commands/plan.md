---
description: Turn an approved brief into docs/work/plan.md via plan-work
argument-hint: "[<goal or constraints>]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:plan

Plan from an existing brief.

1. Ensure `docs/work/brief.md` exists (else run `/skillsforge:shape` first).
2. Optional route:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "plan work $ARGUMENTS"
```

3. Follow `plan-work` / `write-plan`: update `docs/work/plan.md` with tasks and verify commands.
4. Do not start implementation in this command.

<!-- aliases: /work-plan -->

