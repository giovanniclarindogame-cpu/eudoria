// Viabilidade A: o jogo atual rodando sem desenhar (uma página por partida), N partidas ao mesmo tempo, 30 ticks/s.
const { chromium } = require('playwright');const { execSync } = require('child_process');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const N=+process.argv[2]||1,SECS=+process.argv[3]||20;
const rss=()=>+execSync("ps -eo rss,comm | grep -i chrom | awk '{s+=$1} END{print s+0}'").toString()/1024;
const cpu=()=>+execSync("ps -eo cputimes,comm | grep -i chrom | awk '{s+=$1} END{print s+0}'").toString();
(async()=>{
 const br=await chromium.launch();const base=rss();const pages=[];
 for(let i=0;i<N;i++){
  const ctx=await br.newContext({viewport:{width:400,height:240}});await ctx.addInitScript(()=>{window.__noraf=true;const r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>window.__noraf?0:r(cb)});
  const pg=await ctx.newPage();pg.on('pageerror',e=>{if(i===0)console.log('ERR',e.message.slice(0,100))});
  await pg.goto('http://localhost:8000/index.html?allheroes=1');await pg.waitForTimeout(500);
  await pg.evaluate(()=>{document.querySelector('#welcomeEnter')?.click()});await pg.waitForTimeout(300);
  await pg.evaluate(n=>{localStorage.clear()},0);
  pages.push(pg);
 }
 // cria perfil e começa a luta em cada página
 for(const pg of pages){
  await pg.reload();await pg.waitForTimeout(700);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Srv');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1200);
  await pg.evaluate(()=>{document.querySelector('#ljModal')?.remove();window.__noraf=true;draw=function(){};lobbyPrefs.mode='1v1';queueMatch('1v1');window.__t=0;window.__ticks=0;window.__ms=0;
   window.__tick=()=>{const t0=performance.now();ai(1/30,p);step(1/30);window.__ms+=performance.now()-t0;window.__ticks++;if(state==='end'||state==='select'){try{queueMatch('1v1')}catch{}}};
   window.__loop=setInterval(window.__tick,1000/30)});
 }
 await sleep(1500);
 const t0s=await Promise.all(pages.map(pg=>pg.evaluate(()=>__ticks)));const m0=rss(),c0=cpu();await sleep(SECS*1000);const m1=rss(),c1=cpu();
 const st=await Promise.all(pages.map(pg=>pg.evaluate(()=>({ticks:__ticks,msPerTick:__ms/__ticks,state,hp:[Math.round(p.hp),Math.round(b.hp)]}))));
 const tickRate=st.reduce((a,s,i)=>a+(s.ticks-t0s[i]),0)/N/SECS;
 console.log(JSON.stringify({partidas:N,memoria_base_MB:Math.round(base),memoria_total_MB:Math.round(m1),MB_por_partida:Math.round((m1-base)/N),cpu_nucleos_usados:((c1-c0)/SECS).toFixed(2),cpu_por_partida:(((c1-c0)/SECS)/N).toFixed(3),ms_por_tick:(st.reduce((a,s)=>a+s.msPerTick,0)/N).toFixed(3),ticks_por_s_real:tickRate.toFixed(1),amostra:st[0]}));
 await br.close();
})();
