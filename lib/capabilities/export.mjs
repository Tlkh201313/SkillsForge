import { readFile } from 'node:fs/promises';
import { relative, sep } from 'node:path';
import { parseDocument, stringify } from 'yaml';
import { parseFrontmatter } from '../../scripts/validate-skill-lib.mjs';

/** Claude-only frontmatter keys stripped for package-fidelity hosts. */
export const CLAUDE_ONLY_FRONTMATTER_KEYS = Object.freeze([
  'hooks',
  'when_to_use',
  'argument-hint',
  'disable-model-invocation',
  'user-invocable',
  'model',
  'effort',
  'context',
  'agent',
  'paths',
  'shell',
  'disallowed-tools'
]);

/**
 * Lossiness export for Cursor dist proof: name + description + body only.
 * Used by build-dist cursor tree - not the host installer package path.
 *
 * @param {{ name: string, description: string, body: string, requires?: string[] }} skill
 * @returns {{ files: Array<{ path: string, contents: string }>, interop: object }}
 */
export function exportPortableSkill(skill) {
  const requires = Array.isArray(skill.requires) ? skill.requires : [];
  const requiresNote = requires.length
    ? `\n\n## Requires\n${requires.map((name) => `- ${name}`).join('\n')}`
    : '';
  const contents = `---\nname: ${skill.name}\ndescription: ${skill.description}\n---\n${String(skill.body ?? '').trim()}${requiresNote}\n`;
  return {
    files: [{ path: 'SKILL.md', contents }],
    interop: {
      accepted: ['name', 'description', 'body'],
      transformed: requires.length ? ['requires'] : [],
      ignored: ['skillsforge.json', 'hooks', 'routing', 'capabilities', 'scripts', 'references', 'assets'],
      runtimeEnforced: false,
      losses: ['scripts', 'references', 'assets', 'sidecar', 'claude-extensions']
    }
  };
}

/**
 * Build a complete Agent Skills package for native hosts.
 * Preserves scripts/references/assets/sidecar; strips Claude-only frontmatter.
 *
 * @param {object} skill loaded skill from skill-loader
 * @param {{ runtimeEnforced?: boolean, usesSidecar?: boolean }} [host]
 */
export async function exportHostPackage(skill, host = {}) {
  const source = await readFile(skill.skillFile, 'utf8');
  const parsed = parseFrontmatter(source);
  if (!parsed) throw new Error(`SKILL.md frontmatter missing in ${skill.directory}`);

  const document = parseDocument(parsed.yaml, { prettyErrors: true, strict: true, uniqueKeys: true });
  if (document.errors.length) {
    throw new Error(document.errors.map((error) => error.message).join('; '));
  }
  const front = document.toJS() ?? {};
  const ignored = [];
  const transformed = [];
  for (const key of CLAUDE_ONLY_FRONTMATTER_KEYS) {
    if (Object.prototype.hasOwnProperty.call(front, key)) {
      ignored.push(key);
      delete front[key];
    }
  }
  // Portable hosts accept string allowed-tools; drop array form.
  if (Array.isArray(front['allowed-tools'])) {
    ignored.push('allowed-tools(array)');
    delete front['allowed-tools'];
  }

  front.name = skill.name;
  if (typeof skill.description === 'string' && skill.description) {
    front.description = skill.description;
  }

  const skillMd = `---\n${stringify(front).trim()}\n---\n${parsed.body.replace(/^\r?\n/, '')}`;
  const files = [{ path: 'SKILL.md', contents: skillMd }];
  const accepted = ['name', 'description', 'body'];

  for (const abs of skill.files ?? []) {
    const rel = relative(skill.directory, abs).split(sep).join('/');
    if (!rel || rel === 'SKILL.md') continue;
    if (rel.startsWith('..')) continue;
    const contents = await readFile(abs);
    files.push({ path: rel, contents });
    if (rel === 'skillsforge.json') {
      if (host.usesSidecar) accepted.push('skillsforge.json');
      else {
        transformed.push('skillsforge.json(provenance)');
      }
    } else if (rel.startsWith('scripts/') || rel.startsWith('references/') || rel.startsWith('assets/')) {
      accepted.push(rel.split('/')[0]);
    } else {
      accepted.push(rel);
    }
  }

  const uniqueAccepted = [...new Set(accepted)];
  return {
    files,
    interop: {
      accepted: uniqueAccepted,
      transformed: [...new Set(transformed)],
      ignored: [...new Set(ignored)],
      runtimeEnforced: Boolean(host.runtimeEnforced),
      losses: ignored.length ? ['claude-extensions'] : [],
      usesSidecar: Boolean(host.usesSidecar)
    }
  };
}
