export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_SECONDS = 139;
export const DURATION_FRAMES = FPS * DURATION_SECONDS;

export type SceneId =
  | "open"
  | "problem"
  | "architecture"
  | "commands"
  | "index"
  | "routing"
  | "workflows"
  | "ecosystem"
  | "cta";

export type Scene = {
  id: SceneId;
  title: string;
  eyebrow: string;
  from: number;
  duration: number;
};

export const scenes: Scene[] = [
  { id: "open", title: "SkillsForge", eyebrow: "AI CLI development plugin", from: 0, duration: 13 },
  { id: "problem", title: "Vibe coding needs infrastructure", eyebrow: "The gap", from: 13, duration: 12 },
  { id: "architecture", title: "Skills + commands + workflows", eyebrow: "Architecture", from: 25, duration: 17 },
  { id: "commands", title: "Custom commands for daily dev work", eyebrow: "Operator surface", from: 42, duration: 16 },
  { id: "index", title: "Local HTML index for skill discovery", eyebrow: "Knowledge UI", from: 58, duration: 17 },
  { id: "routing", title: "Route the request, save the context", eyebrow: "Token efficiency", from: 75, duration: 19 },
  { id: "workflows", title: "Reusable development playbooks", eyebrow: "Workflow OS", from: 94, duration: 18 },
  { id: "ecosystem", title: "One plugin layer across AI CLIs", eyebrow: "Host strategy", from: 112, duration: 16 },
  { id: "cta", title: "Clone. Run. Build faster.", eyebrow: "Call to action", from: 128, duration: 11 },
];

export const stats = [
  { label: "skills", value: 499 },
  { label: "workflows", value: 100 },
  { label: "commands", value: 135 },
  { label: "packs", value: 28 },
  { label: "profiles", value: 11 },
  { label: "agents", value: 98 },
];

export const vibeLines = [
  "$ skillsforge vibe",
  "SkillsForge vibe - magical moment",
  "Skills loaded: 499",
  "Catalog: 28 packs / 11 profiles",
  "Workflows: 100 reusable playbooks",
  "Work artifacts: docs/work/ ready",
  "Next: catalog, route, lib, workflows",
];

export const demoLines = [
  "$ sf digest --query \"ship this feature\"",
  "status + recommend + token cost",
  "$ sf map explore --query \"routing flow\"",
  "symbol path without dumping the repo",
  "$ sf slim test -- npm run check",
  "compressed failures, pass noise removed",
  "operator context stays small",
];

export const architecture = [
  {
    label: "Skill packs",
    value: "499 reusable capabilities grouped by engineering, product, design, ops, media, research, and launch work.",
  },
  {
    label: "Custom commands",
    value: "135 command shims turn common AI CLI work into short, memorable entrypoints instead of long prompts.",
  },
  {
    label: "Workflow OS",
    value: "100 dry-run playbooks connect skills, agents, commands, stop gates, artifacts, and proof.",
  },
];

export const routeSteps = [
  "User asks for a dev outcome",
  "Router picks the right 1-3 skills",
  "Workflow adds steps and stop gates",
  "Slim/map keep context under control",
];

export const workflowSteps = [
  "shape intent",
  "choose skill pack",
  "run command/workflow",
  "write artifacts",
  "verify locally",
];

export const indexFeatures = [
  "searchable local skill library",
  "HTML index for humans and agents",
  "source details by plugin/cache/root",
  "recommendations without cloud lock-in",
];

export const hostLabels = ["Codex", "Claude Code", "Cursor", "OpenCode", "Gemini", "Custom CLI"];

export const sfxCues = [
  { at: 0.15, file: "sfx-hit.wav", volume: 0.52 },
  { at: 13.0, file: "sfx-whoosh.wav", volume: 0.26 },
  { at: 25.1, file: "sfx-scan.wav", volume: 0.26 },
  { at: 42.1, file: "sfx-hit.wav", volume: 0.34 },
  { at: 58.1, file: "sfx-scan.wav", volume: 0.3 },
  { at: 75.1, file: "sfx-pass.wav", volume: 0.36 },
  { at: 94.1, file: "sfx-hit.wav", volume: 0.38 },
  { at: 112.1, file: "sfx-pass.wav", volume: 0.42 },
  { at: 128.1, file: "sfx-hit.wav", volume: 0.42 },
];
