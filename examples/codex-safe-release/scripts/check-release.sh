#!/usr/bin/env bash
# Declared by capabilities.exec.commands — checklist only, no network.
set -euo pipefail
test -f CHANGELOG.md
echo "release checklist ok"
