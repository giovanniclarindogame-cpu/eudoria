'use strict';
/*
 * Caçador Espectral (herói 5) — pacote de jogabilidade v3: o caçador que fisga e solta o golpe na hora certa.
 *  - FISGADA: a Vara Giratória continua afastando quem está colado nele, e agora puxa até ele quem está na ponta da
 *    linha (de 125 a 240 de distância), prendendo por 0,35 s. Fisgar e soltar o Soco Carregado é o combo dele.
 *  - CARGA EM 3 NÍVEIS: o Soco Carregado acende um nível a cada 0,6 s (0,6 · 1,2 · 1,8 s). O dano vem do nível
 *    alcançado; o nível 3 é a CARGA MÁXIMA.
 *  - POSTURA FIRME: golpes fracos (menos de 40 de dano) não interrompem mais a carga.
 *  - CAÇADA: o Salto Selvagem (dash) causa bem menos dano, mas deixa o rival marcado como presa com a Presa Marcada
 *    cheia (3 marcas, +24% nos próximos golpes).
 *  - Menos "cara ou coroa": multiplicadores de dano/dano recebido em js/combate_v3b.js.
 * ?cacador=0 desliga o pacote (para comparar).
 */
(function(){
if(!window.COMBAT_V3||!window.V3API||/[?&]cacador=0/.test(location.search))return;
const {isHero}=V3API,H=5,KIT=CHAMPIONS[H].kit;
const LEVEL_T=.6,LEVEL_CHARGE=[.1,.38,.68,1],FIRM=40,HOOK_MIN=125,HOOK_MAX=240,HOOK_TO=62,HOOK_DMG=18,DASH_MUL=.4;
const on=a=>!!a&&isHero(a)&&a.skin===H&&!a.copySource;
const isDot=()=>typeof originalDot!=='undefined'&&originalDot;
const levelOf=age=>Math.min(3,Math.floor(age/LEVEL_T+1e-6));
skills[KIT[0]].holdMax=LEVEL_T*3;

{const f=(window.V3_DMG_MUL&&V3_DMG_MUL[H])||1,r=n=>String(Math.round(n*f));
 skills[KIT[0]].desc=`Segure: a carga acende um nível a cada 0,6s (até 3). Solte para um soco de ${r(65+195*LEVEL_CHARGE[0])} a ${r(260)} de dano conforme o nível. POSTURA FIRME: golpes fracos não interrompem a carga; golpes fortes sim.`;
 skills[KIT[2]].desc=`Giro com a vara de pesca: ${r(70)} de dano e afasta quem está perto. FISGADA: quem está na ponta da linha (até 240) é puxado até você e preso por um instante — hora de soltar o Soco Carregado.`;
 skills[KIT[3]].desc=`Salta até 230 e aterrissa com um chute de ${r(95*DASH_MUL)} de dano. CAÇADA: quem é atingido fica marcado como presa (Presa Marcada cheia: +24% nos seus próximos golpes por 4s).`;
 for(const k of [0,2,3])skills[KIT[k]].v3scaled=true;
}

/* ---------- carga em níveis ---------- */
const prevReleaseCharge=rwReleaseCharge;
rwReleaseCharge=function(a,angle){
 const q=a?.rwCast,mine=on(a)&&q?.holding&&q.slot===0,age=mine?q.age:0;
 const r=prevReleaseCharge.apply(this,arguments);
 if(mine&&a.rwCast===q){const lv=levelOf(age);q.charge=LEVEL_CHARGE[lv];q.v3level=lv;if(lv===3){a.v3maxFx=clock;try{float(a.x,a.y-84,'CARGA MÁXIMA','#ffd36a')}catch{}}}
 return r;
};

/* ---------- fisgada da vara ---------- */
const prevRelease=rwRelease;
rwRelease=function(a,q){
 const r=prevRelease.apply(this,arguments);
 if(on(a)&&q.slot===2){
  for(const t of opponents(a)){
   if(t.hp<=0||t.v10Clone)continue;
   const d=dist(a,t);if(d<HOOK_MIN+(t.r||0)*.5||d>HOOK_MAX||!rwVisible(a,t))continue;
   const g=Math.atan2(a.y-t.y,a.x-t.x),pull=Math.max(0,d-HOOK_TO);
   const from={x:t.x,y:t.y};
   if(hit(t,HOOK_DMG,a,0,g+Math.PI,KIT[2])){
    move(t,Math.cos(g)*pull,Math.sin(g)*pull);
    t.root=Math.max(t.root||0,.35);try{rwCancelCharge(t)}catch{}
    a.v3hook={t:clock,from,to:t,x:a.x,y:a.y};
    try{float(t.x,t.y-80,'FISGADO!','#7be0a8')}catch{}
   }
  }
 }
 return r;
};

/* ---------- dano: postura firme e caçada ---------- */
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 if(on(o)&&id===KIT[3]&&n>0&&!isDot())n*=DASH_MUL;
 const holding=on(t)&&t.rwCast?.holding&&t.rwCast.slot===0?t.rwCast:null,cd0=holding?t.cd[KIT[0]]:0;
 const before=t?.hp,r=prevHit.call(this,t,n,o,k,an,id);
 if(holding&&!t.rwCast&&t.hp>0&&before-t.hp<FIRM){   // golpe fraco: a carga continua
  t.rwCast=holding;reworkState(t).charge=holding;t.cast=99;t.skillLock=99;t.cd[KIT[0]]=cd0;t.v3firmFx=clock;
 }
 if(r&&on(o)&&id===KIT[3]&&t&&t!==o&&t.hp>0){o.v3f={t,n:3,at:clock};t.v3preyFx=clock;try{float(t.x,t.y-80,'PRESA!','#7be0a8')}catch{}}
 return r;
};

/* ---------- desenho: níveis da carga, linha da fisgada, postura firme ---------- */
const GREEN='#7be0a8',GOLD='#ffd36a';
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(typeof actors==='undefined'||!actors)return list;
 for(const a of actors){
  if(!on(a)||a.hp<=0)continue;
  const q=a.rwCast,hold=q?.holding&&q.slot===0,hk=a.v3hook&&clock-a.v3hook.t<.35?a.v3hook:null,firm=clock-(a.v3firmFx??-9)<.35;
  if(!hold&&!hk&&!firm)continue;
  list.push({kind:'v3-cacador',y:99989+a.y*.001,priority:9,paint(){
   ctx.save();
   if(hold){const lv=levelOf(q.age),part=Math.min(1,(q.age%LEVEL_T)/LEVEL_T);
    for(let i=0;i<3;i++){const x=a.x-14+i*14,y=a.y-84,lit=i<lv;
     ctx.globalAlpha=lit?1:.55;ctx.fillStyle=lit?(lv===3?GOLD:GREEN):'#15241c';ctx.strokeStyle='#06120c';ctx.lineWidth=1.5;
     ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+5,y);ctx.lineTo(x,y+6);ctx.lineTo(x-5,y);ctx.closePath();ctx.fill();ctx.stroke();
     if(i===lv&&lv<3){ctx.globalAlpha=.9;ctx.fillStyle=GREEN;ctx.beginPath();ctx.moveTo(x,y+6);ctx.lineTo(x+5*part,y+6-6*part);ctx.lineTo(x,y+6-12*part);ctx.lineTo(x-5*part,y+6-6*part);ctx.closePath();ctx.fill()}}
    if(lv===3){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.4+.3*Math.sin(clock*20);ctx.strokeStyle=GOLD;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(a.x,a.y+10,30,12,0,0,Math.PI*2);ctx.stroke()}}
   if(hk){const k=(clock-hk.t)/.35;ctx.globalAlpha=1-k;ctx.strokeStyle='#e9f5ee';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a.x,a.y-30);ctx.quadraticCurveTo((a.x+hk.to.x)/2,Math.min(a.y,hk.to.y)-60,hk.to.x,hk.to.y-24);ctx.stroke()}
   if(firm){ctx.globalAlpha=.8;ctx.font='800 9px system-ui';ctx.textAlign='center';ctx.fillStyle=GREEN;ctx.fillText('FIRME',a.x,a.y-96)}
   ctx.restore();
  }});
 }
 return list;
};
// computador: fisga quem está na ponta da linha e, com o rival preso, começa a carregar o soco
const prevAI=ai;
ai=function(dt,a=b){
 const r=prevAI.apply(this,arguments);
 if(a&&a!==p&&on(a)&&a.hp>0&&state==='fight'&&!a.rwCast&&a.cast<=0&&a.root<=0){
  const t=enemy(a);if(!t||t.hp<=0)return r;const d=dist(a,t),ang=Math.atan2(t.y-a.y,t.x-a.x);
  if(d>HOOK_MIN+10&&d<HOOK_MAX-10&&(a.cd[KIT[2]]||0)<=0&&rwVisible(a,t)&&Math.random()<.5){a.a=ang;cast(a,KIT[2],ang)}
  else if(t.root>.2&&d<130&&(a.cd[KIT[0]]||0)<=0&&!a.rwCast){a.a=ang;rwBeginCharge(a,ang,0)}
 }
 return r;
};
window.CacadorV3={levelOf,LEVEL_CHARGE,HOOK_MIN,HOOK_MAX,FIRM,DASH_MUL};
})();
