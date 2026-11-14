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
 // margens com arte desenhada em volta do piso jogável (esquerda/direita ~58, topo ~190, base ~120 unidades do mapa)
 let mxw=52,mtw=180,mbw=110;
 try{const im=SANCTUARY_ART.scene,fl=SANCTUARY_FLOOR;if(im&&im.naturalWidth){const sx=W/fl.w,sy=H/fl.h;mxw=fl.x*sx-6;mtw=fl.y*sy-10;mbw=(im.naturalHeight-fl.y-fl.h)*sy-8}}catch{}
 const mx=mxw*scale,mt=mtw*scale,mb=mbw*scale;
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


/* nome do rival sem o prefixo "FOCO ·" */
const prevUI2=updateUI;
updateUI=function(){
 prevUI2();
 const n=document.querySelector('.fighterhud.enemy .title b');
 if(n&&/^FOCO · /.test(n.textContent))n.textContent=n.textContent.replace(/^FOCO · /,'');
};

/* ícones de estado e marca de ultimate pronta sobre os lutadores */
function statusIcons(a){
 const out=[];
 try{
  if(typeof OriginalCombat!=='undefined'&&OriginalCombat.burns.some(e=>e.target===a&&e.remaining>0))out.push(['🔥','#ff9a3c']);
  if(a.slow>0)out.push(['❄','#8fd8ff']);
  if(a.root>0)out.push(['⛓','#c6b6e8']);
  if(a.skin===4&&reworkState(a).barrier)out.push(['🛡','#c4a5ff']);
  else if(a.inv>.15&&a.hp>0)out.push(['✦','#fff1b0']);
 }catch{}
 return out;
}
function ultReady(a){
 try{
  if(!a.kit||a.kit.length!==6||a.hp<=0)return false;
  const id=a.kit[5];
  return a.cd[id]<=0&&!rwResourceReason(a,5)&&!a.rwCast;
 }catch{return false}
}
const prevDepth2=integratedDepth;
integratedDepth=function(){
 const list=prevDepth2();
 for(const a of actors){
  if(!isFighter(a))continue;
  const ic=statusIcons(a),ur=ultReady(a);
  if(!ic.length&&!ur)continue;
  list.push({kind:'v3-status',y:99991+a.y*.001,priority:8,paint(){
   const n=ic.length+(ur?1:0),x0=a.x-(n-1)*8,y=a.y-74;
   ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='11px system-ui';
   let i=0;
   for(const [g,col] of ic){const x=x0+i*16;ctx.fillStyle='#08141eb8';ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,7.5,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.fillText(g,x,y+.5);i++}
   if(ur){const x=x0+i*16,pulse=.75+.25*Math.sin(clock*8);ctx.fillStyle='#2a1a05d0';ctx.strokeStyle='#ffd34d';ctx.lineWidth=1.4;ctx.shadowColor='#ffd34d';ctx.shadowBlur=6*pulse;ctx.beginPath();ctx.arc(x,y,7.5,0,TAU);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#ffe28a';ctx.font='bold 10px system-ui';ctx.fillText('★',x,y+.5)}
   ctx.restore();
  }});
 }
 return list.sort((u,v)=>u.y-v.y||(u.priority||0)-(v.priority||0));
};
window.v3Status={statusIcons,ultReady};

window.HudV3={isFighter,resourceOf,home};
})();
