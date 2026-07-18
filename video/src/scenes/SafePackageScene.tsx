import React from 'react';
import { SceneShell, Terminal } from './shared';

export const SafePackageScene: React.FC = () => {
  return (
    <SceneShell eyebrow="02 · Safe packaged">
      <div style={{ fontSize: 56, fontWeight: 700, maxWidth: 1400, lineHeight: 1.2 }}>
        Least-privilege sidecar → native Codex plugin with PreToolUse hooks.
      </div>
      <Terminal
        lines={[
          { text: '$ npx skillsforge validate examples/codex-safe-release', tone: 'cmd' },
          { text: 'PASS  structure + capability policy', tone: 'ok' },
          { text: '$ npx skillsforge package --host codex --skill … --write', tone: 'cmd' },
          { text: 'ok  .codex-plugin/ + hooks/ + policy copy', tone: 'ok' }
        ]}
      />
    </SceneShell>
  );
};
