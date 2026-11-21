// Liga bloqueada (chip, menu, qualquer caminho) e janela de Missões com conteúdo mesmo depois dos "Primeiros passos" concluídos.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const errs=[];
 const pg=await (await br.newContext({viewport:{width:740,height:340},hasTouch:true,isMobile:true})).newPage();pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1&semcarga=1');await pg.waitForTimeout(900);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Liga');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2200);
 await pg.getByText('Pular',{exact:true}).click({timeout:1500}).catch(()=>{});await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());
 // chip da liga
 await pg.evaluate(()=>document.querySelector('.v41-league').click());await pg.waitForTimeout(300);
 ok(await pg.evaluate(()=>appScreen==='home'&&document.querySelector('#leagueScreen').hidden&&/em breve/.test(document.querySelector('.v41-league').textContent)),'o chip da Liga ao lado do perfil não abre a Liga (mostra "Ranqueado em breve")');
 // menu
 await pg.evaluate(()=>document.querySelector('[data-v40-menu]').click());await pg.waitForTimeout(300);
 ok(await pg.evaluate(()=>{const b=document.querySelector('[data-v40-go="league"]');return b&&b.classList.contains('locked')&&/em breve/.test(b.textContent)}),'no menu o item Liga aparece bloqueado');
 await pg.evaluate(()=>document.querySelector('[data-v40-go="league"]').click());await pg.waitForTimeout(300);
 ok(await pg.evaluate(()=>appScreen==='home'&&document.querySelector('#leagueScreen').hidden),'tocar em Liga no menu não abre a Liga');
 await pg.evaluate(()=>{showScreen('league')});await pg.waitForTimeout(200);
 ok(await pg.evaluate(()=>appScreen==='home'),'nem pelo código (showScreen) a tela da Liga abre');
 await pg.evaluate(()=>document.querySelector('#v40Menu [data-v40-close]')?.click());await pg.waitForTimeout(200);
 // missões depois de concluir os primeiros passos
 await pg.evaluate(()=>{account.journey=account.journey||{};account.journey.claimed=true;account.journey.training=account.journey.duel=account.journey.build=true;try{saveAccount()}catch{};showScreen('library');showScreen('home')});await pg.waitForTimeout(1500);
 await pg.evaluate(()=>document.querySelector('[data-v40-missions]').click());await pg.waitForTimeout(500);
 const m=await pg.evaluate(()=>{const c=document.querySelector('#v40Missions .v40-sheet-card'),b=document.querySelector('#v40Missions .v40-sheet-body');const r=c.getBoundingClientRect();return{goals:document.querySelectorAll('#v40Missions .ret-goal').length,bodyH:Math.round(b.getBoundingClientRect().height),cardH:Math.round(r.height),inside:r.top>=0&&r.bottom<=innerHeight,text:b.innerText.slice(0,60)}});
 ok(!/chefe do dia|Caçada/.test(m.text+await pg.evaluate(()=>document.querySelector('#v40Missions .v40-sheet-body').innerText)),'sem metas de Caçada enquanto ela está bloqueada');
 ok(m.goals===3&&m.bodyH>100&&m.inside,`com os Primeiros passos concluídos a janela de Missões mostra as 3 metas de hoje (${JSON.stringify(m)})`);
 await pg.screenshot({path:process.argv[2]||'/tmp/miss_depois.png'});
 // reabrir e fechar não deixa a janela vazia
 await pg.evaluate(()=>document.querySelector('#v40Missions [data-v40-close]').click());await pg.waitForTimeout(300);
 await pg.evaluate(()=>document.querySelector('[data-v40-missions]').click());await pg.waitForTimeout(400);
 ok(await pg.evaluate(()=>document.querySelectorAll('#v40Missions .ret-goal').length===3),'abrir de novo continua mostrando as metas');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,3));
 await br.close();
})();
