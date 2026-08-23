const SYSTEM_COMPONENTS={
  service:[
    {id:'01',name:'Head / cover joint',type:'STATIC',icon:'●',function:'Typical static gasket interface used to contain oil, coolant or combustion-adjacent fluid paths at a joint.',failureModes:['Gasket degradation','Joint-face contamination','Incorrect assembly condition'],keywords:['gasket','cover','upper engine gasket','lower engine gasket']},
    {id:'02',name:'O-ring joint',type:'STATIC',icon:'●',function:'Provides a fluid-tight seal between stationary removable connections or mating passages.',failureModes:['Compression set','Extrusion','Chemical or thermal degradation'],keywords:['o-ring','o ring','oring']},
    {id:'03',name:'Front / rear shaft seal',type:'DYNAMIC',icon:'◆',function:'Seals a rotating shaft interface and limits lubricant leakage at the engine boundary.',failureModes:['Seal-lip wear','Shaft surface damage','Seal hardening or installation damage'],keywords:['front seal','rear seal','oil seal','seal oil','keyway']},
    {id:'04',name:'Hose & clamp joint',type:'CLAMP',icon:'▲',function:'Maintains pressure integrity at flexible coolant, air or fuel connections where hoses and clamps are used.',failureModes:['Hose ageing','Clamp looseness or corrosion','Connection damage'],keywords:['hose','clamp']},
    {id:'05',name:'Expansion / service plug',type:'SERVICE',icon:'■',function:'Closes casting, gallery or service openings and must preserve the integrity of the contained fluid path.',failureModes:['Corrosion','Improper installation','Plug or seating-surface damage'],keywords:['plug','expansion']},
    {id:'06',name:'Leak-prevention path',type:'SERVICE',icon:'■',function:'Represents the combined integrity of seals, gaskets, joints and service closures across the system.',failureModes:['Connection leakage','Seal-ring degradation','Contamination ingress'],keywords:['sealing ring','sealing strip','seal ferrule','gasket connection','seal','gasket']}
  ]
};
const SERVICE_FAULTS=[
  {component:0,label:'Head / cover joint',action:'Inspect gasket and joint face; replace only to the correct OEM procedure.'},
  {component:2,label:'Front / rear shaft seal',action:'Inspect the seal and shaft interface for the leak source.'},
  {component:3,label:'Hose / clamp joint',action:'Inspect flexible connection, clamp condition and pressure integrity.'},
  {component:1,label:'O-ring joint',action:'Inspect O-ring condition, seating and connection surfaces.'},
  {component:4,label:'Service / expansion plug',action:'Inspect plug, seating surface and corrosion condition.'}
];
const params=new URLSearchParams(location.search);
const requestedGen=params.get('gen')||'gen4';
const requestedSystem=params.get('system')||'service';
let sysState={generators:[],systems:[],parts:[],oem:null,gen:null,system:null,components:[],selected:0};

function sEsc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function confidenceClass(v){return v==='VERIFIED'?'verified':v==='FAMILY MATCH'?'family':v==='CANDIDATE'?'candidate':v==='NOT COMPATIBLE'?'incompatible':'unverified'}
function indexHref(hash){const g=sysState.gen?.id||requestedGen,s=sysState.system?.id||requestedSystem;return `index.html?gen=${encodeURIComponent(g)}&system=${encodeURIComponent(s)}#${hash}`}
function normalize(s){return String(s||'').toLowerCase()}
function selectedComponent(){return sysState.components[sysState.selected]||sysState.components[0]}

function servicePartRows(){
  const g=sysState.gen?.id;
  return sysState.parts.filter(p=>p.s==='Service & Sealing'&&(!(p.g||[]).length||(p.g||[]).includes(g)));
}
function partsForComponent(comp){
  const rows=servicePartRows(),keys=comp.keywords.map(normalize);
  let filtered=rows.filter(p=>keys.some(k=>normalize(`${p.d} ${p.m} ${(p.p||[]).join(' ')}`).includes(k)));
  if(comp.id==='06'){
    const used=new Set();
    SYSTEM_COMPONENTS.service.slice(0,5).forEach(c=>partsForComponentBasic(c,rows).forEach(p=>used.add(p.id)));
    const leftovers=rows.filter(p=>!used.has(p.id));
    filtered=[...leftovers,...filtered];
  }
  const uniq=[];const seen=new Set();
  filtered.forEach(p=>{if(!seen.has(p.id)){seen.add(p.id);uniq.push(p)}});
  const score=p=>((p.g||[]).includes(sysState.gen.id)?0:2)+(p.c==='VERIFIED'?0:p.c==='FAMILY MATCH'?1:p.c==='CANDIDATE'?2:3);
  return uniq.sort((a,b)=>score(a)-score(b)||a.d.localeCompare(b.d));
}
function partsForComponentBasic(comp,rows){
  const keys=comp.keywords.map(normalize);return rows.filter(p=>keys.some(k=>normalize(`${p.d} ${p.m} ${(p.p||[]).join(' ')}`).includes(k)));
}
function compatibilitySummary(){
  const rows=servicePartRows(),counts={};rows.forEach(p=>counts[p.c]=(counts[p.c]||0)+1);
  const order=['VERIFIED','FAMILY MATCH','CANDIDATE','UNVERIFIED','NOT COMPATIBLE'];
  const parts=order.filter(k=>counts[k]).map(k=>`${counts[k]} ${k}`);
  return parts.length?parts.join(' · '):'NO MAPPED RECORDS';
}

function sealPlateSvg(){
  const c=sysState.components,sel=sysState.selected;
  const anchors=[[380,94],[445,168],[590,292],[169,244],[450,326],[306,324]];
  const labels=[[18,58],[18,170],[18,282],[620,58],[620,170],[620,282]];
  const callout=(i)=>{const a=anchors[i],l=labels[i],left=l[0]<300,selected=i===sel,comp=c[i];return `<g class="seal-callout ${selected?'selected':''}" data-callout="${i}" tabindex="0" role="button"><path class="leader" d="M${left?l[0]+132:l[0]} ${l[1]+22} L${a[0]} ${a[1]}" fill="none" stroke="${selected?'#4c9d95':'#536b77'}" stroke-width="${selected?2:1.2}"/><rect class="call-box" x="${l[0]}" y="${l[1]}" width="132" height="44" rx="2" fill="${selected?'#14211f':'#11171b'}" stroke="${selected?'#4c9d95':'#394851'}"/><circle class="call-circle" cx="${l[0]+19}" cy="${l[1]+22}" r="12" fill="${selected?'#4c9d95':'#4b7083'}"/><text x="${l[0]+19}" y="${l[1]+25.5}" text-anchor="middle" font-size="8" font-weight="900" fill="#fff">${comp.id}</text><text x="${l[0]+39}" y="${l[1]+19}" font-size="8.5" font-weight="900" fill="#d5dde0">${sEsc(comp.name.toUpperCase().slice(0,19))}</text><text x="${l[0]+39}" y="${l[1]+32}" font-size="7" font-weight="800" fill="#738995">${sEsc(comp.type)}</text></g>`};
  const points=anchors.map((a,i)=>`<g class="plate-point ${i===sel?'selected':''}" data-point="${i}"><circle class="target-ring" cx="${a[0]}" cy="${a[1]}" r="23" fill="rgba(89,126,143,.05)" stroke="${i===sel?'#4c9d95':'#627681'}" stroke-width="${i===sel?3:1.5}" stroke-dasharray="${i===sel?'5 3':'3 4'}"/><text x="${a[0]}" y="${a[1]+3}" text-anchor="middle" font-size="8" font-weight="900" fill="${i===sel?'#b7e2dd':'#8ea1aa'}">${String(i+1).padStart(2,'0')}</text></g>`).join('');
  return `<svg viewBox="0 0 760 430" aria-label="Interactive Service and Sealing technical schematic"><defs><marker id="flowA" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#5a879c"/></marker></defs><g opacity=".98"><rect x="287" y="84" width="282" height="39" rx="4" fill="#171f24" stroke="#667985"/><rect x="298" y="120" width="268" height="146" rx="8" fill="#151c20" stroke="#667985"/><rect x="315" y="137" width="47" height="108" rx="5" fill="#0f1417" stroke="#4d5d65"/><rect x="374" y="137" width="47" height="108" rx="5" fill="#0f1417" stroke="#4d5d65"/><rect x="433" y="137" width="47" height="108" rx="5" fill="#0f1417" stroke="#4d5d65"/><rect x="492" y="137" width="47" height="108" rx="5" fill="#0f1417" stroke="#4d5d65"/><path d="M304 266h257l19 44H286Z" fill="#172026" stroke="#667985"/><path d="M326 292h207" stroke="#627986" stroke-width="5"/><circle cx="369" cy="292" r="9" fill="#101518" stroke="#6e8793"/><circle cx="430" cy="292" r="9" fill="#101518" stroke="#6e8793"/><circle cx="491" cy="292" r="9" fill="#101518" stroke="#6e8793"/><circle cx="590" cy="292" r="34" fill="#131a1e" stroke="#667985"/><path d="M315 110h235" stroke="#8c733e" stroke-width="4" stroke-dasharray="7 4"/><ellipse cx="445" cy="168" rx="26" ry="15" fill="none" stroke="#6f95a7" stroke-width="3"/><circle cx="590" cy="292" r="19" fill="none" stroke="#b58d3a" stroke-width="4"/><path d="M117 244h92c18 0 28 18 45 18h32" stroke="#6f8995" stroke-width="8" fill="none"/><path d="M160 232v24M174 232v24" stroke="#9aabb2" stroke-width="3"/><rect x="438" y="316" width="25" height="17" rx="2" fill="#172126" stroke="#4c9d95" stroke-width="2"/><path d="M306 324c39 24 98 34 151 25 53-9 88-28 127-42" fill="none" stroke="#5a879c" stroke-width="3" stroke-dasharray="6 5" marker-end="url(#flowA)"/>${points}</g>${c.map((_,i)=>callout(i)).join('')}<text x="380" y="407" text-anchor="middle" font-size="8" font-weight="800" fill="#6f828c">SERVICE &amp; SEALING · FUNCTIONAL TRAINING SCHEMATIC · NOT OEM GEOMETRY</text></svg>`;
}

function applyPreview(i,on){
  document.querySelectorAll('[data-callout],[data-point],[data-component]').forEach(el=>el.classList.remove('preview'));
  if(!on)return;
  document.querySelectorAll(`[data-callout="${i}"],[data-point="${i}"],[data-component="${i}"]`).forEach(el=>el.classList.add('preview'));
}
function bindSelectionTargets(){
  document.querySelectorAll('[data-callout],[data-component],[data-flow-index],[data-function-index]').forEach(el=>{
    const raw=el.dataset.callout??el.dataset.component??el.dataset.flowIndex??el.dataset.functionIndex,i=Number(raw);
    el.addEventListener('mouseenter',()=>applyPreview(i,true));el.addEventListener('mouseleave',()=>applyPreview(i,false));
    el.addEventListener('click',()=>selectComponent(i));
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectComponent(i)}});
  });
}
function renderComponentList(){
  document.querySelector('#componentList').innerHTML=sysState.components.map((c,i)=>`<button class="component-item ${i===sysState.selected?'selected':''}" data-component="${i}"><span class="num">${c.id}</span><b>${sEsc(c.name)}</b><small>${sEsc(c.type)}</small></button>`).join('');
}
function renderDetail(){
  const c=selectedComponent(),rows=partsForComponent(c);
  document.querySelector('#selectedNumber').textContent=c.id;document.querySelector('#selectedName').textContent=c.name;
  document.querySelector('#detailNo').textContent=c.id;document.querySelector('#detailName').textContent=c.name;document.querySelector('#detailFunction').textContent=c.function;
  document.querySelector('#detailType').textContent=c.type;document.querySelector('#detailFailures').textContent=c.failureModes.join(' · ');document.querySelector('#detailCount').textContent=`${rows.length} classified record${rows.length===1?'':'s'}`;
}
function renderRelationship(){
  document.querySelector('#relationshipFlow').innerHTML=sysState.components.map((c,i)=>`${i?'<span class="flow-arrow">→</span>':''}<button class="flow-step ${i===sysState.selected?'selected':''}" data-flow-index="${i}">${sEsc(c.name)}</button>`).join('');
  document.querySelector('#functionTable').innerHTML=sysState.components.map((c,i)=>`<div class="function-row ${i===sysState.selected?'selected':''}" data-function-index="${i}" tabindex="0"><span class="num">${c.id}</span><b>${sEsc(c.name.toUpperCase())}</b><span>${sEsc(c.function)}</span><em>${sEsc(c.type)}</em></div>`).join('');
}
function renderFaultTree(){
  document.querySelector('#faultTree').innerHTML=`<div class="fault-root">LEAK / PRESSURE LOSS DETECTED</div><div class="fault-branches">${SERVICE_FAULTS.map((f,i)=>`<button class="fault-branch ${f.component===sysState.selected?'selected':''}" data-fault="${i}"><b>${sEsc(f.label.toUpperCase())}</b><span>${sEsc(f.action)}</span></button>`).join('')}</div>`;
  document.querySelectorAll('[data-fault]').forEach(b=>b.onclick=()=>{const f=SERVICE_FAULTS[Number(b.dataset.fault)];selectComponent(f.component);document.querySelector('.hero-grid')?.scrollIntoView({behavior:'smooth',block:'start'})});
}
function renderParts(){
  const c=selectedComponent(),rows=partsForComponent(c).slice(0,12);document.querySelector('#partsTitle').textContent=`${c.id} · ${c.name}`;
  document.querySelector('#relatedParts').innerHTML=rows.length?rows.map(p=>`<a class="part-card ${confidenceClass(p.c)}" href="component.html?id=${encodeURIComponent(p.id)}&gen=${encodeURIComponent(sysState.gen.id)}"><span class="pn">${p.p?.length?'P/N '+sEsc(p.p.join(' / ')):'STORE '+sEsc(p.id)}</span><b>${sEsc(p.d)}</b><small>${sEsc(p.id)} · ${sEsc(p.m)}<br>${(p.g||[]).includes(sysState.gen.id)?sEsc(sysState.gen.name+' mapped'):'Application unassigned'}</small><span class="state">${sEsc(p.c)}</span><span class="open">OPEN COMPONENT →</span></a>`).join(''):'<div class="empty-parts">No spare-part records are currently classified to this selected sealing path for the active generator context. The system relationship remains a training schematic.</div>';
}
function renderPlate(){document.querySelector('#systemPlate').innerHTML=sealPlateSvg()}
function selectComponent(i){sysState.selected=Math.max(0,Math.min(i,sysState.components.length-1));renderPlate();renderComponentList();renderDetail();renderRelationship();renderFaultTree();renderParts();bindSelectionTargets()}

function renderHeaderAndTruth(){
  const g=sysState.gen,s=sysState.system,profile=plateProfile(s.id),oem=sysState.oem?.generators?.[g.id];
  document.title=`${s.name} · ${g.name} ${g.model} · Gulhifalhu Engine Console`;
  document.querySelector('#machineLabel').textContent=`${g.name.toUpperCase()} · ${g.manufacturer} ${g.model} · ${g.ratingKw} kW`;
  document.querySelector('#headerSystem').textContent=`SYSTEM: ${s.name.toUpperCase()}`;document.querySelector('#crumbSystem').textContent=s.name.toUpperCase();
  document.querySelector('#contextEngine').textContent=`${g.manufacturer} ${g.model}`;document.querySelector('#contextRating').textContent=`${g.ratingKw} kW`;document.querySelector('#contextIdentity').textContent=g.identityStatus;
  document.querySelector('#contextEvidence').textContent=compatibilitySummary();document.querySelector('#systemTitle').textContent=s.name;document.querySelector('#sideSystemTitle').textContent=s.name;document.querySelector('#systemPurpose').textContent=profile.purpose;
  document.querySelector('#oemState').textContent=oem?.state||'OEM VISUAL SOURCE NOT REGISTERED';document.querySelector('#truthIdentity').textContent=g.identityStatus;document.querySelector('#truthCompatibility').textContent=compatibilitySummary();
  ['backEngine','backOverview','goEngine'].forEach(id=>document.querySelector('#'+id).href=indexHref('home'));
  document.querySelector('#goDiagnostics').href=indexHref('diagnostics');document.querySelector('#goMaintenance').href=indexHref('maintenance');document.querySelector('#goSpares').href=indexHref('parts');document.querySelector('#goEvidence').href=indexHref('evidence');document.querySelector('#openPartsLibrary').href=indexHref('parts');
}
function wireStaticActions(){document.querySelector('#viewSelectedParts').onclick=()=>document.querySelector('#relatedSection')?.scrollIntoView({behavior:'smooth',block:'start'})}

async function loadSystem(){
  const[g,s,m,o]=await Promise.all([
    fetch('data/generators.json').then(r=>r.json()),
    fetch('data/systems.json').then(r=>r.json()),
    fetch('data/inventory-manifest.json').then(r=>r.json()),
    fetch('data/oem-visual-sources.json').then(r=>r.json()).catch(()=>null)
  ]);
  sysState.generators=g;sysState.systems=s;sysState.oem=o;
  const batches=await Promise.all(m.files.map(f=>fetch(f).then(r=>r.json())));sysState.parts=batches.flat();
  sysState.gen=g.find(x=>x.id===requestedGen)||g.find(x=>x.id==='gen4')||g[0];
  sysState.system=s.find(x=>x.id===requestedSystem)||s.find(x=>x.id==='service');
  if(sysState.system.id!=='service')throw new Error('The dedicated system workspace is currently implemented for Service & Sealing. Other systems remain available through System Plates.');
  sysState.components=SYSTEM_COMPONENTS.service;sysState.selected=0;
  renderHeaderAndTruth();selectComponent(0);wireStaticActions();
}
loadSystem().catch(err=>{document.querySelector('.sys-main').innerHTML=`<div style="border:1px solid #6e343b;background:#24171a;color:#e1bcc0;padding:20px;font:700 11px ui-monospace,monospace">${sEsc(err.message)}</div>`});