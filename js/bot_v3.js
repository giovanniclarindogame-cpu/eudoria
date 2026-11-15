'use strict';
/*
 * IA difícil dos bots (duelos 1×1, 2×2, liga e torneio; não altera Sobrevivência, Cruzada nem Caçada).
 * Em vez de sortear habilidades: lê o rival (preparando golpe, recuperando, travado), esquiva com o dash,
 * pune brechas, usa cada habilidade na distância certa, mira com antecipação e tem tática por herói.
 * `?botai=0` volta à IA antiga (usado nas simulações de comparação).
 */
(function(){
if(!window.COMBAT_V3||!window.V3API)return;
const OFF=/[?&]botai=0/.test(location.search);
const {isHero,V2}=V3API;
const TAU=Math.PI*2;

/* plano por herói (s = posição no kit): alcance útil r, tipo k, open = só em brecha, minD = distância mínima */
const PLAN={
 0:[{s:0,r:470,k:'proj'},{s:1,r:290,k:'melee'},{s:2,r:470,k:'proj',open:1},{s:5,r:470,k:'ult',open:1}],
 1:[{s:0,r:88,k:'melee'},{s:1,k:'clone'},{s:5,r:340,k:'ult',open:1}],
 2:[{s:0,r:105,k:'melee'},{s:2,r:470,k:'proj',minD:110},{s:4,k:'buff'},{s:5,r:470,k:'ult',open:1}],
 3:[{s:0,r:92,k:'melee'},{s:1,r:470,k:'proj',minD:90},{s:2,r:410,k:'area',open:1},{s:5,r:470,k:'ult',open:1}],
 4:[{s:0,r:105,k:'melee'},{s:1,r:270,k:'pull',minD:90},{s:2,r:440,k:'proj',minD:110},{s:5,r:420,k:'ult',open:1}],
 5:[{s:1,r:90,k:'melee'},{s:0,r:125,k:'melee',open:1},{s:2,r:90,k:'melee'},{s:5,r:215,k:'ult',open:1}],
 6:[{s:1,r:90,k:'melee'},{s:0,r:115,k:'melee',open:1},{s:2,r:310,k:'gap',minD:140,open:1},{s:5,r:200,k:'ult',open:1}],
 7:[{s:0,r:380,k:'proj'},{s:1,r:255,k:'proj'},{s:2,r:350,k:'proj'},{s:5,r:470,k:'ult',open:1}],
 8:[{s:0,r:105,k:'melee'},{s:1,r:420,k:'proj',minD:100},{s:2,r:112,k:'melee'},{s:5,r:450,k:'ult',open:1}],
 9:[{s:0,k:'block'},{s:1,r:90,k:'melee'},{s:3,k:'wall'},{s:5,k:'colossus',open:1}]
};
const RANGED=new Set([0,4,7,9]);   // preferem manter distância média
const PREF={0:230,4:240,7:240,9:130};   // distância preferida dos que lutam de longe/média

const nowC=()=>clock;
function threatRange(f){const q=f.rwCast;const sk=q&&skills[q.id];return Math.max(110,(sk?.range||140)+50)}
function windup(f){const q=f.rwCast;return q?(q.age<q.release+.05&&!q.holding):(f.cast>0&&f.punchTime<=0&&false)}
function opening(f){const q=f.rwCast;return !!((q&&q.age>=q.release)||f.actionRecovery>0||f.root>0||f.guardBreak>0||f.hitReact>0||f.skillLock>0&&!q)}
function incoming(a){
 const lists=[typeof Reforged!=='undefined'?Reforged.projectiles:[],typeof shots!=='undefined'?shots:[]];
 for(const l of lists)for(const e of l)if(e&&e.life>0&&e.owner&&e.owner.team!==a.team&&Math.hypot(e.x-a.x,e.y-a.y)<125)return true;
 return zones.some(z=>z.owner&&z.owner.team!==a.team&&(z.kind==='line'?lineDistance(a.x,a.y,z.x,z.y,z.x+Math.cos(z.a)*z.len,z.y+Math.sin(z.a)*z.len)<z.r+30:dist(a,z)<z.r+25));
}
function dashReady(a){
 if((a.v3dashCD||0)>0||a.cast>0||a.root>0||a.hp<=0)return false;
 const id=V3API.dashIdOf(a);if(id!=null&&a.cd[id]>0)return false;return true;
}
function bk(a){return a.bot||(a.bot={think:0,fx:null,fy:null,vx:0,vy:0,strafe:Math.random()<.5?1:-1,strafeT:1+Math.random()*1.5,threat:0,hold:0,mist:0,lastSwap:-9})}

function trackFoe(b,f,dt){
 if(b.fx!==null&&dt>0){const vx=(f.x-b.fx)/dt,vy=(f.y-b.fy)/dt;b.vx=b.vx*.7+vx*.3;b.vy=b.vy*.7+vy*.3}
 b.fx=f.x;b.fy=f.y;
}
function aimAt(a,f,b,speed=460){
 const d=dist(a,f),t=Math.min(.55,d/speed);
 const px=f.x+b.vx*t,py=f.y+b.vy*t;
 return Math.atan2(py-a.y,px-a.x);
}

function chooseSkill(a,f,b,d,open,danger){
 const plan=PLAN[a.skin];if(!plan)return null;
 let best=null,bs=-1;
 const q=windup(f)&&d<threatRange(f);
 for(const e of plan){
  const id=a.kit[e.s];if(id==null||!rwReady(a,id))continue;
  const sk=skills[id];
  let sc=0;
  if(e.k==='clone'){if(!originalClone(a)&&d>100)sc=70;else continue}
  else if(e.k==='buff'){const st=reworkState(a);if(st.spiritForm>0||d>260||(d<170&&!open)||q)continue;sc=65}
  else if(e.k==='block'){const mats=reworkMaterials(a).length;if(mats>=3)continue;sc=mats<2?62:40}
  else if(e.k==='wall'){if(!(q||danger)||d>260)continue;sc=75}
  else if(e.k==='colossus'){if(!open&&f.hp>a.hp)continue;sc=reworkMaterials(a).length?90:0;if(!sc)continue}
  else{
   if(d>e.r||d<(e.minD||0))continue;
   if(e.open&&!open&&!(f.hp<f.max*.3&&e.k==='ult'))continue;
   if(e.k==='melee'||e.k==='proj'||e.k==='pull'){if(!lineClear(a,f)&&e.k!=='melee')continue}
   sc={melee:52,proj:46,area:open?85:30,pull:58,gap:open?62:35,ult:open?130:(f.hp<f.max*.3?125:0)}[e.k];
   if(e.k==='ult'&&!sc)continue;
   if(sk.holdMax){sc+=open?18:-35}
   if(e.k==='melee'&&d>e.r*.85)sc-=14;
   if(a.skin===4&&e.s===2&&f.v3pulled&&clock-f.v3pulled<2.4)sc+=90;   // combo Atração + Esfera
   if(a.skin===0&&e.k==='proj'&&e.s===0)sc+=8;                       // Goku: Rajada enche o ki
   if(a.skin===6&&e.s===0&&reworkState(a).arm>0)continue;
  }
  if(q&&e.k!=='ult'&&sk.holdMax)sc-=60;           // não carrega golpe com o rival já atacando
  if(q&&e.k==='melee'&&d>e.r*.6)sc-=18;
  sc+=Math.random()*6;
  if(sc>bs){bs=sc;best=e}
 }
 return bs>=30?best:null;
}

function hardAI(dt,a){
 const f=enemy(a);if(!f||f===a||f.hp<=0)return;
 const b=bk(a);trackFoe(b,f,dt);
 b.think-=dt;b.strafeT-=dt;b.threat=windup(f)&&dist(a,f)<threatRange(f)?b.threat+dt:Math.max(0,b.threat-dt*3);
 const d=dist(a,f),ang=aimAt(a,f,b),base=Math.atan2(f.y-a.y,f.x-a.x),open=opening(f),danger=incoming(a);
 const holding=!!(a.rwCast&&a.rwCast.holding);
 if(b.strafeT<=0){b.strafe*=-1;b.strafeT=2.6+Math.random()*2.6}
 a.a=holding?ang:base;
 /* carga em andamento: solta no ponto certo ou cancela se estiver em perigo */
 if(holding){
  b.hold+=dt;
  if(a.hitReact>0||((b.threat>.1||danger)&&b.hold>.15&&dashReady(a))){try{rwCancelCharge(a)}catch{}}
  else if(a.rwCast.charge>=.85||b.hold>1.5||d>520)rwReleaseCharge(a,ang);
  return;
 }
 b.hold=0;
 /* esquiva (dash) quando o rival prepara um golpe ou vem projétil */
 if(!a.rwCast&&a.cast<=0&&dashReady(a)&&(b.threat>.08||danger)&&Math.random()<.9){
  const side=b.strafe,away=Math.random()<.35;
  a.a=base+(away?Math.PI:side*Math.PI/2+side*.25);
  if(V3API.doDash(a)){b.threat=0;a.a=base;return}
  a.a=base;
 }
 /* escolha de habilidade */
 if(b.think<=0&&a.cast<=0&&!a.rwCast&&a.root<=0&&!a.guard){
  b.think=.07+Math.random()*.05;
  // Kakashi: troca de lugar para escapar quando a vida está baixa
  if(a.skin===1&&originalClone(a)&&a.hp<a.max*.4&&d<200&&clock-b.lastSwap>3&&V3API.kakashiSwap(a)){b.lastSwap=clock;return}
  const e=chooseSkill(a,f,b,d,open,danger);
  if(e){
   const id=a.kit[e.s],sk=skills[id];
   if(sk.holdMax){if(rwBeginCharge(a,ang,e.s)){b.hold=0;return}}
   else if(cast(a,id,ang))return;
  }
 }
 /* movimento */
 if(a.guard||a.cast>0||a.root>0||a.dash>0||a.dodgeTime>0||a.rwCast){a.moving=false;return}
 const prefer=RANGED.has(a.skin)?(PREF[a.skin]||200):72;
 let mv=base,sp=0;
 const lowHp=a.hp<a.max*.28&&(f.hp>a.hp);
 if(open&&d>prefer*.8&&!RANGED.has(a.skin)){mv=base;sp=1}                       // pune: aproxima na brecha
 else if(b.threat>0&&d<threatRange(f)){mv=base+b.strafe*(Math.PI/2+.5);sp=1}      // sai da linha do golpe
 else if(danger){mv=base+b.strafe*Math.PI/2;sp=1}
 else if(lowHp&&d<320){mv=base+Math.PI+b.strafe*.5;sp=1}                         // fraco: afasta e espera recarga
 else if(d>prefer+30){mv=base+b.strafe*.12;sp=1}
 else if(d<prefer-35&&RANGED.has(a.skin)){mv=base+Math.PI+b.strafe*.35;sp=1}
 else{mv=base+b.strafe*Math.PI/2;sp=.55}                                          // contorna
 const obs=pillars.find(o=>dist(o,a)<o.r+75&&Math.cos(Math.atan2(o.y-a.y,o.x-a.x)-mv)>.5);if(obs)mv+=1.25*b.strafe;
 /* suaviza a direção e a velocidade: o bot faz curvas em vez de inverter o sentido de uma vez (sem tremedeira) */
 const urgent=(b.threat>0&&d<threatRange(f))||danger;
 if(b.mvA===undefined)b.mvA=mv;
 {const df=Math.atan2(Math.sin(mv-b.mvA),Math.cos(mv-b.mvA)),turn=(urgent?16:4.5)*dt;b.mvA+=Math.max(-turn,Math.min(turn,df));mv=b.mvA}
 b.spA=b.spA===undefined?sp:b.spA+(sp-b.spA)*Math.min(1,dt*7);sp=b.spA;
 const speed=140*(typeof identitySpeed==='function'?identitySpeed(a):1)*(a.slow>0?.55:1)*(a.buff?.storm>0?1.25:1)*(a.buff?.wings>0?1.35:1)*sp;
 const old={x:a.x,y:a.y};
 if(move(a,Math.cos(mv)*speed*dt,Math.sin(mv)*speed*dt))move(a,Math.cos(mv+1.1)*speed*dt,Math.sin(mv+1.1)*speed*dt);
 a.moving=dist(old,a)>.01;
 // encostou na parede/obstáculo: troca o lado do contorno só depois de ficar preso um instante
 if(sp>.3&&!a.moving){b.stuckT=(b.stuckT||0)+dt;if(b.stuckT>.35){b.strafe*=-1;b.strafeT=2.6+Math.random()*2.6;b.stuckT=0}}else b.stuckT=0;
}

const prevAI=ai;
ai=function(dt,a=b){
 if(OFF||window.BOT_HARD===false||modeRun||battleActivity==='training'||state!=='fight'||!a||(a===p&&!window.BOT_SIM_P)||a.oldBot||a.hp<=0||a.trainingDummy||a.boss||a.mob||a.rmob||!isHero(a)||!PLAN[a.skin])return prevAI(dt,a);
 if(!opponents(a).length)return;
 try{hardAI(dt,a)}catch(e){console.error('[Eldoria] bot difícil',e);return prevAI(dt,a)}
};
window.BotV3={PLAN,chooseSkill,hardAI,opening,windup};
})();
