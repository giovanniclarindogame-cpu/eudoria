'use strict';
/*
 * v67 — modo PC: com mouse (hover + ponteiro preciso) e tela larga, o combate usa a barra de botões embaixo (DASH 1 2 3 ULT),
 * o mouse mira (ponta da espada = mira) e o clique ataca. Se a pessoa tocar na tela (notebook com toque), volta ao layout de toque.
 * ?pc=0 desliga; ?pc=1 força ligado.
 */
(function(){
 const q=location.search,mq=matchMedia('(hover:hover) and (pointer:fine)');
 let tocou=false;
 const quer=()=>/[?&]pc=1/.test(q)||(!/[?&]pc=0/.test(q)&&!tocou&&mq.matches&&innerWidth>=900);
 function aplicar(){
  document.body.classList.toggle('pc-ui',quer());
  try{window.V3Relayout&&V3Relayout()}catch{}
 }
 addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!tocou){tocou=true;aplicar()}},{passive:true,capture:true});
 addEventListener('resize',aplicar);
 try{mq.addEventListener('change',aplicar)}catch{}
 aplicar();
 window.PcUI={ativo:()=>document.body.classList.contains('pc-ui'),aplicar};
})();
