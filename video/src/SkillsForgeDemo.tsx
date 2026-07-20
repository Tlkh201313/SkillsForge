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
  architecture,
  demoLines,
  hostLabels,
  indexFeatures,
  routeSteps,
  scenes,
  sfxCues,
  stats,
  vibeLines,
  workflowSteps,
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
        <ArchitectureScene />
      </SceneLayer>
      <SceneLayer from={scenes[3].from} duration={scenes[3].duration}>
        <CommandsScene />
      </SceneLayer>
      <SceneLayer from={scenes[4].from} duration={scenes[4].duration}>
        <IndexScene />
      </SceneLayer>
      <SceneLayer from={scenes[5].from} duration={scenes[5].duration}>
        <RouteScene />
      </SceneLayer>
      <SceneLayer from={scenes[6].from} duration={scenes[6].duration}>
        <WorkflowScene />
      </SceneLayer>
      <SceneLayer from={scenes[7].from} duration={scenes[7].duration}>
        <EcosystemScene />
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
          <Pill>development tools hackathon</Pill>
          <Pill tone="blue">workflow OS</Pill>
          <Pill tone="green">token efficient</Pill>
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
            <SceneTitle eyebrow="AI CLI development plugin" title="SkillsForge" />
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
              Turn vibe coding into a structured development system: skills, custom commands,
              workflow playbooks, routing, local indexes, and token-aware operator tools.
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
    { label: "prompt sprawl", tone: "amber" as const, x: 0, y: 16 },
    { label: "one-off scripts", tone: "blue" as const, x: 30, y: 0 },
    { label: "no routing", tone: "red" as const, x: 60, y: 20 },
    { label: "lost workflow", tone: "amber" as const, x: 14, y: 48 },
    { label: "context bloat", tone: "red" as const, x: 50, y: 55 },
  ];
  return (
    <SceneFrame>
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 80, flex: 1 }}>
        <div style={{ paddingTop: 60 }}>
          <SceneTitle eyebrow="The gap" title="Vibe coding needs infrastructure" />
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
            A pile of prompts is not enough. Developers need a plugin layer that can discover,
            route, compress, run, and reuse work across real AI CLI sessions.
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
            The goal is a development OS, not another prompt folder.
          </div>
        </Panel>
      </div>
    </SceneFrame>
  );
};

const ArchitectureScene: React.FC = () => {
  return (
    <SceneFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 46, flex: 1 }}>
        <SceneTitle eyebrow="Architecture" title="Skills + commands + workflows" align="center" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 26 }}>
          {architecture.map((item, index) => (
            <Panel key={item.label} delay={0.16 + index * 0.14} style={{ minHeight: 430, padding: 36 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 34,
                }}
              >
                <Pill tone={index === 0 ? "mint" : index === 1 ? "blue" : "amber"}>{item.label}</Pill>
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
            SkillsForge is the routing and operator layer around AI CLIs: reusable skills,
            structured commands, dry-run workflows, and local proof.
          </div>
        </Panel>
      </div>
    </SceneFrame>
  );
};

const CommandsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const activeLine = Math.min(6, Math.floor(frame / 30));
  return (
    <SceneFrame>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 56, flex: 1 }}>
        <div>
          <SceneTitle eyebrow="Operator surface" title="Custom commands make it usable" />
          <div style={{ marginTop: 42 }}>
            <Terminal lines={vibeLines} activeLine={activeLine} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18, alignContent: "center" }}>
          {stats.slice(0, 4).map((stat, index) => (
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
        <SceneTitle eyebrow="Token efficiency" title="Route the request, save the context" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 1fr", gap: 26, alignItems: "center" }}>
          <Panel style={{ padding: 34, minHeight: 440 }}>
            <Pill tone="blue">developer asks</Pill>
            <div
              style={{
                marginTop: 34,
                color: theme.colors.text,
                fontSize: 46,
                lineHeight: 1.08,
                fontWeight: 900,
              }}
            >
              ship a feature, update docs, run tests, keep context small
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

const IndexScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scan = eased(frame, [seconds(fps, 1.0), seconds(fps, 2.4)], [0, 1], theme.easing.enter);
  return (
    <SceneFrame>
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 64, flex: 1 }}>
        <div style={{ paddingTop: 54 }}>
          <SceneTitle eyebrow="Knowledge UI" title="Local HTML index for skill discovery" />
          <div
            style={{
              marginTop: 34,
              color: theme.colors.textMuted,
              fontSize: 31,
              lineHeight: 1.35,
              fontWeight: 650,
            }}
          >
            SkillsForge is not just a CLI. It builds a local library view so developers and
            agents can search skills, see source details, and understand what to use next.
          </div>
        </div>
        <Panel style={{ padding: 42, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              height: 54,
              borderRadius: 16,
              background: theme.colors.black35,
              border: `1px solid ${theme.colors.white16}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 18px",
              color: theme.colors.textMuted,
              fontFamily: theme.mono,
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            <span style={{ color: theme.colors.red }}>●</span>
            <span style={{ color: theme.colors.amber }}>●</span>
            <span style={{ color: theme.colors.green }}>●</span>
            <span style={{ marginLeft: 18 }}>artifacts/skillsforge-library/skillsforge-library.html</span>
          </div>
          <div
            style={{
              position: "absolute",
              left: 42,
              right: 42,
              top: 126,
              height: 88,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${theme.colors.mint10}, ${theme.colors.white06})`,
              border: `1px solid ${theme.colors.borderStrong}`,
              padding: "0 28px",
              display: "flex",
              alignItems: "center",
              color: theme.colors.text,
              fontSize: 31,
              fontWeight: 900,
            }}
          >
            Search: “build a plugin release workflow”
          </div>
          <div style={{ marginTop: 142, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {indexFeatures.map((item, index) => {
              const enter = eased(stagger(frame, index, fps, 0.13), [0, seconds(fps, 0.44)], [0, 1]);
              return (
                <div
                  key={item}
                  style={{
                    minHeight: 122,
                    borderRadius: 18,
                    border: `1px solid ${theme.colors.border}`,
                    background: theme.colors.white06,
                    padding: 22,
                    color: theme.colors.text,
                    fontSize: 25,
                    lineHeight: 1.18,
                    fontWeight: 850,
                    opacity: enter,
                    transform: `translateY(${mapProgress(enter, [0, 1], [26, 0])}px)`,
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>
          <div
            style={{
              position: "absolute",
              left: 42,
              right: 42,
              bottom: 54,
              height: 5,
              borderRadius: 999,
              background: theme.colors.white10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${mapProgress(scan, [0, 1], [10, 100])}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${theme.colors.mint}, ${theme.colors.cyan})`,
                boxShadow: theme.shadow.glow,
              }}
            />
          </div>
        </Panel>
      </div>
    </SceneFrame>
  );
};

const WorkflowScene: React.FC = () => {
  return (
    <SceneFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 42, flex: 1 }}>
        <SceneTitle eyebrow="Workflow OS" title="Reusable development playbooks" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 170px 1fr", gap: 28, alignItems: "center" }}>
          <Panel style={{ minHeight: 456, padding: 36 }}>
            <Pill tone="green">from vague task</Pill>
            <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 18 }}>
              {workflowSteps.map((item, index) => (
                <RouteRow key={item} index={index} step={item} />
              ))}
            </div>
          </Panel>
          <Arrow delay={0.55} width={160} />
          <Panel delay={0.28} style={{ minHeight: 456, padding: 36 }}>
            <Pill>to repeatable dev system</Pill>
            <div
              style={{
                marginTop: 30,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <Terminal
                delay={0.05}
                lines={[
                  "$ skillsforge workflows recommend --query \"release\"",
                  "recommended: release-diff-review",
                  "skills: review-diff, ship-release, verify-before-done",
                  "agents: release-manager, quality-gate",
                  "mode: dry-run first",
                ]}
                activeLine={4}
              />
            </div>
            <div style={{ marginTop: 22, color: theme.colors.textMuted, fontSize: 23, lineHeight: 1.36 }}>
              The playbook is the product: repeatable steps, named roles, clear stop gates.
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

const EcosystemScene: React.FC = () => {
  return (
    <SceneFrame>
      <div style={{ display: "grid", gridTemplateColumns: "0.86fr 1.14fr", gap: 58, flex: 1 }}>
        <div style={{ paddingTop: 54 }}>
          <SceneTitle eyebrow="Host strategy" title="One plugin layer across AI CLIs" />
          <div
            style={{
              marginTop: 34,
              color: theme.colors.textMuted,
              fontSize: 30,
              lineHeight: 1.38,
              fontWeight: 650,
            }}
          >
            The ambition is bigger than a single assistant: a portable development tool layer
            for Codex, Claude Code, Cursor, OpenCode, Gemini, and custom local CLIs.
          </div>
          <div style={{ marginTop: 38 }}>
            <Pill tone="green">development plugin</Pill>
          </div>
        </div>
        <Panel style={{ minHeight: 560, padding: 36 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 15,
            }}
          >
            {hostLabels.map((host, index) => (
              <HostChip key={host} host={host} index={index} />
            ))}
          </div>
          <div style={{ marginTop: 34 }}>
            <Terminal lines={demoLines} activeLine={6} />
          </div>
        </Panel>
      </div>
    </SceneFrame>
  );
};

const CtaScene: React.FC = () => {
  const command = "node plugins/skillsforge/bin/skillsforge.mjs vibe";
  return (
    <SceneFrame
      footer={
        <div style={{ display: "flex", justifyContent: "center", gap: 18 }}>
          <Pill>MIT</Pill>
          <Pill tone="green">free</Pill>
          <Pill tone="blue">no account</Pill>
          <Pill tone="amber">dev tools hackathon</Pill>
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
          <SceneTitle eyebrow="Call to action" title="Clone. Run. Build faster." align="center" />
        </div>
        <Panel delay={0.5} style={{ marginTop: 44, padding: "28px 42px", minWidth: 1120 }}>
          <div style={{ color: theme.colors.textMuted, fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
            first local command
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
