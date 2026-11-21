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
const M={on:false,rem:[],bySlot:{},x2:false,role:null,remote:null,host:null,guest:null,input:{x:0,y:0,l:0,a:0,g:0},snapT:0,inT:0,roundDone:false,force:false,depth:0,target:null,acts:0};
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
 // 2×2 (só pelo servidor): 4 jogadores. slots 0 e 1 = equipe 0, slots 2 e 3 = equipe 1
 const x2=role==='guest'&&m.modo==='2v2'&&Array.isArray(m.hs)&&m.hs.length===4&&m.hs.every(ok)&&m.slot>=0&&m.slot<4;
 // Trio de Campeões (só pelo servidor): cada jogador leva um time de 3 e lutam um contra um, quem vence continua
 // Disputa da Coroa (só pelo servidor): 4 jogadores, cada um por si; eu sou sempre o "p" e os outros três são b, c e d
 const ffa=role==='guest'&&m.modo==='coroa'&&Array.isArray(m.hs)&&m.hs.length===4&&m.hs.every(ok)&&m.slot>=0&&m.slot<4;
 const trio=role==='guest'&&m.modo==='trio'&&Array.isArray(m.teams)&&m.teams.length===2&&m.teams.every(t=>Array.isArray(t)&&t.length===3&&t.every(ok))&&(m.slot===0||m.slot===1);
  const mine=(x2||ffa)?m.hs[m.slot]:trio?m.teams[m.slot][0]:(role==='host'?m.hh:m.gh),foe=trio?m.teams[1-m.slot][0]:role==='host'?m.gh:m.hh;
 if(!ok(mine)||(!x2&&!ffa&&!ok(foe)))return;
 const ov=$q('#onlineV45');if(ov)ov.hidden=true;document.body.classList.remove('v45-open');
 Object.assign(M,{rem:[],bySlot:{},x2,ffa,multi:x2||ffa,freeze:false,mv:0,slot:(x2||ffa)?m.slot:role==='guest'?(m.slot===0?0:1):0,on:true,role,roundDone:false,force:false,target:null,snapT:0,inT:0,input:{x:0,y:0,l:0,a:0,g:0},acts:0});
 document.body.classList.add('v46-match');
 try{equipChampion(mine,false)}catch{}
 // tela de carregamento: baixa e aquece os dois campeões; cada lado avisa "pronto" e a luta só começa quando os dois estão prontos
 if(window.Carregamento){Carregamento.opcoes={esperar:true};Carregamento.aoPreparar=()=>{O.send({t:'pronto'})}}
 const R=Math.random;Math.random=rng(m.seed);
 const modo=x2?'2v2':'1v1';
 if(ffa)V3Modes.pending='crown';
 if(trio)V3Modes.pending='kof';   // série de 3 lutas: o duelo em rounds não entra junto
 try{lobbyPrefs.mode=modo;queueMatch(modo)}catch(e){console.error('[Eldoria online] início',e)}finally{Math.random=R}
 if(!p||!b||state==='select'){M.on=false;document.body.classList.remove('v46-match');try{toast('Não foi possível começar a luta.')}catch{}return backToLobby(false)}
 if(x2)return begin2(m);
 if(ffa)return beginFfa(m);
 try{V3Modes.swapHero(b,foe,1000)}catch{}
 p.label=S.me?.name||'Você';b.label=S.them?.name||'Rival';
 if(role==='guest'&&m.slot!==0){const x=p.x,y=p.y;p.x=b.x;p.y=b.y;b.x=x;b.y=y;const a=p.a;p.a=b.a;b.a=a}
 M.remote=b;M.host=role==='host'?p:b;M.guest=role==='host'?b:p;
 if(role==='guest'){const E={a:b,slot:M.slot===0?1:0,target:null,mv:0,pred:[]};M.rem=[E];M.bySlot[E.slot]=E}
 try{V3Modes.rebuildPlayerUI()}catch{}
 if(trio){try{V3Kof.setup(m.teams[m.slot],m.teams[1-m.slot]);p.label=S.me?.name||'Você';b.label=S.them?.name||'Rival'}catch(e){console.error('[Eldoria online] trio',e)}}
 else try{V3Modes.banner('DUELO ONLINE',`${S.me.name} × ${S.them.name}`,2200)}catch{}
}
// 2×2: o jogo local tem [p, b, aliado, rival 2]. Aqui eu sou sempre o "p"; meu parceiro é o aliado; os dois adversários são b e o rival 2.
// Cada um é colocado no lugar do jogador do servidor que ele representa (os slots 0,1 ficam à esquerda e os 2,3 à direita).
// Disputa da Coroa: V3Crown.setup coloca cada um no canto da sua vaga; as regras (coroa, quedas, tempo) vêm do servidor
function beginFfa(m){
 const s=m.slot,others=[0,1,2,3].filter(x=>x!==s),slots=[s,...others],ps=Array.isArray(m.ps)?m.ps:[];
 const names=[0,1,2,3].map(i=>String(ps[i]?.name||'Jogador').slice(0,16));
 let P;try{P=V3Crown.setup(m.hs,names,slots,{guest:true})}catch(e){console.error('[Eldoria online] coroa',e);return}
 M.remote=null;M.host=M.guest=null;
 for(let i=1;i<4;i++){const E={a:P[i],slot:slots[i],target:null,mv:0,pred:[]};M.rem.push(E);M.bySlot[slots[i]]=E}
 try{V3Modes.rebuildPlayerUI()}catch{}
}
function begin2(m){
 const s=m.slot,mate=s^1,en=s<2?[2,3]:[0,1],ps=Array.isArray(m.ps)?m.ps:[];
 const ally=actors[2],rival=actors[3];
 const spot=[p,ally,b,rival].map(a=>({x:a.x,y:a.y,a:a.a}));   // lugar inicial de cada slot do servidor (p, aliado, b, rival 2)
 const L=[[p,s],[ally,mate],[b,en[0]],[rival,en[1]]];
 for(const [a,slot] of L){a.x=spot[slot].x;a.y=spot[slot].y;a.a=spot[slot].a}
 for(const [a,slot] of L){if(a===p)continue;try{V3Modes.swapHero(a,m.hs[slot],1000)}catch{}}
 for(const [a,slot] of L)a.label=String(ps[slot]?.name||'Jogador').slice(0,16);
 M.remote=null;M.host=M.guest=null;M.L4=[p,ally,b,rival];
 for(const [a,slot] of L){if(a===p)continue;const E={a,slot,target:null,mv:0,pred:[]};M.rem.push(E);M.bySlot[slot]=E}
 try{V3Modes.rebuildPlayerUI()}catch{}
 try{V3Modes.banner('EQUIPES 2×2',`${p.label} e ${ally.label} × ${b.label} e ${rival.label}`,2400)}catch{}
}

/* ---------- a cada passo da luta ---------- */
/* ---------- atraso igual para os dois (v48) ----------
 * Os comandos do amigo chegam ao anfitrião meia ida e volta depois. Para ninguém ter vantagem por ter criado a sala, os comandos
 * do próprio anfitrião (andar, golpes, habilidades, dash) também esperam esse tempo antes de valer (até 90 ms). */
const MAX_DELAY=90;
const hostDelay=()=>M.on&&M.role==='host'&&M.equal!==false?Math.min(MAX_DELAY,Math.max(0,(S.rtt||0)/2)):0;
const Q=[];let qLast=0;
function later(fn){const d=hostDelay();if(!d)return fn();const at=Math.max(performance.now()+d,qLast);qLast=at;Q.push({at,fn})}
function runQueue(){const now=performance.now();while(Q.length&&Q[0].at<=now){const it=Q.shift();try{it.fn()}catch(e){console.warn('[Eldoria online] fila',e)}}}
const prevMovement=movement,HIST=[];let delayedMove=null;
movement=function(){if(delayedMove&&hostDelay())return delayedMove;return prevMovement.apply(this,arguments)};
function sampleMove(){
 const d=hostDelay();if(!d){delayedMove=null;HIST.length=0;return}
 const now=performance.now();let raw;try{raw=prevMovement()}catch{raw={x:0,y:0,len:0}}
 HIST.push({t:now,m:raw});while(HIST.length>2&&HIST[1].t<=now-d)HIST.shift();
 delayedMove=HIST[0].t<=now-d?HIST[0].m:{x:0,y:0,len:0};
 while(HIST.length>120)HIST.shift();
}
const prevStep=step;
step=function(dt){
 if(M.on&&M.role==='host'){sampleMove();runQueue()}
 prevStep(dt);
 if(!M.on)return;
 if(state==='count'){if(M.roundDone)diag('count',{});M.roundDone=false}
 if(state==='end')labels(true);
 if(M.role==='host'){fixRound();driveRemote(dt);trackVel(M.host,dt);trackVel(M.guest,dt);M.snapT-=dt;if(M.snapT<=0){M.snapT=SNAP_DT;sendSnap()}}
 else{M.inT-=dt;sendInput(M.inT<=0);for(const E of M.rem)smoothRemote(E,dt);fixRound()}
};
// anfitrião: move o campeão do amigo com os comandos dele (mesma conta do movimento do jogador)
// o jogo só avança o passo da animação de andar (rwStride) e a direção do corpo quando o boneco se mexe DENTRO do passo dele; o rival é movido
// por fora, então o passo ficava parado num quadro e ele deslizava sem pernas. Aqui avançamos igual ao jogo faz.
function walkStride(a,dx,dy){const d=Math.hypot(dx,dy);if(d>.02&&!a.rwCast&&!a.guard){a.rwFacing=Math.atan2(dy,dx);a.rwStride=((a.rwStride||0)+d/16)%6}}
function driveRemote(dt){
 const a=M.remote,i=M.input;if(!a||state!=='fight'||a.hp<=0)return;
 try{setGuard(a,!!i.g)}catch{}
 a.moving=i.l>.06&&!a.guard;
 if(a.moving&&a.cast<=0&&a.root<=0&&a.dodgeTime<=0&&a.dash<=0){
  const B=a.buff||{};
  const speed=150*(typeof identitySpeed==='function'?identitySpeed(a):1)*(B.storm>0?1.25:1)*(B.astralPower>0?1.25:1)*(B.rpMask>0?.8:1)*(B.rpBreath>0?1.35:1)*(B.armor>0?.8:1)*(a.slow>0?.55:1)*(B.wings>0?1.35:1);
  const x0=a.x,y0=a.y;move(a,i.x*speed*dt,i.y*speed*dt);walkStride(a,a.x-x0,a.y-y0);
 }
 if(Number.isFinite(i.a))a.a=i.a;
}
/* menos atraso para quem entrou na sala (v47):
 *  - comandos saem no mesmo quadro em que mudam (até 60/s) e, parados, 10/s;
 *  - o estado volta 30/s com a velocidade de cada campeão; o amigo desenha o rival onde ele deve estar AGORA
 *    (posição + velocidade × meia ida e volta) e continua andando com ele entre um pacote e outro;
 *  - o dano que o amigo causa aparece na hora (previsto) e é conferido quando o anfitrião responde. */
const SNAP_DT=1/30;
let lastIn='';
function sendInput(force){
 let m={x:0,y:0,len:0};try{m=movement()}catch{}
 const o={t:'in',x:r3(m.x),y:r3(m.y),l:r3(m.len),a:Math.round((p?.a||0)*100)/100,g:(p?.guard||defendHeld)?1:0};
 const k=o.x+','+o.y+','+o.a+','+o.g;
 if(k===lastIn&&!force)return;
 lastIn=k;M.inT=.1;(O.sendFast||O.send)(o);
}
function trackVel(a,dt){
 if(!a||!(dt>0))return;const v=a.v47||(a.v47={x:a.x,y:a.y,vx:0,vy:0});
 let vx=(a.x-v.x)/dt,vy=(a.y-v.y)/dt;if(Math.hypot(vx,vy)>900)vx=vy=0;   // teleportes e dashes não viram "velocidade"
 v.vx=v.vx*.5+vx*.5;v.vy=v.vy*.5+vy*.5;v.x=a.x;v.y=a.y;
}
const pack=a=>({vx:Math.round(a.v47?.vx||0),vy:Math.round(a.v47?.vy||0),x:r1(a.x),y:r1(a.y),a:r3(a.a||0),hp:Math.round(a.hp),mx:a.max,mp:Math.round(a.mp),st:Math.round(a.st),g:a.guard?1:0,mv:a.moving?1:0,cd:a.kit.map(id=>Math.round((a.cd[id]||0)*100)/100)});
function sendSnap(){if(!M.host||!M.guest)return;(O.sendFast||O.send)({t:'snap',st:state,c:r3(count),tm:r1(time),h:pack(M.host),g:pack(M.guest)})}
function applySnap(m){
 if(window.Carregamento&&Carregamento.esperando)Carregamento.liberar();   // 1º estado do anfitrião/servidor: a luta de lá começou
 // enquanto o nocaute da rodada passa na tela, o placar é decidido pela vida que veio no "end": o estado da rodada seguinte
 // (vida cheia nos dois) pode chegar antes do fim da sequência e faria o jogo achar que foi empate
 if(M.freeze){if(state==='count'||state==='end'||performance.now()-M.freezeAt>9000)M.freeze=false;else return}
 if(m.st==='fight'&&state==='count'){state='fight';try{$q('#countdown').style.display='none'}catch{}}
 if(state==='count'&&Number.isFinite(m.c))count=m.c;
 if(Number.isFinite(m.tm))time=m.tm;
 applyAll(m);
 if(m.cw&&window.V3Crown)V3Crown.applyServer(m.cw);
}
function applyAll(m){
 if(M.multi){if(Array.isArray(m.a))m.a.forEach((d,i)=>{if(i===M.slot)apply(p,d,true);else{const E=M.bySlot[i];if(E)apply(E.a,d,false)}});return}
 apply(M.host,m.h,false);apply(M.guest,m.g,true);
}
function apply(a,d,local){
 if(!a||!d)return;
 const E=local?null:M.rem.find(e=>e.a===a);
 if(M.ffa){   // quem caiu volta ao seu canto: tira o estado de "caído" do boneco
  if(a.v46dead&&d.hp>0){a.v46dead=false;try{V3Modes.resetFighter(a,{keepHp:true})}catch{}}
  if(d.hp<=0)a.v46dead=true;
 }
 if(local)a.hp=d.hp;
 else{const now=performance.now(),win=(S.rtt||100)+140,pr=E?(E.pred=E.pred.filter(e=>now-e.t<win)):[];const pend=pr.reduce((n,e)=>n+e.d,0);a.hp=d.hp<=0?0:Math.max(1,d.hp-pend)}
 a.max=d.mx||a.max;a.st=d.st;
 if(local){a.mp=Math.min(a.mp,d.mp+1);d.cd?.forEach((v,i)=>{const id=a.kit[i];if(id!=null)a.cd[id]=Math.max(a.cd[id]||0,v)})}
 else{a.mp=d.mp;d.cd?.forEach((v,i)=>{const id=a.kit[i];if(id!=null)a.cd[id]=v})}
 if(local){
  const e=Math.hypot(d.x-a.x,d.y-a.y);let still=true;try{still=movement().len<.06}catch{}
  if(e>90){a.x=d.x;a.y=d.y}else if(still&&e>3){a.x+=(d.x-a.x)*.3;a.y+=(d.y-a.y)*.3}
 }else{
  const lead=Math.min(.18,(S.rtt||80)/2000+.02),vx=d.mv?d.vx||0:0,vy=d.mv?d.vy||0:0;
  const T={x:d.x+vx*lead,y:d.y+vy*lead,vx,vy,age:0};if(E)E.target=T;a.a=d.a;a.guard=!!d.g;a.moving=!!d.mv;
  if(Math.hypot(T.x-a.x,T.y-a.y)>160){a.x=T.x;a.y=T.y}
 }
}
function smoothRemote(E,dt){
 const a=E.a,t=E.target;if(!a||!t)return;
 const x0=a.x,y0=a.y;
 if(t.age<.25){t.x+=(t.vx||0)*dt;t.y+=(t.vy||0)*dt;t.age+=dt}   // continua andando entre um pacote e outro
 const k=Math.min(1,dt*18);a.x+=(t.x-a.x)*k;a.y+=(t.y-a.y)*k;
 // a animação de andar do rival depende de "moving": vem da velocidade real do boneco a cada quadro (o valor do pacote chega 30×/s e é
 // zerado pelo jogo entre um pacote e outro, o que fazia o rival deslizar sem animação)
 const sp=Math.hypot(a.x-x0,a.y-y0)/Math.max(dt,.001);
 E.mv=E.mv?(sp>6?E.mv:Math.max(0,E.mv-dt)):0;if(sp>14)E.mv=.12;   // liga rápido, desliga só depois de uma pausa curta (não pisca)
 a.moving=E.mv>0&&!a.guard;
 if(a.moving)walkStride(a,a.x-x0,a.y-y0);
}
// início de cada rodada: cada um no seu lado e virado para o rival (o jogo reinicia assumindo "eu à esquerda, olhando para a direita")
function fixRound(){
 if(state!=='count'||!p||!b)return;
 if(M.ffa){   // todos contra todos: cada um encara o mais perto
  for(const a of V3Crown.state.players){const f=V3Crown.state.players.filter(e=>e!==a).sort((u,v)=>Math.hypot(u.x-a.x,u.y-a.y)-Math.hypot(v.x-a.x,v.y-a.y))[0];if(f)a.a=Math.atan2(f.y-a.y,f.x-a.x)}
  return;
 }
 if(M.x2&&M.L4){
  const [P,A,B,R]=M.L4;
  if(M.slot>=2?P.x<B.x:P.x>B.x){for(const [u,v] of [[P,B],[A,R]]){const x=u.x,y=u.y;u.x=v.x;u.y=v.y;v.x=x;v.y=y}for(const E of M.rem)E.target=null}
  for(const a of M.L4){const foes=(a===P||a===A)?[B,R]:[P,A];const f=foes.sort((u,v)=>Math.hypot(u.x-a.x,u.y-a.y)-Math.hypot(v.x-a.x,v.y-a.y))[0];a.a=Math.atan2(f.y-a.y,f.x-a.x)}
  return;
 }
 if(M.role==='guest'&&(M.slot===1?p.x<b.x:p.x>b.x)){const x=p.x,y=p.y;p.x=b.x;p.y=b.y;b.x=x;b.y=y;for(const E of M.rem)E.target=null}
 p.a=Math.atan2(b.y-p.y,b.x-p.x);b.a=Math.atan2(p.y-b.y,p.x-b.x);
}

/* ---------- ações repetidas no outro aparelho ---------- */
const MIRROR=['basic','cast','rwBeginCharge','rwReleaseCharge','dodge'];
const clean=v=>{try{return JSON.parse(JSON.stringify(v??null))}catch{return null}};
for(const f of MIRROR){
 const prev=window[f];if(typeof prev!=='function')continue;
 window[f]=function(a,...args){
  if(!M.on||a!==p||M.depth>0){M.depth++;try{return prev.apply(this,arguments)}finally{M.depth--}}
  const out=args.slice();
  try{if(f==='cast'&&out[1]===undefined)out[1]=aim(p);if(f==='rwBeginCharge'&&out[0]===undefined)out[0]=aim(p)}catch{}
  const self=this,all=arguments,run=()=>{
   M.depth++;let r;try{r=prev.apply(self,all)}finally{M.depth--}
   if(r!==false&&state==='fight')O.send({t:'act',f,a:r3(p.a||0),x:r1(p.x),y:r1(p.y),args:clean(out)});
   return r;
  };
  if(hostDelay()){later(run);return true}   // anfitrião: vale depois do atraso igual
  return run();
 };
}
// dash (botão grande e Espaço/Shift): os pacotes chamam o dash por dentro, então avisamos pelo toque
function dashAngle(){try{const m=movement();if(m.len>.25)return Math.atan2(m.y,m.x)}catch{}return p?.a||0}
function sendDash(){if(!M.on||state!=='fight'||!p)return;const a=dashAngle();setTimeout(()=>O.send({t:'act',f:'dash',a:r3(a),x:r1(p.x),y:r1(p.y),args:[]}),0)}
// anfitrião com atraso igual: segura o toque do dash e faz o dash depois do atraso
function hostDash(e){
 if(!hostDelay()||state!=='fight'||!p)return false;
 e.stopImmediatePropagation();e.preventDefault();
 later(()=>{if(state!=='fight')return;const a=dashAngle();let ok=false;try{ok=window.v3Dash?.(p)}catch{}if(ok!==false)O.send({t:'act',f:'dash',a:r3(a),x:r1(p.x),y:r1(p.y),args:[]})});
 return true;
}
document.addEventListener('pointerdown',e=>{if(M.on&&e.target.closest?.('#attack.v3-dash')){if(!hostDash(e))sendDash()}},true);
window.addEventListener('keydown',e=>{if(M.on&&!e.repeat&&(e.code==='Space'||e.code==='ShiftLeft')){if(!hostDash(e))sendDash()}},true);
function doAct(m){
 const E=m.s!=null&&M.bySlot?M.bySlot[m.s]:null,a=E?E.a:M.remote;if(!a||a.hp<=0||state!=='fight')return;
 if(Number.isFinite(m.a))a.a=m.a;
 if(Number.isFinite(m.x)&&Number.isFinite(m.y)){
  if(M.role==='guest'){a.x=m.x;a.y=m.y;const T=E||M.rem.find(e=>e.a===a);if(T)T.target={x:m.x,y:m.y,vx:0,vy:0,age:1}}
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
ai=function(dt,actor){const a=arguments.length>1?actor:b;if(M.on&&(a===M.remote||M.rem.some(e=>e.a===a)))return;return prevAI.apply(this,arguments)};
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 if(M.on&&M.role==='guest'&&t&&!M.force&&(t===p||M.rem.some(e=>e.a===t))){
  const hp=t.hp,r=prevHit.apply(this,arguments);
  if(t===p)t.hp=hp;   // a própria vida só muda pelo anfitrião
  else{const d=hp-t.hp,E=M.rem.find(e=>e.a===t);if(d>0&&E){E.pred.push({d,t:performance.now()});if(t.hp<1)t.hp=1}}   // dano no rival: aparece na hora
  return r;
 }
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
const diag=(k,x)=>{(M.diag||(M.diag=[])).push({k,t:Math.round(performance.now()),st:state,rd:M.roundDone,...x});if(M.diag.length>30)M.diag.shift()};   // registro curto para achar problemas
function endGuest(m){
 diag('end',{on:M.on});
 if(!M.on||M.roundDone)return;M.roundDone=true;
 if(Number.isFinite(m.tm))time=m.tm;
 applyAll(m);
 M.force=true;try{state='fight';finish()}finally{M.force=false}
 if(state!=='end'){M.freeze=true;M.freezeAt=performance.now()}
 diag('forcou',{});
}
// botões da tela de resultado: Revanche/Trocar voltam para a sala; Sair sai da sala
document.addEventListener('click',e=>{
 if(!M.on)return;const t=e.target.closest?.('#rematch,#change,#resultHub,#leave');if(!t)return;
 e.stopImmediatePropagation();e.preventDefault();backToLobby(t.id==='resultHub'||t.id==='leave');
},true);
// textos da tela de resultado durante o online
const LBL={rematch:['Jogar novamente','Revanche · voltar à sala','Procurar outro rival'],change:['Trocar campeão','Trocar campeão','Procurar outro rival'],resultHub:['Voltar ao início','Sair da sala','Sair']};
function labels(online){const k=online?(S.mode==='server'?2:1):0;for(const [id,t] of Object.entries(LBL)){const el=document.getElementById(id);if(el&&el.textContent!==t[k])el.textContent=t[k]}}
function stopMatch(){
 labels(false);try{if(window.Carregamento){Carregamento.cancelar();Carregamento.aoPreparar=null}}catch{}
 M.on=false;M.freeze=false;Q.length=0;HIST.length=0;delayedMove=null;M.remote=M.host=M.guest=M.target=M.L4=null;M.rem=[];M.bySlot={};M.x2=false;M.ffa=false;M.multi=false;document.body.classList.remove('v46-match');
 try{$q('#outcome').style.display='none'}catch{}
 try{leave()}catch{try{state='select';$q('#battle').style.display='none'}catch{}}
}
function backToLobby(quit){
 stopMatch();
 if(S.mode==='server'&&!quit){try{O.procurar(S.modo)}catch{}return}   // "jogar de novo": volta ao início já procurando outros rivais
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
  case'end':if(M.role==='guest'&&!M.ffa)endGuest(m);break;
  case'over':if(M.on&&M.ffa&&window.V3Crown)V3Crown.finishOnline(m);break;
  case'pronto':if(M.role==='host'&&window.Carregamento)Carregamento.liberar();break;   // sala entre amigos: o anfitrião só começa quando o convidado terminou de carregar
 }
}
window.OnlineV46={beginServer:m=>begin('guest',m),onMsg,hostGo,abort,backToLobby,hostDelay,get match(){return M}};
})();
