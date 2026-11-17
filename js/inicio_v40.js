'use strict';
/*
 * Início v40 — tela inicial amigável + tela de modos de jogo.
 *  - Início: perfil e liga em cima à esquerda; moedas, presente e menu em cima à direita; campeão grande no centro;
 *    atalhos grandes embaixo à esquerda; cartão do MODO escolhido + JOGAR embaixo à direita.
 *  - Modos: cartões grandes que se arrastam para o lado (toque ou mouse), em seções Ranqueado · Casual · Desafios · Treino,
 *    com abas embaixo. Tocar num cartão registra o modo no início; JOGAR abre esse modo.
 * O layout anterior continua montado (escondido) para que os módulos antigos encontrem seus elementos.
 * ?inicio=0 volta à tela anterior.
 */
(function(){
if(/[?&]inicio=0/.test(location.search))return;
const $q=s=>document.querySelector(s);
const esc=s=>typeof escapeHTML==='function'?escapeHTML(String(s)):String(s);
const ART='assets/inicio_v40/';

/* ---------- modos ---------- */
const CATS=[['rank','Ranqueado','#f2b84b'],['casual','Casual','#58c4f0'],['desafio','Desafios','#b58cf2'],['treino','Treino','#7fd67a']];
const liga=id=>()=>window.V3Liga?.play(id);
const casual=(mode,kind)=>()=>{lobbyPrefs.mode=mode;try{saveLobbyPrefs()}catch{}window.V3Kof?.open(kind)};
function huntName(){try{return window.huntQA?.bossOfDay?.()?.name||''}catch{return''}}
const MODES=[
 {id:'liga1',cat:'rank',name:'Liga 1×1',sub:'Suba de divisão',tag:'1×1',art:0,run:liga('1v1')},
 {id:'liga2',cat:'rank',name:'Liga 2×2',sub:'Você e um aliado',tag:'2×2',art:1,run:liga('2v2')},
 {id:'ligaTrio',cat:'rank',name:'Liga Trio',sub:'Três campeões por lado',tag:'3×3',art:2,run:liga('kof')},
 {id:'ligaCoroa',cat:'rank',name:'Liga da Coroa',sub:'Cada um por si',tag:'4 lutadores',art:3,run:liga('ffa')},
 {id:'online',cat:'rank',name:'Online',sub:'Em breve',tag:'',art:11,soon:true},
 {id:'duelo',cat:'casual',name:'Duelo 1×1',sub:'Treine sem pressão',tag:'1×1',art:4,run:casual('1v1','1v1')},
 {id:'equipes',cat:'casual',name:'Equipes 2×2',sub:'Lute ao lado de um aliado',tag:'2×2',art:5,run:casual('2v2','2v2')},
 {id:'trio',cat:'casual',name:'Trio de Campeões',sub:'Quem vence continua',tag:'3×3',art:2,run:()=>window.V3Kof?.open('kof')},
 {id:'coroa',cat:'casual',name:'Disputa da Coroa',sub:'O último de pé leva',tag:'4 lutadores',art:3,run:()=>window.V3Kof?.open('crown')},
 {id:'zona',cat:'casual',name:'Controle de Zona',sub:'Em reformulação',tag:'2×2',art:11,soon:true},
 {id:'cacada',cat:'desafio',name:'Caçada do Dia',sub:()=>huntName()||'Um chefe por dia',tag:'Solo ou dupla',art:6,run:()=>window.huntQA?.lobby()},
 {id:'guardiao',cat:'desafio',name:'Caçada ao Guardião',sub:'Fuja das áreas vermelhas',tag:'Cooperativo',art:7,run:()=>beginArenaMode('guardian')},
 {id:'cruzada',cat:'desafio',name:'Cruzada Arcade',sub:'Fase, horda e chefe',tag:'Solo',art:8,run:()=>beginArenaMode('stage')},
 {id:'torneio',cat:'desafio',name:'Torneio dos Campeões',sub:'Chaves até a final',tag:'8 lutadores',art:9,run:()=>window.V3Tour?.open()},
 {id:'dojo',cat:'treino',name:'Dojo',sub:'Teste golpes no boneco',tag:'Treino livre',art:10,run:()=>showScreen('training')}
];
const byId=id=>MODES.find(m=>m.id===id);
const subOf=m=>typeof m.sub==='function'?m.sub():m.sub;
function current(){const m=byId(account.v40Mode);return m&&!m.soon?m:byId('liga1')}
function choose(id){const m=byId(id);if(!m||m.soon)return false;account.v40Mode=id;try{saveAccount()}catch{}return true}
function play(){const m=current();closeAll();try{m.run()}catch(e){console.error('[Eldoria] iniciar modo',m.id,e);toast?.('Não foi possível abrir '+m.name)}}

/* ---------- ícones ---------- */
const I={
 menu:'<path d="M5 8h22M5 16h22M5 24h22"/>',coin:'<circle cx="16" cy="16" r="11"/><path d="M16 9v14M12 12.5c0-2 8-2 8 0s-8 2-8 5 8 2.5 8 0"/>',gem:'<path d="M9 5h14l5 7-12 15L4 12z"/><path d="M4 12h24M12 5l-3 7 7 15 7-15-3-7"/>',
 hero:'<path d="M16 4l10 4v7c0 7-5 11-10 13C11 26 6 22 6 15V8z"/><path d="M11 15l4 4 7-8"/>',quest:'<rect x="7" y="5" width="18" height="23" rx="3"/><path d="M12 12h8M12 17h8M12 22h5"/>',
 shop:'<path d="M6 11h20l-2 15H8z"/><path d="M11 11V8a5 5 0 0 1 10 0v3"/>',dojo:'<path d="M7 25 25 7M7 7l18 18M5 22l5 5M22 5l5 5"/>',back:'<path d="M19 6l-10 10 10 10"/>',home:'<path d="M5 15 16 6l11 9M8 13v13h16V13"/>',
 swap:'<path d="M8 11h16l-4-4M24 21H8l4 4"/>',close:'<path d="M8 8l16 16M24 8 8 24"/>',chev:'<path d="M12 7l9 9-9 9"/>',lock:'<rect x="8" y="14" width="16" height="13" rx="2"/><path d="M11 14V10a5 5 0 0 1 10 0v4"/>',
 crown:'<path d="M5 24h22l2-14-7 5-6-9-6 9-7-5z"/>',gear:'<circle cx="16" cy="16" r="4"/><path d="M16 4v4M16 24v4M4 16h4M24 16h4M7.5 7.5l2.8 2.8M21.7 21.7l2.8 2.8M7.5 24.5l2.8-2.8M21.7 10.3l2.8-2.8"/>',full:'<path d="M5 12V5h7M20 5h7v7M27 20v7h-7M12 27H5v-7"/>',
 play:'<path d="M10 6l16 10-16 10z"/>',gift:'<rect x="5" y="12" width="22" height="15" rx="2"/><path d="M3 8h26v4H3zM16 8v19M16 8c-3-5-9-5-8-1s8 1 8 1c0 0 7 3 8-1s-5-4-8 1"/>'
};
const svg=(n,c='')=>`<svg class="v40i ${c}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]||''}</svg>`;
const n=v=>{try{return lobbyWalletNumber(v)}catch{return String(v||0)}};

/* ---------- dados do início ---------- */
function heroFace(){let c;try{c=currentChampion()}catch{return''}try{const f=window.v3FaceSrc?.({skin:c.id,kit:[...c.kit]});if(f)return f}catch{}try{return championArt(c)}catch{return''}}
function leagueInfo(){
 try{const L=window.V3Liga;if(L){const r=L.rec('1v1');const pts=r.points||0;return{name:L.rankName(pts),pts,next:(pts%75)/75}}}catch{}
 const pts=account.league?.points||0;return{name:LEAGUE_DIVISIONS[leagueIndex()],pts,next:(pts%75)/75};
}
function heroLevel(){try{return window.V3Levels?.rec(currentChampion().id).lv||1}catch{return 1}}

/* ---------- recompensas e eventos ---------- */
const REWARD={liga1:'+100 moedas · +25 pts',liga2:'+200 moedas · +20 pts',ligaTrio:'+250 moedas · +30 pts',ligaCoroa:'1º lugar: +30 pts',duelo:'+100 moedas',equipes:'+200 moedas',trio:'+250 moedas',coroa:'+150 moedas',cacada:'Recompensa do chefe do dia',guardiao:'+200 moedas',cruzada:'Fase completa: +150 moedas',torneio:'Campeão: +250 moedas',dojo:'Treino livre, sem custo'};
function leagueNext(){
 try{const L=window.V3Liga,pts=L?L.rec('1v1').points||0:account.league?.points||0;const name=L?L.rankName(pts):LEAGUE_DIVISIONS[leagueIndex()];
  const max=75*5;if(pts>=max)return{name,pts,txt:'Divisão máxima',k:1,div:5};
  const nxt=(Math.floor(pts/25)+1)*25,nm=L?L.rankName(nxt):LEAGUE_DIVISIONS[Math.min(5,Math.floor(nxt/75))];
  return{name,pts,txt:`${nxt-pts} pts até ${nm}`,k:(pts%25)/25,div:Math.min(5,Math.floor(pts/75))}}catch{return{name:'Bronze',pts:0,txt:'',k:0,div:0}}
}
function emblem(div){try{return lobbyEmblem(div)}catch{return svg('crown','v40gold')}}
function missionsBadge(){try{const j=account.journey||{};if(j.claimed)return'';const left=['training','duel','build'].filter(k=>!j[k]).length;return left?String(left):'!'}catch{return''}}
function giftInfo(){try{const g=window.RetQA?.giftState?.();if(!g)return null;return{ready:!g.claimedToday,days:g.claimedToday?window.RetQA.S?.streak??g.next:g.streakNow}}catch{return null}}
function hhmm(ms){const m=Math.max(0,Math.floor(ms/60000));return `${Math.floor(m/60)}h ${String(m%60).padStart(2,'0')}m`}
function eventInfo(){
 let boss=null;try{boss=window.huntQA?.bossOfDay?.()}catch{}
 const mid=new Date();mid.setHours(24,0,0,0);
 let free=[];try{free=heroesFreeThisWeek()}catch{}
 return{boss,left:hhmm(mid-Date.now()),free};
}
function faceOf(id){try{const c=CHAMPIONS[id];return window.v3FaceSrc?.({skin:id,kit:[...c.kit]})||championArt(c)}catch{return''}}

/* ---------- tela inicial ---------- */
function homeMarkup(){
 const c=currentChampion(),L=leagueNext(),m=current(),cat=CATS.find(k=>k[0]===m.cat),mb=missionsBadge(),gift=giftInfo(),ev=eventInfo();
 let free=false;try{free=dailyAvailable()}catch{}
 return `<div class="v40-home v41">
 <div class="v41-scene" aria-hidden="true">
  <div class="v41-layer v41-sky" data-depth="0.15"></div>
  <div class="v41-layer v41-far" data-depth="0.35"></div>
  <div class="v41-layer v41-wall" data-depth="0.6"></div>
  <div class="v41-layer v41-floor" data-depth="0.8"></div>
  <canvas class="v41-fx"></canvas>
  <div class="v41-layer v41-front" data-depth="1.25"></div>
 </div>
 <header class="v40-top">
  <div class="v40-top-left">
   <button class="v40-chip v40-profile v41-profile" data-nav="profile" aria-label="Perfil de ${esc(account.profile.name)}"><span class="v40-avatar"><img src="${heroFace()}" alt=""></span><b>${esc(account.profile.name)}</b></button>
   <button class="v40-chip v40-league v41-league" data-nav="league" aria-label="Liga ${esc(L.name)}, ${L.pts} pontos. ${esc(L.txt)}"><span class="v41-emblem">${emblem(L.div)}</span><span><b>${esc(L.name)}</b><span class="v40-bar"><i style="width:${Math.round(L.k*100)}%"></i></span><small>${esc(L.txt)}</small></span></button>
  </div>
  <div class="v40-top-right">
   <button class="v40-cur" data-nav="shop" aria-label="${account.coins} moedas. Abrir loja">${svg('coin','v40gold')}<b>${n(account.coins)}</b><span class="v41-plus">+</span></button>
   <button class="v40-cur" data-nav="shop" aria-label="${account.crystals} cristais. Abrir loja">${svg('gem','v40blue')}<b>${n(account.crystals)}</b><span class="v41-plus">+</span></button>
   ${gift?`<button class="v40-round v41-gift ${gift.ready?'ready':''}" data-v41-gift aria-label="${gift.ready?'Presente diário disponível':'Presente diário'} · sequência de ${gift.days} dias">${svg('gift')}${gift.ready?'<i class="v41-dot">!</i>':''}<small>${gift.ready&&!gift.days?'Pegar!':gift.days+(gift.days===1?' dia':' dias')}</small></button>`:''}
   <button class="v40-round" data-v40-menu aria-label="Menu">${svg('menu')}</button>
  </div>
 </header>
 <section class="v40-stage v41-stage" aria-label="Campeão selecionado">
  <div class="v41-pedestal" aria-hidden="true"><i></i><i></i></div>
  <div class="v40-hero-wrap"><span class="v40-slot-hero"></span></div>
 </section>
 ${ev.boss?`<button class="v41-event" data-v41-hunt aria-label="Caçada do dia: ${esc(ev.boss.name)}"><small>CAÇADA DO DIA</small><b>${esc(ev.boss.name.split(',')[0])}</b><em>⏳ troca em ${ev.left}</em></button>`:''}
 <nav class="v40-side v41-side" aria-label="Atalhos">
  <button data-nav="library" style="--i:0"><span class="v41-ico"></span><span class="v41-lbl">Campeões</span></button>
  <button data-v40-missions style="--i:1"><span class="v41-ico"></span><span class="v41-lbl">Missões</span>${mb?`<i class="v41-badge">${mb}</i>`:''}</button>
  <button data-nav="shop" style="--i:2"><span class="v41-ico"></span><span class="v41-lbl">Loja</span>${free?'<i class="v41-badge v41-badge-free">GRÁTIS</i>':''}</button>
  <button data-nav="training" style="--i:3"><span class="v41-ico"></span><span class="v41-lbl">Dojo</span></button>
 </nav>
 <div class="v40-go">
  <button class="v40-mode" data-v40-modes style="--cat:${cat[2]}" aria-label="Modo: ${esc(m.name)}. ${esc(REWARD[m.id]||'')}. Toque para trocar">
   <span class="v40-mode-art" style="--c:${m.art%4};--r:${Math.floor(m.art/4)}"></span>
   <span class="v40-mode-txt"><small>${esc(cat[1].toUpperCase())}</small><b>${esc(m.name)}</b><em>${esc(REWARD[m.id]||subOf(m))}</em></span>
   <span class="v40-mode-chev">${svg('chev')}</span>
  </button>
  <button class="v40-play v41-play" data-v40-play>JOGAR</button>
 </div>
 </div>`;
}
function mountHome(){
 const home=$q('#homeScreen');if(!home||!account.profile)return;
 // guarda o layout anterior (escondido) para os módulos antigos
 let legacy=home.querySelector(':scope>.v40-legacy');
 const old=[...home.childNodes].filter(x=>!(x.classList&&(x.classList.contains('v40-legacy')||x.classList.contains('v40-home'))));
 if(!legacy){legacy=document.createElement('div');legacy.className='v40-legacy';legacy.hidden=true;home.appendChild(legacy)}
 if(old.length)legacy.replaceChildren(...old);
 home.querySelector(':scope>.v40-home')?.remove();
 home.insertAdjacentHTML('afterbegin',homeMarkup());
 const ui=home.querySelector('.v40-home');
 // reaproveita o canvas animado do campeão e o presente diário
 const canvas=legacy.querySelector('#lobbyHero'),fb=legacy.querySelector('#lobbyHeroFallback');
 if(canvas)ui.querySelector('.v40-slot-hero').replaceWith(canvas);
 if(fb){fb.classList.add('v40-fallback');ui.querySelector('.v40-hero-wrap').append(fb)}
 if(!legacy.querySelector('.royal-sanctuary'))legacy.insertAdjacentHTML('beforeend','<i class="royal-sanctuary" hidden></i>');   // o desenho animado do campeão (lobby_real.js) só roda se este marcador existir
 syncNav();
 // missões vão para uma janela própria
 ensureMissions();
 try{lobbyPainted=false;lobbyPaintAt=-Infinity}catch{}
 try{window.CenaV41?.mount(ui)}catch(e){console.error('[Eldoria] cenário',e)}
}
const prevHome=renderLobbyHome;
renderLobbyHome=function(){prevHome.apply(this,arguments);try{mountHome()}catch(e){console.error('[Eldoria] início v40',e)}};
const prevNav=renderLobbyNav;
renderLobbyNav=function(){prevNav.apply(this,arguments);syncNav()};

/* ---------- janelas: menu e missões ---------- */
function ensureMissions(){
 let box=$q('#v40Missions');
 if(!box){box=document.createElement('div');box.id='v40Missions';box.className='v40-sheet';box.hidden=true;box.innerHTML=`<div class="v40-sheet-card"><header><b>Missões</b><button class="v40-round" data-v40-close aria-label="Fechar">${svg('close')}</button></header><div class="v40-sheet-body"></div></div>`;document.body.appendChild(box)}
 const j=$q('#homeScreen .v40-legacy #journeyHome');if(j)box.querySelector('.v40-sheet-body').replaceChildren(j);
}
function openMenu(){
 let box=$q('#v40Menu');
 if(!box){box=document.createElement('div');box.id='v40Menu';box.className='v40-sheet v40-menu';box.hidden=true;document.body.appendChild(box)}
 const items=[['library','hero','Campeões'],['shop','shop','Loja'],['training','dojo','Dojo'],['league','crown','Liga'],['modes','play','Modos de jogo'],['missions','quest','Missões'],['settings','gear','Configurações'],['full','full','Tela cheia']];
 box.innerHTML=`<div class="v40-sheet-card"><header><b>Menu</b><button class="v40-round" data-v40-close aria-label="Fechar">${svg('close')}</button></header><div class="v40-menu-grid">${items.map(([id,ic,l])=>`<button data-v40-go="${id}">${svg(ic)}<span>${l}</span></button>`).join('')}</div></div>`;
 box.hidden=false;
}
function syncNav(){const on=appScreen==='home'&&!!account.profile;document.body.classList.toggle('v40-on',on);const nav=$q('#lobbyNav'),back=$q('#backHome');const hide=on||document.body.classList.contains('v40-modes-open');for(const el of [nav,back]){if(!el)continue;if(hide)el.style.setProperty('display','none','important');else el.style.removeProperty('display')}}
function closeAll(){for(const id of ['v40Menu','v40Missions','v40Modes'])$q('#'+id)?.setAttribute('hidden','');document.body.classList.remove('v40-modes-open');try{syncNav()}catch{}}

/* ---------- tela de modos ---------- */
function modesMarkup(){
 const cur=current().id;
 return `<div class="v40-modes-top"><button class="v40-round" data-v40-close aria-label="Voltar">${svg('back')}</button><b>MODOS DE JOGO</b><button class="v40-round" data-v40-close aria-label="Início">${svg('home')}</button></div>
 <div class="v40-strip" tabindex="0" aria-label="Modos de jogo, arraste para o lado">${CATS.map(([cat,label,col])=>`<section class="v40-group" data-cat="${cat}" style="--cat:${col}" aria-label="${label}"><h3>${label}</h3><div class="v40-cards">${MODES.filter(m=>m.cat===cat).map(m=>`<button class="v40-card ${m.id===cur?'on':''} ${m.soon?'soon':''}" data-v40-pick="${m.id}" ${m.soon?'aria-disabled="true"':''} aria-label="${esc(m.name)}${m.soon?', em breve':''}"><span class="v40-card-head"><b>${esc(m.name)}</b><small>${esc(subOf(m))}</small></span><span class="v40-card-art" style="--c:${m.art%4};--r:${Math.floor(m.art/4)}">${m.soon?`<span class="v40-lock">${svg('lock')}</span>`:''}</span><span class="v40-card-foot">${m.tag?`<em>${esc(m.tag)}</em>`:''}${m.id===cur?'<i>✓ Selecionado</i>':''}</span></button>`).join('')}</div></section>`).join('')}</div>
 <nav class="v40-tabs" aria-label="Categorias">${CATS.map(([cat,label],i)=>`<button data-v40-tab="${cat}" class="${current().cat===cat?'on':''}">${label}</button>`).join('')}</nav>`;
}
function openModes(){
 let box=$q('#v40Modes');
 if(!box){box=document.createElement('section');box.id='v40Modes';box.setAttribute('aria-label','Modos de jogo');document.body.appendChild(box)}
 box.innerHTML=modesMarkup();box.hidden=false;document.body.classList.add('v40-modes-open');syncNav();
 const strip=box.querySelector('.v40-strip'),on=box.querySelector('.v40-card.on');
 if(on)strip.scrollLeft=Math.max(0,on.offsetLeft-strip.clientWidth/2+on.offsetWidth/2);
 bindDrag(strip);strip.addEventListener('scroll',()=>syncTab(strip),{passive:true});
}
function syncTab(strip){
 if(strip.dataset.lock&&Date.now()-(+strip.dataset.lockAt||0)<900){document.querySelectorAll('[data-v40-tab]').forEach(b=>b.classList.toggle('on',b.dataset.v40Tab===strip.dataset.lock));return}
 const mid=strip.scrollLeft+strip.clientWidth*.35;let cat=null;
 for(const g of strip.querySelectorAll('.v40-group'))if(g.offsetLeft<=mid)cat=g.dataset.cat;
 if(strip.scrollLeft+strip.clientWidth>=strip.scrollWidth-4)cat=strip.querySelector('.v40-group:last-child')?.dataset.cat||cat;
 document.querySelectorAll('[data-v40-tab]').forEach(b=>b.classList.toggle('on',b.dataset.v40Tab===cat));
}
// arrastar com o mouse (no toque o navegador já rola sozinho)
function bindDrag(el){
 let down=null;
 el.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;down={x:e.clientX,s:el.scrollLeft,moved:false}});
 addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x;if(Math.abs(dx)>6)down.moved=true;if(down.moved){el.scrollLeft=down.s-dx;el.classList.add('dragging')}});
 addEventListener('pointerup',()=>{if(down?.moved){el.dataset.dragged='1';setTimeout(()=>delete el.dataset.dragged,0)}down=null;el.classList.remove('dragging')});
}

/* ---------- cliques ---------- */
document.addEventListener('click',e=>{
 const t=e.target;
 if(t.closest('[data-v40-play]')){e.preventDefault();play();return}
 if(t.closest('[data-v41-gift]')){e.preventDefault();$q('#homeScreen .v40-legacy #openDaily')?.click();return}
 if(t.closest('[data-v41-hunt]')){e.preventDefault();closeAll();try{window.huntQA?.lobby()}catch(err){console.error(err)}return}
 if(t.closest('[data-v40-modes]')){e.preventDefault();openModes();return}
 if(t.closest('[data-v40-menu]')){e.preventDefault();openMenu();return}
 if(t.closest('[data-v40-missions]')){e.preventDefault();ensureMissions();$q('#v40Missions').hidden=false;return}
 if(t.closest('[data-v40-close]')){e.preventDefault();closeAll();return}
 const pick=t.closest('[data-v40-pick]');
 if(pick){e.preventDefault();if(pick.closest('.v40-strip')?.dataset.dragged)return;const m=byId(pick.dataset.v40Pick);
  if(m?.soon){toast?.(m.name+': '+subOf(m));return}
  if(choose(pick.dataset.v40Pick)){closeAll();if(appScreen==='home')renderLobbyHome();else showScreen('home');toast?.('Modo escolhido: '+m.name)}return}
 const tab=t.closest('[data-v40-tab]');
 if(tab){e.preventDefault();const strip=$q('#v40Modes .v40-strip'),g=strip?.querySelector(`.v40-group[data-cat="${tab.dataset.v40Tab}"]`);if(g){strip.dataset.lock=tab.dataset.v40Tab;strip.dataset.lockAt=Date.now();document.querySelectorAll('[data-v40-tab]').forEach(b=>b.classList.toggle('on',b===tab));strip.scrollTo({left:g.offsetLeft-8,behavior:'smooth'})}return}
 const go=t.closest('[data-v40-go]');
 if(go){e.preventDefault();const id=go.dataset.v40Go;closeAll();
  if(id==='modes')openModes();else if(id==='missions'){ensureMissions();$q('#v40Missions').hidden=false}
  else if(id==='settings')$q('#homeScreen .v40-legacy #openLobbySettings')?.click();
  else if(id==='full')window.eldoriaDisplay?.enter?.();
  else showScreen(id);return}
 if(t.closest('.v40-sheet')&&!t.closest('.v40-sheet-card'))closeAll();
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&($q('#v40Modes:not([hidden])')||$q('.v40-sheet:not([hidden])')))closeAll()});
// qualquer navegação fecha as janelas do início
const prevShow=showScreen;
showScreen=function(){closeAll();const r=prevShow.apply(this,arguments);syncNav();return r};

window.InicioV40={MODES,CATS,current,choose,play,openModes,mountHome};
})();
