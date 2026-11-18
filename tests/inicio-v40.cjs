// Início v40: tela inicial nova, tela de modos com arrastar e abas, modo escolhido fica registrado e o JOGAR abre esse modo.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();
 for(const [w,h,touch] of [[844,390,true],[1280,720,false]]){
 const pg=await (await br.newContext({viewport:{width:w,height:h},hasTouch:touch})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1');await pg.waitForTimeout(900);await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2200);
 const tag=`[${w}×${h}]`;
 const home=await pg.evaluate(()=>{const v=document.querySelector('.v40-home'),r=v?.getBoundingClientRect();const nav=document.querySelector('#lobbyNav');
  const vis=s=>{const e=document.querySelector(s);if(!e)return false;const b=e.getBoundingClientRect();return b.width>0&&b.height>0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1&&b.left>=-1&&b.top>=-1};
  return{full:r&&r.width>=innerWidth-1&&r.height>=innerHeight-1,nav:nav?getComputedStyle(nav).display:'none',play:vis('[data-v40-play]'),mode:vis('[data-v40-modes]'),hero:!!document.querySelector('.v40-hero-wrap canvas'),side:vis('.v40-side'),top:vis('.v40-top-right'),
   modeName:document.querySelector('.v40-mode-txt b')?.textContent}});
 ok(home.full&&home.nav==='none',`${tag} início novo ocupa a tela e esconde o menu lateral antigo`);
 ok(home.play&&home.mode&&home.side&&home.top&&home.hero,`${tag} JOGAR, cartão do modo, atalhos, moedas e campeão animado visíveis`);
 ok(home.modeName==='Liga 1×1',`${tag} modo padrão: ${home.modeName}`);
 await pg.waitForTimeout(800);
 const cena=await pg.evaluate(()=>{const imgs=[...document.querySelectorAll('.v41-scene img')],bg=['.v41-far','.v41-wall','.v41-front-l'].map(q=>getComputedStyle(document.querySelector(q)).backgroundImage);
  const m=document.querySelector('.v41-mark').getBoundingClientRect(),st=document.querySelector('.v41-stage .v40-hero-wrap').getBoundingClientRect(),play=document.querySelector('[data-v40-play]').getBoundingClientRect();
  return{loaded:imgs.every(i=>i.complete&&i.naturalWidth>0),bg:bg.every(b=>/inicio_v41/.test(b)),lamps:document.querySelectorAll('.v41-lamp').length,petals:CenaV41.state?.petals||0,
   dbg:[Math.round(st.top),Math.round(st.height),Math.round(m.top),Math.round(st.left),Math.round(st.right),Math.round(play.top)],feet:Math.abs((st.top+st.height*.78)-(m.top))<st.height*.12,heroOnScreen:st.top>=0&&st.left>=0&&st.right<=innerWidth,heroAbovePlay:st.top+st.height*.6<play.top+play.height,
   badges:{missoes:!!document.querySelector('[data-v40-missions] .v41-badge'),plus:document.querySelectorAll('.v41-plus').length,gift:!!document.querySelector('[data-v41-gift]'),evento:!!document.querySelector('[data-v41-hunt]'),liga:document.querySelector('.v41-league small')?.textContent}}});
 ok(cena.loaded&&cena.bg&&cena.lamps>=8&&cena.petals>10,`${tag} cenário em camadas carregado (${cena.lamps} lanternas, ${cena.petals} pétalas)`);
 ok(cena.feet&&cena.heroOnScreen&&cena.heroAbovePlay,`${tag} campeão em pé sobre o emblema do chão, dentro da tela`);
 ok(cena.badges.missoes&&cena.badges.plus===2&&cena.badges.gift&&cena.badges.evento&&/pts até/.test(cena.badges.liga||''),`${tag} selos, "+" nas moedas, presente, Caçada do dia e liga com pontos (${cena.badges.liga})`);
 await pg.click('[data-v40-modes]');await pg.waitForTimeout(300);
 const m=await pg.evaluate(()=>{const s=document.querySelector('#v40Modes .v40-strip');return{open:!!s&&!document.querySelector('#v40Modes').hidden,overflow:s.scrollWidth>s.clientWidth,cards:document.querySelectorAll('[data-v40-pick]').length,tabs:document.querySelectorAll('[data-v40-tab]').length}});
 ok(m.open&&m.cards>=14&&m.tabs===4&&m.overflow,`${tag} tela de modos: ${m.cards} cartões, 4 abas e rolagem lateral`);
 await pg.click('[data-v40-tab="desafio"]');await pg.waitForTimeout(700);
 const sc=await pg.evaluate(()=>{const s=document.querySelector('#v40Modes .v40-strip'),g=s.querySelector('[data-cat="desafio"]');return{left:s.scrollLeft,g:Math.min(g.offsetLeft-8,s.scrollWidth-s.clientWidth),on:document.querySelector('[data-v40-tab].on')?.dataset.v40Tab}});
 ok(sc.left>0&&Math.abs(sc.left-sc.g)<40&&sc.on==='desafio',`${tag} aba Desafios leva até a seção (${Math.round(sc.left)})`);
 if(!touch){   // arrastar com o mouse
  const box=await pg.locator('#v40Modes .v40-strip').boundingBox();const before=await pg.evaluate(()=>document.querySelector('#v40Modes .v40-strip').scrollLeft);
  await pg.mouse.move(box.x+box.width*.3,box.y+box.height*.5);await pg.mouse.down();await pg.mouse.move(box.x+box.width*.7,box.y+box.height*.5,{steps:8});await pg.mouse.up();
  const after=await pg.evaluate(()=>document.querySelector('#v40Modes .v40-strip').scrollLeft);
  ok(Math.abs(after-before)>100,`${tag} arrastar com o mouse rola os modos (${Math.round(before)} → ${Math.round(after)})`);
 }
 await pg.evaluate(()=>document.querySelector('[data-v40-pick="duelo"]').scrollIntoView({inline:'center'}));
 await pg.click('[data-v40-pick="duelo"]');await pg.waitForTimeout(400);
 const back=await pg.evaluate(()=>({closed:document.querySelector('#v40Modes').hidden,name:document.querySelector('.v40-mode-txt b')?.textContent,saved:account.v40Mode}));
 ok(!back.closed&&back.saved==='duelo',`${tag} tocar em Duelo 1×1 escolhe o modo e continua na tela de modos`);
 const v43=await pg.evaluate(()=>{const on=document.querySelector('.v43-card.on'),st=document.querySelector('#v40Modes .v40-strip'),first=st.querySelector('.v43-card').getBoundingClientRect();
  return{on:on?.dataset.v40Pick,check:!!on?.querySelector('.v43-check'),play:document.querySelector('[data-v43-play] small')?.textContent,reward:document.querySelectorAll('.v43-reward').length,rank:document.querySelectorAll('.v43-rank').length,
   soonLast:st.querySelector('.v40-group:last-child')?.dataset.cat,tabIcons:document.querySelectorAll('.v43-tabs .v40i').length,home:!!document.querySelector('#v40Modes [aria-label="Início"]'),scrollbar:getComputedStyle(st).scrollbarWidth,left:first.left}});
 ok(v43.on==='duelo'&&v43.check&&v43.play==='Duelo 1×1',`${tag} cartão escolhido em destaque e JOGAR da tela de modos mostra o modo`);
 ok(v43.reward>=12&&v43.rank===4&&v43.soonLast==='breve'&&v43.tabIcons===4&&!v43.home&&v43.scrollbar==='none',`${tag} recompensas, rank das 4 ligas, "em breve" no fim, abas com ícone, sem barra de rolagem`);
 await pg.click('#v40Modes [data-v40-close]');await pg.waitForTimeout(300);
 const back2=await pg.evaluate(()=>({closed:document.querySelector('#v40Modes').hidden,name:document.querySelector('.v40-mode-txt b')?.textContent}));
 ok(back2.closed&&back2.name==='Duelo 1×1',`${tag} voltar mostra o modo escolhido no início`);
 await pg.click('[data-v40-modes]');await pg.waitForTimeout(200);
 await pg.evaluate(()=>document.querySelector('[data-v40-pick="zona"]').scrollIntoView({inline:'center'}));await pg.click('[data-v40-pick="zona"]',{force:true});await pg.waitForTimeout(200);
 ok(await pg.evaluate(()=>!document.querySelector('#v40Modes').hidden&&account.v40Mode==='duelo'),`${tag} modo "em breve" não é escolhido`);
 await pg.click('#v40Modes [data-v40-close]');await pg.waitForTimeout(200);
 await pg.click('[data-v40-play]');await pg.waitForTimeout(600);
 const play=await pg.evaluate(()=>({kof:!!document.querySelector('.kx')&&!document.querySelector('#modeScreen').hidden,mode:lobbyPrefs.mode}));
 ok(play.kof&&play.mode==='1v1',`${tag} JOGAR com Duelo 1×1 abre a escolha de campeão do duelo`);
 // recarregar mantém o modo
 await pg.evaluate(()=>{try{saveAccount()}catch{}});await pg.reload();await pg.waitForTimeout(2500);
 const kept=await pg.evaluate(()=>{document.querySelector('#welcomeEnter')?.click();return true});await pg.waitForTimeout(1800);
 ok(await pg.evaluate(()=>account.v40Mode==='duelo'),`${tag} o modo escolhido continua salvo depois de recarregar`);
 // outros modos abrem sem erro
 const opened=await pg.evaluate(async()=>{const r={};for(const id of ['liga1','equipes','trio','coroa','cacada','torneio','dojo']){showScreen('home');InicioV40.choose(id);try{InicioV40.play();r[id]=true}catch(e){r[id]=e.message}await new Promise(z=>setTimeout(z,150))}showScreen('home');return r});
 ok(Object.values(opened).every(v=>v===true),`${tag} Liga, Equipes, Trio, Coroa, Caçada, Torneio e Dojo abrem pelo JOGAR (${JSON.stringify(opened)})`);
 ok(errs.length===0,`${tag} sem erros de JavaScript `+errs.slice(0,3));
 await pg.close();}
 await br.close();
})();
