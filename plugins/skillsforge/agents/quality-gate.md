---
name: quality-gate
description: Use when scoring skill quality and enforcing hero thresholds before merge.
maturity: stable
---

# quality-gate

Enforce `skillsforge quality` / `lint-skill` thresholds.

## Playbook

1. `quality --skill <dir> --json` — heroes need ≥85 (`lint-skill --hero`).
2. Fail on CSO description issues; send to `cso-skill-description` skill.
3. Batch: `batch --pack <id> --action quality`.
4. Block merge on score regressions without waiver in findings.

## CLI

- `skillsforge quality|lint-skill|batch|pressure`
