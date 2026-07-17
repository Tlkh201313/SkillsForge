import { isAbsolute, normalize, resolve, sep } from 'node:path';
import {
  commandAllowed,
  hasShellControlSyntax,
  hostAllowed,
  hostFromUrl,
  shellImpliesNetwork
} from './policy-shell.mjs';

/**
 * Compile Codex plugin-level PreToolUse hooks.
 * Uses PLUGIN_ROOT with CLAUDE_PLUGIN_ROOT fallback — never invents CODEX_PLUGIN_ROOT.
 */
export function compileCodexHooks({ policyRelativePath }) {
  const policyPath = String(policyRelativePath ?? 'policy/skillsforge.json').replaceAll('\\', '/');
  // Host substitutes PLUGIN_ROOT; hook runner falls back to CLAUDE_PLUGIN_ROOT.
  return {
    hooks: {
      PreToolUse: [
        {
          matcher: 'Bash|apply_patch|mcp__*',
          hooks: [
            {
              type: 'command',
              command: `node "\${PLUGIN_ROOT}/hooks/codex-pre-tool-policy.mjs" --policy "\${PLUGIN_ROOT}/${policyPath}"`
            }
          ]
        }
      ]
    }
  };
}

export function resolvePluginRoot(env = process.env, hookDir = null) {
  const fromEnv = env.PLUGIN_ROOT || env.CLAUDE_PLUGIN_ROOT;
  if (fromEnv) return resolve(String(fromEnv));
  if (hookDir) return resolve(hookDir, '..');
  return resolve(process.cwd());
}

export function enforceCodexPolicy(event, policy) {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy) || !policy.capabilities) {
    return deny('policy capabilities are missing');
  }

  const caps = policy.capabilities;
  const tool = String(event?.tool_name ?? '');
  const input = event?.tool_input ?? {};

  if (tool === 'Bash') {
    return enforceBash(String(input.command ?? ''), caps);
  }

  if (tool === 'apply_patch' || /^apply[_-]?patch$/i.test(tool)) {
    return enforceApplyPatch(String(input.patch ?? input.input ?? input.command ?? ''), caps, policy);
  }

  if (isMcpTool(tool)) {
    return enforceMcp(tool, caps);
  }

  return deny(`unsupported tool for Codex policy: ${tool || '(missing)'}`);
}

function enforceBash(command, caps) {
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
  if ((caps.write?.scope === 'skill' || caps.write?.scope === 'none')
    && /(?:^|\s)(?:rm|del|Remove-Item)\b/i.test(command)) {
    return deny('write scope forbids destructive shell writes');
  }
  return null;
}

function enforceApplyPatch(patchText, caps, policy) {
  if (!caps.write) return deny('write capability is not declared');
  if (caps.write.scope === 'none') return deny('write capability scope is none');

  const paths = parseApplyPatchPaths(patchText);
  if (paths.length === 0) {
    return deny('apply_patch contains no recognizable file paths');
  }

  for (const filePath of paths) {
    if (filePath.includes('\0') || /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(filePath)) {
      return deny(`apply_patch path traversal rejected: ${filePath}`);
    }
    if (caps.write.scope === 'skill') {
      const skillRoot = policy.__skillRoot;
      const candidate = skillRoot && !isAbsolute(filePath)
        ? resolve(skillRoot, filePath)
        : resolve(filePath);
      if (skillRoot && !isInside(skillRoot, candidate)) {
        return deny(`write escapes skill scope: ${filePath}`);
      }
    }
    if (caps.write.scope === 'project') {
      const projectRoot = policy.__projectRoot;
      const candidate = projectRoot && !isAbsolute(filePath)
        ? resolve(projectRoot, filePath)
        : resolve(filePath);
      if (projectRoot && !isInside(projectRoot, candidate)) {
        return deny(`write escapes project scope: ${filePath}`);
      }
    }
  }
  return null;
}

export function parseApplyPatchPaths(patchText) {
  const paths = [];
  const lines = String(patchText ?? '').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\*\*\*\s+(?:Update|Add)\s+File:\s+(.+?)\s*$/i);
    if (match) paths.push(match[1].trim());
  }
  return paths;
}

function enforceMcp(tool, caps) {
  const mcp = caps.mcp;
  if (mcp?.allowed !== true) {
    return deny('mcp capability is not declared');
  }
  const declared = Array.isArray(mcp.tools) ? mcp.tools : [];
  if (!declared.some((item) => String(item) === tool)) {
    return deny(`mcp tool is not declared: ${tool}`);
  }
  return null;
}

export function isMcpTool(toolName) {
  const tool = String(toolName ?? '');
  return /^mcp__/i.test(tool) || /MCP/i.test(tool);
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

function isInside(parent, candidate) {
  const normalizedParent = normalize(resolve(parent));
  const normalizedCandidate = normalize(resolve(candidate));
  return normalizedCandidate === normalizedParent
    || normalizedCandidate.startsWith(normalizedParent.endsWith(sep) ? normalizedParent : normalizedParent + sep);
}
