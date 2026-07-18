---
name: codex-safe-release
description: >
  Use when cutting a least-privilege GitHub release: run the declared checklist
  script, call only api.github.com, and keep writes inside the project tree.
---

# Codex safe release

Prepare a controlled GitHub release with explicit capability declarations.

## When to use

- Tagging a version after CI is green
- Creating a GitHub release via the declared `gh` command family
- Keeping network and shell access least-privilege

## Procedure

1. Confirm `CHANGELOG.md` matches the intended tag.
2. Run the declared checklist: `sh scripts/check-release.sh`.
3. Create the release with `gh release create` (api.github.com only).
4. Do not call undeclared hosts, MCP tools, or shell control operators.

## Out of scope

- Publishing to npm registries
- Opening arbitrary URLs
- Patching files outside the project write scope
