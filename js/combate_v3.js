'use strict';
/*
 * Combate v3 — cada herói usa 3 habilidades + 1 ultimate + 1 dash próprio.
 *  - Sem ataque normal e sem defesa: a 1ª habilidade (recarga curta, mas não tanto) faz o papel do golpe básico
 *    e o dash (com um instante de invulnerabilidade) faz o papel da esquiva.
 *  - O dash de cada herói é a habilidade de movimento que ele já tinha (a animação vira o dash).
 *  - Layout: o dash no lugar do soco e as habilidades numa meia-lua ao redor dele (a última é a ultimate).
 * Por baixo continuam os kits de 6 posições dos motores de cada herói; esta camada só escolhe o que aparece e funciona.
 * `?legacy=1` volta ao combate antigo (usado por testes que ainda cobrem os motores originais).
 */
(function(){
const LEGACY=/[?&]legacy=1/.test(location.search);
window.COMBAT_V3=!LEGACY;
if(LEGACY)return;
document.body.classList.add('v3');
// reforço: o mesmo CSS também entra por aqui, para o layout nunca depender de um arquivo .css antigo em cache
{const st=document.createElement('style');st.id='v3css';st.textContent="/* Combate v3: dash no lugar do soco, habilidades em meia-lua ao redor dele */\nbody.v3 #battle{--atk:72px;--skill-size:50px;--edge:72px}\nbody.v3 #battle .action-group #dodge,body.v3 #battle .action-group #defend,body.v3 #battle .control-tip{display:none!important}\nbody.v3 #battle .control-center{right:calc(var(--edge) + var(--atk)/2)!important;bottom:calc(max(12px,env(safe-area-inset-bottom)) + var(--atk)/2)!important;width:0!important;height:0!important;padding:0!important;background:none!important;border:0!important}\nbody.v3 #battle .equipped{display:block!important;position:absolute!important;left:0;top:0;width:0;height:0}\nbody.v3 #battle .equipped .skill{position:absolute!important;left:calc(var(--dx,0px) - var(--skill-size)/2)!important;top:calc(var(--dy,0px) - var(--skill-size)/2)!important;margin:0!important}\nbody.v3 #battle .equipped .skill[data-arc=\"3\"]{width:56px!important;height:56px!important;left:calc(var(--dx,0px) - 28px)!important;top:calc(var(--dy,0px) - 28px)!important;box-shadow:0 0 12px var(--c,#e8c787)}\nbody.v3 #battle .equipped .skill.v3-hidden{display:none!important}\nbody.v3 #battle .equipped .skill.v3-swap::after{content:\"TROCAR\";position:absolute;inset:auto 0 -2px;font-size:8px;font-weight:800;text-align:center;color:#fff;text-shadow:0 1px 3px #000}\nbody.v3 #battle .action-group #attack.v3-dash{position:relative;overflow:hidden}\nbody.v3 #battle #attack.v3-dash .v3-cd{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;text-shadow:0 1px 4px #000;pointer-events:none}\nbody.v3 #battle #attack.v3-dash.cooling{filter:saturate(.5) brightness(.75)}\nbody.v3 #battle #attack.v3-dash .skill-art{position:absolute!important;inset:3px!important;width:auto!important;height:auto!important;display:block!important;border-radius:50%;background-size:cover!important;background-position:center!important}\nbody.v3 #battle #attack.v3-dash small{position:absolute;left:0;right:0;bottom:3px;z-index:2;text-shadow:0 1px 3px #000,0 0 4px #000}\nbody.v3 #battle #attack.v3-dash .v3-arrow{display:flex!important;align-items:center;justify-content:center;background:radial-gradient(circle,#3a4663,#1b2236)!important}\nbody.v3 #battle #attack.v3-dash .v3-arrow svg{width:50%;height:50%;color:#e8c787}\nbody.v3 #battle #arenaZoom{display:none!important}\n\n/* v3.1: habilidade 1 no centro (grande), dash pequeno no alto à esquerda, 2, 3 e ultimate em meia-lua */\nbody.v3 #battle .action-group{right:calc(var(--edge) + var(--atk)/2)!important;bottom:calc(max(12px,env(safe-area-inset-bottom)) + var(--atk)/2)!important;width:0!important;height:0!important;display:block!important;padding:0!important}\nbody.v3 #battle .action-group #attack.v3-dash{position:absolute!important;width:44px!important;height:44px!important;left:calc(var(--dx,0px) - 22px)!important;top:calc(var(--dy,0px) - 22px)!important;margin:0!important;order:0}\nbody.v3 #battle #attack.v3-dash small{font-size:7px!important;bottom:1px}\nbody.v3 #battle #attack.v3-dash .v3-cd{font-size:12px}\nbody.v3 #battle .equipped .skill[data-arc=\"0\"]{width:var(--atk)!important;height:var(--atk)!important;left:calc(var(--atk)/-2)!important;top:calc(var(--atk)/-2)!important}\n\n/* posição e tamanho personalizáveis (v3 editável) */\nbody.v3 #battle #equipped .skill{--s:var(--sz,var(--skill-size));width:var(--s)!important;height:var(--s)!important;left:calc(var(--dx,0px) - var(--s)/2)!important;top:calc(var(--dy,0px) - var(--s)/2)!important}\nbody.v3 #battle #equipped .skill[data-arc=\"0\"]{--s:var(--sz,var(--atk))}\nbody.v3 #battle #equipped .skill[data-arc=\"3\"]{--s:var(--sz,56px)}\nbody.v3 #battle .action-group #attack.v3-dash{--s:var(--sz,34px);width:var(--s)!important;height:var(--s)!important;left:calc(var(--dx,0px) - var(--s)/2)!important;top:calc(var(--dy,0px) - var(--s)/2)!important}\n\n/* anel de ki / Modo Poder (Goku) */\nbody.v3 #battle #equipped .skill .v3-ring{position:absolute;inset:-6px;border-radius:50%;pointer-events:none;background:conic-gradient(#62d6ff calc(var(--pw,0)*360deg),#ffffff22 0);-webkit-mask:radial-gradient(circle,transparent 63%,#000 65%);mask:radial-gradient(circle,transparent 63%,#000 65%)}\nbody.v3 #battle #equipped .skill .v3-ring.power{background:conic-gradient(#ffd34d calc(var(--pw,0)*360deg),#ffffff22 0);filter:drop-shadow(0 0 4px #ffd34d)}\nbody.v3 #battle #equipped.v3-power .skill{box-shadow:0 0 14px 3px #ffd34daa;border-color:#ffd34d}\nbody.v3 #battle #equipped .skill .v3-ring[hidden]{display:none}\n\n/* Ronin Carmesim: retrato um pouco maior para ficar na proporção do Guerreiro Astral e do Ninja das Brumas */\n.hero-card[data-hero-open=\"2\"] .hero-card-art{overflow:hidden}\n#heroDetail .hero-stage img[alt^=\"Ronin\"]{transform:scale(1.08);transform-origin:50% 100%}\n.simple-champion-art img[alt^=\"Ronin\"],.simple-current img[alt^=\"Ronin\"]{transform:scale(1.1);transform-origin:50% 100%}\n";document.head.appendChild(st)}

/* ------------------------------ definição dos kits ------------------------------ */
// s = posições do kit (0..5) usadas como habilidade 1, 2 e 3 (a 1ª é a "principal", de recarga curta); a ultimate é sempre a posição 5.
// dash = posição do kit que vira o dash; 'generico' = herói sem habilidade de movimento (usa um deslize próprio).
const V2={
 0:{s:[0,1,2],dash:3},           // Goku: Rajada Astral · Combo Relâmpago · Onda Concentrada · dash = Salto Estelar
 1:{s:[0,1,4],dash:'kakashi'},   // Kakashi: Lâmina Rápida (corte duplo) · Clone de Fumaça (toque de novo = troca) · Olho Copiador
 2:{s:[0,2,4],dash:3},           // Ronin Carmesim: Corte Rápido · Onda Lunar · Despertar Carmesim · dash = Passo Carmesim
 3:{s:[0,1,2],dash:3},           // Guardião Solar: Lâmina Ígnea · Fera de Brasa · Coluna Solar · dash = Passo do Amanhecer
 4:{s:[0,1,2],dash:'blink'},    // Gojo: Repulsão · Atração · Esfera Rubra · dash = Teleporte livre (a Barreira vira passiva)
 5:{s:[1,0,2],dash:3},           // Gon: Pedra Rápida · Soco Carregado · Vara Giratória · dash = Salto Selvagem
 6:{s:[1,0,2],dash:'generico'}, // Herdeiro: Chute Relâmpago · Impacto Esmeralda · Salto Ricochete · dash = deslize de vento
 7:{s:[0,1,2],dash:3},           // Corsário: Soco Elástico · Rajada Flexível · Estouro Duplo · dash = Catapulta Humana
 8:{s:[0,1,2],dash:3},           // Cavaleiro: Rajada Estelar · Cometa Veloz · Chute Crescente · dash = Investida Galopante
 9:{s:[0,1,3],dash:'generico'}   // Alquimista: Palma Forjadora · Lâmina de Pedra · Muralha Instantânea · dash = deslize
};
// recarga da habilidade principal (substitui o golpe básico): rápida, mas não a ponto de ser a única usada
const PRIMARY_CD={0:2.6,1:1.3,2:1.8,3:1.8,4:2.6,5:1.8,6:1.6,7:1.8,8:1.6,9:1.8};
const CD_MUL={0:1.2,1:.5};   // equilíbrio (simulação Kakashi × Goku)
const DASH_CD=4,DASH_INV=.28,GENERIC_DASH_CD=3.5;
// posições (px, a partir do centro do canto) escolhidas no editor de layout: [dx,dy] por habilidade (1, 2, 3, ultimate) e do dash
const POS=[[42,-20.8],[-87.5,7.4],[-46.1,-60.2],[22.8,-100.3]],DASH_POS=[-20.6,10.7];                 // ângulos (graus) dos 4 botões da meia-lua ao redor do dash
const ARC_R=96;

const isHero=a=>!!a&&!a.boss&&!a.mob&&!a.rmob&&!a.trainingDummy&&Array.isArray(a.kit)&&a.kit.length===6&&!!CHAMPIONS[a.skin]&&a.kit.every((id,i)=>id===CHAMPIONS[a.skin].kit[i]);
const cfg=a=>V2[a.skin];
function setup(){
 for(const c of CHAMPIONS){
  const v=V2[c.id];if(!v)continue;
  const mul=CD_MUL[c.id]||1;
  v.s.slice(1).forEach(i=>{const k=skills[c.kit[i]];if(k)k.cd=+(k.cd*mul).toFixed(2)});{const k=skills[c.kit[5]];if(k)k.cd=+(k.cd*mul).toFixed(2)}
  const primary=skills[c.kit[v.s[0]]];if(primary)primary.cd=PRIMARY_CD[c.id];
  if(typeof v.dash==='number'){const d=skills[c.kit[v.dash]];if(d)d.cd=Math.min(d.cd||DASH_CD,DASH_CD)}
 }
}
setup();
const allowedIds=a=>{const v=cfg(a);if(!v)return null;const s=new Set(v.s.map(i=>a.kit[i]));s.add(a.kit[5]);if(typeof v.dash==='number')s.add(a.kit[v.dash]);return s};
// habilidades que aparecem na meia-lua, na ordem (1ª, 2ª, 3ª, ultimate), como posições do kit
const arcOrder=a=>{const v=cfg(a);return v?[...v.s,5]:[0,1,2,5]};
const dashIdOf=a=>{const v=cfg(a);return v&&typeof v.dash==='number'?a.kit[v.dash]:null};

/* ------------------------------ sem ataque normal e sem defesa ------------------------------ */
const prevBasic=basic;
basic=function(a){if(isHero(a))return false;return prevBasic(a)};
const prevSetGuard=setGuard;
setGuard=function(a,on){if(isHero(a)){if(a)a.guard=false;return false}return prevSetGuard(a,on)};

/* ------------------------------ só as habilidades do kit v3 ------------------------------ */
const prevCast=cast;
let lastToast=0;
cast=function(a,id,manual){
 if(isHero(a)){
  const ok=allowedIds(a);
  if(ok&&!ok.has(id)){
   if(a!==p){                                   // bots: troca por uma habilidade permitida e pronta
    const pool=[...ok].filter(x=>a.cd[x]<=0&&x!==dashIdOf(a)&&skills[x]);
    if(pool.length)return prevCast(a,pool[Math.floor(Math.random()*pool.length)],manual);
   }
   return false;
  }
 }
 return prevCast(a,id,manual);
};

/* ------------------------------ dash ------------------------------ */
function moveAngle(a){
 if(a===p){const m=typeof movement==='function'?movement():null;if(m&&m.len>.25)return Math.atan2(m.y,m.x)}
 return a.a||0;
}
function kakashiDash(a,angle){
 if(a.hp<=0||state!=='fight'||a.cast>0||a.root>0||(a.v3dashCD||0)>0)return false;
 const from={x:a.x,y:a.y};
 rwDash(a,angle,130,.18,()=>{},{slot:3});
 rwFx(a,3,from.x,from.y,'ninja-afterimage',.35,{angle});
 if(typeof ninja22Smoke==='function')ninja22Smoke(a,from.x,from.y);
 a.v3dashCD=DASH_CD;a.inv=Math.max(a.inv,DASH_INV);
 return true;
}
function genericDash(a,angle){
 if(a.hp<=0||state!=='fight'||a.cast>0||a.root>0||(a.v3dashCD||0)>0)return false;
 const from={x:a.x,y:a.y};
 rwDash(a,angle,170,.2,()=>{},{slot:3});
 rwFx(a,3,from.x,from.y,'ninja-afterimage',.3,{angle});
 a.v3dashCD=GENERIC_DASH_CD;a.inv=Math.max(a.inv,DASH_INV);
 try{
  if(a.skin===6){   // Herdeiro: rajada de vento que empurra quem está perto do ponto de saída
   for(const t of opponents(a)){if(t.hp<=0)continue;if(dist(t,from)<110){const g=Math.atan2(t.y-from.y,t.x-from.x);move(t,Math.cos(g)*70,Math.sin(g)*70);t.slow=Math.max(t.slow||0,.6)}}
   rwFx(a,3,from.x,from.y,'cast',.45,{size:150});
  }
  if(a.skin===9)rwLater(a,.25,()=>{if(a.hp>0)rwCreateBlock(a,from.x,from.y,false,angle)});   // Alquimista: deixa um bloco de pedra para trás
 }catch(e){console.error('[Eldoria] dash com identidade',e)}
 return true;
}
function blinkDash(a,angle){
 if(a.hp<=0||state!=='fight'||a.cast>0||a.root>0||(a.v3dashCD||0)>0)return false;
 if(!originalBlink(a,angle,220))return false;
 a.v3dashCD=DASH_CD;a.inv=Math.max(a.inv,DASH_INV);
 if(a===p){   // o teleporte levanta a Barreira Cósmica por 1,6 s (precisa de 50 de energia e barreira inteira)
  const st=reworkState(a);
  if(st.barrierBroken<=0&&st.barrierEnergy>=50){st.barrier=true;st.v3BarrierT=1.6;st.barrierHit=clock;rwFx(a,4,a.x,a.y,'cast',.4,{follow:true});if(!window.__barTip){window.__barTip=true;toast('O teleporte levanta a Barreira Cósmica por 1,6 s')}}
 }
 return true;
}
function doDash(a){
 if(!a||!isHero(a))return false;
 const v=cfg(a);if(!v)return false;
 const angle=moveAngle(a);
 if(v.dash==='kakashi')return kakashiDash(a,angle);
 if(v.dash==='generico')return genericDash(a,angle);
 if(v.dash==='blink')return blinkDash(a,angle);
 const id=dashIdOf(a);if(id==null)return false;
 if(a.cd[id]>0||a.cast>0){return false}
 const ok=prevCast(a,id,angle);
 if(ok)a.inv=Math.max(a.inv,DASH_INV);
 return ok;
}
window.v3Dash=doDash;
const prevDodge=dodge;
dodge=function(a){return isHero(a)?doDash(a):prevDodge(a)};
// recarga do dash dos heróis com dash próprio
function dashCooldown(a){const v=cfg(a);if(!v)return 0;if(typeof v.dash==='string')return a.v3dashCD||0;const id=dashIdOf(a);return id==null?0:(a.cd[id]||0)}
function dashTotal(a){const v=cfg(a);if(!v)return 1;if(v.dash==='kakashi')return DASH_CD;if(v.dash==='generico')return GENERIC_DASH_CD;if(v.dash==='blink')return DASH_CD;const id=dashIdOf(a);return id==null?1:(skills[id].cd||DASH_CD)}

/* ------------------------------ Kakashi: clone troca de lugar ao tocar de novo; Olho Copiador não copia ultimate ------------------------------ */
function kakashiSwap(a){
 if(!a||a.skin!==1||!isHero(a)||a.hp<=0||state!=='fight'||a.root>0)return false;
 const clone=typeof originalClone==='function'?originalClone(a):null;if(!clone)return false;
 if(dist(a,clone)>340||!originalFreePoint(a,clone.x,clone.y))return false;
 const from={x:a.x,y:a.y};
 a.x=clone.x;a.y=clone.y;clone.x=from.x;clone.y=from.y;a.inv=Math.max(a.inv,.25);
 if(typeof ninja22Smoke==='function'){ninja22Smoke(a,from.x,from.y);ninja22Smoke(a)}
 return true;
}
const hasClone=a=>a&&a.skin===1&&typeof originalClone==='function'&&!!originalClone(a);
// toque na habilidade do clone enquanto o clone existe (mesmo em recarga) = troca de lugar
const prevCast2=cast;
cast=function(a,id,manual){
 if(isHero(a)&&a.skin===1&&id===a.kit[1]&&hasClone(a)&&kakashiSwap(a))return true;
 return prevCast2(a,id,manual);
};

/* ------------------------------ Goku: ki sobe ao usar habilidades; no máximo vira Modo Poder por um tempo ------------------------------ */
const KI_GAIN={0:6,1:7,2:8,3:3.5,5:13},POWER_TIME=4;
const gokuState=a=>reworkState(a);
function gokuGain(a,n){
 const s=gokuState(a);if(s.powerT>0)return;
 s.value=clamp(s.value+n,0,100);
 if(s.value>=100){s.powerT=POWER_TIME;s.stage=2;rwFx(a,4,a.x,a.y,'astral-awaken',.55,{stage:2,follow:true});if(a===p)toast('MODO PODER! Suas habilidades ficaram mais fortes')}
}
const prevGainKi=originalGainKi;
originalGainKi=function(a,n){if(isHero(a)&&a.skin===0){gokuGain(a,n*.2);return}return prevGainKi(a,n)};   // golpes dados/recebidos dão só um pouco
const prevReason=rwResourceReason;
rwResourceReason=function(a,slot){if(isHero(a)&&a.skin===0)return '';return prevReason(a,slot)};   // habilidades do Goku não gastam ki
const prevReason2=rwResourceReason;
rwResourceReason=function(a,slot){if(isHero(a)&&a.skin===8&&slot===3)return '';return prevReason2(a,slot)};   // o dash do Cavaleiro não gasta energia
const prevCommit=rwCommit;
rwCommit=function(a,q){
 if(isHero(a)&&a.skin===0){const s=gokuState(a),v0=s.value,st=s.stage;prevCommit(a,q);s.value=v0;s.stage=st;gokuGain(a,KI_GAIN[q.slot]||0);if(s.powerT>0)q.stage=2;return}
 if(isHero(a)&&a.skin===8&&q.slot===3){const st=reworkState(a),v0=st.value;prevCommit(a,q);st.value=v0;return}
 return prevCommit(a,q);
};
const prevBeginCharge=rwBeginCharge;
rwBeginCharge=function(a,angle,slot){if(isHero(a)&&a.skin===0&&slot===4)return false;return prevBeginCharge(a,angle,slot)};
const prevAstralStage=reworkState;

/* ------------------------------ passo: recarga do dash, Modo Poder do Goku, Barreira passiva do Gojo ------------------------------ */
const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(state!=='fight')return;
 for(const a of actors){
  if(!isHero(a)||a.hp<=0)continue;
  if(a.v3dashCD>0)a.v3dashCD=Math.max(0,a.v3dashCD-dt);
  if(a.skin===0){
   const s=gokuState(a);
   if(s.powerT>0){s.powerT-=dt;s.value=clamp(100*s.powerT/POWER_TIME,0,100);s.stage=2;if(s.powerT<=0){s.powerT=0;s.value=0;s.stage=0;rwFx(a,4,a.x,a.y,'astral-aura-end',.3,{stage:0})}}
   else if(s.stage!==0)s.stage=0;
  }
  if(a.skin===4){
   const s=reworkState(a);
   if(a!==p){   // rivais controlados pelo computador mantêm a barreira passiva (equilíbrio da simulação)
    if(!s.barrier&&(s.barrierBroken||0)<=0&&(s.barrierEnergy||0)>=50){s.barrier=true;rwFx(a,4,a.x,a.y,'cast',.4,{follow:true})}
   }else if(s.v3BarrierT>0){   // jogador: a Barreira Cósmica dura pouco e é levantada pelo dash
    s.v3BarrierT-=dt;
    if(s.v3BarrierT<=0){s.v3BarrierT=0;if(s.barrier){s.barrier=false;rwFx(a,4,a.x,a.y,'cast',.3,{follow:true})}}
   }else if(s.barrier)s.barrier=false;
  }
 }
};
// a barra de Ki do HUD mostra o Modo Poder
const prevResourceHud=typeof identityResourceView==='function'?identityResourceView:null;

/* ------------------------------ interface: dash no lugar do soco e habilidades em meia-lua ------------------------------ */
function layout(){
 if(!p||!isHero(p)||!cfg(p))return;
 const eq=document.getElementById('equipped'),btns=[...eq.querySelectorAll('.skill')];
 const order=arcOrder(p);
 btns.forEach((el,i)=>{
  const pos=order.indexOf(i);
  el.hidden=pos<0;el.classList.toggle('v3-hidden',pos<0);
  if(pos>=0){
   const q=POS[pos];
   el.style.setProperty('--dx',q[0]+'px');
   el.style.setProperty('--dy',q[1]+'px');
   el.dataset.arc=String(pos);
   const hk=el.querySelector('.hotkey');if(hk)hk.textContent=pos===3?'ULT':String(pos+1);
  }
 });
 // botão de dash (o antigo botão de soco)
 const old=document.getElementById('attack');
 if(old&&!old.dataset.v3){
  const b=old.cloneNode(false);b.id='attack';b.dataset.v3='1';b.className='action v3-dash';b.setAttribute('aria-label','Dash');
  old.replaceWith(b);
  b.addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='fight'||!p)return;if(!doDash(p)&&state==='fight'){const cd=dashCooldown(p);if(cd>0)toast('Dash em recarga: '+cd.toFixed(1)+'s')}});
 }
 const d=document.getElementById('attack');
 d.style.setProperty('--dx',DASH_POS[0]+'px');d.style.setProperty('--dy',DASH_POS[1]+'px');
 const id=dashIdOf(p),vis=id!=null?id:(p.skin===1||p.skin===4||p.skin===6?p.kit[3]:null);
 d.innerHTML=(vis!=null?icon(vis):'<span class="skill-art v3-arrow"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 20l9-9 4 4 9-9M19 6h8v8"/></svg></span>')+'<small>DASH</small><span class="v3-cd" aria-hidden="true"></span>';
 d.dataset.hero=String(p.skin);
}
function refresh(){
 if(!p||!isHero(p))return;
 const d=document.getElementById('attack');if(!d||!d.dataset.v3)return;
 const cd=dashCooldown(p),tot=dashTotal(p);
 const lb=d.querySelector('small');if(lb&&lb.textContent!=='DASH')lb.textContent='DASH';
 d.classList.toggle('cooling',cd>0);d.style.setProperty('--cd',tot>0?String(clamp(cd/tot,0,1)):'0');
 const t=d.querySelector('.v3-cd');if(t)t.textContent=cd>0?(cd<10?cd.toFixed(1):Math.ceil(cd)):'';
 arcOrder(p).forEach((slot,pos)=>{const hk=document.querySelectorAll('#equipped .skill')[slot]?.querySelector('.hotkey');const t=pos===3?'ULT':String(pos+1);if(hk&&hk.textContent!==t)hk.textContent=t});
 // Kakashi: com clone na tela, a habilidade 2 mostra TROCAR
 const eq=document.getElementById('equipped');
 const el=eq&&eq.querySelectorAll('.skill')[1];
 if(el&&p.skin===1){const sw=hasClone(p);el.classList.toggle('v3-swap',sw)}
}
window.V3Relayout=()=>{try{layout()}catch{}};
const prevStart=start;
start=function(){
 const r=prevStart.apply(this,arguments);
 try{layout();0}catch(e){console.error('[Eldoria] layout v3',e)}
 return r;
};
const prevUI=updateUI;
updateUI=function(){prevUI();try{refresh()}catch{}};
document.addEventListener('keydown',e=>{
 if(e.repeat||state!=='fight'||!p)return;
 if(e.code==='Space'||e.code==='ShiftLeft'){e.stopImmediatePropagation();e.preventDefault();doDash(p)}
 if(e.code==='KeyJ'||e.code==='KeyK')e.stopImmediatePropagation();
 if(isHero(p)&&cfg(p)&&/^Digit[1-6]$/.test(e.code)){e.stopImmediatePropagation();const n=+e.code.slice(5);if(n<=4)cast(p,p.kit[arcOrder(p)[n-1]],aim(p))}
},true);
// Kakashi: tocar na habilidade do clone com um clone ativo troca de lugar, mesmo em recarga (captura antes do botão normal)
document.getElementById('equipped')?.addEventListener('pointerdown',e=>{
 if(state!=='fight'||!p||p.skin!==1||!isHero(p))return;
 const el=e.target.closest('.skill');if(!el)return;
 const i=[...document.querySelectorAll('#equipped .skill')].indexOf(el);
 if(i===1&&hasClone(p)&&kakashiSwap(p)){e.stopPropagation();e.preventDefault()}
},true);

// mira mais sensível: o botão fica perto da borda, então basta arrastar pouco
document.getElementById('equipped')?.addEventListener('pointerdown',()=>{if(aimGesture)aimGesture.stickRadius=Math.min(aimGesture.stickRadius||46,44)});
// textos
const pauseP=document.querySelector('#pause .dialog p');
if(pauseP)pauseP.textContent='O dash (botão grande) tem um instante de invulnerabilidade. As habilidades ficam em meia-lua ao redor dele: a 1ª é a mais rápida, a última é a ultimate. Arraste uma habilidade para escolher a direção.';
window.V3API={V2,PRIMARY_CD,allowedIds,arcOrder,dashIdOf,doDash,kakashiSwap,hasClone,isHero,POWER_TIME,KI_GAIN,DASH_CD};
})();
