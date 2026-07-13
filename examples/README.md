# Golden demo: safe-dependency-upgrade

Broken fixture that demonstrates SkillsForge catching:

1. **False routing trigger** — `audit dependencies` collides with security-audit intent.
2. **Undeclared exec** — ships `scripts/upgrade.sh` while `capabilities.exec` is `false`.

## 2:50 walkthrough

```bash
# 1. Show the policy failure without installing
node --input-type=module -e "import {scanSkill} from './policy/scan-skill.mjs'; import {loadSkill} from './core/skill-loader.mjs'; console.log(await scanSkill(await loadSkill('examples/safe-dependency-upgrade')));"

# 2. Route a security query against the real library (correct skill wins)
node scripts/route.mjs "security audit of skills"

# 3. Validate + evaluate + build the real library
npm run validate
npm run eval
npm run build

# 4. Inspect evidence
type dist\trust-receipt.json
type dist\cursor-lossiness.json
```

## Fix pattern (if promoting this fixture)

1. Remove `audit dependencies` from triggers; add it to `antiTriggers`.
2. Either delete `scripts/upgrade.sh` or set `capabilities.exec: true`.
3. Re-run `npm run validate` and the policy scan.
4. Only then copy into `skills/` after explicit approval.

## Demo evidence card

- Routing corpus: 80 cases (40 trigger / 40 hard negative)
- Policy must-block fixtures under `tests/fixtures/policy/`
- Deterministic build receipt hash under `dist/trust-receipt.json`
- Cursor field accounting under `dist/cursor-lossiness.json`
