---
name: using-skillsforge
description: Use when a session begins in a SkillsForge repository and the agent needs to know which SkillsForge commands and checks are available
maturity: stable
platform: canonical
---

## Overview
SkillsForge validates, routes, policy-scans, and compiles agent skills from one canonical source under skills/.

## When to Use
At session start, or whenever unsure which SkillsForge command applies.

## Commands
- `/skillsforge:route <query>` — pick the best skill with a scored explanation.
- `/skillsforge:forge` — draft a new canonical skill for review; never writes without approval.
- `/skillsforge:doctor` — health-check manifests, hooks, skills, and sidecars.
- `npm run validate` / `npm test` / `npm run eval` / `npm run build` from the plugin root.
