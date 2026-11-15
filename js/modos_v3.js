'use strict';
/*
 * Modos v3 — base compartilhada:
 *  - remove Sobrevivência, Espelho e Desafio Diário; Controle de Zona fica suspenso (voltará em uma arena maior);
 *  - duelos 1×1 e 2×2: melhor de 3 rounds (vence quem ganhar 2);
 *  - ganchos de fim de luta (V3Hooks) usados também pelo KOF e pelo Torneio dos Campeões.
 */
(function(){
if(!window.COMBAT_V3)return;
const $q=s=>document.querySelector(s);

/* ---------- lista de arenas ---------- */
const OLD=Object.assign({},ARENA_MODES);
for(const k of Object.keys(ARENA_MODES))delete ARENA_MODES[k];
ARENA_MODES.guardian=OLD.guardian;
ARENA_MODES.stage=OLD.stage;
ARENA_MODES.kof={name:'KOF · 3 contra 3',w:1280,h:560,seconds:99,prize:250,copy:'Cada lado escolhe 3 lutadores e a ordem de entrada. Um de cada vez luta; quem vence continua com a vida que tem e quem cai dá lugar ao próximo do time. Vence o time que derrubar os 3 rivais.'};
ARENA_MODES.tournament={...OLD.tournament,name:'Torneio dos Campeões',copy:'Oito lutadores, sorteio de chaves, quartas, semifinais e final. Sem rounds: perdeu, está fora.'};
ARENA_MODES.ffa=OLD.ffa;
ARENA_MODES.zone={...OLD.zone,suspended:true,copy:'Em reformulação: voltará em uma arena maior.'};
if(typeof SIMPLE_MODE_COPY!=='undefined'){
 SIMPLE_MODE_COPY.kof=['3 contra 3','Escolha 3 lutadores e a ordem de entrada. Quem vence continua com a vida que tem.'];
 SIMPLE_MODE_COPY.tournament=['8 lutadores','Sorteio das chaves, quartas, semifinais e final. Perdeu, está fora.'];
 SIMPLE_MODE_COPY.zone=['Em reformulação','Voltará em uma arena maior.'];
}
const prevShowModes=showArenaModes;
showArenaModes=function(){
 prevShowModes();
 const z=document.querySelector('#modeScreen [data-arena-mode="zone"]');
 if(z){z.disabled=true;z.textContent='Em reformulação';z.classList.remove('gold');z.classList.add('ghost')}
};
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('[data-arena-mode]');if(!b)return;
 const id=b.dataset.arenaMode;
 if(id==='zone'){e.stopImmediatePropagation();e.preventDefault();toast('Controle de Zona está em reformulação (voltará em uma arena maior)');return}
 if(id==='kof'){e.stopImmediatePropagation();e.preventDefault();window.V3Kof?.open();return}
 if(id==='tournament'){e.stopImmediatePropagation();e.preventDefault();window.V3Tour?.open();return}
},true);

/* ---------- utilitários de luta ---------- */
function resetFighter(a,{keepHp=true}={}){
 a.cd=a.cd.map(()=>0);a.mp=120;a.st=100;a.buff={};a.dots=[];a.guard=false;a.root=0;a.cast=0;a.slow=0;a.inv=1.8;a.rwCast=null;a.knockedDown=false;a.hitReact=0;a.koAge=undefined;a.dash=0;a.dodgeTime=0;a.actionRecovery=0;a.skillLock=0;a.punchTime=0;a.guardBreak=0;a.flash=0;a.moving=false;a.identity=undefined;a.modeDead=false;
 for(const k of Object.keys(a))if(/^v3/.test(k)||k==='bot')delete a[k];
 if(!keepHp)a.hp=a.max;
}
// todos voltam a encarar o rival no início de uma luta/round (quem caiu ficava virado para trás)
function faceOff(){
 for(const a of actors){
  if(a.boss||a.trainingDummy)continue;
  const f=actors.find(e=>e!==a&&e.team!==a.team&&!e.boss);if(!f)continue;
  const ang=Math.atan2(f.y-a.y,f.x-a.x);
  a.a=ang;a.dodgeA=ang;a.dashA=ang;
  for(const k of Object.keys(a))if(/facing$/i.test(k)&&typeof a[k]==='number')a[k]=ang;
 }
}
function swapHero(a,id,hp){
 const c=CHAMPIONS[id];
 resetFighter(a,{keepHp:true});
 a.skin=id;a.champion=id;a.kit=[...c.kit];a.max=1000;a.hp=hp??1000;
 try{reworkPreload(id)}catch{}
}
function clearField(){
 try{clearArenaEffects()}catch{}
 try{rwClear()}catch{}
 try{dojoEntities=[];dojoBursts=[];dojoBlood=[];ninjaEffects=[];astralEffects=[];astralBlood=[];eclipseEffects=[];eclipseBlood=[];rpEffects=[];rpBlood=[]}catch{}
}
function rebuildPlayerUI(){
 $q('#equipped').innerHTML=p.kit.map((id,i)=>`<button class="skill" data-index="${i}" style="--c:${skills[id].color}" aria-label="${i+1}: ${skills[id].name}" title="${skills[id].name}\n${skills[id].desc}">${icon(id)}<span class="hotkey">${i+1}</span><span class="cool" hidden></span></button>`).join('');
 document.querySelectorAll('.skill').forEach(btn=>bindSkill(btn,+btn.dataset.index));
 try{window.V3Relayout?.()}catch{}
 $q('#botkit').innerHTML=b.kit.map(id=>`<span title="${skills[id].name}">${icon(id)}</span>`).join('');
 try{hydrateSkillIcons()}catch{}
}
function startCount(seconds=2.6){
 clearInputs();state='count';count=seconds;
 const c=$q('#countdown');c.style.display='flex';c.dataset.go='false';
}
const heroName=id=>CHAMPIONS[id]?.name||'';

/* ---------- faixa de aviso (ROUND / PRÓXIMO) ---------- */
const bn=document.createElement('div');bn.id='modeBanner';bn.hidden=true;bn.innerHTML='<b></b><i></i>';
document.getElementById('battle').appendChild(bn);
let bnT=0;
function banner(title,sub,ms=1700){
 bn.hidden=false;bn.querySelector('b').textContent=title;bn.querySelector('i').textContent=sub||'';
 bn.classList.remove('in');void bn.offsetWidth;bn.classList.add('in');
 clearTimeout(bnT);bnT=setTimeout(()=>{bn.hidden=true},ms);
}

/* ---------- gancho de fim de luta ---------- */
const handlers=[];
window.V3Hooks={
 add(h){handlers.push(h)},
 round(cb){for(const h of handlers){try{if(h(cb))return true}catch(e){console.error('[Eldoria] modo',e)}}return false},
 label(win){for(const h of handlers){const l=h.label&&h.label(win);if(l)return l}return null}
};
window.V3Modes={faceOff,swapHero,resetFighter,clearField,rebuildPlayerUI,startCount,banner,heroName,special:null};

/* ---------- melhor de 3 rounds (1×1 e 2×2) ---------- */
const ROUND_TIME=90;
const S={on:false,round:1,w:[0,0],draws:0,init:[]};
const pips=document.createElement('div');pips.id='roundPips';pips.hidden=true;
pips.innerHTML='<i></i><i></i><b>ROUND 1</b><i></i><i></i>';
const midHud=$q('#battle .hud .mid-hud');if(midHud)midHud.appendChild(pips);
function eligible(){return !window.V3Modes.special&&['1v1','2v2'].includes(matchMode)&&['casual','league'].includes(battleActivity)&&!arenaModeId&&!modeRun}
function drawPips(){
 if(!S.on){pips.hidden=true;return}
 pips.hidden=false;const el=pips.querySelectorAll('i');
 el[0].className=S.w[0]>=2?'on':'';el[1].className=S.w[0]>=1?'on':'';
 el[2].className=S.w[1]>=1?'on r':'r';el[3].className=S.w[1]>=2?'on r':'r';
 pips.querySelector('b').textContent='ROUND '+S.round;
}
const prevStart=start;
start=function(){
 const r=prevStart.apply(this,arguments);
 window.V3Modes.special=window.V3Modes.pending||null;window.V3Modes.pending=null;
 S.on=eligible();S.round=1;S.w=[0,0];S.draws=0;
 if(S.on){time=ROUND_TIME;S.init=actors.map(a=>({a,x:a.x,y:a.y}))}
 drawPips();
 return r;
};
const prevShowScreen=showScreen;
showScreen=function(){S.on=false;window.V3Modes.special=null;window.V3Modes.pending=null;drawPips();return prevShowScreen.apply(this,arguments)};
function teamHp(t){const l=actors.filter(a=>a.team===t);return l.reduce((n,a)=>n+Math.max(0,a.hp)/a.max,0)/Math.max(1,l.length)}
function teamAlive(t){return actors.filter(a=>a.team===t&&a.hp>0).length}
function nextRound(replay){
 clearField();
 for(const {a,x,y} of S.init){resetFighter(a,{keepHp:false});a.x=x;a.y=y;a.hp=a.max}
 faceOff();
 if(!replay)S.round++;
 time=ROUND_TIME;startCount(2.8);drawPips();
 banner(replay?'REPETIR O ROUND':'ROUND '+S.round,S.w[0]+' × '+S.w[1],2000);
}
function seriesHandler(cb){
 if(!S.on)return false;
 let winner=null;
 const a0=teamAlive(0),a1=teamAlive(1);
 if(a0&&!a1)winner=0;else if(a1&&!a0)winner=1;
 else{const h0=teamHp(0),h1=teamHp(1);winner=Math.abs(h0-h1)<.0001?null:(h0>h1?0:1)}
 if(winner===null){S.draws++;if(S.draws<=1){nextRound(true);return true}winner=Math.random()<.5?0:1;for(const a of actors)if(a.team!==winner)a.hp=0}
 S.w[winner]++;
 const decided=S.w[winner]>=2||S.round>=3;
 if(decided){
  const w=[...S.w];S.on=false;drawPips();
  cb();
  const rt=$q('#resultText');if(rt)rt.textContent+=' Placar dos rounds: '+w[0]+' × '+w[1]+'.';
  return true;
 }
 drawPips();
 nextRound(false);
 return true;
}
seriesHandler.label=win=>S.on?[win?'ROUND VENCIDO':'ROUND PERDIDO',(S.w[win?0:1]+1)+' × '+S.w[win?1:0]+' no placar']:null;
// o rótulo do round precisa do placar já contado: calcula pelo estado atual
seriesHandler.label=win=>S.on?[win?'ROUND VENCIDO':'ROUND PERDIDO','Melhor de 3 · placar '+(S.w[0]+(win?1:0))+' × '+(S.w[1]+(win?0:1))]:null;
handlers.push(seriesHandler);
// contagem inicial: o jogo não congela — personagens e cenário se mexem e a barra de vida já mostra a vida cheia
const prevStepCount=step;
step=function(dt){
 if(state==='count'){try{vfxStep(dt);updateUI()}catch{}}
 return prevStepCount.apply(this,arguments);
};
window.V3Series={state:S,eligible};
})();
