(function(){
  const openSystemWorkspace=id=>{
    const gen=(typeof state!=='undefined'&&state.activeGen)?state.activeGen:'gen4';
    location.href=`system.html?system=${encodeURIComponent(id)}&gen=${encodeURIComponent(gen)}`;
  };
  if(typeof openSystem==='function'){
    const previousOpenSystem=openSystem;
    openSystem=function(id){if(id==='service'){openSystemWorkspace(id);return}previousOpenSystem(id)};
  }
  if(typeof openSystemPage==='function'){
    const previousOpenSystemPage=openSystemPage;
    openSystemPage=function(id){if(id==='service'){openSystemWorkspace(id);return}previousOpenSystemPage(id)};
  }
})();