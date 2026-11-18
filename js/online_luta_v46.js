'use strict';
/*
 * Online v46 — a luta 1×1 entre os dois jogadores da sala (etapa 2).
 *  - QUEM CRIOU A SALA MANDA NA LUTA (anfitrião): o jogo dele roda a luta de verdade. Nele, o campeão do amigo é o "b"
 *    (sem o computador controlando), movido pelos comandos que chegam do outro aparelho.
 *  - O AMIGO roda a mesma luta "de espelho": ele controla o próprio campeão normalmente (resposta imediata na tela dele) e
 *    recebe do anfitrião ~20 vezes por segundo a posição, a vida, a energia, a stamina e as recargas dos dois (o anfitrião é
 *    quem vale; a vida só muda pelo que chega de lá).
 *  - AÇÕES: golpe, habilidades (com a direção usada), carga/soltura, esquiva e dash de cada um são repetidos no outro aparelho,
 *    para os efeitos aparecerem nas duas telas. Toques especiais que os pacotes dos heróis tratam por dentro (troca do clone do
 *    Ninja, puxada do Corsário, detonar a esfera do Eclipse) não são repetidos: o resultado (posição/vida) chega certo, só o
 *    efeito pode não aparecer na tela do outro.
 *  - O mapa sai igual nos dois (mesma semente de sorteio no início). Sem pausa durante a luta online.
 *  - Fim: só o anfitrião decide (nocaute ou tempo) e avisa o amigo; cada um vê o próprio resultado e ganha as moedas e o XP de
 *    um duelo. "Revanche"/"Trocar" voltam para a sala; "Sair" sai da sala.
 * Mensagens: go (início), in (comandos do amigo, 30/s), snap (estado, 20/s), act (ação), end (fim).
 */
(function(){
const O=window.OnlineV45;if(!O)return;
const S=O.state,$q=s=>document.querySelector(s);
const M={on:false,role:null,remote:null,host:null,guest:null,input:{x:0,y:0,l:0,a:0,g:0},snapT:0,inT:0,roundDone:false,force:false,depth:0,target:null,acts:0};
const r3=v=>Math.round(v*1000)/1000,r1=v=>Math.round(v*10)/10;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- início ---------- */
function hostGo(){
 if(!S.conn||!S.them)return;
 const seed=crypto.getRandomValues(new Uint32Array(1))[0]|0;
 const m={t:'go',seed,hh:S.me.hero,gh:S.them.hero};
 O.send(m);begin('host',m);
}
function begin(role,m){
 clearInterval(S.count);
 const ok=id=>Number.isInteger(id)&&CHAMPIONS[id];
 const mine=role==='host'?m.hh:m.gh,foe=role==='host'?m.gh:m.hh;
 if(!ok(mine)||!ok(foe))return;
 const ov=$q('#onlineV45');if(ov)ov.hidden=true;document.body.classList.remove('v45-open');
 Object.assign(M,{on:true,role,roundDone:false,force:false,target:null,snapT:0,inT:0,input:{x:0,y:0,l:0,a:0,g:0},acts:0});
 document.body.classList.add('v46-match');
 try{equipChampion(mine,false)}catch{}
 const R=Math.random;Math.random=rng(m.seed);
 try{lobbyPrefs.mode='1v1';queueMatch('1v1')}catch(e){console.error('[Eldoria online] início',e)}finally{Math.random=R}
 if(!p||!b||state==='select'){M.on=false;document.body.classList.remove('v46-match');try{toast('Não foi possível começar a luta.')}catch{}return backToLobby(false)}
 try{V3Modes.swapHero(b,foe,1000)}catch{}
 p.label=S.me?.name||'Você';b.label=S.them?.name||'Rival';
 if(role==='guest'){const x=p.x,y=p.y;p.x=b.x;p.y=b.y;b.x=x;b.y=y;const a=p.a;p.a=b.a;b.a=a}
 M.remote=b;M.host=role==='host'?p:b;M.guest=role==='host'?b:p;
 try{V3Modes.rebuildPlayerUI()}catch{}
 try{V3Modes.banner('DUELO ONLINE',`${S.me.name} × ${S.them.name}`,2200)}catch{}
}

/* ---------- a cada passo da luta ---------- */
const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(!M.on)return;
 if(state==='count')M.roundDone=false;
 if(state==='end')labels(true);
 if(M.role==='host'){driveRemote(dt);M.snapT-=dt;if(M.snapT<=0){M.snapT=.05;sendSnap()}}
 else{M.inT-=dt;if(M.inT<=0){M.inT=1/30;sendInput()}smoothRemote(dt)}
};
// anfitrião: move o campeão do amigo com os comandos dele (mesma conta do movimento do jogador)
function driveRemote(dt){
 const a=M.remote,i=M.input;if(!a||state!=='fight'||a.hp<=0)return;
 try{setGuard(a,!!i.g)}catch{}
 a.moving=i.l>.06&&!a.guard;
 if(a.moving&&a.cast<=0&&a.root<=0&&a.dodgeTime<=0&&a.dash<=0){
  const B=a.buff||{};
  const speed=150*(typeof identitySpeed==='function'?identitySpeed(a):1)*(B.storm>0?1.25:1)*(B.astralPower>0?1.25:1)*(B.rpMask>0?.8:1)*(B.rpBreath>0?1.35:1)*(B.armor>0?.8:1)*(a.slow>0?.55:1)*(B.wings>0?1.35:1);
  move(a,i.x*speed*dt,i.y*speed*dt);
 }
 if(Number.isFinite(i.a))a.a=i.a;
}
function sendInput(){
 let m={x:0,y:0,len:0};try{m=movement()}catch{}
 O.send({t:'in',x:r3(m.x),y:r3(m.y),l:r3(m.len),a:r3(p?.a||0),g:(p?.guard||defendHeld)?1:0});
}
const pack=a=>({x:r1(a.x),y:r1(a.y),a:r3(a.a||0),hp:Math.round(a.hp),mx:a.max,mp:Math.round(a.mp),st:Math.round(a.st),g:a.guard?1:0,mv:a.moving?1:0,cd:a.kit.map(id=>Math.round((a.cd[id]||0)*100)/100)});
function sendSnap(){if(!M.host||!M.guest)return;O.send({t:'snap',st:state,c:r3(count),tm:r1(time),h:pack(M.host),g:pack(M.guest)})}
function applySnap(m){
 if(m.st==='fight'&&state==='count'){state='fight';try{$q('#countdown').style.display='none'}catch{}}
 if(state==='count'&&Number.isFinite(m.c))count=m.c;
 if(Number.isFinite(m.tm))time=m.tm;
 apply(M.host,m.h,false);apply(M.guest,m.g,true);
}
function apply(a,d,local){
 if(!a||!d)return;
 a.hp=d.hp;a.max=d.mx||a.max;a.st=d.st;
 if(local){a.mp=Math.min(a.mp,d.mp+1);d.cd?.forEach((v,i)=>{const id=a.kit[i];if(id!=null)a.cd[id]=Math.max(a.cd[id]||0,v)})}
 else{a.mp=d.mp;d.cd?.forEach((v,i)=>{const id=a.kit[i];if(id!=null)a.cd[id]=v})}
 if(local){
  const e=Math.hypot(d.x-a.x,d.y-a.y);let still=true;try{still=movement().len<.06}catch{}
  if(e>90){a.x=d.x;a.y=d.y}else if(still&&e>3){a.x+=(d.x-a.x)*.3;a.y+=(d.y-a.y)*.3}
 }else{M.target={x:d.x,y:d.y};a.a=d.a;a.guard=!!d.g;a.moving=!!d.mv}
}
function smoothRemote(dt){const a=M.remote,t=M.target;if(!a||!t)return;const k=Math.min(1,dt*12);a.x+=(t.x-a.x)*k;a.y+=(t.y-a.y)*k}

/* ---------- ações repetidas no outro aparelho ---------- */
const MIRROR=['basic','cast','rwBeginCharge','rwReleaseCharge','dodge'];
const clean=v=>{try{return JSON.parse(JSON.stringify(v??null))}catch{return null}};
for(const f of MIRROR){
 const prev=window[f];if(typeof prev!=='function')continue;
 window[f]=function(a,...args){
  if(!M.on||a!==p||M.depth>0){M.depth++;try{return prev.apply(this,arguments)}finally{M.depth--}}
  const out=args.slice();
  try{if(f==='cast'&&out[1]===undefined)out[1]=aim(p);if(f==='rwBeginCharge'&&out[0]===undefined)out[0]=aim(p)}catch{}
  M.depth++;let r;try{r=prev.apply(this,arguments)}finally{M.depth--}
  if(r!==false&&state==='fight')O.send({t:'act',f,a:r3(p.a||0),x:r1(p.x),y:r1(p.y),args:clean(out)});
  return r;
 };
}
// dash (botão grande e Espaço/Shift): os pacotes chamam o dash por dentro, então avisamos pelo toque
function dashAngle(){try{const m=movement();if(m.len>.25)return Math.atan2(m.y,m.x)}catch{}return p?.a||0}
function sendDash(){if(!M.on||state!=='fight'||!p)return;const a=dashAngle();setTimeout(()=>O.send({t:'act',f:'dash',a:r3(a),x:r1(p.x),y:r1(p.y),args:[]}),0)}
document.addEventListener('pointerdown',e=>{if(M.on&&e.target.closest?.('#attack.v3-dash'))sendDash()},true);
window.addEventListener('keydown',e=>{if(M.on&&!e.repeat&&(e.code==='Space'||e.code==='ShiftLeft'))sendDash()},true);
function doAct(m){
 const a=M.remote;if(!a||a.hp<=0||state!=='fight')return;
 if(Number.isFinite(m.a))a.a=m.a;
 if(Number.isFinite(m.x)&&Number.isFinite(m.y)){
  if(M.role==='guest'){a.x=m.x;a.y=m.y;M.target={x:m.x,y:m.y}}
  else if(Math.hypot(a.x-m.x,a.y-m.y)<70){a.x=m.x;a.y=m.y}
 }
 const args=Array.isArray(m.args)?m.args:[];
 try{
  if(m.f==='dash'){a.a=m.a;window.v3Dash?.(a);M.acts++;return}
  if(!MIRROR.includes(m.f))return;
  if(m.f==='cast'&&!a.kit.includes(args[0]))return;
  window[m.f](a,...args);M.acts++;
 }catch(e){console.warn('[Eldoria online] ação',m.f,e)}
}

/* ---------- regras durante a luta online ---------- */
const prevAI=ai;
ai=function(dt,actor){const a=arguments.length>1?actor:b;if(M.on&&a===M.remote)return;return prevAI.apply(this,arguments)};
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 if(M.on&&M.role==='guest'&&t&&(t===p||t===b)&&!M.force){const hp=t.hp,r=prevHit.apply(this,arguments);t.hp=hp;return r}
 return prevHit.apply(this,arguments);
};
const prevPause=togglePause;
togglePause=function(){if(M.on)return;return prevPause.apply(this,arguments)};
const prevFinish=finish;
finish=function(){
 if(M.on&&M.role==='guest'&&!M.force)return;
 // anfitrião: avisa no momento do nocaute/fim do tempo (a sequência de K.O. roda junto nos dois aparelhos)
 const tell=M.on&&M.role==='host'&&!M.roundDone&&state!=='end';
 const r=prevFinish.apply(this,arguments);
// cada nocaute ou fim de tempo encerra uma rodada (o duelo é melhor de 3); o resultado final sai igual nos dois
 if(tell){M.roundDone=true;O.send({t:'end',h:pack(M.host),g:pack(M.guest),tm:r1(time)})}
 return r;
};
function endGuest(m){
 if(!M.on||M.roundDone)return;M.roundDone=true;
 if(Number.isFinite(m.tm))time=m.tm;
 apply(M.host,m.h,false);apply(M.guest,m.g,true);
 M.force=true;try{state='fight';finish()}finally{M.force=false}
}
// botões da tela de resultado: Revanche/Trocar voltam para a sala; Sair sai da sala
document.addEventListener('click',e=>{
 if(!M.on)return;const t=e.target.closest?.('#rematch,#change,#resultHub,#leave');if(!t)return;
 e.stopImmediatePropagation();e.preventDefault();backToLobby(t.id==='resultHub'||t.id==='leave');
},true);
// textos da tela de resultado durante o online
const LBL={rematch:['Jogar novamente','Revanche · voltar à sala'],change:['Trocar campeão','Trocar campeão'],resultHub:['Voltar ao início','Sair da sala']};
function labels(online){for(const [id,t] of Object.entries(LBL)){const el=document.getElementById(id);if(el&&el.textContent!==t[online?1:0])el.textContent=t[online?1:0]}}
function stopMatch(){
 labels(false);
 M.on=false;M.remote=M.host=M.guest=M.target=null;document.body.classList.remove('v46-match');
 try{$q('#outcome').style.display='none'}catch{}
 try{leave()}catch{try{state='select';$q('#battle').style.display='none'}catch{}}
}
function backToLobby(quit){
 stopMatch();
 if(quit||!S.conn){try{O.close()}catch{}return}
 S.ready=false;S.theirReady=false;S.view='lobby';O.open();
}
function abort(msg){
 if(!M.on)return;
 stopMatch();
 const ov=$q('#onlineV45');if(ov){ov.hidden=false;document.body.classList.add('v45-open')}
}
function onMsg(m){
 switch(m.t){
  case'go':if(S.role==='guest')begin('guest',m);break;
  case'in':if(M.on&&M.role==='host')M.input={x:+m.x||0,y:+m.y||0,l:+m.l||0,a:+m.a||0,g:m.g?1:0};break;
  case'snap':if(M.on&&M.role==='guest')applySnap(m);break;
  case'act':if(M.on)doAct(m);break;
  case'end':if(M.role==='guest')endGuest(m);break;
 }
}
window.OnlineV46={onMsg,hostGo,abort,backToLobby,get match(){return M}};
})();
