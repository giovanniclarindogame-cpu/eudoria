'use strict';
/*
 * Carga sob demanda das artes (v50) — as imagens dos campeões só começam a baixar na PRIMEIRA vez que alguém as usa.
 * Antes, ao abrir o jogo, os 10 heróis baixavam ~110 MB de imagens (e ocupavam ~570 MB de memória) mesmo sem entrar em luta.
 *  - window.lazyImage(src) cria uma imagem que ainda não baixa. O download começa quando o código
 *    (a) pergunta image.complete / naturalWidth / naturalHeight (é assim que as artes checam "já carregou?") ou
 *    (b) desenha a imagem num canvas (drawImage). Até lá, parece uma imagem ainda carregando: o código já lida com isso.
 *  - ?preload=1 volta ao comportamento antigo (baixar tudo ao abrir), para comparar.
 *  - window.LazyArt mostra quantas imagens foram criadas e quantas já foram pedidas.
 */
(function(){
 const DEBUG=/[?&]lazydebug=1/.test(location.search);
 const stats=window.LazyArt={criadas:0,iniciadas:0,origem:{},porUrl:new Map()};   // porUrl: endereço pedido -> Image (para a tela de carregamento)
 if(/[?&]preload=1/.test(location.search)){window.lazyImage=src=>{const i=new Image();i.src=src;stats.criadas++;stats.iniciadas++;stats.porUrl.set(src,i);return i};return}
 const P=HTMLImageElement.prototype,g=n=>Object.getOwnPropertyDescriptor(P,n).get;
 const GET={complete:g('complete'),naturalWidth:g('naturalWidth'),naturalHeight:g('naturalHeight')};
 window.lazyStart=function(im){const z=im&&im.__lz;if(z&&!z.on){z.on=true;stats.iniciadas++;im.src=z.src}return im};
 function start(im){const z=im.__lz;if(z&&!z.on){z.on=true;stats.iniciadas++;if(DEBUG){const l=(new Error().stack||'').split('\n').slice(2,5).map(x=>x.trim().replace(/^at /,'').replace(/https?:\/\/[^/]+\/js\//,'')).join(' < ');stats.origem[l]=(stats.origem[l]||0)+1}im.src=z.src}}
 window.lazyImage=function(src){
  const im=new Image();im.__lz={src,on:false};stats.criadas++;stats.porUrl.set(src,im);
  for(const k of ['complete','naturalWidth','naturalHeight'])Object.defineProperty(im,k,{configurable:true,get(){start(im);try{return GET[k].call(im)}catch{return k==='complete'?false:0}}});
  return im;
 };
 const draw=CanvasRenderingContext2D.prototype.drawImage;
 CanvasRenderingContext2D.prototype.drawImage=function(im){if(im&&im.__lz&&!im.__lz.on)start(im);return draw.apply(this,arguments)};
})();
