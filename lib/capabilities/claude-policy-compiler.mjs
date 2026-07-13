import { isAbsolute, normalize, resolve, sep } from 'node:path';
import { parseDocument, stringify } from 'yaml';

export function compileSkillPolicyFrontmatter(skillRelativeDir) {
  const normalized = skillRelativeDir.replaceAll('\\', '/').replace(/^\/+/, '');
  const policyPath = `\${CLAUDE_PLUGIN_ROOT}/${normalized}/skillsforge.json`;
  return {
    hooks: {
      PreToolUse: [
        {
          matcher: 'Bash|Write|Edit|WebFetch|WebSearch',
          hooks: [
            {
              type: 'command',
              command: `node "\${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy "${policyPath}"`
            }
          ]
        }
      ]
    }
  };
}

/** Merge compiled Claude hooks into SKILL.md frontmatter; preserve name/description/license. */
export function mergeCompiledFrontmatter(source, compiled) {
  const parsed = parseSkillFrontmatter(source);
  if (!parsed) throw new Error('cannot compile policy hooks without SKILL.md frontmatter');
  const document = parseDocument(parsed.yaml, { prettyErrors: true, strict: true, uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join('; '));
  }
  const frontmatter = document.toJS() ?? {};
  frontmatter.hooks = {
    ...(frontmatter.hooks ?? {}),
    ...compiled.hooks
  };
  return `---\n${stringify(frontmatter).trimEnd()}\n---\n${parsed.body}`;
}

function parseSkillFrontmatter(source) {
  const normalized = source.startsWith('\uFEFF') ? source.slice(1) : source;
  const match = normalized.match(/^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/);
  if (!match) return null;
  return {
    yaml: match[1],
    body: normalized.slice(match[0].length)
  };
}

export function enforcePolicy(event, policy) {
  const caps = policy?.capabilities ?? {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: 'skill' }
  };
  const tool = event.tool_name;
  const input = event.tool_input ?? {};

  if ((tool === 'WebFetch' || tool === 'WebSearch') && caps.network?.allowed !== true) {
    return deny('network capability is not declared');
  }
  if (tool === 'WebFetch' && caps.network?.allowed === true) {
    const host = hostFromUrl(input.url);
    if (!host || !hostAllowed(host, caps.network.hosts)) {
      return deny(`network host is not declared: ${host ?? 'invalid URL'}`);
    }
  }

  if (tool === 'Bash') {
    const command = String(input.command ?? '');
    if (caps.exec?.allowed !== true) return deny('exec capability is not declared');
    if (!commandAllowed(command, caps.exec.commands)) {
      return deny('shell command is not declared');
    }
    if (caps.network?.allowed !== true && /\b(curl|wget|Invoke-WebRequest|fetch)\b/i.test(command)) {
      return deny('network capability is not declared for shell command');
    }
    if (caps.network?.allowed === true) {
      for (const url of command.match(/\b(?:https?|wss?):\/\/[^\s"'`]+/gi) ?? []) {
        const host = hostFromUrl(url);
        if (!host || !hostAllowed(host, caps.network.hosts)) {
          return deny(`network host is not declared: ${host ?? 'invalid URL'}`);
        }
      }
    }
    if ((caps.write?.scope === 'skill' || caps.write?.scope === 'none') && /(?:^|\s)(?:rm|del|Remove-Item)\b/i.test(command)) {
      return deny('write scope forbids destructive shell writes');
    }
  }

  if ((tool === 'Write' || tool === 'Edit') && caps.write) {
    const filePath = String(input.file_path ?? input.path ?? '');
    if (!filePath) return null;
    if (caps.write.scope === 'none') return deny('write capability scope is none');
    if (caps.write.scope === 'skill') {
      const skillRoot = policy.__skillRoot;
      const candidate = skillRoot && !isAbsolute(filePath)
        ? resolve(skillRoot, filePath)
        : resolve(filePath);
      if (skillRoot && !isInside(skillRoot, candidate)) {
        return deny('write escapes skill scope');
      }
    }
  }

  return null;
}

function deny(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `SkillsForge policy: ${reason}`
    }
  };
}

function commandAllowed(command, declaredCommands = []) {
  const normalized = command.trim();
  return declaredCommands.some((declared) => {
    const allowed = String(declared).trim();
    return allowed.length > 0
      && (normalized === allowed || normalized.startsWith(`${allowed} `));
  });
}

function hostFromUrl(value) {
  try {
    return new URL(String(value)).host.toLowerCase();
  } catch {
    return null;
  }
}

function hostAllowed(host, declaredHosts = []) {
  const normalized = host.toLowerCase();
  return declaredHosts.some((declared) => {
    const allowed = String(declared).toLowerCase();
    return normalized === allowed
      || (allowed.startsWith('*.') && normalized.endsWith(allowed.slice(1)));
  });
}

function isInside(parent, candidate) {
  const normalizedParent = normalize(resolve(parent));
  const normalizedCandidate = normalize(resolve(candidate));
  return normalizedCandidate === normalizedParent
    || normalizedCandidate.startsWith(normalizedParent.endsWith(sep) ? normalizedParent : normalizedParent + sep);
}
