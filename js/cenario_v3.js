'use strict';
/*
 * Cenário vivo (v3): pétalas de cerejeira, brilho pulsante nas lanternas e vagalumes.
 * Tudo é calculado a partir do tempo da simulação (sem estado), então pausar congela os efeitos.
 * Desliga com ?cenario=0 ou quando o aparelho pede menos movimento (prefers-reduced-motion).
 */
(()=>{
const OFF=/[?&]cenario=0/.test(location.search)||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
if(OFF)return;
let sd=20240;const rnd=()=>{sd=(Math.imul(sd,1664525)+1013904223)>>>0;return sd/4294967296};
const PETALS=Array.from({length:46},()=>({x:rnd(),y:rnd(),fall:22+rnd()*26,drift:10+rnd()*16,sway:14+rnd()*22,f:.7+rnd()*1.1,ph:rnd()*6.28,s:4+rnd()*3.2,rot:rnd()*6.28,spin:.8+rnd()*2.2,tone:rnd()}));
const FLIES=Array.from({length:16},()=>({x:rnd(),y:rnd(),rx:14+rnd()*34,ry:8+rnd()*20,f:.25+rnd()*.5,ph:rnd()*6.28,p:.8+rnd()*1.6,s:1.6+rnd()*1.3}));
function glowSprite(rgb,size=64){const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),h=size/2,r=g.createRadialGradient(h,h,0,h,h,h);r.addColorStop(0,`rgba(${rgb},1)`);r.addColorStop(.35,`rgba(${rgb},.35)`);r.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=r;g.fillRect(0,0,size,size);return c}
const FOGS=Array.from({length:7},()=>({x:rnd(),y:.5+rnd()*.5,w:420+rnd()*360,h:90+rnd()*70,v:6+rnd()*9,a:.05+rnd()*.05,ph:rnd()*6.28}));
const RAYS=[{x:.18,w:70,sk:150,ph:0},{x:.47,w:96,sk:170,ph:2.1},{x:.74,w:64,sk:140,ph:4.2}];
const dust=[],gusts=[];
const FOG=glowSprite('205,222,238',96);
const WARM=glowSprite('255,150,60'),FLY=glowSprite('230,255,150',32);
const mod=(v,m)=>((v%m)+m)%m;
const clock0=()=>(typeof vfxTime==='number'?vfxTime:(typeof clock==='number'?clock:0))||0;
// reação ao combate: golpe forte levanta poeira; ultimate sopra as pétalas
if(typeof hit==='function'){const prevHit=hit;hit=function(t,n,o,k,an,id){const r=prevHit.apply(this,arguments);
 try{if(t&&!t.trainingDummy&&n>=Math.max(60,(t.max||1000)*.06)&&state==='fight'){const now=clock0();for(let i=0;i<5&&dust.length<26;i++)dust.push({x:t.x+(Math.random()-.5)*26,y:t.y+8+Math.random()*8,vx:(Math.random()-.5)*44,t0:now,r:9+Math.random()*9})}}catch{}
 return r}}
if(typeof cast==='function'){const prevCast=cast;cast=function(a,id){const r=prevCast.apply(this,arguments);
 try{if(r&&skills[id]?.ultimate&&a&&state==='fight'){gusts.push({x:a.x,y:a.y,t0:clock0()});if(gusts.length>3)gusts.shift()}}catch{}
 return r}}
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(typeof p==='undefined'||!p||typeof W==='undefined'||state==='end')return list;
 const t=(typeof vfxTime==='number'?vfxTime:clock)||0;
 // brilho quente nas lanternas (cintila de leve, como chama)
 for(const o of pillars||[]){
  list.push({kind:'v3-glow',y:1e8,priority:9,paint(){
   const fl=.5+.18*Math.sin(t*7.3+o.x)+.12*Math.sin(t*11.1+o.y*.3)+.08*Math.sin(t*3.1);
   const size=o.r*7,cy=o.y-o.r*.85;
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.95*fl;ctx.drawImage(WARM,o.x-size/2,cy-size/2,size,size);
   // luz no chão ao redor da base
   ctx.globalAlpha=.4*fl;ctx.translate(o.x,o.y+4);ctx.scale(1,.42);ctx.drawImage(WARM,-size*.7,-size*.7,size*1.4,size*1.4);ctx.restore();
  }});
 }
 list.unshift({kind:'v3-fog',y:-1e9,priority:-9,paint(){
  ctx.save();
  // raios de luz (douradas, bem fracos) atravessando a arena
  ctx.globalCompositeOperation='lighter';
  for(const r of RAYS){const pul=.6+.4*Math.sin(t*.35+r.ph),x0=r.x*W+Math.sin(t*.08+r.ph)*40;
   for(const [k,al] of [[1.6,.012],[1,.016]]){ctx.globalAlpha=al*pul*3;ctx.fillStyle='rgb(255,232,170)';ctx.beginPath();ctx.moveTo(x0-r.w*k/2,-40);ctx.lineTo(x0+r.w*k/2,-40);ctx.lineTo(x0+r.w*k/2+r.sk,H);ctx.lineTo(x0-r.w*k/2+r.sk,H);ctx.closePath();ctx.fill()}}
  // névoa baixa deslizando pelo chão
  ctx.globalCompositeOperation='source-over';
  for(const f of FOGS){const x=mod(f.x*W+f.v*t,W+f.w)-f.w/2,y=f.y*H,br=.75+.25*Math.sin(t*.2+f.ph);ctx.globalAlpha=f.a*br;ctx.drawImage(FOG,x-f.w/2,y-f.h/2,f.w,f.h)}
  ctx.restore();
 }});
 list.push({kind:'v3-ambient',y:1e9,priority:9,paint(){
  ctx.save();
  // vagalumes: orbitam pontos fixos perto das lanternas e das bordas; pulsam
  ctx.globalCompositeOperation='lighter';
  FLIES.forEach((f,i)=>{
   const base=pillars&&pillars.length&&i%2===0?pillars[i/2%pillars.length|0]:null;
   const bx=base?base.x+(f.x-.5)*90:f.x*W,by=base?base.y-24+(f.y-.5)*60:f.y*H;
   const x=bx+Math.sin(t*f.f+f.ph)*f.rx,y=by+Math.cos(t*f.f*1.3+f.ph)*f.ry;
   const a=Math.max(0,Math.sin(t*f.p+f.ph))**2*.85;if(a<.03)return;
   const s=f.s*7;ctx.globalAlpha=a;ctx.drawImage(FLY,x-s/2,y-s/2,s,s);
  });
  ctx.globalCompositeOperation='source-over';
  // pétalas: caem, balançam e giram; o vento varia devagar
  const wind=Math.sin(t*.22)*.5+.9;
  for(const q of PETALS){
   const x=mod(q.x*W+(q.drift*wind)*t+Math.sin(t*q.f+q.ph)*q.sway,W+40)-20,y=mod(q.y*(H+60)+q.fall*t,H+60)-30;
   let px=x,py=y;
   for(const G of gusts){const age=t-G.t0;if(age<0||age>2.2)continue;const dx=x-G.x,dy=y-G.y,d=Math.hypot(dx,dy)||1,e=1-Math.pow(1-age/2.2,2.2),fall=Math.max(0,1-d/520);px+=dx/d*300*e*fall;py+=dy/d*190*e*fall-70*e*fall}
   const flip=Math.cos(t*q.spin*2+q.ph);
   ctx.save();ctx.translate(px,py);ctx.rotate(q.rot+t*q.spin*.5);ctx.scale(1,.35+.65*Math.abs(flip));
   ctx.globalAlpha=.88;ctx.fillStyle=q.tone<.5?'#ffc7d9':'#ffdbe7';
   ctx.beginPath();ctx.ellipse(0,0,q.s,q.s*.62,0,0,6.2832);ctx.fill();
   ctx.restore();
  }
  // poeira dos golpes fortes
  for(let i=dust.length-1;i>=0;i--){const d=dust[i],age=t-d.t0;if(age>.7||age<0){dust.splice(i,1);continue}
   const u=age/.7;ctx.globalAlpha=.34*(1-u);ctx.fillStyle='#c9bfa8';ctx.beginPath();ctx.ellipse(d.x+d.vx*age,d.y-age*16,d.r*(.6+u*1.1),d.r*(.4+u*.6),0,0,6.2832);ctx.fill()}
  // K.O.: o cenário escurece por um instante
  let ko=0;for(const a of actors||[])if(a.hp<=0&&a.koAge!==undefined&&!a.boss&&!a.trainingDummy)ko=Math.max(ko,a.koAge);
  if(ko>0){const k=ko<.3?ko/.3:ko<2.4?1:Math.max(0,1-(ko-2.4)/.9);if(k>0){ctx.globalAlpha=.2*k;ctx.fillStyle='#050a14';ctx.fillRect(-2000,-2000,6000,5000)}}
  ctx.restore();
 }});
 return list;
};
window.CenarioV3={petals:PETALS.length,flies:FLIES.length,dust,gusts};
})();
