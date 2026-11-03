'use strict';
// Illustrated lobby. Every enabled card is connected to an existing game action.
function royalIcon(name){
 const paths={swords:'M5 3L24 22 M3 5L22 24 M21 20L27 26 M19 24L24 19 M27 3L8 22 M29 5L10 24 M11 20L5 26 M8 19L13 24',team:'M16 4A4 4 0 1 0 16 12A4 4 0 1 0 16 4 M8 28V23Q8 16 16 16Q24 16 24 23V28 M5 8A3 3 0 1 0 5 14 M27 8A3 3 0 1 1 27 14 M2 26V22Q2 18 6 18 M30 26V22Q30 18 26 18',lock:'M8 14H24V29H8Z M11 14V8A5 5 0 0 1 21 8V14 M16 20V24',compass:'M16 3A13 13 0 1 0 16 29A13 13 0 1 0 16 3 M21 10L18 19L10 22L13 13Z',quest:'M8 5H26V29H6V9 M11 3H21V8H11Z M11 14H21 M11 19H21 M11 24H18',crown:'M3 8L9 14L16 4L23 14L29 8L25 26H7Z M7 29H25',crest:'M16 2L20 11L29 5L25 20L16 30L7 20L3 5L12 11Z M16 8L19 17L16 24L13 17Z'};
 if(!paths[name])return lobbyIcon(name);
 return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
}
const royalPreviousNav=renderLobbyNav;
renderLobbyNav=function(){
 const nav=$('#lobbyNav');nav.classList.toggle('royal-nav',appScreen==='home');
 if(appScreen!=='home')return royalPreviousNav();
 nav.hidden=!account.profile;if(nav.hidden)return;
 nav.innerHTML=[['home','Início','home'],['library','Campeões','crest'],['training','Dojo','swords']].map(([id,label,icon])=>`<button data-nav="${id}" class="${id==='home'?'current':''}" ${id==='home'?'aria-current="page"':''}>${royalIcon(icon)}<span>${label}</span></button>`).join('')+
 `<div class="royal-nav-divider"></div><button data-open-modes>${royalIcon('compass')}<span>Arenas</span></button><button data-royal-missions>${royalIcon('quest')}<span>Missões</span></button><button data-nav="league">${royalIcon('crown')}<span>Liga</span></button><span class="royal-nav-seal" aria-hidden="true">✧</span>`;
};
function royalModes(){
 return [['league','Liga offline','1×1','swords'],['1v1','Duelo livre','1×1','swords'],['2v2','Equipes','2×2','team'],['online1','Online 1×1','Em breve','lock'],['online2','Online 2×2','Em breve','lock'],['arenas','Explorar','novos modos…','compass']].map(([id,title,sub,icon])=>{
 const disabled=id.startsWith('online');
 return `<button class="royal-mode" data-royal-mode="${id}" ${disabled?'disabled':''} aria-pressed="false" aria-label="${title} ${sub}">${royalIcon(icon)}<strong>${title}</strong><small>${sub}</small><span class="royal-selected" aria-hidden="true">✓</span></button>`;
 }).join('');
}
renderLobbyHome=function(){
 const rank=leagueIndex(),points=account.league.points,champ=currentChampion(),name=account.profile.name;
 $('#homeScreen').innerHTML=`<div class="royal-lobby">
 <header class="royal-header"><a class="royal-brand" href="#" data-nav="home" aria-label="Eldoria, início">${royalIcon('crest')}<span>ELDORIA<small>ARENA DOS CAMPEÕES</small></span></a><div class="royal-header-art" aria-hidden="true"></div><div class="royal-wallet"><button data-nav="library" aria-label="${account.coins} moedas. Ver campeões">${royalIcon('coin')}<b>${lobbyWalletNumber(account.coins)}</b></button><button data-nav="library" aria-label="${account.crystals} cristais. Ver campeões">${royalIcon('shop')}<b>${lobbyWalletNumber(account.crystals)}</b></button></div><button id="openLobbySettings" class="royal-settings" aria-label="Configurações">${royalIcon('gear')}</button></header>
 <div class="royal-content"><div class="royal-left">
 <section class="royal-sanctuary" aria-label="Seu campeão no santuário"><div class="royal-sanctuary-title"><span>SANTUÁRIO DOS CAMPEÕES</span><h1>Prepare seu próximo duelo.</h1></div><button class="royal-hero" data-nav="library" aria-label="Trocar ${escapeHTML(champ.name)}"><canvas id="lobbyHero" width="440" height="440" aria-hidden="true"></canvas><span id="lobbyHeroFallback">${skinPortrait(account.profile.skin)}</span></button><button class="royal-identity" data-nav="profile"><span class="lobby-avatar">${avatarSVG(account.profile.avatar)}</span><span><strong>${escapeHTML(name)}</strong><small>${escapeHTML(champ.name)}</small></span>${royalIcon('edit')}</button></section>
 <button class="royal-rank royal-panel" data-nav="league" aria-label="Liga ${LEAGUE_DIVISIONS[rank]}, ${points} pontos"><span class="royal-rank-emblem">${lobbyEmblem(rank)}</span><span class="royal-rank-body"><span class="royal-eyebrow">LIGA OFFLINE</span><span class="royal-rank-title"><strong>${LEAGUE_DIVISIONS[rank]}</strong><small>${points} pts</small></span><span class="royal-progress"><i style="width:${rank===5?100:(points%75)/75*100}%"></i></span><small>${rank===5?'Divisão máxima alcançada':`${75-points%75} pontos para ${LEAGUE_DIVISIONS[rank+1]}`}</small></span><span aria-hidden="true">›</span></button>
 <section id="lobbyBuild" class="royal-build royal-panel" aria-label="Campeão selecionado"></section>
 </div><div class="royal-right"><section class="royal-queue royal-panel" aria-label="Escolha seu combate"><h2 class="royal-eyebrow">ESCOLHA SEU COMBATE</h2><div class="royal-modes" role="group" aria-label="Modos de combate">${royalModes()}</div><select id="lobbyModeSelect" hidden aria-label="Modo selecionado"><option value="league">Liga offline</option><option value="1v1">Duelo livre</option><option value="2v2">Equipes</option><option value="arenas">Explorar arenas</option></select><button id="lobbyPlay" class="royal-play">${royalIcon('swords')}<span>JOGAR</span><span class="royal-play-arrow" aria-hidden="true">»</span></button><span id="lobbyPlayTag" hidden></span><p id="lobbyModeCopy" class="royal-mode-copy"></p></section>
 <div class="royal-bottom"><section class="royal-explore royal-panel"><div class="royal-explore-art" role="img" aria-label="Cidadela de Eldoria iluminada ao anoitecer"></div><div class="royal-explore-copy"><span class="royal-eyebrow">EXPLORE AS ARENAS</span><h2>Oito novas formas de lutar.</h2><p>Zona, Guardião, Sobrevivência, Escolhas, Torneio, Espelho, Diário e Todos contra Todos.</p><button class="royal-small-gold" data-open-modes>Escolher modo e arena ↗</button></div></section><div id="journeyHome" class="royal-missions royal-panel" tabindex="-1"></div></div>
 </div></div><p id="lobbyStatus" class="royal-save-status" role="status">${storageAvailable?'Progresso salvo neste aparelho.':'Armazenamento indisponível neste navegador.'}</p></div>`;
 $('#lobbyModeSelect').value=lobbyPrefs.mode;
 renderLobbyBuild();renderJourneyHome();updateLobbyMode();applyLobbyCosmetics();
 lobbyPaintAt=-Infinity;lobbyPainted=false;lobbyActor.skin=validSkin(account.profile.skin);loadSkinAtlas();applyLobbyMotion();hydrateSkillIcons();
};
const royalPreviousMode=updateLobbyMode;
updateLobbyMode=function(){
 royalPreviousMode();const current=$('#lobbyModeSelect')?.value;
 document.querySelectorAll('[data-royal-mode]').forEach(button=>{const active=button.dataset.royalMode===current;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
};
const royalPreviousJourney=renderJourneyHome;
renderJourneyHome=function(){
 royalPreviousJourney();const el=$('#journeyHome');if(!el?.classList.contains('royal-missions'))return;
 if(!account.journey.claimed){const gem=document.createElement('div');gem.className='royal-reward';gem.innerHTML=royalIcon('shop')+'<strong>125</strong><small>CRISTAIS</small>';el.querySelector('.journey-card')?.append(gem);}
};
const royalPreviousHero=drawLobbyHero;
drawLobbyHero=function(t){
 if(!document.querySelector('.royal-sanctuary'))return royalPreviousHero(t);
 if(appScreen!=='home'||state!=='select'||!account.profile||!$('#profileScreen').hidden||document.hidden||!$('#lobbySettings').hidden)return;
 const animated=lobbyMotionEnabled();if(lobbyPainted&&(!animated||t-lobbyPaintAt<50))return;
 const canvas=$('#lobbyHero'),g=canvas?.getContext('2d');if(!g)return;
 lobbyPaintAt=t;g.clearRect(0,0,440,440);g.save();g.translate(220,350);
 g.fillStyle='#041b1580';g.beginPath();g.ellipse(0,8,64,17,0,0,TAU);g.fill();
 const drawn=drawAnimatedFighter(g,lobbyActor,180,animated?t/1000:0);g.restore();$('#lobbyHeroFallback').hidden=drawn;
 if(drawn){lobbyPainted=true;lobbyRenderCount++;}
};
document.addEventListener('click',event=>{
 const mode=event.target.closest('[data-royal-mode]');
 if(mode&&!mode.disabled){const select=$('#lobbyModeSelect');select.value=mode.dataset.royalMode;select.dispatchEvent(new Event('change',{bubbles:true}));}
 if(event.target.closest('[data-royal-missions]')){const panel=$('#journeyHome');panel?.scrollIntoView({behavior:lobbyMotionEnabled()?'smooth':'auto',block:'nearest'});panel?.focus({preventScroll:true});}
 if(event.target.closest('.royal-brand'))event.preventDefault();
});
