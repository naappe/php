import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// V8 Volvo 13L family visual-reference layer.
// Uses user-supplied TAD1345GE/TAD1345VE family photos only for visible shape cues.
// It does NOT promote the model to exact OEM or installed-engine geometry.
const C={green:0x4f8d74,green2:0x386f5b,steel:0xaeb5b9,alum:0xc7ccce,black:0x171a1d,dark:0x252a2d,white:0xf1f3f2,blue:0x2f69b7,rubber:0x171a1c,cast:0x4b5256,red:0xc94848,yellow:0xe0be32};
const mat=(c,r=.6,m=.2)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,envMapIntensity:.8});
const M={green:mat(C.green,.58,.14),green2:mat(C.green2,.66,.13),steel:mat(C.steel,.32,.86),alum:mat(C.alum,.38,.72),black:mat(C.black,.82,.10),dark:mat(C.dark,.88,.16),white:mat(C.white,.46,.10),blue:mat(C.blue,.88,.02),rubber:mat(C.rubber,.96,.01),cast:mat(C.cast,.84,.24),red:mat(C.red,.48,.12),yellow:mat(C.yellow,.55,.12)};

function rootOf(scene){return scene?.children?.find(o=>o.isGroup&&o.children?.some(c=>c.isGroup&&c.userData?.system));}
function group(root,id){return root?.children?.find(c=>c.isGroup&&c.userData?.system===id);}
function isGen1(){return (document.getElementById('machineLabel')?.textContent||'').includes('TAD1345');}
function tag(m,sys,name,desc,type='COMPONENT'){m.castShadow=true;m.receiveShadow=true;m.userData.system=sys;m.userData.name=name;m.userData.component=name;m.userData.description=desc;m.userData.type=type;m.userData.v8=true;m.userData.v8Base=m.material;return m;}
function add(root,sys,m){group(root,sys)?.add(m);return m;}
function rb(sys,size,pos,material,name,desc,rot=[0,0,0],rad=.08,type='COMPONENT'){const m=tag(new THREE.Mesh(new RoundedBoxGeometry(...size,4,Math.min(rad,Math.min(...size)/4)),material),sys,name,desc,type);m.position.set(...pos);m.rotation.set(...rot);return m;}
function box(sys,size,pos,material,name,desc,rot=[0,0,0],type='COMPONENT'){const m=tag(new THREE.Mesh(new THREE.BoxGeometry(...size),material),sys,name,desc,type);m.position.set(...pos);m.rotation.set(...rot);return m;}
function cyl(sys,r,len,pos,material,name,desc,rot=[0,0,Math.PI/2],seg=32,type='COMPONENT'){const m=tag(new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,seg),material),sys,name,desc,type);m.position.set(...pos);m.rotation.set(...rot);return m;}
function torus(sys,R,r,pos,material,name,desc,rot=[0,Math.PI/2,0],seg=36,type='COMPONENT'){const m=tag(new THREE.Mesh(new THREE.TorusGeometry(R,r,14,seg),material),sys,name,desc,type);m.position.set(...pos);m.rotation.set(...rot);return m;}
function pipe(sys,pts,r,material,name,desc,seg=28,type='COMPONENT'){const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));return tag(new THREE.Mesh(new THREE.TubeGeometry(c,seg,r,12,false),material),sys,name,desc,type);}
function clamp(root,pos,R=.15,rot=[0,Math.PI/2,0]){add(root,'service',torus('service',R,.023,pos,M.steel,'Hose clamp','Visible metal hose/pipe clamp.',rot,24,'SEALING'));}
function bolt(root,pos){add(root,'service',cyl('service',.035,.09,pos,M.steel,'Fastener','Visible mechanical fastener.',[0,0,Math.PI/2],10,'FASTENER'));}

function addExpansionTank(root){
  add(root,'cooling',rb('cooling',[1.55,.60,.88],[-4.25,4.05,.62],new THREE.MeshPhysicalMaterial({color:0xf3f2e8,roughness:.42,metalness:.0,transmission:.08,transparent:true,opacity:.92}),'Coolant expansion tank','Family-reference translucent coolant expansion tank above radiator.',[0,0,0],.14,'ASSEMBLY'));
  add(root,'cooling',cyl('cooling',.16,.12,[-3.82,4.39,.62],M.yellow,'Expansion tank cap','Coolant expansion-tank cap.',[0,0,0],20,'SERVICE'));
  add(root,'cooling',pipe('cooling',[[-4.30,3.76,.55],[-4.12,3.32,.40],[-3.65,2.85,.22]],.055,M.rubber,'Expansion-tank hose','Coolant expansion/vent hose.',18));
}

function addRadiatorGuard(root){
  // Dense external lattice visible in the engine-side reference.
  for(let y=-.80;y<=3.15;y+=.22) add(root,'cooling',box('cooling',[.025,.035,3.68],[-5.82,y,0],M.steel,'Radiator protective mesh','Horizontal protective radiator grille.',[0,0,0],'SUBASSEMBLY'));
  for(let z=-1.72;z<=1.72;z+=.22) add(root,'cooling',box('cooling',[.025,4.05,.035],[-5.81,1.18,z],M.steel,'Radiator protective mesh','Vertical protective radiator grille.',[0,0,0],'SUBASSEMBLY'));
  add(root,'cooling',rb('cooling',[.20,4.55,.20],[-5.92,1.16,-1.92],M.dark,'Radiator guard rail','Black radiator outer guard rail.',[0,0,0],.04,'STRUCTURE'));
  add(root,'cooling',rb('cooling',[.20,4.55,.20],[-5.92,1.16,1.92],M.dark,'Radiator guard rail','Black radiator outer guard rail.',[0,0,0],.04,'STRUCTURE'));
}

function addChargeAirReference(root){
  add(root,'air',pipe('air',[[-3.70,.42,1.42],[-3.18,.70,1.55],[-2.72,1.14,1.46],[-2.38,1.52,1.24]],.15,M.alum,'Diagonal charge-air pipe','Large silver charge-air/coolant-side pipe visible in Volvo family reference.',30));
  // Blue flexible couplers seen in reference photos.
  add(root,'air',cyl('air',.175,.32,[-3.58,.50,1.46],M.blue,'Blue flexible coupler','Flexible silicone-style pipe coupler.',[0,0,Math.PI/2],28,'SEALING'));
  add(root,'air',cyl('air',.175,.30,[-2.47,1.43,1.30],M.blue,'Blue flexible coupler','Flexible silicone-style pipe coupler.',[0,0,Math.PI/2],28,'SEALING'));
  clamp(root,[-3.73,.48,1.46],.18); clamp(root,[-3.42,.55,1.46],.18); clamp(root,[-2.61,1.36,1.34],.18); clamp(root,[-2.34,1.49,1.26],.18);
}

function addFilterCluster(root){
  // User reference clearly shows a three-canister white filter cluster.
  for(let i=0;i<3;i++){
    const x=-1.68+i*.43;
    add(root,i===2?'lube':'fuel',cyl(i===2?'lube':'fuel',.19,.80,[x,-.02,-1.44],M.white,i===2?'Oil filter canister':'Fuel filter canister','White service filter canister in lower engine-side cluster.',[0,0,0],30,'ASSEMBLY'));
    add(root,'service',cyl('service',.21,.10,[x,.42,-1.44],M.dark,'Filter head','Filter head / mounting boss.',[0,0,0],26,'SUBASSEMBLY'));
  }
}

function addUpperAirHardware(root){
  // Long black upper intake/air housing and curved hose arrangement.
  add(root,'air',rb('air',[3.10,.44,.64],[-.18,3.82,-.70],M.black,'Upper intake housing','Long black upper intake/air-cleaner support housing visible in Volvo family photos.',[0,0,0],.14,'ASSEMBLY'));
  add(root,'air',pipe('air',[[-2.95,3.78,-.55],[-3.34,3.96,-.72],[-3.54,4.18,-.92],[-3.18,4.42,-1.08]],.19,M.rubber,'Upper intake hose','Large curved black intake hose.',30));
  clamp(root,[-3.00,3.78,-.56],.20); clamp(root,[-3.20,4.40,-1.06],.20);
  add(root,'service',rb('service',[.12,.56,.18],[-2.18,3.55,-.68],M.dark,'Air-housing bracket','Mounting bracket for upper air hardware.',[0,0,0],.03,'STRUCTURE'));
}

function addEngineSideCasting(root){
  // Irregular accessory-side massing to reduce the simple-box appearance.
  const blobs=[
    {s:[.80,.58,.30],p:[-.10,1.34,-1.12],n:'Accessory housing'},
    {s:[.62,.72,.34],p:[.82,1.20,-1.16],n:'Pump / gear housing'},
    {s:[.72,.48,.28],p:[1.55,1.58,-1.10],n:'Side service housing'},
    {s:[.50,.64,.32],p:[-1.18,1.58,-1.15],n:'Fuel-side casting'}
  ];
  blobs.forEach(b=>add(root,'combustion',rb('combustion',b.s,b.p,M.green2,b.n,'Irregular engine-side cast housing based on visible Volvo 13L family geometry.',[0,0,0],.10,'SUBASSEMBLY')));
  for(const x of [-1.34,-.96,-.36,.10,.56,1.02,1.46]){bolt(root,[x,1.22,-1.30]);}
  add(root,'service',pipe('service',[[1.28,1.10,-1.38],[1.72,.92,-1.44],[1.94,.58,-1.36]],.035,M.rubber,'Service hose','Small engine-side service hose.',18));
}

function addPerforatedGuard(root){
  // Compact perforated/mesh guard around accessory/hot region.
  add(root,'service',rb('service',[.72,.86,.08],[1.88,1.15,-1.52],M.dark,'Perforated protective guard','Protective mesh/guard around accessory region.',[0,0,0],.04,'STRUCTURE'));
  for(let y=.82;y<=1.48;y+=.13) for(let x=1.62;x<=2.14;x+=.13) add(root,'service',cyl('service',.018,.09,[x,y,-1.57],M.black,'Guard perforation','Perforation detail on protective guard.',[Math.PI/2,0,0],8,'SUBASSEMBLY'));
}

function addWhiteControlEnclosure(root){
  // Full genset reference shows a white enclosure above alternator.
  add(root,'control',rb('control',[1.58,1.72,.78],[4.78,3.10,-.05],M.white,'White control enclosure','Reference-matched white genset control enclosure.',[0,0,0],.10,'ASSEMBLY'));
  add(root,'control',rb('control',[.66,.82,.04],[4.42,3.18,-.47],M.dark,'Control display bezel','Dark controller/display bezel on white enclosure.',[0,0,0],.04,'SUBASSEMBLY'));
  add(root,'control',rb('control',[.48,.40,.02],[4.42,3.20,-.50],new THREE.MeshStandardMaterial({color:0x6e8a79,roughness:.25,metalness:.03}),'Control display','Controller LCD/display window.',[0,0,0],.02,'SUBASSEMBLY'));
  add(root,'control',cyl('control',.09,.05,[5.28,2.96,-.48],M.red,'Emergency stop','Emergency-stop push button.',[Math.PI/2,0,0],20,'CONTROL'));
}

function addAlternatorRearGrille(root){
  // Stronger stepped alternator end and circular rear grille from full-genset reference.
  add(root,'crank',cyl('crank',1.34,.34,[6.08,.22,0],M.green,'Alternator rear end housing','Large circular rear alternator end housing.',[0,0,Math.PI/2],56,'ASSEMBLY'));
  add(root,'crank',torus('crank',1.08,.07,[6.27,.22,0],M.dark,'Alternator rear grille ring','Rear circular ventilation grille ring.',[0,Math.PI/2,0],48,'SUBASSEMBLY'));
  for(let a=0;a<12;a++){
    const ang=a*Math.PI/6;
    const y=.22+Math.sin(ang)*.58, z=Math.cos(ang)*.58;
    add(root,'crank',box('crank',[.06,.76,.08],[6.30,y,z],M.dark,'Alternator louver','Rear alternator ventilation louver.',[ang,0,0],'SUBASSEMBLY'));
  }
}

function addOpenSkidDetail(root){
  const xs=[-4.7,-2.8,-.7,1.7,3.9,5.4];
  xs.forEach(x=>add(root,'service',rb('service',[.42,.44,3.70],[x,-1.18,0],M.green2,'Open skid cross-member','Open structural skid cross-member visible in reference genset.',[0,0,0],.05,'STRUCTURE')));
  for(const x of [-4.6,5.25]) for(const z of [-1.65,1.65]) add(root,'service',rb('service',[.48,.34,.64],[x,-1.57,z],M.dark,'Fork / lifting pocket','Open skid fork/lifting pocket.',[0,0,0],.04,'STRUCTURE'));
}

function enhance(root){
  if(!root||root.userData.v8Enhanced||!isGen1())return;
  root.userData.v8Enhanced=true;
  addExpansionTank(root);addRadiatorGuard(root);addChargeAirReference(root);addFilterCluster(root);addUpperAirHardware(root);addEngineSideCasting(root);addPerforatedGuard(root);addWhiteControlEnclosure(root);addAlternatorRearGrille(root);addOpenSkidDetail(root);
}

function restoreV8(root){root?.traverse(o=>{if(o.isMesh&&o.userData?.v8&&o.userData.v8Base)o.material=o.userData.v8Base;});}
function technicalV8(root){
  const active=document.querySelector('.mode-tabs button[data-mode="technical"]')?.classList.contains('active');
  if(!active)return;
  root?.traverse(o=>{if(!o.isMesh||!o.userData?.v8)return;const sys=o.userData.system;const color={air:0x5f9db7,fuel:0xc38b4f,lube:0xb59747,cooling:0x4d93b7,combustion:0x5c8d78,crank:0x79848a,start:0xaa8d68,control:0x48a89d,service:0xa57b62}[sys]||0x8da3b1;o.material=new THREE.MeshStandardMaterial({color,roughness:.46,metalness:.18,emissive:new THREE.Color(color),emissiveIntensity:.10});});
}

let last='';
function tick(){
  const scene=window.__GF_ENGINE_SCENE__;const root=rootOf(scene);
  if(root&&root.uuid!==last){last=root.uuid;setTimeout(()=>enhance(root),130)}
  if(root){const real=document.querySelector('.mode-tabs button[data-mode="realistic"]')?.classList.contains('active');if(real)restoreV8(root);else technicalV8(root);}
  requestAnimationFrame(tick);
}
tick();
