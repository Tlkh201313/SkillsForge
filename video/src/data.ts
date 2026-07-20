export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_SECONDS = 118;
export const DURATION_FRAMES = FPS * DURATION_SECONDS;

export type SceneId =
  | "open"
  | "problem"
  | "ai"
  | "vibe"
  | "route"
  | "deny"
  | "package"
  | "score"
  | "cta";

export type Scene = {
  id: SceneId;
  title: string;
  eyebrow: string;
  from: number;
  duration: number;
};

export const scenes: Scene[] = [
  { id: "open", title: "SkillsForge", eyebrow: "Work OS for Agent Skills", from: 0, duration: 15 },
  { id: "problem", title: "Power needs provenance", eyebrow: "The problem", from: 15, duration: 11 },
  { id: "ai", title: "Built with Codex + GPT-5.6", eyebrow: "AI collaboration", from: 26, duration: 25 },
  { id: "vibe", title: "One command. Real catalog.", eyebrow: "Local proof", from: 51, duration: 9.5 },
  { id: "route", title: "Route the work", eyebrow: "Productivity layer", from: 60.5, duration: 8.8 },
  { id: "deny", title: "Deny unsafe actions", eyebrow: "Trust gate", from: 69.3, duration: 5.4 },
  { id: "package", title: "Package safe skills", eyebrow: "Host delivery", from: 74.7, duration: 5.5 },
  { id: "score", title: "Judge demo evidence", eyebrow: "Scoreboard", from: 80.2, duration: 10.3 },
  { id: "cta", title: "Free to test locally", eyebrow: "Call to action", from: 90.5, duration: 27.5 },
];

export const stats = [
  { label: "skills", value: 499 },
  { label: "packs", value: 28 },
  { label: "profiles", value: 11 },
  { label: "workflows", value: 100 },
  { label: "agents", value: 98 },
  { label: "command shims", value: 135 },
];

export const vibeLines = [
  "$ node plugins/skillsforge/bin/skillsforge.mjs vibe",
  "SkillsForge vibe - magical moment",
  "Skills loaded: 499",
  "Catalog: 499 skills across 28 packs (11 profiles)",
  "Work artifacts: docs/work/ (already present)",
  "Sample quality avg (first 5 skills): 100/100",
];

export const demoLines = [
  "$ node plugins/skillsforge/bin/skillsforge.mjs demo",
  "SkillsForge trust scoreboard",
  "unsafe deny      PASS",
  "safe validate    PASS",
  "packaged         PASS",
  "false-allow      0",
  "receipt hash     0344639d08d3c7f0...",
  "elapsed          212ms",
];

export const collaboration = [
  {
    label: "Human",
    value: "Product decisions, claim boundaries, final submission judgment",
  },
  {
    label: "Codex",
    value: "Repo navigation, implementation, rendering, verification passes",
  },
  {
    label: "GPT-5.6",
    value: "Reasoning, edge-case review, quality critique",
  },
];

export const routeSteps = [
  "User asks: audit README claims",
  "SkillsForge routes to validation + docs skill",
  "Workflow dry-runs the review path",
  "Workbench leaves artifacts in docs/work/",
];

export const hostLabels = ["Codex", "Claude Code", "Cursor", "OpenCode", "Gemini", "Custom CLI"];

export const sfxCues = [
  { at: 0.15, file: "sfx-hit.wav", volume: 0.52 },
  { at: 14.8, file: "sfx-whoosh.wav", volume: 0.26 },
  { at: 26.1, file: "sfx-scan.wav", volume: 0.26 },
  { at: 51.1, file: "sfx-hit.wav", volume: 0.34 },
  { at: 60.7, file: "sfx-scan.wav", volume: 0.3 },
  { at: 69.5, file: "sfx-deny.wav", volume: 0.48 },
  { at: 74.9, file: "sfx-pass.wav", volume: 0.44 },
  { at: 80.4, file: "sfx-pass.wav", volume: 0.5 },
  { at: 90.7, file: "sfx-hit.wav", volume: 0.42 },
];
