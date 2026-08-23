import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// V7 high-detail layer. This does not claim OEM CAD. It enriches the existing
// training geometry with visible mechanical construction and generator hardware.
const C={steel:0xaeb5b9,alum:0xc5cacc,cast:0x4b5256,dark:0x252a2d,black:0x15191b,rubber:0x171a1c,white:0xe9ecec,brass:0xb48b4c,red:0xb93e3e,volvo:0x4f8d74,cummins:0x817865,exhaust:0x5b4a3f};
const mat=(c,r=.6,m=.2)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,envMapIntensity:.8});
const M={steel:mat(C.steel,.3,.88),alum:mat(C.alum,.36,.72),cast:mat(C.cast,.84,.25),dark:mat(C.dark,.86,.18),black:mat(C.black,.78,.12),rubber:mat(C.rubber,.97,.01),white:mat(C.white,.5,.12),brass:mat(C.brass,.4,.72),red:mat(C.red,.5,.14),exhaust:mat(C.exhaust,.88,.38)};
const paint=c=>mat(c,.58,.15), paintDark=c=>mat(new THREE.Color(c).multiplyScalar(.72),.68,.13);

function rootOf(scene){return scene?.children?.find(o=>o.isGroup&&o.children?.some(c=>c.isGroup&&c.userData?.system));}
function group(root,id){return root?.children?.find(c=>c.isGroup&&c.userData?.system===id);}
function genId(){const t=document.getElementById('machineLabel')?.textContent||'';if(t.includes('KTA50'))return'gen4';if(t.includes('TWD1416'))return'gen3';if(t.includes('LTA10'))return'gen2';return'gen1';}
function tag(m,sys,name,desc,type='COMPONENT'){m.castShadow=true;m.receiveShadow=true;m.userData.system=sys;m.userData.name=name;m.userData.component=name;m.userData.description=desc;m.userData.type=type;m.userData.v7=true;m.userData.v7Base=m.material;return m;}
function add(root,sys,m){group(root,sys)?.add(m);return m;}
function rb(sys,size,pos,material,name,desc,rot=[0,0,0],rad=.08,type='COMPONENT'){const m=tag(new THREE.Mesh(new RoundedBoxGeometry(...size,4,Math.min(rad,Math.min(...size)/4)),material),sys,name,desc,type);m.position.set(...pos);m.rotation.set(...rot);return m;}
function box(sys,size,pos,material,name,desc,rot=[0,0,0],type='COMPONENT'){const m=tag(new THREE.Mesh(new THREE.BoxGeometry(...size),material),sys,name,desc,type);m.position.set(...pos);m.rotation.set(...rot);return m;}
function cyl(sys,r,len,pos,material,name,desc,rot=[0,0,Math.PI/2],seg=32,type='COMPONENT'){const m=tag(new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,seg),material),sys,name,desc,type);m.position.set(...pos);m.rotation.set(...rot);return m;}
function torus(sys,R,r,pos,material,name,desc,rot=[0,Math.PI/2,0],seg=36,type='COMPONENT'){const m=tag(new THREE.Mesh(new THREE.TorusGeometry(R,r,14,seg),material),sys,name,desc,type);m.position.set(...pos);m.rotation.set(...rot);return m;}
function pipe(sys,pts,r,material,name,desc,seg=26,type='COMPONENT'){const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));return tag(new THREE.Mesh(new THREE.TubeGeometry(c,seg,r,12,false),material),sys,name,desc,type);}
function bolt(root,pos,rot=[0,0,Math.PI/2]){add(root,'service',cyl('service',.035,.09,pos,M.steel,'Fastener','Visible mechanical fastener.',rot,10,'FASTENER'));}
function clamp(root,pos,R=.15,rot=[0,Math.PI/2,0]){add(root,'service',torus('service',R,.022,pos,M.steel,'Clamp','Hose or pipe clamp.',rot,24,'SEALING'));}

function labelTexture(text,bg='#202427',fg='#e8eef0'){
  const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.strokeStyle='#87959c';x.lineWidth=5;x.strokeRect(5,5,c.width-10,c.height-10);x.fillStyle=fg;x.font='700 46px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,c.width/2,c.height/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function label(root,sys,text,pos,size=[1.15,.30],rot=[0,0,0]){const material=new THREE.MeshStandardMaterial({map:labelTexture(text),roughness:.6,metalness:.05});const m=tag(new THREE.Mesh(new THREE.PlaneGeometry(...size),material),sys,text,'Identification / training label.','LABEL');m.position.set(...pos);m.rotation.set(...rot);add(root,sys,m);}

function commonDetail(root,scale=1,color=C.volvo){
  const p=paint(color),pd=paintDark(color);
  // Engine-side service covers, cast ribs and fastener rows.
  for(let i=0;i<6;i++){
    const x=(-2.45+i*.82)*scale;
    add(root,'combustion',rb('combustion',[.58*scale,.54*scale,.16*scale],[x,1.17*scale,1.06*scale],pd,'Cylinder side casting','Cylinder-block side casting / inspection feature.',[0,0,0],.05*scale,'SUBASSEMBLY'));
    bolt(root,[x-.19*scale,1.34*scale,1.16*scale]);bolt(root,[x+.19*scale,1.34*scale,1.16*scale]);
  }
  // Rocker-cover ribs and top fasteners.
  for(let i=0;i<10;i++) add(root,'valve',box('valve',[.035*scale,.20*scale,1.00*scale],[-2.35*scale+i*.52*scale,3.63*scale,-.05*scale],pd,'Rocker-cover rib','Pressed/cast strengthening rib.',[0,0,0],'SUBASSEMBLY'));
  // Injection pump body and linkage.
  add(root,'fuel',rb('fuel',[1.20*scale,.54*scale,.46*scale],[-.85*scale,.62*scale,-1.34*scale],M.cast,'Injection / fuel pump body','Fuel-pump body and mounting assembly.',[0,0,0],.10*scale));
  add(root,'fuel',cyl('fuel',.12*scale,.74*scale,[-1.50*scale,.65*scale,-1.34*scale],M.steel,'Pump drive shaft','Mechanical drive/shaft representation.',[0,0,Math.PI/2],22,'SUBASSEMBLY'));
  add(root,'fuel',pipe('fuel',[[-.50*scale,.78*scale,-1.38*scale],[.15*scale,.98*scale,-1.42*scale],[.82*scale,1.22*scale,-1.38*scale]],.028*scale,M.steel,'Fuel control linkage','Visible fuel-control linkage / hardline.',18,'SUBASSEMBLY'));
  // Oil service hardware.
  add(root,'service',cyl('service',.105*scale,.09*scale,[.38*scale,1.18*scale,1.10*scale],M.brass,'Oil filler cap','Oil filler / service cap.',[0,0,0],18,'SERVICE'));
  add(root,'service',pipe('service',[[1.08*scale,.58*scale,1.08*scale],[1.10*scale,.05*scale,1.12*scale]],.025*scale,M.brass,'Oil dipstick tube','Oil-level dipstick tube.',16,'SERVICE'));
  // Coolant housing and hose neck.
  add(root,'cooling',rb('cooling',[.72*scale,.42*scale,.58*scale],[-2.55*scale,1.96*scale,-.78*scale],M.alum,'Thermostat housing','Coolant thermostat housing and outlet neck.',[0,0,0],.08*scale));
  add(root,'cooling',cyl('cooling',.15*scale,.34*scale,[-2.84*scale,1.98*scale,-.78*scale],M.alum,'Coolant outlet neck','Coolant hose connection neck.',[0,0,Math.PI/2],26));
  // Engine sensor bodies and harness clips.
  for(let i=0;i<4;i++){
    const x=(-1.6+i*.95)*scale;
    add(root,'control',cyl('control',.06*scale,.16*scale,[x,1.68*scale,-1.00*scale],M.black,'Sensor body','Engine sender / sensor body.',[0,0,0],16,'SUBASSEMBLY'));
    add(root,'service',rb('service',[.07*scale,.16*scale,.18*scale],[x,2.40*scale,-.88*scale],M.dark,'Harness clip','Harness support clip.',[0,0,0],.02*scale,'FASTENER'));
  }
}

function detailRadiator(root,s=1){
  // Side rails, top brace, core face grille and fan ring depth.
  add(root,'cooling',rb('cooling',[.25*s,4.50*s,.25*s],[-5.70*s,1.08*s,-1.98*s],M.dark,'Radiator side rail','Radiator side support rail.',[0,0,0],.04*s,'STRUCTURE'));
  add(root,'cooling',rb('cooling',[.25*s,4.50*s,.25*s],[-5.70*s,1.08*s,1.98*s],M.dark,'Radiator side rail','Radiator side support rail.',[0,0,0],.04*s,'STRUCTURE'));
  add(root,'cooling',box('cooling',[.20*s,.18*s,4.05*s],[-5.72*s,3.45*s,0],M.dark,'Radiator top brace','Radiator top structural brace.',[0,0,0],'STRUCTURE'));
  for(let z=-1.72*s;z<=1.72*s;z+=.23*s) add(root,'cooling',box('cooling',[.035*s,4.30*s,.025*s],[-5.30*s,1.10*s,z],M.steel,'Radiator grille','Front protective grille / fin line.',[0,0,0],'SUBASSEMBLY'));
  add(root,'cooling',torus('cooling',1.62*s,.07*s,[-4.93*s,1.00*s,0],M.dark,'Fan shroud ring','Radiator fan shroud and depth ring.',[0,Math.PI/2,0],48));
}

function detailAlternator(root,s=1,color=C.volvo){
  const p=paint(color),pd=paintDark(color);
  // Longitudinal cooling ribs and rear fan guard.
  for(let i=0;i<18;i++){
    const a=(i/18)*Math.PI*2;
    const y=.18*s+Math.sin(a)*1.20*s, z=Math.cos(a)*1.20*s;
    add(root,'crank',box('crank',[2.55*s,.045*s,.065*s],[4.55*s,y,z],pd,'Alternator cooling rib','External cooling rib on alternator housing.',[a,0,0],'SUBASSEMBLY'));
  }
  add(root,'crank',torus('crank',1.10*s,.06*s,[6.05*s,.18*s,0],M.dark,'Rear fan guard','Rear alternator fan/grille ring.',[0,Math.PI/2,0],44));
  for(let a=0;a<8;a++){
    const ang=a*Math.PI/4;
    const m=box('crank',[.06*s,.82*s,.12*s],[6.08*s,.18*s+Math.sin(ang)*.45*s,Math.cos(ang)*.45*s],M.steel,'Rear ventilation vane','Rear alternator ventilation vane.',[ang,0,0],'SUBASSEMBLY');add(root,'crank',m);
  }
  add(root,'crank',rb('crank',[.80*s,.54*s,.70*s],[4.80*s,1.46*s,-1.02*s],M.black,'Alternator terminal box','Terminal / AVR connection enclosure.',[0,0,0],.07*s));
  // Mounting feet and bolts.
  for(const x of [3.55,5.25]) for(const z of [-.95,.95]){
    add(root,'crank',rb('crank',[.58*s,.18*s,.42*s],[x*s,-1.02*s,z*s],p,'Alternator mounting foot','Alternator mounting foot.',[0,0,0],.04*s,'STRUCTURE'));
    bolt(root,[x*s,-.90*s,z*s]);
  }
}

function detailPanelAndBattery(root,s=1){
  // More realistic DSE-style control enclosure and emergency stop.
  add(root,'control',rb('control',[1.50*s,.12*s,.72*s],[4.85*s,2.80*s,-.64*s],M.dark,'Control-panel door','Front face / door of generator control enclosure.',[0,0,0],.04*s,'SUBASSEMBLY'));
  add(root,'control',rb('control',[.62*s,.34*s,.035*s],[4.60*s,2.90*s,-.72*s],M.black,'Controller bezel','Controller/HMI bezel.',[0,0,0],.025*s,'SUBASSEMBLY'));
  add(root,'control',rb('control',[.44*s,.18*s,.02*s],[4.58*s,2.93*s,-.745*s],mat(0x6d8f7b,.28,.06),'LCD display','DSE-style control display.',[0,0,0],.01*s,'SUBASSEMBLY'));
  add(root,'control',cyl('control',.085*s,.055*s,[5.25*s,2.92*s,-.74*s],M.red,'Emergency stop','Emergency-stop push button.',[Math.PI/2,0,0],22,'CONTROL'));
  for(let i=0;i<5;i++) add(root,'control',cyl('control',.028*s,.03*s,[4.35*s+i*.15*s,2.66*s,-.745*s],i===0?M.red:M.steel,'Control key','Control-panel key / indicator.',[Math.PI/2,0,0],12,'SUBASSEMBLY'));
  // Pair of 12V starting batteries (family sheet indicates 2 batteries / 24V start).
  for(let i=0;i<2;i++){
    const z=(.98+i*.52)*s;
    add(root,'start',rb('start',[1.00*s,.60*s,.44*s],[3.10*s,-.58*s,z],M.black,`Starting battery ${i+1}`,'12 V starting battery forming the 24 V starting bank.',[0,0,0],.05*s,'ASSEMBLY'));
    add(root,'start',cyl('start',.045*s,.05*s,[2.83*s,-.24*s,z-.12*s],M.brass,'Battery terminal','Battery terminal post.',[0,0,0],12,'SUBASSEMBLY'));
    add(root,'start',cyl('start',.045*s,.05*s,[3.35*s,-.24*s,z+.12*s],M.brass,'Battery terminal','Battery terminal post.',[0,0,0],12,'SUBASSEMBLY'));
  }
  add(root,'start',pipe('start',[[3.35*s,-.24*s,.98*s],[3.48*s,-.05*s,1.25*s],[3.35*s,-.24*s,1.50*s]],.025*s,M.rubber,'Battery interconnect','Battery series interconnection cable.',18,'SUBASSEMBLY'));
}

function detailSkid(root,s=1,color=C.volvo){
  const p=paint(color),pd=paintDark(color);
  // Fuel filler, gauge and anti-vibration mounts.
  add(root,'service',cyl('service',.13*s,.10*s,[-3.90*s,-1.12*s,1.45*s],M.brass,'Fuel filler cap','Base-tank fuel filling cap.',[0,0,0],18,'SERVICE'));
  add(root,'service',cyl('service',.10*s,.04*s,[-3.40*s,-1.14*s,1.45*s],M.black,'Fuel level gauge','Local fuel-level gauge.',[Math.PI/2,0,0],18,'SERVICE'));
  for(const x of [-2.15,2.10,3.60]) for(const z of [-.95,.95]){
    add(root,'service',cyl('service',.22*s,.16*s,[x*s,-1.10*s,z*s],M.rubber,'Anti-vibration mount','Elastomeric anti-vibration mounting element.',[0,0,0],28,'SEALING'));
    add(root,'service',cyl('service',.08*s,.20*s,[x*s,-.96*s,z*s],M.steel,'Mount stud','Anti-vibration mount stud / fastener.',[0,0,0],14,'FASTENER'));
  }
  add(root,'service',box('service',[9.8*s,.06*s,.12*s],[.2*s,-1.20*s,1.70*s],pd,'Skid side rail','Visible skid edge rail.',[0,0,0],'STRUCTURE'));
}

function enhanceGen1(root){
  const s=1;
  commonDetail(root,s,C.volvo);detailRadiator(root,s);detailAlternator(root,s,C.volvo);detailPanelAndBattery(root,s);detailSkid(root,s,C.volvo);
  // Volvo-like upper cover identification without implying OEM CAD.
  label(root,'valve','TAD1345GE TRAINING',[-.70,3.66,-.68],[1.65,.26],[-Math.PI/2,0,0]);
  // Front accessory drive / belt stack.
  add(root,'start',cyl('start',.42,.14,[-3.40,.25,1.18],M.dark,'Crank pulley','Front crankshaft/accessory pulley.',[0,0,Math.PI/2],34));
  add(root,'start',cyl('start',.30,.12,[-2.84,1.18,1.18],M.dark,'Water-pump pulley','Cooling-system drive pulley.',[0,0,Math.PI/2],30));
  add(root,'start',cyl('start',.24,.10,[-2.34,.60,1.18],M.dark,'Tensioner pulley','Accessory-belt tensioner pulley.',[0,0,Math.PI/2],28));
  add(root,'start',pipe('start',[[-3.40,.25,1.18],[-2.84,1.18,1.18],[-2.34,.60,1.18],[-3.40,.25,1.18]],.030,M.rubber,'Accessory belt','Front accessory-drive belt path.',28,'SUBASSEMBLY'));
  // Turbo details and flanges.
  add(root,'air',cyl('air',.23,.35,[2.45,3.04,-1.20],M.alum,'Turbo inlet flange','Turbo compressor inlet flange.',[0,0,Math.PI/2],30));
  add(root,'air',cyl('air',.20,.32,[1.35,3.03,-1.58],M.exhaust,'Turbo exhaust flange','Turbo turbine exhaust flange.',[0,0,Math.PI/2],30));
  add(root,'air',rb('air',[.38,.18,.20],[1.78,2.55,-1.58],M.cast,'Turbo actuator bracket','Turbo actuator/support bracket.',[0,0,0],.04,'SUBASSEMBLY'));
  clamp(root,[2.52,3.04,-1.20],.25,[0,Math.PI/2,0]);
}

function enhanceInline(root,id){const s=id==='gen2'?.82:1.05, c=id==='gen2'?C.cummins:C.volvo;commonDetail(root,s,c);detailRadiator(root,s);detailAlternator(root,s,c);detailPanelAndBattery(root,s);detailSkid(root,s,c);}

function enhanceV16(root){
  const s=1.12,c=C.cummins;detailRadiator(root,1.08);detailAlternator(root,1.12,c);detailPanelAndBattery(root,1.05);detailSkid(root,1.10,c);
  // Dense V-bank top hardware: four cover groups per bank, fuel lines, harnesses and crossover pipes.
  for(const sign of [-1,1]){
    const z=sign*1.34;
    for(let i=0;i<4;i++){
      const x=-1.95+i*1.28;
      add(root,'valve',rb('valve',[1.02,.30,.68],[x,2.48,z],M.black,`V16 rocker cover ${sign<0?'L':'R'}${i+1}`,'Individual rocker-cover group on V-engine bank.',[sign*.18,0,0],.09,'SUBASSEMBLY'));
      for(let j=0;j<2;j++) bolt(root,[x+(-.25+j*.50),2.67,z+sign*.18]);
    }
    add(root,'control',pipe('control',[[-2.30,2.74,z*.78],[0,2.88,z*.80],[2.30,2.74,z*.78]],.025,M.rubber,'Bank wiring harness','Electrical harness along one cylinder bank.',28,'SUBASSEMBLY'));
    for(let i=0;i<8;i++){
      const x=-2.20+i*.62;
      add(root,'fuel',pipe('fuel',[[x,2.18,z*.82],[x+.03,2.52,z*.65]],.017,M.steel,'V16 injector pipe','Individual injector feed on V-engine bank.',12,'SUBASSEMBLY'));
    }
    add(root,'air',pipe('air',[[-2.55,2.06,z*1.16],[-.5,2.25,z*1.24],[2.30,2.06,z*1.16]],.12,M.exhaust,'V-bank exhaust manifold','Exhaust manifold along one V-bank.',32));
  }
  add(root,'cooling',pipe('cooling',[[-2.70,2.55,0],[-.60,2.92,0],[1.55,2.92,0],[2.70,2.55,0]],.10,paint(c),'Upper coolant crossover','Upper coolant crossover on V-engine training representation.',30));
  for(const sign of [-1,1]){
    const z=sign*2.20;
    add(root,'air',torus('air',.50,.14,[-2.15,2.62,z],M.alum,'Turbo compressor volute','Twin-turbo compressor housing.',[0,Math.PI/2,0],42));
    clamp(root,[-2.55,2.62,z],.18,[0,Math.PI/2,0]);
  }
}

function restoreV7(root){root?.traverse(o=>{if(o.isMesh&&o.userData?.v7&&o.userData.v7Base)o.material=o.userData.v7Base;});}
function enhancementModeWatcher(root){
  const real=document.querySelector('.mode-tabs button[data-mode="realistic"]')?.classList.contains('active');
  if(real)restoreV7(root);
}

function enhance(root,id){if(!root||root.userData.v7Enhanced)return;root.userData.v7Enhanced=true;if(id==='gen1')enhanceGen1(root);else if(id==='gen4')enhanceV16(root);else enhanceInline(root,id);}

let last='';
function tick(){
  const scene=window.__GF_ENGINE_SCENE__;const root=rootOf(scene);
  if(root&&root.uuid!==last){last=root.uuid;setTimeout(()=>enhance(root,genId()),90)}
  if(root)enhancementModeWatcher(root);
  requestAnimationFrame(tick);
}
tick();
