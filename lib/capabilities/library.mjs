import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { basename, join, relative, resolve, sep } from 'node:path';
import { loadAllSkills } from './skill-loader.mjs';
import { detectHosts } from './hosts.mjs';
import { loadCatalog, listPacks, listProfiles } from './catalog.mjs';
import { loadWorkflows, recommendWorkflows } from './workflows.mjs';
import { loadSettings } from './settings.mjs';

export const LIBRARY_OUT_REL = join('artifacts', 'skillsforge-library');

export async function buildLibraryIndex(root, options = {}) {
  const absRoot = resolve(root);
  const home = options.home;
  const settingsLoaded = await loadSettings(absRoot, { config: options.config });
  const settings = settingsLoaded.settings;
  const [skillsLoaded, hosts, workflowsLoaded, catalogLoaded] = await Promise.all([
    loadAllSkills(absRoot, {
      includeInstalled: true,
      home,
      noCache: options.noCache === true,
      skipFileIntegrity: true,
      skipSidecarSchema: true,
      collectErrors: true
    }),
    detectHosts({ home }),
    loadWorkflows(absRoot),
    loadCatalog(absRoot).catch(() => null)
  ]);
  const skills = skillsLoaded.skills;
  const loadErrors = [
    ...skillsLoaded.errors.map((error) => ({
      source: 'skills',
      file: error.directory,
      error: error.message,
      optional: error.optional === true
    })),
    ...workflowsLoaded.errors
  ];
  const catalog = catalogLoaded?.catalog ?? null;
  const packBySkill = buildPackMap(catalog);
  const session = detectSession(hosts, {
    ...options,
    sessionHost: options.sessionHost ?? settings.defaultHost
  });
  const hostInstallChecks = await buildHostInstallIndex(hosts, settings);
  const records = skills
    .map((skill) => summarizeSkill(absRoot, skill, {
      packBySkill,
      hosts,
      installed: hostInstallChecks,
      home,
      session
    }))
    .map(assignRecordKey())
    .sort((left, right) => left.key.localeCompare(right.key));
  const categories = [...new Set(records.map((skill) => skill.category).filter(Boolean))].sort();
  const sources = [...new Set(records.map((skill) => skill.sourcePlugin))].sort();
  const ok = skillsLoaded.ok && workflowsLoaded.ok;
  return {
    ok: ok && settingsLoaded.ok,
    generatedAt: new Date().toISOString(),
    root: absRoot,
    settingsPath: settingsLoaded.path,
    settings,
    stats: {
      skills: records.length,
      workflows: workflowsLoaded.workflows.length,
      packs: catalog ? listPacks(catalog).length : 0,
      profiles: catalog ? listProfiles(catalog).length : 0,
      hosts: hosts.length,
      detectedHosts: hosts.filter((host) => host.detected).length,
      installedSkills: records.filter((skill) => skill.installedHosts.length > 0).length,
      sessionSkills: session.host ? records.filter((skill) => skill.installedHosts.includes(session.host)).length : 0,
      categories: categories.length,
      sources: sources.length
    },
    session,
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
      commands: workflow.commands,
      tokenBudget: workflow.tokenBudget,
      qualityGate: workflow.qualityGate,
      risk: workflow.risk,
      relativePath: workflow.relativePath
    })),
    errors: [
      ...settingsLoaded.errors.map((error) => ({ source: 'settings', file: settingsLoaded.path, error })),
      ...loadErrors
    ]
  };
}

export async function writeLibraryArtifacts(root, options = {}) {
  const settingsLoaded = await loadSettings(root, { config: options.config });
  const configuredOut = settingsLoaded.settings.library.outDir ?? LIBRARY_OUT_REL;
  const outDir = resolve(root, options.outDir ?? configuredOut);
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
  const sessionHost = options.sessionHost;
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://${host}:${port}`);
      if (url.pathname === '/skillsforge-library.json') {
        const index = await buildLibraryIndex(root, { home, sessionHost, config: options.config });
        sendJson(response, index);
        return;
      }
      if (url.pathname === '/api/recommend') {
        const query = url.searchParams.get('query') ?? '';
        const index = await buildLibraryIndex(root, { home, sessionHost, config: options.config });
        sendJson(response, recommendFromLibrary(index, query, { limit: 5, sessionHost }));
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
      const index = await buildLibraryIndex(root, { home, sessionHost, config: options.config });
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

/** Align with router THRESHOLD - weak token noise is not a confident match. */
export const LIBRARY_RECOMMEND_THRESHOLD = 2;

export function recommendFromLibrary(index, query, options = {}) {
  const limit = clampLimit(options.limit, 5);
  const threshold = options.threshold ?? index.settings?.recommendThreshold ?? LIBRARY_RECOMMEND_THRESHOLD;
  const sessionHost = options.sessionHost ?? index.session?.host ?? null;
  const trimmed = String(query ?? '').trim();
  const rankedSkills = index.skills
    .map((skill) => scoreLibrarySkill(query, skill, { sessionHost }))
    .filter((item) => item.score >= threshold)
    .sort((left, right) => right.score - left.score || left.skill.key.localeCompare(right.skill.key));
  const skills = rankedSkills.slice(0, limit).map(({ skill, score, reasons }) => ({
    key: skill.key,
    id: skill.id,
    category: skill.category,
    sourcePlugin: skill.sourcePlugin,
    installedHosts: skill.installedHosts,
    description: skill.description,
    riskFlags: skill.riskFlags ?? [],
    maturity: skill.maturity,
    routingMode: skill.routingMode,
    score,
    reasons,
    needsConfirmation: (skill.riskFlags?.length ?? 0) > 0 || skill.routingMode === 'explicit'
  }));
  const rankedWorkflows = index.workflows
    .map((workflow) => scoreLibraryWorkflow(query, workflow, { sessionHost, skillMatches: skills }))
    .filter((item) => item.score >= threshold)
    .sort((left, right) => right.score - left.score || left.workflow.id.localeCompare(right.workflow.id));
  const workflows = rankedWorkflows.slice(0, limit).map(({ workflow, score, reasons }) => ({
    id: workflow.id,
    category: workflow.category,
    goal: workflow.goal,
    recommendedSkills: workflow.recommendedSkills,
    recommendedAgents: workflow.recommendedAgents,
    risk: workflow.risk,
    score,
    reasons,
    needsConfirmation: workflow.risk === 'high' || workflow.risk === 'medium'
  }));
  const confidence = !trimmed || (skills.length === 0 && workflows.length === 0)
    ? 'none'
    : (skills[0]?.score ?? 0) >= threshold + 2 || (workflows[0]?.score ?? 0) >= threshold + 2
      ? 'high'
      : 'low';
  const fallback = confidence === 'none' ? 'no-confident-match' : null;
  const alternatives = confidence === 'none'
    ? [
      'skillsforge catalog --search <text>',
      'skillsforge route --query <text> --include-explicit',
      'skillsforge workflows list --category <id>',
      'skillsforge lib update'
    ]
    : rankedSkills.slice(limit, limit + 3).map((item) => item.skill.id)
      .concat(rankedWorkflows.slice(limit, limit + 2).map((item) => item.workflow.id));
  return {
    ok: true,
    query,
    sessionHost,
    confidence,
    fallback,
    note: confidence === 'none'
      ? 'no confident match; refine the query, browse catalog --pack, or refresh lib update'
      : undefined,
    alternatives: alternatives.length ? alternatives : undefined,
    skills,
    workflows,
    needsConfirmation: true,
    policy: 'read-only recommendation; install, remove, and write actions require explicit confirmation'
  };
}

export function buildLibraryHtml(index, options = {}) {
  const countBy = (predicate) => index.skills.filter(predicate).length;
  const builderCount = countBy((skill) => skill.category === 'builder' || skill.id.startsWith('build-') || skill.id.startsWith('fullstack-'));
  const validationCount = countBy((skill) => skill.category === 'validation' || skill.id.startsWith('validate-'));
  const researchCount = countBy((skill) => skill.category === 'research' || skill.id.startsWith('research-'));
  const launchCount = countBy((skill) => ['growth', 'product', 'media'].includes(skill.category)
    || skill.id.startsWith('startup-')
    || skill.id.includes('launch')
    || skill.id.includes('demo'));
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
:root{color-scheme:light dark;--bg:#f6f8fa;--panel:#ffffff;--panel2:#f6f8fa;--line:#d0d7de;--text:#24292f;--muted:#57606a;--accent:#0969da;--ok:#1a7f37;--warn:#9a6700;--bad:#cf222e;--shadow:0 12px 30px rgb(27 31 36 / .08);--radius:8px}
@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--panel:#161b22;--panel2:#0d1117;--line:#30363d;--text:#e6edf3;--muted:#8b949e;--accent:#2f81f7;--ok:#3fb950;--warn:#d29922;--bad:#f85149;--shadow:0 12px 30px rgb(1 4 9 / .35)}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;overflow-x:hidden}button,input,select{font:inherit}.shell{display:grid;grid-template-columns:300px minmax(0,1fr);min-height:100dvh;max-width:100vw}.side{border-right:1px solid var(--line);padding:16px;background:var(--panel);position:sticky;top:0;height:100dvh;overflow:auto;min-width:0}.main{padding:18px;min-width:0}.brand{display:flex;align-items:center;gap:10px;margin-bottom:16px;min-width:0}.mark{width:30px;height:30px;border-radius:7px;background:linear-gradient(135deg,var(--accent),#1a7f37);box-shadow:inset 0 0 0 1px rgb(255 255 255 / .22);flex:0 0 auto}h1{font-size:18px;margin:0;letter-spacing:0}h2{font-size:14px;margin:18px 0 8px;letter-spacing:0}.label,.meta,.hint{color:var(--muted);font-size:12px}.stat{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.stat>div,.filter button,.quickbar button,.row,.detail,.panel,.select,.smallbtn,.dangerbtn{border:1px solid var(--line);border-radius:var(--radius);background:var(--panel)}.stat>div{padding:10px;min-width:0}.num{font:650 20px/1 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}.search,.select{width:100%;height:36px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--text);padding:0 10px;margin:10px 0;min-width:0}.filter,.action-row,.topbar,.quickbar,.viewbar{display:flex;flex-wrap:wrap;gap:6px;min-width:0}.filter button,.quickbar button,.smallbtn,.dangerbtn{color:var(--text);padding:6px 9px;cursor:pointer;min-height:32px;max-width:100%;white-space:nowrap}.quickbar{align-items:center;margin-bottom:10px}.quickbar .label{align-self:center;margin-right:2px}.smallbtn.primary{background:var(--accent);border-color:var(--accent);color:#fff}.dangerbtn{color:var(--bad)}button:disabled{opacity:.55;cursor:not-allowed}.filter button.active,.quickbar button.active,.viewbar button.active{border-color:var(--accent);color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}.topbar{align-items:center;margin-bottom:12px}.topbar .search{flex:1 1 260px;margin:0}.viewbar{margin-left:auto}.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,390px);gap:16px;min-width:0}.rows{display:grid;gap:8px;min-width:0}.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:10px;text-align:left;color:var(--text);cursor:pointer;min-width:0;box-shadow:none}.rows.table-mode .row{grid-template-columns:minmax(190px,1.5fr) minmax(110px,.8fr);align-items:start}.row:hover,.row.active{border-color:var(--accent)}.title{font-weight:650;overflow-wrap:anywhere}.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.chip{border:1px solid var(--line);border-radius:999px;padding:2px 7px;color:var(--muted);font-size:12px;max-width:100%;overflow-wrap:anywhere}.chip.good{color:var(--ok);border-color:color-mix(in srgb,var(--ok) 50%,var(--line))}.chip.warn{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 50%,var(--line))}.risk-high{color:var(--bad)}.risk-medium{color:var(--warn)}.risk-low{color:var(--ok)}.detail{padding:14px;position:sticky;top:18px;max-height:calc(100dvh - 36px);overflow:auto;min-width:0;box-shadow:var(--shadow)}.detail pre,.codebox{white-space:pre-wrap;word-break:break-word;background:var(--panel2);border:1px solid var(--line);border-radius:6px;padding:10px;max-width:100%;overflow:auto}.panel{padding:10px;margin-top:8px;min-width:0}.vibe-panel{background:linear-gradient(180deg,var(--panel),var(--panel2));box-shadow:var(--shadow)}.metric-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:8px}.metric{border:1px solid var(--line);border-radius:6px;padding:7px;background:var(--panel);min-width:0}.metric b{display:block;font:650 16px/1 ui-monospace,SFMono-Regular,Consolas,monospace}.split{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.empty{padding:18px;border:1px dashed var(--line);border-radius:var(--radius);color:var(--muted);background:var(--panel)}@media (prefers-reduced-motion:no-preference){.row,.filter button,.quickbar button,.smallbtn,.dangerbtn{transition:border-color 140ms cubic-bezier(.2,0,0,1),color 140ms cubic-bezier(.2,0,0,1),transform 120ms cubic-bezier(.2,0,0,1),box-shadow 180ms cubic-bezier(.2,0,0,1)}.row:active,.filter button:active,.quickbar button:active,.smallbtn:active,.dangerbtn:active{transform:translateY(1px)}}@media (max-width:940px){.shell{grid-template-columns:minmax(0,1fr)}.side{position:relative;height:auto;border-right:0;border-bottom:1px solid var(--line);width:100%;max-width:100vw}.main{padding:16px;width:100%;max-width:100vw}.grid{grid-template-columns:minmax(0,1fr)}.detail{position:relative;top:auto;max-height:none}.stat{grid-template-columns:repeat(4,minmax(0,1fr))}}@media (max-width:640px){.stat,.split,.metric-grid{grid-template-columns:minmax(0,1fr)}.filter button,.quickbar button{flex:1 1 100%;text-align:left}.topbar .smallbtn,.viewbar,.viewbar button{width:100%}.shell{min-width:0}}
</style>
</head>
<body>
<div class="shell">
  <aside class="side">
    <div class="brand"><div class="mark"></div><div><h1>SkillsForge Library</h1><div class="label">Session-aware local index</div></div></div>
    <div class="stat">
      <div><div class="num">${index.stats.skills}</div><div class="label">skills</div></div>
      <div><div class="num">${index.stats.workflows}</div><div class="label">workflows</div></div>
      <div><div class="num">${index.stats.sources}</div><div class="label">sources</div></div>
      <div><div class="num">${index.session.host ?? 'none'}</div><div class="label">session host</div></div>
    </div>
    <div id="settingsPanel" class="panel"><b>Settings</b><div class="meta">recommendThreshold ${index.settings?.recommendThreshold ?? LIBRARY_RECOMMEND_THRESHOLD} / theme ${escStatic(index.settings?.library?.theme ?? 'system')}</div><div class="hint">No external assets. Local-only read index.</div></div>
    <div id="vibeBuilderPanel" class="panel vibe-panel"><b>Vibe Builder</b><div class="hint">Build / Validate / Research / Launch</div><div class="metric-grid"><div class="metric"><b>${builderCount}</b><span class="label">build</span></div><div class="metric"><b>${validationCount}</b><span class="label">validate</span></div><div class="metric"><b>${researchCount}</b><span class="label">research</span></div><div class="metric"><b>${launchCount}</b><span class="label">launch</span></div></div></div>
    <input id="q" class="search" type="search" placeholder="Search skills, sources, triggers">
    <select id="sourceFilter" class="select" aria-label="Source filter"></select>
    <h2>Categories</h2>
    <div id="filters" class="filter"></div>
    <h2>Hosts</h2>
    <div id="hosts"></div>
  </aside>
  <main class="main">
    <div id="quickFilters" class="quickbar" aria-label="Quick filters"><span class="label">Quick</span><button class="active" data-quick="all">All</button><button data-quick="build">Build</button><button data-quick="validate">Validate</button><button data-quick="research">Research</button><button data-quick="launch">Launch</button></div>
    <div class="topbar"><input id="recommendQ" class="search" type="search" placeholder="Describe the task for skill and workflow recommendation"><button id="recommendBtn" class="smallbtn primary">Recommend</button><button id="resetBtn" class="smallbtn">Reset</button><span class="viewbar"><button id="viewModeList" class="smallbtn active" data-view="list">List</button><button id="viewModeTable" class="smallbtn" data-view="table">Table</button></span></div>
    <div class="grid">
      <section><div id="rows" class="rows"></div></section>
      <aside id="detail" class="detail"></aside>
    </div>
  </main>
</div>
<script id="skillsforge-data" type="application/json">${data}</script>
<script>
const data=JSON.parse(document.getElementById('skillsforge-data').textContent);
let category='all';let source='all';let quick='all';let viewMode='list';let selected=data.skills[0]?.key;let lastRecommendation=null;
const q=document.getElementById('q');const rows=document.getElementById('rows');const detail=document.getElementById('detail');const sourceFilter=document.getElementById('sourceFilter');
function esc(v){return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
const stopWords=new Set(['a','an','and','are','as','at','be','by','do','for','from','in','into','is','it','of','on','or','our','the','then','this','to','with','without']);
function tokens(v){return (String(v??'').toLowerCase().match(/[a-z0-9]+/g)||[]).filter(t=>!stopWords.has(t))}
function phrase(q,txt){const parts=tokens(txt);if(!parts.length||parts.length>q.length)return false;for(let i=0;i<=q.length-parts.length;i++){let ok=true;for(let j=0;j<parts.length;j++){if(q[i+j]!==parts[j]){ok=false;break}}if(ok)return true}return false}
function renderFilters(){const root=document.getElementById('filters');root.innerHTML=['all',...data.categories].map(c=>'<button class="'+(category===c?'active':'')+'" data-cat="'+esc(c)+'">'+esc(c)+'</button>').join('');root.onclick=e=>{if(e.target.dataset.cat){category=e.target.dataset.cat;lastRecommendation=null;render();renderFilters();}}}
function renderSources(){sourceFilter.innerHTML=['all',...data.sources].map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join('');sourceFilter.value=source;sourceFilter.onchange=()=>{source=sourceFilter.value;lastRecommendation=null;render();}}
function quickMatch(s){if(quick==='build')return s.category==='builder'||s.id.startsWith('build-')||s.id.startsWith('fullstack-')||s.id.includes('mcp')||s.id.includes('plugin');if(quick==='validate')return s.category==='validation'||s.id.startsWith('validate-')||s.id.includes('proof')||s.id.includes('audit');if(quick==='research')return s.category==='research'||s.id.startsWith('research-')||s.id.includes('source');if(quick==='launch')return ['growth','product','media'].includes(s.category)||s.id.startsWith('startup-')||s.id.includes('launch')||s.id.includes('demo');return true}
function syncQuick(){document.querySelectorAll('#quickFilters button[data-quick]').forEach(b=>b.classList.toggle('active',b.dataset.quick===quick))}
function syncView(){rows.className='rows '+(viewMode==='table'?'table-mode':'');document.querySelectorAll('.viewbar button[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===viewMode))}
function riskClass(skill){return skill.riskFlags.length>1?'risk-high':skill.riskFlags.length?'risk-medium':'risk-low'}
function filtered(){const text=q.value.toLowerCase();return data.skills.filter(s=>quickMatch(s)&&(category==='all'||s.category===category)&&(source==='all'||s.sourcePlugin===source)&&[s.id,s.description,s.category,s.sourcePlugin,s.sourcePath,...s.recommendedFor].join(' ').toLowerCase().includes(text));}
function statusChip(s){if(s.sessionInstalled)return '<span class="chip good">current session</span>';if(s.installedHosts.length)return '<span class="chip good">installed</span>';return '<span class="chip">available</span>'}
function render(){syncView();const list=lastRecommendation?lastRecommendation.skills.map(hit=>data.skills.find(s=>s.key===hit.key)).filter(Boolean):filtered();if(!list.find(s=>s.key===selected))selected=list[0]?.key;rows.innerHTML=list.length?list.map(s=>'<button class="row '+(s.key===selected?'active':'')+'" data-key="'+esc(s.key)+'"><span><div class="title">'+esc(s.id)+'</div><div class="meta">'+esc(s.category)+' / '+esc(s.sourcePlugin)+' / '+esc(s.maturity)+'</div><span class="chips">'+statusChip(s)+s.riskFlags.slice(0,2).map(r=>'<span class="chip warn">'+esc(r)+'</span>').join('')+'</span></span><span class="'+riskClass(s)+'">'+(s.riskFlags.length?'review':'clean')+'</span></button>').join(''):'<div class="empty">No skills match the current filters.</div>';renderDetail();}
function hostOptions(s){const installed=new Set(s.installedHosts);const hosts=data.hosts.filter(h=>h.detected||installed.has(h.id));const list=hosts.length?hosts:data.hosts;return list.map(h=>'<option value="'+esc(h.id)+'">'+esc(h.id)+(installed.has(h.id)?' installed':'')+'</option>').join('')}
function removalCommand(s,host){return 'skillsforge lib remove --host '+host+' --skill '+s.id+' --dry-run'}
function renderDetail(){const s=data.skills.find(x=>x.key===selected);if(!s){detail.innerHTML='<p>No skill selected.</p>';return}const rec=lastRecommendation?lastRecommendation.skills.find(r=>r.key===s.key):null;detail.innerHTML='<h2>'+esc(s.id)+'</h2><p>'+esc(s.description||'No description provided')+'</p><div class="chips"><span class="chip">'+esc(s.category)+'</span><span class="chip">'+esc(s.sourcePlugin)+'</span><span class="chip">'+esc(s.maturity)+'</span>'+statusChip(s)+'</div>'+(rec?'<h2>Recommendation score</h2><pre>'+esc(String(rec.score)+'\\n'+rec.reasons.join('\\n'))+'</pre>':'')+'<h2>Recommended for</h2><pre>'+esc(s.recommendedFor.join('\\n')||'No triggers')+'</pre><h2>Risk flags</h2><pre>'+esc(s.riskFlags.join('\\n')||'No obvious capability risk flags')+'</pre><h2>Installed hosts</h2><pre>'+esc(s.installedHosts.join('\\n')||'Not installed in detected host roots')+'</pre><h2>Removal check</h2><select id="removeHost" class="select">'+hostOptions(s)+'</select><div class="action-row"><button id="removePreview" class="smallbtn">Dry-run</button><button id="removeConfirm" class="dangerbtn">Remove</button></div><pre id="removeResult"></pre><h2>Source</h2><pre>'+esc(s.sourcePath)+'</pre>';bindRemoval(s)}
function bindRemoval(s){const host=document.getElementById('removeHost');const preview=document.getElementById('removePreview');const confirm=document.getElementById('removeConfirm');const out=document.getElementById('removeResult');const ui=data.ui||{};function show(value){out.textContent=typeof value==='string'?value:JSON.stringify(value,null,2)}function plan(){return {dryRun:true,command:removalCommand(s,host.value),apiEnabled:Boolean(ui.apiEnabled),allowMutations:Boolean(ui.allowMutations)}}show(plan());preview.onclick=async()=>{if(!ui.apiEnabled){show(plan());return}const res=await fetch('/api/remove',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({host:host.value,skill:s.id})});show(await res.json())};confirm.disabled=!ui.allowMutations;confirm.onclick=async()=>{if(!ui.allowMutations){show(plan());return}const typed=window.prompt('Type '+s.id+' to remove from '+host.value);if(typed!==s.id){show('confirmation mismatch');return}const res=await fetch('/api/remove',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({host:host.value,skill:s.id,yes:true})});show(await res.json())};host.onchange=()=>show(plan())}
function scoreSkill(text,s){const q=tokens(text);const qset=new Set(q);const stokens=tokens([s.id,s.description,s.category,s.sourcePlugin,s.origin,...s.recommendedFor,...s.notFor].join(' '));const hits=[...new Set(stokens.filter(t=>qset.has(t)))];let score=hits.length;const reasons=hits.slice(0,8).map(t=>'token:'+t);if(phrase(q,s.id)){score+=8;reasons.push('id-match')}if(qset.has(s.category)){score+=3;reasons.push('category-match')}if(data.session.host&&s.installedHosts.includes(data.session.host)){score+=2;reasons.push('session-installed')}else if(s.installedHosts.length){score+=1;reasons.push('installed-host')}if(s.riskFlags.length>1){score-=1;reasons.push('risk-review')}return {key:s.key,id:s.id,category:s.category,sourcePlugin:s.sourcePlugin,installedHosts:s.installedHosts,description:s.description,score,reasons}}
function scoreWorkflow(text,w,skillHits){const q=tokens(text);const qset=new Set(q);const wtokens=tokens([w.id,w.category,w.goal,w.qualityGate,...w.recommendedSkills,...w.recommendedAgents,...(w.commands||[])].join(' '));const hits=[...new Set(wtokens.filter(t=>qset.has(t)))];let score=hits.length;const reasons=hits.slice(0,8).map(t=>'token:'+t);if(phrase(q,w.id)){score+=8;reasons.push('id-match')}if(qset.has(w.category)){score+=3;reasons.push('category-match')}const matched=new Set(skillHits.map(s=>s.id));const overlap=w.recommendedSkills.filter(s=>matched.has(s)).length;if(overlap){score+=overlap;reasons.push('skill-overlap:'+overlap)}return {id:w.id,category:w.category,goal:w.goal,recommendedSkills:w.recommendedSkills,recommendedAgents:w.recommendedAgents,risk:w.risk,score,reasons}}
function localRecommend(text){const threshold=2;const skills=data.skills.map(s=>scoreSkill(text,s)).filter(s=>s.score>=threshold).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key)).slice(0,8);const workflows=data.workflows.map(w=>scoreWorkflow(text,w,skills)).filter(w=>w.score>=threshold).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,8);const confidence=!text.trim()||(!skills.length&&!workflows.length)?'none':(skills[0]?.score>=threshold+2||workflows[0]?.score>=threshold+2)?'high':'low';return {ok:true,query:text,sessionHost:data.session.host,confidence,note:confidence==='none'?'no confident match; refine the query or browse catalog':'',skills,workflows,policy:'read-only recommendation'}}
function renderRecommendation(result){lastRecommendation=result;selected=result.skills[0]?.key||selected;render();if(result.confidence==='none'||(!result.skills.length&&!result.workflows.length)){detail.innerHTML='<h2>No confident match</h2><p class="hint">'+esc(result.note||'Refine the query, or use catalog / route with --include-explicit.')+'</p><div class="empty">No skill or workflow cleared the confidence threshold. This is intentional - SkillsForge will not force a recommendation.</div>';return}const blocks=result.workflows.length?result.workflows.map(w=>'<div class="panel"><b>'+esc(w.id)+'</b><p>'+esc(w.goal)+'</p><div class="meta">'+esc(w.category)+' / '+esc(w.risk)+' / score '+esc(w.score)+'</div><pre>'+esc(w.reasons.join('\\n'))+'</pre></div>').join(''):'<div class="empty">No workflow matched this query.</div>';detail.innerHTML='<h2>Workflow recommendations</h2><p class="hint">'+esc(result.policy||'read-only recommendation')+' - confidence '+esc(result.confidence||'low')+'</p>'+blocks}
async function recommend(){const text=document.getElementById('recommendQ').value.trim();if(!text)return;const ui=data.ui||{};if(ui.apiEnabled){const res=await fetch('/api/recommend?query='+encodeURIComponent(text));renderRecommendation(await res.json());return}renderRecommendation(localRecommend(text))}
rows.onclick=e=>{const b=e.target.closest('button[data-key]');if(b){selected=b.dataset.key;render();}};q.oninput=()=>{lastRecommendation=null;render()};
document.getElementById('hosts').innerHTML=data.hosts.map(h=>'<div class="panel"><b>'+esc(h.id)+'</b><div class="meta">'+(h.detected?'detected':'missing')+' / '+esc(h.fidelity)+'</div><div class="hint">'+esc(h.skillsDir)+'</div></div>').join('');
document.getElementById('quickFilters').onclick=e=>{if(e.target.dataset.quick){quick=e.target.dataset.quick;lastRecommendation=null;syncQuick();render();}};
document.querySelector('.viewbar').onclick=e=>{if(e.target.dataset.view){viewMode=e.target.dataset.view;syncView();render();}};
document.getElementById('recommendBtn').onclick=recommend;document.getElementById('resetBtn').onclick=()=>{lastRecommendation=null;q.value='';document.getElementById('recommendQ').value='';category='all';source='all';quick='all';viewMode='list';renderFilters();renderSources();syncQuick();syncView();render()};
renderFilters();renderSources();render();
</script>
</body>
</html>
`;
}

export function buildAiIndexHtml(index) {
  const compact = {
    generatedAt: index.generatedAt,
    stats: index.stats,
    session: index.session,
    instruction: 'Use key, id, recommendedFor, notFor, category, sourcePlugin, installedHosts, sessionInstalled, and riskFlags to pick the smallest matching skill or workflow for this session. Prefer current-session installed skills when they fit. Do not execute write, remove, install, or shell actions without explicit user confirmation.',
    settings: index.settings,
    skills: index.skills.map((skill) => ({
      key: skill.key,
      id: skill.id,
      category: skill.category,
      sourcePlugin: skill.sourcePlugin,
      sourcePath: skill.sourcePath,
      installedHosts: skill.installedHosts,
      sessionInstalled: skill.sessionInstalled,
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
  const sourcePlugin = detectSourcePlugin(root, skill.directory, context.home);
  const category = skill.sidecar?.routing?.pack ?? context.packBySkill.get(skill.name) ?? 'unpacked';
  const installedHosts = context.hosts
    .filter((host) => context.installed.has(host.id, skill.name))
    .map((host) => host.id);
  const recommendedFor = (skill.sidecar?.routing?.triggers ?? []).slice(0, 6);
  return {
    id: skill.name,
    name: skill.name,
    description: skill.description,
    category,
    sourcePlugin,
    sourceRoot: displayPath(root, skill.sourceRoot ?? skill.directory, context.home),
    sourcePath: displayPath(root, skill.directory, context.home),
    installedHosts,
    sessionInstalled: context.session.host ? installedHosts.includes(context.session.host) : false,
    origin: skill.sidecar?.provenance?.source ?? 'unknown',
    maturity: skill.maturity,
    capabilities: summarizeCapabilities(skill.sidecar?.capabilities),
    riskFlags: riskFlags(skill.sidecar?.capabilities),
    recommendedFor: recommendedFor.length ? recommendedFor : compactDescription(skill.description),
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

async function buildHostInstallIndex(hosts, settings = {}) {
  const checks = new Map();
  const useCache = settings.library?.cacheHostChecks !== false;
  const entriesByDir = new Map();
  await Promise.all(hosts.map(async (host) => {
    const key = resolve(host.skillsDir);
    let names = entriesByDir.get(key);
    if (!names || !useCache) {
      names = new Set();
      try {
        const entries = await readdir(host.skillsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) names.add(entry.name);
        }
      } catch {
        names = new Set();
      }
      if (useCache) entriesByDir.set(key, names);
    }
    checks.set(host.id, names);
  }));
  return {
    has(hostId, skillName) {
      return checks.get(hostId)?.has(skillName) === true;
    }
  };
}

function detectSourcePlugin(root, directory, homeOption) {
  if (isInside(root, directory)) {
    const rel = relative(root, directory).replaceAll('\\', '/');
    const parts = rel.split('/');
    const pluginsIndex = parts.indexOf('plugins');
    if (pluginsIndex >= 0 && parts[pluginsIndex + 1]) return parts[pluginsIndex + 1];
  }
  const normalized = resolve(directory).replaceAll('\\', '/');
  const home = homeOption ? resolve(homeOption) : (process.env.USERPROFILE ? resolve(process.env.USERPROFILE) : null);
  const homeRel = home ? relativeDisplayPath(home, directory) ?? normalized : normalized;
  const cacheParts = homeRel.split('/');
  const cacheIndex = cacheParts.findIndex((part, index) => part === 'cache' && cacheParts[index - 1] === 'plugins');
  if (cacheIndex >= 0 && cacheParts[cacheIndex + 1] && cacheParts[cacheIndex + 2]) {
    return `${cacheParts[cacheIndex + 2]}@${cacheParts[cacheIndex + 1]}`;
  }
  if (homeRel.startsWith('.codex/skills/.system/')) return 'codex-system';
  if (homeRel.startsWith('.codex/skills/')) return 'user-codex';
  if (homeRel.startsWith('.agents/skills/')) return 'user-agents';
  if (homeRel.startsWith('.claude/skills/')) return 'claude-code';
  if (homeRel.startsWith('.cursor/skills/')) return 'cursor';
  if (homeRel.startsWith('.config/opencode/skills/')) return 'opencode';
  if (homeRel.startsWith('.zcode/skills/')) return 'zcode';
  if (homeRel.startsWith('.hermes/skills/')) return 'hermes';
  if (homeRel.startsWith('.gemini/skills/')) return 'gemini';
  return 'local';
}

function displayPath(root, directory, home) {
  const resolved = resolve(directory);
  const rootRel = relativeDisplayPath(root, resolved);
  if (rootRel !== null) return rootRel;
  const homeRel = home ? relativeDisplayPath(home, resolved) : null;
  if (homeRel !== null) return `~/${homeRel}`;
  return resolved.replaceAll('\\', '/');
}

function relativeDisplayPath(parent, child) {
  const parentPath = resolve(parent).replaceAll('\\', '/').replace(/\/+$/, '');
  const childPath = resolve(child).replaceAll('\\', '/');
  const parentKey = process.platform === 'win32' ? parentPath.toLowerCase() : parentPath;
  const childKey = process.platform === 'win32' ? childPath.toLowerCase() : childPath;
  if (childKey === parentKey) return '';
  const prefix = `${parentKey}/`;
  return childKey.startsWith(prefix) ? childPath.slice(parentPath.length + 1) : null;
}

function assignRecordKey() {
  const seen = new Map();
  return (record) => {
    const base = `${record.sourcePlugin}:${record.id}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return {
      ...record,
      key: count === 1 ? base : `${base}#${count}`
    };
  };
}

function detectSession(hosts, options = {}) {
  const envHost = String(options.sessionHost ?? process.env.SKILLSFORGE_SESSION_HOST ?? '').trim();
  const known = new Set(hosts.map((host) => host.id));
  if (envHost && known.has(envHost)) {
    const host = hosts.find((item) => item.id === envHost);
    return { host: envHost, label: host.label, source: 'explicit' };
  }
  const env = process.env;
  const inferred = [
    [env.CODEX_HOME || env.CODEX_SESSION_ID || env.CODEX_SANDBOX, 'codex'],
    [env.CLAUDECODE || env.CLAUDE_CONFIG_DIR, 'claude-code'],
    [env.CURSOR_TRACE_ID || env.CURSOR_AGENT, 'cursor'],
    [env.OPENCODE || env.OPENCODE_CONFIG_DIR, 'opencode'],
    [env.HERMES_HOME || env.HERMES_AGENT, 'hermes'],
    [env.GEMINI_API_KEY && env.GEMINI_CLI, 'gemini']
  ].find(([signal, id]) => signal && known.has(id));
  if (inferred) {
    const host = hosts.find((item) => item.id === inferred[1]);
    return { host: inferred[1], label: host.label, source: 'environment' };
  }
  const detected = hosts.find((host) => host.id === 'codex' && host.detected)
    ?? hosts.find((host) => host.detected)
    ?? null;
  return detected
    ? { host: detected.id, label: detected.label, source: 'detected-host' }
    : { host: null, label: null, source: 'none' };
}

function compactDescription(description) {
  const text = String(description ?? '').replace(/\s+/g, ' ').trim();
  return text ? [text.slice(0, 180)] : [];
}

function scoreLibrarySkill(query, skill, context = {}) {
  const queryList = tokenize(query);
  const queryTokens = new Set(queryList);
  const skillTokens = tokenize([
    skill.id,
    skill.description,
    skill.category,
    skill.sourcePlugin,
    skill.origin,
    ...(skill.recommendedFor ?? []),
    ...(skill.notFor ?? [])
  ].join(' '));
  const uniqueHits = [...new Set(skillTokens.filter((token) => queryTokens.has(token)))];
  const reasons = uniqueHits.slice(0, 8).map((token) => `token:${token}`);
  let score = uniqueHits.length;
  if (tokenPhraseMatches(queryList, skill.id)) {
    score += 8;
    reasons.push('id-match');
  }
  if (queryTokens.has(skill.category)) {
    score += 3;
    reasons.push('category-match');
  }
  if (context.sessionHost && skill.installedHosts.includes(context.sessionHost)) {
    score += 2;
    reasons.push('session-installed');
  } else if (skill.installedHosts.length > 0) {
    score += 1;
    reasons.push('installed-host');
  }
  if (skill.riskFlags.length > 1) {
    score -= 1;
    reasons.push('risk-review');
  }
  return { skill, score, reasons };
}

function scoreLibraryWorkflow(query, workflow, context = {}) {
  const queryList = tokenize(query);
  const queryTokens = new Set(queryList);
  const workflowTokens = tokenize([
    workflow.id,
    workflow.category,
    workflow.goal,
    workflow.qualityGate,
    ...(workflow.recommendedSkills ?? []),
    ...(workflow.recommendedAgents ?? []),
    ...(workflow.commands ?? [])
  ].join(' '));
  const uniqueHits = [...new Set(workflowTokens.filter((token) => queryTokens.has(token)))];
  const reasons = uniqueHits.slice(0, 8).map((token) => `token:${token}`);
  let score = uniqueHits.length;
  if (tokenPhraseMatches(queryList, workflow.id)) {
    score += 8;
    reasons.push('id-match');
  }
  if (queryTokens.has(workflow.category)) {
    score += 3;
    reasons.push('category-match');
  }
  const matchedSkills = new Set((context.skillMatches ?? []).map((skill) => skill.id));
  const overlap = (workflow.recommendedSkills ?? []).filter((skill) => matchedSkills.has(skill)).length;
  if (overlap > 0) {
    score += overlap;
    reasons.push(`skill-overlap:${overlap}`);
  }
  return { workflow, score, reasons };
}

function tokenize(text) {
  return (String(text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((token) => !STOP_WORDS.has(token));
}

function tokenPhraseMatches(queryTokens, phrase) {
  const phraseTokens = tokenize(phrase);
  if (phraseTokens.length === 0 || phraseTokens.length > queryTokens.length) return false;
  for (let index = 0; index <= queryTokens.length - phraseTokens.length; index += 1) {
    let matched = true;
    for (let offset = 0; offset < phraseTokens.length; offset += 1) {
      if (queryTokens[index + offset] !== phraseTokens[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
}

function clampLimit(value, fallback) {
  return Math.max(1, Math.min(50, Number(value) || fallback));
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'do',
  'for',
  'from',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'our',
  'the',
  'then',
  'this',
  'to',
  'with',
  'without'
]);

function safeScriptJson(value) {
  return JSON.stringify(value).replaceAll('</script', '<\\/script');
}

function escStatic(value) {
  return String(value ?? '').replace(/[&<>"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  })[char]);
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
