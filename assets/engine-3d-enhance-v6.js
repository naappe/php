import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// v6 realism layer: runs before engine-3d-v5.js, captures the Three.js scene,
// then enhances every newly-built generator root without changing the evidence boundary.
let capturedScene = null;
const originalSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function(...objects){
  capturedScene = this;
  window.__GF_ENGINE_SCENE__ = this;
  return originalSceneAdd.apply(this, objects);
};

const DETAIL_COLORS = {
  volvo:0x4f8d74, cummins:0x817865, cast:0x535a5e, castDark:0x30363a,
  steel:0xaeb5b9, aluminum:0xc2c8ca, black:0x171b1e, rubber:0x151819,
  exhaust:0x5c4b40, white:0xe8ebeb, brass:0xad8750
};

function material(color, rough=.58, metal=.22){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,envMapIntensity:.75});
}
const MAT = {
  cast:material(DETAIL_COLORS.cast,.82,.24), castDark:material(DETAIL_COLORS.castDark,.88,.22),
  steel:material(DETAIL_COLORS.steel,.32,.86), alum:material(DETAIL_COLORS.aluminum,.38,.7),
  black:material(DETAIL_COLORS.black,.78,.14), rubber:material(DETAIL_COLORS.rubber,.96,.01),
  exhaust:material(DETAIL_COLORS.exhaust,.88,.34), white:material(DETAIL_COLORS.white,.52,.12),
  brass:material(DETAIL_COLORS.brass,.45,.68)
};
function paint(c){return material(c,.58,.14)}
function paintDark(c){return material(new THREE.Color(c).multiplyScalar(.72),.68,.12)}

function noiseTexture(){
  const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');
  const img=x.createImageData(96,96);for(let i=0;i<img.data.length;i+=4){const v=105+Math.floor(Math.random()*42);img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255}x.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(9,9);t.colorSpace=THREE.NoColorSpace;return t;
}
const micro=noiseTexture();

function findRoot(scene){
  if(!scene)return null;
  return scene.children.find(o=>o.isGroup && o.children?.some(c=>c.isGroup && c.userData?.system));
}
function systemGroup(root,id){return root?.children?.find(c=>c.isGroup&&c.userData?.system===id)}
function genId(){
  const t=document.getElementById('machineLabel')?.textContent||'';
  if(t.includes('KTA50'))return 'gen4'; if(t.includes('TWD1416'))return 'gen3'; if(t.includes('LTA10'))return 'gen2'; return 'gen1';
}
function tag(m,sys,name,desc,type='COMPONENT'){
  m.castShadow=true;m.receiveShadow=true;m.userData.system=sys;m.userData.component=name;m.userData.name=name;m.userData.description=desc;m.userData.type=type;return m;
}
function add(root,sys,m){const g=systemGroup(root,sys);if(g)g.add(m);return m}
function rb(sys,size,pos,mat,name,desc,rot=[0,0,0],rad=.08,type='COMPONENT'){
  const m=tag(new THREE.Mesh(new RoundedBoxGeometry(...size,4,Math.min(rad,Math.min(...size)/4)),mat),sys,name,desc,type);m.position.set(...pos);m.rotation.set(...rot);return m;
}
function box(sys,size,pos,mat,name,desc,rot=[0,0,0],type='COMPONENT'){
  const m=tag(new THREE.Mesh(new THREE.BoxGeometry(...size),mat),sys,name,desc,type);m.position.set(...pos);m.rotation.set(...rot);return m;
}
function cyl(sys,r,len,pos,mat,name,desc,rot=[0,0,Math.PI/2],seg=28,type='COMPONENT'){
  const m=tag(new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,seg),mat),sys,name,desc,type);m.position.set(...pos);m.rotation.set(...rot);return m;
}
function torus(sys,R,r,pos,mat,name,desc,rot=[0,Math.PI/2,0],seg=32,type='COMPONENT'){
  const m=tag(new THREE.Mesh(new THREE.TorusGeometry(R,r,12,seg),mat),sys,name,desc,type);m.position.set(...pos);m.rotation.set(...rot);return m;
}
function pipe(sys,pts,r,mat,name,desc,seg=24,type='COMPONENT'){
  const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));return tag(new THREE.Mesh(new THREE.TubeGeometry(curve,seg,r,12,false),mat),sys,name,desc,type)
}
function clamp(root,pos,R=.15){add(root,'service',torus('service',R,.021,pos,MAT.steel,'Hose clamp','Metal clamp securing a hose/pipe joint.',[0,Math.PI/2,0],24,'SEALING'))}
function bolt(root,pos,rot=[0,0,Math.PI/2]){add(root,'service',cyl('service',.035,.08,pos,MAT.steel,'Fastener','Bolted mechanical joint.',rot,10,'FASTENER'))}

function refineMaterials(root){
  root.traverse(o=>{if(!o.isMesh||!o.material)return;const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{
    m.envMapIntensity=.72;
    const n=(o.userData?.component||o.userData?.name||'').toLowerCase();
    if(n.includes('hose')||n.includes('belt')||n.includes('cable')||n.includes('harness')){m.roughness=.94;m.metalness=.01;return}
    if(n.includes('exhaust')||n.includes('turbine')){m.roughness=.86;m.metalness=Math.max(m.metalness||0,.28);m.bumpMap=micro;m.bumpScale=.012;return}
    if((m.metalness||0)<.35 && (m.roughness||0)>.45){m.bumpMap=micro;m.bumpScale=.010}
  })})
}
function addWorkshopLights(scene){
  if(scene.userData.v6Lights)return;scene.userData.v6Lights=true;
  const top=new THREE.PointLight(0xffffff,1.0,28,1.8);top.position.set(0,9,2);scene.add(top);
  const side=new THREE.PointLight(0xcfe7f5,.55,24,1.8);side.position.set(-8,4,8);scene.add(side);
  const warm=new THREE.PointLight(0xffd1a4,.32,18,2);warm.position.set(7,3,-7);scene.add(warm);
  scene.background=new THREE.Color(0x20262b);if(scene.fog)scene.fog.color.set(0x20262b)
}

function enhanceGen1(root){
  // Family-level DGV 500 ST envelope: 3450 x 1250 x 2140 mm. Correct the old stretched X-axis.
  root.scale.set(.78,1.08,1.0);
  const green=DETAIL_COLORS.volvo;
  // Radiator side tanks, shroud depth and bracing.
  add(root,'cooling',rb('cooling',[.32,3.55,.34],[-5.10,.82,-1.78],MAT.black,'Radiator side tank','Radiator side tank / structural edge.'));
  add(root,'cooling',rb('cooling',[.32,3.55,.34],[-5.10,.82,1.78],MAT.black,'Radiator side tank','Radiator side tank / structural edge.'));
  add(root,'cooling',torus('cooling',1.50,.07,[-4.42,.65,0],MAT.castDark,'Fan shroud ring','Depth ring around engine-driven radiator fan.',[0,Math.PI/2,0],44));
  // Fuel service side.
  add(root,'fuel',rb('fuel',[.62,.48,.34],[-.35,.92,-1.38],MAT.castDark,'Fuel lift pump','Low-pressure fuel transfer/lift-pump housing.'));
  add(root,'fuel',pipe('fuel',[[-.66,.96,-1.34],[-1.10,.74,-1.42],[-1.52,.62,-1.42]],.032,MAT.rubber,'Fuel feed hose','Low-pressure fuel feed hose.',18));
  add(root,'fuel',cyl('fuel',.18,.78,[-.88,.34,-1.44],MAT.white,'Water separator bowl','Fuel pre-filter / water-separator canister.',[0,0,0],20));
  // More injector lines and side hardware.
  for(let i=0;i<6;i++){const x=-1.85+i*.72;add(root,'fuel',pipe('fuel',[[x,2.06,-.55],[x+.06,2.36,-.30]],.020,MAT.steel,'High-pressure injector pipe','Individual high-pressure injector pipe.',12,'SUBASSEMBLY'))}
  add(root,'lube',rb('lube',[1.12,.26,.66],[1.92,.64,1.06],MAT.castDark,'Oil cooler housing','Oil cooler / filter-head housing.'));
  add(root,'service',cyl('service',.10,.08,[.52,1.18,1.08],MAT.brass,'Oil filler cap','Service oil-filler cap.',[0,0,0],16,'SERVICE'));
  add(root,'service',cyl('service',.11,.08,[-2.72,2.34,-.72],MAT.brass,'Coolant service cap','Coolant fill/service point.',[0,0,0],16,'SERVICE'));
  // Harnesses and support brackets.
  add(root,'control',pipe('control',[[-1.9,2.58,-.72],[-.9,2.4,-.86],[.2,2.28,-.92],[1.3,2.12,-.98]],.025,MAT.rubber,'Sensor sub-harness','Secondary engine sensor wiring harness.',22,'SUBASSEMBLY'));
  [-1.65,-.80,.05,.90,1.75].forEach(x=>add(root,'service',box('service',[.10,.18,.20],[x,1.28,1.03],MAT.castDark,'Pipe support bracket','Small bracket supporting pipes/harnesses.',[0,0,0],'FASTENER')));
  // Air cleaner straps and pipe clamps.
  add(root,'service',torus('service',.74,.035,[2.05,3.20,-.12],MAT.steel,'Air-cleaner mounting strap','Metal strap securing the cylindrical air cleaner.',[0,Math.PI/2,0],40,'FASTENER'));
  add(root,'service',torus('service',.74,.035,[2.42,3.20,-.12],MAT.steel,'Air-cleaner mounting strap','Metal strap securing the cylindrical air cleaner.',[0,Math.PI/2,0],40,'FASTENER'));
  clamp(root,[.95,2.84,-.55],.19);clamp(root,[-.98,2.44,-1.46],.19);clamp(root,[-3.62,2.38,-1.10],.14);clamp(root,[-3.70,-.35,1.20],.14);
  // Alternator details / terminal box.
  add(root,'crank',rb('crank',[.72,.52,.68],[4.70,1.32,-1.02],MAT.black,'Alternator terminal box','Main alternator terminal / connection enclosure.'));
  for(let i=0;i<12;i++)add(root,'crank',box('crank',[.045,.76,.045],[5.25,-.05,-.55+i*.10],MAT.steel,'Rear ventilation slot','Alternator rear ventilation slot.',[0,0,0],'SUBASSEMBLY'));
  // Additional visible brackets/bolts on engine face.
  for(const x of [-1.7,-.9,-.1,.7,1.5]){bolt(root,[x,.58,1.05]);bolt(root,[x,.58,-1.05])}
}

function enhanceInline(root,id){
  const s=id==='gen2'?.82:1.05;
  // Common inline-six realism additions for Gen2/Gen3.
  add(root,'service',cyl('service',.09*s,.08*s,[.5*s,1.14*s,1.04*s],MAT.brass,'Oil filler cap','Engine service oil-filler cap.',[0,0,0],16,'SERVICE'));
  add(root,'fuel',rb('fuel',[.56*s,.42*s,.32*s],[-.30*s,.82*s,-1.24*s],MAT.castDark,'Fuel transfer pump','Fuel transfer-pump housing.'));
  add(root,'control',pipe('control',[[-1.7*s,2.42*s,-.68*s],[-.3*s,2.24*s,-.80*s],[1.35*s,2.03*s,-.88*s]],.023*s,MAT.rubber,'Sensor harness','Secondary engine wiring harness.',20,'SUBASSEMBLY'));
  for(let i=0;i<6;i++){const x=(-1.7+i*.66)*s;add(root,'fuel',pipe('fuel',[[x,1.94*s,-.46*s],[x+.05*s,2.20*s,-.24*s]],.018*s,MAT.steel,'Injector pipe','Individual injector feed pipe.',10,'SUBASSEMBLY'))}
}

function enhanceV16(root){
  const c=DETAIL_COLORS.cummins;
  // Add proper bank separation and visible V-engine detail over the v5 training chassis.
  for(const sign of [-1,1]){
    const z=sign*1.25;
    add(root,'combustion',rb('combustion',[5.2,.78,.72],[0,1.55,z],paint(c),sign<0?'Left cylinder bank detail':'Right cylinder bank detail','Additional V-bank massing for KTA50 training representation.',[sign*.20,0,0],.09,'ASSEMBLY'));
    for(let i=0;i<4;i++){const x=-1.9+i*1.28;add(root,'valve',rb('valve',[1.00,.28,.64],[x,2.24,z*1.08],MAT.black,`Rocker cover bank ${sign<0?'L':'R'}-${i+1}`,'Individual valve-cover grouping on V-bank.',[sign*.20,0,0],.08,'SUBASSEMBLY'))}
    add(root,'air',pipe('air',[[-2.25,1.92,z*1.42],[0,2.04,z*1.55],[2.25,1.92,z*1.42]],.13,MAT.exhaust,'Bank exhaust manifold','Exhaust manifold along V-engine bank.',28));
    add(root,'air',rb('air',[4.25,.34,.38],[.1,2.02,z*1.72],MAT.alum,'Bank intake plenum','Intake plenum serving one V-bank.',[0,0,0],.08));
    for(let i=0;i<8;i++){const x=-2.0+i*.58;add(root,'fuel',pipe('fuel',[[x,2.20,z*.78],[x,2.42,z*.58]],.017,MAT.steel,'V16 injector pipe','Individual injector feed on one bank.',10,'SUBASSEMBLY'))}
  }
  // Twin turbo and service clusters.
  for(const sign of [-1,1]){
    const z=sign*2.15;add(root,'air',torus('air',.48,.13,[-2.15,2.42,z],MAT.alum,'Turbo compressor volute','Twin-turbo compressor housing.',[0,Math.PI/2,0],40));add(root,'air',pipe('air',[[-2.50,2.42,z],[-3.05,2.78,z],[-1.2,2.88,sign*1.55]],.16,MAT.alum,'Twin-turbo charge pipe','Charge-air routing from turbo to V-bank.',26))
  }
  for(let i=0;i<3;i++){add(root,'fuel',cyl('fuel',.25,.92,[-2.1+i*.56,.15,-1.60],MAT.white,'Fuel filter','Fuel filtration canister.',[0,0,0],28));add(root,'lube',cyl('lube',.26,.94,[1.35+i*.58,-.02,-1.56],MAT.white,'Oil filter','Lubricating-oil filter canister.',[0,0,0],28))}
  add(root,'cooling',pipe('cooling',[[-2.7,2.30,.0],[-1.0,2.66,.0],[1.4,2.66,.0],[2.7,2.30,.0]],.11,paint(c),'Coolant crossover','Upper coolant crossover for V-engine training model.',28));
  add(root,'start',cyl('start',.38,.86,[2.4,-.34,1.35],MAT.black,'Starter motor A','V-engine starter motor.',[0,0,Math.PI/2],32));
  add(root,'start',cyl('start',.38,.86,[2.4,-.34,-1.35],MAT.black,'Starter motor B','Second V-engine starter motor.',[0,0,Math.PI/2],32));
}

function enhance(root,id){
  if(!root||root.userData.v6Enhanced)return;
  root.userData.v6Enhanced=true;
  refineMaterials(root);addWorkshopLights(capturedScene);
  if(id==='gen1')enhanceGen1(root);else if(id==='gen4')enhanceV16(root);else enhanceInline(root,id);
  refineMaterials(root);
}

let lastRoot='';
function tick(){
  const scene=window.__GF_ENGINE_SCENE__||capturedScene;const root=findRoot(scene);if(root&&root.uuid!==lastRoot){lastRoot=root.uuid;setTimeout(()=>enhance(root,genId()),40)}
  requestAnimationFrame(tick);
}
tick();
