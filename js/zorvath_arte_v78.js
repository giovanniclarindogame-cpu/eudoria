'use strict';
/*
 * Zorvath — arte pintada (gerada no ChatGPT) no lugar do pixel art por código, forma por forma e folha por folha.
 * Folhas em assets/chefes_v78/zorvath/: formaN_A (movimento), formaN_B (golpes), formaN_C (poderes).
 *  - forma 1: quadros de 256x256, base do corpo na linha 217 (o quadro é descido 15 px); o centro do tronco fica em x=150 (a cauda sai para a esquerda), por isso a âncora é 150
 *  - formas 2 e 3: quadros de 320x320, base do corpo em y=275 e ponta de baixo em x=180 (sobra de espaço à esquerda para a cauda)
 * Folha que ainda não existe → a pose usa a arte antiga (pixel art), só nela. ?zorarte=0 volta tudo para a arte antiga.
 * Só vale com a Caçada liberada (window.CACADA_LIBERADA, em config_teste.js) ou com ?cacada=1.
 */
(function(){
if(!window.CACADA_LIBERADA||/[?&]zorarte=0/.test(location.search)||typeof ZorvathSprite==='undefined')return;
const DIR='assets/chefes_v78/zorvath/';
// folhas existentes por forma
const FOLHAS={1:{A:1,B:1,C:1},3:{B:1,C:1}};
const GEO={1:{cel:256,ax:150,ay:232,dy:15},2:{cel:320,ax:180,ay:290,dy:0},3:{cel:320,ax:180,ay:290,dy:0}};
// pose do motor → [folha, coluna inicial, linha]; punch tem 2 variações (side)
const MAPA={
 idle:['A',0,0],guard:['A',4,0],glide:['A',0,1],hit:['A',4,1],dodge:['A',0,2],stun:['A',1,2],dead:['A',3,2],
 punch:['B',0,0],whip:['B',0,2],
 disc:['C',0,0],psy:['C',0,1],beam:['C',0,2],burst:['C',0,3],nova:['C',0,4],power:['C',0,5]
};
const N={idle:4,guard:2,glide:4,hit:2,dodge:1,stun:2,dead:1,punch:6,whip:4,disc:4,psy:3,beam:4,burst:3,nova:4,power:4};
const GLIDE=[0,1,2,1];   // o último quadro do deslizar é quase deitado: ida e volta pelos quadros 1-2-3 faz o loop suave
const imgs={},cache=new Map();
function carregar(form,folha){
 const k=form+folha;if(imgs[k])return imgs[k];
 const f=DIR+'forma'+form+'_'+folha+'.webp';
 return imgs[k]=window.lazyImage?window.lazyImage(f):Object.assign(new Image(),{src:f});
}
// formas sem a folha própria usam a arte pintada da forma 1, com uma tinta por forma (rosada na 2, violeta na 3): nunca voltam ao pixel art antigo
const TINTA={2:'hue-rotate(-28deg) saturate(1.25) brightness(1.05)',3:'hue-rotate(18deg) saturate(1.1) brightness(1.12)'};
function frame(name,i,{form=1,side=0}={}){
 const m=MAPA[name];if(!m)return null;
 const [folha,c0,row]=m;
 const src=(FOLHAS[form]&&FOLHAS[form][folha])?form:1;
 let k=i;if(name==='glide')k=GLIDE[i%GLIDE.length];
 k=Math.max(0,Math.min((N[name]||1)-1,k));
 let r=row;if(name==='punch')r=side?1:0;
 const col=c0+k,g=GEO[src],im=carregar(src,folha);
 if(!im.complete||!im.naturalWidth)return null;
 const key=form+'/'+src+folha+name+'|'+r+'|'+col;let c=cache.get(key);
 if(!c){c=document.createElement('canvas');c.width=c.height=g.cel;c.hd=true;c.ax=g.ax;c.ay=g.ay;
  const x=c.getContext('2d');if(src!==form&&TINTA[form]){try{x.filter=TINTA[form]}catch{}}
  x.drawImage(im,col*g.cel,r*g.cel,g.cel,g.cel,0,g.dy,g.cel,g.cel);cache.set(key,c)}
 return c;
}
ZorvathSprite.useSheet({frame});
window.ZorvathArte={frame,formas:Object.keys(FOLHAS).map(Number),folhas:FOLHAS};
})();
