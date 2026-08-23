const COMPONENT_FLOWS={
  air:['Air cleaner','Turbocharger','Charge-air cooler','Intake manifold','Cylinder','Exhaust manifold','Turbo turbine'],
  fuel:['Fuel supply','Primary filter','Transfer / injection pump','High-pressure distribution','Injector'],
  lube:['Oil sump','Lube-oil pump','Oil cooler','Full-flow filter','Main oil gallery','Main / big-end bearings'],
  cooling:['Expansion tank','Circulating pump','Engine water jacket','Thermostat','Heat exchanger','Return'],
  combustion:['Cylinder head','Injector','Combustion space','Piston / rings','Piston pin'],
  crank:['Piston load','Connecting rod','Crankpin / big-end','Crankshaft','Main bearings','Flywheel'],
  valve:['Camshaft','Follower / tappet','Pushrod / linkage','Rocker mechanism','Valve / spring'],
  start:['Battery bank','Starter solenoid','Starter motor','Ring gear / flywheel','Crankshaft','Charging alternator'],
  control:['Sensors / senders','Harness / CAN','ECU / controller','Protection logic','Actuator / shutdown','Engine response'],
  service:['Joint face','Gasket / O-ring','Shaft seal','Hose / clamp','Service plug','Leak prevention']
};

const FAULT_TREES={
  air:{root:'AIR FLOW / BOOST DEGRADED',branches:[
    {label:'Filter restriction',detail:'Inspect air-cleaner restriction / filter condition',keywords:['air filter','filter'],fallback:'maintenance'},
    {label:'Turbocharger fault',detail:'Compressor / turbine / seal / mounting issue',keywords:['turbo','compressor','impeller'],fallback:'diagnostics'},
    {label:'Charge-air leak',detail:'Cooler, gasket, hose or clamp leakage',keywords:['aftercooler','charge air','cooler','gasket','hose','clamp'],fallback:'maintenance'},
    {label:'Manifold / exhaust restriction',detail:'Inspect intake and exhaust gas path',keywords:['manifold','exhaust'],fallback:'diagnostics'}]},
  fuel:{root:'FUEL DELIVERY DEGRADED',branches:[
    {label:'Filter restriction / water',detail:'Primary / secondary filtration issue',keywords:['fuel filter','separator'],fallback:'maintenance'},
    {label:'Low transfer supply',detail:'Pump or supply-path fault',keywords:['pump','transfer'],fallback:'diagnostics'},
    {label:'Injection fault',detail:'Injection pump / injector issue',keywords:['injector','injection'],fallback:'diagnostics'},
    {label:'Fuel leakage / air ingress',detail:'Line, seal or connection problem',keywords:['fuel line','seal','gasket'],fallback:'maintenance'}]},
  lube:{root:'LOW / UNSTABLE OIL PRESSURE',branches:[
    {label:'Oil level / condition',detail:'Confirm oil supply and condition first',keywords:['oil'],fallback:'maintenance'},
    {label:'Filter / bypass restriction',detail:'Check full-flow filtration path',keywords:['oil filter','filter','bypass'],fallback:'maintenance'},
    {label:'Oil pump fault',detail:'Loss of circulation / pump performance',keywords:['oil pump','pump'],fallback:'diagnostics'},
    {label:'Bearing clearance / wear',detail:'Main and big-end bearing load path',keywords:['bearing','main bearing','big end'],fallback:'diagnostics'}]},
  cooling:{root:'HIGH COOLANT TEMPERATURE',branches:[
    {label:'Low coolant / trapped air',detail:'Check level and air in circuit',keywords:['coolant','expansion'],fallback:'maintenance'},
    {label:'Circulating pump fault',detail:'Pump leakage or reduced flow',keywords:['water pump','coolant pump','pump'],fallback:'diagnostics'},
    {label:'Thermostat fault',detail:'Incorrect temperature regulation',keywords:['thermostat'],fallback:'diagnostics'},
    {label:'Heat rejection restriction',detail:'Radiator / heat exchanger fouling or flow issue',keywords:['radiator','heat exchanger','cooler'],fallback:'maintenance'}]},
  combustion:{root:'LOW COMPRESSION / BLOW-BY',branches:[
    {label:'Piston / ring wear',detail:'Loss of cylinder sealing',keywords:['piston','ring'],fallback:'diagnostics'},
    {label:'Liner wear / damage',detail:'Cylinder running-surface problem',keywords:['liner'],fallback:'diagnostics'},
    {label:'Head / gasket leakage',detail:'Combustion sealing issue',keywords:['head gasket','gasket'],fallback:'maintenance'},
    {label:'Injector / combustion fault',detail:'Poor fuel delivery or combustion quality',keywords:['injector'],fallback:'diagnostics'}]},
  crank:{root:'KNOCK / VIBRATION / LOAD LOSS',branches:[
    {label:'Big-end bearing damage',detail:'Crankpin / connecting-rod interface',keywords:['big end','con-rod bearing','connecting rod bearing'],fallback:'diagnostics'},
    {label:'Main bearing damage',detail:'Crankshaft main-journal support path',keywords:['main bearing'],fallback:'diagnostics'},
    {label:'Connecting-rod issue',detail:'Rod, bolt or bush condition',keywords:['connecting rod','con rod','rod bolt'],fallback:'maintenance'},
    {label:'Flywheel / damper issue',detail:'Rotational coupling or vibration control',keywords:['flywheel','damper'],fallback:'diagnostics'}]},
  valve:{root:'VALVE TRAIN NOISE / BREATHING LOSS',branches:[
    {label:'Rocker / pushrod wear',detail:'Motion transfer fault',keywords:['rocker','push rod','pushrod'],fallback:'maintenance'},
    {label:'Valve / spring fault',detail:'Valve motion or return problem',keywords:['valve spring','valve'],fallback:'diagnostics'},
    {label:'Guide / seat wear',detail:'Alignment or sealing degradation',keywords:['guide valve','valve guide','seat'],fallback:'diagnostics'},
    {label:'Cam / follower issue',detail:'Valve timing motion source',keywords:['camshaft','follower','tappet'],fallback:'diagnostics'}]},
  start:{root:'NO / SLOW CRANK OR CHARGING FAULT',branches:[
    {label:'Battery / cable drop',detail:'High-current supply path',keywords:['battery','cable'],fallback:'maintenance'},
    {label:'Starter / solenoid fault',detail:'Cranking torque or engagement issue',keywords:['starter','solenoid'],fallback:'diagnostics'},
    {label:'Ring gear / flywheel issue',detail:'Starter torque transfer fault',keywords:['ring gear','flywheel'],fallback:'diagnostics'},
    {label:'Charging alternator fault',detail:'Battery recovery / charging issue',keywords:['alternator'],fallback:'diagnostics'}]},
  control:{root:'FALSE SHUTDOWN / CONTROL INSTABILITY',branches:[
    {label:'Sensor / sender fault',detail:'Pressure, temperature or speed input issue',keywords:['sender','sensor'],fallback:'diagnostics'},
    {label:'Harness / CAN fault',detail:'Signal path integrity issue',keywords:['harness','cable'],fallback:'maintenance'},
    {label:'ECU / controller issue',detail:'Processing / governing logic problem',keywords:['ecu','controller'],fallback:'diagnostics'},
    {label:'Shutdown actuator fault',detail:'Fuel / stop command hardware issue',keywords:['shutdown','solenoid','actuator'],fallback:'diagnostics'}]},
  service:{root:'LEAK / PRESSURE LOSS / CONTAMINATION',branches:[
    {label:'Static gasket failure',detail:'Joint-face sealing issue',keywords:['gasket'],fallback:'maintenance'},
    {label:'O-ring / seal damage',detail:'Fluid connection or shaft-seal issue',keywords:['o-ring','o ring','seal'],fallback:'maintenance'},
    {label:'Hose / clamp leakage',detail:'Flexible connection integrity issue',keywords:['hose','clamp'],fallback:'maintenance'},
    {label:'Plug / cover leakage',detail:'Service opening or casting-passage seal',keywords:['plug','cover'],fallback:'maintenance'}]}
};

const CALLOUT_ALIASES={
  air:[['filter','cleaner'],['turbo','compressor','impeller'],['cooler','aftercooler','charge air'],['intake','manifold'],['exhaust','manifold'],['outlet','silencer']],
  fuel:[['supply','tank'],['filter','separator'],['pump','transfer','injection'],['line','rail','distribution'],['injector'],['return','leak-off']],
  lube:[['sump','pan'],['pump'],['cooler'],['filter'],['gallery'],['bearing']],
  cooling:[['expansion','tank'],['pump'],['jacket'],['thermostat'],['radiator','heat exchanger'],['return']],
  combustion:[['head'],['injector'],['liner'],['piston','ring'],['pin'],['combustion']],
  crank:[['piston'],['connecting rod','con rod'],['crankpin','big end'],['crankshaft'],['main bearing'],['flywheel']],
  valve:[['cam'],['follower','tappet'],['pushrod','push rod'],['rocker'],['valve','spring'],['guide','seat']],
  start:[['battery'],['solenoid'],['starter'],['ring gear','flywheel'],['crankshaft'],['alternator']],
  control:[['sensor','sender'],['harness','can'],['ecu','controller'],['protection'],['actuator','shutdown','solenoid'],['response']],
  service:[['head','cover','joint'],['o-ring','o ring','gasket'],['seal','crankshaft'],['hose','clamp'],['plug'],['leak']]
};

const qs=new URLSearchParams(location.search);
const requestedPart=qs.get('id');
const requestedGen=qs.get('gen');
let currentPart=null,currentSystem=null,currentGen=null,currentCallout=0;

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
  return [...sameModule,...other].slice(0,12);
}
function selectedCalloutIndex(p,sys){
  if(!sys)return 0;
  const hay=`${p.d} ${p.m}`.toLowerCase(),aliases=CALLOUT_ALIASES[sys.id]||[];
  let best=0,bestScore=-1;
  aliases.forEach((group,i)=>{let score=0;group.forEach(k=>{if(hay.includes(k))score+=k.length});if(score>bestScore){best=i;bestScore=score}});
  return Math.min(best,(plateProfile(sys.id).callouts||[]).length-1);
}

function systemOverlay(id){
  const stroke='#4c9d95',blue='#4d7f98',amber='#a8792c';
  if(id==='air')return `<circle cx="242" cy="182" r="28" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M118 182h92M273 182h272" stroke="${blue}" stroke-width="6" fill="none"/><rect x="556" y="152" width="78" height="60" fill="none" stroke="${blue}" stroke-width="3"/><path d="M594 212v44H442" stroke="${blue}" stroke-width="5" fill="none"/>`;
  if(id==='fuel')return `<rect x="145" y="252" width="72" height="46" fill="none" stroke="${amber}" stroke-width="3"/><circle cx="266" cy="274" r="24" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M290 274h90v-148h230" stroke="${amber}" stroke-width="5" fill="none"/>${[400,442,484,526].map(x=>`<path d="M${x} 126v54" stroke="${amber}" stroke-width="3"/>`).join('')}`;
  if(id==='lube')return `<path d="M305 302h260" stroke="${amber}" stroke-width="8"/><circle cx="248" cy="286" r="22" fill="none" stroke="${amber}" stroke-width="4"/><path d="M270 286h45v-95h248" stroke="${amber}" stroke-width="5" fill="none"/><rect x="170" y="160" width="62" height="48" fill="none" stroke="${blue}" stroke-width="3"/>`;
  if(id==='cooling')return `<rect x="646" y="164" width="78" height="108" fill="none" stroke="${blue}" stroke-width="3"/><path d="M632 220h-44M646 252v48H278v-70" stroke="${blue}" stroke-width="5" fill="none"/><circle cx="252" cy="230" r="22" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M274 230h43" stroke="${blue}" stroke-width="5"/>`;
  if(id==='combustion')return `<rect x="354" y="119" width="168" height="140" fill="rgba(76,157,149,.07)" stroke="${stroke}" stroke-width="3"/><path d="M438 92v52" stroke="${amber}" stroke-width="4"/><path d="M426 143h24l-12 18Z" fill="${amber}"/>`;
  if(id==='crank')return `<path d="M330 282h225" stroke="${blue}" stroke-width="7"/><circle cx="365" cy="282" r="12" fill="none" stroke="${stroke}" stroke-width="4"/><circle cx="438" cy="282" r="12" fill="none" stroke="${stroke}" stroke-width="4"/><circle cx="511" cy="282" r="12" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M365 270l33-70M438 270v-70M511 270l-33-70" stroke="${blue}" stroke-width="4"/>`;
  if(id==='valve')return `<path d="M326 106h224" stroke="${blue}" stroke-width="5"/>${[350,395,440,485,530].map(x=>`<circle cx="${x}" cy="106" r="9" fill="none" stroke="${stroke}" stroke-width="3"/><path d="M${x} 115v42" stroke="${blue}" stroke-width="3"/>`).join('')}`;
  if(id==='start')return `<circle cx="620" cy="286" r="30" fill="none" stroke="${stroke}" stroke-width="4"/><circle cx="690" cy="291" r="27" fill="none" stroke="${blue}" stroke-width="3"/><path d="M596 270l-48-28" stroke="${blue}" stroke-width="4"/>`;
  if(id==='control')return `<rect x="590" y="86" width="104" height="58" fill="none" stroke="${stroke}" stroke-width="3"/><path d="M590 115h-72M642 144v72" stroke="${blue}" stroke-width="3" stroke-dasharray="5 4"/>${[350,420,490].map(x=>`<circle cx="${x}" cy="96" r="7" fill="${stroke}"/>`).join('')}`;
  return `<rect x="295" y="112" width="300" height="178" rx="14" fill="none" stroke="${stroke}" stroke-width="3" stroke-dasharray="7 5"/><circle cx="310" cy="190" r="8" fill="none" stroke="${amber}" stroke-width="3"/><circle cx="580" cy="224" r="8" fill="none" stroke="${amber}" stroke-width="3"/>`;
}

function calloutAnchors(id){
  const maps={
    air:[[154,182],[242,182],[594,180],[460,142],[520,110],[680,112]],
    fuel:[[180,274],[212,210],[266,274],[430,126],[520,158],[600,205]],
    lube:[[420,302],[248,286],[200,184],[300,191],[460,191],[438,282]],
    cooling:[[688,160],[252,230],[430,190],[590,220],[688,220],[300,300]],
    combustion:[[420,118],[438,112],[390,190],[438,220],[438,255],[470,168]],
    crank:[[390,205],[365,238],[365,282],[438,282],[511,282],[590,282]],
    valve:[[350,106],[395,106],[440,135],[485,106],[530,135],[550,160]],
    start:[[120,300],[585,286],[620,286],[570,260],[520,280],[690,291]],
    control:[[350,96],[520,116],[642,115],[642,180],[642,216],[560,245]],
    service:[[310,190],[360,118],[580,224],[640,200],[300,250],[445,290]]
  };return maps[id]||maps.service;
}

function plateHighlight(id,index){
  const a=calloutAnchors(id)[index]||[440,190];return `<circle class="plate-highlight" cx="${a[0]}" cy="${a[1]}" r="34"/>`;
}
function componentPlateSvg(p,sys,activeIndex){
  const profile=plateProfile(sys.id),calls=profile.callouts||[],anchors=calloutAnchors(sys.id);
  const call=(i,c,left)=>{const y=65+i%3*96,x=left?18:716,a=anchors[i]||[440,190],active=i===activeIndex;return `<g class="plate-callout ${active?'active':''}" data-callout-index="${i}" tabindex="0" role="button"><path class="leader" d="M${left?148:716} ${y+22} L${a[0]} ${a[1]}" stroke="#748b98" stroke-width="1.3" fill="none"/><rect class="call-box" x="${x}" y="${y}" width="126" height="44" fill="${active?'#e9f5f2':'#f8f8f4'}" stroke="${active?'#4c9d95':'#b8c1c5'}"/><circle class="call-circle" cx="${x+18}" cy="${y+22}" r="12" fill="${active?'#4c9d95':'#4d7288'}"/><text x="${x+18}" y="${y+25}" text-anchor="middle" font-size="8" font-weight="900" fill="#fff">${String(i+1).padStart(2,'0')}</text><text x="${x+38}" y="${y+19}" font-size="9" font-weight="900" fill="#263238">${esc(String(c[0]).toUpperCase().slice(0,18))}</text><text x="${x+38}" y="${y+31}" font-size="7.5" font-weight="700" fill="#68777e">${active?'SELECTED':'VIEW / TRACE'}</text></g>`};
  const c1=calls.slice(0,3).map((c,i)=>call(i,c,true)).join(''),c2=calls.slice(3,6).map((c,j)=>call(j+3,c,false)).join('');
  return `<svg viewBox="0 0 860 390" aria-label="Interactive ${esc(sys.name)} component technical plate"><rect width="860" height="390" fill="transparent"/><g><rect x="300" y="108" width="292" height="37" rx="6" fill="#dde2e1" stroke="#66747a"/><rect x="307" y="127" width="278" height="125" rx="10" fill="#e9ece8" stroke="#66747a"/><rect x="327" y="145" width="55" height="84" rx="6" fill="#f8f8f4" stroke="#9aa5aa"/><rect x="395" y="145" width="55" height="84" rx="6" fill="#f8f8f4" stroke="#9aa5aa"/><rect x="463" y="145" width="55" height="84" rx="6" fill="#f8f8f4" stroke="#9aa5aa"/><rect x="531" y="145" width="35" height="84" rx="6" fill="#f8f8f4" stroke="#9aa5aa"/><path d="M310 252h273l18 48H292Z" fill="#dce1e0" stroke="#66747a"/><circle cx="618" cy="274" r="38" fill="#eceeeb" stroke="#66747a"/><path d="M592 274h-8" stroke="#66747a" stroke-width="5"/>${systemOverlay(sys.id)}${plateHighlight(sys.id,activeIndex)}</g>${c1}${c2}<text x="430" y="370" text-anchor="middle" font-size="8" font-weight="800" fill="#68777e">${esc(p.id)} · ${esc(primaryPn(p))} · ${esc(sys.name.toUpperCase())} · FUNCTIONAL TRAINING PLATE</text></svg>`;
}

function renderFlow(sys,selectedLabel){
  const selectedWords=String(selectedLabel||'').toLowerCase().split(/\s+|\//).filter(w=>w.length>3);
  return (COMPONENT_FLOWS[sys?.id]||[]).map((n,i)=>{const on=selectedWords.some(w=>n.toLowerCase().includes(w));return `${i?'<span class="flow-arrow">→</span>':''}<span class="flow-node ${on?'selected':''}">${esc(n)}</span>`}).join('');
}
function renderFunctions(sys,selectedIndex){
  if(!sys)return '<div class="function-row"><span class="id">—</span><b>NO SYSTEM</b><span>System mapping is not available.</span></div>';
  const profile=plateProfile(sys.id),calls=profile.callouts||[];
  return calls.slice(0,6).map((c,i)=>`<div class="function-row ${i===selectedIndex?'selected':''}" data-function-callout="${i}"><span class="id">${String(i+1).padStart(2,'0')}</span><b>${esc(c[0].toUpperCase())}</b><span>${esc(c[1])}</span></div>`).join('');
}
function renderRelated(p,sys,gen){
  const rows=relatedParts(p,sys),box=document.querySelector('#relatedParts');
  if(!rows.length){box.innerHTML='<div class="empty-related">No additional related records are classified under this system yet.</div>';return;}
  box.innerHTML=rows.map(r=>{const same=String(r.m).toLowerCase()===String(p.m).toLowerCase();return `<a class="related-card ${same?'same-module':''}" href="component.html?id=${encodeURIComponent(r.id)}&gen=${encodeURIComponent(gen.id)}"><span class="pn">${r.p?.length?'P/N '+esc(r.p.join(' / ')):'STORE '+esc(r.id)}</span><b>${esc(r.d)}</b><small>${esc(r.id)} · ${esc(r.m)} · ${esc(r.c)}</small><span class="relation">${same?'SAME MODULE':'SAME SYSTEM'}</span><span class="view">OPEN COMPONENT →</span></a>`}).join('');
}
function findRelatedByKeywords(p,sys,keywords){
  const rows=state.parts.filter(x=>x.s===p.s),lower=keywords.map(k=>k.toLowerCase());
  return rows.find(x=>x.id!==p.id&&lower.some(k=>(`${x.d} ${x.m} ${(x.p||[]).join(' ')}`).toLowerCase().includes(k)))||null;
}
function renderFaultTree(p,sys,gen){
  const tree=FAULT_TREES[sys?.id]||{root:'INSPECT SYSTEM CONDITION',branches:[{label:'System inspection',detail:'Continue with diagnostics / maintenance.',keywords:[],fallback:'diagnostics'}]};
  document.querySelector('#faultTitle').textContent=tree.root;
  document.querySelector('#faultTree').innerHTML=`<div class="fault-root">${esc(tree.root)}</div><div class="fault-branches">${tree.branches.map((b,i)=>`<button class="fault-node" data-fault-index="${i}">${esc(b.label.toUpperCase())}<small>${esc(b.detail)}</small></button>`).join('')}</div>`;
  document.querySelectorAll('[data-fault-index]').forEach(btn=>btn.onclick=()=>{
    const b=tree.branches[Number(btn.dataset.faultIndex)],part=findRelatedByKeywords(p,sys,b.keywords||[]);
    if(part){location.href=`component.html?id=${encodeURIComponent(part.id)}&gen=${encodeURIComponent(gen.id)}`;return;}
    location.href=systemQuery(sys,gen,b.fallback==='maintenance'?'maintenance':'diagnostics');
  });
}

function bindPlateInteractions(p,sys,gen){
  document.querySelectorAll('[data-callout-index]').forEach(el=>{
    const activate=()=>{currentCallout=Number(el.dataset.calloutIndex);renderInteractivePlate(p,sys,gen)};
    el.addEventListener('mouseenter',activate);el.addEventListener('click',activate);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}});
  });
  document.querySelectorAll('[data-function-callout]').forEach(el=>el.onclick=()=>{currentCallout=Number(el.dataset.functionCallout);renderInteractivePlate(p,sys,gen)});
}
function renderInteractivePlate(p,sys,gen){
  const calls=plateProfile(sys.id).callouts||[],selected=calls[currentCallout]||calls[0]||['System','Relationship'];
  document.querySelector('#componentIllustration').innerHTML=componentPlateSvg(p,sys,currentCallout);
  document.querySelector('#selectedCallout').textContent=`${String(currentCallout+1).padStart(2,'0')} · ${selected[0]}`;
  document.querySelector('#systemFlow').innerHTML=renderFlow(sys,selected[0]);
  document.querySelector('#functionRows').innerHTML=renderFunctions(sys,currentCallout);
  bindPlateInteractions(p,sys,gen);
}

function renderComponent(p){
  const gen=machineForPart(p),sys=systemForPart(p);
  currentPart=p;currentSystem=sys;currentGen=gen;currentCallout=selectedCalloutIndex(p,sys);state.activeGen=gen?.id||'gen1';
  document.title=`${primaryPn(p)} · ${p.d} · Gulhifalhu Engine Console`;
  document.querySelector('#headerMachine').textContent=gen?`${gen.name.toUpperCase()} · ${gen.manufacturer} ${gen.model} · ${gen.ratingKw} kW`:'ENGINE CONTEXT UNAVAILABLE';
  document.querySelector('#headerSystem').textContent=`SYSTEM: ${sys?sys.name.toUpperCase():'UNASSIGNED'}`;
  document.querySelector('#headerStore').textContent=`STORE: ${p.id}`;
  document.querySelector('#headerPn').textContent=`P/N ${primaryPn(p)}`;
  document.querySelector('#breadcrumbModule').textContent=(p.m||'MODULE UNASSIGNED').toUpperCase();
  document.querySelector('#plateSystem').textContent=sys?sys.name:'SYSTEM UNASSIGNED';
  document.querySelector('#plateModule').textContent=p.m||'MODULE UNASSIGNED';
  document.querySelector('#partNumber').textContent=`P/N ${primaryPn(p)}`;
  document.querySelector('#partName').textContent=p.d;
  const badge=document.querySelector('#partStatus');badge.textContent=p.c;badge.className=`status-badge ${partStatusClass(p.c)}`;
  document.querySelector('#partFamily').textContent=partApplication(p);
  document.querySelector('#partModule').textContent=p.m||'UNASSIGNED';
  document.querySelector('#storeItem').textContent=p.id;
  document.querySelector('#evidenceState').textContent=p.c;
  const msg=document.querySelector('#evidenceMessage');msg.textContent=evidenceText(p.c);msg.className=`evidence-message ${partStatusClass(p.c)}`;
  document.querySelector('#compatibilityMeaning').textContent=confMeaning[p.c]||evidenceText(p.c);

  if(sys){renderInteractivePlate(p,sys,gen);renderFaultTree(p,sys,gen)}else document.querySelector('#componentIllustration').innerHTML='<div class="error">No engine-system plate is mapped to this record.</div>';
  renderRelated(p,sys,gen);

  const systemHref=systemQuery(sys,gen,'systems'),partsHref=systemQuery(sys,gen,'parts'),diagHref=systemQuery(sys,gen,'diagnostics'),maintHref=systemQuery(sys,gen,'maintenance');
  document.querySelector('#backEngineTop').href=systemQuery(null,gen,'home');
  document.querySelector('#backSystem').href=systemHref;
  document.querySelector('#backSystem').textContent=`← BACK TO ${sys?sys.name.toUpperCase():'ENGINE SYSTEMS'}`;
  document.querySelector('#viewEvidence').href=systemQuery(sys,gen,'evidence');
  document.querySelector('#viewSpares').href=partsHref;
  document.querySelector('#goDiagnostics').href=diagHref;
  document.querySelector('#goMaintenance').href=maintHref;
  document.querySelector('#goSpares').href=partsHref;
  document.querySelector('#goEngine').href=systemQuery(null,gen,'home');
  document.querySelector('#faultDiagnostics').href=diagHref;
  document.querySelector('#faultMaintenance').href=maintHref;
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