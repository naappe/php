const state={generators:[],systems:[],evidence:null,parts:[],selectedGen:null};
const titles={home:'Powerhouse Overview',generators:'Generators',systems:'Engine Infographics',parts:'Spare Parts',diagnostics:'Diagnostics',maintenance:'Maintenance',evidence:'OEM Evidence'};
const confMeaning={VERIFIED:'Exact installed-engine or OEM evidence confirms this relationship.', 'FAMILY MATCH':'Evidence supports the same family/model, but the exact installed variant is not yet fully verified.', CANDIDATE:'Description or part number suggests a relationship, but stronger evidence is required.', UNVERIFIED:'No sufficient engineering evidence has been linked yet.', 'NOT COMPATIBLE':'Available evidence excludes this relationship.'};
const systemNotes={air:'Delivers clean, compressed air to the cylinders and removes exhaust gas.',fuel:'Meters and delivers fuel to each cylinder at the correct time and pressure.',lube:'Maintains an oil film at bearings, piston cooling points and other loaded surfaces.',cooling:'Carries rejected heat from the engine to the heat exchanger/radiator while controlling operating temperature.',combustion:'Contains combustion pressure and converts expanding gas force into piston motion.',crank:'Converts piston force into crankshaft rotation and transfers torque to the generator.',valve:'Times the opening and closing of intake/exhaust valves relative to crankshaft position.',start:'Provides cranking torque and restores electrical energy after the engine starts.',control:'Measures engine condition, applies governing/protection logic and commands actuators.',service:'Keeps joints, fluid passages and rotating interfaces sealed and serviceable.'};
const diagrams={
air:[['Air filter','filter'],['Turbo compressor','turbo'],['Charge-air cooler','cooler'],['Intake manifold','manifold'],['Cylinder','cylinder']],
fuel:[['Fuel supply','tank'],['Primary / secondary filters','filter'],['Transfer / injection pump','pump'],['High-pressure line','line'],['Injector','injector'],['Cylinder','cylinder']],
lube:[['Oil sump','sump'],['Oil pump','gear'],['Oil cooler','cooler'],['Full-flow filter','filter'],['Oil gallery','gallery'],['Main / big-end bearing','bearing']],
cooling:[['Expansion tank','tank'],['Circulating pump','pump'],['Engine water jacket','jacket'],['Thermostat','thermostat'],['Heat exchanger','radiator']],
combustion:[['Cylinder head','head'],['Injector','injector'],['Cylinder liner','liner'],['Piston + rings','piston'],['Piston pin','pin']],
crank:[['Piston','piston'],['Connecting rod','rod'],['Crankpin / big-end','bearing'],['Crankshaft','crank'],['Main bearings','bearing'],['Flywheel','flywheel']],
valve:[['Camshaft','cam'],['Tappet / follower','follower'],['Pushrod','rod'],['Rocker arm','rocker'],['Valve + spring','valve'],['Cylinder head','head']],
start:[['Battery bank','battery'],['Starter solenoid','solenoid'],['Starter motor','motor'],['Ring gear / flywheel','flywheel'],['Charging alternator','alternator']],
control:[['Speed / temp / pressure sensors','sensor'],['ECU / controller','ecu'],['Protection logic','logic'],['Fuel / shutdown actuator','actuator'],['Engine response','engine']],
service:[['Joint face','joint'],['Gasket / O-ring','seal'],['Shaft seal','shaftseal'],['Hose / clamp','hose'],['Leak prevention','shield']]
};
const diagnostic=[
{name:'Engine Oil Pressure',spn:'100',system:'lube',nodes:['Pressure sender','Oil pump','Filter / bypass','Oil galleries','Main & big-end bearings'],note:'Low or unstable pressure should be traced through the lubrication path before selecting a spare.'},
{name:'Coolant Temperature',spn:'110',system:'cooling',nodes:['Temperature sensor','Coolant level / air','Circulating pump','Thermostat','Heat exchanger'],note:'Volvo family fault tracing links high temperature investigation to coolant level, trapped air, circulating pump and thermostat.'},
{name:'Boost Pressure',spn:'102',system:'air',nodes:['Boost sensor','Air filter','Turbocharger','Charge-air cooler','Intake manifold'],note:'Loss of boost can originate upstream of the sensor, at the compressor, charge-air path or intake restriction.'},
{name:'Engine Speed',spn:'190',system:'control',nodes:['Crank / speed signal','ECU / governor','Fuel command','Engine torque','Generator frequency'],note:'Use exact installed speed and protection settings before assigning any alarm threshold.'}
];
const maintenance=[
{title:'Air-path inspection',system:'air',items:['Air cleaner restriction','Charge-air hose / clamp condition','Turbocharger leak / damage signs']},
{title:'Fuel cleanliness',system:'fuel',items:['Water separator / primary filter','Secondary filter','Fuel-line leakage','Injector symptoms']},
{title:'Lubrication service',system:'lube',items:['Oil condition / level','Full-flow filters','Pressure trend','Leak inspection']},
{title:'Cooling inspection',system:'cooling',items:['Coolant level / condition','Pump leakage','Thermostat behavior','Heat exchanger / radiator cleanliness']},
{title:'Valve-train inspection',system:'valve',items:['Rocker / pushrod condition','Valve mechanism noise','Leakage / cover sealing','Service-clearance data only from correct manual']},
{title:'Starting & protection',system:'start',items:['Battery / cable condition','Starter engagement','Charging voltage','Protection inputs / shutdown circuit']}
];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const cclass=v=>v==='VERIFIED'?'verified':v==='FAMILY MATCH'?'family':v==='CANDIDATE'?'candidate':v==='NOT COMPATIBLE'?'incompatible':'unverified';
const genName=id=>state.generators.find(g=>g.id===id)?.name||id;
window.addEventListener('load',()=>{
  if(!document.querySelector('#partRows'))return;
  const s=document.createElement('script');s.src='assets/component-router.js?v=1';document.body.appendChild(s);
});
