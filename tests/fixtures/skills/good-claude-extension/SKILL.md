---
name: good-claude-extension
description: Run a controlled deployment. Use when the user explicitly requests deployment.
disable-model-invocation: true
allowed-tools:
  - Read
  - Bash(git:*)
---

Deploy only after confirmation.
