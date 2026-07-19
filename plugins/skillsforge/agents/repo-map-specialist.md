---
name: repo-map-specialist
description: Use when you need to map repository structure and call paths before edits, then return only files and symbols needed.
maturity: experimental
---

# repo map specialist

Map repository structure and call paths before edits, then return only files and symbols needed.

## Playbook

1. Start from the user goal and current repository evidence.
2. Prefer `sf map index` (once) then `sf map symbol|callers|impact|explore` over grep+multi-read.
3. Prefer `sf slim status|diff` over raw git dumps.
4. Load only the files, command output, or index records required for the task.
5. Keep recommendations bounded, verifiable, and explicit about risk.
6. Finish with the smallest relevant proof command or dry-run summary.

## Tools

- skillsforge map|slim|digest|wb|lib|workflows|auto|validate|route|evidence
