'use strict';
/*
 * HUD v3 (tela mais limpa):
 *  - barra de vida (e uma segunda barra de recurso, abaixo) em cima de cada lutador;
 *  - cartões compactos nos cantos de cima (você num canto, rival no outro) e o tempo no meio;
 *  - com 25% de vida ou menos, as bordas da tela piscam em vermelho;
 *  - analógico flutuante: aparece onde o dedo toca na metade esquerda da tela (o desenho fixo fica de dica).
 */
(function(){
if(!window.COMBAT_V3)return;
const TAU=Math.PI*2;
const isFighter=a=>!!a&&a.hp>0&&!a.boss&&!a.mob&&!a.rmob&&!a.trainingDummy&&Array.isArray(a.kit)&&a.kit.length===6;
function resourceOf(a){
 try{
  const s=reworkState(a);
  if(a.skin===0)return {v:s.value/100,c:s.powerT>0?'#ffe27a':'#62d6ff'};
  if([2,3,6,7,8].includes(a.skin))return {v:clamp(s.value/100,0,1),c:CHAMPIONS[a.skin].color};
  if(a.skin===4)return {v:clamp((s.barrierEnergy||0)/240,0,1),c:'#c4a5ff'};
 }catch{}
 return null;
}
function bar(x,y,w,h,f,col,back){
 ctx.fillStyle='#000a';ctx.fillRect(x-1,y-1,w+2,h+2);
 ctx.fillStyle=back;ctx.fillRect(x,y,w,h);
 ctx.fillStyle=col;ctx.fillRect(x,y,Math.max(0,w*clamp(f,0,1)),h);
}
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 for(const a of actors){
  if(!isFighter(a))continue;
  list.push({kind:'v3-bar',y:99990+a.y*.001,priority:8,paint(){
   const f=a.hp/a.max,ally=a.team===p.team,w=46,x=a.x-w/2,y=a.y-62;
   ctx.save();
   bar(x,y,w,5,f,f<=.25?'#ff5348':ally?'#59d98e':'#ee5c5c','#2a1417');
   if(a.shield>0){ctx.fillStyle='#d6e6ff';ctx.fillRect(x,y-2,w*clamp(a.shield/a.max,0,1),2)}
   const r=resourceOf(a);
   if(r)bar(x,y+7,w,3,r.v,r.c,'#101a24');
   ctx.restore();
  }});
 }
 return list.sort((u,v)=>u.y-v.y||(u.priority||0)-(v.priority||0));
};

/* câmera de "arena inteira"/treino: o mapa sempre cobre a tela (sem faixas vazias nas laterais); se sobrar, a câmera segue o herói */
const prevCam=updateArenaCamera;
updateArenaCamera=function(){
 prevCam();
 if(!cw||!ch||cw<ch||!p)return;
 const bt=document.getElementById('battle');
 if(!bt||bt.dataset.arena||W>1500||arenaModeId)return;
 scale=Math.max(cw/W,ch/H);
 const f=p.hp>0?p:actors.find(a=>a.team===p.team&&a.hp>0)||p;
 const mx=46*scale,mt=70*scale,mb=60*scale;   // a arte continua além da borda jogável: a câmera pode ir um pouco além
 ox=clamp(cw/2-f.x*scale,cw-W*scale-mx,mx);oy=clamp(ch/2-f.y*scale,ch-H*scale-mb,mt);
};

/* bordas vermelhas piscando */
const fx=document.createElement('div');fx.id='lowHpFx';document.getElementById('battle').appendChild(fx);
const prevUI=updateUI;
updateUI=function(){
 prevUI();
 const low=state==='fight'&&p&&p.hp>0&&p.hp/p.max<=.25;
 if(fx.classList.contains('on')!==low)fx.classList.toggle('on',low);
};

/* analógico flutuante */
const stick=document.getElementById('stick');
function home(){stick.style.removeProperty('left');stick.style.removeProperty('top');stick.style.removeProperty('bottom');stick.classList.remove('floating');window.V3Layout?.applyStick?.()}
document.addEventListener('pointerdown',e=>{
 if(state!=='fight'||stickID!==null||e.pointerType==='mouse')return;
 const t=e.target;
 if(t.closest&&t.closest('#stick,#controls .skill,#equipped,.action-group,.hud,#pause,#outcome,button,#arenaZoom'))return;
 const b=document.getElementById('battle');if(!b||b.style.display!=='block')return;
 if(e.clientX>innerWidth*.46||e.clientY<64)return;
 const r=stick.getBoundingClientRect(),w=r.width,zoom=w/(stick.offsetWidth||w)||1;
 const cx=clamp(e.clientX,w/2+6,innerWidth*.46),cy=clamp(e.clientY,70+w/2,innerHeight-w/2-6);
 stick.style.setProperty('left',((cx-w/2)/zoom)+'px','important');
 stick.style.setProperty('top',((cy-w/2)/zoom)+'px','important');
 stick.style.setProperty('bottom','auto','important');
 stick.classList.add('floating');
 e.preventDefault();e.stopPropagation();
 stickID=e.pointerId;try{stick.setPointerCapture(e.pointerId)}catch{}stickMove(e);
},true);
for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(e.pointerId===undefined||stickID===null||e.pointerId===stickID||true){setTimeout(()=>{if(stickID===null)home()},0)}});

/* foto do rosto do campeão nos cartões do HUD: recorte automático da cabeça do retrato atual de cada herói */
const faceCache=new Map(),faceBusy=new Set();
function faceCrop(img){
 const W=img.naturalWidth,H=img.naturalHeight,sc=Math.min(1,160/W),w=Math.max(8,Math.round(W*sc)),h=Math.max(8,Math.round(H*sc));
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(img,0,0,w,h);
 const d=g.getImageData(0,0,w,h).data;
 let y0=0;for(;y0<h;y0++){let n=0;for(let x=0;x<w;x++)if(d[(y0*w+x)*4+3]>60)n++;if(n>2)break}
 const band0=y0+Math.round(h*.04),band1=y0+Math.round(h*.13),xs=[];
 for(let y=band0;y<band1&&y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>60)xs.push(x);
 xs.sort((a,b)=>a-b);
 const lo=xs[Math.floor(xs.length*.1)]??0,hi=xs[Math.floor(xs.length*.9)]??w-1,cx=(lo+hi)/2;
 const side=Math.min(Math.max((hi-lo)*2.05,h*.33),w,h);
 let sx=clamp(cx-side/2,0,w-side),sy=clamp(y0-h*.02,0,h-side);
 const out=document.createElement('canvas');out.width=out.height=96;const o=out.getContext('2d');
 o.imageSmoothingEnabled=true;o.imageSmoothingQuality='high';
 o.drawImage(img,sx/sc,sy/sc,side/sc,side/sc,0,0,96,96);
 return out.toDataURL('image/webp',.92);
}
window.v3FaceSrc=function(a){
 if(!a||a.trainingDummy||a.boss||a.mob||a.rmob||!Array.isArray(a.kit)||a.kit.length!==6)return null;
 const c=CHAMPIONS[a.skin];if(!c)return null;
 const src=championArt(c);if(!src)return null;
 if(faceCache.has(src))return faceCache.get(src);
 if(!faceBusy.has(src)){
  faceBusy.add(src);
  const im=new Image();im.onload=()=>{try{faceCache.set(src,faceCrop(im))}catch(e){faceCache.set(src,null)}};im.onerror=()=>faceCache.set(src,null);im.src=src;
 }
 return null;
};
window.v3FaceCrop=faceCrop;

window.HudV3={isFighter,resourceOf,home};
})();
