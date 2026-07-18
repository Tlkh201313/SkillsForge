---
description: Record proof of done in docs/work/proof.md and optional evidence bundle
argument-hint: "[--out artifacts/evidence]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:prove

Prove outcomes before ship.

1. Follow skill `prove-outcome`: re-run relevant `validate` / tests / `quality`.
2. Write `docs/work/proof.md` with command → result → paths.
3. If evidence requested:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" evidence --out artifacts/evidence
```

4. Verdict: ready for `/skillsforge:ship` or blocked.

<!-- aliases: /work-proof -->

