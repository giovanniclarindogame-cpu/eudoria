'use strict';
/*
 * Torneio dos Campeões: 8 lutadores, sorteio das chaves, quartas → semifinais → final. Sem rounds: perdeu, está fora.
 * As lutas dos outros lutadores são decididas por sorteio ponderado pela força de cada herói.
 */
(function(){
if(!window.COMBAT_V3||!window.V3Modes)return;
const M=window.V3Modes,$q=s=>document.querySelector(s);
const WEIGHT=[58,57,49,36,60,46,35,44,50,64];
const STAGES=['Quartas de final','Semifinais','Final'];
const PRIZE=[20,60,120,250];
const FIGHT_TIME=120;
let T=null;
const face=id=>championArt(CHAMPIONS[id]);
const name=id=>CHAMPIONS[id].name;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function sim(a,b){const wa=WEIGHT[a]**2,wb=WEIGHT[b]**2;return Math.random()<wa/(wa+wb)?a:b}

function newTournament(){
 const hero=account.activeChampion;
 const others=shuffle(CHAMPIONS.map(c=>c.id).filter(id=>id!==hero)).slice(0,7);
 const slots=shuffle([hero,...others]);
 T={hero,slots,entrants:[slots,[],[]],winners:[[],[],[]],round:0,alive:true,finished:false,champion:null,prize:null,eliminatedAt:null};
}
function pairs(r){const e=T.entrants[r],out=[];for(let i=0;i<e.length;i+=2)out.push([e[i],e[i+1]]);return out}
function playerPairIndex(r){return pairs(r).findIndex(pr=>pr.includes(T.hero))}
function settleRound(r,playerWinner){
 // resolve as lutas do round r (a do jogador já tem vencedor, se ele participou)
 const ps=pairs(r),w=[];
 ps.forEach((pr,i)=>{
  if(pr.includes(T.hero)&&playerWinner!==undefined)w.push(playerWinner);
  else w.push(sim(pr[0],pr[1]));
 });
 T.winners[r]=w;
 if(r<2)T.entrants[r+1]=w;else{T.champion=w[0]}
}
function giveReward(stageReached){
 if(T.prize!==null)return;
 const base=PRIZE[stageReached];
 let reward=0;
 try{
  const before=JSON.stringify(account);
  account.matches++;if(stageReached===3)account.wins++;
  reward=awardMatchCoins(base);
  if(!saveAccount()){account=JSON.parse(before);reward=0}
 }catch(e){console.error(e)}
 T.prize=reward;
}

/* ---------- telas ---------- */
function chip(id,cls=''){return id===undefined||id===null?`<div class="tour-chip empty ${cls}"><em>?</em></div>`:`<div class="tour-chip ${cls} ${id===T.hero?'you':''}"><img src="${face(id)}" alt=""><span>${name(id)}</span>${id===T.hero?'<b>VOCÊ</b>':''}</div>`}
function drawHtml(n){
 const rows=T.slots.map((id,i)=>`<div class="tour-slot ${i<n?'in':''}"><span class="n">${i+1}</span>${i<n?chip(id):'<div class="tour-chip empty"><em>sorteando…</em></div>'}</div>`).join('');
 return `<div class="tour-screen"><header class="kof-head"><button class="ghost" data-tour-back>← Arenas</button><div><span class="eyebrow">TORNEIO DOS CAMPEÕES · 8 LUTADORES</span><h1>Sorteio das chaves</h1></div><button class="gold" data-tour-view ${n>=8?'':'disabled'}>Ver chaves</button></header><div class="tour-draw">${rows}</div></div>`;
}
function matchHtml(r,i){
 const pr=pairs(r)[i],w=T.winners[r][i];
 const cell=id=>{if(id===undefined)return chip(null);const cls=w===undefined?'':(w===id?'win':'lose');return chip(id,cls)};
 const cur=r===T.round&&T.alive&&!T.finished&&pr.includes(T.hero)&&w===undefined;
 return `<div class="tour-match ${cur?'cur':''}">${cell(pr[0])}${cell(pr[1])}${cur?'<i>▶</i>':''}</div>`;
}
function bracketHtml(note=''){
 const cols=[0,1,2].map(r=>{
  const n=r===0?4:r===1?2:1;
  const has=T.entrants[r].length>0;
  const ms=has?Array.from({length:n},(_,i)=>matchHtml(r,i)).join(''):Array.from({length:n},()=>`<div class="tour-match"><div class="tour-chip empty"><em>?</em></div><div class="tour-chip empty"><em>?</em></div></div>`).join('');
  return `<div class="tour-col ${r===T.round&&!T.finished?'now':''}"><h3>${STAGES[r]}</h3><div class="tour-ms">${ms}</div></div>`;
 }).join('');
 const champ=`<div class="tour-col champ"><h3>Campeão</h3><div class="tour-ms">${T.champion!==null?chip(T.champion,'win'):chip(null)}</div></div>`;
 let btn='';
 if(T.finished)btn=`<button class="gold" data-tour-back>Concluir</button>`;
 else if(T.alive)btn=`<button class="gold" data-tour-fight>Lutar</button>`;
 else btn=`<button class="ghost" data-tour-rest>Ver o resto do torneio</button><button class="gold" data-tour-back>Sair</button>`;
 const head=T.finished?(T.champion===T.hero?'Você é o campeão!':(T.alive?'Torneio encerrado':'Eliminado · '+STAGES[T.eliminatedAt])):(T.alive?STAGES[T.round]:'Eliminado · '+STAGES[T.eliminatedAt]);
 const prize=T.prize!==null&&(T.finished||!T.alive)?`<p class="tour-note">Recompensa: +${T.prize} moedas (respeitando o limite diário).</p>`:'';
 return `<div class="tour-screen"><header class="kof-head"><button class="ghost" data-tour-back aria-label="Sair">←</button><div><span class="eyebrow">TORNEIO DOS CAMPEÕES</span><h1>${head}</h1></div><div class="tour-btns">${btn}</div></header>${note?`<p class="tour-note">${note}</p>`:''}${prize}<div class="tour-cols">${cols}${champ}</div></div>`;
}
function show(html){const el=$q('#modeScreen');el.innerHTML=html;el.hidden=false}
let drawTimer=0;
function open(){
 newTournament();
 showScreen('home');appScreen='arenas';document.body.dataset.screen='arenas';
 $q('#homeScreen').hidden=true;document.body.style.overflow='hidden';
 try{renderLobbyNav()}catch{}
 let n=0;show(drawHtml(0));
 clearInterval(drawTimer);
 drawTimer=setInterval(()=>{n++;if(!$q('.tour-draw')){clearInterval(drawTimer);return}show(drawHtml(n));if(n>=8)clearInterval(drawTimer)},380);
}
function showBracket(note){clearInterval(drawTimer);show(bracketHtml(note))}
function startFight(){
 const r=T.round,pr=pairs(r)[playerPairIndex(r)],opp=pr[0]===T.hero?pr[1]:pr[0];
 M.pending='tour';battleActivity='casual';matchMode='1v1';arenaModeId=null;modeRun=null;
 $q('#modeScreen').hidden=true;
 start();M.special='tour';
 M.swapHero(p,T.hero,1000);M.swapHero(b,opp,1000);M.faceOff();
 p.label=account.profile?.name||'Você';b.label=name(opp);
 M.rebuildPlayerUI();time=FIGHT_TIME;
 M.banner(STAGES[r],p.label+' × '+name(opp),2400);
}
document.addEventListener('click',e=>{
 const el=$q('#modeScreen');if(!el||el.hidden||!el.querySelector('.tour-screen')||!T)return;
 if(e.target.closest('[data-tour-back]')){e.stopImmediatePropagation();clearInterval(drawTimer);showArenaModes();return}
 if(e.target.closest('[data-tour-view]')){e.stopImmediatePropagation();showBracket();return}
 if(e.target.closest('[data-tour-fight]')){e.stopImmediatePropagation();startFight();return}
 if(e.target.closest('[data-tour-rest]')){e.stopImmediatePropagation();
  for(let r=T.round;r<3;r++){if(T.winners[r].length===0)settleRound(r)}
  T.finished=true;showBracket('Torneio simulado até a final.');return}
},true);

/* ---------- fim da luta do jogador ---------- */
function handler(cb){
 if(M.special!=='tour'||!T)return false;
 let win;
 if(p.hp<=0&&b.hp>0)win=false;else if(b.hp<=0&&p.hp>0)win=true;
 else{const rp=p.hp/p.max,rb=b.hp/b.max;win=Math.abs(rp-rb)<1e-4?Math.random()<.5:rp>rb}
 const r=T.round;
 settleRound(r,win?T.hero:(pairs(r)[playerPairIndex(r)].find(x=>x!==T.hero)));
 M.special=null;
 let note;
 if(win){
  if(r===2){T.finished=true;T.alive=true;giveReward(3);note='Campeão do torneio!'}
  else{T.round=r+1;note='Você venceu! Próxima fase: '+STAGES[T.round]+'.'}
 }else{
  T.alive=false;T.eliminatedAt=r;giveReward(r);note='Você caiu nas '+STAGES[r].toLowerCase()+'.';
 }
 clearInputs();state='intermission';
 showBracket(note);
 return true;
}
handler.label=win=>M.special==='tour'?[win?'VITÓRIA':'ELIMINADO',win?'Você avança no torneio':'Perdeu, está fora']:null;
V3Hooks.add(handler);
window.V3Tour={open,get state(){return T},settleRound,WEIGHT};
})();
