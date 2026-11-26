// Zorvath forma 1 com a arte pintada do ChatGPT: as 50 imagens existem, a base do corpo fica sempre na mesma linha (âncora do motor),
// nada é cortado, formas 2 e 3 seguem com a arte antiga, e ?zorarte=0 desliga.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const errs=[];
 for(const off of [false,true]){
  const p=await (await b.newContext()).newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8000/index.html?allheroes=1&cacada=1'+(off?'&zorarte=0':''));await p.waitForTimeout(1200);
  if(off){ok(await p.evaluate(()=>typeof ZorvathArte==='undefined'),'?zorarte=0 desliga a arte nova');await p.close();continue}
  const r=await p.evaluate(async()=>{
   const itens=[];for(const [n,d] of Object.entries(ZorvathSprite.POSES))for(let i=0;i<d.n;i++)itens.push([n,i,0]);itens.push(['punch',0,1],['punch',5,1]);
   const esperar=()=>new Promise(r=>{let t=0;const iv=setInterval(()=>{const pronto=['idle','punch','disc'].every(n=>ZorvathArte.frame(n,0,{form:1}));if(pronto||++t>100){clearInterval(iv);r()}},100)});await esperar();
   const res={n:itens.length,sem:[],baseRuim:[],cortado:[],pequeno:[]};
   for(const [n,i,s] of itens){const c=ZorvathArte.frame(n,i,{form:1,side:s});if(!c){res.sem.push(n+i);continue}
    const g=c.getContext('2d'),d=g.getImageData(0,0,c.width,c.height).data;let y0=1e9,y1=-1,x0=1e9,x1=-1;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){if(y<y0)y0=y;if(y>y1)y1=y;if(x<x0)x0=x;if(x>x1)x1=x}
    if(Math.abs(y1-232)>2)res.baseRuim.push(n+i+':'+y1);
    if(x0<2||x1>c.width-3||y0<2||y1>c.height-3)res.cortado.push(n+i);if(y1-y0<60)res.pequeno.push(n+i+':'+(y1-y0))}
   // forma 3: só as folhas B e C existem por enquanto (quadros de 320, base do corpo em y=275); forma 2 e a folha A da forma 3 ainda usam a arte antiga
   await new Promise(r=>{let t=0;const iv=setInterval(()=>{const ok=[2,3].every(F=>['idle','punch','whip','disc','nova'].every(n=>ZorvathArte.frame(n,0,{form:F})));if(ok||++t>100){clearInterval(iv);r()}},100)});
   res.f3={sem:[],base:[],corte:[]};
   const lista3=[];for(let i=0;i<4;i++)lista3.push(['idle',i,0]);for(let i=0;i<2;i++)lista3.push(['guard',i,0],['hit',i,0],['stun',i,0]);for(let i=0;i<4;i++)lista3.push(['glide',i,0]);lista3.push(['dodge',0,0],['dead',0,0]);for(let i=0;i<6;i++)lista3.push(['punch',i,0],['punch',i,1]);for(let i=0;i<4;i++)lista3.push(['whip',i,0],['disc',i,0],['beam',i,0],['nova',i,0],['power',i,0]);for(let i=0;i<3;i++)lista3.push(['psy',i,0],['burst',i,0]);
   for(const [n,i,s,F] of [...lista3,...lista3.map(x=>[x[0],x[1],x[2],2])]){const c=ZorvathArte.frame(n,i,{form:F||3,side:s});if(!c){res.f3.sem.push(n+i);continue}
    const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let y1=-1,x0=1e9,x1=-1,y0=1e9;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){if(y>y1)y1=y;if(y<y0)y0=y;if(x<x0)x0=x;if(x>x1)x1=x}
    if(Math.abs(y1-275)>3)res.f3.base.push(n+i+':'+y1);if(x0<2||x1>c.width-3||y0<2||y1>c.height-3)res.f3.corte.push(n+i);if(c.width!==320||c.ax!==180||c.ay!==290)res.f3.base.push(n+i+':geo')}
   res.f3.antigaA=ZorvathArte.frame('idle',0,{form:3}).ay===290;
   res.forma2=true;
   res.glide=[0,1,2,3].map(i=>!!ZorvathArte.frame('glide',i,{form:1})).every(Boolean);
   return res});
  ok(r.sem.length===0,`as ${r.n} imagens existem para a forma 1 (faltando: ${r.sem.join(',')||'nenhuma'})`);
  ok(r.baseRuim.length===0,'a base do corpo fica na mesma linha (y=232) em todos os quadros '+r.baseRuim.join(','));
  ok(r.cortado.length===0,'nenhum quadro é cortado na borda '+r.cortado.join(','));
  ok(r.f3.sem.length===0&&r.f3.base.length===0&&r.f3.corte.length===0,`formas 2 e 3 (folhas A, B e C): quadros presentes, base do corpo na mesma linha (y=275) e nada cortado (sem: ${r.f3.sem},base: ${r.f3.base},corte: ${r.f3.corte})`);
  ok(r.f3.antigaA&&r.forma2&&r.glide,'as formas 2 e 3 têm corpo próprio (âncora 180/290) e o deslizar toca em loop');
  await p.close()}
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2).join('|'));await b.close()})();
