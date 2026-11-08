// Teste da Caçada do Dia (Kaelthar). Requer Playwright e servidor local: python3 -m http.server 8000
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const b=await chromium.launch();
 for(const vp of [{width:1280,height:720},{width:844,height:390}]){
  const p=await b.newPage({viewport:vp});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8000/index.html?boss=zorvath');await p.waitForTimeout(1200);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1200);
  ok(await p.locator('.hunt-home').count()===1,`${vp.width}x${vp.height}: cartão da Caçada aparece na tela inicial`);
  await p.click('[data-hunt-home]');await p.waitForTimeout(500);
  ok(await p.locator('.hunt-page').count()===1,`${vp.width}x${vp.height}: lobby da caçada abre`);
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'sem rolagem horizontal');
  ok(await p.locator('.hunt-skill').count()===9,'6 habilidades + golpe, defesa e esquiva listados');
  await p.click('[data-hunt-team=solo]');ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('eldoria.cacada.v1')).team==='solo'),'escolha Solo é salva');
  await p.click('[data-hunt-team=duo]');
  await p.click('[data-hunt-start]');await p.waitForTimeout(3800);
  const s=await p.evaluate(()=>({st:state,boss:b.hp,max:b.max,n:actors.length,pil:pillars.length}));
  ok(s.st==='fight'&&s.max===4600&&s.n===3&&s.pil===6,'luta em dupla inicia (3 lutadores, 6 pilares, vida 4600)');
  for(const id of ['s0','s1','s2','s3','s4','s5']){
   await p.evaluate(id=>{p.hp=1000;p.inv=3;huntQA.force(id)},id);await p.waitForTimeout(id==='s5'?2600:id==='s3'?2200:1500);
   ok(await p.evaluate(()=>!huntQA.state.act||huntQA.state.act.t>0),`habilidade ${id} avança sem travar`);
  }
  await p.evaluate(()=>{b.hp=b.max*.6});await p.waitForTimeout(2200);
  ok(await p.evaluate(()=>huntQA.state.form===2),'forma 2 ao cair para 70% de vida');
  await p.evaluate(()=>{b.hp=b.max*.3});await p.waitForTimeout(2200);
  ok(await p.evaluate(()=>huntQA.state.form===3),'forma 3 ao cair para 35% de vida');
  await p.waitForFunction(()=>b.inv<=0&&huntQA.state.act?.id!=='xform',null,{timeout:8000});
  await p.evaluate(()=>{p.hp=1000;p.inv=0;b.hp=5;b.inv=0;b.guard=false;hit(b,50,p,0,0)});await p.waitForTimeout(3600);
  ok((await p.textContent('#resultTitle')).includes('Zorvath foi derrotado'),'vitória mostra a tela de resultado');
  ok(await p.evaluate(()=>!!JSON.parse(localStorage.getItem('eldoria.cacada.v1')).best.zorvath),'recorde de tempo salvo');
  ok(errs.length===0,'sem erros de JavaScript '+errs.join(' | '));
  await p.close();
 }
 await b.close();
})();
