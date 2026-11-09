// Simulação da Sobrevivência: 8 bots idênticos em tempo acelerado. uso: node tests/simulacao-sobrevivencia.cjs <partidas>
const {chromium}=require('playwright');const N=+process.argv[2]||6,PORT=process.argv[3]||'8000';
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:844,height:390}});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(`http://localhost:${PORT}/index.html`);await pg.waitForTimeout(800);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('input','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 const res=await pg.evaluate(async N=>{
  let seed=33;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const out=[];
  for(let n=0;n<N;n++){
   beginArenaMode('survival');window.requestAnimationFrame=()=>0;state='fight';count=0;
   RoyaleAPI.noEnd=true;const R=RoyaleAPI.R;p.roy.bot=true;let steps=0;
   while(state==='fight'&&steps<60*700){ai(1/60,p);step(1/60);steps++}
   const pl=RoyaleAPI.players();
   const kills=pl.reduce((s,a)=>s+a.roy.kills,0);
   out.push({t:Math.round(steps/60),kills,deaths:pl.filter(a=>a.roy.dead).length,lv:pl.map(a=>a.roy.lv),skills:pl.map(a=>a.roy.unlocked.size),end:state});
   RoyaleAPI.noEnd=false;try{leave()}catch{}
  }
  return out},N);
 const n=res.length,all=a=>a.reduce((x,y)=>x+y,0);
 console.log(JSON.stringify({partidas:n,duracaoMedia:Math.round(all(res.map(r=>r.t))/n),abatesPorPartida:(all(res.map(r=>r.kills))/n).toFixed(1),mortesPorPartida:(all(res.map(r=>r.deaths))/n).toFixed(1),nivelMedio:(all(res.flatMap(r=>r.lv))/(8*n)).toFixed(1),semHabilidade:Math.round(100*res.flatMap(r=>r.skills).filter(x=>x===0).length/(8*n))+'%',travadas:res.filter(r=>r.end==='fight').length,errs:errs.slice(0,2)}));
 await br.close()})();
