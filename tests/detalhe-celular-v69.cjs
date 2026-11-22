// Celular deitado: na tela do campeão a descrição de CADA skill (dos 10 campeões) cabe na caixa, sem rolar.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();
 for(const [w,h] of [[915,412],[844,390],[740,360],[667,375]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(900);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
  await p.evaluate(()=>{const b=document.querySelector('[data-tut-go]');if(b){let e=b;while(e.parentElement&&getComputedStyle(e).position!=='fixed')e=e.parentElement;e.style.display='none'}});
  await p.evaluate(()=>showScreen('library'));await p.waitForTimeout(500);
  let ruins=[],total=0,minAlt=1e9;
  for(let id=0;id<10;id++){
   await p.evaluate(i=>openChampionDetails(i),id);await p.waitForTimeout(450);
   const n=await p.evaluate(()=>document.querySelectorAll('#heroDetail .hero-kit>button').length);
   for(let k=0;k<n;k++){
    await p.evaluate(k=>document.querySelectorAll('#heroDetail .hero-kit>button')[k].click(),k);await p.waitForTimeout(120);
    const r=await p.evaluate(()=>{const e=document.querySelector('#heroDetail .hero-skill-copy'),nv=document.querySelector('#heroDetail .nv-box'),r=e.getBoundingClientRect(),q=nv.getBoundingClientRect();return{sobra:e.scrollHeight-e.clientHeight,alt:Math.round(r.height),sobrepoe:r.bottom>q.top+1,fora:r.bottom>innerHeight||r.top<0}});
    total++;minAlt=Math.min(minAlt,r.alt);if(r.sobra>1||r.sobrepoe||r.fora)ruins.push(`herói ${id} skill ${k+1} (sobra ${r.sobra}px${r.sobrepoe?', sobrepõe o nível':''}${r.fora?', fora da tela':''})`);
   }
   await p.evaluate(()=>{document.querySelector('#heroDetail .hero-detail-head button,#heroDetail [data-hero-back]')?.click()});await p.waitForTimeout(100);
  }
  ok(ruins.length===0,`${w}x${h}: ${total} descrições (10 campeões) cabem sem rolar; caixa de ${minAlt}px no mínimo${ruins.length?' — problemas: '+ruins.slice(0,4).join(' | '):''}`);
  ok(errs.length===0,`${w}x${h}: sem erros de JavaScript ${errs.slice(0,2).join('|')}`);
  await ctx.close();
 }
 await b.close()})();
