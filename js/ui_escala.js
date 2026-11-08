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
  return Math.ceil(hud.getBoundingClientRect().bottom)+6;
 };
})();
