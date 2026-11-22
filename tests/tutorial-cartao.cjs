// O cartão do "Como jogar" tem que ficar INTEIRO dentro da tela, em celular, notebook e PC grande.
// Requer Playwright e servidor local: python3 -m http.server 8000
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const b=await chromium.launch();
 for(const vp of [{width:844,height:390},{width:1280,height:720},{width:1920,height:1080},{width:2560,height:1440}]){
  const tag=`${vp.width}x${vp.height}`;
  const ctx=await b.newContext({viewport:vp});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8000/index.html?allheroes=1&boss=zorvath&tutorial=1');await p.waitForTimeout(900);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1400);
  await p.evaluate(()=>{beginArenaMode('guardian')});await p.waitForTimeout(500);await p.evaluate(()=>document.querySelector('[data-hunt-start]').click());await p.waitForTimeout(900);
  for(let i=0;i<4;i++){
   const r=await p.evaluate(()=>{const r=document.querySelector('.tut-card').getBoundingClientRect();return{l:r.left,t:r.top,r:r.right,b:r.bottom,w:innerWidth,h:innerHeight}});
   ok(r.l>=0&&r.t>=0&&r.r<=r.w+1&&r.b<=r.h+1,`${tag}: passo ${i+1} dentro da tela (${Math.round(r.l)},${Math.round(r.t)} → ${Math.round(r.r)},${Math.round(r.b)} de ${r.w}x${r.h})`);
   if(i<3){await p.click('[data-tut-next]');await p.waitForTimeout(200)}
  }
  ok(errs.length===0,`${tag}: sem erros de JavaScript ${errs.join('|')}`);
  await ctx.close();
 }
 await b.close();
})();
