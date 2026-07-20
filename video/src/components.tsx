import React, { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";
import { breathe, eased, mapProgress, seconds, stagger } from "./motion";

const noiseLayer =
  "radial-gradient(circle at 18% 24%, rgba(255,255,255,0.09) 0 1px, transparent 1px 100%), radial-gradient(circle at 82% 64%, rgba(255,255,255,0.06) 0 1px, transparent 1px 100%)";

export const VideoShell: React.FC<{ children: ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const drift = breathe(frame, 10, 0.012);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.ink,
        fontFamily: theme.font,
        color: theme.colors.text,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill style={{ opacity: 0.95 }}>
        <div
          style={{
            position: "absolute",
            inset: -120,
            background:
              `linear-gradient(120deg, ${theme.colors.ink}, ${theme.colors.graphite} 42%, ${theme.colors.panel2}),` +
              `radial-gradient(circle at ${20 + drift * 0.05}% 18%, ${theme.colors.mint18}, transparent 34%),` +
              `radial-gradient(circle at ${82 - drift * 0.05}% 78%, ${theme.colors.blue18}, transparent 36%)`,
            transform: `translate3d(${drift}px, ${drift * 0.35}px, 0) scale(1.03)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              `linear-gradient(${theme.colors.white06} 1px, transparent 1px),` +
              `linear-gradient(90deg, ${theme.colors.white06} 1px, transparent 1px)`,
            backgroundSize: "96px 96px",
            maskImage: "linear-gradient(to bottom, transparent, black 12%, black 78%, transparent)",
            opacity: 0.32,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              `linear-gradient(110deg, transparent 0 26%, ${theme.colors.cyan14} 26.5% 27%, transparent 27.5% 100%),` +
              `linear-gradient(70deg, transparent 0 61%, ${theme.colors.violet18} 61.2% 61.7%, transparent 62% 100%)`,
            transform: `translateX(${breathe(frame, 24, 0.01)}px)`,
            opacity: 0.8,
          }}
        />
      </AbsoluteFill>
      {children}
      <GradeAndTexture />
    </AbsoluteFill>
  );
};

export const GradeAndTexture: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            `linear-gradient(180deg, transparent 0%, ${theme.colors.black35} 100%),` +
            `radial-gradient(circle at 50% 50%, transparent 0 48%, ${theme.colors.black55} 100%)`,
          mixBlendMode: "multiply",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: noiseLayer,
          backgroundSize: "9px 9px, 13px 13px",
          opacity: 0.08 + Math.abs(Math.sin(frame * 0.45)) * 0.015,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

export const LogoMark: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame,
    fps,
    config: theme.spring.pop,
    durationInFrames: seconds(fps, 0.7),
  });

  const cells = [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [2, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ];

  return (
    <div
      style={{
        width: 118 * scale,
        height: 170 * scale,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(5, 1fr)",
        gap: 10 * scale,
        transform: `scale(${0.92 + pop * 0.08}) translateY(${breathe(frame, 3, 0.045)}px)`,
        filter: `drop-shadow(${theme.shadow.glow})`,
      }}
    >
      {cells.map(([x, y], index) => {
        const local = stagger(frame, index, fps, 0.035);
        const cellPop = spring({
          frame: local,
          fps,
          config: theme.spring.pop,
          durationInFrames: seconds(fps, 0.45),
        });
        return (
          <div
            key={`${x}-${y}`}
            style={{
              gridColumn: x + 1,
              gridRow: y + 1,
              borderRadius: 10 * scale,
              background:
                index % 3 === 0
                  ? `linear-gradient(135deg, ${theme.colors.mint}, ${theme.colors.cyan})`
                  : `linear-gradient(135deg, ${theme.colors.white}, ${theme.colors.mint})`,
              opacity: cellPop,
              transform: `scale(${0.72 + cellPop * 0.28})`,
              boxShadow: theme.shadow.glow,
            }}
          />
        );
      })}
    </div>
  );
};

export const SceneTitle: React.FC<{
  eyebrow: string;
  title: string;
  align?: "left" | "center";
}> = ({ eyebrow, title, align = "left" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const parts = title.split(" ");

  return (
    <div style={{ textAlign: align, width: "100%" }}>
      <div
        style={{
          color: theme.colors.mint,
          fontSize: 25,
          fontWeight: 800,
          letterSpacing: 0,
          textTransform: "uppercase",
          opacity: eased(frame, [0, seconds(fps, 0.45)], [0, 1]),
          transform: `translateY(${eased(frame, [0, seconds(fps, 0.45)], [16, 0])}px)`,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          marginTop: 20,
          fontSize: align === "center" ? 92 : 76,
          lineHeight: 0.96,
          fontWeight: 900,
          maxWidth: align === "center" ? "100%" : 880,
        }}
      >
        {parts.map((part, index) => {
          const local = stagger(frame, index, fps, 0.08);
          const enter = spring({
            frame: local,
            fps,
            config: theme.spring.panel,
            durationInFrames: seconds(fps, 0.62),
          });
          return (
            <span
              key={`${part}-${index}`}
              style={{
                display: "inline-block",
                marginRight: 18,
                opacity: enter,
                transform: `translateY(${mapProgress(enter, [0, 1], [46, 0])}px) scale(${mapProgress(
                  enter,
                  [0, 1],
                  [0.96, 1],
                )})`,
              }}
            >
              {part}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const Panel: React.FC<{
  children: ReactNode;
  style?: CSSProperties;
  delay?: number;
}> = ({ children, style, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - seconds(fps, delay);
  const enter = spring({
    frame: local,
    fps,
    config: theme.spring.panel,
    durationInFrames: seconds(fps, 0.75),
  });

  return (
    <div
      style={{
        border: `1px solid ${theme.colors.border}`,
        background:
          `linear-gradient(145deg, ${theme.colors.white10}, transparent 32%),` +
          `linear-gradient(180deg, ${theme.colors.panel2}, ${theme.colors.panel})`,
        borderRadius: 22,
        boxShadow: theme.shadow.panel,
        opacity: enter,
        transform: `translateY(${mapProgress(enter, [0, 1], [34, 0])}px) scale(${mapProgress(
          enter,
          [0, 1],
          [0.975, 1],
        )})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Pill: React.FC<{
  children: ReactNode;
  tone?: "mint" | "blue" | "red" | "green" | "amber";
}> = ({ children, tone = "mint" }) => {
  const toneColor =
    tone === "red"
      ? theme.colors.red
      : tone === "green"
        ? theme.colors.green
        : tone === "amber"
          ? theme.colors.amber
          : tone === "blue"
            ? theme.colors.cyan
            : theme.colors.mint;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 15px",
        borderRadius: 999,
        color: toneColor,
        border: `1px solid ${toneColor}`,
        background: theme.colors.black35,
        fontSize: 20,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: toneColor,
          boxShadow: `0 0 20px ${toneColor}`,
        }}
      />
      {children}
    </div>
  );
};

export const StatCard: React.FC<{
  label: string;
  value: number;
  index: number;
  accent?: string;
}> = ({ label, value, index, accent = theme.colors.mint }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = stagger(frame, index, fps, 0.1);
  const enter = spring({
    frame: local,
    fps,
    config: theme.spring.pop,
    durationInFrames: seconds(fps, 0.75),
  });
  const count = Math.round(enter * value);

  return (
    <Panel
      delay={index * 0.08}
      style={{
        padding: 28,
        minHeight: 144,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          color: theme.colors.textMuted,
          fontSize: 22,
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: accent,
          fontSize: 62,
          lineHeight: 1,
          fontWeight: 900,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </div>
    </Panel>
  );
};

export const Terminal: React.FC<{
  lines: string[];
  delay?: number;
  activeLine?: number;
}> = ({ lines, delay = 0, activeLine = -1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Panel style={{ padding: 0, overflow: "hidden" }} delay={delay}>
      <div
        style={{
          height: 58,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 22px",
          borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.black35,
        }}
      >
        {[theme.colors.red, theme.colors.amber, theme.colors.green].map((color) => (
          <span
            key={color}
            style={{
              width: 13,
              height: 13,
              borderRadius: 999,
              background: color,
            }}
          />
        ))}
        <span
          style={{
            marginLeft: 14,
            color: theme.colors.textMuted,
            fontSize: 18,
            fontFamily: theme.mono,
          }}
        >
          local terminal
        </span>
      </div>
      <div style={{ padding: "28px 34px 34px", fontFamily: theme.mono }}>
        {lines.map((line, index) => {
          const lineFrame = frame - seconds(fps, delay + 0.15 + index * 0.36);
          const enter = eased(lineFrame, [0, seconds(fps, 0.28)], [0, 1]);
          const chars = Math.round(enter * line.length);
          const isCommand = line.startsWith("$");
          const isPass = line.includes("PASS") || line.includes("100/100");
          const isActive = index === activeLine;
          return (
            <div
              key={`${line}-${index}`}
              style={{
                color: isCommand
                  ? theme.colors.cyan
                  : isPass
                    ? theme.colors.green
                    : isActive
                      ? theme.colors.mint
                      : theme.colors.text,
                fontSize: 26,
                lineHeight: 1.58,
                opacity: enter,
                transform: `translateX(${mapProgress(enter, [0, 1], [-24, 0])}px)`,
                whiteSpace: "pre",
              }}
            >
              {line.slice(0, chars)}
              {isActive && enter === 1 ? (
                <span style={{ color: theme.colors.mint }}>{Math.sin(frame * 0.45) > 0 ? "_" : " "}</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

export const Arrow: React.FC<{ delay?: number; width?: number }> = ({ delay = 0, width = 160 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - seconds(fps, delay);
  const enter = eased(local, [0, seconds(fps, 0.55)], [0, 1]);
  return (
    <div
      style={{
        width,
        height: 2,
        background: `linear-gradient(90deg, ${theme.colors.mint}, ${theme.colors.cyan})`,
        transform: `scaleX(${enter})`,
        transformOrigin: "left center",
        position: "relative",
        boxShadow: theme.shadow.glow,
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -7,
          top: -6,
          width: 14,
          height: 14,
          borderTop: `2px solid ${theme.colors.cyan}`,
          borderRight: `2px solid ${theme.colors.cyan}`,
          transform: "rotate(45deg)",
          opacity: enter,
        }}
      />
    </div>
  );
};

export const SceneFrame: React.FC<{
  children: ReactNode;
  footer?: ReactNode;
}> = ({ children, footer }) => {
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: "88px 110px 126px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
      {footer ? (
        <div
          style={{
            position: "absolute",
            left: 110,
            right: 110,
            bottom: 56,
          }}
        >
          {footer}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
