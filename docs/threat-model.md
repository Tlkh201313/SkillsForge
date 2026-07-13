# Threat model

## Assets

- Skill content under `skills/`
- Generated install packages under `dist/`
- Trust receipts and evaluation reports

## Trust assumptions

- Repository content is untrusted until validated and scanned.
- Sidecar capability declarations are author claims; the scanner checks for contradictions, not runtime sandboxing.
- Claude Code host policy still applies after install.

## What SkillsForge blocks

| Rule | Trigger |
|---|---|
| `undeclared-exec` | Executable files present while `capabilities.exec` is false |
| `undeclared-network` | Network references in markdown while `capabilities.network` is false |
| `path-escape` | Relative markdown links that leave the skill directory |
| dependency cycle / missing / duplicate | Requires DAG analysis before build |

Blocking findings fail `npm run build`.

## What SkillsForge does NOT claim

- No OS sandbox or process isolation.
- No cryptographic signing of packages (hashes are integrity aids, not signatures).
- No guarantee that a declared capability is safe — only that undeclared capabilities are caught when detectable statically.
- No network allowlisting at runtime.

## Demo adversarial fixtures

See `tests/fixtures/policy/` and `examples/safe-dependency-upgrade/`.
