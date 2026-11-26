/* Efeitos pintados do Zorvath (folhas 6 colunas, quadros de 320 px). Se a folha ainda não carregou,
   quem desenha cai no efeito antigo feito por código. */
(function(){
 'use strict';
 const BASE='assets/chefes_v78/zorvath/efeitos/',C=320,FOLHAS={};
 function carregar(nome,v){
  if(FOLHAS[nome])return FOLHAS[nome];
  const img=new Image(),f=FOLHAS[nome]={img,ok:false};
  img.onload=()=>{f.ok=img.naturalWidth>0};img.src=BASE+nome+'.webp?v='+(v||1);
  return f;
 }
 // desenha o quadro (linha,coluna) centrado em (cx,cy) com lado "lado"; ax/ay = ponto de ancoragem (0..1) dentro do quadro
 function quadro(g,nome,linha,col,cx,cy,lado,ax=.5,ay=.5){
  const f=FOLHAS[nome];if(!f||!f.ok)return false;
  g.drawImage(f.img,col*C,linha*C,C,C,cx-lado*ax,cy-lado*ay,lado,lado);return true;
 }
 const pronto=n=>!!(FOLHAS[n]&&FOLHAS[n].ok);
 window.ZorEfx={carregar,quadro,pronto,C};
 carregar('supernova');carregar('raio');carregar('disco');carregar('poder');
})();
