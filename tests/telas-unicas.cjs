// Telas numa visão só: nenhuma delas precisa de rolagem nos tamanhos de celular/PC mais comuns.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const SIZES=[[844,390],[667,375],[740,360],[932,430],[1000,450],[1280,720]];
(async()=>{
 const b=await chromium.launch();
 for(const [w,h] of SIZES){
  const ctx=await b.newContext({viewport:{width:w,height:h},reducedMotion:'reduce'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(700);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Giovanni');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1500);
  const screens=[
   ['início',()=>showScreen('home')],
   ['início com metas',()=>{account.journey.training=account.journey.duel=account.journey.build=account.journey.claimed=true;RetQA.refreshHome();showScreen('home')}],
   ['campeões',()=>showScreen('library')],
   ['detalhe do campeão',()=>{showScreen('library');document.querySelector('[data-hero-open]').click()}],
   ['dojo',()=>showScreen('training')],
   ['liga',()=>showScreen('league')],
   ['arenas',()=>showArenaModes()],
   ['caçada: chefe',()=>beginArenaMode('guardian')],
   ['caçada: habilidades',()=>{beginArenaMode('guardian');document.querySelector('[data-hunt-tab=s]').click()}],
   ['caçada: dicas e semana',()=>{beginArenaMode('guardian');document.querySelector('[data-hunt-tab=b]').click()}],
   ['configurações',()=>{showScreen('home');openLobbySettings()}],
   ['editar perfil',()=>{showScreen('home');document.querySelector('[data-nav="profile"]').click()}],
  ];
  for(const [name,fn] of screens){
   await p.evaluate(()=>{try{closeHeroDetail()}catch{};try{closeLobbySettings()}catch{};showScreen('home')});await p.waitForTimeout(200);
   await p.evaluate(fn);await p.waitForTimeout(700);
   const over=await p.evaluate(()=>{
    const out=[],d=document.scrollingElement;
    if(d.scrollHeight>innerHeight+2)out.push('página +'+(d.scrollHeight-innerHeight));
    for(const e of document.querySelectorAll('body *')){
     const cs=getComputedStyle(e);if(!/(auto|scroll)/.test(cs.overflowY))continue;
     const r=e.getBoundingClientRect();if(!r.width||!r.height||cs.display==='none'||cs.visibility==='hidden')continue;
     if(e.scrollHeight>e.clientHeight+3)out.push((e.id||e.className.toString().split(' ')[0])+' +'+(e.scrollHeight-e.clientHeight));
    }
    return out});
   ok(over.length===0,`${w}x${h} ${name}: tudo numa visão só ${over.join(', ')}`);
  }
  await p.evaluate(()=>{account.journey.training=account.journey.duel=account.journey.build=account.journey.claimed=true;showScreen('home')});await p.waitForTimeout(500);
  await p.evaluate(()=>{const h=document.querySelector('.hunt-home');h.outerHTML='<section class="royal-explore royal-panel">x</section>'});await p.waitForTimeout(500);
  ok(await p.evaluate(()=>!!document.querySelector('.hunt-home')&&!document.querySelector('.royal-explore')),`${w}x${h}: cartão da Caçada volta sozinho se a tela inicial for remontada sem ele`);
  ok(await p.evaluate(()=>{const g=document.querySelector('#dailyGoals');if(!g)return true;return [...g.querySelectorAll('.ret-goal')].every((e,i,a)=>i===0||e.getBoundingClientRect().top>=a[i-1].getBoundingClientRect().bottom-1)}),`${w}x${h}: linhas das metas não se sobrepõem`);
  ok(errs.length===0,`${w}x${h}: sem erros de JavaScript ${errs.join('|')}`);
  await ctx.close();
 }
 await b.close();
})();
