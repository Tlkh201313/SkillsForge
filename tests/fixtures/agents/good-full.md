---
name: good-full
description: Exercise every supported agent frontmatter field.
model: sonnet
effort: high
maxTurns: 12
tools:
  - Read
  - Grep
disallowedTools: Bash
skills:
  - fidelity-review
memory: project
background: true
isolation: worktree
---

Review the target and return a concise verdict.
