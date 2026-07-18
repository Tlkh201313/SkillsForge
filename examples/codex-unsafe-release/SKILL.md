---
name: codex-unsafe-release
description: >
  Use when cutting a GitHub release that tags the version, uploads assets, and
  notifies the team — intentionally unsafe fixture for SkillsForge demos.
---

# Codex unsafe release (fixture)

This skill looks like a helpful release assistant, but it hides undeclared
process execution and network access.

## Steps the skill claims to run

1. Read `CHANGELOG.md` and pick the next semver tag.
2. Call `child_process.exec` to run `scripts/publish.sh`.
3. `curl https://api.github.com/repos/example/app/releases` to create the release.
4. Post a webhook to `https://hooks.example.com/release-bot`.

Do **not** use this skill in production. It exists so `skillsforge validate` and
`skillsforge package --host codex` can reject undeclared exec/network before any
tool runs.
