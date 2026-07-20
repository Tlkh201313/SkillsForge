import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  Arrow,
  LogoMark,
  Panel,
  Pill,
  SceneFrame,
  SceneTitle,
  StatCard,
  Terminal,
  VideoShell,
} from "./components";
import {
  collaboration,
  demoLines,
  hostLabels,
  routeSteps,
  scenes,
  sfxCues,
  stats,
  vibeLines,
} from "./data";
import { Captions } from "./Captions";
import { theme } from "./theme";
import { breathe, eased, mapProgress, seconds, stagger, useSceneMotion } from "./motion";

const SceneLayer: React.FC<{
  from: number;
  duration: number;
  children: React.ReactNode;
}> = ({ from, duration, children }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={seconds(fps, from)} durationInFrames={seconds(fps, duration)}>
      <SceneBody durationFrames={seconds(fps, duration)}>{children}</SceneBody>
    </Sequence>
  );
};

const SceneBody: React.FC<{ durationFrames: number; children: React.ReactNode }> = ({
  durationFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const motion = useSceneMotion(frame, durationFrames);
  return (
    <AbsoluteFill
      style={{
        opacity: motion.opacity,
        transform: `translateY(${motion.y}px) scale(${motion.scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export type SkillsForgeDemoProps = {
  showCaptions?: boolean;
  showAudio?: boolean;
};

export const SkillsForgeDemo: React.FC<SkillsForgeDemoProps> = ({
  showCaptions = true,
  showAudio = true,
}) => {
  const { fps } = useVideoConfig();
  return (
    <VideoShell>
      <SceneLayer from={scenes[0].from} duration={scenes[0].duration}>
        <OpenScene />
      </SceneLayer>
      <SceneLayer from={scenes[1].from} duration={scenes[1].duration}>
        <ProblemScene />
      </SceneLayer>
      <SceneLayer from={scenes[2].from} duration={scenes[2].duration}>
        <CollaborationScene />
      </SceneLayer>
      <SceneLayer from={scenes[3].from} duration={scenes[3].duration}>
        <VibeScene />
      </SceneLayer>
      <SceneLayer from={scenes[4].from} duration={scenes[4].duration}>
        <RouteScene />
      </SceneLayer>
      <SceneLayer from={scenes[5].from} duration={scenes[5].duration}>
        <DenyScene />
      </SceneLayer>
      <SceneLayer from={scenes[6].from} duration={scenes[6].duration}>
        <PackageScene />
      </SceneLayer>
      <SceneLayer from={scenes[7].from} duration={scenes[7].duration}>
        <ScoreScene />
      </SceneLayer>
      <SceneLayer from={scenes[8].from} duration={scenes[8].duration}>
        <CtaScene />
      </SceneLayer>
      {showCaptions ? <Captions /> : null}
      {showAudio ? <Audio src={staticFile("voiceover.mp3")} volume={1} /> : null}
      {showAudio ? <Audio src={staticFile("music.wav")} volume={0.15} /> : null}
      {showAudio
        ? sfxCues.map((cue) => (
            <Sequence key={`${cue.file}-${cue.at}`} from={seconds(fps, cue.at)}>
              <Audio src={staticFile(cue.file)} volume={cue.volume} />
            </Sequence>
          ))
        : null}
    </VideoShell>
  );
};

export const SkillsForgePoster: React.FC = () => (
  <VideoShell>
    <Sequence from={-72}>
      <OpenScene />
    </Sequence>
  </VideoShell>
);

const OpenScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneFrame
      footer={
        <div style={{ display: "flex", gap: 18, justifyContent: "center" }}>
          <Pill>free local test</Pill>
          <Pill tone="blue">no account needed</Pill>
          <Pill tone="green">under 2 minutes</Pill>
        </div>
      }
    >
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "0.95fr 1.05fr",
          alignItems: "center",
          gap: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 42 }}>
          <LogoMark scale={1.18} />
          <div>
            <SceneTitle eyebrow="Work OS for Agent Skills" title="SkillsForge" />
            <div
              style={{
                marginTop: 32,
                maxWidth: 760,
                color: theme.colors.textMuted,
                fontSize: 31,
                lineHeight: 1.35,
                fontWeight: 600,
              }}
            >
              Route the right skill, run the right workflow, and keep trust gates under the work.
            </div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 18,
            transform: `translateY(${breathe(frame, 8, 0.025)}px)`,
          }}
        >
          {stats.slice(0, 6).map((stat, index) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              index={index}
              accent={index % 2 === 0 ? theme.colors.mint : theme.colors.cyan}
            />
          ))}
        </div>
      </div>
    </SceneFrame>
  );
};

const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cards = [
    { label: "unknown author", tone: "amber" as const, x: 0, y: 16 },
    { label: "tool access?", tone: "red" as const, x: 30, y: 0 },
    { label: "random blob", tone: "blue" as const, x: 60, y: 20 },
    { label: "no receipt", tone: "red" as const, x: 14, y: 48 },
    { label: "context bloat", tone: "amber" as const, x: 50, y: 55 },
  ];
  return (
    <SceneFrame>
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 80, flex: 1 }}>
        <div style={{ paddingTop: 60 }}>
          <SceneTitle eyebrow="The problem" title="Skills become risky when they scale" />
          <div
            style={{
              marginTop: 34,
              color: theme.colors.textMuted,
              fontSize: 30,
              lineHeight: 1.42,
              maxWidth: 740,
              fontWeight: 600,
            }}
          >
            A big folder of powerful instructions is not a product. Judges need to see routing,
            validation, and evidence.
          </div>
        </div>
        <Panel style={{ position: "relative", minHeight: 700, overflow: "hidden", padding: 36 }}>
          <div
            style={{
              position: "absolute",
              inset: 52,
              border: `1px dashed ${theme.colors.borderStrong}`,
              borderRadius: 28,
              opacity: 0.72,
            }}
          />
          {cards.map((card, index) => {
            const local = stagger(frame, index, fps, 0.18);
            const enter = eased(local, [0, seconds(fps, 0.5)], [0, 1], theme.easing.pop);
            return (
              <div
                key={card.label}
                style={{
                  position: "absolute",
                  left: `${card.x}%`,
                  top: `${card.y}%`,
                  opacity: enter,
                  transform: `translateY(${mapProgress(enter, [0, 1], [42, 0])}px) rotate(${
                    breathe(frame + index * 20, 2.4, 0.025)
                  }deg)`,
                }}
              >
                <Pill tone={card.tone}>{card.label}</Pill>
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: 210,
              right: 210,
              bottom: 86,
              padding: "30px 34px",
              borderRadius: 24,
              background: `linear-gradient(135deg, ${theme.colors.red16}, ${theme.colors.black35})`,
              border: `1px solid ${theme.colors.red}`,
              color: theme.colors.text,
              fontSize: 32,
              fontWeight: 900,
              textAlign: "center",
              boxShadow: theme.shadow.panel,
            }}
          >
            Power without provenance is a launch risk.
          </div>
        </Panel>
      </div>
    </SceneFrame>
  );
};

const CollaborationScene: React.FC = () => {
  return (
    <SceneFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 46, flex: 1 }}>
        <SceneTitle eyebrow="AI collaboration" title="Codex + GPT-5.6 in the loop" align="center" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 26 }}>
          {collaboration.map((item, index) => (
            <Panel key={item.label} delay={0.16 + index * 0.14} style={{ minHeight: 430, padding: 36 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 34,
                }}
              >
                <Pill tone={index === 0 ? "amber" : index === 1 ? "mint" : "blue"}>{item.label}</Pill>
                <div
                  style={{
                    color: theme.colors.textDim,
                    fontSize: 56,
                    fontWeight: 900,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  0{index + 1}
                </div>
              </div>
              <div
                style={{
                  color: theme.colors.text,
                  fontSize: 38,
                  lineHeight: 1.18,
                  fontWeight: 850,
                }}
              >
                {item.value}
              </div>
            </Panel>
          ))}
        </div>
        <Panel delay={0.72} style={{ padding: "28px 34px", display: "flex", justifyContent: "center" }}>
          <div style={{ color: theme.colors.textMuted, fontSize: 28, fontWeight: 700 }}>
            Human calls stay human: what to build, what not to claim, and what evidence is strong enough.
          </div>
        </Panel>
      </div>
    </SceneFrame>
  );
};

const VibeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const activeLine = Math.min(5, Math.floor(frame / 34));
  return (
    <SceneFrame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 56, flex: 1 }}>
        <div>
          <SceneTitle eyebrow="Local proof" title="One command loads the catalog" />
          <div style={{ marginTop: 42 }}>
            <Terminal lines={vibeLines} activeLine={activeLine} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18, alignContent: "center" }}>
          {stats.slice(0, 3).map((stat, index) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              index={index}
              accent={index === 0 ? theme.colors.mint : theme.colors.cyan}
            />
          ))}
        </div>
      </div>
    </SceneFrame>
  );
};

const RouteScene: React.FC = () => {
  return (
    <SceneFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 42, flex: 1 }}>
        <SceneTitle eyebrow="Productivity layer" title="Route the request, not the whole catalog" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 1fr", gap: 26, alignItems: "center" }}>
          <Panel style={{ padding: 34, minHeight: 440 }}>
            <Pill tone="blue">operator asks</Pill>
            <div
              style={{
                marginTop: 34,
                color: theme.colors.text,
                fontSize: 50,
                lineHeight: 1.08,
                fontWeight: 900,
              }}
            >
              audit README claims before submission
            </div>
          </Panel>
          <Arrow delay={0.55} width={170} />
          <Panel delay={0.3} style={{ padding: 34, minHeight: 440 }}>
            <Pill>SkillsForge routes</Pill>
            <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 18 }}>
              {routeSteps.map((step, index) => (
                <RouteRow key={step} index={index} step={step} />
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </SceneFrame>
  );
};

const RouteRow: React.FC<{ step: string; index: number }> = ({ step, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = eased(stagger(frame, index, fps, 0.14), [0, seconds(fps, 0.42)], [0, 1]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: enter,
        transform: `translateX(${mapProgress(enter, [0, 1], [-24, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          background: theme.colors.mint10,
          border: `1px solid ${theme.colors.borderStrong}`,
          color: theme.colors.mint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 900,
        }}
      >
        {index + 1}
      </div>
      <div style={{ color: theme.colors.text, fontSize: 26, fontWeight: 750 }}>{step}</div>
    </div>
  );
};

const DenyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lock = eased(frame, [seconds(fps, 1.5), seconds(fps, 2.3)], [0, 1], theme.easing.pop);
  return (
    <SceneFrame>
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 64, flex: 1 }}>
        <div style={{ paddingTop: 54 }}>
          <SceneTitle eyebrow="Trust gate" title="Unsafe behavior denied before execution" />
          <div
            style={{
              marginTop: 34,
              color: theme.colors.textMuted,
              fontSize: 31,
              lineHeight: 1.35,
              fontWeight: 650,
            }}
          >
            This is a host guardrail and policy gate. It is not claimed as an OS sandbox.
          </div>
        </div>
        <Panel style={{ padding: 42, position: "relative", overflow: "hidden" }}>
          <Terminal
            delay={0.1}
            lines={[
              "$ skillsforge validate examples/codex-unsafe-release",
              "undeclared exec capability",
              "network host not declared",
              "policy scan blocked packaging",
              "result: DENY",
            ]}
            activeLine={4}
          />
          <div
            style={{
              position: "absolute",
              right: 70,
              bottom: 70,
              width: 230,
              height: 230,
              borderRadius: 36,
              background: `linear-gradient(145deg, ${theme.colors.red16}, ${theme.colors.black55})`,
              border: `2px solid ${theme.colors.red}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.colors.red,
              fontSize: 52,
              fontWeight: 950,
              transform: `scale(${0.72 + lock * 0.28}) rotate(${mapProgress(lock, [0, 1], [-8, 0])}deg)`,
              opacity: lock,
              boxShadow: theme.shadow.panel,
            }}
          >
            DENY
          </div>
        </Panel>
      </div>
    </SceneFrame>
  );
};

const PackageScene: React.FC = () => {
  return (
    <SceneFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 42, flex: 1 }}>
        <SceneTitle eyebrow="Host delivery" title="Safe skills package into real agent surfaces" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 170px 1fr", gap: 28, alignItems: "center" }}>
          <Panel style={{ minHeight: 456, padding: 36 }}>
            <Pill tone="green">safe example</Pill>
            <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 18 }}>
              {["sidecar present", "least privilege", "validate PASS", "package PASS"].map((item, index) => (
                <RouteRow key={item} index={index} step={item} />
              ))}
            </div>
          </Panel>
          <Arrow delay={0.55} width={160} />
          <Panel delay={0.28} style={{ minHeight: 456, padding: 36 }}>
            <Pill>Codex plugin/package</Pill>
            <div
              style={{
                marginTop: 30,
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 15,
              }}
            >
              {hostLabels.map((host, index) => (
                <HostChip key={host} host={host} index={index} />
              ))}
            </div>
            <div style={{ marginTop: 26, color: theme.colors.textMuted, fontSize: 23, lineHeight: 1.36 }}>
              Native policy where supported. Package fidelity elsewhere.
            </div>
          </Panel>
        </div>
      </div>
    </SceneFrame>
  );
};

const HostChip: React.FC<{ host: string; index: number }> = ({ host, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = eased(stagger(frame, index, fps, 0.09), [0, seconds(fps, 0.45)], [0, 1]);
  return (
    <div
      style={{
        padding: "18px 20px",
        borderRadius: 16,
        border: `1px solid ${theme.colors.border}`,
        background: index === 0 ? theme.colors.green16 : theme.colors.white06,
        color: index === 0 ? theme.colors.green : theme.colors.text,
        fontSize: 25,
        fontWeight: 850,
        opacity: enter,
        transform: `translateY(${mapProgress(enter, [0, 1], [22, 0])}px)`,
      }}
    >
      {host}
    </div>
  );
};

const ScoreScene: React.FC = () => {
  return (
    <SceneFrame>
      <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 58, flex: 1 }}>
        <div style={{ paddingTop: 54 }}>
          <SceneTitle eyebrow="Scoreboard" title="Evidence judges can rerun" />
          <div style={{ marginTop: 38 }}>
            <Pill tone="green">false-allow 0</Pill>
          </div>
        </div>
        <Terminal lines={demoLines} activeLine={5} />
      </div>
    </SceneFrame>
  );
};

const CtaScene: React.FC = () => {
  const command = "node plugins/skillsforge/bin/skillsforge.mjs demo";
  return (
    <SceneFrame
      footer={
        <div style={{ display: "flex", justifyContent: "center", gap: 18 }}>
          <Pill>MIT</Pill>
          <Pill tone="green">free</Pill>
          <Pill tone="blue">no account</Pill>
          <Pill tone="amber">YouTube ready</Pill>
        </div>
      }
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <LogoMark scale={0.88} />
        <div style={{ marginTop: 34, width: "100%" }}>
          <SceneTitle eyebrow="Call to action" title="Clone. Run. Judge locally." align="center" />
        </div>
        <Panel delay={0.5} style={{ marginTop: 44, padding: "28px 42px", minWidth: 1120 }}>
          <div style={{ color: theme.colors.textMuted, fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
            exact test command
          </div>
          <div
            style={{
              color: theme.colors.mint,
              fontFamily: theme.mono,
              fontSize: 34,
              fontWeight: 850,
              whiteSpace: "nowrap",
            }}
          >
            {command}
          </div>
        </Panel>
      </div>
    </SceneFrame>
  );
};
