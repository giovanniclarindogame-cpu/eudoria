const { load, startDuel } = require('./carregador.cjs');
const N=+process.argv[2]||10,SECS=+process.argv[3]||15;
const mb=()=>Math.round(process.memoryUsage().rss/1048576);
(async()=>{
 const base=mb();const games=[];const t0=Date.now();
 for(let i=0;i<N;i++){
  const g=await load();await startDuel(g);
  g.ev(`for(const f of ['updateUI','announce','toast','hydrateSkillIcons','refreshModeKit','drawStrips']){try{window[f]=function(){}}catch{}}
   window.__ticks=0;window.__tick=function(){ai(1/30,p);step(1/30);window.__ticks++;if(state==='end'||state==='select'){queueMatch('1v1')}}`);
  games.push(g);
 }
 const loaded=mb();console.log(`carregou ${N} partidas em ${((Date.now()-t0)/1000).toFixed(1)} s | memória: base ${base} MB → ${loaded} MB = ${((loaded-base)/N).toFixed(0)} MB por partida`);
 // agenda 30 ticks/s para todas na mesma thread (um processo = um núcleo)
 let late=0,worst=0,ticks=0;const rounds=[];const t1=Date.now();
 await new Promise(done=>{
  let k=0;const tickMs=1000/30,start=Date.now();
  const loop=()=>{const now=Date.now(),due=Math.floor((now-start)/tickMs);
   while(k<due){const t=process.hrtime.bigint();for(const g of games)g.dom.window.__tick();const el=Number(process.hrtime.bigint()-t)/1e6;ticks++;rounds.push(el);worst=Math.max(worst,el);if(el>tickMs)late++;k++}
   if(now-start<SECS*1000)setTimeout(loop,2);else done()};loop()});
 const total=games.reduce((a,g)=>a+g.dom.window.__ticks,0);
 console.log(JSON.stringify({partidas:N,thread_unica:true,memoria_MB:mb(),MB_por_partida:Math.round((mb()-base)/N),ticks_da_rodada_atrasados:late+' de '+ticks,pior_rodada_ms:worst.toFixed(1),rodada_media_ms:(rounds.reduce((a,b)=>a+b,0)/rounds.length).toFixed(1),rodada_p95_ms:rounds.sort((a,b)=>a-b)[Math.floor(rounds.length*.95)].toFixed(1),erros:games.reduce((a,g)=>a+g.errs.length,0)}));
 process.exit(0)})();
