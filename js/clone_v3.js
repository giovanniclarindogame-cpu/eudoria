'use strict';
/*
 * Clone de Fumaça inteligente (Ninja das Brumas, combate v3):
 *  - não some por tempo: só desaparece ao receber qualquer golpe (ou se o Ninja cair);
 *  - esquiva (dash curto com invulnerabilidade) quando o rival prepara um golpe ou quando vem projétil;
 *  - mantém distância, contorna o rival e ataca quando há brecha (rival se recuperando, travado ou sem guarda);
 *  - usa as habilidades do Ninja (Lâmina Rápida, Golpe Trovão, Leitura, esquiva), sem criar outros clones, com dano reduzido;
 *  - cabeça própria: ver "o clone PENSA sozinho" mais abaixo.
 */
(function(){
if(!window.COMBAT_V3||!window.V3API)return;
const SCALE_BASIC=.34,SCALE_ULT=.28,CD_BASIC=1.9,CD_ULT=18,REACH=100;
const isClone=o=>o&&o.v10Clone&&o.ninja22&&o.v3smart&&o.life>0&&o.hp>0;

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
function cloneCast(o,slot,foe,scale,ang){
 const a=o.owner,id=a.kit[slot],sk=skills[id];if(!sk)return false;
 const proxy=proxyFor(o,scale),angle=Number.isFinite(ang)?ang:Math.atan2(foe.y-o.y,foe.x-o.x);
 const st=reworkState(proxy);st.value=100;st.eye=0;st.copy=null;
 const q={id,slot,age:0,charge:.7,snapshot:100,stage:2,health:a.hp,angle,duration:sk.duration||.5,release:sk.release||.2,target:rwEnd(proxy,angle,Math.min(sk.range||200,foe?dist(o,foe):(sk.range||200))),burnStacks:0,spent:0};
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

/* ---------- o clone PENSA sozinho (bot difícil) ----------
 * Tem cabeça própria e todas as mecânicas do Ninja, com dano reduzido:
 *  - ESQUIVA: dash curto invulnerável quando o rival prepara um golpe ou vem projétil;
 *  - LEITURA (Olho Copiador): quando um golpe está prestes a sair, some na fumaça, reaparece ATRÁS do rival e corta na hora (PELAS COSTAS: +25% e atordoa 0,35 s);
 *  - LÂMINA RÁPIDA nas brechas (rival se recuperando, travado ou sem guarda) e de vez em quando para pressionar; GOLPE TROVÃO (ultimate) quando há brecha;
 *  - POSIÇÃO: flanqueia (vai para o lado oposto do rival em relação ao Ninja, abrindo duas frentes), contorna e mantém distância quando as habilidades estão em recarga;
 *  - fica sempre a até TETHER do Ninja, para a TROCA DE LUGAR (tocar de novo na habilidade) estar sempre ao alcance.
 * Morre com QUALQUER golpe (e some se o Ninja cair). Não cria outros clones. Para os rivais é igual ao Ninja; para o dono fica meio transparente.
 */
const TETHER=270,SCALE_BACK=1.25,BACK_STUN=.35,CD_EYE=9;
function freePt(o,x,y){return typeof originalFreePoint==='function'?originalFreePoint(o,x,y):true}
function strike(o,foe,slot,scale,ang){
 // avança um pouco e corta na direção do rival (senão o golpe sairia no vazio)
 let a2=Number.isFinite(ang)?ang:Math.atan2(foe.y-o.y,foe.x-o.x);
 if(dist(o,foe)<230){a2=Math.atan2(foe.y-o.y,foe.x-o.x);const lunge=Math.max(0,Math.min(75,dist(o,foe)-62));if(lunge>1)move(o,Math.cos(a2)*lunge,Math.sin(a2)*lunge)}
 const back=clock<=(o.backUntil??-9)&&slot===0;
 const ok=cloneCast(o,slot,foe,scale*(back?SCALE_BACK:1),a2);
 if(ok){
  o.attacks=1;o.strikeAge=0;o.a=o.dojoFacingAngle=a2;
  if(slot===5){o.cdU=CD_ULT;o.cdB=Math.max(o.cdB,1)}else o.cdB=CD_BASIC;
  if(back){o.backUntil=0;foe.root=Math.max(foe.root||0,BACK_STUN);try{rwCancelCharge(foe)}catch{}try{float(foe.x,foe.y-78,'PELAS COSTAS!','#bfe8ff')}catch{}}
 }
 return ok;
}
function readTeleport(o,foe){   // LEITURA: some e reaparece atrás do rival, já com o golpe pelas costas pronto
 const from={x:o.x,y:o.y},ang=Math.atan2(foe.y-o.y,foe.x-o.x);
 const spots=[[foe.x+Math.cos(ang)*54,foe.y+Math.sin(ang)*54],[foe.x+Math.cos(ang+1.2)*58,foe.y+Math.sin(ang+1.2)*58],[foe.x+Math.cos(ang-1.2)*58,foe.y+Math.sin(ang-1.2)*58]];
 for(const [x,y] of spots)if(freePt(o,x,y)){
  o.x=x;o.y=y;o.inv=Math.max(o.inv,.3);o.eyeCd=CD_EYE;o.backUntil=clock+1.2;o.a=o.dojoFacingAngle=Math.atan2(foe.y-o.y,foe.x-o.x);
  try{ninja22Smoke(o.owner,from.x,from.y);ninja22Smoke(o.owner,o.x,o.y)}catch{}
  return true;
 }
 return false;
}
const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(state!=='fight')return;
 for(const o of objects){
  if(o&&o.v10Clone&&o.ninja22&&o.v3smart&&o.life>0&&o.hp>0&&o.hp<o.max-1e-6){o.hp=0;o.life=0;try{ninja22Smoke(o.owner,o.x,o.y)}catch{}continue}   // QUALQUER golpe mata o clone (mesmo com a defesa reduzindo o dano a quase nada)
  if(!isClone(o))continue;
  const owner=o.owner;
  if(owner.hp<=0){o.life=0;ninja22Smoke(owner,o.x,o.y);continue}
  o.age+=dt;o.inv=Math.max(0,o.inv-dt);o.dodgeCd=Math.max(0,(o.dodgeCd||0)-dt);o.eyeCd=Math.max(0,(o.eyeCd??3)-dt);
  o.cdB=Math.max(0,(o.cdB??.6)-dt);o.cdU=Math.max(0,(o.cdU??6)-dt);o.think=(o.think||0)-dt;o.guard=false;
  if(o.attacks){o.strikeAge+=dt;if(o.strikeAge>.3)o.attacks=0}
  const foe=foeOf(o),dOwner=dist(o,owner);
  // esquiva em curso
  if(o.dodgeT>0){o.dodgeT-=dt;o.dodgeTime=o.dodgeT;move(o,Math.cos(o.dodgeA)*430*dt,Math.sin(o.dodgeA)*430*dt);o.moving=true;o.gait=(o.gait||0)+dt*18;continue}
  o.dodgeTime=0;
  if(!foe){   // sem rival: acompanha o Ninja
   const ex=owner.x+Math.cos(owner.a+Math.PI/2)*80-o.x,ey=owner.y+Math.sin(owner.a+Math.PI/2)*80-o.y,er=Math.hypot(ex,ey);
   o.moving=er>8;if(er>8){const k=Math.min(er,200*dt)/er;move(o,ex*k,ey*k);o.gait=(o.gait||0)+dt*12}o.a=o.dojoFacingAngle=owner.a;continue;
  }
  const d=dist(o,foe),toward=Math.atan2(foe.y-o.y,foe.x-o.x);
  o.a=o.dojoFacingAngle=toward;
  // pensamento (a cada ~0,1 s)
  if(o.think<=0){
   o.think=.1;
   const wind=windupOf(foe),q=foe.rwCast,soon=q&&!q.holding&&q.age<q.release&&q.release-q.age<.3;
   // 1) LEITURA: o golpe está quase saindo e o olho está pronto
   if(o.eyeCd<=0&&soon&&d<260&&Math.random()<.7&&readTeleport(o,foe)){strike(o,foe,0,SCALE_BASIC);continue}
   // 2) ESQUIVA
   if(o.dodgeCd<=0&&((wind&&d<280)||incoming(o))&&Math.random()<.85){dodge(o,foe);continue}
   // 3) ataques (só se não está longe demais do Ninja: a troca de lugar precisa continuar possível)
   const opening=openingOf(foe),perto=dOwner<TETHER+50;
   if(!o.attacks&&perto&&rwVisible(o,foe)){
    if(o.cdB<=0&&d<=REACH&&(opening||Math.random()<.35))strike(o,foe,0,SCALE_BASIC);
    else if(o.cdU<=0&&d<=300&&opening)strike(o,foe,5,SCALE_ULT);
   }
  }
  // movimento
  const opening=openingOf(foe);
  let mx=0,my=0,sp=0;
  if(o.attacks)sp=0;
  else if(dOwner>TETHER){const a2=Math.atan2(owner.y-o.y,owner.x-o.x);mx=Math.cos(a2);my=Math.sin(a2);sp=230}   // preso à corrente: volta para perto do Ninja
  else if(opening&&d>70){mx=Math.cos(toward);my=Math.sin(toward);sp=210}                                         // brecha: avança
  else if(o.cdB<.4&&d>REACH-20){   // quase pronto: flanqueia pelo lado oposto ao do Ninja
   const bx=foe.x-owner.x,by=foe.y-owner.y,bl=Math.hypot(bx,by)||1;
   const tx=foe.x+bx/bl*95,ty=foe.y+by/bl*95,ang=Math.atan2(ty-o.y,tx-o.x);
   mx=Math.cos(ang);my=Math.sin(ang);sp=d>170?190:150;
  }else if(d>230){mx=Math.cos(toward);my=Math.sin(toward);sp=170}
  else if(d<115){mx=-Math.cos(toward);my=-Math.sin(toward);sp=150}
  else{const sd=(o.circle=o.circle||(Math.random()<.5?1:-1));mx=Math.cos(toward+sd*Math.PI/2);my=Math.sin(toward+sd*Math.PI/2);sp=95;if(Math.random()<.012)o.circle=-sd}
  o.moving=sp>0;if(sp>0){move(o,mx*sp*dt,my*sp*dt);o.gait=(o.gait||0)+dt*14}
  if(dOwner>TETHER+90){const a3=Math.atan2(o.y-owner.y,o.x-owner.x);o.x=owner.x+Math.cos(a3)*(TETHER+40);o.y=owner.y+Math.sin(a3)*(TETHER+40)}   // nunca passa do alcance da troca
 }
};
// para quem não é o dono, o clone também mostra a barra de vida do Ninja sobre a cabeça (idêntico a ele)
const prevDepthC=integratedDepth;
integratedDepth=function(){
 const list=prevDepthC();
 for(const o of objects){
  if(!isClone(o)||o.owner===p||o.owner.hp<=0)continue;
  const a=o.owner;
  list.push({kind:'v3-bar',y:99990+o.y*.001,priority:8,paint(){
   const f=Math.max(0,Math.min(1,a.hp/a.max)),ally=a.team===p.team,w=46,x=o.x-w/2,y=o.y-62;
   ctx.save();ctx.fillStyle='#000a';ctx.fillRect(x-1,y-1,w+2,7);ctx.fillStyle='#2a1417';ctx.fillRect(x,y,w,5);
   ctx.fillStyle=f<=.25?'#ff5348':ally?'#59d98e':'#ee5c5c';ctx.fillRect(x,y,w*f,5);ctx.restore();
  }});
 }
 return list.sort((u,v)=>u.y-v.y||(u.priority||0)-(v.priority||0));
};
// descrição
const cid=CHAMPIONS[1].kit[1];
if(skills[cid]&&!skills[cid].v3clone){skills[cid].desc='Cria um clone de fumaça que LUTA SOZINHO (bot difícil): esquiva, flanqueia, ataca nas brechas e usa a Leitura para surgir às costas de quem vai atacar, com dano reduzido. Para os rivais ele é igual a você. Morre com qualquer golpe. Toque de novo para TROCAR DE LUGAR com ele quantas vezes quiser: o próximo golpe sai PELAS COSTAS (+25% e atordoa).';skills[cid].v3clone=true}
window.CloneV3={isClone,foeOf,cloneCast,SCALE_BASIC,SCALE_ULT};
})();
