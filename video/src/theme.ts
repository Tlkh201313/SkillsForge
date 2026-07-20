import { Easing, SpringConfig } from "remotion";

export const theme = {
  font:
    "Segoe UI Variable Display, Segoe UI, Arial, Helvetica, sans-serif",
  mono:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
  colors: {
    ink: "#05070b",
    graphite: "#0c1118",
    graphite2: "#111826",
    panel: "#121a24",
    panel2: "#172231",
    border: "rgba(219, 255, 246, 0.18)",
    borderStrong: "rgba(105, 255, 212, 0.55)",
    text: "#f5fbff",
    textMuted: "#aab8c8",
    textDim: "#718093",
    mint: "#69ffd4",
    cyan: "#64d8ff",
    blue: "#4b7dff",
    violet: "#a46dff",
    amber: "#ffd479",
    red: "#ff6b7c",
    green: "#63f29f",
    white: "#ffffff",
    black: "#000000",
    mint10: "rgba(105, 255, 212, 0.1)",
    mint18: "rgba(105, 255, 212, 0.18)",
    mint28: "rgba(105, 255, 212, 0.28)",
    cyan14: "rgba(100, 216, 255, 0.14)",
    blue18: "rgba(75, 125, 255, 0.18)",
    violet18: "rgba(164, 109, 255, 0.18)",
    red16: "rgba(255, 107, 124, 0.16)",
    green16: "rgba(99, 242, 159, 0.16)",
    white06: "rgba(255, 255, 255, 0.06)",
    white10: "rgba(255, 255, 255, 0.1)",
    white16: "rgba(255, 255, 255, 0.16)",
    black35: "rgba(0, 0, 0, 0.35)",
    black55: "rgba(0, 0, 0, 0.55)",
  },
  easing: {
    enter: Easing.bezier(0.16, 1, 0.3, 1),
    exit: Easing.bezier(0.7, 0, 0.84, 0),
    soft: Easing.bezier(0.45, 0, 0.55, 1),
    pop: Easing.bezier(0.34, 1.56, 0.64, 1),
  },
  spring: {
    panel: { damping: 18, stiffness: 95, mass: 0.85 } satisfies SpringConfig,
    pop: { damping: 13, stiffness: 140, mass: 0.7 } satisfies SpringConfig,
  },
  shadow: {
    panel: "0 36px 120px rgba(0, 0, 0, 0.45)",
    glow: "0 0 52px rgba(105, 255, 212, 0.28)",
    blue: "0 0 60px rgba(75, 125, 255, 0.22)",
  },
};

export type Theme = typeof theme;
