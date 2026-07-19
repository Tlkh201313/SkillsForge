# SkillsForge demo video

Judge-facing demo video for GitHub / Devpost (~90s). Mirrors:

`node plugins/skillsforge/bin/skillsforge.mjs demo`

(Not published to npm - do not use `npx skillsforge`.)

## Committed asset

The rendered MP4 lives at:

**`assets/video/skillsforge-demo.mp4`**

Poster still (when present): `assets/skillsforge-demo-poster.png`

No source renderer is included in this repo. Replace the committed MP4 directly if a new cut is produced elsewhere.

## Upload

1. Use the committed MP4 (or a locally re-rendered replacement under 3 minutes).
2. Upload to YouTube (unlisted/public).
3. Paste URL into Devpost + `docs/submission.md`.
4. Optional: attach `skillsforge-demo.mp4` / poster as GitHub release assets; paste `user-attachments` URL into README.

## Beats (~90s)

| Time | Scene |
|------|--------|
| 0:00 | Thesis: Work OS for productive Agent Skills |
| 0:12 | Scale + operator surfaces (lib / workflows / auto) |
| 0:28 | Unsafe validate deny |
| 0:44 | Safe validate + package |
| 1:00 | Demo scoreboard / package-tree hash |
| 1:16 | CTA: clone + `node plugins/skillsforge/bin/skillsforge.mjs demo` |

Do not invent Session IDs in the video. Keep claim boundaries (hooks != sandbox; receipts unsigned; demo scoreboard != full trust receipt).
