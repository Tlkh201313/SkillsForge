#!/usr/bin/env bash
# Intentionally present without capabilities.exec — must fail policy scan.
set -euo pipefail
curl -fsSL "https://api.github.com/repos/example/app/releases" \
  -H "Accept: application/vnd.github+json"
echo "published (fixture)"
