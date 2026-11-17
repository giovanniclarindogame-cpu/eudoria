'use strict';
/*
 * Clone de Fumaça inteligente (Ninja das Brumas, combate v3):
 *  - não some por tempo: só desaparece ao receber qualquer golpe (ou se o Ninja cair);
 *  - esquiva (dash curto com invulnerabilidade) quando o rival prepara um golpe ou quando vem projétil;
 *  - mantém distância, contorna o rival e ataca quando há brecha (rival se recuperando, travado ou sem guarda);
 *  - usa as habilidades do Ninja, menos o Olho Copiador (e sem criar outros clones), com dano reduzido.
 */
(function(){
if(!window.COMBAT_V3||!window.V3API)return;
const SCALE_BASIC=.5,SCALE_ULT=.42,CD_BASIC=1.5,CD_ULT=14,REACH=100;
const isClone=o=>o&&o.v10Clone&&o.ninja22&&o.v3smart&&o.life>0&&o.hp>0;
// sincronia (js/ninja_v3.js): o clone só ataca logo depois de o Ninja usar uma habilidade
const synced=o=>!window.NINJA_V3_SYNC||clock-(o.owner?.v3atkAt??-9)<=window.NINJA_V3_SYNC;

function foeOf(o){
 const t=opponents(o.owner).filter(e=>e.hp>0&&!e.v10Clone);
 return t.sort((a,b)=>dist(o,a)-dist(o,b))[0]||null;
}
function windupOf(f){const q=f.rwCast;return q?q.age<q.release:(f.cast>0||f.punchTime>0)}
function openingOf(f){const q=f.rwCast;return (q&&q.age>=q.release)||f.actionRecovery>0||f.root>0||f.guardBreak>0||f.hitReact>0}
function incoming(o){
 const list=[...(typeof Reforged!=='undefined'?Reforged.projectiles:[]),...(typeof shots!=='undefined'?shots:[])];
 return list.some(e=>e&&e.life>0&&e.owner&&e.owner.team!==o.team&&Math.hypot(e.x-o.x,e.y-o.y)<110);
}
function proxyFor(o,scale){
 const a=o.owner,proxy=Object.create(a);
 proxy.x=o.x;proxy.y=o.y;proxy.a=o.a;proxy.rwCast=null;proxy.skin=1;proxy.copySource=a;proxy.copyScale=scale;proxy.identity=undefined;proxy.inv=0;proxy.cd=a.cd.map(()=>0);proxy.team=a.team;
 for(const key of ['hp','damage','hits','kills'])Object.defineProperty(proxy,key,{get:()=>a[key],set:v=>{a[key]=v},configurable:true});
 return proxy;
}
function cloneCast(o,slot,foe,scale){
 const a=o.owner,id=a.kit[slot],sk=skills[id];if(!sk)return false;
 const proxy=proxyFor(o,scale),angle=Math.atan2(foe.y-o.y,foe.x-o.x);
 const st=reworkState(proxy);st.value=100;st.eye=0;st.copy=null;
 const q={id,slot,age:0,charge:.7,snapshot:100,stage:2,health:a.hp,angle,duration:sk.duration||.5,release:sk.release||.2,target:rwEnd(proxy,angle,Math.min(sk.range||200,dist(o,foe))),burnStacks:0,spent:0};
 const hp0=a.hp;
 try{rwRelease(proxy,q)}catch(e){console.error('[Eldoria] clone',e);return false}
 a.hp=Math.max(a.hp,Math.min(hp0,a.max));   // o clone nunca tira vida do Ninja
 o.x=proxy.x;o.y=proxy.y;o.proxy=proxy;
 return true;
}
function dodge(o,foe){
 const base=Math.atan2(foe.y-o.y,foe.x-o.x),side=(o.dodgeSide=(o.dodgeSide||1)*-1)>0?1:-1;
 const ang=base+side*Math.PI/2+(Math.random()-.5)*.6;
 o.dodgeA=ang;o.dodgeT=.16;o.inv=.24;o.dodgeCd=1.4;
 ninja22Smoke(o.owner,o.x,o.y);
}

const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(state!=='fight')return;
 for(const o of objects){
  if(!isClone(o))continue;
  const owner=o.owner;
  if(owner.hp<=0){o.life=0;ninja22Smoke(owner,o.x,o.y);continue}
  o.age+=dt;o.inv=Math.max(0,o.inv-dt);o.dodgeCd=Math.max(0,(o.dodgeCd||0)-dt);o.cdB=Math.max(0,(o.cdB??.6)-dt);o.cdU=Math.max(0,(o.cdU??6)-dt);o.think=(o.think||0)-dt;
  if(o.attacks){o.strikeAge+=dt;if(o.strikeAge>.3)o.attacks=0}
  const foe=foeOf(o);if(!foe)continue;
  const d=dist(o,foe),toward=Math.atan2(foe.y-o.y,foe.x-o.x);
  o.a=o.dojoFacingAngle=toward;
  // esquiva em curso
  if(o.dodgeT>0){o.dodgeT-=dt;move(o,Math.cos(o.dodgeA)*430*dt,Math.sin(o.dodgeA)*430*dt);o.moving=true;o.gait=(o.gait||0)+dt*18;continue}
  // pensamento (a cada ~0,1 s)
  if(o.think<=0){
   o.think=.1;
   if(o.dodgeCd<=0&&((windupOf(foe)&&d<280)||incoming(o))&&Math.random()<.75){dodge(o,foe);continue}
   const opening=openingOf(foe);
   const sync=synced(o),canMelee=!o.attacks&&o.cdB<=0&&d<=REACH&&sync&&rwVisible(o,foe);
   if(canMelee&&(opening||Math.random()<(window.NINJA_V3_SYNC?.6:.18))){
    if(cloneCast(o,0,foe,SCALE_BASIC)){o.attacks=1;o.strikeAge=0;o.cdB=CD_BASIC}
   }else if(!o.attacks&&o.cdU<=0&&d<=300&&opening&&sync&&rwVisible(o,foe)){
    if(cloneCast(o,5,foe,SCALE_ULT)){o.attacks=1;o.strikeAge=0;o.cdU=CD_ULT;o.cdB=Math.max(o.cdB,1)}
   }
  }
  // movimento: aproxima quando há brecha, mantém distância e contorna quando não há
  const opening=openingOf(foe);
  let mx=0,my=0,sp=0;
  if(o.attacks){sp=0}
  else if(opening&&d>70){mx=Math.cos(toward);my=Math.sin(toward);sp=200}
  else if(d>220){mx=Math.cos(toward);my=Math.sin(toward);sp=170}
  else if(d<110){mx=-Math.cos(toward);my=-Math.sin(toward);sp=140}
  else{const s=(o.circle=o.circle||(Math.random()<.5?1:-1));mx=Math.cos(toward+s*Math.PI/2);my=Math.sin(toward+s*Math.PI/2);sp=85;if(Math.random()<.01)o.circle=-s}
  o.moving=sp>0;if(sp>0){move(o,mx*sp*dt,my*sp*dt);o.gait=(o.gait||0)+dt*14}
 }
};
// descrição
const cid=CHAMPIONS[1].kit[1];
if(skills[cid]&&!skills[cid].v3clone){skills[cid].desc='Cria um clone de fumaça que luta sozinho: esquiva, contorna o rival e ataca nas brechas com a Lâmina Rápida e o Golpe Trovão, com dano reduzido. Não some pelo tempo: só desaparece ao receber qualquer golpe. Toque de novo para trocar de lugar com ele.';skills[cid].v3clone=true}
window.CloneV3={isClone,foeOf,cloneCast,SCALE_BASIC,SCALE_ULT};
})();
