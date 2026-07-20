import React, { useEffect, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "./theme";
import { eased, seconds } from "./motion";

type Caption = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [handle] = useState(() => delayRender("Load captions"));

  useEffect(() => {
    fetch(staticFile("captions.json"))
      .then((response) => response.json())
      .then((data: Caption[]) => {
        setCaptions(data);
        continueRender(handle);
      })
      .catch((error) => cancelRender(handle, error));
  }, [handle]);

  if (!captions) {
    return null;
  }

  const nowMs = (frame / fps) * 1000;
  const active = captions.find((caption) => nowMs >= caption.startMs && nowMs < caption.endMs);
  if (!active) {
    return null;
  }

  const local = frame - seconds(fps, active.startMs / 1000);
  const duration = seconds(fps, (active.endMs - active.startMs) / 1000);
  const enter = eased(local, [0, seconds(fps, 0.18)], [0, 1]);
  const exit = eased(local, [duration - seconds(fps, 0.18), duration], [0, 1], theme.easing.exit);
  const opacity = Math.max(0, enter - exit);
  const words = active.text.trim().split(/\s+/);
  const activeWord = Math.floor(
    interpolate(local, [0, Math.max(1, duration)], [0, words.length], {
      easing: theme.easing.soft,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 250,
        right: 250,
        bottom: 132,
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${(1 - opacity) * 16}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          padding: "18px 26px",
          borderRadius: 18,
          background: theme.colors.black55,
          border: `1px solid ${theme.colors.white16}`,
          boxShadow: theme.shadow.panel,
          color: theme.colors.text,
          fontSize: 31,
          lineHeight: 1.22,
          fontWeight: 800,
          textAlign: "center",
        }}
      >
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            style={{
              color: index === activeWord ? theme.colors.mint : theme.colors.text,
            }}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};
