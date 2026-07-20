import { access, cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { verifySkillPaths } from './verify.mjs';
import { packageCodexPlugin } from './codex-package.mjs';
import { hashPackageTree } from './receipt.mjs';
import { loadSkill } from './skill-loader.mjs';

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Judge demo: unsafe deny -> safe package -> evidence receipt hash.
 * Deterministic, offline, target <90s.
 */
export async function runJudgeDemo(root, options = {}) {
  const repo = resolve(root);
  const started = Date.now();
  const steps = [];
  const unsafeSrc = join(repo, 'examples', 'codex-unsafe-release');
  const safeSrc = join(repo, 'examples', 'codex-safe-release');

  if (!(await pathExists(unsafeSrc)) || !(await pathExists(safeSrc))) {
    return {
      ok: false,
      error: 'missing examples/codex-unsafe-release or examples/codex-safe-release',
      elapsedMs: Date.now() - started,
      steps
    };
  }

  const work = await mkdtemp(join(tmpdir(), 'sf-judge-'));

  try {
    const unsafeDir = join(work, 'codex-unsafe-release');
    await cp(unsafeSrc, unsafeDir, { recursive: true });
    const unsafe = await verifySkillPaths([unsafeDir], {
      root: work,
      profile: 'claude-code'
    });
    const unsafeDenied = unsafe.ok === false;
    steps.push({
      id: 'unsafe-validate',
      ok: unsafeDenied,
      detail: unsafeDenied ? 'denied as expected' : 'unexpected pass'
    });
    if (!unsafeDenied) {
      const elapsedMs = Date.now() - started;
      return {
        ok: false,
        error: 'unsafe skill unexpectedly validated',
        elapsedMs,
        underBudget: elapsedMs < 90_000,
        falseAllow: 1,
        steps,
        scoreboard: formatScoreboard({
          unsafeDeny: false,
          safePass: false,
          packaged: false,
          falseAllow: 1,
          receiptHash: null,
          elapsedMs
        }, { color: options.color !== false })
      };
    }

    const safeDir = join(work, 'codex-safe-release');
    await cp(safeSrc, safeDir, { recursive: true });
    const safe = await verifySkillPaths([safeDir], {
      root: work,
      profile: 'claude-code'
    });
    steps.push({
      id: 'safe-validate',
      ok: safe.ok === true,
      detail: safe.ok ? 'pass' : 'safe skill failed validation'
    });
    if (!safe.ok) {
      return fail(steps, started, 'safe skill failed validation', options);
    }

    const outDir = join(work, 'packaged');
    const packaged = await packageCodexPlugin({
      skillDir: safeDir,
      outDir,
      write: true,
      force: true
    });
    const packageOk = packaged.ok === true;
    steps.push({
      id: 'safe-package',
      ok: packageOk,
      detail: packageOk ? outDir : (packaged.errors ?? []).join('; ')
    });
    if (!packageOk) {
      return fail(steps, started, (packaged.errors ?? ['package failed']).join('; '), options);
    }

    const tree = await hashPackageTree(outDir);
    const digest = tree.packageHash;
    const evidenceDir = join(repo, 'artifacts', 'demo-evidence');
    await mkdir(evidenceDir, { recursive: true });
    const evidencePath = join(evidenceDir, 'demo-scoreboard.json');
    let skillMeta = null;
    try {
      skillMeta = await loadSkill(safeDir);
    } catch {
      skillMeta = { name: 'codex-safe-release' };
    }
    await writeFile(evidencePath, `${JSON.stringify({
      schemaVersion: 1,
      kind: 'skillsforge-judge-demo-scoreboard',
      skill: skillMeta.name,
      packageTreeSha256: digest,
      packagedFileCount: tree.files.length,
      falseAllow: 0,
      note: 'Demo scoreboard artifact (package tree hash), not a buildReceipt/verifyReceipt trust receipt',
      ts: new Date().toISOString()
    }, null, 2)}\n`);

    steps.push({
      id: 'evidence-receipt',
      ok: true,
      detail: digest,
      path: evidencePath
    });

    const elapsedMs = Date.now() - started;
    const underBudget = elapsedMs < 90_000;
    const board = {
      unsafeDeny: true,
      safePass: true,
      packaged: true,
      falseAllow: 0,
      receiptHash: digest,
      elapsedMs
    };

    return {
      ok: underBudget,
      error: underBudget ? undefined : `demo exceeded 90s budget (${elapsedMs}ms)`,
      elapsedMs,
      underBudget,
      falseAllow: 0,
      receiptHash: digest,
      evidencePath,
      steps,
      urls: {
        unsafeExample: 'examples/codex-unsafe-release',
        safeExample: 'examples/codex-safe-release',
        evidence: 'artifacts/demo-evidence/demo-scoreboard.json',
        demoDoc: 'docs/hackathon-demo.md'
      },
      scoreboard: formatScoreboard(board, { color: options.color !== false })
    };
  } finally {
    if (!options.keepWork) {
      const { rm } = await import('node:fs/promises');
      await rm(work, { recursive: true, force: true });
    }
  }
}

function fail(steps, started, error, options = {}) {
  const elapsedMs = Date.now() - started;
  return {
    ok: false,
    error,
    elapsedMs,
    underBudget: elapsedMs < 90_000,
    falseAllow: 0,
    steps,
    scoreboard: formatScoreboard({
      unsafeDeny: steps.some((s) => s.id === 'unsafe-validate' && s.ok),
      safePass: steps.some((s) => s.id === 'safe-validate' && s.ok),
      packaged: steps.some((s) => s.id === 'safe-package' && s.ok),
      falseAllow: 0,
      receiptHash: null,
      elapsedMs
    }, { color: options.color !== false })
  };
}

export function formatScoreboard(board, options = {}) {
  const color = options.color !== false && process.stdout.isTTY;
  const g = (s) => (color ? `\x1b[32m${s}\x1b[0m` : s);
  const r = (s) => (color ? `\x1b[31m${s}\x1b[0m` : s);
  const b = (s) => (color ? `\x1b[1m${s}\x1b[0m` : s);
  const lines = [
    b('SkillsForge trust scoreboard'),
    `  unsafe deny:     ${board.unsafeDeny ? g('PASS') : r('FAIL')}`,
    `  safe validate:   ${board.safePass ? g('PASS') : r('FAIL')}`,
    `  packaged:        ${board.packaged ? g('PASS') : r('FAIL')}`,
    `  false-allow:     ${board.falseAllow === 0 ? g('0') : r(String(board.falseAllow))}`,
    `  receipt hash:    ${board.receiptHash ? `${board.receiptHash.slice(0, 16)}...` : 'n/a'}`,
    `  elapsed:         ${board.elapsedMs}ms`
  ];
  return lines.join('\n');
}

export function formatPackScorecard(card, options = {}) {
  const color = options.color !== false && process.stdout.isTTY;
  const b = (s) => (color ? `\x1b[1m${s}\x1b[0m` : s);
  const g = (s) => (color ? `\x1b[32m${s}\x1b[0m` : s);
  const lines = [
    b('SkillsForge pack scorecard'),
    `  catalog entries: ${card.skills}`,
    `  packs:           ${Object.keys(card.byPack ?? {}).length}`,
    ...Object.entries(card.byPack ?? {})
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12)
      .map(([pack, n]) => `    ${pack.padEnd(18)} ${g(String(n))}`),
    card.bench
      ? `  route p50/p95:   ${card.bench.route?.p50 ?? '?'} / ${card.bench.route?.p95 ?? '?'} ms`
      : '  bench:           (run skillsforge bench)'
  ];
  return lines.join('\n');
}

export async function compareSkillTrust(root, leftDir, rightDir) {
  const left = await loadSkill(leftDir, { root });
  const right = await loadSkill(rightDir, { root });
  const leftHas = Boolean(left.sidecar);
  const rightHas = Boolean(right.sidecar);

  let leftPolicy = null;
  let rightPolicy = null;
  try {
    leftPolicy = await verifySkillPaths([left.directory], { root, profile: 'claude-code' });
  } catch (error) {
    leftPolicy = { ok: false, error: error.message };
  }
  try {
    rightPolicy = await verifySkillPaths([right.directory], { root, profile: 'claude-code' });
  } catch (error) {
    rightPolicy = { ok: false, error: error.message };
  }

  return {
    left: {
      name: left.name,
      hasSidecar: leftHas,
      capabilities: left.sidecar?.capabilities ?? null,
      routing: left.sidecar?.routing ?? null,
      policyOk: leftPolicy?.ok ?? false,
      policyFindings: (leftPolicy?.findings ?? []).filter((f) => f.blocking).map((f) => f.rule)
    },
    right: {
      name: right.name,
      hasSidecar: rightHas,
      capabilities: right.sidecar?.capabilities ?? null,
      routing: right.sidecar?.routing ?? null,
      policyOk: rightPolicy?.ok ?? false,
      policyFindings: (rightPolicy?.findings ?? []).filter((f) => f.blocking).map((f) => f.rule)
    },
    delta: {
      sidecarAdvantage: leftHas !== rightHas
        ? (rightHas ? 'right has SkillsForge sidecar' : 'left has SkillsForge sidecar')
        : 'both same sidecar presence',
      policyDelta: (leftPolicy?.ok === true) !== (rightPolicy?.ok === true)
        ? `left.ok=${leftPolicy?.ok} right.ok=${rightPolicy?.ok}`
        : 'same policy outcome'
    }
  };
}
