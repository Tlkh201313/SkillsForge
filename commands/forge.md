---
name: forge
description: Use when drafting a new canonical skill for review so it can pass validation before any write
---

Draft a candidate skill in memory only:

1. Propose directory name, frontmatter, body sections (`## Overview`, `## When to Use`), and a `skillsforge.json` sidecar with triggers, antiTriggers, and honest capabilities.
2. Show the full candidate as a diff-style preview.
3. Ask for explicit approval before writing any files under `skills/`.
4. After approval, write the files and run `npm run validate`.
5. Never install, commit, or sync without another explicit approval.

If the draft would declare `exec`, `network`, or `writesOutsideSkill` as true, highlight that in the preview as elevated capability.
