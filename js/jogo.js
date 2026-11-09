'use strict';
const $=s=>document.querySelector(s),TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const paths=[ 'M8 4L20 10L17 17L23 25L13 23L5 28L8 17L3 11Z','M3 24L25 8M5 28L29 4M16 23L26 13','M3 24L15 12L10 8L27 4L23 21L19 16L8 28','M5 26Q2 9 26 4Q11 11 8 21L26 15','M5 13L12 6L23 8L27 17L20 26L9 25Z M5 18L25 18','M18 3L7 18L16 17L12 29L27 12L18 13Z','M16 3Q3 18 6 23Q16 34 26 23Q29 18 16 3Z','M4 24L9 9L16 4L23 9L28 24Z M7 24L25 24M16 4L16 28','M3 5L15 15L29 5M3 27L15 15L29 27M8 15L24 15','M16 3L27 8L25 21L16 29L7 21L5 8Z','M4 25L11 17L8 12L17 8L20 3L25 10L21 18L26 23L16 26L12 22Z','M5 25L24 6L28 10L9 29Z M10 18L15 23M15 13L20 18M20 8L25 13','M3 6L29 24M3 24L29 6M9 3L23 29M23 3L9 29','M7 5L23 5L23 15Q23 23 16 28Q9 23 9 16L16 11L26 13','M7 28L7 13L12 5L21 5L27 12L23 22L17 22L17 28M3 16L10 16','M6 5L26 5L8 27L25 27M6 10L26 10M6 23L26 23','M4 25L4 13L12 13L12 5L21 5L21 16L28 16L28 25Z','M5 27Q1 19 12 11Q10 19 17 17Q23 14 21 4Q37 26 20 29Z','M5 28L25 4M10 25L3 19M16 17L22 23','M5 10Q16 -2 27 10M5 22Q16 34 27 22M7 9L7 23M25 9L25 23','M4 6L12 6L12 13L20 13L20 20L28 20L28 28','M6 8L15 4L26 11L23 25L10 27L6 8M6 8L23 25M15 4L10 27M26 11L10 27','M5 5L27 27M27 5L5 27M11 3L29 21M3 11L21 29','M4 25L6 9L12 14L16 5L21 14L27 9L28 25L20 21L16 27L12 21Z'];
const EXTRA_ICON_ATLAS='';
const ICON_ATLAS='';
function icon(id){id=((id%50)+50)%50;return `<span class="skill-art" data-icon="${id}" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.65"><path d="${paths[id%24]}"/></svg></span>`}
let iconRepaintQueued=false;
function queueSkillIcons(){if(iconRepaintQueued)return;iconRepaintQueued=true;requestAnimationFrame(()=>{iconRepaintQueued=false;hydrateSkillIcons()})}
function hydrateSkillIcons(){document.querySelectorAll('.skill-art[data-icon]:not([data-painted])').forEach(el=>{let id=Number(el.dataset.icon),idx=id<24?id:id-24,cols=id<24?6:7,im=document.createElement('img');el.dataset.painted='1';im.className='skill-sheet';im.alt='';im.draggable=false;im.decoding='async';im.style.setProperty('width',cols*100+'%','important');im.style.left=-(idx%cols)*100+'%';im.style.top=-Math.floor(idx/cols)*100+'%';im.onload=()=>{im.style.opacity='1';const fallback=el.querySelector('svg');if(fallback)fallback.style.display='none'};im.onerror=()=>{im.remove();delete el.dataset.painted};im.src=id<24?ICON_ATLAS:EXTRA_ICON_ATLAS;el.appendChild(im);if(im.complete&&im.naturalWidth>0)im.onload()})}
const skillIconObserver=new MutationObserver(queueSkillIcons);
skillIconObserver.observe(document.body,{childList:true,subtree:true});
const raw=[
['Núcleo de Impacto','Ataque',18,6,100, '#e8b576','Soco de 45 dano. Uma explosão de 38 dano acontece no ponto atingido após 0,5s.'],
['Ruptura Celeste','Ataque',30,10,470,'#8dcde1','Carrega por 0,9s e dispara um feixe de 105 dano. Movimento reduzido durante a carga.'],
['Rastro Fantasma','Mobilidade',18,8,185,'#a1d9ce','Avança 150 unidades deixando um eco explosivo de 35 dano no ponto de partida.'],
['Corte da Aurora','Ataque',22,7,125,'#e8d29b','Três cortes de 27 dano em arco, com intervalos de 0,18s.'],
['Pulso Sísmico','Ataque',25,9,310,'#dcb78a','Após 0,8s, uma onda causa 85 dano em linha e empurra o inimigo.'],
['Manto da Tempestade','Defesa',24,13,250,'#a5c8ef','Por 5s, ganha 25% de velocidade e +12 dano no ataque básico.'],
['Pacto Carmesim','Ataque',16,12,600,'#ec9ca1','Sacrifica 65 HP. Por 6s, todos os seus danos contra o rival aumentam 45%.'],
['Jardim do Silêncio','Controle',30,12,280,'#c0b0e1','Marca uma área. Após 1,2s, causa 80 dano e lentidão de 45% por 2s.'],
['Prisão Vetorial','Controle',26,11,280,'#9ac7d3','Três âncoras puxam o rival para o centro por 3s. Cada uma tem 25 HP e pode ser quebrada.'],
['Couraça de Obsidiana','Defesa',24,13,130,'#b9b8ce','Reduz o dano recebido em 55% por 4s e a velocidade em 20%. Ao acabar, explode: 35 dano + 40% do dano absorvido.'],
['Motor de Impacto','Mobilidade',22,8,250,'#edaf86','Investida de 210 unidades com 60 dano. Colidir com um pilar encerra o avanço.'],
['Mandíbula de Aço','Ataque',22,12,95,'#dab6a3','Por 5s, ataques básicos ganham 22 dano. Máximo de 5 golpes antes de superaquecer.'],
['Fios do Carrasco','Controle',24,10,210,'#d4c6e4','Cria um fio transversal por 5s. Ao atravessar: 55 dano e lentidão de 45% por 1,5s. Uma ativação.'],
['Sombra Vinculada','Controle',24,11,290,'#a5a8ce','Dispara uma sombra: 30 dano e prende o alvo por 1,5s.'],
['Eco do Duelista','Ataque',26,12,400,'#e1ca92','Por 5s, cada ataque básico gera um segundo golpe de 18 dano após 0,35s.'],
['Passo entre Instantes','Mobilidade',18,10,600,'#a4dbd0','Registra sua posição. Após 2s, retorna e recupera 25 MP. O dano recebido permanece.'],
['Forja Instantânea','Defesa',24,11,190,'#c2c7a0','Ergue uma barreira transversal por 4s. Bloqueia movimento e projéteis dos dois lutadores.'],
['Maré Incandescente','Ataque',28,10,300,'#eeaa75','Semeia quatro brasas em linha. Após 0,8s, explodem em sequência: 28 dano cada.'],
['Lâmina do Vazio','Ataque',20,6,450,'#b4c0ee','Lança uma lâmina larga de energia que causa 62 dano.'],
['Órbita de Ferro','Defesa',26,13,250,'#afc4c1','Três fragmentos por 6s. Cada um bloqueia um projétil ou atinge o rival próximo causando 24 dano.'],
['Corpo de Mola','Mobilidade',20,8,250,'#e5bd9b','Após 0,7s, avança 160 unidades e desfere um soco de 70 dano.'],
['Constelação de Ruptura','Ataque',22,12,600,'#dfd5a0','Por 7s, cada básico marca o rival. A terceira marca explode causando 85 dano adicional.'],
['Reversão Arcana','Defesa',20,9,150,'#b4d3bb','Por 1,2s, anula projéteis com um campo de 100 unidades. Cada anulação fortalece o próximo básico em 20 dano.'],
['Matilha Espectral','Ataque',32,15,500,'#a6bfdd','Por 6s, um espírito persegue e outro protege sua posição. Cada um ataca por 15 dano a cada 0,9s.']
];
raw.push(...[["Fênix Errante", "Ataque", 26, 10, 430, "#ffb46d", "Projétil de 60 dano. Queima por 3s: 5 dano a cada 0,5s."], ["Lança do Inverno", "Controle", 24, 9, 390, "#a5e3ff", "Lança de gelo: 48 dano e imobilização por 1s."], ["Olho do Vendaval", "Controle", 30, 12, 270, "#a9e0bc", "Ciclone por 2,4s: puxa o rival e causa 18 dano a cada 0,6s."], ["Estaca do Trovão", "Ataque", 27, 10, 440, "#ffe49a", "Após 0,7s, lança um raio veloz de 80 dano e lentidão por 1s."], ["Queda Astral", "Ataque", 38, 16, 320, "#cdb4f3", "Meteoro em uma área de 105 unidades. Após 1,4s, causa 120 dano."], ["Palma do Espírito", "Ataque", 20, 7, 225, "#edead4", "Onda curta de 58 dano que empurra o alvo por 50 unidades."], ["Serpente das Marés", "Ataque", 28, 11, 440, "#88e0dd", "Dragão de água de 74 dano. Aplica lentidão por 1,8s."], ["Dança das Pétalas", "Ataque", 25, 9, 340, "#edb4d1", "Dispara cinco lâminas de pétalas em leque. Cada uma causa 17 dano."], ["Casulo de Geada", "Defesa", 25, 14, 600, "#b4eef0", "Escudo que absorve 90 dano por até 5s. O escudo restante desaparece ao terminar."], ["Corrente do Crepúsculo", "Controle", 25, 11, 330, "#d0a8e7", "Corrente de 40 dano: prende por 0,7s e cura metade do dano causado."], ["Peso do Horizonte", "Controle", 28, 12, 280, "#d9bb8e", "Área gravitacional por 2,4s: puxa, reduz movimento e causa 14 dano a cada 0,6s."], ["Espelho Prismático", "Defesa", 28, 15, 600, "#bce5f2", "Por 3,2s, reflete até dois projéteis para o atacante. Não reflete áreas ou socos."], ["Asas do Ímpeto", "Mobilidade", 22, 12, 600, "#f2d68e", "Recupera 30 Stamina e ganha 35% de velocidade por 5s."], ["Tríade Ilusória", "Ataque", 34, 18, 450, "#c6b1ea", "Invoca três ecos por 4s. Cada um persegue e ataca por 12 dano a cada 0,9s."], ["Névoa Corrosiva", "Controle", 25, 12, 280, "#c2df8c", "Nuvem por 4s: 7 dano a cada 0,5s e lentidão enquanto o rival estiver nela."], ["Punhos Rubros", "Ataque", 24, 13, 600, "#f1a2a5", "Por 5s, seus socos recuperam HP igual a 40% do dano realmente causado."], ["Satélites Lunares", "Ataque", 28, 13, 600, "#e4e5f0", "Lâminas lunares orbitam por 3s. Causam 20 dano a cada 0,65s em alvos a até 100 unidades."], ["Cristal de Reserva", "Defesa", 0, 18, 600, "#a4cafa", "Concentra por 0,5s e recupera 55 MP. Fica vulnerável durante a concentração."], ["Espinhos do Subsolo", "Ataque", 26, 10, 240, "#dfc39b", "Três erupções de pedra em linha, com 28 dano cada e imobilização de 0,4s."], ["Passo das Borboletas", "Mobilidade", 18, 7, 160, "#a9def4", "Avança até 160 unidades, remove imobilização e fica invulnerável por 0,25s. Paredes interrompem o avanço."], ["Flor do Recomeço", "Defesa", 30, 18, 600, "#edb6d2", "Cura 18 HP a cada 0,6s durante 3s: até 90 HP no total."], ["Garras do Tigre Solar", "Ataque", 24, 8, 110, "#ffc58c", "Duas garras de energia, com 38 dano cada. O segundo golpe empurra o rival."], ["Ressonância Quebrante", "Controle", 26, 11, 135, "#d3b5ed", "Onda ao redor do corpo: 56 dano, empurrão de 60 unidades e lentidão por 0,8s."], ["Cárcere Boreal", "Controle", 30, 14, 280, "#aed9f5", "Após 0,9s, uma prisão de gelo causa 40 dano e imobiliza por 1,6s."], ["Poço do Infinito", "Controle", 36, 18, 300, "#a9b6f2", "Vórtice por 3s: puxa e causa 10 dano a cada 0,5s. Ao fechar, explode por 35 dano."], ["Coroa do Eclipse", "Ataque", 40, 20, 600, "#f3d69b", "Concentra por 1,1s. Explosão ao redor do corpo causa 125 dano em um raio de 175 unidades."]]);
const skills=raw.map((s,id)=>({id,name:s[0],type:s[1],cost:s[2],cd:s[3],range:s[4],color:s[5],desc:s[6]}));
const balanceAdjustments={"23": {"cost": 32, "cd": 20, "desc": "Dois espíritos por 4s, com 28 HP cada. Um persegue e outro protege a região. Causam 8 dano a cada 1,1s. Máximo de três invocações suas em campo."}, "37": {"cost": 36, "cd": 24, "desc": "Três ecos por 4s, com 30 HP cada. Causam 9 dano a cada 1,1s e podem ser destruídos. Máximo de três invocações suas em campo."}, "32": {"cost": 30, "cd": 20, "desc": "Escudo que absorve 55 dano por até 4s. O escudo restante desaparece ao terminar."}, "44": {"cost": 32, "cd": 28, "desc": "Cura 13 HP a cada 0,6s durante 3s: até 65 HP no total."}, "41": {"cd": 28, "desc": "Concentra por 1s e recupera 25 MP. Fica vulnerável durante a concentração."}, "15": {"cost": 20, "cd": 12, "desc": "Registra sua posição. Após 2s, retorna e recupera 12 MP. O dano recebido permanece."}, "40": {"cost": 30, "cd": 18, "desc": "Lâminas lunares orbitam por 3s. Causam 12 dano a cada 0,75s em alvos a até 85 unidades."}, "29": {"cd": 9, "desc": "Onda curta de 48 dano que empurra o alvo por 50 unidades."}, "45": {"cd": 10, "desc": "Duas garras de energia, com 30 dano cada. O segundo golpe empurra o rival."}, "46": {"cd": 13, "desc": "Onda ao redor do corpo: 46 dano, empurrão de 60 unidades e lentidão por 0,8s."}, "26": {"cd": 14, "desc": "Ciclone por 2,4s: puxa o rival e causa 15 dano a cada 0,6s."}, "34": {"cd": 14, "desc": "Área gravitacional por 2,4s: puxa, reduz movimento e causa 12 dano a cada 0,6s."}, "38": {"cd": 14, "desc": "Nuvem por 4s: 6 dano a cada 0,5s e lentidão enquanto o rival estiver nela."}, "48": {"cd": 20, "desc": "Vórtice por 3s: puxa e causa 8 dano a cada 0,5s. Ao fechar, explode por 30 dano."}};
for(const [id,update]of Object.entries(balanceAdjustments))Object.assign(skills[Number(id)],update);
let selected=[],filter='Todas';
try{let a=JSON.parse(localStorage.getItem('ecos-loadout')||'[]');if(Array.isArray(a))selected=[...new Set(a.filter(n=>Number.isInteger(n)&&n>=0&&n<skills.length))].slice(0,6)}catch{}
const RANK_IDS={S:[1,28,37,48,49],A:[6,8,9,21,23,26,34,35,44,47],B:[2,5,7,14,15,16,17,19,22,24,30,32,36,38,40],C:[3,4,10,11,12,13,20,25,27,31,33,39,42,43,46],D:[0,18,29,41,45]},RANK_NAMES={S:'Lendário',A:'Épico',B:'Raro',C:'Incomum',D:'Comum'},DUPLICATES={D:5,C:10,B:25,A:60,S:150},EXCHANGE={D:25,C:50,B:125,A:300,S:750},SAVE_KEY='eldoria-champions-v1',STARTERS=[0,18,29,41,45,43];
for(let [rank,ids]of Object.entries(RANK_IDS))for(let id of ids)skills[id].rank=rank;
const SPIN_COST=1000;
const AVATARS=[{name:'Raposa Astral',path:'M5 8L12 12L20 12L27 8L24 23L16 28L8 23Z M5 8L6 3L13 12 M27 8L26 3L19 12 M10 17L14 19 M22 17L18 19 M14 24L18 24'},{name:'Chapéu do Viajante',path:'M3 21Q16 15 29 21Q16 28 3 21Z M8 19L10 10Q16 6 22 10L24 19 M9 16Q16 13 23 16'},{name:'Olho do Eclipse',path:'M2 16Q16 2 30 16Q16 30 2 16Z M21 16A5 5 0 1 1 11 16A5 5 0 1 1 21 16 M16 8L16 12 M9 20L12 18 M23 20L20 18'},{name:'Chama do Espírito',path:'M16 3Q23 11 20 15L25 11Q32 26 17 29Q3 29 6 17L11 10L12 19Q18 14 16 3Z'},{name:'Estrela Shinobi',path:'M16 2L19 11L29 9L23 18L29 26L19 23L16 31L12 22L3 25L9 16L3 8L12 11Z M19 16A3 3 0 1 1 13 16A3 3 0 1 1 19 16'},{name:'Sol do Guerreiro',path:'M22 16A6 6 0 1 1 10 16A6 6 0 1 1 22 16 M16 2L16 6 M16 26L16 30 M2 16L6 16 M26 16L30 16 M6 6L9 9 M23 23L26 26 M26 6L23 9 M6 26L9 23'}];
function avatarSVG(i){return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${AVATARS[i]?.path||AVATARS[0].path}"/></svg>`}
function freshAccount(){return{version:8,profile:null,owned:[...STARTERS],build:[...STARTERS],coins:0,crystals:0,lastFreeDay:'',lastSeen:0,pityA:0,pityS:0,wins:0,matches:0,lastDrop:null}}
let account=freshAccount(),storageAvailable=true;
try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||localStorage.getItem('eldoria-ecos-v8')||'null');if(saved&&saved.version===8){account={...account,...saved};account.owned=[...new Set((Array.isArray(saved.owned)?saved.owned:STARTERS).filter(id=>Number.isInteger(id)&&id>=0&&id<50))];for(let id of STARTERS)if(!account.owned.includes(id))account.owned.push(id);account.build=(Array.isArray(saved.build)?saved.build:STARTERS).filter(id=>account.owned.includes(id));account.build=[...new Set(account.build)].slice(0,6);for(let key of ['coins','crystals','pityA','pityS','wins','matches','lastSeen'])if(!Number.isFinite(account[key])||account[key]<0)account[key]=0;if(account.profile&&(typeof account.profile.name!=='string'||account.profile.name.trim().length<2||!Number.isInteger(account.profile.avatar)||account.profile.avatar<0||account.profile.avatar>5))account.profile=null;if(account.profile)account.profile.name=account.profile.name.slice(0,16);if(typeof account.lastFreeDay!=='string')account.lastFreeDay=''}}catch{storageAvailable=false}
if(account.profile)account.profile.skin=Number.isInteger(account.profile.skin)&&account.profile.skin>=0&&account.profile.skin<6?account.profile.skin:0;
selected=[...account.build];
let rankFilter='Todas',appScreen='home',profileAvatar=account.profile?.avatar||0,matchMode='1v1',rewardGranted=false,spinBusy=false;
function saveAccount(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(account));storageAvailable=true;return true}catch{storageAvailable=false;return false}}
function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function dayKey(now=Date.now()){const d=new Date(now);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dailyAvailable(now=Date.now()){return dayKey(now)>account.lastFreeDay&&now>=account.lastSeen-60000}
function nextDailyText(){const now=new Date(),next=new Date(now);next.setHours(24,0,0,0);const n=Math.max(0,Math.ceil((next-now)/1000));return Math.floor(n/3600)+'h '+String(Math.floor(n%3600/60)).padStart(2,'0')+'min '+String(n%60).padStart(2,'0')+'s'}
function random01(){if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}return Math.random()}
function randomKit(pool){return pool.map(id=>({id,n:random01()})).sort((a,b)=>a.n-b.n).slice(0,6).map(x=>x.id)}
function walletHTML(){return `<span>◉ ${account.coins} moedas</span><span>◇ ${account.crystals} cristais</span>`}
function appHeader(){return `<header class="app-top"><div class="wordmark">ELDORIA <span style="color:var(--gold)">✧</span></div><div class="wallet">${walletHTML()}<button class="ghost" data-nav="profile" aria-label="Editar perfil"><span class="avatar-mini">${skinPortrait(account.profile?.skin)}${avatarSVG(account.profile?.avatar||0)}</span>${escapeHTML(account.profile?.name||'Lutador')}</button></div></header>`}
function showScreen(screen){arenaModeId=null;modeRun=null;$('#modeScreen').hidden=true;closeShopConfirm();ecoPreview=null;finishTrainingJourney();finishEchoSummon(false);clearInputs();closeLobbySettings();appScreen=screen;document.body.dataset.screen=screen;renderLobbyNav();state='select';document.body.style.overflow='';for(let id of ['homeScreen','shopScreen','selection','loadout','trainingScreen','leagueScreen']){$('#'+id).hidden=true;$('#'+id).style.display=''}$('#battle').style.display='none';if(!account.profile){openProfile();return}if(screen==='home'){$('#homeScreen').hidden=false;renderHome()}else if(screen==='training'){$('#trainingScreen').hidden=false;renderTraining()}else if(screen==='league'){$('#leagueScreen').hidden=false;renderLeague()}else if(screen==='shop'){$('#shopScreen').hidden=false;renderShop()}else{$('#selection').hidden=false;$('#loadout').hidden=false;renderSelection()}scrollTo(0,0)}
function renderHome(){renderLobbyHome()}
function dropMarkup(drop){if(!drop||!skills[drop.id])return '<span class="eyebrow">UM NOVO PODER ESPERA</span><strong>Qual será seu próximo Eco?</strong><span style="font-size:40px;color:var(--gold)">✧</span>';let s=skills[drop.id];return `<span class="rank rank-${s.rank}">${s.rank} · ${RANK_NAMES[s.rank]}</span>${icon(s.id)}<strong>${s.name}</strong><span style="font-size:12px;color:var(--gold)">${drop.duplicate?'Duplicata · +'+DUPLICATES[s.rank]+' cristais':drop.exchange?'Desbloqueado com cristais':'Novo Eco na sua coleção!'}</span>`}
function renderShop(){let chosen=Number($('#exchangeSelect')?.value);if(!Number.isInteger(chosen))chosen=0;$('#shopScreen').innerHTML=appHeader()+`<div class="section-head"><button class="ghost" data-nav="home">← Início</button><h1>Loja dos Campeões.</h1><p class="section-copy">O acaso revela. Os cristais garantem sua escolha.</p></div>${shopTabs()}<p class="notice" data-daily-income>${dailyIncomeText()}</p><div class="shop-layout"><div class="panel" id="shop-invoke" role="tabpanel" aria-labelledby="tab-invoke" ${shopTab==='invoke'?'':'hidden'}><div class="eyebrow">ROLETA DE ECOS</div><h2 style="margin-top:10px">Uma chance de despertar.</h2><p>Receba um Eco por giro. Todas as habilidades do mesmo rank têm a mesma chance de sair.</p><div class="rate-row">${[['D',40],['C',30],['B',20],['A',8],['S',2]].map(([r,n])=>`<span class="rank rank-${r}">${r} · ${n}%</span>`).join('')}</div><div class="spin-stage" id="spinStage" role="region" aria-label="Altar de invocação">${summonStageMarkup(account.lastDrop)}</div><div class="shop-actions"><button class="gold" id="freeSpin">Giro diário grátis</button><button class="ghost" id="paidSpin">Girar · ${SPIN_COST} moedas</button></div><div id="spinMessage" role="status"></div><p id="dailyTimer" style="margin-top:8px"></p><div class="pity-row"><strong>Faltam até ${Math.max(1,20-account.pityA)} giros para A ou S · até ${Math.max(1,80-account.pityS)} para S.</strong><br>Garantia A ou superior: <b>${account.pityA}/20</b> · Garantia S: <b>${account.pityS}/80</b><br>Giros grátis também contam. Um A ou S reinicia a garantia A; apenas um S reinicia a garantia S. As chances acima valem fora das garantias.</div><div id="shopResult"></div>${shopHistory()}</div><div class="panel" id="shop-exchange" role="tabpanel" aria-labelledby="tab-exchange" ${shopTab==='exchange'?'':'hidden'}>${wishMarkup()}<div class="eyebrow">TROCA GARANTIDA</div><h2 style="margin-top:10px">Escolha seu próximo Eco.</h2><p>Duplicatas se tornam cristais. Junte e desbloqueie exatamente a técnica que procura.</p><select id="exchangeSelect" class="exchange-select" aria-label="Escolher Eco para troca">${[...skills].sort((a,b)=>'SABCD'.indexOf(a.rank)-'SABCD'.indexOf(b.rank)||a.name.localeCompare(b.name)).map(s=>`<option value="${s.id}">${s.rank} · ${s.name} · ${EXCHANGE[s.rank]} ◇${account.owned.includes(s.id)?' · Obtido':''}</option>`).join('')}</select><div class="exchange-preview" id="exchangePreview"></div><button class="gold" id="exchangeBtn" style="width:100%">Trocar cristais</button><div class="notice">Duplicatas: D +5 · C +10 · B +25 · A +60 · S +150 cristais.</div><p>Troca: D 25 · C 50 · B 125 · A 300 · S 750 cristais.</p><p class="shop-note">Desbloqueios são permanentes. Ecos repetidos não aumentam atributos. Os modos online continuam em desenvolvimento.</p><div id="shopCatalog"></div></div>${shopExtras()}</div>`;$('#exchangeSelect').value=String(chosen);if(!$('#exchangeSelect').value)$('#exchangeSelect').selectedIndex=0;$('#exchangeSelect').onchange=renderExchange;$('#freeSpin').onclick=()=>spinEcho(true);$('#paidSpin').onclick=()=>spinEcho(false);$('#exchangeBtn').onclick=()=>requestShopPurchase('echo',Number($('#exchangeSelect').value));renderExchange();refreshDaily();hydrateSkillIcons();mountSummonStage(account.lastDrop);enhanceShop()}
function renderExchange(){let s=skills[Number($('#exchangeSelect').value)],owned=account.owned.includes(s.id);$('#exchangePreview').innerHTML=icon(s.id)+`<div><span class="rank rank-${s.rank}">${s.rank} · ${RANK_NAMES[s.rank]}</span><p style="margin-top:8px">${s.desc}</p></div>`;$('#exchangeBtn').disabled=owned||account.crystals<EXCHANGE[s.rank]||spinBusy;$('#exchangeBtn').textContent=owned?'Já está na coleção':`Desbloquear · ${EXCHANGE[s.rank]} cristais`;hydrateSkillIcons()}
function refreshDaily(){refreshLobbyDaily();refreshIncomeUI();if(appScreen!=='shop'||$('#shopScreen').hidden)return;let available=dailyAvailable();$('#freeSpin').disabled=spinBusy||!available;$('#paidSpin').disabled=spinBusy||account.coins<SPIN_COST;$('#dailyTimer').textContent=available?'Giro grátis disponível · renova à meia-noite local.':Date.now()<account.lastSeen-60000?'Relógio anterior ao último acesso. Aguarde o horário real para liberar o giro.':'Próximo giro grátis em '+nextDailyText()+' · horário do aparelho.'}
function spinEcho(free){if(spinBusy||!account.profile)return null;const now=Date.now();if(free&&!dailyAvailable(now))return null;if(!free&&account.coins<SPIN_COST)return null;let rank,n=random01()*100;if(account.pityS>=79)rank='S';else if(account.pityA>=19)rank=n<2?'S':'A';else rank=n<40?'D':n<70?'C':n<90?'B':n<98?'A':'S';const pool=RANK_IDS[rank],id=pool[Math.floor(random01()*pool.length)],duplicate=account.owned.includes(id);const before=JSON.stringify(account);if(free)account.lastFreeDay=dayKey(now);else account.coins-=SPIN_COST;account.lastSeen=Math.max(account.lastSeen,now);account.pityS=rank==='S'?0:account.pityS+1;account.pityA=['A','S'].includes(rank)?0:account.pityA+1;if(duplicate)account.crystals+=DUPLICATES[rank];else account.owned.push(id);account.lastDrop={id,duplicate,at:now};rememberSpin(account.lastDrop,free);if(!saveAccount()){account=JSON.parse(before);if($('#spinMessage'))$('#spinMessage').textContent='Não foi possível salvar. Libere o armazenamento e tente novamente.';return null}spinBusy=true;renderShop();playEchoSummon(account.lastDrop);return account.lastDrop}
function exchangeEcho(id){const s=skills[id];if(!s||spinBusy||account.owned.includes(id)||account.crystals<EXCHANGE[s.rank])return false;const before=JSON.stringify(account);account.crystals-=EXCHANGE[s.rank];account.owned.push(id);account.lastDrop={id,duplicate:false,exchange:true,at:Date.now()};if(!saveAccount()){account=JSON.parse(before);return false}$('#detailDialog').hidden=true;if(appScreen==='library')renderSelection();else if(appScreen==='shop'){spinBusy=true;renderShop();playEchoSummon(account.lastDrop)}return true}
function showDetail(id){ecoPreview=null;let s=skills[id],owned=account.owned.includes(id);$('#detailDialog').innerHTML=`<div class="dialog" role="dialog" aria-modal="true" aria-label="Detalhes do Eco"><div class="detail-art">${icon(id)}</div><span class="rank rank-${s.rank}">${s.rank} · ${RANK_NAMES[s.rank]}</span><h2 style="font-size:30px">${s.name}</h2><p>${s.desc}<br>${s.cost} MP · ${s.cd}s de recarga<br>Função: ${s.type} · Alcance: ${s.range===600?'efeito no próprio personagem (veja a descrição)':Number.isFinite(s.range)?s.range+' unidades':'conforme o efeito descrito'}</p><button class="ghost" data-eco-preview="${id}">▶ Ver demonstração</button><canvas id="ecoDemo" width="360" height="180" hidden aria-label="Demonstração automática do Eco"></canvas><p>${owned?'Já está na sua coleção.':`Disponível na roleta ou por ${EXCHANGE[s.rank]} cristais.`}</p>${!owned?`<button class="gold" id="detailExchange" ${account.crystals<EXCHANGE[s.rank]?'disabled':''}>Trocar · ${EXCHANGE[s.rank]} cristais</button><button class="ghost" data-nav="shop">Ir para a loja</button>`:''}${!owned?`<button class="ghost" data-wish="${id}" ${account.wish===id?'disabled':''}>${account.wish===id?'✧ Seu Eco desejado':'✧ Definir como Eco desejado'}</button>`:''}<button class="ghost" id="closeDetail">Voltar à coleção</button></div>`;$('#detailDialog').hidden=false;$('#closeDetail').onclick=()=>$('#detailDialog').hidden=true;if($('#detailExchange'))$('#detailExchange').onclick=()=>requestShopPurchase('echo',id);hydrateSkillIcons()}
function openProfile(){finishEchoSummon(true);profileAvatar=account.profile?.avatar||0;profileSkin=validSkin(account.profile?.skin);skinPreviewMode='walk';$('#profileScreen').hidden=false;$('#profileName').value=account.profile?.name||'';$('#cancelProfile').hidden=!account.profile;$('#profileError').textContent='';$('#skinAssetStatus').textContent='';renderAvatars();renderSkinPicker()}
function renderAvatars(){$('#avatarGrid').innerHTML=AVATARS.map((a,i)=>`<button type="button" class="avatar-choice ${profileAvatar===i?'active':''}" data-avatar="${i}" aria-pressed="${profileAvatar===i}">${avatarSVG(i)}<span>${a.name}</span></button>`).join('')}
function queueMatch(mode){arenaModeId=null;modeRun=null;if(!['1v1','2v2'].includes(mode))return;battleActivity='casual';matchMode=mode;if(selected.length!==6){showScreen('library');announce('Equipe seis Ecos antes de entrar na arena.');return}start()}
function initApp(){$('#profileForm').onsubmit=e=>{e.preventDefault();const name=$('#profileName').value.trim().replace(/\s+/g,' ');if(name.length<2||name.length>16){$('#profileError').textContent='Use um nome com 2 a 16 caracteres.';return}const oldProfile=account.profile;account.profile={name,avatar:profileAvatar,skin:account.activeChampion??0};if(!saveAccount()){account.profile=oldProfile;$('#profileError').textContent='Não foi possível salvar seu perfil. Ative o armazenamento deste navegador.';return}$('#profileScreen').hidden=true;showScreen('home')};$('#avatarGrid').onclick=e=>{const el=e.target.closest('[data-avatar]');if(el){profileAvatar=Number(el.dataset.avatar);renderAvatars()}};$('#cancelProfile').onclick=()=>$('#profileScreen').hidden=true;document.addEventListener('click',e=>{const nav=e.target.closest('[data-nav]');if(nav){$('#detailDialog').hidden=true;if(nav.dataset.nav==='profile')openProfile();else showScreen(nav.dataset.nav)}const match=e.target.closest('[data-match]');if(match)queueMatch(match.dataset.match)});$('#libraryHome').onclick=()=>showScreen('home');$('#collectionSearch').oninput=renderSelection;$('#rankFilters').innerHTML=['Todas','Meus','Bloqueados','S','A','B','C','D'].map(r=>`<button class="ghost ${r==='Todas'?'active':''}" data-rank="${r}">${r}</button>`).join('');$('#rankFilters').onclick=e=>{let el=e.target.closest('[data-rank]');if(el){rankFilter=el.dataset.rank;$('#rankFilters').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===el));renderSelection()}};setInterval(()=>{refreshDaily();if(account.profile&&Date.now()>account.lastSeen+60000){account.lastSeen=Date.now();saveAccount()}},1000);showScreen('home')}
const SKINS=[
 {name:'Guerreiro Astral',color:'#d6ba6b',desc:'Cabelo escuro com pontas turquesa, roupa de treino e faixas douradas.'},
 {name:'Ninja das Brumas',color:'#89cfe3',desc:'Franja prateada, máscara azul e túnica com detalhes em bronze.'},
 {name:'Ronin Carmesim',color:'#e2a08b',desc:'Cabelo preso, quimono claro e capa carmesim. Combate com os próprios punhos.'},
 {name:'Guardião Solar',color:'#efcf8d',desc:'Cabelo marfim e manto branco com detalhes de chamas douradas.'},
 {name:'Lutador do Eclipse',color:'#c5a1e3',desc:'Cabelo preto, casaco violeta e detalhes luminosos em magenta.'},
 {name:'Caçador Espectral',color:'#a5c69a',desc:'Cabelo verde-escuro, jaqueta curta e luvas claras.'}
];
const SKIN_ATLAS='';
let skinImage=null,skinImageReady=false,skinImageFailed=false,profileSkin=0,skinPreviewMode='walk',previewLast=0;
function validSkin(id){return Number.isInteger(id)&&id>=0&&id<SKINS.length?id:0}
function loadSkinAtlas(){if(skinImage)return;skinImage=new Image();skinImage.onload=()=>{skinImageReady=true;skinImageFailed=false};skinImage.onerror=()=>{skinImageReady=false;skinImageFailed=true;let el=$('#skinAssetStatus');if(el)el.textContent='Não foi possível carregar a arte. Seu visual continua selecionado; reabra o jogo para tentar novamente.'};skinImage.src=SKIN_ATLAS}
function skinPortrait(id,extra=''){return `<span class="skin-portrait ${extra}" style="--skin-row:${validSkin(id)}" aria-hidden="true"></span>`}
function skinPose(a){if(a.dodgeTime>0||a.dash>0)return a.dodgeTime>.11||a.dash>.13?6:7;if(a.guard)return 5;if(a.punchTime>0)return a.punchSide<0?3:4;if(a.swing>0&&a.cast<=0)return 4;if(a.moving)return Math.floor(a.gait/2)%2?1:2;return 0}
const SKIN_FRAME_SIZE=80,SKIN_ART_REFERENCE=64;
function drawSkinBody(g,a,size=68,col=skinPose(a)){if(!skinImageReady)return false;const row=validSkin(a.skin),pose=Number.isInteger(col)&&col>=0&&col<8?col:0,extent=size*SKIN_FRAME_SIZE/SKIN_ART_REFERENCE;g.imageSmoothingEnabled=false;g.drawImage(cosmeticSprite(a),pose*SKIN_FRAME_SIZE,row*SKIN_FRAME_SIZE,SKIN_FRAME_SIZE,SKIN_FRAME_SIZE,-extent/2,-extent/2,extent,extent);return true}
function renderSkinPicker(){profileSkin=validSkin(profileSkin);$('#skinGrid').innerHTML=SKINS.map((skin,id)=>`<button type="button" class="skin-choice ${profileSkin===id?'active':''}" data-skin="${id}" aria-pressed="${profileSkin===id}">${skinPortrait(id)}<strong>${skin.name}</strong><small>VISUAL GRATUITO</small></button>`).join('');$('#skinPreviewName').textContent=SKINS[profileSkin].name;$('#skinPreviewDesc').textContent=SKINS[profileSkin].desc;$('#skinGrid').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{profileSkin=validSkin(Number(btn.dataset.skin));renderSkinPicker()});$('#skinPreviewControls').querySelectorAll('button').forEach(btn=>{btn.classList.toggle('active',btn.dataset.preview===skinPreviewMode);btn.setAttribute('aria-pressed',String(btn.dataset.preview===skinPreviewMode));btn.onclick=()=>{skinPreviewMode=btn.dataset.preview;renderSkinPicker()}});loadSkinAtlas()}
function renderSelection(){selected=cleanOwnedKit(selected);let query=($('#collectionSearch')?.value||'').trim().toLocaleLowerCase('pt-BR');let list=skills.filter(s=>(filter==='Todas'||filter==='Novas'&&s.id>=24||s.type===filter)&&(rankFilter==='Todas'||rankFilter==='Meus'&&account.owned.includes(s.id)||rankFilter==='Bloqueados'&&!account.owned.includes(s.id)||s.rank===rankFilter)&&s.name.toLocaleLowerCase('pt-BR').includes(query));$('#cards').innerHTML=list.map(s=>{let owned=account.owned.includes(s.id),equipped=selected.includes(s.id);return `<button class="card ${equipped?'selected':''} ${owned?'':'locked'}" data-id="${s.id}" style="--c:${s.color}" aria-pressed="${equipped}"><div class="rarity-line"><span class="rank rank-${s.rank}">${s.rank} · ${RANK_NAMES[s.rank]}</span><span>${owned?'DESBLOQUEADO':'BLOQUEADO'}</span></div><span class="number">${equipped?selected.indexOf(s.id)+1:owned?'+':'◇'}</span><div class="symbol">${icon(s.id)}</div><h3>${s.name}</h3><p>${s.desc}</p><small>${s.type.toUpperCase()} · ${s.cost} MP · ${s.cd}s</small></button>`}).join('')||'<p class="collection-empty">Nenhum Eco encontrado com estes filtros.</p>';$('#slots').innerHTML=Array.from({length:6},(_,i)=>`<button class="slot ${selected[i]!==undefined?'filled':''}" data-slot="${i}" title="${skills[selected[i]]?.name||'Espaço vazio'}" aria-label="${skills[selected[i]]?'Remover '+skills[selected[i]].name:'Espaço '+(i+1)}">${selected[i]!==undefined?icon(selected[i]):i+1}</button>`).join('');$('#chosen').textContent=selected.length+' / 6';$('#start').disabled=selected.length!==6;account.build=[...selected];saveAccount();$('#libraryWallet').innerHTML=walletHTML();renderBuildSlots();renderCollectionProgress();hydrateSkillIcons()}
$('#cards').onclick=e=>{let c=e.target.closest('[data-id]');if(!c)return;let id=+c.dataset.id;if(!account.owned.includes(id)){showDetail(id);return}if(selected.includes(id))selected=selected.filter(n=>n!==id);else if(selected.length<6)selected.push(id);else{c.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'none'}],{duration:160});$('#chosen').textContent='Remova uma para trocar';return}renderSelection()};
$('#slots').onclick=e=>{let s=e.target.closest('[data-slot]');if(s){selected.splice(+s.dataset.slot,1);renderSelection()}};
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(f=>f.classList.toggle('active',f===b));renderSelection()});
const shuffled=()=>[...CHAMPIONS[Math.floor(Math.random()*CHAMPIONS.length)].kit];
$('#random').onclick=()=>{selected=randomKit(account.owned);renderSelection()};
const canvas=$('#arena'),ctx=canvas.getContext('2d');
let W=1000,H=650,cw=0,ch=0,scale=1,ox=0,oy=0,actors=[],p,b,objects=[],shots=[],zones=[],events=[],fx=[],texts=[],clock=0,time=180,state='select',count=0,last=0,aimGesture=null,mouse=null,joy={x:0,y:0},keys={},attackHeld=false,defendHeld=false,stickID=null,toastTime=0,uiTime=0;
let pillars=[];
let spriteFX=[];
let groundCache=null,pillarCache=null,backgroundBuilds=0;
function resize(){let r=canvas.getBoundingClientRect();cw=r.width;ch=r.height;const d=Math.min(devicePixelRatio||1,window.renderCap||2);canvas.width=cw*d;canvas.height=ch*d;ctx.setTransform(d,0,0,d,0,0);const trim=innerWidth<600?34:0;scale=Math.min(cw/(W-trim*2),ch/(H-trim*2));ox=(cw-W*scale)/2;oy=(ch-H*scale)/2;updateArenaCamera()}
addEventListener('resize',resize);
function actor(x,y,kit,color){return {skin:0,champAction:null,ultActive:false,ultimateUntil:0,ultimateDashHits:null,x,y,r:17,a:0,hp:1000,max:1000,mp:120,st:100,kit,cd:Array(skills.length).fill(0),basic:0,inv:0,dodgeCD:0,dodgeTime:0,dodgeA:0,dash:0,dashA:0,dashDmg:0,dashHit:false,slow:0,root:0,cast:0,buff:{},color,damage:0,hits:0,moving:false,gait:0,swing:0,flash:0,absorbed:0,charges:0,marks:0,orbit:0,reverse:0,think:0,petTime:0,shieldHP:0,pullBudget:0,reflect:0,dots:[],guard:false,guardBreak:0,guardTimer:0,guardCD:0,guardPerfect:0,blockFlash:0,blockedDamage:0,hitReact:0,hitReactA:0,punchTime:0,punchSide:1,combo:0,comboTimer:0,hitChain:0,chainTarget:null,skillLock:0,actionRecovery:0,aiRest:0,aiSequence:0,aiBudget:2+Math.floor(Math.random()*2)}}
function announce(t){$('#announce').textContent=t}
function toast(t){$('#toast').textContent=t;toastTime=1.8;$('#toast').style.opacity=1;announce(t)}
function start(){if(!validOwnedKit(selected)){showScreen('library');return}if(!selected.every(id=>account.owned.includes(id)))return;$('#lobbyNav').hidden=true;closeLobbySettings();rewardGranted=false;teamHudSignature='';$('#battle').dataset.mode=matchMode;loadSkinAtlas();configureArenaSize();buildArenaBackground();clock=0;time=180;combatHitStop=0;combatShake=0;spriteFX=[];vfxReset();objects=[];shots=[];zones=[];events=[];fx=[];texts=[];p=actor(W*.22,H*.5,[...selected],'#95d7bd');b=actor(W*.78,H*.5,shuffled(),'#ec9d8a');b.a=Math.PI;p.skin=validSkin(account.profile.skin);b.skin=Math.floor(Math.random()*SKINS.length);p.team=0;p.label=account.profile.name;b.team=1;b.label='Rival 1';actors=[p,b];if(matchMode==='2v2'){p.y=H*.35;b.y=H*.35;let ally=actor(W*.22,H*.68,shuffled(),'#82c8db'),rival=actor(W*.78,H*.68,shuffled(),'#d6a4d8');ally.skin=(p.skin+1+Math.floor(Math.random()*5))%6;rival.skin=Math.floor(Math.random()*6);ally.team=0;ally.label='Aliado';rival.team=1;rival.label='Rival 2';rival.a=Math.PI;actors.push(ally,rival)}prepareProgressionMatch();prepareArenaMode();prepareEquippedSprites();clearInputs();$('#selection').hidden=true;$('#loadout').hidden=true;$('#homeScreen').hidden=true;$('#shopScreen').hidden=true;$('#trainingScreen').hidden=true;$('#leagueScreen').hidden=true;$('#selection').style.display='none';$('#loadout').style.display='none';$('#battle').style.display='block';document.body.style.overflow='hidden';$('#spectating').hidden=true;$('#teamHud').hidden=matchMode!=='2v2';$('.mid-hud small').textContent=matchMode==='2v2'?'EQUIPES · 2×2':'DUELO · 1×1';$('.fighterhud .title b').textContent=account.profile.name;$('.fighterhud.enemy .title b').textContent=matchMode==='2v2'?'RIVAL EM FOCO':'BOT · RIVAL';$('#outcome').style.display='none';$('#pause').style.display='none';$('#botkit').innerHTML=b.kit.map(id=>`<span title="${skills[id].name}">${icon(id)}</span>`).join('');$('#equipped').innerHTML=p.kit.map((id,i)=>`<button class="skill" data-index="${i}" style="--c:${skills[id].color}" aria-label="${i+1}: ${skills[id].name}" title="${skills[id].name}\n${skills[id].desc}">${icon(id)}<span class="hotkey">${i+1}</span><span class="cool" hidden></span></button>`).join('');document.querySelectorAll('.skill').forEach(btn=>bindSkill(btn,+btn.dataset.index));resize();state='count';count=3.4;$('#countdown').dataset.go='false';$('#countdown').textContent='3';$('#countdown').style.display='flex';updateUI()}
function opponents(a){return actors.filter(e=>e.team!==a.team&&e.hp>0)}
function enemy(a){return opponents(a).sort((x,y)=>dist(a,x)-dist(a,y))[0]||actors.find(e=>e.team!==a.team)||a}
function sameTeam(a,b){return a&&b&&a.team===b.team}
function delay(t,fn){const context=visualContext;events.push({t,fn:context?()=>vfxWithin(context.id,context.owner,fn):fn})}
function blocked(x,y,r=0){if(x<35+r||x>W-35-r||y<35+r||y>H-35-r)return true;return pillars.some(o=>Math.hypot(x-o.x,y-o.y)<o.r+r)||objects.some(o=>o.kind==='wall'&&o.life>0&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(y-o.y)<o.h/2+r)}
let combatHitStop=0, combatShake=0, combatShakeX=0, combatShakeY=0, combatAudio=null;
function combatSound(kind='hit',power=1){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    if(!combatAudio)combatAudio=new AC();if(combatAudio.state==='suspended')combatAudio.resume();
    const now=combatAudio.currentTime,osc=combatAudio.createOscillator(),gain=combatAudio.createGain();
    const cfg=kind==='parry'?[680,150,.12] : kind==='block'?[240,105,.09] : kind==='heavy'?[125,48,.14] : kind==='crit'?[460,90,.16] : [300,95,.075];
    osc.type=kind==='parry'?'triangle':'sawtooth';osc.frequency.setValueAtTime(cfg[0],now);osc.frequency.exponentialRampToValueAtTime(Math.max(35,cfg[1]),now+cfg[2]);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.min(.12,.045*power),now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+cfg[2]);
    osc.connect(gain);gain.connect(combatAudio.destination);osc.start(now);osc.stop(now+cfg[2]+.015);
  }catch(e){}
}
function combatImpact(power=1){combatHitStop=Math.max(combatHitStop,power>=1.6?.085:power>=1.15?.065:.045);combatShake=Math.min(10,combatShake+(power>=1.6?7:power>=1.15?4.5:2.2));}
function move(a,dx,dy){let steps=Math.ceil(Math.hypot(dx,dy)/7)||1;let hit=false;for(let i=0;i<steps;i++){let x=a.x+dx/steps,y=a.y+dy/steps;if(!blocked(x,a.y,a.r))a.x=x;else hit=true;if(!blocked(a.x,y,a.r))a.y=y;else hit=true}return hit}
function ring(x,y,r,color,life=.4){fx.push({kind:'ring',x,y,r,color,life,max:life})}
function float(x,y,t,color='#f0e1ba'){texts.push({x,y,t,color,life:.9})}
function spark(x,y,color,n=8){for(let i=0;i<n;i++){let a=Math.random()*TAU;fx.push({kind:'spark',x,y,vx:Math.cos(a)*(30+Math.random()*95),vy:Math.sin(a)*(30+Math.random()*95),r:2,color,life:.3,max:.3})}}
function setGuard(a,active){if(!a)return false;if(!active){a.guard=false;return true}if(state!=='fight'||a.hp<=0||a.guardBreak>0||a.cast>0||a.dash>0||a.dodgeTime>0||a.root>0||a.punchTime>0||a.st<6){a.guard=false;return false}if(!a.guard)a.guardPerfect=.18;a.guard=true;a.a=aim(a);return true}
function breakGuard(a){a.guard=false;a.st=0;a.guardBreak=1.4;a.root=Math.max(a.root,.65);a.blockFlash=.3;float(a.x,a.y-48,'GUARDA QUEBRADA','#f2a38e');ring(a.x,a.y,48,'#ed9c87',.45);if(a===p)toast('Guarda quebrada · recupere sua Stamina')}
// A short capsule follows the fist on the ground plane, independently of VFX.
function normalAttackContact(a,target,angle,radius=target.r??17){
 const dx=target.x-a.x,dy=target.y-a.y,c=Math.cos(angle),s=Math.sin(angle),forward=dx*c+dy*s;
 if(forward<0)return false;
 const side=-dx*s+dy*c,nearest=clamp(forward,12,40);
 return Math.hypot(forward-nearest,side)<=12+radius;
}
function punch(a,angle,dmg){
 a.a=angle;a.punchTime=.24;a.punchSide=a.combo===2?-1:1;
 const e=enemy(a);let did=false;
 if(e&&normalAttackContact(a,e,angle)&&lineClear(a,e)){
  did=hit(e,dmg,a,a.combo===3?25:8,angle);
  if(did){spark(e.x,e.y-25,a.color,5);if(a.combo===3){float(e.x,e.y-50,'IMPACTO PESADO',a.color);combatImpact(1.8);combatSound('heavy',1.3);}}
 }
 hurtConstructs(a,a.x,a.y,52,dmg,angle,Math.PI,(o,r)=>normalAttackContact(a,o,angle,r));
 return did;
}
function hit(a,n,owner,knock=0,angle=0,visualId=visualContext?.id??-1){
 if(a.hp<=0||a.inv>0||state!=='fight'||sameTeam(a,owner))return false;
 n*=owner?.modeDamage||1;if(owner?.buff.pact>0)n*=1.45;
 let visualBlocked=false;
 if(a.guard&&owner){
  const incoming=Math.atan2(owner.y-a.y,owner.x-a.x);
  const front=Math.abs(Math.atan2(Math.sin(incoming-a.a),Math.cos(incoming-a.a)))<1.3;
  if(front&&a.guardPerfect>0){
   a.guardPerfect=0;a.st=Math.max(0,a.st-8);if(a.st<=0)breakGuard(a);a.blockFlash=.32;a.flash=.12;
   owner.root=Math.max(owner.root||0,.42);owner.flash=Math.max(owner.flash||0,.16);
   float(a.x,a.y-52,'PARRY PERFEITO','#f4e5a5');ring(a.x+Math.cos(a.a)*22,a.y+Math.sin(a.a)*22,36,'#f4e5a5',.32);
   combatImpact(1.7);combatSound('parry',1.2);vfxContact(visualId,a.x,a.y,angle,true);return false;
  }
  if(front){const cost=Math.max(6,Math.min(40,n*.35));if(a.st>=cost){a.st-=cost;if(a.st<=0)breakGuard(a);a.blockedDamage+=Math.round(n*.7);n*=.3;knock*=.2;visualBlocked=true;a.blockFlash=.22;float(a.x,a.y-46,'BLOQUEIO','#b7e3d5');ring(a.x+Math.cos(a.a)*20,a.y+Math.sin(a.a)*20,27,'#b7e3d5',.24);combatSound('block',.8)}else breakGuard(a)}
 }
 if(a.buff.armor>0){a.absorbed+=n*.55;n*=.45}
 if(a.buff.frostShield>0&&a.shieldHP>0){let absorbed=Math.min(n,a.shieldHP);a.shieldHP-=absorbed;n-=absorbed;float(a.x,a.y-45,'ESCUDO '+Math.round(absorbed),'#b4eef0')}
 n=Math.round(n);recordPracticeHit(a,n,owner);a.hp=Math.max(0,a.hp-n);if(a.hp<=0)onModeDeath(a,owner);
 a.flash=visualBlocked?.10:.20;
 // Reação temporária: o contador é atualizado no step e sempre termina.
 a.hitReact=(a.skin>=6&&a.skin<=9)?0.30:0.16;a.hitReactA=angle;
 vfxContact(visualId,a.x,a.y,angle,visualBlocked);if(owner){owner.damage+=n;owner.hits++}
 if(n>0)float(a.x,a.y-30,n,n>=50?'#ffe0a0':'#f0e1ba');
 spark(a.x,a.y,a.color,visualBlocked?5:n>=50?14:10);
 if(knock)move(a,Math.cos(angle)*knock,Math.sin(angle)*knock);
 else if(!visualBlocked&&n>0&&owner&&n>=18)move(a,Math.cos(angle)*Math.min(7,n*.10),Math.sin(angle)*Math.min(7,n*.10));
 if(!visualBlocked&&n>0){let power=n>=50?1.7:n>=30?1.2:1;combatImpact(power);combatSound(n>=65?'crit':n>=40?'heavy':'hit',power)}
 return true
}
function aim(a,manual){if(manual!==undefined)return manual;if(a===p&&mouse)return Math.atan2(mouse.y-a.y,mouse.x-a.x);let e=enemy(a);return Math.atan2(e.y-a.y,e.x-a.x)}
function lineDistance(x,y,x1,y1,x2,y2){let dx=x2-x1,dy=y2-y1,t=clamp(((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-x1-dx*t,y-y1-dy*t)}
function lineClear(a,e){let n=Math.ceil(dist(a,e)/12);for(let i=1;i<n;i++)if(blocked(a.x+(e.x-a.x)*i/n,a.y+(e.y-a.y)*i/n,0))return false;return true}
function area(owner,x,y,r,dmg,color,slow=0){if(owner.hp<=0)return;vfxBlast(visualContext?.id??(color==='#bab5cd'?9:21),x,y,r,owner);ring(x,y,r,color,.55);for(let e of opponents(owner))if(dist(e,{x,y})<r+e.r&&lineClear({x,y},e)&&hit(e,dmg,owner))e.slow=Math.max(e.slow,slow);hurtConstructs(owner,x,y,r,dmg)}
function slash(owner,a,r,dmg,color,arc=1.8){if(owner.hp<=0)return false;owner.swing=.24;owner.a=a;vfxEmit('strike',visualContext?.id??3,owner.x,owner.y,{r,angle:a,arc,duration:.28,owner});fx.push({kind:'slash',x:owner.x,y:owner.y,a,r,color,life:.24,max:.24,arc});let did=false;for(let e of opponents(owner)){let da=Math.atan2(Math.sin(Math.atan2(e.y-owner.y,e.x-owner.x)-a),Math.cos(Math.atan2(e.y-owner.y,e.x-owner.x)-a));if(dist(owner,e)<r+e.r&&Math.abs(da)<arc/2&&lineClear(owner,e))did=hit(e,dmg,owner)||did}hurtConstructs(owner,owner.x,owner.y,r,dmg,a,arc);return did}
function basic(a){if(!a||a.hp<=0||state!=='fight'||a.basic>0||a.cast>0||a.root>0||a.dash>0||a.guard||a.skillLock>0||a.actionRecovery>0)return false;let angle=aim(a);a.combo=a.comboTimer>0&&a.chainTarget===enemy(a)?Math.min(3,(a.hitChain||0)+1):1;a.comboTimer=1.1;let dmg=([22,24,36][a.combo-1])+(a.buff.storm>0?12:0)+(a.buff.jaw>0&&a.charges>0?22:0)+a.reverse;a.reverse=0;a.basic=a.combo===3?.8:.55;if(a.combo===3)a.actionRecovery=.8;if(a.buff.jaw>0)addSprite(11,a.x+Math.cos(angle)*45,a.y+Math.sin(angle)*45,angle,115,115,.3);if(a.buff.echo>0)delay(.35,()=>addSprite(14,a.x,a.y,angle,140,140,.35));let comboVictim=enemy(a),beforeHP=comboVictim.hp;let did=punch(a,angle,dmg);if(did&&comboVictim.hp<beforeHP){a.hitChain=a.combo===3?0:a.combo;a.chainTarget=comboVictim;if(a.combo===3)a.comboTimer=0;}else{a.hitChain=0;a.chainTarget=null;a.comboTimer=0;}if(did&&a.buff.vampire>0)heal(a,Math.round((beforeHP-enemy(a).hp)*.4));if(a.buff.jaw>0&&a.charges>0){a.charges--;if(!a.charges){a.buff.jaw=0;if(a===p)toast('Arma superaquecida')}}if(did&&a.buff.stars>0){a.marks++;if(a.marks>=3){a.buff.stars=0;a.marks=0;delay(.2,()=>area(a,enemy(a).x,enemy(a).y,75,85,'#f3df9a'))}else float(enemy(a).x,enemy(a).y-46,'✦'.repeat(a.marks),'#efda9a')}if(a.buff.echo>0){let pos={x:a.x,y:a.y};delay(.35,()=>{fx.push({kind:'slash',...pos,a:angle,r:100,color:'#e9d7a7',life:.3,max:.3,arc:2});let e=enemy(a);if(dist(e,pos)<115&&lineClear(pos,e))hit(e,18,a)})}return true}
function dodge(a){if(!a||a.hp<=0||state!=='fight'||a.dodgeCD>0||a.st<25||a.cast>0)return false;a.guard=false;a.st-=25;a.dodgeCD=2;a.dodgeTime=.22;a.inv=.28;a.dodgeA=a===p&&(Math.hypot(joy.x,joy.y)>.1||movement().len>0)?Math.atan2(movement().y,movement().x):a===b?aim(a)+Math.PI/2:aim(a);a.dash=0;a.root=0;ring(a.x,a.y,24,a.color);return true}
function shot(owner,angle,speed,dmg,r,color,range=500,root=0){let projectile={art:visualContext?.id??(root?13:dmg===62?18:-1),owner,x:owner.x+Math.cos(angle)*23,y:owner.y+Math.sin(angle)*23,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,dmg,r,color,life:range/speed,root};shots.push(projectile);return projectile}
function telegraph(owner,x,y,r,wait,fn,color){zones.push({owner,x,y,r,life:wait,max:wait,color:color||skills[0].color});delay(wait,fn)}
function limitSummons(a){const pets=objects.filter(o=>o.kind==='pet'&&o.owner===a&&o.hp>0&&o.life>0);while(pets.length>3){const old=pets.shift();old.hp=0;old.life=0}}
function finishSkillRecovery(a,id){limitSummons(a);a.skillLock=Math.max(.6,a.cast+.6,([3,17,42,45].includes(id)?.45:0)+.6)}
function castCore(a,id,manual){let s=skills[id];if(!s||battleActivity==='training'&&a===p&&!account.owned.includes(id))return false;if(!a||a.hp<=0||state!=='fight'||!opponents(a).length||!a.kit.includes(id)||a.cd[id]>0||a.mp<s.cost||a.cast>0||a.dash>0||a.guard||a.skillLock>0||a.actionRecovery>0||a.punchTime>0)return false;if(id===6&&a.hp<=90){if(a===p)toast('HP insuficiente para o pacto');return false}a.mp-=s.cost;a.cd[id]=s.cd;let angle=aim(a,manual),e=enemy(a),c=s.color;a.a=angle;let targetDist=manual===undefined?Math.min(s.range,dist(a,e)):s.range;let tx=clamp(a.x+Math.cos(angle)*targetDist,55,W-55),ty=clamp(a.y+Math.sin(angle)*targetDist,55,H-55);a.swing=.2;playSkillArt(a,id,angle,tx,ty);if(a===p)toast(s.name);else float(a.x,a.y-50,s.name,'#edbca3');
if(id>=24){castExpansion(a,id,angle,tx,ty);finishSkillRecovery(a,id);return true}
switch(id){
case 0:{let x=a.x+Math.cos(angle)*70,y=a.y+Math.sin(angle)*70;slash(a,angle,95,45,c);telegraph(a,x,y,65,.5,()=>area(a,x,y,65,38,c),c);break}
case 1:case 4:{let range=id===1?470:310,dmg=id===1?105:85,width=id===1?27:45;a.cast=id===1?.9:.8;zones.push({owner:a,kind:'line',x:a.x,y:a.y,a:angle,len:range,r:width,life:a.cast,max:a.cast,color:c});let x=a.x,y=a.y;delay(a.cast,()=>{let ex=x+Math.cos(angle)*range,ey=y+Math.sin(angle)*range;for(let t=0;t<range;t+=8){if(blocked(x+Math.cos(angle)*t,y+Math.sin(angle)*t)){ex=x+Math.cos(angle)*t;ey=y+Math.sin(angle)*t;break}}fx.push({kind:'beam',x,y,ex,ey,r:width,color:c,life:.45,max:.45});if(a.hp>0)for(let target of opponents(a))if(lineDistance(target.x,target.y,x,y,ex,ey)<width+target.r)hit(target,dmg,a,id===4?80:0,angle)});break}
case 2:{let x=a.x,y=a.y;a.dash=.19;a.dashA=angle;a.dashSpeed=790;a.dashDmg=0;a.dashHit=false;a.inv=.2;telegraph(a,x,y,65,.65,()=>area(a,x,y,65,35,c),c);break}
case 3:for(let i=0;i<3;i++)delay(i*.18,()=>slash(a,angle+(i-1)*.35,125,27,c,2));break;
case 5:a.buff.storm=5;ring(a.x,a.y,40,c);break;
case 6:a.hp-=65;a.buff.pact=6;float(a.x,a.y-30,'−65 HP',c);break;
case 7:telegraph(a,tx,ty,110,1.2,()=>area(a,tx,ty,110,80,c,2),c);break;
case 8:for(let i=0;i<3;i++){let q=i*TAU/3;objects.push({kind:'anchor',x:tx+Math.cos(q)*65,y:ty+Math.sin(q)*65,cx:tx,cy:ty,hp:25,owner:a,life:3,color:c})}break;
case 9:a.buff.armor=4;a.absorbed=0;break;
case 10:a.dash=.3;a.dashA=angle;a.dashSpeed=700;a.dashDmg=60;a.dashHit=false;break;
case 11:a.buff.jaw=5;a.charges=5;break;
case 12:objects.push({kind:'wire',x:tx,y:ty,a:angle+Math.PI/2,owner:a,life:5,color:c});break;
case 13:shot(a,angle,360,30,10,c,320,1.5);break;
case 14:a.buff.echo=5;break;
case 15:{let x=a.x,y=a.y;objects.push({kind:'return',x,y,owner:a,life:2,color:c});delay(2,()=>{if(!blocked(x,y,a.r)){a.x=x;a.y=y;a.mp=Math.min(120,a.mp+12);ring(x,y,50,c)}});break}
case 16:{let vertical=Math.abs(Math.cos(angle))>.7;let wall={kind:'wall',x:tx,y:ty,w:vertical?22:135,h:vertical?135:22,owner:a,life:4,color:c};if(actors.some(o=>Math.abs(o.x-tx)<wall.w/2+o.r&&Math.abs(o.y-ty)<wall.h/2+o.r)){wall.x=clamp(a.x+Math.cos(angle)*100,70,W-70);wall.y=clamp(a.y+Math.sin(angle)*100,70,H-70)}if(!actors.some(o=>Math.abs(o.x-wall.x)<wall.w/2+o.r&&Math.abs(o.y-wall.y)<wall.h/2+o.r))objects.push(wall);break}
case 17:for(let i=0;i<4;i++){let d=65+i*65,x=a.x+Math.cos(angle)*d,y=a.y+Math.sin(angle)*d;telegraph(a,x,y,48,.8+i*.17,()=>area(a,x,y,48,28,c),c)}break;
case 18:shot(a,angle,460,62,17,c,450);break;
case 19:a.buff.orbit=6;a.orbit=3;break;
case 20:a.cast=.7;delay(.7,()=>{a.dash=.25;a.dashSpeed=640;a.dashA=angle;a.dashDmg=70;a.dashHit=false});break;
case 21:a.buff.stars=7;a.marks=0;break;
case 22:a.buff.reverse=1.2;ring(a.x,a.y,100,c,1.2);break;
case 23:for(let i=0;i<2;i++)objects.push({kind:'pet',x:a.x+(i?30:-30),y:a.y+20,homeX:a.x,homeY:a.y,guard:i===1,owner:a,life:4,cd:.6,hp:28,maxHp:28,dmg:8,color:c});break;
}finishSkillRecovery(a,id);return true}
function hurtConstructs(owner,x,y,r,dmg,angle=0,arc=TAU,contact=null){for(let o of objects){if(!['anchor','pet'].includes(o.kind)||sameTeam(o.owner,owner)||o.hp<=0||dist(o,{x,y})>r+(o.kind==='pet'?14:12)||!lineClear({x,y},o)||contact&&!contact(o,o.kind==='pet'?14:12))continue;let delta=Math.abs(Math.atan2(Math.sin(Math.atan2(o.y-y,o.x-x)-angle),Math.cos(Math.atan2(o.y-y,o.x-x)-angle)));if(delta>arc/2)continue;o.hp-=dmg;spark(o.x,o.y,o.color||'#d6c6ed',3);if(o.hp<=0)float(o.x,o.y-18,'DISSIPADO','#b8cdbb')}}
function pullToward(a,x,y,strength,dt){if(a.inv>0||a.pullBudget<=0)return;let d=Math.hypot(x-a.x,y-a.y);if(d<1)return;let amount=Math.min(d*strength*dt,a.pullBudget);move(a,(x-a.x)/d*amount,(y-a.y)/d*amount);a.pullBudget-=amount}
function heal(a,n){if(a.hp<=0||n<=0)return;let gained=Math.min(n,a.max-a.hp);a.hp+=gained;if(gained>0)float(a.x,a.y-28,'+'+Math.round(gained),'#b4e2ad')}
function expansionPulse(a,x,y,r,dmg,id,opts={}){if(a.hp<=0)return false;if(![26,34,38,40,48].includes(id)||(id===48&&dmg===30))vfxBlast(id,x,y,r,a);let did=false;hurtConstructs(a,x,y,r,dmg);ring(x,y,r,skills[id].color,.3);for(let e of opponents(a))if(dist(e,{x,y})<r+e.r&&lineClear({x,y},e)&&hit(e,dmg,a,opts.knock||0,Math.atan2(e.y-y,e.x-x),id)){if(opts.root)e.root=Math.max(e.root,opts.root);if(opts.slow)e.slow=Math.max(e.slow,opts.slow);did=true}return did}
function addField(a,id,x,y,r,life,interval,dmg,pull=0,slow=0,follow=false){objects.push({kind:'field',owner:a,id,x,y,r,life,cooldown:interval,interval,dmg,pull,slow,follow})}
function castExpansion(a,id,angle,tx,ty){let c=skills[id].color,e=enemy(a),x=a.x,y=a.y;
const launch=(dmg,speed=400,r=12,range=skills[id].range,root=0,extra={})=>Object.assign(shot(a,angle,speed,dmg,r,c,range,root),{art:id,...extra});
switch(id){
case 24:launch(60,360,15,430,0,{burn:true});break;
case 25:launch(48,450,12,390,1);break;
case 26:addField(a,id,tx,ty,95,2.4,.6,15,.8);break;
case 27:a.cast=.7;delay(.7,()=>launch(80,800,10,440,0,{slow:1}));break;
case 28:telegraph(a,tx,ty,105,1.4,()=>expansionPulse(a,tx,ty,105,120,id),c);break;
case 29:launch(48,380,24,225,0,{knock:50});break;
case 30:launch(74,320,19,440,0,{slow:1.8});break;
case 31:for(let i=-2;i<=2;i++)Object.assign(shot(a,angle+i*.15,410,17,7,c,340),{art:id});break;
case 32:a.buff.frostShield=4;a.shieldHP=55;break;
case 33:launch(40,430,11,330,.7,{lifesteal:.5});break;
case 34:addField(a,id,tx,ty,105,2.4,.6,12,1,.65);break;
case 35:a.buff.mirror=3.2;a.reflect=2;break;
case 36:a.buff.wings=5;a.st=Math.min(100,a.st+30);break;
case 37:for(let i=0;i<3;i++){let q=i*TAU/3;objects.push({kind:'pet',id,x:x+Math.cos(q)*28,y:y+Math.sin(q)*28,homeX:x,homeY:y,guard:false,owner:a,life:4,cd:.6+i*.18,hp:30,maxHp:30,dmg:9,color:c})}break;
case 38:addField(a,id,tx,ty,90,4,.5,6,0,.65);break;
case 39:a.buff.vampire=5;break;
case 40:addField(a,id,x,y,85,3,.75,12,0,0,true);break;
case 41:a.cast=1;delay(1,()=>{if(a.hp>0){a.mp=Math.min(120,a.mp+25);float(a.x,a.y-32,'+25 MP',c);vfxEmit('bloom',41,a.x,a.y,{r:48,duration:.45,owner:a})}});break;
case 42:for(let i=0;i<3;i++){let px=x+Math.cos(angle)*(60+i*60),py=y+Math.sin(angle)*(60+i*60);telegraph(a,px,py,38,.5+i*.18,()=>expansionPulse(a,px,py,38,28,id,{root:.4}),c)}break;
case 43:a.root=0;a.guard=false;move(a,Math.cos(angle)*160,Math.sin(angle)*160);a.inv=.25;break;
case 44:for(let i=1;i<=5;i++)delay(i*.6,()=>heal(a,13));break;
case 45:for(let i=0;i<2;i++)delay(i*.22,()=>{slash(a,angle+(i?-.2:.2),110,30,c,1.6);if(i&&dist(a,e)<125&&lineClear(a,e)&&e.inv<=0)move(e,Math.cos(angle)*25,Math.sin(angle)*25)});break;
case 46:expansionPulse(a,x,y,135,46,id,{knock:60,slow:.8});break;
case 47:telegraph(a,tx,ty,90,.9,()=>expansionPulse(a,tx,ty,90,40,id,{root:1.6}),c);break;
case 48:addField(a,id,tx,ty,105,3,.5,8,1.4);delay(3,()=>expansionPulse(a,tx,ty,105,30,id));break;
case 49:a.cast=1.1;telegraph(a,x,y,175,1.1,()=>expansionPulse(a,x,y,175,125,id),c);break;
}}
function movement(){let x=joy.x+(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),y=joy.y+(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),len=Math.hypot(x,y);return{x:x/Math.max(1,len),y:y/Math.max(1,len),len}}
function registerBotAction(a){a.aiSequence++;if(a.aiSequence>=a.aiBudget){a.aiRest=1+Math.random();a.aiSequence=0;a.aiBudget=2+Math.floor(Math.random()*2)}}
function ai(dt,actor=b){if(modeRun&&actor?.hp>0&&modeAI(dt,actor))return;if(!actor||actor.hp<=0||!opponents(actor).length)return;if(battleActivity==='training'&&actor.trainingDummy){practiceAI(dt,actor);return}const b=actor,p=enemy(b);b.think-=dt;let d=dist(b,p),angle=aim(b),danger=zones.some(z=>!sameTeam(z.owner,b)&&(z.kind==='line'?lineDistance(b.x,b.y,z.x,z.y,z.x+Math.cos(z.a)*z.len,z.y+Math.sin(z.a)*z.len)<z.r+30:dist(b,z)<z.r+25))||shots.some(s=>!sameTeam(s.owner,b)&&dist(s,b)<115);let ranged=b.kit.filter(id=>[1,4,7,8,13,17,18,24,25,27,28,30,31,33,34,38,42,47,48].includes(id)).length,desired=b.aiRest>0?170:b.leagueAI?.gap??(ranged>=3?210:65);let moveAngle=danger?angle+Math.PI/2:d>desired?angle:d<desired-35?angle+Math.PI:angle+Math.PI/2;let obstacle=pillars.find(o=>dist(o,b)<o.r+75&&Math.cos(Math.atan2(o.y-b.y,o.x-b.x)-moveAngle)>.5);if(obstacle)moveAngle+=1.25;b.a=angle;if(b.guardTimer<=0)setGuard(b,false);if(!b.guard&&b.cast<=0&&b.root<=0&&b.dash<=0&&b.dodgeTime<=0){let speed=140*(typeof identitySpeed==='function'?identitySpeed(b):1)*(b.buff.storm>0?1.25:1)*(b.buff.astralPower>0?1.25:1)*(b.buff.rpMask>0?.8:1)*(b.buff.rpBreath>0?1.35:1)*(b.buff.armor>0?.8:1)*(b.slow>0?.55:1)*(b.guard?.45:1)*(b.buff.wings>0?1.35:1);let old={x:b.x,y:b.y};let stuck=move(b,Math.cos(moveAngle)*speed*dt,Math.sin(moveAngle)*speed*dt);if(stuck)move(b,Math.cos(moveAngle+1.1)*speed*dt,Math.sin(moveAngle+1.1)*speed*dt);b.moving=dist(old,b)>.01}if(b.think<=0){b.think=(b.leagueAI?.think??.35)+Math.random()*.2;if(danger&&Math.random()<.65)dodge(b);if(b.guardCD<=0&&(danger||d<100&&p.punchTime>0)&&Math.random()<.55){if(setGuard(b,true)){b.guardTimer=.5+Math.random()*.35;b.guardCD=1.2}}if(!b.guard&&b.aiRest<=0&&d<79&&lineClear(b,p)&&basic(b))registerBotAction(b);let available=b.guard||b.aiRest>0?[]:b.kit.filter(id=>b.cd[id]<=0&&b.mp>=skills[id].cost).filter(id=>{if(skills[id].ultimate)return canUseUltimate(b)&&d<skills[id].range+20;if(id===41)return b.mp<65;if(id===44)return b.hp<760;if(id===32)return b.shieldHP<15||!b.buff.frostShield;if(id===49)return d<175;if([29,45,46].includes(id))return d<140;if([0,3,11,12,20,21].includes(id))return d<200;if([5,6,9,14,19,22,23].includes(id))return d<400;if([2,10].includes(id))return d>100;return d<skills[id].range+35});if(available.length&&Math.random()<(b.leagueAI?.chance??.75)&&cast(b,available[Math.floor(Math.random()*available.length)]))registerBotAction(b)}}
function step(dt){clock+=dt;if(state==='count'){count-=dt;$('#countdown').textContent=count>.45?Math.ceil(count-.45):'LUTE';$('#countdown').dataset.go=String(count<=.45);if(count<=0){state='fight';$('#countdown').style.display='none';toast(battleActivity==='training'?'Treino iniciado · pratique no seu ritmo':'Duelo iniciado · boa luta!')}return}if(state!=='fight')return;vfxStep(dt);practiceBeforeStep(dt);if(battleActivity!=='training')time=Math.max(0,time-dt);spriteFX.forEach(f=>f.life-=dt);spriteFX=spriteFX.filter(f=>f.life>0);for(let a of actors){if(a.hp<=0){a.guard=false;a.moving=false;continue}a.pullBudget=60*dt;for(let k of ['basic','inv','dodgeCD','dodgeTime','root','slow','cast','swing','flash','hitReact','guardBreak','guardTimer','guardCD','guardPerfect','blockFlash','punchTime','comboTimer','skillLock','actionRecovery','aiRest'])a[k]=Math.max(0,a[k]-dt);a.cd=a.cd.map(c=>Math.max(0,c-dt));a.mp=Math.min(120,a.mp+4*dt*(modeRun?.id==='daily'?(modeRun.rule===0?.5:modeRun.rule===1?0:1):1));if(a.guard){a.st=Math.max(0,a.st-8*dt);if(a.st<=0)breakGuard(a)}else a.st=Math.min(100,a.st+(a.guardBreak>0?8:16)*dt);for(let key of Object.keys(a.buff)){let was=a.buff[key];a.buff[key]=Math.max(0,was-dt);if(key==='armor'&&was>0&&!a.buff[key])area(a,a.x,a.y,130,35+Math.round(a.absorbed*.4),'#bab5cd')}if(a.dodgeTime>0){move(a,Math.cos(a.dodgeA)*650*dt,Math.sin(a.dodgeA)*650*dt);fx.push({kind:'ghost',x:a.x,y:a.y,a:a.a,color:a.color,life:.15,max:.15})}else if(a.dash>0){a.dash=Math.max(0,a.dash-dt);let collided=move(a,Math.cos(a.dashA)*a.dashSpeed*dt,Math.sin(a.dashA)*a.dashSpeed*dt);if(collided)a.dash=0;if(!a.dashHit&&a.dashDmg>0&&dist(a,enemy(a))<55){a.dashHit=true;hit(enemy(a),a.dashDmg,a,30,a.dashA,a.vfxDash)}}if(a.buff.orbit>0&&a.orbit>0&&dist(a,enemy(a))<75&&a.petTime<=0){if(hit(enemy(a),24,a,0,0,19)){a.orbit--;a.petTime=.5}}a.petTime=Math.max(0,a.petTime-dt);a.gait+=a.moving?dt*12:0;for(let dot of a.dots){dot.life-=dt;dot.tick-=dt;while(dot.tick<=0&&dot.life>=-dt){dot.tick+=.5;hit(a,5,dot.owner,0,0,24)}}a.dots=a.dots.filter(dot=>dot.life>0)}
setGuard(p,defendHeld||!!keys.KeyK);let m=movement();p.moving=m.len>.06&&!p.guard;if(p.hp>0&&!p.guard&&p.cast<=0&&p.root<=0&&p.dodgeTime<=0&&p.dash<=0){let speed=150*(typeof identitySpeed==='function'?identitySpeed(p):1)*(p.buff.storm>0?1.25:1)*(p.buff.astralPower>0?1.25:1)*(p.buff.rpMask>0?.8:1)*(p.buff.rpBreath>0?1.35:1)*(p.buff.armor>0?.8:1)*(p.slow>0?.55:1)*(p.guard?.45:1)*(p.buff.wings>0?1.35:1);move(p,m.x*speed*dt,m.y*speed*dt);if(aimGesture)p.a=aimGesture.a;else if(m.len>.06)p.a=Math.atan2(m.y,m.x)}if(attackHeld||keys.KeyJ)basic(p);for(let a of actors)if(a!==p)ai(dt,a);for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){let a=actors[i],b=actors[j];if(a.hp<=0||b.hp<=0||(typeof identityPhasing==='function'&&(identityPhasing(a)||identityPhasing(b))))continue;let separation=dist(a,b);if(separation<34&&separation>.01){let an=Math.atan2(b.y-a.y,b.x-a.x),n=(34-separation)/2;move(a,-Math.cos(an)*n,-Math.sin(an)*n);move(b,Math.cos(an)*n,Math.sin(an)*n)}}
let due=[];for(let ev of events){ev.t-=dt;if(ev.t<=0)due.push(ev)}events=events.filter(ev=>ev.t>0);for(let ev of due)ev.fn();
for(let s of shots){s.life-=dt;if(s.owner.hp<=0){s.life=0;continue}let steps=Math.ceil(Math.hypot(s.vx,s.vy)*dt/8)||1;for(let j=0;j<steps&&s.life>0;j++){s.x+=s.vx*dt/steps;s.y+=s.vy*dt/steps;if(blocked(s.x,s.y,s.r*.4)){s.life=0;vfxContact(s.art,s.x,s.y,Math.atan2(s.vy,s.vx),true);spark(s.x,s.y,s.color);break}let e=opponents(s.owner).filter(e=>dist(e,s)<Math.max(e.r+s.r,e.buff.reverse>0?100:e.buff.mirror>0&&e.reflect>0?65:e.buff.orbit>0&&e.orbit>0?62:0)).sort((a,b)=>dist(a,s)-dist(b,s))[0];if(e){if(e.buff.mirror>0&&e.reflect>0&&(s.reflections||0)<2&&dist(e,s)<65){let previous=s.owner,speed=Math.hypot(s.vx,s.vy),an=Math.atan2(previous.y-e.y,previous.x-e.x);s.owner=e;s.vx=Math.cos(an)*speed;s.vy=Math.sin(an)*speed;s.x=e.x+Math.cos(an)*65;s.y=e.y+Math.sin(an)*65;s.life=Math.max(s.life,.8);s.reflections=(s.reflections||0)+1;s.trail=[];vfxContact(35,s.x,s.y,an,true);e.reflect--;ring(e.x,e.y,65,'#bce5f2');break}if(e.buff.reverse>0&&dist(e,s)<100){e.reverse+=20;s.life=0;vfxEmit('bloom',22,s.x,s.y,{r:26,duration:.3});ring(s.x,s.y,25,'#bbd3c1');break}if(e.buff.orbit>0&&e.orbit>0&&dist(e,s)<62){e.orbit--;s.life=0;vfxContact(19,s.x,s.y,0,true);ring(s.x,s.y,20,'#bdc8be');break}if(dist(e,s)<e.r+s.r){let before=e.hp;if(hit(e,s.dmg,s.owner,s.knock||0,Math.atan2(s.vy,s.vx),s.art)){e.root=Math.max(e.root,s.root);if(s.slow)e.slow=Math.max(e.slow,s.slow);if(s.lifesteal)heal(s.owner,Math.round((before-e.hp)*s.lifesteal));if(s.burn)e.dots=[{life:3,tick:.5,owner:s.owner}];}s.life=0;break}}for(let o of objects)if((o.kind==='anchor'||o.kind==='pet')&&o.hp>0&&!sameTeam(o.owner,s.owner)&&dist(o,s)<s.r+(o.kind==='pet'?14:12)){o.hp-=s.dmg;vfxContact(s.art,o.x,o.y,Math.atan2(s.vy,s.vx));s.life=0;break}}}shots=shots.filter(s=>s.life>0);
for(let z of zones)z.life-=dt;zones=zones.filter(z=>z.life>0);for(let o of objects){o.life-=dt;if(o.owner.hp<=0){o.life=0;continue}if(o.hp!==undefined&&o.hp<=0)continue;let enemies=opponents(o.owner),e=[...enemies].sort((a,b)=>dist(o,a)-dist(o,b))[0]||enemy(o.owner);if(o.kind==='field'){if(o.follow){o.x=o.owner.x;o.y=o.owner.y}o.cooldown-=dt;for(let e of enemies)if(dist(e,o)<o.r+e.r&&lineClear(o,e)){if(o.pull&&e.inv<=0)pullToward(e,o.x,o.y,o.pull,dt);if(o.slow)e.slow=Math.max(e.slow,o.slow)}while(o.cooldown<=0&&o.life>=-dt){o.cooldown+=o.interval;expansionPulse(o.owner,o.x,o.y,o.r,o.dmg,o.id)}}if(o.kind==='anchor'&&o.hp>0)for(let e of enemies)if(dist(e,{x:o.cx,y:o.cy})<145&&e.inv<=0)pullToward(e,o.cx,o.cy,.7,dt);if(o.kind==='wire')for(let e of enemies)if(o.life>0&&lineDistance(e.x,e.y,o.x-Math.cos(o.a)*90,o.y-Math.sin(o.a)*90,o.x+Math.cos(o.a)*90,o.y+Math.sin(o.a)*90)<e.r+5){if(hit(e,55,o.owner,0,0,12))e.slow=1.5;o.life=0}if(o.kind==='pet'){o.cd-=dt;let target=o.guard&&dist(e,{x:o.homeX,y:o.homeY})>155?{x:o.homeX,y:o.homeY}:e,an=Math.atan2(target.y-o.y,target.x-o.x);if(dist(o,target)>28)move({...o,r:8},0,0);if(dist(o,target)>28){let nx=o.x+Math.cos(an)*190*dt,ny=o.y+Math.sin(an)*190*dt;if(!blocked(nx,ny,8)){o.x=nx;o.y=ny}else{o.x+=Math.cos(an+1)*110*dt;o.y+=Math.sin(an+1)*110*dt}}if(dist(o,e)<42&&o.cd<=0&&lineClear(o,e)){hit(e,o.dmg||15,o.owner,0,Math.atan2(e.y-o.y,e.x-o.x),o.vfxId??o.id??23);o.cd=1.1;ring(o.x,o.y,30,o.color)}}}objects=objects.filter(o=>o.life>0&&(o.hp===undefined||o.hp>0));for(let f of fx){f.life-=dt;if(f.vx!==undefined){f.x+=f.vx*dt;f.y+=f.vy*dt}}fx=fx.filter(f=>f.life>0);for(let t of texts){t.life-=dt;t.y-=dt*26}texts=texts.filter(t=>t.life>0);if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('#toast').style.opacity=0}if(modeRun)stepArenaMode(dt);else if(battleActivity==='training')practiceAfterStep();else if(!actors.some(a=>a.team===0&&a.hp>0)||!actors.some(a=>a.team===1&&a.hp>0)||time<=0)finish();uiTime-=dt;if(uiTime<=0){updateUI();uiTime=.08}}
function finish(){if(modeRun)return;if(state==='end'||battleActivity==='training')return;state='end';clearInputs();updateUI();let ours=actors.filter(a=>a.team===0).reduce((n,a)=>n+a.hp/a.max,0),theirs=actors.filter(a=>a.team===1).reduce((n,a)=>n+a.hp/a.max,0),draw=Math.abs(ours-theirs)<.0001,win=ours>theirs;let reward=0,leagueText='',saveFailed=false;if(!rewardGranted){rewardGranted=true;const before=JSON.stringify(account);account.matches++;if(win&&!draw){reward=awardMatchCoins(matchMode==='2v2'?200:100);account.wins++}else if(!draw){reward=awardMatchCoins(matchMode==='2v2'?50:25)}account.journey.duel=true;leagueText=settleLeague(win,draw);if(!saveAccount()){account=JSON.parse(before);reward=0;leagueText='';saveFailed=true}}$('#resultTitle').textContent=draw?'Empate.':win?'A arena é sua.':'Um novo aprendizado.';$('#resultText').textContent=(time<=0?'Tempo encerrado. Resultado pela soma proporcional de HP das equipes. ':'')+(draw?'As equipes encerraram em igualdade.':win?`Vitória ${matchMode==='2v2'?'da equipe':'no duelo'}! +${reward} moedas para a Loja dos Campeões.`:`A outra equipe venceu. +${reward} moedas pela partida concluída. Experimente outro campeão e tente novamente.`)+leagueText+(!saveFailed?' '+dailyIncomeText():'')+(!saveFailed?' Próximo giro: '+account.coins+' / '+SPIN_COST+' moedas.':'')+(saveFailed?' Não foi possível salvar o resultado. Nenhuma recompensa ou pontuação foi registrada. Verifique o armazenamento do navegador.':'');$('#stats').innerHTML=`<span>${Math.ceil(180-time)}s de combate</span><span>${p.damage} dano</span><span>${reward?'+'+reward+' moedas':'Sem recompensa'}</span>`;$('#outcome').style.display='flex';announce($('#resultTitle').textContent)}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill()}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill()}
function line(x,y,ex,ey,color,w=2){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke()}
function outline(x,y,r,color,w=2){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke()}
function drawActor(a){if(a.boss){if(a.hp>0)drawGuardian(a);return}if(a.trainingDummy){drawTrainingDummy(a);return}if(a.hp<=0){ellipse(a.x,a.y,18,10,'#0b171299');ctx.fillStyle=a.color;ctx.textAlign='center';ctx.font='10px system-ui';ctx.fillText('× '+a.label,a.x,a.y-18);return}ctx.save();ctx.translate(a.x,a.y);if(a.skin===1){ellipse(0,12,20,8,'#06100c99');ctx.save();ctx.translate(0,10);ctx.scale(1,.42);drawTeamMarker(a);ctx.restore()}else{ellipse(2,7,23,17,'#06100c99');drawTeamMarker(a);}if(a.dots.length)circle(-14,-20,4,'#ffae68');if(a.root>0)outline(0,0,23,'#c6b6e8');if(a.slow>0)outline(0,0,26,'#d4a76f');ctx.rotate(a.a);if(a.inv>0)ctx.globalAlpha=.5+Math.sin(clock*50)*.25;let walk=a.moving?Math.sin(a.gait)*4:0;
// Keep character art upright: cancel aim rotation and mirror only horizontally.
// The outer aim transform still directs the guard arc and combat effects.
ctx.save();ctx.rotate(-a.a);const skinDrawn=drawAnimatedFighter(ctx,a);ctx.restore();
if(!skinDrawn){
// Eldoria's original top-down procedural silhouette, kept at the same scale for both fighters.
ellipse(-7,0,18,21,a.team===0?'#244b43':'#5a3833');ellipse(-8,-14+walk,9,6,'#22382d');ellipse(-8,14-walk,9,6,'#22382d');ellipse(-5,0,12,17,a.flash>0?'#fff0cf':a.color);
let extension=a.punchTime>0?Math.sin((1-a.punchTime/.24)*Math.PI)*24:0;
for(let side of [-1,1]){let attacking=a.punchTime>0&&a.punchSide===side,gx=a.guard?23:17+(attacking?extension:0),gy=a.guard?side*7:side*(15-(attacking?5:0));line(-1,side*16,10,side*18,'#b99e78',8);line(10,side*18,gx,gy,'#d5b895',7);ellipse(gx,gy,8,7,a.flash>0?'#fff3d4':'#d8b993');ellipse(gx-3,gy,4,7,a.buff.jaw>0?'#c49a91':'#e4debd');line(gx-4,gy-4,gx-4,gy+4,'#938d6d',1)}
ellipse(4,0,12,12,'#d3b893');ellipse(0,0,10,12,a.team===0?'#494a38':'#49332c');line(4,-10,7,-7,'#a39a71',2);
}
if(a.flash>0){ctx.strokeStyle='#fff0d5';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-2,0,25,0,TAU);ctx.stroke()}
if(a.guard||a.blockFlash>0){ctx.strokeStyle=a.guardBreak>0?'#ef9a85':a.blockFlash>0?'#e4fff2':'#9edcc5';ctx.lineWidth=a.blockFlash>0?5:3;ctx.beginPath();ctx.arc(0,0,31,-1.05,1.05);ctx.stroke()}
ctx.restore()}
function buildArenaBackground(){if(groundCache&&groundCache.width===W&&groundCache.height===H)return;
backgroundBuilds++;groundCache=document.createElement('canvas');groundCache.width=W;groundCache.height=H;
pillarCache=document.createElement('canvas');pillarCache.width=W;pillarCache.height=H;
const g=groundCache.getContext('2d'),pg=pillarCache.getContext('2d');g.imageSmoothingEnabled=false;pg.imageSmoothingEnabled=false;
let seed=74129;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const fill=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
const stroke=(x,y,ex,ey,c,w=1)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(ex,ey);g.stroke()};
const ringG=(x,y,r,c,w=1)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.arc(x,y,r,0,TAU);g.stroke()};
fill(0,0,W,H,'#142b25');fill(30,30,W-60,H-60,'#273d32');
// Weathered stone slabs: highlights, uneven joints, cracks and flat walkable moss.
const colors=['#4c6150','#506553','#4a604e','#536654','#485e4b','#566854'];
for(let y=36,row=0;y<H-36;y+=52,row++)for(let x=36-(row%2)*30;x<W-36;x+=60){
 let l=Math.max(36,x),r=Math.min(W-36,x+58),yy=Math.min(50,H-36-y);if(r<=l||yy<=0)continue;
 fill(l,y,r-l,yy,colors[Math.floor(random()*colors.length)]);fill(l+2,y+2,r-l-4,2,'#b0b69422');fill(l+2,y+yy-3,r-l-4,2,'#253b2d55');
 if(random()<.35){let px=l+8+random()*Math.max(1,r-l-16),py=y+12+random()*25;stroke(px,py,px+6,py+5,'#30493688');stroke(px+6,py+5,px+3,py+13,'#30493688')}
 if(random()<.3){for(let i=0;i<4;i++)fill(l+random()*(r-l),y+random()*yy,3+random()*6,2,'#8c9d7622')}
}
const cx=W/2,cy=H/2,radius=Math.min(W,H)*.245;
// Carved central mosaic; all details are flat and do not add invisible collisions.
g.save();g.beginPath();g.arc(cx,cy,radius+14,0,TAU);g.clip();fill(cx-radius-14,cy-radius-14,(radius+14)*2,(radius+14)*2,'#64745a');
for(let y=cy-radius-14;y<cy+radius+14;y+=30)for(let x=cx-radius-14;x<cx+radius+14;x+=30){fill(x+1,y+1,28,28,random()>.5?'#69795e':'#617355');if(random()<.45)fill(x+5,y+5,16,1,'#c2c69b18')}
g.restore();ringG(cx,cy,radius+16,'#293f30',7);ringG(cx,cy,radius+11,'#a8ac7b',3);ringG(cx,cy,radius+5,'#364e36',2);ringG(cx,cy,radius-11,'#adb68a66',2);ringG(cx,cy,radius-22,'#40593855');
for(let i=0;i<16;i++){let a=i*TAU/16;g.save();g.translate(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);g.rotate(a);fill(-4,-2,8,4,'#b4b586');g.restore()}
// Geometric Eldoria seal, inlaid in aged brass.
g.save();g.translate(cx,cy);g.strokeStyle='#b9ba8977';g.lineWidth=3;g.beginPath();for(let i=0;i<8;i++){let a=-Math.PI/2+i*Math.PI/4,r=i%2?26:62;let x=Math.cos(a)*r,y=Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();g.stroke();ringG(0,0,16,'#c3c18c66',2);g.restore();
// Broken perimeter trim with vegetation kept outside the fighting surface.
for(let x=25;x<W-25;x+=32){fill(x,23,30,11,'#6a7355');fill(x,25,30,3,'#b1b18a');fill(x,H-34,30,11,'#59694c');fill(x,H-34,30,2,'#969e71')}
for(let y=36;y<H-36;y+=32){fill(23,y,11,30,'#657454');fill(25,y,3,30,'#a7ae7e');fill(W-34,y,11,30,'#4b6044');fill(W-34,y,2,30,'#99a477')}
for(let i=0;i<Math.floor((W+H)*.2);i++){let side=Math.floor(random()*4),x,y;if(side<2){x=12+random()*(W-24);y=side===0?8+random()*13:H-21+random()*13}else{x=side===2?8+random()*13:W-21+random()*13;y=12+random()*(H-24)}let c=['#274c32','#365c38','#466a41','#59784b'][Math.floor(random()*4)];fill(x,y,3+random()*9,3+random()*7,c);if(random()<.12)fill(x+2,y-1,2,2,'#c2b77c')}
// Moss is paint on the slabs, never a hidden obstacle.
for(let i=0;i<90;i++){let x=42+random()*(W-84),y=42+random()*(H-84);if(Math.min(x,W-x,y,H-y)>65)continue;fill(x,y,5+random()*12,3,'#5b79494d');fill(x+3,y-2,5,2,'#74905244')}
// Corner rune plates and soft baked lighting.
for(let [x,y]of [[55,55],[W-55,55],[55,H-55],[W-55,H-55]]){fill(x-10,y-10,20,20,'#2e4733');fill(x-8,y-8,16,16,'#8b9466');fill(x-6,y-6,12,12,'#5a704b');stroke(x-3,y,x+3,y,'#d4c995',2);stroke(x,y-3,x,y+3,'#d4c995',2)}
let sun=g.createLinearGradient(0,0,W,H);sun.addColorStop(0,'#e7d39719');sun.addColorStop(.55,'#fff0b703');sun.addColorStop(1,'#091d2140');g.fillStyle=sun;g.fillRect(35,35,W-70,H-70);
let vignette=g.createRadialGradient(cx,cy,Math.min(W,H)*.2,cx,cy,Math.max(W,H)*.64);vignette.addColorStop(0,'#00180d00');vignette.addColorStop(1,'#00180d66');g.fillStyle=vignette;g.fillRect(35,35,W-70,H-70);
// Pillars share the collision positions and radii, cached separately for correct foreground layering.
for(let o of pillars){pg.save();pg.translate(o.x,o.y);const r=o.r;pg.fillStyle='#0c211b77';pg.beginPath();pg.ellipse(9,12,r+10,r+4,0,0,TAU);pg.fill();pg.fillStyle='#374b39';pg.fillRect(-r+3,-r+8,(r-3)*2,r*2-1);pg.fillStyle='#7c8962';pg.beginPath();pg.arc(0,0,r,0,TAU);pg.fill();pg.strokeStyle='#bdbe8b';pg.lineWidth=2;pg.stroke();pg.fillStyle='#8c9870';pg.beginPath();pg.arc(-1,-3,r-5,0,TAU);pg.fill();pg.strokeStyle='#58694b';pg.lineWidth=2;pg.beginPath();pg.moveTo(-r*.45,-r*.3);pg.lineTo(2,2);pg.lineTo(r*.3,r*.55);pg.moveTo(2,2);pg.lineTo(-r*.3,r*.4);pg.stroke();pg.fillStyle='#b8b888';pg.fillRect(-4,-5,8,5);for(let i=0;i<8;i++){let a=random()*TAU;pg.fillStyle=i%2?'#4a6c3e':'#64844e';pg.fillRect(Math.cos(a)*(r-3),Math.sin(a)*(r-3),5,3)}pg.restore()}
}
function draw(){if(!p||!cw)return;updateArenaCamera();ctx.clearRect(0,0,cw,ch);ctx.fillStyle='#101c1b';ctx.fillRect(0,0,cw,ch);if(typeof drawArenaScenery==='function')drawArenaScenery();ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);if(combatShake>0){combatShakeX=(Math.random()-.5)*combatShake;combatShakeY=(Math.random()-.5)*combatShake;ctx.translate(combatShakeX,combatShakeY)}if(groundCache)ctx.drawImage(groundCache,0,0);
dojoDrawDepthWorld();
drawFocusMarker();for(const a of actors)drawActorStatus(a);
drawAimV4();
for(let t of texts){ctx.globalAlpha=Math.min(1,t.life*3);ctx.textAlign='center';ctx.font=(typeof t.t==='number'?'bold 18px':'12px')+' system-ui';ctx.strokeStyle='#142219';ctx.lineWidth=4;ctx.strokeText(t.t,t.x,t.y);ctx.fillStyle=t.color;ctx.fillText(t.t,t.x,t.y);ctx.globalAlpha=1}ctx.restore();drawArenaMap()}
const SKILL_ATLASES=["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
const SKILL_SPRITE_SIZE=192,SKILL_SPRITE_FRAMES=24,SKILL_SPRITE_ROWS=4,SKILL_SPRITE_COLUMNS=6;
const SKILL_CACHE_LIMIT=26,SKILL_DECODE_LIMIT=2;
let skillSpritesReady=false,skillSpritesFailed=false,skillDecodeActive=0,skillUseSerial=0;
const skillSpriteCache=new Map(),skillDecodeQueue=[];
const paintedSkillSeen=new Set(),paintedFrameMasks=Array(50).fill(0);
function trimSkillSpriteCache(){
  while(skillSpriteCache.size>=SKILL_CACHE_LIMIT){
    const ready=[...skillSpriteCache.values()].filter(e=>!e.loading).sort((a,b)=>a.used-b.used);
    if(!ready.length)return;
    const old=ready[0];skillSpriteCache.delete(old.id);old.resolve(false);
    if(old.image){if(old.image.close)old.image.close();else{old.image.onload=null;old.image.onerror=null;old.image.src='';}old.image=null;}
  }
}
function pumpSkillDecode(){
  while(skillDecodeActive<SKILL_DECODE_LIMIT&&skillDecodeQueue.length){
    const e=skillDecodeQueue.shift();if(skillSpriteCache.get(e.id)!==e)continue;
    e.loading=true;skillDecodeActive++;
    const im=e.image=new Image();im.decoding='async';
    const done=ok=>{
      e.loading=false;e.ready=ok;e.failed=!ok;skillDecodeActive--;
      skillSpritesReady=[...skillSpriteCache.values()].some(s=>s.ready);
      skillSpritesFailed=[...skillSpriteCache.values()].some(s=>s.failed);
      e.resolve(ok);pumpSkillDecode();
    };
    im.onload=()=>{
      if(im.naturalWidth!==1152||im.naturalHeight!==768){done(false);return;}
      if(typeof createImageBitmap==='function'){
        createImageBitmap(im).then(bitmap=>{
          im.onload=null;im.onerror=null;im.src='';e.image=bitmap;done(true);
        },()=>done(true));
      }else if(im.decode)im.decode().then(()=>done(true),()=>done(false));
      else done(true);
    };
    im.onerror=()=>done(false);im.src=SKILL_ATLASES[e.id];
  }
}
function ensureSkillSprite(id){
  if(!Number.isInteger(id)||id<0||id>=50)return null;
  let e=skillSpriteCache.get(id);if(e){e.used=++skillUseSerial;return e;}
  trimSkillSpriteCache();
  e={id,used:++skillUseSerial,loading:false,ready:false,failed:false,image:null};
  e.promise=new Promise(resolve=>e.resolve=resolve);
  skillSpriteCache.set(id,e);skillDecodeQueue.push(e);pumpSkillDecode();return e;
}
function hasSkillSprite(id){return !!skillSpriteCache.get(id)?.ready;}
function loadSkillSprites(ids=selected){
  return Promise.all([...new Set(ids)].map(id=>ensureSkillSprite(id)?.promise));
}
function skillSpriteMemoryBytes(){
  return [...skillSpriteCache.values()].filter(e=>e.image).length*SKILL_SPRITE_SIZE**2*24*4;
}
const SKILL_SUSTAIN_FRAMES=[6,7,8,9,10,11,12,13,14,15,14,13,12,11,10,9,8,7];
const SKILL_VISUAL_SCALE={0:1.22,3:1.18,10:1.15,13:1.15,17:1.18,18:1.18,23:1.16,24:1.3,25:1.16,27:1.22,28:1.28,29:1.18,30:1.3,33:1.12,41:1.12,42:1.15,43:1.12,44:1.1,45:1.24,46:1.15,47:1.12,49:1.3};
function paintedFrame(t,loop=true){
  t=Math.max(0,t);
  if(loop)return t<.25?Math.min(5,Math.floor(t*24)):SKILL_SUSTAIN_FRAMES[Math.floor((t-.25)*24)%SKILL_SUSTAIN_FRAMES.length];
  return Math.min(23,Math.floor(clamp(t,0,1)*24));
}
function skillSpriteRect(id,frame){const s=SKILL_SPRITE_SIZE;frame=clamp(Math.floor(frame),0,23);return [(frame%6)*s,Math.floor(frame/6)*s,s,s]}
function paintSkill(id,t,x=0,y=0,w=100,h=w,angle=0,alpha=1,loop=true){
  if(!Number.isInteger(id)||id<0||id>=50||alpha<=0||w<=0||h<=0)return false;
  const asset=ensureSkillSprite(id);if(!asset?.ready)return false;
  const frame=paintedFrame(t,loop),m=SKILL_VISUAL_SCALE[id]||1;
  w*=m;h*=m;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=clamp(alpha,0,1);ctx.imageSmoothingEnabled=true;
  ctx.drawImage(asset.image,...skillSpriteRect(id,frame),-w/2,-h/2,w,h);ctx.restore();
  paintedSkillSeen.add(id);paintedFrameMasks[id]|=1<<frame;
  return true;
}
function drawProjectileArt(id,t){
  const sizes={13:[76,52],18:[78,78],24:[88,78],25:[76,57],27:[92,48],29:[70,64],30:[88,70],31:[34,34],33:[84,40]};
  const size=sizes[id];return !!size&&paintSkill(id,t,0,0,...size);
}
const PAINTED_BUFFS=[['storm',5,108],['pact',6,112],['armor',9,110],['jaw',11,92],['echo',14,112],['stars',21,112],['reverse',22,126],['frostShield',32,106],['wings',36,116],['vampire',39,94]];
function drawPaintedAuras(a){
  for(const [key,id,size]of PAINTED_BUFFS){
    if(!(a.buff[key]>0)||(id===32&&a.shieldHP<=0)||(id===11&&a.charges<=0))continue;
    const angle=[11,36,39].includes(id)?a.a:0;
    const age=vfxTime-(a.vfxSkillBorn?.[id]??0),ending=a.buff[key]<.35;
    paintSkill(id,ending?.75+(1-a.buff[key]/.35)*.25:age,0,0,size,size,angle,id===14?.55:.9,!ending);
  }
}
function drawPaintedEvent(f,t){
  const r=f.r,id=f.id;
  if(f.kind==='dissolve')return paintSkill(id,.75+t*.25,0,0,r*2.2,r*1.7,f.angle,1-t,false);
  // Each use is tied to the corresponding event: no generic sprite triggered for all casts.
  if(f.kind==='blast'){
    // Meteor anticipation uses frames 0–5; the impact starts at frame 6.
    const phase=id===28?.25+t*.75:t;
    if([0,17,28,42,46,47,48,49].includes(id)){
      ctx.save();ctx.globalAlpha*=.55*(1-t);ctx.strokeStyle=vcolor(id);ctx.lineWidth=2.5;
      ctx.beginPath();ctx.arc(0,0,r*(.25+.75*easeOut(t)),0,TAU);ctx.stroke();ctx.restore();
    }
    return paintSkill(id,phase,0,0,r*2.35,r*2.35,0,1,false);
  }
  if(f.kind==='strike')return paintSkill(id,t,Math.cos(f.angle)*r*.52,Math.sin(f.angle)*r*.52,r*1.55,r*1.55,f.angle,1,false);
  if(f.kind==='healing')return paintSkill(44,f.age,0,0,r*2.7,r*2.7,0,.9);
  if(f.kind==='blink')return paintSkill(43,t,0,0,r*2.5,r*2.5,f.angle,1,false);
  if(f.kind==='summon'&&[23,37].includes(id))return paintSkill(id,t,0,0,r*2.5,r*2.5,0,.9,false);
  if(f.kind==='forge')return paintSkill(16,t,0,0,160,75,f.angle,1,false);
  if(f.kind==='echo')return paintSkill(14,t,0,0,r*2,r*2,f.angle,.7,false);
  if(f.kind==='charge'&&id===41)return paintSkill(41,t,0,-15,78,78,0,1,false);
  if(f.kind==='charge'&&id===20)return paintSkill(20,t,0,0,82,82,f.angle,.85,false);
  if(f.kind==='bloom'&&[41,43].includes(id))return paintSkill(id,t,0,0,r*2.2,r*2.2,0,.9,false);
  return false;
}
const VFX_PROFILES = [
  'impact-core','celestial-beam','phantom-step','aurora-crescents','seismic-fault',
  'storm-mantle','crimson-pact','silent-garden','vector-prison','obsidian-armor',
  'impact-engine','steel-jaw','execution-threads','bound-shadow','duelist-echo',
  'instant-return','instant-forge','incandescent-tide','void-blade','iron-orbit',
  'spring-body','rupture-stars','arcane-reversal','spectral-pack','wandering-phoenix',
  'winter-lance','gale-eye','thunder-stake','astral-fall','spirit-palm',
  'tidal-serpent','petal-dance','frost-cocoon','twilight-chain','horizon-weight',
  'prism-mirror','impetus-wings','illusion-triad','corrosive-mist','ruby-fists',
  'lunar-satellites','reserve-crystal','underground-thorns','butterfly-step','rebirth-flower',
  'solar-tiger','breaking-resonance','boreal-prison','infinite-well','eclipse-crown'
];
let visualContext=null, vfxTime=0, vfxSerial=0, vfxQuality='auto', vfxFrameCost=16;
let vfxEvents=[],vfxParticles=[];
const VFX_LIMITS={effects:48,particles:144,trail:10};
const vfxSeen=new Set();
const easeOut=t=>1-(1-t)*(1-t)*(1-t);
const vfract=n=>n-Math.floor(n);
const vnoise=n=>vfract(Math.sin(n*127.1+311.7)*43758.5453);
const vcolor=id=>skills[id]?.color||'#c8eee0';
function vfxLite(){return vfxQuality==='low'||(vfxQuality==='auto'&&vfxFrameCost>23)}
function vfxBudget(){return vfxLite()?72:VFX_LIMITS.particles}
function vfxReset(){vfxEvents=[];vfxParticles=[];vfxTime=0;vfxSerial=0}
function vfxWithin(id,owner,fn){
  const prev=visualContext, oi=objects.length,fi=fx.length,zi=zones.length;
  visualContext={id,owner};
  try{return fn()}finally{
    for(let i=oi;i<objects.length;i++){
      const o=objects[i];if(o.owner!==owner||o.vfxBorn!==undefined)continue;
      o.vfxId=id;o.vfxBorn=vfxTime;o.vfxDuration=o.life;o.vfxX=o.x;o.vfxY=o.y;
      if(o.kind==='pet')vfxEmit('summon',id,o.x,o.y,{r:35,duration:.5,owner});
      if(o.kind==='wall')vfxEmit('forge',id,o.x,o.y,{r:70,duration:.5,owner,angle:o.w>o.h?0:Math.PI/2});
    }
    for(let i=fi;i<fx.length;i++)if(fx[i].vfxId===undefined)fx[i].vfxId=id;
    for(let i=zi;i<zones.length;i++)if(zones[i].vfxId===undefined)zones[i].vfxId=id;
    visualContext=prev;
  }
}
function cast(a,id,manual){
  let from=a?{x:a.x,y:a.y}:null;
  const result=vfxWithin(id,a,()=>castCore(a,id,manual));
  if(result){
    beginFighterEcho(a,id);
    if(!a.vfxSkillBorn)a.vfxSkillBorn={};a.vfxSkillBorn[id]=vfxTime;
    vfxSeen.add(id);
    if([2,10,20].includes(id)){a.vfxDash=id;a.vfxTrail=[];a.vfxTrailClock=0}
    if(id===43){vfxEmit('blink',id,from.x,from.y,{r:35,ex:a.x,ey:a.y,angle:a.a,duration:.5,owner:a});vfxEmit('bloom',id,a.x,a.y,{r:42,duration:.45,owner:a})}
  }
  return result;
}
function vfxEmit(kind,id,x,y,opt={}){
  const f={kind,id,x,y,angle:0,r:40,age:0,duration:.45,seed:++vfxSerial,...opt};
  if(['strike','blink','summon','forge','echo','bloom'].includes(kind))f.duration=Math.max(.5,f.duration);
  if(vfxEvents.length>=VFX_LIMITS.effects){let i=vfxEvents.findIndex(e=>e.kind==='contact');vfxEvents.splice(i<0?0:i,1)}
  vfxEvents.push(f);return f;
}
function vfxDust(id,x,y,n=8,speed=75,angle=0,spread=TAU){
  n=Math.min(n,vfxLite()?8:14);let cap=vfxBudget();
  for(let i=0;i<n&&vfxParticles.length<cap;i++){
    const seed=++vfxSerial,q=angle+(vnoise(seed)-.5)*spread,v=speed*(.35+vnoise(seed+7)*.65);
    vfxParticles.push({id,x,y,vx:Math.cos(q)*v,vy:Math.sin(q)*v,age:0,duration:.55+vnoise(seed+8)*.6,size:1.4+vnoise(seed+2)*2.4,spin:q,seed});
  }
}
function vfxContact(id,x,y,angle=0,blocked=false){
  vfxEmit('contact',id,x,y,{angle,r:id===28||id===49?43:24,duration:.28,blocked});
  if(!blocked&&[13,18,24,25,27,29,30,31,33].includes(id))vfxEmit('dissolve',id,x,y,{angle,r:id===31?20:42,duration:.4});
  vfxDust(id,x,y,blocked?4:7,90,angle,2.8);
}
function vfxBlast(id,x,y,r,owner){
  vfxEmit('blast',id,x,y,{r,duration:id===28||id===49?.9:.62,owner});
  vfxDust(id,x,y,12,Math.min(160,r));
}
function playSkillArt(a,id,angle,tx,ty){
  // Attack bodies are emitted by slash/shot/area, at the actual damage event.
  if([1,4,20,27,41].includes(id))vfxEmit('charge',id,a.x,a.y,{r:id===4?42:32,angle,owner:a,follow:a,duration:{1:.9,4:.8,20:.7,27:.7,41:1}[id]});
  else if([5,6,9,11,14,19,21,22,32,35,36,39].includes(id))vfxEmit('bloom',id,a.x,a.y,{r:42,duration:.4,owner:a});
  else if(id===44)vfxEmit('healing',id,a.x,a.y,{r:40,duration:3,follow:a,owner:a});
  else if([13,18,24,25,29,30,31,33].includes(id))vfxEmit('muzzle',id,a.x+Math.cos(angle)*24,a.y+Math.sin(angle)*24,{angle,r:22,duration:.22,owner:a});
  else if([23,37].includes(id))vfxEmit('summon',id,a.x,a.y,{r:52,duration:.45,owner:a});
}
function addSprite(id,x,y,angle=0,w=100,h=w,duration=.4,follow=null){vfxEmit(id===14?'echo':'strike',id,x,y,{angle,r:Math.min(w,h)*.45,duration,follow,owner:follow})}
function prepareEquippedSprites(){return loadSkillSprites(actors.filter(a=>a.hp>0).flatMap(a=>a.kit))}
function vfxStep(dt){
  vfxTime+=dt;
  for(const f of vfxEvents)f.age+=dt;
  vfxEvents=vfxEvents.filter(f=>f.age<f.duration&&(!f.follow||f.follow.hp>0));
  for(const f of vfxParticles){f.age+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=Math.max(0,1-dt*2);f.vy*=Math.max(0,1-dt*2)}
  vfxParticles=vfxParticles.filter(f=>f.age<f.duration);
  for(const a of actors){
    if(!a.vfxTrail)a.vfxTrail=[];
    for(const t of a.vfxTrail)t.age+=dt;
    a.vfxTrail=a.vfxTrail.filter(t=>t.age<.23);
    if(a.hp<=0)continue;
    if(a.dash>0&&[2,10,20].includes(a.vfxDash)){
      a.vfxTrailClock=(a.vfxTrailClock||0)-dt;
      if(a.vfxTrailClock<=0){a.vfxTrailClock=.035;a.vfxTrail.push({x:a.x,y:a.y,age:0,angle:a.dashA});if(a.vfxTrail.length>VFX_LIMITS.trail)a.vfxTrail.shift()}
    }
  }
  for(const s of shots){
    s.vfxAge=(s.vfxAge||0)+dt;s.vfxClock=(s.vfxClock||0)-dt;
    if(!s.trail)s.trail=[];
    if(s.vfxClock<=0){s.vfxClock=.025;s.trail.push({x:s.x,y:s.y});if(s.trail.length>VFX_LIMITS.trail)s.trail.shift()}
  }
  for(const o of objects)if(o.kind==='pet'){o.vfxX=o.x;o.vfxY=o.y}
}
function vring(r,c,w=2,start=0,end=TAU){if(r<=0)return;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.arc(0,0,r,start,end);ctx.stroke()}
function vline(x,y,ex,ey,c,w=2){line(x,y,ex,ey,c,w)}
function vpoly(points,c,fill=true,w=2){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(fill){ctx.fillStyle=c;ctx.fill()}else{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke()}}
function vdiamond(x,y,r,c,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);vpoly([[r,0],[0,-r*.5],[-r,0],[0,r*.5]],c);vline(-r*.5,0,r*.5,0,'#fff5d9',1);ctx.restore()}
function vstar(x,y,r,c,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);vpoly([[r,0],[r*.18,r*.18],[0,r],[-r*.18,r*.18],[-r,0],[-r*.18,-r*.18],[0,-r],[r*.18,-r*.18]],c);ctx.restore()}
function vpetal(x,y,r,c,angle){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-r,0);ctx.quadraticCurveTo(0,-r*.9,r,0);ctx.quadraticCurveTo(0,r*.6,-r,0);ctx.fill();ctx.restore()}
function vbolt(len,width,c,phase=0){ctx.strokeStyle=c;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(0,0);for(let i=1;i<=9;i++)ctx.lineTo(len*i/9,i===9?0:Math.sin(i*17+Math.floor(phase*18))*width*2.4);ctx.stroke()}
function varc(r,c,start,end,w=4){vring(r,c,w,start,end)}
function vflower(r,c,t,count=6){for(let i=0;i<count;i++){let q=i*TAU/count+t;vpetal(Math.cos(q)*r*.6,Math.sin(q)*r*.6,r*.42,c,q)}vring(r*.23,'#fff0c7',2)}
function vspiral(r,c,t,turns=2){ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();const n=vfxLite()?28:44;for(let i=0;i<=n;i++){let u=i/n,q=t+u*TAU*turns,rad=r*u;let x=Math.cos(q)*rad,y=Math.sin(q)*rad;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
function vcracks(r,c,phase=0,count=7){ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<count;i++){let a=i*TAU/count+phase;ctx.moveTo(Math.cos(a)*r*.18,Math.sin(a)*r*.18);ctx.lineTo(Math.cos(a+.12)*r*.56,Math.sin(a+.12)*r*.56);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.stroke()}
function vteam(owner){return owner?.team===p?.team?'#75c8ff':'#ff9389'}
function vboundary(r,owner,progress=1){ctx.save();vring(r,'#0d2529',5);vring(r,vteam(owner),1.6);ctx.globalAlpha*=.8;vring(r-4,vteam(owner),2,-Math.PI/2,-Math.PI/2+TAU*progress);ctx.restore()}
function vfxDrawTelegraphs(){
  for(const z of zones){
    const id=z.vfxId??0,c=vcolor(id),t=1-z.life/z.max;
    ctx.save();ctx.translate(z.x,z.y);
    if(z.kind==='line'){
      let len=z.len;for(let d=0;d<z.len;d+=8)if(blocked(z.x+Math.cos(z.a)*d,z.y+Math.sin(z.a)*d)){len=d;break}
      ctx.rotate(z.a);ctx.globalAlpha=.13;ctx.fillStyle=c;ctx.fillRect(0,-z.r,len,z.r*2);
      ctx.globalAlpha=.75;vline(0,-z.r,len,-z.r,vteam(z.owner),1.3);vline(0,z.r,len,z.r,vteam(z.owner),1.3);
      vline(0,0,len*t,0,c,3);
      for(let x=35;x<len-20;x+=45){let d=x+vfract(vfxTime*1.5)*20;vpoly([[d-7,-6],[d,0],[d-7,6]],vteam(z.owner),false,1)}
    }else{
      ctx.globalAlpha=.09+t*.09;circle(0,0,z.r,c);
      ctx.globalAlpha=.8;vboundary(z.r,z.owner,t);
      ctx.globalAlpha=.32+t*.35;
      if(id===7)vflower(z.r*(.15+t*.6),c,vfxTime*.2,8);
      else if(id===28){ctx.save();ctx.globalAlpha=.85;paintSkill(28,t*.249,0,-(1-t)*z.r,z.r*1.6,z.r*1.6,0,.9,false);ctx.restore();vring(z.r*(1.3-t*.75),c,2);vstar(0,0,14+t*14,c,vfxTime*.4);for(let i=0;i<4;i++){let q=i*Math.PI/2;vline(Math.cos(q)*z.r*.7,Math.sin(q)*z.r*.7,Math.cos(q)*z.r*.9,Math.sin(q)*z.r*.9,c,2)}}
      else if(id===49){circle(0,0,16+t*25,'#10112d');vring(20+t*25,'#e6b0ff',2);for(let i=0;i<8;i++){let q=i*TAU/8-vfxTime*.3;vdiamond(Math.cos(q)*z.r*(1-t*.55),Math.sin(q)*z.r*(1-t*.55),5,c,q)}}
      else if(id===42){vcracks(z.r*t,c);vdiamond(0,0,8+t*12,c,Math.PI/2)}
      else if(id===47){for(let i=0;i<6;i++){let q=i*TAU/6;vdiamond(Math.cos(q)*z.r*.7,Math.sin(q)*z.r*.7,4+t*11,c,q)}vring(z.r*.55,c,1)}
      else if(id===17){varc(z.r*.6,c,-t*TAU,-t*TAU+Math.PI,3);varc(z.r*.35,'#ffdd9b',t*TAU,t*TAU+Math.PI,2)}
      else if(id===2){vspiral(z.r*(1-t*.5),c,-vfxTime*3,1.2)}
      else {vring(z.r*(.25+t*.65),c,2);vstar(0,0,9,c,vfxTime)}
    }
    ctx.restore();
  }
}
function vfxDrawFields(){
  for(const o of objects){if(o.kind!=='field'||o.life<=0||o.owner.hp<=0)continue;
    const c=vcolor(o.id),r=o.r,age=vfxTime-(o.vfxBorn??0),t=age,fade=Math.min(1,age*5,o.life*5);
    ctx.save();ctx.translate(o.x,o.y);ctx.globalAlpha=.1*fade;circle(0,0,r,c);ctx.globalAlpha=.65*fade;vboundary(r,o.owner);
    const overlaps=objects.filter(other=>other!==o&&other.kind==='field'&&other.life>0&&other.owner.hp>0&&dist(o,other)<o.r+other.r).length;
    ctx.globalAlpha=(o.id===38?.5:.8)*fade/(1+overlaps*.32);const painted=paintSkill(o.id,age,0,0,r*2.4,r*2.4);ctx.globalAlpha=.56*fade;
    if(!painted)switch(o.id){
      case 26:for(let i=0;i<3;i++){ctx.save();ctx.rotate(t*1.8+i*TAU/3);varc(r*(.28+i*.2),c,0,Math.PI*1.4,3);vpetal(r*.85,0,8,'#d8fff0',Math.PI/2);ctx.restore()}vspiral(r*.7,c,-t*2,1.3);break;
      case 34:for(let i=0;i<3;i++){let f=vfract(t*.65+i/3);vring(r*(1-f),'#d6b8ff',1+f*2)}for(let i=0;i<6;i++){let q=i*TAU/6;vdiamond(Math.cos(q)*r*.8,Math.sin(q)*r*.8,4,c,q)}break;
      case 38:for(let i=0;i<(vfxLite()?6:10);i++){let q=i*2.4+t*.15,rr=r*(.2+vnoise(i)*.55);ctx.globalAlpha=.06*fade;circle(Math.cos(q)*rr,Math.sin(q)*rr,20+Math.sin(t*2+i)*6,c);ctx.globalAlpha=.5*fade;let p=vfract(t*.4+i*.28);vringLocal(Math.cos(q)*rr,Math.sin(q)*rr-8*p,2+p*3,c,1)}break;
      case 40:for(let i=0;i<3;i++){let q=t*1.5+i*TAU/3;ctx.save();ctx.translate(Math.cos(q)*r*.78,Math.sin(q)*r*.78);ctx.rotate(q);varc(10,'#e4e0ff',-.8,2.3,5);ctx.restore()}varc(r*.78,c,t,t+Math.PI,1.5);break;
      case 48:ctx.globalAlpha=.6*fade;circle(0,0,r*.32,'#0c122a');vring(r*.34,'#e0c2ff',3);for(let i=0;i<3;i++)vspiral(r*(.6+i*.17),c,-t*1.7+i*2.1,1);for(let i=0;i<5;i++){let u=vfract(t*.6+i/5),q=i*2.1+t*2;vdiamond(Math.cos(q)*r*(1-u),Math.sin(q)*r*(1-u),2+u*2,'#e0d4ff',q)}break;
    }
    ctx.globalAlpha=.7*fade;vboundary(r,o.owner);ctx.globalAlpha=.28*fade;vring(r*(.85+.1*Math.sin((o.interval-o.cooldown)/o.interval*TAU)),c,1);ctx.restore();
  }
}
function vringLocal(x,y,r,c,w=2){ctx.save();ctx.translate(x,y);vring(r,c,w);ctx.restore()}
function vfxDrawObjects(){
  for(const o of objects){if(o.life<=0||(o.hp!==undefined&&o.hp<=0)||o.owner.hp<=0)continue;
    const id=o.vfxId??o.id??23,c=vcolor(id),age=vfxTime-(o.vfxBorn??0),appear=easeOut(Math.min(1,age/.3)),fade=Math.min(1,o.life*4);
    if(o.kind==='field')continue;
    ctx.save();ctx.translate(o.x,o.y);ctx.globalAlpha=fade;
    if(o.kind==='wall'){
      if(paintSkill(16,age,0,-4,154,65,o.w>o.h?0:Math.PI/2)){ctx.restore();continue}
      const h=7*appear;ctx.fillStyle='#111f2dd9';ctx.fillRect(-o.w/2+4,-o.h/2+5,o.w,o.h);
      ctx.translate(0,-h);ctx.fillStyle='#273e47';ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.strokeRect(-o.w/2,-o.h/2,o.w,o.h);
      const horizontal=o.w>o.h,amount=5;for(let i=0;i<amount;i++){let d=(i-(amount-1)/2)*25;ctx.globalAlpha=fade*(.65+.3*Math.sin(vfxTime*3-i));vdiamond(horizontal?d:0,horizontal?0:d,8,c,horizontal?Math.PI/2:0)}
    }else if(o.kind==='anchor'){
      vline(0,0,o.cx-o.x,o.cy-o.y,c+'66',1.5);if(paintSkill(8,age,0,0,52,52)){vline(-11,24,11,24,'#14232e',3);vline(-11,24,-11+22*Math.max(0,o.hp)/25,24,vteam(o.owner),2);ctx.restore();continue}ctx.rotate(vfxTime*.5);vdiamond(0,0,13*appear,c,Math.PI/2);vring(18,c,1);ctx.rotate(-vfxTime*.5);vline(-11,21,11,21,'#14232e',3);vline(-11,21,-11+22*Math.max(0,o.hp)/25,21,vteam(o.owner),2);
    }else if(o.kind==='wire'){
      ctx.rotate(o.a);if(paintSkill(12,age,0,0,202,42)){ctx.restore();continue}vline(-90,0,90,0,'#101a2c',5);vline(-90,0,90,0,c,1.5);for(let i=0;i<5;i++){let x=-85+vfract(vfxTime*.55+i/5)*170;vstar(x,0,3,c)}vdiamond(-90,0,7,c,Math.PI/2);vdiamond(90,0,7,c,Math.PI/2);
    }else if(o.kind==='return'){
      if(paintSkill(15,age,0,0,74,74)){ctx.restore();continue}
      vring(26,c,2);vring(19,c,1);for(let i=0;i<4;i++){let q=i*TAU/4;vdiamond(Math.cos(q)*24,Math.sin(q)*24,5,c,q+vfxTime)}ctx.globalAlpha*=.2;drawSkinBody(ctx,o.owner,53);
    }else if(o.kind==='pet'){
      ellipse(0,7,18,11,'#07152177');const an=Math.atan2(enemy(o.owner).y-o.y,enemy(o.owner).x-o.x);const beat=Math.sin(vfxTime*14+o.x*.02);const attack=o.cd>.9?(o.cd-.9)/.2:0;
      ctx.save();ctx.scale(appear,appear);
      if(id===37){
        ctx.globalAlpha*=.62;ctx.scale(Math.cos(an)<0?-1:1,1);const moving=Math.hypot(o.x-(o.vfxX??o.x),o.y-(o.vfxY??o.y))>.2;drawSkinBody(ctx,{...o.owner,guard:false,cast:0,swing:0,dash:0,dodgeTime:0,punchTime:attack>0?.16:0,moving,gait:vfxTime*12,punchSide:1},57);ctx.globalAlpha=.8*fade;vring(24,c,1.5);
      }else if(!paintSkill(23,vfxTime+(o.guard?.2:0),0,0,70,56,an)){
        ctx.rotate(an);ctx.globalAlpha*=.75;ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-21,0);ctx.quadraticCurveTo(-11,-13,12,-9);ctx.lineTo(17,-15);ctx.lineTo(21,-7);ctx.lineTo(29,0);ctx.lineTo(21,7);ctx.lineTo(17,15);ctx.lineTo(12,9);ctx.quadraticCurveTo(-11,13,-21,0);ctx.fill();for(let side of [-1,1]){vline(-9,side*7,-15+beat*4,side*14,c,4);vline(7,side*7,14-beat*4,side*14,c,4)}vline(-20,0,-32,beat*5,c,4);circle(19,-4,2,'#f2ffe8');circle(19,4,2,'#f2ffe8');
      }
      ctx.restore();if(attack>0){ctx.save();ctx.rotate(an);varc(32,c,-.6,.6,3*attack);ctx.restore()}
      vline(-13,-30,13,-30,'#15261e',3);vline(-13,-30,-13+26*o.hp/o.maxHp,-30,vteam(o.owner),2);
    }
    ctx.restore();
  }
}
function vfxDrawTrails(){
  for(const a of actors){if(a.hp<=0)continue;let id=a.vfxDash,c=vcolor(id);if(a.dash>0&&[2,10,20].includes(id))paintSkill(id,vfxTime,a.x-Math.cos(a.dashA)*12,a.y-Math.sin(a.dashA)*12,128,92,a.dashA,.95);for(let i=0;i<(a.vfxTrail?.length||0);i++){
    const f=a.vfxTrail[i];ctx.save();ctx.translate(f.x,f.y);ctx.globalAlpha=(1-f.age/.23)*.28;
    if(id===2){ctx.scale(Math.cos(f.angle)<0?-1:1,1);drawSkinBody(ctx,a,62)}else{ctx.rotate(f.angle);vline(-30,-15,12,-15,c,3);vline(-30,15,12,15,c,3);vline(-45,0,5,0,c,5)}ctx.restore();
  }}
}
function vfxDrawAuras(front){
  for(const a of actors){if(a.hp<=0)continue;ctx.save();ctx.translate(a.x,a.y);let t=vfxTime;
    // Back halves sit below the body, front halves above it, keeping the silhouette clear.
    const lo=front?0:Math.PI,hi=front?Math.PI:TAU;
    ctx.globalAlpha=.8;if(!front)drawPaintedAuras(a);ctx.globalAlpha=.72;
    if(a.buff.storm>0&&!hasSkillSprite(5)){varc(32,vcolor(5),lo,hi,2);for(let i=0;i<4;i++){let q=t*3+i*TAU/4;if((Math.sin(q)>=0)!==front)continue;ctx.save();ctx.rotate(q);vbolt(12,1.6,'#ddffff',t);ctx.restore();vstar(Math.cos(q)*36,Math.sin(q)*36,4,vcolor(5),q)}}
    if(a.buff.pact>0&&!hasSkillSprite(6)){varc(36,vcolor(6),lo,hi,2.4);for(let i=0;i<6;i++){let q=i*TAU/6+t*.25;if((Math.sin(q)>=0)!==front)continue;vdiamond(Math.cos(q)*36,Math.sin(q)*36,5,vcolor(6),q+Math.PI/2)}}
    if(a.buff.armor>0&&!hasSkillSprite(9)){for(let i=0;i<6;i++){let q=i*TAU/6+Math.PI/6;if((Math.sin(q)>=0)!==front)continue;ctx.save();ctx.rotate(q);ctx.translate(Math.sin(t*2+i)*1.5,0);vpoly([[28,-10],[36,-7],[38,7],[29,11]],'#45475f');vpoly([[28,-10],[36,-7],[38,7],[29,11]],vcolor(9),false,1.5);ctx.restore()}}
    if(a.buff.jaw>0&&front&&!hasSkillSprite(11)){ctx.save();ctx.rotate(a.a);for(let s of [-1,1]){vdiamond(22,s*18,9+Math.sin(t*7)*1.2,vcolor(11));vringLocal(22,s*18,12,vcolor(11)+'88',1);for(let i=0;i<a.charges;i++)vline(15+i*4,s*26,17+i*4,s*(29+Math.sin(t*5+i)*2),vcolor(11),1.5)}ctx.restore()}
    if(a.buff.echo>0&&!front&&!hasSkillSprite(14)){ctx.save();const d=18+Math.sin(t*3)*3;ctx.translate(-Math.cos(a.a)*d,-Math.sin(a.a)*d);ctx.scale(Math.cos(a.a)<0?-1:1,1);ctx.globalAlpha=.23;drawSkinBody(ctx,a,66);ctx.restore()}
    if(a.buff.orbit>0){for(let i=0;i<a.orbit;i++){let q=t*3+i*TAU/3;if((Math.sin(q)>=0)!==front)continue;varc(46,vcolor(19),q-.45,q,1.5);if(!paintSkill(19,t,Math.cos(q)*46,Math.sin(q)*46,25,31,q+.6))vdiamond(Math.cos(q)*46,Math.sin(q)*46,9,vcolor(19),q+.6)}}
    if(a.buff.stars>0&&!front){for(let i=0;i<3;i++){let q=-Math.PI/2+(i-1)*.45;vstar(Math.cos(q)*44,Math.sin(q)*44,i<a.marks?7:4,vcolor(21),t*.3)}vline(-19,-39,0,-44,vcolor(21)+'88',1);vline(0,-44,19,-39,vcolor(21)+'88',1)}
    if(a.buff.reverse>0&&!hasSkillSprite(22)){varc(100,vcolor(22)+'55',lo,hi,1);for(let i=0;i<3;i++){let q=-t*2+i*TAU/3;if((Math.sin(q)>=0)!==front)continue;varc(42,vcolor(22),q,q+.6,3)}}
    if(a.buff.frostShield>0&&a.shieldHP>0&&!hasSkillSprite(32)){varc(32,vcolor(32),lo,hi,2);for(let i=0;i<6;i++){let q=i*TAU/6;if((Math.sin(q)>=0)!==front)continue;vdiamond(Math.cos(q)*32,Math.sin(q)*32,5+Math.sin(t*3+i),vcolor(32),q)}if(front){ctx.globalAlpha=.07+Math.sin(t*2)*.02;circle(0,0,30,vcolor(32))}}
    if(a.buff.mirror>0&&a.reflect>0){for(let i=0;i<a.reflect;i++){let q=t*.8+i*Math.PI;if((Math.sin(q)>=0)!==front)continue;ctx.save();ctx.rotate(q);if(paintSkill(35,t,35,0,28,48,Math.PI/2)){ctx.restore();continue}vpoly([[31,-14],[39,-7],[39,7],[31,14]],'#bcf5f455',true);vpoly([[31,-14],[39,-7],[39,7],[31,14]],vcolor(35),false,2);ctx.restore()}}
    if(a.buff.wings>0&&!front&&!hasSkillSprite(36)){ctx.save();ctx.rotate(a.a);for(let s of [-1,1])for(let i=0;i<3;i++)vpetal(-14-i*4,s*(20+i*5),14-i*2,vcolor(36)+'bb',s*(.6+Math.sin(t*5)*.12));ctx.restore()}
    if(a.buff.vampire>0&&front&&!hasSkillSprite(39)){ctx.save();ctx.rotate(a.a);for(let s of [-1,1]){vringLocal(21,s*17,8,vcolor(39),2);vstar(23,s*17,5,'#ffd8dc',t)}ctx.restore()}
    ctx.restore();
  }
}
function vfxDrawProjectiles(){
  for(const s of shots){const id=s.art,c=vcolor(id),an=Math.atan2(s.vy,s.vx),t=s.vfxAge||0;
    ctx.save();const tr=s.trail||[];for(let i=1;i<tr.length;i++){ctx.globalAlpha=i/tr.length*.45;vline(tr[i-1].x,tr[i-1].y,tr[i].x,tr[i].y,c,Math.max(1,s.r*.6*i/tr.length))}ctx.restore();
    ctx.save();ctx.translate(s.x,s.y);orientSkillSprite(ctx,an);ctx.lineCap='round';
    if(!drawProjectileArt(id,t))switch(id){
      case 13:for(let i=0;i<3;i++){ctx.strokeStyle=i===1?'#ded2ff':c;ctx.lineWidth=3-i*.5;ctx.beginPath();ctx.moveTo(-35,i*4-4);ctx.quadraticCurveTo(-16,Math.sin(t*18+i)*14,12,0);ctx.stroke()}vdiamond(10,0,10,c);break;
      case 18:ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(12,-25);ctx.quadraticCurveTo(-20,0,12,25);ctx.quadraticCurveTo(4,0,12,-25);ctx.fill();varc(25,'#e4f5ff',-1.2,1.2,2);break;
      case 24:{let wing=16+Math.sin(t*20)*8;vpoly([[-27,0],[-7,-7],[-15,-wing],[7,-9],[20,0],[7,9],[-15,wing],[-7,7]],c);vpoly([[-19,0],[4,-4],[17,0],[4,4]],'#fff0af');for(let i=0;i<3;i++)vpetal(-28-i*9,Math.sin(t*17+i)*6,7-i,c,t);break}
      case 25:vpoly([[25,0],[-13,-8],[-6,0],[-13,8]],c);vline(-9,0,21,0,'#edffff',2);for(let i=0;i<3;i++)vdiamond(-20-i*10,(i%2?1:-1)*5,4,c);break;
      case 27:ctx.translate(-42,0);vbolt(65,3,c,t);vbolt(65,1,'#ffffff',t);ctx.translate(42,0);vdiamond(15,0,14,'#fff3b5');break;
      case 29:for(let i=0;i<3;i++){ctx.save();ctx.translate(-i*10,0);ctx.globalAlpha=1-i*.27;varc(20+i*3,c,-1.25,1.25,4-i);ctx.restore()}ctx.fillStyle='#e7fff0';ctx.fillRect(0,-8,12,16);for(let i=0;i<4;i++)vline(10,-9+i*6,20-Math.abs(i-1.5)*2,-9+i*6,'#e7fff0',4);break;
      case 30:for(let i=6;i>=0;i--){let x=13-i*8,y=Math.sin(t*16-i*.7)*8;ellipse(x,y,10-i*.55,8-i*.6,i%2?c:'#a8e9f4')}vpoly([[8,-7],[25,0],[8,7]],c);circle(15,-3,2,'#fffbd1');break;
      case 31:ctx.rotate(t*8);vpetal(0,0,12,c,0);vpetal(-5,1,8,'#ffe4f3',.8);break;
      case 33:for(let i=0;i<5;i++){ctx.save();ctx.translate(-i*9,Math.sin(t*12-i)*3);ctx.strokeStyle=i%2?'#e6caff':c;ctx.lineWidth=2;ctx.strokeRect(-5,-3,9,6);ctx.restore()}vpoly([[15,0],[2,-10],[5,0],[2,10]],c,false,3);break;
      default:vdiamond(0,0,s.r,c);
    }
    ctx.restore();
  }
}
function vfxDrawBeam(f){
  const id=f.vfxId??1,c=vcolor(id),t=1-f.life/f.max,len=Math.hypot(f.ex-f.x,f.ey-f.y);
  ctx.save();ctx.translate(f.x,f.y);ctx.rotate(Math.atan2(f.ey-f.y,f.ex-f.x));ctx.globalAlpha=(1-t)*.95;
  ctx.save();ctx.beginPath();ctx.rect(0,-f.r*1.6,len,f.r*3.2);ctx.clip();const painted=paintSkill(id,t,len/2,0,len*1.12,f.r*(id===4?2.8:3.1),0,1,false);ctx.restore();if(painted){ctx.restore();return}
  if(id===4){
    for(let i=0;i<len;i+=24){const q=i/len;let h=f.r*(.35+.5*Math.sin(q*18-t*8));vpoly([[i,-h],[i+18,-h*.6],[i+24,0],[i+15,h],[i,h*.4]],'#524745');vline(i,-h,i+18,-h*.6,c,2);vline(i,0,i+24,0,'#ffe9bd',2)}
    vline(0,-f.r,len,-f.r,c,.8);vline(0,f.r,len,f.r,c,.8);
  }else{
    const w=f.r*(1-t*.55);vline(0,0,len,0,c,w*1.8);vline(0,0,len,0,'#e4faff',w*.65);vline(0,0,len,0,'#ffffff',w*.15);
    for(let i=0;i<5;i++){ctx.save();ctx.translate((i/5+t*.6)%1*len,0);ctx.scale(.35,1);vring(w*1.2,c,3);ctx.restore()}
    vstar(len,0,22*(1-t),c,t*3);
  }ctx.restore();
}
function vfxDrawEvent(f,ground){
  const t=clamp(f.age/f.duration,0,1),u=easeOut(t),fade=1-t,c=vcolor(f.id),r=f.r;
  const x=f.follow?f.follow.x:f.x,y=f.follow?f.follow.y:f.y;
  const onGround=['blast','bloom','summon','healing','blink','forge'].includes(f.kind);
  if(ground!==onGround)return;
  ctx.save();ctx.translate(x,y);ctx.lineCap='round';ctx.globalAlpha=Math.min(1,(1-t)*3);
  if(drawPaintedEvent(f,t)){ctx.restore();return}
  if(f.kind==='charge'){
    ctx.globalAlpha=.75;for(let i=0;i<6;i++){let q=i*TAU/6+f.age*2,rr=r*(1-t*.65);vstar(Math.cos(q)*rr,Math.sin(q)*rr,2+t*3,c,q)}
    if(f.id===41){vdiamond(0,-26,9+t*9,c,Math.PI/2);vring(24,c,1,-Math.PI/2,-Math.PI/2+t*TAU)}
    else if(f.id===20){ctx.rotate(f.angle);for(let i=0;i<4;i++)vringLocal(-20+i*7,0,16-i*2,c,1.5)}
    else if(f.id===27){ctx.rotate(f.angle);ctx.translate(-20,0);vbolt(42,1.5,c,f.age)}
    else {vring(r*(1-t*.6),c,1.5);circle(Math.cos(f.angle)*24,Math.sin(f.angle)*24,5+t*8,'#f4ffff')}
  }else if(f.kind==='strike'){
    ctx.rotate(f.angle);const span=f.arc||1.7,dir=f.flip?-1:1,start=-span/2+span*t;
    if(f.id===45){for(let i=-1;i<=1;i++){ctx.save();ctx.translate(0,i*11);varc(r*(.6+u*.35),c,dir*start-.4,dir*start+.45,5*fade+1);ctx.restore()}}
    else if(f.id===11){vpoly([[r*.3,-20],[r*.7,-13],[r*.95,0],[r*.7,13],[r*.3,20],[r*.55,0]],c,false,3)}
    else if(f.id===0){ctx.translate(r*.45,0);vring(r*.32*u,c,5*fade+1);vline(-25,0,25,0,'#e6ffff',4*fade)}
    else {varc(r*(.72+u*.2),c,start-.8,start+.25,9*fade+1);varc(r*(.76+u*.2),'#fff6d9',start-.55,start+.12,2)}
  }else if(f.kind==='contact'){
    ctx.rotate(f.angle);const rr=r*u;
    if(f.blocked){varc(rr,'#c8fff0',-1.1,1.1,4*fade+1)}
    else{vstar(0,0,rr*.7,'#fff8df',.3);for(let i=0;i<5;i++){let q=i*TAU/5;vline(Math.cos(q)*rr*.65,Math.sin(q)*rr*.65,Math.cos(q)*rr,Math.sin(q)*rr,c,2)}}
  }else if(f.kind==='muzzle'){
    ctx.rotate(f.angle);vring(5+u*r,c,2);vline(-18,0,12,0,'#f1ffeb',3*fade);
  }else if(f.kind==='echo'){
    ctx.rotate(f.angle);ctx.globalAlpha=.35*fade;vpoly([[-30,-15],[15,-15],[45,0],[15,15],[-30,15]],c);varc(r,c,-.8,.8,3);
  }else if(f.kind==='blink'){
    const dx=f.ex-x,dy=f.ey-y;ctx.globalAlpha=.35*fade;vline(0,0,dx,dy,c,2);
    for(let i=0;i<6;i++){let q=(i+.5)/6;ctx.save();ctx.translate(dx*q,dy*q);const flap=3+Math.sin(f.age*24+i)*2;vpetal(0,-flap,7,c,-.6);vpetal(0,flap,7,c,.6);ctx.restore()}
  }else if(f.kind==='healing'){
    ctx.globalAlpha=Math.min(1,f.age*5,(f.duration-f.age)*4)*.55;vflower(r,c,f.age*.25,5);for(let i=0;i<4;i++){let q=i*2.4,dy=vfract(f.age*.7+i/4)*35;vstar(Math.cos(q)*27,Math.sin(q)*18-dy,3,'#e3ffd7')}
  }else if(f.kind==='summon'){
    vring(r*u,c,2);vring(r*u*.65,c,1);for(let i=0;i<(f.id===37?3:2);i++){let q=i*TAU/(f.id===37?3:2)+.2;vstar(Math.cos(q)*r*u,Math.sin(q)*r*u,7*fade,c)}
  }else if(f.kind==='forge'){
    ctx.rotate(f.angle);for(let i=0;i<5;i++)vdiamond((i-2)*25,0,12*u,c,Math.PI/2);vline(-65,0,65,0,'#e6ffff',3*fade);
  }else if(f.kind==='bloom'){
    vring(r*u,c,2.5*fade);for(let i=0;i<6;i++){let q=i*TAU/6;vdiamond(Math.cos(q)*r*u,Math.sin(q)*r*u,4*fade,c,q)}
  }else if(f.kind==='blast'){
    ctx.globalAlpha=fade*.9;vring(r*(.22+.78*u),c,3*fade+1);ctx.globalAlpha=fade*.13;circle(0,0,r*u,c);ctx.globalAlpha=fade*.8;
    switch(f.id){
      case 0:vring(r*u*.7,'#eefeff',5*fade);vcracks(r*u,c,0,6);break;
      case 2:for(let i=0;i<3;i++)vspiral(r*u,c,i*2+t*3,1);break;
      case 7:vflower(r*u,c,t*.6,8);break;
      case 9:for(let i=0;i<8;i++){let q=i*TAU/8;vdiamond(Math.cos(q)*r*u,Math.sin(q)*r*u,10*fade,c,q)}break;
      case 17:for(let i=0;i<7;i++){let q=i*2.4;vpetal(Math.cos(q)*r*u*.6,Math.sin(q)*r*u*.6,18*fade,'#ffd69a',q+t)}vring(r*u*.6,'#ffebb7',3);break;
      case 21:for(let i=0;i<5;i++){let q=i*TAU/5;vstar(Math.cos(q)*r*u,Math.sin(q)*r*u,12*fade,c,t)}break;
      case 28:vcracks(r*u,'#f5d8ff',.2,9);vstar(0,0,r*.7*fade,'#fff0d5',.4);for(let i=0;i<8;i++){let q=i*2.4;vdiamond(Math.cos(q)*r*u,Math.sin(q)*r*u,10*fade,c,q)}break;
      case 42:for(let i=0;i<5;i++){let q=i*2.4;vdiamond(Math.cos(q)*r*.4,Math.sin(q)*r*.4,8+20*Math.sin(t*Math.PI),c,q)}vcracks(r,c);break;
      case 46:for(let i=0;i<3;i++){let p=clamp(t*1.8-i*.22,0,1);vring(r*p,c,3*(1-p))}break;
      case 47:for(let i=0;i<6;i++){let q=i*TAU/6;ctx.save();ctx.translate(Math.cos(q)*r*.78,Math.sin(q)*r*.78);ctx.rotate(q);vpoly([[0,-9],[17*u,0],[0,9],[-10,0]],c);ctx.restore()}vring(r*.65,c,2);break;
      case 48:circle(0,0,r*(1-u)*.7,'#10162e');for(let i=0;i<3;i++)vspiral(r*(1-u*.65),c,i*2+t*3,1);break;
      case 49:circle(0,0,r*.28*fade,'#17132d');vring(r*.32*fade,'#fff0bd',5);for(let i=0;i<10;i++){let q=i*TAU/10+t*.3;ctx.save();ctx.rotate(q);vpoly([[r*u*.5,-4],[r*u,0],[r*u*.65,9]],c);ctx.restore()}vring(r*u*.8,'#ffe0ff',2);break;
      default:vring(r*u*.6,c,2);
    }
  }
  ctx.restore();
}
function vfxDrawLayer(ground){
  if(ground){vfxDrawTrails();vfxDrawFields()}
  for(const f of vfxEvents)vfxDrawEvent(f,ground);
  if(ground)vfxDrawTelegraphs();
  if(!ground){
    for(const z of zones)if(z.vfxId===28){const t=1-z.life/z.max,u=clamp((t-.42)/.58,0,1);if(u<=0)continue;const h=(1-u)*170;ctx.save();ctx.translate(z.x-h*.35,z.y-h);ctx.rotate(1.22);ctx.globalAlpha=Math.min(1,u*5);vpoly([[-85,-7],[-37,-15],[0,-19],[22,0],[0,19],[-37,15]],vcolor(28));vpoly([[-63,0],[-10,-9],[20,0],[-10,9]],'#fff6d2');vstar(0,0,22,'#fff0c5',vfxTime);ctx.restore()}
    for(const f of vfxParticles){ctx.save();const remaining=Math.max(0,1-f.age/f.duration);ctx.globalAlpha=remaining*remaining*(3-2*remaining);ctx.translate(f.x,f.y);ctx.scale(.35+.65*remaining,.35+.65*remaining);const c=vcolor(f.id);if([25,32,42,47].includes(f.id))vdiamond(0,0,f.size*1.8,c,f.spin);else if([7,31,43,44].includes(f.id))vpetal(0,0,f.size*1.7,c,f.spin+f.age*5);else vline(0,0,-f.vx*.025,-f.vy*.025,c,f.size);ctx.restore()}
  }
}
function vfxDrawLegacy(){
  for(const f of fx){
    if(f.kind==='beam'){vfxDrawBeam(f);continue}
    if(f.kind==='slash'||(f.vfxId!==undefined&&f.kind==='ring'))continue;
    ctx.save();ctx.globalAlpha=Math.max(0,f.life/f.max);
    if(f.kind==='punch'){ctx.translate(f.x,f.y);ctx.rotate(f.a);vline(-18,0,18,0,f.color,4);varc(f.r*(1-f.life/f.max*.5),f.color,-1.2,1.2,2)}
    if(f.kind==='ring'){ctx.globalAlpha*=.45;outline(f.x,f.y,f.r*(1.15-f.life/f.max*.5),f.color,2)}
    if(f.kind==='spark')circle(f.x,f.y,1.8,f.color);
    if(f.kind==='ghost'){ctx.globalAlpha*=.25;ellipse(f.x,f.y,17,22,f.color)}
    ctx.restore();
  }
}
function vfxSetQuality(value){vfxQuality=value==='low'?'low':'auto';try{localStorage.setItem('eldoria-vfx-quality',vfxQuality)}catch{}const button=$('#vfxQuality');if(button)button.textContent=vfxQuality==='low'?'Efeitos: leve':'Efeitos: automático'}
try{vfxQuality=localStorage.getItem('eldoria-vfx-quality')==='low'?'low':'auto'}catch{}
let teamHudSignature='';
function updateTeamHud(){
  const container=$('#teamHud');
  if(matchMode!=='2v2'){container.hidden=true;return}
  container.hidden=false;
  const ally=actors.find(a=>a.team===p.team&&a!==p);
  const other=actors.find(a=>a.team!==p.team&&a!==b);
  const members=[ally,other].filter(Boolean),signature=members.map(a=>actors.indexOf(a)+':'+a.skin).join('|');
  if(signature!==teamHudSignature){
    teamHudSignature=signature;
    container.innerHTML=members.map((a,i)=>`<div class="team-mini ${a.team!==p.team?'enemy-mini':''}" id="teamMini${i}">${skinPortrait(a.skin)}<div class="team-mini-data"><div class="team-mini-title"><b>${a===ally?'Aliado':'Rival '+(actors.indexOf(a)===1?'1':'2')}</b><span id="teamHp${i}"></span></div><div class="team-mini-bar"><i id="teamBar${i}"></i></div></div></div>`).join('');
  }
  members.forEach((a,i)=>{$('#teamHp'+i).textContent=a.hp>0?Math.ceil(a.hp)+' HP':'CAIU';$('#teamBar'+i).style.width=100*Math.max(0,a.hp)/a.max+'%';$('#teamMini'+i).classList.toggle('fallen',a.hp<=0)});
  $('#spectating').hidden=p.hp>0||state==='end';
}
function skillControlState(a,s){
  const cooldown=Math.max(0,a.cd[s.id]||0),recovery=Math.max(a.skillLock,a.actionRecovery,a.cast,a.punchTime);
  const noMana=a.mp<s.cost,locked=state!=='fight'||a.hp<=0||a.guard||a.dash>0||!opponents(a).length||(s.id===6&&a.hp<=90)||(battleActivity==='training'&&a===p&&!account.owned.includes(s.id));
  const ready=cooldown<=0&&!noMana&&!locked&&recovery<=0;
  const remaining=cooldown>0?cooldown:recovery;
  const text=remaining>0?(remaining<1?remaining.toFixed(1).replace('.',','):String(Math.ceil(remaining))):noMana?'MP':locked?'—':'';
  return{ready,noMana,locked,remaining,text,cooldown,fraction:clamp(cooldown/s.cd,0,1)};
}
function updateUI(){
  if(!p)return;
  if(opponents(p).length){const focus=enemy(p);if(focus!==b){b=focus;$('#botkit').innerHTML=b.kit.map(id=>`<span title="${skills[id].name}">${icon(id)}</span>`).join('');hydrateSkillIcons()}}
  updateTeamHud();
  $('.fighterhud.enemy .title b').textContent='FOCO · '+(b.label||'Rival');
  $('#attack').classList.toggle('recovering',p.basic>0||p.skillLock>0);$('#attack').classList.toggle('punching',p.punchTime>0);
  $('#attack small').textContent=p.actionRecovery>0?'RECUPERA':'SOCO';
  $('#defend').classList.toggle('guarding',p.guard);$('#defend').setAttribute('aria-pressed',String(p.guard));
  $('#defend small').textContent=p.guardBreak>0?'QUEBRA':p.guard?'DEFESA':'SEGURE';
  $('#php').textContent=Math.ceil(p.hp)+' / '+p.max;$('#bhp').textContent=Math.ceil(b.hp)+' / '+b.max;
  for(const [id,a]of [['p',p],['b',b]]){$('#'+id+'hbar').style.width=100*a.hp/a.max+'%';$('#'+id+'mbar').style.width=a.mp/1.2+'%';$('#'+id+'sbar').style.width=a.st+'%'}
  $('#resText').textContent='MP '+Math.floor(p.mp)+' · ST '+Math.floor(p.st);
  const sec=Math.ceil(time);$('#timer').textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
  document.querySelectorAll('.skill').forEach((el,i)=>{
    const s=skills[p.kit[i]],u=skillControlState(p,s),cover=el.querySelector('.cool');
    el.classList.toggle('is-ready',u.ready);el.classList.toggle('no-mana',u.noMana);el.classList.toggle('temporarily-locked',!u.ready&&!u.noMana&&u.cooldown<=0);
    el.setAttribute('aria-disabled',String(!u.ready));
    cover.hidden=u.ready;cover.textContent=u.text;cover.style.display=u.ready?'none':'grid';
    cover.style.background=u.cooldown>0?`conic-gradient(from -90deg,#061411dc ${u.fraction*360}deg,#06141170 0deg)`:'#07171499';
  });
  $('#dodge').classList.toggle('no-resource',p.st<25);$('#dodge').setAttribute('aria-disabled',String(p.st<25||p.dodgeCD>0));
  $('#dodge small').textContent=p.dodgeCD>0?Math.ceil(p.dodgeCD)+'s':p.st<25?'ST':'25 ST';
  applyProgressionHUD();modeHUD();
}
function drawTeamMarker(a){
  const color=a.team===p.team?'#75c8ff':'#ff9389';
  outline(0,4,26,'#071918cc',5);outline(0,4,26,color,2.5);
  if(a===p){ctx.fillStyle='#d5f3ff';ctx.beginPath();ctx.moveTo(-5,27);ctx.lineTo(5,27);ctx.lineTo(0,33);ctx.closePath();ctx.fill()}
}
function drawFocusMarker(){
  if(!p||p.hp<=0||!opponents(p).length)return;
  const target=enemy(p);ctx.save();ctx.translate(target.x,target.y);
  for(let i=0;i<4;i++){const q=i*Math.PI/2+Math.PI/4;ctx.strokeStyle='#0b1716';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,36,q-.2,q+.2);ctx.stroke();ctx.strokeStyle='#ffe3a0';ctx.lineWidth=3;ctx.stroke()}
  ctx.restore();
}
function drawActorStatus(a){
  if(a.hp<=0||a.x*scale+ox< -60||a.x*scale+ox>cw+60||a.y*scale+oy< -60||a.y*scale+oy>ch+60)return;
  const color=a.team===p.team?'#9bd9ff':'#ffada1';
  const nameY=Math.max(a.y-(a.skin>=6&&!a.trainingDummy?86:a.skin===1?78:52),(-oy+12)/scale),barY=Math.max(a.y-(a.skin>=6&&!a.trainingDummy?74:a.skin===1?65:39),(-oy+20)/scale);
  ctx.save();ctx.textAlign='center';ctx.font=`600 ${Math.max(11,9/scale)}px system-ui`;ctx.strokeStyle='#081a16';ctx.lineWidth=3;
  ctx.strokeText(a.label||'',a.x,nameY);ctx.fillStyle=color;ctx.fillText(a.label||'',a.x,nameY);
  ctx.fillStyle='#081a16';ctx.fillRect(a.x-28,barY,56,7);ctx.fillStyle=color;ctx.fillRect(a.x-27,barY+1,54*clamp(a.hp/a.max,0,1),5);
  ctx.restore();
}
const FIGHTER_DRAW_SIZE=72;
const fighterMotionStates=new WeakMap(),fighterEchoStates=new WeakMap();
const motionSmooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
function beginFighterEcho(a,id,t=vfxTime){
  if(!a||!skills[id])return;
  fighterEchoStates.set(a,{id,start:t,charge:Math.max(0,a.cast||0),duration:Math.max(.46,(a.cast||0)+.3)});
}
function fighterMotion(a,t){
  let m=fighterMotionStates.get(a);
  if(!m){m={last:t,walk:a.moving?1:0,brace:a.guard?1:0};fighterMotionStates.set(a,m)}
  const dt=clamp(t-m.last,0,.05),blend=1-Math.exp(-dt*16);m.last=t;
  m.walk+=((a.moving?1:0)-m.walk)*blend;m.brace+=((a.guard?1:0)-m.brace)*blend;
  const angle=Number.isFinite(a.a)?a.a:0,step=(a.gait||0)*Math.PI/3;
  const breath=Math.sin(t*2.6+validSkin(a.skin)*.73),weight=Math.sin(t*1.3+validSkin(a.skin));
  m.kind=a.moving?'walk':'idle';m.x=weight*.45*(1-m.walk);m.y=-Math.abs(Math.sin(step))*2.3*m.walk-breath*.55*(1-m.walk);
  m.sx=1+breath*.006*(1-m.walk);m.sy=1+breath*.014*(1-m.walk);m.lean=Math.sin(step)*.037*m.walk+weight*.009*(1-m.walk);
  m.pose=a.moving?[2,2,0,1,1,0][Math.floor(Math.abs(a.gait||0))%6]:0;
  m.facing=Math.cos(angle)<-.08?-1:Math.cos(angle)>.08?1:(m.facing||1);
  m.angle=angle;m.progress=0;m.echo=null;m.power=0;
  const echo=fighterEchoStates.get(a),age=echo?t-echo.start:Infinity;
  if(echo&&age>=0&&age<echo.duration)m.echo={...echo,age};
  if(a.dodgeTime>0||a.dash>0){
    const u=a.dodgeTime>0?clamp(1-a.dodgeTime/.22,0,1):clamp(1-a.dash/.3,0,1);
    m.kind='dodge';m.progress=u;m.power=Math.sin(Math.PI*Math.max(.12,u));
    m.angle=a.dodgeTime>0?(a.dodgeA??angle):(a.dashA??angle);
    m.pose=u<.76?6:7;m.y-=3.5*m.power;m.sx+=.075*m.power;m.sy-=.075*m.power;m.lean=Math.cos(m.angle)*.1*m.power;
  }else if(a.punchTime>0){
    // Damage is immediate. Extension is visible on that same simulation tick.
    const u=clamp(1-a.punchTime/.24,0,1),power=1-motionSmooth(u/.85),side=a.punchSide<0?-1:1;
    m.kind='punch';m.progress=u;m.power=power;m.pose=u<.66?(side<0?3:4):0;
    const reach=(a.combo===3?5.5:4)*power;
    m.x+=Math.cos(angle)*reach;m.y+=Math.sin(angle)*reach;
    m.lean=side*(.08*power-.025*Math.sin(Math.PI*u));m.sx+=.045*power;m.sy-=.035*power;
  }else if(a.guard){
    m.kind='guard';m.pose=5;m.x-=Math.cos(angle)*1.4*m.brace;m.y+=1.5*m.brace;
    m.sy-=.045*m.brace;m.sx+=.015*m.brace;m.lean=-m.facing*.025;
  }else if(m.echo||a.cast>0){
    const e=m.echo,charge=e?.charge||a.cast||0,u=e?clamp((e.age-charge)/.3,0,1):0;
    const charging=a.cast>0&&(!e||e.age<charge),gather=e?motionSmooth(e.age/.14):1;
    m.kind='echo';m.progress=u;m.power=charging?gather:1-u;
    m.pose=charging||e&&e.age<.08?5:u<.7?4:0;
    m.y+=charging?1.2*gather:-1.5*Math.sin(u*Math.PI);
    m.x+=Math.cos(angle)*(charging?-1.3*gather:3*(1-u));m.y+=Math.sin(angle)*(charging?-1.3*gather:3*(1-u));
    m.sy-=charging?.035*gather:.025*(1-u);m.lean=charging?-.025*m.facing:.05*m.facing*(1-u);
  }else if(a.swing>0){
    const power=clamp(a.swing/.24,0,1);m.pose=power>.35?4:0;m.x+=Math.cos(angle)*2*power;m.y+=Math.sin(angle)*2*power;
  }
  // A new physical action ends the release gesture; persistent skill auras are separate.
  if(m.echo&&(a.dodgeTime>0||a.guard||a.punchTime>0&&m.echo.age>0)){m.echo=null;fighterEchoStates.delete(a)}
  const impact=a.blockFlash>0?clamp(a.blockFlash/.18,0,1):clamp((a.flash||0)/.14,0,1);
  if(impact>0){m.x-=Math.cos(angle)*3*impact;m.y-=Math.sin(angle)*3*impact;m.sy-=.035*impact;m.lean+=Math.sin(impact*Math.PI*3)*.03}
  return m;
}
function drawFighterAccents(g,a,m,t,front){
  const alpha=Number.isFinite(g.globalAlpha)?g.globalAlpha:1;
  const line=(x,y,xx,yy)=>{g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke()};
  g.save();g.lineWidth=1.2;g.strokeStyle=a.color||'#9edcc5';
  if(!front&&m.kind==='walk'){
    const p=((Math.abs(a.gait||0)%3)/3),side=Math.floor(Math.abs(a.gait||0)/3)%2?1:-1;
    g.globalAlpha=alpha*(1-p)*.19;g.beginPath();g.ellipse(-Math.cos(m.angle)*13,16+side*5,3+p*6,1.5+p*2,0,0,TAU);g.stroke();
  }
  if(front&&m.kind==='guard'){
    const r=32+Math.sin(t*3)*.7;g.globalAlpha=alpha*(a.blockFlash>0?.8:.27);g.lineWidth=a.blockFlash>0?2.2:1;
    g.beginPath();g.arc(0,0,r,m.angle-.72,m.angle+.72);g.stroke();
    for(const side of [-1,1]){const q=m.angle+side*.82;line(Math.cos(q)*28,Math.sin(q)*28,Math.cos(q)*33,Math.sin(q)*33)}
  }
  if(front&&m.kind==='punch'&&m.progress<.72){
    g.globalAlpha=alpha*(1-m.progress)*.5;g.strokeStyle='#fff1ce';g.lineWidth=a.combo===3?2:1.3;
    const side=a.punchSide<0?-1:1,angle=m.angle+side*(.6-m.progress),r=29+m.progress*14;
    g.beginPath();g.arc(0,0,r,angle-.25,angle+.25);g.stroke();
  }
  if(m.echo){
    const e=m.echo,c=skills[e.id].color,charge=e.charge>0&&e.age<e.charge;
    const fade=Math.min(1,e.age/.09,(e.duration-e.age)/.2);g.strokeStyle=c;g.fillStyle=c;
    if(!front){
      g.globalAlpha=alpha*fade*.5;g.beginPath();g.ellipse(0,8,24+(charge?Math.sin(e.age*9)*1.2:m.progress*9),15,0,0,TAU);g.stroke();
      // Four bounded marks keep the gesture legible below existing skill sprites.
      for(let i=0;i<4;i++){const q=i*TAU/4+e.age*2,x=Math.cos(q)*29,y=8+Math.sin(q)*18;line(x,y,x+Math.cos(q)*4,y+Math.sin(q)*3)}
    }else{
      g.globalAlpha=alpha*fade*.85;const x=Math.cos(m.angle)*23,y=Math.sin(m.angle)*23;
      for(let i=0;i<4;i++){const q=i*2.399+e.age*3,r=charge?13*(1-(e.age*1.6+i/4)%1):5+m.progress*16;g.fillRect(x+Math.cos(q)*r-1,y+Math.sin(q)*r-1,2,2)}
      g.beginPath();g.arc(x,y,charge?3+Math.sin(e.age*8):2+(1-m.progress)*4,0,TAU);g.stroke();
    }
  }
  g.restore();
}
function drawAnimatedFighter(g,a,size=FIGHTER_DRAW_SIZE,t=vfxTime){
  if(!skinImageReady)return false;
  const m=fighterMotion(a,t),unit=size/FIGHTER_DRAW_SIZE;
  g.save();g.scale(unit,unit);drawFighterAccents(g,a,m,t,false);
  if(m.kind==='dodge'){
    const alpha=Number.isFinite(g.globalAlpha)?g.globalAlpha:1,count=typeof vfxLite==='function'&&vfxLite()?1:2;
    for(let i=count;i>=1;i--){g.save();g.globalAlpha=alpha*.13*(1-m.progress)/(i*.7);g.translate(-Math.cos(m.angle)*i*11,-Math.sin(m.angle)*i*11);g.scale(m.facing,1);drawSkinBody(g,a,FIGHTER_DRAW_SIZE,6);g.restore()}
  }
  g.save();g.translate(m.x,m.y);g.rotate(m.lean);g.scale(m.facing*m.sx,m.sy);
  const drawn=drawSkinBody(g,a,FIGHTER_DRAW_SIZE,m.pose);g.restore();drawFighterAccents(g,a,m,t,true);g.restore();return drawn;
}
const skinPreviewActor={skin:0,gait:0,moving:false,guard:false,punchTime:0,punchSide:1,dodgeTime:0,dash:0,swing:0,cast:0,a:0,dodgeA:0,flash:0,blockFlash:0,combo:1,color:'#a4dbcb'};
let previewEchoCycle=-1;
function drawSkinPreview(t){
  if($('#profileScreen').hidden||t-previewLast<33)return;previewLast=t;
  const el=$('#skinPreview');if(!el)return;
  const g=el.getContext('2d'),w=el.width,h=el.height,phase=(t/1000)%1.6,sec=t/1000;
  g.clearRect(0,0,w,h);g.fillStyle='#0c201a';g.fillRect(0,0,w,h);
  g.strokeStyle='#536d4c';g.lineWidth=1;g.beginPath();g.ellipse(w/2,h/2+6,58,41,0,0,TAU);g.stroke();
  g.fillStyle='#06130b88';g.beginPath();g.ellipse(w/2,h/2+12,30,19,0,0,TAU);g.fill();
  Object.assign(skinPreviewActor,{skin:profileSkin,gait:t*.012,moving:skinPreviewMode==='walk',guard:skinPreviewMode==='guard',
    punchTime:skinPreviewMode==='punch'?(phase<.24?.24-phase:phase>=.5&&phase<.74?.74-phase:phase>=1&&phase<1.24?1.24-phase:0):0,
    punchSide:phase>=.5&&phase<1?-1:1,combo:phase>=1?3:1,blockFlash:skinPreviewMode==='guard'&&phase<.18?.18-phase:0,
    dodgeTime:skinPreviewMode==='dodge'&&phase<.22?.22-phase:0,cast:skinPreviewMode==='echo'&&phase<.8?.8-phase:0});
  if(skinPreviewMode==='echo'){
    const cycle=Math.floor(sec/1.6);if(cycle!==previewEchoCycle){previewEchoCycle=cycle;beginFighterEcho(skinPreviewActor,1,sec-phase);const e=fighterEchoStates.get(skinPreviewActor);e.charge=.8;e.duration=1.1}
  }else{previewEchoCycle=-1;fighterEchoStates.delete(skinPreviewActor)}
  g.save();g.translate(w/2,h/2);if(skinPreviewMode==='dodge')g.translate((phase<.22?motionSmooth(phase/.22):1-motionSmooth((phase-.22)/.35))*18-9,0);
  if(!drawAnimatedFighter(g,skinPreviewActor,110,sec)){g.fillStyle='#bacba8';g.font='12px system-ui';g.textAlign='center';g.fillText(skinImageFailed?'Arte indisponível':'Carregando arte…',0,0)}
  g.restore();
}
const SUMMON_RANKS={D:{color:'#c7d5ce',rays:16},C:{color:'#8ee1b0',rays:18},B:{color:'#85d4ff',rays:22},A:{color:'#c7a1ff',rays:26},S:{color:'#ffd881',rays:32}};
const SUMMON_DURATION=2700,SUMMON_REVEAL=1720;
let activeSummon=null;
function summonReducedMotion(){return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches}
function summonRewardMarkup(drop){
  const s=skills[drop?.id];if(!s)return '';
  const note=drop.duplicate?'Eco repetido · +'+DUPLICATES[s.rank]+' cristais':drop.exchange?'Desbloqueado com cristais':'Novo Eco na sua coleção';
  return `<div class="summon-reward"><span class="rank rank-${s.rank}">${s.rank} · ${RANK_NAMES[s.rank]}</span><div class="summon-medallion">${icon(s.id)}</div><strong>${s.name}</strong><span class="summon-result-note">${note}</span></div>`;
}
function summonStageMarkup(drop){
  const result=summonRewardMarkup(drop);
  return `<canvas id="summonCanvas" aria-hidden="true"></canvas><span class="summon-kicker" id="summonKicker">ALTAR DOS ECOS</span><div class="summon-content" id="summonContent">${result||'<div class="summon-idle"><svg viewBox="0 0 80 80" fill="none" stroke="currentColor"><path d="M40 4L50 29L76 40L50 50L40 76L29 50L4 40L29 29Z" stroke-width="1.2"/><path d="M40 18L58 40L40 62L22 40Z"/><circle cx="40" cy="40" r="7"/><circle cx="40" cy="40" r="31" stroke-dasharray="2 7"/></svg><strong>Um poder espera<br>para despertar.</strong><small>Invoque um Eco e descubra sua próxima técnica.</small></div>'}</div><div class="summon-phase" id="summonPhase" role="status" aria-live="polite">${result?'Seu último Eco invocado':'Escolha um giro para abrir o selo'}</div><button class="ghost summon-skip" id="summonSkip" type="button" hidden>Pular animação ›</button>`;
}
function summonSurface(){
  const stage=$('#spinStage'),canvas=$('#summonCanvas');if(!stage||!canvas)return null;
  const g=canvas.getContext('2d');if(!g)return null;
  const r=stage.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height),d=Math.min(devicePixelRatio||1,1.5);
  canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);g.setTransform(d,0,0,d,0,0);
  return{stage,canvas,g,w,h};
}
function drawSummonSeal(surface,ms,rank='D',resting=false){
  const{g,w,h}=surface,cfg=SUMMON_RANKS[rank]||SUMMON_RANKS.D,t=ms/1000;
  const reveal=Math.max(0,(ms-SUMMON_REVEAL)/980),charge=clamp(ms/SUMMON_REVEAL,0,1),color=ms>800||resting?cfg.color:'#e4cc91';
  const cx=w/2,cy=h*.46,r=Math.min(w*.31,103),spin=resting?0:t*.8;
  g.clearRect(0,0,w,h);g.save();g.translate(cx,cy);
  const halo=g.createRadialGradient(0,0,3,0,0,r*1.65);halo.addColorStop(0,color+(resting?'16':'38'));halo.addColorStop(.6,color+'0c');halo.addColorStop(1,color+'00');g.fillStyle=halo;g.fillRect(-w,-h,w*2,h*2);
  function ring(radius,alpha,width=1,start=0,end=Math.PI*2){g.globalAlpha=alpha;g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.arc(0,0,Math.max(.1,radius),start,end);g.stroke()}
  g.rotate(spin*.3);ring(r,resting?.18:.35+charge*.35);ring(r+7,resting?.12:.2);
  for(let i=0;i<12;i++){g.save();g.rotate(i*Math.PI/6);g.globalAlpha=resting?.14:.5;g.strokeStyle=color;g.lineWidth=1;g.beginPath();g.moveTo(r-3,0);g.lineTo(r+3,0);g.moveTo(r-12,-3);g.lineTo(r-16,0);g.lineTo(r-12,3);g.stroke();g.restore()}
  g.rotate(-spin*.8);
  ring(r*.76,resting?.13:.5,1,-Math.PI*.85,Math.PI*.6);ring(r*.7,resting?.1:.28);
  g.globalAlpha=resting?.12:.3+charge*.2;g.strokeStyle=color;g.beginPath();
  for(let i=0;i<=6;i++){const a=i*Math.PI/3,x=Math.cos(a)*r*.65,y=Math.sin(a)*r*.65;i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();
  g.rotate(spin*.5);
  if(!resting&&ms<SUMMON_REVEAL){
    for(let i=0;i<cfg.rays;i++){const p=(t*.64+i/cfg.rays)%1,a=i*2.39996+t*.7,rad=r*(1.4-p*.94),x=Math.cos(a)*rad,y=Math.sin(a)*rad;
      g.globalAlpha=Math.sin(p*Math.PI)*.8;g.fillStyle=color;g.fillRect(x-1.2,y-1.2,2.4,2.4);g.strokeStyle=color;g.lineWidth=.8;g.beginPath();g.moveTo(x,y);g.lineTo(Math.cos(a-.08)*(rad+8),Math.sin(a-.08)*(rad+8));g.stroke()}
    const core=7+charge*18;g.globalAlpha=.75;const orb=g.createRadialGradient(0,0,0,0,0,core*2);orb.addColorStop(0,'#fff5d9');orb.addColorStop(.22,color+'cc');orb.addColorStop(1,color+'00');g.fillStyle=orb;g.fillRect(-core*2,-core*2,core*4,core*4);
    g.save();g.rotate(t*1.1);g.globalAlpha=.8;g.strokeStyle=color;g.lineWidth=1.2;g.beginPath();g.moveTo(0,-core);g.lineTo(core,0);g.lineTo(0,core);g.lineTo(-core,0);g.closePath();g.stroke();g.restore();
  }
  if(!resting&&reveal>0){
    ring(r*(.25+reveal*1.7),(1-reveal)*.65,2);ring(r*(.2+reveal*1.4),(1-reveal)*.3,1);
    for(let i=0;i<cfg.rays;i++){const a=i*Math.PI*2/cfg.rays,rad=r*(.45+reveal*.85);g.globalAlpha=(1-reveal)*.6;g.strokeStyle=color;g.lineWidth=i%3===0?2:1;g.beginPath();g.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);g.lineTo(Math.cos(a)*(rad+10+reveal*16),Math.sin(a)*(rad+10+reveal*16));g.stroke()}
  }
  if(rank==='S'){g.globalAlpha=resting?.16:.35;g.strokeStyle=color;g.lineWidth=1;for(let side of [-1,1]){g.beginPath();g.moveTo(side*r*.9,-r*.18);g.lineTo(side*r*1.18,0);g.lineTo(side*r*.9,r*.18);g.stroke()}}
  g.restore();
}
function mountSummonStage(drop){
  const surface=summonSurface();if(!surface)return;
  const rank=skills[drop?.id]?.rank||'D';surface.stage.style.setProperty?.('--summon-color',SUMMON_RANKS[rank].color);
  drawSummonSeal(surface,0,rank,true);
}
function revealEchoSummon(s){
  if(s.revealed)return;s.revealed=true;
  // The hidden card is decoded during the charge, avoiding an empty reveal frame.
  $('#summonContent').setAttribute('aria-hidden','false');
  s.stage.classList.add('is-revealed');$('#summonKicker').textContent=skills[s.drop.id].rank==='S'?'UM ECO LENDÁRIO DESPERTOU':'ECO INVOCADO';
  $('#summonPhase').textContent=skills[s.drop.id].name+' · Rank '+skills[s.drop.id].rank;
  $('#summonSkip').textContent='Concluir ›';
}
function finishEchoSummon(reveal=true){
  const s=activeSummon;if(!s)return;activeSummon=null;spinBusy=false;
  if(typeof cancelAnimationFrame==='function')cancelAnimationFrame(s.raf);
  if(typeof clearTimeout==='function')clearTimeout(s.timer);
  if(reveal&&appScreen==='shop'&&s.stage===$('#spinStage')){
    revealEchoSummon(s);s.stage.classList.remove('is-summoning');$('#summonSkip').hidden=true;
    drawSummonSeal(s,SUMMON_DURATION,s.rank,true);refreshDaily();renderExchange();renderShopResult();
  }
}
function playEchoSummon(drop){
  if(appScreen!=='shop'){spinBusy=false;return}
  const surface=summonSurface();if(!surface){spinBusy=false;refreshDaily();renderExchange();renderShopResult();return}
  const rank=skills[drop.id].rank,s={...surface,drop:{...drop},rank,start:performance.now(),last:-Infinity,raf:0,timer:0,revealed:false,phase:''};
  activeSummon=s;s.stage.style.setProperty?.('--summon-color',SUMMON_RANKS[rank].color);
  s.stage.classList.remove('is-revealed');s.stage.classList.add('is-summoning');$('#summonContent').innerHTML=summonRewardMarkup(drop);hydrateSkillIcons();
  $('#summonContent').setAttribute('aria-hidden','true');
  $('#summonKicker').textContent='INVOCAÇÃO DE ECO';$('#summonPhase').textContent='Despertando o selo…';
  const skip=$('#summonSkip');skip.hidden=false;skip.textContent='Pular animação ›';skip.onclick=()=>finishEchoSummon(true);
  if(summonReducedMotion()){finishEchoSummon(true);return}
  s.stage.scrollIntoView?.({behavior:'smooth',block:'center'});
  function frame(now){
    if(activeSummon!==s)return;
    if(appScreen!=='shop'||s.canvas.isConnected===false){finishEchoSummon(false);return}
    const elapsed=Math.max(0,now-s.start);
    if(elapsed>=SUMMON_DURATION){finishEchoSummon(true);return}
    if(now-s.last>=1000/30){s.last=now;drawSummonSeal(s,elapsed,rank);
      if(elapsed>=SUMMON_REVEAL)revealEchoSummon(s);
      else{const phase=elapsed<850?'Despertando o selo…':'Concentrando energia…';if(s.phase!==phase){s.phase=phase;$('#summonPhase').textContent=phase}}
    }
    s.raf=requestAnimationFrame(frame);
  }
  drawSummonSeal(s,0,rank);
  s.timer=setTimeout(()=>{if(activeSummon===s)finishEchoSummon(true)},SUMMON_DURATION+150);
  if(activeSummon===s)s.raf=requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)finishEchoSummon(true)});
addEventListener('pagehide',()=>finishEchoSummon(false));
addEventListener('resize',()=>{if(appScreen!=='shop')return;if(activeSummon){const surface=summonSurface();if(surface)Object.assign(activeSummon,surface)}else mountSummonStage(account.lastDrop)});
const LEAGUE_DIVISIONS=['Bronze','Prata','Ouro','Platina','Diamante','Mestre'];
const LEAGUE_RIVALS=[
  {name:'Discípulo do Pátio',style:'Equilibrado',kit:[0,18,29,41,45,43],gap:170,think:.72,chance:.48,tip:'Alterne socos e Ecos. Reserve Stamina para sair do alcance.'},
  {name:'Punho da Aurora',style:'Pressão de perto',kit:[0,3,29,39,45,43],gap:65,think:.62,chance:.56,tip:'Bloqueie os socos de frente e ataque durante a recuperação.'},
  {name:'Sentinela das Marés',style:'Ataques à distância',kit:[18,24,30,32,36,41],gap:215,think:.54,chance:.62,tip:'Use os pilares e avance depois que um projétil passar.'},
  {name:'Tecelã do Inverno',style:'Controle de área',kit:[25,33,38,42,43,29],gap:175,think:.48,chance:.67,tip:'Saia das áreas marcadas antes de comprometer sua próxima ação.'},
  {name:'Guardião Prismático',style:'Defesa e resposta',kit:[19,22,32,35,18,45],gap:125,think:.42,chance:.72,tip:'Varie entre socos, áreas e projéteis para contornar as defesas.'},
  {name:'Herdeiro do Eclipse',style:'Combinação de técnicas',kit:[1,27,46,49,41,43],gap:140,think:.36,chance:.76,tip:'Guarde a esquiva para a concentração da Coroa do Eclipse.'}
];
let battleActivity='casual',trainingSession=null,leagueMatch=null;
let practiceOptions={dummy:'still',free:false};
function cleanOwnedKit(kit){return [...new Set((Array.isArray(kit)?kit:[]).filter(id=>Number.isInteger(id)&&!!skills[id]&&account.owned.includes(id)))].slice(0,6)}
function validOwnedKit(kit){return Array.isArray(kit)&&kit.length===6&&cleanOwnedKit(kit).length===6}
function normalizeProgression(){
  normalizeJourney();normalizeShop();normalizeDailyIncome();
  const old=Array.isArray(account.buildSlots)?account.buildSlots:null;
  account.buildSlots=Array.from({length:3},(_,i)=>{
    const slot=old?.[i];
    if(slot&&typeof slot==='object')return{name:String(slot.name||'Build '+(i+1)).trim().slice(0,24)||'Build '+(i+1),kit:cleanOwnedKit(slot.kit)};
    return !old&&i===0?{name:'Minha build',kit:cleanOwnedKit(account.build)}:null;
  });
  const l=account.league||{};
  const integer=(v,max=1000000)=>Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):0;
  account.league={points:integer(l.points,9999),wins:integer(l.wins),matches:integer(l.matches)};
}
function leagueIndex(){return Math.min(5,Math.floor(account.league.points/75))}
function currentLeagueRival(){return LEAGUE_RIVALS[leagueIndex()]}
function kitPreview(kit){return `<div class="build-icons">${Array.from({length:6},(_,i)=>kit[i]===undefined?'<span class="empty-echo">✧</span>':`<span title="${skills[kit[i]].name}" aria-label="${skills[kit[i]].name}">${icon(kit[i])}</span>`).join('')}</div>`}
function renderBuildSlots(){
  $('#savedBuilds').innerHTML=`<div class="builds-heading"><div><div class="eyebrow">SEUS ESTILOS DE COMBATE</div><h2>Três builds. Um toque para trocar.</h2></div><button class="ghost" data-progression="training" ${validOwnedKit(selected)?'':'disabled'}>Treinar esta build ↗</button></div><p>A build equipada continua sendo salva automaticamente. Salve cópias abaixo para alternar entre suas combinações.</p><div class="saved-build-grid">${account.buildSlots.map((slot,i)=>{
    const same=slot&&JSON.stringify(slot.kit)===JSON.stringify(selected);
    return `<div class="saved-build"><div class="saved-build-label">ESPAÇO 0${i+1}<span>${same?'EQUIPADA':slot?'SALVA':'VAZIO'}</span></div><label for="buildName${i}" class="sr-only">Nome da build ${i+1}</label><input id="buildName${i}" maxlength="24" value="${escapeHTML(slot?.name||'')}" placeholder="Nome da build ${i+1}" autocomplete="off">${kitPreview(slot?.kit||[])}<div class="build-actions"><button class="ghost" data-load-build="${i}" ${validOwnedKit(slot?.kit)?'':'disabled'}>Equipar</button><button class="ghost" data-save-build="${i}" ${validOwnedKit(selected)?'':'disabled'}>${slot?'Salvar atual aqui':'Salvar atual'}</button></div></div>`;
  }).join('')}</div><p id="buildStatus" role="status" class="progression-status"></p>`;
}
function saveBuildSlot(index,name){
  if(!Number.isInteger(index)||index<0||index>2||!validOwnedKit(selected))return false;
  const previous=account.buildSlots[index];
  account.buildSlots[index]={name:String(name||'Build '+(index+1)).trim().slice(0,24)||'Build '+(index+1),kit:[...selected]};
  if(!saveAccount()){account.buildSlots[index]=previous;$('#buildStatus').textContent='Não foi possível salvar. Verifique o armazenamento do navegador.';return false}
  completeJourneyTask('build');renderBuildSlots();hydrateSkillIcons();$('#buildStatus').textContent='Build salva no espaço '+(index+1)+'.';return true;
}
function loadBuildSlot(index){
  const slot=account.buildSlots[index];if(!slot||!validOwnedKit(slot.kit))return false;
  const before=[...account.build];account.build=[...slot.kit];
  if(!saveAccount()){account.build=before;$('#buildStatus').textContent='Não foi possível salvar a troca de build.';return false}
  selected=[...slot.kit];renderSelection();$('#buildStatus').textContent=slot.name+' equipada.';return true;
}
function renderTraining(){
  $('#trainingScreen').innerHTML=appHeader()+`<div class="section-head"><button class="ghost" data-nav="home">← Início</button><div class="eyebrow">PRATIQUE NO SEU RITMO</div><h1>Dojo dos Ecos.</h1><p class="section-copy">Sem limite de tempo. Só os Ecos que você já desbloqueou.</p></div><div class="progression-grid"><div class="panel"><div class="eyebrow">SUA BUILD EQUIPADA</div><h2>Conheça cada movimento.</h2>${kitPreview(cleanOwnedKit(selected))}<div class="training-skill-list">${cleanOwnedKit(selected).map(id=>`<span><b class="rank rank-${skills[id].rank}">${skills[id].rank}</b>${skills[id].name}</span>`).join('')}</div><button class="ghost" data-nav="library">Trocar Ecos na biblioteca</button><p>Novos Ecos entram no treino depois de serem obtidos na loja. O fantoche não concede moedas nem vitórias.</p></div><div class="panel"><div class="eyebrow">SEU PARCEIRO DE TREINO</div><h2>Fantoche de madeira.</h2>${practiceSettingsMarkup('setup')}<p>Missão inicial: cause 300 de dano e saia do Dojo para concluir. O alvo e seu personagem se recuperam ao chegar a zero HP. O tempo de preparo e a recuperação dos golpes continuam valendo.</p><button class="gold" data-progression="training" ${validOwnedKit(selected)?'':'disabled'}>Entrar no treinamento ↗</button>${validOwnedKit(selected)?'':'<p class="notice">Selecione um campeão da sua coleção.</p>'}</div></div>`;
  hydrateSkillIcons();
}
function practiceSettingsMarkup(prefix){return `<label class="setting-label" for="${prefix}Dummy">Comportamento do fantoche</label><select id="${prefix}Dummy" class="exchange-select" data-practice-dummy><option value="still" ${practiceOptions.dummy==='still'?'selected':''}>Parado · pratique alcance e combos</option><option value="guard" ${practiceOptions.dummy==='guard'?'selected':''}>Defendendo · teste a quebra de guarda</option><option value="attack" ${practiceOptions.dummy==='attack'?'selected':''}>Atacando · pratique defesa e esquiva</option></select><label class="practice-check"><input type="checkbox" data-practice-free ${practiceOptions.free?'checked':''}> MP infinito e recargas livres</label><p class="setting-hint">Desligado: custos e recargas iguais aos duelos. Stamina sempre segue as regras de combate.</p>`}
function renderLeague(){
  const i=leagueIndex(),r=currentLeagueRival(),l=account.league,progress=i===5?100:(l.points-i*75)/75*100;
  $('#leagueScreen').innerHTML=appHeader()+`<div class="section-head"><button class="ghost" data-nav="home">← Início</button><div class="eyebrow">UM DEGRAU DE CADA VEZ</div><h1>Liga dos Campeões.</h1><p class="section-copy">Duelo 1×1 contra bots. Conquiste seu lugar na liga offline.</p></div><div class="league-ranks">${LEAGUE_DIVISIONS.map((name,n)=>`<span class="${n===i?'current':n<i?'reached':''}">${name}</span>`).join('')}</div><div class="progression-grid"><div class="panel league-summary"><div class="league-emblem" aria-hidden="true">✧</div><div class="eyebrow">SUA DIVISÃO</div><h2>${LEAGUE_DIVISIONS[i]}</h2><strong class="league-points">${l.points} <small>pontos</small></strong><div class="league-progress"><i style="width:${progress}%"></i></div><p>${i===5?'Você chegou à divisão mais alta. Continue defendendo seu lugar.':`${75-(l.points-i*75)} pontos para ${LEAGUE_DIVISIONS[i+1]}.`}</p><p>${l.wins} vitórias · ${l.matches} duelos na liga</p><div class="notice">Vitória: +25 pontos.<br>Derrota concluída: −10 pontos, com mínimo de 0.<br>Empate: sem mudança. Sair antes do fim não conta.</div></div><div class="panel"><div class="eyebrow">PRÓXIMO OPONENTE · BOT</div><h2>${r.name}</h2><span class="league-style">${r.style}</span>${kitPreview(r.kit)}<p>${r.tip}</p><p>Todos têm 1.000 HP. As divisões mudam a estratégia e o ritmo de decisão do rival, sem bônus de dano.</p><p id="leagueRewardText">${dailyRewardText('1v1')}</p><button class="gold" data-progression="league" ${validOwnedKit(selected)?'':'disabled'}>Disputar duelo da liga ↗</button><button class="ghost" data-nav="library">Escolher meu campeão</button>${validOwnedKit(selected)?'':'<p class="notice">Selecione um campeão antes de disputar.</p>'}</div></div>`;hydrateSkillIcons();
}
function beginProgression(activity){
  if(!['training','league'].includes(activity)||!account.profile)return false;
  if(!validOwnedKit(selected)){showScreen('library');announce('Equipe seis Ecos desbloqueados.');return false}
  arenaModeId=null;modeRun=null;battleActivity=activity;matchMode='1v1';start();return true;
}
function prepareProgressionMatch(){
  trainingSession=null;leagueMatch=null;$('#battle').dataset.activity=battleActivity;
  $('#trainingPause').hidden=battleActivity!=='training';$('#practiceMeter').hidden=battleActivity!=='training';
  $('#resume').textContent=battleActivity==='training'?'Continuar treino':'Continuar duelo';
  $('#resultHub').dataset.nav=battleActivity==='league'?'league':'home';
  $('#resultHub').textContent=battleActivity==='league'?'Voltar à liga':'Voltar ao início';
  if(battleActivity==='training'){
    b.kit=[];b.trainingDummy=true;b.label='Fantoche';b.color='#d2b679';
    trainingSession={elapsed:0,damage:0,hits:0,targets:0,received:0};
    $('#trainingPause').innerHTML=`<h3>Ajustes do treino</h3>${practiceSettingsMarkup('pause')}<button class="ghost" data-reset-practice>Zerar treino e reposicionar</button><button class="ghost" data-nav="library">Trocar campeão</button>`;
  }else if(battleActivity==='league'){
    const index=leagueIndex(),r=LEAGUE_RIVALS[index];
    leagueMatch={index,settled:false};b.kit=[...r.kit];b.label=r.name;b.skin=index;
    b.leagueAI=r;
  }
}
function applyProgressionHUD(){
  if(battleActivity==='training'&&trainingSession){
    $('#timer').textContent='∞';$('.mid-hud small').textContent='TREINO';
    $('#botkit').textContent=({still:'Parado',guard:'Defendendo',attack:'Atacando'})[practiceOptions.dummy];
    $('#practiceMeter').innerHTML=`<b>${trainingSession.damage} dano</b><span>${trainingSession.hits} acertos · ${trainingSession.targets} alvos</span><span>${Math.floor(trainingSession.elapsed)}s · ${practiceOptions.free?'MP/recargas livres':'regras normais'}</span>`;
  }else if(battleActivity==='league'&&leagueMatch)$('.mid-hud small').textContent='LIGA · '+LEAGUE_DIVISIONS[leagueMatch.index].toUpperCase();
}
function practiceAI(dt,a){
  a.a=aim(a);a.moving=false;
  setGuard(a,practiceOptions.dummy==='guard');
  if(practiceOptions.dummy!=='attack')return;
  const d=dist(a,p);a.think-=dt;
  if(d>62&&a.root<=0&&a.cast<=0&&a.punchTime<=0){const old={x:a.x,y:a.y};let angle=a.a;const obstacle=pillars.find(o=>dist(o,a)<o.r+65&&Math.cos(Math.atan2(o.y-a.y,o.x-a.x)-angle)>.5);if(obstacle)angle+=1.2;move(a,Math.cos(angle)*105*dt,Math.sin(angle)*105*dt);a.moving=dist(old,a)>.01}
  if(a.think<=0&&d<79&&lineClear(a,p)){basic(a);a.think=1.4}
}
function practiceBeforeStep(dt){
  if(battleActivity!=='training'||!trainingSession)return;
  trainingSession.elapsed+=dt;
  if(practiceOptions.free){p.mp=120;p.cd.fill(0)}
}
function recordPracticeHit(target,amount,owner){
  if(battleActivity!=='training'||!trainingSession)return;
  const actual=Math.min(target.hp,amount);
  if(target===b&&owner===p&&actual>0){trainingSession.damage+=actual;trainingSession.hits++}
  if(target===p)trainingSession.received+=actual;
}
function resetPractice(clearStats=true){
  if(battleActivity!=='training'||!trainingSession)return false;
  clearInputs();objects=[];shots=[];zones=[];events=[];fx=[];texts=[];spriteFX=[];vfxReset();
  for(const a of [p,b]){fighterMotionStates.delete(a);fighterEchoStates.delete(a);const keep={team:a.team,label:a.label,skin:a.skin,trainingDummy:a.trainingDummy};Object.assign(a,actor(a===p?W*.32:W*.68,H*.5,a.kit,a.color),keep);a.a=a===p?0:Math.PI}
  if(clearStats)trainingSession={elapsed:0,damage:0,hits:0,targets:0,received:0};
  updateUI();return true;
}
function practiceAfterStep(){
  if(b.hp<=0||p.hp<=0){if(b.hp<=0)trainingSession.targets++;resetPractice(false)}
}
function settleLeague(win,draw){
  if(battleActivity!=='league'||!leagueMatch||leagueMatch.settled)return '';
  leagueMatch.settled=true;const before=leagueIndex(),l=account.league,old=l.points;
  l.matches++;if(win&&!draw){l.wins++;l.points=Math.min(9999,l.points+25)}else if(!draw)l.points=Math.max(0,l.points-10);
  const change=l.points-old,after=leagueIndex();
  return ` Liga: ${change>0?'+':''}${change} pontos · ${LEAGUE_DIVISIONS[after]} (${l.points} pts).${after>before?' Promoção conquistada!':after<before?' Você pode recuperar sua divisão no próximo duelo.':''}`;
}
function drawTrainingDummy(a){
  ctx.save();ctx.translate(a.x,a.y);if(a.skin===1){ellipse(0,12,20,8,'#06100c99');ctx.save();ctx.translate(0,10);ctx.scale(1,.42);drawTeamMarker(a);ctx.restore()}else{ellipse(2,7,23,17,'#06100c99');drawTeamMarker(a);}ctx.rotate(a.a);
  const color=a.flash>0?'#fff1c5':'#b99a61';
  ellipse(-4,0,19,22,'#655333');ellipse(-2,0,15,19,color);line(-5,-14,-5,14,'#816a43',2);line(4,-14,4,14,'#dbc48b',1);
  for(const side of [-1,1]){const reach=a.punchTime>0&&a.punchSide===side?Math.sin((1-a.punchTime/.24)*Math.PI)*20:0;line(0,side*15,a.guard?22:15+reach,side*(a.guard?9:22),'#816a43',8);circle(a.guard?22:15+reach,side*(a.guard?9:22),7,'#d8bd83')}
  circle(3,0,9,'#e2c88b');outline(3,0,5,'#806343',2);
  if(a.guard||a.blockFlash>0){ctx.beginPath();ctx.arc(0,0,31,-1.05,1.05);ctx.strokeStyle=a.blockFlash>0?'#e4fff2':'#9edcc5';ctx.lineWidth=3;ctx.stroke()}
  if(a.root>0)outline(0,0,25,'#c6b6e8',2);ctx.restore();
}
function initProgression(){
  normalizeProgression();
  document.addEventListener('click',e=>{
    const save=e.target.closest('[data-save-build]');if(save)saveBuildSlot(Number(save.dataset.saveBuild),$('#buildName'+save.dataset.saveBuild).value);
    const equip=e.target.closest('[data-load-build]');if(equip)loadBuildSlot(Number(equip.dataset.loadBuild));
    const go=e.target.closest('[data-progression]');if(go)beginProgression(go.dataset.progression);
    if(e.target.closest('[data-reset-practice]')){resetPractice();toast('Treino reiniciado')}
  });
  document.addEventListener('change',e=>{
    if(e.target.matches('[data-practice-dummy]')&&['still','guard','attack'].includes(e.target.value))practiceOptions.dummy=e.target.value;
    if(e.target.matches('[data-practice-free]'))practiceOptions.free=e.target.checked;
  });
}
const LOBBY_PREFS_KEY='eldoria-lobby-v18';
const LOBBY_MODES={league:{name:'Liga offline',tag:'SUBA DE DIVISÃO',copy:'1×1 contra bot · vitória: 100 moedas · derrota: 25'},'1v1':{name:'Duelo 1×1',tag:'DOMINE SEUS ECOS',copy:'Você contra um bot · vitória: 100 · derrota: 25 moedas'},'2v2':{name:'Equipes 2×2',tag:'LUTE EM EQUIPE',copy:'Você e um aliado bot · vitória: 200 · derrota: 50 moedas'}};
let lobbyPrefs={mode:'league',motion:true,quality:vfxQuality};
try{const v=JSON.parse(localStorage.getItem(LOBBY_PREFS_KEY)||'null');if(v){if(LOBBY_MODES[v.mode])lobbyPrefs.mode=v.mode;if(typeof v.motion==='boolean')lobbyPrefs.motion=v.motion}}catch{}
let lobbyPaintAt=-Infinity,lobbyPainted=false,lobbyRenderCount=0,lobbyDailySignature='',lobbyLastFocus=null;
const lobbyActor={...skinPreviewActor};
function lobbyWalletNumber(value){return value>=100000?new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(value):value.toLocaleString('pt-BR')}
function lobbyIcon(name){
  const paths={home:'M4 11L16 3L28 11V28H20V19H12V28H4Z',ecos:'M16 2L29 10L16 18L3 10Z M3 16L16 24L29 16 M3 22L16 30L29 22',shop:'M7 3H25L30 13L16 30L2 13Z M2 13H30 M7 3L11 13L16 30L21 13L25 3',dojo:'M4 10L16 4L28 10 M2 13H30 M7 13V27 M25 13V27 M3 28H29 M12 27V19H20V27',gear:'M13 3H19L20 7L24 9L28 8L31 14L28 17L27 21L28 25L23 29L19 27H13L9 29L4 25L5 21L4 17L1 14L4 8L8 9L12 7Z M21 16A5 5 0 1 1 11 16A5 5 0 1 1 21 16',arrow:'M5 16H27 M19 8L27 16L19 24',chevron:'M19 6L9 16L19 26',edit:'M7 22L6 28L12 27L28 11L22 5Z M19 8L25 14',coin:'M27 16A11 11 0 1 1 5 16A11 11 0 1 1 27 16 M16 9L21 16L16 23L11 16Z',close:'M7 7L25 25 M25 7L7 25'};
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.ecos}"/></svg>`;
}
function lobbyEmblem(index){return `<svg viewBox="0 0 72 80" fill="none" aria-hidden="true"><path d="M36 3L63 16V43L36 73L9 43V16Z" fill="currentColor" opacity=".1"/><path d="M36 3L63 16V43L36 73L9 43V16Z M36 10L56 20V41L36 64L16 41V20Z" stroke="currentColor"/><path d="M36 17L41 30L54 35L41 40L36 54L31 40L18 35L31 30Z" fill="currentColor"/><path d="M4 29V49L23 69 M68 29V49L49 69" stroke="currentColor" stroke-width="2"/>${Array.from({length:index+1},(_,i)=>`<circle cx="${36+(i-index/2)*6}" cy="77" r="1.5" fill="currentColor"/>`).join('')}</svg>`}
function lobbyScenery(){return `<svg class="lobby-scenery" viewBox="0 0 600 480" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="lobbyStone" x2="1" y2="1"><stop stop-color="#29483d"/><stop offset="1" stop-color="#112c25"/></linearGradient><linearGradient id="lobbyFloor" x2="0" y2="1"><stop stop-color="#182e28"/><stop offset="1" stop-color="#10251f"/></linearGradient><radialGradient id="lobbyLight"><stop stop-color="#a0d2aa" stop-opacity=".2"/><stop offset="1" stop-color="#a0d2aa" stop-opacity="0"/></radialGradient></defs><path d="M0 332L205 295H395L600 332V480H0Z" fill="url(#lobbyFloor)"/><g stroke="#759979" stroke-opacity=".1" fill="none"><path d="M0 369H600 M0 413H600 M0 468H600 M95 480L230 295 M230 480L278 295 M370 480L322 295 M505 480L370 295"/><path d="M175 304V179A125 125 0 0 1 425 179V304 M190 304V181A110 110 0 0 1 410 181V304 M215 301V182A85 85 0 0 1 385 182V301" stroke-width="2"/></g><path d="M142 313V173A158 158 0 0 1 458 173V313L425 303V173A125 125 0 0 0 175 173V303Z" fill="url(#lobbyStone)" stroke="#6f9471" stroke-opacity=".22"/><path d="M152 310V174A148 148 0 0 1 448 174V310" fill="none" stroke="#b7be83" stroke-opacity=".15"/><g fill="url(#lobbyStone)" stroke="#8fa780" stroke-opacity=".18"><path d="M42 181L87 167L94 326L35 342Z M29 176L92 157L95 179L32 197Z M30 333L100 316L106 338L24 360Z"/><path d="M513 167L558 181L565 342L506 326Z M508 157L571 176L568 197L505 179Z M500 316L570 333L576 360L494 338Z"/></g><g fill="none" stroke="#98b18b" stroke-opacity=".15"><path d="M57 200L52 326 M72 197L74 320 M528 197L526 320 M543 200L548 326 M146 151L180 157 M154 110L186 126 M180 67L205 94 M226 34L241 68 M282 18L286 51 M318 18L314 51 M374 34L359 68 M420 67L395 94 M446 110L414 126 M454 151L420 157"/></g><ellipse cx="300" cy="271" rx="175" ry="192" fill="url(#lobbyLight)"/><path d="M170 354Q300 304 430 354V374Q300 424 170 374Z" fill="#193a2d" stroke="#6b9169" stroke-opacity=".4"/><ellipse cx="300" cy="354" rx="130" ry="44" fill="#244c3a" stroke="#b6bd83" stroke-opacity=".5"/><ellipse cx="300" cy="354" rx="116" ry="36" fill="none" stroke="#d7c68b" stroke-opacity=".33"/><path d="M300 324L313 345L358 354L313 363L300 384L287 363L242 354L287 345Z" fill="none" stroke="#e6d49c" stroke-opacity=".4"/><g fill="#b6c991" opacity=".35"><path d="M145 264L151 245L157 263L151 275Z M443 263L449 245L455 264L449 275Z"/></g><g stroke="#95b882" stroke-opacity=".3" fill="none"><path d="M40 295Q14 262 21 235 M22 264L3 257 M24 273L39 259 M555 311Q583 275 578 249 M580 282L597 269 M578 265L563 254"/></g></svg>`}
function renderLobbyHome(){
  const rank=leagueIndex(),points=account.league.points,skin=SKINS[validSkin(account.profile.skin)];
  const rankColors=['#d4b27c','#c2d3d2','#e5c979','#a1cdbd','#a3cfed','#d0b0eb'];
  $('#homeScreen').innerHTML=`<div class="lobby-shell"><header class="lobby-top"><div class="lobby-brand">ELDORIA<span>ARENA DOS CAMPEÕES</span></div><div class="lobby-wallet"><span title="Moedas" aria-label="${account.coins} moedas">${lobbyIcon('coin')}<b>${lobbyWalletNumber(account.coins)}</b></span><span title="Cristais" aria-label="${account.crystals} cristais">${lobbyIcon('shop')}<b>${lobbyWalletNumber(account.crystals)}</b></span></div><button class="lobby-settings" id="openLobbySettings" aria-label="Configurações">${lobbyIcon('gear')}</button></header><div class="lobby-main"><section class="lobby-stage" aria-label="Seu personagem no santuário"><div class="lobby-stage-title"><span>SANTUÁRIO DOS CAMPEÕES</span><h1>Prepare seu próximo duelo.</h1></div>${lobbyScenery()}<div class="lobby-motes" aria-hidden="true"><i></i><i></i><i></i><i></i></div><button class="lobby-character" data-nav="profile" aria-label="Personalizar ${escapeHTML(account.profile.name)}"><canvas id="lobbyHero" width="440" height="440" aria-hidden="true"></canvas><span id="lobbyHeroFallback">${skinPortrait(account.profile.skin)}</span></button><button class="lobby-identity" data-nav="profile" aria-label="Editar nome e símbolo"><span class="lobby-avatar">${avatarSVG(account.profile.avatar)}</span><span><strong>${escapeHTML(account.profile.name)}</strong><small>${skin.name}</small></span>${lobbyIcon('edit')}</button><div class="lobby-stage-corner" aria-hidden="true">✧</div></section><div class="lobby-dashboard"><button class="lobby-rank" data-nav="league" style="--division:${rankColors[rank]}" aria-label="Abrir liga. ${LEAGUE_DIVISIONS[rank]}, ${points} pontos"><span class="lobby-rank-emblem">${lobbyEmblem(rank)}</span><span class="lobby-rank-body"><span class="lobby-overline">LIGA OFFLINE</span><span class="lobby-rank-line"><strong>${LEAGUE_DIVISIONS[rank]}</strong><small>${points} pts</small></span><span class="lobby-rank-track"><i style="width:${rank===5?100:(points%75)/75*100}%"></i></span><span class="lobby-rank-goal">${rank===5?'Divisão máxima alcançada':`${75-points%75} pontos para ${LEAGUE_DIVISIONS[rank+1]}`}</span></span><span class="lobby-rank-arrow">›</span></button><section class="lobby-build" id="lobbyBuild" aria-label="Build equipada"></section><section class="lobby-queue" aria-label="Escolher combate"><label class="lobby-overline" for="lobbyModeSelect">ESCOLHA SEU COMBATE</label><div class="lobby-mode-wrap">${lobbyIcon('dojo')}<select id="lobbyModeSelect"><option value="league">Liga offline · 1×1</option><option value="1v1">Duelo livre · 1×1</option><option value="2v2">Equipes · 2×2</option><optgroup label="Em desenvolvimento"><option value="online1" disabled>Online · 1×1 — em breve</option><option value="online2" disabled>Online · 2×2 — em breve</option></optgroup></select></div><button id="lobbyPlay" class="lobby-play"><span><small id="lobbyPlayTag"></small><strong>JOGAR</strong></span>${lobbyIcon('arrow')}</button><p id="lobbyModeCopy" class="lobby-mode-copy"></p></section><button class="journey-link" data-journey-scroll>Novos modos e progresso ↓</button><p id="lobbyStatus" class="lobby-status" role="status">${storageAvailable?'Progresso salvo neste aparelho.':'Não foi possível salvar. Verifique o armazenamento do navegador.'}</p></div></div></div><section class="arena-discover"><span class="eyebrow">EXPLORE AS ARENAS</span><h2>Oito novas formas de lutar.</h2><p>Zona, Guardião, Sobrevivência, Escolhas, Torneio, Espelho, Diário e Todos contra Todos.</p><button class="gold" data-open-modes>Escolher modo e arena ↗</button></section><div id="journeyHome"></div>`;
  applyLobbyCosmetics();renderJourneyHome();$('#lobbyModeSelect').innerHTML+='<option value="arenas">Explorar novos modos…</option>';$('#lobbyModeSelect').value=lobbyPrefs.mode;renderLobbyBuild();updateLobbyMode();
  lobbyPaintAt=-Infinity;lobbyPainted=false;lobbyActor.skin=validSkin(account.profile.skin);loadSkinAtlas();applyLobbyMotion();hydrateSkillIcons();
}
function activeLobbyBuild(){return account.buildSlots.findIndex(s=>s&&JSON.stringify(s.kit)===JSON.stringify(selected))}
function availableLobbyBuilds(){return account.buildSlots.map((s,i)=>validOwnedKit(s?.kit)?i:-1).filter(i=>i>=0)}
function renderLobbyBuild(){
  const index=activeLobbyBuild(),slot=account.buildSlots[index],available=availableLobbyBuilds(),canCycle=available.length>1||available.length===1&&index<0;
  $('#lobbyBuild').innerHTML=`<div class="lobby-build-head"><button class="lobby-cycle" data-cycle-build="-1" aria-label="Build anterior" ${canCycle?'':'disabled'}>${lobbyIcon('chevron')}</button><button class="lobby-build-title" data-nav="library"><small>BUILD EQUIPADA${index>=0?' · 0'+(index+1):''}</small><strong>${escapeHTML(slot?.name||'Combinação atual')}</strong></button><button class="lobby-cycle next" data-cycle-build="1" aria-label="Próxima build" ${canCycle?'':'disabled'}>${lobbyIcon('chevron')}</button></div><button class="lobby-build-icons" data-nav="library" aria-label="Editar os seis Ecos equipados">${Array.from({length:6},(_,i)=>selected[i]!==undefined&&account.owned.includes(selected[i])?`<span title="${skills[selected[i]].name}">${icon(selected[i])}</span>`:'<span class="lobby-empty-echo">＋</span>').join('')}</button><div class="lobby-build-foot"><span>${selected.length}/6 Ecos equipados</span><button data-nav="library">Editar build ${lobbyIcon('edit')}</button></div>`;
}
function cycleLobbyBuild(direction){
  const available=availableLobbyBuilds();if(!available.length||![1,-1].includes(direction))return false;
  const current=available.indexOf(activeLobbyBuild());const index=current<0?(direction>0?0:available.length-1):(current+direction+available.length)%available.length;
  const slot=account.buildSlots[available[index]],before=[...account.build];account.build=[...slot.kit];
  if(!saveAccount()){account.build=before;$('#lobbyStatus').textContent='Não foi possível salvar a troca de build.';return false}
  selected=[...slot.kit];renderLobbyBuild();updateLobbyMode();hydrateSkillIcons();$('#lobbyStatus').textContent=slot.name+' equipada.';return true;
}
function updateLobbyMode(){if($('#lobbyModeSelect').value==='arenas'){$('#lobbyPlay').disabled=false;$('#lobbyPlayTag').textContent='ESCOLHA SUA ARENA';$('#lobbyModeCopy').textContent='Oito modos offline com mapas amplos e objetivos próprios.';return}
  if(!LOBBY_MODES[lobbyPrefs.mode])lobbyPrefs.mode='league';const mode=LOBBY_MODES[lobbyPrefs.mode],ready=validOwnedKit(selected);
  $('#lobbyPlay').disabled=!ready;$('#lobbyPlay').setAttribute('aria-label','Jogar '+mode.name);$('#lobbyPlayTag').textContent=mode.tag;
  $('#lobbyModeCopy').textContent=ready?dailyRewardText(lobbyPrefs.mode):'Selecione um campeão da sua coleção.';
}
function playLobbyMode(){if($('#lobbyModeSelect').value==='arenas'){showArenaModes();return true}if(!LOBBY_MODES[lobbyPrefs.mode]||!validOwnedKit(selected))return false;closeLobbySettings();if(lobbyPrefs.mode==='league')return beginProgression('league');queueMatch(lobbyPrefs.mode);return true}
function renderLobbyNav(){
  const nav=$('#lobbyNav');nav.hidden=!account.profile;
  if(nav.hidden)return;
  nav.innerHTML=[['home','Início','home'],['library','Campeões','ecos'],['shop','Loja','shop'],['training','Dojo','dojo']].map(([screen,name,art])=>`<button data-nav="${screen}" ${appScreen===screen?'aria-current="page"':''} class="${appScreen===screen?'current':''}" aria-label="${name}">${lobbyIcon(art)}<span>${name}</span>${screen==='shop'?'<small id="lobbyFreeBadge" hidden>GRÁTIS</small>':''}</button>`).join('');lobbyDailySignature='';refreshLobbyDaily();
}
function refreshLobbyDaily(){const badge=$('#lobbyFreeBadge');if(!badge||!account.profile)return;const available=dailyAvailable(),signature=String(available);if(signature===lobbyDailySignature)return;lobbyDailySignature=signature;badge.hidden=!available;badge.parentElement?.setAttribute('aria-label',available?'Loja — giro diário grátis disponível':'Loja')}
function saveLobbyPrefs(){try{localStorage.setItem(LOBBY_PREFS_KEY,JSON.stringify(lobbyPrefs));return true}catch{return false}}
function lobbyMotionEnabled(){return lobbyPrefs.motion&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches}
function applyLobbyMotion(){const el=$('#homeScreen');el.dataset.motion=lobbyMotionEnabled()?'on':'off';lobbyPainted=false}
function drawLobbyHero(t){
  if(appScreen!=='home'||state!=='select'||!account.profile||!$('#profileScreen').hidden||document.hidden||!$('#lobbySettings').hidden)return;
  const animated=lobbyMotionEnabled();if(lobbyPainted&&(!animated||t-lobbyPaintAt<50))return;
  const el=$('#lobbyHero');if(!el)return;const g=el.getContext('2d');if(!g)return;
  lobbyPaintAt=t;g.clearRect(0,0,440,440);g.save();g.translate(220,222);
  g.fillStyle='#05150d77';g.beginPath();g.ellipse(0,45,92,45,0,0,TAU);g.fill();
  const drawn=drawAnimatedFighter(g,lobbyActor,260,animated?t/1000:0);g.restore();
  $('#lobbyHeroFallback').hidden=drawn;if(drawn){lobbyPainted=true;lobbyRenderCount++}
}
function openLobbySettings(){
  lobbyLastFocus=document.activeElement;const modal=$('#lobbySettings');
  modal.innerHTML=`<section class="lobby-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="lobbySettingsTitle"><div class="lobby-settings-heading"><div><span class="lobby-overline">DO SEU JEITO</span><h2 id="lobbySettingsTitle">Preferências.</h2></div><button id="closeLobbySettings" aria-label="Fechar configurações">${lobbyIcon('close')}</button></div><label for="lobbyQuality">Efeitos no combate</label><select id="lobbyQuality"><option value="auto">Automático</option><option value="low">Leve · menos partículas</option></select><label class="lobby-motion-option"><input id="lobbyMotion" type="checkbox" ${lobbyPrefs.motion?'checked':''}><span>Animar o lobby<small>Respiração do personagem e luzes do cenário.</small></span></label><p>Suas preferências ficam salvas neste aparelho. A opção de reduzir movimento do sistema também é respeitada.</p><button class="lobby-settings-done" id="doneLobbySettings">Concluir</button></section>`;
  modal.hidden=false;$('#lobbyQuality').value=vfxQuality;$('#closeLobbySettings').focus?.();
}
function closeLobbySettings(){const el=$('#lobbySettings');if(el.hidden)return;el.hidden=true;lobbyLastFocus?.focus?.();lobbyLastFocus=null}
function initLobby(){
  vfxSetQuality(lobbyPrefs.quality);
  document.addEventListener('click',e=>{
    if(e.target.closest('#openLobbySettings'))openLobbySettings();
    if(e.target.closest('#closeLobbySettings,#doneLobbySettings')||e.target===$('#lobbySettings'))closeLobbySettings();
    const cycle=e.target.closest('[data-cycle-build]');if(cycle)cycleLobbyBuild(Number(cycle.dataset.cycleBuild));
    if(e.target.closest('#lobbyPlay'))playLobbyMode();
  });
  document.addEventListener('change',e=>{
    if(e.target.id==='lobbyModeSelect'&&e.target.value==='arenas'){updateLobbyMode();return}
    if(e.target.id==='lobbyModeSelect'&&LOBBY_MODES[e.target.value]){lobbyPrefs.mode=e.target.value;saveLobbyPrefs();updateLobbyMode()}
    if(e.target.id==='lobbyQuality'&&['auto','low'].includes(e.target.value)){lobbyPrefs.quality=e.target.value;vfxSetQuality(e.target.value);saveLobbyPrefs()}
    if(e.target.id==='lobbyMotion'){lobbyPrefs.motion=e.target.checked;saveLobbyPrefs();applyLobbyMotion()}
  });
  document.addEventListener('keydown',e=>{
    const modal=$('#lobbySettings');if(modal.hidden)return;
    if(e.key==='Escape'){e.preventDefault();closeLobbySettings()}
    if(e.key==='Tab'){const list=[...modal.querySelectorAll('button,input,select')],first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
  });
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',applyLobbyMotion);
}
function normalizeJourney(){
 const j=account.journey||{};
 account.journey={training:j.training===true,duel:j.duel===true,build:j.build===true,claimed:j.claimed===true};
 account.wish=Number.isInteger(account.wish)&&skills[account.wish]?account.wish:null;
}
function journeyReady(){return ['training','duel','build'].every(k=>account.journey[k])}
function completeJourneyTask(key){
 if(!['training','duel','build'].includes(key)||account.journey[key])return false;
 account.journey[key]=true;if(!saveAccount()){account.journey[key]=false;return false}return true;
}
function finishTrainingJourney(){if(battleActivity==='training'&&trainingSession?.damage>=300)completeJourneyTask('training')}
function journeyChoices(){return [...new Set([25,32,36,...skills.filter(s=>['C','B'].includes(s.rank)).map(s=>s.id),...skills.map(s=>s.id)])].filter(id=>!account.owned.includes(id)).slice(0,3)}
function claimJourney(id){
 if(!account.profile||!journeyReady()||account.journey.claimed)return false;
 const choices=journeyChoices();if(choices.length?!choices.includes(id):id!==-1)return false;
 const before=JSON.stringify(account);account.journey.claimed=true;
 if(id===-1)account.crystals+=125;else account.owned.push(id);
 if(!saveAccount()){account=JSON.parse(before);announce('Não foi possível salvar a recompensa. Tente novamente.');return false}
 renderHome();announce(id===-1?'Recompensa recebida: 125 cristais.':'Eco desbloqueado: '+skills[id].name);return true;
}
function wishMarkup(){
 const s=skills[account.wish];
 if(!s)return `<section class="journey-card wish-card"><span class="eyebrow">SEU PRÓXIMO ECO</span><h2>Escolha um objetivo.</h2><p>Marque um Eco bloqueado na biblioteca. Cada duplicata rende cristais para chegar até ele.</p><button class="ghost" data-nav="library">Escolher na biblioteca ↗</button></section>`;
 const owned=account.owned.includes(s.id),cost=EXCHANGE[s.rank],left=Math.max(0,cost-account.crystals);
 return `<section class="journey-card wish-card"><span class="eyebrow">ECO DESEJADO${owned?' · CONQUISTADO':''}</span><div class="wish-title">${icon(s.id)}<div><h2>${s.name}</h2><span class="rank rank-${s.rank}">${s.rank} · ${RANK_NAMES[s.rank]}</span></div></div>${owned?'<p>Objetivo conquistado! Escolha seu próximo Eco na biblioteca.</p>':`<p><b>${account.crystals} / ${cost} cristais</b> · ${left?'faltam '+left:'pronto para desbloquear'}</p><progress max="${cost}" value="${Math.min(account.crystals,cost)}" aria-label="Cristais para ${s.name}"></progress><button class="gold" data-wish-exchange="${s.id}" ${left||spinBusy?'disabled':''}>Desbloquear · ${cost} cristais</button>`}<button class="ghost" data-nav="library">${owned?'Escolher próximo objetivo':'Mudar objetivo'}</button><p class="journey-hint">O objetivo não altera as chances da roleta.</p></section>`;
}
function setWish(id){
 if(!Number.isInteger(id)||!skills[id]||account.owned.includes(id))return false;
 const before=account.wish;account.wish=id;if(!saveAccount()){account.wish=before;announce('Não foi possível salvar o objetivo.');return false}
 showDetail(id);renderCollectionProgress();announce(skills[id].name+' definido como Eco desejado.');return true;
}
function journeyMarkup(){
 const j=account.journey,done=['training','duel','build'].filter(k=>j[k]).length;
 if(j.claimed)return '<section class="journey-card"><span class="eyebrow">PRIMEIROS PASSOS · CONCLUÍDOS</span><p>Recompensa recebida. Continue ampliando sua coleção e experimentando novas builds.</p></section>';
 return `<section class="journey-card"><span class="eyebrow">PRIMEIROS PASSOS · ${done}/3</span><h2>Seu próximo poder começa aqui.</h2><p>Complete os três objetivos e escolha um Eco grátis. Recompensa única.</p><div class="journey-tasks">${[['training','Causar 300 de dano no Dojo','training'],['duel','Concluir uma partida 1×1 ou 2×2','home'],['build','Salvar uma build em um dos três espaços','library']].map(([key,label,nav])=>`<div><span>${j[key]?'✓':'○'} ${label}</span>${j[key]?'<b>Concluído</b>':`<button class="ghost" data-nav="${nav}">Ir ↗</button>`}</div>`).join('')}</div>${journeyReady()?`<h3>Escolha sua recompensa</h3><div class="journey-rewards">${journeyChoices().map(id=>`<button data-journey-claim="${id}">${icon(id)}<strong>${skills[id].name}</strong><small>${skills[id].rank} · ${skills[id].type}</small><span>Escolher este Eco</span></button>`).join('')||'<button data-journey-claim="-1">Coleção completa · receber 125 cristais</button>'}</div>`:'<p class="journey-hint">O Dojo conta ao sair depois de atingir a meta. Abandonar um duelo não conclui a missão.</p>'}</section>`;
}
function renderJourneyHome(){const el=$('#journeyHome');if(el)el.innerHTML=journeyMarkup()+wishMarkup();hydrateSkillIcons()}
function renderCollectionProgress(){
 const el=$('#collectionProgress');if(!el)return;
 el.innerHTML=`<div class="collection-summary"><div><span class="eyebrow">SUA COLEÇÃO</span><h2>${account.owned.length} de ${skills.length} Ecos</h2></div><progress max="${skills.length}" value="${account.owned.length}" aria-label="Ecos desbloqueados"></progress></div><div class="collection-ranks">${['D','C','B','A','S'].map(rank=>{const total=RANK_IDS[rank].length,n=RANK_IDS[rank].filter(id=>account.owned.includes(id)).length;return `<button class="ghost" data-collection-rank="${rank}" aria-label="Filtrar ${rank}: ${n} de ${total} desbloqueados"><span class="rank rank-${rank}">${rank}</span><b>${n}/${total}</b><progress max="${total}" value="${n}"></progress></button>`}).join('')}</div><p>Raridade indica a categoria do Eco. Combine funções, custos e recargas; duplicatas não aumentam atributos.</p>${account.wish!==null?`<p>✧ Objetivo: <b>${skills[account.wish].name}</b> · ${account.owned.includes(account.wish)?'conquistado':account.crystals+' / '+EXCHANGE[skills[account.wish].rank]+' cristais'}</p>`:''}`;
}
function initJourney(){
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-journey-scroll]'))$('#journeyHome')?.scrollIntoView?.({behavior:lobbyMotionEnabled()?'smooth':'auto',block:'start'});
  const wish=e.target.closest('[data-wish]');if(wish)setWish(Number(wish.dataset.wish));
  const claim=e.target.closest('[data-journey-claim]');if(claim)claimJourney(Number(claim.dataset.journeyClaim));
  const exchange=e.target.closest('[data-wish-exchange]');if(exchange){const id=Number(exchange.dataset.wishExchange);requestShopPurchase('echo',id)}
  const rank=e.target.closest('[data-collection-rank]');if(rank){rankFilter=rank.dataset.collectionRank;renderSelection()}
 });
}
const SHOP_COSMETICS=[
{id:'jade',type:'skin',name:'Vigia de Jade',price:4000,base:0,filter:'hue-rotate(65deg) saturate(1.25)',desc:'Variação cromática do Guerreiro Astral.'},
{id:'aurora',type:'skin',name:'Andarilho da Aurora',price:4000,base:1,filter:'hue-rotate(130deg) saturate(1.15)',desc:'Variação cromática do Ninja das Brumas.'},
{id:'comet',type:'symbol',name:'Selo do Cometa',price:1200,desc:'Símbolo original para seu avatar no início.'},
{id:'laurel',type:'frame',name:'Louros do Santuário',price:2000,desc:'Moldura dourada para seu avatar no início.'},
{id:'stars',type:'entry',name:'Chegada Estelar',price:2500,desc:'Selo de luz na contagem inicial da arena.'}
];
let shopTab='invoke',shopPending=null,ecoPreview=null,ecoPreviewLast=-Infinity;
const cosmeticCache=new Map();
function normalizeShop(){
 const old=account.cosmetics||{},owned=[...new Set(Array.isArray(old.owned)?old.owned:[])].filter(id=>SHOP_COSMETICS.some(c=>c.id===id));
 const active={};for(const type of ['skin','symbol','frame','entry'])active[type]=SHOP_COSMETICS.some(c=>c.id===old.active?.[type]&&c.type===type&&owned.includes(c.id))?old.active[type]:null;
 account.cosmetics={owned,active};account.spinHistory=(Array.isArray(account.spinHistory)?account.spinHistory:[]).filter(h=>Number.isInteger(h.id)&&skills[h.id]&&Number.isFinite(h.at)).slice(0,20).map(h=>({id:h.id,at:h.at,duplicate:!!h.duplicate,free:!!h.free,crystals:h.duplicate?DUPLICATES[skills[h.id].rank]:0}));
}
function rememberSpin(drop,free){account.spinHistory.unshift({...drop,free:!!free,crystals:drop.duplicate?DUPLICATES[skills[drop.id].rank]:0});account.spinHistory=account.spinHistory.slice(0,20)}
function activeCosmetic(type){return SHOP_COSMETICS.find(c=>c.id===account.cosmetics?.active[type]&&account.cosmetics.owned.includes(c.id))}
function cosmeticSymbol(){return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 50L28 26M8 38L25 21M22 55L38 37" stroke="#90dfd5" stroke-width="3"/><path d="M42 8L47 22L60 27L47 32L42 47L37 32L23 27L37 22Z" fill="none" stroke="#eed69a" stroke-width="3"/></svg>'}
function cosmeticArt(c){return c.type==='skin'?`<span style="filter:${c.filter}">${skinPortrait(c.base)}</span>`:c.type==='symbol'?cosmeticSymbol():`<span class="cosmetic-glyph">${c.type==='frame'?'❧ ◇ ❧':'✧'}</span>`}
function cosmeticSprite(a){const c=activeCosmetic('skin');if(!c||a.skin!==c.base||!(a===p||a===lobbyActor||a===skinPreviewActor))return skinImage;if(!cosmeticCache.has(c.id)){const canvas=document.createElement('canvas');canvas.width=skinImage.naturalWidth;canvas.height=skinImage.naturalHeight;const g=canvas.getContext('2d');g.filter=c.filter;g.drawImage(skinImage,0,0);cosmeticCache.set(c.id,canvas)}return cosmeticCache.get(c.id)}
function applyLobbyCosmetics(){const avatar=$('.lobby-avatar');if(avatar){if(activeCosmetic('symbol'))avatar.innerHTML=cosmeticSymbol();avatar.classList.toggle('cosmetic-laurel',!!activeCosmetic('frame'))}const skin=activeCosmetic('skin');if(skin&&account.profile.skin===skin.base&&$('.lobby-identity small'))$('.lobby-identity small').textContent=skin.name}
function drawEntryCosmetic(){if(state!=='count'||!p||!activeCosmetic('entry'))return;ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle='#bce8dd';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,5,49,30,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4+(lobbyMotionEnabled()?vfxTime*.6:0),x=Math.cos(a)*48,y=Math.sin(a)*32;ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke()}ctx.restore()}
function shopTabs(){return `<div class="shop-tabs" role="tablist" aria-label="Seções da loja">${[['invoke','Invocar'],['exchange','Trocar cristais'],['visuals','Visuais']].map(([id,label])=>`<button role="tab" id="tab-${id}" aria-selected="${shopTab===id}" aria-controls="shop-${id}" data-shop-tab="${id}">${label}</button>`).join('')}</div>`}
function shopExtras(){
 return `<section id="shop-visuals" role="tabpanel" aria-labelledby="tab-visuals" ${shopTab==='visuals'?'':'hidden'}><div class="panel"><span class="eyebrow">SUA IDENTIDADE</span><h2>Uma presença só sua.</h2><p>Preços fixos em moedas. Visuais permanentes, sem bônus de combate.</p><div class="cosmetic-grid">${SHOP_COSMETICS.map(c=>{const owned=account.cosmetics.owned.includes(c.id),equipped=activeCosmetic(c.type)?.id===c.id;return `<article class="cosmetic-card"><div class="cosmetic-art">${cosmeticArt(c)}</div><h3>${c.name}</h3><p>${c.desc}</p><strong>${owned?'Adquirido':c.price+' moedas'}</strong><button class="${equipped?'gold':'ghost'}" ${owned?`data-equip-cosmetic="${c.id}"`:`data-buy-cosmetic="${c.id}" ${account.coins<c.price?'disabled':''}`}>${owned?(equipped?'Remover visual':'Equipar'):'Comprar'}</button></article>`}).join('')}</div></div></section>`;
}
function shopHistory(){return `<details class="shop-history"><summary>Últimas invocações · ${account.spinHistory.length}/20</summary>${account.spinHistory.length?account.spinHistory.map(h=>`<div><span><b>${skills[h.id].name}</b><small>${new Date(h.at).toLocaleString('pt-BR')} · ${h.free?'Grátis':'250 moedas'} · ${h.duplicate?'Duplicata +'+h.crystals+' cristais':'Novo Eco'}</small></span><button class="ghost" data-eco-preview="${h.id}">Ver</button></div>`).join(''):'<p>Suas próximas invocações aparecerão aqui.</p>'}</details>`}
function renderShopResult(){const el=$('#shopResult');if(!el)return;const d=account.lastDrop,s=skills[d?.id];el.hidden=spinBusy||!s;if(!s)return;el.innerHTML=`<h3>${d.duplicate?'Duplicata convertida':'Eco desbloqueado'} · ${s.name}</h3><p>${d.duplicate?'+'+DUPLICATES[s.rank]+' cristais adicionados.':'Já disponível para montar sua build.'}</p><div class="shop-actions"><button class="ghost" data-eco-preview="${s.id}">Ver habilidade</button><button class="gold" data-nav="library">Montar build</button></div>${wishMarkup()}`;hydrateSkillIcons()}
function enhanceShop(){renderShopResult();$('#shopCatalog').innerHTML=`<label>Buscar Eco<input id="shopSearch" type="search" placeholder="Nome ou função" autocomplete="off"></label><label>Raridade<select id="shopRank">${['Todas','D','C','B','A','S'].map(r=>`<option>${r}</option>`).join('')}</select></label><div id="shopCatalogItems" class="shop-catalog"></div>`;$('#shopSearch').oninput=renderShopCatalog;$('#shopRank').onchange=renderShopCatalog;renderShopCatalog()}
function renderShopCatalog(){const search=($('#shopSearch').value||'').toLocaleLowerCase('pt-BR'),rank=$('#shopRank').value||'Todas';const list=skills.filter(s=>(rank==='Todas'||s.rank===rank)&&(s.name+' '+s.type).toLocaleLowerCase('pt-BR').includes(search));$('#shopCatalogItems').innerHTML=list.map(s=>`<article><div>${icon(s.id)}<span><b>${s.name}</b><small>${s.rank} · ${s.type} · ${account.owned.includes(s.id)?'Obtido':EXCHANGE[s.rank]+' cristais'}</small></span></div><button class="ghost" data-eco-preview="${s.id}">Ver habilidade</button></article>`).join('')||'<p>Nenhum Eco encontrado.</p>';hydrateSkillIcons()}
function closeShopConfirm(){shopPending=null;$('#shopConfirm').hidden=true}
function requestShopPurchase(type,id){if(!account.profile||spinBusy)return false;const item=type==='echo'?skills[id]:SHOP_COSMETICS.find(c=>c.id===id);if(!item)return false;const echo=type==='echo',price=echo?EXCHANGE[item.rank]:item.price,balance=echo?account.crystals:account.coins,owned=echo?account.owned.includes(id):account.cosmetics.owned.includes(id);if(owned||balance<price)return false;shopPending={type,id};$('#shopConfirm').innerHTML=`<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="purchaseTitle"><span class="eyebrow">CONFIRMAR TROCA</span><h2 id="purchaseTitle">${item.name}</h2><p>Preço: <b>${price} ${echo?'cristais':'moedas'}</b></p><p>Seu saldo: ${balance}<br>Após a compra: <b>${balance-price}</b></p><p>Desbloqueio permanente${echo?'.':', exclusivamente visual.'}</p><div class="shop-actions"><button class="ghost" id="cancelPurchase">Cancelar</button><button class="gold" id="confirmPurchase">Confirmar compra</button></div></div>`;$('#shopConfirm').hidden=false;$('#cancelPurchase').onclick=closeShopConfirm;$('#confirmPurchase').onclick=confirmShopPurchase;$('#cancelPurchase').focus?.();return true}
function confirmShopPurchase(){const pending=shopPending;closeShopConfirm();if(!pending)return false;if(pending.type==='echo'){shopTab='invoke';$('#detailDialog').hidden=true;showScreen('shop');return exchangeEcho(pending.id)}return buyCosmetic(pending.id)}
function buyCosmetic(id){const c=SHOP_COSMETICS.find(c=>c.id===id);if(!account.profile||!c||account.cosmetics.owned.includes(id)||account.coins<c.price)return false;const before=JSON.stringify(account);account.coins-=c.price;account.cosmetics.owned.push(id);if(!saveAccount()){account=JSON.parse(before);announce('Não foi possível salvar a compra.');return false}renderShop();announce(c.name+' adquirido. Você já pode equipar.');return true}
function equipCosmetic(id){const c=SHOP_COSMETICS.find(c=>c.id===id);if(!account.profile||!c||!account.cosmetics.owned.includes(id))return false;const before=JSON.stringify(account),active=account.cosmetics.active[c.type]===id;account.cosmetics.active[c.type]=active?null:id;if(c.type==='skin'&&!active)account.profile.skin=c.base;if(!saveAccount()){account=JSON.parse(before);return false}renderShop();return true}
function openEcoPreview(id){if(!skills[id])return;finishEchoSummon(true);showDetail(id);ecoPreview={id,start:performance.now()};ecoPreviewLast=-Infinity;$('#ecoDemo').hidden=false;loadSkillSprites([id])}
function drawEcoPreview(t){if(!ecoPreview||$('#detailDialog').hidden||document.hidden||t-ecoPreviewLast<1000/60)return;if(!lobbyMotionEnabled()&&ecoPreviewLast!==-Infinity)return;const canvas=$('#ecoDemo'),g=canvas.getContext('2d');if(!g||!hasSkillSprite(ecoPreview.id))return;ecoPreviewLast=t;const sec=lobbyMotionEnabled()?(t-ecoPreview.start)/1000:.5,phase=sec%2.5;g.clearRect(0,0,360,180);g.fillStyle='#152d29';g.fillRect(0,0,360,180);g.strokeStyle='#2c4940';for(let x=0;x<360;x+=30){g.beginPath();g.moveTo(x,0);g.lineTo(x,180);g.stroke()}for(let y=0;y<180;y+=30){g.beginPath();g.moveTo(0,y);g.lineTo(360,y);g.stroke()}g.save();g.translate(65,94);drawSkinBody(g,{skin:0},62,phase<1?7:0);g.restore();g.fillStyle='#c5a878';g.fillRect(285,70,12,48);g.fillRect(270,81,42,9);if(hasSkillSprite(ecoPreview.id)){const frame=paintedFrame(Math.min(1,phase/1.2),false),own=['Defesa','Mobilidade','Suporte'].includes(skills[ecoPreview.id].type),x=own?65:85+Math.min(1,phase)*195;g.drawImage(ensureSkillSprite(ecoPreview.id).image,...skillSpriteRect(ecoPreview.id,frame),x-48,44,96,96)}g.fillStyle='#c8d8c8';g.font='11px sans-serif';g.fillText('Demonstração visual · escala ilustrativa',17,166)}
function initShop(){document.addEventListener('click',e=>{const tab=e.target.closest('[data-shop-tab]');if(tab){finishEchoSummon(true);shopTab=tab.dataset.shopTab;renderShop();$('#tab-'+shopTab).focus?.()}const preview=e.target.closest('[data-eco-preview]');if(preview)openEcoPreview(Number(preview.dataset.ecoPreview));const buy=e.target.closest('[data-buy-cosmetic]');if(buy)requestShopPurchase('cosmetic',buy.dataset.buyCosmetic);const equip=e.target.closest('[data-equip-cosmetic]');if(equip)equipCosmetic(equip.dataset.equipCosmetic)});document.addEventListener('keydown',e=>{if($('#shopConfirm').hidden)return;if(e.key==='Escape')closeShopConfirm();if(e.key==='Tab'){e.preventDefault();const next=document.activeElement===$('#cancelPurchase')?$('#confirmPurchase'):$('#cancelPurchase');next.focus?.()}})}
function normalizeDailyIncome(){
 const d=account.dailyIncome||{};
 account.dailyIncome={day:typeof d.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.day)?d.day:dayKey(Math.max(Date.now(),account.lastSeen||0)),used:Number.isFinite(d.used)?Math.max(0,Math.min(1000,Math.floor(d.used))):0,quarters:Number.isInteger(d.quarters)&&d.quarters>=0&&d.quarters<4?d.quarters:0};
}
function dailyIncomeView(now=Date.now()){
 const d=account.dailyIncome,day=dayKey(Math.max(now,account.lastSeen||0));
 return day>d.day?{day,used:0,quarters:d.quarters}:{...d};
}
function dailyIncomeQuote(base,now=Date.now()){
 const d=dailyIncomeView(now),normal=Math.min(Math.max(0,base),1000-d.used),quarters=(Math.max(0,base)-normal)+d.quarters;
 return {reward:normal+Math.floor(quarters/4),state:{day:d.day,used:d.used+normal,quarters:quarters%4}};
}
function awardMatchCoins(base,now=Date.now()){
 const q=dailyIncomeQuote(base,now);account.dailyIncome=q.state;account.lastSeen=Math.max(account.lastSeen||0,now);account.coins+=q.reward;return q.reward;
}
function dailyIncomeText(){const d=dailyIncomeView();return `Rendimento diário: ${d.used}/1.000 moedas · ${d.used>=1000?'25% ativo nas próximas partidas.':'100% até o limite; depois, 25%.'} Renova à meia-noite local.`}
function dailyRewardText(mode){const team=mode==='2v2',win=dailyIncomeQuote(team?200:100).reward,loss=dailyIncomeQuote(team?50:25).reward;return `${team?'2×2':'1×1'} contra bots · próxima vitória: ${win} · derrota: ${loss} moedas. ${dailyIncomeText()}`}
function refreshIncomeUI(){
 if(!account.profile)return;
 if(appScreen==='home')updateLobbyMode();
 for(const el of document.querySelectorAll('[data-daily-income]'))el.textContent=dailyIncomeText();
 const league=$('#leagueRewardText');if(league&&appScreen==='league')league.textContent=dailyRewardText('1v1');
}
const ARENA_MODES={
 zone:{name:'Controle de Zona',w:1400,h:1300,seconds:240,prize:200,copy:'2×2 · ocupe a zona sem rivais dentro. Primeiro a 90 pontos. A zona muda a cada 40s; reaparecimento em 5s.'},
 guardian:{name:'Caçada ao Guardião',w:1500,h:1400,seconds:300,prize:200,copy:'Você e um aliado bot contra o Guardião. Saia das áreas vermelhas antes do impacto. Duas fases; sem reaparecimento.'},
 survival:{name:'Sobrevivência',w:3600,h:2800,seconds:720,prize:200,copy:'Battle royale solo com 8 lutadores. Todos começam sem habilidade: mate monstros e rivais, suba de nível e libere uma habilidade por ponto (a ultimate por último). A zona segura fecha para um ponto aleatório do mapa; seja o último de pé.'},
 stage:{name:'Cruzada Arcade',w:4400,h:430,seconds:900,prize:150,copy:'Fase de rolagem horizontal, como nos fliperamas: derrote as ondas de monstros, pegue comida no caminho e enfrente o chefe no fim. Solo ou em dupla.'},
 tournament:{name:'Torneio dos Campeões',w:1100,h:1100,seconds:540,prize:250,copy:'Três adversários em sequência. Recupere 25% do HP máximo entre duelos. Recompensa ao concluir a disputa.'},
 mirror:{name:'Espelho',w:1000,h:1100,seconds:180,prize:100,copy:'Um duelo com builds idênticas. Vence quem aproveitar melhor as mesmas ferramentas.'},
 daily:{name:'Desafio Diário',w:1200,h:1200,seconds:180,prize:100,copy:'Uma regra comum aos dois lutadores muda à meia-noite local. Sua build e sua coleção são preservadas.'},
 ffa:{name:'Todos contra Todos',w:1600,h:1500,seconds:180,prize:150,copy:'Quatro lutadores, cada um por si. Eliminações valem um ponto; reaparecimento em 5s. Maior pontuação vence.'}
};
let arenaModeId=null,modeRun=null;
function dayModeRule(){let h=0;for(const c of dayKey())h=(h*31+c.charCodeAt(0))>>>0;return h%3}
function dailyRuleText(rule=dayModeRule()){return ['Regeneração de MP pela metade','Sem regeneração passiva de MP','Duelo rápido: 90 segundos'][rule]}
function configureArenaSize(){if(battleActivity==='training'){W=innerWidth<600?640:1000;H=innerWidth<600?760:650;pillars=[{x:W*.3,y:H*.34,r:29},{x:W*.7,y:H*.66,r:29},{x:W*.7,y:H*.34,r:21},{x:W*.3,y:H*.66,r:21}];return}const c=ARENA_MODES[arenaModeId];W=c?.w||(matchMode==='2v2'?1200:1000);H=c?.h||(matchMode==='2v2'?1300:1100);pillars=[{x:W*.25,y:H*.27,r:32},{x:W*.75,y:H*.73,r:32},{x:W*.75,y:H*.27,r:26},{x:W*.25,y:H*.73,r:26}];}
function updateArenaCamera(){if(!p||!cw||!ch)return;scale=Math.max(cw/Math.min(W,innerWidth<600?680:1100),ch/Math.min(H,900));const focus=p.hp>0?p:actors.find(a=>a.team===p.team&&a.hp>0)||p;ox=clamp(cw/2-focus.x*scale,cw-W*scale,0);oy=clamp(ch/2-focus.y*scale,ch-H*scale,0)}
function modesMarkup(){return `<div class="section-head"><button class="ghost" data-nav="home">← Início</button><span class="eyebrow">NOVAS FORMAS DE LUTAR · OFFLINE</span><h1>Arenas dos Campeões.</h1><p>Arenas horizontais com o campo inteiro visível. Todos os ganhos seguem o limite diário.</p><p data-daily-income>${dailyIncomeText()}</p></div><div class="mode-grid">${Object.entries(ARENA_MODES).map(([id,c])=>`<article class="panel mode-card"><span class="eyebrow">${c.w} × ${c.h} · ${id==='zone'?'OBJETIVO':id==='guardian'?'COOP COM BOT':'OFFLINE'}</span><h2>${c.name}</h2><p>${c.copy}</p>${id==='daily'?`<p class="notice">Hoje: ${dailyRuleText()}</p>`:''}<small>Vitória: até ${c.prize} moedas antes do ajuste diário.</small><button class="gold" data-arena-mode="${id}">Entrar na arena ↗</button></article>`).join('')}</div>`}
function showArenaModes(){showScreen('home');$('#modeScreen').hidden=false;$('#modeScreen').innerHTML=appHeader()+modesMarkup();document.body.style.overflow='hidden';$('#lobbyNav').hidden=true}
function beginArenaMode(id){if(!ARENA_MODES[id]||!account.profile)return false;if(!validOwnedKit(selected)){showScreen('library');announce('Equipe seis Ecos desbloqueados.');return false}arenaModeId=id;modeRun=null;launchArenaMode();return true}
function launchArenaMode(){battleActivity='casual';matchMode=['zone','guardian'].includes(arenaModeId)?'2v2':'1v1';$('#modeScreen').hidden=true;start()}
function spawnModeActor(team,label,x,y,hp=1000,kit=shuffled()){const a=actor(x,y,kit,team===0?'#8ecde3':'#e6a28c');a.team=team;a.label=label;a.skin=Math.floor(Math.random()*6);a.max=a.hp=hp;a.inv=1;return a}
function prepareArenaMode(){modeRun=null;$('#battle').dataset.arena=arenaModeId||'';if(!ARENA_MODES[arenaModeId])return;const c=ARENA_MODES[arenaModeId];time=c.seconds;modeRun={id:arenaModeId,elapsed:0,wave:1,round:1,score:[0,0,0,0],zoneIndex:0,hazards:[],bossCooldown:4,upgrades:[],settled:false,intermission:false,rule:dayModeRule()};p.x=W*.35;p.y=H*.5;b.x=W*.65;b.y=H*.5;
 if(['mirror','daily'].includes(arenaModeId))b.kit=[...p.kit];
 if(arenaModeId==='daily'&&modeRun.rule===2)time=90;
 if(arenaModeId==='guardian'){const ally=actors.find(a=>a!==p&&a.team===0);actors=[p,b,ally];p.x=W*.35;p.y=H*.7;ally.x=W*.65;ally.y=H*.7;b.x=W*.5;b.y=H*.35;b.boss=true;b.label='Guardião do Santuário';b.max=b.hp=2600;b.kit=[4,28,46,49,32,41];b.r=30}
 if(arenaModeId==='survival')spawnSurvivalWave();
 if(arenaModeId==='tournament'){b.kit=[...LEAGUE_RIVALS[1].kit];b.label='Desafiante 1'}
 if(arenaModeId==='zone'){actors.forEach((a,i)=>{a.x=a.team===0?W*.3:W*.7;a.y=i<2?H*.4:H*.6})}
 if(arenaModeId==='ffa'){actors=[p,b,spawnModeActor(2,'Rival 2',W*.7,H*.7),spawnModeActor(3,'Rival 3',W*.3,H*.7)];actors.forEach((a,i)=>{a.team=i;a.scoreSlot=i;a.x=i%2?W*.7:W*.3;a.y=i<2?H*.3:H*.7})}
}
function clearArenaEffects(){objects=[];shots=[];zones=[];events=[];fx=[];texts=[];spriteFX=[];vfxReset()}
function spawnSurvivalWave(){clearArenaEffects();actors=[p];p.x=W*.5;p.y=H*.6;p.inv=2;for(let i=0;i<Math.min(3,1+Math.floor((modeRun.wave-1)/2));i++){const a=(i+1)*Math.PI/2;actors.push(spawnModeActor(1,'Onda '+modeRun.wave,W*.5+Math.cos(a)*320,H*.5+Math.sin(a)*320,180+modeRun.wave*35,[0,18,29,41,45,43]))}b=actors[1]}
function modeIntermission(kind){clearInputs();clearArenaEffects();state='intermission';modeRun.intermission=kind;$('#modeScreen').hidden=false;$('#modeScreen').innerHTML=`<div class="section-head"><span class="eyebrow">RESPIRE · PRÓXIMA ETAPA</span><h1>${kind==='upgrade'?'Escolha uma melhoria.':'Duelo vencido.'}</h1><p>${kind==='upgrade'?'Bônus apenas nesta tentativa.':'Recuperação de 25% do HP máximo. MP e Stamina restaurados.'}</p></div><div class="mode-grid">${(kind==='upgrade'?[['vital','Vitalidade','+150 HP máximo e cura de 150.'],['heal','Recuperação','Recupera até 400 HP.'],['power','Potência','+15% de dano nesta tentativa.']]:[['next','Próximo duelo','Continue com os mesmos seis Ecos.']]).map(([id,name,desc])=>`<article class="panel"><h2>${name}</h2><p>${desc}</p><button class="gold" data-mode-upgrade="${id}">Continuar</button></article>`).join('')}</div><button class="ghost" data-nav="home">Abandonar sem recompensa</button>`}
function continueArenaMode(choice){if(!modeRun?.intermission||state!=='intermission')return false;const kind=modeRun.intermission;if(kind==='upgrade'&&!['vital','heal','power'].includes(choice)||kind!=='upgrade'&&choice!=='next')return false;
 if(choice==='vital'){p.max+=150;p.hp+=150}else if(choice==='heal')p.hp=Math.min(p.max,p.hp+400);else if(choice==='power')p.modeDamage=(p.modeDamage||1)+.15;
 modeRun.intermission=false;$('#modeScreen').hidden=true;if(kind==='upgrade'){modeRun.wave++;spawnSurvivalWave()}else{modeRun.round++;p.hp=Math.min(p.max,p.hp+p.max*.25);p.x=W*.35;p.y=H*.5;b=spawnModeActor(1,'Desafiante '+modeRun.round,W*.65,H*.5,900,[...LEAGUE_RIVALS[Math.min(5,modeRun.round+1)].kit]);actors=[p,b]}
 p.mp=120;p.st=100;p.cd.fill(0);p.buff={};p.dots=[];p.inv=2;state='count';count=3.4;$('#countdown').style.display='flex';refreshModeKit();return true}
function refreshModeKit(){teamHudSignature='';$('#botkit').innerHTML=b.kit.map(id=>`<span>${icon(id)}</span>`).join('');hydrateSkillIcons()}
function zoneCenter(){return [{x:W*.5,y:H*.5},{x:W*.35,y:H*.68},{x:W*.65,y:H*.32}][modeRun.zoneIndex%3]}
function modeAI(dt,a){if(a.boss){guardianAI(dt,a);return true}if(modeRun?.id==='zone'&&!a.guard&&a.hp>0&&a.root<=0&&a.cast<=0&&a.dash<=0&&a.dodgeTime<=0){const z=zoneCenter();if(dist(a,z)>100){const angle=Math.atan2(z.y-a.y,z.x-a.x);move(a,Math.cos(angle)*140*dt,Math.sin(angle)*140*dt);a.a=aim(a);a.moving=true;a.think-=dt;if(a.think<=0){a.think=1.5;const e=enemy(a),id=a.kit.find(id=>a.cd[id]<=0&&a.mp>=skills[id].cost&&(!skills[id].ultimate||canUseUltimate(a))&&skills[id].range>=dist(a,e));if(id!==undefined)cast(a,id)}return true}}return false}
function guardianAI(dt,a){a.a=aim(a);a.moving=false;modeRun.bossCooldown-=dt;if(modeRun.bossCooldown>0)return;const phase=a.hp<a.max*.5?2:1;modeRun.bossCooldown=phase===2?3.2:4.8;const targets=opponents(a),target=enemy(a);if(dist(a,target)>220&&a.root<=0){const angle=a.a;move(a,Math.cos(angle)*90,Math.sin(angle)*90)}for(const t of targets){modeRun.hazards.push({x:t.x,y:t.y,r:phase===2?125:105,t:1.6,owner:a})}if(phase===2)modeRun.hazards.push({x:a.x,y:a.y,r:180,t:2,owner:a})}
function onModeDeath(a,owner){if(!modeRun||a.modeDead)return;a.modeDead=true;if(modeRun.id==='ffa'&&owner&&owner!==a&&Number.isInteger(owner.scoreSlot))modeRun.score[owner.scoreSlot]++;}
function respawnModeActor(a){const idx=actors.indexOf(a),spots=[[W*.15,H*.15],[W*.85,H*.85],[W*.85,H*.15],[W*.15,H*.85]];const spot=spots.map(s=>({s,d:Math.min(...actors.filter(e=>e!==a&&e.hp>0).map(e=>Math.hypot(e.x-s[0],e.y-s[1])),9999)})).sort((a,b)=>b.d-a.d)[0].s;const fresh=actor(...spot,[...a.kit],a.color);const meta={team:a.team,label:a.label,skin:a.skin,scoreSlot:a.scoreSlot};Object.assign(a,fresh,meta,{inv:2,modeDead:false,respawn:0});if(a===p)mouse=null;}
function stepArenaMode(dt){if(!modeRun)return;const r=modeRun;r.elapsed+=dt;
 for(const a of actors)if(a.hp<=0&&!a.modeDead)onModeDeath(a,null);
 if(['zone','ffa'].includes(r.id)){for(const a of actors)if(a.hp<=0){a.respawn=(a.respawn||0)+dt;if(a.respawn>=5)respawnModeActor(a)}}
 if(r.id==='zone'){r.zoneIndex=Math.floor(r.elapsed/40);const z=zoneCenter(),present=[0,1].map(team=>actors.some(a=>a.team===team&&a.hp>0&&dist(a,z)<145));if(present[0]!==present[1])r.score[present[0]?0:1]+=dt;if(Math.max(...r.score)>=90||time<=0)return endArenaMode(r.score[0]>r.score[1],r.score[0]===r.score[1])}
 else if(r.id==='ffa'){if(time<=0){const top=Math.max(...r.score);return endArenaMode(r.score[0]===top,r.score.filter(n=>n===top).length>1&&r.score[0]===top)}}
 else if(r.id==='guardian'){for(const h of r.hazards){h.t-=dt;if(h.t<=0){for(const a of actors)if(a.team===0&&dist(a,h)<h.r+a.r)hit(a,130,h.owner,35,Math.atan2(a.y-h.y,a.x-h.x));ring(h.x,h.y,h.r,'#ffad86',.5)}}r.hazards=r.hazards.filter(h=>h.t>0);if(b.hp<=0)return endArenaMode(true);if(!actors.some(a=>a.team===0&&a.hp>0)||time<=0)return endArenaMode(false)}
 else if(r.id==='survival'){if(p.hp<=0||time<=0)return endArenaMode(false);if(!opponents(p).length){if(r.wave>=9)return endArenaMode(true);if(r.wave%3===0)return modeIntermission('upgrade');r.wave++;spawnSurvivalWave();refreshModeKit();state='count';count=3.4;$('#countdown').style.display='flex'}}
 else if(r.id==='tournament'){if(p.hp<=0||time<=0)return endArenaMode(false);if(!opponents(p).length){if(r.round>=3)return endArenaMode(true);return modeIntermission('next')}}
 else if(p.hp<=0||!opponents(p).length||time<=0){const ours=p.hp/p.max,theirs=b.hp/b.max;return endArenaMode(ours>theirs,ours===theirs)}
}
function endArenaMode(win,draw=false){if(!modeRun||modeRun.settled)return;modeRun.settled=true;state='end';clearInputs();const before=JSON.stringify(account),c=ARENA_MODES[modeRun.id];let reward=0;account.matches++;if(win&&!draw)account.wins++;if(!draw)reward=awardMatchCoins(win?c.prize:25);const ok=saveAccount();if(!ok){account=JSON.parse(before);reward=0}rewardGranted=true;$('#resultTitle').textContent=draw?'Empate.':win?'Objetivo concluído!':'Tentativa encerrada.';$('#resultText').textContent=c.name+' · '+(ok?`+${reward} moedas. ${dailyIncomeText()}`:'Não foi possível salvar. Nenhuma moeda foi registrada.');$('#stats').innerHTML=`<span>${Math.floor(modeRun.elapsed)}s</span><span>${Math.round(p.damage)} dano</span><span>+${reward} moedas</span>`;$('#outcome').style.display='flex';updateUI()}
function modeHUD(){if(!modeRun){$('#modeObjective').hidden=true;return}const r=modeRun;$('#modeObjective').hidden=false;let text=ARENA_MODES[r.id].name;if(r.id==='zone')text+=` · ${Math.floor(r.score[0])} × ${Math.floor(r.score[1])} / 90 · zona muda em ${40-Math.floor(r.elapsed%40)}s`;else if(r.id==='survival')text+=` · onda ${r.wave}/9`;else if(r.id==='tournament')text+=` · duelo ${r.round}/3`;else if(r.id==='guardian')text+=` · fase ${b.hp<b.max*.5?2:1} · ${Math.ceil(b.hp)} HP`;else if(r.id==='daily')text+=' · '+dailyRuleText(r.rule);else if(r.id==='ffa')text+=' · abates: '+r.score.join(' / ');if(p.hp<=0&&['zone','ffa'].includes(r.id))text+=` · volta em ${Math.max(0,5-Math.floor(p.respawn||0))}s`;$('#modeObjective').textContent=text;$('.mid-hud small').textContent=({zone:'ZONA · 2×2',guardian:'GUARDIÃO',survival:'ONDAS',stage:'ARCADE',tournament:'TORNEIO',mirror:'ESPELHO',daily:'DIÁRIO',ffa:'LIVRE'})[r.id]}
function drawModeWorld(){if(modeRun?.id==='zone'){const z=zoneCenter();ctx.save();ctx.fillStyle='#9cdcc522';ctx.strokeStyle='#a6dec9';ctx.lineWidth=4;ctx.beginPath();ctx.arc(z.x,z.y,145,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#dcead2';ctx.font='18px system-ui';ctx.textAlign='center';ctx.fillText('CONTROLE',z.x,z.y);ctx.restore()}for(const h of modeRun?.hazards||[]){ctx.save();ctx.fillStyle='#ed765b44';ctx.strokeStyle='#ffb184';ctx.lineWidth=4;ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,TAU);ctx.fill();ctx.stroke();ctx.restore()}}
function drawGuardian(a){ctx.save();ctx.translate(a.x,a.y);ctx.fillStyle=a.hp<a.max*.5?'#be8769':'#789d91';ctx.strokeStyle='#e8d4a1';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-38);ctx.lineTo(29,-12);ctx.lineTo(24,25);ctx.lineTo(0,38);ctx.lineTo(-24,25);ctx.lineTo(-29,-12);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#e9dfb2';ctx.fillRect(-15,-9,10,5);ctx.fillRect(5,-9,10,5);ctx.restore()}
function drawArenaMap(){if(!p)return;const w=90,h=w*H/W,x=cw-w-9,y=42,k=w/W;ctx.save();ctx.fillStyle='#071b18df';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#86a899';ctx.strokeRect(x,y,w,h);ctx.strokeStyle='#d5dcb655';ctx.strokeRect(x-ox/scale*k,y-oy/scale*k,cw/scale*k,ch/scale*k);if(modeRun?.id==='zone'){const z=zoneCenter();ctx.strokeStyle='#e7d497';ctx.beginPath();ctx.arc(x+z.x*k,y+z.y*k,145*k,0,TAU);ctx.stroke()}for(const a of actors)if(a.hp>0){ctx.fillStyle=a===p?'#fff4c5':a.team===p.team?'#76cae0':'#ed998b';ctx.beginPath();ctx.arc(x+a.x*k,y+a.y*k,a===p?3:2.5,0,TAU);ctx.fill()}ctx.restore()}
function initArenaModes(){document.addEventListener('click',e=>{if(e.target.closest('[data-open-modes]'))showArenaModes();const enter=e.target.closest('[data-arena-mode]');if(enter)beginArenaMode(enter.dataset.arenaMode);const upgrade=e.target.closest('[data-mode-upgrade]');if(upgrade)continueArenaMode(upgrade.dataset.modeUpgrade)})}
function frame(t){const rawDt=(t-last)/1000||.016;if(rawDt<.1&&state==='fight')vfxFrameCost=vfxFrameCost*.97+rawDt*1000*.03;let dt=Math.min(.035,rawDt);last=t;if(combatHitStop>0){combatHitStop=Math.max(0,combatHitStop-rawDt);dt*=.16}combatShake=Math.max(0,combatShake-rawDt*34);step(dt);drawSkinPreview(t);drawLobbyHero(t);drawEcoPreview(t);if(['fight','count','paused','end'].includes(state))draw();requestAnimationFrame(frame)}
function clearInputs(){keys={};joy={x:0,y:0};stickID=null;attackHeld=false;defendHeld=false;actors.forEach(a=>a.guard=false);aimGesture=null;mouse=null;$('#knob').style.transform=''}
function bindSkill(btn,index){
 btn.addEventListener('pointerdown',e=>{
  if(state!=='fight'||!p||aimGesture)return;e.preventDefault();const s=skills[p.kit[index]];
  if(p.cd[s.id]>0)return;if(p.mp<s.cost){toast('MP insuficiente');return;}
  btn.setPointerCapture(e.pointerId);aimGesture={index,x:e.clientX,y:e.clientY,a:aim(p),pointer:e.pointerId,dragged:false,dx:0,dy:0,stickRadius:Math.max(64,Math.min(100,innerWidth*.24))};
 });
 btn.addEventListener('pointermove',e=>{const q=aimGesture;if(q?.pointer!==e.pointerId)return;e.preventDefault();q.dx=e.clientX-q.x;q.dy=e.clientY-q.y;const length=Math.hypot(q.dx,q.dy);if(length>4||q.dragged){q.dragged=true;if(length>.5)q.a=Math.atan2(q.dy,q.dx);}});
 btn.addEventListener('pointerup',e=>{const q=aimGesture;if(q?.pointer!==e.pointerId)return;e.preventDefault();const selected=aimSelectionV4(q);aimGesture=null;if(selected.profile.kind==='circle')cast(p,p.kit[index],selected);else cast(p,p.kit[index],q.dragged?q.a:undefined);});
 for(const event of ['pointercancel','lostpointercapture'])btn.addEventListener(event,e=>{if(aimGesture?.pointer===e.pointerId)aimGesture=null;});
}
$('#stick').addEventListener('pointerdown',e=>{if(stickID!==null)return;e.preventDefault();stickID=e.pointerId;$('#stick').setPointerCapture(e.pointerId);stickMove(e)});
function stickMove(e){if(e.pointerId!==stickID)return;let r=$('#stick').getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,l=Math.hypot(dx,dy),m=r.width*.34;joy={x:dx/Math.max(m,l),y:dy/Math.max(m,l)};$('#knob').style.transform=`translate(${joy.x*m}px,${joy.y*m}px)`;mouse=null}
$('#stick').addEventListener('pointermove',stickMove);
for(let type of ['pointerup','pointercancel','lostpointercapture'])$('#stick').addEventListener(type,e=>{if(e.pointerId===stickID){stickID=null;joy={x:0,y:0};$('#knob').style.transform=''}});
$('#attack').innerHTML='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 16V9Q8 6 11 7V14V6Q14 3 15 7V14V7Q19 4 19 9V15V10Q23 8 24 12V21L20 27H11L6 22L4 17Q4 14 7 15L11 19M11 23H22"/></svg><small>SOCO</small>';
$('#defend').innerHTML='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M16 3L27 8L25 21L16 29L7 21L5 8Z M10 16L14 20L23 11"/></svg><small>SEGURE</small>';
$('#defend').addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='fight')return;$('#defend').setPointerCapture(e.pointerId);defendHeld=true;setGuard(p,true)});
for(let type of ['pointerup','pointercancel','lostpointercapture'])$('#defend').addEventListener(type,()=>{defendHeld=false;setGuard(p,!!keys.KeyK)});
$('#dodge').innerHTML=icon(2)+'<small>25 ST</small>';
$('#attack').addEventListener('pointerdown',e=>{e.preventDefault();$('#attack').setPointerCapture(e.pointerId);attackHeld=true;basic(p)});
for(let t of ['pointerup','pointercancel','lostpointercapture'])$('#attack').addEventListener(t,()=>attackHeld=false);
$('#dodge').addEventListener('pointerdown',e=>{e.preventDefault();if(!p)return;if(!dodge(p)&&state==='fight')toast(p.st<25?'Stamina insuficiente':'Esquiva em recarga')});
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){let r=canvas.getBoundingClientRect();mouse={x:(e.clientX-r.left-ox)/scale,y:(e.clientY-r.top-oy)/scale}}});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){canvas.setPointerCapture(e.pointerId);attackHeld=true;basic(p)}});
for(let t of ['pointerup','pointercancel'])canvas.addEventListener(t,()=>attackHeld=false);
addEventListener('keydown',e=>{if(state!=='fight'&&state!=='paused')return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(e.code==='Escape'){togglePause();return}if(state!=='fight')return;if(e.code==='Space')dodge(p);if(/^Digit[1-6]$/.test(e.code))cast(p,p.kit[+e.code.slice(-1)-1]);if(e.code==='KeyJ')basic(p);if(e.code==='KeyK')setGuard(p,true)});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyK')setGuard(p,defendHeld)});
function togglePause(){if(state==='fight'){state='paused';clearInputs();$('#pause').style.display='flex'}else if(state==='paused'){state='fight';$('#pause').style.display='none';last=performance.now()}}
document.addEventListener('visibilitychange',()=>{clearInputs();if(document.hidden&&state==='fight')togglePause();last=performance.now()});
addEventListener('blur',()=>{clearInputs();if(state==='fight')togglePause()});
$('#pauseBtn').onclick=togglePause;
$('#resume').onclick=togglePause;
$('#vfxQuality').onclick=()=>vfxSetQuality(vfxQuality==='auto'?'low':'auto');
vfxSetQuality(vfxQuality);

/* Artes de seleção importadas do Dojo 10 */
const IMPORTED_CHAMPION_PORTRAITS={"0":"assets/portraits/campeao_01.webp","1":"assets/portraits/campeao_02.webp","2":"assets/portraits/campeao_03.webp","3":"assets/portraits/campeao_04.webp","4":"assets/portraits/campeao_05.webp","5":"assets/portraits/campeao_06.webp","6":"assets/portraits/campeao_07.webp","7":"assets/portraits/campeao_08.webp","8":"assets/portraits/campeao_09.webp","9":"assets/portraits/campeao_10.webp"};
const CHAMPIONS=[
 {id:0,name:'Guerreiro Astral',ref:'Goku',title:'O coração das estrelas',weapon:'Punhos e energia',color:'#78dbed',kit:[29,0,43,5,41,28],style:'Pressão e rajadas de energia',ult:'Esfera do Universo',summary:'Concentra energia nas mãos, luta com os punhos e reúne uma esfera colossal.'},
 {id:1,name:'Ninja das Brumas',ref:'Kakashi',title:'O olho que atravessa o espaço',weapon:'Kunai e ninjutsu',color:'#a4caff',kit:[31,27,2,37,35,48],style:'Mobilidade, clones e distorção',ult:'Kamui · Fenda Dupla',summary:'Alterna kunais, selos, clones e relâmpagos. Seu olho abre uma fenda dimensional.'},
 {id:2,name:'Ronin Carmesim',ref:'Ichigo',title:'A última lâmina',weapon:'Katana negra',color:'#e8a2a5',kit:[18,3,10,14,9,1],style:'Cortes, avanço e pressão',ult:'Mugetsu · Lua sem Luz',summary:'Uma katana longa conduz ondas de energia e cortes com todo o peso do corpo.'},
 {id:3,name:'Guardião Solar',ref:'Rengoku',title:'O dragão das chamas',weapon:'Katana flamejante',color:'#ffbf70',kit:[24,45,17,40,36,49],style:'Combos de espada e fogo',ult:'Nona Forma · Dragão Solar',summary:'Posturas de espada, giros flamejantes e uma investida final em forma de dragão.'},
 {id:4,name:'Lutador do Eclipse',ref:'Gojo',title:'Além do infinito',weapon:'Técnicas espaciais',color:'#c4a5ff',kit:[34,4,22,8,15,7],style:'Atração, repulsão e controle',ult:'Vazio Roxo · 200%',summary:'Manipula o espaço com gestos precisos e une dois núcleos em um disparo devastador.'},
 {id:5,name:'Caçador Espectral',ref:'Gon',title:'A promessa definitiva',weapon:'Punhos e aura',color:'#b9e78a',kit:[11,20,33,39,19,46],style:'Carga, perseguição e impacto',ult:'Juramento · Potência Absoluta',summary:'Carrega a aura no punho, alterna pedra, tesoura e papel e libera sua forma de potência máxima.'},
 {"id":6,"name":"Herdeiro da Centelha","ref":"Força acumulada · mobilidade · controle","title":"O poder que cresce a cada passo","weapon":"Força acumulada","color":"#65e1b4","kit":[29,27,2,5,33,28],"style":"Força acumulada · mobilidade · controle","ult":"Legado da Tempestade","summary":"O poder que cresce a cada passo"},
 {"id":7,"name":"Corsário da Maré","ref":"Golpes elásticos · pressão · resistência","title":"Nenhuma corrente segura seu ímpeto","weapon":"Golpes elásticos","color":"#f0b471","kit":[31,0,43,32,5,49],"style":"Golpes elásticos · pressão · resistência","ult":"Punho do Rei das Marés","summary":"Nenhuma corrente segura seu ímpeto"},
 {"id":8,"name":"Cavaleiro do Firmamento","ref":"Rajadas · proteção · energia cósmica","title":"Um coração aceso entre as estrelas","weapon":"Rajadas","color":"#a4cfff","kit":[29,22,35,32,41,7],"style":"Rajadas · proteção · energia cósmica","ult":"Explosão do Firmamento","summary":"Um coração aceso entre as estrelas"},
 {"id":9,"name":"Alquimista de Aço","ref":"Transmutação · terreno · contra-ataque","title":"Toda ruína pode ganhar outra forma","weapon":"Transmutação","color":"#d9b77b","kit":[18,3,10,14,36,1],"style":"Transmutação · terreno · contra-ataque","ult":"Golpe Final","summary":"Toda ruína pode ganhar outra forma"}
];
const CHAMPION_TECHNIQUES=[
 [29,'Rajada de Ki','Projétil de 48 dano. Empurra o alvo por 50 unidades.','palm'],
 [0,'Punho Meteoro','Soco de 45 dano e explosão de 38 dano após 0,5s.','uppercut'],
 [43,'Passo Instantâneo','Avança até 160 unidades, remove imobilização e concede 0,25s de invulnerabilidade.','blink'],
 [5,'Aura Ascendente','Por 5s: +25% de movimento e +12 dano no ataque básico.','power'],
 [41,'Concentrar Ki','Concentra por 1s e recupera 25 MP. Permanece vulnerável.','gather'],
 [28,'Esfera do Universo','Reúne energia por 1,2s. Explosão de 340 dano em raio de 150 no ponto marcado.','spirit'],
 [31,'Leque de Kunais','Lança cinco kunais em leque; 17 dano cada.','throw'],
 [27,'Lâmina Relâmpago','Carrega a mão por 0,7s e dispara um raio de 80 dano. Lentidão de 1s.','lightning'],
 [2,'Substituição das Brumas','Avança 150 unidades. Deixa uma explosão de 35 dano após 0,65s.','substitute'],
 [37,'Clones das Brumas','Três clones por 4s, com 30 HP cada. Cada clone causa 9 dano a cada 1,1s.','seals'],
 [35,'Olho Intangível','Por 3,2s, reflete até dois projéteis. Não reflete áreas nem golpes de perto.','eye'],
 [48,'Kamui · Fenda Dupla','Após 0,9s, abre duas fendas no ponto marcado: 180 + 150 dano, com intervalo de 0,3s.','rift'],
 [18,'Onda da Lua','Corte de energia de 62 dano, com alcance de 450 unidades.','draw'],
 [3,'Tríade da Katana','Três cortes de 27 dano em arco. Intervalo de 0,18s entre os cortes.','triple'],
 [10,'Passo Cortante','Avança 210 unidades com 60 dano. Pilares interrompem o avanço.','thrust'],
 [14,'Lâmina Interior','Por 5s, cada básico gera um segundo golpe de 18 dano após 0,35s.','awaken'],
 [9,'Máscara Carmesim','Reduz dano recebido em 55% por 4s e movimento em 20%. Ao terminar: 35 dano + 40% do dano absorvido.','mask'],
 [1,'Mugetsu · Lua sem Luz','Ergue a katana por 1s e libera um corte negro de 360 dano em linha de 520 unidades.','moon'],
 [24,'Primeira Chama','Disparo flamejante de 60 dano. Queima por 3s: 5 dano a cada 0,5s.','flameDraw'],
 [45,'Ascensão Ardente','Dois cortes de 30 dano. O segundo empurra o inimigo.','rising'],
 [17,'Mar de Chamas','Quatro explosões em linha, com 28 dano cada, começando após 0,8s.','flameSweep'],
 [40,'Roda de Fogo','Chamas orbitam por 3s: 12 dano a cada 0,75s em inimigos a até 85 unidades.','wheel'],
 [36,'Respiração Solar','Recupera 30 Stamina e ganha 35% de movimento por 5s.','breathe'],
 [49,'Nona Forma · Dragão Solar','Prepara por 0,8s e avança até 330 unidades, atingindo os inimigos atravessados com 340 dano. Paredes interrompem o avanço.','dragon'],
 [34,'Azul · Atração','Campo de 2,4s que atrai, reduz movimento e causa 12 dano a cada 0,6s.','blue'],
 [4,'Vermelho · Repulsão','Carrega por 0,8s e lança uma onda de 85 dano em linha, com empurrão.','red'],
 [22,'Barreira do Infinito','Por 1,2s, anula projéteis em um raio de 100. Cada anulação acrescenta 20 dano ao próximo básico.','infinity'],
 [8,'Domínio do Eclipse','Três âncoras atraem o rival ao centro por 3s. Cada âncora tem 25 HP e pode ser destruída.','domain'],
 [15,'Dobra Espacial','Marca sua posição; retorna após 2s e recupera 12 MP. O dano recebido permanece.','fold'],
 [7,'Vazio Roxo · 200%','Une os núcleos por 1,2s e dispara um feixe de 350 dano em linha de 520 unidades.','purple'],
 [11,'Pedra · Punho Carregado','Por 5s, os próximos cinco ataques básicos ganham 22 dano.','rock'],
 [20,'Tesoura · Corte de Aura','Carrega por 0,7s, avança 160 unidades e atinge com 70 dano.','scissors'],
 [33,'Papel · Projeção de Aura','Projétil de 40 dano. Prende por 0,7s e cura metade do dano realmente causado.','paper'],
 [39,'Determinação do Caçador','Por 5s, seus básicos recuperam HP igual a 40% do dano realmente causado.','resolve'],
 [19,'Ten · Guarda de Aura','Três fragmentos de aura por 6s. Cada um bloqueia um projétil ou atinge um rival próximo com 24 dano.','ten'],
 [46,'Juramento · Potência Absoluta','Transforma a aura por 0,9s e desfere um golpe de 360 dano em um raio de 150 ao redor do corpo.','adult']
];
for(const c of CHAMPIONS){if(c.id>=6)continue;c.kit.forEach((id,slot)=>{const s=skills[id],spec=CHAMPION_TECHNIQUES.find(t=>t[0]===id);if(!s)return;Object.assign(s,{name:spec?.[1]??s.name,desc:spec?.[2]??s.desc,gesture:spec?.[3]??s.gesture??'power',champion:c.id,slot,ultimate:slot===5,color:c.color});if(s.ultimate){s.cost=0;s.cd=60;s.type='Ultimate';s.range=[380,340,520,330,520,150][c.id];s.desc+=' Ultimate: exige HP maior que zero e no máximo 20%; custa 0 MP; recarga de 60s.'}});if(SKINS[c.id]) Object.assign(SKINS[c.id],{desc:c.summary,color:c.color});}
let championRevealTimer=0,championPreview=null;
function currentChampion(){return CHAMPIONS[account.activeChampion]||null}
function championForKit(kit){return CHAMPIONS.find(c=>kit?.length===6&&c.kit.every((id,i)=>kit[i]===id))||null}
function syncChampionKit(){const c=currentChampion();selected=c?[...c.kit]:[];account.build=[...selected];account.owned=[...new Set(account.champions.flatMap(id=>CHAMPIONS[id].kit))];if(account.profile&&c)account.profile.skin=c.id;}
function normalizeChampions(){
 const migrated=account.championVersion!==1;
 if(migrated){account.champions=account.profile?[validSkin(account.profile.skin)]:[];account.activeChampion=account.champions[0]??null;account.championHistory=[];account.lastChampionDrop=null;account.championFirstDone=!!account.profile;account.championVersion=1;}
 account.champions=[...new Set((account.champions||[]).filter(id=>Number.isInteger(id)&&CHAMPIONS[id]))];
 if(!account.champions.includes(account.activeChampion))account.activeChampion=account.champions[0]??null;
 account.championFirstDone=account.champions.length>0;
 account.championHistory=(account.championHistory||[]).filter(h=>CHAMPIONS[h.id]&&Number.isFinite(h.at)).slice(0,20);
 syncChampionKit();if(account.profile)saveAccount();
}
function equipChampion(id,navigate=true){if(!account.champions.includes(id)||state==='fight'||state==='count')return false;const old=JSON.stringify(account);account.activeChampion=id;syncChampionKit();if(!saveAccount()){account=JSON.parse(old);syncChampionKit();announce('Não foi possível salvar a escolha.');return false}completeJourneyTask('build');if(navigate)showScreen('library');return true}
cleanOwnedKit=function(){return currentChampion()?[...currentChampion().kit]:[]};
validOwnedKit=function(kit){const c=currentChampion();return !!c&&account.champions.includes(c.id)&&kit?.length===6&&c.kit.every((id,i)=>kit[i]===id)};
const championOldShowScreen=showScreen;
showScreen=function(screen){if(account.profile&&!account.championFirstDone&&screen!=='profile'){showFirstSummon();return}if(account.profile)syncChampionKit();championOldShowScreen(screen);if(screen==='library')$('#loadout').hidden=true};
openProfile=function(){finishEchoSummon(true);profileAvatar=account.profile?.avatar||0;$('#profileScreen').hidden=false;$('#profileName').value=account.profile?.name||'';$('#cancelProfile').hidden=!account.profile;$('#profileError').textContent='';$('#profileScreen button[type="submit"]').textContent=account.profile?'Salvar nome e símbolo':'Continuar · primeira invocação ↗';renderAvatars()};
function showFirstSummon(){state='select';appScreen='first';document.body.dataset.screen='first';for(const id of ['profileScreen','homeScreen','shopScreen','selection','loadout','trainingScreen','leagueScreen','lobbyNav'])$('#'+id).hidden=true;$('#battle').style.display='none';$('#modeScreen').hidden=false;$('#modeScreen').innerHTML=`<section class="champ-first"><span class="eyebrow">ELDORIA · ARENA DOS CAMPEÕES</span><h1>Uma identidade.<br>Um novo destino.</h1><p>${escapeHTML(account.profile.name)}, invoque seu primeiro campeão.<br>Ele chega com cinco técnicas e uma ultimate próprias.</p><div class="champ-lineup">${CHAMPIONS.map(c=>`<span title="${c.name}">${skinPortrait(c.id)}</span>`).join('')}</div><div class="champ-seal" aria-hidden="true">${avatarSVG(account.profile.avatar)}</div><p>Os seis campeões têm a mesma chance: 1 em 10.</p><button id="firstChampionSummon" class="gold">Invocar meu primeiro campeão · GRÁTIS</button><div id="champFirstResult" role="status"></div></section>`;$('#firstChampionSummon').onclick=()=>summonChampion('first');loadSkinAtlas();scrollTo(0,0)}
function championCard(c,shop=false){const owned=account.champions.includes(c.id),active=account.activeChampion===c.id;return `<article class="champ-card ${active?'active':''}" style="--champ-color:${c.color}"><div class="champ-card-top"><span>${active?'EM CAMPO':owned?'INVOCADO':'A DESPERTAR'}</span><b>0${c.id+1}</b></div><div class="champ-portrait">${IMPORTED_CHAMPION_PORTRAITS[c.id]?`<img class="imported-champion-art" src="${IMPORTED_CHAMPION_PORTRAITS[c.id]}" alt="${c.name}">`:skinPortrait(c.id)}</div><span class="eyebrow">${c.weapon}</span><h2>${c.name}</h2><p class="champ-reference">Inspiração: ${c.ref}</p><p>${c.style}</p>${kitPreview(c.kit)}<div class="champ-ult-note">VI · ${c.ult}<small>ULTIMATE · HP ≤ 20%</small></div><div class="champ-actions"><button class="ghost" data-champ-details="${c.id}">Ver 6 habilidades</button>${owned?`<button class="${active?'ghost':'gold'}" data-champ-equip="${c.id}" ${active?'disabled':''}>${active?'Selecionado':'Selecionar'}</button>`:shop?`<button class="gold" data-champ-buy="${c.id}" ${account.crystals<300?'disabled':''}>300 ◇</button>`:'<button class="gold" data-nav="shop">Invocar</button>'}</div></article>`}
renderSelection=function(){syncChampionKit();$('#selection').innerHTML=appHeader()+`<div class="section-head"><button class="ghost" data-nav="home">← Início</button><span class="eyebrow">DEZ CAMPEÕES · SESSENTA HABILIDADES</span><h1>Seus campeões.</h1><p>Cada campeão tem cinco técnicas e uma ultimate exclusiva. Selecioná-lo equipa seu kit completo.</p><p class="notice">Coleção: ${account.champions.length}/10 · Ultimate: só pode ser ativada com 20% de HP ou menos. Se recuperar HP acima desse limite, ela volta a bloquear.</p></div><div class="champ-grid">${CHAMPIONS.map(c=>championCard(c)).join('')}</div><p class="champ-help">PC: WASD · J ataque · K defesa · Espaço esquiva · 1–6 habilidades.<br>Celular: analógico para mover; arraste a habilidade para direcionar.</p>`;$('#selection').onclick=null;$('#loadout').hidden=true;hydrateSkillIcons()};
function championSkillsMarkup(c){return `<div class="champ-skill-list">${c.kit.map((id,i)=>{const s=skills[id];return `<article class="${s.ultimate?'champ-ultimate':''}"><button class="champ-skill-icon" data-champ-demo="${id}" aria-label="Animar ${s.name}">${icon(id)}<b>${i+1}</b></button><div><h3>${s.name}${s.ultimate?' <small>ULT</small>':''}</h3><p>${s.desc}</p><span>${s.cost} MP · ${s.cd}s de recarga</span></div></article>`}).join('')}</div>`}
function openChampionDetails(id){const c=CHAMPIONS[id];if(!c)return;loadSkinAtlas();loadSkillSprites(c.kit);championPreview={id:c.kit[0],champion:id,start:performance.now(),actor:actor(0,0,[...c.kit],c.color),cycle:-1};championPreview.actor.skin=id;$('#detailDialog').innerHTML=`<div class="dialog champ-detail" role="dialog" aria-modal="true" aria-labelledby="championTitle"><button class="ghost champ-close" id="closeChampionDetail">Fechar ×</button><span class="eyebrow">${c.title}</span><h2 id="championTitle">${c.name}</h2><p>Inspiração: ${c.ref} · ${c.weapon}</p><canvas id="championDemo" width="600" height="220" aria-label="Prévia animada do campeão e sua habilidade"></canvas><p id="championDemoLabel" class="champ-demo-label"></p><p class="champ-demo-hint">Toque no ícone de cada habilidade para ver o gesto do campeão.</p>${championSkillsMarkup(c)}</div>`;$('#detailDialog').hidden=false;$('#closeChampionDetail').onclick=()=>{$('#detailDialog').hidden=true;championPreview=null};hydrateSkillIcons()}
showDetail=function(id){const s=skills[id];if(s?.champion!==undefined)openChampionDetails(s.champion)};
openEcoPreview=function(id){showDetail(id);if(championPreview){championPreview.id=id;championPreview.start=performance.now();championPreview.cycle=-1}};
function championRewardMarkup(d){const c=CHAMPIONS[d?.id];return c?`<div class="champ-result" style="--champ-color:${c.color}"><div class="champ-portrait">${IMPORTED_CHAMPION_PORTRAITS[c.id]?`<img class="imported-champion-art" src="${IMPORTED_CHAMPION_PORTRAITS[c.id]}" alt="${c.name}">`:skinPortrait(c.id)}</div><span class="eyebrow">${d.duplicate?'ENCONTRO REPETIDO · +60 CRISTAIS':'CAMPEÃO INVOCADO'}</span><h2>${c.name}</h2><p>${c.weapon} · ${c.style}</p>${kitPreview(c.kit)}<p>Ultimate: <b>${c.ult}</b></p><button class="ghost" data-champ-details="${c.id}">Conhecer habilidades</button>${account.activeChampion!==c.id?`<button class="gold" data-champ-equip="${c.id}">Selecionar campeão</button>`:''}</div>`:'<div class="champ-empty-seal">✧<p>Qual campeão responderá ao seu chamado?</p></div>'}
renderShop=function(){const d=account.lastChampionDrop;$('#shopScreen').innerHTML=appHeader()+`<div class="section-head"><button class="ghost" data-nav="home">← Início</button><span class="eyebrow">UM CHAMADO · DEZ DESTINOS</span><h1>Loja dos Campeões.</h1><p>Cada invocação entrega um personagem e suas seis habilidades.</p></div><div class="champ-shop-layout"><section class="panel"><span class="eyebrow">ALTAR DE INVOCAÇÃO</span><h2>Desperte um campeão.</h2><p>Chances iguais: <b>1 em 10 (16,67%)</b> para cada campeão. Repetidos rendem 60 cristais.</p><div id="championSummonStage" class="champ-summon-stage">${championRewardMarkup(d)}</div><div class="shop-actions"><button class="gold" id="freeSpin">Invocação diária grátis</button><button class="ghost" id="paidSpin">Invocar · 1.000 moedas</button></div><p id="dailyTimer"></p><div id="spinMessage" role="status"></div><p class="notice">A primeira invocação é gratuita. Depois, você também tem uma invocação grátis por dia, à meia-noite local.</p>${championHistoryMarkup()}</section><section class="panel"><span class="eyebrow">ESCOLHA GARANTIDA</span><h2>Quem falta na sua equipe?</h2><p>Troque 300 cristais pelo campeão escolhido. Repetidos não aumentam atributos.</p><div class="champ-exchange-list">${CHAMPIONS.map(c=>`<article>${skinPortrait(c.id)}<div><b>${c.name}</b><small>${account.champions.includes(c.id)?'Na coleção':'300 cristais'}</small></div><button class="ghost" data-champ-buy="${c.id}" ${account.champions.includes(c.id)||account.crystals<300?'disabled':''}>${account.champions.includes(c.id)?'Obtido':'Trocar'}</button></article>`).join('')}</div><p data-daily-income>${dailyIncomeText()}</p></section></div><div class="champ-grid">${CHAMPIONS.map(c=>championCard(c,true)).join('')}</div>`;$('#freeSpin').onclick=()=>summonChampion('daily');$('#paidSpin').onclick=()=>summonChampion('paid');refreshDaily();hydrateSkillIcons()};
function championHistoryMarkup(){return `<details class="shop-history"><summary>Últimas invocações</summary>${account.championHistory.map(h=>`<p><b>${CHAMPIONS[h.id].name}</b><br>${new Date(h.at).toLocaleString('pt-BR')} · ${h.kind==='paid'?'1.000 moedas':h.kind==='exchange'?'300 cristais':'Grátis'} · ${h.duplicate?'+60 cristais':'Novo campeão'}</p>`).join('')||'<p>Seu próximo chamado aparecerá aqui.</p>'}</details>`}
refreshDaily=function(){refreshLobbyDaily();refreshIncomeUI();if(appScreen!=='shop'||$('#shopScreen').hidden)return;const free=$('#freeSpin'),paid=$('#paidSpin');if(!free||!paid)return;free.disabled=spinBusy||!dailyAvailable();paid.disabled=spinBusy||account.coins<SPIN_COST;$('#dailyTimer').textContent=dailyAvailable()?'Invocação grátis disponível.':'Próxima invocação grátis em '+nextDailyText()};
function summonChampion(kind='paid',specific=null){
 if(spinBusy||!account.profile||!['first','daily','paid','exchange'].includes(kind))return null;
 if(kind==='first'&&account.championFirstDone||kind!=='first'&&!account.championFirstDone)return null;
 if(kind==='daily'&&!dailyAvailable()||kind==='paid'&&account.coins<SPIN_COST||kind==='exchange'&&(!CHAMPIONS[specific]||account.champions.includes(specific)||account.crystals<300))return null;
 const before=JSON.stringify(account),id=kind==='exchange'?specific:Math.min(5,Math.floor(random01()*6)),duplicate=account.champions.includes(id),now=Date.now();
 if(kind==='paid')account.coins-=SPIN_COST;if(kind==='daily')account.lastFreeDay=dayKey(now);if(kind==='exchange')account.crystals-=300;
 if(duplicate)account.crystals+=60;else account.champions.push(id);
 if(kind==='first'){account.activeChampion=id;account.championFirstDone=true;}
 account.lastSeen=Math.max(account.lastSeen,now);const d={id,duplicate,kind,at:now};account.lastChampionDrop=d;account.championHistory.unshift(d);account.championHistory=account.championHistory.slice(0,20);syncChampionKit();
 if(!saveAccount()){account=JSON.parse(before);syncChampionKit();const el=$('#spinMessage')||$('#champFirstResult');if(el)el.textContent='Não foi possível salvar a invocação. Nenhum recurso foi gasto.';return null}
 spinBusy=true;clearTimeout(championRevealTimer);
 if(kind==='first'){const el=$('#champFirstResult');el.innerHTML=championRewardMarkup(d)+'<button class="gold" id="enterChampionLobby">Entrar na Arena dos Campeões ↗</button>';$('#firstChampionSummon').hidden=true;$('#enterChampionLobby').onclick=()=>{spinBusy=false;clearTimeout(championRevealTimer);$('#modeScreen').hidden=true;showScreen('home')};el.scrollIntoView({block:'nearest',behavior:'smooth'});}else{renderShop();$('#championSummonStage').classList.add('revealing');$('#spinMessage').textContent=duplicate?'Campeão repetido convertido em 60 cristais.':'Campeão e seis habilidades adicionados à coleção.'}
 hydrateSkillIcons();championRevealTimer=setTimeout(()=>{spinBusy=false;refreshDaily()},1100);return d;
}
spinEcho=free=>summonChampion(free?'daily':'paid');
exchangeEcho=id=>{const s=skills[id];return s?.champion!==undefined?!!summonChampion('exchange',s.champion):false};
function requestChampionExchange(id){const c=CHAMPIONS[id];if(!c||account.champions.includes(id)||account.crystals<300||spinBusy)return false;shopPending={type:'champion',id};$('#shopConfirm').innerHTML=`<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="purchaseTitle"><span class="eyebrow">CONFIRMAR INVOCAÇÃO</span><h2 id="purchaseTitle">${c.name}</h2><p>Campeão completo + suas seis habilidades.</p><p>Preço: <b>300 cristais</b><br>Saldo após a troca: ${account.crystals-300}</p><button class="ghost" id="cancelPurchase">Cancelar</button><button class="gold" id="confirmPurchase">Confirmar troca</button></div>`;$('#shopConfirm').hidden=false;$('#cancelPurchase').onclick=closeShopConfirm;$('#confirmPurchase').onclick=()=>{closeShopConfirm();showScreen('shop');summonChampion('exchange',id)};return true}
renderLobbyBuild=function(){const c=currentChampion();if(!c)return;$('#lobbyBuild').innerHTML=`<div class="lobby-build-head"><button class="lobby-cycle" data-cycle-build="-1" ${account.champions.length<2?'disabled':''} aria-label="Campeão anterior">${lobbyIcon('chevron')}</button><button class="lobby-build-title" data-nav="library"><small>CAMPEÃO SELECIONADO</small><strong>${c.name}</strong></button><button class="lobby-cycle next" data-cycle-build="1" ${account.champions.length<2?'disabled':''} aria-label="Próximo campeão">${lobbyIcon('chevron')}</button></div><button class="lobby-build-icons" data-champ-details="${c.id}" aria-label="Ver as seis habilidades">${c.kit.map((id,i)=>`<span title="${skills[id].name}" class="${i===5?'champ-ult-icon':''}">${icon(id)}${i===5?'<small>ULT</small>':''}</span>`).join('')}</button><div class="lobby-build-foot"><span>5 técnicas + 1 ultimate · HP ≤ 20%</span><button data-nav="library">Trocar campeão ${lobbyIcon('edit')}</button></div>`};
cycleLobbyBuild=function(direction){const n=account.champions.length;if(n<2)return false;const index=account.champions.indexOf(account.activeChampion);if(!equipChampion(account.champions[(index+direction+n)%n],false))return false;renderHome();return true};
renderBuildSlots=function(){};
renderCollectionProgress=function(){};
loadBuildSlot=function(){return false};
saveBuildSlot=function(){return false};
journeyMarkup=function(){const j=account.journey;return `<section class="journey-card"><span class="eyebrow">PRIMEIROS PASSOS</span><h2>Conheça seu campeão.</h2><div class="journey-tasks">${[['training','Cause 300 de dano no Dojo','training'],['duel','Conclua um duelo','home'],['build','Selecione um campeão','library']].map(([k,t,nav])=>`<div><span>${j[k]?'✓':'○'} ${t}</span>${!j[k]?`<button class="ghost" data-nav="${nav}">Ir ↗</button>`:''}</div>`).join('')}</div>${j.claimed?'<p>Recompensa recebida.</p>':journeyReady()?'<button class="gold" data-journey-claim="-1">Receber 125 cristais</button>':'<p>Conclua os três objetivos para receber 125 cristais.</p>'}</section>`};
wishMarkup=function(){return ''};
claimJourney=function(id){if(id!==-1||!journeyReady()||account.journey.claimed)return false;const old=JSON.stringify(account);account.journey.claimed=true;account.crystals+=125;if(!saveAccount()){account=JSON.parse(old);return false}renderHome();return true};
renderTraining=function(){const c=currentChampion();$('#trainingScreen').innerHTML=appHeader()+`<div class="section-head"><button class="ghost" data-nav="home">← Início</button><span class="eyebrow">PRATIQUE CADA MOVIMENTO</span><h1>Dojo dos Campeões.</h1><p>${c.name} · Kit fixo de seis habilidades.</p></div><div class="progression-grid"><section class="panel">${championSkillsMarkup(c)}<button class="ghost" data-nav="library">Trocar campeão</button></section><section class="panel"><h2>Fantoche de madeira.</h2>${practiceSettingsMarkup('setup')}<p>O treino não dá moedas. A ultimate mantém a regra de 20% de HP; use o botão de teste na pausa para reduzir seu HP ao limite.</p><button class="gold" data-progression="training">Entrar no treinamento ↗</button></section></div>`;hydrateSkillIcons()};
const championPrepareProgression=prepareProgressionMatch;
prepareProgressionMatch=function(){championPrepareProgression();if(battleActivity==='training')$('#trainingPause').insertAdjacentHTML('beforeend','<button class="gold" data-test-ultimate>Testar ultimate · ajustar HP para 20%</button>')};
for(let i=0;i<LEAGUE_RIVALS.length;i++){LEAGUE_RIVALS[i].kit=[...CHAMPIONS[i].kit];LEAGUE_RIVALS[i].name=CHAMPIONS[i].name;LEAGUE_RIVALS[i].tip='Observe a preparação da ultimate quando o rival estiver com 20% de HP ou menos.'}
ARENA_MODES.mirror.copy='Você e o rival usam o mesmo campeão e suas seis habilidades.';
const championOriginalPrepareArena=prepareArenaMode;
prepareArenaMode=function(){championOriginalPrepareArena();for(const a of actors){if(a.boss||a.trainingDummy)continue;const c=championForKit(a.kit)||CHAMPIONS[validSkin(a.skin)];a.kit=[...c.kit];a.skin=c.id;a.champion=c.id;if(a!==p)a.label=c.name;a.ultActive=false;a.ultimateDashHits=null;}if(['mirror','daily'].includes(arenaModeId)&&!b.boss){b.kit=[...p.kit];b.skin=p.skin;b.champion=p.skin;b.label=CHAMPIONS[p.skin].name}};
const championOldSpawn=spawnModeActor;
spawnModeActor=function(...args){const a=championOldSpawn(...args),c=championForKit(a.kit)||CHAMPIONS[Math.floor(Math.random()*CHAMPIONS.length)];a.kit=[...c.kit];a.skin=c.id;a.champion=c.id;return a};
function canUseUltimate(a){return a&&a.hp>0&&a.hp<=a.max*.2}
const championOldCastCore=castCore;
castCore=function(a,id,manual){const s=skills[id];if(!a||!s||s.champion!==a.skin||!a.kit.includes(id))return false;if(!s.ultimate)return championOldCastCore(a,id,manual);if(!canUseUltimate(a)){if(a===p)toast('Ultimate bloqueada · exige HP de 20% ou menos');return false}if(state!=='fight'||!opponents(a).length||a.cd[id]>0||a.cast>0||a.dash>0||a.guard||a.skillLock>0||a.actionRecovery>0||a.punchTime>0)return false;
 const angle=aim(a,manual),c=CHAMPIONS[a.skin],range=s.range,e=enemy(a),d=manual===undefined?Math.min(range,dist(a,e)):range,tx=clamp(a.x+Math.cos(angle)*d,55,W-55),ty=clamp(a.y+Math.sin(angle)*d,55,H-55),charge=[1.2,.9,1,.8,1.2,.9][c.id];a.a=angle;a.cd[id]=s.cd;a.cast=charge;a.ultActive=true;a.ultimateUntil=clock+charge+1;a.skillLock=charge+.65;a.guard=false;a.champAction={id,start:vfxTime,duration:charge+1,angle};
 vfxEmit('charge',id,a.x,a.y,{r:65,owner:a,follow:a,angle,duration:charge});if(a===p)toast('ULTIMATE · '+s.name);else float(a.x,a.y-55,'ULTIMATE',c.color);combatSound('heavy',1.2);
 const alive=()=>a.hp>0&&state==='fight';
 if(c.id===0||c.id===1){const radius=c.id===0?150:115;telegraph(a,tx,ty,radius,charge,()=>{if(!alive())return;area(a,tx,ty,radius,c.id===0?340:180,c.color);combatImpact(2);if(c.id===1)delay(.3,()=>{if(alive())area(a,tx,ty,radius,150,c.color)})},c.color)}
 else if(c.id===2||c.id===4){const x=a.x,y=a.y;zones.push({owner:a,kind:'line',x,y,a:angle,len:520,r:45,life:charge,max:charge,color:c.color});delay(charge,()=>{if(!alive())return;let length=520;for(let d=0;d<520;d+=7)if(blocked(x+Math.cos(angle)*d,y+Math.sin(angle)*d)){length=d;break}const ex=x+Math.cos(angle)*length,ey=y+Math.sin(angle)*length;fx.push({kind:'beam',x,y,ex,ey,r:45,color:c.color,life:.7,max:.7});for(const target of opponents(a))if(lineDistance(target.x,target.y,x,y,ex,ey)<45+target.r)hit(target,c.id===2?360:350,a,50,angle,id);combatImpact(2)})}
 else if(c.id===3){delay(charge,()=>{if(!alive())return;a.dash=.44;a.dashA=angle;a.dashSpeed=750;a.dashDmg=0;a.dashHit=false;a.ultimateDashHits=new Set();a.vfxDash=id;a.vfxTrail=[];a.vfxTrailClock=0})}
 else telegraph(a,a.x,a.y,150,charge,()=>{if(alive()){expansionPulse(a,a.x,a.y,150,360,id,{knock:90});combatImpact(2)}},c.color);
 return true;
};
const championOldCast=cast;
cast=function(a,id,manual){const result=championOldCast(a,id,manual);if(result){const s=skills[id];a.champAction={id,start:vfxTime,duration:s.ultimate?Math.max(1.6,a.cast+1):Math.max(.72,a.cast+.42),angle:a.a};}return result};
const championOldStep=step;
step=function(dt){const old=actors.map(a=>({a,x:a.x,y:a.y,dashing:a.dash>0}));championOldStep(dt);if(state!=='fight')return;for(const entry of old){const a=entry.a;if(a.hp<=0)continue;if(a.ultimateDashHits&&entry.dashing){for(const target of opponents(a))if(!a.ultimateDashHits.has(target)&&lineDistance(target.x,target.y,entry.x,entry.y,a.x,a.y)<44&&lineClear(a,target)){a.ultimateDashHits.add(target);hit(target,340,a,65,a.dashA,49)}if(a.dash<=0)a.ultimateDashHits=null;}if(a.champAction&&vfxTime-a.champAction.start>a.champAction.duration)a.champAction=null;if(clock>a.ultimateUntil)a.ultActive=false;}}
const championOldControlState=skillControlState;
skillControlState=function(a,s){const u=championOldControlState(a,s);if(s.ultimate&&!canUseUltimate(a)){u.ready=false;u.locked=true;u.text='HP ≤20%'}return u};
const championOldUpdateUI=updateUI;
updateUI=function(){championOldUpdateUI();if(!p)return;$('#attack small').textContent=p.actionRecovery>0?'RECUPERA':p.skin===2||p.skin===3?'CORTE':'ATAQUE';document.querySelectorAll('.skill').forEach((el,i)=>{const s=skills[p.kit[i]];el.classList.toggle('ultimate-skill',!!s?.ultimate);el.classList.toggle('ultimate-ready',!!s?.ultimate&&skillControlState(p,s).ready);el.querySelector('.hotkey').textContent=s?.ultimate?'ULT':i+1});$('#resText').textContent+=' · ULT '+(canUseUltimate(p)?'LIBERADA':'≤ '+Math.floor(p.max*.2)+' HP')};
const championOldBindSkill=bindSkill;
bindSkill=function(btn,index){btn.addEventListener('pointerdown',e=>{if(skills[p?.kit[index]]?.ultimate&&!canUseUltimate(p)){toast('Ultimate bloqueada · exige HP de 20% ou menos');e.stopImmediatePropagation()}});championOldBindSkill(btn,index)};
const championOldPunch=punch;
punch=function(a,angle,dmg){if(a.skin===2||a.skin===3){a.a=angle;a.punchTime=.24;a.punchSide=a.combo===2?-1:1;return slash(a,angle,76,dmg,CHAMPIONS[a.skin].color,1.6)}return championOldPunch(a,angle,dmg)};
const championOldFighterMotion=fighterMotion;
fighterMotion=function(a,t){const m=championOldFighterMotion(a,t),action=a.champAction;if(!action)return m;const s=skills[action.id],age=t-action.start;if(age<0||age>action.duration)return m;const u=Math.floor(clamp(age/action.duration,0,.999)*24)/23,power=Math.sin(Math.PI*u),slot=s.slot; m.championAction={s,u,power,angle:action.angle};m.kind='champion';m.pose=u<.22?5:u<.72?(slot%2?3:4):0;
 if(['blink','substitute','thrust','dragon','scissors'].includes(s.gesture)){m.pose=u<.7?6:7;m.lean=Math.cos(action.angle)*.16*power;m.x+=Math.cos(action.angle)*6*power;m.y+=Math.sin(action.angle)*6*power;}
 else if(['draw','triple','flameDraw','rising','flameSweep','wheel','moon'].includes(s.gesture)){m.lean=(slot%2?-1:1)*Math.sin(u*Math.PI*2)*.17;m.x+=Math.cos(action.angle)*4*power;m.y-=power*2;m.pose=u<.3?3:u<.8?4:0;}
 else if(s.ultimate){m.y-=power*(s.champion===5?10:6);m.sx*=1+power*(s.champion===5?.13:.03);m.sy*=1+power*(s.champion===5?.16:.03);m.pose=u<.6?5:4;}
 else {m.lean+=(slot-2)*.025*power;m.y-=power*(slot===3?3:1);m.pose=u<.3?5:u<.8?4:0;}
 return m;
};
function drawChampionIdentity(g,a,m,t,front){const c=CHAMPIONS[validSkin(a.skin)],act=m.championAction,s=act?.s,u=act?.u||0,pow=act?.power||0,angle=act?.angle??m.angle,alpha=g.globalAlpha;g.save();g.strokeStyle=c.color;g.fillStyle=c.color;g.lineCap='round';
 const line=(x,y,xx,yy,w=2)=>{g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke()};
 if(!front&&act){g.globalAlpha=alpha*(s.ultimate?.65:.24)*Math.sin(Math.PI*Math.max(.02,u));g.lineWidth=s.ultimate?3:1.5;g.beginPath();g.ellipse(0,14,24+pow*18,12+pow*8,0,0,TAU);g.stroke();if(s.ultimate){for(let i=0;i<8;i++){const q=i*TAU/8+t*1.7;line(Math.cos(q)*32,12+Math.sin(q)*18,Math.cos(q)*(42+pow*12),12+Math.sin(q)*(25+pow*8),2)}}}
 if(!front){g.restore();return}
 if(c.id===2||c.id===3||c.id===1){const sword=c.id!==1,base=sword?34:18,handX=Math.cos(angle)*19,handY=Math.sin(angle)*16+6;let swing=angle+(a.punchTime>0?Math.sin((1-a.punchTime/.24)*Math.PI)*1.4-.7:act?(u<.25?-.9:Math.sin(u*Math.PI*2)*1.3):.55);g.save();g.translate(handX,handY);g.rotate(swing);g.strokeStyle='#0a171c';line(-6,0,base,0,sword?7:5);g.strokeStyle=c.id===2?'#29344a':'#f5dfb3';line(1,0,base,0,sword?4:2);g.strokeStyle=c.color;line(4,-1,base,-1,1.4);g.strokeStyle='#d8b16a';line(0,-5,0,5,2);g.strokeStyle='#bba27b';line(-7,0,0,0,4);if(c.id===3&&(act||a.punchTime>0)){g.strokeStyle='#ff964d';g.globalAlpha=alpha*.65;for(let i=0;i<4;i++)line(8+i*6,0,12+i*6,-6-Math.sin(t*18+i)*3,2)}g.restore()}
 if(act){const x=Math.cos(angle)*25,y=Math.sin(angle)*20+2;g.strokeStyle=c.color;g.fillStyle=c.color;g.globalAlpha=alpha*Math.min(1,(1-u)*3);g.lineWidth=2;
 if(c.id===0){const r=s.gesture==='spirit'?8+pow*27:s.gesture==='gather'?7+pow*7:4+pow*10,yy=s.gesture==='spirit'?-38:y;g.beginPath();g.arc(s.gesture==='spirit'?0:x,yy,r,0,TAU);g.stroke();g.globalAlpha*=.35;g.fill();if(s.gesture==='power')for(let i=0;i<5;i++)line(-25+i*12,18,-23+i*12,-24-Math.sin(t*13+i)*8);}
 if(c.id===1){if(['eye','rift'].includes(s.gesture)){g.beginPath();g.ellipse(-2,-17,7,3,0,0,TAU);g.stroke();for(let i=0;i<3;i++){const q=t*4+i*TAU/3;line(Math.cos(q)*5-2,Math.sin(q)*3-17,Math.cos(q)*10-2,Math.sin(q)*6-17)}}else if(s.gesture==='seals'){line(-9,2,7,-9,3);line(9,2,-7,-9,3);g.strokeRect(-13,-14,26,24)}else if(s.gesture==='lightning')for(let i=0;i<3;i++){g.beginPath();g.moveTo(x-8,y+i*4);g.lineTo(x+pow*12,y-7+i*6);g.lineTo(x+3,y+5);g.lineTo(x+18,y-10+i*6);g.stroke()}}
 if(c.id===2&&['mask','awaken','moon'].includes(s.gesture)){g.strokeStyle=s.gesture==='moon'?'#d49dff':'#f1d0c0';g.beginPath();g.arc(0,-14,12,-.2,Math.PI*1.25);g.stroke();if(s.ultimate){line(-21,22,-34,-25,3);line(21,22,34,-25,3)}}
 if(c.id===3){g.strokeStyle='#ffb153';const r=26+pow*10;g.beginPath();g.arc(0,4,r,t*5,t*5+Math.PI*(s.ultimate?1.7:1));g.stroke();if(s.gesture==='dragon'){g.lineWidth=4;g.beginPath();g.moveTo(-40,25);g.bezierCurveTo(-55,-38,40,-44,45,0);g.stroke()}}
 if(c.id===4){const r=4+pow*7;for(const side of [-1,1]){g.fillStyle=side<0?'#65c7ff':'#ff7999';g.beginPath();g.arc(side*(s.ultimate?20*(1-u):17),-7,r,0,TAU);g.fill()}if(s.ultimate||s.gesture==='infinity'){g.strokeStyle='#d1b2ff';g.lineWidth=2;g.beginPath();g.ellipse(0,-3,28+pow*5,15,Math.sin(t*3),0,TAU);g.stroke()}if(s.gesture==='domain'){line(-5,2,5,-17,2);line(5,2,-5,-17,2)}}
 if(c.id===5){const r=s.ultimate?12+pow*15:6+pow*10;g.lineWidth=3;g.beginPath();g.arc(x,y,r,0,TAU);g.stroke();if(s.gesture==='scissors'){line(x,y,x+19,y-12,3);line(x,y,x+22,y+3,3)}else if(s.gesture==='paper'){for(let i=0;i<4;i++)line(x-5+i*4,y,x-4+i*5,y-14,2)}else if(s.ultimate){for(let i=0;i<5;i++)line(-12+i*6,-25,-10+i*5,-47-Math.sin(t*8+i)*9,3)}}
 }
 g.restore();
}
const championOldAccents=drawFighterAccents;
drawFighterAccents=function(g,a,m,t,front){championOldAccents(g,a,m,t,front);drawChampionIdentity(g,a,m,t,front)};
drawEcoPreview=function(t){if(!championPreview||$('#detailDialog').hidden||!$('#championDemo'))return;const v=championPreview,s=skills[v.id],a=v.actor,g=$('#championDemo').getContext('2d'),sec=(t-v.start)/1000,phase=sec%2.7,cycle=Math.floor(sec/2.7);if(cycle!==v.cycle){v.cycle=cycle;a.champAction={id:s.id,start:cycle*2.7,duration:s.ultimate?2:1.2,angle:0};}g.clearRect(0,0,600,220);g.fillStyle='#0a211d';g.fillRect(0,0,600,220);g.strokeStyle='#1d3930';for(let x=0;x<600;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,220);g.stroke()}g.save();g.translate(125,118);drawAnimatedFighter(g,a,120,sec);g.restore();g.fillStyle='#d6b98b';g.fillRect(470,90,15,65);g.fillRect(452,103,51,10);if(hasSkillSprite(s.id)&&phase<2){const r=s.ultimate?155:95,x=['Defesa','Mobilidade'].includes(s.type)?125:210+Math.min(1,phase/1.2)*260;g.drawImage(ensureSkillSprite(s.id).image,...skillSpriteRect(s.id,paintedFrame(Math.min(.999,phase/2),false)),x-r/2,113-r/2,r,r)}$('#championDemoLabel').textContent=s.name+(s.ultimate?' · ULT · HP ≤20%':' · '+s.cost+' MP')};
function initChampions(){
 normalizeChampions();
 $('#profileScreen .skin-section').hidden=true;$('#profileScreen h1').textContent='Seu nome na arena.';$('#profileScreen p').textContent='Escolha seu nome e símbolo. Na próxima etapa, invoque seu primeiro campeão.';$('#profileScreen button[type="submit"]').textContent=account.profile?'Salvar nome e símbolo':'Continuar · primeira invocação ↗';
 document.addEventListener('click',e=>{const equip=e.target.closest('[data-champ-equip]');if(equip){$('#detailDialog').hidden=true;equipChampion(Number(equip.dataset.champEquip))}const detail=e.target.closest('[data-champ-details]');if(detail)openChampionDetails(Number(detail.dataset.champDetails));const buy=e.target.closest('[data-champ-buy]');if(buy)requestChampionExchange(Number(buy.dataset.champBuy));const demo=e.target.closest('[data-champ-demo]');if(demo){const id=Number(demo.dataset.champDemo);if(!championPreview||$('#detailDialog').hidden)openChampionDetails(skills[id].champion);championPreview.id=id;championPreview.start=performance.now();championPreview.cycle=-1;}if(e.target.closest('[data-test-ultimate]')&&battleActivity==='training'){p.hp=p.max*.2;p.cd[p.kit[5]]=0;updateUI();toast('HP ajustado para 20% · retome o treino e use a ultimate')}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#detailDialog').hidden){$('#detailDialog').hidden=true;championPreview=null}});
}
const NINJA_SHEETS=["", "", "", "", "", ""];
const NINJA_ART=NINJA_SHEETS[0];
const NINJA_IDS=[31,27,2,37,35,48];
const NINJA_KIT=[
 ['Estocada da Tempestade','Carrega eletricidade por 0,35s e avança até 220 unidades. Causa 85 dano ao primeiro rival atingido. Obstáculos interrompem a investida.',22,9,220,'lightning'],
 ['Reflexo Voltaico','Deixa uma cópia elétrica com 30 HP por até 4s. Ao receber um golpe, explode: 55 dano em raio de 100 e imobilização de 0,7s.',25,13,180,'seals'],
 ['Matilha do Nevoeiro','Invoca três cães espectrais por 4s, cada um com 28 HP. Mordidas causam 8 dano a cada 1,1s e prendem por 0,25s.',30,18,450,'seals'],
 ['Baluarte de Ardósia','Ergue uma parede por 4s, a 90 unidades à frente. Bloqueia movimento e projéteis de ambos os lados.',24,14,90,'power'],
 ['Fenda do Véu','Abre uma fenda no ponto marcado por 2,4s. Atrai e reduz movimento; causa 15 dano a cada 0,6s, até 60 dano.',30,16,320,'rift'],
 ['Avatar da Tempestade','Manifesta um guardião espectral por 0,9s de preparo e lança três lâminas dimensionais em leque: 120 dano cada. Ultimate: exige HP maior que zero e no máximo 20%; custa 0 MP; recarga de 60s.',0,60,520,'rift']
];
for(let i=0;i<6;i++){const s=skills[NINJA_IDS[i]],v=NINJA_KIT[i];Object.assign(s,{name:v[0],desc:v[1],cost:v[2],cd:v[3],range:v[4],gesture:v[5],type:i===5?'Ultimate':i===3?'Defesa':i===4?'Controle':'Ataque'});}
Object.assign(CHAMPIONS[1],{ult:NINJA_KIT[5][0],title:'O sentinela do véu',weapon:'Adagas e energia da tempestade',style:'Relâmpago, armadilhas e guardião espectral',summary:'Combina uma investida elétrica, cópia de energia, cães do nevoeiro, parede de ardósia e fenda espacial. Seu guardião lança lâminas dimensionais.'});
for(const [id,name]of [[1,'Lua sem Luz'],[19,'Couraça de Aura']])skills[id].name=name;
CHAMPIONS[2].ult='Lua sem Luz';
const ninjaOldCard=championCard;
championCard=function(...args){return ninjaOldCard(...args).replace(/<p class="champ-reference">[\s\S]*?<\/p>/,'')};
const ninjaOldDetails=openChampionDetails;
openChampionDetails=function(id){ninjaOldDetails(id);const p=document.querySelector('.champ-detail>p');if(p)p.textContent=CHAMPIONS[id].weapon};
let ninjaEffects=[];
function ninjaFx(row,x,y,life=.8,size=120,angle=0,follow=null){ninjaEffects.push({row,x,y,life,max:life,size,angle,follow});}
const ninjaOldCore=castCore;
castCore=function(a,id,manual){if(a?.skin!==1)return ninjaOldCore(a,id,manual);const s=skills[id];if(!s||!NINJA_IDS.includes(id)||!a.kit.includes(id)||state!=='fight'||a.hp<=0||!opponents(a).length||a.cd[id]>0||a.mp<s.cost||a.cast>0||a.dash>0||a.guard||a.skillLock>0||a.actionRecovery>0||a.punchTime>0)return false;if(s.ultimate&&!canUseUltimate(a)){if(a===p)toast('Ultimate bloqueada · exige HP de 20% ou menos');return false}
 const row=NINJA_IDS.indexOf(id),angle=aim(a,manual),e=enemy(a),d=manual===undefined?Math.min(s.range,dist(a,e)):s.range,tx=clamp(a.x+Math.cos(angle)*d,55,W-55),ty=clamp(a.y+Math.sin(angle)*d,55,H-55);a.a=angle;a.mp-=s.cost;a.cd[id]=s.cd;a.skillLock=.65;if(a===p)toast(s.name);else float(a.x,a.y-48,s.name,s.color);
 if(row===0){a.cast=.35;a.skillLock=1.25;ninjaFx(0,a.x,a.y,.85,130,angle,a);delay(.35,()=>{if(a.hp<=0)return;a.dash=.275;a.dashA=angle;a.dashSpeed=800;a.dashDmg=85;a.dashHit=false;a.vfxDash=id;});}
 if(row===1){objects.push({kind:'anchor',ninjaKind:'clone',x:a.x,y:a.y,cx:-10000,cy:-10000,owner:a,hp:30,maxHp:30,life:4,color:s.color});ninjaFx(1,a.x,a.y,.6,95);}
 if(row===2){for(let i=0;i<3;i++)objects.push({kind:'pet',ninjaKind:'hound',id,owner:a,x:a.x+Math.cos(angle+i*2)*26,y:a.y+Math.sin(angle+i*2)*26,homeX:a.x,homeY:a.y,guard:false,hp:28,maxHp:28,life:4,cd:.4+i*.12,dmg:8,color:s.color});ninjaFx(2,a.x,a.y,.5,120,angle);}
 if(row===3){let x=a.x+Math.cos(angle)*90,y=a.y+Math.sin(angle)*90,vertical=Math.abs(Math.cos(angle))>.7;const wall={kind:'wall',ninjaKind:'wall',owner:a,x,y,w:vertical?24:150,h:vertical?150:24,life:4,color:s.color};if(actors.some(t=>t.hp>0&&Math.abs(t.x-x)<wall.w/2+t.r&&Math.abs(t.y-y)<wall.h/2+t.r)||blocked(x,y,15)){a.mp+=s.cost;a.cd[id]=0;a.skillLock=0;if(a===p)toast('Sem espaço para erguer a parede');return false}objects.push(wall);}
 if(row===4){const f={kind:'field',ninjaKind:'rift',owner:a,id,x:tx,y:ty,r:100,life:2.4,cooldown:.6,interval:.6,dmg:15,pull:1.2,slow:.6,follow:false};objects.push(f);}
 if(row===5){a.cast=.9;a.skillLock=1.55;ninjaFx(5,a.x,a.y,1.8,225,angle,a);delay(.9,()=>{if(a.hp<=0)return;for(const off of [-.16,0,.16]){const projectile=shot(a,angle+off,470,120,21,s.color,520);projectile.ninjaBlade=true;projectile.art=id;}combatImpact(1.7);});}
 return true;
};
const ninjaOldStep=step;
step=function(dt){const clones=objects.filter(o=>o.ninjaKind==='clone'),hounds=objects.filter(o=>o.ninjaKind==='hound').map(o=>({o,cd:o.cd}));ninjaOldStep(dt);if(state!=='fight')return;for(const o of clones)if(o.hp<30&&o.owner.hp>0&&!o.ninjaTriggered){o.ninjaTriggered=true;o.life=0;vfxWithin(27,o.owner,()=>expansionPulse(o.owner,o.x,o.y,100,55,27,{root:.7}));ninjaFx(1,o.x,o.y,.65,160);}for(const f of ninjaEffects)f.life-=dt;ninjaEffects=ninjaEffects.filter(f=>f.life>0);};
const ninjaImage=new Image();
let ninjaArtReady=false;
ninjaImage.onload=()=>ninjaArtReady=true;
ninjaImage.src=NINJA_ART;
function drawNinjaRaster(g,row,x,y,size,phase=0,angle=0){if(!ninjaArtReady)return;const w=ninjaImage.naturalWidth/4,h=ninjaImage.naturalHeight/6,t=clamp(phase,0,.999)*3,frame=Math.floor(t),mix=t-frame;g.save();g.translate(x,y);if([0,2].includes(row))g.rotate(angle);const alpha=g.globalAlpha;for(const [col,weight]of [[frame,1-mix],[Math.min(3,frame+1),mix]]){if(weight<=0)continue;g.globalAlpha=alpha*weight;g.drawImage(ninjaImage,col*w,row*h,w,h,-size/2,-size/2,size,size);}g.restore();}
const ninjaOldIcon=icon;
icon=function(id){const row=NINJA_IDS.indexOf(id);if(row<0)return ninjaOldIcon(id);return `<span class="ninja-icon" aria-hidden="true"><img src="${NINJA_ART}" alt="" draggable="false" style="width:400%;height:600%;left:-200%;top:-${row*100}%"></span>`};
const ninjaOldObjects=vfxDrawObjects;
vfxDrawObjects=function(){const all=objects;objects=all.filter(o=>!o.ninjaKind);try{ninjaOldObjects()}finally{objects=all}for(const o of all){if(!o.ninjaKind||o.life<=0||o.hp<=0)continue;const row=o.ninjaKind==='hound'?2:o.ninjaKind==='wall'?3:o.ninjaKind==='clone'?1:4,angle=o.ninjaKind==='hound'?Math.atan2(enemy(o.owner).y-o.y,enemy(o.owner).x-o.x):0,size=row===2?65:row===3?175:row===4?210:85;drawNinjaRaster(ctx,row,o.x,o.y,size,row===3?.55:row===4?(2.4-o.life)/2.4:((vfxTime*1.1)%1)*.65+.15,angle);if(o.hp!==undefined){ctx.fillStyle='#102c31';ctx.fillRect(o.x-18,o.y-37,36,4);ctx.fillStyle='#a4dfff';ctx.fillRect(o.x-18,o.y-37,36*Math.max(0,o.hp)/(o.maxHp||30),4);}}};
const ninjaOldDraw=draw;
draw=function(){ninjaOldDraw();if(!p||!cw)return;ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);for(const s of shots)if(s.ninjaBlade){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(s.vy,s.vx));ctx.fillStyle='#bef5ff';ctx.strokeStyle='#6278ee';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(28,0);ctx.lineTo(0,-16);ctx.lineTo(-25,0);ctx.lineTo(0,16);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}ctx.restore();};
const ninjaOldPreview=drawEcoPreview;
drawEcoPreview=function(t){if(!championPreview||championPreview.champion!==1)return ninjaOldPreview(t);ninjaOldPreview(t);const v=championPreview,el=$('#championDemo');if(!el)return;const g=el.getContext('2d'),row=NINJA_IDS.indexOf(v.id),phase=((t-v.start)/1000%2.7)/2.7;g.fillStyle='#0a211d';g.fillRect(200,0,400,220);drawNinjaRaster(g,row,row===5?350:390,110,row===5?210:175,phase);};
const ninjaPriorMotion=fighterMotion;
fighterMotion=function(a,t){const m=ninjaPriorMotion(a,t);m.ninjaCast=null;if(a.skin!==1||!a.champAction)return m;const s=skills[a.champAction.id],row=NINJA_IDS.indexOf(s?.id);if(row<0)return m;const age=t-a.champAction.start,duration=a.champAction.duration,u=Math.floor(clamp(age/duration,0,.999)*24)/23;if(age<0||age>duration)return m;const wind=Math.sin(Math.PI*u);m.ninjaCast={row,u,wind,angle:a.champAction.angle};m.echo=null;
 if(row===0){m.pose=u<.35?5:u<.8?6:4;m.lean=-.18*wind;m.x+=Math.cos(m.angle)*8*wind;m.y+=Math.sin(m.angle)*8*wind;m.sy*=1-.07*wind;}
 if(row===1){m.pose=u<.7?5:3;m.lean=Math.sin(u*Math.PI*2)*.05;m.y+=2*wind;}
 if(row===2){m.pose=u<.28?5:u<.8?3:0;m.sy*=1-.14*wind;m.sx*=1+.07*wind;m.y+=7*wind;}
 if(row===3){m.pose=u<.4?5:u<.8?4:0;m.y+=(u<.45?4:-3)*wind;m.lean=-.05*wind;}
 if(row===4){m.pose=u<.25?5:u<.85?4:0;m.lean=.08*wind;m.x+=2*wind;}
 if(row===5){m.pose=u<.5?5:4;m.y-=7*wind;m.sx*=1+.04*wind;m.sy*=1+.04*wind;m.lean=0;}
 return m;
};
const ninjaPriorAccents=drawFighterAccents;
drawFighterAccents=function(g,a,m,t,front){if(a.skin!==1||!m.ninjaCast)return ninjaPriorAccents(g,a,m,t,front);if(!front){ninjaPriorAccents(g,a,m,t,false);return;}const n=m.ninjaCast,u=n.u,power=n.wind;g.save();g.translate(m.x,m.y);g.strokeStyle='#1b3547';g.lineCap='round';g.lineJoin='round';const arm=(side,hx,hy)=>{const sx=side*11,sy=-1,ex=(sx+hx)/2,ey=(sy+hy)/2+5;g.strokeStyle='#23374b';g.lineWidth=7;g.beginPath();g.moveTo(sx,sy);g.lineTo(ex,ey);g.stroke();g.strokeStyle='#a7b7c2';g.lineWidth=5;g.beginPath();g.moveTo(ex,ey);g.lineTo(hx,hy);g.stroke();g.fillStyle='#263e50';g.beginPath();g.arc(hx,hy,4,0,TAU);g.fill();};
 if(n.row===0){const reach=u<.35?-6:20*power;arm(-1,-7,4);arm(1,18+reach,-2);g.strokeStyle='#9cefff';g.lineWidth=2;for(let i=0;i<3;i++){g.beginPath();g.moveTo(15+reach,-8+i*5);g.lineTo(23+reach,-13+i*7);g.lineTo(20+reach,-1+i*3);g.stroke();}}
 if(n.row===1){arm(-1,3,-10);arm(1,-3,-10);g.strokeStyle='#b1f4ff';g.lineWidth=1.5;g.strokeRect(-6,-16,12,12);}
 if(n.row===2){arm(-1,-8,19*power);arm(1,13,24*power);g.strokeStyle='#8fd9ee';g.lineWidth=1.5;g.beginPath();g.ellipse(9,26,14+power*10,6+power*4,0,0,TAU);g.stroke();}
 if(n.row===3){const rise=-24*Math.sin(Math.PI*u);arm(-1,-20,rise);arm(1,20,rise);g.strokeStyle='#8fe9ff';for(const x of [-21,21]){g.beginPath();g.moveTo(x,15);g.lineTo(x,rise-4);g.stroke();}}
 if(n.row===4){arm(-1,-8,6);arm(1,25,-14);g.strokeStyle='#9ceaff';g.lineWidth=2;g.beginPath();g.arc(25,-14,6+power*7,t*3,t*3+Math.PI*1.6);g.stroke();}
 if(n.row===5){const open=u<.4?u/.4:1;arm(-1,-8-open*22,-13-open*12);arm(1,8+open*22,-13-open*12);g.strokeStyle='#a7d9ff';g.lineWidth=2;g.beginPath();g.ellipse(0,12,25+power*11,12+power*5,0,0,TAU);g.stroke();}
 g.restore();};
const ninjaPriorProjectiles=vfxDrawProjectiles;
vfxDrawProjectiles=function(){const all=shots;shots=all.filter(s=>!s.ninjaBlade);try{ninjaPriorProjectiles()}finally{shots=all}};
const ninjaPriorFields=vfxDrawFields;
vfxDrawFields=function(){const all=objects;objects=all.filter(o=>!o.ninjaKind);try{ninjaPriorFields()}finally{objects=all}};
const ninjaFramesSeen=Array.from({length:6},()=>new Set());
const ninjaFrameImages=NINJA_SHEETS.map(src=>{const im=new Image();im.src=src;return im});
drawNinjaRaster=function(g,row,x,y,size,phase=0,angle=0){const im=ninjaFrameImages[row];if(!im?.complete||!im.naturalWidth)return;const frame=clamp(Math.floor(phase*24),0,23),w=im.naturalWidth/6,h=im.naturalHeight/4;ninjaFramesSeen[row].add(frame);g.save();g.translate(x,y);if([0,2].includes(row))g.rotate(angle);g.drawImage(im,(frame%6)*w,Math.floor(frame/6)*h,w,h,-size/2,-size/2,size,size);g.restore()};
icon=function(id){const row=NINJA_IDS.indexOf(id);if(row<0)return ninjaOldIcon(id);const frame=[10,8,12,12,12,8][row];return `<span class="ninja-icon" aria-hidden="true"><img src="${NINJA_SHEETS[row]}" alt="" draggable="false" style="width:600%;height:400%;left:-${frame%6*100}%;top:-${Math.floor(frame/6)*100}%"></span>`};
vfxDrawObjects=function(){const all=objects;objects=all.filter(o=>!o.ninjaKind);try{ninjaOldObjects()}finally{objects=all}for(const o of all){if(!o.ninjaKind||o.life<=0||o.hp<=0)continue;const row=o.ninjaKind==='hound'?2:o.ninjaKind==='wall'?3:o.ninjaKind==='clone'?1:4;let x=o.x,y=o.y,hp=o.hp,max=o.maxHp||30,size=row===2?135:row===3?175:row===4?210:85,angle=0,phase=.4;
 if(row===2){const pack=all.filter(t=>t.ninjaKind==='hound'&&t.owner===o.owner&&t.life>0&&t.hp>0);if(pack[0]!==o)continue;x=pack.reduce((n,t)=>n+t.x,0)/pack.length;y=pack.reduce((n,t)=>n+t.y,0)/pack.length;hp=pack.reduce((n,t)=>n+t.hp,0);max=pack.length*28;angle=Math.atan2(enemy(o.owner).y-y,enemy(o.owner).x-x);phase=.23+((vfxTime*1.2)%1)*.47;}
 if(row===3)phase=o.life>3.65?(4-o.life)/.35*.5:o.life<.5?.75+(1-o.life/.5)*.249:.52;
 if(row===4)phase=1-o.life/2.4;
 if(row===1)phase=o.life>3.5?(4-o.life)/.5*.35:.36+Math.sin(vfxTime*8)*.035;
 drawNinjaRaster(ctx,row,x,y,size,phase,angle);if(hp!==undefined){ctx.fillStyle='#102c31';ctx.fillRect(x-18,y-37,36,4);ctx.fillStyle='#a4dfff';ctx.fillRect(x-18,y-37,36*Math.max(0,hp)/max,4);}}
};
const ninjaPriorStart=start;
start=function(){ninjaEffects=[];return ninjaPriorStart()};
const ninjaPriorHit=hit;
hit=function(a,n,owner,knock=0,angle=0,visualId=visualContext?.id??-1){const before=a?.hp,result=ninjaPriorHit(a,n,owner,knock,angle,visualId);if(result&&owner?.skin===1&&visualId===2&&n===8&&a.hp<before)a.root=Math.max(a.root,.25);return result};
const ninjaEffectObjectLayer=vfxDrawObjects;
vfxDrawObjects=function(){ninjaEffectObjectLayer();for(const f of ninjaEffects){const x=f.follow?.x??f.x,y=(f.follow?.y??f.y)-(f.row===5?25:0);drawNinjaRaster(ctx,f.row,x,y,f.size,Math.floor((1-f.life/f.max)*24)/23,f.angle);}};
function leave(){finishTrainingJourney();state='select';document.body.style.overflow='';clearInputs();$('#battle').style.display='none';showScreen('home')}
$('#leave').onclick=leave;
$('#change').onclick=()=>{leave();showScreen('library')};
$('#start').onclick=()=>showScreen('home');
$('#rematch').onclick=start;
const DOJO_DIRECTIONAL_SRC="assets/sprites/arte_011.webp";
const DOJO_STRIKE_SOURCES={"side": "assets/sprites/arte_012.webp", "front": "assets/sprites/arte_013.webp", "back": "assets/sprites/arte_014.webp"};
const DOJO_DIRECTIONAL_REG={"side": {"row": 0, "scale": 1.0642201834862386, "frames": [{"height": 218, "anchor": [123.5, 248.0]}, {"height": 216, "anchor": [110.5, 244.0]}, {"height": 218, "anchor": [131.5, 246.0]}, {"height": 204, "anchor": [123.0, 247.0]}, {"height": 228, "anchor": [125.5, 251.0]}, {"height": 226, "anchor": [118.0, 248.0]}, {"height": 223, "anchor": [123.0, 246.0]}, {"height": 215, "anchor": [130.5, 252.0]}, {"height": 191, "anchor": [123.0, 229.0]}, {"height": 196, "anchor": [124.5, 239.0]}, {"height": 198, "anchor": [124.5, 239.0]}, {"height": 200, "anchor": [125.5, 241.0]}, {"height": 209, "anchor": [136.5, 229.0]}, {"height": 212, "anchor": [125.0, 234.0]}, {"height": 223, "anchor": [110.5, 241.0]}, {"height": 205, "anchor": [107.0, 232.0]}, {"height": 209, "anchor": [104.5, 229.0]}, {"height": 212, "anchor": [119.5, 230.0]}, {"height": 212, "anchor": [138.5, 229.0]}, {"height": 203, "anchor": [122.0, 225.0]}, {"height": 225, "anchor": [125.0, 229.0]}, {"height": 222, "anchor": [123.5, 229.0]}, {"height": 220, "anchor": [123.0, 229.0]}, {"height": 221, "anchor": [124.0, 230.0]}]}, "front": {"row": 1, "scale": 1.0175438596491229, "frames": [{"height": 228, "anchor": [130.0, 235.0]}, {"height": 236, "anchor": [125.5, 241.0]}, {"height": 236, "anchor": [127.5, 241.0]}, {"height": 230, "anchor": [124.5, 235.0]}, {"height": 235, "anchor": [127.5, 238.0]}, {"height": 242, "anchor": [126.5, 245.0]}, {"height": 242, "anchor": [127.5, 245.0]}, {"height": 239, "anchor": [122.5, 242.0]}, {"height": 244, "anchor": [132.5, 249.0]}, {"height": 243, "anchor": [121.5, 249.0]}, {"height": 245, "anchor": [119.5, 249.0]}, {"height": 239, "anchor": [136.5, 248.0]}, {"height": 238, "anchor": [132.0, 248.0]}, {"height": 240, "anchor": [118.5, 246.0]}, {"height": 237, "anchor": [116.0, 247.0]}, {"height": 242, "anchor": [137.5, 249.0]}, {"height": 229, "anchor": [134.5, 234.0]}, {"height": 234, "anchor": [123.5, 238.0]}, {"height": 228, "anchor": [123.5, 232.0]}, {"height": 233, "anchor": [129.0, 238.0]}, {"height": 236, "anchor": [131.5, 236.0]}, {"height": 234, "anchor": [129.0, 236.0]}, {"height": 233, "anchor": [124.0, 236.0]}, {"height": 236, "anchor": [127.0, 237.0]}]}, "back": {"row": 2, "scale": 1.045045045045045, "frames": [{"height": 222, "anchor": [136.5, 244.0]}, {"height": 222, "anchor": [122.0, 244.0]}, {"height": 222, "anchor": [119.5, 244.0]}, {"height": 222, "anchor": [115.5, 244.0]}, {"height": 224, "anchor": [122.5, 242.0]}, {"height": 226, "anchor": [120.5, 244.0]}, {"height": 223, "anchor": [117.5, 242.0]}, {"height": 224, "anchor": [111.5, 242.0]}, {"height": 231, "anchor": [122.5, 238.0]}, {"height": 239, "anchor": [121.5, 238.0]}, {"height": 238, "anchor": [118.5, 237.0]}, {"height": 233, "anchor": [114.0, 241.0]}, {"height": 237, "anchor": [122.0, 236.0]}, {"height": 237, "anchor": [123.0, 236.0]}, {"height": 237, "anchor": [111.0, 236.0]}, {"height": 237, "anchor": [111.0, 236.0]}, {"height": 256, "anchor": [120.0, 255.0]}, {"height": 256, "anchor": [124.0, 255.0]}, {"height": 246, "anchor": [117.5, 255.0]}, {"height": 248, "anchor": [120.0, 255.0]}, {"height": 214, "anchor": [121.5, 213.0]}, {"height": 212, "anchor": [129.0, 211.0]}, {"height": 213, "anchor": [133.5, 212.0]}, {"height": 213, "anchor": [133.0, 212.0]}]}};
const DOJO_ICON_SRC="assets/sprites/arte_015.webp";
skills[31].desc='Concentra relâmpago na mão por 0,4s e avança até 220 unidades. Causa 85 de dano no contato. Obstáculos interrompem a investida.';
const DOJO_BASE_IMAGE=new Image();
DOJO_BASE_IMAGE.src=DOJO_DIRECTIONAL_SRC;
const DOJO_STRIKE_IMAGES=Object.fromEntries(Object.entries(DOJO_STRIKE_SOURCES).map(([name,src])=>{const image=new Image();image.src=src;return [name,image]}));
let dojoSpeed=1,dojoInspectorFrame=null,dojoPreviewMode='idle',dojoPreviewAngle=0;
const dojoSeen=new Set(),DOJO_TIME=1.09;
function dojoFrame(age){return age<.4?Math.min(7,Math.floor(age/.4*8)):age<.68?8+Math.min(7,Math.floor((age-.4)/.28*8)):age<.79?16+Math.min(1,Math.floor((age-.68)/.11*2)):Math.min(23,18+Math.floor((age-.79)/.3*6));}
function dojoDirection(angle=0){const x=Math.cos(angle),y=Math.sin(angle);return Math.abs(y)>Math.abs(x)?{name:y>0?'front':'back',flip:1}:{name:'side',flip:x<0?-1:1};}
function dojoPaintBody(g,pose,size=72,angle=0){if(!DOJO_BASE_IMAGE.complete||!DOJO_BASE_IMAGE.naturalWidth)return false;const d=dojoDirection(angle),row=DOJO_DIRECTIONAL_REG[d.name].row,k=size/64;g.save();g.scale(d.flip,1);g.imageSmoothingEnabled=false;g.drawImage(dojoWornContext?dojoWoundImages['worn-base']:DOJO_BASE_IMAGE,pose*80,row*80,80,80,-40*k,-70*k+size/6,80*k,80*k);g.restore();return true;}
function dojoPaintStrike(g,f,size=72,angle=0){const d=dojoDirection(angle),image=dojoWornContext?dojoWoundImages['worn-strike-'+d.name]:DOJO_STRIKE_IMAGES[d.name];if(!image.complete||!image.naturalWidth)return false;const reg=(dojoWornContext?DOJO_WOUND_REG:DOJO_DIRECTIONAL_REG)[d.name],e=size*reg.scale,anchor=reg.frames[f].anchor;g.save();g.scale(d.flip,1);g.imageSmoothingEnabled=false;g.drawImage(image,f%4*256,Math.floor(f/4)*256,256,256,-anchor[0]/256*e,size/6-anchor[1]/256*e,e,e);g.restore();dojoSeen.add(f);return true;}
const dojoOriginalFighter=drawAnimatedFighter;
drawAnimatedFighter=function(g,a,size=FIGHTER_DRAW_SIZE,t=vfxTime){
 if(a.skin!==1)return dojoOriginalFighter(g,a,size,t);
 if(a.dojoStrike){return dojoPaintStrike(g,dojoFrame(a.dojoStrike.age),size,a.dojoStrike.angle);}
 const m=championOldFighterMotion(a,t);
 // Fixed upright silhouette and foot anchor; no aim rotation or squash scaling.
 return dojoPaintBody(g,m.pose,size,a.dojoFacingAngle??a.a??0);
};
const dojoOldIcon=icon;
icon=function(id){return id===31?`<span class="dojo-skill-icon"><img src="${DOJO_ICON_SRC}" alt="Mão com relâmpago concentrado"></span>`:'<span class="dojo-skill-locked" aria-hidden="true">◇</span>'};
prepareEquippedSprites=function(){return Promise.resolve()};
const dojoOldState=skillControlState;
const dojoOldCastCore=castCore;
castCore=function(a,id,manual){
 if(id!==31){if(a===p)toast('Este dojo testa somente a skill 1.');return false;}
 if(!a||a.skin!==1||state!=='fight'||a.hp<=0||a.dojoStrike||a.cast>0||a.dodgeTime>0||a.guard||a.punchTime>0||a.skillLock>0||a.actionRecovery>0)return false;
 const s=skills[31];if(a.mp<s.cost||a.cd[31]>0)return false;
 const angle=aim(a,manual),target=enemy(a),d=dist(a,target),toward=Math.cos(Math.atan2(target.y-a.y,target.x-a.x)-angle)>.995;
 a.dojoStrike={age:0,angle,distance:toward?Math.min(220,Math.max(0,d-40)):220,moved:0,blocked:false,hit:false};a.a=angle;a.mp-=s.cost;a.cd[31]=s.cd;a.cast=DOJO_TIME;a.skillLock=DOJO_TIME;a.champAction=null;a.dash=0;a.dashDmg=0;
 toast('Estocada da Tempestade');return true;
};
const dojoBeforeCast=cast;
cast=function(a,id,manual){const r=dojoBeforeCast(a,id,manual);if(r&&a.dojoStrike){a.champAction=null;fighterEchoStates.delete(a);}return r};
const dojoBeforeStep=step;
step=function(dt){dt*=dojoSpeed;dojoBeforeStep(dt);if(state!=='fight')return;for(const a of actors){const s=a.dojoStrike;if(!s){if(a.skin===1){if(a.dodgeTime>0)a.dojoFacingAngle=a.dodgeA;else if(a.guard||a.punchTime>0||a===p&&aimGesture)a.dojoFacingAngle=a.a;else if(a===p&&a.moving){const m=movement();if(m.len>.06)a.dojoFacingAngle=Math.atan2(m.y,m.x);}}continue;}if(a.hp<=0){a.dojoStrike=null;continue;}const before=s.age;s.age=Math.min(DOJO_TIME,s.age+dt);a.a=s.angle;a.dojoFacingAngle=s.angle;a.moving=false;
  const desired=s.distance*clamp((s.age-.4)/.28,0,1),delta=desired-s.moved;
  if(delta>0&&!s.blocked){const x=a.x,y=a.y;s.blocked=move(a,Math.cos(s.angle)*delta,Math.sin(s.angle)*delta);s.moved+=Math.hypot(a.x-x,a.y-y);}
  if(before<.68&&s.age>=.68&&!s.hit&&!s.blocked){const hand={x:a.x+Math.cos(s.angle)*35,y:a.y+Math.sin(s.angle)*35};const target=opponents(a).filter(e=>dist(hand,e)<34&&lineClear(a,e)).sort((l,r)=>dist(hand,l)-dist(hand,r))[0];if(target){s.hit=hit(target,85,a,8,s.angle,31);if(s.hit)combatImpact(.9);}}
  dojoSeen.add(dojoFrame(s.age));if(s.age>=DOJO_TIME){a.dojoStrike=null;a.cast=0;a.skillLock=0;fighterEchoStates.delete(a);}
 }
};
const dojoResetOriginal=resetPractice;
resetPractice=function(clear=true){const result=dojoResetOriginal(clear);for(const a of actors){a.dojoStrike=null;a.dojoFacingAngle=0;}if(p&&b){p.x=W*.5-115;b.x=W*.5+115;p.y=b.y=H*.5;p.a=0;b.a=Math.PI;}ninjaEffects=[];return result;};
const DOJO_KIT_SOURCES={"casting": "assets/sprites/arte_016.webp", "wall": "assets/sprites/arte_017.webp", "rift": "assets/sprites/arte_018.webp", "avatar": "assets/sprites/arte_019.webp", "blade": "assets/sprites/arte_020.webp", "hound-run": "assets/sprites/arte_021.webp", "hound-bite": "assets/sprites/arte_022.webp"};
const DOJO_KIT_ICONS=["assets/sprites/arte_023.webp", "assets/sprites/arte_024.webp", "assets/sprites/arte_025.webp", "assets/sprites/arte_026.webp", "assets/sprites/arte_027.webp"];
const dojoKitImages=Object.fromEntries(Object.entries(DOJO_KIT_SOURCES).map(([name,src])=>{const im=new Image();im.src=src;return[name,im]}));
const dojoKitFrames=Object.fromEntries(['clone','hound','wall','rift','avatar','blade'].map(n=>[n,new Set()]));
let dojoEntities=[],dojoBursts=[],dojoRiftMode='attack',dojoPreviewSkill=31;
const dojoKitDurations={27:.72,2:.85,37:.85,35:.8,48:1.65};
const dojoKitDescriptions={
 27:'Deixa uma cópia com 30 HP por 6s. O primeiro golpe recebido provoca uma descarga no agressor: 55 de dano e imobilização por 0,7s. Uma cópia por vez.',
 2:'Três cães perseguem o alvo por até 6s. Ao alcançar, prendem por 0,8s e causam três mordidas de 18 de dano (54 no total). Obstáculos bloqueiam a perseguição.',
 37:'Ergue uma parede de terra por 4s, a 90 unidades à frente. Bloqueia passagem, golpes através dela e projéteis dos dois lados. Uma parede por vez.',
 35:'Ofensiva: fenda no alvo, alcance 320, quatro pulsos de 25 de dano em 2,4s, atração e lentidão. Defensiva: intangibilidade por 1,4s e absorção de projéteis próximos. Escolha o modo no treino.',
 48:'Avatar da Tempestade — Lâminas do Vazio. Um guerreiro gigante surge e lança três shurikens de 120 de dano (até 360). Alcance 520. Exige HP ≤20% fora do treino; livre no dojo.'
};
for(const [id,desc]of Object.entries(dojoKitDescriptions))skills[id].desc=desc;
skills[48].name='Avatar da Tempestade';
const dojoRealCanUlt=canUseUltimate;
canUseUltimate=function(a){return !!a&&a.hp>0&&(battleActivity==='training'||dojoRealCanUlt(a));};
skillControlState=function(a,s){const u=championOldControlState(a,s);if(s.ultimate&&!canUseUltimate(a)){u.ready=false;u.locked=true;u.text='HP ≤20%';}return u;};
icon=function(id){const index=NINJA_IDS.indexOf(id),src=index===0?DOJO_ICON_SRC:DOJO_KIT_ICONS[index-1];return src?`<span class="dojo-skill-icon"><img src="${src}" alt="${skills[id].name}"></span>`:dojoOldIcon(id);};
function dojoKitAssetsReady(){return Object.values(dojoKitImages).every(im=>im.complete&&im.naturalWidth);}
function dojoEffect(g,name,x,y,size,frame,flip=1){const im=dojoKitImages[name];if(!im?.naturalWidth)return;frame=clamp(Math.floor(frame),0,23);dojoKitFrames[name]?.add(frame);const cols=['wall','blade','avatar'].includes(name)?4:6,rows=24/cols,w=im.naturalWidth/cols,h=im.naturalHeight/rows;g.save();g.translate(x,y);g.scale(flip,1);g.drawImage(im,frame%cols*w,Math.floor(frame/cols)*h,w,h,-size/2,-size/2,size,size);g.restore();}
function dojoGestureFrame(g,id,frame,size=72,angle=0){const d=dojoDirection(angle),sequences={27:[0,1,2,1,2,6,0,0],2:[0,1,3,4,4,5,0,0],37:[0,1,3,4,5,5,6,0],35:[0,1,2,6,6,6,0,0],48:[0,1,2,5,7,7,7,0]},pose=sequences[id]?.[Math.min(7,Math.floor(frame/3))]??0,k=size/64;const im=dojoWornContext?dojoWoundImages['worn-casting']:dojoKitImages.casting;g.save();g.scale(d.flip,1);g.imageSmoothingEnabled=false;g.drawImage(im,pose*80,DOJO_DIRECTIONAL_REG[d.name].row*80,80,80,-40*k,-70*k+size/6,80*k,80*k);g.restore();}
const dojoKitFighter=drawAnimatedFighter;
drawAnimatedFighter=function(g,a,size=72,t=vfxTime){if(a.skin===1&&a.dojoGesture){const q=a.dojoGesture;dojoGestureFrame(g,q.id,Math.min(23,Math.floor(q.age/q.duration*24)),size,q.angle);return true;}return dojoKitFighter(g,a,size,t);};
function dojoWallPlan(a,angle){const vertical=Math.abs(Math.cos(angle))>Math.abs(Math.sin(angle));return{kind:'wall',dojoKind:'wall',owner:a,x:a.x+Math.cos(angle)*90,y:a.y+Math.sin(angle)*90,w:vertical?24:150,h:vertical?150:24,life:4,maxLife:4,age:0,vertical,color:'#b58e63'};}
function dojoWallFits(w){if(w.x-w.w/2<35||w.x+w.w/2>W-35||w.y-w.h/2<35||w.y+w.h/2>H-35)return false;for(let x=w.x-w.w/2;x<=w.x+w.w/2;x+=12)for(let y=w.y-w.h/2;y<=w.y+w.h/2;y+=12)if(blocked(x,y,2))return false;return !actors.some(a=>a.hp>0&&Math.abs(a.x-w.x)<w.w/2+a.r&&Math.abs(a.y-w.y)<w.h/2+a.r);}
function dojoReplaceEntity(owner,kind){for(const e of dojoEntities)if(e.owner===owner&&e.dojoKind===kind)e.life=0;}
const dojoSingleCast=castCore;
castCore=function(a,id,manual){if(id===31)return dojoSingleCast(a,id,manual);const s=skills[id];if(!a||a.skin!==1||!NINJA_IDS.includes(id)||!a.kit.includes(id)||state!=='fight'||a.hp<=0||a.dojoStrike||a.dojoGesture||a.cast>0||a.dodgeTime>0||a.punchTime>0||a.skillLock>0||a.actionRecovery>0||a.mp<s.cost||a.cd[id]>0||a.guard&&id!==35)return false;if(s.ultimate&&!canUseUltimate(a)){if(a===p)toast('Ultimate: HP de 20% ou menos.');return false;}
 const angle=aim(a,manual),target=enemy(a),distance=manual===undefined?Math.min(s.range,dist(a,target)):s.range,wall=id===37?dojoWallPlan(a,angle):null;
 if(wall&&!dojoWallFits(wall)){if(a===p)toast('Sem espaço para erguer a parede.');return false;}
 a.a=a.dojoFacingAngle=angle;a.mp-=s.cost;a.cd[id]=s.cd;a.guard=false;a.champAction=null;fighterEchoStates.delete(a);a.dojoGesture={id,age:0,duration:dojoKitDurations[id],angle,released:false,mode:id===35?dojoRiftMode:null,wall,tx:clamp(a.x+Math.cos(angle)*distance,55,W-55),ty:clamp(a.y+Math.sin(angle)*distance,55,H-55)};a.cast=a.skillLock=a.dojoGesture.duration;
 if(id===35&&dojoRiftMode==='defense'){a.dojoPhase=1.4;a.inv=Math.max(a.inv,1.4);dojoReplaceEntity(a,'phase');dojoEntities.push({dojoKind:'phase',owner:a,x:a.x,y:a.y,life:1.4,maxLife:1.4,age:0});}
 if(id===48){dojoReplaceEntity(a,'avatar');dojoEntities.push({dojoKind:'avatar',owner:a,x:a.x,y:a.y,life:1.9,maxLife:1.9,age:0,angle,launched:0});}
 toast(s.name+(id===35?' · '+(dojoRiftMode==='attack'?'Ofensiva':'Defensiva'):''));return true;
};
const dojoKitCast=cast;
cast=function(a,id,manual){const result=dojoKitCast(a,id,manual);if(result&&NINJA_IDS.includes(id)){a.champAction=null;fighterEchoStates.delete(a);}return result;};
function dojoRelease(a,q){
 if(q.id===27){dojoReplaceEntity(a,'clone');const c={kind:'anchor',dojoKind:'clone',owner:a,x:a.x,y:a.y,cx:-10000,cy:-10000,r:14,hp:30,maxHp:30,life:6,maxLife:6,age:0,angle:q.angle,color:'#84ebff',triggered:false};objects.push(c);dojoEntities.push(c);if(a===p)toast('Cópia criada. Afaste-se e deixe o fantoche atacar.');}
 if(q.id===2){dojoReplaceEntity(a,'hound');dojoEntities.push({dojoKind:'hound',owner:a,x:a.x,y:a.y,r:14,life:6,maxLife:6,age:0,angle:q.angle,bites:0,nextBite:0});}
 if(q.id===37){if(dojoWallFits(q.wall)){dojoReplaceEntity(a,'wall');objects.push(q.wall);dojoEntities.push(q.wall);}else{a.mp=Math.min(120,a.mp+skills[37].cost);a.cd[37]=0;if(a===p)toast('O espaço foi ocupado. Parede cancelada; MP devolvido.');}}
 if(q.id===35&&q.mode==='attack'){dojoReplaceEntity(a,'rift');dojoEntities.push({dojoKind:'rift',owner:a,x:q.tx,y:q.ty,r:80,life:2.45,maxLife:2.45,age:0,nextPulse:.6,pulses:0});}
}
function dojoBurst(name,x,y,size=130,owner=null){dojoBursts.push({name,x,y,size,owner,age:0,life:.65,maxLife:.65});}
function dojoTriggerClone(c,attacker){if(c.triggered||c.owner.hp<=0||!attacker||attacker.hp<=0)return;c.triggered=true;c.life=0;dojoBurst('clone',c.x,c.y,145,c.owner);if(hit(attacker,55,c.owner,0,Math.atan2(attacker.y-c.y,attacker.x-c.x),27)){attacker.root=Math.max(attacker.root,.7);float(attacker.x,attacker.y-50,'ELETRIFICADO','#9beaff');}ring(c.x,c.y,85,'#97edff',.5);}
const dojoKitHurt=hurtConstructs;
hurtConstructs=function(owner,x,y,r,dmg,angle=0,arc=TAU){const before=dojoEntities.filter(e=>e.dojoKind==='clone'&&e.life>0).map(e=>[e,e.hp]);dojoKitHurt(owner,x,y,r,dmg,angle,arc);for(const[c,hp]of before)if(c.hp<hp)dojoTriggerClone(c,owner);};
function dojoIntercept(dt){for(const s of shots){if(s.life<=0)continue;const ex=s.x+s.vx*dt,ey=s.y+s.vy*dt;for(const e of dojoEntities){if(e.life<=0||sameTeam(e.owner,s.owner))continue;if(e.dojoKind==='clone'&&lineDistance(e.x,e.y,s.x,s.y,ex,ey)<14+s.r&&lineClear(s,e)){s.life=0;e.hp-=s.dmg;dojoTriggerClone(e,s.owner);break;}if(e.dojoKind==='phase'&&lineDistance(e.owner.x,e.owner.y,s.x,s.y,ex,ey)<32+s.r){s.life=0;dojoBurst('rift',s.x,s.y,65);break;}}}shots=shots.filter(s=>s.life>0);}
function dojoHoundMove(e,target,dt,stopDistance=29){const angle=Math.atan2(target.y-e.y,target.x-e.x),step=Math.min(190*dt,Math.max(0,dist(e,target)-stopDistance));let best=null;for(const off of [0,.55,-.55,1.1,-1.1,1.65,-1.65,2.2,-2.2]){const x=e.x+Math.cos(angle+off)*Math.max(step,14),y=e.y+Math.sin(angle+off)*Math.max(step,14);if(blocked(x,y,e.r))continue;const score=Math.hypot(target.x-x,target.y-y)+Math.abs(off)*3;if(!best||score<best.score)best={angle:angle+off,score};}if(best){move(e,Math.cos(best.angle)*step,Math.sin(best.angle)*step);e.angle=best.angle;}}
const dojoKitStep=step;
step=function(dt){if(state!=='fight'){dojoKitStep(dt);return;}const elapsed=dt*dojoSpeed;dojoIntercept(elapsed);const clones=dojoEntities.filter(e=>e.dojoKind==='clone');dojoKitStep(dt);if(state!=='fight')return;
 for(const a of actors){if(a.dojoPhase>0){a.dojoPhase=Math.max(0,a.dojoPhase-elapsed);}const q=a.dojoGesture;if(!q)continue;if(a.hp<=0){a.dojoGesture=null;continue;}q.age+=elapsed;a.dojoFacingAngle=q.angle;a.moving=false;const release=q.id===27?.3:q.id===35?.25:.42;if(!q.released&&q.age>=release){q.released=true;dojoRelease(a,q);}if(q.age>=q.duration){a.dojoGesture=null;a.cast=0;a.skillLock=0;}}
 for(const c of clones)if(c.hp<30&&!c.triggered)dojoTriggerClone(c,enemy(c.owner));
 for(const e of dojoEntities){if(e.owner.hp<=0){e.life=0;continue;}e.age+=elapsed;if(!['clone','wall'].includes(e.dojoKind))e.life-=elapsed;if(e.life<=0)continue;
  if(e.dojoKind==='hound')dojoStepHound(e,enemy(e.owner),elapsed);
  if(e.dojoKind==='rift'){while(e.age>=e.nextPulse&&e.pulses<4){e.pulses++;e.nextPulse+=.6;for(const target of opponents(e.owner))if(dist(e,target)<e.r+target.r&&lineClear(e,target)){hit(target,25,e.owner,0,0,35);target.slow=Math.max(target.slow,.65);}}for(const target of opponents(e.owner))if(dist(e,target)<e.r&&lineClear(e,target)){target.slow=Math.max(target.slow,.2);pullToward(target,e.x,e.y,.35,elapsed);}}
  if(e.dojoKind==='phase'){e.x=e.owner.x;e.y=e.owner.y;}
  if(e.dojoKind==='avatar'){e.x=e.owner.x;e.y=e.owner.y;while(e.launched<3&&e.age>=.9+e.launched*.18){const off=[0,-.08,.08][e.launched++],s=shot(e.owner,e.angle+off,470,120,19,'#b7d7ff',520);s.art=48;s.dojoBlade=true;s.age=0;combatImpact(1.1);}}
 }
 dojoEntities=dojoEntities.filter(e=>e.life>0);for(const s of shots)if(s.dojoBlade)s.age=(s.age||0)+elapsed;for(const e of dojoBursts){e.age+=elapsed;e.life-=elapsed;}dojoBursts=dojoBursts.filter(e=>e.life>0);
};
function dojoLightning(g,x,y,r,frame,alpha=1){dojoKitFrames.clone.add(clamp(frame,0,23));g.save();g.translate(x,y);g.globalAlpha*=alpha;g.strokeStyle='#b6f9ff';g.lineWidth=1.8;for(let i=0;i<7;i++){const a=i*TAU/7+frame*.27;g.beginPath();for(let j=0;j<5;j++){const rr=r*(.48+j*.13),q=a+Math.sin(j*7+i*3+frame)*.15,px=Math.cos(q)*rr,py=Math.sin(q)*rr*.8;if(!j)g.moveTo(px,py);else g.lineTo(px,py);}g.stroke();}g.restore();}
function dojoRenderEntity(g,e){const fade=Math.min(1,e.age/.2,e.life/.25);g.save();g.globalAlpha*=fade;
 if(e.dojoKind==='clone'){g.save();g.translate(e.x,e.y);g.globalAlpha*=.65;g.filter='sepia(.5) saturate(2) hue-rotate(125deg)';dojoPaintBody(g,0,72,e.angle);g.restore();dojoLightning(g,e.x,e.y-24,32,Math.floor(e.age*24)%24,.7);}
 if(e.dojoKind==='hound'){const frame=e.age<.3?e.age/.3*8:e.life<.4?16+(1-e.life/.4)*7:8+Math.floor(e.age*16)%8;dojoEffect(g,'hound',e.x,e.y-14,108,frame,Math.cos(e.angle)<0?-1:1);}
 if(e.dojoKind==='wall'){const frame=e.age<.35?e.age/.35*8:e.life<.55?16+(1-e.life/.55)*7:8+Math.floor(e.age*10)%8;if(e.vertical){for(const off of [-48,0,48])dojoEffect(g,'wall',e.x,e.y+off-24,76,frame);}else dojoEffect(g,'wall',e.x,e.y-36,180,frame);}
 if(e.dojoKind==='rift')dojoEffect(g,'rift',e.x,e.y,185,e.age/e.maxLife*24);
 if(e.dojoKind==='phase')dojoEffect(g,'rift',e.x,e.y-24,115,e.age/e.maxLife*24);
 if(e.dojoKind==='avatar'){dojoEffect(g,'avatar',e.x,e.y-85,260,e.age/e.maxLife*24);if(e.age<.9){dojoEffect(g,'blade',e.x-70,e.y-75,58,Math.floor(e.age*30)%24);dojoEffect(g,'blade',e.x+70,e.y-75,58,Math.floor(e.age*30)%24);}}
 g.restore();}
const dojoKitObjects=vfxDrawObjects;
vfxDrawObjects=function(){const all=objects;objects=all.filter(o=>!o.dojoKind);try{dojoKitObjects()}finally{objects=all}for(const e of [...dojoEntities].sort((a,b)=>a.y-b.y))dojoRenderEntity(ctx,e);for(const e of dojoBursts){if(e.name==='clone')dojoLightning(ctx,e.x,e.y-15,e.size/2,Math.min(23,Math.floor(e.age/e.maxLife*24)),e.life/e.maxLife);else dojoEffect(ctx,e.name,e.x,e.y,e.size,e.age/e.maxLife*24);}};
const dojoKitProjectiles=vfxDrawProjectiles;
vfxDrawProjectiles=function(){const all=shots;shots=all.filter(s=>!s.dojoBlade);try{dojoKitProjectiles()}finally{shots=all}for(const s of all)if(s.dojoBlade)dojoEffect(ctx,'blade',s.x,s.y-12,76,Math.floor((s.age||0)*32)%24);};
const dojoKitPracticeAI=practiceAI;
practiceAI=function(dt,a){if(practiceOptions.dummy==='ranged'){a.moving=false;a.a=aim(a);a.think-=dt;if(a.think<=0){const c=dojoEntities.find(e=>e.dojoKind==='clone'&&e.life>0&&e.owner===p),target=c||p;shot(a,Math.atan2(target.y-a.y,target.x-a.x),240,22,8,'#ffb992',650);a.think=1.4;}return;}
 if(practiceOptions.dummy==='attack'){const c=dojoEntities.filter(e=>e.dojoKind==='clone'&&e.life>0&&e.owner===p).sort((u,v)=>dist(a,u)-dist(a,v))[0];if(c&&dist(a,c)<dist(a,p)+80){a.a=Math.atan2(c.y-a.y,c.x-a.x);a.moving=false;a.think-=dt;if(dist(a,c)>55&&a.root<=0){const before={x:a.x,y:a.y};move(a,Math.cos(a.a)*105*dt,Math.sin(a.a)*105*dt);a.moving=dist(a,before)>.01;}if(dist(a,c)<75&&a.think<=0&&lineClear(a,c)){a.punchTime=.24;a.think=1.4;hurtConstructs(a,a.x,a.y,75,22,a.a,1.7);}return;}}
 dojoKitPracticeAI(dt,a);
};
const dojoKitReset=resetPractice;
resetPractice=function(clear=true){dojoEntities=[];dojoBursts=[];for(const a of actors){a.dojoGesture=null;a.dojoPhase=0;}return dojoKitReset(clear);};
function dojoSetRiftMode(mode){dojoRiftMode=mode==='defense'?'defense':'attack';const b=$('#dojoRiftToggle');if(b)b.textContent='Fenda: '+(dojoRiftMode==='attack'?'Ofensiva':'Defensiva');const select=$('#dojoRiftMode');if(select)select.value=dojoRiftMode;}
let dojoDepthTrace=[];
const dojoPreviousRelease=dojoRelease;
dojoRelease=function(a,q){if(q.id!==2)return dojoPreviousRelease(a,q);dojoReplaceEntity(a,'hound');const pack={rooted:false,hits:0};for(let index=0;index<3;index++){const offset=(index-1)*24,x=a.x-Math.sin(q.angle)*offset,y=a.y+Math.cos(q.angle)*offset;const e={dojoKind:'hound',owner:a,x:blocked(x,y,10)?a.x:x,y:blocked(x,y,10)?a.y:y,r:10,life:6,maxLife:6,age:0,angle:q.angle,index,pack,bites:0,mode:'run',gait:index*2,biteAge:0,biteApplied:false};dojoEntities.push(e);}};
function dojoStepHound(e,target,dt){
 if(e.mode==='bite'){
  const before=e.biteAge;e.biteAge+=dt;
  // The damage tick matches jaw closure (pose 4), after anticipation and lunge.
  if(e.biteAge<.22&&dist(e,target)>25&&lineClear(e,target))move(e,Math.cos(e.angle)*36*dt,Math.sin(e.angle)*36*dt);
  if(before<.24&&e.biteAge>=.24&&!e.biteApplied){e.biteApplied=true;if(dist(e,target)<51&&lineClear(e,target)&&hit(target,18,e.owner,0,e.angle,2)){e.bites=1;e.pack.hits++;target.root=Math.max(target.root,e.pack.rooted?.12:.8);if(!e.pack.rooted)float(target.x,target.y-48,'PRESO · 0,8s','#b2e6ed');e.pack.rooted=true;}}
  if(e.biteAge>=.48){if(e.bites){e.mode='recover';e.life=Math.min(e.life,.38);}else{e.mode='run';e.biteAge=0;}}
  return;
 }
 if(e.mode==='recover')return;
 const angle=Math.atan2(target.y-e.y,target.x-e.x);
 if(dist(e,target)<43&&lineClear(e,target)){e.mode='bite';e.biteAge=0;e.biteApplied=false;e.angle=angle;return;}
 const rear=Math.atan2(target.y-e.owner.y,target.x-e.owner.x),side=(e.index-1)*24;
 const goal={x:target.x-Math.cos(rear)*24-Math.sin(rear)*side,y:target.y-Math.sin(rear)*24+Math.cos(rear)*side};
 const before={x:e.x,y:e.y};dojoHoundMove(e,blocked(goal.x,goal.y,e.r)?target:goal,dt,3);
 for(const other of dojoEntities){if(other===e||other.dojoKind!=='hound'||other.pack!==e.pack||other.life<=0)continue;const d=dist(e,other);if(d>0&&d<22){const push=Math.min(40*dt,(22-d)/2);move(e,(e.x-other.x)/d*push,(e.y-other.y)/d*push);}}
 const moved=dist(before,e);if(moved>.01){e.gait+=moved/9;e.angle=Math.atan2(e.y-before.y,e.x-before.x);}
}
function dojoPaintHound(g,e,scale=1){const dir=dojoDirection(e.angle||0),bite=e.mode==='bite'||e.mode==='recover',image=dojoKitImages[bite?'hound-bite':'hound-run'];if(!image?.naturalWidth)return;const pose=bite?Math.min(7,Math.floor((e.biteAge||0)/.48*8)):Math.floor(e.gait||0)%8,row=DOJO_DIRECTIONAL_REG[dir.name].row;dojoKitFrames.hound.add(row*8+pose);g.save();g.translate(e.x,e.y);g.scale(scale,scale);g.fillStyle='#04171466';g.beginPath();g.ellipse(0,0,18,6,0,0,TAU);g.fill();g.scale(dir.flip,1);g.imageSmoothingEnabled=false;g.drawImage(image,pose*96,row*96,96,96,-48,-80,96,96);g.restore();}
const dojoOldEntityRender=dojoRenderEntity;
dojoRenderEntity=function(g,e){if(e.dojoKind!=='hound')return dojoOldEntityRender(g,e);g.save();g.globalAlpha*=Math.min(1,e.age/.15,e.life/.25);dojoPaintHound(g,e);g.restore();};
dojoLightning=function(g,x,y,r,frame,alpha=1){frame=clamp(Math.floor(frame),0,23);dojoKitFrames.clone.add(frame);const hash=n=>{const v=Math.sin(n*127.1+frame*311.7)*43758.5453;return v-Math.floor(v)};g.save();g.translate(x,y);g.globalAlpha*=alpha;g.lineJoin='miter';g.lineCap='butt';g.shadowColor='#43caff';g.shadowBlur=4;const count=r>45?12:6;for(let i=0;i<count;i++){if(hash(i+30)<.24)continue;const px=(hash(i*9+1)-.5)*r*1.35,py=(hash(i*9+2)-.5)*r*1.7,angle=hash(i*9+3)*TAU,length=5+hash(i*9+4)*8;g.save();g.translate(px,py);g.rotate(angle);for(const [color,width]of [['#28bfff',2.5],['#efffff',1]]){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(-length/2,0);g.lineTo(-length/6,-3);g.lineTo(length/7,2);g.lineTo(length/2,-1);g.stroke();}g.fillStyle='#ffffff';g.fillRect(-1,-1,2,2);g.restore();}g.restore();};
function dojoRenderBurst(g,e){if(e.name==='clone')dojoLightning(g,e.x,e.y-15,e.size/2,Math.min(23,Math.floor(e.age/e.maxLife*24)),e.life/e.maxLife);else dojoEffect(g,e.name,e.x,e.y,e.size,e.age/e.maxLife*24);}
function dojoRenderWallPart(g,e,offset=0){const frame=e.age<.35?e.age/.35*8:e.life<.55?16+(1-e.life/.55)*7:8+Math.floor(e.age*10)%8,size=e.vertical?76:180;g.save();g.globalAlpha*=Math.min(1,e.age/.2,e.life/.25);dojoEffect(g,'wall',e.x,e.y+offset+(e.vertical?8:12)-size*.4,size,frame);g.restore();}
function dojoDrawParticle(f){ctx.save();const remaining=Math.max(0,1-f.age/f.duration);ctx.globalAlpha=remaining*remaining*(3-2*remaining);ctx.translate(f.x,f.y);ctx.scale(.35+.65*remaining,.35+.65*remaining);const c=vcolor(f.id);if([25,32,42,47].includes(f.id))vdiamond(0,0,f.size*1.8,c,f.spin);else if([7,31,43,44].includes(f.id))vpetal(0,0,f.size*1.7,c,f.spin+f.age*5);else vline(0,0,-f.vx*.025,-f.vy*.025,c,f.size);ctx.restore();}
function dojoDepthEntries(){const entries=[];let serial=0;const add=(kind,y,paint,priority=0)=>entries.push({kind,y:Number.isFinite(y)?y:0,priority,serial:serial++,paint});
 for(const a of actors)add(a.trainingDummy?'dummy':'actor',a.y,()=>integratedDrawActor(a),1);
 for(const e of dojoEntities){if(e.life<=0)continue;if(e.dojoKind==='wall'){for(const offset of e.vertical?[-48,0,48]:[0])add('wall',e.y+offset,()=>dojoRenderWallPart(ctx,e,offset));}else add(e.dojoKind,e.y,()=>dojoRenderEntity(ctx,e),e.dojoKind==='phase'?2:0);}
 for(const o of objects){if(o.dojoKind||o.life<=0)continue;add('object',o.y,()=>{const all=objects,effects=ninjaEffects;objects=[o];ninjaEffects=[];try{dojoKitObjects()}finally{objects=all;ninjaEffects=effects}});}
 for(const f of ninjaEffects)add('legacy-skill',f.follow?.y??f.y,()=>drawNinjaRaster(ctx,f.row,f.follow?.x??f.x,(f.follow?.y??f.y)-(f.row===5?25:0),f.size,Math.floor((1-f.life/f.max)*24)/23,f.angle));
 for(const e of dojoBursts)add('burst',e.y,()=>dojoRenderBurst(ctx,e),2);
 for(const s of shots){if(s.life<=0)continue;add('projectile',s.y,()=>{if(s.dojoBlade)dojoEffect(ctx,'blade',s.x,s.y-12,76,Math.floor((s.age||0)*32)%24);else{const all=shots;shots=[s];try{dojoKitProjectiles()}finally{shots=all}}},2);}
 for(const f of vfxEvents)add('effect',f.y??f.owner?.y,()=>vfxDrawEvent(f,false),2);
 for(const f of vfxParticles)add('particle',f.y,()=>dojoDrawParticle(f),2);
 for(const f of fx)add('impact',f.y,()=>{const all=fx;fx=[f];try{vfxDrawLegacy()}finally{fx=all}},2);
 if(pillarCache)for(const o of pillars){const margin=o.r+22,x=o.x-margin,y=o.y-margin;add('pillar',o.y,()=>ctx.drawImage(pillarCache,x,y,margin*2,margin*2,x,y,margin*2,margin*2));}
 return entries.sort((a,b)=>a.y-b.y||a.priority-b.priority||a.serial-b.serial);
}
function dojoDrawDepthWorld(){drawModeWorld();drawEntryCosmetic();vfxDrawLayer(true);const entries=dojoDepthEntries();dojoDepthTrace=entries.map(({kind,y})=>({kind,y}));for(const entry of entries)entry.paint();}
const DOJO_DODGE_SRC="assets/sprites/arte_028.webp";
const DOJO_WOUND_SOURCES={"worn-base": "assets/sprites/arte_029.webp", "worn-casting": "assets/sprites/arte_030.webp", "worn-strike-side": "assets/sprites/arte_031.webp", "worn-strike-front": "assets/sprites/arte_032.webp", "worn-strike-back": "assets/sprites/arte_033.webp", "pain": "assets/sprites/arte_034.webp", "blood": "assets/sprites/arte_035.webp"};
const DOJO_WOUND_REG={"side": {"row": 0, "scale": 1.0220264317180616, "frames": [{"height": 227, "anchor": [122.0, 250.0]}, {"height": 225, "anchor": [109.5, 248.0]}, {"height": 226, "anchor": [130.5, 249.0]}, {"height": 215, "anchor": [122.0, 251.0]}, {"height": 232, "anchor": [124.5, 252.0]}, {"height": 234, "anchor": [117.0, 251.0]}, {"height": 230, "anchor": [121.5, 250.0]}, {"height": 223, "anchor": [131.0, 255.0]}, {"height": 199, "anchor": [122.5, 232.0]}, {"height": 203, "anchor": [124.5, 242.0]}, {"height": 204, "anchor": [124.0, 241.0]}, {"height": 209, "anchor": [126.0, 244.0]}, {"height": 218, "anchor": [136.5, 232.0]}, {"height": 220, "anchor": [124.5, 237.0]}, {"height": 230, "anchor": [110.0, 244.0]}, {"height": 215, "anchor": [108.5, 236.0]}, {"height": 240, "anchor": [99.0, 255.0]}, {"height": 218, "anchor": [119.5, 232.0]}, {"height": 217, "anchor": [138.0, 231.0]}, {"height": 212, "anchor": [122.0, 229.0]}, {"height": 233, "anchor": [125.0, 232.0]}, {"height": 230, "anchor": [123.5, 231.0]}, {"height": 228, "anchor": [121.5, 232.0]}, {"height": 228, "anchor": [123.5, 232.0]}]}, "front": {"row": 1, "scale": 1.0220264317180616, "frames": [{"height": 227, "anchor": [129.0, 234.0]}, {"height": 236, "anchor": [127.5, 241.0]}, {"height": 236, "anchor": [124.5, 241.0]}, {"height": 230, "anchor": [128.0, 235.0]}, {"height": 237, "anchor": [128.0, 239.0]}, {"height": 242, "anchor": [127.0, 245.0]}, {"height": 242, "anchor": [130.0, 245.0]}, {"height": 240, "anchor": [123.0, 243.0]}, {"height": 245, "anchor": [134.0, 249.0]}, {"height": 243, "anchor": [125.0, 249.0]}, {"height": 245, "anchor": [116.5, 249.0]}, {"height": 241, "anchor": [138.0, 249.0]}, {"height": 239, "anchor": [132.0, 248.0]}, {"height": 240, "anchor": [124.0, 247.0]}, {"height": 238, "anchor": [120.5, 247.0]}, {"height": 241, "anchor": [138.5, 248.0]}, {"height": 231, "anchor": [133.0, 235.0]}, {"height": 235, "anchor": [121.5, 239.0]}, {"height": 230, "anchor": [124.5, 234.0]}, {"height": 233, "anchor": [134.5, 238.0]}, {"height": 237, "anchor": [134.0, 237.0]}, {"height": 236, "anchor": [130.0, 237.0]}, {"height": 235, "anchor": [124.5, 237.0]}, {"height": 237, "anchor": [129.5, 238.0]}]}, "back": {"row": 2, "scale": 1.0403587443946187, "frames": [{"height": 223, "anchor": [136.0, 245.0]}, {"height": 223, "anchor": [121.0, 245.0]}, {"height": 222, "anchor": [118.5, 245.0]}, {"height": 222, "anchor": [114.5, 245.0]}, {"height": 225, "anchor": [121.0, 242.0]}, {"height": 228, "anchor": [119.0, 245.0]}, {"height": 224, "anchor": [116.0, 242.0]}, {"height": 225, "anchor": [110.5, 242.0]}, {"height": 232, "anchor": [122.0, 238.0]}, {"height": 239, "anchor": [121.5, 238.0]}, {"height": 239, "anchor": [118.5, 238.0]}, {"height": 234, "anchor": [114.5, 242.0]}, {"height": 238, "anchor": [123.5, 237.0]}, {"height": 238, "anchor": [124.0, 237.0]}, {"height": 238, "anchor": [112.5, 237.0]}, {"height": 239, "anchor": [112.5, 238.0]}, {"height": 256, "anchor": [121.0, 255.0]}, {"height": 256, "anchor": [123.5, 255.0]}, {"height": 247, "anchor": [120.0, 255.0]}, {"height": 248, "anchor": [122.0, 255.0]}, {"height": 216, "anchor": [122.0, 215.0]}, {"height": 215, "anchor": [129.5, 214.0]}, {"height": 215, "anchor": [135.0, 214.0]}, {"height": 215, "anchor": [131.5, 214.0]}]}};
const dojoWoundImages=Object.fromEntries(Object.entries(DOJO_WOUND_SOURCES).map(([name,src])=>{const im=new Image();im.src=src;return[name,im]}));
let dojoWornContext=false,dojoBlood=[],dojoBloodSerial=0;
function dojoIsWorn(a){return !!a&&a.hp>0&&a.hp<a.max*.2;}
const dojoWoundReady=dojoKitAssetsReady;
dojoKitAssetsReady=function(){return dojoWoundReady()&&Object.values(dojoWoundImages).every(im=>im.complete&&im.naturalWidth)};
function dojoPaintPain(g,a,size=72){const d=dojoDirection(a.dojoFacingAngle??a.a??0),pose=Math.min(3,Math.floor((a.dojoPain?.age||0)/.32*4)),row=DOJO_DIRECTIONAL_REG[d.name].row+(dojoIsWorn(a)?3:0),k=size/64;g.save();g.scale(d.flip,1);g.imageSmoothingEnabled=false;g.drawImage(dojoWoundImages.pain,pose*80,row*80,80,80,-40*k,-70*k+size/6,80*k,80*k);g.restore();return true;}
const dojoWoundFighter=drawAnimatedFighter;
drawAnimatedFighter=function(g,a,size=72,t=vfxTime){const before=dojoWornContext;dojoWornContext=dojoIsWorn(a);try{if(a.skin===1&&a.dojoPain)return dojoPaintPain(g,a,size);if(a.skin===1&&a.dojoCloneDash){return dojoPaintBody(g,6,size,a.dojoCloneDash.angle);}return dojoWoundFighter(g,a,size,t);}finally{dojoWornContext=before}};
const dojoWoundRelease=dojoRelease;
dojoRelease=function(a,q){dojoWoundRelease(a,q);if(q.id!==27)return;const clone=dojoEntities.find(e=>e.dojoKind==='clone'&&e.owner===a&&e.life>0);if(clone)clone.worn=dojoIsWorn(a);a.dojoCloneDash={angle:q.angle,age:0,moved:0,duration:.24,distance:150,blocked:false};if(a===p)toast('Cópia deixada para trás · avanço na direção da mira');};
skills[27].desc=dojoKitDescriptions[27]='Deixa uma cópia com 30 HP por 6s e avança até 150 unidades na direção da mira. Obstáculos interrompem o dash. O primeiro golpe na cópia eletrifica o agressor: 55 de dano e imobilização por 0,7s.';
skills[2].name='Matilha Elétrica';
skills[2].desc=dojoKitDescriptions[2]='Três cães elétricos de corpo inteiro perseguem por até 6s. Corrida e mordida animadas; o contato prende por 0,8s e cada cão causa 18 de dano (54 no total).';
const dojoWoundEntity=dojoRenderEntity;
dojoRenderEntity=function(g,e){if(e.dojoKind!=='clone')return dojoWoundEntity(g,e);g.save();g.globalAlpha*=Math.min(1,e.age/.2,e.life/.25);g.save();g.translate(e.x,e.y);g.globalAlpha*=.65;g.filter='sepia(.5) saturate(2) hue-rotate(125deg)';const previous=dojoWornContext;dojoWornContext=!!e.worn;try{dojoPaintBody(g,0,72,e.angle)}finally{dojoWornContext=previous}g.restore();dojoLightning(g,e.x,e.y-24,32,Math.floor(e.age*24)%24,.8);g.restore();};
const dojoElectricPaint=dojoPaintHound;
dojoPaintHound=function(g,e,scale=1){dojoElectricPaint(g,e,scale);dojoLightning(g,e.x,e.y-20*scale,29*scale,Math.floor((e.age||e.gait/12||0)*24)%24,.85);};
function dojoAddBlood(x,y,angle=0,strong=false){const e={x,y,angle,strong,age:0,life:strong?.42:12,maxLife:strong?.42:12,size:strong?64:14+(dojoBloodSerial%4)*2,pose:dojoBloodSerial++%4};dojoBlood.push(e);if(dojoBlood.length>84)dojoBlood.splice(0,dojoBlood.length-84);return e;}
function dojoPaintBlood(g,e){const im=dojoWoundImages.blood,sw=im.naturalWidth/4,sh=im.naturalHeight/2,f=e.strong?Math.min(3,Math.floor(e.age/.42*4)):e.pose;g.save();g.translate(e.x,e.y-(e.strong?24:0));g.rotate(e.angle);g.globalAlpha=e.strong?Math.min(1,e.life/.1):.75*Math.min(1,e.life/3);g.imageSmoothingEnabled=false;g.drawImage(im,f*sw,e.strong?0:sh,sw,sh,-e.size/2,-e.size/2,e.size,e.size);g.restore();}
const dojoWoundHit=hit;
hit=function(a,n,owner,knock=0,angle=0,visualId=visualContext?.id??-1){const hp=a?.hp,result=dojoWoundHit(a,n,owner,knock,angle,visualId),lost=hp-a?.hp;if(result&&lost>0&&a.skin===1&&!a.trainingDummy){a.dojoPain={age:0};if(lost>=80){dojoAddBlood(a.x,a.y,angle,true);for(let i=0;i<3;i++){const spread=angle+(i-1)*.35;dojoAddBlood(a.x+Math.cos(spread)*(14+i*9),a.y+Math.sin(spread)*(14+i*9),spread);}}}return result;};
const dojoWoundStep=step;
step=function(dt){if(state!=='fight'){dojoWoundStep(dt);return}const elapsed=dt*dojoSpeed;for(const a of actors)if(a.dojoPain){a.dojoPain.age+=elapsed;if(a.dojoPain.age>=.32)a.dojoPain=null;}for(const e of dojoBlood){e.age+=elapsed;e.life-=elapsed;}dojoBlood=dojoBlood.filter(e=>e.life>0);dojoWoundStep(dt);if(state!=='fight')return;
 for(const a of actors){const d=a.dojoCloneDash;if(d&&a.hp>0){const prev=d.age;d.age+=elapsed;const desired=d.distance*clamp(d.age/d.duration,0,1),amount=desired-d.moved;if(amount>0&&!d.blocked){const x=a.x,y=a.y;d.blocked=move(a,Math.cos(d.angle)*amount,Math.sin(d.angle)*amount);d.moved+=Math.hypot(a.x-x,a.y-y);}a.dojoFacingAngle=d.angle;if(d.age>=d.duration||d.blocked)a.dojoCloneDash=null;}
  if(!dojoIsWorn(a)||a.trainingDummy){a.dojoTrailPoint=null;continue;}const point=a.dojoTrailPoint;if(!point){a.dojoTrailPoint={x:a.x,y:a.y};continue;}const distance=dist(a,point);if(distance>=18){const count=Math.min(8,Math.floor(distance/18)),angle=Math.atan2(a.y-point.y,a.x-point.x);for(let i=1;i<=count;i++)dojoAddBlood(point.x+Math.cos(angle)*18*i,point.y+Math.sin(angle)*18*i,angle);a.dojoTrailPoint={x:a.x,y:a.y};}}
};
const dojoWoundGround=drawModeWorld;
drawModeWorld=function(){dojoWoundGround();for(const e of dojoBlood)if(!e.strong)dojoPaintBlood(ctx,e)};
const dojoWoundDepth=dojoDepthEntries;
dojoDepthEntries=function(){const entries=dojoWoundDepth();for(const e of dojoBlood)if(e.strong)entries.push({kind:'blood-spray',y:e.y,priority:2,serial:entries.length,paint:()=>dojoPaintBlood(ctx,e)});return entries.sort((a,b)=>a.y-b.y||a.priority-b.priority||a.serial-b.serial);};
const dojoWoundReset=resetPractice;
resetPractice=function(clear=true){dojoBlood=[];for(const a of actors){a.dojoPain=null;a.dojoCloneDash=null;a.dojoTrailPoint=null;}return dojoWoundReset(clear)};
function dojoSetHealth(fraction){if(!p)return;p.hp=Math.max(1,Math.round(p.max*fraction));p.dojoPain=null;p.dojoTrailPoint=null;updateUI();const el=$('#dojoHealth');if(el)el.value=String(fraction);}
setGuard=function(a,active){
 if(!a)return false;
 if(!active){a.guard=false;return true;}
 if(state!=='fight'||a.hp<=0){a.guard=false;return false;}
 if(a.guardBreak>0){a.guard=false;return false;}
 if(a.st<=0){breakGuard(a);return false;}
 if(state!=='fight'||a.hp<=0||a.cast>0||a.dash>0||a.dodgeTime>0||a.root>0||a.punchTime>0||(!a.guard&&a.st<6)){a.guard=false;return false;}
 if(!a.guard)a.guardPerfect=.18;
 a.guard=true;a.moving=false;a.a=aim(a);return true;
};
breakGuard=function(a){
 if(!a||a.guardBreak>0)return;
 a.guard=false;a.guardPerfect=0;a.st=0;a.guardBreak=5;a.guardTimer=0;a.root=Math.max(a.root,.65);a.blockFlash=.3;
 float(a.x,a.y-48,'GUARDA · 5s','#f2a38e');ring(a.x,a.y,48,'#ed9c87',.45);
 if(a===p)toast('Guarda quebrada · defesa indisponível por 5 segundos');
};
punch=function(a,angle,dmg){return championOldPunch(a,angle,dmg)};
const revisionUpdateUI=updateUI;
updateUI=function(){revisionUpdateUI();if(!p)return;const el=$('#defend'),label=el?.querySelector('small');if(label)label.textContent=p.guardBreak>0?Math.ceil(p.guardBreak)+'s':p.guard?'DEFESA':'SEGURE';el?.setAttribute('aria-disabled',String(p.guardBreak>0));el?.classList.toggle('no-resource',p.guardBreak>0);if($('#attack small'))$('#attack small').textContent=p.actionRecovery>0?'RECUPERA':'ATAQUE';};
function revisionTeleport(a,angle,range){
 // Only the landing position collides; the path can cross any obstacle or actor.
 for(let distance=range;distance>=8;distance-=2){const x=a.x+Math.cos(angle)*distance,y=a.y+Math.sin(angle)*distance;
  if(x<a.r+25||y<a.r+25||x>W-a.r-25||y>H-a.r-25||blocked(x,y,a.r))continue;
  if(actors.some(e=>e!==a&&e.hp>0&&Math.hypot(e.x-x,e.y-y)<a.r+e.r+3))continue;
  return{x,y};
 }return{x:a.x,y:a.y};
}
function revisionSprite(g,im,x,y,size,frame,angle=0,height=size,anchor='center'){
 if(!im?.naturalWidth)return;const n=clamp(Math.floor(frame),0,7),w=im.naturalWidth/4,h=im.naturalHeight/2;
 g.save();g.translate(x,y);orientSkillSprite(g,angle);g.imageSmoothingEnabled=true;
 g.drawImage(im,n%4*w,Math.floor(n/4)*h,w,h,-size/2,anchor==='bottom'?-height*0.92:-height/2,size,height);g.restore();
}
const integratedNinjaCast=castCore,integratedNinjaPaint=drawAnimatedFighter;

const ASTRAL_SOURCES={"base": "assets/sprites/arte_036.webp", "beam": "assets/sprites/arte_037.webp", "blink": "assets/sprites/arte_038.webp", "blood": "assets/sprites/arte_035.webp", "cast-back": "assets/sprites/arte_040.webp", "cast-front": "assets/sprites/arte_041.webp", "cast-side": "assets/sprites/arte_042.webp", "dodge": "assets/sprites/arte_028.webp", "dragon": "assets/sprites/arte_044.webp", "icon-0": "assets/sprites/arte_045.webp", "icon-1": "assets/sprites/arte_046.webp", "icon-2": "assets/sprites/arte_047.webp", "icon-3": "assets/sprites/arte_048.webp", "icon-4": "assets/sprites/arte_049.webp", "icon-5": "assets/sprites/arte_050.webp", "pain": "assets/sprites/arte_051.webp", "portrait": "assets/sprites/arte_052.webp", "shot": "assets/sprites/arte_053.webp", "sphere": "assets/sprites/arte_054.webp", "worn-base": "assets/sprites/arte_055.webp", "worn-cast-back": "assets/sprites/arte_056.webp", "worn-cast-front": "assets/sprites/arte_057.webp", "worn-cast-side": "assets/sprites/arte_058.webp", "walk": "assets/sprites/arte_059.webp", "worn-walk": "assets/sprites/arte_060.webp", "aura-contour": "assets/sprites/arte_061.webp"};
const ASTRAL_IDS=[29,0,43,5,41,28];
const ASTRAL_SKILLS=[
 ['Onda Astral','Concentra energia por 0,68s e dispara um feixe de alcance 430. Quatro pulsos de 30 de dano (120). Obstáculos interrompem o feixe.',28,7,430,1.35],
 ['Rajada Estelar','Dispara seis esferas em sequência na direção da mira: 18 de dano cada, até 108. Alcance 420. Projéteis colidem com obstáculos.',22,6,420,1.3],
 ['Passo Celeste','Teletransporta para o ponto escolhido, até 320 unidades, atravessando obstáculos, paredes e adversários. A chegada ocorre em um ponto livre. Remove imobilização e concede 0,25s de invulnerabilidade na chegada.',18,5,320,.7],
 ['Punho do Dragão Astral','Prepara um soco e avança até 220 unidades com um dragão de energia. Acerta uma vez: 120 de dano e empurrão. Obstáculos interrompem a investida.',26,8,220,1.15],
 ['Pulso Carmesim','Após a preparação, recebe uma aura por 6s: +25% de dano e +25% de movimento. Reativar renova a duração, sem acumular bônus.',24,16,0,.95],
 ['Esfera Celestial','ULT: reúne energia acima da cabeça por 1,4s e lança uma esfera colossal. Explode em área de raio 110, causando 360 de dano. Alcance 520. Exige HP ≤20% fora do treino; livre no dojo.',0,45,520,2.25]
];
ASTRAL_SKILLS.forEach((v,i)=>Object.assign(skills[ASTRAL_IDS[i]],{name:v[0],desc:v[1],cost:v[2],cd:v[3],range:v[4],ultimate:i===5,champion:0,type:i===5?'Ultimate':i===2?'Mobilidade':i===4?'Buff':'Ataque',color:['#8cefff','#ffd68a','#a6efff','#ffce69','#ff7a88','#c4eeff'][i]}));
CHAMPIONS[0].kit=ASTRAL_IDS;
CHAMPIONS[0].ult='Esfera Celestial';
const astralImages=Object.fromEntries(Object.entries(ASTRAL_SOURCES).map(([k,src])=>{const im=new Image();im.src=src;return[k,im]}));
let astralSpeed=1,astralEffects=[],astralBlood=[],astralInspect=null,astralPreviewMode='idle',astralPreviewSkill=0,astralPreviewAngle=0,astralTrialUlt=true;
const astralSeen=Array.from({length:6},()=>new Set());
function astralWorn(a){return a?.hp>0&&a.hp<a.max*.2;}
function astralDirection(angle=0){const x=Math.cos(angle),y=Math.sin(angle);return Math.abs(y)>Math.abs(x)?{name:y>0?'front':'back',row:y>0?1:2,flip:1}:{name:'side',row:0,flip:x<0?-1:1};}
function astralReady(){return Object.values(astralImages).every(im=>im.complete&&im.naturalWidth);}
const ASTRAL_WAVE={releaseFrame:12,beamLife:.54};
function astralWaveRelease(){return ASTRAL_WAVE.releaseFrame/24*ASTRAL_SKILLS[0][5];}
function astralWaveStage(age){return age<astralWaveRelease()?'charge':age<astralWaveRelease()+ASTRAL_WAVE.beamLife?'beam':'recover';}
function astralPose(i,f){const seq=[
 [0,0,1,1,2,2,2,3,3,3,4,4,5,5,5,5,5,6,6,6,6,6,7,0],
 [0,1,1,2,2,3,3,4,4,3,5,5,3,6,6,3,5,5,3,6,6,7,7,0],
 [0,0,1,1,2,2,2,2,2,2,3,3,4,4,5,5,6,6,6,7,7,7,0,0],
 [0,1,1,2,2,2,3,3,3,4,4,4,4,5,5,5,5,6,6,6,7,7,0,0],
 [0,1,1,2,2,2,3,3,4,4,4,4,4,5,5,5,5,6,6,6,7,7,0,0],
 [0,1,1,2,2,2,3,3,3,3,3,4,4,4,4,5,5,5,5,6,6,7,7,0]
 ];return seq[i][clamp(Math.floor(f),0,23)];}
function astralPaint(g,a,size=72,override=null){const d=astralDirection(override?.angle??a.astralFacing??a.a??0),worn=astralWorn(a),q=override??a.astralCast;let im,row,pose;
 if(a.astralPain&&!override){im=astralImages.pain;row=d.row+(worn?3:0);pose=Math.min(3,Math.floor(a.astralPain/.32*4));}
 else if(q){im=astralImages[(worn?'worn-':'')+'cast-'+d.name];row=q.index;const f=q.frame??Math.min(23,Math.floor(q.age/q.duration*24));pose=astralPose(q.index,f);astralSeen[q.index].add(f);}
 else if(a.moving&&!(a.dodgeTime>0)&&!a.guard&&!(a.punchTime>0)){im=astralImages[(worn?'worn-walk':'walk')];row=d.row;pose=Math.floor(a.gait||0)%8;}else{im=astralImages[worn?'worn-base':'base'];row=d.row;pose=a.dodgeTime>0?6:a.guard?5:a.punchTime>0?(a.punchSide<0?3:4):a.moving?[1,0,2,0][Math.floor(a.gait||0)%4]:0;}
 if(!im?.naturalWidth)return false;const k=size/64;g.save();g.scale(d.flip,1);g.imageSmoothingEnabled=false;g.drawImage(im,pose*160,row*160,160,160,-80*k,-114*k+12,160*k,160*k);g.restore();return true;
}
function astralRay(x,y,angle,max,r=0){let length=0;for(let d=4;d<=max;d+=4){if(blocked(x+Math.cos(angle)*d,y+Math.sin(angle)*d,r))break;length=d;}return length;}
function astralBlinkPlan(a,angle,range=160){let target={x:a.x,y:a.y};for(let d=4;d<=range;d+=4){const x=a.x+Math.cos(angle)*d,y=a.y+Math.sin(angle)*d;if(blocked(x,y,a.r)||actors.some(b=>b!==a&&b.hp>0&&Math.hypot(x-b.x,y-b.y)<a.r+b.r+4))break;target={x,y};}return target;}
castCore=function(a,id,manual){const index=ASTRAL_IDS.indexOf(id),s=skills[id];if(!a||a.skin!==0||index<0||!a.kit.includes(id)||state!=='fight'||a.hp<=0||a.astralCast||a.cast>0||a.skillLock>0||a.actionRecovery>0||a.punchTime>0||a.dodgeTime>0||a.guard||a.cd[id]>0||a.mp<s.cost||a.root>0&&index!==2)return false;if(index===5&&!canUseUltimate(a)){toast('Ultimate: HP de 20% ou menos');return false;}
 const angle=aim(a,manual),dest=index===2?astralBlinkPlan(a,angle):null;if(dest&&dist(a,dest)<8){toast('Sem espaço para o teletransporte');return false;}
 a.a=a.astralFacing=angle;a.guard=false;a.mp-=s.cost;a.cd[id]=s.cd;a.cast=a.skillLock=ASTRAL_SKILLS[index][5];a.champAction=null;a.astralCast={index,id,angle,age:0,duration:a.cast,released:false,launched:0,moved:0,blocked:false,hit:false,distance:index===3&&manual===undefined?Math.min(220,Math.max(0,dist(a,enemy(a))-42)):220};fighterEchoStates.delete(a);toast(s.name);return true;};
function astralBurst(kind,x,y,size,angle=0){astralEffects.push({kind:'burst',art:kind,x,y,size,angle,age:0,life:.55,maxLife:.55});}
function astralProjectile(a,kind,angle,dmg,speed,range,r){const e={kind,owner:a,x:a.x+Math.cos(angle)*28,y:a.y+Math.sin(angle)*28,angle,dmg,speed,r,travel:0,range,age:0,life:range/speed,maxLife:range/speed};astralEffects.push(e);return e;}
function astralExplode(e){if(e.exploded)return;e.exploded=true;astralBurst('sphere',e.x,e.y,250);combatImpact(2);for(const a of opponents(e.owner))if(dist(a,e)<110+a.r&&lineClear(e,a))hit(a,e.dmg,e.owner,18,Math.atan2(a.y-e.y,a.x-e.x),28);e.life=0;}
function astralEffect(g,name,x,y,size,frame,angle=0,height=size){const im=astralImages[name];if(!im?.naturalWidth)return;frame=clamp(Math.floor(frame),0,23);const w=im.naturalWidth/4,h=im.naturalHeight/6;g.save();g.translate(x,y);orientSkillSprite(g,angle);g.imageSmoothingEnabled=false;g.drawImage(im,frame%4*w,Math.floor(frame/4)*h,w,h,-size/2,-height/2,size,height);g.restore();}
function astralBloodAdd(x,y,strong=false,angle=0){astralBlood.push({x,y,strong,angle,age:0,life:strong?.42:12,pose:Math.floor(Math.random()*4)});if(astralBlood.length>84)astralBlood.shift();}
function astralDrawBlood(e){const im=astralImages.blood,w=im.naturalWidth/4,h=im.naturalHeight/2,f=e.strong?Math.min(3,Math.floor(e.age/.42*4)):e.pose,size=e.strong?64:16;ctx.save();ctx.translate(e.x,e.y-(e.strong?24:0));ctx.rotate(e.angle);ctx.globalAlpha=e.strong?1:.75*Math.min(1,e.life/3);ctx.drawImage(im,f*w,e.strong?0:h,w,h,-size/2,-size/2,size,size);ctx.restore();}
const astralBaseHit=hit;
hit=function(a,n,owner,knock=0,angle=0,visualId=-1){const before=a?.hp;const result=astralBaseHit(a,n*(owner?.buff.astralPower>0?1.25:1),owner,knock,angle,visualId);if(result&&before>a.hp&&!a.trainingDummy&&a.skin===0){a.astralPain=.0001;if(before-a.hp>=80){astralBloodAdd(a.x,a.y,true,angle);for(let i=0;i<3;i++)astralBloodAdd(a.x+Math.cos(angle)*(10+i*9),a.y+Math.sin(angle)*(10+i*9),false,angle)}}return result};
const astralBaseStep=step;
step=function(dt){if(state!=='fight'){astralBaseStep(dt);return;}dt*=astralSpeed;
 for(const a of actors)if(a.astralPain){a.astralPain+=dt;if(a.astralPain>=.32)a.astralPain=0;}
 for(const e of astralBlood){e.age+=dt;e.life-=dt;}astralBlood=astralBlood.filter(e=>e.life>0);
 astralBaseStep(dt);if(state!=='fight')return;
 for(const a of actors.filter(a=>a.skin===0)){if(a.hp<=0){a.astralCast=null;continue;}const q=a.astralCast;if(q){q.age+=dt;a.moving=false;a.astralFacing=q.angle;
  if(q.index===0&&!q.released&&q.age>=astralWaveRelease()){q.released=true;astralEffects.push({kind:'beam',owner:a,x:a.x+Math.cos(q.angle)*24,y:a.y+Math.sin(q.angle)*24,angle:q.angle,age:0,life:ASTRAL_WAVE.beamLife,maxLife:ASTRAL_WAVE.beamLife,pulses:0,nextPulse:0});}
  if(q.index===1){while(q.launched<6&&q.age>=.27+q.launched*.145){const offset=q.launched%2?.018:-.018;q.launched++;astralProjectile(a,'bolt',q.angle+offset,18,440,420,9);}}
  if(q.index===2&&!q.released&&q.age>=.27){q.released=true;const dest=aimLandingV4(a,q,320);astralBurst('blink',a.x,a.y-24,110);a.x=dest.x;a.y=dest.y;a.root=0;a.inv=Math.max(a.inv,.25);astralBurst('blink',a.x,a.y-24,110);}
  if(q.index===3){const desired=q.distance*clamp((q.age-.34)/.34,0,1),delta=desired-q.moved;if(delta>0&&!q.blocked){const old={x:a.x,y:a.y};q.blocked=move(a,Math.cos(q.angle)*delta,Math.sin(q.angle)*delta);q.moved+=dist(old,a);if(!q.hit){const target=opponents(a).filter(e=>lineDistance(e.x,e.y,old.x,old.y,a.x+Math.cos(q.angle)*32,a.y+Math.sin(q.angle)*32)<36&&lineClear(a,e))[0];if(target){q.hit=hit(target,120,a,18,q.angle,5);astralBurst('dragon',target.x,target.y-24,150,q.angle);combatImpact(1.4);}}}}
  if(q.index===4&&!q.released&&q.age>=.45){q.released=true;a.buff.astralPower=6;}
  if(q.index===5&&!q.released&&q.age>=1.4){q.released=true;astralProjectile(a,'sphere',q.angle,360,270,520,37);combatImpact(1.4);}
  astralSeen[q.index].add(Math.min(23,Math.floor(q.age/q.duration*24)));if(q.age>=q.duration){a.astralCast=null;a.cast=0;a.skillLock=0;}
 }else if(a.dodgeTime>0)a.astralFacing=a.dodgeA;else if(a.guard||a.punchTime>0||a===p&&aimGesture)a.astralFacing=a.a;else if(a===p&&a.moving){const m=movement();if(m.len>.06)a.astralFacing=Math.atan2(m.y,m.x);}
 if(astralWorn(a)&&!a.trainingDummy){if(a.astralTrail&&dist(a,a.astralTrail)>=18){const d=dist(a,a.astralTrail),angle=Math.atan2(a.y-a.astralTrail.y,a.x-a.astralTrail.x);for(let i=1;i<=Math.min(8,Math.floor(d/18));i++)astralBloodAdd(a.astralTrail.x+Math.cos(angle)*i*18,a.astralTrail.y+Math.sin(angle)*i*18);a.astralTrail={x:a.x,y:a.y};}else if(!a.astralTrail)a.astralTrail={x:a.x,y:a.y};}else a.astralTrail=null;
 }
 for(const e of astralEffects){e.age+=dt;e.life-=dt;if(e.owner?.hp<=0){e.life=0;continue;}
  if(e.kind==='beam'){e.length=astralRay(e.x,e.y,e.angle,430,2);while(e.pulses<4&&e.age>=e.nextPulse){e.pulses++;e.nextPulse+=.12;const ex=e.x+Math.cos(e.angle)*e.length,ey=e.y+Math.sin(e.angle)*e.length;for(const a of opponents(e.owner))if(lineDistance(a.x,a.y,e.x,e.y,ex,ey)<18+a.r&&lineClear(e,a))hit(a,30,e.owner,1,e.angle,29);}}
  if(['bolt','sphere'].includes(e.kind)){let remaining=Math.min(e.speed*dt,e.range-e.travel);while(remaining>0&&e.life>0){const amount=Math.min(5,remaining),x=e.x+Math.cos(e.angle)*amount,y=e.y+Math.sin(e.angle)*amount;remaining-=amount;e.travel+=amount;if(blocked(x,y,e.r*.4)){if(e.kind==='sphere')astralExplode(e);else{astralBurst('shot',e.x,e.y-24,65,e.angle);e.life=0;}break;}e.x=x;e.y=y;const target=opponents(e.owner).find(a=>dist(a,e)<a.r+e.r&&lineClear(e,a));if(target){if(e.kind==='sphere')astralExplode(e);else{hit(target,e.dmg,e.owner,2,e.angle,0);astralBurst('shot',e.x,e.y-24,65,e.angle);e.life=0;}break;}}if(e.travel>=e.range||e.life<=0){if(e.kind==='sphere'&&!e.exploded)astralExplode(e);e.life=0;}}
 }
 astralEffects=astralEffects.filter(e=>e.life>0);};
const astralDrawProjectiles=vfxDrawProjectiles;
function astralDrawActor(a){if(a.trainingDummy){drawTrainingDummy(a);return;}if(a.hp<=0)return;ctx.save();ctx.translate(a.x,a.y);ellipse(0,12,20,8,'#06100c99');ctx.save();ctx.translate(0,10);ctx.scale(1,.42);drawTeamMarker(a);ctx.restore();if(a.root>0)outline(0,10,23,'#c6b6e8');if(a.inv>0)ctx.globalAlpha=.65;const q=a.astralCast;if(q?.index===2&&q.age>.23&&q.age<.33)ctx.globalAlpha*=.18;astralPaint(ctx,a);ctx.restore();}
function astralDrawBeamPart(e,n,count){const im=astralImages.beam,w=im.naturalWidth/4,h=im.naturalHeight/6,f=8+Math.floor(e.age*22)%10,len=e.length/count,d=(n+.5)*len;ctx.save();ctx.translate(e.x+Math.cos(e.angle)*d,e.y+Math.sin(e.angle)*d-24);ctx.rotate(e.angle);ctx.globalAlpha=Math.min(1,e.life/.12);ctx.drawImage(im,f%4*w+n/count*w,Math.floor(f/4)*h,w/count,h,-len/2,-43,len+.5,86);ctx.restore();}
function astralDepth(){const entries=[];let serial=0;const add=(kind,y,paint,priority=0)=>entries.push({kind,y,paint,priority,serial:serial++});
 for(const a of actors.filter(a=>a.skin===0)){add('actor',a.y,()=>{if(a.buff.astralPower>0)astralEffect(ctx,'aura',a.x,a.y-22,130,6+Math.floor(vfxTime*18)%12);astralDrawActor(a);},1);const q=a.astralCast;if(q){const hand={x:a.x+Math.cos(q.angle)*26,y:a.y+Math.sin(q.angle)*26};if(q.index===0&&astralWaveStage(q.age)==='charge')add('charge',hand.y,()=>astralEffect(ctx,'sphere',hand.x,hand.y-27,30+q.age/astralWaveRelease()*30,q.age/astralWaveRelease()*8),2);if(q.index===3&&q.age>.28&&q.age<.85)add('dragon',hand.y,()=>astralEffect(ctx,'dragon',hand.x,hand.y-24,160,6+clamp((q.age-.28)/.57,0,1)*14,q.angle),2);if(q.index===5&&q.age<1.4)add('charge',a.y+1,()=>astralEffect(ctx,'sphere',a.x,a.y-112,25+q.age/1.4*150,Math.min(14,q.age/1.4*14)),2);}}
 for(const e of astralEffects){if(e.kind==='beam'){const count=Math.max(1,Math.ceil((e.length||0)/22));for(let n=0;n<count;n++)add('beam',e.y+Math.sin(e.angle)*(n+.5)*(e.length||0)/count,()=>astralDrawBeamPart(e,n,count),2);}else if(e.kind==='bolt')add('bolt',e.y,()=>astralEffect(ctx,'shot',e.x,e.y-24,55,6+Math.floor(e.age*30)%12,e.angle),2);else if(e.kind==='sphere')add('sphere',e.y,()=>astralEffect(ctx,'sphere',e.x,e.y-65,180,12+Math.floor(e.age*22)%6),2);else add('effect',e.y+24,()=>astralEffect(ctx,e.art,e.x,e.y,e.size,e.art==='blink'?e.age/e.maxLife*24:18+e.age/e.maxLife*6,e.angle),2);}
 for(const e of astralBlood)if(e.strong)add('blood',e.y,()=>astralDrawBlood(e),2);
 return entries.sort((a,b)=>a.y-b.y||a.priority-b.priority||a.serial-b.serial);
}
const astralReset=resetPractice;
resetPractice=function(clear=true){astralEffects=[];astralBlood=[];for(const a of actors.filter(a=>a.skin===0)){a.astralCast=null;a.astralPain=0;a.astralTrail=null;}const r=astralReset(clear);if(p&&b){p.x=W*.5-115;b.x=W*.5+115;p.y=b.y=H*.5;p.a=p.astralFacing=0;b.a=Math.PI;}return r;};
astralBlinkPlan=(a,angle,range=320)=>revisionTeleport(a,angle,range);
const revisionAstralEffect=astralEffect;
astralEffect=function(g,name,x,y,size,frame,angle=0,height=size){if(name==='dragon'||name==='aura')return revisionSprite(g,astralImages[name],x,y,size,frame/3,angle,height);return revisionAstralEffect(g,name,x,y,size,frame,angle,height)};
astralDepth=function(){const entries=[];let serial=0;const add=(kind,y,paint,priority=0)=>entries.push({kind,y,paint,priority,serial:serial++});
 for(const a of actors.filter(a=>a.skin===0)){add('actor',a.y,()=>astralDrawActor(a),1);if(a.buff.astralPower>0){const age=6-a.buff.astralPower,f=age<.6?age/.6*4:3+Math.floor(vfxTime*16)%3;add('crimson-aura',a.y+.2,()=>revisionSprite(ctx,astralImages.aura,a.x,a.y+13,110,f,0,125,'bottom'),2);}const q=a.astralCast;if(q){const hand={x:a.x+Math.cos(q.angle)*26,y:a.y+Math.sin(q.angle)*26};if(q.index===0&&astralWaveStage(q.age)==='charge')add('charge',hand.y,()=>astralEffect(ctx,'sphere',hand.x,hand.y-27,30+q.age/astralWaveRelease()*30,q.age/astralWaveRelease()*8),2);if(q.index===3&&q.age>.28&&q.age<.85)add('dragon',a.y+Math.sin(q.angle)*100,()=>astralEffect(ctx,'dragon',a.x+Math.cos(q.angle)*100,a.y+Math.sin(q.angle)*100-28,220,6+clamp((q.age-.28)/.57,0,1)*14,q.angle),2);if(q.index===5&&q.age<1.4)add('charge',a.y+1,()=>astralEffect(ctx,'sphere',a.x,a.y-112,25+q.age/1.4*150,Math.min(14,q.age/1.4*14)),2);}}
 for(const e of astralEffects){if(e.kind==='beam'){const count=Math.max(1,Math.ceil((e.length||0)/22));for(let n=0;n<count;n++)add('beam',e.y+Math.sin(e.angle)*(n+.5)*(e.length||0)/count,()=>astralDrawBeamPart(e,n,count),2);}else if(e.kind==='bolt')add('bolt',e.y,()=>astralEffect(ctx,'shot',e.x,e.y-24,55,6+Math.floor(e.age*30)%12,e.angle),2);else if(e.kind==='sphere')add('sphere',e.y,()=>astralEffect(ctx,'sphere',e.x,e.y-65,180,12+Math.floor(e.age*22)%6),2);else add('effect',e.y+24,()=>astralEffect(ctx,e.art,e.x,e.y,e.size,e.art==='blink'?e.age/e.maxLife*24:18+e.age/e.maxLife*6,e.angle),2);}
 for(const e of astralBlood)if(e.strong)add('blood',e.y,()=>astralDrawBlood(e),2);
 return entries.sort((a,b)=>a.y-b.y||a.priority-b.priority||a.serial-b.serial);
};
const auraV3Canvas=()=>{const c=document.createElement('canvas');c.width=c.height=256;return c;};
const auraV3Mask=auraV3Canvas(),auraV3Layer=auraV3Canvas(),auraV3Tint=auraV3Canvas();
function auraV3(g,a,x,y,size,paint,t,progress=1,solar=false,override=null){
 const m=auraV3Mask.getContext('2d'),h=auraV3Layer.getContext('2d'),c=auraV3Tint.getContext('2d');
 m.clearRect(0,0,256,256);m.save();m.translate(128,180);paint(m,a,72,override);m.restore();
 h.clearRect(0,0,256,256);h.save();h.globalAlpha=solar?.35:.8;
 const reach=(solar?5:19)*(0.85+.15*Math.sin(t*9));
 for(let j=0;j<16;j++){const an=j*TAU/16,r=reach*(1+.25*Math.sin(t*11+j*2));h.drawImage(auraV3Mask,Math.cos(an)*r,Math.sin(an)*r-3);}
 h.globalCompositeOperation='source-in';let grad=h.createLinearGradient(0,65,0,198);grad.addColorStop(0,solar?'#ffb715':'#ff1758');grad.addColorStop(.55,solar?'#ff5c08':'#ec0643');grad.addColorStop(1,solar?'#fb3905':'#a90032');h.fillStyle=grad;h.fillRect(0,0,256,256);h.restore();
 if(!solar){
  // Rising tongues extend the outline, while the center is cut out below.
  c.clearRect(0,0,256,256);c.drawImage(auraV3Mask,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#ff164e';c.fillRect(0,0,256,256);c.globalCompositeOperation='source-over';
  h.save();h.globalAlpha=.32;for(let j=0;j<5;j++){const rise=8+((t*27+j*7)%25);h.drawImage(auraV3Tint,0,0,256,256,-5-j*.5,-rise,266+j,256+rise*.12);}h.restore();
 }
 if(!solar&&typeof astralImages!=='undefined'&&astralImages['aura-contour']?.naturalWidth){h.save();h.globalCompositeOperation='source-in';revisionSprite(h,astralImages['aura-contour'],128,148,172,Math.floor(t*14)%8,0,172);h.restore();}
 // Thin warm rim hugs hair, arms, torso and legs instead of a fixed oval.
 c.clearRect(0,0,256,256);c.drawImage(auraV3Mask,0,0);c.globalCompositeOperation='source-in';c.fillStyle=solar?'#ffcd35':'#ffbd56';c.fillRect(0,0,256,256);c.globalCompositeOperation='source-over';h.save();h.globalAlpha=solar?.2:.85;for(let j=0;j<8;j++){const an=j*TAU/8;h.drawImage(auraV3Tint,Math.cos(an)*2.5,Math.sin(an)*2.5);}h.restore();
 if(!solar){h.save();h.lineWidth=1.2;h.strokeStyle='#ffe6a1';for(let j=0;j<3;j++){const side=j%2?1:-1,phase=t*13+j*3,px=128+side*(29+Math.sin(phase)*4),py=125+j*13;h.beginPath();h.moveTo(px,py-14);h.lineTo(px-side*4,py-5);h.lineTo(px+side*3,py);h.lineTo(px-side*4,py+13);h.stroke();}h.restore();}
 // No aura pixel can paint over its owner's body.
 h.save();h.globalCompositeOperation='destination-out';h.drawImage(auraV3Mask,0,0);h.restore();
 const s=size/72;g.save();g.globalAlpha*=Math.min(1,progress*1.6);g.drawImage(auraV3Layer,x-128*s,y-180*s,256*s,256*s);g.restore();
}
function ringV3(g,im,x,y,size,frame,front,height=size){
 if(!im?.naturalWidth)return;const w=im.naturalWidth/4,h=im.naturalHeight/2,f=clamp(Math.floor(frame),0,7),from=front?.5:0;
 g.save();g.imageSmoothingEnabled=true;g.drawImage(im,(f%4)*w,Math.floor(f/4)*h+from*h,w,h*.5,x-size/2,y-height/2+from*height,size,height*.5);g.restore();
}
function solarRibbonsV3(x,y,t,progress=1,scale=1){
 const out=[],growth=clamp(progress,0,1),rise=growth*66,turns=.4+growth*1.8,count=96;let group=null;
 for(let i=0;i<=count;i++){
  const u=i/count,height=u*rise,angle=u*TAU*turns-t*2.5,rad=(24+5*Math.sin(u*Math.PI))*scale,front=Math.sin(angle)>=0;
  const point={x:x+Math.cos(angle)*rad,y:y+Math.sin(angle)*10*scale-height*scale+10*scale,u};
  if(!group||front!==group.front){const previous=group?.points.at(-1);group={front,points:previous?[previous]:[]};out.push(group);}group.points.push(point);
 }
 return out.filter(e=>e.points.length>1).map((e,index)=>({kind:e.front?'solar-ribbon-front':'solar-ribbon-back',y:y+(e.front?8:-8)*scale,priority:2,paint:g=>{
  const points=e.points,trace=()=>{g.beginPath();g.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)g.lineTo(points[i].x,points[i].y);};
  g.save();g.lineJoin='round';g.lineCap='round';g.shadowColor='#ff5400';g.shadowBlur=6*scale;g.strokeStyle='#ff4a0a';g.lineWidth=7*scale;trace();g.stroke();g.shadowBlur=0;
  g.strokeStyle='#ff931a';g.lineWidth=4.4*scale;trace();g.stroke();g.strokeStyle='#fff07a';g.lineWidth=1.7*scale;trace();g.stroke();
  // Continuous paths prevent segmented bead-like edges; tapering tongues read as fire.
  for(let j=2;j<points.length-2;j+=4){const p0=points[j-2],p1=points[j],p2=points[j+2],h=(7+5*(.5+.5*Math.sin(t*13+p1.u*37)))*scale,dx=(Math.sin(t*6+p1.u*23)*5+3)*scale;
   g.fillStyle='#ff6812';g.beginPath();g.moveTo(p0.x,p0.y+2*scale);g.quadraticCurveTo(p1.x+dx,p1.y-3*scale,p1.x+dx,p1.y-h);g.quadraticCurveTo(p1.x+dx+5*scale,p1.y-2*scale,p2.x,p2.y+2*scale);g.closePath();g.fill();
   g.fillStyle='#ffd640';g.beginPath();g.moveTo(p0.x,p0.y);g.quadraticCurveTo(p1.x+dx*.8,p1.y-h*.35,p1.x+dx,p1.y-h*.75);g.quadraticCurveTo(p1.x+3*scale,p1.y,p2.x,p2.y);g.closePath();g.fill();
  }g.restore();
 }}));
}
const astralDepthV2=astralDepth;
astralDepth=function(){const entries=astralDepthV2().filter(e=>e.kind!=='crimson-aura');for(const a of actors)if(a.hp>0&&a.buff.astralPower>0)entries.push({kind:'crimson-silhouette',y:a.y+.1,priority:2,serial:entries.length,paint:()=>auraV3(ctx,a,a.x,a.y,72,astralPaint,vfxTime,clamp((6-a.buff.astralPower)/.3,0,1))});return entries.sort((a,b)=>a.y-b.y||a.priority-b.priority||a.serial-b.serial);};
const integratedAstralCast=castCore;

const ECLIPSE_SOURCES={"attract": "assets/sprites/arte_062.webp", "barrier": "assets/sprites/arte_063.webp", "base": "assets/sprites/arte_064.webp", "blink": "assets/sprites/arte_065.webp", "blood": "assets/sprites/arte_035.webp", "cast-back": "assets/sprites/arte_067.webp", "cast-front": "assets/sprites/arte_068.webp", "cast-side": "assets/sprites/arte_069.webp", "dodge": "assets/sprites/arte_028.webp", "domain": "assets/sprites/arte_071.webp", "icon-0": "assets/sprites/arte_072.webp", "icon-1": "assets/sprites/arte_073.webp", "icon-2": "assets/sprites/arte_074.webp", "icon-3": "assets/sprites/arte_075.webp", "icon-4": "assets/sprites/arte_076.webp", "icon-5": "assets/sprites/arte_077.webp", "pain": "assets/sprites/arte_078.webp", "portrait": "assets/sprites/arte_079.webp", "repel": "assets/sprites/arte_080.webp", "rupture": "assets/sprites/arte_081.webp", "worn-base": "assets/sprites/arte_082.webp", "worn-cast-back": "assets/sprites/arte_083.webp", "worn-cast-front": "assets/sprites/arte_084.webp", "worn-cast-side": "assets/sprites/arte_085.webp", "walk": "assets/sprites/arte_086.webp", "worn-walk": "assets/sprites/arte_087.webp"};
const ECLIPSE_IDS=[22,34,4,8,15,7];
const ECLIPSE_SKILLS=[
 ['Barreira do Vazio','Após 0,45s, ergue uma barreira por 4s. Reduz o dano recebido em 65% e a velocidade de projéteis inimigos próximos em 75%. Não acumula.',24,12,95,.9],
 ['Núcleo de Atração','Após 0,6s, cria um núcleo a até 260 unidades. Atrai inimigos num raio de 100 por 2,4s e causa quatro pulsos de 18 dano (72). Obstáculos bloqueiam a atração.',26,8,260,1.2],
 ['Explosão Repulsora','Estende a mão após 0,6s e lança um núcleo vermelho: 95 dano e empurrão de 65 unidades. Alcance 400. Para em obstáculos.',25,7,400,1.2],
 ['Ruptura Violeta','Une dois núcleos por 0,83s e lança energia violeta. Atravessa inimigos, causando 180 dano uma vez em cada alvo. Alcance 520. Obstáculos bloqueiam.',36,12,520,1.65],
 ['Passo do Vazio','Após 0,4s, teletransporta até 200 unidades na direção da mira, atravessando barreiras, obstáculos e inimigos. A chegada ocorre em um ponto livre. Remove imobilização e concede 0,25s de invulnerabilidade. O próximo básico acertado em até 3s recebe +45 dano.',18,6,200,.8],
 ['Horizonte Infinito','ULT: prepara por 0,9s e abre um domínio de raio 155 a até 260 unidades por 4s. Imobiliza os alvos presentes por 1,2s e causa seis pulsos de 60 dano (360). HP ≤20% fora do treino; livre no dojo.',0,45,260,1.8]
];
const ECLIPSE_ART=['barrier','attract','repel','rupture','blink','domain'];
const ECLIPSE_RELEASE=12;
function eclipseRelease(index){return ECLIPSE_RELEASE/24*ECLIPSE_SKILLS[index][5];}
ECLIPSE_SKILLS.forEach((v,i)=>Object.assign(skills[ECLIPSE_IDS[i]],{name:v[0],desc:v[1],cost:v[2],cd:v[3],range:v[4],ultimate:i===5,champion:4,slot:i,type:i===5?'Ultimate':i===4?'Mobilidade':i===0?'Defesa':'Ataque',color:['#9ceaff','#5aaaff','#ff697b','#ca87ff','#adf7ff','#d3a9ff'][i]}));
CHAMPIONS[4].kit=ECLIPSE_IDS;
CHAMPIONS[4].ult='Horizonte Infinito';
const eclipseImages=Object.fromEntries(Object.entries(ECLIPSE_SOURCES).map(([k,src])=>{const im=new Image();im.src=src;return[k,im]}));
let eclipseSpeed=1,eclipseEffects=[],eclipseBlood=[],eclipseInspect=null,eclipsePreviewMode='idle',eclipsePreviewSkill=0,eclipsePreviewAngle=0,eclipseTrialUlt=true;
const eclipseSeen=Array.from({length:6},()=>new Set());
function eclipseWorn(a){return a?.hp>0&&a.hp<a.max*.2;}
function eclipseDirection(angle=0){const x=Math.cos(angle),y=Math.sin(angle);return Math.abs(y)>Math.abs(x)?{name:y>0?'front':'back',row:y>0?1:2,flip:1}:{name:'side',row:0,flip:x<0?-1:1};}
function eclipseReady(){return Object.values(eclipseImages).every(im=>im.complete&&im.naturalWidth);}
function eclipsePose(i,f){const sequence=[0,0,1,1,2,2,2,3,3,4,4,4,5,5,5,5,6,6,6,6,6,7,7,0];return sequence[clamp(Math.floor(f),0,23)];}
function eclipsePaint(g,a,size=72,override=null){const d=eclipseDirection(override?.angle??a.eclipseFacing??a.a??0),worn=eclipseWorn(a),q=override??a.eclipseCast;let im,row,pose;
 if(a.eclipsePain&&!override){im=eclipseImages.pain;row=d.row+(worn?3:0);pose=Math.min(3,Math.floor(a.eclipsePain/.32*4));}
 else if(q){im=eclipseImages[(worn?'worn-':'')+'cast-'+d.name];row=q.index;const f=q.frame??Math.min(23,Math.floor(q.age/q.duration*24));pose=eclipsePose(q.index,f);eclipseSeen[q.index].add(f);}
 else if(a.moving&&!(a.dodgeTime>0)&&!a.guard&&!(a.punchTime>0)){im=eclipseImages[worn?'worn-walk':'walk'];row=d.row;pose=Math.floor(a.gait||0)%8;}else{im=eclipseImages[worn?'worn-base':'base'];row=d.row;pose=a.dodgeTime>0?6:a.guard?5:a.punchTime>0?(a.punchSide<0?3:4):0;}
 if(!im?.naturalWidth)return false;const k=size/64;g.save();g.scale(d.flip,1);g.imageSmoothingEnabled=false;g.drawImage(im,pose*160,row*160,160,160,-80*k,-114*k+12,160*k,160*k);g.restore();return true;
}
function eclipseRay(x,y,angle,max,r=0){let length=0;for(let d=4;d<=max;d+=4){if(blocked(x+Math.cos(angle)*d,y+Math.sin(angle)*d,r))break;length=d;}return length;}
function eclipseBlinkPlan(a,angle,range=160){let target={x:a.x,y:a.y};for(let d=4;d<=range;d+=4){const x=a.x+Math.cos(angle)*d,y=a.y+Math.sin(angle)*d;if(blocked(x,y,a.r)||actors.some(b=>b!==a&&b.hp>0&&Math.hypot(x-b.x,y-b.y)<a.r+b.r+4))break;target={x,y};}return target;}
function eclipseTarget(a,angle,manual,range){const reach=manual===undefined?Math.min(range,dist(a,enemy(a))):range;const distance=eclipseRay(a.x,a.y,angle,reach,18);return{x:a.x+Math.cos(angle)*distance,y:a.y+Math.sin(angle)*distance};}
castCore=function(a,id,manual){const index=ECLIPSE_IDS.indexOf(id),s=skills[id];if(!a||a.skin!==4||index<0||!a.kit.includes(id)||state!=='fight'||a.hp<=0||a.eclipseCast||a.cast>0||a.skillLock>0||a.actionRecovery>0||a.punchTime>0||a.dodgeTime>0||a.guard||a.cd[id]>0||a.mp<s.cost||a.root>0&&index!==4)return false;if(index===5&&!canUseUltimate(a)){toast('Ultimate: HP de 20% ou menos');return false;}
 const angle=aim(a,manual),dest=index===4?eclipseBlinkPlan(a,angle,200):null;if(dest&&dist(a,dest)<8){toast('Sem espaço para o teletransporte');return false;}
 a.a=a.eclipseFacing=angle;a.guard=false;a.mp-=s.cost;a.cd[id]=s.cd;a.cast=a.skillLock=ECLIPSE_SKILLS[index][5];a.champAction=null;a.eclipseCast={index,id,angle,age:0,duration:a.cast,released:false,target:eclipseTarget(a,angle,manual,260)};fighterEchoStates.delete(a);toast(s.name);return true;};
function eclipseBurst(art,x,y,size,angle=0){eclipseEffects.push({kind:'burst',art,x,y,size,angle,age:0,life:.55,maxLife:.55});}
function eclipseProjectile(a,kind,angle,dmg,speed,range,r){const e={kind,owner:a,x:a.x+Math.cos(angle)*28,y:a.y+Math.sin(angle)*28,angle,dmg,speed,r,travel:0,range,age:0,life:range/speed,maxLife:range/speed,hit:new Set()};eclipseEffects.push(e);return e;}
function eclipseEffect(g,name,x,y,size,frame,angle=0,height=size){const im=eclipseImages[name];if(!im?.naturalWidth)return;frame=clamp(Math.floor(frame),0,23);const w=im.naturalWidth/4,h=im.naturalHeight/6;g.save();g.translate(x,y);orientSkillSprite(g,angle);g.imageSmoothingEnabled=false;g.drawImage(im,frame%4*w,Math.floor(frame/4)*h,w,h,-size/2,-height/2,size,height);g.restore();}
function eclipseBloodAdd(x,y,strong=false,angle=0){eclipseBlood.push({x,y,strong,angle,age:0,life:strong?.42:12,pose:Math.floor(Math.random()*4)});if(eclipseBlood.length>84)eclipseBlood.shift();}
function eclipseDrawBlood(e){const im=eclipseImages.blood,w=im.naturalWidth/4,h=im.naturalHeight/2,f=e.strong?Math.min(3,Math.floor(e.age/.42*4)):e.pose,size=e.strong?64:16;ctx.save();ctx.translate(e.x,e.y-(e.strong?24:0));ctx.rotate(e.angle);ctx.globalAlpha=e.strong?1:.75*Math.min(1,e.life/3);ctx.drawImage(im,f*w,e.strong?0:h,w,h,-size/2,-size/2,size,size);ctx.restore();}
let eclipseBasicOwner=null;
const eclipseBaseHit=hit;
hit=function(a,n,owner,knock=0,angle=0,visualId=-1){const before=a?.hp,boost=eclipseBasicOwner===owner&&owner?.buff.eclipseStrike>0;const result=eclipseBaseHit(a,(n+(boost?45:0))*(a?.buff.eclipseBarrier>0?.35:1),owner,knock,angle,visualId);if(result&&before>a.hp){if(boost){owner.buff.eclipseStrike=0;eclipseBurst('blink',a.x,a.y-24,100);}if(!a.trainingDummy&&a.skin===4){a.eclipsePain=.0001;if(before-a.hp>=80){eclipseBloodAdd(a.x,a.y,true,angle);for(let i=0;i<3;i++)eclipseBloodAdd(a.x+Math.cos(angle)*(10+i*9),a.y+Math.sin(angle)*(10+i*9),false,angle)}}}return result};
const eclipseBaseBasic=basic;
basic=function(a){eclipseBasicOwner=a;try{return eclipseBaseBasic(a)}finally{eclipseBasicOwner=null}};
function eclipseAreaTargets(e){return opponents(e.owner).filter(a=>a.hp>0&&dist(a,e)<e.radius+a.r&&lineClear(e,a));}
function eclipseSpawnField(a,q,kind){eclipseEffects=eclipseEffects.filter(e=>!(e.kind===kind&&e.owner===a));const e={kind,owner:a,...q.target,angle:0,age:0,life:kind==='domain'?4:2.4,maxLife:kind==='domain'?4:2.4,radius:kind==='domain'?155:100,pulses:0,nextPulse:.25};eclipseEffects.push(e);if(kind==='domain'){for(const target of eclipseAreaTargets(e))if(target.inv<=0)target.root=Math.max(target.root,1.2);combatImpact(1.7);}return e;}
const eclipseBaseStep=step;
step=function(dt){if(state!=='fight'){eclipseBaseStep(dt);return;}dt*=eclipseSpeed;
 for(const a of actors)if(a.eclipsePain){a.eclipsePain+=dt;if(a.eclipsePain>=.32)a.eclipsePain=0;}
 for(const e of eclipseBlood){e.age+=dt;e.life-=dt;}eclipseBlood=eclipseBlood.filter(e=>e.life>0);
 // Slow hostile projectiles only while near an active barrier. Restore native velocity afterwards.
 const slowed=[];for(const s of shots){if(actors.some(a=>a.hp>0&&a.buff.eclipseBarrier>0&&!sameTeam(a,s.owner)&&lineDistance(a.x,a.y,s.x,s.y,s.x+s.vx*dt,s.y+s.vy*dt)<95)){slowed.push({s,vx:s.vx,vy:s.vy});s.vx*=.25;s.vy*=.25;s.life+=dt*.75;}}
 eclipseBaseStep(dt);for(const {s,vx,vy}of slowed){s.vx=vx;s.vy=vy;}if(state!=='fight')return;
 for(const a of actors.filter(a=>a.skin===4)){if(a.hp<=0){a.eclipseCast=null;a.buff.eclipseBarrier=0;a.buff.eclipseStrike=0;continue;}const q=a.eclipseCast;if(q){q.age+=dt;a.moving=false;a.eclipseFacing=q.angle;
  if(!q.released&&q.age>=eclipseRelease(q.index)){q.released=true;
   if(q.index===0){a.buff.eclipseBarrier=4;eclipseBurst('barrier',a.x,a.y-24,145);}
   if(q.index===1)eclipseSpawnField(a,q,'attract');
   if(q.index===2)eclipseProjectile(a,'repel',q.angle,95,360,400,14);
   if(q.index===3)eclipseProjectile(a,'rupture',q.angle,180,300,520,26);
   if(q.index===4){const dest=aimLandingV4(a,q,200);eclipseBurst('blink',a.x,a.y-24,110);a.x=dest.x;a.y=dest.y;a.root=0;a.inv=Math.max(a.inv,.25);a.buff.eclipseStrike=3;eclipseBurst('blink',a.x,a.y-24,110);}
   if(q.index===5)eclipseSpawnField(a,q,'domain');
  }
  eclipseSeen[q.index].add(Math.min(23,Math.floor(q.age/q.duration*24)));if(q.age>=q.duration){a.eclipseCast=null;a.cast=0;a.skillLock=0;}
 }else if(a.dodgeTime>0)a.eclipseFacing=a.dodgeA;else if(a.guard||a.punchTime>0||a===p&&aimGesture)a.eclipseFacing=a.a;else if(a===p&&a.moving){const m=movement();if(m.len>.06)a.eclipseFacing=Math.atan2(m.y,m.x);}
 if(eclipseWorn(a)&&!a.trainingDummy){if(a.eclipseTrail&&dist(a,a.eclipseTrail)>=18){const d=dist(a,a.eclipseTrail),angle=Math.atan2(a.y-a.eclipseTrail.y,a.x-a.eclipseTrail.x);for(let i=1;i<=Math.min(8,Math.floor(d/18));i++)eclipseBloodAdd(a.eclipseTrail.x+Math.cos(angle)*i*18,a.eclipseTrail.y+Math.sin(angle)*i*18);a.eclipseTrail={x:a.x,y:a.y};}else if(!a.eclipseTrail)a.eclipseTrail={x:a.x,y:a.y};}else a.eclipseTrail=null;
 }
 for(const e of eclipseEffects){e.age+=dt;e.life-=dt;if(e.owner?.hp<=0){e.life=0;continue;}
  if(e.kind==='attract'||e.kind==='domain'){if(e.kind==='attract')for(const target of eclipseAreaTargets(e)){if(target.inv>0)continue;const d=dist(target,e),amount=Math.min(75*dt,Math.max(0,d-12)),an=Math.atan2(e.y-target.y,e.x-target.x);move(target,Math.cos(an)*amount,Math.sin(an)*amount);target.slow=Math.max(target.slow,.12);}
   while(e.pulses<(e.kind==='domain'?6:4)&&e.age>=e.nextPulse){e.pulses++;e.nextPulse+=.6;for(const target of eclipseAreaTargets(e))hit(target,e.kind==='domain'?60:18,e.owner,0,Math.atan2(target.y-e.y,target.x-e.x),-1);}
  }
  if(e.kind==='repel'||e.kind==='rupture'){const slow=actors.some(a=>a.hp>0&&a.buff.eclipseBarrier>0&&!sameTeam(a,e.owner)&&dist(a,e)<95)?.25:1;e.life+=dt*(1-slow);let remaining=Math.min(e.speed*slow*dt,e.range-e.travel);while(remaining>0&&e.life>0){const amount=Math.min(5,remaining),x=e.x+Math.cos(e.angle)*amount,y=e.y+Math.sin(e.angle)*amount;remaining-=amount;e.travel+=amount;if(blocked(x,y,e.r*.4)){eclipseBurst(e.kind,e.x,e.y-24,e.kind==='rupture'?160:100,e.angle);e.life=0;break;}e.x=x;e.y=y;for(const target of opponents(e.owner)){if(target.hp<=0||e.hit.has(target)||dist(target,e)>=target.r+e.r||!lineClear(e,target))continue;e.hit.add(target);hit(target,e.dmg,e.owner,e.kind==='repel'?65:0,e.angle,-1);eclipseBurst(e.kind,target.x,target.y-24,e.kind==='rupture'?150:110,e.angle);if(e.kind==='repel'){e.life=0;break;}}}if(e.travel>=e.range)e.life=0;}
 }
 eclipseEffects=eclipseEffects.filter(e=>e.life>0);};
const eclipseDrawProjectiles=vfxDrawProjectiles;
function eclipseDrawActor(a){if(a.trainingDummy){drawTrainingDummy(a);return;}if(a.hp<=0)return;ctx.save();ctx.translate(a.x,a.y);ellipse(0,12,20,8,'#06100c99');ctx.save();ctx.translate(0,10);ctx.scale(1,.42);drawTeamMarker(a);ctx.restore();if(a.root>0)outline(0,10,23,'#c6b6e8');if(a.inv>0)ctx.globalAlpha=.65;const q=a.eclipseCast;if(q?.index===4&&q.age>.35&&q.age<.45)ctx.globalAlpha*=.18;eclipsePaint(ctx,a);ctx.restore();}
function eclipseEffectSlice(name,x,y,size,frame,from,height){const im=eclipseImages[name],w=im.naturalWidth/4,h=im.naturalHeight/6;frame=Math.floor(frame);ctx.save();ctx.globalAlpha=.65;ctx.drawImage(im,frame%4*w,Math.floor(frame/4)*h+from*h,w,h*height,x-size/2,y-size/2+from*size,size,size*height);ctx.restore();}
function eclipseDepth(){const entries=[];let serial=0;const add=(kind,y,paint,priority=0)=>entries.push({kind,y,paint,priority,serial:serial++});
 for(const a of actors.filter(a=>a.skin===4)){add('actor',a.y,()=>eclipseDrawActor(a),1);if(a.buff.eclipseBarrier>0){add('barrier-back',a.y-19,()=>eclipseEffectSlice('barrier',a.x,a.y-26,140,8+Math.floor(vfxTime*12)%10,0,.5),0);add('barrier-front',a.y+20,()=>eclipseEffectSlice('barrier',a.x,a.y-26,140,8+Math.floor(vfxTime*12)%10,.5,.5),2);}const q=a.eclipseCast;if(q&&q.age<eclipseRelease(q.index)){const f=q.age/eclipseRelease(q.index),hand={x:a.x+Math.cos(q.angle)*22,y:a.y+Math.sin(q.angle)*22};if(q.index===3){add('charge',hand.y,()=>{eclipseEffect(ctx,'attract',hand.x-18*(1-f),hand.y-28,20+f*16,f*8);eclipseEffect(ctx,'repel',hand.x+18*(1-f),hand.y-28,20+f*16,f*8);},2);}else if(q.age>.12)add('charge',hand.y,()=>eclipseEffect(ctx,ECLIPSE_ART[q.index],hand.x,hand.y-25,18+f*22,f*8),2);}}
 for(const e of eclipseEffects){if(e.kind==='domain'){const f=8+Math.floor(e.age*10)%10;add('domain-back',e.y-85,()=>eclipseEffectSlice('domain',e.x,e.y-40,340,f,0,.5),0);add('domain-front',e.y+85,()=>eclipseEffectSlice('domain',e.x,e.y-40,340,f,.5,.5),2);}else if(e.kind==='attract')add('attract',e.y,()=>eclipseEffect(ctx,'attract',e.x,e.y-22,140,8+Math.floor(e.age*12)%10),2);else if(e.kind==='repel'||e.kind==='rupture')add('projectile',e.y,()=>eclipseEffect(ctx,e.kind,e.x,e.y-24,e.kind==='rupture'?130:85,8+Math.floor(e.age*16)%10,e.angle),2);else add('effect',e.y+24,()=>eclipseEffect(ctx,e.art,e.x,e.y,e.size,18+e.age/e.maxLife*6,e.angle),2);}
 for(const e of eclipseBlood)if(e.strong)add('blood',e.y,()=>eclipseDrawBlood(e),2);
 return entries.sort((a,b)=>a.y-b.y||a.priority-b.priority||a.serial-b.serial);
}
const eclipseReset=resetPractice;
resetPractice=function(clear=true){eclipseEffects=[];eclipseBlood=[];for(const a of actors.filter(a=>a.skin===4)){a.eclipseCast=null;a.eclipsePain=0;a.eclipseTrail=null;a.buff.eclipseBarrier=0;a.buff.eclipseStrike=0;}const r=eclipseReset(clear);if(p&&b){p.x=W*.5-115;b.x=W*.5+115;p.y=b.y=H*.5;p.a=p.eclipseFacing=0;b.a=Math.PI;}return r;};
eclipseBlinkPlan=(a,angle,range=200)=>revisionTeleport(a,angle,range);
const revisionEclipseEffect=eclipseEffect;
eclipseEffect=function(g,name,x,y,size,frame,angle=0,height=size){if(name==='domain')return revisionSprite(g,eclipseImages.domain,x,y,size,frame/3,angle,height);return revisionEclipseEffect(g,name,x,y,size,frame,angle,height)};
eclipseDepth=function(){const entries=[];let serial=0;const add=(kind,y,paint,priority=0)=>entries.push({kind,y,paint,priority,serial:serial++});
 for(const a of actors.filter(a=>a.skin===4)){add('actor',a.y,()=>eclipseDrawActor(a),1);if(a.buff.eclipseBarrier>0)add('barrier',a.y+.2,()=>{ctx.save();ctx.globalAlpha=.6;eclipseEffect(ctx,'barrier',a.x,a.y-26,140,8+Math.floor(vfxTime*12)%10);ctx.restore();},2);const q=a.eclipseCast;if(q&&q.age<eclipseRelease(q.index)){const f=q.age/eclipseRelease(q.index),hand={x:a.x+Math.cos(q.angle)*22,y:a.y+Math.sin(q.angle)*22};if(q.index===3){add('charge',hand.y,()=>{eclipseEffect(ctx,'attract',hand.x-18*(1-f),hand.y-28,20+f*16,f*8);eclipseEffect(ctx,'repel',hand.x+18*(1-f),hand.y-28,20+f*16,f*8);},2);}else if(q.age>.12)add('charge',hand.y,()=>eclipseEffect(ctx,ECLIPSE_ART[q.index],hand.x,hand.y-25,18+f*22,f*8),2);}}
 for(const e of eclipseEffects){if(e.kind==='domain'){const f=8+Math.floor(e.age*10)%10;add('domain',e.y,()=>{ctx.save();ctx.globalAlpha=.62;eclipseEffect(ctx,'domain',e.x,e.y-45,340,f);ctx.restore();},2);}else if(e.kind==='attract')add('attract',e.y,()=>eclipseEffect(ctx,'attract',e.x,e.y-22,140,8+Math.floor(e.age*12)%10),2);else if(e.kind==='repel'||e.kind==='rupture')add('projectile',e.y,()=>eclipseEffect(ctx,e.kind,e.x,e.y-24,e.kind==='rupture'?130:85,8+Math.floor(e.age*16)%10,e.angle),2);else add('effect',e.y+24,()=>eclipseEffect(ctx,e.art,e.x,e.y,e.size,18+e.age/e.maxLife*6,e.angle),2);}
 for(const e of eclipseBlood)if(e.strong)add('blood',e.y,()=>eclipseDrawBlood(e),2);
 return entries.sort((a,b)=>a.y-b.y||a.priority-b.priority||a.serial-b.serial);
};
const integratedEclipseCast=castCore;

const RP_SOURCES={"blood": "assets/sprites/arte_035.webp", "dodge": "assets/sprites/arte_028.webp", "hunter-base": "assets/sprites/arte_090.webp", "hunter-cast-back": "assets/sprites/arte_091.webp", "hunter-cast-front": "assets/sprites/arte_092.webp", "hunter-cast-side": "assets/sprites/arte_093.webp", "hunter-icon-0": "assets/sprites/arte_094.webp", "hunter-icon-1": "assets/sprites/arte_095.webp", "hunter-icon-2": "assets/sprites/arte_096.webp", "hunter-icon-3": "assets/sprites/arte_097.webp", "hunter-icon-4": "assets/sprites/arte_098.webp", "hunter-icon-5": "assets/sprites/arte_099.webp", "hunter-pain": "assets/sprites/arte_100.webp", "hunter-portrait": "assets/sprites/arte_101.webp", "hunter-worn-base": "assets/sprites/arte_102.webp", "hunter-worn-cast-back": "assets/sprites/arte_103.webp", "hunter-worn-cast-front": "assets/sprites/arte_104.webp", "hunter-worn-cast-side": "assets/sprites/arte_105.webp", "ronin-base": "assets/sprites/arte_106.webp", "ronin-cast-back": "assets/sprites/arte_107.webp", "ronin-cast-front": "assets/sprites/arte_108.webp", "ronin-cast-side": "assets/sprites/arte_109.webp", "ronin-icon-0": "assets/sprites/arte_110.webp", "ronin-icon-1": "assets/sprites/arte_111.webp", "ronin-icon-2": "assets/sprites/arte_112.webp", "ronin-icon-3": "assets/sprites/arte_113.webp", "ronin-icon-4": "assets/sprites/arte_114.webp", "ronin-icon-5": "assets/sprites/arte_115.webp", "ronin-pain": "assets/sprites/arte_116.webp", "ronin-portrait": "assets/sprites/arte_117.webp", "ronin-worn-base": "assets/sprites/arte_118.webp", "ronin-worn-cast-back": "assets/sprites/arte_119.webp", "ronin-worn-cast-front": "assets/sprites/arte_120.webp", "ronin-worn-cast-side": "assets/sprites/arte_121.webp", "solar-base": "assets/sprites/arte_122.webp", "solar-cast-back": "assets/sprites/arte_123.webp", "solar-cast-front": "assets/sprites/arte_124.webp", "solar-cast-side": "assets/sprites/arte_125.webp", "solar-icon-0": "assets/sprites/arte_126.webp", "solar-icon-1": "assets/sprites/arte_127.webp", "solar-icon-2": "assets/sprites/arte_128.webp", "solar-icon-3": "assets/sprites/arte_129.webp", "solar-icon-4": "assets/sprites/arte_130.webp", "solar-icon-5": "assets/sprites/arte_131.webp", "solar-pain": "assets/sprites/arte_132.webp", "solar-portrait": "assets/sprites/arte_133.webp", "solar-worn-base": "assets/sprites/arte_134.webp", "solar-worn-cast-back": "assets/sprites/arte_135.webp", "solar-worn-cast-front": "assets/sprites/arte_136.webp", "solar-worn-cast-side": "assets/sprites/arte_137.webp", "ronin-walk": "assets/sprites/arte_138.webp", "ronin-worn-walk": "assets/sprites/arte_139.webp", "solar-walk": "assets/sprites/arte_140.webp", "solar-worn-walk": "assets/sprites/arte_141.webp", "hunter-walk": "assets/sprites/arte_142.webp", "hunter-worn-walk": "assets/sprites/arte_143.webp", "ronin-fx-5": "assets/sprites/arte_144.webp", "ronin-fx-1": "assets/sprites/arte_145.webp", "ronin-fx-0": "assets/sprites/arte_146.webp", "ronin-fx-4": "assets/sprites/arte_147.webp", "ronin-fx-3": "assets/sprites/arte_148.webp", "solar-fx-0": "assets/sprites/arte_149.webp", "solar-fx-2": "assets/sprites/arte_150.webp", "solar-fx-3": "assets/sprites/arte_151.webp", "solar-fx-5": "assets/sprites/arte_152.webp", "hunter-fx-0": "assets/sprites/arte_153.webp", "hunter-fx-2": "assets/sprites/arte_154.webp", "hunter-fx-3": "assets/sprites/arte_155.webp", "hunter-fx-4": "assets/sprites/arte_156.webp", "hunter-fx-1": "assets/sprites/arte_157.webp", "hunter-fx-5": "assets/sprites/arte_158.webp", "ronin-transformation": "assets/sprites/arte_159.webp"};
const RP_CONFIG={
2:{key:'ronin',name:'Ronin Carmesim',title:'A última lâmina',color:'#f198a4',ids:[18,3,10,14,9,1],skills:[
 ['Crescente Carmesim','Após 0,5s, lança um corte de 75 dano. Alcance 430; obstáculos bloqueiam.',23,6,430,1,'wave'],
 ['Tríade da Lâmina','Três golpes de espada distintos, com 27 dano cada (81), após 0,6s. Cortes alternados em arco de alcance 95, separados por 0,22s.',24,7,95,1.2,'triple'],
 ['Passo Cortante','Após 0,5s, avança até 210 unidades e causa 70 dano uma vez por alvo atravessado. Para em obstáculos.',22,7,210,1,'dash'],
 ['Lâmina Interior','Após 0,45s, desperta por 5s. Cada ataque básico acertado gera um corte espectral de 18 dano após 0,25s, se o alvo continuar próximo.',24,13,0,.9,'echo'],
 ['Véu Carmesim','Após 0,45s, reduz dano recebido em 55% e movimento em 20% por 4s. Ao terminar, explode em raio 105: 35 dano +40% do dano absorvido (bônus máximo 100).',26,14,105,.9,'mask'],
 ['ULT · Lua sem Aurora','Transforma-se temporariamente em sua forma sombria; após 0,85s, lança um X negro gigante que atravessa inimigos: 360 dano uma vez por alvo, alcance 560. Paredes bloqueiam. HP ≤20% fora do treino.',0,45,560,1.7,'moon']
]},
3:{key:'solar',name:'Guardião Solar',title:'A chama que permanece',color:'#ffd083',ids:[24,45,17,40,36,49],skills:[
 ['Arco da Primeira Chama','Após 0,5s, dispara um corte flamejante: 60 dano e queimadura de 30 ao longo de 3s. Alcance 420; paredes bloqueiam.',24,6,420,1,'firewave'],
 ['Ascensão Ardente','Dois cortes ascendentes de 40 dano (80) em arco de alcance 100, começando após 0,55s. O segundo empurra 30 unidades.',24,7,100,1.1,'rising'],
 ['Trilha das Brasas','Após 0,65s, ergue três explosões em sequência até o ponto escolhido, a no máximo 190 unidades. Cada uma causa 40 dano em raio 55; paredes bloqueiam.',28,9,240,1.3,'pillars'],
 ['Roda de Fogo','Após 0,45s, chamas orbitam por 3s. Causam seis pulsos de 12 dano (72) em raio 90 ao redor do personagem.',26,11,90,.9,'wheel'],
 ['Fôlego Solar','Após 0,45s, recupera 30 Stamina e recebe +35% de movimento por 5s. Reativar renova a duração sem acumular.',20,14,0,.9,'breath'],
 ['ULT · Dragão do Alvorecer','Após 0,7s, avança até 330 unidades envolto em um dragão de fogo. Causa 340 dano uma vez em cada alvo atravessado. Paredes interrompem. HP ≤20% fora do treino.',0,45,330,1.4,'dragon']
]},
5:{key:'hunter',name:'Caçador Espectral',title:'A força da promessa',color:'#b3e9a0',ids:[11,20,33,39,19,46],skills:[
 ['Punho de Âmbar','Carrega o punho por 0,65s e desfere um golpe de 110 dano em arco de alcance 90. Empurra 24 unidades.',25,7,90,1.3,'rock'],
 ['Garras de Jade','Após 0,5s, estende duas lâminas de aura: 70 dano em arco de alcance 115. Não atravessa obstáculos.',22,6,115,1,'scissors'],
 ['Palma Espectral','Após 0,45s, lança um projétil de 45 dano que imobiliza por 0,6s. Alcance 420; para em obstáculos.',20,6,420,.9,'palm'],
 ['Laço Vital','Após 0,45s, fortalece os básicos por 6s: recupera HP igual a 40% do dano realmente causado. Não cura acima do HP máximo.',24,14,0,.9,'leech'],
 ['Guarda de Jade','Após 0,45s, invoca três fragmentos por 6s. Cada um bloqueia um projétil ou atinge um inimigo próximo por 24 dano. Reativar substitui os fragmentos.',26,13,75,.9,'shield'],
 ['ULT · Juramento Colossal','Após 0,9s, manifesta um punho colossal e golpeia a área à frente: 360 dano em raio 145, até 220 unidades na direção da mira. Paredes bloqueiam. HP ≤20% fora do treino.',0,45,365,1.8,'oath']
]}};
let rpActive=2,RP_IDS=RP_CONFIG[2].ids,RP_SKILLS=RP_CONFIG[2].skills;
for(const [id,c] of Object.entries(RP_CONFIG)){CHAMPIONS[id].kit=c.ids;CHAMPIONS[id].ult=c.skills[5][0];c.skills.forEach((s,i)=>Object.assign(skills[c.ids[i]],{name:s[0],desc:s[1],cost:s[2],cd:s[3],range:s[4],ultimate:i===5,champion:+id,slot:i,type:i===5?'Ultimate':i===3||i===4?'Buff':'Ataque',color:c.color}));}
const rpKey=a=>RP_CONFIG[a.skin]?.key||RP_CONFIG[rpActive].key;
const rpRelease=q=>q.duration*.5;
const rpSkill=a=>RP_CONFIG[a.skin].skills;
const rpImages=Object.fromEntries(Object.entries(RP_SOURCES).map(([k,src])=>{const im=new Image();im.src=src;return[k,im]}));
let rpSpeed=1,rpEffects=[],rpBlood=[],rpInspect=null,rpPreviewMode='idle',rpPreviewSkill=0,rpPreviewAngle=0,rpTrialUlt=true;
const rpSeen=Array.from({length:6},()=>new Set());
function rpWorn(a){return a?.hp>0&&a.hp<a.max*.2;}
function rpDirection(angle=0){const x=Math.cos(angle),y=Math.sin(angle);return Math.abs(y)>Math.abs(x)?{name:y>0?'front':'back',row:y>0?1:2,flip:1}:{name:'side',row:0,flip:x<0?-1:1};}
function rpReady(){return Object.values(rpImages).every(im=>im.complete&&im.naturalWidth);}
function rpPose(i,f){const sequence=[0,0,1,1,2,2,2,3,3,4,4,4,5,5,5,5,6,6,6,6,6,7,7,0];return sequence[clamp(Math.floor(f),0,23)];}
function rpPaint(g,a,size=72,override=null){const d=rpDirection(override?.angle??a.rpFacing??a.a??0),worn=rpWorn(a),q=override??a.rpCast;let im,row,pose;
 if(a.rpPain&&!override){im=rpImages[rpKey(a)+'-pain'];row=d.row+(worn?3:0);pose=Math.min(3,Math.floor(a.rpPain/.32*4));}
 else if(q){im=rpImages[rpKey(a)+'-'+(worn?'worn-':'')+'cast-'+d.name];row=q.index;const f=q.frame??Math.min(23,Math.floor(q.age/q.duration*24));pose=rpPose(q.index,f);rpSeen[q.index].add(f);}
 else if(a.moving&&!(a.dodgeTime>0)&&!a.guard&&!(a.punchTime>0)){im=rpImages[rpKey(a)+'-'+(worn?'worn-walk':'walk')];row=d.row;pose=Math.floor(a.gait||0)%8;}else{im=rpImages[rpKey(a)+'-'+(worn?'worn-base':'base')];row=d.row;pose=a.dodgeTime>0?6:a.guard?5:a.punchTime>0?(a.punchSide<0?3:4):a.moving?[1,0,2,0][Math.floor(a.gait||0)%4]:0;}
 if(!im?.naturalWidth)return false;const k=size/64;g.save();g.scale(d.flip,1);g.imageSmoothingEnabled=false;g.drawImage(im,pose*160,row*160,160,160,-80*k,-114*k+12,160*k,160*k);g.restore();return true;
}
function rpRay(x,y,angle,max,r=0){let length=0;for(let d=4;d<=max;d+=4){if(blocked(x+Math.cos(angle)*d,y+Math.sin(angle)*d,r))break;length=d;}return length;}
function rpBlinkPlan(a,angle,range=160){let target={x:a.x,y:a.y};for(let d=4;d<=range;d+=4){const x=a.x+Math.cos(angle)*d,y=a.y+Math.sin(angle)*d;if(blocked(x,y,a.r)||actors.some(b=>b!==a&&b.hp>0&&Math.hypot(x-b.x,y-b.y)<a.r+b.r+4))break;target={x,y};}return target;}
function rpEffect(g,owner,index,x,y,size,frame,angle=0,height=size){const im=rpImages[rpKey(owner)+'-fx'];if(!im?.naturalWidth)return;const f=clamp(Math.floor(frame),0,7),w=im.naturalWidth/8,h=im.naturalHeight/6;g.save();g.translate(x,y);orientSkillSprite(g,angle);g.imageSmoothingEnabled=false;g.drawImage(im,f*w,index*h,w,h,-size/2,-height/2,size,height);g.restore();}
function rpBloodAdd(x,y,strong=false,angle=0){rpBlood.push({x,y,strong,angle,age:0,life:strong?.42:12,pose:Math.floor(Math.random()*4)});if(rpBlood.length>84)rpBlood.shift();}
function rpDrawBlood(e){const im=rpImages.blood,w=im.naturalWidth/4,h=im.naturalHeight/2,f=e.strong?Math.min(3,Math.floor(e.age/.42*4)):e.pose,size=e.strong?64:16;ctx.save();ctx.translate(e.x,e.y-(e.strong?24:0));ctx.rotate(e.angle);ctx.globalAlpha=e.strong?1:.75*Math.min(1,e.life/3);ctx.drawImage(im,f*w,e.strong?0:h,w,h,-size/2,-size/2,size,size);ctx.restore();}
castCore=function(a,id,manual){const c=RP_CONFIG[a?.skin],index=c?.ids.indexOf(id)??-1,s=skills[id];if(!c||index<0||!a.kit.includes(id)||state!=='fight'||a.hp<=0||a.rpCast||a.cast>0||a.skillLock>0||a.actionRecovery>0||a.punchTime>0||a.dodgeTime>0||a.guard||a.cd[id]>0||a.mp<s.cost||a.root>0)return false;if(index===5&&!canUseUltimate(a)){toast('Ultimate: HP de 20% ou menos');return false;}
const angle=aim(a,manual),spec=c.skills[index];a.a=a.rpFacing=angle;a.mp-=s.cost;a.cd[id]=s.cd;a.cast=a.skillLock=spec[5];a.champAction=null;a.rpCast={index,id,kind:spec[6],angle,age:0,duration:spec[5],released:false,launched:0,moved:0,hit:new Set(),blocked:false};fighterEchoStates.delete(a);toast(s.name);return true;};
function rpBurst(owner,index,x,y,size,angle=0){rpEffects.push({kind:'burst',owner,index,x,y,size,angle,age:0,life:.5,maxLife:.5});}
function rpProjectile(a,q,dmg,speed,range,r,pierce=false){rpEffects.push({kind:'projectile',owner:a,index:q.index,x:a.x+Math.cos(q.angle)*27,y:a.y+Math.sin(q.angle)*27,angle:q.angle,dmg,speed,range,r,pierce,travel:0,hit:new Set(),age:0,life:range/speed,maxLife:range/speed,artKind:q.kind});}
function rpArea(a,index,x,y,r,dmg,knock=0){for(const e of opponents(a))if(e.hp>0&&dist(e,{x,y})<r+e.r&&lineClear({x,y},e))hit(e,dmg,a,knock,Math.atan2(e.y-y,e.x-x),-1);rpBurst(a,index,x,y-24,r*2);}
function rpSlash(a,q,dmg,range,knock=0){for(const e of opponents(a)){const angle=Math.atan2(e.y-a.y,e.x-a.x),difference=Math.abs(Math.atan2(Math.sin(angle-q.angle),Math.cos(angle-q.angle)));if(e.hp>0&&dist(a,e)<range+e.r&&difference<.95&&lineClear(a,e))hit(e,dmg,a,knock,q.angle,-1);}rpBurst(a,q.index,a.x+Math.cos(q.angle)*range*.5,a.y+Math.sin(q.angle)*range*.5-24,range*1.5,q.angle);}
let rpBasicOwner=null;
const rpBaseBasic=basic;
basic=function(a){rpBasicOwner=a;try{return rpBaseBasic(a)}finally{rpBasicOwner=null}};
const rpBaseHit=hit;
hit=function(a,n,owner,knock=0,angle=0,visualId=-1){const before=a?.hp,mask=a?.buff.rpMask>0,damage=mask?n*.45:n;const result=rpBaseHit(a,damage,owner,knock,angle,visualId);if(result&&before>a.hp){if(mask)a.rpAbsorbed=(a.rpAbsorbed||0)+n*.55;const lost=before-a.hp;if(owner&&rpBasicOwner===owner){if(owner.buff.rpLeech>0)heal(owner,Math.round(lost*.4));if(owner.buff.rpEcho>0){const captured=owner;delay(.25,()=>{if(captured.hp>0&&a.hp>0&&dist(captured,a)<120&&lineClear(captured,a)){hit(a,18,captured,0,angle,-1);rpBurst(captured,3,a.x,a.y-24,100,angle);}});}}if(!a.trainingDummy&&RP_CONFIG[a.skin]){a.rpPain=.0001;if(lost>=80){rpBloodAdd(a.x,a.y,true,angle);for(let i=0;i<3;i++)rpBloodAdd(a.x+Math.cos(angle)*(10+i*9),a.y+Math.sin(angle)*(10+i*9),false,angle);}}}return result};
const rpBaseStep=step;
step=function(dt){if(state!=='fight'){rpBaseStep(dt);return;}dt*=rpSpeed;for(const a of actors.filter(a=>!!RP_CONFIG[a.skin])){if(a.rpPain){a.rpPain+=dt;if(a.rpPain>=.32)a.rpPain=0;}a.rpMaskBefore=a.buff.rpMask>0;}for(const e of rpBlood){e.age+=dt;e.life-=dt;}rpBlood=rpBlood.filter(e=>e.life>0);rpBaseStep(dt);if(state!=='fight')return;
for(const a of actors.filter(a=>!!RP_CONFIG[a.skin])){if(a.hp<=0){a.rpCast=null;continue;}if(a.rpMaskBefore&&!a.buff.rpMask){rpArea(a,4,a.x,a.y,105,35+Math.min(100,Math.round((a.rpAbsorbed||0)*.4)));a.rpAbsorbed=0;}const q=a.rpCast;if(q){q.age+=dt;a.moving=false;a.rpFacing=q.angle;const release=rpRelease(q);if(!q.released&&q.age>=release){q.released=true;
if(['wave','firewave','moon','palm'].includes(q.kind)){const values={wave:[75,380,430,17,false],firewave:[60,360,420,18,false],moon:[360,330,560,30,true],palm:[45,340,420,14,false]};rpProjectile(a,q,...values[q.kind]);}
if(q.kind==='echo')a.buff.rpEcho=5;if(q.kind==='mask'){a.buff.rpMask=4;a.rpAbsorbed=0;}if(q.kind==='breath'){a.st=Math.min(100,a.st+30);a.buff.rpBreath=5;}if(q.kind==='leech')a.buff.rpLeech=6;if(q.kind==='shield'){a.buff.orbit=6;a.orbit=3;a.petTime=0;}
if(q.kind==='wheel')rpEffects.push({kind:'wheel',owner:a,index:3,x:a.x,y:a.y,age:0,life:3,maxLife:3,pulses:0,next:.1});
if(q.kind==='rock')rpSlash(a,q,110,90,24);if(q.kind==='scissors')rpSlash(a,q,70,115);
if(q.kind==='oath'){const {x,y}=aimTargetV4(a,q,220,10);rpArea(a,5,x,y,145,360,24);combatImpact(2);}
}
if(q.released&&['triple','rising','pillars'].includes(q.kind)){const total=q.kind==='rising'?2:3;while(q.launched<total&&q.age>=release+q.launched*(q.kind==='rising'?.22:q.kind==='triple'?.22:.18)){const n=q.launched++;if(q.kind==='triple')rpSlash(a,q,27,95);if(q.kind==='rising')rpSlash(a,q,40,100,n===1?30:0);if(q.kind==='pillars'){const target=q.aimPoint,angle=target?Math.atan2(target.y-a.y,target.x-a.x):q.angle,distance=target?dist(a,target)*[70/190,130/190,1][n]:70+n*60;if(aimRayV4(a,angle,distance,8)>=distance-2)rpArea(a,2,a.x+Math.cos(angle)*distance,a.y+Math.sin(angle)*distance,55,40);}}}
if(q.released&&['dash','dragon'].includes(q.kind)){const range=q.kind==='dragon'?330:210,duration=q.kind==='dragon'?.42:.3,desired=range*clamp((q.age-release)/duration,0,1),delta=desired-q.moved;if(delta>0&&!q.blocked){const old={x:a.x,y:a.y};q.blocked=move(a,Math.cos(q.angle)*delta,Math.sin(q.angle)*delta);q.moved+=dist(a,old);for(const e of opponents(a))if(!q.hit.has(e)&&e.hp>0&&lineDistance(e.x,e.y,old.x,old.y,a.x+Math.cos(q.angle)*28,a.y+Math.sin(q.angle)*28)<e.r+26&&lineClear(a,e)){q.hit.add(e);hit(e,q.kind==='dragon'?340:70,a,20,q.angle,-1);rpBurst(a,q.index,e.x,e.y-24,q.kind==='dragon'?160:100,q.angle);}}}
rpSeen[q.index].add(Math.min(23,Math.floor(q.age/q.duration*24)));if(q.age>=q.duration){a.rpCast=null;a.cast=0;a.skillLock=0;}
}else if(a.dodgeTime>0)a.rpFacing=a.dodgeA;else if(a.guard||a.punchTime>0||a===p&&aimGesture)a.rpFacing=a.a;else if(a===p&&a.moving){const m=movement();if(m.len>.06)a.rpFacing=Math.atan2(m.y,m.x);}
if(rpWorn(a)&&!a.trainingDummy){if(a.rpTrail&&dist(a,a.rpTrail)>=18){const d=dist(a,a.rpTrail),angle=Math.atan2(a.y-a.rpTrail.y,a.x-a.rpTrail.x);for(let i=1;i<=Math.min(8,Math.floor(d/18));i++)rpBloodAdd(a.rpTrail.x+Math.cos(angle)*i*18,a.rpTrail.y+Math.sin(angle)*i*18);a.rpTrail={x:a.x,y:a.y};}else if(!a.rpTrail)a.rpTrail={x:a.x,y:a.y};}else a.rpTrail=null;
}
for(const e of rpEffects){e.age+=dt;e.life-=dt;if(e.owner?.hp<=0){e.life=0;continue;}if(e.kind==='wheel'){e.x=e.owner.x;e.y=e.owner.y;while(e.pulses<6&&e.age>=e.next){e.pulses++;e.next+=.5;for(const a of opponents(e.owner))if(dist(a,e)<90+a.r&&lineClear(e,a))hit(a,12,e.owner,0,Math.atan2(a.y-e.y,a.x-e.x),-1);}}
if(e.kind==='projectile'){let remaining=Math.min(e.speed*dt,e.range-e.travel);while(remaining>0&&e.life>0){const d=Math.min(5,remaining),x=e.x+Math.cos(e.angle)*d,y=e.y+Math.sin(e.angle)*d;remaining-=d;e.travel+=d;if(blocked(x,y,e.r*.4)){rpBurst(e.owner,e.index,e.x,e.y-24,100,e.angle);e.life=0;break;}e.x=x;e.y=y;for(const a of opponents(e.owner)){if(a.hp<=0||e.hit.has(a)||dist(a,e)>=a.r+e.r||!lineClear(e,a))continue;e.hit.add(a);if(hit(a,e.dmg,e.owner,0,e.angle,-1)){if(e.artKind==='firewave')a.dots=[{life:3,tick:.5,owner:e.owner}];if(e.artKind==='palm')a.root=Math.max(a.root,.6);}rpBurst(e.owner,e.index,a.x,a.y-24,110,e.angle);if(!e.pierce){e.life=0;break;}}}if(e.travel>=e.range)e.life=0;}}
rpEffects=rpEffects.filter(e=>e.life>0);};
const rpDrawProjectiles=vfxDrawProjectiles;
function rpDrawActor(a){if(a.trainingDummy){drawTrainingDummy(a);return;}if(a.hp<=0)return;ctx.save();ctx.translate(a.x,a.y);ellipse(0,12,20,8,'#06100c99');ctx.save();ctx.translate(0,10);ctx.scale(1,.42);drawTeamMarker(a);ctx.restore();if(a.root>0)outline(0,10,23,'#c6b6e8');if(a.inv>0)ctx.globalAlpha=.65;const q=a.rpCast;rpPaint(ctx,a);ctx.restore();}
function rpDepth(){const entries=[];let serial=0;const add=(kind,y,paint,priority=0)=>entries.push({kind,y,paint,priority,serial:serial++});
for(const a of actors.filter(a=>!!RP_CONFIG[a.skin])){add('actor',a.y,()=>rpDrawActor(a),1);if(a.hp<=0)continue;for(const [buff,index]of [['rpEcho',3],['rpMask',4],['rpBreath',4],['rpLeech',3]])if(a.buff[buff]>0)add('aura',a.y+1,()=>{ctx.save();ctx.globalAlpha=.7;rpEffect(ctx,a,index,a.x,a.y-23,120,3+Math.floor(vfxTime*10)%3);ctx.restore();},2);if(a.buff.orbit>0&&a.orbit>0)for(let i=0;i<a.orbit;i++){const angle=vfxTime*2+i*TAU/3,x=a.x+Math.cos(angle)*34,y=a.y+Math.sin(angle)*20;add('fragment',y,()=>rpEffect(ctx,a,4,x,y-24,35,3+Math.floor(vfxTime*8)%3),2);}const q=a.rpCast;if(q){if(q.released&&['dash','dragon'].includes(q.kind))add('dash',a.y+Math.sin(q.angle)*20,()=>rpEffect(ctx,a,q.index,a.x+Math.cos(q.angle)*22,a.y+Math.sin(q.angle)*22-24,q.kind==='dragon'?180:110,3+Math.floor(q.age*15)%3,q.angle),2);else if(!q.released&&q.age>.12)add('charge',a.y+1,()=>rpEffect(ctx,a,q.index,a.x+Math.cos(q.angle)*22,a.y+Math.sin(q.angle)*22-25,25+q.age/rpRelease(q)*20,Math.min(2,q.age/rpRelease(q)*3)),2);}}
for(const e of rpEffects){add(e.kind,e.y+(e.kind==='burst'?24:0),()=>{ctx.save();ctx.globalAlpha=Math.min(1,e.life/.12);rpEffect(ctx,e.owner,e.index,e.x,e.y-(e.kind==='burst'?0:24),e.kind==='wheel'?180:e.kind==='projectile'?(e.artKind==='moon'?165:90):e.size,e.kind==='burst'?5+e.age/e.maxLife*3:3+Math.floor(e.age*12)%3,e.angle||0);ctx.restore();},2);}
 for(const e of rpBlood)if(e.strong)add('blood',e.y,()=>rpDrawBlood(e),2);
 return entries.sort((a,b)=>a.y-b.y||a.priority-b.priority||a.serial-b.serial);
}
const rpReset=resetPractice;
resetPractice=function(clear=true){rpEffects=[];rpBlood=[];for(const a of actors.filter(a=>!!RP_CONFIG[a.skin])){a.rpCast=null;a.rpPain=0;a.rpTrail=null;a.buff.rpEcho=0;a.buff.rpMask=0;a.buff.rpBreath=0;a.buff.rpLeech=0;a.rpAbsorbed=0;}const r=rpReset(clear);if(p&&b){p.x=W*.5-115;b.x=W*.5+115;p.y=b.y=H*.5;p.a=p.rpFacing=0;b.a=Math.PI;}return r;};
rpEffect=function(g,owner,index,x,y,size,frame,angle=0,height=size){
 const key=rpKey(owner);let slot=index;if(key==='ronin'&&index===2)slot=1;if(key==='solar'&&index===1)slot=0;
 revisionSprite(g,rpImages[key+'-fx-'+slot],x,y,size,frame,angle,height);
};
function revisionTip(a,angle,length=48){return{x:a.x+Math.cos(angle)*length,y:a.y+Math.sin(angle)*length};}
rpBurst=function(owner,index,x,y,size,angle=0){rpEffects.push({kind:'burst',owner,index,x,y:y+24,size,angle,age:0,life:.5,maxLife:.5});};
rpProjectile=function(a,q,dmg,speed,range,r,pierce=false){
 const size=q.kind==='moon'?280:a.skin===5&&q.kind==='palm'?160:100,offset=48+size*.34,reach=rpRay(a.x,a.y,q.angle,offset,6),x=a.x+Math.cos(q.angle)*reach,y=a.y+Math.sin(q.angle)*reach;
 if(reach<offset-5){rpBurst(a,q.index,x,y-24,80,q.angle);return;}
 const e={kind:'projectile',owner:a,index:q.index,x,y,angle:q.angle,dmg,speed,range,r,pierce,travel:0,hit:new Set(),age:0,life:range/speed,maxLife:range/speed,artKind:q.kind};
 // Resolve the newly occupied muzzle segment too, so close targets are not skipped.
 for(const target of opponents(a))if(target.hp>0&&lineDistance(target.x,target.y,a.x,a.y,x,y)<target.r+r&&lineClear(a,target)){
  e.hit.add(target);if(hit(target,dmg,a,0,q.angle,-1)){if(q.kind==='firewave')target.dots=[{life:3,tick:.5,owner:a}];if(q.kind==='palm')target.root=Math.max(target.root,.6);}
  rpBurst(a,q.index,target.x,target.y-24,100,q.angle);if(!pierce)return;
 }rpEffects.push(e);
};
rpSlash=function(a,q,dmg,range,knock=0){
 for(const e of opponents(a)){const an=Math.atan2(e.y-a.y,e.x-a.x),diff=Math.abs(Math.atan2(Math.sin(an-q.angle),Math.cos(an-q.angle)));if(e.hp>0&&dist(a,e)<range+e.r&&diff<.95&&lineClear(a,e))hit(e,dmg,a,knock,q.angle,-1);}
 const tip=revisionTip(a,q.angle,48+range*.3);rpBurst(a,q.index,tip.x,tip.y-24,range*1.2,q.angle);
};
rpDepth=function(){const entries=[];let serial=0;const add=(kind,y,paint,priority=0)=>entries.push({kind,y,paint,priority,serial:serial++});
 for(const a of actors.filter(a=>!!RP_CONFIG[a.skin])){add('actor',a.y,()=>rpDrawActor(a),1);if(a.hp<=0)continue;
  if(a.buff.rpEcho>0)for(let i=0;i<4;i++){const angle=vfxTime*2.1+i*TAU/4,x=a.x+Math.cos(angle)*43,y=a.y+Math.sin(angle)*25;add('spectral-blade',y,()=>rpEffect(ctx,a,3,x,y-26,65,1+Math.floor(vfxTime*9)%2,angle+Math.PI/2),2);}
  if(a.buff.rpMask>0){const angle=a.rpFacing??a.a,grow=clamp((.5-a.buff.rpMask)/.5,0,1),tip=revisionTip(a,angle,12);add('mask',tip.y,()=>rpEffect(ctx,a,4,tip.x,tip.y-42,54+grow*80,2+Math.floor(vfxTime*8)%3),2);}
  if(a.buff.rpBreath>0){const t=5-a.buff.rpBreath,f=t<.7?t/.7*4:3+Math.floor(vfxTime*12)%3;add('solar-aura',a.y+.2,()=>revisionSprite(ctx,rpImages['solar-fx-4'],a.x,a.y+13,100,f,0,115,'bottom'),2);}
  if(a.buff.rpLeech>0)add('life-aura',a.y+.2,()=>rpEffect(ctx,a,3,a.x,a.y-14,82,2+Math.floor(vfxTime*10)%4,0,68),2);
  if(a.buff.orbit>0&&a.orbit>0)for(let i=0;i<a.orbit;i++){const angle=vfxTime*2+i*TAU/3,x=a.x+Math.cos(angle)*34,y=a.y+Math.sin(angle)*20;add('fragment',y,()=>rpEffect(ctx,a,4,x,y-24,38,3+Math.floor(vfxTime*8)%3),2);}
  const q=a.rpCast;if(q){
   if(q.released&&['dash','dragon'].includes(q.kind)){const size=q.kind==='dragon'?240:125,tip=revisionTip(a,q.angle,48+size*.34);add('dash',tip.y,()=>rpEffect(ctx,a,q.index,tip.x,tip.y-28,size,2+Math.floor(q.age*15)%4,q.angle),2);}
   if(q.kind==='oath'&&!q.released&&q.age>q.duration*.5-.35){const tip=aimTargetV4(a,q,220,10),f=clamp((q.age-(q.duration*.5-.35))/.35,0,1)*3;add('oath-windup',tip.y,()=>revisionSprite(ctx,rpImages['hunter-fx-5'],tip.x,tip.y,290,f,0,290,'bottom'),2);}
  }
 }
 for(const e of rpEffects){add(e.kind,e.y,()=>{ctx.save();ctx.globalAlpha=Math.min(1,e.life/.12);
  if(e.kind==='wheel')rpEffect(ctx,e.owner,3,e.x,e.y-4,190,2+Math.floor(e.age*14)%4);
  else if(e.kind==='projectile')rpEffect(ctx,e.owner,e.index,e.x,e.y-28,e.artKind==='moon'?280:100,2+Math.floor(e.age*12)%4,e.angle);
  else{let size=e.size,angle=e.angle||0,frame=3+e.age/e.maxLife*5,y=e.y-28;if(e.triadStrike!==undefined)frame=2+e.age/e.maxLife*3.8;
   if(e.owner.skin===2&&e.index===5){size=260;}if(e.owner.skin===2&&e.index===3){size=95;angle+=(e.age/e.maxLife-.5)*1.3;frame=2+e.age/e.maxLife*5;}
   if(e.owner.skin===2&&e.index===4){size=90+e.age/e.maxLife*150;frame=4+e.age/e.maxLife*4;}
   if(e.owner.skin===3&&e.index===1){y=e.y-38;size=135;}
   if(e.owner.skin===5&&e.index===5){revisionSprite(ctx,rpImages['hunter-fx-5'],e.x,e.y,290,4+e.age/e.maxLife*4,0,290,'bottom');ctx.restore();return;}
   rpEffect(ctx,e.owner,e.index,e.x,y,size,frame,angle);
  }ctx.restore();},2);}
 for(const e of rpBlood)if(e.strong)add('blood',e.y,()=>rpDrawBlood(e),2);
 return entries.sort((a,b)=>a.y-b.y||a.priority-b.priority||a.serial-b.serial);
};
const rpPaintV2=rpPaint;
function roninTriadFrameV3(f,age=f/24*1.2){if(age<.6)return f;const elapsed=age-.6,stroke=Math.min(2,Math.floor(elapsed/.22)),local=elapsed-stroke*.22;if(stroke===2&&local>.16)return 21+Math.min(2,Math.floor((local-.16)*20));return local<.065?12:local<.14?17:6;}
rpPaint=function(g,a,size=72,override=null){const q=override??a.rpCast,frame=q?(q.frame??Math.min(23,Math.floor(q.age/q.duration*24))):0;
 if(a.skin===2&&q?.index===1){rpSeen[1].add(frame);return rpPaintV2(g,a,size,{...q,frame:roninTriadFrameV3(frame,q.age)});}
 if(a.skin!==2||q?.index!==5)return rpPaintV2(g,a,size,override);
 const opacity=clamp((frame-3)/3,0,1)*clamp((23-frame)/3,0,1),im=rpImages['ronin-transformation'];
 if(opacity<1){g.save();g.globalAlpha*=1-opacity;rpPaintV2(g,a,size,override);g.restore();}
 if(opacity>0&&im?.naturalWidth){const d=rpDirection(q.angle??a.rpFacing??a.a),pose=frame<7?0:frame<9?1:frame<12?2:frame<14?3:frame<17?4:frame<20?5:frame<22?6:7,k=size/64*.90;g.save();g.globalAlpha*=opacity;g.scale(d.flip,1);g.imageSmoothingEnabled=false;g.drawImage(im,pose*192,d.row*192,192,192,-96*k,-114*k+12,192*k,192*k);g.restore();}
 rpSeen[5].add(frame);return true;
};
const rpEffectV2=rpEffect;
rpEffect=function(g,owner,index,x,y,size,frame,angle=0,height=size){
 if(owner.skin===2&&index===5)return revisionSprite(g,rpImages['ronin-fx-5'],x,y,size,frame,angle,height);
 if(owner.skin===5&&(index===0||index===2)){size*=1.6;height*=1.6;}
 return rpEffectV2(g,owner,index,x,y,size,frame,angle,height);
};
const rpSlashV2=rpSlash;
rpSlash=function(a,q,dmg,range,knock=0){const before=rpEffects.length;rpSlashV2(a,q,dmg,range,knock);const e=rpEffects[before];if(!e)return;
 if(a.skin===2&&q.kind==='triple'){const stroke=Math.max(0,(q.launched||1)-1),offset=[-.32,.32,0][stroke];e.triadStrike=stroke;e.angle=q.angle+offset;e.life=e.maxLife=.20;e.size=stroke===2?126:112;const tip=revisionTip(a,q.angle,78+stroke*5);e.x=tip.x;e.y=tip.y;}
 if(a.skin===5&&q.kind==='rock'){const tip=revisionTip(a,q.angle,95);e.x=tip.x;e.y=tip.y;}
};
const rpDepthV2=rpDepth;
rpDepth=function(){
 const entries=rpDepthV2().filter(e=>!['solar-aura','life-aura','wheel'].includes(e.kind));let serial=entries.length;
 const add=(kind,y,paint,priority=2)=>entries.push({kind,y,paint,priority,serial:serial++});
 for(const a of actors.filter(a=>!!RP_CONFIG[a.skin])){if(a.hp<=0)continue;
  if(a.buff.rpLeech>0){const f=2+Math.floor(vfxTime*10)%4;add('life-ring-back',a.y-16,()=>ringV3(ctx,rpImages['hunter-fx-3'],a.x,a.y-17,96,f,false,80));add('life-ring-front',a.y+16,()=>ringV3(ctx,rpImages['hunter-fx-3'],a.x,a.y-17,96,f,true,80));}
  if(a.buff.rpBreath>0){const age=5-a.buff.rpBreath,progress=clamp(age/.75,0,1);add('solar-silhouette',a.y+.1,()=>auraV3(ctx,a,a.x,a.y,72,rpPaint,vfxTime,progress,true));for(const e of solarRibbonsV3(a.x,a.y,vfxTime,progress)){add(e.kind,e.y,()=>e.paint(ctx));}}
 }
 for(const e of rpEffects)if(e.kind==='wheel'){const f=2+Math.floor(e.age*14)%4;add('fire-wheel-back',e.y-40,()=>ringV3(ctx,rpImages['solar-fx-3'],e.x,e.y-4,190,f,false));add('fire-wheel-front',e.y+40,()=>ringV3(ctx,rpImages['solar-fx-3'],e.x,e.y-4,190,f,true));}
 return entries.sort((a,b)=>a.y-b.y||a.priority-b.priority||a.serial-b.serial);
};
const integratedTrioCast=castCore;

canUseUltimate=function(a){return !!a&&a.hp>0&&(battleActivity==='training'||a.hp<=a.max*.2);};
castCore=function(a,id,manual){if(!a||!a.kit?.includes(id))return false;return(a.skin===0?integratedAstralCast:a.skin===1?integratedNinjaCast:a.skin===4?integratedEclipseCast:integratedTrioCast)(a,id,manual);};
cast=function(a,id,manual){const result=castCore(a,id,manual);if(result){a.champAction=null;fighterEchoStates.delete(a);}return result;};
drawAnimatedFighter=function(g,a,size=72,t=vfxTime){return a.skin===0?astralPaint(g,a,size):a.skin===1?integratedNinjaPaint(g,a,size,t):a.skin===4?eclipsePaint(g,a,size):rpPaint(g,a,size);};
function integratedDrawActor(a){if(a.boss){if(a.hp>0)drawGuardian(a);return;}if(a.trainingDummy){drawTrainingDummy(a);return;}if(a.hp<=0)return;ctx.save();ctx.translate(a.x,a.y);ellipse(0,12,20,8,'#06100c99');ctx.save();ctx.translate(0,10);ctx.scale(1,.42);drawTeamMarker(a);ctx.restore();if(a.root>0)outline(0,10,23,'#c6b6e8');if(a.inv>0)ctx.globalAlpha=.65;drawAnimatedFighter(ctx,a);ctx.restore();}
const integratedNinjaDepth=dojoDepthEntries;
function integratedDepth(){return[...integratedNinjaDepth(),...astralDepth().filter(e=>e.kind!=='actor'),...eclipseDepth().filter(e=>e.kind!=='actor'),...rpDepth().filter(e=>e.kind!=='actor')].sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0)||(a.serial||0)-(b.serial||0));}
dojoDrawDepthWorld=function(){drawModeWorld();drawEntryCosmetic();vfxDrawLayer(true);for(const e of astralBlood)if(!e.strong)astralDrawBlood(e);for(const e of eclipseBlood)if(!e.strong)eclipseDrawBlood(e);for(const e of rpBlood)if(!e.strong)rpDrawBlood(e);for(const e of integratedDepth())e.paint();};
prepareEquippedSprites=function(){return Promise.resolve();};loadSkinAtlas=function(){skinImageReady=true;skinImageFailed=false;};
skinPortrait=function(id){const c=CHAMPIONS[id];const key=['astral','ninja','ronin','solar','eclipse','hunter'][validSkin(id)];return `<span class="champion-avatar"><img src="${c?championArt(c):CHAMPION_HEROES[key]}" alt="${c?.name||''}" draggable="false"></span>`;};
icon=function(id){const s=skills[id];if(!s)return '';const c=CHAMPIONS[s.champion],slot=c?.kit.indexOf(id)??-1;let src='';if(s.champion===0)src=ASTRAL_SOURCES['icon-'+slot];else if(s.champion===1)src=slot===0?DOJO_ICON_SRC:DOJO_KIT_ICONS[slot-1];else if(s.champion===4)src=ECLIPSE_SOURCES['icon-'+slot];else if(RP_CONFIG[s.champion])src=RP_SOURCES[RP_CONFIG[s.champion].key+'-icon-'+slot];return src?`<span class="dojo-skill-icon"><img src="${src}" alt="${escapeHTML(s.name)}" draggable="false"></span>`:'';};
const integratedStart=start;
start=function(){dojoEntities=[];dojoBursts=[];dojoBlood=[];ninjaEffects=[];astralEffects=[];astralBlood=[];eclipseEffects=[];eclipseBlood=[];rpEffects=[];rpBlood=[];const r=integratedStart();$('#dodge').innerHTML='<img class="dojo-dodge-art" alt="" draggable="false" src="'+DOJO_DODGE_SRC+'"><small>25 ST</small>';if(p){p.max=p.hp=1000;for(const a of actors)if(!a.boss&&!a.trainingDummy){a.max=a.hp=1000;a.astralFacing=a.eclipseFacing=a.rpFacing=a.dojoFacingAngle=a.a;}}if(battleActivity==='training')resetPractice();return r;};
skillControlState=function(a,s){const u=championOldControlState(a,s);if(s?.ultimate&&!canUseUltimate(a)){u.ready=false;u.locked=true;u.text='HP ≤20%';}return u;};
const integratedUpdate=updateUI;
updateUI=function(){integratedUpdate();if(!p)return;$('#resText').textContent='MP '+Math.floor(p.mp)+' · ST '+Math.floor(p.st)+' · ULT '+(battleActivity==='training'?'livre':'≤20%');$('#attack small').textContent=p.actionRecovery>0?'RECUPERA':'ATAQUE';const label=$('#defend small');if(label)label.textContent=p.guardBreak>0?Math.ceil(p.guardBreak)+'s':p.guard?'DEFESA':'SEGURE';if($('#riftCombatToggle'))$('#riftCombatToggle').hidden=p.skin!==1;};
for(const c of CHAMPIONS){if(c.id<6)c.kit.forEach((id,slot)=>Object.assign(skills[id],{champion:c.id,slot,ultimate:slot===5}));}
for(let i=0;i<LEAGUE_RIVALS.length;i++){const c=CHAMPIONS[i%6];LEAGUE_RIVALS[i].kit=[...c.kit];LEAGUE_RIVALS[i].name=c.name;}
const integratedCamera=updateArenaCamera;updateArenaCamera=function(){if(battleActivity!=='training')return integratedCamera();if(!p||!cw||!ch)return;scale=Math.min(cw/(W-40),ch/(H-40));ox=(cw-W*scale)/2;oy=(ch-H*scale)/2;};
function integratedCustomProjectiles(){return[...astralEffects.filter(e=>e.kind==='bolt'||e.kind==='sphere'),...eclipseEffects.filter(e=>e.kind==='repel'||e.kind==='rupture'),...rpEffects.filter(e=>e.kind==='projectile')];}
const integratedProjectileStep=step;
step=function(dt){if(state!=='fight')return integratedProjectileStep(dt);const changed=[];for(const e of integratedCustomProjectiles()){if(e.life<=0||!e.owner)continue;const end={x:e.x+Math.cos(e.angle)*e.speed*dt,y:e.y+Math.sin(e.angle)*e.speed*dt};for(const entity of dojoEntities){if(entity.life<=0||sameTeam(entity.owner,e.owner))continue;const target=entity.dojoKind==='phase'?entity.owner:entity;if(!['clone','phase'].includes(entity.dojoKind)||lineDistance(target.x,target.y,e.x,e.y,end.x,end.y)>(entity.dojoKind==='phase'?32:14)+(e.r||0)||!lineClear(e,target))continue;e.life=0;e.ownerRemoved=true;if(entity.dojoKind==='clone'){entity.hp-=e.dmg;dojoTriggerClone(entity,e.owner);}else dojoBurst('rift',e.x,e.y,65);break;}if(e.life<=0)continue;const blocker=actors.find(a=>a.hp>0&&!sameTeam(a,e.owner)&&a.buff.orbit>0&&a.orbit>0&&lineDistance(a.x,a.y,e.x,e.y,end.x,end.y)<46+(e.r||0));if(blocker){blocker.orbit--;e.life=0;e.ownerRemoved=true;ring(e.x,e.y,22,'#b3e9a0',.25);continue;}if(actors.some(a=>a.hp>0&&a.buff.eclipseBarrier>0&&!sameTeam(a,e.owner)&&lineDistance(a.x,a.y,e.x,e.y,end.x,end.y)<95)){changed.push([e,e.speed]);e.speed*=.25;e.life+=dt*.75;}}
 astralEffects=astralEffects.filter(e=>!e.ownerRemoved);eclipseEffects=eclipseEffects.filter(e=>!e.ownerRemoved);rpEffects=rpEffects.filter(e=>!e.ownerRemoved);try{return integratedProjectileStep(dt);}finally{for(const[e,speed]of changed)e.speed=speed;}};

// Directional skills keep a short direction arrow; point skills retain both angle and distance.
function aimProfileV4(a,id){const slot=a.kit.indexOf(id),skin=a.skin,self={kind:'self'},arrow={kind:'arrow'},circle=(max,radius,extra={})=>({kind:'circle',max,radius,...extra});
 if(skin===0)return [arrow,arrow,circle(320,22,{teleport:true}),arrow,self,circle(520,110,{sphere:true})][slot]||arrow;
 if(skin===1){if(slot===3)return circle(90,75,{wall:true});if(slot===4)return typeof dojoRiftMode!=='undefined'&&dojoRiftMode==='defense'?self:circle(320,80);return arrow;}
 if(skin===2)return [arrow,arrow,arrow,self,self,arrow][slot]||arrow;
 if(skin===3)return [arrow,arrow,circle(190,55,{block:8}),self,self,arrow][slot]||arrow;
 if(skin===4)return [self,circle(260,100,{block:18}),arrow,arrow,circle(200,22,{teleport:true}),circle(260,155,{block:18})][slot]||arrow;
 if(skin===5)return [arrow,arrow,arrow,self,self,circle(220,145,{block:10})][slot]||arrow;
 return arrow;
}
function aimRayV4(a,angle,length,r=0){let reach=0;for(let d=Math.min(2,length);d<=length&&d>0;d=Math.min(length,d+2)){if(blocked(a.x+Math.cos(angle)*d,a.y+Math.sin(angle)*d,r))break;reach=d;if(d===length)break;}return reach;}
function resolveAimV4(a,id,angle,distance){const profile=aimProfileV4(a,id);if(profile.kind!=='circle')return{profile,angle};
 distance=clamp(Number.isFinite(distance)?distance:profile.max,0,profile.max);let x=clamp(a.x+Math.cos(angle)*distance,55,W-55),y=clamp(a.y+Math.sin(angle)*distance,55,H-55);
 let d=Math.hypot(x-a.x,y-a.y);if(d>.001)angle=Math.atan2(y-a.y,x-a.x);let valid=true;
 if(profile.teleport){const plan=revisionTeleport(a,angle,d);x=plan.x;y=plan.y;valid=Math.hypot(x-a.x,y-a.y)>=8;}
 else if(profile.block!==undefined){d=aimRayV4(a,angle,d,profile.block);x=a.x+Math.cos(angle)*d;y=a.y+Math.sin(angle)*d;}
 if(profile.wall&&typeof dojoWallFits==='function'){const vertical=Math.abs(Math.cos(angle))>Math.abs(Math.sin(angle));valid=dojoWallFits({x,y,w:vertical?24:150,h:vertical?150:24});}
 return{profile,angle,distance:Math.hypot(x-a.x,y-a.y),x,y,valid,pointAim:true};
}
function automaticAimV4(a,id){const cfg=aimProfileV4(a,id),target=a===p&&mouse?mouse:enemy(a),angle=Math.atan2(target.y-a.y,target.x-a.x);return resolveAimV4(a,id,angle,Math.min(cfg.max??0,dist(a,target)));}
function aimSelectionV4(q){const id=p.kit[q.index],cfg=aimProfileV4(p,id);if(cfg.kind!=='circle')return{profile:cfg,angle:q.a};if(!q.dragged)return automaticAimV4(p,id);return resolveAimV4(p,id,q.a,Math.hypot(q.dx,q.dy)/(q.stickRadius||86)*cfg.max);}
function drawAimV4(){if(!aimGesture||!p)return;const selected=aimSelectionV4(aimGesture),cfg=selected.profile;ctx.save();ctx.strokeStyle='rgba(246,91,99,.55)';ctx.fillStyle='rgba(246,91,99,.12)';ctx.lineWidth=2;
 if(cfg.kind==='arrow'){const a=selected.angle;ctx.translate(p.x,p.y+4);ctx.rotate(a);ctx.beginPath();ctx.moveTo(27,-5);ctx.lineTo(83,-5);ctx.lineTo(83,-13);ctx.lineTo(108,0);ctx.lineTo(83,13);ctx.lineTo(83,5);ctx.lineTo(27,5);ctx.closePath();ctx.fillStyle='rgba(246,91,99,.25)';ctx.fill();ctx.stroke();}
 else if(cfg.kind==='circle'){ctx.beginPath();ctx.arc(selected.x,selected.y,cfg.radius,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(selected.x,selected.y,3,0,TAU);ctx.fillStyle='rgba(246,91,99,.65)';ctx.fill();if(!selected.valid){ctx.beginPath();ctx.moveTo(selected.x-7,selected.y-7);ctx.lineTo(selected.x+7,selected.y+7);ctx.moveTo(selected.x+7,selected.y-7);ctx.lineTo(selected.x-7,selected.y+7);ctx.stroke();}}
 ctx.restore();
}
let aimCastContextV4=null;
const castBeforeAimV4=cast;
cast=function(a,id,manual){if(!a)return false;const cfg=aimProfileV4(a,id);if(cfg.kind!=='circle')return castBeforeAimV4(a,id,manual?.pointAim?manual.angle:manual);
 const selected=manual?.pointAim?resolveAimV4(a,id,manual.angle,manual.distance):typeof manual==='number'?resolveAimV4(a,id,manual,cfg.max):automaticAimV4(a,id);
 if(cfg.teleport&&!selected.valid){if(a===p)toast('Escolha um ponto livre para chegar.');return false;}
 const old=aimCastContextV4;aimCastContextV4={actor:a,id,selected};try{const result=castBeforeAimV4(a,id,selected.angle);if(result){const q=a.astralCast||a.eclipseCast||a.rpCast||a.dojoGesture;if(q){q.aimPoint={x:selected.x,y:selected.y};q.aimDistance=selected.distance;if(a.eclipseCast)q.target={...q.aimPoint};if(a.dojoGesture){q.tx=selected.x;q.ty=selected.y;}}}return result;}finally{aimCastContextV4=old;}
};
function aimLandingV4(a,q,range){if(!q.aimPoint)return revisionTeleport(a,q.angle,range);const angle=Math.atan2(q.aimPoint.y-a.y,q.aimPoint.x-a.x),d=Math.min(range,dist(a,q.aimPoint));return revisionTeleport(a,angle,d);}
function aimTargetV4(a,q,range,r=0){const angle=q.aimPoint?Math.atan2(q.aimPoint.y-a.y,q.aimPoint.x-a.x):q.angle,d=q.aimPoint?Math.min(range,dist(a,q.aimPoint)):range,reach=aimRayV4(a,angle,d,r);return{x:a.x+Math.cos(angle)*reach,y:a.y+Math.sin(angle)*reach};}
// Native Android image menus and text selection must not interrupt a held skill.
function gameControlV4(node){return node instanceof Element&&!!node.closest('.skill,#attack,#defend,#dodge,#stick,#arena');}
for(const type of ['contextmenu','dragstart','selectstart'])document.addEventListener(type,e=>{if(gameControlV4(e.target))e.preventDefault();},{capture:true});
document.addEventListener('touchstart',e=>{if(state==='fight'&&gameControlV4(e.target))e.preventDefault();},{capture:true,passive:false});
const updateBeforeAimV4=updateUI;updateUI=function(){updateBeforeAimV4();document.querySelectorAll('.skill').forEach(el=>{el.removeAttribute('title');el.querySelectorAll('img').forEach(im=>im.draggable=false);});};

const wallBeforeAimV4=dojoWallPlan;
dojoWallPlan=function(a,angle){const wall=wallBeforeAimV4(a,angle),c=aimCastContextV4;if(c?.actor===a&&c.selected.profile.wall){wall.x=c.selected.x;wall.y=c.selected.y;}return wall;};

astralBlinkPlan=function(a,angle,range=320){const c=aimCastContextV4;return revisionTeleport(a,angle,c?.actor===a&&c.selected.profile.teleport?c.selected.distance:range);};
const projectileBeforeAimV4=astralProjectile;
astralProjectile=function(a,kind,angle,dmg,speed,range,r){const e=projectileBeforeAimV4(a,kind,angle,dmg,speed,range,r),point=kind==='sphere'?a.astralCast?.aimPoint:null;if(point){const d=dist(a,point),angle=d>.001?Math.atan2(point.y-a.y,point.x-a.x):e.angle,offset=Math.min(28,d);e.x=a.x+Math.cos(angle)*offset;e.y=a.y+Math.sin(angle)*offset;e.angle=angle;e.range=Math.max(0,d-offset);e.life=e.maxLife=e.range/speed;}return e;};

eclipseBlinkPlan=function(a,angle,range=200){const c=aimCastContextV4;return revisionTeleport(a,angle,c?.actor===a&&c.selected.profile.teleport?c.selected.distance:range);};

const CHAMPION_HEROES={"astral": "assets/sprites/arte_160.webp", "ninja": "assets/sprites/arte_161.webp", "ronin": "assets/sprites/arte_162.webp", "solar": "assets/sprites/arte_163.webp", "eclipse": "assets/sprites/arte_164.webp", "hunter": "assets/sprites/arte_165.webp"};
let integrationReady=false,detailChampion=null,detailSkill=0,rosterQuery='';
const HERO_KEYS=['astral','ninja','ronin','solar','eclipse','hunter'];
function championArt(c){return CHAMPION_HEROES[HERO_KEYS[c.id]]||IMPORTED_CHAMPION_PORTRAITS[c.id]||'';}
const HERO_ROLES=['Lutador · Energia','Assassino · Relâmpago','Duelista · Lâminas','Guerreiro · Fogo','Mago · Espaço','Lutador · Aura'];
const HERO_STORIES=['Punhos firmes, energia sem limites. Alterna rajadas à distância, teletransporte e golpes de impacto.','Um sentinela entre o trovão e a névoa. Confunde o adversário com cópias elétricas, matilhas e fendas.','Um espadachim de capa carmesim. Encadeia cortes e desperta uma forma sombria quando a luta chega ao limite.','Uma chama que se recusa a apagar. Abre caminho com sua espada, cercado por fogo e determinação.','O espaço se curva diante dele. Aproxima, afasta e prende os adversários em um horizonte sem saída.','Cada golpe carrega uma promessa. Combina punhos de aura, defesa de jade e força colossal.'];
const integrationNormalize=normalizeChampions;
normalizeChampions=function(){account.champions=CHAMPIONS.map(c=>c.id);account.championFirstDone=true;account.championVersion=1;if(!Number.isInteger(account.activeChampion)||!CHAMPIONS[account.activeChampion])account.activeChampion=validSkin(account.profile?.skin);integrationNormalize();account.champions=CHAMPIONS.map(c=>c.id);account.owned=[...new Set([...account.owned,...CHAMPIONS.flatMap(c=>c.kit)])];};
function rosterCard(c){return `<button class="hero-card ${account.activeChampion===c.id?'selected':''}" data-hero-open="${c.id}" style="--hero:${c.color}" aria-label="Conhecer ${c.name}"><span class="hero-card-art"><img src="${championArt(c)}" alt="" draggable="false"></span><span class="hero-card-number">0${c.id+1}</span><span class="hero-card-copy"><small>${(HERO_ROLES[c.id]?.split(' · ')[1]||c.weapon)}</small><strong>${c.name}</strong><span>${account.activeChampion===c.id?'✓ SELECIONADO':'DESBLOQUEADO'}</span></span></button>`;}
renderSelection=function(){normalizeChampions();$('#selection').innerHTML=`<div class="roster-page"><header class="roster-head"><button class="icon-back" data-nav="home" aria-label="Voltar ao início">←</button><div><span class="eyebrow">ELDORIA · ARENA DOS CAMPEÕES</span><h1>Escolha sua lenda.</h1></div><span class="roster-count">${CHAMPIONS.length}<span>/ ${CHAMPIONS.length}</span></span></header><p class="roster-intro">Dez caminhos. Uma arena.<br>Todos liberados em todos os modos.</p><label class="hero-search"><span aria-hidden="true">⌕</span><input id="heroSearch" type="search" placeholder="Buscar campeão" value="${escapeHTML(rosterQuery)}" aria-label="Buscar campeão"></label><div class="hero-grid" id="heroGrid">${CHAMPIONS.filter(c=>c.name.toLocaleLowerCase('pt-BR').includes(rosterQuery.toLocaleLowerCase('pt-BR'))).map(rosterCard).join('')}</div><p class="roster-foot">Toque em um avatar para conhecer o campeão e suas seis habilidades.</p></div>`;$('#loadout').hidden=true;$('#loadout').style.display='none';$('#heroSearch').oninput=e=>{rosterQuery=e.target.value;const shown=CHAMPIONS.filter(c=>c.name.toLocaleLowerCase('pt-BR').includes(rosterQuery.toLocaleLowerCase('pt-BR')));$('#heroGrid').innerHTML=shown.map(rosterCard).join('')||'<p class="empty-roster">Nenhum campeão encontrado.</p>';};};
function closeHeroDetail(){detailChampion=null;$('#heroDetail')?.remove();document.body.classList.remove('hero-detail-open');}
function detailSkillText(c,i){const s=skills[c.kit[i]];return `<b>${i===5?'ULT · ':''}${escapeHTML(s.name.replace(/^ULT · /,''))}</b><p>${escapeHTML(s.desc)}</p><span>${s.cost} MP <i>·</i> ${s.cd}s de recarga${i===5?' <i>·</i> HP ≤20%; livre no treino':''}</span>`;}
openChampionDetails=function(id){id=Number(id);const c=CHAMPIONS[id];if(!c)return;closeHeroDetail();detailChampion=id;detailSkill=0;const el=document.createElement('section');el.id='heroDetail';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',c.name);el.style.setProperty('--hero',c.color);el.innerHTML=`<div class="hero-detail-inner"><header class="hero-detail-head"><button class="icon-back" data-hero-back aria-label="Voltar aos campeões">←</button><span>CAMPEÃO <b>0${id+1}</b></span><span class="hero-unlocked">✓ LIBERADO</span></header><div class="hero-heading"><span class="eyebrow">${HERO_ROLES[id]||c.weapon}</span><h1>${c.name}</h1></div><div class="hero-stage"><span class="hero-halo"></span><span class="hero-sigil">✧</span><img src="${championArt(c)}" alt="${c.name} de corpo inteiro" draggable="false"><span class="hero-stage-label">${c.title||'Campeão de Eldoria'}</span></div><div class="hero-info"><div class="hero-stat"><span>VIDA</span><b>1.000</b></div><div class="hero-stat"><span>HABILIDADES</span><b>5 <small>+ ULT</small></b></div><div class="hero-stat"><span>DISPONÍVEL</span><b class="all-modes">Todos os modos</b></div></div><p class="hero-story">${HERO_STORIES[id]||c.summary}</p><div class="hero-kit" aria-label="Seis habilidades">${c.kit.map((sid,i)=>`<button class="${i===0?'active':''}" data-hero-skill="${i}" aria-label="${escapeHTML(skills[sid].name)}" aria-pressed="${i===0}">${icon(sid)}<small>${i===5?'ULT':i+1}</small></button>`).join('')}</div><div class="hero-skill-copy" id="heroSkillCopy">${detailSkillText(c,0)}</div><footer class="hero-detail-actions"><button class="ghost" data-hero-test>Testar no dojo</button><button class="gold" data-hero-confirm>${account.activeChampion===id?'Usar campeão':'Selecionar'} <span>↗</span></button></footer></div>`;document.body.appendChild(el);document.body.classList.add('hero-detail-open');el.querySelector('[data-hero-back]').focus({preventScroll:true});};
function confirmChampion(test=false){if(detailChampion===null)return false;const id=detailChampion;if(!equipChampion(id,false))return false;closeHeroDetail();if(test){practiceOptions.free=false;beginProgression('training');}else{showScreen('home');toast(CHAMPIONS[id].name+' selecionado · disponível em todos os modos');}return true;}
const integrationShowScreen=showScreen;showScreen=function(name){closeHeroDetail();normalizeChampions();return integrationShowScreen(name);};
showFirstSummon=function(){normalizeChampions();showScreen('library');};
renderShop=function(){normalizeChampions();$('#shopScreen').innerHTML=appHeader()+`<div class="roster-page"><header class="section-head"><button class="ghost" data-nav="home">← Início</button><span class="eyebrow">COLEÇÃO COMPLETA</span><h1>Os dez já são seus.</h1><p>Todos os campeões estão desbloqueados. Escolha quem entra na próxima batalha.</p></header><div class="hero-grid">${CHAMPIONS.map(rosterCard).join('')}</div></div>`;};
const integrationRenderTraining=renderTraining;renderTraining=function(){integrationRenderTraining();const panel=$('#trainingScreen .progression-grid section:last-child');if(panel){const paragraph=panel.querySelector('p');if(paragraph)paragraph.textContent='Ultimate livre no treino. Pratique as seis habilidades, a mira e as animações sem precisar reduzir o HP.';}};
const integrationPrepare=prepareProgressionMatch;prepareProgressionMatch=function(){integrationPrepare();if(battleActivity==='training'){const old=$('[data-test-ultimate]');if(old)old.remove();$('#trainingPause').insertAdjacentHTML('beforeend','<p class="setting-hint">Ultimate liberada no treino · todas as seis habilidades disponíveis.</p><button class="ghost" data-training-worn>Testar visual surrado · 19% de HP</button>');}};
document.addEventListener('click',e=>{const card=e.target.closest('[data-hero-open]');if(card){openChampionDetails(+card.dataset.heroOpen);return;}if(e.target.closest('[data-hero-back]')){closeHeroDetail();return;}if(e.target.closest('[data-hero-confirm]')){confirmChampion();return;}if(e.target.closest('[data-hero-test]')){confirmChampion(true);return;}const skill=e.target.closest('[data-hero-skill]');if(skill&&detailChampion!==null){detailSkill=+skill.dataset.heroSkill;$('#heroSkillCopy').innerHTML=detailSkillText(CHAMPIONS[detailChampion],detailSkill);$('#heroDetail').querySelectorAll('[data-hero-skill]').forEach(b=>{b.classList.toggle('active',+b.dataset.heroSkill===detailSkill);b.setAttribute('aria-pressed',String(+b.dataset.heroSkill===detailSkill));});return;}if(e.target.closest('[data-training-worn]')&&p){p.hp=Math.round(p.max*.19);updateUI();}if(e.target.closest('#riftCombatToggle'))dojoSetRiftMode(dojoRiftMode==='attack'?'defense':'attack');});
document.addEventListener('keydown',e=>{if(detailChampion===null)return;if(e.key==='Escape'){e.preventDefault();closeHeroDetail();}else if(e.key==='Tab'){const buttons=[...$('#heroDetail').querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
const integrationOpenProfile=openProfile;openProfile=function(){integrationOpenProfile();$('#profileScreen p').textContent='Escolha seu nome e símbolo. Depois, escolha um dos dez campeões disponíveis.';$('#profileScreen button[type="submit"]').textContent=account.profile?'Salvar nome e símbolo':'Continuar · escolher campeão ↗';};
document.addEventListener('click',e=>{const btn=e.target.closest('[data-champ-demo]');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();const s=skills[+btn.dataset.champDemo];openChampionDetails(s.champion);$('#heroDetail [data-hero-skill="'+s.slot+'"]').click();},true);

window.arenaQA={champions:{list:CHAMPIONS,equip:equipChampion,summon:summonChampion,canUlt:canUseUltimate,current:currentChampion,open:openChampionDetails,normalize:normalizeChampions},arenas:{begin:beginArenaMode,advance:continueArenaMode,step:stepArenaMode,end:endArenaMode,get run(){return modeRun},get size(){return {w:W,h:H,scale,ox,oy}}},income:{view:dailyIncomeView,quote:dailyIncomeQuote,award:awardMatchCoins,normalize:normalizeDailyIncome},shop:{normalize:normalizeShop,request:requestShopPurchase,confirm:confirmShopPurchase,cancel:closeShopConfirm,buy:buyCosmetic,equip:equipCosmetic,preview:openEcoPreview,remember:rememberSpin},journey:{normalize:normalizeJourney,complete:completeJourneyTask,claim:claimJourney,choices:journeyChoices,setWish,finishTraining:finishTrainingJourney},lobby:{cycle:cycleLobbyBuild,play:playLobbyMode,draw:drawLobbyHero,activeBuild:activeLobbyBuild,motionEnabled:lobbyMotionEnabled,refreshDaily:refreshLobbyDaily,get prefs(){return lobbyPrefs},get renders(){return lobbyRenderCount}},progression:{begin:beginProgression,normalize:normalizeProgression,saveBuild:saveBuildSlot,loadBuild:loadBuildSlot,resetPractice,get activity(){return battleActivity},get training(){return trainingSession},get options(){return practiceOptions},get leagueMatch(){return leagueMatch},leagueIndex},skills,skins:SKINS,skinPose,validSkin,drawSkinBody,drawAnimatedFighter,fighterMotion,beginFighterEcho,fighterDrawSize:FIGHTER_DRAW_SIZE,get skinReady(){return skinImageReady},get skinAtlasBytes(){return 640*480*4},start,get actors(){return actors},get account(){return account},get mode(){return matchMode},queue:queueMatch,spin:spinEcho,exchange:exchangeEcho,dailyAvailable,dayKey,showScreen,startProfile:openProfile,cast,step,basic,dodge,move,leave,ai,get elapsed(){return 180-time},get state(){return state},get player(){return p},get bot(){return b},hit,setGuard,punch,get shots(){return shots},hurtConstructs,pullToward,get objects(){return objects},get zones(){return zones},select(ids){selected=[...ids];renderSelection()},begin(){state='fight';$('#countdown').style.display='none'},get backgroundBuilds(){return backgroundBuilds},get backgroundMemoryBytes(){return groundCache?W*H*4*2:0},get skillArtCount(){return VFX_PROFILES.length},get spriteMemoryBytes(){return skillSpriteMemoryBytes()},get spriteCount(){return skillSpriteCache.size},get animationFrames(){return SKILL_SPRITE_FRAMES},get spriteFX(){return vfxEvents},vfx:{profiles:VFX_PROFILES,limits:VFX_LIMITS,get spriteSeen(){return [...paintedSkillSeen]},get frameMasks(){return [...paintedFrameMasks]},get spritesReady(){return skillSpritesReady},get particles(){return vfxParticles},get effects(){return vfxEvents},get time(){return vfxTime},get seen(){return [...vfxSeen]},setQuality:vfxSetQuality,get quality(){return vfxQuality}},draw,get projection(){return{cw,ch,scale,ox,oy}},skillControlState,summon:{finish:finishEchoSummon,get active(){return !!activeSummon},draw:drawSummonSeal,duration:SUMMON_DURATION},get dimensions(){return{W,H}}};
window.integrationQA={get ready(){return integrationReady},get detail(){return detailChampion},get entries(){return integratedDepth()},resolve:resolveAimV4,select:openChampionDetails,confirm:confirmChampion,step,draw,cast,get actors(){return actors},get account(){return account},get modes(){return ARENA_MODES},test(code){return eval(code)}};
async function integrationBoot(){
 // CORRECAO: não bloquear o menu aguardando TODAS as artes.
 // No arquivo separado, algumas imagens podem disparar 'error' antes de
 // este trecho cadastrar os ouvintes; aguardar esse evento de novo congela a entrada.
 // As imagens continuam carregando em paralelo e serão desenhadas quando prontas.
 const all=[DOJO_BASE_IMAGE,...Object.values(DOJO_STRIKE_IMAGES),...Object.values(dojoKitImages),...Object.values(dojoWoundImages),...Object.values(astralImages),...Object.values(eclipseImages),...Object.values(rpImages)];
 window.arenaAssetsStatus={total:all.length,ready:all.filter(im=>im.complete&&im.naturalWidth>0).length,failed:all.filter(im=>im.complete&&!im.naturalWidth).length};
 normalizeChampions();loadSkinAtlas();initChampions();initProgression();initLobby();initJourney();initShop();initArenaModes();initApp();normalizeChampions();saveAccount();
 const submit=$('#profileForm').onsubmit;$('#profileForm').onsubmit=e=>{const isNew=!account.profile;submit(e);if(isNew&&account.profile&&$('#profileScreen').hidden)showScreen('library');};
 $('#profileScreen p').textContent='Escolha seu nome e símbolo. Depois, escolha um dos dez campeões disponíveis.';$('#profileScreen button[type="submit"]').textContent=account.profile?'Salvar nome e símbolo':'Continuar · escolher campeão ↗';
 $('#pauseBtn').insertAdjacentHTML('afterend','<button id="riftCombatToggle" type="button" hidden aria-label="Alternar modo da Fenda do Véu">Fenda: ofensiva</button>');const oldRift=dojoSetRiftMode;dojoSetRiftMode=function(mode){oldRift(mode);$('#riftCombatToggle').textContent='Fenda: '+(dojoRiftMode==='attack'?'ofensiva':'defensiva');};
 $('#rematch').onclick=start;$('#leave').onclick=leave;$('#change').onclick=()=>{leave();showScreen('library')};integrationReady=true;$('#integrationLoading')?.remove();requestAnimationFrame(frame);if(account.profile)showScreen('library');else showScreen('profile');
}

// A inicialização foi movida para iniciar.js para carregar as quatro lendas antes.
