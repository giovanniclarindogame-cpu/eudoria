// Supernova com arte pintada: carga, esfera em voo e explosão usam a folha; sem erros.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const errs=[];
 const p=await (await b.newContext({viewport:{width:915,height:412},deviceScaleFactor:1})).newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await p.goto('http://localhost:8000/index.html?allheroes=1&inicio=0&semsala=1');await p.waitForTimeout(1200);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1600);
 await p.click('[data-hunt-home]');await p.waitForTimeout(1500);
 await p.click('[data-hunt-team=solo]');await p.click('[data-hunt-start]');await p.waitForTimeout(900);
 await p.waitForFunction(()=>state==='fight',null,{timeout:25000});await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>ZorEfx.pronto('supernova')),'a folha da supernova carregou');
 const r=await p.evaluate(async()=>{
  const R=modeRun.hunt,rows=new Set(),od=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(img,sx,sy){if(img&&img.src&&img.src.includes('supernova'))rows.add(Math.round(sy/320));return od.apply(this,arguments)};
  R.form=3;R.shown=3;p.hp=p.max=3000;R.next='s5';R.act=null;R.cd=0;
  const t0=performance.now();let shots=[];
  while(performance.now()-t0<7000){await new Promise(r=>setTimeout(r,50));if(R.nova&&R.nova.fall>0&&!window.__f){window.__f=1}}
  CanvasRenderingContext2D.prototype.drawImage=od;
  return{rows:[...rows].sort(),nova:!!R.nova,boom:!!R.boom,hp:p.hp}});
 console.log('NOVA',JSON.stringify(r));
 ok(r.rows.join()==='0,1,2','carga (linha 0), voo (1) e explosão (2) foram desenhadas com a arte pintada');
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2));
 // capturas: carga, voo, explosão
 await p.evaluate(()=>{const R=modeRun.hunt;p.hp=p.max;R.next='s5';R.act=null;R.cd=0});
 await p.waitForFunction(()=>modeRun.hunt.nova,null,{timeout:8000});await p.waitForTimeout(1900);await p.screenshot({path:'/tmp/claude-0/nova_0.png'});
 await p.waitForFunction(()=>modeRun.hunt.nova&&modeRun.hunt.nova.fall>.4,null,{timeout:8000});await p.screenshot({path:'/tmp/claude-0/nova_1.png'});
 await p.waitForFunction(()=>modeRun.hunt.boom,null,{timeout:8000});await p.waitForTimeout(150);await p.screenshot({path:'/tmp/claude-0/nova_2.png'});
 await b.close()})();
