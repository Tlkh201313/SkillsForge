# ForgeMap + ForgeSlim

SkillsForge-native operator surfaces for structural lookup and compact CLI output. They are **not** clones of CodeGraph, RTK, Serena, or Repomix.

## AI CLIs (Claude Code, Cursor, Codex, OpenCode, Gemini)

These hosts load SkillsForge guidance from:

- `AGENTS.md` (regenerate with `skillsforge export-agents`)
- skill `using-skillsforge`
- slash commands `/skillsforge:map`, `/skillsforge:slim`, `/skillsforge:digest`, `/skillsforge:tokens`, `/skillsforge:next`
- MCP tools `map`, `slim`, `digest`, `next`, `tokens` (when the SkillsForge MCP server is connected)

**Rule:** prefer those surfaces over raw `git` / `npm test` / `rg` / multi-file reads so context stays small.

## ForgeMap (`sf map`)

Lean structural map for JS/TS so agents can answer "where is X / who imports Y / impact of Z" without grep+multi-read loops.

| Command | Behavior |
|---|---|
| `map status` | Index health, file/symbol counts, whether `.codegraph/codegraph.db` linked |
| `map index [--force]` | Rebuild lightweight index -> `artifacts/forgemap/index.json` |
| `map files [--limit]` | Indexed file list |
| `map symbol <name>` | Definitions + file:line |
| `map callers <name>` | Importers of files that define `name` |
| `map impact <name>` | Dependent files (import graph, depth 1-2) |
| `map explore --query <text>` | Budget-capped pack: matching symbols, paths, 1-hop neighbors |

**How the index works:** line-regex exports/imports for `*.{js,mjs,cjs,ts,tsx}` under the repo (skips `node_modules`, `dist`, `.codegraph`, `artifacts`, ...). Zero extra dependencies.

**Optional enrich:** if `.codegraph/codegraph.db` exists and `node:sqlite` opens it, `callers` / `impact` / `explore` append `cg-*` rows. On any failure, ForgeMap continues with the lightweight index only (fail open).

**Not included:** full tree-sitter multi-language MCP, embeddings, VS Code extension, or shipping a CodeGraph binary.

## ForgeSlim (`sf slim`)

Pure-JS output compressors so agents can keep git/test/search stdout small. Opt-in CLI only - SkillsForge does **not** install global PreToolUse hooks that rewrite every shell call.

| Command | Behavior |
|---|---|
| `slim status` | Branch + dirty file names |
| `slim diff [--stat]` | Name-only + shortstat |
| `slim log [--limit]` | Oneline log |
| `slim test [--] <cmd...>` | Run tests; keep fail summary; drop pass spam |
| `slim run -- <cmd...>` | Generic runner with head/tail line caps |
| `slim rg -- <args...>` | Cap matches; group by file |
| `slim gain [--reset]` | Session ledger of estimated tokens saved |

Ledger path: `artifacts/skillsforge-slim-gain.json` (gitignored local state).

**Estimates:** savings use the same `approx-chars/4` heuristic as `sf tokens`. This is a **context-size estimate**, not tiktoken and not provider API billing. Measure before/after on your fixtures; do not treat ratios as universal multipliers.

## Related operator commands

- `sf tokens` - catalog default is **repo skills only**; `--installed` adds host skills. Session file: `artifacts/skillsforge-token-session.json`.
- `sf digest --query ...` - may suggest `map explore` when the query looks like a symbol/path.
- `sf next` - may suggest `map index` when the index is missing, or `slim status` when the tree is dirty.

## Honesty

No "100×" / "best" / API-billing-parity claims. Prefer measured `slim gain` and compact vs raw byte ratios on real command output.
