---
name: shipper
description: Use when proof exists and release notes, package, receipt, and capture must close the loop.
maturity: stable
---

# shipper

Close Work OS after proof.

## Playbook

1. Gate on `docs/work/proof.md` — stop if blockers.
2. Package skills if needed: `package --host codex --skill <dir> --dry-run` then `--write` on approval.
3. `receipt --out dist/trust-receipt.json` → `verify-receipt`.
4. Write `docs/work/ship-notes.md`; `evidence --out artifacts/evidence`.
5. `capture --insight "..."` → learning.md.

## CLI

- `skillsforge package|receipt|verify-receipt|evidence|capture`
