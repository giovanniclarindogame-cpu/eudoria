'use strict';
/*
 * Tutorial inicial com o fantoche (logo depois do presente do 1º campeão).
 *   Parte 1 — o fantoche fica parado: bata nele até ele cair.
 *   Parte 2 — "Você está preparado, agora vamos para valer": o fantoche revida com 4 ataques (todos com aviso no chão).
 * Pode ser pulado. Ao concluir: +300 moedas e account.tutorialDone = true.
 * Fica desligado com ?allheroes=1 (testes automáticos). V3Tutorial.start() reabre o tutorial.
 */
(function(){
if(!window.COMBAT_V3||!window.V3Modes)return;
const M=window.V3Modes,$q=s=>document.querySelector(s);
const P1_HP=450,P2_HP=900,REWARD=300;
const T={on:false,phase:0,t:0,trans:0,next:0,hintAt:0,hint:''};
const DANGER='#ff7a5c';

/* ---------- caixa de dicas ---------- */
const box=document.createElement('div');box.id='tutBox';box.hidden=true;box.innerHTML='<b></b><span></span>';
document.getElementById('battle').appendChild(box);
function setHint(title,text){if(box.querySelector('b').textContent!==title)box.querySelector('b').textContent=title;if(box.querySelector('span').textContent!==text)box.querySelector('span').textContent=text}
function close(){box.hidden=true;delete document.body.dataset.tutorial;document.getElementById('countdown')}

/* ---------- janelinhas ---------- */
function modal(html){
 $q('#ljModal')?.remove();
 const m=document.createElement('div');m.id='ljModal';m.className='lj-modal';m.innerHTML=`<div class="lj-dialog" role="dialog" aria-modal="true">${html}</div>`;
 document.body.appendChild(m);return m;
}
function intro(){
 const c=currentChampion();
 const obrig=!!(window.ELDORIA_TESTE_ON&&ELDORIA_TESTE_ON('tutorialObrigatorio')),semM=!!(window.ELDORIA_TESTE_ON&&ELDORIA_TESTE_ON('semMoedas'));
 modal(`<span class="lj-gift-tag">TUTORIAL</span><h2>Treino com o fantoche</h2><p>Primeiro, bata no fantoche parado até ele cair. Depois ele revida, e você enfrenta de verdade! Leva uns 2 minutos${semM?'':` e rende <b>+${REWARD} moedas</b>`}.${obrig?' Antes de jogar, você precisa concluir este treino.':''}</p><div class="lj-actions">${obrig?'':'<button class="ghost" data-tut-skip>Pular</button>'}<button class="gold" data-tut-go>Começar</button></div>`);
}

/* ---------- fantoche ---------- */
function setupDummy(hp){
 b.kit=[];b.trainingDummy=true;b.label='Fantoche';b.color='#d2b679';b.team=1;b.skin=0;
 b.max=b.hp=hp;b.tutDeath=undefined;b.tutCharge=null;b.tutBusy=0;b.think=.8;b.lastAtk=-1;b.inv=0;b.guard=false;b.root=0;b.slow=0;b.hitReact=0;b.flash=0;
 try{$q('#botkit').innerHTML=''}catch{}
}
function placeBoth(){
 p.x=W*.3;p.y=H*.5;b.x=W*.7;b.y=H*.5;
 try{M.faceOff()}catch{}
}
function clearAll(){try{M.clearField()}catch{}}

/* ---------- ataques do fantoche (todos com aviso vermelho no chão) ---------- */
function atkPancada(a,ang){            // 1 · pancada: golpe curto à frente
 const x=a.x+Math.cos(ang)*62,y=a.y+Math.sin(ang)*62;
 telegraph(a,x,y,58,.6,()=>{if(!T.on||a.hp<=0)return;a.punchTime=.24;a.punchSide=1;area(a,x,y,58,55,'#d2b679')},DANGER);
 a.tutBusy=1.1;
}
function atkGiro(a){                    // 2 · giro de palha: área ao redor dele
 telegraph(a,a.x,a.y,112,.9,()=>{if(!T.on||a.hp<=0)return;a.punchTime=.24;a.punchSide=-1;area(a,a.x,a.y,112,70,'#d2b679')},DANGER);
 a.tutBusy=1.5;
}
function atkPedra(a,ang){               // 3 · pedra: projétil em linha reta
 zones.push({owner:a,x:a.x,y:a.y,kind:'line',a:ang,len:430,r:16,life:.75,max:.75,color:DANGER});
 delay(.75,()=>{if(!T.on||a.hp<=0)return;a.punchTime=.24;a.punchSide=1;shot(a,ang,420,48,12,'#c8a96a',430)});
 a.tutBusy=1.3;
}
function atkInvestida(a,ang){           // 4 · investida: corre em linha reta
 zones.push({owner:a,x:a.x,y:a.y,kind:'line',a:ang,len:250,r:22,life:.8,max:.8,color:DANGER});
 delay(.8,()=>{if(!T.on||a.hp<=0)return;a.tutCharge={t:.32,ang,done:false}});
 a.tutBusy=1.6;
}
function dummyBrain(dt){
 const a=b;a.a=aim(a);a.moving=false;
 if(a.hp<=0||T.phase!==2||state!=='fight'||T.trans)return;
 if(a.tutCharge){
  const c=a.tutCharge;c.t-=dt;
  move(a,Math.cos(c.ang)*640*dt,Math.sin(c.ang)*640*dt);a.moving=true;a.a=c.ang;
  if(!c.done&&dist(a,p)<a.r+p.r+6){c.done=true;hit(p,60,a,0,c.ang)}
  if(c.t<=0)a.tutCharge=null;
  return;
 }
 if(a.tutBusy>0){a.tutBusy-=dt;return}
 const d=dist(a,p),ang=Math.atan2(p.y-a.y,p.x-a.x);
 a.think-=dt;
 if(a.think<=0){
  const opts=d<100?[0,0,1]:d<190?[3,1,2]:[2,3,2];
  let k=opts[Math.floor(Math.random()*opts.length)];if(k===a.lastAtk)k=opts[(opts.indexOf(k)+1)%opts.length];
  a.lastAtk=k;a.think=.5+Math.random()*.7;
  if(k===0)atkPancada(a,ang);else if(k===1)atkGiro(a);else if(k===2)atkPedra(a,ang);else atkInvestida(a,ang);
  return;
 }
 if(d>90){move(a,Math.cos(ang)*85*dt,Math.sin(ang)*85*dt);a.moving=true}
}
const prevAI=ai;
ai=function(dt,a=b){
 if(T.on&&a===b){dummyBrain(dt);return}
 if(T.on&&a===p)return prevAI.apply(this,arguments);
 return prevAI.apply(this,arguments);
};
// durante o tutorial a luta não termina sozinha
const prevFinish=finish;
finish=function(){if(T.on)return;return prevFinish.apply(this,arguments)};
// o fantoche derrotado tomba e some (em vez de continuar de pé)
const prevDummyDraw=drawTrainingDummy;
drawTrainingDummy=function(a){
 if(a.tutDeath===undefined)return prevDummyDraw.apply(this,arguments);
 const t=a.tutDeath,alpha=1-Math.min(1,Math.max(0,(t-.9)/1));
 if(alpha<=0)return;
 ctx.save();ctx.globalAlpha=alpha;ctx.translate(a.x,a.y);ctx.rotate(-Math.min(t*2.4,1.45));ctx.translate(-a.x,-a.y);
 try{prevDummyDraw.call(this,a)}finally{ctx.restore()}
};

/* ---------- fluxo ---------- */
function begin(){
 if(!account.profile)return;
 closeLj();
 M.pending='tutorial';battleActivity='casual';matchMode='1v1';arenaModeId=null;modeRun=null;
 $q('#modeScreen').hidden=true;
 start();
 M.special='tutorial';
 T.on=true;T.phase=1;T.t=0;T.trans=0;T.next=0;T.hint='';
 setupDummy(P1_HP);
 time=5999;
 document.body.dataset.tutorial='1';box.hidden=false;
 setHint('PARTE 1 · O FANTOCHE PARADO','Use o analógico (esquerda) para chegar perto dele.');
 try{M.banner('TUTORIAL','Parte 1 · derrube o fantoche',2200)}catch{}
}
function closeLj(){$q('#ljModal')?.remove()}
function died(dummy){return dummy.hp<=0}
function startPart2(){
 clearAll();
 setupDummy(P2_HP);
 p.hp=p.max;p.mp=120;p.cd=p.cd.map(()=>0);p.inv=1.5;
 placeBoth();
 T.phase=2;T.trans=0;
 try{M.startCount(2.8);M.banner('VOCÊ ESTÁ PREPARADO!','Agora vamos para valer',2600)}catch{}
 setHint('PARTE 2 · O FANTOCHE REVIDA','Fuja das áreas vermelhas e esquive com o DASH.');
}
function retryPart2(){
 clearAll();
 setupDummy(P2_HP);
 p.hp=p.max;p.mp=120;p.cd=p.cd.map(()=>0);p.inv=1.5;p.koAge=undefined;
 placeBoth();T.trans=0;
 try{M.startCount(2.8);M.banner('DE NOVO!','Você consegue',2000)}catch{}
}
function finishTutorial(){
 T.on=false;close();
 const semM=!!(window.ELDORIA_TESTE_ON&&ELDORIA_TESTE_ON('semMoedas'));
 account.tutorialDone=true;if(!semM)account.coins=(account.coins||0)+REWARD;
 try{saveAccount()}catch{}
 showScreen('home');
 modal(semM?`<span class="lj-gift-tag">TUTORIAL CONCLUÍDO</span><h2>Você está pronto!</h2><p>Bom trabalho! Todos os campeões estão liberados na fase de teste. Escolha um modo e jogue com seus amigos. Achou um bug ou tem uma ideia? Use <b>Menu › Enviar feedback</b>.</p><button class="gold" data-lj-close>Vamos lá</button>`:`<span class="lj-gift-tag">TUTORIAL CONCLUÍDO</span><h2>Você está pronto!</h2><p>Bom trabalho! Ganhou <b>+${REWARD} moedas</b>. Vá para a Liga, a Cruzada ou a Loja. Todo campeão novo custa 7.000 moedas, e 3 são grátis a cada semana.</p><button class="gold" data-lj-close>Vamos lá</button>`);
}
const prevStep=step;
step=function(dt){
 const r=prevStep.apply(this,arguments);
 if(!T.on)return r;
 T.t+=dt;
 if(b.tutDeath!==undefined)b.tutDeath+=dt;
 // dicas
 if(!T.trans&&state==='fight'){
  const d=dist(p,b);
  if(T.phase===1){
   if(d>110)setHint('PARTE 1 · O FANTOCHE PARADO','Use o analógico (esquerda) para chegar perto dele.');
   else setHint('PARTE 1 · ATAQUE!','Toque no botão grande (1) e nas habilidades 2 e 3. Derrube o fantoche!');
  }else if(T.phase===2){
   setHint('PARTE 2 · O FANTOCHE REVIDA','Fuja das áreas vermelhas e esquive com o DASH. Ataque nas brechas!');
  }
 }
 if(!T.trans){
  if(T.phase===1&&died(b)){T.trans=1;b.tutDeath=0;b.hitReact=.3;T.next=T.t+2.4;try{M.banner('FANTOCHE DERROTADO!','',2000)}catch{}setHint('PARTE 1 · CONCLUÍDA','Muito bem!')}
  else if(T.phase===2&&died(b)){T.trans=2;b.tutDeath=0;b.hitReact=.3;T.next=T.t+3;try{M.banner('TUTORIAL CONCLUÍDO!','Você venceu o fantoche',2600)}catch{}setHint('PARTE 2 · VENCIDA','Parabéns!')}
  else if(T.phase===2&&p.hp<=0&&state==='fight'){T.trans=3;p.koAge=0;T.next=T.t+2.2;try{M.banner('QUASE!','Vamos tentar de novo',2000)}catch{}setHint('PARTE 2','Sem pressa: tente de novo.')}
 }else if(T.t>=T.next){
  const k=T.trans;T.trans=0;
  if(k===1){T.trans=9;startPart2()}
  else if(k===2)finishTutorial();
  else if(k===3){T.trans=9;retryPart2()}
 }
 if(T.trans===9&&state==='fight')T.trans=0;
 return r;
};
// sair da partida (menu/pausa) encerra o tutorial sem concluir
const prevShow=showScreen;
showScreen=function(){if(T.on){T.on=false;close()}return prevShow.apply(this,arguments)};

/* ---------- cliques ---------- */
document.addEventListener('click',e=>{
 if(e.target.closest('[data-tut-go]')){e.stopImmediatePropagation();begin();return}
 if(e.target.closest('[data-tut-skip]')){e.stopImmediatePropagation();if(window.ELDORIA_TESTE_ON&&ELDORIA_TESTE_ON('tutorialObrigatorio'))return;account.tutorialDone=true;try{saveAccount()}catch{}closeLj();return}
},true);

/* ---------- oferece o tutorial depois do presente ---------- */
if(!window.ALL_HEROES_DEBUG&&!/[?&]allheroes=1/.test(location.search)){
 const t=setInterval(()=>{
  if(account.tutorialDone){clearInterval(t);return}
  const w=$q('#welcomeScreen'),shown=w&&!w.hidden&&getComputedStyle(w).display!=='none';
  if(!account.profile||account.giftPending||shown||$q('#ljModal')||T.on)return;
  if(appScreen==='home'&&state==='select'){if(!(window.ELDORIA_TESTE_ON&&ELDORIA_TESTE_ON('tutorialObrigatorio')))clearInterval(t);intro()}
 },700);
}
window.V3Tutorial={start:begin,state:T,REWARD};
})();
