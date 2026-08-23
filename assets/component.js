const COMPONENT_FLOWS={
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

const qs=new URLSearchParams(location.search);
const requestedPart=qs.get('id');
const requestedGen=qs.get('gen');

function partStatusClass(v){return v==='VERIFIED'?'verified':v==='FAMILY MATCH'?'family':v==='CANDIDATE'?'candidate':v==='NOT COMPATIBLE'?'incompatible':'unverified'}
function evidenceText(v){
  if(v==='VERIFIED')return 'Exact OEM / installed-engine evidence confirms this compatibility relationship.';
  if(v==='FAMILY MATCH')return 'Family or model-level evidence supports the relationship, but exact installed suffix, CPL, serial or configuration remains pending where noted.';
  if(v==='CANDIDATE')return 'The description or part-number context suggests a relationship, but stronger OEM evidence is still required.';
  if(v==='NOT COMPATIBLE')return 'Available evidence excludes this part from the selected engine application.';
  return 'No sufficient engineering evidence is linked yet to confirm this part for an installed engine.';
}
function machineForPart(p){
  if(requestedGen&&state.generators.some(g=>g.id===requestedGen))return state.generators.find(g=>g.id===requestedGen);
  if(p.g?.length)return state.generators.find(g=>g.id===p.g[0])||state.generators[0];
  return state.generators[0];
}
function systemForPart(p){return state.systems.find(s=>s.name===p.s)}
function systemQuery(sys,gen,hash){return `index.html?gen=${encodeURIComponent(gen.id)}${sys?`&system=${encodeURIComponent(sys.id)}`:''}#${hash}`}
function partApplication(p){
  if(!p.g?.length)return 'UNASSIGNED · VERIFY APPLICATION';
  return p.g.map(id=>{const g=state.generators.find(x=>x.id===id);return g?`${g.name} · ${g.model}`:id}).join(' / ');
}
function primaryPn(p){return p.p?.length?p.p.join(' / '):'NOT DETECTED'}
function relatedParts(p,sys){
  if(!sys)return[];
  const same=state.parts.filter(x=>x.id!==p.id&&x.s===p.s);
  const sameModule=same.filter(x=>String(x.m).toLowerCase()===String(p.m).toLowerCase());
  const other=same.filter(x=>!sameModule.includes(x));
  return [...sameModule,...other].slice(0,8);
}
function renderFlow(sys){return (COMPONENT_FLOWS[sys?.id]||[]).map((n,i)=>`${i?'<span class="flow-arrow">→</span>':''}<span class="flow-node">${esc(n)}</span>`).join('')}
function renderFunctions(sys){
  if(!sys)return '<div class="function-row"><span class="id">—</span><b>NO SYSTEM</b><span>System mapping is not available.</span></div>';
  const profile=plateProfile(sys.id),calls=profile.callouts||[];
  return calls.slice(0,6).map((c,i)=>`<div class="function-row"><span class="id">${String(i+1).padStart(2,'0')}</span><b>${esc(c[0].toUpperCase())}</b><span>${esc(c[1])}</span></div>`).join('');
}
function renderFailures(sys){
  if(!sys)return '<span class="failure-pill">SYSTEM MAPPING REQUIRED</span>';
  const items=String(plateProfile(sys.id).fail||'Inspect system condition').split(' · ');
  return items.map(x=>`<span class="failure-pill">${esc(x.toUpperCase())}</span>`).join('');
}
function renderRelated(p,sys,gen){
  const rows=relatedParts(p,sys),box=document.querySelector('#relatedParts');
  if(!rows.length){box.innerHTML='<div class="empty-related">No additional related records are classified under this system yet.</div>';return;}
  box.innerHTML=rows.map(r=>`<a class="related-card" href="component.html?id=${encodeURIComponent(r.id)}&gen=${encodeURIComponent(gen.id)}"><span class="pn">${r.p?.length?'P/N '+esc(r.p.join(' / ')):'STORE '+esc(r.id)}</span><b>${esc(r.d)}</b><small>${esc(r.m)} · ${esc(r.c)}</small><span class="view">VIEW →</span></a>`).join('');
}
function renderComponent(p){
  const gen=machineForPart(p),sys=systemForPart(p),profile=sys?plateProfile(sys.id):null;
  state.activeGen=gen?.id||'gen1';
  document.title=`${primaryPn(p)} · ${p.d} · Gulhifalhu Engine Console`;
  document.querySelector('#headerMachine').textContent=gen?`${gen.name.toUpperCase()} · ${gen.manufacturer} ${gen.model} · ${gen.ratingKw} kW`:'ENGINE CONTEXT UNAVAILABLE';
  document.querySelector('#headerSystem').textContent=`SYSTEM: ${sys?sys.name.toUpperCase():'UNASSIGNED'}`;
  document.querySelector('#headerPn').textContent=`P/N ${primaryPn(p)}`;
  document.querySelector('#plateSystem').textContent=sys?sys.name:'SYSTEM UNASSIGNED';
  document.querySelector('#plateModule').textContent=p.m||'MODULE UNASSIGNED';
  document.querySelector('#componentIllustration').innerHTML=sys?plateSvg(sys,true,p.m):'<div class="error">No engine-system plate is mapped to this record.</div>';
  document.querySelector('#partNumber').textContent=`P/N ${primaryPn(p)}`;
  document.querySelector('#partName').textContent=p.d;
  const badge=document.querySelector('#partStatus');badge.textContent=p.c;badge.className=`status-badge ${partStatusClass(p.c)}`;
  document.querySelector('#partFamily').textContent=partApplication(p);
  document.querySelector('#partModule').textContent=p.m||'UNASSIGNED';
  document.querySelector('#storeItem').textContent=p.id;
  document.querySelector('#evidenceState').textContent=p.c;
  const msg=document.querySelector('#evidenceMessage');msg.textContent=evidenceText(p.c);msg.className=`evidence-message ${partStatusClass(p.c)}`;
  document.querySelector('#systemFlow').innerHTML=renderFlow(sys);
  document.querySelector('#functionRows').innerHTML=renderFunctions(sys);
  document.querySelector('#failureRows').innerHTML=renderFailures(sys);
  document.querySelector('#compatibilityMeaning').textContent=confMeaning[p.c]||evidenceText(p.c);
  renderRelated(p,sys,gen);

  const systemHref=systemQuery(sys,gen,'systems'),partsHref=systemQuery(sys,gen,'parts');
  document.querySelector('#backEngineTop').href=systemQuery(null,gen,'home');
  document.querySelector('#backSystem').href=systemHref;
  document.querySelector('#backSystem').textContent=`← BACK TO ${sys?sys.name.toUpperCase():'ENGINE SYSTEMS'}`;
  document.querySelector('#viewEvidence').href=systemQuery(sys,gen,'evidence');
  document.querySelector('#viewSpares').href=partsHref;
  document.querySelector('#goDiagnostics').href=systemQuery(sys,gen,'diagnostics');
  document.querySelector('#goMaintenance').href=systemQuery(sys,gen,'maintenance');
  document.querySelector('#goSpares').href=partsHref;
  document.querySelector('#goEngine').href=systemQuery(null,gen,'home');
  document.querySelector('#allRelated').href=partsHref;
}

async function loadComponent(){
  if(!requestedPart)throw new Error('No store item was supplied. Open a spare part from the main Parts library.');
  const[g,s,e,m]=await Promise.all([
    fetch('data/generators.json').then(r=>r.json()),
    fetch('data/systems.json').then(r=>r.json()),
    fetch('data/evidence.json').then(r=>r.json()),
    fetch('data/inventory-manifest.json').then(r=>r.json())
  ]);
  state.generators=g;state.systems=s;state.evidence=e;
  const batches=await Promise.all(m.files.map(f=>fetch(f).then(r=>r.json())));state.parts=batches.flat();
  const p=state.parts.find(x=>x.id===requestedPart);
  if(!p)throw new Error(`Store item ${requestedPart} was not found in the engine spare-parts library.`);
  renderComponent(p);
}

loadComponent().catch(err=>{document.querySelector('.component-main').innerHTML=`<div class="error">${esc(err.message)}</div>`});