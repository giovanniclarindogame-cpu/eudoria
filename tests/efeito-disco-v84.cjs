// Disco Cortante com arte pintada: disco com rastro (linha 1) e impacto no corte (linha 2).
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
 ok(await p.evaluate(()=>ZorEfx.pronto('disco')),'a folha do disco carregou');
 const r=await p.evaluate(async()=>{
  const R=modeRun.hunt,rows=new Set(),od=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(img,sx,sy){if(img&&img.src&&img.src.includes('disco'))rows.add(Math.round(sy/320));return od.apply(this,arguments)};
  R.form=2;R.shown=2;p.hp=p.max=3000;b.x=p.x+260;b.y=p.y;R.next='s1';R.act=null;R.cd=0;
  const t0=performance.now();while(performance.now()-t0<3500)await new Promise(r=>setTimeout(r,40));
  CanvasRenderingContext2D.prototype.drawImage=od;return{rows:[...rows].sort(),hp:p.hp}});
 console.log('DISCO',JSON.stringify(r));
 ok(r.rows.includes(1)&&r.rows.includes(2),'disco com rastro (linha 1) e impacto (linha 2) com a arte pintada');
 ok(r.hp<3000,'o disco acertou o jogador');
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2));
 await p.evaluate(()=>{const R=modeRun.hunt;p.hp=p.max;p.x=b.x-260;R.next='s1';R.act=null;R.cd=0});
 await p.waitForFunction(()=>modeRun.hunt.discs.length>0,null,{timeout:8000});await p.waitForTimeout(220);await p.screenshot({path:'/tmp/claude-0/disco_0.png'});
 await b.close()})();
