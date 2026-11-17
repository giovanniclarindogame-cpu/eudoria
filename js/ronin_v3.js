'use strict';
/*
 * Ronin Carmesim (herói 2) — pacote de jogabilidade v3: o duelista da paciência e do contra-ataque.
 *  - SAQUE: 0,8 s sem atacar (e sem levar golpe) guarda a espada na bainha. O próximo Corte Rápido sai quase
 *    instantâneo, avança um pouco mais e causa +40% de dano.
 *  - ESQUIVA PERFEITA: se um golpe ia acertar durante o Passo Carmesim (primeiros 0,3 s), a recarga do Corte Rápido
 *    zera, ganha 20 de Pressão e a espada volta à bainha na hora (esquiva perfeita → Saque).
 *  - Ritmo da Lâmina: levar dano tira 2 marcas, não todas.
 * ?ronin=0 desliga o pacote (para comparar).
 */
(function(){
if(!window.COMBAT_V3||!window.V3API||/[?&]ronin=0/.test(location.search))return;
const {isHero}=V3API,H=2,KIT=CHAMPIONS[H].kit;
const SHEATH_T=.8,DRAW_MUL=1.4,PERFECT_WIN=.3,PERFECT_PRE=20;
const on=a=>!!a&&isHero(a)&&a.skin===H;
const isDot=()=>typeof originalDot!=='undefined'&&originalDot;
const sheathed=a=>on(a)&&a.hp>0&&!a.rwCast&&clock-Math.max(a.v3ronLast??-9,a.v3ronHurt??-9)>=SHEATH_T;

{const f=(window.V3_DMG_MUL&&V3_DMG_MUL[H])||1,r=n=>String(Math.round(n*f));
 skills[KIT[0]].desc=`Avança e corta por ${r(55)} de dano. Ao acertar, toque de novo em até 0,65s para um corte de retorno. SAQUE: depois de 0,8s sem atacar, a espada volta à bainha e o próximo corte sai instantâneo, com mais alcance e +40% de dano.`;
 skills[KIT[3]].desc=`Avança 180 com breve invulnerabilidade. ESQUIVA PERFEITA: se um golpe ia acertar no início do passo, zera a recarga do Corte Rápido, dá 20 de Pressão e prepara o Saque na hora.`;
 for(const k of [0,3])skills[KIT[k]].v3scaled=true;
}

/* ---------- conjuração: saque e marcação de tempo ---------- */
const prevCast=rwCast;
rwCast=function(a,id,manual){
 if(!on(a))return prevCast.apply(this,arguments);
 const follow=(reworkState(a).ichigoFollowUntil||0)>clock;
 const draw=id===KIT[0]&&!follow&&sheathed(a);
 const ok=prevCast.apply(this,arguments);
 if(ok&&a.rwCast){
  const q=a.rwCast,slot=skills[id]?.slot;
  if(draw&&q.slot===0){q.v3draw=true;q.release*=.35;q.duration=Math.max(q.release+.12,q.duration*.8);a.cast=a.skillLock=q.duration}
  if(slot!==3)a.v3ronLast=clock;
 }
 return ok;
};
const prevCommit=rwCommit;
rwCommit=function(a,q){
 const r=prevCommit.apply(this,arguments);
 if(on(a)&&q.slot===3){a.v3ronDash=clock;a.v3ronPerfectUsed=false}
 return r;
};
const prevRelease=rwRelease;
rwRelease=function(a,q){
 if(on(a)&&q.slot===0&&q.v3draw){
  move(a,Math.cos(q.angle)*34,Math.sin(q.angle)*34);
  a.v3drawUntil=clock+.12;a.v3drawFx={t:clock,x:a.x,y:a.y,an:q.angle};
  try{combatImpact?.(1.15)}catch{}
 }
 return prevRelease.apply(this,arguments);
};

/* ---------- dano: saque, esquiva perfeita, ritmo ---------- */
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 // esquiva perfeita: um golpe ia acertar o Ronin no começo do Passo Carmesim
 if(on(t)&&o&&o!==t&&n>0&&!isDot()&&!sameTeam(t,o)&&!t.v3ronPerfectUsed&&clock-(t.v3ronDash??-9)<=PERFECT_WIN&&t.inv>0&&t.hp>0){
  t.v3ronPerfectUsed=true;
  t.cd[KIT[0]]=0;const st=reworkState(t);st.value=Math.min(100,st.value+PERFECT_PRE);
  t.v3ronLast=-9;t.v3ronHurt=-9;
  t.v3ronPerfect={t:clock,x:t.x,y:t.y};
  try{float(t.x,t.y-78,'ESQUIVA PERFEITA','#ff8a96');combatImpact?.(1.3)}catch{}
 }
 let draw=false;
 if(on(o)&&id===KIT[0]&&n>0&&t&&t!==o&&clock<=(o.v3drawUntil??-9)){n*=DRAW_MUL;draw=true}
 const marks=on(t)?(t.v3m||0):0;
 const before=t&&t.hp,r=prevHit.call(this,t,n,o,k,an,id);
 const hurt=on(t)&&r&&before>t.hp;if(hurt)t.v3ronHurt=clock;
 if(on(t)&&marks>0&&!t.v3m)t.v3m=hurt?Math.max(0,marks-2):marks;
 if(draw&&r&&clock-(o.v3drawFloat??-9)>.3){o.v3drawFloat=clock;try{float(t.x,t.y-74,'SAQUE!','#ff5a6a')}catch{}}
 return r;
};

/* ---------- desenho: espada na bainha, corte do saque, esquiva perfeita ---------- */
const RED='#ff5a6a';
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(typeof actors==='undefined'||!actors)return list;
 for(const a of actors){
  if(!on(a)||a.hp<=0)continue;
  const sh=sheathed(a),df=a.v3drawFx&&clock-a.v3drawFx.t<.35?a.v3drawFx:null,pf=a.v3ronPerfect&&clock-a.v3ronPerfect.t<.45?a.v3ronPerfect:null;
  // carregando o saque: arco que se fecha enquanto espera
  const wait=clock-Math.max(a.v3ronLast??-9,a.v3ronHurt??-9),prog=!sh&&!a.rwCast&&wait>.15&&wait<SHEATH_T?(wait-.15)/(SHEATH_T-.15):0;
  if(!sh&&!df&&!pf&&!prog)continue;
  list.push({kind:'v3-ronin',y:99994+a.y*.001,priority:9,paint(){
   ctx.save();
   if(prog){ctx.globalAlpha=.55;ctx.strokeStyle=RED;ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x,a.y-76,6,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);ctx.stroke()}
   if(sh&&window.FX39?.ready('katana')){const pul=.65+.35*Math.sin(clock*9);FX39.draw('katana',a.x,a.y-86,44,{alpha:.75+.25*pul,rot:-.3});ctx.save();ctx.globalAlpha=.35*pul;ctx.strokeStyle=RED;ctx.lineWidth=2;ctx.translate(a.x,a.y+11);ctx.scale(1,.4);ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.stroke();ctx.restore()}
   else if(sh){
    const pul=.65+.35*Math.sin(clock*9);
    ctx.save();ctx.globalAlpha=.85*pul;ctx.translate(a.x,a.y-82);ctx.scale(1.6,1.6);
    ctx.strokeStyle='#2a0a10';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-9,4);ctx.lineTo(9,-4);ctx.stroke();      // bainha
    ctx.strokeStyle=RED;ctx.lineWidth=2;ctx.shadowColor=RED;ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(-9,4);ctx.lineTo(9,-4);ctx.stroke();
    ctx.fillStyle='#ffd0d6';ctx.fillRect(-11,3,4,4);                                                                   // empunhadura
    ctx.shadowBlur=0;ctx.font='800 6px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffd0d6';ctx.fillText('SAQUE',0,-7);
    ctx.restore();
    ctx.save();ctx.globalAlpha=.35*pul;ctx.strokeStyle=RED;ctx.lineWidth=2;ctx.translate(a.x,a.y+11);ctx.scale(1,.4);ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.stroke();ctx.restore();
   }
   ctx.restore();ctx.save();
   if(df&&window.FX39?.ready('corte')){const k=(clock-df.t)/.35;FX39.draw('corte',df.x+Math.cos(df.an)*44,df.y-22+Math.sin(df.an)*26,130,{rot:df.an,t:k})}
   else if(df){const k=(clock-df.t)/.35;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-k;ctx.strokeStyle='#ffe3e6';ctx.lineWidth=4*(1-k)+1;ctx.shadowColor=RED;ctx.shadowBlur=14;
    ctx.beginPath();ctx.arc(df.x,df.y-20,70+k*20,df.an-1.1,df.an+1.1);ctx.stroke()}
   if(pf&&window.FX39?.ready('fumaca')){const k=(clock-pf.t)/.45;FX39.draw('fumaca',pf.x,pf.y-22,70,{t:k,alpha:.4})}
   else if(pf){const k=(clock-pf.t)/.45;ctx.globalAlpha=(1-k)*.8;ctx.strokeStyle='#ffb3bb';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(pf.x,pf.y-20,20+k*40,30+k*30,0,0,Math.PI*2);ctx.stroke()}
   ctx.restore();
  }});
 }
 return list;
};
window.RoninV3={sheathed,SHEATH_T,DRAW_MUL};
})();
