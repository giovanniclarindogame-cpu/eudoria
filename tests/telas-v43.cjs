// Telas v43: Campeões, Loja e Dojo com barra de topo nova (voltar, título, carteira), busca no topo, e tudo continua funcionando.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();
 for(const [w,h,touch] of [[844,390,true],[1280,720,false]]){
  const pg=await (await br.newContext({viewport:{width:w,height:h},hasTouch:touch})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8000/index.html?allheroes=1');await pg.waitForTimeout(900);await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2200);
  const tag=`[${w}×${h}]`;
  for(const [scr,id,title] of [['library','selection','CAMPEÕES'],['shop','shopScreen','LOJA'],['training','trainingScreen','DOJO']]){
   await pg.evaluate(s=>showScreen(s),scr);await pg.waitForTimeout(500);
   const r=await pg.evaluate(id=>{const sec=document.getElementById(id),top=sec.querySelector(':scope>.v43-scrtop'),b=document.querySelector('#backHome').getBoundingClientRect(),old=sec.querySelector('.roster-head,.lj-head,.simple-header');
    return{top:!!top,title:top?.querySelector('b')?.textContent,wallet:!!top?.querySelector('.v43-wallet'),back:b.width>0&&b.left<80&&b.top<60,oldHidden:!old||getComputedStyle(old).display==='none',bg:getComputedStyle(document.querySelector('.v43-bg')).display}},id);
   ok(r.top&&r.title===title&&r.wallet&&r.back&&r.oldHidden&&r.bg==='block',`${tag} ${title}: barra nova com voltar, título e carteira; cabeçalho antigo escondido`);
  }
  await pg.evaluate(()=>showScreen('library'));await pg.waitForTimeout(400);
  await pg.fill('.v43-scrtop #heroSearch','ninja');await pg.waitForTimeout(200);
  ok(await pg.evaluate(()=>document.querySelectorAll('#heroGrid .hero-card').length===1),`${tag} busca no topo filtra os campeões`);
  await pg.fill('.v43-scrtop #heroSearch','');await pg.waitForTimeout(200);
  await pg.click('.hero-card:nth-child(3)');await pg.waitForTimeout(600);
  ok(await pg.evaluate(()=>!!document.querySelector('#heroDetail')),`${tag} tocar no cartão abre o campeão`);
  await pg.click('#backHome');await pg.waitForTimeout(400);
  ok(await pg.evaluate(()=>!document.querySelector('#heroDetail')&&appScreen==='library'),`${tag} voltar fecha o campeão e fica em Campeões`);
  await pg.click('#backHome');await pg.waitForTimeout(500);
  ok(await pg.evaluate(()=>appScreen==='home'),`${tag} voltar em Campeões vai ao início`);
  await pg.evaluate(()=>showScreen('shop'));await pg.waitForTimeout(400);
  await pg.evaluate(()=>{account.coins=12345;renderShop()});await pg.waitForTimeout(300);
  ok(await pg.evaluate(()=>/12/.test(document.querySelector('#shopScreen .v43-wallet')?.textContent||'')),`${tag} carteira da Loja atualiza quando a tela é redesenhada`);
  ok(!errs.length,`${tag} sem erros (${errs.slice(0,2).join(' | ')})`);
 }
 await br.close();
})();
