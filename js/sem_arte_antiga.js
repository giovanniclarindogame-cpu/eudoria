'use strict';
/*
 * v67 — enquanto a arte NOVA de um campeão ainda está baixando (1ª visita, internet lenta), o jogo desenhava o boneco ANTIGO
 * no lugar (na seleção e na luta) e depois trocava. Agora, nesse intervalo, não desenha nada (a luta já espera na tela de carregamento).
 * Segurança: se a arte não chegar em 20 s (imagem com erro), volta ao desenho normal para o campeão nunca ficar invisível.
 * ?arteantiga=1 desliga este filtro.
 */
(function(){
 if(typeof drawAnimatedFighter!=='function'||window.__SRV||/jsdom/i.test(navigator.userAgent)||/[?&]arteantiga=1/.test(location.search))return;
 const prev=drawAnimatedFighter,inicio=new Map(),prontos=new Set();
 const imagens=id=>{const urls=(window.PRECARGA&&PRECARGA[id])||[],L=window.LazyArt;return L?urls.map(u=>L.porUrl.get(u)).filter(Boolean):[]};
 const pronta=im=>{try{return im.complete&&im.naturalWidth>0}catch{return false}};
 let rascunho=null;
 function pronto(id,a,size,t){
  if(prontos.has(id))return true;                                      // depois de pronto uma vez, nunca mais some
  // 1) um desenho de rascunho (fora da tela) faz o jogo pedir só as imagens que o corpo precisa (carga sob demanda)
  try{if(!rascunho){const c=document.createElement('canvas');c.width=c.height=8;rascunho=c.getContext('2d')}rascunho.save();prev.call(null,rascunho,a,size,t);rascunho.restore()}catch{}
  // 2) pronto = tudo o que já foi pedido terminou de baixar (e pelo menos algo foi pedido)
  const pedidas=imagens(id).filter(im=>im.__lz?im.__lz.on:true);
  if(pedidas.length&&pedidas.every(pronta)){prontos.add(id);inicio.delete(id);return true}
  if(!inicio.has(id))inicio.set(id,performance.now());
  return performance.now()-inicio.get(id)>20000;                       // passou de 20 s: desiste de esperar (nunca fica invisível)
 }
 drawAnimatedFighter=function(g,a,size,t){
  if(a&&Number.isInteger(a.skin)&&!pronto(a.skin,a,size,t))return true;  // true = "já desenhei" (nada): evita cair no boneco antigo
  return prev.apply(this,arguments);
 };
 window.SemArteAntiga={pronto};
})();
