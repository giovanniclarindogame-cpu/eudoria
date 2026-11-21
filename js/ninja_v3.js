'use strict';
/*
 * Ninja das Brumas (herói 1) — pacote de jogabilidade v3: o leitor de intenções.
 *  - LEITURA: o Olho Copiador vira contra-ataque. Ativado logo antes de um golpe acertar (janela de 0,45 s), o Ninja
 *    some na fumaça, reaparece atrás do atacante e copia o golpe (exceto ultimates). Errar o tempo não protege;
 *    o olho continua aberto como antes.
 *  - PELAS COSTAS: depois de trocar de lugar com o clone ou de uma Leitura, o próximo golpe em até 1,2 s causa +25%
 *    e atordoa por 0,35 s.
 *  - CLONE EM SINCRONIA: o clone só ataca junto com o Ninja (até 1,2 s depois de ele usar uma habilidade) — js/clone_v3.js.
 * ?ninja=0 desliga o pacote (para comparar).
 */
(function(){
if(!window.COMBAT_V3||!window.V3API||/[?&]ninja=0/.test(location.search))return;
const {isHero}=V3API,H=1,KIT=CHAMPIONS[H].kit;
const READ_WIN=.45,BACK_WIN=1.2,BACK_MUL=1.25,BACK_STUN=.35,SYNC_WIN=1.2;
const on=a=>!!a&&isHero(a)&&a.skin===H&&!a.copySource;
const isDot=()=>typeof originalDot!=='undefined'&&originalDot;

{const f=(window.V3_DMG_MUL&&V3_DMG_MUL[H])||1;
 skills[KIT[4]].desc=`LEITURA: ative logo antes de um golpe acertar (janela de 0,45s) para sumir na fumaça, reaparecer atrás do atacante e copiar o golpe (exceto ultimates). Fora da janela, o olho fica aberto por 4s e copia o próximo especial que te acertar. Toque de novo para usar a cópia com 75% do dano.`;
 skills[KIT[1]].desc=`Cria um clone de fumaça que ataca junto com você: ele só golpeia logo depois de você usar uma habilidade. Some ao receber qualquer golpe. Toque de novo para trocar de lugar com ele: o próximo golpe em 1,2s sai PELAS COSTAS (+25% e atordoa).`;
 for(const k of [1,4])skills[KIT[k]].v3scaled=true;
}
window.NINJA_V3_SYNC=SYNC_WIN;

/* ---------- conjuração: abre a janela de leitura e marca o ataque (sincronia do clone) ---------- */
const prevCast=cast;
cast=function(a,id,manual){
 const mine=on(a),hadCopy=mine&&!!reworkState(a).copy;
 const ok=prevCast.apply(this,arguments);
 if(ok&&mine){
  if(id===KIT[4]&&!hadCopy)a.v3readUntil=clock+READ_WIN;
  if(id!==KIT[4]){a.v3atkAt=clock;a.v3atkSlot=a.kit.indexOf(id);a.v3atkAng=a.a;a.v3atkSeq=(a.v3atkSeq||0)+1}
 }
 return ok;
};

/* ---------- dano: leitura e pelas costas ---------- */
function freeAt(a,x,y){return typeof originalFreePoint==='function'?originalFreePoint(a,x,y):!rwObstacle(x,y,a.r)}
function readDodge(t,o,id){
 t.v3readUntil=0;
 const from={x:t.x,y:t.y},ang=Math.atan2(o.y-t.y,o.x-t.x);
 const spots=[[o.x+Math.cos(ang)*52,o.y+Math.sin(ang)*52],[o.x+Math.cos(ang+1.2)*56,o.y+Math.sin(ang+1.2)*56],[o.x+Math.cos(ang-1.2)*56,o.y+Math.sin(ang-1.2)*56],[t.x-Math.cos(ang+1.57)*70,t.y-Math.sin(ang+1.57)*70]];
 for(const [x,y] of spots)if(freeAt(t,x,y)){t.x=x;t.y=y;break}
 t.inv=Math.max(t.inv||0,.3);t.a=Math.atan2(o.y-t.y,o.x-t.x);
 try{if(typeof ninja22Smoke==='function'){ninja22Smoke(t,from.x,from.y);ninja22Smoke(t)}}catch{}
 const st=reworkState(t),sk=skills[id];
 let txt='LEITURA!';
 if(sk?.reworked&&!sk.ultimate&&!o.copySource&&isHero(o)){st.copy={id};st.eye=0;t.cd[KIT[4]]=0;txt='LEITURA! Copiou '+sk.name}
 t.v3back=clock+BACK_WIN;t.v3readFx={t:clock,x:t.x,y:t.y};
 try{float(t.x,t.y-80,txt,'#bfe8ff');combatImpact?.(1.3)}catch{}
}
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 if(on(t)&&o&&o!==t&&n>0&&!isDot()&&clock<=(t.v3readUntil??-9)&&t.hp>0&&t.inv<=0&&!sameTeam(t,o)&&!o.v10Clone){readDodge(t,o,id);return false}
 let back=false;
 if(on(o)&&clock<=(o.v3back??-9)&&n>0&&t&&t!==o&&!t.v10Clone&&!isDot()&&id!==KIT[1]&&o.kit.includes(id)){n*=BACK_MUL;back=true}
 const r=prevHit.call(this,t,n,o,k,an,id);
 if(back&&r){o.v3back=0;t.root=Math.max(t.root||0,BACK_STUN);try{rwCancelCharge(t)}catch{}try{float(t.x,t.y-78,'PELAS COSTAS!','#bfe8ff')}catch{}}
 return r;
};

/* ---------- passo: troca de lugar abre o golpe pelas costas ---------- */
const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(state!=='fight')return;
 for(const a of actors){
  if(!on(a)||a.hp<=0){continue}
  const l=a.v3lastPos;
  if(l&&Math.hypot(a.x-l.x,a.y-l.y)>60&&!Reforged.dashes.some(d=>d.owner===a&&!d.finished))a.v3back=clock+BACK_WIN;   // teleporte (troca com o clone)
  a.v3lastPos={x:a.x,y:a.y};
 }
};
// computador: usa a Leitura quando o rival prepara um golpe perto
const prevAI=ai;
ai=function(dt,a=b){
 const r=prevAI.apply(this,arguments);
 if(a&&a!==p&&on(a)&&a.hp>0&&state==='fight'&&!a.rwCast&&a.cast<=0&&!reworkState(a).copy&&(a.cd[KIT[4]]||0)<=0){
  const foe=enemy(a),q=foe?.rwCast;
  if(foe&&foe.hp>0&&q&&!q.holding&&q.age<q.release&&q.release-q.age<.3&&dist(a,foe)<260&&Math.random()<.5)cast(a,KIT[4]);
 }
 return r;
};

/* ---------- desenho: janela de leitura, golpe pelas costas pronto ---------- */
const MIST='#bfe8ff';
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(typeof actors==='undefined'||!actors)return list;
 for(const a of actors){
  if(!on(a)||a.hp<=0)continue;
  const rd=clock<=(a.v3readUntil??-9),bk=clock<=(a.v3back??-9),fx=a.v3readFx&&clock-a.v3readFx.t<.5?a.v3readFx:null;
  if(!rd&&!bk&&!fx)continue;
  list.push({kind:'v3-ninja',y:99990+a.y*.001,priority:9,paint(){
   ctx.save();
   if(rd&&window.FX39?.ready('olho')){const k=(a.v3readUntil-clock)/READ_WIN;FX39.draw('olho',a.x,a.y-92,36,{alpha:.55+.45*k})}
   if(rd){const k=(a.v3readUntil-clock)/READ_WIN;ctx.globalAlpha=.85;ctx.strokeStyle=MIST;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(a.x,a.y-22,36,40,0,0,Math.PI*2*k);ctx.stroke()}
   if(bk&&window.FX39?.ready('adagas')){FX39.draw('adagas',a.x,a.y-92,30,{alpha:.65+.35*Math.sin(clock*14)})}
   else if(bk){ctx.globalAlpha=.6+.4*Math.sin(clock*14);ctx.fillStyle=MIST;ctx.font='800 9px system-ui';ctx.textAlign='center';ctx.fillText('PELAS COSTAS',a.x,a.y-86)}
   if(fx&&window.FX39?.ready('fumaca')){const k=(clock-fx.t)/.5;FX39.draw('fumaca',fx.x,fx.y-20,78,{t:k,alpha:.4})}
   else if(fx){const k=(clock-fx.t)/.5;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-k;ctx.strokeStyle=MIST;ctx.lineWidth=3;ctx.beginPath();ctx.arc(fx.x,fx.y-20,14+k*36,0,Math.PI*2);ctx.stroke()}
   ctx.restore();
  }});
 }
 return list;
};
window.NinjaV3={READ_WIN,BACK_WIN,BACK_MUL};
})();
