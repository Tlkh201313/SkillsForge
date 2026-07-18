#!/usr/bin/env node
/**
 * Thin SkillsForge MCP server (stdio JSON-RPC subset).
 * Tools only: validate, route, skillshield — no swarm/AgentDB.
 *
 * Protocol: newline-delimited JSON requests:
 *   {"id":1,"method":"tools/list"}
 *   {"id":2,"method":"tools/call","params":{"name":"validate","arguments":{...}}}
 *
 * Or MCP-ish initialize/tools/list/tools/call over Content-Length framing
 * when SKILLSFORGE_MCP_FRAMING=content-length.
 */
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSkills } from '../lib/capabilities/skill-loader.mjs';
import { routeQuery } from '../lib/capabilities/router.mjs';
import { verifySkillPaths } from '../lib/capabilities/verify.mjs';
import { runSkillShield } from '../lib/capabilities/skillshield.mjs';
import { resolveUnderRoot } from '../lib/capabilities/paths.mjs';
import { buildLibraryIndex } from '../lib/capabilities/library.mjs';
import { recommendWorkflows, showWorkflow } from '../lib/capabilities/workflows.mjs';

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
        home: { type: 'string', description: 'Optional home directory override for tests' }
      }
    }
  },
  {
    name: 'recommend_skill',
    description: 'Read-only skill recommendation for a natural-language task',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        pack: { type: 'string' }
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
  }
];

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
    const skills = await loadAllSkills(root);
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
    return buildLibraryIndex(root, { home: args.home });
  }
  if (name === 'recommend_skill') {
    const skills = await loadAllSkills(root);
    return routeQuery(args.query, skills, {
      pack: args.pack ?? null,
      includeExplicit: true
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
  throw new Error(`unknown tool: ${name}`);
}

function respond(id, result, error) {
  const payload = error
    ? { jsonrpc: '2.0', id, error: { code: -32000, message: error } }
    : { jsonrpc: '2.0', id, result };
  const body = `${JSON.stringify(payload)}\n`;
  process.stdout.write(body);
}

async function handleMessage(msg) {
  const { id, method, params } = msg;
  try {
    if (method === 'initialize') {
      respond(id, {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'skillsforge', version: '0.4.0' },
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

export { TOOLS, callTool, handleMessage };
