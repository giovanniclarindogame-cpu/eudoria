// O santuário da tela inicial mostra a ilustração grande do campeão (a mesma de Campeões/Dojo), não o
// corpo pixelado de combate, e a troca de campeão atualiza a arte.
// Requer Playwright e servidor local: python3 -m http.server 8000
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const b=await chromium.launch();
 for(const [w,h] of [[844,390],[1280,720],[667,375]]){
  const ctx=await b.newContext({viewport:{width:w,height:h}});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(1200);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
  const tag=`${w}x${h}`;
  const info=()=>p.evaluate(()=>{const i=document.querySelector('.royal-hero-art'),s=document.querySelector('.royal-sanctuary').getBoundingClientRect();if(!i)return null;const r=i.getBoundingClientRect();return{src:i.getAttribute('src'),nat:i.naturalWidth,hRatio:r.height/s.height,canvas:!!document.getElementById('lobbyHero'),name:currentChampion().name}});
  const a=await info();
  ok(a&&a.nat>0&&!a.canvas,`${tag}: santuário usa a ilustração (${a&&a.src}), sem o corpo pixelado`);
  ok(a.hRatio>=.6,`${tag}: ilustração ocupa ${(a.hRatio*100).toFixed(0)}% da altura do santuário`);
  await p.evaluate(()=>cycleLobbyBuild(1));await p.waitForTimeout(600);
  const c=await info();
  ok(c.src!==a.src&&c.nat>0,`${tag}: trocar de campeão troca a arte (${c.name})`);
  ok(errs.length===0,`${tag}: sem erros de JavaScript ${errs.join('|')}`);
  await ctx.close();
 }
 await b.close();
})();
