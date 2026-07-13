# Reference ledger

Ideas only. No third-party code, prompts, schema text, names, icons, or examples were copied.

| Source | Observed pattern | SkillsForge interpretation | Explicitly excluded | License note |
|---|---|---|---|---|
| https://agentskills.io/specification.md | Portable `SKILL.md` base format | Keep standard skill files as canonical unit | Spec prose / examples | Spec reference |
| https://code.claude.com/docs/en/plugins-reference | Plugin lifecycle, hooks, auto-discovery | Host adapter + verified `SessionStart` hook shape | Docs wording, example plugins | Proprietary docs; adapter only |
| https://github.com/obra/superpowers | Trigger discipline / workflow packs | Measurable capability packs + hard-negative routing cases | Skill content, prompts | MIT if code reused later; none reused |
| https://github.com/garrytan/gstack/blob/main/ARCHITECTURE.md | Evaluation / activation evidence | Local JSON eval reports | Browser daemon, virtual-team scope | Check repo license before reuse; none reused |
| https://aider.chat/docs/repomap.html | Graph-ranked repo context | Optional CodeGraph signal (P1); lexical router baseline first | Implementation | Docs reference |
| https://developers.openai.com/codex/plugins | Host format divergence | Compiler + lossiness accounting | Manifest schemas / text | Docs reference |
| https://cursor.com/docs/plugins | Host format divergence | Cursor export proof | Manifest schemas / text | Docs reference |
| https://opencode.ai/docs/plugins/ | Host format divergence | Declared-unsupported stub | Implementation | Docs reference |
| https://geminicli.com/docs/extensions/ | Extension/skill precedence ideas | Precedence documented as future work | Implementation | Docs reference |

Independent naming: `skillsforge.json`, `/skillsforge:*` commands, trust receipt fields, and all test fixtures were authored in this repository.
