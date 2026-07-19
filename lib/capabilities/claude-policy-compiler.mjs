import { isAbsolute, resolve } from 'node:path';
import { parseDocument, stringify } from 'yaml';
import { confineWriteCandidate } from './paths.mjs';
import {
  commandAllowed,
  commandExactlyAllowed,
  hasShellControlSyntax,
  hostAllowed,
  hostFromUrl,
  shellImpliesNetwork,
  shellImpliesWrite
} from './policy-shell.mjs';

export { commandAllowed, hasShellControlSyntax };

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

const CLAUDE_POLICY_TOOLS = new Set(['Bash', 'Write', 'Edit', 'WebFetch', 'WebSearch']);

export function enforcePolicy(event, policy) {
  const caps = policy?.capabilities ?? {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: 'skill' }
  };
  const tool = event?.tool_name == null || event.tool_name === ''
    ? ''
    : String(event.tool_name);
  const input = event?.tool_input ?? {};

  if (!tool || !CLAUDE_POLICY_TOOLS.has(tool)) {
    return deny(`unsupported tool for Claude policy: ${tool || '(missing)'}`);
  }

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
    if (caps.write?.scope === 'none'
      && (!commandExactlyAllowed(command, caps.exec.commands) || shellImpliesWrite(command))) {
      return deny('write scope forbids shell writes');
    }
  }

  if (tool === 'Write' || tool === 'Edit') {
    if (!caps.write) return deny('write capability is not declared');
    const filePath = String(input.file_path ?? input.path ?? '');
    if (!filePath) {
      return deny('write path is required');
    }
    if (caps.write.scope === 'none') return deny('write capability scope is none');
    if (caps.write.scope === 'skill') {
      const skillRoot = policy.__skillRoot;
      if (!skillRoot) return deny('skill root unavailable');
      const candidate = !isAbsolute(filePath)
        ? resolve(skillRoot, filePath)
        : resolve(filePath);
      const confined = confineWriteCandidate(skillRoot, candidate);
      if (!confined.ok) {
        return deny(confined.reason === 'write path realpath failed'
          ? 'write path realpath failed'
          : 'write escapes skill scope');
      }
    }
    if (caps.write.scope === 'project') {
      const projectRoot = policy.__projectRoot;
      if (!projectRoot) return deny('project root unavailable');
      const candidate = !isAbsolute(filePath)
        ? resolve(projectRoot, filePath)
        : resolve(filePath);
      const confined = confineWriteCandidate(projectRoot, candidate);
      if (!confined.ok) {
        return deny(confined.reason === 'write path realpath failed'
          ? 'write path realpath failed'
          : 'write escapes project scope');
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
