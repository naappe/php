(function(){
  if(typeof openPart==='function'){
    openPart=function(id){
      const gen=(typeof state!=='undefined'&&state.activeGen)?state.activeGen:'';
      location.href=`component.html?id=${encodeURIComponent(id)}${gen?`&gen=${encodeURIComponent(gen)}`:''}`;
    };
  }
  const restoreContext=()=>{
    const params=new URLSearchParams(location.search),gen=params.get('gen'),system=params.get('system'),hash=(location.hash||'').replace('#','');
    if(gen&&typeof selectMachine==='function')selectMachine(gen);
    if(system&&typeof state!=='undefined'&&state.systems?.some(s=>s.id===system))state.selectedSystem=system;
    const valid=['home','generators','systems','parts','diagnostics','maintenance','evidence'];
    if(hash&&valid.includes(hash)&&typeof showPage==='function'){
      showPage(hash);
      if(hash==='parts'&&system&&typeof filterPanelSpares==='function')filterPanelSpares(system);
      if(hash==='systems'&&system&&typeof openSystemPage==='function')setTimeout(()=>openSystemPage(system),60);
      if(hash==='home'&&typeof renderOverview==='function')renderOverview();
    }
  };
  if(document.readyState==='complete')restoreContext();else window.addEventListener('load',restoreContext,{once:true});
})();