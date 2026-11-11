'use strict';
/*
 * RETENÇÃO — peças baratas para o jogador voltar:
 *  1) Presente diário com sequência de dias (botão de chama no cabeçalho + janela automática uma vez por dia).
 *  2) Metas do dia: 3 metas sorteadas pelo dia + baú ao completar todas (cartão na tela inicial).
 *  3) Tutorial curto na primeira luta, que também pode ser revisto pelo menu de pausa ("Como jogar").
 *  4) Botão "Compartilhar" na tela de resultado.
 * Tudo guarda estado na própria chave eldoria.retencao.v1 e só soma moedas/cristais à conta existente.
 * Em navegador automatizado (navigator.webdriver) as janelas automáticas não abrem sozinhas, para não atrapalhar
 * testes; use ?tutorial=1 ou o botão para vê-las.
 */
(()=>{
const KEY='eldoria.retencao.v1';
const GIFT=[{c:50},{c:60},{c:70,g:5},{c:80},{c:100},{c:120,g:5},{c:150,g:25}];
const auto=!navigator.webdriver;
const FORCE_TUT=new URLSearchParams(location.search).get('tutorial')==='1';

/* ---------- estado ---------- */
const dayIdx=(t=Date.now())=>Math.floor((t-new Date().getTimezoneOffset()*60000)/864e5);
function load(){try{return Object.assign({streak:0,last:-99,tutorial:false,damage:0,goals:null},JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return{streak:0,last:-99,tutorial:false,damage:0,goals:null}}}
let S=load();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}};
function pay(r){
 const before=JSON.stringify(account);
 account.coins+=r.c||0;account.crystals+=r.g||0;
 if(!saveAccount()){account=JSON.parse(before);return false}
 return true;
}
const flame='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c1 4-3 6-3 10 0 2 1 3 2 3-1-3 1-4 2-6 2 2 4 4 4 7a5 5 0 0 1-10 0c0-6 5-8 5-14z"/></svg>';
const gem='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 4h12l4 6-10 11L2 10z M2 10h20 M9 4l3 17 3-17"/></svg>';
const money=r=>(r.c?`◉ ${r.c}`:'')+(r.g?` · ◇ ${r.g}`:'');

/* ============================== 1 · presente diário ============================== */
function giftState(){
 const t=dayIdx();
 const claimedToday=S.last===t;
 let streakNow=S.streak;
 if(!claimedToday&&S.last!==t-1)streakNow=0;           // quebrou a sequência
 const next=claimedToday?S.streak:streakNow+1;          // dia que será (ou foi) resgatado
 return{claimedToday,streakNow,day:((next-1)%7)+1,next};
}
function claimGift(){
 const g=giftState();if(g.claimedToday)return false;
 const r=GIFT[g.day-1];if(!pay(r))return false;
 S.streak=g.next;S.last=dayIdx();save();return r;
}
function giftHTML(){
 const g=giftState();
 return `<section class="ret-dialog" role="dialog" aria-modal="true" aria-labelledby="giftTitle">
  <span class="ret-eyebrow">PRESENTE DIÁRIO</span><h2 id="giftTitle">${g.claimedToday?'Presente de hoje resgatado!':'Seu presente de hoje'}</h2>
  <p>${g.claimedToday?`Sequência de <b>${S.streak}</b> dia${S.streak>1?'s':''}. Volte amanhã para continuar.`:g.streakNow>0?`Sequência atual: <b>${g.streakNow}</b> dia${g.streakNow>1?'s':''}. Resgate hoje para não perdê-la.`:'Entre todo dia para ganhar mais. No 7º dia, o presente é o maior.'}</p>
  <div class="ret-days">${GIFT.map((r,i)=>{const d=i+1,done=g.claimedToday?d<=g.day:d<g.day,now=!g.claimedToday&&d===g.day;return `<div class="ret-day ${done?'done':''} ${now?'now':''} ${d===7?'big':''}"><small>Dia ${d}</small><b>◉ ${r.c}</b>${r.g?`<i>◇ ${r.g}</i>`:'<i>&nbsp;</i>'}${done?'<span class="ret-check">✓</span>':''}</div>`}).join('')}</div>
  <div class="ret-actions"><button class="ghost" data-ret-close>${g.claimedToday?'Fechar':'Depois'}</button>${g.claimedToday?'':'<button class="gold" data-ret-claim-gift>Resgatar presente</button>'}</div>
 </section>`;
}
function openDialog(html){
 let el=document.getElementById('retDialog');
 if(!el){el=document.createElement('div');el.id='retDialog';document.body.appendChild(el)}
 el.innerHTML=html;el.hidden=false;el.querySelector('button.gold,button')?.focus?.();
}
function closeDialog(){const el=document.getElementById('retDialog');if(el)el.hidden=true}
function openGift(){openDialog(giftHTML())}

/* ============================== 2 · metas do dia ============================== */
const bossWins=()=>{try{const h=HuntAPI.loadSave();return Object.values(h.wins||{}).reduce((a,b)=>a+b,0)}catch{return 0}};
const huntTries=()=>{try{const h=HuntAPI.loadSave();return Object.values(h.tries||{}).reduce((a,b)=>a+b,0)}catch{return 0}};
const GOALS={
 wins:{text:'Ganhe 2 duelos',target:2,cur:b=>account.wins-b.wins,reward:{c:50}},
 matches:{text:'Jogue 4 partidas',target:4,cur:b=>account.matches-b.matches,reward:{c:40}},
 boss:{text:'Derrote o chefe do dia',target:1,cur:b=>bossWins()-b.boss,reward:{g:8}},
 hunt:{text:'Jogue a Caçada do Dia',target:1,cur:b=>huntTries()-b.tries,reward:{c:45}},
 damage:{text:'Cause 2.500 de dano',target:2500,cur:b=>S.damage-b.damage,reward:{c:45}}
};
const CHEST={c:0,g:20};
function ensureGoals(){
 const t=dayIdx();
 if(S.goals&&S.goals.day===t)return S.goals;
 const rot=['damage','matches','hunt'][t%3];
 S.goals={day:t,ids:['wins',rot,'boss'],base:{wins:account.wins,matches:account.matches,boss:bossWins(),tries:huntTries(),damage:S.damage},claimed:[false,false,false],chest:false};
 save();return S.goals;
}
function goalRows(){
 const G=ensureGoals();
 return G.ids.map((id,i)=>{const d=GOALS[id],cur=Math.max(0,Math.min(d.target,d.cur(G.base))),done=cur>=d.target;return{id,i,text:d.text,cur,target:d.target,done,claimed:G.claimed[i],reward:d.reward}});
}
function claimGoal(i){
 const G=ensureGoals(),row=goalRows()[i];if(!row||!row.done||row.claimed)return false;
 if(!pay(row.reward))return false;G.claimed[i]=true;save();return true;
}
function claimChest(){
 const G=ensureGoals(),rows=goalRows();if(G.chest||!rows.every(r=>r.claimed))return false;
 if(!pay(CHEST))return false;G.chest=true;save();return true;
}
function goalsCard(){
 const rows=goalRows(),G=ensureGoals(),all=rows.every(r=>r.claimed),n=rows.filter(r=>r.claimed).length;
 const sec=document.createElement('section');sec.className='royal-panel ret-goals';sec.id='dailyGoals';sec.setAttribute('aria-label','Metas de hoje');
 sec.innerHTML=`<div class="ret-goals-head"><span class="royal-eyebrow">METAS DE HOJE</span><b>${n}/3</b></div>
 <div class="ret-goal-list">${rows.map(r=>`<div class="ret-goal ${r.done?'done':''} ${r.claimed?'claimed':''}"><div class="ret-goal-text"><span>${r.text}</span><i class="ret-bar"><u style="width:${100*r.cur/r.target}%"></u></i></div>
  ${r.claimed?'<em class="ret-got">✓</em>':r.done?`<button class="royal-small-gold" data-ret-goal="${r.i}">+${money(r.reward)}</button>`:`<em class="ret-prog">${r.target>999?Math.floor(r.cur/10)*10+'/'+r.target:r.cur+'/'+r.target}</em>`}</div>`).join('')}</div>
 <div class="ret-chest ${G.chest?'got':all?'ready':''}">${G.chest?'Baú do dia aberto ✓':all?`<button class="royal-small-gold" data-ret-chest>Abrir baú do dia · ◇ ${CHEST.g}</button>`:`Complete as 3 metas para abrir o baú · ◇ ${CHEST.g}`}</div>`;
 return sec;
}

/* ---------- tela inicial: botão de presente + cartão de metas ---------- */
const prevHome=renderLobbyHome;
renderLobbyHome=function(){
 prevHome.apply(this,arguments);
 const hdr=document.querySelector('.royal-header');
 if(hdr&&!document.getElementById('openDaily')){
  const g=giftState(),btn=document.createElement('button');btn.id='openDaily';btn.type='button';btn.className='royal-streak';
  btn.setAttribute('aria-label',g.claimedToday?`Sequência de ${S.streak} dias`:'Presente diário disponível');btn.title='Presente diário';
  btn.innerHTML=`${flame}<b>${g.claimedToday?S.streak:g.streakNow}</b>${g.claimedToday?'':'<span class="ret-dot"></span>'}`;
  (document.querySelector('.royal-wallet')||hdr.lastElementChild).after(btn);
 }
 const bottom=document.querySelector('.royal-bottom');
 if(bottom&&account.journey&&account.journey.claimed){
  document.getElementById('dailyGoals')?.remove();
  bottom.classList.remove('single');bottom.appendChild(goalsCard());
 }
 if(auto&&!giftState().claimedToday&&!window.__giftShown){window.__giftShown=true;setTimeout(()=>{if(appScreen==='home'&&state==='select'&&!giftState().claimedToday)openGift()},900)}
};
function refreshHome(){if(appScreen==='home'){const keep=window.__giftShown;renderLobbyHome();window.__giftShown=keep}}
document.addEventListener('click',e=>{
 if(e.target.closest('#openDaily')){openGift();return}
 if(e.target.closest('[data-ret-close]')||e.target.id==='retDialog'){closeDialog();return}
 if(e.target.closest('[data-ret-claim-gift]')){const r=claimGift();if(r){openGift();refreshHome();announce('Presente resgatado: '+money(r))}return}
 const gb=e.target.closest('[data-ret-goal]');if(gb){if(claimGoal(+gb.dataset.retGoal)){announce('Meta resgatada');refreshHome()}return}
 if(e.target.closest('[data-ret-chest]')){if(claimChest()){announce('Baú do dia aberto');refreshHome()}return}
});
addEventListener('keydown',e=>{if(e.key==='Escape')closeDialog()});

/* ---------- contagem de dano e fim de partida ---------- */
function recordMatch(){try{if(p&&p.damage>0){S.damage=(S.damage||0)+Math.round(p.damage);save()}}catch{}}
const prevFinish=finish;
finish=function(){const was=state;const r=prevFinish.apply(this,arguments);if(was!=='end'&&state==='end')recordMatch();return r};
const prevEnd=endArenaMode;
endArenaMode=function(win,draw){const first=modeRun&&!modeRun.settled;const r=prevEnd.apply(this,arguments);if(first)recordMatch();return r};

/* ============================== 3 · tutorial ============================== */
const STEPS=[
 {sel:'#stick',title:'Mover',text:'Arraste o analógico para andar pela arena.'},
 {sel:'.action-group',title:'Dash',text:'O botão grande é o DASH: um toque desliza com um instante de invulnerabilidade. As habilidades ficam em meia-lua ao redor dele; a 1ª é a mais rápida e a última é a ultimate.'},
 {sel:'.control-center',title:'Habilidades',text:'Toque numa habilidade para usar; arraste para escolher a direção. Cada uma tem recarga.'},
 {sel:'.hud',title:'Como vencer',text:'Esvazie a barra de vida do rival antes do tempo acabar. Avisos vermelhos no chão mostram onde um golpe forte vai cair.'}
];
let tut=null;
function tutorialEnd(done){
 const el=document.getElementById('tutorial');if(el)el.remove();
 if(tut&&tut.after)tut.after();
 tut=null;
}
function tutorialShow(){
 let el=document.getElementById('tutorial');
 if(!el){el=document.createElement('div');el.id='tutorial';document.body.appendChild(el)}
 const st=STEPS[tut.i],target=document.querySelector(st.sel),r=target?target.getBoundingClientRect():{left:innerWidth/2-60,top:innerHeight/2-40,width:120,height:80,right:innerWidth/2+60,bottom:innerHeight/2+40};
 const pad=8,x=r.left-pad,y=r.top-pad,w=r.width+pad*2,h=r.height+pad*2;
 const below=y+h+150<innerHeight,cy=below?y+h+10:Math.max(8,y-10),cx=clamp(x+w/2,160,innerWidth-160);
 el.innerHTML=`<div class="tut-spot" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>
  <div class="tut-card" role="dialog" aria-modal="true" aria-labelledby="tutTitle" style="left:${cx}px;top:${cy}px;transform:translate(-50%,${below?'0':'-100%'})">
   <span class="ret-eyebrow">COMO JOGAR · ${tut.i+1}/${STEPS.length}</span><h3 id="tutTitle">${st.title}</h3><p>${st.text}</p>
   <div class="tut-actions"><button class="ghost" data-tut-skip>Pular</button><button class="gold" data-tut-next>${tut.i===STEPS.length-1?'Entendi, vamos lutar!':'Próximo'}</button></div></div>`;
 el.querySelector('[data-tut-next]').focus?.();
}
function startTutorial(after){
 tut={i:0,after};tutorialShow();
}
document.addEventListener('click',e=>{
 if(!tut)return;
 if(e.target.closest('[data-tut-next]')){tut.i++;if(tut.i>=STEPS.length){S.tutorial=true;save();tutorialEnd(true)}else tutorialShow()}
 else if(e.target.closest('[data-tut-skip]')){S.tutorial=true;save();tutorialEnd(false)}
});
addEventListener('resize',()=>{if(tut)tutorialShow()});
const prevStart=start;
start=function(){
 const r=prevStart.apply(this,arguments);
 if(state==='count'&&(FORCE_TUT||(auto&&!S.tutorial))){
  state='paused';
  startTutorial(()=>{state='count';count=3.4;const c=document.getElementById('countdown');if(c){c.style.display='flex'}last=performance.now()});
 }
 return r;
};
// "Como jogar" no menu de pausa: revê o tutorial sem sair da luta
(()=>{
 const dlg=document.querySelector('#pause .dialog');if(!dlg||document.getElementById('howTo'))return;
 const b=document.createElement('button');b.type='button';b.className='ghost';b.id='howTo';b.textContent='Como jogar';
 const resume=document.getElementById('resume');(resume||dlg.lastElementChild).before(b);
 b.addEventListener('click',()=>{const pz=document.getElementById('pause'),keep=pz.style.display;pz.style.display='none';startTutorial(()=>{pz.style.display=keep||'flex'})});
})();

/* ============================== 4 · compartilhar ============================== */
(()=>{
 const dlg=document.querySelector('#outcome .dialog');if(!dlg||document.getElementById('shareResult'))return;
 const b=document.createElement('button');b.type='button';b.className='ghost';b.id='shareResult';b.textContent='Compartilhar resultado';
 const rematch=document.getElementById('rematch');(rematch||dlg.lastElementChild).after(b);
 b.addEventListener('click',async()=>{
  const title=document.getElementById('resultTitle')?.textContent||'',stats=[...document.querySelectorAll('#stats span')].map(s=>s.textContent).join(' · ');
  const url=location.origin+location.pathname.replace(/index\.html$/,'');
  const text=`${title} ${stats?'('+stats+') ':''}— Eldoria · Arena dos Campeões. Consegue fazer melhor? ${url}`;
  try{
   if(navigator.share){await navigator.share({title:'Eldoria · Arena dos Campeões',text,url});toast('Compartilhado!');return}
   await navigator.clipboard.writeText(text);toast('Resultado copiado! Cole onde quiser.');
  }catch(err){if(err&&err.name==='AbortError')return;toast('Não foi possível compartilhar.')}
 });
})();

window.RetQA={get state(){return S},giftState,claimGift,goalRows,claimGoal,claimChest,reset(){S=load();localStorage.removeItem(KEY);S=load()},set(o){Object.assign(S,o);save()},refreshHome,dayIdx,STEPS,get tutorialActive(){return!!tut}};
})();
