import { access, cp, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateWithSchema } from '../../scripts/schema-lib.mjs';
import { schemas } from '../../scripts/schemas.generated.mjs';
import { loadSkill } from './skill-loader.mjs';
import { verifySkillPaths } from './verify.mjs';
import { compileCodexHooks } from './codex-policy-compiler.mjs';

const MULTI_SKILL_MESSAGE = 'Codex packaging rejects multi-skill inputs; package one skill at a time with --skill <skill-dir>';

/**
 * Package one guarded skill as a native Codex plugin.
 * Dry-run by default; require write:true to mutate the filesystem.
 */
export async function packageCodexPlugin(options = {}) {
  const skillDir = resolve(options.skillDir ?? '');
  const outDir = resolve(options.outDir ?? '');
  const write = options.write === true;
  const dryRun = write ? false : options.dryRun !== false;
  const force = options.force === true;

  if (!options.skillDir || !options.outDir) {
    return {
      ok: false,
      host: 'codex',
      skill: '',
      outDir,
      dryRun,
      files: [],
      interop: emptyInterop(),
      errors: ['--skill and --out are required']
    };
  }

  const resolved = await resolveSingleSkillDir(skillDir);
  if (!resolved.ok) {
    return {
      ok: false,
      host: 'codex',
      skill: '',
      outDir,
      dryRun,
      files: [],
      interop: emptyInterop(),
      errors: resolved.errors
    };
  }

  const skillRoot = resolved.skillDir;
  let skill;
  try {
    skill = await loadSkill(skillRoot);
  } catch (error) {
    return fail(skillRoot, outDir, dryRun, [`failed to load skill: ${error.message}`]);
  }

  const validation = await verifySkillPaths([skillRoot], {
    root: dirname(skillRoot),
    all: false,
    allowEmpty: false,
    profile: 'claude-code',
    dependencies: false
  });
  if (!validation.ok) {
    return fail(skill.name, outDir, dryRun, [
      'validation or policy scan blocked packaging',
      ...validation.findings.filter((item) => item.blocking).map((item) => `${item.rule}: ${(item.evidence ?? []).join(', ')}`),
      validation.text.trim()
    ].filter(Boolean), validation.findings);
  }

  const planned = await planCodexPackage(skill);
  const receipt = {
    ok: true,
    host: 'codex',
    skill: skill.name,
    outDir,
    dryRun,
    force,
    files: planned.files.map((file) => ({ path: file.path, action: file.action })),
    interop: planned.interop,
    findings: validation.findings,
    notes: planned.notes,
    plugin: planned.plugin,
    errors: []
  };

  const schemaResult = await validateWithSchema(schemas['codex-package'], receipt);
  if (!schemaResult.valid) {
    return fail(skill.name, outDir, dryRun, schemaResult.errors.map((error) => `codex-package ${error}`));
  }

  if (dryRun) return receipt;

  const outputSafety = await validateCodexOutputDir(outDir, skillRoot);
  if (!outputSafety.ok) {
    return fail(skill.name, outDir, false, outputSafety.errors);
  }

  if (!force) {
    try {
      await access(outDir);
      const entries = await readdir(outDir);
      if (entries.length > 0) {
        return fail(skill.name, outDir, false, [`refusing to overwrite non-empty out dir without --force: ${outDir}`]);
      }
    } catch {
      // missing is fine
    }
  }

  const token = `${process.pid}-${Date.now()}`;
  const stagingRoot = `${outDir}.staging-${token}`;
  const backupRoot = `${outDir}.backup-${token}`;
  let backedUp = false;
  try {
    await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    await rm(backupRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    await mkdir(stagingRoot, { recursive: true });
    for (const file of planned.files) {
      const absolute = join(stagingRoot, file.path);
      await mkdir(dirname(absolute), { recursive: true });
      if (file.bytes != null) {
        await writeFile(absolute, file.bytes);
      } else if (file.from) {
        await cp(file.from, absolute, { recursive: false });
      } else {
        await writeFile(absolute, file.contents ?? '');
      }
    }
    await writeFile(
      join(stagingRoot, 'package-receipt.json'),
      `${JSON.stringify({ ...receipt, dryRun: false }, null, 2)}\n`
    );

    await mkdir(dirname(outDir), { recursive: true });
    if (await pathExists(outDir)) {
      await rename(outDir, backupRoot);
      backedUp = true;
    }
    await rename(stagingRoot, outDir);
    if (backedUp) {
      await rm(backupRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
      backedUp = false;
    }
  } catch (error) {
    const recovery = [];
    try {
      await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    } catch (cleanupError) {
      recovery.push(`staging cleanup failed: ${cleanupError.message}`);
    }
    if (backedUp) {
      try {
        await rm(outDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
      } catch (cleanupError) {
        recovery.push(`failed-out cleanup failed: ${cleanupError.message}`);
      }
      try {
        await rename(backupRoot, outDir);
        backedUp = false;
      } catch (restoreError) {
        recovery.push(`backup restore failed: ${restoreError.message}`);
      }
    }
    return fail(skill.name, outDir, false, [
      `package write failed: ${error.message}`,
      ...recovery
    ]);
  } finally {
    try {
      await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    } catch {
      // best-effort leftover cleanup
    }
    if (!backedUp) {
      try {
        await rm(backupRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
      } catch {
        // best-effort leftover cleanup
      }
    }
  }

  return {
    ...receipt,
    dryRun: false,
    files: [
      ...receipt.files,
      { path: 'package-receipt.json', action: 'write' }
    ]
  };
}

async function validateCodexOutputDir(outDir, skillRoot) {
  const candidate = await resolveRealCandidate(outDir);
  const repoRoot = await resolveRealCandidate(await findPackageSourceRoot());
  const sourceRoot = await resolveRealCandidate(skillRoot);
  const homeRoot = await resolveRealCandidate(homedir());

  if (isFilesystemRoot(candidate)) {
    return { ok: false, errors: [`protected output directory rejected: filesystem root ${candidate}`] };
  }
  if (samePath(candidate, homeRoot) || isInsidePath(candidate, homeRoot)) {
    return { ok: false, errors: [`protected output directory rejected: home directory or ancestor ${outDir}`] };
  }
  if (samePath(candidate, repoRoot) || isInsidePath(candidate, repoRoot)) {
    return { ok: false, errors: [`protected output directory rejected: repository root or ancestor ${outDir}`] };
  }
  if (samePath(candidate, sourceRoot) || isInsidePath(candidate, sourceRoot) || isInsidePath(sourceRoot, candidate)) {
    return { ok: false, errors: [`protected output directory rejected: skill source or ancestor ${outDir}`] };
  }
  return { ok: true, errors: [] };
}

async function resolveRealCandidate(target) {
  const missing = [];
  let current = resolve(target);
  while (true) {
    try {
      const real = await realpath(current);
      return normalize(resolve(real, ...missing.reverse()));
    } catch {
      const parent = dirname(current);
      if (parent === current) return normalize(resolve(target));
      missing.push(basename(current));
      current = parent;
    }
  }
}

function isFilesystemRoot(path) {
  return dirname(path) === path;
}

function samePath(left, right) {
  return normalize(resolve(left)).toLowerCase() === normalize(resolve(right)).toLowerCase();
}

function isInsidePath(parent, candidate) {
  const normalizedParent = normalize(resolve(parent)).toLowerCase();
  const normalizedCandidate = normalize(resolve(candidate)).toLowerCase();
  return normalizedCandidate.startsWith(normalizedParent.endsWith(sep) ? normalizedParent : normalizedParent + sep);
}

async function resolveSingleSkillDir(skillDir) {
  const abs = resolve(skillDir);
  if (await pathExists(join(abs, 'SKILL.md'))) {
    return { ok: true, skillDir: abs };
  }

  const nestedRoots = [];
  for (const candidate of [join(abs, 'skills'), abs]) {
    const found = await listSkillDirectories(candidate);
    nestedRoots.push(...found);
  }
  const unique = [...new Set(nestedRoots)];
  if (unique.length > 1) {
    return { ok: false, errors: [MULTI_SKILL_MESSAGE] };
  }
  if (unique.length === 1) {
    return { ok: true, skillDir: unique[0] };
  }
  return { ok: false, errors: [`skill directory not found: ${abs}`] };
}

async function listSkillDirectories(root) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join(root, entry.name);
    if (await pathExists(join(dir, 'SKILL.md'))) out.push(dir);
  }
  return out;
}

async function planCodexPackage(skill) {
  const files = [];
  const notes = [];
  const accepted = [];
  const transformed = [];
  const ignored = [];
  const losses = [];

  const plugin = {
    name: skill.name,
    version: '0.0.0',
    description: skill.description || `Guarded Codex plugin for ${skill.name}`,
    skills: './skills/',
    interface: {
      displayName: titleCase(skill.name),
      shortDescription: truncate(skill.description || skill.name, 160)
    }
  };
  files.push({
    path: join('.codex-plugin', 'plugin.json'),
    action: 'generate',
    contents: `${JSON.stringify(plugin, null, 2)}\n`
  });
  accepted.push('.codex-plugin/plugin.json');

  const skillPrefix = join('skills', skill.name);
  const skillMd = await readFile(skill.skillFile);
  files.push({ path: join(skillPrefix, 'SKILL.md'), action: 'copy', bytes: skillMd });
  accepted.push('SKILL.md');
  if (/\bhooks\s*:/i.test(skillMd.toString('utf8')) || /\bPreToolUse\b/.test(skillMd.toString('utf8'))) {
    ignored.push('Claude-only PreToolUse hooks in SKILL.md');
    losses.push('claude-skill-hooks');
    notes.push('Claude-only hooks in SKILL.md are ignored for Codex packaging; plugin-level hooks enforce policy.');
  }

  if (skill.sidecarFile) {
    const sidecarBytes = await readFile(skill.sidecarFile);
    files.push({ path: join(skillPrefix, 'skillsforge.json'), action: 'copy', bytes: sidecarBytes });
    files.push({ path: join('policy', 'skillsforge.json'), action: 'copy', bytes: sidecarBytes });
    accepted.push('skillsforge.json');
    accepted.push('policy/skillsforge.json');
  } else {
    const denyAll = {
      schemaVersion: 1,
      routing: { triggers: [skill.name], antiTriggers: [] },
      capabilities: {
        exec: { allowed: false, commands: [] },
        network: { allowed: false, hosts: [] },
        write: { scope: 'none' },
        mcp: { allowed: false, tools: [] }
      }
    };
    const contents = `${JSON.stringify(denyAll, null, 2)}\n`;
    files.push({ path: join(skillPrefix, 'skillsforge.json'), action: 'generate', contents });
    files.push({ path: join('policy', 'skillsforge.json'), action: 'generate', contents });
    transformed.push('skillsforge.json(deny-all-generated)');
    notes.push('No sidecar present; generated deny-all policy for guarded Codex packaging.');
  }

  const openaiPath = join(skill.directory, 'agents', 'openai.yaml');
  if (await pathExists(openaiPath)) {
    files.push({
      path: join(skillPrefix, 'agents', 'openai.yaml'),
      action: 'copy',
      bytes: await readFile(openaiPath)
    });
    accepted.push('agents/openai.yaml');
  } else {
    files.push({
      path: join(skillPrefix, 'agents', 'openai.yaml'),
      action: 'generate',
      contents: renderOpenAiYaml(skill)
    });
    transformed.push('agents/openai.yaml(generated-from-frontmatter)');
    accepted.push('agents/openai.yaml');
  }

  for (const resource of ['scripts', 'references', 'assets']) {
    const resourceDir = join(skill.directory, resource);
    if (!(await pathExists(resourceDir))) continue;
    const resourceFiles = await listFilesRecursive(resourceDir);
    for (const file of resourceFiles) {
      const rel = relative(skill.directory, file).split(sep).join('/');
      files.push({
        path: join(skillPrefix, ...rel.split('/')),
        action: 'copy',
        bytes: await readFile(file)
      });
    }
    accepted.push(resource);
  }

  const hooks = compileCodexHooks({ policyRelativePath: 'policy/skillsforge.json' });
  files.push({
    path: join('hooks', 'hooks.json'),
    action: 'generate',
    contents: `${JSON.stringify(hooks, null, 2)}\n`
  });
  accepted.push('hooks/hooks.json');

  const repoRoot = await findPackageSourceRoot();
  const hookSource = join(repoRoot, 'plugins', 'skillsforge', 'hooks', 'codex-pre-tool-policy.mjs');
  files.push({
    path: join('hooks', 'codex-pre-tool-policy.mjs'),
    action: 'copy',
    bytes: await readFile(hookSource)
  });
  files.push({
    path: join('hooks', 'codex-policy-compiler.mjs'),
    action: 'copy',
    bytes: await readFile(join(repoRoot, 'lib', 'capabilities', 'codex-policy-compiler.mjs'))
      .then((buf) => Buffer.from(buf.toString('utf8').replaceAll("from './policy-shell.mjs'", "from './policy-shell.mjs'")))
  });
  files.push({
    path: join('hooks', 'policy-shell.mjs'),
    action: 'copy',
    bytes: await readFile(join(repoRoot, 'lib', 'capabilities', 'policy-shell.mjs'))
  });
  accepted.push('hooks/codex-pre-tool-policy.mjs');

  return {
    files,
    notes,
    plugin,
    interop: {
      accepted: [...new Set(accepted)],
      transformed: [...new Set(transformed)],
      ignored: [...new Set(ignored)],
      runtimeEnforced: true,
      usesSidecar: false,
      losses: [...new Set(losses)]
    }
  };
}

function renderOpenAiYaml(skill) {
  const display = titleCase(skill.name);
  const short = truncate(skill.description || `Use the ${skill.name} skill.`, 240);
  const prompt = `Use this skill when: ${short}`;
  const allowImplicitInvocation = skill.sidecar?.routing?.mode === 'auto';
  return `interface:\n  display_name: ${yamlScalar(display)}\n  short_description: ${yamlScalar(short)}\n  default_prompt: ${yamlScalar(prompt)}\npolicy:\n  allow_implicit_invocation: ${allowImplicitInvocation ? 'true' : 'false'}\n`;
}

function yamlScalar(value) {
  const text = String(value ?? '');
  if (/[:#{}[\],&*?|>!%@`]/.test(text) || text.includes('\n') || text.includes("'") || text.includes('"')) {
    return JSON.stringify(text);
  }
  return text;
}

function titleCase(name) {
  return String(name)
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function truncate(value, max) {
  const text = String(value ?? '');
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

/**
 * Locate monorepo root whether running from source (`lib/capabilities/...`)
 * or from the esbuild bundle (`plugins/skillsforge/bin/skillsforge.mjs`).
 */
async function findPackageSourceRoot() {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(here, '../..'),           // source: lib/capabilities -> repo
    resolve(here, '../../..'),        // bundle: plugins/skillsforge/bin -> repo
    resolve(here, '../../../..'),     // defensive
    process.cwd()
  ];
  for (const root of candidates) {
    const marker = join(root, 'plugins', 'skillsforge', 'hooks', 'codex-pre-tool-policy.mjs');
    if (await pathExists(marker)) return root;
  }
  throw new Error('cannot locate SkillsForge repo root (missing plugins/skillsforge/hooks/codex-pre-tool-policy.mjs)');
}

function emptyInterop() {
  return {
    accepted: [],
    transformed: [],
    ignored: [],
    runtimeEnforced: true,
    usesSidecar: false,
    losses: []
  };
}

function fail(skill, outDir, dryRun, errors, findings = []) {
  return {
    ok: false,
    host: 'codex',
    skill: typeof skill === 'string' ? basename(skill) : String(skill ?? ''),
    outDir,
    dryRun,
    files: [],
    interop: emptyInterop(),
    findings,
    errors
  };
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function listFilesRecursive(rootDir) {
  const out = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = join(current, entry.name);
      if (entry.isDirectory()) await walk(abs);
      else out.push(abs);
    }
  }
  await walk(rootDir);
  return out;
}
