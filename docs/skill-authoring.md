# Skill authoring (TDD for skills)

**Iron law:** No discipline skill without a failing pressure fixture first.

1. Write `pressure/baseline.json` with expected baseline violations.
2. Scaffold with `skillsforge scaffold --name <id> --pack <pack>`.
3. Run `skillsforge pressure --skill <dir>`.
4. Run `skillsforge quality --skill <dir>`. Quality score is a lint gate, not proof of production depth.
5. CSO: description starts with `Use when...` and does not summarize workflow.

See Superpowers writing-skills for the methodology inspiration (original SkillsForge text only).
