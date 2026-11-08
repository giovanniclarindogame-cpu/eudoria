// Sem animação, o campeão do santuário precisa ser redesenhado sozinho: se a primeira pintura usou o sprite de
// reserva (menor) porque a arte final ainda carregava, ele era mantido para sempre até trocar de campeão.
// Requer Playwright e servidor local: python3 -m http.server 8000
const { chromium } = require('playwright');
const height=()=>{const c=document.getElementById('lobbyHero');if(!c)return 0;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let top=c.height,bot=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>170){top=Math.min(top,y);bot=Math.max(bot,y)}return bot>=top?bot-top:0};
(async()=>{
 const b=await chromium.launch();let bad=0;
 for(const reduced of [false,true]){
  const ctx=await b.newContext({viewport:{width:1000,height:450},reducedMotion:reduced?'reduce':'no-preference'});
  const p=await ctx.newPage();await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(1200);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();
  await p.waitForTimeout(1500);
  const before=await p.evaluate(height);
  await p.evaluate(()=>{const c=document.getElementById('lobbyHero');c.getContext('2d').clearRect(0,0,c.width,c.height)});
  const cleared=await p.evaluate(height);
  await p.waitForTimeout(1000);
  const after=await p.evaluate(height);
  const good=before>=170&&cleared===0&&after>=170;if(!good)bad++;
  console.log(good?'ok  -':'FALHOU:',`${reduced?'sem animação':'com animação'}: pintado ${before}, apagado ${cleared}, redesenhado ${after}`);
  await ctx.close();
 }
 await b.close();process.exitCode=bad?1:0;
})();
