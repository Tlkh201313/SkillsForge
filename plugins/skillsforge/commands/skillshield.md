---
description: Scan one skill or all skills for unsafe patterns
argument-hint: "[--skill <dir>|--all]"
allowed-tools: "Bash(node *),Read,Write,Edit"
---

# /skillsforge:skillshield

Unsafe-pattern scan (complement to validate).

1. Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" skillshield $ARGUMENTS
```

2. Triage findings; do not claim full security audit.
3. On hits, recommend `author-capability` fixes and re-run shield.

