---
name: verify-capability
description: Use when checking whether a skill is safe and correct, including validation failures, undeclared capabilities, dependency cycles, and routing regressions
maturity: stable
platform: canonical
requires:
  - using-skillsforge
---

## Overview
Verification contract: structural validation, capability scanning, dependency analysis, and routing evaluation.

## When to Use
Before building, after editing any skill, and whenever a routing or policy result looks wrong.

## Checks
- `npm run validate` — structure, links, sidecar shape.
- `npm run eval` — routing precision and recall against the frozen corpus.
- `npm run build` — policy scan blocks undeclared exec, network, or out-of-tree writes before compiling.
