const params=new URLSearchParams(location.search);
let activeGen=params.get('gen')||'gen1';
let generators=[],visualRegistry=null,inventoryStatus=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function identityFields(g){
  if(g.manufacturer.toLowerCase().includes('cummins'))return [
    ['REQUIRED FIELD 01','ENGINE SERIAL NUMBER (ESN)'],
    ['REQUIRED FIELD 02','CPL / CONTROL PARTS LIST'],
    ['REQUIRED FIELD 03',`MODEL · ${g.model}`],
    ['PHYSICAL PROOF','CLEAR INSTALLED-ENGINE DATAPLATE PHOTO']
  ];
  return [
    ['REQUIRED FIELD 01',`MODEL · ${g.model}`],
    ['REQUIRED FIELD 02','EXACT SUFFIX / SPECIFICATION'],
    ['REQUIRED FIELD 03','SERIAL / PRODUCT NUMBER'],
    ['PHYSICAL PROOF','CLEAR INSTALLED-ENGINE IDENTIFICATION-PLATE PHOTO']
  ];
}

function renderTabs(){
  const box=document.querySelector('#machineTabs');
  box.innerHTML=generators.map(g=>`<button class="machine-tab ${g.id===activeGen?'active':''}" data-gen="${g.id}"><strong>${esc(g.name.toUpperCase())}</strong><span>${esc(g.model)} · ${esc(g.ratingKw)} kW</span></button>`).join('');
  box.querySelectorAll('[data-gen]').forEach(btn=>btn.onclick=()=>{activeGen=btn.dataset.gen;const url=new URL(location.href);url.searchParams.set('gen',activeGen);history.replaceState({},'',url);render()});
}

function renderSources(v){
  const box=document.querySelector('#officialSources');
  box.innerHTML=(v?.sources||[]).slice(0,3).map(s=>`<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener"><span>${esc(s.type)}</span><b>${esc(s.label)}</b><small>${esc(s.note)}</small></a>`).join('')||'<div class="field-row"><span>SOURCE</span><b>OEM SOURCE PATH NOT YET LINKED</b></div>';
}

function renderMetrics(){
  const c=inventoryStatus?.compatibilityCounts||{};
  document.querySelector('#metricTotal').textContent=inventoryStatus?.engineInventoryLinesIncluded??'—';
  document.querySelector('#metricVerified').textContent=c.VERIFIED??'—';
  document.querySelector('#metricFamily').textContent=c['FAMILY MATCH']??'—';
  document.querySelector('#metricCandidate').textContent=c.CANDIDATE??'—';
  document.querySelector('#metricUnverified').textContent=c.UNVERIFIED??'—';
  document.querySelector('#mappingRule').textContent=inventoryStatus?.rule||'Compatibility remains evidence-controlled.';
}

function render(){
  const g=generators.find(x=>x.id===activeGen)||generators[0];
  if(!g)return;
  activeGen=g.id;
  const v=visualRegistry?.generators?.[g.id]||null;
  const mapped=inventoryStatus?.generatorMappedCounts?.[g.id]??0;
  document.querySelector('#selectedMachine').textContent=`${g.name.toUpperCase()} · ${g.manufacturer} ${g.model} · ${g.ratingKw} kW`;
  document.querySelector('#selectedIdentity').textContent=g.identityStatus;
  document.querySelector('#identityTruth').textContent='MODEL CONTEXT RECORDED · DATAPLATE VERIFICATION PENDING';
  document.querySelector('#identityRequirement').textContent=v?.requiredIdentity||'Capture the installed-engine dataplate before exact verification.';
  document.querySelector('#visualTruth').textContent='FUNCTIONAL SCHEMATIC';
  document.querySelector('#visualRequirement').textContent=v?`${v.state}. ${v.integrationRule}`:'Exact visual authority remains pending.';
  document.querySelector('#compatTruth').textContent=`EVIDENCE CONTROLLED · ${mapped} MAPPED RECORD${mapped===1?'':'S'}`;
  document.querySelector('#identityFields').innerHTML=identityFields(g).map(x=>`<div class="field-row"><span>${esc(x[0])}</span><b>${esc(x[1])}</b></div>`).join('');
  document.querySelector('#blockerTitle').textContent=`${g.name} · ${g.model} identity evidence`;
  document.querySelector('#blockerText').textContent=v?.requiredIdentity||'Physical installed-engine identity evidence is required before exact verification.';
  document.querySelector('#sourceState').innerHTML=`<b>${esc(v?.state||'SOURCE STATE PENDING')}</b><br>${esc(v?.integrationRule||'Keep the training schematic until exact OEM applicability is confirmed.')}`;
  document.querySelector('#openEngine').href=`index.html?gen=${encodeURIComponent(g.id)}#home`;
  renderSources(v);renderTabs();renderMetrics();
}

async function load(){
  const [g,v,i]=await Promise.all([
    fetch('data/generators.json').then(r=>r.json()),
    fetch('data/oem-visual-sources.json').then(r=>r.json()),
    fetch('data/inventory-status.json').then(r=>r.json())
  ]);
  generators=g;visualRegistry=v;inventoryStatus=i;
  if(!generators.some(x=>x.id===activeGen))activeGen=generators[0]?.id||'gen1';
  render();
}

load().catch(err=>{document.querySelector('.flow-main').insertAdjacentHTML('afterbegin',`<div style="border:1px solid #7a3138;background:#231316;color:#e6bec2;padding:12px;font:800 10px ui-monospace,monospace">EVIDENCE FLOW LOAD ERROR · ${esc(err.message)}</div>`)});