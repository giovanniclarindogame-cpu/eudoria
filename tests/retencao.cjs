// Peças de retenção: presente diário com sequência, metas do dia com baú, tutorial e compartilhar.
// Requer Playwright e servidor local: python3 -m http.server 8000
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
async function boot(b,vp,qs=''){
 const ctx=await b.newContext({viewport:vp,permissions:['clipboard-read','clipboard-write']});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8000/index.html?boss=zorvath'+qs);await p.waitForTimeout(900);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1400);
 return{ctx,p,errs};
}
(async()=>{
 const b=await chromium.launch();
 for(const vp of [{width:844,height:390},{width:1280,height:720}]){
  const tag=`${vp.width}x${vp.height}`;
  /* ---------- presente diário ---------- */
  let {ctx,p,errs}=await boot(b,vp);
  ok(await p.locator('#openDaily .ret-dot').count()===1,`${tag}: botão de sequência com aviso quando há presente`);
  ok(await p.locator('#retDialog:visible').count()===0,`${tag}: janela não abre sozinha em navegador automatizado`);
  const c0=await p.evaluate(()=>account.coins);
  await p.click('#openDaily');await p.waitForTimeout(300);
  ok(await p.locator('.ret-day').count()===7&&await p.locator('.ret-day.now').count()===1,`${tag}: janela mostra 7 dias e o de hoje`);
  await p.click('[data-ret-claim-gift]');await p.waitForTimeout(300);
  ok(await p.evaluate(c0=>account.coins===c0+50&&RetQA.state.streak===1,c0),`${tag}: dia 1 dá 50 moedas e sequência 1`);
  ok(await p.locator('[data-ret-claim-gift]').count()===0,`${tag}: não dá para resgatar duas vezes no mesmo dia`);
  await p.click('[data-ret-close]');
  ok(await p.locator('#openDaily .ret-dot').count()===0,`${tag}: aviso some depois de resgatar`);
  await p.evaluate(()=>RetQA.set({last:RetQA.dayIdx()-1}));
  const c1=await p.evaluate(()=>account.coins);
  await p.evaluate(()=>RetQA.claimGift());
  ok(await p.evaluate(c1=>account.coins===c1+60&&RetQA.state.streak===2,c1),`${tag}: dia seguinte continua a sequência (dia 2 = 60 moedas)`);
  await p.evaluate(()=>RetQA.set({streak:6,last:RetQA.dayIdx()-1}));
  const g0=await p.evaluate(()=>[account.coins,account.crystals]);
  await p.evaluate(()=>RetQA.claimGift());
  ok(await p.evaluate(g0=>account.coins===g0[0]+150&&account.crystals===g0[1]+25,g0),`${tag}: dia 7 dá 150 moedas e 25 cristais`);
  await p.evaluate(()=>RetQA.set({streak:5,last:RetQA.dayIdx()-3}));
  await p.evaluate(()=>RetQA.claimGift());
  ok(await p.evaluate(()=>RetQA.state.streak===1),`${tag}: faltar um dia zera a sequência`);
  ok(errs.length===0,`${tag}: presente sem erros de JavaScript ${errs.join('|')}`);
  await ctx.close();

  /* ---------- metas do dia ---------- */
  ({ctx,p,errs}=await boot(b,vp));
  ok(await p.locator('#dailyGoals').count()===0,`${tag}: metas só aparecem depois dos primeiros passos`);
  await p.evaluate(()=>{account.journey.training=account.journey.duel=account.journey.build=account.journey.claimed=true;RetQA.refreshHome()});await p.waitForTimeout(400);
  ok(await p.locator('.ret-goal').count()===3,`${tag}: cartão mostra 3 metas`);
  const fits=await p.evaluate(()=>{const c=document.getElementById('dailyGoals');return c.scrollHeight<=c.clientHeight+2&&c.getBoundingClientRect().bottom<=innerHeight+4});
  ok(fits,`${tag}: conteúdo do cartão de metas cabe no cartão`);
  const m0=await p.evaluate(()=>account.coins);
  await p.evaluate(()=>{account.wins+=2;RetQA.refreshHome()});await p.waitForTimeout(300);
  ok(await p.locator('[data-ret-goal]').count()===1,`${tag}: meta concluída mostra o botão de resgate`);
  await p.click('[data-ret-goal]');await p.waitForTimeout(300);
  ok(await p.evaluate(m0=>account.coins===m0+50&&RetQA.goalRows()[0].claimed,m0),`${tag}: resgatar meta paga a recompensa uma vez`);
  ok(await p.locator('[data-ret-chest]').count()===0,`${tag}: baú continua fechado com metas pendentes`);
  await p.evaluate(()=>{const b=RetQA.state.goals.base;b.matches=-4;b.boss=-1;b.tries=-1;b.damage=-3000;RetQA.set({});RetQA.refreshHome()});await p.waitForTimeout(300);
  for(let i=0;i<2;i++){await p.click('[data-ret-goal]');await p.waitForTimeout(250)}
  ok(await p.locator('[data-ret-chest]').count()===1,`${tag}: baú abre quando as 3 metas foram resgatadas`);
  const cr=await p.evaluate(()=>account.crystals);
  await p.click('[data-ret-chest]');await p.waitForTimeout(250);
  ok(await p.evaluate(cr=>account.crystals===cr+20&&RetQA.state.goals.chest,cr),`${tag}: baú dá 20 cristais`);
  await p.reload();await p.waitForTimeout(1500);
  ok(await p.evaluate(()=>RetQA.state.goals.chest===true&&RetQA.state.streak>=0),`${tag}: progresso das metas é lembrado depois de recarregar`);
  ok(errs.length===0,`${tag}: metas sem erros de JavaScript ${errs.join('|')}`);
  await ctx.close();

  /* ---------- tutorial ---------- */
  ({ctx,p,errs}=await boot(b,vp,'&tutorial=1'));
  await p.evaluate(()=>{beginArenaMode('guardian')});await p.waitForTimeout(500);await p.evaluate(()=>document.querySelector('[data-hunt-start]').click());await p.waitForTimeout(900);
  ok(await p.evaluate(()=>RetQA.tutorialActive&&state==='paused'),`${tag}: tutorial abre na luta e pausa o jogo`);
  const spot=await p.evaluate(()=>{const s=document.querySelector('.tut-spot').getBoundingClientRect(),t=document.querySelector('#stick').getBoundingClientRect();return Math.abs(s.left+s.width/2-(t.left+t.width/2))<4});
  ok(spot,`${tag}: passo 1 destaca o analógico`);
  for(let i=0;i<3;i++){await p.click('[data-tut-next]');await p.waitForTimeout(200)}
  ok(await p.evaluate(()=>RetQA.tutorialActive)&&(await p.textContent('[data-tut-next]')).includes('vamos lutar'),`${tag}: 4º passo tem o botão final`);
  await p.click('[data-tut-next]');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>!RetQA.tutorialActive&&(state==='count'||state==='fight')&&RetQA.state.tutorial),`${tag}: terminar o tutorial libera a contagem e é lembrado`);
  await p.waitForTimeout(4200);
  ok(await p.evaluate(()=>state==='fight'),`${tag}: depois do tutorial a luta começa normalmente`);
  await p.evaluate(()=>document.getElementById('pauseBtn').click());await p.waitForTimeout(300);
  await p.click('#howTo');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>RetQA.tutorialActive),`${tag}: "Como jogar" no menu de pausa reabre o tutorial`);
  await p.click('[data-tut-skip]');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>!RetQA.tutorialActive&&document.getElementById('pause').style.display==='flex'),`${tag}: pular volta ao menu de pausa`);
  /* ---------- compartilhar ---------- */
  await p.evaluate(()=>{document.getElementById('pause').style.display='none';state='fight';const R=huntQA.state;p.hp=1000;b.hp=5;b.inv=0;b.guard=false;if(R.shield)R.shield=0;hit(b,60,p,0,0)});await p.waitForTimeout(3600);
  ok(await p.locator('#shareResult:visible').count()===1,`${tag}: botão Compartilhar aparece no resultado`);
  await p.evaluate(()=>{window.__shared=null;navigator.share=async d=>{window.__shared=d}});
  await p.click('#shareResult');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>window.__shared&&/derrotado/.test(window.__shared.text)&&/Eldoria/.test(window.__shared.text)),`${tag}: compartilhar envia o título do resultado e o nome do jogo`);
  await p.evaluate(()=>{navigator.share=undefined;Object.defineProperty(navigator,'share',{value:undefined,configurable:true})});
  await p.click('#shareResult');await p.waitForTimeout(400);
  ok(await p.evaluate(async()=>/Eldoria/.test(await navigator.clipboard.readText())),`${tag}: sem Web Share o texto é copiado para a área de transferência`);
  ok(errs.length===0,`${tag}: tutorial e compartilhar sem erros de JavaScript ${errs.join('|')}`);
  await ctx.close();
 }
 await b.close();
})();
