bindPlateInteractions=function(p,sys,gen){
  const moveHighlight=index=>{
    const marker=document.querySelector('.plate-highlight');
    if(!marker)return;
    const a=calloutAnchors(sys.id)[index]||[440,190];
    marker.setAttribute('cx',a[0]);marker.setAttribute('cy',a[1]);
  };
  document.querySelectorAll('[data-callout-index]').forEach(el=>{
    const index=Number(el.dataset.calloutIndex);
    el.addEventListener('mouseenter',()=>moveHighlight(index));
    el.addEventListener('mouseleave',()=>moveHighlight(currentCallout));
    el.addEventListener('click',()=>{currentCallout=index;renderInteractivePlate(p,sys,gen)});
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();currentCallout=index;renderInteractivePlate(p,sys,gen)}});
  });
  document.querySelectorAll('[data-function-callout]').forEach(el=>{
    const index=Number(el.dataset.functionCallout);
    el.addEventListener('mouseenter',()=>moveHighlight(index));
    el.addEventListener('mouseleave',()=>moveHighlight(currentCallout));
    el.onclick=()=>{currentCallout=index;renderInteractivePlate(p,sys,gen)};
  });
};