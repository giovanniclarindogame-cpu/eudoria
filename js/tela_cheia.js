'use strict';
(() => {
 const button=document.createElement('button');button.id='fullscreenToggle';button.type='button';
 button.innerHTML='<span aria-hidden="true">⛶</span><span class="fullscreen-label">Tela cheia</span>';
 button.setAttribute('aria-label','Entrar em tela cheia');button.title='Entrar em tela cheia';
 const status=document.createElement('div');status.id='fullscreenStatus';status.setAttribute('role','status');status.hidden=true;
 document.body.append(button,status);
 const show=message=>{status.textContent=message;status.hidden=false;clearTimeout(show.timer);show.timer=setTimeout(()=>status.hidden=true,5500);};
 const active=()=>document.fullscreenElement||document.webkitFullscreenElement;
 const sync=()=>{const on=!!active();button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'Sair da tela cheia':'Entrar em tela cheia');button.title=button.getAttribute('aria-label');button.querySelector('.fullscreen-label').textContent=on?'Sair da tela cheia':'Tela cheia';requestAnimationFrame(()=>{if(typeof resize==='function')resize();});};
 button.addEventListener('click',async()=>{
  try{
   if(active()){const exit=document.exitFullscreen||document.webkitExitFullscreen;await exit.call(document);}
   else{
    const root=document.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;
    if(!request){show('Este navegador não oferece tela cheia. Use “Adicionar à Tela de Início” no menu do navegador.');return;}
    await request.call(root);
    // Orientation locking is optional and unsupported on some phones.
    if(screen.orientation?.lock)try{await screen.orientation.lock('landscape');}catch{}
   }
  }catch{show('Não foi possível ativar a tela cheia. Tente novamente pelo botão ou pelo menu do navegador.');}
  sync();
 });
 document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);
 window.visualViewport?.addEventListener('resize',sync);window.addEventListener('orientationchange',sync);sync();
})();
