// IA difícil × IA antiga (mesmo herói dos dois lados, lados trocados) e IA difícil × IA difícil entre heróis.
// uso: node tests/simulacao-bot-dificil.cjs <herói> <partidas por lado> [oponente]
const {chromium}=require('playwright');
const H=+process.argv[2]||0,N=+process.argv[3]||6,O=process.argv[4]===undefined?H:+process.argv[4];
(async()=>{const br=await chromium.launch();const pg=await (await br.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1');await pg.waitForTimeout(800);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('input','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 const res=await pg.evaluate(async({H,O,N})=>{
  window.BOT_SIM_P=true;let seed=5;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  let hardWins=0,oldWins=0,draws=0,dur=0,n=0,ultH=0,dodgesH=0;
  for(let side=0;side<2;side++)for(let m=0;m<N;m++){
   matchMode='1v1';battleActivity='casual';start();window.requestAnimationFrame=()=>0;
   const hardIsP=side===0;
   p.skin=H;p.kit=[...CHAMPIONS[H].kit];b.skin=O;b.kit=[...CHAMPIONS[O].kit];p.hp=p.max=1000;b.hp=b.max=1000;p.cd=p.cd.map(()=>0);b.cd=b.cd.map(()=>0);
   (hardIsP?b:p).oldBot=true;(hardIsP?p:b).oldBot=false;
   state='fight';count=0;time=180;let steps=0;
   const hard=hardIsP?p:b;const oc=cast;let ult=0;cast=function(a,id,mn){const r=oc(a,id,mn);if(r&&a===hard&&skills[id]?.ultimate)ult++;return r};
   while(state==='fight'&&time>0&&p.hp>0&&b.hp>0&&steps<11000){ai(1/60,p);ai(1/60,b);step(1/60);steps++}
   cast=oc;
   const hp=hard.hp/hard.max,hq=(hardIsP?b:p);const ho=hq.hp/hq.max;
   n++;dur+=steps/60;ultH+=ult;
   if(Math.abs(hp-ho)<.0001)draws++;else if(hp>ho)hardWins++;else oldWins++;
  }
  return{hardWins,oldWins,draws,avgDur:Math.round(dur/n),ultPerFight:+(ultH/n).toFixed(2)}},{H,O,N});
 console.log(H,'vs',O,JSON.stringify(res),errs.slice(0,2));
 await br.close()})();
