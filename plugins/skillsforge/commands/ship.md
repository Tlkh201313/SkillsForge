---
description: Close the Work OS loop with ship notes, package/receipt when needed, and capture
argument-hint: "[--package-skill <dir>]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:ship

Ship only after proof.

1. Gate on `docs/work/proof.md`.
2. If packaging a skill (when asked):

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" package --host codex --skill <dir> --dry-run
```

   Then `--write` only after explicit approval; `receipt` + `verify-receipt`.
3. Write `docs/work/ship-notes.md`; run `capture --insight` as appropriate.
4. Follow skill `ship-release`.

