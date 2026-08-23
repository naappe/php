(async function(){
  const panel=document.querySelector('#oemVisualPanel');
  if(!panel)return;
  try{
    const registry=await fetch('data/oem-visual-sources.json').then(r=>{if(!r.ok)throw new Error('OEM visual source registry unavailable');return r.json()});
    const params=new URLSearchParams(location.search);
    const genId=params.get('gen')||((typeof currentGen!=='undefined'&&currentGen?.id)?currentGen.id:null)||((typeof state!=='undefined'&&state.activeGen)?state.activeGen:'gen1');
    const rec=registry.generators?.[genId];
    if(!rec){panel.hidden=true;return;}
    const cls=rec.confidence==='VERIFIED'?'verified':rec.confidence==='FAMILY MATCH'?'family':rec.confidence==='NOT COMPATIBLE'?'incompatible':'unverified';
    const status=document.querySelector('#oemVisualStatus');
    status.className=`oem-source-status ${cls}`;
    status.textContent=rec.state;
    document.querySelector('#oemVisualIdentity').textContent=rec.requiredIdentity;
    document.querySelector('#oemVisualRule').textContent=rec.integrationRule;
    document.querySelector('#visualModeLabel').textContent=rec.confidence==='VERIFIED'?'OEM ILLUSTRATION SOURCE CONFIRMED':'FUNCTIONAL SCHEMATIC · OEM VISUAL SOURCE PENDING';
    document.querySelector('#oemSourceLinks').innerHTML=(rec.sources||[]).map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer"><span>${s.type}</span><b>${s.label}</b><small>${s.note}</small></a>`).join('');
  }catch(err){
    document.querySelector('#oemVisualStatus').textContent='SOURCE REGISTRY ERROR';
    document.querySelector('#oemVisualIdentity').textContent=err.message;
    document.querySelector('#oemVisualRule').textContent='Continue using the functional schematic until the source registry is restored.';
  }
})();
