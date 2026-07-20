# SkillsForge demo video

Judge-facing demo video for GitHub / Devpost (1:58). Mirrors:

`node plugins/skillsforge/bin/skillsforge.mjs demo`

(Not published to npm - do not use `npx skillsforge`.)

## Committed asset

The rendered MP4 lives at:

**`assets/video/skillsforge-demo.mp4`**

Poster still (when present): `assets/skillsforge-demo-poster.png`

Browser preview: `docs/demo-video.html`

The Remotion source lives under `video/`. The directory is ignored by default to keep `video/node_modules/` out of commits, so add source files with `git add -f video/<path>` when updating the video pipeline. The generated MP4 and poster remain normal committed assets.

Regenerate from the repository root:

```sh
cd video
npm run audio
python scripts/synthesize_voice.py --text public/voiceover.txt --media public/voiceover.mp3 --srt public/voiceover.srt --voice en-US-JennyNeural --rate +7% --pitch +0Hz
npm run captions
npm run still
npm run render
```

After rendering, normalize final audio to roughly -16 LUFS while copying the video stream:

```sh
ffmpeg -y -i ../assets/video/skillsforge-demo.mp4 -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k ../assets/video/skillsforge-demo.normalized.mp4
```

## README / gallery assets

Use these committed visuals in this order:

| Asset | Use |
|------|-----|
| `assets/skillsforge-banner.svg` | GitHub README hero |
| `assets/skillsforge-library-preview.png` | Product preview for local library / workflows / trust pipeline |
| `assets/skillsforge-demo-poster.png` | Visible fallback when GitHub does not play committed MP4 inline |
| `assets/skillsforge-universal-fanout.svg` | Host support and package-fidelity boundary |
| `assets/skillsforge-star-map.svg` | Current 499 / 28 / 11 / 100 / 98 / 135 / 15 inventory map |
| `assets/skillsforge-trust-pipeline.svg` | Safety layer explanation |

The generated preview image intentionally has no embedded text claims; keep exact counts in Markdown/SVG text only.

## Upload

1. Use the committed MP4 (or a locally re-rendered replacement under 3 minutes).
2. Upload to YouTube (unlisted/public).
3. Paste URL into Devpost + `docs/submission.md`.
4. Optional: attach `skillsforge-demo.mp4` / poster as GitHub release assets; paste `user-attachments` URL into README.

## Beats (1:58)

| Time | Scene |
|------|--------|
| 0:00 | Thesis: Work OS for productive Agent Skills |
| 0:15 | Problem: powerful skills need provenance |
| 0:26 | Codex + GPT-5.6 collaboration and human decision boundaries |
| 0:51 | Local `vibe`: 499 skills / 28 packs / 11 profiles |
| 1:00 | Route a request to the right skill/workflow surface |
| 1:09 | Unsafe example denied |
| 1:14 | Safe skill validates and packages for hosts |
| 1:20 | Demo scoreboard / package-tree hash |
| 1:30 | CTA: clone + `node plugins/skillsforge/bin/skillsforge.mjs demo` |

Do not invent Session IDs in the video. Keep claim boundaries (hooks != sandbox; receipts unsigned; demo scoreboard != full trust receipt).
