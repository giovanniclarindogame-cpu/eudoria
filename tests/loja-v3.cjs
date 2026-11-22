// Progressão v3: reset único de contas antigas, presente inicial, rodízio semanal, Loja (moedas; 💎 bloqueado) e campeões bloqueados.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1000,height:450}});
 await ctx.addInitScript(()=>{if(!localStorage.getItem('__seeded')){localStorage.setItem('__seeded','1');localStorage.setItem('eldoria-ecos-v8',JSON.stringify({version:8,profile:{name:'Veterano',avatar:2,skin:0},owned:[0,1,2],build:[0,1,2,3,4,5],coins:99999,crystals:777,wins:50,matches:80}));localStorage.setItem('eldoria.arcade.v1','{"cleared":{"zorvath":1}}');localStorage.setItem('eldoria.cacada.v1','{"wins":{"zorvath":3}}')}});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8000/index.html?liberados=0&teste=0');await p.waitForTimeout(1500);await p.getByText('ENTRAR',{exact:true}).click();await p.waitForTimeout(1500);
 // 1) reset + presente
 let a=await p.evaluate(()=>({name:account.profile&&account.profile.name,avatar:account.profile&&account.profile.avatar,coins:account.coins,crystals:account.crystals,owned:account.ownedHeroes,champs:account.champions,gift:account.giftPending,prog:account.progVer,modal:!!document.querySelector('#ljModal'),arcade:localStorage.getItem('eldoria.arcade.v1'),hunt:localStorage.getItem('eldoria.cacada.v1'),wins:account.wins}));
 ok(a.name==='Veterano'&&a.avatar===2&&a.coins===0&&a.crystals===0&&a.wins===0&&a.arcade===null&&a.hunt===null&&a.prog===3,'conta antiga reiniciada uma vez: mantém só nome e símbolo; moedas, 💎, vitórias e progresso da campanha zerados');
 ok(a.owned.length===1&&a.owned[0]>=0&&a.owned[0]<10&&a.gift===false&&a.modal,'presente inicial: 1 campeão sorteado entregue com a janelinha do 🎁 ('+a.owned+')');
 ok(a.champs.length>=3&&a.champs.length<=4&&a.champs.includes(a.owned[0]),'campeões usáveis = o de presente + os 3 grátis da semana ('+a.champs+')');
 await p.click('[data-lj-close]');await p.waitForTimeout(300);
 // 2) rodízio semanal
 const w=await p.evaluate(()=>{const day=864e5,base=Date.UTC(2026,0,5,12);const sets=[];for(let i=0;i<12;i++)sets.push(heroesFreeThisWeek(base+i*7*day).join());const same=[heroesFreeThisWeek(base).join(),heroesFreeThisWeek(base+2*day).join(),heroesFreeThisWeek(base+6*day).join()];
  return{sets,same,distinct:new Set(heroesFreeThisWeek().map(x=>x)).size,uniq:new Set(sets).size,next:nextFreeRotation()>Date.now()&&nextFreeRotation()-Date.now()<=7*day}});
 ok(w.same[0]===w.same[1]&&w.same[1]===w.same[2],'o sorteio dos 3 grátis é igual durante a semana inteira (segunda a domingo)');
 ok(w.distinct===3&&w.uniq>=6,`sempre 3 heróis diferentes e o conjunto muda de semana (${w.uniq} conjuntos em 12 semanas)`);
 ok(w.next,'renovação semanal marcada para a próxima segunda-feira (em até 7 dias)');
 // 3) Loja e compra
 await p.evaluate(()=>{account.coins=6999;saveAccount();showScreen('shop')});await p.waitForTimeout(600);
 const shop=await p.evaluate(()=>({title:document.querySelector('.lj-head h1')?.textContent,free:document.querySelectorAll('.lj-freecard').length,cards:document.querySelectorAll('.lj-card').length,gemDisabled:[...document.querySelectorAll('.lj-gem-btn')].every(b=>b.disabled)&&document.querySelectorAll('.lj-gem-btn').length>0,own:document.querySelectorAll('.lj-card.own').length,nav:!!document.querySelector('[data-nav="shop"]')}));
 ok(shop.title==='Loja'&&shop.free===3&&shop.cards===10&&shop.own===1&&shop.gemDisabled,'Loja: 3 grátis da semana, 10 campeões, o presente marcado como seu e botões de 💎 bloqueados');
 const locked=await p.evaluate(()=>CHAMPIONS.map(c=>c.id).filter(id=>!heroOwned(id)&&!heroUsable(id))[0]);
 const lockedBefore=await p.evaluate(id=>({usable:heroUsable(id),equip:equipChampion(id,false)}),locked);
 ok(!lockedBefore.usable&&lockedBefore.equip===false,'campeão não liberado não pode ser equipado');
 const poor=await p.evaluate(id=>({r:V3Loja.buyHero(id),coins:account.coins,owned:heroOwned(id)}),locked);
 ok(poor.r===false&&poor.coins===6999&&!poor.owned,'sem moedas suficientes (6.999) a compra é recusada e nada é cobrado');
 await p.evaluate(()=>{account.coins=7000;saveAccount()});
 const buy=await p.evaluate(id=>({r:V3Loja.buyHero(id),coins:account.coins,owned:heroOwned(id),usable:heroUsable(id),saved:JSON.parse(localStorage.getItem(SAVE_KEY)||localStorage.getItem('eldoria-ecos-v8')).ownedHeroes.includes(id)}),locked);
 ok(buy.r===true&&buy.coins===0&&buy.owned&&buy.usable,'com 7.000 moedas a compra funciona: cobra 7.000 e libera o campeão');
 // 4) campeões bloqueados na tela de Campeões e no detalhe
 const lk=await p.evaluate(()=>{showScreen('library');const cards=[...document.querySelectorAll('.hero-card')];return{n:cards.length,locked:document.querySelectorAll('.hero-card.locked').length,free:document.querySelectorAll('.hero-card.week-free').length,owned:CHAMPIONS.filter(c=>heroOwned(c.id)).length}});
 ok(lk.n===10&&lk.locked===10-lk.owned-(await p.evaluate(()=>heroesFreeThisWeek().filter(id=>!heroOwned(id)).length))&&lk.free>=2,`Campeões: bloqueados com 🔒 e preço, os grátis da semana destacados (${lk.locked} bloqueados, ${lk.free} grátis)`);
 const lockId=await p.evaluate(()=>CHAMPIONS.map(c=>c.id).filter(id=>!heroUsable(id))[0]);
 const det=await p.evaluate(id=>{openChampionDetails(id);const b=document.querySelector('#heroDetail [data-hero-confirm]');return{btn:b&&b.textContent,test:!!document.querySelector('#heroDetail [data-hero-test]')}},lockId);
 ok(/Comprar/.test(det.btn)&&!det.test,'detalhe de campeão bloqueado mostra "Comprar" e não oferece treino');
 await p.evaluate(()=>closeHeroDetail());
 // 5) seleção KOF/1x1: bloqueados não podem ser escolhidos
 const k=await p.evaluate(()=>{V3Kof.open('1v1');return{locked:document.querySelectorAll('.kx-tile.locked').length,usable:account.champions.length}});
 ok(k.locked===10-k.usable,'na seleção de luta os campeões bloqueados aparecem com cadeado');
 const before=await p.evaluate(()=>document.querySelector('.kx-team.left .kx-row.full span')?.textContent);
 await p.evaluate(id=>document.querySelector(`[data-kof-pick="${id}"]`).click(),lockId);
 const after=await p.evaluate(()=>document.querySelector('.kx-team.left .kx-row.full span')?.textContent);
 ok(before===after,'tocar em campeão bloqueado não o seleciona');
 // 6) segundo acesso: não reinicia nem dá outro presente
 const snap=await p.evaluate(()=>JSON.stringify({o:account.ownedHeroes,c:account.coins}));
 await p.reload();await p.waitForTimeout(1500);if(await p.getByText('ENTRAR',{exact:true}).first().isVisible())await p.getByText('ENTRAR',{exact:true}).first().click();await p.waitForTimeout(1500);
 const again=await p.evaluate(()=>({snap:JSON.stringify({o:account.ownedHeroes,c:account.coins}),modal:/PRESENTE/.test(document.querySelector('#ljModal .lj-gift-tag')?.textContent||'')}));
 ok(again.snap===snap&&!again.modal,'ao entrar de novo nada é reiniciado e não há segundo presente');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,2));
 await br.close();
})();
