import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { basename, join, relative, resolve, sep } from 'node:path';
import { loadAllSkills } from './skill-loader.mjs';
import { detectHosts } from './hosts.mjs';
import { loadCatalog, listPacks, listProfiles } from './catalog.mjs';
import { loadWorkflows, recommendWorkflows } from './workflows.mjs';

export const LIBRARY_OUT_REL = join('artifacts', 'skillsforge-library');

export async function buildLibraryIndex(root, options = {}) {
  const absRoot = resolve(root);
  const home = options.home;
  const [skills, hosts, workflowsLoaded, catalogLoaded] = await Promise.all([
    loadAllSkills(absRoot),
    detectHosts({ home }),
    loadWorkflows(absRoot),
    loadCatalog(absRoot).catch(() => null)
  ]);
  const catalog = catalogLoaded?.catalog ?? null;
  const packBySkill = buildPackMap(catalog);
  const hostInstallChecks = new Map();
  for (const host of hosts) {
    for (const skill of skills) {
      hostInstallChecks.set(`${host.id}:${skill.name}`, await pathExists(join(host.skillsDir, skill.name)));
    }
  }
  const records = skills
    .map((skill) => summarizeSkill(absRoot, skill, {
      packBySkill,
      hosts,
      installed: hostInstallChecks
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const categories = [...new Set(records.map((skill) => skill.category).filter(Boolean))].sort();
  const sources = [...new Set(records.map((skill) => skill.sourcePlugin))].sort();
  return {
    ok: workflowsLoaded.ok,
    generatedAt: new Date().toISOString(),
    root: absRoot,
    stats: {
      skills: records.length,
      workflows: workflowsLoaded.workflows.length,
      packs: catalog ? listPacks(catalog).length : 0,
      profiles: catalog ? listProfiles(catalog).length : 0,
      hosts: hosts.length,
      detectedHosts: hosts.filter((host) => host.detected).length,
      categories: categories.length,
      sources: sources.length
    },
    categories,
    sources,
    hosts: hosts.map((host) => ({
      id: host.id,
      label: host.label,
      detected: host.detected,
      skillsDir: host.skillsDir,
      fidelity: host.fidelity,
      runtimeEnforced: host.runtimeEnforced,
      installHint: host.installHint
    })),
    skills: records,
    workflows: workflowsLoaded.workflows.map((workflow) => ({
      id: workflow.id,
      category: workflow.category,
      goal: workflow.goal,
      recommendedSkills: workflow.recommendedSkills,
      recommendedAgents: workflow.recommendedAgents,
      risk: workflow.risk,
      relativePath: workflow.relativePath
    })),
    errors: workflowsLoaded.errors
  };
}

export async function writeLibraryArtifacts(root, options = {}) {
  const outDir = resolve(root, options.outDir ?? LIBRARY_OUT_REL);
  if (!options.allowAbsolute && !isInside(root, outDir)) {
    throw new Error(`library output path escapes root: ${outDir}`);
  }
  const index = await buildLibraryIndex(root, options);
  await mkdir(outDir, { recursive: true });
  const jsonPath = join(outDir, 'skillsforge-library.json');
  const htmlPath = join(outDir, 'skillsforge-library.html');
  const aiPath = join(outDir, 'skillsforge-ai-index.html');
  await writeFile(jsonPath, `${JSON.stringify(index, null, 2)}\n`);
  await writeFile(htmlPath, buildLibraryHtml(index, { apiEnabled: false, allowMutations: false }));
  await writeFile(aiPath, buildAiIndexHtml(index));
  return {
    ok: index.ok,
    outDir,
    files: { json: jsonPath, html: htmlPath, ai: aiPath },
    stats: index.stats,
    errors: index.errors
  };
}

export async function serveLibrary(root, options = {}) {
  const host = options.host ?? '127.0.0.1';
  const port = Number(options.port ?? 4763);
  const allowMutations = options.allowMutations === true;
  const home = options.home;
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://${host}:${port}`);
      if (url.pathname === '/skillsforge-library.json') {
        const index = await buildLibraryIndex(root, { home });
        sendJson(response, index);
        return;
      }
      if (url.pathname === '/api/recommend') {
        const query = url.searchParams.get('query') ?? '';
        sendJson(response, await recommendWorkflows(root, query, { limit: 5 }));
        return;
      }
      if (url.pathname === '/api/remove') {
        const body = await readRequestJson(request);
        const result = allowMutations
          ? await removeInstalledSkill(root, { ...body, home, allowMutations: true, yes: body?.yes === true })
          : await planSkillRemoval(root, { ...body, home });
        sendJson(response, result);
        return;
      }
      const index = await buildLibraryIndex(root, { home });
      sendHtml(response, buildLibraryHtml(index, { apiEnabled: true, allowMutations }));
    } catch (error) {
      response.statusCode = 500;
      sendJson(response, { ok: false, error: error.message });
    }
  });
  await new Promise((resolveListen) => server.listen(port, host, resolveListen));
  return { ok: true, host, port, url: `http://${host}:${port}/`, readOnly: !allowMutations, server };
}

export async function planSkillRemoval(root, options = {}) {
  const target = await resolveInstalledSkillTarget(options);
  return {
    ok: true,
    dryRun: true,
    host: target.host.id,
    skill: target.skill,
    path: target.path,
    exists: target.exists,
    command: `skillsforge lib remove --host ${target.host.id} --skill ${target.skill} --dry-run`
  };
}

export async function removeInstalledSkill(root, options = {}) {
  if (options.yes !== true || options.allowMutations !== true) {
    const plan = await planSkillRemoval(root, options);
    return {
      ok: false,
      error: 'removal requires --allow-mutations and --yes',
      dryRun: true,
      host: plan.host,
      skill: plan.skill,
      path: plan.path,
      exists: plan.exists,
      command: plan.command
    };
  }
  const target = await resolveInstalledSkillTarget(options);
  if (!target.exists) {
    return { ok: true, removed: false, host: target.host.id, skill: target.skill, path: target.path, reason: 'not installed' };
  }
  await rm(target.path, { recursive: true, force: false });
  return { ok: true, removed: true, host: target.host.id, skill: target.skill, path: target.path };
}

export function buildLibraryHtml(index, options = {}) {
  const data = safeScriptJson({
    ...index,
    ui: {
      apiEnabled: options.apiEnabled === true,
      allowMutations: options.allowMutations === true
    }
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SkillsForge Library</title>
<style>
:root{color-scheme:light dark;--bg:#f6f8fa;--panel:#ffffff;--line:#d0d7de;--text:#24292f;--muted:#57606a;--accent:#0969da;--ok:#1a7f37;--warn:#9a6700;--bad:#cf222e;--radius:8px}
@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--panel:#161b22;--line:#30363d;--text:#e6edf3;--muted:#8b949e;--accent:#2f81f7;--ok:#3fb950;--warn:#d29922;--bad:#f85149}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.shell{display:grid;grid-template-columns:280px 1fr;min-height:100dvh}.side{border-right:1px solid var(--line);padding:16px;background:var(--panel);position:sticky;top:0;height:100dvh;overflow:auto}.main{padding:18px;min-width:0}.brand{display:flex;align-items:center;gap:10px;margin-bottom:16px}.mark{width:28px;height:28px;border-radius:6px;background:var(--accent)}h1{font-size:18px;margin:0}h2{font-size:15px;margin:18px 0 8px}.stat{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.stat div,.filter button,.row,.detail,.workflow,.select,.smallbtn,.dangerbtn{border:1px solid var(--line);border-radius:var(--radius);background:var(--panel)}.stat div{padding:10px}.num{font:600 20px/1 ui-monospace,SFMono-Regular,Consolas,monospace}.label{color:var(--muted);font-size:12px}.search,.select{width:100%;height:36px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--text);padding:0 10px;margin:12px 0}.filter,.action-row{display:flex;flex-wrap:wrap;gap:6px}.filter button,.smallbtn,.dangerbtn{color:var(--text);padding:6px 8px;cursor:pointer;min-height:32px}.dangerbtn{color:var(--bad)}button:disabled{opacity:.55;cursor:not-allowed}.filter button.active{border-color:var(--accent);color:var(--accent)}.grid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:16px}.rows{display:grid;gap:8px}.row{display:grid;grid-template-columns:1fr auto;gap:10px;padding:10px;text-align:left;color:var(--text);cursor:pointer}.row:hover,.row.active{border-color:var(--accent)}.title{font-weight:650}.meta{color:var(--muted);font-size:12px}.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.chip{border:1px solid var(--line);border-radius:999px;padding:2px 7px;color:var(--muted);font-size:12px}.risk-high{color:var(--bad)}.risk-medium{color:var(--warn)}.risk-low{color:var(--ok)}.detail{padding:14px;position:sticky;top:18px;max-height:calc(100dvh - 36px);overflow:auto}.detail pre{white-space:pre-wrap;word-break:break-word;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:10px}.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:12px}.toolbar input{flex:1}.workflow{padding:10px;margin-top:8px}@media (prefers-reduced-motion:no-preference){.row,.filter button,.smallbtn,.dangerbtn{transition:border-color 140ms ease,color 140ms ease,transform 140ms ease}.row:active,.filter button:active,.smallbtn:active,.dangerbtn:active{transform:translateY(1px)}}@media (max-width:900px){.shell{grid-template-columns:1fr}.side{position:relative;height:auto;border-right:0;border-bottom:1px solid var(--line)}.grid{grid-template-columns:1fr}.detail{position:relative;top:auto;max-height:none}.toolbar{display:block}}
</style>
</head>
<body>
<div class="shell">
  <aside class="side">
    <div class="brand"><div class="mark"></div><div><h1>SkillsForge Library</h1><div class="label">Local skill routing index</div></div></div>
    <div class="stat">
      <div><div class="num">${index.stats.skills}</div><div class="label">skills</div></div>
      <div><div class="num">${index.stats.workflows}</div><div class="label">workflows</div></div>
      <div><div class="num">${index.stats.packs}</div><div class="label">packs</div></div>
      <div><div class="num">${index.stats.detectedHosts}</div><div class="label">detected hosts</div></div>
    </div>
    <input id="q" class="search" type="search" placeholder="Search skills, packs, triggers">
    <h2>Categories</h2>
    <div id="filters" class="filter"></div>
    <h2>Hosts</h2>
    <div id="hosts"></div>
  </aside>
  <main class="main">
    <div class="toolbar"><input id="workflowQ" class="search" type="search" placeholder="Recommend workflow for a task"><button id="workflowBtn">Recommend</button></div>
    <div class="grid">
      <section><div id="rows" class="rows"></div></section>
      <aside id="detail" class="detail"></aside>
    </div>
  </main>
</div>
<script id="skillsforge-data" type="application/json">${data}</script>
<script>
const data=JSON.parse(document.getElementById('skillsforge-data').textContent);
let category='all';let selected=data.skills[0]?.id;
const q=document.getElementById('q');const rows=document.getElementById('rows');const detail=document.getElementById('detail');
function esc(v){return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function renderFilters(){const root=document.getElementById('filters');root.innerHTML=['all',...data.categories].map(c=>'<button class="'+(category===c?'active':'')+'" data-cat="'+esc(c)+'">'+esc(c)+'</button>').join('');root.onclick=e=>{if(e.target.dataset.cat){category=e.target.dataset.cat;render();renderFilters();}}}
function riskClass(skill){return skill.riskFlags.length>1?'risk-high':skill.riskFlags.length?'risk-medium':'risk-low'}
function filtered(){const text=q.value.toLowerCase();return data.skills.filter(s=>(category==='all'||s.category===category)&&[s.id,s.description,s.category,s.sourcePlugin,...s.recommendedFor].join(' ').toLowerCase().includes(text));}
function render(){const list=filtered();if(!list.find(s=>s.id===selected))selected=list[0]?.id;rows.innerHTML=list.map(s=>'<button class="row '+(s.id===selected?'active':'')+'" data-id="'+esc(s.id)+'"><span><div class="title">'+esc(s.id)+'</div><div class="meta">'+esc(s.category)+' / '+esc(s.sourcePlugin)+' / '+esc(s.maturity)+'</div><span class="chips">'+s.riskFlags.slice(0,3).map(r=>'<span class="chip">'+esc(r)+'</span>').join('')+'</span></span><span class="'+riskClass(s)+'">'+(s.riskFlags.length?'review':'clean')+'</span></button>').join('');renderDetail();}
function hostOptions(s){const installed=new Set(s.installedHosts);const hosts=data.hosts.filter(h=>h.detected||installed.has(h.id));const list=hosts.length?hosts:data.hosts;return list.map(h=>'<option value="'+esc(h.id)+'">'+esc(h.id)+(installed.has(h.id)?' installed':'')+'</option>').join('')}
function removalCommand(s,host){return 'skillsforge lib remove --host '+host+' --skill '+s.id+' --dry-run'}
function renderDetail(){const s=data.skills.find(x=>x.id===selected);if(!s){detail.innerHTML='<p>No skill selected.</p>';return}detail.innerHTML='<h2>'+esc(s.id)+'</h2><p>'+esc(s.description)+'</p><div class="chips"><span class="chip">'+esc(s.category)+'</span><span class="chip">'+esc(s.sourcePlugin)+'</span><span class="chip">'+esc(s.maturity)+'</span></div><h2>Recommended for</h2><pre>'+esc(s.recommendedFor.join('\\n')||'No triggers')+'</pre><h2>Risk flags</h2><pre>'+esc(s.riskFlags.join('\\n')||'No obvious capability risk flags')+'</pre><h2>Installed hosts</h2><pre>'+esc(s.installedHosts.join('\\n')||'Not installed in detected host roots')+'</pre><h2>Removal check</h2><select id="removeHost" class="select">'+hostOptions(s)+'</select><div class="action-row"><button id="removePreview" class="smallbtn">Dry-run</button><button id="removeConfirm" class="dangerbtn">Remove</button></div><pre id="removeResult"></pre><h2>Source</h2><pre>'+esc(s.sourcePath)+'</pre>';bindRemoval(s)}
function bindRemoval(s){const host=document.getElementById('removeHost');const preview=document.getElementById('removePreview');const confirm=document.getElementById('removeConfirm');const out=document.getElementById('removeResult');const ui=data.ui||{};function show(value){out.textContent=typeof value==='string'?value:JSON.stringify(value,null,2)}function plan(){return {dryRun:true,command:removalCommand(s,host.value),apiEnabled:Boolean(ui.apiEnabled),allowMutations:Boolean(ui.allowMutations)}}show(plan());preview.onclick=async()=>{if(!ui.apiEnabled){show(plan());return}const res=await fetch('/api/remove',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({host:host.value,skill:s.id})});show(await res.json())};confirm.disabled=!ui.allowMutations;confirm.onclick=async()=>{if(!ui.allowMutations){show(plan());return}const typed=window.prompt('Type '+s.id+' to remove from '+host.value);if(typed!==s.id){show('confirmation mismatch');return}const res=await fetch('/api/remove',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({host:host.value,skill:s.id,yes:true})});show(await res.json())};host.onchange=()=>show(plan())}
rows.onclick=e=>{const b=e.target.closest('button[data-id]');if(b){selected=b.dataset.id;render();}};q.oninput=render;
document.getElementById('hosts').innerHTML=data.hosts.map(h=>'<div class="workflow"><b>'+esc(h.id)+'</b><div class="meta">'+(h.detected?'detected':'missing')+' / '+esc(h.fidelity)+'</div></div>').join('');
document.getElementById('workflowBtn').onclick=()=>{const text=document.getElementById('workflowQ').value.toLowerCase();const hits=data.workflows.map(w=>({w,score:[w.id,w.category,w.goal,...w.recommendedSkills].join(' ').toLowerCase().split(/[^a-z0-9]+/).filter(t=>text.includes(t)).length})).sort((a,b)=>b.score-a.score).slice(0,5);detail.innerHTML='<h2>Workflow recommendations</h2>'+hits.map(({w})=>'<div class="workflow"><b>'+esc(w.id)+'</b><p>'+esc(w.goal)+'</p><div class="meta">'+esc(w.category)+' / '+esc(w.risk)+'</div></div>').join('');};
renderFilters();render();
</script>
</body>
</html>
`;
}

export function buildAiIndexHtml(index) {
  const compact = {
    generatedAt: index.generatedAt,
    stats: index.stats,
    instruction: 'Use recommendedFor, notFor, category, sourcePlugin, installedHosts, and riskFlags to pick the smallest useful skill or workflow. Prefer clean risk flags and detected hosts. Do not execute write/remove/install actions without explicit user confirmation.',
    skills: index.skills.map((skill) => ({
      id: skill.id,
      category: skill.category,
      sourcePlugin: skill.sourcePlugin,
      installedHosts: skill.installedHosts,
      recommendedFor: skill.recommendedFor,
      notFor: skill.notFor,
      riskFlags: skill.riskFlags
    })),
    workflows: index.workflows
  };
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>SkillsForge AI Index</title></head>
<body>
<h1>SkillsForge AI Index</h1>
<p>Read the embedded JSON. Choose the smallest matching skill or workflow. Writes require explicit confirmation.</p>
<script id="skillsforge-ai-index" type="application/json">${safeScriptJson(compact)}</script>
</body></html>
`;
}

async function resolveInstalledSkillTarget(options = {}) {
  if (!options.host) throw new Error('--host is required');
  if (!options.skill) throw new Error('--skill is required');
  const hosts = await detectHosts({ home: options.home });
  const host = hosts.find((item) => item.id === options.host);
  if (!host) throw new Error(`unknown host: ${options.host}`);
  const skill = basename(String(options.skill));
  if (skill !== options.skill || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill)) {
    throw new Error('skill must be a skill id');
  }
  const target = resolve(host.skillsDir, skill);
  if (!isInside(host.skillsDir, target)) throw new Error('resolved skill path escaped host skills directory');
  return { host, skill, path: target, exists: await pathExists(target) };
}

function summarizeSkill(root, skill, context) {
  const sourcePlugin = detectSourcePlugin(root, skill.directory);
  const category = skill.sidecar?.routing?.pack ?? context.packBySkill.get(skill.name) ?? 'unpacked';
  const installedHosts = context.hosts
    .filter((host) => context.installed.get(`${host.id}:${skill.name}`))
    .map((host) => host.id);
  return {
    id: skill.name,
    name: skill.name,
    description: skill.description,
    category,
    sourcePlugin,
    sourcePath: relative(root, skill.directory).replaceAll('\\', '/'),
    installedHosts,
    origin: skill.sidecar?.provenance?.source ?? 'unknown',
    maturity: skill.maturity,
    capabilities: summarizeCapabilities(skill.sidecar?.capabilities),
    riskFlags: riskFlags(skill.sidecar?.capabilities),
    recommendedFor: (skill.sidecar?.routing?.triggers ?? []).slice(0, 6),
    notFor: (skill.sidecar?.routing?.antiTriggers ?? []).slice(0, 6),
    routingMode: skill.sidecar?.routing?.mode ?? 'auto',
    requires: skill.requires
  };
}

function summarizeCapabilities(capabilities = {}) {
  return {
    exec: Boolean(capabilities.exec?.allowed),
    execCommands: capabilities.exec?.commands ?? [],
    network: Boolean(capabilities.network?.allowed),
    networkHosts: capabilities.network?.hosts ?? [],
    writeScope: capabilities.write?.scope ?? 'unknown'
  };
}

function riskFlags(capabilities = {}) {
  const flags = [];
  if (capabilities.exec?.allowed) flags.push('exec allowed');
  if (capabilities.network?.allowed) flags.push('network allowed');
  const writeScope = capabilities.write?.scope ?? 'unknown';
  if (writeScope !== 'none') flags.push(`write ${writeScope}`);
  if (writeScope === 'unknown') flags.push('write scope unknown');
  return flags;
}

function buildPackMap(catalog) {
  const map = new Map();
  if (!catalog) return map;
  for (const pack of listPacks(catalog)) {
    for (const skill of pack.skills) map.set(skill, pack.id);
  }
  return map;
}

function detectSourcePlugin(root, directory) {
  const rel = relative(root, directory).replaceAll('\\', '/');
  const parts = rel.split('/');
  const pluginsIndex = parts.indexOf('plugins');
  if (pluginsIndex >= 0 && parts[pluginsIndex + 1]) return parts[pluginsIndex + 1];
  return 'local';
}

function safeScriptJson(value) {
  return JSON.stringify(value).replaceAll('</script', '<\\/script');
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function isInside(parent, candidate) {
  const path = relative(resolve(parent), resolve(candidate));
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..');
}

function sendJson(response, payload) {
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function sendHtml(response, html) {
  response.setHeader('content-type', 'text/html; charset=utf-8');
  response.end(html);
}

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}
