// Equilíbrio dos itens: o mesmo conjunto de duelos (IA difícil dos dois lados) sem item e com CADA item no mesmo lado.
// Mede vitórias e a diferença de vida no fim. O lado com item é sempre o "b" (a IA de itens só controla quem não é o jogador).
// uso: node tests/simulacao-itens.cjs [pares por item, até 90] [ids separados por vírgula (opcional)] [sementes por par]
const {chromium}=require('playwright');
const NP=+process.argv[2]||30,SO=(process.argv[3]||'').split(',').filter(Boolean),NS=+process.argv[4]||1;
(async()=>{const br=await chromium.launch();const pg=await (await br.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1&semcarga=1');await pg.waitForTimeout(800);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('input','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 const t0=Date.now();
 const res=await pg.evaluate(async({NP,SO,NS})=>{
  window.BOT_SIM_P=true;
  const pares=[];for(let a=0;a<10;a++)for(let c=0;c<10;c++)if(a!==c)pares.push([a,c]);
  let s0=7;const emb=()=>{s0=(Math.imul(s0,1664525)+1013904223)>>>0;return s0/4294967296};
  for(let i=pares.length-1;i>0;i--){const j=Math.floor(emb()*(i+1));[pares[i],pares[j]]=[pares[j],pares[i]]}
  const usar=pares.slice(0,NP);
  const ids=[null,...(SO.length?SO:ItensV85.IDS)];
  const out={};
  for(const id of ids){
   let W=0,L=0,D=0,dif=0,usos=0,n=0;
   for(let k=0;k<usar.length*NS;k++){
    const [hb,hp]=usar[k%usar.length];
    let seed=1000+k*7919;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
    matchMode='1v1';battleActivity='casual';start();window.requestAnimationFrame=()=>0;
    V3Modes.swapHero(b,hb,1000);V3Modes.swapHero(p,hp,1000);b.skin=hb;p.skin=hp;
    ItensV85.equip(p,null);ItensV85.equip(b,id);
    state='fight';count=0;time=120;let steps=0;
    const ou=window.itemUse;let u=0;window.itemUse=function(a){const r=ou.apply(this,arguments);if(r&&a===b)u++;return r};
    while(state==='fight'&&time>0&&p.hp>0&&b.hp>0&&steps<7300){ai(1/60,p);ai(1/60,b);step(1/60);steps++}
    window.itemUse=ou;
    if(b.item&&b.item.def.tipo==='reativo'&&!b.item.armed)u=Math.max(u,1);
    const hb2=b.hp/b.max,hp2=p.hp/p.max;
    if(Math.abs(hb2-hp2)<1e-4)D++;else if(hb2>hp2)W++;else L++;
    dif+=hb2-hp2;usos+=u;n++;
   }
   out[id||'(sem item)']={W,L,D,taxa:Math.round(100*W/n),dif:+(100*dif/n).toFixed(1),usos:+(usos/n).toFixed(2),n};
  }
  return out},{NP,SO,NS});
 const base=res['(sem item)'];
 console.log('item'.padEnd(12),'vit  der emp  taxa   Δtaxa   vida(b-p)  Δvida   usos/luta');
 for(const [k,o] of Object.entries(res)){
  console.log(k.padEnd(12),String(o.W).padStart(3),String(o.L).padStart(4),String(o.D).padStart(3),String(o.taxa).padStart(5)+'%',(k==='(sem item)'?'':((o.taxa-base.taxa>=0?'+':'')+(o.taxa-base.taxa))).padStart(7),String(o.dif).padStart(10),(k==='(sem item)'?'':((o.dif-base.dif>=0?'+':'')+(o.dif-base.dif).toFixed(1))).padStart(7),String(o.usos).padStart(10));
 }
 console.log('tempo',Math.round((Date.now()-t0)/1000)+'s',errs.slice(0,2));await br.close()})();
