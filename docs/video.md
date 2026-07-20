# SkillsForge demo video

Judge-facing demo video for GitHub / Devpost (2:19). Focus:

SkillsForge as an AI CLI development plugin: skill packs, custom commands, local HTML indexing, routing, token-efficient operator tools, reusable workflows, and multi-host AI CLI strategy. Trust validation remains the safety layer, not the headline.

(Not published to npm - do not use `npx skillsforge`.)

## Committed asset

The rendered MP4 lives at:

**`assets/video/skillsforge-demo.mp4`**

Poster still (when present): `assets/skillsforge-demo-poster.png`

Browser preview: `docs/demo-video.html`

The Remotion source lives under `video/`. Generated audio/caption assets and `video/node_modules/` stay ignored. The generated MP4 and poster remain normal committed assets.

Regenerate from the repository root:

```sh
cd video
npm run audio
python scripts/synthesize_voice.py --text public/voiceover.txt --media public/voiceover.mp3 --srt public/voiceover.srt --voice en-US-JennyNeural --rate +18% --pitch +0Hz
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

## Beats (2:19)

| Time | Scene |
|------|--------|
| 0:00 | Thesis: AI CLI development plugin for vibe coders |
| 0:13 | Problem: prompt sprawl, one-off scripts, context bloat, no routing |
| 0:25 | Architecture: skill packs + custom commands + workflow OS |
| 0:42 | Operator surface: `skillsforge vibe` and compact custom commands |
| 0:58 | Local HTML index: searchable skill library and source details |
| 1:15 | Routing/token efficiency: pick 1-3 skills, use `map` and `slim` |
| 1:34 | Workflows: repeatable development playbooks and role handoffs |
| 1:52 | Host strategy: Codex, Claude Code, Cursor, OpenCode, Gemini, custom CLIs |
| 2:08 | CTA: clone + `node plugins/skillsforge/bin/skillsforge.mjs vibe` |

Do not invent Session IDs in the video. Keep claim boundaries (hooks != sandbox; receipts unsigned; demo scoreboard != full trust receipt).
