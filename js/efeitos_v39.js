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
function ready(key){const k=KEYS[key];if(!k)return false;const s=SHEETS[k[0]];return !!(s.im.complete&&s.im.naturalWidth)}
// draw(key, x, y, tamanho, {alpha, rot, flip, sy (achatamento vertical), gray})
function draw(key,x,y,size,o={}){
 const k=KEYS[key];if(!k||!ready(key))return false;
 const s=SHEETS[k[0]],cell=s.im.naturalWidth/s.cols,i=k[1],sx=i%s.cols*cell,sy=Math.floor(i/s.cols)*cell;
 ctx.save();ctx.translate(x,y);if(o.ground){ctx.scale(1,o.sy||.45);if(o.rot)ctx.rotate(o.rot)}else{if(o.rot)ctx.rotate(o.rot);ctx.scale(o.flip?-1:1,o.sy||1)}
 ctx.globalAlpha*=o.alpha??1;if(s.add)ctx.globalCompositeOperation='lighter';if(o.gray)ctx.filter='grayscale(1) brightness(.55)';
 ctx.imageSmoothingEnabled=true;ctx.drawImage(s.im,sx,sy,cell,cell,-size/2,-size/2,size,size);ctx.restore();return true;
}
window.FX39={draw,ready,KEYS};
})();
