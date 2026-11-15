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
const WARM=glowSprite('255,150,60'),FLY=glowSprite('230,255,150',32);
const mod=(v,m)=>((v%m)+m)%m;
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
   const flip=Math.cos(t*q.spin*2+q.ph);
   ctx.save();ctx.translate(x,y);ctx.rotate(q.rot+t*q.spin*.5);ctx.scale(1,.35+.65*Math.abs(flip));
   ctx.globalAlpha=.88;ctx.fillStyle=q.tone<.5?'#ffc7d9':'#ffdbe7';
   ctx.beginPath();ctx.ellipse(0,0,q.s,q.s*.62,0,0,6.2832);ctx.fill();
   ctx.restore();
  }
  ctx.restore();
 }});
 return list;
};
window.CenarioV3={petals:PETALS.length,flies:FLIES.length};
})();
