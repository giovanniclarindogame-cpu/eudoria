'use strict';
/*
 * Medidor de desempenho (só aparece com ?fps=1 no endereço): quadros por segundo, pior quadro e quantas travadas (>100 ms) nos últimos segundos.
 * Serve para medir no celular de verdade. Toque no medidor para zerar os números.
 */
(function(){
 if(!/[?&]fps=1/.test(location.search))return;
 const el=document.createElement('div');el.id='medidorFps';
 el.style.cssText='position:fixed;left:6px;top:6px;z-index:99999;font:700 11px/1.35 ui-monospace,Menlo,Consolas,monospace;color:#9df07a;background:rgba(0,0,0,.72);padding:4px 7px;border-radius:8px;pointer-events:auto;white-space:pre';
 document.body.appendChild(el);
 let n=0,t0=performance.now(),last=t0,pior=0,trav=0,total=0,minFps=999;
 el.addEventListener('pointerdown',()=>{pior=0;trav=0;total=0;minFps=999});
 function l(t){
  const d=t-last;last=t;n++;if(d>pior)pior=d;if(d>100){trav++;total+=d}
  if(t-t0>=500){
   const fps=n*1000/(t-t0);if(fps<minFps)minFps=fps;
   let tela='';try{tela=` ${state}`}catch{}
   el.style.color=fps>=50?'#9df07a':fps>=30?'#ffe066':'#ff8a8a';
   el.textContent=`${fps.toFixed(0)} fps (mín ${minFps.toFixed(0)})${tela}\npior quadro ${pior.toFixed(0)} ms\ntravadas >100 ms: ${trav}${trav?` (${Math.round(total)} ms)`:''}`;
   n=0;t0=t;
  }
  requestAnimationFrame(l);
 }
 requestAnimationFrame(l);
})();
