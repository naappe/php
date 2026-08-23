const PAGE_TITLES={home:'Engine Overview',generators:'Generator Fleet',systems:'System Plates',parts:'Spare Parts',diagnostics:'Diagnostics',maintenance:'Maintenance',evidence:'Evidence'};
const SYSTEM_FLOWS={
  air:['Air cleaner','Turbo compressor','Charge-air cooler','Intake manifold','Cylinder','Exhaust manifold','Turbo turbine'],
  fuel:['Fuel supply','Primary filter','Transfer / injection pump','High-pressure distribution','Injector'],
  lube:['Oil sump','Lube-oil pump','Oil cooler','Full-flow filter','Main gallery','Bearings'],
  cooling:['Expansion tank','Circulating pump','Water jacket','Thermostat','Heat exchanger','Return'],
  combustion:['Cylinder head','Injector','Combustion space','Piston / rings','Piston pin'],
  crank:['Piston load','Connecting rod','Crankpin / big-end','Crankshaft','Main bearings','Flywheel'],
  valve:['Camshaft','Follower / tappet','Pushrod / linkage','Rocker mechanism','Valve / spring'],
  start:['Battery bank','Starter solenoid','Starter motor','Ring gear / flywheel','Crankshaft','Charging alternator'],
  control:['Sensors / senders','Harness / CAN','ECU / controller','Protection logic','Actuator / shutdown','Engine response'],
  service:['Joint face','Gasket / O-ring','Shaft seal','Hose / clamp','Service plug','Leak prevention']
};

async function load(){
  const[g,s,e,m]=await Promise.all([
    fetch('data/generators.json').then(r=>r.json()),
    fetch('data/systems.json').then(r=>r.json()),
    fetch('data/evidence.json').then(r=>r.json()),
    fetch('data/inventory-manifest.json').then(r=>r.json())
  ]);
  state.generators=g;state.systems=s;state.evidence=e;
  const batches=await Promise.all(m.files.map(f=>fetch(f).then(r=>r.json())));
  state.parts=batches.flat();
  state.activeGen=g[0]?.id||'gen1';state.scopeGen=state.activeGen;state.selectedGen=g[0]||null;state.selectedSystem='fuel';
  renderAll();renderParts();
}

function activeGenerator(){return state.generators.find(g=>g.id===state.activeGen)||state.generators[0]}
function selectedSystem(){return state.systems.find(s=>s.id===state.selectedSystem)||state.systems[0]}
function statusClass(v){return cclass(v)}
function genCard(g){return `<article class="card" data-gen="${g.id}"><span class="tag">${esc(g.name)}</span><h4>${esc(g.manufacturer)} ${esc(g.model)}</h4><p>${esc(g.identityStatus)}</p><div class="rating">${esc(g.ratingKw)} kW</div><span class="confidence ${statusClass(g.oemEvidenceStatus)}">${esc(g.oemEvidenceStatus)}</span></article>`}

function renderFleetTabs(){
  const g=activeGenerator();if(!g)return;
  document.querySelector('#fleetIdentity').textContent=`${g.name} · ${g.manufacturer} ${g.model}`;
  document.querySelector('#activeEvidence').innerHTML=`<span class="confidence ${statusClass(g.oemEvidenceStatus)}">${esc(g.oemEvidenceStatus)}</span>`;
  document.querySelector('#fleetTabs').innerHTML=state.generators.map(x=>`<button class="fleet-tab ${x.id===state.activeGen?'active':''}" data-fleet="${x.id}"><strong>${esc(x.name.toUpperCase())}</strong><span>${esc(x.model)}</span></button>`).join('');
  document.querySelectorAll('[data-fleet]').forEach(b=>b.onclick=()=>selectMachine(b.dataset.fleet));
}

function overviewHighlight(id){
  const common='fill="rgba(11,143,130,.10)" stroke="#0b8f82" stroke-width="3" stroke-dasharray="5 4"';
  if(id==='air')return `<path d="M150 113h112c31 0 30 33 58 33h230" ${common}/><circle cx="222" cy="150" r="42" ${common}/><rect x="160" y="202" width="112" height="70" rx="9" ${common}/>`;
  if(id==='fuel')return `<rect x="302" y="77" width="282" height="74" rx="10" ${common}/><path d="M320 151v80h248" ${common}/>`;
  if(id==='lube')return `<path d="M297 287h286v42H297Z" ${common}/><path d="M330 242v76M425 242v76M520 242v76" ${common}/>`;
  if(id==='cooling')return `<rect x="642" y="170" width="90" height="122" ${common}/><rect x="295" y="127" width="285" height="126" rx="12" ${common}/>`;
  if(id==='combustion')return `<rect x="306" y="126" width="268" height="118" rx="10" ${common}/>`;
  if(id==='crank')return `<path d="M304 246h275l18 73H286Z" ${common}/>`;
  if(id==='valve')return `<rect x="290" y="91" width="304" height="47" rx="8" ${common}/>`;
  if(id==='start')return `<circle cx="598" cy="287" r="46" ${common}/><circle cx="667" cy="298" r="35" ${common}/>`;
  if(id==='control')return `<rect x="566" y="75" width="112" height="67" rx="8" ${common}/>`;
  if(id==='service')return `<rect x="276" y="112" width="318" height="176" rx="16" ${common}/>`;
  return '';
}

function overviewSvg(activeId){
  const call=(n,id,cx,cy,tx,ty,label,side='left')=>{
    const active=id===activeId,boxX=side==='left'?12:716,lineX=side==='left'?122:716;
    return `<g class="overview-callout ${active?'is-active':''}" data-overview-system="${id}" role="button" tabindex="0"><path d="M${lineX} ${cy} L${tx} ${ty}" stroke="${active?'#0b8f82':'#708896'}" stroke-width="${active?2.2:1.2}"/><rect x="${boxX}" y="${cy-20}" width="132" height="40" fill="${active?'#e7f6f3':'#fbfbf8'}" stroke="${active?'#0b8f82':'#bfc8cc'}"/><circle cx="${boxX+18}" cy="${cy}" r="12" fill="${active?'#0b8f82':'#466b86'}"/><text x="${boxX+18}" y="${cy+3.5}" text-anchor="middle" font-size="8" font-weight="900" fill="#fff">${String(n).padStart(2,'0')}</text><text x="${boxX+38}" y="${cy+4}" font-size="9.5" font-weight="900" fill="#283842">${esc(label.toUpperCase())}</text></g>`;
  };
  let cyl='';for(let i=0;i<6;i++){const x=312+i*45;cyl+=`<rect x="${x}" y="135" width="30" height="102" rx="5" fill="#f8f8f6" stroke="#87949b"/><rect x="${x+5}" y="151" width="20" height="35" rx="3" fill="#fff" stroke="#b8c0c4"/>`;}
  return `<svg viewBox="0 0 860 390" aria-label="Interactive diesel engine system orientation"><defs><marker id="ovB" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#3b6f94"/></marker><marker id="ovT" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#0b8f82"/></marker></defs><g class="engine-drawing"><rect x="292" y="103" width="300" height="37" rx="6" fill="#dfe4e5" stroke="#687a83"/><rect x="298" y="122" width="288" height="126" rx="10" fill="#ecefed" stroke="#687a83"/>${cyl}<path d="M302 248h278l18 48H286Z" fill="#dfe4e5" stroke="#687a83"/><path d="M320 278h237" stroke="#4f6470" stroke-width="5"/><circle cx="355" cy="278" r="8" fill="#fff" stroke="#4f6470"/><circle cx="431" cy="278" r="8" fill="#fff" stroke="#4f6470"/><circle cx="507" cy="278" r="8" fill="#fff" stroke="#4f6470"/><rect x="248" y="82" width="65" height="45" fill="#edf2f2" stroke="#687a83"/><path d="M259 95h43M259 106h43M259 117h43" stroke="#7c8e97"/><circle cx="224" cy="148" r="26" fill="#e8f5f2" stroke="#0b8f82" stroke-width="4"/><path d="M224 127c-14 13-14 29 0 42 14-13 14-29 0-42Z" fill="none" stroke="#0b8f82" stroke-width="4"/><rect x="655" y="174" width="74" height="104" fill="#eaf2f4" stroke="#3b6f94"/>${[668,683,698,713].map(x=>`<path d="M${x} 188v76" stroke="#3b6f94"/>`).join('')}<rect x="570" y="81" width="90" height="52" rx="5" fill="#f0f2ef" stroke="#5e747f"/><path d="M580 93h70M580 105h55M580 117h63" stroke="#78909b"/><circle cx="607" cy="286" r="29" fill="#f3f4f2" stroke="#677b84"/><text x="607" y="291" text-anchor="middle" font-size="15" font-weight="900" fill="#677b84">S</text><circle cx="669" cy="296" r="25" fill="#f3f4f2" stroke="#677b84"/><text x="669" y="301" text-anchor="middle" font-size="14" font-weight="900" fill="#677b84">A</text><path d="M160 148h38" stroke="#3b6f94" stroke-width="6" marker-end="url(#ovB)"/><path d="M250 148h35v-29h272" stroke="#3b6f94" stroke-width="6" fill="none" marker-end="url(#ovB)"/><path d="M552 98h102" stroke="#9d6241" stroke-width="6" marker-end="url(#ovB)"/>${overviewHighlight(activeId)}</g>${call(1,'air',58,62,224,148,'Air & Exhaust','left')}${call(2,'fuel',58,126,344,109,'Fuel','left')}${call(3,'lube',58,190,348,282,'Lubrication','left')}${call(4,'cooling',58,254,655,220,'Cooling','left')}${call(5,'combustion',58,318,420,171,'Combustion','left')}${call(6,'crank',802,62,430,278,'Crank Mechanism','right')}${call(7,'valve',802,126,446,112,'Valve Train','right')}${call(8,'start',802,190,607,286,'Starting','right')}${call(9,'control',802,254,612,106,'Control','right')}${call(10,'service',802,318,560,240,'Service / Sealing','right')}<text x="430" y="372" text-anchor="middle" font-size="8" font-weight="800" fill="#707a80">FUNCTIONAL DIESEL ARCHITECTURE · CLICK A NUMBERED SYSTEM</text></svg>`;
}

function relatedSystemParts(systemId,genId=state.activeGen){
  const s=state.systems.find(x=>x.id===systemId);if(!s)return[];
  return state.parts.filter(p=>p.s===s.name&&(!genId||(p.g||[]).includes(genId)));
}
function componentSpareCount(systemId,label){
  const rows=relatedSystemParts(systemId);const words=String(label).toLowerCase().split(/\s+|\//).filter(w=>w.length>3&& !['primary','secondary','system'].includes(w));
  return rows.filter(p=>words.some(w=>(p.d+' '+p.m).toLowerCase().includes(w))).length;
}
function firstPartNumber(systemId){
  const rows=relatedSystemParts(systemId);const withPn=rows.find(p=>p.p&&p.p.length);return withPn?withPn.p[0]:null;
}
function evidenceDetail(g){
  if(g.oemEvidenceStatus==='VERIFIED')return 'Exact installed-engine/OEM evidence supports this context.';
  if(g.oemEvidenceStatus==='FAMILY MATCH')return 'Family/model evidence is linked; exact installed suffix, serial or configuration remains pending where noted.';
  if(g.oemEvidenceStatus==='CANDIDATE')return 'A plausible relationship exists, but stronger OEM or installed-engine evidence is still required.';
  if(g.oemEvidenceStatus==='NOT COMPATIBLE')return 'Available evidence excludes this relationship.';
  return 'Insufficient exact engineering evidence is linked for this installed engine context.';
}

function renderSystemPanel(id){
  const s=state.systems.find(x=>x.id===id);if(!s)return;state.selectedSystem=id;
  const p=plateProfile(id),g=activeGenerator(),calls=p.callouts||[],fails=String(p.fail||'').split(' · '),pn=firstPartNumber(id);
  document.querySelector('#panelSystemNo').textContent=String(state.systems.indexOf(s)+1).padStart(2,'0');
  document.querySelector('#panelSystemTitle').textContent=s.name;
  const ev=document.querySelector('#panelEvidence');ev.className=`evidence-badge ${statusClass(g.oemEvidenceStatus)}`;ev.textContent=g.oemEvidenceStatus;
  document.querySelector('#panelPartRef').textContent=pn?`RELATED P/N ${pn}`:'RELATED P/N — EVIDENCE PENDING';
  document.querySelector('#panelPurpose').textContent=p.purpose;
  document.querySelector('#panelFlow').innerHTML=(SYSTEM_FLOWS[id]||[]).map((x,i)=>`${i?'<span class="flow-arrow">→</span>':''}<span class="flow-node">${esc(x)}</span>`).join('');
  const rows=calls.slice(0,6).map((c,i)=>{const count=componentSpareCount(id,c[0]);return `<div class="component-row"><div>${String(i+1).padStart(2,'0')}</div><div><b>${esc(c[0])}</b></div><div><span>${esc(c[1])}</span></div><div><span>${esc(fails[i%Math.max(fails.length,1)]||'Inspect condition')}</span></div><div><button class="spare-link" data-panel-spares="${id}">${count?count+' rec.':'View'}</button></div></div>`}).join('');
  document.querySelector('#panelComponents').innerHTML=`<div class="component-row head"><div>ID</div><div>COMPONENT</div><div>FUNCTION</div><div>FAILURE CLUE</div><div>SPARES</div></div>${rows}`;
  document.querySelector('#panelEvidenceDetail').textContent=evidenceDetail(g);
  document.querySelector('#openSelectedPlate').onclick=()=>openSystemPage(id);
  document.querySelectorAll('[data-panel-spares]').forEach(b=>b.onclick=()=>filterPanelSpares(b.dataset.panelSpares));
}

function renderOverviewCanvas(previewId=state.selectedSystem){
  document.querySelector('#overviewCanvas').innerHTML=overviewSvg(previewId);
  document.querySelectorAll('[data-overview-system]').forEach(el=>{
    el.addEventListener('mouseenter',()=>renderOverviewCanvas(el.dataset.overviewSystem));
    el.addEventListener('mouseleave',()=>renderOverviewCanvas(state.selectedSystem));
    el.addEventListener('click',()=>{state.selectedSystem=el.dataset.overviewSystem;renderOverviewCanvas(state.selectedSystem);renderSystemPanel(state.selectedSystem)});
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();state.selectedSystem=el.dataset.overviewSystem;renderOverviewCanvas(state.selectedSystem);renderSystemPanel(state.selectedSystem)}});
  });
}

function renderOverview(){
  const g=activeGenerator();if(!g)return;
  document.querySelector('#contextModel').textContent=`${g.manufacturer} ${g.model}`;document.querySelector('#contextGen').textContent=`· ${g.name.toUpperCase()}`;
  document.querySelector('#overviewRating').textContent=`${g.ratingKw} kW`;document.querySelector('#overviewIdentity').textContent=g.identityStatus;
  document.querySelector('#overviewNote').textContent=g.note;
  renderOverviewCanvas();renderSystemPanel(state.selectedSystem);
  document.querySelector('#openAllSystems').onclick=()=>{state.scopeGen=g.id;showPage('systems');renderScope();renderInfographics()};
  document.querySelector('#openMachineParts').onclick=()=>filterToGenerator(g.id);
}

function selectMachine(id){const g=state.generators.find(x=>x.id===id);if(!g)return;state.activeGen=id;state.scopeGen=id;state.selectedGen=g;renderFleetTabs();renderOverview();renderScope();renderInfographics();if(document.querySelector('#genFilter'))document.querySelector('#genFilter').value='all'}

function scopeContext(){if(state.scopeGen==='all')return{title:'Common diesel architecture',note:'Common functional architecture. Select an installed generator for persistent model context.'};const g=state.generators.find(x=>x.id===state.scopeGen);return{title:`${g.name} · ${g.manufacturer} ${g.model}`,note:`${g.oemEvidenceStatus} context. The plate remains schematic until model-specific OEM drawings are loaded.`}}
function renderScope(){const c=scopeContext();document.querySelector('#scopeTitle').textContent=c.title;document.querySelector('#scopeNote').textContent=c.note;document.querySelector('#scopeButtons').innerHTML=`<button class="scope-btn ${state.scopeGen==='all'?'active':''}" data-scope="all">Common</button>`+state.generators.map(g=>`<button class="scope-btn ${state.scopeGen===g.id?'active':''}" data-scope="${g.id}">${esc(g.name)}</button>`).join('');document.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{state.scopeGen=b.dataset.scope;renderScope();renderInfographics()})}
function renderInfographics(){document.querySelector('#infographicBoard').innerHTML=state.systems.map((s,i)=>{const p=plateProfile(s.id);return `<article class="tech-plate" id="plate-${s.id}"><div class="plate-head"><div class="plate-title"><span class="plate-no">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(s.name)}</h3><div class="plate-purpose">${esc(p.purpose)}</div></div></div><span class="module-count">${s.modules.length} MODULES</span></div><div class="plate-body"><div class="plate-visual">${plateSvg(s,false)}</div><div class="plate-legend">${legendHtml(s)}</div></div><div class="plate-foot"><div class="failure-line"><b>Failure clues:</b> ${esc(p.fail)}</div><button class="primary" data-open-system="${s.id}">OPEN TRAINING PLATE</button></div></article>`}).join('');document.querySelectorAll('[data-open-system]').forEach(b=>b.onclick=()=>openSystem(b.dataset.openSystem))}

function renderAll(){
  renderFleetTabs();renderOverview();renderScope();renderInfographics();
  document.querySelector('#generatorGrid').innerHTML=state.generators.map(genCard).join('');document.querySelectorAll('[data-gen]').forEach(el=>el.onclick=()=>openGenerator(el.dataset.gen));
  document.querySelector('#diagGrid').innerHTML=diagnostic.map(d=>`<article class="diag-card" data-diag="${d.spn}"><span class="tag">SPN ${d.spn}</span><h4>${esc(d.name)}</h4><div class="mini-flow">${d.nodes.map((n,i)=>`${i?'<span class="arrow">→</span>':''}<span class="node">${esc(n)}</span>`).join('')}</div><p class="source">${esc(d.note)}</p></article>`).join('');document.querySelectorAll('[data-diag]').forEach(b=>b.onclick=()=>openDiagnostic(b.dataset.diag));
  document.querySelector('#maintGrid').innerHTML=maintenance.map((m,i)=>`<article class="maint-card" data-maint="${i}"><span class="tag">${esc(state.systems.find(s=>s.id===m.system)?.name||m.system)}</span><h4>${esc(m.title)}</h4><div class="mini-flow">${m.items.map(n=>`<span class="node">${esc(n)}</span>`).join('')}</div></article>`).join('');document.querySelectorAll('[data-maint]').forEach(b=>b.onclick=()=>openMaintenance(Number(b.dataset.maint)));
  const src=state.evidence.sources[0];document.querySelector('#evidenceList').innerHTML=`<article class="evidence"><span class="confidence ${statusClass(src.confidence)}">${esc(src.confidence)}</span><h4>${esc(src.manufacturer)} · ${esc(src.documentNumber)}</h4><p class="source">${esc(src.documentType)} · ${esc(src.revision)}<br>${esc(src.applicability)}</p>${src.facts.map(f=>`<div class="fact"><b>${esc(f.topic)}</b><span>${esc(f.value)}${f.condition?'<br><em>'+esc(f.condition)+'</em>':''}<br>Reference: page ${esc(f.page||f.pages)}</span></div>`).join('')}</article>`;
  document.querySelector('#genFilter').innerHTML='<option value="all">All generators / unassigned</option>'+state.generators.map(g=>`<option value="${g.id}">${esc(g.name)} · ${esc(g.model)}</option>`).join('');
  document.querySelector('#systemFilter').innerHTML='<option value="all">All systems</option>'+[...new Set(state.parts.map(p=>p.s))].sort().map(s=>`<option>${esc(s)}</option>`).join('');
  document.querySelector('#invTotal').textContent=state.parts.length;document.querySelector('#invFamily').textContent=state.parts.filter(p=>p.c==='FAMILY MATCH').length;document.querySelector('#invCandidate').textContent=state.parts.filter(p=>p.c==='CANDIDATE').length;document.querySelector('#invUnverified').textContent=state.parts.filter(p=>p.c==='UNVERIFIED').length;
}

function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.querySelector('#page-'+id).classList.add('active');document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));document.querySelector('#pageTitle').textContent=PAGE_TITLES[id]||'Engine Technical Console';window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>showPage(b.dataset.page));

function openSystemPage(id){state.scopeGen=state.activeGen;showPage('systems');renderScope();renderInfographics();setTimeout(()=>document.querySelector('#plate-'+id)?.scrollIntoView({behavior:'smooth',block:'start'}),80)}
function openGenerator(id){const g=state.generators.find(x=>x.id===id);if(!g)return;state.activeGen=id;state.scopeGen=id;state.selectedGen=g;renderFleetTabs();renderOverview();showPage('generators');document.querySelector('#selectedGenTitle').textContent=`${g.name} · ${g.manufacturer} ${g.model}`;document.querySelector('#selectedGenText').innerHTML=`${g.ratingKw} kW · <b>${esc(g.oemEvidenceStatus)}</b><br>${esc(g.note)}`;document.querySelector('#genActions').innerHTML='<button class="primary" id="viewGenParts">MAPPED SPARE PARTS</button><button class="secondary" id="studyGenSystems">SYSTEM PLATES</button>';document.querySelector('#viewGenParts').onclick=()=>filterToGenerator(g.id);document.querySelector('#studyGenSystems').onclick=()=>{showPage('systems');renderScope();renderInfographics()};document.querySelector('#genSystemPath').innerHTML=state.systems.map((s,i)=>`<button data-gsys="${s.id}">${String(i+1).padStart(2,'0')} · ${esc(s.name)}</button>`).join('');document.querySelectorAll('[data-gsys]').forEach(b=>b.onclick=()=>openSystemPage(b.dataset.gsys))}

function drawerContext(){const c=scopeContext();return `<span class="tag">${esc(c.title)}</span><p class="source" style="margin-top:7px">${esc(c.note)}</p>`}
function openSystem(id){const s=state.systems.find(x=>x.id===id),p=plateProfile(id);if(!s)return;openDrawer(`<div class="eyebrow">SYSTEM TRAINING PLATE</div><h3>${esc(s.name)}</h3>${drawerContext()}<div class="drawer-grid"><div class="drawer-plate">${plateSvg(s,true)}</div><div class="drawer-legend">${legendHtml(s)}</div></div><div class="mini"><div><small>SYSTEM PURPOSE</small><b>${esc(p.purpose)}</b></div><div><small>FAILURE CLUES</small><b>${esc(p.fail)}</b></div></div><h4>Modules</h4><div class="module-list">${s.modules.map((m,i)=>`<button class="module" data-drawer-module="${i}"><span class="module-icon">${i+1}</span><span>${esc(m)}</span></button>`).join('')}</div><div class="learning-note" style="margin-top:12px"><b>Training use:</b> orientation, component sequence and diagnostic thinking. Use engine-specific OEM literature for exact installation and service values.</div>`);document.querySelectorAll('[data-drawer-module]').forEach(b=>b.onclick=()=>openModule(id,s.modules[Number(b.dataset.drawerModule)]))}
function openModule(id,m){const s=state.systems.find(x=>x.id===id),p=plateProfile(id);const key=String(m).toLowerCase().split(/[ /-]/)[0];const related=state.parts.filter(x=>x.s===s.name&&(String(x.m).toLowerCase().includes(key)||String(x.d).toLowerCase().includes(key)));openDrawer(`<div class="eyebrow">${esc(s.name)} · MODULE</div><h3>${esc(m)}</h3>${drawerContext()}<div class="drawer-grid"><div class="drawer-plate">${plateSvg(s,true,m)}</div><div class="drawer-legend">${legendHtml(s)}</div></div><div class="mini"><div><small>RELATED SPARE RECORDS</small><b>${related.length}</b></div><div><small>SYSTEM FAILURE CLUES</small><b>${esc(p.fail)}</b></div></div><div class="learning-note"><b>Learning sequence:</b> locate → understand load/flow → recognize failure effect → identify spare → check evidence.</div>${related.length?`<div class="path" style="margin-top:12px"><button onclick="closeDrawer();filterToSystem('${esc(s.name)}')">RELATED SPARE PARTS</button></div>`:''}`)}

function filterToGenerator(id){showPage('parts');document.querySelector('#genFilter').value=id;document.querySelector('#systemFilter').value='all';document.querySelector('#confidenceFilter').value='all';document.querySelector('#partSearch').value='';renderParts()}
function filterToSystem(name){showPage('parts');document.querySelector('#systemFilter').value=name;document.querySelector('#genFilter').value='all';document.querySelector('#confidenceFilter').value='all';document.querySelector('#partSearch').value='';renderParts()}
function filterPanelSpares(id){const s=state.systems.find(x=>x.id===id);showPage('parts');document.querySelector('#genFilter').value=state.activeGen;document.querySelector('#systemFilter').value=s?.name||'all';document.querySelector('#confidenceFilter').value='all';document.querySelector('#partSearch').value='';renderParts()}
function renderParts(){if(!state.parts.length)return;const q=document.querySelector('#partSearch').value.toLowerCase().trim(),g=document.querySelector('#genFilter').value,s=document.querySelector('#systemFilter').value,c=document.querySelector('#confidenceFilter').value;let rows=state.parts.filter(p=>{const hay=(p.id+' '+p.d+' '+(p.p||[]).join(' ')+' '+p.s+' '+p.m).toLowerCase();if(q&&!hay.includes(q))return false;if(g!=='all'&&!(p.g||[]).includes(g))return false;if(s!=='all'&&p.s!==s)return false;if(c!=='all'&&p.c!==c)return false;return true});rows.sort((a,b)=>a.s.localeCompare(b.s)||a.d.localeCompare(b.d));document.querySelector('#resultText').textContent=`Showing ${rows.length} of ${state.parts.length} engine spare-part records`;document.querySelector('#partRows').innerHTML=rows.length?rows.map(p=>`<div class="part-row" data-part="${esc(p.id)}"><div class="part-id">${esc(p.id)}</div><div class="part-desc">${esc(p.d)}<small>${p.p?.length?'P/N '+esc(p.p.join(' / ')):'P/N not detected'}</small></div><div>${esc(p.s)}<div class="source">${esc(p.m)}</div></div><div><span class="confidence ${statusClass(p.c)}">${esc(p.c)}</span></div><div class="genchips">${p.g?.length?p.g.map(x=>`<span class="genchip">${esc(genName(x))}</span>`).join(''):'<span class="source">Unassigned</span>'}</div></div>`).join(''):'<div class="empty">No spare parts match these filters.</div>';document.querySelectorAll('[data-part]').forEach(el=>el.onclick=()=>openPart(el.dataset.part))}
function openPart(id){const p=state.parts.find(x=>x.id===id),sys=state.systems.find(s=>s.name===p.s);const gens=p.g?.length?p.g.map(genName).join('<br>'):'No generator mapping yet';openDrawer(`<div class="eyebrow">STORE ITEM ${esc(p.id)}</div><h3>${esc(p.d)}</h3><span class="confidence ${statusClass(p.c)}">${esc(p.c)}</span>${sys?`<div class="drawer-grid"><div class="drawer-plate">${plateSvg(sys,true,p.m)}</div><div class="drawer-legend">${legendHtml(sys)}</div></div>`:''}<div class="mini"><div><small>PART NUMBER</small><b>${p.p?.length?'P/N '+esc(p.p.join(' / ')):'Not detected'}</b></div><div><small>SYSTEM</small><b>${esc(p.s)}</b></div><div><small>MODULE</small><b>${esc(p.m)}</b></div><div><small>ENGINE APPLICATION</small><b>${gens}</b></div></div><div class="learning-note"><b>Compatibility confidence:</b> ${esc(confMeaning[p.c]||'Evidence state not defined.')}<br><br>Stock quantity is intentionally excluded from this training interface.</div>`)}
function openDiagnostic(spn){const d=diagnostic.find(x=>x.spn===spn),s=state.systems.find(x=>x.id===d.system);openDrawer(`<div class="eyebrow">DIAGNOSTIC PATH · SPN ${esc(d.spn)}</div><h3>${esc(d.name)}</h3>${s?`<div class="drawer-grid"><div class="drawer-plate">${plateSvg(s,true)}</div><div class="drawer-legend">${legendHtml(s)}</div></div>`:''}<div class="mini-flow">${d.nodes.map((n,i)=>`${i?'<span class="arrow">→</span>':''}<span class="node">${esc(n)}</span>`).join('')}</div><div class="learning-note" style="margin-top:12px">${esc(d.note)}</div>`)}
function openMaintenance(i){const m=maintenance[i],s=state.systems.find(x=>x.id===m.system);openDrawer(`<div class="eyebrow">MAINTENANCE RELATIONSHIP</div><h3>${esc(m.title)}</h3>${s?`<div class="drawer-grid"><div class="drawer-plate">${plateSvg(s,true)}</div><div class="drawer-legend">${legendHtml(s)}</div></div>`:''}<div class="module-list">${m.items.map((x,j)=>`<div class="module"><span class="module-icon">${j+1}</span><span>${esc(x)}</span></div>`).join('')}</div><div class="learning-note" style="margin-top:12px">Intervals, torque values, clearances and consumable specifications must come from the correct engine-specific service literature.</div>`)}
function openDrawer(html){document.querySelector('#drawerBody').innerHTML=html;document.querySelector('#drawer').classList.add('open');document.querySelector('#drawerback').classList.add('open')}
function closeDrawer(){document.querySelector('#drawer').classList.remove('open');document.querySelector('#drawerback').classList.remove('open')}
document.querySelector('#closeDrawer').onclick=closeDrawer;document.querySelector('#drawerback').onclick=closeDrawer;

['partSearch','genFilter','systemFilter','confidenceFilter'].forEach(id=>document.querySelector('#'+id).addEventListener(id==='partSearch'?'input':'change',renderParts));
document.querySelector('#resetFilters').onclick=()=>{document.querySelector('#partSearch').value='';document.querySelector('#genFilter').value='all';document.querySelector('#systemFilter').value='all';document.querySelector('#confidenceFilter').value='all';renderParts()};
document.querySelector('#globalSearch').addEventListener('keydown',e=>{if(e.key!=='Enter')return;const q=e.target.value.trim();if(!q)return;const gen=state.generators.find(g=>(g.name+' '+g.manufacturer+' '+g.model).toLowerCase().includes(q.toLowerCase()));if(gen){selectMachine(gen.id);showPage('home');return}const sys=state.systems.find(s=>(s.name+' '+s.modules.join(' ')).toLowerCase().includes(q.toLowerCase()));if(sys){state.selectedSystem=sys.id;showPage('home');renderOverview();return}showPage('parts');document.querySelector('#partSearch').value=q;renderParts()});
load().catch(err=>document.querySelector('.content').insertAdjacentHTML('afterbegin',`<div class="warningline"><b>LOAD ERROR</b><span>${esc(err.message)}</span></div>`));