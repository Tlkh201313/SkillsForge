---
name: author-capability
description: Use when creating or editing a canonical skill so that frontmatter, body sections, sidecar routing cases, and declared capabilities pass validation on the first run
maturity: stable
platform: canonical
requires:
  - using-skillsforge
---

## Overview
Authoring contract for canonical skills: SKILL.md frontmatter and body rules plus the skillsforge.json sidecar.

## When to Use
Before writing or modifying any file under skills/.

## Authoring contract
- Frontmatter: kebab-case `name` equal to the directory, `description` starting "Use when", optional `maturity`, `platform`, `requires`.
- Body: `## Overview` and `## When to Use` required; relative links stay inside the skill directory.
- Sidecar: at least one routing trigger, explicit antiTriggers, honest `capabilities` booleans.
- Run `npm run validate` before committing; a failing skill never ships.
