# SkillsForge

Validate, route, policy-scan, and compile agent skills from one canonical source.

**Pitch:** Forge one skill, prove it works, route it with reasons, ship it across agent hosts.

## Quickstart (under 5 minutes)

```sh
git clone https://github.com/Tlkh201313/SkillsForge.git
cd SkillsForge
npm test
npm run validate
npm run eval
npm run build
node scripts/route.mjs "audit skill safety"
```

Load as a Claude Code plugin for a session (no marketplace required):

```sh
claude --plugin-dir .
```

Then try `/skillsforge:route`, `/skillsforge:doctor`, or `/skillsforge:forge`.

Optional host validation before tagging a release (run locally when the Claude CLI is available):

```sh
claude plugin validate ./ --strict
claude plugin details skillsforge
```

## What works today (v0.2.0)

| Surface | Status |
|---|---|
| Claude Code plugin (skills, commands, SessionStart hook) | Full |
| Deterministic explainable router | Full |
| Frozen routing evaluation corpus (80 cases) | Full |
| Capability policy scanner | Full |
| Deterministic Claude build + trust receipt | Full |
| Cursor export + per-field lossiness report | Proof |
| Codex / OpenCode adapters | Declared unsupported |

## Commands

```sh
npm test              # node:test suite
npm run validate      # structural + sidecar validation
npm run eval          # routing precision/recall on frozen corpus
npm run build         # validate → policy → compile → receipt
npm run route -- "<query>"   # or: node scripts/route.mjs "<query>"
```

## Evidence

Re-run locally; numbers come from machine artifacts, not marketing copy.

```sh
npm run eval   # writes artifacts/evaluation/routing-report.json
npm run build  # writes dist/trust-receipt.json and dist/cursor-lossiness.json
```

Targets:

- Routing: ≥80 cases, precision ≥0.90, recall ≥0.85 (report TP/FP/FN/TN)
- Policy: blocking findings for undeclared exec/network and path escape
- Build: identical `receiptHash` across repeated runs
- Portability: every canonical field accounted as mapped, transformed, or unsupported

## Failure states

- `npm run validate` fails → skill never ships
- `npm run eval` exits 1 → routing below thresholds; fix sidecars, not the frozen corpus
- `npm run build` prints `BUILD BLOCKED` → policy or dependency gate failed; inspect JSON findings
- Router `selected: null` → honest fallback `no-skill-above-threshold`

## Support matrix

- **Claude Code:** full — install with `claude --plugin-dir .`
- **Cursor:** export proof under `dist/cursor/` with lossiness under `dist/cursor-lossiness.json`
- **Codex / OpenCode:** not compiled; adapters remain stubs on purpose

## Docs

- [Architecture](docs/architecture.md)
- [Threat model](docs/threat-model.md)
- [Evaluation method](docs/evaluation-method.md)
- [Reference ledger](docs/reference-ledger.md)
- [Golden demo](examples/README.md)

## Source boundary

`teacher (FABLE 5)/` is a read-only curriculum package and is gitignored. Product source lives in this repository root.
