import React from 'react';
import { SceneShell, Terminal } from './shared';

export const UnsafeDenyScene: React.FC = () => {
  return (
    <SceneShell eyebrow="01 · Unsafe denied">
      <div style={{ fontSize: 56, fontWeight: 700, maxWidth: 1400, lineHeight: 1.2 }}>
        A “release helper” skill can hide undeclared shell + network.
      </div>
      <Terminal
        lines={[
          { text: '$ npx skillsforge validate examples/codex-unsafe-release', tone: 'cmd' },
          { text: 'FAIL  undeclared-exec', tone: 'fail' },
          { text: 'FAIL  undeclared-network', tone: 'fail' },
          { text: 'exit 1 — rejected without executing the skill', tone: 'muted' }
        ]}
      />
    </SceneShell>
  );
};
