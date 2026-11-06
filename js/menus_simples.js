'use strict';
function simpleHeader(title,subtitle=''){
 return `<header class="simple-header"><div><span class="simple-wordmark">ELDORIA</span><h1>${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}</div><button class="ghost" data-nav="home">← Início</button></header>`;
}
const simpleRoyalNav=renderLobbyNav;
renderLobbyNav=function(){
 const nav=$('#lobbyNav');nav.classList.remove('simple-nav');
 if(appScreen==='home')return simpleRoyalNav();
 nav.hidden=true;nav.innerHTML='';nav.classList.remove('royal-nav');
};
const simpleShowScreen=showScreen;
showScreen=function(name){$('#lobbyNav').classList.remove('simple-nav');return simpleShowScreen(name==='shop'?'library':name);};
rosterCard=function(c){return `<button class="hero-card ${account.activeChampion===c.id?'selected':''}" data-hero-open="${c.id}" style="--hero:${c.color}" aria-label="Conhecer ${escapeHTML(c.name)}"><span class="hero-card-art"><img src="${championArt(c)}" alt="" draggable="false"></span><span class="hero-card-copy"><strong>${escapeHTML(c.name)}</strong>${account.activeChampion===c.id?'<span>✓ Selecionado</span>':''}</span></button>`;};
renderSelection=function(){
 normalizeChampions();$('#selection').innerHTML=`<div class="roster-page simple-roster"><header class="roster-head"><button class="icon-back" data-nav="home" aria-label="Voltar ao início">←</button><div><span class="eyebrow">ELDORIA</span><h1>Campeões</h1></div></header><label class="hero-search"><span aria-hidden="true">⌕</span><input id="heroSearch" type="search" placeholder="Buscar campeão" value="${escapeHTML(rosterQuery)}" aria-label="Buscar campeão"></label><div class="hero-grid" id="heroGrid"></div></div>`;
 $('#loadout').hidden=true;$('#loadout').style.display='none';
 const filter=()=>{$('#heroGrid').innerHTML=CHAMPIONS.filter(c=>c.name.toLocaleLowerCase('pt-BR').includes(rosterQuery.toLocaleLowerCase('pt-BR'))).map(rosterCard).join('')||'<p class="empty-roster" role="status">Nenhum campeão encontrado.</p>';};
 $('#heroSearch').oninput=e=>{rosterQuery=e.target.value;filter();};filter();
};
const simpleChampionDetail=openChampionDetails;
openChampionDetails=function(id){
 simpleChampionDetail(id);const el=$('#heroDetail');if(!el)return;
 el.classList.toggle('astral-detail',Number(id)===0);
 el.classList.add('simple-detail');el.querySelectorAll('.hero-info,.hero-story,.hero-unlocked,.hero-stage-label,.hero-sigil').forEach(e=>e.remove());
 const heading=document.createElement('h2');heading.className='simple-kit-heading';heading.textContent='Habilidades';el.querySelector('.hero-kit').before(heading);
 el.querySelector('.hero-detail-head>span').textContent='Campeão';
 el.querySelector('[data-hero-test]').textContent='Treinar';el.querySelector('[data-hero-confirm]').textContent='Selecionar';
};
function simpleChampionPanel(){const c=currentChampion();return `<section class="simple-champion panel"><div class="simple-champion-art"><img src="${championArt(c)}" alt="${escapeHTML(c.name)}"></div><div><span class="eyebrow">SEU CAMPEÃO</span><h2>${escapeHTML(c.name)}</h2><button class="ghost" data-nav="library">Trocar campeão</button></div></section>`;}
practiceSettingsMarkup=function(prefix){return `<label class="setting-label" for="${prefix}Dummy">Adversário de treino</label><select id="${prefix}Dummy" class="exchange-select" data-practice-dummy>${[['still','Parado'],['guard','Defendendo'],['attack','Atacando']].map(([id,name])=>`<option value="${id}" ${practiceOptions.dummy===id?'selected':''}>${name}</option>`).join('')}</select><label class="practice-check"><input type="checkbox" data-practice-free ${practiceOptions.free?'checked':''}> Energia infinita e habilidades sem recarga</label>`;};
renderTraining=function(){
 $('#trainingScreen').innerHTML=simpleHeader('Dojo','Pratique movimentos e habilidades.')+`<div class="simple-columns">${simpleChampionPanel()}<section class="panel simple-options"><h2>Seu treino</h2>${practiceSettingsMarkup('setup')}<p class="simple-note">Sem limite de tempo. A stamina continua sendo consumida.</p><button class="gold" data-progression="training" ${validOwnedKit(selected)?'':'disabled'}>Começar treino</button></section></div>`;
};
renderLeague=function(){
 const i=leagueIndex(),r=currentLeagueRival(),l=account.league,progress=i===5?100:(l.points-i*75)/75*100;
 $('#leagueScreen').innerHTML=simpleHeader('Liga','Duelos contra o computador.')+`<div class="simple-columns"><section class="panel simple-division"><div class="simple-emblem">${lobbyEmblem(i)}</div><span class="eyebrow">SUA DIVISÃO</span><h2>${LEAGUE_DIVISIONS[i]}</h2><strong class="simple-points">${l.points} <small>pontos</small></strong><div class="league-progress"><i style="width:${progress}%"></i></div><p>${i===5?'Divisão máxima':`${75-l.points%75} pontos para ${LEAGUE_DIVISIONS[i+1]}`}</p></section><section class="panel simple-options"><span class="eyebrow">PRÓXIMO ADVERSÁRIO</span><h2>${escapeHTML(r.name)}</h2><p>${escapeHTML(r.tip)}</p><details class="simple-extra"><summary>Regras e recompensas</summary><p>Vitória: +25 pontos. Derrota concluída: −10, sem ficar abaixo de zero. Empates e saídas antecipadas não alteram os pontos.</p><p id="leagueRewardText">${dailyRewardText('1v1')}</p><p>${l.wins} vitórias em ${l.matches} duelos.</p></details><div class="simple-actions"><button class="ghost" data-nav="library">Trocar campeão</button><button class="gold" data-progression="league" ${validOwnedKit(selected)?'':'disabled'}>Jogar liga</button></div></section></div>`;
};
renderShop=function(){
 normalizeChampions();const c=currentChampion();
 $('#shopScreen').innerHTML=simpleHeader('Coleção',`${CHAMPIONS.length} campeões disponíveis.`)+`<div class="simple-collection"><section class="panel simple-current"><img src="${championArt(c)}" alt=""><span class="eyebrow">SELECIONADO</span><h2>${escapeHTML(c.name)}</h2><button class="gold" data-hero-open="${c.id}">Ver habilidades</button></section><div class="simple-collection-list">${CHAMPIONS.map(c=>`<button class="simple-collection-item ${c.id===account.activeChampion?'selected':''}" data-hero-open="${c.id}"><img src="${championArt(c)}" alt=""><span>${escapeHTML(c.name)}</span><span aria-hidden="true">${c.id===account.activeChampion?'✓':'›'}</span></button>`).join('')}</div></div>`;
};
const SIMPLE_MODE_COPY={zone:['2×2','Mantenha sua equipe na zona até alcançar 90 pontos.'],guardian:['Cooperativo','Você e um aliado enfrentam um guardião.'],survival:['Solo','Sobreviva a nove ondas de adversários.'],draft:['1×1','Escolha um campeão para este duelo.'],tournament:['1×1','Vença três adversários em sequência.'],mirror:['1×1','Os dois lutadores usam as mesmas habilidades.'],daily:['1×1','Um duelo com uma regra diferente a cada dia.'],ffa:['4 lutadores','Cada um por si. Vença com mais eliminações.']};
modesMarkup=function(){return simpleHeader('Arenas','Escolha um desafio.')+`<div class="simple-mode-grid">${Object.entries(ARENA_MODES).map(([id,c])=>`<article class="panel simple-mode"><span class="eyebrow">${SIMPLE_MODE_COPY[id][0]}</span><h2>${c.name}</h2><p>${SIMPLE_MODE_COPY[id][1]}</p>${id==='daily'?`<p class="simple-rule">Hoje: ${dailyRuleText()}</p>`:''}<button class="gold" data-arena-mode="${id}">Jogar</button></article>`).join('')}</div><details class="simple-extra simple-mode-rules"><summary>Regras completas e recompensas</summary>${Object.entries(ARENA_MODES).map(([id,c])=>`<p><b>${c.name}:</b> ${c.copy} Vitória: até ${c.prize} moedas.</p>`).join('')}<p data-daily-income>${dailyIncomeText()}</p></details>`;};
showArenaModes=function(){showScreen('home');appScreen='arenas';document.body.dataset.screen='arenas';$('#homeScreen').hidden=true;$('#modeScreen').hidden=false;$('#modeScreen').innerHTML=modesMarkup();document.body.style.overflow='hidden';renderLobbyNav();};
renderDraft=function(){
 draftChoices=[...account.champions];
 $('#modeScreen').hidden=false;
 $('#modeScreen').innerHTML=simpleHeader('Escolha seu campeão','A escolha vale para esta partida.')+`<div class="simple-draft-grid">${draftChoices.map(id=>{const c=CHAMPIONS[id];return `<button class="panel simple-draft-card" data-draft-pick="${id}" aria-label="Jogar com ${escapeHTML(c.name)}"><img src="${championArt(c)}" alt=""><strong>${escapeHTML(c.name)}</strong><span>Escolher e lutar →</span></button>`;}).join('')}</div>`;
};
function simplifyProfile(){
 const form=$('#profileForm');form.querySelector('.eyebrow').textContent='ELDORIA';form.querySelector('h1').textContent='Seu perfil';form.querySelector('p').textContent='Escolha um nome e um símbolo.';
 form.querySelector('label[for=profileName]').textContent='Nome · 2 a 16 caracteres';form.querySelector('.profile-label:not([for])').textContent='Símbolo';form.querySelector('button[type=submit]').textContent=account.profile?'Salvar perfil':'Continuar';
}
const simpleProfile=openProfile;openProfile=function(){simpleProfile();simplifyProfile();};
const simpleSettings=openLobbySettings;openLobbySettings=function(){simpleSettings();const el=$('#lobbySettings');el.querySelector('.lobby-overline')?.remove();el.querySelector('h2').textContent='Configurações';el.querySelectorAll('.lobby-settings-dialog>p').forEach(e=>e.remove());el.querySelector('.lobby-motion-option small').textContent='Animações da tela inicial';el.querySelector('#doneLobbySettings').textContent='Pronto';};
const simpleBoot=integrationBoot;integrationBoot=async function(){
 await simpleBoot();simplifyProfile();
 const dialog=$('#pause .dialog');dialog.querySelector('.eyebrow')?.remove();dialog.querySelector('h2').textContent='Jogo pausado';
 const copy=dialog.querySelector(':scope>p');if(copy){const help=document.createElement('details');help.className='simple-extra';const summary=document.createElement('summary');summary.textContent='Como jogar';help.append(summary,copy.cloneNode(true));copy.replaceWith(help);}
 $('#leave').textContent='Sair da partida';$('#resultHub').textContent='Início';
};
