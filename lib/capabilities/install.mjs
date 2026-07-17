import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { exportHostPackage, exportPortableSkill } from './export.mjs';
import { detectHosts, resolveHostSelection } from './hosts.mjs';
import { loadAllSkills, loadSkill } from './skill-loader.mjs';
import { verifySkillPaths } from './verify.mjs';

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate skills then copy into selected host skill directories.
 */
export async function installSkills(options = {}) {
  const home = options.home;
  const root = options.root ?? process.cwd();
  const dryRun = Boolean(options.dryRun);
  const force = Boolean(options.force);

  let hosts = options.hosts;
  if (!hosts) {
    if (!options.hostIds?.length) {
      return {
        ok: false,
        error: 'no hosts selected',
        installs: [],
        validation: null
      };
    }
    const selection = await resolveHostSelection(options.hostIds, { home });
    if (selection.unknown.length) {
      return {
        ok: false,
        error: `unknown hosts: ${selection.unknown.join(', ')}`,
        installs: [],
        validation: null,
        hosts: selection.all
      };
    }
    hosts = selection.selected;
  }

  if (!hosts.length) {
    return { ok: false, error: 'no hosts selected', installs: [], validation: null };
  }

  let skills = options.skills;
  if (!skills) {
    if (options.skillPaths?.length) {
      skills = [];
      for (const path of options.skillPaths) {
        skills.push(await loadSkill(path, { root }));
      }
    } else {
      skills = await loadAllSkills(root);
    }
  }

  if (!skills.length) {
    return { ok: false, error: 'no skills to install', installs: [], validation: null };
  }

  const paths = skills.map((skill) => skill.directory);
  const validation = await verifySkillPaths(paths, {
    root,
    profile: 'claude-code',
    all: false,
    dependencies: false
  });
  if (!validation.ok) {
    return {
      ok: false,
      error: 'validation failed',
      installs: [],
      validation,
      planned: []
    };
  }

  const installs = [];
  const planned = [];

  for (const host of hosts) {
    for (const skill of skills) {
      const targetDir = join(host.skillsDir, skill.name);
      const exists = await pathExists(targetDir);
      const entry = {
        host: host.id,
        skill: skill.name,
        dir: targetDir,
        fidelity: host.fidelity,
        status: 'pending'
      };

      if (exists && !force) {
        entry.status = 'skipped';
        entry.reason = 'target exists (pass --force to overwrite)';
        installs.push(entry);
        continue;
      }

      const materialization = host.fidelity === 'full'
        ? await exportFullClaudePackage(skill, host)
        : await exportHostPackage(skill, host);

      entry.interop = materialization.interop;
      for (const file of materialization.files) {
        planned.push({ host: host.id, skill: skill.name, path: join(targetDir, file.path) });
      }

      if (!dryRun) {
        await mkdir(targetDir, { recursive: true });
        for (const file of materialization.files) {
          const dest = join(targetDir, file.path);
          await mkdir(dirname(dest), { recursive: true });
          await writeFile(dest, file.contents);
        }
      }
      entry.status = dryRun ? 'planned' : 'installed';
      entry.files = materialization.files.map((file) => file.path);
      installs.push(entry);
    }
  }

  const blocked = installs.some((item) => item.status === 'pending');
  return {
    ok: !blocked,
    dryRun,
    installs,
    planned,
    validation,
    hosts: await detectHosts({ home })
  };
}

async function exportFullClaudePackage(skill, host) {
  const files = [];
  for (const abs of skill.files ?? []) {
    const rel = relative(skill.directory, abs).split(sep).join('/');
    if (!rel || rel.startsWith('..')) continue;
    files.push({ path: rel, contents: await readFile(abs) });
  }
  return {
    files,
    interop: {
      accepted: files.map((file) => file.path),
      transformed: [],
      ignored: [],
      runtimeEnforced: Boolean(host.runtimeEnforced),
      losses: [],
      usesSidecar: Boolean(host.usesSidecar)
    }
  };
}

export { detectHosts, resolveHostSelection, exportPortableSkill };
