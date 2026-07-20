import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "./theme";

export const seconds = (fps: number, value: number) => Math.round(fps * value);

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const eased = (
  frame: number,
  range: [number, number],
  values: [number, number],
  easing: (input: number) => number = theme.easing.enter,
) =>
  interpolate(frame, range, values, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const mapProgress = (
  value: number,
  range: [number, number],
  output: [number, number],
  easing: (input: number) => number = Easing.bezier(0.16, 1, 0.3, 1),
) =>
  interpolate(value, range, output, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const useSceneMotion = (frame: number, duration: number) => {
  const { fps } = useVideoConfig();
  const enterFrames = seconds(fps, 0.7);
  const exitFrames = seconds(fps, 0.36);
  const enter = spring({
    frame,
    fps,
    config: theme.spring.panel,
    durationInFrames: enterFrames,
  });
  const exit = eased(
    frame,
    [duration - exitFrames, duration],
    [0, 1],
    theme.easing.exit,
  );
  const visible = clamp(enter - exit, 0, 1);

  return {
    visible,
    opacity: visible,
    y: mapProgress(visible, [0, 1], [42, 0], theme.easing.enter),
    scale: mapProgress(visible, [0, 1], [0.975, 1], theme.easing.enter),
  };
};

export const breathe = (frame: number, amount = 1, speed = 0.035) =>
  Math.sin(frame * speed) * amount;

export const stagger = (frame: number, index: number, fps: number, delaySeconds = 0.12) =>
  frame - seconds(fps, index * delaySeconds);
