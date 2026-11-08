// Menu v2: texto curto abaixo do JOGAR e menu lateral só na tela inicial, com botão de voltar nas demais.
// Requer Playwright e servidor local: python3 -m http.server 8000
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const b=await chromium.launch();
 for(const vp of [{width:1000,height:450},{width:844,height:390},{width:1280,height:720}]){
  const p=await b.newPage({viewport:vp});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(1200);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1500);
  const tag=`${vp.width}x${vp.height}`;
  ok(await p.locator('#lobbyNav').isVisible(),`${tag}: menu lateral visível na tela inicial`);
  ok(!(await p.locator('#backHome').isVisible()),`${tag}: sem botão de voltar na tela inicial`);
  const short=await p.locator('.mode-short').textContent();
  ok(/vitória: \+\d+ moedas/.test(short)&&!/Rendimento/.test(short),`${tag}: texto abaixo do JOGAR curto ("${short}")`);
  ok(await p.locator('.mode-more').isHidden(),`${tag}: regras escondidas por padrão`);
  await p.click('[data-mode-info]');
  ok(await p.locator('.mode-more').isVisible()&&/Rendimento diário/.test(await p.locator('.mode-more').textContent()),`${tag}: "Regras" mostra derrota e rendimento diário`);
  for(const s of ['library','training','league']){
   await p.evaluate(s=>showScreen(s),s);await p.waitForTimeout(500);
   ok(!(await p.locator('#lobbyNav').isVisible()),`${tag}: ${s} sem menu lateral`);
   const r=await p.locator('#backHome').boundingBox();
   ok(r&&r.x+r.width>vp.width-80&&r.y<30,`${tag}: ${s} com botão de voltar no canto superior direito`);
  }
  await p.evaluate(()=>showScreen('library'));await p.waitForTimeout(400);
  await p.click('[data-hero-open]');await p.waitForTimeout(500);
  await p.click('#backHome');await p.waitForTimeout(400);
  ok(await p.evaluate(()=>document.body.dataset.screen==='library'&&!document.body.classList.contains('hero-detail-open')),`${tag}: voltar no detalhe do campeão mostra a lista`);
  await p.click('#backHome');await p.waitForTimeout(500);
  ok(await p.evaluate(()=>document.body.dataset.screen==='home'),`${tag}: voltar na lista leva ao início`);
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${tag}: sem rolagem horizontal`);
  ok(errs.length===0,`${tag}: sem erros de JavaScript ${errs.join('|')}`);
  await p.close();
 }
 await b.close();
})();
