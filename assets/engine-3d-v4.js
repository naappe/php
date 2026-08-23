import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const stage=document.querySelector('#threeStage');
const qs=new URLSearchParams(location.search);
let activeGen=qs.get('gen')||'gen1',activeSystem='all',viewMode='realistic',exploded=false,autoRotate=false;
let generators=[],root=null,pickables=[],originalMaterials=new Map(),groups=new Map();

const SYSTEMS=[
['air','Air Intake & Exhaust','Air cleaner, turbocharger, charge-air and exhaust path.'],
['fuel','Fuel System','Fuel filters, pump housing, distribution and injector feeds.'],
['lube','Lubrication','Oil sump, filters, cooler and lubricating-oil path.'],
['cooling','Cooling','Radiator, fan, water pump, thermostat and coolant piping.'],
['combustion','Cylinder & Combustion','Cylinder block, head and combustion structure.'],
['crank','Crank Mechanism','Crankcase, flywheel housing and generator load path.'],
['valve','Valve Train','Rocker-cover and upper valve-actuation region.'],
['start','Starting & Charging','Starter, charging alternator, belts and accessories.'],
['control','Control & Protection','Controller enclosure, sensors and harnesses.'],
['service','Service & Sealing','Hoses, clamps, covers, mounts, joints and fasteners.']
];
const systemColors={air:0x5797b0,fuel:0xc98c4f,lube:0xc3a14b,cooling:0x4d94b7,combustion:0x5c8c79,crank:0x747e86,valve:0x6f9c87,start:0xa58c63,control:0x48a89d,service:0xa57b61};

const scene=new THREE.Scene();scene.background=new THREE.Color(0x252b2f);scene.fog=new THREE.Fog(0x252b2f,20,48);
const camera=new THREE.PerspectiveCamera(34,1,.1,120);camera.position.set(12,7.4,14.5);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.42;stage.innerHTML='';stage.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.055;controls.target.set(.4,1.15,0);controls.minDistance=8;controls.maxDistance=34;controls.maxPolarAngle=Math.PI*.49;
scene.add(new THREE.HemisphereLight(0xf0f3f5,0x424b50,1.9));
const key=new THREE.DirectionalLight(0xffffff,4.5);key.position.set(9,14,9);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);
const fill=new THREE.DirectionalLight(0xcfe6ef,2.2);fill.position.set(-10,8,7);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffd4a8,1.2);rim.position.set(5,8,-12);scene.add(rim);
const front=new THREE.DirectionalLight(0xffffff,1.4);front.position.set(0,5,14);scene.add(front);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(55,55),new THREE.MeshStandardMaterial({color:0x31373b,roughness:.9,metalness:.04}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.62;floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(42,42,0x5b6870,0x3a4449);grid.position.y=-1.6;grid.material.opacity=.28;grid.material.transparent=true;scene.add(grid);

function mat(color,rough=.58,metal=.24){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
const M={volvo:mat(0x4f8f76,.56,.16),volvoDark:mat(0x376b58,.65,.14),cummins:mat(0x817866,.58,.18),cast:mat(0x596064,.78,.27),castDark:mat(0x343a3e,.84,.28),steel:mat(0xadb3b5,.32,.84),dull:mat(0x858c8f,.53,.69),alum:mat(0xb9bebc,.42,.60),rubber:mat(0x1d2021,.96,.02),hose:mat(0x24292a,.92,.02),brass:mat(0xa8864b,.42,.72),filter:mat(0xe3e7e7,.50,.16),filterDark:mat(0x35565a,.61,.22),plastic:mat(0x252a2e,.80,.05),exhaust:mat(0x574941,.85,.44),black:mat(0x1d2225,.66,.22),radiator:mat(0x202428,.78,.45),copper:mat(0x8f5d3d,.46,.66)};
function makeGroup(id){const g=new THREE.Group();g.userData.system=id;groups.set(id,g);root.add(g);}
function tag(mesh,id,name){mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.system=id;mesh.userData.component=name||id;pickables.push(mesh);originalMaterials.set(mesh,mesh.material);groups.get(id).add(mesh);return mesh;}
function rounded(id,size,pos,material,name,rot=[0,0,0],radius=.12){const g=new RoundedBoxGeometry(...size,4,Math.min(radius,Math.min(...size)/4));const m=tag(new THREE.Mesh(g,material),id,name);m.position.set(...pos);m.rotation.set(...rot);return m;}
function box(id,size,pos,material,name,rot=[0,0,0]){const m=tag(new THREE.Mesh(new THREE.BoxGeometry(...size),material),id,name);m.position.set(...pos);m.rotation.set(...rot);return m;}
function cyl(id,r,depth,pos,material,name,rot=[Math.PI/2,0,0],segments=36){const m=tag(new THREE.Mesh(new THREE.CylinderGeometry(r,r,depth,segments),material),id,name);m.position.set(...pos);m.rotation.set(...rot);return m;}
function cone(id,r1,r2,depth,pos,material,name,rot=[Math.PI/2,0,0],segments=36){const m=tag(new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,depth,segments),material),id,name);m.position.set(...pos);m.rotation.set(...rot);return m;}
function torus(id,R,r,pos,material,name,rot=[Math.PI/2,0,0]){const m=tag(new THREE.Mesh(new THREE.TorusGeometry(R,r,14,48),material),id,name);m.position.set(...pos);m.rotation.set(...rot);return m;}
function tube(id,pts,r,material,name,segments=36){const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));return tag(new THREE.Mesh(new THREE.TubeGeometry(c,segments,r,12,false),material),id,name);}
function bolt(id,pos,name='Fastener',s=.06,rot=[0,0,0]){return cyl(id,s,.10,pos,M.steel,name,rot,12);}
function clamp(id,pos,R=.19,rot=[Math.PI/2,0,0]){return torus(id,R,.026,pos,M.steel,'Hose clamp',rot);}
function pulley(id,pos,r=.36,depth=.17,name='Pulley'){const p=cyl(id,r,depth,pos,M.black,name,[0,0,Math.PI/2],40);torus(id,r*.73,.03,[pos[0]-.095,pos[1],pos[2]],M.steel,name+' groove',[0,Math.PI/2,0]);return p;}
function clearModel(){if(root)scene.remove(root);root=new THREE.Group();scene.add(root);pickables=[];originalMaterials=new Map();groups=new Map();SYSTEMS.forEach(([id])=>makeGroup(id));}

function addInlineSixEngine(paint=M.volvo){
  rounded('crank',[5.25,1.45,1.85],[0,.10,0],M.cast,'Inline-six crankcase',[0,0,0],.17);
  rounded('combustion',[4.85,1.08,1.62],[-.05,1.25,0],paint,'Inline-six cylinder block',[0,0,0],.14);
  rounded('combustion',[5.05,.40,1.68],[-.02,1.99,0],M.cast,'Cylinder head',[0,0,0],.08);
  rounded('valve',[4.75,.48,1.28],[.05,2.39,0],paint,'Long rocker cover',[0,0,0],.13);
  for(let x=-2.05;x<=2.05;x+=.41){bolt('service',[x,2.64,.55],'Rocker-cover fastener',.045);bolt('service',[x,2.64,-.55],'Rocker-cover fastener',.045);}
  rounded('air',[4.20,.34,.36],[.15,1.82,-1.16],paint,'Intake manifold',[0,0,0],.09);
  for(let i=0;i<6;i++){const x=-1.95+i*.78;tube('air',[[x,1.72,-.88],[x,1.81,-1.16]],.055,M.alum,'Intake runner',14);tube('fuel',[[x,2.13,-.50],[x,2.38,-.22]],.026,M.steel,'Injector line',12);}
  tube('fuel',[[-2.12,2.13,-.50],[2.12,2.13,-.50]],.042,M.steel,'Fuel distribution line',18);
  tube('air',[[-2.18,1.68,1.02],[-.7,1.83,1.26],[1.30,1.80,1.22],[2.08,1.65,1.00]],.14,M.exhaust,'Exhaust manifold',34);
  for(let i=0;i<6;i++){const x=-1.95+i*.78;tube('air',[[x,1.55,.88],[x,1.72,1.14]],.067,M.exhaust,'Exhaust branch',12);}
  cyl('air',.62,.40,[-2.15,2.02,-1.63],M.alum,'Turbo compressor',[Math.PI/2,0,0],46);cyl('air',.54,.42,[-2.15,2.02,-1.99],M.exhaust,'Turbo turbine',[Math.PI/2,0,0],46);torus('air',.45,.12,[-2.15,2.02,-1.45],M.alum,'Turbo volute');
  tube('air',[[-2.35,2.05,-2.30],[-2.75,2.45,-2.48],[-2.0,2.78,-2.55],[-.65,2.72,-1.68]],.17,M.alum,'Charge-air pipe',32);
  rounded('fuel',[.92,.64,.54],[-1.55,.65,-1.36],M.castDark,'Fuel pump housing',[0,0,0],.10);cyl('fuel',.25,.82,[-2.05,.35,-1.42],M.filter,'Primary fuel filter',[0,0,0],30);cyl('fuel',.25,.82,[-1.48,.35,-1.42],M.filter,'Secondary fuel filter',[0,0,0],30);
  cyl('lube',.29,.94,[1.55,.02,-1.38],M.filter,'Lube-oil filter',[0,0,0],32);cyl('lube',.29,.94,[2.18,.02,-1.38],M.filter,'Lube-oil filter',[0,0,0],32);rounded('lube',[4.95,.55,1.82],[0,-.90,0],M.black,'Oil sump',[0,0,0],.13);
  cyl('start',.43,.82,[-2.05,.05,1.30],M.alum,'Charging alternator',[0,0,Math.PI/2],36);pulley('start',[-2.55,.05,1.30],.33,.15,'Alternator pulley');
  cyl('start',.38,.86,[2.15,-.33,1.25],M.black,'Starter motor',[0,0,Math.PI/2],34);cyl('start',.20,.38,[1.86,-.03,1.25],M.steel,'Starter solenoid',[0,0,Math.PI/2],24);
  rounded('crank',[.52,2.15,2.10],[-2.77,.35,0],M.castDark,'Front gear housing',[0,0,0],.20);pulley('start',[-3.12,.22,0],.58,.20,'Crank pulley');cyl('cooling',.40,.44,[-2.68,1.25,-.68],M.alum,'Water pump',[0,0,Math.PI/2],34);rounded('cooling',[.72,.40,.62],[-2.48,1.84,-.70],M.alum,'Thermostat housing',[0,0,0],.09);
  tube('cooling',[[-2.35,1.72,.78],[-1.35,2.55,.88],[1.28,2.55,.88],[2.18,1.72,.88]],.085,paint,'Cylinder-head coolant pipe');
  tube('control',[[-2.05,2.78,-.18],[2.10,2.78,-.18]],.038,M.hose,'Engine wiring harness');rounded('control',[.72,.44,.18],[1.55,2.12,-1.02],M.plastic,'Engine junction module',[0,0,0],.06);
  for(let i=0;i<4;i++)rounded('service',[.92,.34,.07],[-1.75+i*1.15,.52,1.00],M.castDark,'Crankcase access cover',[0,0,0],.04);
  const rear=2.82;cyl('crank',1.18,.42,[rear,.10,0],M.castDark,'Flywheel housing',[0,0,Math.PI/2],52);cyl('crank',.86,.12,[rear+.22,.10,0],M.steel,'Flywheel face',[0,0,Math.PI/2],52);
}

function addGen1ReferenceGenset(){
  const green=M.volvo;
  // common skid / sub-base
  rounded('service',[12.8,.48,3.25],[.60,-1.43,0],green,'Generator skid base',[0,0,0],.08);
  for(const x of [-5.1,-1.6,2.1,5.2]){box('service',[.62,.52,2.55],[x,-1.12,0],green,'Skid cross-member');box('service',[.35,.27,.70],[x,-1.63,1.05],M.castDark,'Skid lifting pocket');box('service',[.35,.27,.70],[x,-1.63,-1.05],M.castDark,'Skid lifting pocket');}
  // front radiator pack based on supplied images
  rounded('cooling',[.48,4.20,3.75],[-5.15,.80,0],M.black,'Radiator frame',[0,0,0],.08);
  rounded('cooling',[.22,3.75,3.25],[-4.92,.80,0],M.radiator,'Radiator core',[0,0,0],.04);
  for(let y=-.7;y<2.5;y+=.18)box('cooling',[.05,.055,3.0],[-4.78,y,0],M.dull,'Radiator fin');
  cyl('cooling',1.42,.18,[-4.48,.65,0],M.black,'Cooling fan',[0,0,Math.PI/2],56);
  for(let a=0;a<8;a++){const blade=box('cooling',[.08,1.05,.26],[-4.36,.65,0],M.dull,'Cooling fan blade',[0,0,a*Math.PI/4]);blade.position.y+=Math.sin(a*Math.PI/4)*.48;blade.position.z+=Math.cos(a*Math.PI/4)*.48;}
  tube('cooling',[[-4.80,2.45,-1.15],[-3.65,2.38,-1.10],[-2.65,2.10,-.78]],.13,M.alum,'Upper radiator pipe');tube('cooling',[[-4.82,-.40,1.12],[-3.70,-.35,1.20],[-2.48,.72,.76]],.13,M.alum,'Lower radiator pipe');clamp('service',[-3.62,2.38,-1.10],.14,[0,Math.PI/2,0]);clamp('service',[-3.70,-.35,1.20],.14,[0,Math.PI/2,0]);
  // engine location is slightly left of center as in reference genset
  root.position.x=.1;
  // generator alternator behind engine
  cyl('crank',1.42,3.05,[4.35,.18,0],green,'Generator alternator stator',[0,0,Math.PI/2],56);cyl('crank',1.18,.32,[2.72,.18,0],M.dull,'Generator coupling housing',[0,0,Math.PI/2],52);cyl('crank',1.22,.28,[5.94,.18,0],green,'Generator rear end housing',[0,0,Math.PI/2],52);
  for(let i=0;i<18;i++){const z=-.90+i*.10;box('crank',[2.25,.045,.045],[4.30,1.16,z],M.dull,'Alternator ventilation grille');}
  rounded('crank',[1.80,.44,1.70],[4.25,-1.04,0],green,'Generator mounting saddle',[0,0,0],.10);
  // large cylindrical air cleaner mounted high above rear of engine
  cyl('air',.72,1.10,[2.20,3.20,-.12],M.black,'Air cleaner canister',[0,0,Math.PI/2],48);cyl('air',.48,.16,[1.62,3.20,-.12],M.dull,'Air cleaner end cap',[0,0,Math.PI/2],42);cyl('air',.48,.16,[2.78,3.20,-.12],M.dull,'Air cleaner end cap',[0,0,Math.PI/2],42);
  tube('air',[[1.72,3.02,-.12],[.95,2.84,-.55],[-.35,2.62,-1.30],[-1.48,2.26,-1.54]],.18,M.hose,'Air-cleaner intake hose');clamp('service',[.96,2.84,-.55],.19,[0,Math.PI/2,0]);
  // control box above generator
  rounded('control',[1.58,1.48,.82],[4.80,2.80,-.20],M.black,'Generator control panel',[0,0,0],.08);rounded('control',[1.22,.72,.05],[4.80,2.92,-.64],M.plastic,'Controller face',[0,0,0],.03);box('control',[.58,.30,.035],[4.58,3.02,-.68],M.dull,'Display window');for(let i=0;i<4;i++)cyl('control',.055,.04,[5.15,3.15-i*.18,-.70],i===0?mat(0xc94d58,.5,.05):M.steel,'Control button',[Math.PI/2,0,0],18);tube('control',[[4.02,2.20,-.10],[3.15,1.58,-.45],[2.35,1.22,-.62]],.055,M.hose,'Control harness');
  // visible exhaust / charge-air plumbing and support braces
  tube('air',[[-1.88,2.08,1.48],[-2.65,2.60,1.78],[-3.75,2.82,1.38],[-4.45,2.35,.92]],.15,M.alum,'Front charge-air pipe');clamp('service',[-3.72,2.82,1.38],.16,[0,Math.PI/2,0]);
  // battery / terminal enclosure and cable run
  rounded('start',[1.20,.72,.82],[3.00,-.62,1.35],M.black,'Starting battery enclosure',[0,0,0],.07);tube('start',[[2.70,-.48,1.18],[2.18,-.18,1.00],[1.72,-.14,.92]],.055,M.hose,'Starter cable');
}

function addDetailedInlineHardware(manufacturer='Volvo Penta'){
  addInlineSixEngine(manufacturer.includes('Volvo')?M.volvo:M.cummins);
  rounded('service',[6.15,.34,2.60],[0,-1.40,0],manufacturer.includes('Volvo')?M.volvo:M.cummins,'Engine skid',[0,0,0],.07);
  for(const x of [-2.1,2.1])for(const z of [-.92,.92])rounded('service',[.68,.24,.50],[x,-1.20,z],M.castDark,'Engine mounting foot',[0,0,0],.05);
}
function addV16(){
  rounded('crank',[6.30,1.70,2.45],[0,.12,0],M.cast,'V16 crankcase',[0,0,0],.18);rounded('combustion',[5.60,.42,1.22],[0,1.22,0],M.cummins,'Central valley housing',[0,0,0],.11);
  for(const sign of [-1,1]){const z=sign*1.03,a=sign*-.22;rounded('combustion',[5.35,1.02,.92],[0,1.26,z],M.cummins,sign<0?'Left cylinder bank':'Right cylinder bank',[a,0,0],.10);rounded('combustion',[5.45,.40,.98],[0,1.98,z*1.06],M.cast,'Cylinder head',[a,0,0],.08);for(let i=0;i<4;i++){const x=-1.95+i*1.30;rounded('valve',[1.05,.38,.82],[x,2.34,z*1.10],M.black,`Rocker cover ${i+1}`,[a,0,0],.12);}tube('air',[[-2.45,1.72,z*1.54],[0,1.86,z*1.64],[2.40,1.72,z*1.54]],.15,M.exhaust,'Exhaust manifold');rounded('air',[4.55,.42,.44],[0,1.98,z*1.85],M.alum,'Intake plenum',[0,0,0],.10);}
  for(const sign of [-1,1]){const z=sign*2.38;cyl('air',.58,.40,[-2.2,2.20,z],M.alum,'Turbo compressor',[Math.PI/2,0,0],46);cyl('air',.52,.40,[-2.2,2.20,z+sign*.36],M.exhaust,'Turbo turbine',[Math.PI/2,0,0],46);tube('air',[[-2.55,2.2,z],[-3.0,2.65,z],[-1.4,2.80,sign*1.65]],.18,M.alum,'Charge-air pipe');}
  rounded('air',[3.55,.62,1.10],[.52,1.72,0],M.alum,'Charge-air cooler housing',[0,0,0],.12);rounded('lube',[6.15,.60,2.30],[0,-.90,0],M.black,'Oil sump',[0,0,0],.12);for(let i=0;i<2;i++)cyl('fuel',.28,.92,[-2.05+i*.64,.22,-1.60],M.filter,'Fuel filter',[0,0,0],30);for(let i=0;i<2;i++)cyl('lube',.30,1.0,[1.60+i*.68,-.05,-1.55],M.filter,'Oil filter',[0,0,0],30);cyl('crank',1.30,.45,[3.35,.15,0],M.castDark,'Flywheel housing',[0,0,Math.PI/2],54);cyl('start',.42,.92,[2.55,-.38,1.32],M.black,'Starter motor',[0,0,Math.PI/2],34);tube('control',[[-2.45,2.70,0],[2.45,2.70,0]],.04,M.hose,'Engine wiring harness');rounded('service',[7.00,.38,3.00],[0,-1.42,0],M.cummins,'V16 engine skid',[0,0,0],.08);
}

function buildFor(g){clearModel();if(g.id==='gen4')addV16();else{addDetailedInlineHardware(g.manufacturer);if(g.id==='gen1')addGen1ReferenceGenset();}root.rotation.y=g.id==='gen1'?-0.10:-0.16;applyMode();}
function restore(){for(const [m,orig] of originalMaterials)m.material=orig;groups.forEach(g=>g.visible=true);}
function technical(){groups.forEach((g,id)=>{g.visible=true;g.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({color:systemColors[id],roughness:.55,metalness:.28});});});}
function isolate(){restore();groups.forEach((g,id)=>g.visible=activeSystem==='all'||id===activeSystem);}
function applyMode(){if(!root)return;if(viewMode==='realistic')restore();else if(viewMode==='technical')technical();else isolate();if(activeSystem!=='all'&&groups.get(activeSystem)?.visible){groups.get(activeSystem).traverse(o=>{if(o.isMesh){const c=o.material.clone();c.emissive=new THREE.Color(systemColors[activeSystem]);c.emissiveIntensity=.16;o.material=c;}});}applyExplode();}
function applyExplode(){const d={air:[0,.65,1.15],fuel:[0,.2,-.75],lube:[0,-.45,-.35],cooling:[-.80,.15,.65],combustion:[0,.38,0],crank:[.20,-.15,0],valve:[0,.80,0],start:[.70,-.05,.45],control:[.55,.55,-.65],service:[0,0,0]};groups.forEach((g,id)=>{const v=d[id]||[0,0,0];g.position.set(exploded?v[0]:0,exploded?v[1]:0,exploded?v[2]:0);});}
function selectSystem(id,component=null){activeSystem=id;document.querySelectorAll('[data-system]').forEach(b=>b.classList.toggle('active',b.dataset.system===id));const meta=SYSTEMS.find(s=>s[0]===id);document.querySelector('#selectedName').textContent=(component||(meta?meta[1]:'Engine assembly')).toUpperCase();document.querySelector('#selectedDesc').textContent=meta?meta[2]:'Rotate, zoom and select an engine system.';document.querySelector('#selectedSystem').textContent=meta?meta[1].toUpperCase():'ALL SYSTEMS';document.querySelector('#selectedType').textContent=component?'COMPONENT':'ASSEMBLY';document.querySelector('#openSystem').href=id==='all'?`index.html?gen=${activeGen}#systems`:`system.html?system=${id}&gen=${activeGen}`;applyMode();}
function renderSystems(){const el=document.querySelector('#systemButtons');el.innerHTML=`<button class="active" data-system="all">00 · ALL</button>`+SYSTEMS.map((s,i)=>`<button data-system="${s[0]}">${String(i+1).padStart(2,'0')} · ${s[1]}</button>`).join('');el.querySelectorAll('[data-system]').forEach(b=>b.onclick=()=>selectSystem(b.dataset.system));}
function renderGenerators(){const el=document.querySelector('#generatorTabs');el.innerHTML=generators.map(g=>`<button class="${g.id===activeGen?'active':''}" data-gen="${g.id}">${g.name.toUpperCase()} · ${g.model} · ${g.ratingKw} kW</button>`).join('');el.querySelectorAll('[data-gen]').forEach(b=>b.onclick=()=>{activeGen=b.dataset.gen;renderGenerators();updateMachine();});}
function updateMachine(){const g=generators.find(x=>x.id===activeGen)||generators[0];if(!g)return;document.querySelector('#machineLabel').textContent=`${g.name.toUpperCase()} · ${g.manufacturer} ${g.model} · ${g.ratingKw} kW`;let label=g.id==='gen1'?'OPEN GENSET TRAINING ASSEMBLY · REFERENCE-MATCHED SILHOUETTE':g.id==='gen4'?'V16 HEAVY-DUTY TRAINING LAYOUT':'INLINE-SIX HEAVY-DUTY TRAINING LAYOUT';document.querySelector('#stageTitle').textContent=`${g.manufacturer.toUpperCase()} ${g.model} · ${label}`;document.querySelector('#selectedEvidence').textContent='TRAINING MODEL · NOT OEM CAD';document.querySelector('#evidenceLink').href=`evidence-flow.html?gen=${g.id}`;buildFor(g);selectSystem('all');if(g.id==='gen1'){camera.position.set(13,7.2,15.5);controls.target.set(.6,.8,0);}else{camera.position.set(11.5,7.3,13.5);controls.target.set(0,1.25,0);}controls.update();history.replaceState(null,'',`engine-3d.html?gen=${g.id}`);}
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();renderer.domElement.addEventListener('pointerdown',e=>{const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(pickables.filter(p=>p.visible),false)[0];if(hit?.object)selectSystem(hit.object.userData.system,hit.object.userData.component);});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{viewMode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));applyMode();});document.querySelector('#explodeView').onclick=()=>{exploded=!exploded;document.querySelector('#explodeView').textContent=`EXPLODE: ${exploded?'ON':'OFF'}`;applyExplode();};document.querySelector('#toggleRotate').onclick=()=>{autoRotate=!autoRotate;document.querySelector('#toggleRotate').textContent=`AUTO ROTATE: ${autoRotate?'ON':'OFF'}`;};document.querySelector('#resetView').onclick=()=>{const g=generators.find(x=>x.id===activeGen);if(g?.id==='gen1'){camera.position.set(13,7.2,15.5);controls.target.set(.6,.8,0);}else{camera.position.set(11.5,7.3,13.5);controls.target.set(0,1.25,0);}controls.update();};
function resize(){const w=stage.clientWidth,h=stage.clientHeight||650;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);resize();function animate(){requestAnimationFrame(animate);controls.autoRotate=autoRotate;controls.autoRotateSpeed=.65;controls.update();renderer.render(scene,camera);}animate();fetch('data/generators.json').then(r=>r.json()).then(d=>{generators=d;renderSystems();renderGenerators();updateMachine();}).catch(err=>{stage.innerHTML=`<div class="loader">3D MODULE ERROR · ${err.message}</div>`;});