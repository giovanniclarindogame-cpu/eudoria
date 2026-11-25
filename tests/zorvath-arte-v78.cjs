// Zorvath forma 1 com a arte pintada do ChatGPT: as 50 imagens existem, a base do corpo fica sempre na mesma linha (âncora do motor),
// nada é cortado, formas 2 e 3 seguem com a arte antiga, e ?zorarte=0 desliga.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const errs=[];
 for(const off of [false,true]){
  const p=await (await b.newContext()).newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8000/index.html?allheroes=1'+(off?'&zorarte=0':''));await p.waitForTimeout(1200);
  if(off){ok(await p.evaluate(()=>typeof ZorvathArte==='undefined'),'?zorarte=0 desliga a arte nova');await p.close();continue}
  const r=await p.evaluate(async()=>{
   const itens=[];for(const [n,d] of Object.entries(ZorvathSprite.POSES))for(let i=0;i<d.n;i++)itens.push([n,i,0]);itens.push(['punch',0,1],['punch',5,1]);
   const esperar=()=>new Promise(r=>{let t=0;const iv=setInterval(()=>{const pronto=['idle','punch','disc'].every(n=>ZorvathArte.frame(n,0,{form:1}));if(pronto||++t>100){clearInterval(iv);r()}},100)});await esperar();
   const res={n:itens.length,sem:[],baseRuim:[],cortado:[],pequeno:[]};
   for(const [n,i,s] of itens){const c=ZorvathArte.frame(n,i,{form:1,side:s});if(!c){res.sem.push(n+i);continue}
    const g=c.getContext('2d'),d=g.getImageData(0,0,c.width,c.height).data;let y0=1e9,y1=-1,x0=1e9,x1=-1;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){if(y<y0)y0=y;if(y>y1)y1=y;if(x<x0)x0=x;if(x>x1)x1=x}
    if(n!=='dead'&&Math.abs(y1-232)>2)res.baseRuim.push(n+i+':'+y1);if(n==='dead'&&Math.abs(y1-232)>2)res.baseRuim.push(n+i+':'+y1);
    if(x0<2||x1>c.width-3||y0<2||y1>c.height-3)res.cortado.push(n+i);if(y1-y0<60)res.pequeno.push(n+i+':'+(y1-y0))}
   res.forma2=ZorvathArte.frame('idle',0,{form:2})===null&&ZorvathArte.frame('idle',0,{form:3})===null;
   res.glide=[0,1,2,3].map(i=>!!ZorvathArte.frame('glide',i,{form:1})).every(Boolean);
   return res});
  ok(r.sem.length===0,`as ${r.n} imagens existem para a forma 1 (faltando: ${r.sem.join(',')||'nenhuma'})`);
  ok(r.baseRuim.length===0,'a base do corpo fica na mesma linha (y=232) em todos os quadros '+r.baseRuim.join(','));
  ok(r.cortado.length===0,'nenhum quadro é cortado na borda '+r.cortado.join(','));
  ok(r.forma2&&r.glide,'formas 2 e 3 usam a arte antiga (sem imagem nova) e o deslizar toca em loop');
  await p.close()}
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2).join('|'));await b.close()})();
