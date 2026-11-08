'use strict';
/*
 * Escala única da interface de batalha: o layout é desenhado para 844×390 (celular na horizontal) e
 * --ui (1 a 1.8) aumenta o conjunto em telas maiores. Também expõe battleTop(), a altura que o HUD
 * ocupa no topo, usada pela câmera para não deixar a arena por baixo dele.
 */
(()=>{
 const BASE_W=844,BASE_H=390,MAX=1.8;
 function apply(){
  const w=innerWidth,h=innerHeight,ui=Math.min(MAX,Math.max(1,Math.min(w/BASE_W,h/BASE_H)));
  document.documentElement.style.setProperty('--ui',ui.toFixed(3));
 }
 apply();
 addEventListener('resize',apply);addEventListener('orientationchange',apply);
 document.addEventListener('fullscreenchange',apply);
 window.visualViewport?.addEventListener('resize',apply);
 window.battleTop=function(){
  const hud=document.querySelector('#battle .hud');
  if(!hud)return innerHeight<520?58:88;
  // Medir o HUD a cada quadro força recalcular o layout (pesado em celulares, pior no 2x2).
  // O valor fica em cache e só é refeito quando o HUD ou a janela mudam de tamanho.
  if(topDirty||topHud!==hud){
   topHud=hud;topDirty=false;
   if(window.ResizeObserver&&!topObs){topObs=new ResizeObserver(()=>{topDirty=true});topObs.observe(hud);const b=document.querySelector('#battle');if(b)topObs.observe(b)}
   topCache=Math.ceil(hud.getBoundingClientRect().bottom)+6;
  }
  return topCache;
 };
 let topCache=0,topDirty=true,topHud=null,topObs=null;
 ['resize','orientationchange','fullscreenchange'].forEach(e=>addEventListener(e,()=>{topDirty=true}));
 document.addEventListener('fullscreenchange',()=>{topDirty=true});
 // Resolução adaptativa: se a luta ficar lenta (quadro médio > ~26 ms por 3 verificações), baixa a resolução do canvas.
 let slow=0;
 setInterval(()=>{
  if(window.ecoMode||typeof state==='undefined'||state!=='fight'||document.hidden||typeof vfxFrameCost!=='number')return;
  const cap=window.renderCap||2;
  if(vfxFrameCost>26&&cap>1){if(++slow>=3){slow=0;window.renderCap=cap>1.5?1.5:1;if(typeof resize==='function')resize()}}else slow=0;
 },1000);
})();
