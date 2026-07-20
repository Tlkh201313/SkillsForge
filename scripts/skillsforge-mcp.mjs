#!/usr/bin/env node
/**
 * Thin SkillsForge MCP server (stdio JSON-RPC subset).
 * Tools: validate, route, skillshield, library/workflow recommend, plus token-saving
 * map / slim / digest / next / tokens for AI CLI hosts.
 * No swarm, AgentDB, consensus, or default write tools.
 *
 * Protocol: newline-delimited JSON (NDJSON) on stdin/stdout - default and only framing:
 *   {"id":1,"method":"tools/list"}
 *   {"id":2,"method":"tools/call","params":{"name":"validate","arguments":{...}}}
 *
 * Content-Length framing is NOT implemented. If SKILLSFORGE_MCP_FRAMING=content-length,
 * the process exits with a clear error (use NDJSON instead).
 *
 * Optional `home` tool args are home-bound like install `--home`: relative values resolve
 * under the user home and must stay inside it; absolute overrides are allowed for tests.
 */
import { createInterface } from 'node:readline';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSkills } from '../lib/capabilities/skill-loader.mjs';
import { routeQuery } from '../lib/capabilities/router.mjs';
import { verifySkillPaths } from '../lib/capabilities/verify.mjs';
import { runSkillShield } from '../lib/capabilities/skillshield.mjs';
import { isInside, resolveUnderRoot } from '../lib/capabilities/paths.mjs';
import { buildLibraryIndex, recommendFromLibrary } from '../lib/capabilities/library.mjs';
import { recommendWorkflows, showWorkflow } from '../lib/capabilities/workflows.mjs';
import { runForgeMap } from '../lib/capabilities/forgemap.mjs';
import { runSlim } from '../lib/capabilities/slim.mjs';
import { runDigestCommand, runNextCommand, runTokensCommand } from '../lib/capabilities/operator.mjs';
import { loadSettings } from '../lib/capabilities/settings.mjs';
import { scoreSkillQuality } from '../lib/capabilities/quality.mjs';
import { loadSkill } from '../lib/capabilities/skill-loader.mjs';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(process.env.SKILLSFORGE_ROOT ?? join(moduleDir, '..'));

const TOOLS = [
  {
    name: 'validate',
    description: 'Validate an Agent Skill directory (structure + capability policy)',
    inputSchema: {
      type: 'object',
      properties: {
        skill: { type: 'string', description: 'Skill directory relative to repo root' },
        profile: { type: 'string', enum: ['canonical', 'claude-code'], default: 'claude-code' }
      },
      required: ['skill']
    }
  },
  {
    name: 'route',
    description: 'Explainable skill routing for a natural-language query',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        pack: { type: 'string' },
        includeExplicit: { type: 'boolean', default: false }
      },
      required: ['query']
    }
  },
  {
    name: 'skillshield',
    description: 'Best-effort skill-body scanner for unsafe patterns',
    inputSchema: {
      type: 'object',
      properties: {
        skill: { type: 'string', description: 'Skill directory relative to repo root' }
      },
      required: ['skill']
    }
  },
  {
    name: 'library_index',
    description: 'Read-only installed skill library index for routing and host awareness',
    inputSchema: {
      type: 'object',
      properties: {
        home: { type: 'string', description: 'Optional home directory override (home-bound like install --home)' },
        sessionHost: { type: 'string', description: 'Optional host id override for the current session' }
      }
    }
  },
  {
    name: 'recommend_skill',
    description: 'Read-only session-aware skill recommendation for a natural-language task',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        home: { type: 'string', description: 'Optional home directory override (home-bound like install --home)' },
        sessionHost: { type: 'string', description: 'Optional host id override for the current session' },
        limit: { type: 'number', default: 5 }
      },
      required: ['query']
    }
  },
  {
    name: 'recommend_workflow',
    description: 'Read-only workflow recommendation for a natural-language task',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        category: { type: 'string' },
        limit: { type: 'number', default: 5 }
      },
      required: ['query']
    }
  },
  {
    name: 'workflow_show',
    description: 'Read-only workflow detail by id',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'settings_show',
    description: 'Read-only resolved SkillsForge settings',
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'string', description: 'Optional config path relative to repo root' }
      }
    }
  },
  {
    name: 'quality_skill',
    description: 'Read-only skill quality score and checks',
    inputSchema: {
      type: 'object',
      properties: {
        skill: { type: 'string', description: 'Skill directory relative to repo root' }
      },
      required: ['skill']
    }
  },
  {
    name: 'skill_contract',
    description: 'Read-only extracted skill output contract sections',
    inputSchema: {
      type: 'object',
      properties: {
        skill: { type: 'string', description: 'Skill directory relative to repo root' }
      },
      required: ['skill']
    }
  },
  {
    name: 'map',
    description: 'ForgeMap: lean JS/TS structural lookup (prefer over grep+multi-read to save tokens)',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          enum: ['status', 'index', 'files', 'symbol', 'callers', 'impact', 'explore'],
          description: 'ForgeMap subcommand'
        },
        name: { type: 'string', description: 'Symbol name for symbol/callers/impact' },
        query: { type: 'string', description: 'Text for explore' },
        limit: { type: 'number' },
        depth: { type: 'number' },
        force: { type: 'boolean', description: 'Force rebuild for index' }
      },
      required: ['task']
    }
  },
  {
    name: 'slim',
    description: 'ForgeSlim: compress git/test/rg output before it hits the model',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          enum: ['status', 'diff', 'log', 'test', 'run', 'rg', 'gain'],
          description: 'ForgeSlim subcommand'
        },
        argv: {
          type: 'array',
          items: { type: 'string' },
          description: 'Passthrough args for test/run/rg (e.g. ["npm","test"])'
        },
        limit: { type: 'number' },
        reset: { type: 'boolean', description: 'Clear gain ledger when task=gain' },
        stat: { type: 'boolean', description: 'Include --stat for diff' }
      },
      required: ['task']
    }
  },
  {
    name: 'digest',
    description: 'One-shot briefing: status + recommend + token cost + next commands (token-friendly task start)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number', default: 3 },
        home: { type: 'string' },
        sessionHost: { type: 'string' }
      },
      required: ['query']
    }
  },
  {
    name: 'next',
    description: 'Suggest next productive SkillsForge commands from repo state',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' }
      }
    }
  },
  {
    name: 'tokens',
    description: 'Estimate context tokens (chars/4). Default catalog = repo skills only.',
    inputSchema: {
      type: 'object',
      properties: {
        catalog: { type: 'boolean', default: true },
        installed: { type: 'boolean', description: 'Include host-installed skills' },
        skill: { type: 'string' },
        limit: { type: 'number', default: 10 },
        home: { type: 'string' }
      }
    }
  }
];

/**
 * Resolve MCP `home` like install `--home`: relative paths bind under the user home
 * and must not escape it; absolute paths are accepted as an explicit home root.
 */
function resolveMcpHome(homeArg, baseHome = homedir()) {
  if (homeArg == null || homeArg === '') return undefined;
  const raw = String(homeArg);
  if (raw.includes('\0')) {
    throw new Error('MCP home contains NUL');
  }
  const homeRoot = resolve(baseHome);
  if (!isAbsolute(raw)) {
    const bound = resolve(homeRoot, raw);
    if (!isInside(homeRoot, bound)) {
      throw new Error(`MCP home escapes user home: ${homeArg}`);
    }
    return bound;
  }
  return resolve(raw);
}

async function callTool(name, args = {}) {
  if (name === 'validate') {
    const skillDir = resolveUnderRoot(root, args.skill);
    const result = await verifySkillPaths([skillDir], {
      root,
      profile: args.profile ?? 'claude-code'
    });
    return {
      ok: result.ok,
      findings: result.findings ?? [],
      text: result.text ?? ''
    };
  }
  if (name === 'route') {
    const skills = await loadAllSkills(root, {
      skipFileIntegrity: true,
      skipSidecarSchema: true
    });
    return routeQuery(args.query, skills, {
      pack: args.pack ?? null,
      includeExplicit: args.includeExplicit === true
    });
  }
  if (name === 'skillshield') {
    const skillDir = resolveUnderRoot(root, args.skill);
    return runSkillShield(skillDir, { root });
  }
  if (name === 'library_index') {
    return buildLibraryIndex(root, {
      home: resolveMcpHome(args.home),
      sessionHost: args.sessionHost
    });
  }
  if (name === 'recommend_skill') {
    const index = await buildLibraryIndex(root, {
      home: resolveMcpHome(args.home),
      sessionHost: args.sessionHost
    });
    return recommendFromLibrary(index, args.query, {
      limit: args.limit ?? 5,
      sessionHost: args.sessionHost
    });
  }
  if (name === 'recommend_workflow') {
    return recommendWorkflows(root, args.query, {
      category: args.category ?? undefined,
      limit: args.limit ?? 5
    });
  }
  if (name === 'workflow_show') {
    return showWorkflow(root, args.id);
  }
  if (name === 'settings_show') {
    return loadSettings(root, { config: args.config });
  }
  if (name === 'quality_skill') {
    const skillDir = resolveUnderRoot(root, args.skill);
    return scoreSkillQuality(skillDir, { root });
  }
  if (name === 'skill_contract') {
    const skillDir = resolveUnderRoot(root, args.skill);
    const skill = await loadSkill(skillDir, { root });
    return {
      ok: true,
      skill: skill.name,
      contract: extractContract(skill.body ?? '')
    };
  }
  if (name === 'map') {
    return runForgeMap(root, args.task, {
      name: args.name,
      query: args.query,
      limit: args.limit,
      depth: args.depth,
      force: args.force === true
    });
  }
  if (name === 'slim') {
    return runSlim(root, args.task, {
      argv: args.argv,
      limit: args.limit,
      reset: args.reset === true,
      stat: args.stat === true
    });
  }
  if (name === 'digest') {
    return runDigestCommand(root, {
      query: args.query,
      limit: args.limit,
      home: resolveMcpHome(args.home),
      sessionHost: args.sessionHost
    });
  }
  if (name === 'next') {
    return runNextCommand(root, { limit: args.limit });
  }
  if (name === 'tokens') {
    return runTokensCommand(root, {
      catalog: args.catalog !== false && !args.skill,
      installed: args.installed === true,
      skill: args.skill,
      limit: args.limit ?? 10,
      home: resolveMcpHome(args.home)
    });
  }
  throw new Error(`unknown tool: ${name}`);
}

function respond(id, result, error) {
  const payload = error
    ? { jsonrpc: '2.0', id, error: { code: -32000, message: error } }
    : { jsonrpc: '2.0', id, result };
  const body = `${JSON.stringify(payload)}\n`;
  process.stdout.write(body);
}

function extractContract(body) {
  return {
    output: extractSection(body, 'Output Contract'),
    verification: extractSection(body, 'Verification'),
    failureModes: extractSection(body, 'Failure Modes'),
    pressureTest: extractSection(body, 'OG Output Pressure Test')
  };
}

function extractSection(body, title) {
  const pattern = new RegExp(`^## ${title}\\s*\\r?\\n([\\s\\S]*?)(?=^##\\s+|$)`, 'mi');
  const match = body.match(pattern);
  return match ? match[1].trim() : '';
}

async function handleMessage(msg) {
  const { id, method, params } = msg;
  try {
    if (method === 'initialize') {
      respond(id, {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'skillsforge', version: '0.4.3' },
        capabilities: { tools: {} }
      });
      return;
    }
    if (method === 'notifications/initialized' || method === 'initialized') {
      return;
    }
    if (method === 'tools/list' || method === 'list_tools') {
      respond(id, { tools: TOOLS });
      return;
    }
    if (method === 'tools/call' || method === 'call_tool') {
      const name = params?.name ?? params?.tool;
      const args = params?.arguments ?? params?.args ?? {};
      const result = await callTool(name, args);
      respond(id, {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      });
      return;
    }
    if (method === 'ping') {
      respond(id, {});
      return;
    }
    respond(id, null, `unsupported method: ${method}`);
  } catch (error) {
    respond(id, null, error.message);
  }
}

async function main() {
  const framing = String(process.env.SKILLSFORGE_MCP_FRAMING ?? '').trim().toLowerCase();
  if (framing === 'content-length') {
    process.stderr.write(
      'SkillsForge MCP does not support Content-Length framing (SKILLSFORGE_MCP_FRAMING=content-length). '
      + 'Use the default newline-delimited JSON (NDJSON) protocol instead.\n'
    );
    process.exit(2);
  }
  if (framing && framing !== 'ndjson' && framing !== 'newline') {
    process.stderr.write(
      `SkillsForge MCP unknown framing "${framing}". Only NDJSON (default) is supported.\n`
    );
    process.exit(2);
  }

  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      respond(null, null, 'invalid JSON');
      continue;
    }
    await handleMessage(msg);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

export { TOOLS, callTool, handleMessage, resolveMcpHome };
