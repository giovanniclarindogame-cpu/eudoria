'use strict';
/*
 * v69 — tela do campeão no celular deitado: a descrição da skill tem que caber sem rolar.
 * O CSS (detalhe_celular_v69.css) já dá mais altura à caixa; aqui, se uma descrição longa ainda não couber, o texto diminui um pouco (até 10,5 px)
 * e, em telas muito baixas, o quadro de nível mostra só a barra. Roda sozinho a cada troca de skill, de campeão ou de tamanho de tela.
 */
(function(){
 const mq=matchMedia('(max-height:500px) and (orientation:landscape)');
 let raf=0;
 function ajustar(){
  raf=0;
  const d=document.getElementById('heroDetail');if(!d||d.hidden)return;
  const e=d.querySelector('.hero-skill-copy');if(!e)return;
  d.classList.remove('v69-compacto');e.style.removeProperty('--fs');
  if(!mq.matches)return;
  const cabe=()=>e.scrollHeight<=e.clientHeight+1;
  let fs=12;
  while(!cabe()&&fs>10.5){fs-=.5;e.style.setProperty('--fs',fs+'px')}
  if(!cabe()){
   d.classList.add('v69-compacto');e.style.removeProperty('--fs');fs=12;
   while(!cabe()&&fs>8.5){fs-=.5;e.style.setProperty('--fs',fs+'px')}
  }
 }
 const agendar=()=>{if(!raf)raf=requestAnimationFrame(ajustar)};
 function ligar(){
  const d=document.getElementById('heroDetail');if(!d)return setTimeout(ligar,500);
  new MutationObserver(agendar).observe(d,{childList:true,subtree:true,characterData:true});   // (não observa atributos: o próprio ajuste mexe em style/class)
  agendar();
 }
 addEventListener('resize',agendar);addEventListener('orientationchange',agendar);
 document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#heroDetail'))setTimeout(agendar,30)},true);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ligar);else ligar();
 window.DetalheCelular69={ajustar};
})();
