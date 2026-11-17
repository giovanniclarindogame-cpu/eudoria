'use strict';
/*
 * Guerreiro Astral (herói 0) — pacote de jogabilidade v3: o lutador que arrisca parar para ficar forte.
 *  - CONCENTRAR KI: segurar o botão de dash (ou Espaço) faz o Salto Estelar e, se continuar segurando, ele para e
 *    carrega Ki rápido (≈25 por segundo). Enquanto carrega recebe +20% de dano.
 *  - EXPLOSÃO AO DESPERTAR: entrar no Modo Poder solta uma onda que empurra e fere quem está perto.
 *  - O Modo Poder muda os golpes: Rajada Astral com metade da recarga; Combo Relâmpago começa com um teleporte para
 *    as costas do alvo; Onda Concentrada sai com carga máxima mesmo sem segurar.
 *  - SOLTURA PERFEITA: soltar a Onda Concentrada no fim da carga (o anel fica dourado) dá +25% de dano.
 * ?guerreiro=0 desliga o pacote (para comparar).
 */
(function(){
if(!window.COMBAT_V3||!window.V3API||/[?&]guerreiro=0/.test(location.search))return;
const {isHero}=V3API,H=0,KIT=CHAMPIONS[H].kit;
const HOLD_DELAY=.3,KI_RATE=25,HOLD_TAKE=1.2,BURST_R=150,BURST_DMG=30,BURST_KNOCK=85,PERFECT=[.78,1],PERFECT_MUL=1.25;
const on=a=>!!a&&isHero(a)&&a.skin===H;
const power=a=>(reworkState(a).powerT||0)>0;
const holdMaxOf=id=>skills[id].holdMax||1.6;

{const f=(window.V3_DMG_MUL&&V3_DMG_MUL[H])||1,r=n=>String(Math.round(n*f));
 skills[KIT[3]].desc=`Teleporte curto com breve invulnerabilidade. CONCENTRAR KI: continue segurando o botão para parar e carregar Ki (cerca de 25 por segundo), recebendo +20% de dano enquanto carrega. Ki cheio = Modo Poder.`;
 skills[KIT[0]].desc=`Rajada de esferas de ki. No Modo Poder sai com mais esferas e metade da recarga.`;
 skills[KIT[1]].desc=`Avança com o punho à frente e desfere uma sequência de socos ao alcançar o rival. No Modo Poder começa com um teleporte para as costas do alvo.`;
 skills[KIT[2]].desc=`Segure e solte: feixe que fica mais forte com a carga. SOLTURA PERFEITA: soltar quando o anel fica dourado dá +25% de dano. No Modo Poder sai com carga máxima na hora.`;
 for(const k of [0,1,2,3])skills[KIT[k]].v3scaled=true;
}

/* ---------- concentrar: segurar o dash ---------- */
const HOLD={id:null,key:false,since:0};
function holdStart(){if(state==='fight'&&on(p)){HOLD.since=clock}}
function holdStop(){HOLD.id=null;HOLD.key=false;if(p)p.v3kiHold=false}
window.addEventListener('pointerdown',e=>{if(e.target?.closest?.('#attack')&&on(p)){HOLD.id=e.pointerId;holdStart()}},true);
window.addEventListener('pointerup',e=>{if(e.pointerId===HOLD.id)holdStop()},true);
window.addEventListener('pointercancel',e=>{if(e.pointerId===HOLD.id)holdStop()},true);
window.addEventListener('keydown',e=>{if(!e.repeat&&(e.code==='Space'||e.code==='ShiftLeft')&&on(p)){HOLD.key=true;holdStart()}},true);
window.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='ShiftLeft')holdStop()},true);
window.addEventListener('blur',holdStop);

const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(state!=='fight'){holdStop();return}
 if(on(p)&&(HOLD.id!==null||HOLD.key)&&clock-HOLD.since>=HOLD_DELAY&&!p.v3kiHold&&!p.rwCast&&!power(p))p.v3kiHold=true;
 for(const a of actors){
  if(!on(a))continue;
  if(a.hp<=0){a.v3kiHold=false;continue}
  // explosão ao despertar
  const pw=power(a);
  if(pw&&!a.v3pw){
   a.v3kiHold=false;a.v3burst={t:clock,x:a.x,y:a.y};
   for(const t of opponents(a))if(t.hp>0&&dist(a,t)<BURST_R+(t.r||0)&&rwVisible(a,t))hit(t,BURST_DMG,a,BURST_KNOCK,Math.atan2(t.y-a.y,t.x-a.x),KIT[4]);
   try{combatImpact?.(1.5)}catch{}
  }
  a.v3pw=pw;
  // carga de Ki
  if(a.v3kiHold){
   if(pw||a.rwCast){a.v3kiHold=false;continue}
   a.root=Math.max(a.root||0,.08);
   originalGainKi(a,KI_RATE*dt/.2);       // o motor v3 aplica ×0,2 ao ganho "externo" de Ki
  }
 }
};

/* ---------- dano: carga arriscada e soltura perfeita ---------- */
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 if(on(t)&&t.v3kiHold&&n>0)n*=HOLD_TAKE;
 let perf=false;
 if(on(o)&&id===KIT[2]&&o.rwCast?.v3perfect&&n>0){n*=PERFECT_MUL;perf=true}
 const r=prevHit.call(this,t,n,o,k,an,id);
 if(perf&&r&&!o.rwCast.v3perfFloat){o.rwCast.v3perfFloat=true;try{float(t.x,t.y-78,'PERFEITO!','#ffe27a')}catch{}}
 return r;
};

/* ---------- Modo Poder muda os golpes ---------- */
const prevCast=cast;
cast=function(a,id,manual){
 if(on(a))a.v3kiHold=false;
 const ok=prevCast.apply(this,arguments);
 if(ok&&on(a)&&id===KIT[0]&&power(a)&&a.cd[id]>0)a.cd[id]*=.5;
 return ok;
};
const prevRelease=rwRelease;
rwRelease=function(a,q){
 if(on(a)&&q.slot===1&&power(a)){
  const foe=enemy(a);
  if(foe&&foe.hp>0&&dist(a,foe)<=260&&rwVisible(a,foe)&&typeof originalComboBlink==='function'&&originalComboBlink(a,q.angle,260)){
   q.angle=Math.atan2(foe.y-a.y,foe.x-a.x);a.a=q.angle;a.v3blinkFx=clock;
  }
 }
 return prevRelease.apply(this,arguments);
};
const prevReleaseCharge=rwReleaseCharge;
rwReleaseCharge=function(a,angle){
 const q=a?.rwCast;
 const mine=on(a)&&q?.holding&&q.slot===2;
 const hm=mine?holdMaxOf(q.id):1,perfect=mine&&!power(a)&&q.age>=hm*PERFECT[0]&&q.age<hm*PERFECT[1];
 const r=prevReleaseCharge.apply(this,arguments);
 if(mine&&a.rwCast===q){
  if(power(a))q.charge=1;
  if(perfect){q.v3perfect=true;a.v3perfFx=clock}
 }
 return r;
};
// computador: concentra Ki quando está longe do rival
const prevAI=ai;
ai=function(dt,a=b){
 const r=prevAI.apply(this,arguments);
 if(a&&a!==p&&on(a)&&a.hp>0&&state==='fight'){
  const foe=enemy(a),d=foe?dist(a,foe):999,s=reworkState(a);
  if(a.v3kiHold&&(d<200||s.value>=99))a.v3kiHold=false;
  else if(!a.v3kiHold&&!power(a)&&!a.rwCast&&a.cast<=0&&d>320&&s.value<85&&Math.random()<dt*1.2)a.v3kiHold=true;
 }
 return r;
};

/* ---------- desenho: aura da concentração, explosão, anel da Onda ---------- */
const GOLD='#ffe27a',KI='#8fd3ff';
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(typeof actors==='undefined'||!actors)return list;
 for(const a of actors){
  if(!on(a)||a.hp<=0)continue;
  const q=a.rwCast,charging=q?.holding&&q.slot===2&&!power(a),bu=a.v3burst&&clock-a.v3burst.t<.5?a.v3burst:null;
  if(!a.v3kiHold&&!charging&&!bu)continue;
  list.push({kind:'v3-guerreiro',y:99991+a.y*.001,priority:9,paint(){
   ctx.save();ctx.globalCompositeOperation='lighter';
   if(a.v3kiHold&&window.FX39?.ready('aura')){FX39.draw('aura',a.x,a.y-22,92+5*Math.sin(clock*10),{alpha:.85,rot:clock*1.2});FX39.draw('aura',a.x,a.y+8,70,{alpha:.5,ground:true,sy:.4,rot:-clock*2});ctx.globalAlpha=.9;ctx.font='800 10px system-ui';ctx.textAlign='center';ctx.fillStyle=KI;ctx.fillText('CONCENTRANDO',a.x,a.y-88)}
   else if(a.v3kiHold){
    for(let i=0;i<7;i++){const ph=(clock*1.6+i/7)%1,ang=i*2.4,x=a.x+Math.cos(ang)*(18+6*Math.sin(i)),y=a.y+8-ph*70;
     ctx.globalAlpha=.75*(1-ph);ctx.fillStyle=i%2?KI:'#ffffff';ctx.beginPath();ctx.arc(x,y,2.4,0,Math.PI*2);ctx.fill()}
    ctx.globalAlpha=.45+.25*Math.sin(clock*12);ctx.strokeStyle=KI;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(a.x,a.y+10,30,12,0,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=.9;ctx.font='800 10px system-ui';ctx.textAlign='center';ctx.fillStyle=KI;ctx.fillText('CONCENTRANDO',a.x,a.y-88);
   }
   if(charging&&window.FX39?.ready('anelOuro')){const hm=holdMaxOf(q.id);if(q.age>=hm*PERFECT[0]&&q.age<hm*PERFECT[1])FX39.draw('anelOuro',a.x,a.y-20,86,{alpha:.95,rot:clock*3})}
   if(charging){
    const hm=holdMaxOf(q.id),k=Math.min(1,q.age/hm),win=q.age>=hm*PERFECT[0]&&q.age<hm*PERFECT[1];
    ctx.globalAlpha=win?.95:.5;ctx.strokeStyle=win?GOLD:KI;ctx.lineWidth=win?4:2;
    ctx.beginPath();ctx.arc(a.x,a.y-20,34,-Math.PI/2,-Math.PI/2+k*Math.PI*2);ctx.stroke();
    ctx.globalAlpha=.35;ctx.strokeStyle=GOLD;ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x,a.y-20,34,-Math.PI/2+PERFECT[0]*Math.PI*2,-Math.PI/2+Math.PI*2);ctx.stroke();
   }
   if(bu&&window.FX39?.ready('explosaoOuro')){const k=(clock-bu.t)/.5;FX39.draw('explosaoOuro',bu.x,bu.y-22,BURST_R*(.7+1.3*k),{alpha:1-k})}
   else if(bu){const k=(clock-bu.t)/.5;ctx.globalAlpha=1-k;ctx.strokeStyle=GOLD;ctx.lineWidth=5*(1-k)+1;ctx.beginPath();ctx.ellipse(bu.x,bu.y,BURST_R*k,BURST_R*k*.45,0,0,Math.PI*2);ctx.stroke()}
   ctx.restore();
  }});
 }
 return list;
};
window.GuerreiroV3={HOLD,power,PERFECT,BURST_R};
})();
