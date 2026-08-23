import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const stage = document.querySelector('#threeStage');
const qs = new URLSearchParams(location.search);
let activeGen = qs.get('gen') || 'gen4';
let activeSystem = 'all';
let viewMode = 'realistic';
let exploded = false;
let autoRotate = false;
let generators = [];
let engineRoot = null;
let pickables = [];
let originalMaterials = new Map();
let groups = new Map();

const SYSTEMS = [
  ['air','Air Intake & Exhaust','Air cleaners, turbochargers, intake plenums, charge-air and exhaust paths.'],
  ['fuel','Fuel System','Filters, transfer/injection equipment, fuel lines and injector feeds.'],
  ['lube','Lubrication','Sump, oil pumps, filters, cooler and pressure-fed galleries.'],
  ['cooling','Cooling','Water pump, thermostat housing, coolant manifolds and hose connections.'],
  ['combustion','Cylinder & Combustion','Cylinder banks, heads and combustion structure.'],
  ['crank','Crank Mechanism','Crankcase, crankshaft, flywheel housing and rotating load path.'],
  ['valve','Valve Train','Rocker covers and upper valve-actuation region.'],
  ['start','Starting & Charging','Starter motor, alternator and belt-driven accessories.'],
  ['control','Control & Protection','Sensors, harnesses, controller modules and shutdown hardware.'],
  ['service','Service & Sealing','Gaskets, joints, clamps, covers, service points and fasteners.']
];

const systemColors = {
  air:0x4f8fa7,fuel:0xc8894b,lube:0xc3a146,cooling:0x4d93b6,combustion:0x8f6b5b,
  crank:0x69737c,valve:0x8594a2,start:0xa18a62,control:0x4da89e,service:0x9a765c
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x252b30);
scene.fog = new THREE.Fog(0x252b30, 18, 42);

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.position.set(11.5, 7.3, 13.5);

const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.32;
stage.innerHTML = '';
stage.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.target.set(0, 1.25, 0);
controls.minDistance = 7;
controls.maxDistance = 27;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight(0xe8eef2, 0x394148, 1.65));
const key = new THREE.DirectionalLight(0xffffff, 3.9); key.position.set(7, 13, 8); key.castShadow = true; key.shadow.mapSize.set(2048,2048); scene.add(key);
const fill = new THREE.DirectionalLight(0xc7e0ef, 2.0); fill.position.set(-10, 7, 5); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffd5ad, 1.35); rim.position.set(6, 6, -10); scene.add(rim);
const front = new THREE.DirectionalLight(0xffffff, 1.0); front.position.set(0, 4, 12); scene.add(front);

const floorMat = new THREE.MeshStandardMaterial({ color:0x30363b, roughness:0.88, metalness:0.05 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(45,45), floorMat);
floor.rotation.x = -Math.PI/2; floor.position.y = -1.55; floor.receiveShadow = true; scene.add(floor);
const grid = new THREE.GridHelper(34, 34, 0x5c6971, 0x3b454b); grid.position.y = -1.53; grid.material.opacity = 0.35; grid.material.transparent = true; scene.add(grid);

const MAT = {
  cumminsPaint: material(0x7b705f, 0.54, 0.18),
  volvoPaint: material(0x3e6255, 0.58, 0.16),
  cast: material(0x565c5e, 0.78, 0.24),
  castDark: material(0x34393c, 0.82, 0.28),
  steel: material(0xa8adae, 0.34, 0.82),
  dullSteel: material(0x767d80, 0.52, 0.70),
  aluminum: material(0xb3b7b5, 0.46, 0.58),
  rubber: material(0x1c2021, 0.96, 0.02),
  hose: material(0x23282a, 0.92, 0.03),
  brass: material(0xa98248, 0.43, 0.70),
  filter: material(0x38484d, 0.60, 0.25),
  plastic: material(0x262d31, 0.80, 0.05),
  exhaust: material(0x57473f, 0.84, 0.46),
  copper: material(0x8f5a38, 0.48, 0.66),
  blackPaint: material(0x202528, 0.64, 0.25)
};

function material(color, roughness=.6, metalness=.2){ return new THREE.MeshStandardMaterial({color, roughness, metalness}); }
function makeGroup(id){ const g = new THREE.Group(); g.userData.system = id; groups.set(id,g); engineRoot.add(g); return g; }
function tag(mesh,id,name){
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData.system = id; mesh.userData.component = name || id;
  pickables.push(mesh); originalMaterials.set(mesh, mesh.material);
  groups.get(id).add(mesh); return mesh;
}
function rounded(id,size,pos,mat,name,rot=[0,0,0],radius=.12){
  const geo = new RoundedBoxGeometry(size[0],size[1],size[2],4,Math.min(radius,Math.min(...size)/4));
  const m = tag(new THREE.Mesh(geo,mat),id,name); m.position.set(...pos); m.rotation.set(...rot); return m;
}
function box(id,size,pos,mat,name,rot=[0,0,0]){ const m=tag(new THREE.Mesh(new THREE.BoxGeometry(...size),mat),id,name);m.position.set(...pos);m.rotation.set(...rot);return m; }
function cyl(id,r,depth,pos,mat,name,rot=[Math.PI/2,0,0],segments=32){ const m=tag(new THREE.Mesh(new THREE.CylinderGeometry(r,r,depth,segments),mat),id,name);m.position.set(...pos);m.rotation.set(...rot);return m; }
function cone(id,r1,r2,depth,pos,mat,name,rot=[Math.PI/2,0,0],segments=32){ const m=tag(new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,depth,segments),mat),id,name);m.position.set(...pos);m.rotation.set(...rot);return m; }
function torus(id,R,r,pos,mat,name,rot=[Math.PI/2,0,0]){ const m=tag(new THREE.Mesh(new THREE.TorusGeometry(R,r,14,44),mat),id,name);m.position.set(...pos);m.rotation.set(...rot);return m; }
function tube(id,pts,r,mat,name,segments=28){ const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));return tag(new THREE.Mesh(new THREE.TubeGeometry(curve,segments,r,12,false),mat),id,name); }
function bolt(id,pos,name='Fastener',scale=.075,rot=[Math.PI/2,0,0]){ return cyl(id,scale,.11,pos,MAT.steel,name,rot,12); }
function rib(id,pos,len,axis='x',mat=MAT.castDark,name='Casting rib'){
  const size=axis==='x'?[len,.08,.10]:[.10,.08,len]; return rounded(id,size,pos,mat,name,[0,0,0],.03);
}
function clamp(id,pos,rot=[Math.PI/2,0,0],R=.19){ return torus(id,R,.025,pos,MAT.steel,'Hose clamp',rot); }
function pulley(id,pos,r=.42,depth=.18,name='Pulley'){ const p=cyl(id,r,depth,pos,MAT.blackPaint,name,[0,0,Math.PI/2],40); torus(id,r*.72,.035,[pos[0]+.1,pos[1],pos[2]],MAT.steel,name+' groove',[0,Math.PI/2,0]); return p; }

function clearModel(){
  if(engineRoot) scene.remove(engineRoot);
  engineRoot = new THREE.Group(); scene.add(engineRoot);
  pickables=[]; originalMaterials=new Map(); groups=new Map();
  SYSTEMS.forEach(([id])=>makeGroup(id));
}

function addVBank(bankName,zSign,paint){
  const a = zSign * -0.22;
  const z = zSign * 1.06;
  rounded('combustion',[5.4,1.08,.95],[0,1.25,z],paint,`${bankName} cylinder bank`,[a,0,0],.11);
  rounded('combustion',[5.55,.48,1.02],[0,2.00,z*1.08],MAT.cast,`${bankName} cylinder head`,[a,0,0],.09);
  for(let i=0;i<4;i++){
    const x=-1.95+i*1.30;
    rounded('valve',[1.08,.38,.86],[x,2.39,z*1.12],MAT.blackPaint,`${bankName} rocker cover ${i+1}`,[a,0,0],.13);
    for(const bx of [-.38,.38]) for(const bz of [-.27,.27]) bolt('service',[x+bx,2.59,z*1.12+bz*zSign*.75],`${bankName} rocker-cover bolt`,.055,[0,0,0]);
  }
  tube('air',[[-2.5,1.78,z*1.54],[0,1.92,z*1.65],[2.45,1.80,z*1.54]],.17,MAT.exhaust,`${bankName} exhaust manifold`);
  for(let i=0;i<8;i++){
    const x=-2.35+i*.67;
    tube('air',[[x,1.67,z*1.32],[x,1.82,z*1.55]],.075,MAT.exhaust,`${bankName} exhaust branch ${i+1}`,18);
    cyl('fuel',.055,.28,[x,2.17,z*.92],MAT.steel,`${bankName} injector line terminal`,[Math.PI/2,0,0],14);
  }
  rounded('air',[4.6,.46,.48],[0,1.95,z*1.88],MAT.aluminum,`${bankName} intake plenum`,[a*.15,0,0],.12);
  for(let i=0;i<8;i++){
    const x=-2.35+i*.67;
    tube('air',[[x,1.95,z*1.66],[x,1.76,z*1.30]],.055,MAT.aluminum,`${bankName} intake runner ${i+1}`,16);
  }
}

function addTurbo(side,zSign){
  const x=-2.25, z=zSign*2.45, y=2.25;
  cyl('air',.60,.40,[x,y,z],MAT.aluminum,`${side} turbo compressor`,[Math.PI/2,0,0],48);
  cyl('air',.54,.42,[x-.04,y,z+zSign*.39],MAT.exhaust,`${side} turbo turbine`,[Math.PI/2,0,0],48);
  torus('air',.43,.12,[x,y,z-zSign*.18],MAT.aluminum,`${side} turbo volute`,[Math.PI/2,0,0]);
  cone('air',.31,.22,.35,[x-.45,y,z],MAT.aluminum,`${side} compressor inlet`,[0,0,Math.PI/2],36);
  tube('air',[[x-.55,y,z],[x-1.1,2.55,z],[x-1.45,2.55,z*.80]],.20,MAT.aluminum,`${side} charge-air pipe`);
  tube('air',[[x+.2,y,z+zSign*.45],[-.4,2.15,zSign*1.85],[1.6,1.95,zSign*1.65]],.15,MAT.exhaust,`${side} exhaust collector`);
  tube('lube',[[x,y-.25,z],[x+.25,1.35,z*.78],[.2,.4,zSign*.55]],.035,MAT.brass,`${side} turbo oil line`,18);
  clamp('service',[x-.75,2.42,z], [0,Math.PI/2,0],.22);
}

function addFrontGearTrain(frontX){
  rounded('crank',[.55,2.35,2.45],[frontX,.45,0],MAT.castDark,'Front gear housing',[0,0,0],.22);
  pulley('start',[frontX-.38,.35,0],.70,.22,'Crank pulley');
  pulley('start',[frontX-.30,1.38,.72],.34,.17,'Accessory pulley');
  pulley('cooling',[frontX-.30,1.42,-.72],.38,.17,'Water-pump pulley');
  tube('start',[[frontX-.5,.35,0],[frontX-.45,1.38,.72],[frontX-.45,1.42,-.72],[frontX-.5,.35,0]],.035,MAT.rubber,'Accessory belt',36);
  cyl('cooling',.46,.50,[frontX-.10,1.30,-.73],MAT.aluminum,'Jacket-water pump',[0,0,Math.PI/2],34);
  rounded('cooling',[.78,.45,.72],[frontX-.10,1.92,-.72],MAT.aluminum,'Thermostat housing',[0,0,0],.10);
}

function addCommonHardware(length=6.5){
  rounded('lube',[length,.62,2.32],[0,-.92,0],MAT.blackPaint,'Oil sump',[0,0,0],.14);
  for(let x=-length/2+.35;x<length/2-.2;x+=.55) rib('lube',[x,-.61,0],1.95,'z',MAT.castDark,'Oil-pan rib');
  const rear=length/2+.18;
  cyl('crank',1.38,.48,[rear,.18,0],MAT.castDark,'Flywheel housing',[0,0,Math.PI/2],56);
  cyl('crank',1.03,.13,[rear+.27,.18,0],MAT.steel,'Flywheel face',[0,0,Math.PI/2],56);
  cyl('start',.43,1.02,[rear-.65,-.35,1.38],MAT.blackPaint,'Starter motor',[0,0,Math.PI/2],36);
  cyl('start',.23,.46,[rear-.93,-.04,1.38],MAT.steel,'Starter solenoid',[0,0,Math.PI/2],28);
  cyl('start',.50,.88,[-length/2+.65,.05,1.55],MAT.aluminum,'Charging alternator',[0,0,Math.PI/2],36);
  torus('start',.39,.055,[-length/2+.18,.05,1.55],MAT.rubber,'Alternator belt',[0,Math.PI/2,0]);
  for(let i=0;i<2;i++) cyl('fuel',.28,.92,[-length/2+1.15+i*.65,.28,-1.65],MAT.filter,`Fuel filter ${i+1}`,[0,0,0],32);
  for(let i=0;i<2;i++) cyl('lube',.31,1.02,[length/2-1.45+i*.70,-.05,-1.60],MAT.filter,`Lube-oil filter ${i+1}`,[0,0,0],32);
  rounded('fuel',[1.15,.68,.60],[-length/2+2.05,.58,-1.54],MAT.castDark,'Fuel pump housing',[0,0,0],.10);
  for(const x of [-length/2+1.0,length/2-1.0]) for(const z of [-1.03,1.03]) rounded('service',[.75,.24,.54],[x,-1.34,z],MAT.castDark,'Engine mounting foot',[0,0,0],.06);
  rounded('service',[length-.5,.22,.18],[0,-.34,1.23],MAT.steel,'Service rail',[0,0,0],.04);
  rounded('service',[length-.5,.22,.18],[0,-.34,-1.23],MAT.steel,'Service rail',[0,0,0],.04);
}

function buildV16(){
  const paint=MAT.cumminsPaint;
  rounded('crank',[6.45,1.75,2.45],[0,.12,0],MAT.cast,'V16 crankcase',[0,0,0],.18);
  rounded('combustion',[5.65,.48,1.35],[0,1.30,0],paint,'V16 central valley housing',[0,0,0],.12);
  for(const z of [-1.27,1.27]) for(let i=0;i<4;i++) rounded('service',[1.16,.46,.10],[-2.15+i*1.43,.42,z],MAT.castDark,'Crankcase access cover',[0,0,0],.05);
  addVBank('Left bank',-1,paint); addVBank('Right bank',1,paint);
  addTurbo('Left',-1); addTurbo('Right',1);
  addCommonHardware(6.45); addFrontGearTrain(-3.42);
  rounded('air',[3.7,.68,1.15],[.55,1.75,0],MAT.aluminum,'Charge-air cooler housing',[0,0,0],.13);
  for(let x=-1.0;x<2.1;x+=.30) rib('air',[x,2.11,0],.98,'z',MAT.dullSteel,'Charge-air cooler rib');
  for(const z of [-.77,.77]){
    tube('fuel',[[-2.6,2.22,z],[2.45,2.22,z]],.045,MAT.steel,'High-pressure fuel distribution',18);
    for(let i=0;i<8;i++){ const x=-2.35+i*.67; tube('fuel',[[x,2.22,z],[x,2.43,z*1.30]],.027,MAT.steel,'Injector feed line',12); }
  }
  tube('cooling',[[-2.7,1.25,-1.30],[-1.7,2.65,-1.18],[1.5,2.65,-1.18],[2.5,1.75,-1.22]],.095,MAT.aluminum,'Left coolant manifold');
  tube('cooling',[[-2.7,1.25,1.30],[-1.7,2.65,1.18],[1.5,2.65,1.18],[2.5,1.75,1.22]],.095,MAT.aluminum,'Right coolant manifold');
  tube('control',[[-2.5,2.80,0],[2.5,2.80,0]],.045,MAT.rubber,'Engine wiring harness');
  for(let i=0;i<6;i++){const x=-2.1+i*.84;tube('control',[[x,2.80,0],[x,2.57,.72]],.025,MAT.rubber,'Sensor branch',10);}
  rounded('control',[1.05,.58,.22],[2.15,2.30,-1.66],MAT.plastic,'Engine control module',[0,0,0],.07);
  torus('service',.23,.055,[-2.15,2.95,-.55],MAT.steel,'Lifting eye',[Math.PI/2,0,0]);
  torus('service',.23,.055,[2.15,2.95,.55],MAT.steel,'Lifting eye',[Math.PI/2,0,0]);
  rounded('service',[.72,.34,.035],[1.10,.92,1.25],MAT.steel,'Identification plate',[0,0,0],.02);
}

function buildInline6(manufacturer='Volvo Penta'){
  const paint=manufacturer.includes('Volvo')?MAT.volvoPaint:MAT.cumminsPaint;
  const len=5.7;
  rounded('crank',[len,1.50,2.0],[0,.10,0],MAT.cast,'Inline-six crankcase',[0,0,0],.17);
  rounded('combustion',[5.25,1.15,1.75],[0,1.32,0],paint,'Inline-six cylinder block',[0,0,0],.14);
  rounded('combustion',[5.35,.46,1.78],[0,2.05,0],MAT.cast,'Cylinder head',[0,0,0],.09);
  for(let i=0;i<3;i++){
    const x=-1.75+i*1.75; rounded('valve',[1.45,.42,1.45],[x,2.46,0],MAT.blackPaint,`Rocker cover ${i+1}`,[0,0,0],.14);
    for(const bx of [-.52,.52]) for(const bz of [-.48,.48]) bolt('service',[x+bx,2.68,bz],'Rocker-cover bolt',.055,[0,0,0]);
  }
  rounded('air',[4.75,.42,.42],[0,1.75,-1.28],MAT.aluminum,'Intake manifold',[0,0,0],.10);
  tube('air',[[-2.35,1.80,1.25],[0,1.92,1.42],[2.35,1.80,1.25]],.16,MAT.exhaust,'Exhaust manifold');
  for(let i=0;i<6;i++){ const x=-2.05+i*.82; tube('air',[[x,1.67,1.02],[x,1.85,1.34]],.07,MAT.exhaust,'Exhaust branch',14); tube('air',[[x,1.72,-1.06],[x,1.75,-1.28]],.055,MAT.aluminum,'Intake runner',12); }
  cyl('air',.67,.42,[-2.45,1.95,-1.78],MAT.aluminum,'Turbocharger compressor',[Math.PI/2,0,0],44);
  cyl('air',.57,.42,[-2.45,1.95,-2.15],MAT.exhaust,'Turbocharger turbine',[Math.PI/2,0,0],44);
  torus('air',.48,.13,[-2.45,1.95,-1.58],MAT.aluminum,'Turbocharger volute',[Math.PI/2,0,0]);
  tube('air',[[-2.45,1.95,-2.55],[-1.4,2.25,-2.6],[.2,2.40,-1.65]],.18,MAT.aluminum,'Charge-air pipe');
  tube('fuel',[[-2.35,2.26,-.72],[2.30,2.26,-.72]],.042,MAT.steel,'Fuel distribution rail',18);
  for(let i=0;i<6;i++){const x=-2.05+i*.82;tube('fuel',[[x,2.26,-.72],[x,2.48,-.32]],.026,MAT.steel,'Injector feed line',10);}
  addCommonHardware(len); addFrontGearTrain(-3.02);
  tube('cooling',[[-2.55,1.30,1.10],[-1.5,2.55,1.08],[1.45,2.55,1.08],[2.35,1.70,1.10]],.09,MAT.aluminum,'Coolant manifold');
  tube('control',[[-2.25,2.78,-.18],[2.25,2.78,-.18]],.04,MAT.rubber,'Engine wiring harness');
  rounded('control',[.92,.52,.20],[1.70,2.15,-1.10],MAT.plastic,'Engine control / junction module',[0,0,0],.07);
  for(let i=0;i<4;i++) rounded('service',[1.05,.40,.08],[-1.95+i*1.30,.48,1.05],MAT.castDark,'Crankcase access cover',[0,0,0],.04);
  for(let x=-2.35;x<=2.35;x+=.47){bolt('service',[x,2.30,.77],'Cylinder-head fastener',.045,[0,0,0]);bolt('service',[x,2.30,-.77],'Cylinder-head fastener',.045,[0,0,0]);}
}

function buildEngineFor(gen){
  clearModel();
  if(gen.id==='gen4') buildV16(); else buildInline6(gen.manufacturer);
  engineRoot.rotation.y = -0.18;
  applyMode();
}

function restoreMaterials(){ for(const [mesh,mat] of originalMaterials) mesh.material = mat; groups.forEach(g=>g.visible=true); }
function technicalMaterials(){
  groups.forEach((g,id)=>{g.visible=true;g.traverse(o=>{if(o.isMesh){o.material=new THREE.MeshStandardMaterial({color:systemColors[id],roughness:.55,metalness:.28});}});});
}
function isolateSystem(){ restoreMaterials(); groups.forEach((g,id)=>g.visible = activeSystem==='all' || id===activeSystem); }
function applyMode(){
  if(!engineRoot) return;
  if(viewMode==='realistic') restoreMaterials(); else if(viewMode==='technical') technicalMaterials(); else isolateSystem();
  if(activeSystem!=='all' && groups.get(activeSystem)?.visible){
    groups.get(activeSystem).traverse(o=>{if(o.isMesh){const c=o.material.clone();c.emissive=new THREE.Color(systemColors[activeSystem]);c.emissiveIntensity=.16;o.material=c;}});
  }
  applyExplode();
}

function applyExplode(){
  const dirs={air:[0,.7,1.1],fuel:[0,.2,-.8],lube:[0,-.45,-.45],cooling:[-.65,.15,.7],combustion:[0,.40,0],crank:[0,-.2,0],valve:[0,.85,0],start:[.75,-.05,.45],control:[.45,.55,-.7],service:[0,0,0]};
  groups.forEach((g,id)=>{const d=dirs[id]||[0,0,0];g.position.set(exploded?d[0]:0,exploded?d[1]:0,exploded?d[2]:0);});
}

function selectSystem(id, component=null){
  activeSystem=id;
  document.querySelectorAll('[data-system]').forEach(b=>b.classList.toggle('active',b.dataset.system===id));
  const meta=SYSTEMS.find(s=>s[0]===id);
  document.querySelector('#selectedName').textContent=(component || (meta?meta[1]:'Engine assembly')).toUpperCase();
  document.querySelector('#selectedDesc').textContent=meta?meta[2]:'Rotate, zoom and select an engine system.';
  document.querySelector('#selectedSystem').textContent=meta?meta[1].toUpperCase():'ALL SYSTEMS';
  document.querySelector('#selectedType').textContent=component?'COMPONENT':'ASSEMBLY';
  document.querySelector('#openSystem').href=id==='all'?`index.html?gen=${activeGen}#systems`:`system.html?system=${id}&gen=${activeGen}`;
  applyMode();
}

function renderSystems(){
  const box=document.querySelector('#systemButtons');
  box.innerHTML=`<button class="active" data-system="all">00 · ALL</button>`+SYSTEMS.map((s,i)=>`<button data-system="${s[0]}">${String(i+1).padStart(2,'0')} · ${s[1]}</button>`).join('');
  box.querySelectorAll('[data-system]').forEach(b=>b.onclick=()=>selectSystem(b.dataset.system));
}
function renderGenerators(){
  const box=document.querySelector('#generatorTabs');
  box.innerHTML=generators.map(g=>`<button class="${g.id===activeGen?'active':''}" data-gen="${g.id}">${g.name.toUpperCase()} · ${g.model} · ${g.ratingKw} kW</button>`).join('');
  box.querySelectorAll('[data-gen]').forEach(b=>b.onclick=()=>{activeGen=b.dataset.gen;renderGenerators();updateMachine();});
}
function updateMachine(){
  const g=generators.find(x=>x.id===activeGen)||generators[0]; if(!g)return;
  document.querySelector('#machineLabel').textContent=`${g.name.toUpperCase()} · ${g.manufacturer} ${g.model} · ${g.ratingKw} kW`;
  const layout=g.id==='gen4'?'V16 HEAVY-DUTY TRAINING LAYOUT':'INLINE-SIX HEAVY-DUTY TRAINING LAYOUT';
  document.querySelector('#stageTitle').textContent=`${g.manufacturer.toUpperCase()} ${g.model} · ${layout}`;
  document.querySelector('#selectedEvidence').textContent='TRAINING MODEL · NOT OEM CAD';
  document.querySelector('#evidenceLink').href=`evidence-flow.html?gen=${g.id}`;
  buildEngineFor(g); selectSystem('all');
  history.replaceState(null,'',`engine-3d.html?gen=${g.id}`);
}

const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown',e=>{
  const r=renderer.domElement.getBoundingClientRect(); pointer.x=((e.clientX-r.left)/r.width)*2-1; pointer.y=-((e.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObjects(pickables.filter(p=>p.visible),false)[0];
  if(hit?.object){selectSystem(hit.object.userData.system,hit.object.userData.component);}
});
renderer.domElement.addEventListener('dblclick',e=>{
  const r=renderer.domElement.getBoundingClientRect(); pointer.x=((e.clientX-r.left)/r.width)*2-1; pointer.y=-((e.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(pointer,camera); const hit=raycaster.intersectObjects(pickables.filter(p=>p.visible),false)[0];
  if(hit){controls.target.lerp(hit.point,.72);camera.position.lerp(hit.point.clone().add(new THREE.Vector3(5,3.2,5.5)),.55);}
});

document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{viewMode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));applyMode();});
document.querySelector('#explodeView').onclick=()=>{exploded=!exploded;document.querySelector('#explodeView').textContent=`EXPLODE: ${exploded?'ON':'OFF'}`;applyExplode();};
document.querySelector('#toggleRotate').onclick=()=>{autoRotate=!autoRotate;document.querySelector('#toggleRotate').textContent=`AUTO ROTATE: ${autoRotate?'ON':'OFF'}`;};
document.querySelector('#resetView').onclick=()=>{camera.position.set(11.5,7.3,13.5);controls.target.set(0,1.25,0);controls.update();};

function resize(){const w=stage.clientWidth,h=stage.clientHeight||650;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage); resize();
function animate(){requestAnimationFrame(animate);controls.autoRotate=autoRotate;controls.autoRotateSpeed=.75;controls.update();renderer.render(scene,camera);}animate();

fetch('data/generators.json').then(r=>r.json()).then(data=>{generators=data;renderSystems();renderGenerators();updateMachine();}).catch(err=>{stage.innerHTML=`<div class="loader">3D MODULE ERROR · ${err.message}</div>`;});
