'use strict';
(() => {
 const status=document.createElement('div');status.id='fullscreenStatus';status.setAttribute('role','status');status.hidden=true;document.body.append(status);
 const active=()=>document.fullscreenElement||document.webkitFullscreenElement;
 const show=message=>{status.textContent=message;status.hidden=false;clearTimeout(show.timer);show.timer=setTimeout(()=>status.hidden=true,4200);};
 async function lockLandscape(){if(screen.orientation?.lock)try{await screen.orientation.lock('landscape');}catch{}}
 async function enter(){
  if(active()){await lockLandscape();return true;}
  const root=document.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;if(!request)return false;
  try{await request.call(root);await lockLandscape();requestAnimationFrame(()=>typeof resize==='function'&&resize());return true;}catch{return false;}
 }
 const firstGesture=async()=>{const ok=await enter();if(!ok&&matchMedia('(pointer:coarse)').matches)show('Use a opção “Tela cheia” do navegador para aproveitar toda a arena.');};
 document.addEventListener('pointerdown',firstGesture,{once:true,capture:true});
 document.addEventListener('fullscreenchange',()=>requestAnimationFrame(()=>typeof resize==='function'&&resize()));
 document.addEventListener('webkitfullscreenchange',()=>requestAnimationFrame(()=>typeof resize==='function'&&resize()));
 window.visualViewport?.addEventListener('resize',()=>requestAnimationFrame(()=>typeof resize==='function'&&resize()));
 window.addEventListener('orientationchange',()=>{lockLandscape();requestAnimationFrame(()=>typeof resize==='function'&&resize());});
 window.eldoriaDisplay={enter,lockLandscape,get fullscreen(){return !!active();}};
})();
