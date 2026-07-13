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

  if (tool === 'WebSearch') {
    if (caps.network?.allowed !== true || caps.network?.searchAllowed !== true) {
      return deny(
        caps.network?.allowed !== true
          ? 'network capability is not declared'
          : 'network searchAllowed is not declared'
      );
    }
  }
  if (tool === 'WebFetch' && caps.network?.allowed !== true) {
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
    if (hasShellControlSyntax(command)) {
      return deny('shell command contains disallowed control syntax');
    }
    if (!commandAllowed(command, caps.exec.commands)) {
      return deny('shell command is not declared');
    }
    if (caps.network?.allowed !== true && shellImpliesNetwork(command)) {
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
    if (!filePath) {
      return deny('write path is required');
    }
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
    if (caps.write.scope === 'project') {
      const projectRoot = policy.__projectRoot;
      const candidate = projectRoot && !isAbsolute(filePath)
        ? resolve(projectRoot, filePath)
        : resolve(filePath);
      if (projectRoot && !isInside(projectRoot, candidate)) {
        return deny('write escapes project scope');
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

const SHELL_CONTROL_SYNTAX = /[;&|`\n\r<>]|\$\(/;

export function hasShellControlSyntax(command) {
  return SHELL_CONTROL_SYNTAX.test(String(command ?? ''));
}

function tokenizeCommand(command) {
  const tokens = [];
  const source = String(command ?? '').trim();
  let current = '';
  let quote = null;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else if (ch === '\\' && quote === '"' && i + 1 < source.length) {
        current += source[i + 1];
        i += 1;
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += ch;
  }
  if (quote) return null;
  if (current) tokens.push(current);
  return tokens;
}

function argHasMetacharacters(arg) {
  return /[;&|`$<>\\]/.test(String(arg ?? '')) || /\$\(/.test(String(arg ?? ''));
}

function commandAllowed(command, declaredCommands = []) {
  const normalized = command.trim();
  if (!normalized || hasShellControlSyntax(normalized)) return false;
  const cmdTokens = tokenizeCommand(normalized);
  if (!cmdTokens) return false;

  return declaredCommands.some((declared) => {
    const allowed = String(declared).trim();
    if (!allowed || hasShellControlSyntax(allowed)) return false;
    if (normalized === allowed) return true;

    const allowedTokens = tokenizeCommand(allowed);
    if (!allowedTokens || allowedTokens.length === 0) return false;
    if (cmdTokens.length < allowedTokens.length) return false;
    for (let i = 0; i < allowedTokens.length; i += 1) {
      if (cmdTokens[i] !== allowedTokens[i]) return false;
    }
    const remaining = cmdTokens.slice(allowedTokens.length);
    return remaining.every((token) => !argHasMetacharacters(token));
  });
}

const SHELL_NETWORK_CLIENTS = /\b(curl|wget|Invoke-WebRequest|Invoke-RestMethod|iwr|bitsadmin|certutil|fetch)\b/i;

function shellImpliesNetwork(command) {
  if (SHELL_NETWORK_CLIENTS.test(command)) return true;
  if (/\bpython(?:3)?\b/i.test(command) && /\s-c\b/.test(command)
    && /\b(urllib|requests|http\.client|httpx|urlopen)\b/i.test(command)) {
    return true;
  }
  if (/\bnode\b/i.test(command) && /\s-e\b/.test(command)
    && /\b(fetch|https?:\/\/|https?\.|axios|got)\b/i.test(command)) {
    return true;
  }
  return false;
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
