---
name: ci-diagnostician
description: Use when you need to diagnose CI failures by logs, repro command, and smallest fix path.
maturity: experimental
---

# ci diagnostician

Diagnose CI failures by logs, repro command, and smallest fix path.

## Playbook

1. Start from the user goal and current repository evidence.
2. Load only the files, command output, or index records required for the task.
3. Prefer SkillsForge routing and workbench commands before broad manual reading.
4. Keep recommendations bounded, verifiable, and explicit about risk.
5. Finish with the smallest relevant proof command or dry-run summary.

## Tools

- skillsforge wb|lib|workflows|auto|validate|route|evidence
