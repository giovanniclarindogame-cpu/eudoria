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

/* ---------- o clone IMITA o Ninja ----------
 * Anda junto (mesmo deslocamento, mantendo o afastamento do início), olha para onde o Ninja mira, repete as esquivas/dashes e, quando o Ninja
 * usa a Lâmina Rápida ou o Golpe Trovão, o clone usa a mesma na mesma direção (dano reduzido). Para os rivais ele é igual ao Ninja (mesmo desenho,
 * mesma barra de vida); para o dono ele aparece meio transparente, só para não se perder. */
const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(state!=='fight')return;
 for(const o of objects){
  if(!isClone(o))continue;
  const owner=o.owner;
  if(owner.hp<=0){o.life=0;ninja22Smoke(owner,o.x,o.y);continue}
  o.age+=dt;o.inv=Math.max(0,o.inv-dt);o.cdB=Math.max(0,(o.cdB??.6)-dt);o.cdU=Math.max(0,(o.cdU??6)-dt);
  if(o.attacks){o.strikeAge+=dt;if(o.strikeAge>.3)o.attacks=0}
  // afastamento em relação ao Ninja (lado do início; se nasceu colado, vai para a direita de quem olha)
  if(!o.off){let ox=o.x-owner.x,oy=o.y-owner.y;if(Math.hypot(ox,oy)<45){const an=owner.a+Math.PI/2;ox=Math.cos(an)*85;oy=Math.sin(an)*85}o.off={x:ox,y:oy};o.px=owner.x;o.py=owner.y}
  // anda o mesmo que o Ninja andou neste passo (inclui dashes), e depois volta suavemente ao afastamento certo se algo travou o caminho
  const dx=owner.x-o.px,dy=owner.y-o.py;o.px=owner.x;o.py=owner.y;
  if(Math.hypot(dx,dy)>.01)move(o,dx,dy);
  const ex=owner.x+o.off.x-o.x,ey=owner.y+o.off.y-o.y,er=Math.hypot(ex,ey);
  if(er>8){const k=Math.min(er,260*dt)/er;move(o,ex*k,ey*k)}
  if(er>230){o.x=owner.x+o.off.x*.6;o.y=owner.y+o.off.y*.6}   // ficou muito para trás (teleporte, troca de lugar): reaparece perto
  // aparência: copia a pose do Ninja
  const mirrorAng=owner.a;o.a=o.dojoFacingAngle=mirrorAng;
  o.moving=!!(owner.moving||Math.hypot(dx,dy)>.3);o.gait=owner.gait;o.guard=owner.guard;o.dodgeTime=owner.dodgeTime;o.dash=owner.dash;o.dodgeA=owner.dodgeA;
  // repete o golpe: o mesmo botão que o Ninja usou, na mesma direção
  const seq=owner.v3atkSeq||0;
  if(seq!==o.seenSeq){
   o.seenSeq=seq;const slot=owner.v3atkSlot,ang=owner.v3atkAng??owner.a;
   if(!o.attacks&&(slot===0&&o.cdB<=0||slot===5&&o.cdU<=0)){
    const foe=foeOf(o);
    let ang2=ang;
    // rival por perto: o clone avança um pouco e corta na direção dele (senão o golpe sairia no vazio, ao lado do Ninja)
    if(foe&&dist(o,foe)<230){ang2=Math.atan2(foe.y-o.y,foe.x-o.x);const lunge=Math.max(0,Math.min(75,dist(o,foe)-62));if(lunge>1)move(o,Math.cos(ang2)*lunge,Math.sin(ang2)*lunge)}
    if(cloneCast(o,slot,foe,slot===5?SCALE_ULT:SCALE_BASIC,ang2)){o.attacks=1;o.strikeAge=0;if(slot===5){o.cdU=CD_ULT;o.cdB=Math.max(o.cdB,1)}else o.cdB=CD_BASIC}
   }
  }
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
if(skills[cid]&&!skills[cid].v3clone){skills[cid].desc='Cria um clone de fumaça que IMITA você: anda junto, mira para onde você mira e repete a Lâmina Rápida e o Golpe Trovão, com dano reduzido. Os rivais o veem igual a você; para você ele fica meio transparente. Não some pelo tempo: só desaparece ao receber qualquer golpe. Toque de novo para trocar de lugar com ele.';skills[cid].v3clone=true}
window.CloneV3={isClone,foeOf,cloneCast,SCALE_BASIC,SCALE_ULT};
})();
