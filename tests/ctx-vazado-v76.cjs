// Uma peça que falha no meio do desenho (depois de save/translate/scale) não pode deixar o desenho da arena torto nos quadros seguintes
// (era o "retângulo da arena menor no meio da tela" que apareceu no começo de algumas partidas).
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:915,height:412},deviceScaleFactor:2})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await p.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent('ws://localhost:1'));await p.waitForTimeout(900);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
 await p.evaluate(()=>{matchMode='1v1';battleActivity='duel';account.activeChampion=2;selected=[...CHAMPIONS[2].kit];start()});
 await p.waitForFunction(()=>state==='count'||state==='fight',null,{timeout:25000});await p.evaluate(()=>{state='fight';count=0;document.querySelector('#intro73')?.remove()});await p.waitForTimeout(800);
 const r=await p.evaluate(async()=>{
  const base=canvas.width/cw,vistos=[];const orig=drawArenaScenery;
  drawArenaScenery=function(){const m=ctx.getTransform();vistos.push([+m.a.toFixed(3),+m.e.toFixed(1),+m.f.toFixed(1)]);return orig.apply(this,arguments)};
  const dep=integratedDepth;
  integratedDepth=function(){const l=dep();l.push({kind:'quebrada-teste',y:1e9,priority:0,paint(){ctx.save();ctx.translate(210,120);ctx.scale(.55,.55);ctx.beginPath();ctx.rect(0,0,50,50);ctx.clip();throw new Error('peça quebrada no meio do desenho')}});return l};
  await new Promise(r=>setTimeout(r,1500));
  integratedDepth=dep;await new Promise(r=>setTimeout(r,400));drawArenaScenery=orig;
  const ruins=vistos.filter(v=>Math.abs(v[0]-base)>.01||Math.abs(v[1])>.5||Math.abs(v[2])>.5).length;
  // depois do erro, a arena inteira continua sendo desenhada em tela cheia: amostra de cores nas 4 pontas do campo
  const g=canvas.getContext('2d'),cores=new Set();for(let y=Math.floor(canvas.height*.35);y<canvas.height*.9;y+=24)for(let x=0;x<canvas.width;x+=24){const d=g.getImageData(x,y,1,1).data;cores.add(d[0]>>4<<8|d[1]>>4<<4|d[2]>>4)}
  return{n:vistos.length,ruins,base,cores:cores.size,erros:window.__errosLaco.n}});
 ok(r.erros>0,`a peça quebrada foi registrada (${r.erros} erros)`);
 ok(r.ruins===0,`o desenho da arena começou torto em ${r.ruins} de ${r.n} quadros (esperado 0)`);
 ok(r.cores>25,`a arena continua desenhada em tela cheia (${r.cores} cores)`);
 ok(errs.length===0,'nenhum erro de JavaScript vazou '+errs.slice(0,2).join('|'));
 await b.close()})();
