// Simulação da Sobrevivência (8 lutadores com IA, tempo acelerado). uso: node tests/simulacao-sobrevivencia.cjs <partidas>
const {chromium}=require('playwright');const N=+process.argv[2]||4;
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:844,height:390}});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('c:'+m.text().slice(0,200))});
 await pg.goto('http://localhost:8000/index.html');await pg.waitForTimeout(800);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('input','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 const res=await pg.evaluate(async N=>{
  let seed=21;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const out=[];
  for(let n=0;n<N;n++){
   beginArenaMode('survival');window.requestAnimationFrame=()=>0;state='fight';count=0;
   const R=RoyaleAPI.R;p.roy.bot=true;let steps=0,maxLv=0,lvAt={};
   const t0=performance.now();
   while(state==='fight'&&steps<60*620){ai(1/60,p);step(1/60);steps++;for(const a of RoyaleAPI.players())if(a.hp>0)maxLv=Math.max(maxLv,a.roy.lv)}
   const pl=RoyaleAPI.players();
   out.push({t:Math.round(steps/60),place:R.placement,win:modeRun.settled&&R.placement===1,end:state,kills:R.kills,lv:p.roy.lv,unl:p.roy.unlocked.size,maxLv,alive:RoyaleAPI.alive().length,mobs:R.mobs.length,ms:Math.round(performance.now()-t0),bots:pl.filter(a=>a!==p).map(a=>a.roy.lv+'/'+a.roy.kills+'/'+a.roy.unlocked.size+'/'+a.roy.place).join(' ')});
   try{leave()}catch{}
  }
  return out},N);
 for(const r of res)console.log(JSON.stringify(r));console.log('errs',errs.slice(0,4));await br.close()})();
