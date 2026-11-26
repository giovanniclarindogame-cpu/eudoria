'use strict';
/*
 * ZORVATH — Imperador Cristalino. O corpo agora é só a arte pintada (js/zorvath_arte_v78.js, folhas em assets/chefes_v78/zorvath/).
 * Este arquivo ficou só com o necessário: lista de poses e quantidade de quadros, desenho do quadro na tela (paint)
 * e dois ajudantes de pixel usados pelos ícones das habilidades da Caçada (rect e disc).
 * O pixel art antigo do corpo (desenhado por código) foi removido de propósito para nunca mais aparecer.
 */
const ZorvathSprite=(()=>{
 const S=64,GY=58,CX=32,HOV=6;
 const C={ink:'#150b24',gem:'#ff3a6e',glow:'#ff62a8',aura:'#b86bff'};
 function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)}
 function disc(g,x,y,r,c){g.fillStyle=c;for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(i*i+j*j<=r*r+r*.6)g.fillRect(Math.round(x+i),Math.round(y+j),1,1)}
 // poses e quantidade de quadros de cada uma (iguais às das folhas pintadas)
 const POSES={idle:{n:4},glide:{n:4},guard:{n:2},punch:{n:6},hit:{n:2},dodge:{n:1},stun:{n:2},power:{n:4},beam:{n:4},disc:{n:4},whip:{n:4},psy:{n:3},burst:{n:3},nova:{n:4},dead:{n:1}};
 let external=null;
 const vazio=document.createElement('canvas');vazio.width=vazio.height=S;
 // enquanto a folha pintada ainda baixa, não desenha nada (em vez de mostrar o modelo antigo)
 function frame(name,i=0,opt={}){
  const form=Math.min(3,Math.max(1,opt.form||1)),side=opt.side?1:0;
  return (external&&external.frame(name,i,{form,side}))||vazio;
 }
 function paint(g,name,i,o={}){
  const{x=0,y=0,scale=2,flip=false,alpha=1,form=1,side=0}=o;
  const c=frame(name,i,{form,side});if(c===vazio)return;
  g.save();g.imageSmoothingEnabled=!!c.hd;g.globalAlpha*=alpha;g.translate(x,y);if(flip)g.scale(-1,1);
  if(o.filter)g.filter=o.filter;
  if(c.hd){const u=S*scale/256;g.drawImage(c,-(c.ax??128)*u,-(c.ay??232)*u,c.width*u,c.height*u)}
  g.restore();
 }
 function layout(){return Object.entries(POSES).map(([name,d])=>({name,frames:d.n,variants:name==='punch'?2:1}))}
 function useSheet(provider){external=provider||null}
 return{S,GY,CX,HOV,POSES,frame,paint,layout,useSheet,C,disc,rect};
})();
if(typeof window!=='undefined')window.ZorvathSprite=ZorvathSprite;
