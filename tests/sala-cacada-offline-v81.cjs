// Solo e Dupla com bot: a mesma sala da Caçada antes da luta (campeões animados, escolha, PRONTO) e a luta começa com o escolhido e o aliado mostrado.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const errs=[];
 for(const team of ['solo','duo']){
  const p=await (await b.newContext({viewport:{width:915,height:412},deviceScaleFactor:2})).newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
  await p.goto('http://localhost:8000/index.html?allheroes=1&inicio=0');await p.waitForTimeout(1200);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1600);
  await p.click('[data-hunt-home]');await p.waitForTimeout(1500);await p.click('[data-hunt-team='+team+']');await p.click('[data-hunt-start]');await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>{const e=document.querySelector('#caca81off');if(!e)return null;const a=e.getBoundingClientRect(),sl=[...e.querySelectorAll('.c81-slot')];
   return{cheia:a.width>=innerWidth-1&&a.height>=innerHeight-1,slots:sl.length,sprites:e.querySelectorAll('canvas.v46-sprite').length,boss:!!e.querySelector('canvas.c81-cv'),tiles:e.querySelectorAll('.v46-tile').length,tag:e.querySelector('.v45-tag').textContent,fora:sl.some(s=>{const r=s.getBoundingClientRect();return r.bottom>innerHeight||r.right>innerWidth})}});
  ok(r&&r.cheia&&r.boss&&r.tiles===10,`${team}: a sala abre em tela cheia com o chefe e os 10 campeões`);
  ok(r.slots===(team==='solo'?1:2)&&r.sprites===r.slots&&!r.fora,`${team}: ${r.slots} campeão(ões) animado(s), dentro da tela`);
  await p.waitForTimeout(1500);
  const pix=await p.evaluate(()=>{const c=document.querySelector('#caca81off canvas.v46-sprite'),d=c.getContext('2d').getImageData(0,0,200,200).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>40)n++;return n});
  ok(pix>1500,`${team}: o boneco está desenhado (${pix} px)`);
  if(team==='solo')await p.screenshot({path:'/tmp/claude-0/off_solo.png'});else await p.screenshot({path:'/tmp/claude-0/off_duo.png'});
  // troca de campeão: o boneco muda
  const antes=await p.evaluate(()=>document.querySelector('#caca81off canvas.v46-sprite').dataset.skin);
  await p.click('#caca81off [data-c81-hero="4"]');await p.waitForTimeout(300);
  ok(await p.evaluate(a=>document.querySelector('#caca81off canvas.v46-sprite').dataset.skin==='4'&&a!=='4',antes),`${team}: tocar em outro campeão troca o boneco`);
  const aliado=await p.evaluate(()=>window.__huntAllyHero);
  const mate=team==='duo'?await p.evaluate(()=>document.querySelectorAll('#caca81off canvas.v46-sprite')[1].dataset.skin):null;
  await p.click('#caca81off [data-c81=go]');
  await p.waitForFunction(()=>state==='fight'||state==='count',null,{timeout:25000});await p.waitForTimeout(2500);
  const s=await p.evaluate(()=>({sala:!!document.querySelector('#caca81off'),eu:p.skin,n:actors.length,ally:actors[2]?actors[2].skin:null,boss:b.max}));
  ok(!s.sala&&s.eu===4&&s.n===(team==='solo'?2:3),`${team}: PRONTO fecha a sala e a luta começa com o campeão escolhido (${s.eu})`);
  if(team==='duo')ok(String(s.ally)===mate,`duo: o aliado bot é o campeão que a sala mostrou (${s.ally} = ${mate})`);
  await p.close()}
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2).join('|'));await b.close()})();
