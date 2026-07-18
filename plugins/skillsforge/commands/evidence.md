---
description: Emit a deterministic trust/eval evidence bundle to an output directory
argument-hint: "--out <dir>"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:evidence

Emit trust evidence bundle.

1. Prefer an explicit `--out` (CI default `artifacts/evidence`):

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" evidence --out artifacts/evidence $ARGUMENTS
```

2. Summarize files written; link them from `docs/work/proof.md` when proving/shipping.
3. Pair with `receipt` / `verify-receipt` when packaging.

