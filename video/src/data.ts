export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_SECONDS = 142;
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
  | "buildweek"
  | "cta";

export type Scene = {
  id: SceneId;
  title: string;
  eyebrow: string;
  from: number;
  duration: number;
};

export const scenes: Scene[] = [
  { id: "open", title: "SkillsForge", eyebrow: "AI CLI development plugin", from: 0, duration: 10.03 },
  { id: "problem", title: "Vibe coding needs infrastructure", eyebrow: "The gap", from: 10.03, duration: 16.03 },
  { id: "architecture", title: "Skills + commands + workflows", eyebrow: "Architecture", from: 26.07, duration: 12.5 },
  { id: "commands", title: "Custom commands for daily dev work", eyebrow: "Operator surface", from: 38.57, duration: 11.03 },
  { id: "index", title: "Local HTML index for skill discovery", eyebrow: "Knowledge UI", from: 49.6, duration: 15.1 },
  { id: "routing", title: "Route the request, save the context", eyebrow: "Token efficiency", from: 64.7, duration: 17.47 },
  { id: "workflows", title: "Reusable development playbooks", eyebrow: "Workflow OS", from: 82.17, duration: 10.5 },
  { id: "ecosystem", title: "One plugin layer across AI CLIs", eyebrow: "Host strategy", from: 92.67, duration: 17.47 },
  { id: "buildweek", title: "Codex + GPT-5.6 accelerated the build", eyebrow: "Build Week execution", from: 110.13, duration: 17.13 },
  { id: "cta", title: "Clone. Run. Build faster.", eyebrow: "Call to action", from: 127.27, duration: 14.73 },
];

export const stats = [
  { label: "skills", value: 511 },
  { label: "workflows", value: 100 },
  { label: "commands", value: 140 },
  { label: "packs", value: 28 },
  { label: "profiles", value: 11 },
  { label: "agents", value: 98 },
];

export const vibeLines = [
  "$ skillsforge vibe",
  "SkillsForge vibe - magical moment",
  "Skills loaded: 511",
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
    value: "511 reusable capabilities grouped by engineering, product, design, ops, media, research, and launch work.",
  },
  {
    label: "Custom commands",
    value: "140 command shims turn common AI CLI work into short, memorable entrypoints instead of long prompts.",
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
  { at: 10.03, file: "sfx-whoosh.wav", volume: 0.26 },
  { at: 26.07, file: "sfx-scan.wav", volume: 0.26 },
  { at: 38.57, file: "sfx-hit.wav", volume: 0.34 },
  { at: 49.6, file: "sfx-scan.wav", volume: 0.3 },
  { at: 64.7, file: "sfx-pass.wav", volume: 0.36 },
  { at: 82.17, file: "sfx-hit.wav", volume: 0.38 },
  { at: 92.67, file: "sfx-pass.wav", volume: 0.36 },
  { at: 110.13, file: "sfx-scan.wav", volume: 0.34 },
  { at: 127.27, file: "sfx-hit.wav", volume: 0.42 },
];
