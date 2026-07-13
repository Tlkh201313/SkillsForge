---
description: Verify a SkillsForge trust receipt against packaged plugin bytes
argument-hint: "<receipt.json> [--package <dir>] [--evaluation <routing-report.json>|--package-only]"
allowed-tools: "Bash(node *),Read"
---

# /skillsforge:verify-receipt

Verify the receipt path in `$ARGUMENTS` against packaged bytes.

1. If `$ARGUMENTS` already includes `--evaluation` or `--package-only`, pass them through unchanged:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" verify-receipt $ARGUMENTS
```

2. Otherwise default to package-only verification:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" verify-receipt $ARGUMENTS --package-only
```

3. Report `ok`, `packageVerified`, and whether evaluation was verified or left unverified.
4. Do not claim cryptographic attestation — receipts are reproducible evidence hashes.
