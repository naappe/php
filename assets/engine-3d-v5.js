import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const stage = document.querySelector('#threeStage');
const params = new URLSearchParams(location.search);
let activeGen = params.get('gen') || 'gen1';
let activeSystem = 'all';
let viewMode = 'realistic';
let exploded = false;
let autoRotate = false;
let generators = [];
let root, pickables = [], groups = new Map(), originals = new Map();

const SYSTEMS = [
  ['air','Air Intake & Exhaust','Air cleaner, turbocharger, intake manifold, charge-air and exhaust path.'],
  ['fuel','Fuel System','Fuel filters, feed/injection equipment and injector pipework.'],
  ['lube','Lubrication','Oil sump, filters, cooler path and lubricating-oil circuit.'],
  ['cooling','Cooling','Radiator, fan, water pump, thermostat and coolant pipework.'],
  ['combustion','Cylinder & Combustion','Cylinder block, head and combustion structure.'],
  ['crank','Crank Mechanism','Crankcase, flywheel housing, coupling and generator load path.'],
  ['valve','Valve Train','Rocker cover and upper valve-actuation region.'],
  ['start','Starting & Charging','Starter, charging alternator, belts and batteries.'],
  ['control','Control & Protection','Control panel, controller, harnesses and sensors.'],
  ['service','Service & Sealing','Hoses, clamps, mounts, joints, brackets, fasteners and service points.']
];
const SYS_COLOR={air:0x4c9cc4,fuel:0xd39046,lube:0xc6a044,cooling:0x4e9dc4,combustion:0x58a07f,crank:0x7c858e,valve:0x72aa8d,start:0xa18b63,control:0x46aa9d,service:0xa67c63};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x11171d);
scene.fog = new THREE.Fog(0x11171d, 24, 58);
const camera = new THREE.PerspectiveCamera(38,1,.1,150);
camera.position.set(14.5,8.5,16.5);
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
stage.innerHTML=''; stage.appendChild(renderer.domElement);
const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.dampingFactor=.055; controls.target.set(.4,1.6,0); controls.minDistance=7; controls.maxDistance=38; controls.maxPolarAngle=Math.PI*.495;

scene.add(new THREE.HemisphereLight(0xdbe8f2,0x222a31,1.45));
const key=new THREE.DirectionalLight(0xffffff,3.6);key.position.set(9,14,10);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.near=1;key.shadow.camera.far=45;key.shadow.camera.left=-18;key.shadow.camera.right=18;key.shadow.camera.top=18;key.shadow.camera.bottom=-18;scene.add(key);
const fill=new THREE.DirectionalLight(0xb9d8ed,1.4);fill.position.set(-11,8,7);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffd4aa,1.0);rim.position.set(7,7,-12);scene.add(rim);
const front=new THREE.DirectionalLight(0xffffff,.7);front.position.set(0,6,14);scene.add(front);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0x1e252b,roughness:.92,metalness:.03}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.72;floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(46,46,0x38505f,0x26333c);grid.position.y=-1.70;grid.material.opacity=.25;grid.material.transparent=true;scene.add(grid);

const mat=(c,r=.6,m=.2)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const M={
  volvo:mat(0x4a8f73,.57,.14),volvo2:mat(0x39715b,.67,.13),volvo3:mat(0x2e5e4b,.72,.11),
  cast:mat(0x535b60,.82,.23),cast2:mat(0x363c40,.86,.27),steel:mat(0xaeb4b7,.35,.84),dull:mat(0x7e878b,.56,.62),
  alum:mat(0xb7bdbe,.43,.62),rubber:mat(0x171a1d,.96,.02),hose:mat(0x202427,.92,.03),brass:mat(0xa8844e,.44,.70),
  whiteFilter:mat(0xe5e9e9,.50,.10),greenFilter:mat(0x355e54,.62,.15),plastic:mat(0x242a2e,.78,.06),exhaust:mat(0x5b4b42,.87,.40),
  black:mat(0x181c1f,.70,.19),radiator:mat(0x1f2427,.80,.37),copper:mat(0x8a593d,.48,.64),glass:mat(0x789c90,.25,.12),
  cummins:mat(0x817864,.62,.16)
};

function makeGroups(){groups=new Map();SYSTEMS.forEach(([id])=>{const g=new THREE.Group();g.userData.system=id;groups.set(id,g);root.add(g);});}
function clearModel(){if(root)scene.remove(root);root=new THREE.Group();scene.add(root);pickables=[];originals=new Map();makeGroups();}
function register(mesh,id,name){mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.system=id;mesh.userData.component=name||id;pickables.push(mesh);originals.set(mesh,mesh.material);groups.get(id).add(mesh);return mesh;}
function rounded(id,size,pos,material,name,rot=[0,0,0],radius=.10){const geo=new RoundedBoxGeometry(size[0],size[1],size[2],4,Math.min(radius,Math.min(...size)/4));const m=register(new THREE.Mesh(geo,material),id,name);m.position.set(...pos);m.rotation.set(...rot);return m;}
function box(id,size,pos,material,name,rot=[0,0,0]){const m=register(new THREE.Mesh(new THREE.BoxGeometry(...size),material),id,name);m.position.set(...pos);m.rotation.set(...rot);return m;}
function cyl(id,r,depth,pos,material,name,rot=[Math.PI/2,0,0],seg=36){const m=register(new THREE.Mesh(new THREE.CylinderGeometry(r,r,depth,seg),material),id,name);m.position.set(...pos);m.rotation.set(...rot);return m;}
function torus(id,R,r,pos,material,name,rot=[Math.PI/2,0,0]){const m=register(new THREE.Mesh(new THREE.TorusGeometry(R,r,14,44),material),id,name);m.position.set(...pos);m.rotation.set(...rot);return m;}
function tube(id,pts,r,material,name,segments=32){const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));return register(new THREE.Mesh(new THREE.TubeGeometry(c,segments,r,12,false),material),id,name);}
function bolt(id,pos,s=.055){const b=cyl(id,s,.09,pos,M.steel,'Fastener',[0,0,0],12);cyl(id,s*1.45,.035,[pos[0],pos[1]+.055,pos[2]],M.dull,'Bolt head',[0,0,0],6);return b;}
function clamp(id,pos,R=.18,rot=[Math.PI/2,0,0]){return torus(id,R,.026,pos,M.steel,'Hose clamp',rot);}

function buildGen1(){
  const L=13.8,W=5.0;
  rounded('service',[L,.42,W],[.15,-1.46,0],M.volvo,'Baseframe / fuel tank',[0,0,0],.08);
  for(const x of [-5.8,-3.0,0.0,3.0,5.6]){box('service',[.55,.45,4.15],[x,-1.15,0],M.volvo2,'Base crossmember');rounded('service',[.46,.28,.86],[x,-1.67,1.65],M.cast2,'Lifting pocket',[0,0,0],.04);rounded('service',[.46,.28,.86],[x,-1.67,-1.65],M.cast2,'Lifting pocket',[0,0,0],.04);}
  rounded('cooling',[.44,5.15,4.25],[-5.75,1.08,0],M.black,'Radiator outer frame',[0,0,0],.08);
  rounded('cooling',[.16,4.68,3.72],[-5.52,1.08,0],M.radiator,'Radiator core',[0,0,0],.04);
  for(let y=-1.0;y<3.05;y+=.16)box('cooling',[.028,.050,3.48],[-5.42,y,0],M.dull,'Radiator fin');
  for(let z=-1.60;z<=1.60;z+=.40)box('cooling',[.03,4.45,.035],[-5.39,1.08,z],M.dull,'Radiator vertical fin');
  cyl('cooling',1.60,.22,[-5.02,1.0,0],M.black,'Fan shroud',[0,0,Math.PI/2],54);
  cyl('cooling',.30,.30,[-4.87,1.0,0],M.cast2,'Fan hub',[0,0,Math.PI/2],34);
  for(let a=0;a<8;a++){const ang=a*Math.PI/4;const blade=box('cooling',[.05,.98,.26],[-4.74,1.0+Math.sin(ang)*.52,Math.cos(ang)*.52],M.dull,'Cooling fan blade',[ang,0,0]);blade.rotation.x=ang;}
  rounded('cooling',[.34,.32,3.92],[-5.46,3.58,0],M.black,'Radiator top tank',[0,0,0],.06);rounded('cooling',[.34,.30,3.92],[-5.46,-1.30,0],M.black,'Radiator bottom tank',[0,0,0],.06);
  rounded('crank',[5.35,1.55,2.18],[-.75,.15,0],M.cast,'Crankcase',[0,0,0],.16);
  rounded('combustion',[5.02,1.72,1.95],[-.80,1.70,0],M.volvo,'Cylinder block',[0,0,0],.15);
  for(let i=0;i<6;i++){const x=-2.72+i*.78;rounded('combustion',[.62,1.44,1.72],[x,1.72,0],i%2?M.volvo:M.volvo2,'Cylinder casting rib',[0,0,0],.08);}
  rounded('combustion',[5.10,.52,1.94],[-.78,2.92,0],M.volvo2,'Cylinder head',[0,0,0],.10);
  rounded('valve',[5.25,.52,1.22],[-.75,3.38,-.06],M.volvo,'Rocker cover',[0,0,0],.14);
  for(let i=0;i<6;i++){const x=-2.72+i*.78;rounded('valve',[.67,.16,1.05],[x,3.68,-.06],M.volvo2,`Rocker cover section ${i+1}`,[0,0,0],.06);bolt('service',[x-.22,3.81,.40],.04);bolt('service',[x+.22,3.81,-.48],.04);}
  rounded('lube',[5.10,.62,2.03],[-.72,-.92,0],M.black,'Oil sump',[0,0,0],.12);for(let i=0;i<9;i++)box('lube',[.05,.44,1.80],[-2.80+i*.64,-.78,0],M.cast2,'Oil-pan stiffener');
  cyl('air',.30,4.70,[-.72,2.75,1.28],M.volvo2,'Intake manifold',[0,0,Math.PI/2],34);
  for(let i=0;i<6;i++){const x=-2.70+i*.78;tube('air',[[x,2.78,1.12],[x,2.48,.86],[x,2.28,.74]],.052,M.volvo2,'Intake runner',14);}
  tube('air',[[-2.85,2.42,-1.05],[-1.65,2.64,-1.36],[0.25,2.64,-1.40],[1.70,2.48,-1.14]],.16,M.exhaust,'Exhaust manifold',34);
  for(let i=0;i<6;i++){const x=-2.68+i*.78;tube('air',[[x,2.30,-.88],[x,2.48,-1.20]],.067,M.exhaust,'Exhaust branch',12);}
  cyl('air',.55,.42,[2.02,3.02,-1.20],M.alum,'Turbo compressor',[Math.PI/2,0,0],48);torus('air',.42,.13,[2.02,3.02,-1.01],M.alum,'Turbo compressor volute',[Math.PI/2,0,0]);cyl('air',.50,.42,[1.75,3.02,-1.58],M.exhaust,'Turbo turbine',[Math.PI/2,0,0],48);torus('air',.40,.13,[1.75,3.02,-1.77],M.exhaust,'Turbo turbine volute',[Math.PI/2,0,0]);cyl('air',.14,.64,[1.88,3.02,-1.39],M.steel,'Turbo shaft housing',[Math.PI/2,0,0],28);tube('lube',[[1.85,2.80,-1.40],[1.55,1.62,-.96],[.52,.30,-.62]],.030,M.brass,'Turbo oil feed');clamp('service',[2.38,3.02,-1.20],.20,[Math.PI/2,0,0]);
  cyl('air',.66,1.40,[.48,4.35,-.18],M.black,'Air cleaner canister',[0,0,Math.PI/2],46);cyl('air',.52,.20,[-.27,4.35,-.18],M.dull,'Air cleaner front cap',[0,0,Math.PI/2],42);cyl('air',.52,.20,[1.23,4.35,-.18],M.dull,'Air cleaner rear cap',[0,0,Math.PI/2],42);tube('air',[[-.12,4.12,-.18],[-.95,4.0,-.36],[-1.85,3.68,-.70],[1.96,3.32,-1.10]],.17,M.hose,'Air cleaner to turbo hose',42);clamp('service',[-.95,4.0,-.36],.18,[0,Math.PI/2,0]);clamp('service',[1.82,3.35,-1.06],.18,[0,Math.PI/2,0]);
  tube('air',[[2.30,3.05,-.92],[3.20,3.15,-.72],[4.18,3.02,-.40],[4.72,2.70,-.05],[5.05,2.18,.20]],.13,M.alum,'Charge-air pipe',36);tube('air',[[-4.55,2.52,.98],[-3.65,2.55,1.18],[-2.65,2.78,1.16],[-1.48,2.82,1.24]],.14,M.alum,'Charge-air cooler outlet pipe',34);clamp('service',[-3.64,2.55,1.18],.15,[0,Math.PI/2,0]);
  cyl('cooling',.42,.42,[-3.15,1.20,.94],M.alum,'Water pump',[0,0,Math.PI/2],36);rounded('cooling',[.78,.44,.70],[-2.90,2.02,.90],M.alum,'Thermostat housing',[0,0,0],.09);tube('cooling',[[-5.35,2.70,-1.35],[-4.15,2.56,-1.28],[-3.28,2.25,-.98],[-2.86,2.02,-.90]],.13,M.rubber,'Upper radiator hose',34);tube('cooling',[[-5.34,-.88,1.34],[-4.15,-.80,1.40],[-3.48,.18,1.12],[-3.12,1.02,.96]],.13,M.rubber,'Lower radiator hose',34);clamp('service',[-4.15,2.56,-1.28],.14,[0,Math.PI/2,0]);clamp('service',[-4.15,-.80,1.40],.14,[0,Math.PI/2,0]);tube('cooling',[[-2.72,2.24,.86],[-1.55,3.10,.92],[1.25,3.08,.92],[2.05,2.42,.90]],.082,M.alum,'Cylinder-head coolant rail',28);
  rounded('fuel',[1.02,.74,.62],[-1.92,.75,1.30],M.volvo2,'Injection / fuel pump housing',[0,0,0],.10);cyl('fuel',.24,.90,[-3.00,.20,1.38],M.whiteFilter,'Primary fuel filter',[0,0,0],28);cyl('fuel',.24,.90,[-2.43,.20,1.38],M.whiteFilter,'Secondary fuel filter',[0,0,0],28);cyl('fuel',.15,.64,[-1.40,.34,1.38],M.glass,'Water separator bowl',[0,0,0],24);cyl('fuel',.18,.12,[-1.40,.72,1.38],M.black,'Separator head',[0,0,0],24);tube('fuel',[[-2.20,1.10,1.23],[-1.70,2.00,.94],[-1.55,3.05,.48]],.045,M.steel,'High-pressure fuel gallery');for(let i=0;i<6;i++){const x=-2.70+i*.78;tube('fuel',[[-1.55,3.05,.48],[x,3.20,.42],[x,3.38,.18]],.025,M.steel,`Injector pipe ${i+1}`,18);cyl('fuel',.055,.28,[x,3.26,.12],M.steel,'Injector top',[0,0,0],14);}
  cyl('lube',.28,1.00,[1.08,-.15,1.35],M.whiteFilter,'Lube-oil filter 1',[0,0,0],30);cyl('lube',.28,1.00,[1.72,-.15,1.35],M.whiteFilter,'Lube-oil filter 2',[0,0,0],30);rounded('lube',[1.22,.66,.38],[.18,.48,1.30],M.alum,'Oil cooler housing',[0,0,0],.08);tube('lube',[[-2.20,-.35,1.03],[-1.00,.12,1.20],[.18,.48,1.30],[1.30,.30,1.35]],.055,M.brass,'Oil service pipe');
  cyl('start',.38,.88,[2.15,-.40,-1.30],M.black,'Starter motor',[0,0,Math.PI/2],34);cyl('start',.19,.42,[1.88,-.05,-1.30],M.steel,'Starter solenoid',[0,0,Math.PI/2],24);cyl('start',.42,.84,[-2.70,.28,-1.28],M.alum,'Charging alternator',[0,0,Math.PI/2],36);torus('start',.31,.035,[-3.18,.28,-1.28],M.rubber,'Alternator belt',[0,Math.PI/2,0]);cyl('start',.56,.18,[-3.24,1.12,-1.02],M.black,'Accessory pulley',[0,0,Math.PI/2],34);cyl('start',.72,.20,[-3.31,.18,-.30],M.black,'Crank pulley',[0,0,Math.PI/2],38);tube('start',[[-3.42,.18,-.30],[-3.32,1.12,-1.02],[-3.18,.28,-1.28],[-3.42,.18,-.30]],.035,M.rubber,'Accessory belt',28);
  cyl('crank',1.20,.52,[2.72,.18,0],M.cast2,'Flywheel housing',[0,0,Math.PI/2],52);cyl('crank',.90,.18,[3.02,.18,0],M.steel,'Flexible coupling',[0,0,Math.PI/2],48);cyl('crank',1.55,3.40,[4.92,.18,0],M.volvo,'Stamford alternator body',[0,0,Math.PI/2],56);cyl('crank',1.32,.40,[3.18,.18,0],M.dull,'Alternator drive-end bracket',[0,0,Math.PI/2],52);cyl('crank',1.35,.45,[6.68,.18,0],M.volvo2,'Alternator non-drive-end housing',[0,0,Math.PI/2],52);cyl('crank',.76,.24,[6.97,.18,0],M.cast2,'Alternator rear bearing cap',[0,0,Math.PI/2],38);for(let i=0;i<20;i++){const z=-1.00+i*.105;box('crank',[2.45,.035,.042],[4.90,1.26,z],M.dull,'Alternator ventilation slot');}rounded('crank',[1.62,.38,1.94],[4.78,-1.12,0],M.volvo2,'Alternator mounting saddle',[0,0,0],.09);rounded('crank',[.92,.54,.86],[4.92,1.68,-.86],M.black,'Alternator terminal box',[0,0,0],.07);for(let i=0;i<5;i++)cyl('crank',.045,.10,[4.70+i*.10,1.80,-1.33],M.brass,'Terminal stud',[Math.PI/2,0,0],12);
  rounded('control',[1.60,1.48,.58],[5.75,2.86,-.20],M.black,'Control panel enclosure',[0,0,0],.07);rounded('control',[1.24,.78,.035],[5.75,2.93,-.51],M.plastic,'DSE controller face',[0,0,0],.03);box('control',[.56,.28,.03],[5.50,3.05,-.54],M.dull,'Controller LCD');for(let i=0;i<5;i++)cyl('control',.045,.025,[6.08,3.17-i*.17,-.55],i===0?mat(0xc94d58,.45,.05):M.steel,'Control button',[Math.PI/2,0,0],16);box('control',[.15,1.50,.16],[5.15,2.10,-.10],M.volvo2,'Control panel support');tube('control',[[5.18,2.18,-.12],[4.45,1.62,-.46],[3.85,1.38,-.70]],.045,M.hose,'Control harness');
  rounded('start',[1.05,.62,.82],[4.15,-.68,1.54],M.black,'Battery box',[0,0,0],.07);for(const dx of [-.26,.26])cyl('start',.05,.06,[4.15+dx,-.32,1.64],M.brass,'Battery terminal',[0,0,0],12);tube('start',[[4.00,-.44,1.42],[3.08,-.18,1.04],[2.38,-.32,.66]],.050,M.hose,'Starter battery cable');
  for(let i=0;i<4;i++)rounded('service',[.94,.36,.07],[-2.35+i*1.13,.50,-1.12],M.cast2,'Crankcase service cover',[0,0,0],.04);for(const x of [-2.75,-1.00,1.00,2.50]){const eye=torus('service',.13,.03,[x,3.86,.08],M.brass,'Lifting eye',[Math.PI/2,0,0]);eye.rotation.z=Math.PI/2;}rounded('service',[.62,.28,.035],[.92,1.42,1.12],M.steel,'Engine identification plate',[0,0,0],.02);for(const x of [-2.40,2.15])for(const z of [-1.05,1.05])rounded('service',[.72,.28,.54],[x,-1.15,z],M.cast2,'Anti-vibration mount',[0,0,0],.05);clamp('service',[4.18,3.02,-.40],.14,[0,Math.PI/2,0]);clamp('service',[-2.65,2.78,1.16],.14,[0,Math.PI/2,0]);tube('control',[[-2.50,3.86,-.42],[2.22,3.86,-.42]],.038,M.hose,'Main engine harness',22);for(let i=0;i<6;i++){const x=-2.38+i*.80;tube('control',[[x,3.84,-.42],[x,3.50,-.24]],.022,M.hose,'Injector harness branch',10);}root.rotation.y=-.10;
}

function buildInlineGeneric(paint){rounded('crank',[5.5,1.5,2.1],[0,.1,0],M.cast,'Inline crankcase',[0,0,0],.16);rounded('combustion',[5.2,1.6,1.85],[0,1.65,0],paint,'Inline cylinder block',[0,0,0],.14);rounded('combustion',[5.15,.48,1.88],[0,2.78,0],M.cast,'Cylinder head',[0,0,0],.09);for(let i=0;i<3;i++)rounded('valve',[1.48,.42,1.40],[-1.75+i*1.75,3.15,0],M.black,`Rocker cover ${i+1}`,[0,0,0],.13);tube('air',[[-2.2,2.2,1.15],[0,2.45,1.35],[2.2,2.2,1.15]],.14,M.exhaust,'Exhaust manifold');cyl('air',.62,.40,[-2.45,2.45,-1.55],M.alum,'Turbo compressor');cyl('air',.54,.40,[-2.45,2.45,-1.90],M.exhaust,'Turbo turbine');for(let i=0;i<2;i++)cyl('fuel',.26,.86,[-2.15+i*.62,.38,-1.45],M.whiteFilter,'Fuel filter',[0,0,0]);for(let i=0;i<2;i++)cyl('lube',.28,.94,[1.50+i*.66,.0,-1.45],M.whiteFilter,'Oil filter',[0,0,0]);rounded('lube',[5.1,.58,1.95],[0,-.92,0],M.black,'Oil sump',[0,0,0],.12);cyl('crank',1.22,.45,[3.0,.15,0],M.cast2,'Flywheel housing',[0,0,Math.PI/2],52);rounded('service',[6.4,.40,3.0],[0,-1.45,0],paint,'Engine skid',[0,0,0],.07);}
function buildV16(){rounded('crank',[6.5,1.8,2.6],[0,.12,0],M.cast,'V16 crankcase',[0,0,0],.18);rounded('combustion',[5.9,.48,1.30],[0,1.34,0],M.cummins,'Central valley housing',[0,0,0],.12);for(const sign of [-1,1]){const z=sign*1.10,a=sign*-.22;rounded('combustion',[5.55,1.08,.98],[0,1.36,z],M.cummins,'Cylinder bank',[a,0,0],.11);rounded('combustion',[5.65,.42,1.04],[0,2.08,z*1.06],M.cast,'Cylinder head',[a,0,0],.09);for(let i=0;i<4;i++)rounded('valve',[1.08,.40,.84],[-2.0+i*1.32,2.48,z*1.10],M.black,`Rocker cover ${i+1}`,[a,0,0],.13);rounded('air',[4.70,.46,.48],[0,2.02,z*1.90],M.alum,'Intake plenum',[0,0,0],.10);tube('air',[[-2.55,1.78,z*1.58],[0,1.92,z*1.68],[2.48,1.78,z*1.58]],.16,M.exhaust,'Exhaust manifold');}for(const sign of [-1,1]){const z=sign*2.45;cyl('air',.60,.42,[-2.3,2.32,z],M.alum,'Turbo compressor');cyl('air',.54,.42,[-2.3,2.32,z+sign*.38],M.exhaust,'Turbo turbine');tube('air',[[-2.65,2.32,z],[-3.1,2.78,z],[-1.5,2.92,sign*1.72]],.18,M.alum,'Charge-air pipe');}rounded('air',[3.8,.64,1.15],[.55,1.82,0],M.alum,'Charge-air cooler',[0,0,0],.12);rounded('lube',[6.3,.62,2.40],[0,-.95,0],M.black,'Oil sump',[0,0,0],.12);for(let i=0;i<2;i++)cyl('fuel',.29,.94,[-2.1+i*.66,.22,-1.65],M.whiteFilter,'Fuel filter',[0,0,0]);for(let i=0;i<2;i++)cyl('lube',.31,1.02,[1.65+i*.70,-.04,-1.60],M.whiteFilter,'Oil filter',[0,0,0]);cyl('crank',1.34,.46,[3.50,.18,0],M.cast2,'Flywheel housing',[0,0,Math.PI/2],54);rounded('service',[7.2,.42,3.2],[0,-1.50,0],M.cummins,'V16 skid',[0,0,0],.08);tube('control',[[-2.60,2.85,0],[2.60,2.85,0]],.042,M.hose,'Engine harness');}

function buildFor(g){clearModel();if(g.id==='gen1')buildGen1();else if(g.id==='gen4')buildV16();else buildInlineGeneric(g.manufacturer.includes('Volvo')?M.volvo:M.cummins);applyMode();}
function restore(){for(const [m,mat0] of originals)m.material=mat0;groups.forEach(g=>g.visible=true);}
function technical(){groups.forEach((g,id)=>{g.visible=true;g.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({color:SYS_COLOR[id],roughness:.56,metalness:.24});});});}
function isolate(){restore();groups.forEach((g,id)=>g.visible=activeSystem==='all'||id===activeSystem);}
function applyMode(){if(!root)return;if(viewMode==='realistic')restore();else if(viewMode==='technical')technical();else isolate();if(activeSystem!=='all'&&groups.get(activeSystem)?.visible){groups.get(activeSystem).traverse(o=>{if(o.isMesh){const c=o.material.clone();c.emissive=new THREE.Color(SYS_COLOR[activeSystem]);c.emissiveIntensity=.12;o.material=c;}});}applyExplode();}
function applyExplode(){const d={air:[0,.70,1.15],fuel:[0,.25,-.75],lube:[0,-.50,-.40],cooling:[-.75,.20,.70],combustion:[0,.45,0],crank:[.25,-.10,0],valve:[0,.85,0],start:[.70,.05,.35],control:[.50,.55,-.75],service:[0,0,0]};groups.forEach((g,id)=>{const a=d[id]||[0,0,0];g.position.set(exploded?a[0]:0,exploded?a[1]:0,exploded?a[2]:0);});}
function selectSystem(id,component=null){activeSystem=id;document.querySelectorAll('[data-system]').forEach(b=>b.classList.toggle('active',b.dataset.system===id));const meta=SYSTEMS.find(s=>s[0]===id);document.querySelector('#selectedName').textContent=(component||(meta?meta[1]:'Engine assembly')).toUpperCase();document.querySelector('#selectedDesc').textContent=meta?meta[2]:'Rotate, zoom and select an engine system.';document.querySelector('#selectedSystem').textContent=meta?meta[1].toUpperCase():'ALL SYSTEMS';document.querySelector('#selectedType').textContent=component?'COMPONENT':'ASSEMBLY';document.querySelector('#openSystem').href=id==='all'?`index.html?gen=${activeGen}#systems`:`system.html?system=${id}&gen=${activeGen}`;applyMode();}
function renderSystems(){const el=document.querySelector('#systemButtons');el.innerHTML=`<button class="active" data-system="all">00 · ALL</button>`+SYSTEMS.map((s,i)=>`<button data-system="${s[0]}">${String(i+1).padStart(2,'0')} · ${s[1]}</button>`).join('');el.querySelectorAll('[data-system]').forEach(b=>b.onclick=()=>selectSystem(b.dataset.system));}
function renderGenerators(){const el=document.querySelector('#generatorTabs');el.innerHTML=generators.map(g=>`<button class="${g.id===activeGen?'active':''}" data-gen="${g.id}">${g.name.toUpperCase()} · ${g.model} · ${g.ratingKw} kW</button>`).join('');el.querySelectorAll('[data-gen]').forEach(b=>b.onclick=()=>{activeGen=b.dataset.gen;renderGenerators();updateMachine();});}
function updateMachine(){const g=generators.find(x=>x.id===activeGen)||generators[0];if(!g)return;document.querySelector('#machineLabel').textContent=`${g.name.toUpperCase()} · ${g.manufacturer} ${g.model} · ${g.ratingKw} kW`;const layout=g.id==='gen1'?'REFERENCE-PROPORTIONED OPEN GENSET':g.id==='gen4'?'V16 HEAVY-DUTY TRAINING LAYOUT':'INLINE-SIX HEAVY-DUTY TRAINING LAYOUT';document.querySelector('#stageTitle').textContent=`${g.manufacturer.toUpperCase()} ${g.model} · ${layout}`;document.querySelector('#selectedEvidence').textContent=g.id==='gen1'?'PHOTO + DGV 500 ST FAMILY REFERENCE':'TRAINING MODEL · NOT OEM CAD';document.querySelector('#evidenceLink').href=`evidence-flow.html?gen=${g.id}`;buildFor(g);selectSystem('all');history.replaceState(null,'',`engine-3d.html?gen=${g.id}`);if(g.id==='gen1'){camera.position.set(15.2,7.8,17.8);controls.target.set(.35,1.45,0);}else{camera.position.set(12.5,7.4,14.5);controls.target.set(0,1.25,0);}controls.update();}

const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();renderer.domElement.addEventListener('pointerdown',e=>{const r=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(pickables.filter(p=>p.visible),false)[0];if(hit?.object)selectSystem(hit.object.userData.system,hit.object.userData.component);});
renderer.domElement.addEventListener('dblclick',e=>{const r=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(pickables.filter(p=>p.visible),false)[0];if(hit){controls.target.lerp(hit.point,.75);camera.position.lerp(hit.point.clone().add(new THREE.Vector3(5,3.2,5.5)),.55);}});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{viewMode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));applyMode();});
document.querySelector('#explodeView').onclick=()=>{exploded=!exploded;document.querySelector('#explodeView').textContent=`EXPLODE: ${exploded?'ON':'OFF'}`;applyExplode();};
document.querySelector('#toggleRotate').onclick=()=>{autoRotate=!autoRotate;document.querySelector('#toggleRotate').textContent=`AUTO ROTATE: ${autoRotate?'ON':'OFF'}`;};
document.querySelector('#resetView').onclick=()=>{const g=generators.find(x=>x.id===activeGen);if(g?.id==='gen1'){camera.position.set(15.2,7.8,17.8);controls.target.set(.35,1.45,0);}else{camera.position.set(12.5,7.4,14.5);controls.target.set(0,1.25,0);}controls.update();};
function resize(){const w=stage.clientWidth,h=stage.clientHeight||650;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);resize();
function animate(){requestAnimationFrame(animate);controls.autoRotate=autoRotate;controls.autoRotateSpeed=.70;controls.update();renderer.render(scene,camera);}animate();
fetch('data/generators.json').then(r=>r.json()).then(data=>{generators=data;renderSystems();renderGenerators();updateMachine();}).catch(err=>{stage.innerHTML=`<div class="loader">3D MODULE ERROR · ${err.message}</div>`;});
