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
 ok(back.closed&&back.name==='Duelo 1×1'&&back.saved==='duelo',`${tag} escolher Duelo 1×1 volta ao início com o modo registrado`);
 await pg.click('[data-v40-modes]');await pg.waitForTimeout(200);
 await pg.evaluate(()=>document.querySelector('[data-v40-pick="online"]').scrollIntoView({inline:'center'}));await pg.click('[data-v40-pick="online"]',{force:true});await pg.waitForTimeout(200);
 ok(await pg.evaluate(()=>!document.querySelector('#v40Modes').hidden&&account.v40Mode==='duelo'),`${tag} modo "em breve" não é escolhido`);
 await pg.click('#v40Modes .v40-modes-top [aria-label="Voltar"]');await pg.waitForTimeout(200);
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
