// Equilíbrio de largada: ultimates sem recurso começam em recarga, heróis com recurso largam com um pouco dele; treino e arenas não mudam.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const errs=[];
 const pg=await (await br.newContext({viewport:{width:900,height:480}})).newPage();pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1&semcarga=1');await pg.waitForTimeout(900);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Equil');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2000);
 const r=await pg.evaluate(()=>{
  const o={};
  const ver=(h,act='casual')=>{matchMode='1v1';battleActivity=act;start();V3Modes.swapHero(p,h,1000);p.skin=h;state='fight';count=0;
   const ult=p.cd[p.kit[5]]||0,res=h===8||h===2||h===9?(reworkState(p).value||0):null;
   const livres=p.kit.filter((id,i)=>{try{return rwReady(p,id)&&!rwResourceReason(p,i)}catch{return false}}).length;
   return{ult,res,livres}};
  for(const h of [0,1,2,3,4,5,6,7,8,9])o[h]=ver(h);
  o.treino=ver(1,'training');o.rodada=(()=>{matchMode='1v1';battleActivity='casual';start();V3Modes.swapHero(p,5,1000);p.skin=5;p.cd=p.cd.map(()=>0);V3Modes.resetFighter(p,{keepHp:false});return p.cd[p.kit[5]]})();
  return o});
 for(const h of [1,4,5])ok(r[h].ult===15,`herói ${h}: a ultimate (sem recurso) começa em recarga de 15 s`);
 for(const h of [0,3,6,7])ok(r[h].ult===0,`herói ${h}: sem mudança na recarga da ultimate`);
 ok(r[8].res>=25&&r[2].res>=20&&r[9].res>=30,`Cavaleiro (${r[8].res}), Ronin (${r[2].res}) e Alquimista (${r[9].res}) largam com um pouco do recurso`);
 ok(r[8].livres>=4,`o Cavaleiro começa com ${r[8].livres} habilidades liberadas (antes: 2 de 6)`);
 ok(r.treino.ult===0,'no treino nada muda (a ultimate do Ninja começa liberada)');
 ok(r.rodada===15,'a cada rodada/reaparecimento a regra vale de novo (resetFighter)');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,3));
 await br.close();
})();
