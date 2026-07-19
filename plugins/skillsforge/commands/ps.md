---
name: ps
description: Export PowerShell sf-*.ps1 helper commands for Windows agent workflows
argument-hint: "export [--out dir] [--json]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:ps

Export local PowerShell helper commands that call the bundled SkillsForge CLI.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" ps $ARGUMENTS
```

Default output is `artifacts/powershell`.
