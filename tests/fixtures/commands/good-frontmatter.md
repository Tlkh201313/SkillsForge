---
name: deploy-preview
description: Deploy a preview environment.
when_to_use: Use when a preview deployment is requested.
license: MIT
compatibility: Requires git and npm.
metadata:
  owner: platform
argument-hint: "[branch]"
arguments:
  - branch
disable-model-invocation: true
user-invocable: true
allowed-tools:
  - Read
  - Bash(git:*)
disallowed-tools: Write
model: sonnet
context: fork
agent: general-purpose
hooks:
  Stop: []
paths:
  - "src/**/*.js"
effort: high
---

# Deploy preview

Deploy the requested branch to the preview environment.
