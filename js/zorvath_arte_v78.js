'use strict';
/*
 * Zorvath — arte pintada (gerada no ChatGPT) no lugar do pixel art por código, forma por forma.
 * Folhas (assets/chefes_v78/zorvath/): forma1_A (movimento), forma1_B (golpes), forma1_C (poderes). Quadros de 256x256, base do corpo na linha 217.
 * Formas sem folha (2 e 3, por enquanto) continuam com a arte antiga. ?zorarte=0 volta tudo para a arte antiga.
 * Cada quadro vira um canvas 256x256 com o "chão" do chefe (ponta de baixo) em y=232 e o centro em x=128: a mesma âncora que o motor usa no desenho de 64x64.
 */
(function(){
if(/[?&]zorarte=0/.test(location.search)||typeof ZorvathSprite==='undefined')return;
const DIR='assets/chefes_v78/zorvath/',CEL=256,DY=232-217;
const FORMAS={1:{A:'forma1_A.webp',B:'forma1_B.webp',C:'forma1_C.webp'}};
// pose do motor → [folha, coluna inicial, linha, quantidade, colunas da folha]; punch tem 2 variações (side)
const MAPA={
 idle:['A',0,0],guard:['A',4,0],glide:['A',0,1],hit:['A',4,1],dodge:['A',0,2],stun:['A',1,2],dead:['A',3,2],
 punch:['B',0,0],whip:['B',0,2],
 disc:['C',0,0],psy:['C',0,1],beam:['C',0,2],burst:['C',0,3],nova:['C',0,4],power:['C',0,5]
};
const COLS={A:6,B:6,C:4},N={idle:4,guard:2,glide:4,hit:2,dodge:1,stun:2,dead:1,punch:6,whip:4,disc:4,psy:3,beam:4,burst:3,nova:4,power:4};
const GLIDE=[0,1,2,1];   // o quadro 4 do deslizar é quase deitado: ida e volta pelos quadros 1-2-3 faz o loop suave
const imgs={},cache=new Map();
function carregar(f,chave){
 if(imgs[chave])return imgs[chave];
 const im=window.lazyImage?window.lazyImage(DIR+f):Object.assign(new Image(),{src:DIR+f});imgs[chave]=im;return im;
}
function frame(name,i,{form=1,side=0}={}){
 const sheets=FORMAS[form],m=MAPA[name];if(!sheets||!m)return null;
 const [folha,c0,row]=m;
 let k=i;if(name==='glide')k=GLIDE[i%GLIDE.length];
 k=Math.max(0,Math.min((N[name]||1)-1,k));
 let r=row;if(name==='punch')r=side?1:0;
 const col=c0+k;
 const im=carregar(sheets[folha],form+folha);
 if(!im.complete||!im.naturalWidth)return null;
 const key=form+folha+name+'|'+r+'|'+col;let c=cache.get(key);
 if(!c){c=document.createElement('canvas');c.width=c.height=CEL;c.hd=true;const g=c.getContext('2d');g.drawImage(im,col*CEL,r*CEL,CEL,CEL,0,DY,CEL,CEL);cache.set(key,c)}
 return c;
}
ZorvathSprite.useSheet({frame});
window.ZorvathArte={frame,formas:Object.keys(FORMAS).map(Number)};
})();
