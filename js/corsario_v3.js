'use strict';
/*
 * Corsário da Maré (herói 7) — pacote de jogabilidade v3: entra de corpo quando a maré manda.
 *  - ARPÃO FISGADO: quando o Arpão de Maré acerta, há 0,8 s para tocar de novo: a fita puxa o Corsário até o rival
 *    e ele chega com um soco (funciona mesmo com o Arpão em recarga).
 *  - RESSACA: com 50 ou mais de Elasticidade, o Quebra-Mar empurra e, logo depois, a onda volta e arrasta o rival
 *    para perto dele, lento por um instante.
 *  - ÂNCORA OFENSIVA: o impacto do Impulso da Âncora causa +35% e devolve mais 12 de Elasticidade.
 *  - Dano do herói recalibrado (js/combate_v3b.js).
 * ?corsario=0 desliga o pacote (para comparar).
 */
(function(){
if(!window.COMBAT_V3||!window.V3API||/[?&]corsario=0/.test(location.search))return;
const {isHero}=V3API,H=7,KIT=CHAMPIONS[H].kit;
const REEL_WIN=.8,REEL_DMG=45,UNDERTOW_MIN=50,UNDERTOW_TO=70,ANCHOR_MUL=1.35,ANCHOR_GAIN=12;
const on=a=>!!a&&isHero(a)&&a.skin===H&&!a.copySource;
const isDot=()=>typeof originalDot!=='undefined'&&originalDot;

{const f=(window.V3_DMG_MUL&&V3_DMG_MUL[H])||1,r=n=>String(Math.round(n*f));
 skills[KIT[0]].desc=`Braço em fita de água, em linha: ${r(65)} de dano. ARPÃO FISGADO: se acertar, toque de novo em até 0,8s para se puxar até o rival e chegar com um soco de ${r(REEL_DMG)}.`;
 skills[KIT[2]].desc=`Consome metade da Elasticidade. Dois punhos de água causam ${r(120)} de dano, mais 1,4 por ponto consumido, e forte empurrão. RESSACA: com 50 ou mais de Elasticidade, a onda volta e arrasta o rival para perto de você.`;
 skills[KIT[3]].desc=`Prende a fita a uma coluna, parede ou borda e se lança até 320. O impacto causa ${r(90*ANCHOR_MUL)} de dano e devolve ${18+ANCHOR_GAIN} de Elasticidade.`;
 for(const k of [0,2,3])skills[KIT[k]].v3scaled=true;
}

/* ---------- arpão fisgado ---------- */
const reelReady=a=>on(a)&&a.v3reel&&clock<=a.v3reel.until&&a.v3reel.t.hp>0&&a.hp>0&&a.root<=0&&(!a.rwCast||a.rwCast.slot===0&&!a.rwCast.holding&&a.rwCast.age>=a.rwCast.release);
function reel(a){
 if(!reelReady(a))return false;
 const t=a.v3reel.t;a.v3reel=null;
 if(a.rwCast){a.rwCast=null;a.cast=a.skillLock=0}
 const ang=Math.atan2(t.y-a.y,t.x-a.x),d=Math.max(0,dist(a,t)-48);
 a.a=ang;a.v3reelFx={t:clock,to:t};
 rwDash(a,ang,d,Math.max(.12,d/1100),()=>{
  if(t.hp>0&&dist(a,t)<95&&rwVisible(a,t)&&hit(t,REEL_DMG,a,14,ang,KIT[0])){try{rwGain(a,6);float(t.x,t.y-80,'FISGADO!','#6fd8ff');combatImpact?.(1.2)}catch{}}
 },{slot:0});
 a.inv=Math.max(a.inv||0,.12);
 return true;
}
const prevCast=cast;
cast=function(a,id,manual){
 if(on(a)&&id===KIT[0]&&state==='fight'&&reel(a))return true;
 return prevCast.apply(this,arguments);
};
document.getElementById('equipped')?.addEventListener('pointerdown',e=>{
 if(state!=='fight'||!on(p))return;
 const el=e.target.closest('.skill');if(!el)return;
 const i=[...document.querySelectorAll('#equipped .skill')].indexOf(el);
 if(V3API.V2[H].s[i]===0&&reel(p)){e.stopPropagation();e.preventDefault()}
},true);

/* ---------- ressaca ---------- */
const prevRelease=rwRelease;
rwRelease=function(a,q){
 if(!(on(a)&&q.slot===2&&(q.snapshot||0)>=UNDERTOW_MIN))return prevRelease.apply(this,arguments);
 const U={list:[]};a.v3undertow=U;
 let r;try{r=prevRelease.apply(this,arguments)}finally{a.v3undertow=null}
 if(U.list.length)rwLater(a,.35,()=>{
  for(const t of U.list){
   if(t.hp<=0||a.hp<=0)continue;
   const g=Math.atan2(a.y-t.y,a.x-t.x),pull=Math.max(0,dist(a,t)-UNDERTOW_TO);
   move(t,Math.cos(g)*pull,Math.sin(g)*pull);t.slow=Math.max(t.slow||0,.8);t.root=Math.max(t.root||0,.2);
   t.v3undertowFx={t:clock,from:{x:a.x,y:a.y}};
   try{float(t.x,t.y-80,'RESSACA!','#6fd8ff')}catch{}
  }
 });
 return r;
};

/* ---------- dano ---------- */
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 let anchor=false;
 if(on(o)&&id===KIT[3]&&n>0&&!isDot()&&t&&t!==o){n*=ANCHOR_MUL;anchor=true}
 const r=prevHit.call(this,t,n,o,k,an,id);
 if(r&&on(o)&&t&&t!==o&&!t.v10Clone){
  if(id===KIT[0]&&!o.v3reelLock)o.v3reel={t,until:clock+REEL_WIN};
  if(id===KIT[2]&&o.v3undertow&&!o.v3undertow.list.includes(t))o.v3undertow.list.push(t);
  if(anchor)try{rwGain(o,ANCHOR_GAIN)}catch{}
 }
 return r;
};
// o soco da fisgada não abre outra fisgada
const prevHit2=hit;
hit=function(t,n,o,k,an,id){
 const reeling=on(o)&&Reforged.dashes.some(d=>d.owner===o&&d.slot===0&&!d.finished)||on(o)&&clock-(o.v3reelFx?.t??-9)<.6;
 if(reeling)o.v3reelLock=true;
 try{return prevHit2.apply(this,arguments)}finally{if(reeling)o.v3reelLock=false}
};

// computador: usa a fisgada quando ela abre
const prevAI=ai;
ai=function(dt,a=b){
 const r=prevAI.apply(this,arguments);
 if(a&&a!==p&&reelReady(a)&&clock-a.v3reel.until+REEL_WIN>.15&&Math.random()<.6)reel(a);
 return r;
};

/* ---------- desenho ---------- */
const WATER='#6fd8ff';
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(typeof actors==='undefined'||!actors)return list;
 for(const a of actors){
  if(a.hp<=0)continue;
  const uf=a.v3undertowFx&&clock-a.v3undertowFx.t<.4?a.v3undertowFx:null;
  if(uf)list.push({kind:'v3-corsario-ressaca',y:99987+a.y*.001,priority:9,paint(){
   if(window.FX39?.ready('onda')){const k=(clock-uf.t)/.4;FX39.draw('onda',a.x,a.y-22,84,{t:k,flip:uf.from.x<a.x});return}
   const k=(clock-uf.t)/.4;ctx.save();ctx.globalAlpha=(1-k)*.8;ctx.strokeStyle=WATER;ctx.lineWidth=3;
   for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(a.x,a.y+4,18+i*10+k*10,Math.PI*.15,Math.PI*.85);ctx.stroke()}ctx.restore();
  }});
  if(!on(a))continue;
  const ready=reelReady(a),rf=a.v3reelFx&&clock-a.v3reelFx.t<.3?a.v3reelFx:null;
  if(!ready&&!rf)continue;
  list.push({kind:'v3-corsario',y:99987+a.y*.001,priority:9,paint(){
   ctx.save();
   if(ready){const t=a.v3reel.t,k=(a.v3reel.until-clock)/REEL_WIN;ctx.globalAlpha=.35+.5*k;ctx.strokeStyle=WATER;ctx.setLineDash([6,5]);ctx.lineWidth=2;
    ctx.setLineDash([]);if(!window.FX39?.line('linhaAgua',a.x,a.y-26,t.x,t.y-26,12,{scroll:-60})){ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(a.x,a.y-26);ctx.lineTo(t.x,t.y-26);ctx.stroke();ctx.setLineDash([])}
    ctx.globalAlpha=.9;ctx.fillStyle=WATER;ctx.font='800 9px system-ui';ctx.textAlign='center';ctx.fillText('FISGOU! TOQUE DE NOVO',a.x,a.y-88)}
   if(rf&&window.FX39?.ready('respingo')){const k=(clock-rf.t)/.3;FX39.draw('respingo',rf.to.x,rf.to.y-24,80,{t:k})}
   if(rf&&window.FX39?.lineReady('linhaAgua')){const k=(clock-rf.t)/.3;FX39.line('linhaAgua',a.x,a.y-26,rf.to.x,rf.to.y-26,16,{alpha:1-k,scroll:500})}
   else if(rf){const k=(clock-rf.t)/.3;ctx.globalAlpha=1-k;ctx.strokeStyle='#e8fbff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x,a.y-26);ctx.lineTo(rf.to.x,rf.to.y-26);ctx.stroke()}
   ctx.restore();
  }});
 }
 return list;
};
window.CorsarioV3={reel,reelReady,REEL_WIN,UNDERTOW_MIN,ANCHOR_MUL};
})();
