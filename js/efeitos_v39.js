'use strict';
/*
 * Efeitos v39 — ícones e efeitos dos pacotes de jogabilidade v3, gerados no Canva (assets/efeitos_v39/).
 *  icons.webp  (3×3, fundo transparente): 0 katana na bainha · 1 adagas · 2 olho · 3 anzol · 4 gema verde · 5 gema dourada ·
 *                                         6 marca de presa · 7 fratura · 8 brasa
 *  fx_a.webp   (3×3, fundo preto, soma luz): 0 aura de ki · 1 explosão dourada · 2 anel dourado · 3 fumaça · 4 corte vermelho ·
 *                                         5 explosão de fogo · 6 impacto violeta · 7 explosão rubro-violeta · 8 runas violeta
 *  fx_b.webp   (2×2, fundo preto, soma luz): 0 explosão verde · 1 anel verde · 2 onda de água · 3 respingo
 * Só desenho: cada arquivo de herói (js/*_v3.js) chama FX39.draw() e, se a imagem ainda não carregou, cai no desenho por código.
 * ?fx39=0 desliga (volta aos desenhos por código).
 */
(function(){
if(/[?&]fx39=0/.test(location.search))return;
const ROOT='assets/efeitos_v39/';
const SHEETS={icons:{im:rwImage(ROOT+'icons.webp?v=1'),cols:3,add:false},fx_a:{im:rwImage(ROOT+'fx_a.webp?v=1'),cols:3,add:true},fx_b:{im:rwImage(ROOT+'fx_b.webp?v=1'),cols:2,add:true}};
const KEYS={katana:['icons',0],adagas:['icons',1],olho:['icons',2],anzol:['icons',3],gemaVerde:['icons',4],gemaOuro:['icons',5],presa:['icons',6],fratura:['icons',7],brasa:['icons',8],
 aura:['fx_a',0],explosaoOuro:['fx_a',1],anelOuro:['fx_a',2],fumaca:['fx_a',3],corte:['fx_a',4],fogo:['fx_a',5],impactoVioleta:['fx_a',6],explosaoRubra:['fx_a',7],runas:['fx_a',8],
 explosaoVerde:['fx_b',0],anelVerde:['fx_b',1],onda:['fx_b',2],respingo:['fx_b',3]};
// Versões animadas (3×3 quadros, fundo preto) — assets/efeitos_v39/anim/<chave>.webp
const ANIM_N={fogo:9,fumaca:9,aura:9,explosaoOuro:9,anelOuro:9,corte:9,impactoVioleta:9,explosaoRubra:7,runas:9,explosaoVerde:9,anelVerde:9,onda:9,respingo:9};
const ANIM=Object.fromEntries(Object.keys(ANIM_N).map(k=>[k,rwImage(ROOT+'anim/'+k+'.webp?v=1')]));
function animReady(key){const im=ANIM[key];return !!(im&&im.complete&&im.naturalWidth)}
function ready(key){const k=KEYS[key];if(!k)return false;const s=SHEETS[k[0]];return !!(s.im.complete&&s.im.naturalWidth)}
// draw(key, x, y, tamanho, {alpha, rot, flip, sy (achatamento vertical), gray})
function draw(key,x,y,size,o={}){
 const animated=(o.t!=null||o.loop)&&animReady(key);
 const k=KEYS[key];if(!k||!(animated||ready(key)))return false;
 let s=SHEETS[k[0]],cell=s.im.naturalWidth/s.cols,i=k[1],sx=i%s.cols*cell,sy=Math.floor(i/s.cols)*cell,src=s.im,add=s.add;
 if(animated){const n=ANIM_N[key],f=o.loop?Math.floor(clock*12)%n:Math.min(n-1,Math.max(0,Math.floor(o.t*n)));src=ANIM[key];cell=src.naturalWidth/3;sx=f%3*cell;sy=Math.floor(f/3)*cell;add=true}
 else if(o.t!=null)o={...o,alpha:(o.alpha??1)*(1-o.t)};
 ctx.save();ctx.translate(x,y);if(o.ground){ctx.scale(1,o.sy||.45);if(o.rot)ctx.rotate(o.rot)}else{if(o.rot)ctx.rotate(o.rot);ctx.scale(o.flip?-1:1,o.sy||1)}
 ctx.globalAlpha*=o.alpha??1;if(add)ctx.globalCompositeOperation='lighter';if(o.gray)ctx.filter='grayscale(1) brightness(.55)';
 ctx.imageSmoothingEnabled=true;ctx.drawImage(src,sx,sy,cell,cell,-size/2,-size/2,size,size);ctx.restore();return true;
}
// Linhas com textura que se repete sem costura (gerada no Canva, pontas emendadas por script):
// linhaAgua (Arpão Fisgado), linhaPesca (Fisgada do Caçador), rastroFogo (Passo do Amanhecer).
const LINES={linhaAgua:rwImage(ROOT+'linhaAgua.webp?v=1'),linhaPesca:rwImage(ROOT+'linhaPesca.webp?v=1'),rastroFogo:rwImage(ROOT+'rastroFogo.webp?v=3')};
function lineReady(key){const im=LINES[key];return !!(im&&im.complete&&im.naturalWidth)}
// line(chave, x1, y1, x2, y2, espessura, {alpha, scroll (px/s), add, phase, h0, h1 (altura 0..1 no começo/fim: afina as pontas do rastro)})
function line(key,x1,y1,x2,y2,th,o={}){
 if(!lineReady(key))return false;
 const im=LINES[key],len=Math.hypot(x2-x1,y2-y1);if(len<1)return true;
 const tw=th*im.naturalWidth/im.naturalHeight,off=((o.phase||0)+clock*(o.scroll||0))%tw;
 const an=Math.atan2(y2-y1,x2-x1);ctx.save();ctx.translate(x1,y1);ctx.rotate(an);if(o.upright&&Math.cos(an)<0)ctx.scale(1,-1);ctx.globalAlpha*=o.alpha??1;if(o.add)ctx.globalCompositeOperation='lighter';
 ctx.beginPath();ctx.rect(0,-th,len,th*2);ctx.clip();ctx.imageSmoothingEnabled=true;
 const h0=o.h0??1,h1=o.h1??1;
 if(h0>=.999&&h1>=.999){for(let x=-((off%tw)+tw)%tw;x<len;x+=tw)ctx.drawImage(im,x,-th/2,tw,th)}
 else{   // pontas do rastro: as chamas ENCOLHEM em direção ao chão (a base fica fixa) em vez de serem cortadas. h0/h1 = altura (0 a 1) no começo e no fim deste pedaço
  const SL=3,nw=im.naturalWidth,nh=im.naturalHeight;
  for(let x=-((off%tw)+tw)%tw;x<len;x+=tw){
   for(let sx=Math.max(0,x);sx<Math.min(len,x+tw);sx+=SL){
    const w=Math.min(SL,len-sx,x+tw-sx),f=h0+(h1-h0)*Math.min(1,(sx+w/2)/len),dh=th*f;if(dh<.8)continue;
    ctx.drawImage(im,(sx-x)/tw*nw,0,Math.max(1,w/tw*nw),nh,sx,th/2-dh,w+.6,dh);
   }
  }
 }
 ctx.restore();return true;
}
window.FX39={draw,ready,animReady,line,lineReady,KEYS,ANIM_N};
})();
