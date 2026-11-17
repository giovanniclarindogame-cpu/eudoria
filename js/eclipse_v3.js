'use strict';
/*
 * Lutador do Eclipse (herói 4) — pacote de jogabilidade v3: o manipulador de espaço.
 *  - CHOQUE NA PAREDE: a Repulsão que joga o rival contra um obstáculo ou a borda da arena causa dano extra
 *    e atordoa por 0,5 s.
 *  - ESFERA CONTROLADA: tocar de novo na Esfera Rubra enquanto ela voa detona a esfera na hora, no ponto onde está.
 *  - A Barreira Cósmica segue a mesma regra para jogador e computador (levantada pelo teleporte por 1,6 s) — js/combate_v3.js.
 *  - O combo Atração + Esfera Rubra continua.
 * ?eclipse=0 desliga o pacote (para comparar).
 */
(function(){
if(!window.COMBAT_V3||!window.V3API||/[?&]eclipse=0/.test(location.search))return;
const {isHero}=V3API,H=4,KIT=CHAMPIONS[H].kit;
const SLAM_DMG=30,SLAM_STUN=.5,SPHERE_R=85;
const on=a=>!!a&&isHero(a)&&a.skin===H;

{const f=(window.V3_DMG_MUL&&V3_DMG_MUL[H])||1,r=n=>String(Math.round(n*f));
 skills[KIT[0]].desc=`Onda curta de ${r(62)} de dano que empurra fortemente. CHOQUE NA PAREDE: se o rival bater em um obstáculo ou na borda da arena, leva +${r(SLAM_DMG)} de dano e fica atordoado por 0,5s.`;
 skills[KIT[2]].desc=`Projétil lento de ${r(157)} de dano que explode em raio 85. Toque de novo enquanto ela voa para detonar na hora. Após a Atração, causa +20% (combo).`;
 for(const k of [0,2])skills[KIT[k]].v3scaled=true;
}

/* ---------- choque na parede ---------- */
let slamming=false;
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 const repulse=on(o)&&id===KIT[0]&&!slamming&&t&&t!==o&&!t.v10Clone&&n>0;
 const x0=t?.x,y0=t?.y,guard=!!t?.guard;
 const r=prevHit.apply(this,arguments);
 if(repulse&&r&&!guard&&t.hp>0){
  const moved=Math.hypot(t.x-x0,t.y-y0),dir=Math.atan2(t.y-o.y,t.x-o.x),probe=(t.r||18)+12;
  if(moved<70&&rwObstacle(t.x+Math.cos(dir)*probe,t.y+Math.sin(dir)*probe,0)){
   slamming=true;
   try{
    if(prevHit.call(this,t,SLAM_DMG,o,0,dir,id)){
     t.root=Math.max(t.root||0,SLAM_STUN);try{rwCancelCharge(t)}catch{}
     t.v3slam={t:clock,x:t.x+Math.cos(dir)*(t.r||18),y:t.y+Math.sin(dir)*(t.r||18),dir};
     try{float(t.x,t.y-80,'CHOQUE!','#d9b8ff');combatImpact?.(1.5)}catch{}
    }
   }finally{slamming=false}
  }
 }
 return r;
};

/* ---------- esfera controlada: tocar de novo detona ---------- */
const liveSphere=a=>Reforged.projectiles.find(e=>e.owner===a&&e.slot===2&&e.life>0&&!e.hit?.size&&(e.travel||0)>30);
function detonate(a){
 const e=liveSphere(a);if(!e)return false;
 e.life=0;
 rwArea(a,e.x,e.y,SPHERE_R,e.damage,2,e.knock||28);
 a.v3det={t:clock,x:e.x,y:e.y};
 try{combatImpact?.(1.25)}catch{}
 return true;
}
const prevCast=cast;
cast=function(a,id,manual){
 if(on(a)&&id===KIT[2]&&state==='fight'&&a.hp>0&&detonate(a))return true;
 return prevCast.apply(this,arguments);
};
// o botão da Esfera fica em recarga enquanto ela voa: captura o toque antes do botão normal (como a troca do clone do Ninja)
document.getElementById('equipped')?.addEventListener('pointerdown',e=>{
 if(state!=='fight'||!on(p))return;
 const el=e.target.closest('.skill');if(!el)return;
 const i=[...document.querySelectorAll('#equipped .skill')].indexOf(el);
 if(V3API.V2[H].s[i]===2&&detonate(p)){e.stopPropagation();e.preventDefault()}
},true);
// computador: detona quando a esfera passa perto do alvo sem acertar
const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(state!=='fight')return;
 for(const a of actors){
  if(!on(a)||a===p||a.hp<=0)continue;
  const e=liveSphere(a);if(!e)continue;
  const foe=enemy(a);if(foe&&foe.hp>0&&Math.hypot(foe.x-e.x,foe.y-e.y)<SPHERE_R*.8)detonate(a);
 }
};

/* ---------- desenho: choque, detonação, esfera pronta para detonar ---------- */
const VIOLET='#d9b8ff';
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(typeof actors==='undefined'||!actors)return list;
 for(const t of actors){
  const s=t.v3slam&&clock-t.v3slam.t<.45?t.v3slam:null;
  if(s)list.push({kind:'v3-eclipse-slam',y:99992+t.y*.001,priority:9,paint(){
   const k=(clock-s.t)/.45;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-k;ctx.strokeStyle=VIOLET;ctx.lineWidth=3;
   for(let i=-2;i<=2;i++){const a=s.dir+Math.PI+i*.45,r0=8+k*10,r1=24+k*30;ctx.beginPath();ctx.moveTo(s.x+Math.cos(a)*r0,s.y-18+Math.sin(a)*r0);ctx.lineTo(s.x+Math.cos(a)*r1,s.y-18+Math.sin(a)*r1);ctx.stroke()}
   ctx.beginPath();ctx.arc(s.x,s.y-18,6+k*26,0,Math.PI*2);ctx.stroke();ctx.restore();
  }});
  if(!on(t))continue;
  const d=t.v3det&&clock-t.v3det.t<.4?t.v3det:null,e=t===p?liveSphere(t):null;
  if(d||e)list.push({kind:'v3-eclipse-sphere',y:99992+t.y*.001,priority:9,paint(){
   ctx.save();ctx.globalCompositeOperation='lighter';
   if(d){const k=(clock-d.t)/.4;ctx.globalAlpha=1-k;ctx.strokeStyle='#ff6a8a';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(d.x,d.y,SPHERE_R*(.6+k*.5),SPHERE_R*(.6+k*.5)*.5,0,0,Math.PI*2);ctx.stroke()}
   if(e){ctx.globalAlpha=.45+.3*Math.sin(clock*14);ctx.strokeStyle='#ff6a8a';ctx.setLineDash([5,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(e.x,e.y+6,SPHERE_R,SPHERE_R*.45,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}
   ctx.restore();
  }});
 }
 return list;
};
window.EclipseV3={detonate,liveSphere,SLAM_DMG,SLAM_STUN};
})();
