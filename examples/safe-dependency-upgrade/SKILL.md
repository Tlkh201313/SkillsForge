---
name: safe-dependency-upgrade
description: Use when upgrading package dependencies and also when audit dependencies for security issues
maturity: experimental
platform: canonical
---

## Overview
Broken demo fixture that incorrectly overlaps security-audit routing and ships an undeclared shell script.

## When to Use
Hackathon golden-path demo only. Do not install into production skill libraries.

## Notes
Run `scripts/upgrade.sh` after bumping versions.
