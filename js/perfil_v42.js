'use strict';
/*
 * Perfil v42 — nível da conta, foto de perfil, molduras e a nova tela de perfil.
 *  - NÍVEL DA CONTA (account.conta = {lv, xp}): tudo dá XP. Partida vencida +50, derrota +20, empate +30 (qualquer modo),
 *    treino no Dojo +10, presente diário +25, missões da jornada +40. Cada nível pede 80 + 20×nível de XP (1→2: 100).
 *    Ao subir de nível: moedas (50 + 10×nível) e, em certos níveis, uma moldura nova.
 *  - FOTO (account.profile.photo): 'auto' (rosto do campeão atual), 'h<id>' (rosto de um campeão liberado) ou 's<id>' (símbolo).
 *  - MOLDURA (account.profile.frame): liberadas pelo nível da conta. Desenhadas por CSS (css/perfil_v42.css).
 *  - TELA DE PERFIL: nome, nível/XP, liga, números da conta, abas Fotos e Molduras. A primeira criação de perfil continua
 *    usando a tela antiga (#profileScreen).
 */
(function(){
const $q=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MAX_LV=100;
const need=lv=>80+20*lv;
const dayKey=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
const firstWinReady=()=>{try{return !!account.profile&&rec().firstWin!==dayKey()}catch{return false}};
const XP={win:50,loss:20,draw:30,training:10,gift:25,mission:40};
const FRAMES=[
 {id:'azul',name:'Guardião',lv:1},
 {id:'bronze',name:'Bronze',lv:2},
 {id:'prata',name:'Prata',lv:4},
 {id:'ouro',name:'Ouro Real',lv:6},
 {id:'jade',name:'Jade',lv:8},
 {id:'sakura',name:'Sakura',lv:10},
 {id:'rubi',name:'Rubi',lv:13},
 {id:'dragao',name:'Dragão',lv:16},
 {id:'celeste',name:'Celestial',lv:20}
];
const SYM_BG=['#e0784a','#3b6fd6','#7a4fd6','#d6457a','#2f9e8f','#d6a12f'];
const TIERS=['bronze','prata','ouro','platina','diamante','mestre'];

/* ---------- nível da conta ---------- */
function rec(){const c=account.conta||(account.conta={lv:1,xp:0,total:0});c.lv=Math.max(1,Math.min(MAX_LV,Math.floor(+c.lv)||1));c.xp=Math.max(0,Math.floor(+c.xp)||0);c.total=Math.max(0,Math.floor(+c.total)||0);return c}
function gain(n,why=''){
 if(!account?.profile||!(n>0))return{ups:0,gain:0,lv:rec().lv};
 const c=rec();let ups=0,coins=0;const before=c.lv;c.total+=n;
 if(c.lv<MAX_LV){c.xp+=n;while(c.lv<MAX_LV&&c.xp>=need(c.lv)){c.xp-=need(c.lv);c.lv++;ups++;coins+=50+10*c.lv}if(c.lv>=MAX_LV)c.xp=0}
 if(coins)account.coins=(account.coins||0)+coins;
 try{saveAccount()}catch{}
 if(ups){
  const fr=FRAMES.filter(f=>f.lv>before&&f.lv<=c.lv);
  try{toast(`Conta subiu para o nível ${c.lv}! +${coins} moedas${fr.length?` · moldura ${fr.map(f=>f.name).join(', ')}`:''}`)}catch{}
 }
 return{ups,gain:n,lv:c.lv,coins,why};
}

/* ---------- fotos ---------- */
const faces=new Map(),loading=new Set();
function faceOf(id){
 if(faces.has(id))return faces.get(id);
 const c=CHAMPIONS[id];if(!c)return'';
 let src='';try{src=championArt(c)}catch{}
 if(!src)return'';
 if(!loading.has(id)){
  loading.add(id);const im=new Image();
  im.onload=()=>{let u=src;try{u=window.v3FaceCrop?v3FaceCrop(im):src}catch{}faces.set(id,u);document.querySelectorAll(`img[data-v42-face="${id}"]`).forEach(el=>el.src=u)};
  im.onerror=()=>faces.set(id,'');im.src=src;
 }
 return src;   // enquanto o recorte não fica pronto, mostra a arte inteira
}
const owned=id=>{try{return(account.champions||[]).includes(id)||(account.ownedHeroes||[]).includes(id)}catch{return false}};
function currentId(){try{return currentChampion().id}catch{return 0}}
function photoKey(){const k=account.profile?.photo||'auto';if(/^h\d+$/.test(k)&&!owned(+k.slice(1)))return'auto';return k}
// HTML do conteúdo da foto (sem moldura)
function photoInner(key=photoKey()){
 if(key[0]==='s'){const i=+key.slice(1)||0;return `<span class="v42-sym" style="--bg:${SYM_BG[i%SYM_BG.length]}">${avatarSVG(i)}</span>`}
 const id=key==='auto'?currentId():+key.slice(1);
 return `<img src="${esc(faceOf(id))}" data-v42-face="${id}" alt="" draggable="false">`;
}
function frameId(){const f=account.profile?.frame||'azul',d=FRAMES.find(x=>x.id===f);return d&&rec().lv>=d.lv?f:'azul'}
function avatar(size='',key,frame){return `<span class="v42-ava ${size}" data-frame="${frame||frameId()}"><span class="v42-ava-in">${photoInner(key)}</span></span>`}

/* ---------- botão do perfil na tela inicial ---------- */
function chip(){
 const n=account.profile?.name||'',lv=rec().lv;
 return `<button class="v40-chip v40-profile v41-profile v42-chip" data-nav="profile" aria-label="Perfil de ${esc(n)}, nível ${lv}">${avatar('sm')}<i class="v42-lv" aria-hidden="true">${lv}</i><b>${esc(n)}</b></button>`;
}

/* ---------- tela de perfil ---------- */
let tab='fotos',draft=null;
function leagueTier(){try{const pts=window.V3Liga?V3Liga.rec('1v1').points||0:account.league?.points||0;const d=window.V3Liga?V3Liga.divOf(pts):Math.min(5,Math.floor(pts/75));return{d,name:window.V3Liga?V3Liga.rankName(pts):LEAGUE_DIVISIONS[d],pts}}catch{return{d:0,name:'Bronze',pts:0}}}
function screen(){
 let el=$q('#perfilV42');
 if(!el){el=document.createElement('section');el.id='perfilV42';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-label','Perfil');document.body.appendChild(el);bind(el)}
 return el;
}
function render(){
 const el=screen(),c=rec(),L=leagueTier(),max=c.lv>=MAX_LV,w=max?100:Math.round(100*c.xp/need(c.lv));
 const heroes=CHAMPIONS.map(h=>h.id);
 const nOwned=heroes.filter(owned).length;
 const photos=[
  `<button type="button" class="v42-opt ${draft.photo==='auto'?'on':''}" data-photo="auto" aria-pressed="${draft.photo==='auto'}">${avatar('md','auto','azul')}<span>Campeão atual</span></button>`,
  ...heroes.map(id=>{const ok=owned(id),k='h'+id;return `<button type="button" class="v42-opt ${draft.photo===k?'on':''} ${ok?'':'lock'}" data-photo="${k}" ${ok?'':'disabled'} aria-pressed="${draft.photo===k}" title="${esc(CHAMPIONS[id].name)}${ok?'':' · libere o campeão'}">${avatar('md',k,'azul')}<span>${esc(CHAMPIONS[id].name.split(' ')[0])}</span></button>`}),
  ...AVATARS.map((a,i)=>{const k='s'+i;return `<button type="button" class="v42-opt ${draft.photo===k?'on':''}" data-photo="${k}" aria-pressed="${draft.photo===k}">${avatar('md',k,'azul')}<span>${esc(a.name)}</span></button>`})
 ].join('');
 const frames=FRAMES.map(f=>{const ok=c.lv>=f.lv;return `<button type="button" class="v42-opt ${draft.frame===f.id?'on':''} ${ok?'':'lock'}" data-frame-pick="${f.id}" ${ok?'':'disabled'} aria-pressed="${draft.frame===f.id}">${avatar('md',draft.photo,f.id)}<span>${esc(f.name)}</span>${ok?'':`<em>Nível ${f.lv}</em>`}</button>`}).join('');
 el.innerHTML=`<div class="v42-wrap">
 <header class="v42-top"><button type="button" class="v42-back" data-v42-close aria-label="Voltar">‹</button><h1>PERFIL</h1><span class="v42-coins">🪙 ${(account.coins||0).toLocaleString('pt-BR')}</span></header>
 <div class="v42-body">
  <section class="v42-card">
   <div class="v42-big">${avatar('lg',draft.photo,draft.frame)}<i class="v42-lv big">${c.lv}</i></div>
   <label class="v42-label" for="v42Name">NOME NA ARENA</label>
   <div class="v42-name"><input id="v42Name" maxlength="16" minlength="2" autocomplete="nickname" value="${esc(draft.name)}" aria-describedby="v42Err"><span aria-hidden="true">✎</span></div>
   <div class="v42-err" id="v42Err" role="status"></div>
   <div class="v42-xp"><b>NÍVEL ${c.lv}</b><div class="v42-bar"><i style="width:${w}%"></i></div><small>${max?'Nível máximo':`${c.xp} / ${need(c.lv)} XP`}</small></div>
   <div class="v42-stats">
    <div class="v42-rank" data-tier="${L.d}"><span>${lobbyEmblem(L.d)}</span><b>${esc(L.name)}</b><small>${L.pts} pts</small></div>
    <div><b>${account.matches||0}</b><small>Partidas</small></div>
    <div><b>${account.wins||0}</b><small>Vitórias</small></div>
    <div><b>${nOwned}/${heroes.length}</b><small>Campeões</small></div>
   </div>
   <p class="v42-how">XP: vitória +${XP.win} (1ª do dia em dobro) · derrota +${XP.loss} · treino +${XP.training} · presente +${XP.gift} · missões +${XP.mission}. Cada nível dá moedas.</p>
  </section>
  <section class="v42-pick">
   <div class="v42-tabs" role="tablist"><button type="button" role="tab" data-v42-tab="fotos" aria-selected="${tab==='fotos'}">Fotos</button><button type="button" role="tab" data-v42-tab="molduras" aria-selected="${tab==='molduras'}">Molduras</button></div>
   <div class="v42-grid">${tab==='fotos'?photos:frames}</div>
  </section>
 </div>
 <footer class="v42-foot"><button type="button" class="v42-save" data-v42-save>Salvar perfil</button></footer>
 </div>`;
}
function bind(el){
 el.addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t||t.disabled)return;
  if(t.matches('[data-v42-close]'))return close();
  if(t.matches('[data-v42-save]'))return save();
  if(t.dataset.v42Tab){draft.name=$q('#v42Name').value;tab=t.dataset.v42Tab;render();return}
  if(t.dataset.photo){draft.name=$q('#v42Name').value;draft.photo=t.dataset.photo;render();return}
  if(t.dataset.framePick){draft.name=$q('#v42Name').value;draft.frame=t.dataset.framePick;render();return}
 });
 el.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Enter'&&e.target.id==='v42Name')save()});
}
function open(){
 draft={name:account.profile?.name||'',photo:photoKey(),frame:frameId()};tab='fotos';
 render();screen().hidden=false;document.body.classList.add('v42-open');
}
function close(){const el=$q('#perfilV42');if(el)el.hidden=true;document.body.classList.remove('v42-open');try{if(appScreen==='home')showScreen('home')}catch{}}
function save(){
 const name=($q('#v42Name')?.value||'').trim().replace(/\s+/g,' ');
 if(name.length<2||name.length>16){$q('#v42Err').textContent='Use um nome com 2 a 16 caracteres.';return false}
 const old={...account.profile};
 Object.assign(account.profile,{name,photo:draft.photo,frame:draft.frame});
 if(!saveAccount()){account.profile=old;$q('#v42Err').textContent='Não foi possível salvar. Ative o armazenamento do navegador.';return false}
 try{toast('Perfil salvo!')}catch{}
 close();return true;
}
const prevOpen=openProfile;
openProfile=function(){if(!account.profile)return prevOpen.apply(this,arguments);open()};

/* ---------- XP: partidas (qualquer modo) ---------- */
let paid=false;   // um pagamento por resultado: libera de novo quando a tela de resultado some
function outcomeXp(){
 if(paid)return;
 try{if(battleActivity==='training')return}catch{}
 paid=true;
 const title=($q('#resultTitle')?.textContent||'').trim();
 const draw=/empate/i.test(title);
 const win=!draw&&/é sua|concluíd|derrotad|vit[oó]r|campe[aã]o/i.test(title)&&!/prevaleceu|venceu|aprendizado|encerrad/i.test(title);
 const first=win&&firstWinReady();if(first)rec().firstWin=dayKey();
 const g=gain((draw?XP.draw:win?XP.win:XP.loss)*(first?2:1),'partida');if(first)g.first=true;
 const el=$q('#resultText');
 if(el&&g.gain)el.textContent=el.textContent+` Conta: +${g.gain} XP${g.first?' (1ª vitória do dia: em dobro)':''}${g.ups?` · NÍVEL ${g.lv}!`:''}.`;
 try{const st=$q('#stats');if(st&&g.gain)st.insertAdjacentHTML('beforeend',`<span class="v42-xp-stat">+${g.gain} XP de conta</span>`)}catch{}
}
function watchOutcome(){
 const o=$q('#outcome');if(!o)return setTimeout(watchOutcome,500);
 const check=()=>{const vis=!o.hidden&&getComputedStyle(o).display!=='none';if(vis)setTimeout(outcomeXp,0);else paid=false};
 new MutationObserver(check).observe(o,{attributes:true,attributeFilter:['style','hidden','class']});
}
watchOutcome();

/* ---------- XP: treino, presente diário, missões ---------- */
const prevLeave=leave;
leave=function(){
 try{if(battleActivity==='training'&&(trainingSession?.damage||0)>=100&&trainingSession.v42!==true){trainingSession.v42=true;gain(XP.training,'treino')}}catch{}
 return prevLeave.apply(this,arguments);
};
const prevClaim=claimJourney;
claimJourney=function(){const r=prevClaim.apply(this,arguments);if(r)gain(XP.mission,'missão');return r};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
function checkGift(){
 try{if(!account.profile||!window.RetQA)return;const g=RetQA.giftState();const c=rec();if(g.claimedToday&&c.gift!==today()){c.gift=today();gain(XP.gift,'presente');try{if(appScreen==='home'&&!$q('body.v42-open'))showScreen('home')}catch{}}}catch{}
}
setInterval(checkGift,1500);

window.ContaV42={firstWinReady,rec,gain,need,XP,FRAMES,TIERS,chip,avatar,open,close,save,photoKey,frameId,MAX_LV};
})();
