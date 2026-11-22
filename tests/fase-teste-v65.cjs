// Fase de teste com amigos: sem moedas/Loja/Missões/presentes, todos os heróis liberados, tutorial obrigatório na primeira entrada.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const errs=[];
 const pg=await (await br.newContext({viewport:{width:1000,height:520}})).newPage();pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?semcarga=1');await pg.waitForTimeout(900);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Amigo');await pg.getByText('Continuar',{exact:true}).click();
 await pg.waitForSelector('.v40-home',{timeout:20000});await pg.waitForTimeout(2500);
 ok(await pg.evaluate(()=>document.body.classList.contains('fase-teste')),'a fase de teste está ativa');
 ok(await pg.evaluate(()=>!document.querySelector('#ljModal .lj-gift-tag')||!/PRESENTE INICIAL/.test(document.querySelector('#ljModal').textContent)),'não aparece o presente inicial');
 const tut=await pg.evaluate(()=>{const m=document.querySelector('#ljModal');return m?{txt:m.textContent,skip:!!m.querySelector('[data-tut-skip]'),go:!!m.querySelector('[data-tut-go]')}:null});
 ok(tut&&/Treino com o fantoche/.test(tut.txt)&&tut.go&&!tut.skip,'na primeira entrada aparece o tutorial, sem o botão "Pular"');
 ok(tut&&!/moeda/i.test(tut.txt)&&/precisa concluir/.test(tut.txt),'o tutorial não fala de moedas e avisa que é obrigatório');
 // não dá para fechar de outro jeito: clicar em "Pular" (que não existe) ou voltar ao início faz o tutorial reaparecer
 await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());await pg.waitForTimeout(1600);
 ok(await pg.evaluate(()=>!!document.querySelector('#ljModal [data-tut-go]')),'se a janela some, o tutorial reaparece (só termina concluindo)');
 // carteira, Loja, Missões e presente escondidos
 const vis=await pg.evaluate(()=>{const v=s=>{const e=document.querySelector(s);return !!e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0};return{moeda:v('.v40-cur'),loja:v('.v41-side [data-nav="shop"]'),missoes:v('.v41-side [data-v40-missions]'),presente:v('.v41-gift'),campeoes:v('.v41-side [data-nav="library"]'),dojo:v('.v41-side [data-nav="training"]')}});
 ok(!vis.moeda&&!vis.loja&&!vis.missoes&&!vis.presente&&vis.campeoes&&vis.dojo,`sem moedas, Loja, Missões e presente; Campeões e Dojo continuam (${JSON.stringify(vis)})`);
 await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());
 await pg.evaluate(()=>document.querySelector('[data-v40-menu]').click());await pg.waitForTimeout(300);
 ok(await pg.evaluate(()=>!document.querySelector('[data-v40-go="shop"]')&&!document.querySelector('[data-v40-go="missions"]')&&!!document.querySelector('[data-v40-go="conta"]')&&document.querySelectorAll('#v40Menu .v40-menu-grid button').length===4),'o Menu não tem Loja nem Missões (só conta, feedback, configurações e tela cheia)');
 await pg.evaluate(()=>document.querySelector('#v40Menu [data-v40-close]').click());
 // todos os campeões
 ok(await pg.evaluate(()=>account.champions.length===10&&OnlineV45.owned().length===10),'todos os 10 campeões estão liberados (também online)');
 // sem moedas
 ok(await pg.evaluate(()=>awardMatchCoins(100)===0),'nenhuma partida dá moedas');
 ok(await pg.evaluate(()=>!/moeda/i.test(document.querySelector('.v40-mode-txt')?.textContent||'')),'o cartão do modo no início não mostra recompensa em moedas');
 // concluindo o tutorial (marcado como feito) a janela não volta
 await pg.evaluate(()=>{account.tutorialDone=true;saveAccount();document.querySelector('#ljModal')?.remove()});await pg.waitForTimeout(1800);
 ok(await pg.evaluate(()=>!document.querySelector('#ljModal')),'depois de concluído o tutorial não aparece mais');
 // ?teste=0 mostra o jogo normal
 const pg2=await (await br.newContext({viewport:{width:1000,height:520}})).newPage();
 await pg2.goto('http://localhost:8000/index.html?semcarga=1&teste=0');await pg2.waitForTimeout(900);
 await pg2.getByText('ENTRAR',{exact:true}).click();await pg2.fill('#profileName','Normal');await pg2.getByText('Continuar',{exact:true}).click();await pg2.waitForSelector('.v40-home',{timeout:20000});await pg2.waitForTimeout(2500);
 ok(await pg2.evaluate(()=>!document.body.classList.contains('fase-teste')&&getComputedStyle(document.querySelector('.v40-cur')).display!=='none'),'com ?teste=0 o jogo volta ao normal (moedas visíveis)');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,3));
 await br.close();
})();
