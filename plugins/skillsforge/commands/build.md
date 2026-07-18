---
description: Implement the next plan slice using run-build with validate gates
argument-hint: "[<slice or task text>]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:build

Execute the next approved plan slice.

1. Read `docs/work/plan.md` (+ `design-lock.md` if UI).
2. Optional:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" route --query "run build $ARGUMENTS"
```

3. Follow `run-build` / `tdd-first`; on skill edits run `validate` and `quality --skill`.
4. Update plan checkoffs; draft proof notes.

