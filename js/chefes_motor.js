'use strict';
/*
 * MOTOR GENÉRICO DOS CHEFES (todos menos o Zorvath, que tem motor próprio em js/cacada_dia.js).
 * Cada chefe é uma definição de dados (js/chefes_lote.js): 6 habilidades montadas com ataques-padrão
 * (leque, investida, círculo, anel, chuva, raio, marcação, vórtice, teleporte, zona, buff, clones, combo, nova,
 * orbitais) + uma mecânica única (def.mech) + visual (def.look).
 */
(()=>{
const hunt=()=>modeRun&&modeRun.gb;
const ang=(a,t)=>Math.atan2(t.y-a.y,t.x-a.x),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const foes=A=>opponents(A);
const col=R=>R.def.look.aura||{a:'#c04bff',b:'#ff62a8'};

/* ============================== utilidades ============================== */
function bossHit(R,t,dmg,knock,angle,opt={}){
 const A=R.a;if(t.hp<=0||A.hp<=0)return false;
 let n=dmg*(R.def.dmg||1)*(R.phase===2?1.1:1)*(R.buff?R.buff.dmg:1);
 if(R.def.mech?.dmgMul)n*=R.def.mech.dmgMul(R);
 if(opt.breakGuard&&t.guard&&t.inv<=0)breakGuard(t);
 const ok=hit(t,n,A,knock,angle,-1);
 if(ok){R.landed++;R.def.mech?.onLanded?.(R,t,n,opt);window.BossCopy?.landed(R,t)}
 return ok;
}
function addTele(R,o){R.tele.push(Object.assign({t:0,dur:1,color:col(R).b},o))}
function addZone(R,o){R.zones.push(Object.assign({t:0,delay:.8,dur:4,tick:.5,dmg:20,r:70,acc:0,color:col(R).a,kind:'zone'},o))}
function fireProj(R,A,a,P){
 R.proj.push({x:A.x+Math.cos(a)*26,y:A.y-6+Math.sin(a)*26,vx:Math.cos(a)*P.speed,vy:Math.sin(a)*P.speed,r:P.r||11,dmg:P.dmg,life:P.life||2.6,t:0,color:P.c||col(R).a,color2:P.c2||col(R).b,homing:P.homing||0,shape:P.shape||'orb',pierce:!!P.pierce,hits:new Set(),knock:P.knock||14});
}
function rayEnd(x,y,a,max=760){let d=0,px=x,py=y;while(d<max){const nx=x+Math.cos(a)*(d+10),ny=y+Math.sin(a)*(d+10);if(blocked(nx,ny,3))break;px=nx;py=ny;d+=10}return{x:px,y:py,len:d}}
function shock(R,r,dmg,knock,r0=0,cx=R.a.x,cy=R.a.y,bg=true){
 const A=R.a,c=col(R);ring(cx,cy,r,c.b,.55);ring(cx,cy,r*.7,c.a,.45);spark(cx,cy,c.a,22);combatImpact(1.7);combatSound('heavy',1.3);
 for(const t of foes(A)){const d=dist({x:cx,y:cy},t);if(d<r+t.r&&d>=r0)bossHit(R,t,dmg,knock,Math.atan2(t.y-cy,t.x-cx),{breakGuard:bg})}
}
function pickTarget(R,A){
 const list=foes(A);if(!list.length)return null;
 R.aggroT-=1/60;
 if(R.aggroT<=0||!list.includes(R.aggro)){R.aggroT=3+Math.random()*3;R.aggro=list.length>1&&Math.random()<.4?list[1]:list[0]}
 const near=list.sort((x,y)=>dist(A,x)-dist(A,y))[0];
 return dist(A,near)<110?near:R.aggro;
}
window.BossKit={bossHit,addTele,addZone,fireProj,rayEnd,shock,foes,ang,wrap};

/* ============================== ataques-padrão ============================== */
const K={};
// golpes corpo a corpo
K.combo=(dt,A,R,T,a,P)=>{
 if(!a.init){a.init=1;a.N=(P.hits||3)+(R.phase===2?(P.hits2||0):0);a.k=0}
 const st=P.wind??.2,gap=P.gap??.42,dur=st+(a.N-1)*gap+.5,dm=P.dmgs||[30,34,44,66];
 const k=Math.min(a.N-1,Math.max(0,Math.floor(a.t/gap)));
 R.pose={name:'punch',i:clamp(Math.floor(((a.t-k*gap)/gap)*6),0,5),side:k%2};
 if(!a.stop&&a.k<a.N&&a.t>=st+a.k*gap){
  const i=a.k++;A.a=ang(A,T);R.face=A.a;move(A,Math.cos(A.a)*14,Math.sin(A.a)*14);
  const last=i===a.N-1,reach=(P.reach||92)+T.r;let landed=false;
  for(const t of foes(A)){const d=dist(A,t),diff=Math.abs(wrap(ang(A,t)-A.a));
   if(d<reach&&diff<1.0&&bossHit(R,t,dm[Math.min(i,dm.length-1)],last?(P.knock||70):12,ang(A,t)))landed=true}
  combatSound(last?'heavy':'hit',last?1.2:.9);
  R.def.mech?.onSwing?.(R,A,A.a,i);
  if(!landed)a.stop=true;
 }
 return a.t>=(a.stop?st+a.k*gap+.25:dur);
};
// leque de projéteis
K.fan=(dt,A,R,T,a,P)=>{
 const w=P.wind??.5;
 if(!a.init){a.init=1;a.ang=ang(A,T)}
 if(a.t<w){a.ang=ang(A,T);A.a=a.ang;R.face=a.ang}
 R.pose={name:'s0',i:a.t<w*.5?0:a.t<w?1:a.t<w+.15?2:3};R.glow=Math.max(R.glow,.6);
 if(!a.f1&&a.t>=w){a.f1=1;const n=(P.n||5)+(R.phase===2?(P.n2||0):0),sp=P.spread??.95;
  for(let i=0;i<n;i++)fireProj(R,A,a.ang+(n===1?0:(i-(n-1)/2)*(sp/(n-1))),{...P,speed:P.speed+(i%2)*(P.jit||0)});
  combatSound('hit',1);R.def.mech?.onCast?.(R,A,'fan')}
 if(P.again&&R.phase===2&&!a.f2&&a.t>=w+P.again){a.f2=1;const q=ang(A,T);A.a=q;R.face=q;for(let i=-1;i<=1;i++)fireProj(R,A,q+i*.09,{...P,speed:P.speed*1.25,dmg:P.dmg*.9})}
 return a.t>=w+(P.rec??.45)+(P.again&&R.phase===2?P.again:0);
};
// investida em linha marcada
K.dash=(dt,A,R,T,a,P)=>{
 const w=P.wind??.65;
 if(!a.init){a.init=1;a.ang=ang(A,T);a.len=clamp(dist(A,T)+(P.over||90),P.min||300,P.max||500);A.a=a.ang;R.face=a.ang;
  addTele(R,{kind:'line',x:A.x,y:A.y,a:a.ang,len:a.len,w:P.w||58,dur:w})}
 if(a.t<w){R.pose={name:'s1',i:a.t<w*.45?0:1};return false}
 if(!a.go){a.go=1;a.dist=0;a.hits=new Set();combatSound('heavy',1.1)}
 if(!a.stop){
  const mv=(P.speed||1150)*dt,bx=A.x,by=A.y,bl=move(A,Math.cos(a.ang)*mv,Math.sin(a.ang)*mv);
  a.dist+=Math.hypot(A.x-bx,A.y-by);R.ghosts.push({x:A.x,y:A.y,face:R.face,life:.22,max:.22});
  const tr=P.trail||R.def.mech?.trail?.(R);if(tr&&Math.random()<.5)addZone(R,{x:A.x,y:A.y,r:tr.r||34,delay:0,dur:tr.dur||3,tick:.4,dmg:tr.dmg||14,color:col(R).a,kind:'fire'});
  for(const t of foes(A))if(!a.hits.has(t)&&dist(A,t)<A.r+t.r+14){a.hits.add(t);bossHit(R,t,P.dmg,P.knock||70,a.ang)}
  if(bl||a.dist>=a.len){a.stop=1;a.rec=a.t;ring(A.x,A.y,50,col(R).a,.4);spark(A.x,A.y,col(R).b,10)}
 }
 R.pose={name:'s1',i:a.stop?3:2};
 return !!a.stop&&a.t-a.rec>(P.rec??.55);
};
// círculo ao redor do chefe
K.blast=(dt,A,R,T,a,P)=>{
 const w=P.wind??.7;
 if(!a.init){a.init=1;a.sweeps=P.sweeps||1;a.n=0;a.at=w;addTele(R,{kind:'circle',follow:A,r:P.r,dur:w})}
 R.pose={name:'s2',i:a.t<a.at-.3?0:a.t<a.at?1:a.t<a.at+.2?2:3};R.glow=Math.max(R.glow,a.t<a.at?a.t/a.at:1);
 if(a.n<a.sweeps&&a.t>=a.at){a.n++;shock(R,P.r,P.dmg,P.knock??90,0,A.x,A.y,P.breakGuard!==false);R.def.mech?.onCast?.(R,A,'blast');
  if(a.n<a.sweeps){a.at+=P.gap||.5;addTele(R,{kind:'circle',follow:A,r:P.r,dur:P.gap||.5})}}
 return a.n>=a.sweeps&&a.t>=a.at+.45;
};
// anel (a segunda onda atinge quem fugiu)
K.ring=(dt,A,R,T,a,P)=>{
 const w=P.wind??.7;
 if(!a.init){a.init=1;addTele(R,{kind:'circle',follow:A,r:P.r0,dur:w})}
 R.pose=a.t<w?{name:'s2',i:a.t<w*.5?0:1}:{name:'s2',i:a.t<w+.2?2:3};R.glow=Math.max(R.glow,a.t<w?a.t/w:1);
 if(!a.f1&&a.t>=w){a.f1=1;shock(R,P.r0,P.dmg,P.knock??90)}
 if(!a.t2&&a.t>=w+.15){a.t2=1;addTele(R,{kind:'ring',x:A.x,y:A.y,r:P.r,r0:P.r0,dur:.55})}
 if(!a.f2&&a.t>=w+.7){a.f2=1;shock(R,P.r,P.dmg2??P.dmg*.9,P.knock2??70,P.r0)}
 return a.t>=w+1.25;
};
// chuva de marcações
K.rain=(dt,A,R,T,a,P)=>{
 const waves=(P.waves||2)+(R.phase===2?(P.waves2||0):0),gap=P.gap??.85;
 if(!a.init){a.init=1;a.next=P.wind??.55;a.w=0}
 R.pose={name:'s3',i:a.t<.25?0:a.t<.5?1:a.w>=waves?3:2};R.glow=Math.max(R.glow,.5);
 if(a.w<waves&&a.t>=a.next){a.w++;a.next+=gap;
  const spots=[];for(const t of foes(A)){spots.push({x:t.x,y:t.y});for(let j=1;j<(P.per||2);j++){const o=Math.random()*TAU,d=70+Math.random()*50;spots.push({x:t.x+Math.cos(o)*d,y:t.y+Math.sin(o)*d})}}
  if(P.rand)for(let j=0;j<P.rand;j++){const o=Math.random()*TAU;spots.push({x:A.x+Math.cos(o)*(160+Math.random()*140),y:A.y+Math.sin(o)*(110+Math.random()*90)})}
  for(const s of spots){const x=clamp(s.x,70,W-70),y=clamp(s.y,70,H-70);
   addTele(R,{kind:'meteor',x,y,r:P.r||64,dur:P.delay||1.05,onDone:()=>{
    ring(x,y,P.r||64,col(R).b,.5);ring(x,y,(P.r||64)*.6,col(R).a,.4);spark(x,y,col(R).b,16);combatImpact(1.1);combatSound('heavy',1);
    for(const t of foes(A))if(dist(t,{x,y})<(P.r||64)+t.r)bossHit(R,t,P.dmg,45,Math.atan2(t.y-y,t.x-x));
    if(P.leave)addZone(R,{x,y,r:(P.r||64)*.8,delay:0,dur:P.leave.dur||3,tick:.45,dmg:P.leave.dmg||12,color:col(R).a,kind:P.leave.kind||'fire'});
   }})}
 }
 return a.w>=waves&&a.t>=a.next-gap+(P.delay||1.05)+.3;
};
// raio
K.beam=(dt,A,R,T,a,P)=>{
 if(!a.init){a.init=1;a.shots=(P.shots||1)+(R.phase===2?(P.shots2||0):0);a.shot=0;a.sub=0;a.ang=ang(A,T);a.phase='charge'}
 a.sub+=dt;const ch=a.shot===0?(P.charge||1):(P.charge2||.5),w=P.w||60,fd=P.dur||.4;
 if(a.phase==='charge'){
  if(a.sub<ch*.6)a.ang+=wrap(ang(A,T)-a.ang)*Math.min(1,dt*(P.track||4));
  A.a=a.ang;R.face=a.ang;R.glow=Math.max(R.glow,.4+a.sub/ch*.5);
  R.cannon={a:a.ang,k:a.sub/ch,locked:a.sub>=ch*.6,w};R.pose={name:'s5',i:a.sub<ch*.35?0:a.sub<ch*.7?1:2};
  if(a.sub>=ch){a.phase='fire';a.sub=0;a.hit=new Set();R.cannon=null;
   const o={x:A.x+Math.cos(a.ang)*24,y:A.y-4+Math.sin(a.ang)*24},e=rayEnd(o.x,o.y,a.ang,P.len||760);
   R.beam={x:o.x,y:o.y,ex:o.x+Math.cos(a.ang)*e.len,ey:o.y+Math.sin(a.ang)*e.len,a:a.ang,t:0,dur:fd,w};
   combatImpact(1.6);combatSound('crit',1.3);R.def.mech?.onCast?.(R,A,'beam')}
  return false;
 }
 if(a.phase==='fire'){
  R.pose={name:'s5',i:a.sub<.2?3:4};R.glow=1;const B=R.beam;
  if(B)for(const t of foes(A))if(!a.hit.has(t)&&lineDistance(t.x,t.y,B.x,B.y,B.ex,B.ey)<B.w/2+t.r*.6){a.hit.add(t);bossHit(R,t,P.dmg,50,a.ang,{breakGuard:true})}
  if(a.sub>=fd){R.beam=null;if(a.shot+1<a.shots){a.shot++;a.phase='charge';a.sub=0}else{a.phase='rest';a.sub=0}}
  return false;
 }
 R.pose={name:'s5',i:4};
 return a.sub>=.5;
};
// marca que prende quem ficar no círculo
K.mark=(dt,A,R,T,a,P)=>{
 if(!a.init){a.init=1;a.caught=false;
  for(const f of foes(A)){const tl={kind:'psy',x:f.x,y:f.y,r:P.r||76,dur:P.delay||.95,followUntil:P.follow??.45,follow:f,color:col(R).b,target:f};
   tl.onDone=t=>{const v=t.target;if(v.hp>0&&dist(v,t)<t.r+v.r){a.caught=true;v.root=Math.max(v.root||0,P.root||1.3);bossHit(R,v,P.dmg||60,0,ang(A,v));float(v.x,v.y-50,P.label||'PRESO','#ffd0ee');ring(v.x,v.y,60,col(R).b,.45)}};
   R.tele.push(Object.assign({t:0},tl))}}
 R.pose={name:'s3',i:a.t<.35?0:a.t<.95?1:2};R.glow=Math.max(R.glow,.6);
 if(a.t<.95){A.a=ang(A,T);R.face=A.a}
 if(a.t>=(P.delay||.95)+.1&&!a.dec){a.dec=1;if(a.caught&&P.then)R.next=P.then}
 return a.t>=(P.delay||.95)+.35;
};
// vórtice: puxa e fere
K.pull=(dt,A,R,T,a,P)=>{
 const w=P.wind??.6,dur=P.dur||2.2;
 if(!a.init){a.init=1;a.acc=0;addTele(R,{kind:'circle',follow:A,r:P.r,dur:w+dur,color:col(R).a})}
 R.pose={name:'s2',i:a.t<w?0:1};R.glow=Math.max(R.glow,.8);
 if(a.t>=w&&a.t<w+dur){
  for(const t of foes(A)){const d=dist(A,t);if(d<P.r+t.r&&d>34){const n=Math.atan2(A.y-t.y,A.x-t.x),f=(P.force||120)*dt;move(t,Math.cos(n)*f,Math.sin(n)*f)}}
  a.acc+=dt;if(a.acc>=(P.tick||.5)){a.acc=0;for(const t of foes(A))if(dist(A,t)<P.r*.55+t.r)bossHit(R,t,P.dmg,0,ang(A,t))}
  if(Math.random()<.4)spark(A.x+(Math.random()-.5)*P.r,A.y+(Math.random()-.5)*P.r,col(R).a,1);
 }
 if(!a.slam&&a.t>=w+dur){a.slam=1;if(P.slam)shock(R,P.slam.r,P.slam.dmg,P.slam.knock??70)}
 return a.t>=w+dur+.5;
};
// teleporte atrás do alvo + golpe
K.blink=(dt,A,R,T,a,P)=>{
 const hops=(P.hops||1)+(R.phase===2?(P.hops2||0):0);
 if(!a.init){a.init=1;a.h=0;a.sub=0;a.phase='wind';A.a=ang(A,T)}
 a.sub+=dt;
 if(a.phase==='wind'){R.pose={name:'s1',i:a.sub<.18?0:1};R.glow=Math.max(R.glow,.6);
  if(a.sub>=(P.wind??.4)){
   R.ghosts.push({x:A.x,y:A.y,face:R.face,life:.3,max:.3});
   const back=ang(T,A)+Math.PI,dx=Math.cos(back+Math.PI)*0,nx=T.x+Math.cos(ang(A,T))*(52),ny=T.y+Math.sin(ang(A,T))*(52);
   const fx=clamp(nx,70,W-70),fy=clamp(ny,70,H-70);
   if(!blocked(fx,fy,A.r)){A.x=fx;A.y=fy}
   A.a=ang(A,T);R.face=A.a;spark(A.x,A.y,col(R).a,12);ring(A.x,A.y,36,col(R).b,.3);
   a.phase='strike';a.sub=0;R.strikeFx=.2}
  return false}
 if(a.phase==='strike'){R.pose={name:'punch',i:a.sub<.1?2:3,side:0};
  if(!a.did&&a.sub>=(P.hit??.18)){a.did=1;ring(A.x,A.y,P.r||80,col(R).b,.35);combatSound('heavy',1.1);
   for(const t of foes(A))if(dist(A,t)<(P.r||80)+t.r)bossHit(R,t,P.dmg,P.knock||80,ang(A,t));R.def.mech?.onCast?.(R,A,'blink')}
  if(a.sub>=.42){a.h++;if(a.h<hops){a.phase='wind';a.sub=0;a.did=0}else a.phase='rest',a.sub=0}
  return false}
 return a.sub>=.4;
};
// zonas que causam dano contínuo
K.zone=(dt,A,R,T,a,P)=>{
 if(!a.init){a.init=1;
  const n=(P.n||3)+(R.phase===2?(P.n2||0):0),list=foes(A);
  for(let i=0;i<n;i++){let x,y;
   if(P.aim==='foes'&&list.length){const f=list[i%list.length];x=f.x+(i>=list.length?(Math.random()-.5)*120:0);y=f.y+(i>=list.length?(Math.random()-.5)*120:0)}
   else{const o=Math.random()*TAU,d=100+Math.random()*220;x=A.x+Math.cos(o)*d;y=A.y+Math.sin(o)*d*.7}
   x=clamp(x,70,W-70);y=clamp(y,70,H-70);
   addZone(R,{x,y,r:P.r||70,delay:P.delay||.9,dur:P.dur||4,tick:P.tick||.45,dmg:P.dmg||18,kind:P.vis||'zone'})}
  combatSound('hit',1)}
 R.pose={name:'s3',i:a.t<.3?0:a.t<.6?1:2};R.glow=Math.max(R.glow,.5);
 return a.t>=.9;
};
// fortalecimento próprio
K.buff=(dt,A,R,T,a,P)=>{
 if(!a.init){a.init=1;A.inv=Math.max(A.inv,.9);addTele(R,{kind:'circle',follow:A,r:P.r||120,dur:.55,color:col(R).a})}
 R.pose={name:'s4',i:Math.min(2,Math.floor(a.t/.35))};R.glow=1;
 if(!a.f&&a.t>=.55){a.f=1;R.buff={t:P.dur||8,spd:P.spd||1.25,dmg:P.dmg||1.2};if(P.shield)R.shield=(R.shield||0)+P.shield;if(P.heal)A.hp=Math.min(A.max,A.hp+A.max*P.heal);
  ring(A.x,A.y,P.r||120,'#fff',.6);ring(A.x,A.y,(P.r||120)*.7,col(R).b,.5);spark(A.x,A.y,col(R).b,26);combatImpact(1.6);combatSound('crit',1.3);
  for(const t of foes(A)){const d=dist(A,t);if(d<(P.r||120)+t.r)bossHit(R,t,20,90,ang(A,t))}
  float(A.x,A.y-85,(P.label||'FORTALECIDO').toUpperCase(),'#ffe9a8');R.def.mech?.onCast?.(R,A,'buff')}
 return a.t>=1.15;
};
// clones suicidas
K.clones=(dt,A,R,T,a,P)=>{
 if(!a.init){a.init=1;const n=(P.n||3)+(R.phase===2?(P.n2||0):0);
  for(let i=0;i<n;i++){const o=i/n*TAU+Math.random();R.decoys.push({x:A.x+Math.cos(o)*40,y:A.y+Math.sin(o)*30,t:0,life:P.life||4,speed:P.speed||150,dmg:P.dmg||70,r:P.r||64,face:R.face,real:false})}
  ring(A.x,A.y,60,col(R).a,.4);spark(A.x,A.y,col(R).b,16);combatSound('hit',1)}
 R.pose={name:'s4',i:Math.min(2,Math.floor(a.t/.3))};R.glow=Math.max(R.glow,.7);
 return a.t>=.9;
};
// esfera gigante interrompível
K.nova=(dt,A,R,T,a,P)=>{
 const ch=P.charge||3,NR=P.r||300;
 if(!a.init){a.init=1;a.hp0=A.hp;R.nova={x:T.x,y:T.y,r:NR,k:0,locked:false,sphere:6,fall:0};toast((P.label||'Ataque supremo')+'! Cause muito dano para interromper ou saia da área.')}
 const N=R.nova;
 if(!a.throw){
  if(a.t<ch*.65){const dx=T.x-N.x,dy=T.y-N.y,d=Math.hypot(dx,dy)||1,sp=Math.min(d,120*dt);N.x+=dx/d*sp;N.y+=dy/d*sp}
  N.locked=a.t>=ch*.65;N.k=a.t/ch;N.sphere=6+N.k*40;
  R.pose={name:'s3',i:a.t<.5?0:a.t<ch-.4?1:2};A.a=ang(A,T);R.face=A.a;R.glow=Math.max(R.glow,.5+.5*N.k);
  if(a.hp0-A.hp>=(P.interrupt||420)){
   R.nova=null;R.exh=3.2;A.hp=Math.max(1,A.hp-150);
   ring(A.x,A.y,130,'#fff',.6);ring(A.x,A.y,80,col(R).b,.5);spark(A.x,A.y,col(R).b,30);combatImpact(2);combatSound('crit',1.4);
   for(const t of foes(A))if(dist(A,t)<130+t.r)bossHit(R,t,90,70,ang(A,t));
   float(A.x,A.y-85,'INTERROMPIDO!','#ffd0ee');toast('Ataque interrompido! '+R.def.name+' está atordoado — ataque!');return true}
  if(a.t>=ch){a.throw=1;a.t2=0}
  return false;
 }
 a.t2+=dt;R.pose={name:'s5',i:3};if(N){N.sphere=46;N.fall=clamp(a.t2/.55,0,1)}
 if(!a.hit&&a.t2>=.55&&N){a.hit=1;
  ring(N.x,N.y,NR,'#fff',.9);ring(N.x,N.y,NR*.7,col(R).b,.8);ring(N.x,N.y,NR*.4,col(R).a,.7);spark(N.x,N.y,col(R).b,46);combatImpact(2.2);combatSound('crit',1.6);
  for(const t of foes(A)){const d=dist(t,N);if(d<NR+t.r)bossHit(R,t,P.dmg||330,140,Math.atan2(t.y-N.y,t.x-N.x),{breakGuard:true})}
  R.nova=null;R.def.mech?.onCast?.(R,A,'nova')}
 return a.t2>=1.1;
};
// domínio: zona enorme que fere e desacelera; quebra com dano suficiente no chefe
K.domain=(dt,A,R,T,a,P)=>{
 if(!a.init){a.init=1;addZone(R,{x:A.x,y:A.y,r:P.r||300,delay:P.wind||1.2,dur:P.dur||6,tick:.5,dmg:P.dmg||30,kind:'domain',slow:.55,domain:true,follow:A});
  R.domainDmg=0;R.domainBreak=P.break||360;toast('Domínio! Cause '+R.domainBreak+' de dano ao chefe para quebrá-lo, ou saia da área.')}
 R.pose={name:'s2',i:a.t<.6?0:1};R.glow=Math.max(R.glow,.9);
 return a.t>=(P.wind||1.2)+.8;
};
// orbes que giram e depois perseguem
K.orbit=(dt,A,R,T,a,P)=>{
 if(!a.init){a.init=1;const n=(P.n||4)+(R.phase===2?(P.n2||0):0);R.wisps=R.wisps||[];
  for(let i=0;i<n;i++)R.wisps.push({a0:i/n*TAU,r:50+(i%2)*14,age:0,hold:P.hold||1.6,launched:false,dmg:P.dmg||48,speed:P.speed||300,homing:P.homing||2.4})}
 R.pose={name:'s3',i:a.t<.3?0:a.t<.6?1:2};R.glow=Math.max(R.glow,.6);
 return a.t>=(P.hold||1.6)+.4;
};

/* ============================== IA ============================== */
const skillOf=(def,id)=>def.skills.find(s=>s.id===id);
function startAct(R,id,extra){R.act=Object.assign({id,t:0},extra);R.rest=0}
function runAct(dt,A,R,T){
 const act=R.act;act.t+=dt;
 if(act.id==='basic')return K.combo(dt,A,R,T,act,R.def.basic||{hits:3});
 if(act.id==='fury')return furyAct(dt,A,R,T,act);
 const s=skillOf(R.def,act.id);return K[s.k.kind](dt,A,R,T,act,s.k);
}
function furyAct(dt,A,R,T,a){
 if(!a.init){a.init=1;A.inv=Math.max(A.inv,1.5);addTele(R,{kind:'circle',follow:A,r:160,dur:.7,color:col(R).a})}
 R.pose={name:'s4',i:Math.min(2,Math.floor(a.t/.3))};R.glow=1;
 if(!a.f&&a.t>=.7){a.f=1;shock(R,160,50,110);float(A.x,A.y-90,'FÚRIA','#ff9ac4');toast(R.def.name+' se enfurece! Fase 2');R.def.mech?.fury?.(R,A)}
 return a.t>=1.3;
}
function bossMove(A,R,angle,speed,dt){A.a=angle;R.face=angle;A.moving=true;R.walk+=dt*speed/16;move(A,Math.cos(angle)*speed*dt,Math.sin(angle)*speed*dt)}
function aiTick(dt,A){
 const R=A.gb,def=R.def;A.moving=false;
 if(R.dying||state!=='fight')return;
 const T=pickTarget(R,A);if(!T)return;
 const d=dist(A,T),toT=ang(A,T),ph=R.phase===2?1:0;
 if(A.root>0&&A.guardBreak<=0)A.root=Math.min(A.root,.22);
 A.slow=Math.min(A.slow,.6);
 if(!R.intro){R.intro=true;toast(def.name.toUpperCase()+' · '+def.title);float(A.x,A.y-85,def.name.toUpperCase(),'#e6baff')}
 if(R.act){
  if(runAct(dt,A,R,T)){const was=R.act.id;R.act=null;R.pose=null;R.glow=0;
   R.rest=[.7,.45][ph]+Math.random()*[.4,.3][ph]+(def.skills.find(s=>s.id===was)?.k.rec2||0);R.def.mech?.onActEnd?.(R,A,was)}
  return;
 }
 if(A.root>0||A.guardBreak>0||R.exh>0||A.dodgeTime>0||(def.mech?.stunned?.(R))){setGuard(A,false);return}
 const speed=(def.speed||118)*(R.buff?R.buff.spd:1)*(ph?1.08:1)*(A.slow>0?.6:1);
 if(A.guard){R.guardT-=dt;A.a=aim(A);R.face=A.a;if(R.guardT<=0||A.st<10){setGuard(A,false);R.guardCD=2}return}
 const threat=T.cast>0||T.rwCast||T.punchTime>0||(T.guard===false&&T.basic>0);
 if(R.dodgeCD<=0&&threat&&d<300&&Math.random()<dt*(def.dodge??1)){const side=Math.random()<.5?1:-1;A.dodgeTime=.2;A.dodgeA=toT+side*Math.PI/2;A.inv=Math.max(A.inv,.22);R.dodgeCD=3.2;R.face=toT;return}
 if(R.guardCD<=0&&threat&&d<130&&A.st>35&&Math.random()<dt*2){if(setGuard(A,true)){R.guardT=.5+Math.random()*.6;return}}
 if(R.rest<=0){
  if(R.next){const id=R.next;R.next=null;const s=skillOf(def,id);if(s){R.cds[id]=Math.max(R.cds[id],s.cd*.6);startAct(R,id,{});return}}
  const opts=[];
  for(const s of def.skills){const ai=s.ai||{};
   if(R.cds[s.id]>0||(ai.phase&&R.phase<ai.phase))continue;
   if(d<(ai.min??0)||d>(ai.max??9999))continue;
   if(s.cond&&!s.cond(R,A,T,d))continue;
   opts.push([s.id,ai.w??3]);}
  if(d<96+T.r)opts.push(['basic',4.5]);
  if(opts.length){let sum=opts.reduce((x,o)=>x+o[1],0),r=Math.random()*sum,pick=opts[0][0];for(const[id,w]of opts){r-=w;if(r<=0){pick=id;break}}
   const s=skillOf(def,pick);if(s)R.cds[pick]=s.cd*(ph?.85:1);
   startAct(R,pick,{});return}
 }
 R.strafeT-=dt;if(R.strafeT<=0){R.strafe=Math.random()<.5?1:-1;R.strafeT=1.4+Math.random()*2}
 A.a=toT;R.face=toT;const pref=def.pref||190;
 if(d>pref+70)bossMove(A,R,toT,speed,dt);
 else if(d<pref-60&&R.rest>0)bossMove(A,R,toT+Math.PI,speed*.75,dt);
 else if(d>pref-20)bossMove(A,R,toT+R.strafe*(Math.PI/2.7),speed*.8,dt);
 else if(R.rest<=.15)bossMove(A,R,toT,speed*.8,dt);
}
const prevGuardianAI=guardianAI;
guardianAI=function(dt,a){if(a.gb)aiTick(dt,a);else prevGuardianAI(dt,a)};

/* ============================== preparação ============================== */
const prevPrepare=prepareArenaMode;
prepareArenaMode=function(){
 prevPrepare();
 if(arenaModeId!=='guardian'||!modeRun)return;
 const def=HuntAPI.bossOfDay();if(!def.generic)return;
 const A=b;
 modeRun.gb=A.gb={def,a:A,solo:HuntAPI.loadSave().team==='solo',phase:1,act:null,next:null,rest:1.6,guardT:0,guardCD:0,dodgeCD:0,strafe:1,strafeT:2,walk:0,face:Math.PI,
  cds:{},tele:[],proj:[],zones:[],decoys:[],wisps:[],beam:null,cannon:null,nova:null,ghosts:[],pose:null,dying:0,landed:0,glow:0,exh:0,buff:null,shield:0,
  aggro:0,aggroT:0,intro:false,mech:{}};
 const R=A.gb;def.skills.forEach((s,i)=>{R.cds[s.id]=s.cd*(.25+.12*i)});
 A.huntBoss=true;
 def.mech?.init?.(R,A);
};

/* ============================== passo da arena ============================== */
const prevStepMode=stepArenaMode;
stepArenaMode=function(dt){
 const R=hunt();if(!R)return prevStepMode(dt);
 const A=R.a,def=R.def;modeRun.elapsed+=dt;
 const rate=R.phase===2?1.2:1;
 for(const k of Object.keys(R.cds))if(R.cds[k]>0)R.cds[k]-=dt*rate;
 R.rest=Math.max(-1,R.rest-dt);R.guardCD-=dt;R.dodgeCD-=dt;R.glow=Math.max(0,R.glow-dt*2.2);
 if(R.exh>0)R.exh=Math.max(0,R.exh-dt);
 if(R.buff){R.buff.t-=dt;if(R.buff.t<=0)R.buff=null}
 if(A.hp>0){
  if(R.phase===1&&A.hp<A.max*.5){R.phase=2;R.tele=[];R.beam=null;R.cannon=null;R.nova=null;setGuard(A,false);startAct(R,'fury',{})}
  def.mech?.tick?.(R,A,dt);
 }
 for(const t of R.tele){t.t+=dt;if(t.follow&&(!t.followUntil||t.t<t.followUntil)){t.x=t.follow.x;t.y=t.follow.y}}
 const done=R.tele.filter(t=>t.t>=t.dur);R.tele=R.tele.filter(t=>t.t<t.dur);for(const t of done)t.onDone?.(t);
 // projéteis
 for(const o of R.proj){
  o.t+=dt;o.life-=dt;
  if(o.homing){const ts=foes(A);if(ts.length){const t=ts.sort((x,y)=>dist(o,x)-dist(o,y))[0],want=Math.atan2(t.y-o.y,t.x-o.x),cur=Math.atan2(o.vy,o.vx),df=wrap(want-cur),nw=cur+clamp(df,-o.homing*dt,o.homing*dt),sp=Math.hypot(o.vx,o.vy);o.vx=Math.cos(nw)*sp;o.vy=Math.sin(nw)*sp}}
  const steps=Math.ceil(Math.hypot(o.vx,o.vy)*dt/8)||1;
  for(let i=0;i<steps&&o.life>0;i++){
   o.x+=o.vx*dt/steps;o.y+=o.vy*dt/steps;
   if(blocked(o.x,o.y,o.r*.4)&&!o.pierce){o.life=0;spark(o.x,o.y,o.color,6);break}
   for(const t of foes(A))if(!o.hits.has(t)&&dist(t,o)<t.r+o.r&&t.inv<=0){o.hits.add(t);bossHit(R,t,o.dmg,o.knock,Math.atan2(o.vy,o.vx));if(!o.pierce){o.life=0;spark(o.x,o.y,o.color2,8);break}}
  }
 }
 R.proj=R.proj.filter(o=>o.life>0);
 // zonas
 for(const z of R.zones){
  z.t+=dt;
  if(z.follow){z.x=z.follow.x;z.y=z.follow.y}
  if(z.t>=z.delay&&z.t<z.delay+z.dur){z.acc+=dt;while(z.acc>=z.tick){z.acc-=z.tick;for(const t of foes(A))if(dist(t,z)<z.r+t.r*.5)bossHit(R,t,z.dmg,0,ang(z,t),{zone:true})}
  if(z.slow)for(const t of foes(A))if(dist(t,z)<z.r+t.r*.5)t.slow=Math.max(t.slow,z.slow)}
 }
 R.zones=R.zones.filter(z=>z.t<z.delay+z.dur);
 // clones
 for(const c of R.decoys){
  c.t+=dt;const ts=foes(A);if(!ts.length){c.dead=true;continue}
  const t=ts.sort((x,y)=>dist(c,x)-dist(c,y))[0],an=ang(c,t);c.face=an;
  const nx=c.x+Math.cos(an)*c.speed*dt,ny=c.y+Math.sin(an)*c.speed*dt;if(!blocked(nx,ny,10)){c.x=nx;c.y=ny}
  if(dist(c,t)<30||c.t>=c.life){c.dead=true;ring(c.x,c.y,c.r,col(R).b,.4);spark(c.x,c.y,col(R).a,14);combatSound('heavy',.9);
   for(const f of foes(A))if(dist(c,f)<c.r+f.r)bossHit(R,f,c.dmg,60,ang(c,f))}
 }
 R.decoys=R.decoys.filter(c=>!c.dead);
 // orbes
 if(R.wisps)for(const w of R.wisps){w.age+=dt;
  if(!w.launched&&w.age>=w.hold){w.launched=true;const ts=foes(A);if(ts.length){const t=ts[Math.floor(Math.random()*ts.length)],ax=A.x+Math.cos(w.a0+w.age*2.2)*w.r,ay=A.y-20+Math.sin(w.a0+w.age*2.2)*w.r*.6,an=Math.atan2(t.y-ay,t.x-ax);R.proj.push({x:ax,y:ay,vx:Math.cos(an)*w.speed,vy:Math.sin(an)*w.speed,r:10,dmg:w.dmg,life:3.2,t:0,color:col(R).a,color2:col(R).b,homing:w.homing,shape:'orb',pierce:false,hits:new Set(),knock:14})}w.done=true}}
 if(R.wisps)R.wisps=R.wisps.filter(w=>!w.done);
 if(R.beam){R.beam.t+=dt;if(R.beam.t>=R.beam.dur)R.beam=null}
 for(const g of R.ghosts)g.life-=dt;R.ghosts=R.ghosts.filter(g=>g.life>0);
 if(A.dodgeTime>0)R.ghosts.push({x:A.x,y:A.y,face:R.face,life:.2,max:.2});
 // aliado bot desvia dos avisos
 for(const ally of actors)if(ally.team===0&&ally!==p&&ally.hp>0&&ally.root<=0){
  for(const t of R.tele){if(t.kind==='line')continue;const d=dist(ally,t);if(d<t.r+30&&d>(t.r0||0)-20){const n=Math.atan2(ally.y-t.y,ally.x-t.x);move(ally,Math.cos(n)*170*dt,Math.sin(n)*170*dt)}}
  for(const z of R.zones){if(z.t<z.delay+z.dur&&dist(ally,z)<z.r+24){const n=Math.atan2(ally.y-z.y,ally.x-z.x);move(ally,Math.cos(n)*170*dt,Math.sin(n)*170*dt)}}
  const N=R.nova;if(N){const d=dist(ally,N);if(d<N.r+20){const n=Math.atan2(ally.y-N.y,ally.x-N.x);move(ally,Math.cos(n)*190*dt,Math.sin(n)*190*dt)}}
 }
 // fim
 if(A.hp<=0){
  if(!R.dying){R.dying=.001;R.tele=[];R.proj=[];R.zones=[];R.decoys=[];R.wisps=[];R.beam=null;R.cannon=null;R.nova=null;R.act=null;setGuard(A,false);
   ring(A.x,A.y,160,'#fff',.8);ring(A.x,A.y,100,col(R).b,.7);spark(A.x,A.y,col(R).a,40);combatImpact(2);toast(def.name+' foi derrotado!')}
  R.dying+=dt;if(R.dying>2.1)endArenaMode(true);
  return;
 }
 if(!actors.some(a=>a.team===0&&a.hp>0)||time<=0)endArenaMode(false);
};

/* dano recebido: atordoamento, escudo e mecânica própria */
const prevHit=hit;
hit=function(t,n,owner,knock=0,angle=0,id){
 const R=t?.huntBoss&&hunt();
 if(!R)return prevHit(t,n,owner,knock,angle,id);
 const m=R.def.mech;
 if(m?.immune?.(R))return false;
 if(R.act&&R.act.id==='fury'&&t.inv>0)return false;
 if(R.exh>0)n*=1.35;
 if(m?.modDamage)n=m.modDamage(R,n,id,owner);
 if(R.shield>0){const ab=Math.min(R.shield,n);R.shield-=ab;n-=ab;float(t.x,t.y-52,'ESCUDO '+Math.round(ab),'#cfe0ff');if(n<=0)return true}
 const before=t.hp,ok=prevHit(t,n,owner,knock*.25,angle,id);
 if(ok){m?.onHurt?.(R,before-t.hp,id,owner);
  if(R.zones.some(z=>z.domain&&z.t>=z.delay)){R.domainDmg=(R.domainDmg||0)+(before-t.hp);
   if(R.domainDmg>=(R.domainBreak||360)){R.zones=R.zones.filter(z=>!z.domain);R.exh=Math.max(R.exh,2.4);ring(t.x,t.y,120,'#fff',.6);float(t.x,t.y-85,'DOMÍNIO QUEBRADO','#ffd0ee');toast('Domínio quebrado! '+R.def.name+' está atordoado.')}}}
 return ok;
};

/* ============================== desenho ============================== */
function poseOf(a,R){
 if(a.hp<=0)return{name:'dead',i:0};
 if(R.exh>0||a.guardBreak>0)return{name:'tired',i:Math.floor(clock*3)%2};
 if(a.dodgeTime>0)return{name:'dodge',i:0};
 if(R.act&&R.pose)return R.pose;
 if(a.hitReact>0)return{name:'hit',i:a.hitReact>.08?0:1};
 if(a.guard)return{name:'guard',i:a.blockFlash>0?1:0};
 if(a.moving)return{name:'walk',i:Math.floor(R.walk)%6};
 return{name:'idle',i:Math.floor(clock*4)%4};
}
function drawAura(c,strength){
 if(strength<=.02)return;
 ctx.save();ctx.globalCompositeOperation='lighter';
 const g=ctx.createRadialGradient(0,-26,4,0,-26,70);g.addColorStop(0,c.b+Math.round(120*strength).toString(16).padStart(2,'0'));g.addColorStop(.55,c.a+Math.round(76*strength).toString(16).padStart(2,'0'));g.addColorStop(1,c.a+'00');
 ctx.fillStyle=g;ctx.fillRect(-80,-100,160,140);
 for(let i=0;i<12;i++){const k=(clock*(.8+(i%4)*.12)+i/12)%1,x=Math.sin(i*6.1+clock*2.2)*(20+k*8),y=8-k*86,s=Math.max(2,Math.round(7*(1-k)));
  ctx.globalAlpha=(1-k)*Math.min(1,strength+.2);ctx.fillStyle=i%3?c.a:c.b;ctx.fillRect(Math.round(x),Math.round(y),s,s)}
 ctx.restore();
}
function drawBoss(a){
 const R=a.gb,def=R.def,pose=poseOf(a,R),c=col(R),m=def.mech;
 ctx.save();ctx.translate(a.x,a.y);
 ctx.fillStyle='#06100c99';ctx.beginPath();ctx.ellipse(0,12,27,9,0,0,TAU);ctx.fill();
 if(R.exh>0){ctx.strokeStyle='#ffd0ee';ctx.globalAlpha=.5+.4*Math.sin(clock*12);ctx.beginPath();ctx.ellipse(0,12,34,12,0,0,TAU);ctx.stroke();ctx.globalAlpha=1}
 drawAura(c,Math.max(R.glow,R.buff?1:0,m?.aura?.(R)||0,R.phase===2?.18:0));
 ctx.translate(0,10);
 const al=m?.alpha?.(R)??1;
 if(a.inv>0&&!R.act&&al>=1)ctx.globalAlpha=.55+Math.sin(clock*40)*.2;
 const f=a.flash>0?'brightness(2.1) saturate(.5)':R.exh>0?'saturate(.65) brightness(.92)':'';
 BossSprite.paint(ctx,def.look,pose.name,pose.i,{x:0,y:0,scale:2.3,flip:Math.cos(R.face)<0,side:pose.side||0,filter:f,alpha:al});
 ctx.restore();
 // medidor sobre a cabeça
 const meter=m?.hud?.(R);
 ctx.save();ctx.translate(a.x,a.y-92);
 ctx.fillStyle='#10061be0';ctx.fillRect(-26,0,52,6);
 ctx.fillStyle=R.exh>0?'#6a6a8a':(meter?.color||c.a);ctx.fillRect(-25,1,50*clamp(meter?.meter??0,0,1),4);
 ctx.strokeStyle='#e8c787aa';ctx.lineWidth=1;ctx.strokeRect(-26.5,-.5,53,7);
 ctx.restore();
}
const prevDrawGuardian=drawGuardian;
drawGuardian=function(a){if(a.gb)drawBoss(a);else prevDrawGuardian(a)};

function drawTele(R,t){
 const k=clamp(t.t/t.dur,0,1),pulse=.5+.5*Math.sin(clock*18);
 ctx.save();
 if(t.kind==='line'){
  ctx.translate(t.x,t.y);ctx.rotate(t.a);
  ctx.fillStyle=t.color+'22';ctx.fillRect(0,-t.w/2,t.len,t.w);ctx.fillStyle=t.color+'44';ctx.fillRect(0,-t.w/2,t.len*k,t.w);
  ctx.strokeStyle=t.color;ctx.globalAlpha=.55+.4*pulse;ctx.lineWidth=2;ctx.strokeRect(0,-t.w/2,t.len,t.w);
 }else{
  ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,TAU);if(t.r0)ctx.arc(t.x,t.y,t.r0,0,TAU,true);
  ctx.fillStyle=t.color+(t.kind==='meteor'||t.kind==='psy'?'28':'1c');ctx.fill('evenodd');
  ctx.globalAlpha=.5+.4*pulse;ctx.strokeStyle=t.color;ctx.lineWidth=3;ctx.setLineDash([10,7]);ctx.lineDashOffset=-clock*40;ctx.stroke();ctx.setLineDash([]);
  ctx.globalAlpha=.3;ctx.fillStyle=t.color;ctx.beginPath();ctx.arc(t.x,t.y,Math.max(0,t.r*k),0,TAU);if(t.r0)ctx.arc(t.x,t.y,Math.max(0,Math.min(t.r0,t.r*k)),0,TAU,true);ctx.fill('evenodd');
  if(t.kind==='meteor'||t.kind==='psy'){ctx.globalAlpha=.9;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(t.x-8,t.y);ctx.lineTo(t.x+8,t.y);ctx.moveTo(t.x,t.y-8);ctx.lineTo(t.x,t.y+8);ctx.stroke()}
 }
 ctx.restore();
}
function drawZone(R,z){
 const c=col(R);ctx.save();
 if(z.t<z.delay){const k=z.t/z.delay;ctx.globalAlpha=.55+.3*Math.sin(clock*16);ctx.strokeStyle=c.b;ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.18;ctx.fillStyle=c.a;ctx.beginPath();ctx.arc(z.x,z.y,z.r*k,0,TAU);ctx.fill()}
 else{
  const left=z.delay+z.dur-z.t,fade=clamp(left/.6,0,1);ctx.globalAlpha=.28*fade;ctx.fillStyle=z.color;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();
  ctx.globalAlpha=.7*fade;ctx.strokeStyle=z.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.stroke();
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<7;i++){const k=(clock*.9+i/7+z.x*.01)%1,x=z.x+Math.sin(i*5.7+z.y)*z.r*.7,y=z.y+z.r*.4-k*z.r*1.1;ctx.globalAlpha=(1-k)*.8*fade;ctx.fillStyle=i%2?c.a:c.b;const s=Math.max(2,Math.round(7*(1-k)));ctx.fillRect(Math.round(x),Math.round(y),s,s)}
 }
 ctx.restore();
}
const prevWorld=drawModeWorld;
drawModeWorld=function(){
 prevWorld();
 const R=hunt();if(!R)return;
 for(const z of R.zones)drawZone(R,z);
 for(const t of R.tele)drawTele(R,t);
 const N=R.nova;
 if(N){const c=col(R);ctx.save();ctx.beginPath();ctx.arc(N.x,N.y,N.r,0,TAU);ctx.fillStyle=c.b+(N.locked?'2a':'16');ctx.fill();
  ctx.globalAlpha=.55+.45*Math.sin(clock*(N.locked?26:12));ctx.strokeStyle=N.locked?'#fff':c.b;ctx.lineWidth=N.locked?4:3;ctx.setLineDash([14,8]);ctx.lineDashOffset=-clock*60;ctx.stroke();ctx.setLineDash([]);
  ctx.globalAlpha=.28;ctx.fillStyle=c.b;ctx.beginPath();ctx.arc(N.x,N.y,N.r*N.k,0,TAU);ctx.fill();ctx.restore()}
 const cn=R.cannon;
 if(cn&&R.a.hp>0){const A=R.a,o={x:A.x+Math.cos(cn.a)*24,y:A.y-4+Math.sin(cn.a)*24},e=rayEnd(o.x,o.y,cn.a),w=cn.w,c=col(R);
  ctx.save();ctx.translate(o.x,o.y);ctx.rotate(cn.a);ctx.fillStyle=c.b+(cn.locked?'40':'22');ctx.fillRect(0,-w/2,e.len,w);
  ctx.globalAlpha=.6+.4*Math.sin(clock*(cn.locked?32:14));ctx.strokeStyle=cn.locked?'#fff':c.b;ctx.lineWidth=cn.locked?3:2;ctx.strokeRect(0,-w/2,e.len,w);ctx.restore()}
 R.def.mech?.drawWorld?.(R,R.a);
};
function paintProj(R,o){
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let i=1;i<=5;i++){ctx.globalAlpha=.1*(6-i);ctx.fillStyle=o.color;ctx.beginPath();ctx.arc(o.x-o.vx*.012*i,o.y-o.vy*.012*i,o.r*(.8+i*.35)*.6,0,TAU);ctx.fill()}
 ctx.globalAlpha=1;
 if(o.shape==='blade'){ctx.translate(o.x,o.y);ctx.rotate(Math.atan2(o.vy,o.vx));ctx.fillStyle=o.color;ctx.fillRect(-o.r*1.4,-3,o.r*2.8,6);ctx.fillStyle=o.color2;ctx.fillRect(-o.r*1.1,-1.5,o.r*2.2,3);ctx.fillStyle='#fff';ctx.fillRect(-o.r*.6,-.7,o.r*1.4,1.4)}
 else{ctx.fillStyle=o.color;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,TAU);ctx.fill();ctx.fillStyle=o.color2;ctx.beginPath();ctx.arc(o.x,o.y,o.r*.66,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(o.x,o.y,o.r*.32,0,TAU);ctx.fill()}
 ctx.restore();
}
function paintBeam(R,B){
 const c=col(R),k=B.t/B.dur,fade=k>.6?1-(k-.6)/.4:1,fl=.85+Math.random()*.3,len=Math.hypot(B.ex-B.x,B.ey-B.y);
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(B.x,B.y);ctx.rotate(B.a);
 for(const[mm,cc,al]of[[1,c.a,.5],[.66,c.a,.7],[.4,c.b,.9],[.18,'#ffffff',1]]){ctx.globalAlpha=al*fade;ctx.fillStyle=cc;const w=B.w*mm*fl;ctx.fillRect(0,-w/2,len,w)}
 ctx.restore();
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade*.8;const g=ctx.createRadialGradient(B.ex,B.ey,2,B.ex,B.ey,B.w*.9);g.addColorStop(0,'#fff');g.addColorStop(.4,c.b);g.addColorStop(1,c.a+'00');ctx.fillStyle=g;ctx.fillRect(B.ex-B.w,B.ey-B.w,B.w*2,B.w*2);ctx.restore();
}
function paintNova(R){
 const N=R.nova,A=R.a,c=col(R);if(!N)return;
 const sx=A.x,sy=A.y-78,x=sx+(N.x-sx)*N.fall,y=sy+(N.y-sy)*N.fall,rr=N.sphere*(1+.04*Math.sin(clock*30));
 ctx.save();ctx.globalCompositeOperation='lighter';
 const g=ctx.createRadialGradient(x,y,2,x,y,rr*1.7);g.addColorStop(0,'#fff');g.addColorStop(.3,c.b);g.addColorStop(.6,c.a);g.addColorStop(1,c.a+'00');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,rr*1.7,0,TAU);ctx.fill();ctx.globalAlpha=.9;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,rr*.45,0,TAU);ctx.fill();
 for(let i=0;i<10;i++){const q=clock*3+i*.63,rad=rr*(1.1+.4*Math.sin(clock*5+i));ctx.globalAlpha=.7;ctx.fillStyle=i%2?c.a:c.b;ctx.fillRect(x+Math.cos(q)*rad-2,y+Math.sin(q)*rad-2,4,4)}
 ctx.restore();
}
function paintWisp(R,w){
 const A=R.a,c=col(R),an=w.a0+w.age*2.2,x=A.x+Math.cos(an)*w.r,y=A.y-20+Math.sin(an)*w.r*.6,pre=clamp(w.age/w.hold,0,1);
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=c.a;ctx.beginPath();ctx.arc(x,y,9+pre*3,0,TAU);ctx.fill();ctx.fillStyle=c.b;ctx.beginPath();ctx.arc(x,y,6,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,3,0,TAU);ctx.fill();ctx.restore();
}
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth(),R=hunt();
 if(!R)return list;
 const def=R.def;
 for(const g of R.ghosts)list.push({kind:'boss-ghost',y:g.y-1,priority:0,paint(){ctx.save();ctx.translate(g.x,g.y+10);ctx.globalAlpha=g.life/g.max*.5;BossSprite.paint(ctx,def.look,'dodge',0,{scale:2.3,flip:Math.cos(g.face)<0,filter:'brightness(1.5)'});ctx.restore()}});
 for(const c of R.decoys)list.push({kind:'boss-decoy',y:c.y,priority:1,paint(){ctx.save();ctx.translate(c.x,c.y+10);ctx.globalAlpha=.7;BossSprite.paint(ctx,def.look,'walk',Math.floor(clock*10)%6,{scale:2.1,flip:Math.cos(c.face||0)<0,filter:'brightness(.8) saturate(.7)'});ctx.restore();ctx.save();ctx.globalAlpha=.4+.3*Math.sin(clock*20);ctx.strokeStyle=col(R).b;ctx.lineWidth=2;ctx.beginPath();ctx.arc(c.x,c.y,c.r*.5,0,TAU);ctx.stroke();ctx.restore()}});
 for(const o of R.proj)list.push({kind:'boss-proj',y:o.y,priority:3,paint(){paintProj(R,o)}});
 if(R.wisps)for(const w of R.wisps)list.push({kind:'boss-wisp',y:R.a.y,priority:3,paint(){paintWisp(R,w)}});
 if(R.nova)list.push({kind:'boss-nova',y:99997,priority:5,paint(){paintNova(R)}});
 if(R.beam){const B=R.beam;list.push({kind:'boss-beam',y:99999,priority:6,paint(){paintBeam(R,B)}})}
 def.mech?.depth?.(R,R.a,list);
 if(R.dying>0){const A=R.a,k=clamp(R.dying/2,0,1),c=col(R);list.push({kind:'boss-dying',y:A.y,priority:2,paint(){
  ctx.save();ctx.translate(A.x,A.y);ctx.fillStyle='#06100c99';ctx.beginPath();ctx.ellipse(0,12,27,9,0,0,TAU);ctx.fill();ctx.translate(0,10);
  ctx.globalAlpha=1-k*.85;BossSprite.paint(ctx,def.look,'dead',0,{scale:2.3,flip:Math.cos(R.face)<0,filter:'brightness('+(1+(1-k)*1.5)+')'});ctx.restore();
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(A.x,A.y);for(let i=0;i<14;i++){const u=(k*1.4+i/14)%1;ctx.globalAlpha=(1-u)*(1-k*.6);ctx.fillStyle=i%2?c.a:c.b;ctx.fillRect(Math.sin(i*4.1)*u*60,-u*90,5,5)}ctx.restore();
 }})}
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0));
};

/* ============================== HUD e resultado ============================== */
const prevUI=updateUI;
updateUI=function(){
 prevUI();
 const R=hunt();if(!R||!p)return;
 const A=R.a,def=R.def,m=def.mech?.hud?.(R)||{};
 const pt=document.querySelector('.fighterhud.enemy .arena-portrait'),bu=HuntAPI.bust(def);if(pt&&pt.src!==bu)pt.src=bu;
 $('.fighterhud.enemy .title b').textContent=def.name.toUpperCase()+' · '+def.title;
 const er=$('#enemyResource');if(er)er.textContent=(m.text||'')+(R.exh>0?' · ATORDOADO':'')+(R.phase===2?' · FÚRIA':'');
 const mb=$('#bmbar');if(mb){mb.parentElement.style.visibility='';mb.style.width=(100*clamp(m.meter??0,0,1))+'%';mb.style.background=R.exh>0?'#6a6a8a':(m.color||'linear-gradient(90deg,'+col(R).a+','+col(R).b+')')}
 const sb=$('#bsbar');if(sb)sb.style.width=A.st+'%';
};
const prevModeHUD=modeHUD;
modeHUD=function(){
 prevModeHUD();
 const R=hunt();if(!R)return;
 $('#modeObjective').hidden=true;
 const s=$('.mid-hud small');if(s)s.textContent='CAÇADA · FASE '+R.phase;
};
const prevEnd=endArenaMode;
endArenaMode=function(win,draw){
 const R=hunt(),first=R&&modeRun&&!modeRun.settled;
 prevEnd(win,draw);
 if(!R||!first)return;
 const def=R.def,id=def.id,save=HuntAPI.loadSave();
 const tail=$('#resultText').textContent.replace(/^[^·]*·\s*/,'');
 let extra='';
 if(win){
  const sec=modeRun.elapsed;save.wins[id]=(save.wins[id]||0)+1;
  const old=save.best[id];if(!old||sec<old){save.best[id]=Math.round(sec);extra=old?' Novo recorde de tempo!':' Primeiro recorde registrado.'}
  HuntAPI.writeSave(save);
  $('#resultTitle').textContent=def.name+' foi derrotado!';
  $('#resultText').textContent=`Caçada do Dia · ${def.name} · ${HuntAPI.mmss(sec)}.${extra} `+tail;
 }else{
  HuntAPI.writeSave(save);
  $('#resultTitle').textContent=(def.loseTitle||def.name+' prevaleceu.');
  $('#resultText').textContent=`${def.name} ainda tem ${Math.ceil(Math.max(0,R.a.hp))} de vida. ${def.loseTip||'Observe os avisos no chão e ataque quando ele ficar exposto.'} `+tail;
 }
 $('#change').textContent='Trocar campeão';
};

/* ganchos de teste */
if(window.huntQA){
 Object.defineProperty(huntQA,'gstate',{get(){return modeRun?.gb}});
 huntQA.forceG=id=>{const R=hunt();if(!R)return;R.act=null;R.tele=[];R.nova=null;R.cannon=null;R.rest=0;startAct(R,id,{})};
}
})();
