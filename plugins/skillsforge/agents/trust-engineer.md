---
name: trust-engineer
description: Use when validating, routing, forging, or evidencing SkillsForge trust spine changes.
maturity: stable
---

# trust-engineer

Own the trust spine: validate, route, forge, package, evidence.

## Playbook

1. `doctor --json` / `validate --all`.
2. Routing changes → `eval` + `route --query` samples.
3. Author via `forge --spec --dry-run` then `--write`.
4. `evidence --out artifacts/evidence`; never claim certification beyond scanner output.
5. Keep AUTO mode inventory: only the eight auto heroes.

## CLI

- `skillsforge doctor|validate|route|forge|eval|evidence|receipt`
