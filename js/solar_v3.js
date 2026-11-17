'use strict';
/*
 * Guardião Solar (herói 3) — pacote de jogabilidade v3: acumula o fogo e decide quando detonar.
 *  - BRASAS: cada golpe de fogo deixa uma brasa no rival (até 4, visíveis sobre a cabeça). Elas queimam com o tempo.
 *  - IGNIÇÃO: a Coluna Solar consome as brasas de quem atinge: +26 de dano por brasa. Detonar com 2 é seguro;
 *    esperar 4 é mais forte, mas as brasas somem se o rival ficar 4 s sem ser atingido.
 *  - RASTRO DO AMANHECER: o Passo do Amanhecer deixa um rastro de fogo por 3 s; quem pisa nele leva dano e uma brasa.
 * ?solar=0 desliga o pacote (para comparar).
 */
(function(){
if(!window.COMBAT_V3||!window.V3API||/[?&]solar=0/.test(location.search))return;
const {isHero}=V3API,H=3,KIT=CHAMPIONS[H].kit;
const MAX_EMBERS=4,IGNITE=20,TRAIL_T=3,TRAIL_W=22,TRAIL_DMG=9,TRAIL_TICK=.5;
const on=a=>!!a&&isHero(a)&&a.skin===H;
const isDot=()=>typeof originalDot!=='undefined'&&originalDot;
const burnOf=(t,o)=>OriginalCombat.burns.find(e=>e.target===t&&e.owner===o&&e.remaining>0);

{const f=(window.V3_DMG_MUL&&V3_DMG_MUL[H])||1,r=n=>String(Math.round(n*f));
 skills[KIT[2]].desc=`Marca o chão e, após 0,5s, ergue uma coluna de ${r(100)} de dano em raio 65. IGNIÇÃO: consome as brasas do alvo, +${r(IGNITE)} de dano por brasa (até 4).`;
 skills[KIT[3]].desc=`Avança até 260 atravessando o inimigo, causa ${r(80)} de dano e deixa um rastro de fogo por 3s: quem pisa leva ${r(TRAIL_DMG)} de dano a cada 0,5s e ganha uma brasa.`;
 for(const k of [2,3])skills[KIT[k]].v3scaled=true;
}

/* ---------- rastro de fogo do Passo do Amanhecer ---------- */
const TRAILS=[];
const prevRelease=rwRelease;
rwRelease=function(a,q){
 const r=prevRelease.apply(this,arguments);
 if(on(a)&&q.slot===3){
  const dash=Reforged.dashes.find(d=>d.owner===a&&!d.finished);
  const T={o:a,gen:Reforged.generation,pts:[{x:a.x,y:a.y}],t0:clock,until:clock+TRAIL_T+.4,tick:new Map()};TRAILS.push(T);
  if(dash){const prior=dash.onStep;dash.onStep=function(from){prior?.apply(this,arguments);const l=T.pts[T.pts.length-1];if(Math.hypot(a.x-l.x,a.y-l.y)>=14)T.pts.push({x:a.x,y:a.y})}}
 }
 return r;
};
function onTrail(T,t){for(let i=1;i<T.pts.length;i++)if(lineDistance(t.x,t.y,T.pts[i-1].x,T.pts[i-1].y,T.pts[i].x,T.pts[i].y)<TRAIL_W+t.r*.5)return true;return T.pts.length===1&&Math.hypot(t.x-T.pts[0].x,t.y-T.pts[0].y)<TRAIL_W+t.r*.5}

/* ---------- dano: ignição ---------- */
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 let burn=null,embers=0;
 if(on(o)&&id===KIT[2]&&n>0&&t&&t!==o&&!isDot()){burn=burnOf(t,o);embers=burn?Math.min(MAX_EMBERS,burn.stacks):0;if(embers)n+=IGNITE*embers}
 const r=prevHit.call(this,t,n,o,k,an,id);
 if(r&&embers){
  const b=OriginalCombat.burns.find(e=>e.target===t&&e.owner===o);if(b){b.stacks=0;b.remaining=0}
  t.v3ignite={t:clock,n:embers};
  try{float(t.x,t.y-80,'IGNIÇÃO ×'+embers,'#ffb347');combatImpact?.(1.2+embers*.12)}catch{}
 }
 return r;
};

/* ---------- passo: limite de brasas e dano do rastro ---------- */
const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(state!=='fight'){TRAILS.length=0;return}
 for(const e of OriginalCombat.burns)if(on(e.owner)&&e.stacks>MAX_EMBERS)e.stacks=MAX_EMBERS;
 for(let i=TRAILS.length-1;i>=0;i--){
  const T=TRAILS[i];if(clock>T.until||T.o.hp<=0||T.gen!==Reforged.generation||!actors.includes(T.o)){TRAILS.splice(i,1);continue}
  if(clock-T.t0<.4)continue;   // o rastro "acende" depois que o passo termina
  for(const t of opponents(T.o)){
   if(t.hp<=0||t.v10Clone||!onTrail(T,t))continue;
   const last=T.tick.get(t)??-9;if(clock-last<TRAIL_TICK)continue;T.tick.set(t,clock);
   hit(t,TRAIL_DMG,T.o,0,0,KIT[3]);
  }
 }
};

/* ---------- desenho: brasas, ignição, rastro ---------- */
const ORANGE='#ffb347';
function flame(x,y,s,al){if(window.FX39?.ready('brasa')){FX39.draw('brasa',x,y-3,18*s,{alpha:al});return}ctx.save();ctx.globalAlpha*=al;ctx.translate(x,y);ctx.scale(s,s);const g=ctx.createLinearGradient(0,-9,0,4);g.addColorStop(0,'#fff2a8');g.addColorStop(.5,ORANGE);g.addColorStop(1,'#d2401f');ctx.fillStyle=g;
 ctx.beginPath();ctx.moveTo(0,-9);ctx.quadraticCurveTo(5,-3,4,1);ctx.quadraticCurveTo(3,5,0,5);ctx.quadraticCurveTo(-3,5,-4,1);ctx.quadraticCurveTo(-5,-3,0,-9);ctx.fill();ctx.restore()}
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(typeof actors==='undefined'||!actors)return list;
 for(let i=TRAILS.length-1;i>=0;i--)if(TRAILS[i].gen!==Reforged.generation||!actors.includes(TRAILS[i].o)||clock>TRAILS[i].until)TRAILS.splice(i,1);
 for(const T of TRAILS)list.unshift({kind:'v3-solar-trail',y:-1e8,priority:-7,paint(){
  const lit=Math.min(1,(clock-T.t0)/.4),fade=Math.min(1,(T.until-clock)/.6);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.lineJoin='round';
  ctx.globalAlpha=.32*lit*fade;ctx.strokeStyle='#ff6a2a';ctx.lineWidth=TRAIL_W*1.6;ctx.beginPath();T.pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y+8):ctx.moveTo(q.x,q.y+8));ctx.stroke();
  ctx.globalAlpha=.55*lit*fade;ctx.strokeStyle=ORANGE;ctx.lineWidth=5;ctx.stroke();
  for(let i=0;i<T.pts.length;i++){const q=T.pts[i],w=Math.sin(clock*9+i*1.7);flame(q.x+w*3,q.y+4,.9+.25*w,.75*lit*fade)}
  ctx.restore();
 }});
 for(const t of actors){
  if(t.hp<=0)continue;
  const b=OriginalCombat.burns.find(e=>e.target===t&&on(e.owner)&&e.remaining>0&&e.stacks>0);
  const ig=t.v3ignite&&clock-t.v3ignite.t<.5?t.v3ignite:null;
  if(!b&&!ig)continue;
  list.push({kind:'v3-solar-embers',y:99993+t.y*.001,priority:9,paint(){
   ctx.save();
   if(b){const n=Math.min(MAX_EMBERS,b.stacks);for(let i=0;i<n;i++){const w=Math.sin(clock*10+i*2);flame(t.x-(n-1)*6+i*12,t.y-84+w,n===MAX_EMBERS?1.15:.9,.9)}}
   if(ig&&window.FX39?.ready('fogo')){const k=(clock-ig.t)/.5;FX39.draw('fogo',t.x,t.y-28,70+ig.n*14+k*40,{alpha:1-k})}
   else if(ig){const k=(clock-ig.t)/.5;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-k;ctx.strokeStyle=ORANGE;ctx.lineWidth=3+ig.n;ctx.beginPath();ctx.ellipse(t.x,t.y,30+k*60,(30+k*60)*.45,0,0,Math.PI*2);ctx.stroke()}
   ctx.restore();
  }});
 }
 return list;
};
window.SolarV3={TRAILS,MAX_EMBERS,IGNITE,burnOf};
})();
