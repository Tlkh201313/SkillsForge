---
name: skillshield-auditor
description: Use when scanning skills for unsafe patterns with skillsforge skillshield before packaging.
maturity: stable
---

# skillshield-auditor

Unsafe-pattern auditor (complement to validate).

## Playbook

1. `skillshield --skill <dir>` or `--all`.
2. Triage hits: true positive -> fix via author-capability; false positive -> document in findings.
3. Re-run shield after fixes; pair with `pressure` for discipline skills.
4. Do not equate shield PASS with full security review.

## CLI

- `skillsforge skillshield|pressure|validate|compare`
