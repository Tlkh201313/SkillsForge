import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { exportPortableSkill } from './export.mjs';
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
 *
 * @param {{
 *   skills?: Array<object>,
 *   skillPaths?: string[],
 *   hosts?: Array<object>,
 *   hostIds?: string[],
 *   home?: string,
 *   root?: string,
 *   dryRun?: boolean,
 *   force?: boolean
 * }} options
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

  // Fail closed: validate source packages before any write.
  // Use claude-code profile so Claude extensions in source SKILL.md are accepted;
  // portable hosts still receive stripped exports after validation.
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

      if (host.fidelity === 'portable') {
        const exported = exportPortableSkill(skill);
        for (const file of exported.files) {
          planned.push({ host: host.id, skill: skill.name, path: join(targetDir, file.path) });
        }
        if (!dryRun) {
          await mkdir(targetDir, { recursive: true });
          for (const file of exported.files) {
            await writeFile(join(targetDir, file.path), file.contents);
          }
        }
        entry.status = dryRun ? 'planned' : 'installed';
        entry.files = exported.files.map((file) => file.path);
      } else {
        // Full fidelity: copy skill package files under the skill directory.
        const relativeFiles = skill.files.map((file) => relative(skill.directory, file));
        for (const rel of relativeFiles) {
          planned.push({ host: host.id, skill: skill.name, path: join(targetDir, rel) });
        }
        if (!dryRun) {
          await mkdir(dirname(targetDir), { recursive: true });
          await cp(skill.directory, targetDir, { recursive: true, force: true });
        }
        entry.status = dryRun ? 'planned' : 'installed';
        entry.files = relativeFiles;
      }

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

export { detectHosts, resolveHostSelection };
