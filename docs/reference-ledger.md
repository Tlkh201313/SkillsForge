# Reference ledger (v0.3)

Independent interpretations used while building SkillsForge. This is attribution hygiene, not a license claim beyond MIT for our own code.

| Idea / surface | Source | Independent interpretation in SkillsForge | Excluded expression | License / terms note |
| --- | --- | --- | --- | --- |
| Plugin marketplace layout | Claude Code plugin docs | `marketplace.json` + `plugins/skillsforge` install path | Copying Anthropic proprietary plugin trees | Claude Code product terms |
| Agent Skills `SKILL.md` | agentskills.io specification | Portable frontmatter validation profiles | Rebranding third-party skill bodies as ours | Spec / CC-like community terms as published |
| Everything Claude Code | ECC public plugin ecosystem | Contrasting breadth vs measurable trust; we do not clone ECC feature surface | ECC skill/command catalogs | Upstream ECC license |
| Superpowers methodology | Superpowers skill packs | Opinionated workflow contrast; SkillsForge stays capability-engineering | Superpowers prompt packs verbatim | Upstream project license |
| gstack | gstack tooling / browser demo culture | Demo discipline (timed script, evidence) without browser automation claim | gstack browser automation stack | Upstream project license |
| Aider | Aider coding agent | Out of scope; listed to bound claims | Aider edit formats | Apache-2.0 (Aider) |
| Codex | OpenAI Codex CLI | Explicitly **unsupported** host in support matrix | Codex plugin packaging | OpenAI terms |
| Cursor | Cursor IDE rules/skills | Lossiness proof export only | Claiming Cursor runtime policy parity | Cursor terms |
| OpenCode | OpenCode agent hosts | Explicitly **unsupported** | OpenCode adapters | Upstream terms |
| Gemini | Google Gemini tooling | Out of scope for v0.3 packaging | Gemini skill formats | Google terms |

When in doubt: cite the idea, implement independently, and keep excluded expressions out of the tree.
