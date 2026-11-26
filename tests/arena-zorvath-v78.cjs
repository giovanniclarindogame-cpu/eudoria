// Arena do Zorvath (Salão do Trono Cristalino) na Caçada do Dia: só com a Caçada liberada, usa o piso e os 6 pilares de cristal, e volta ao pátio com ?zorarena=0.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const errs=[];
 for(const modo of ['tema','semtema','desligada']){
  const p=await (await b.newContext({viewport:{width:915,height:412}})).newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
  const q={tema:'&cacada=1&semsala=1',semtema:'&cacada=1&semsala=1&zorarena=0',desligada:'&cacada=0'}[modo];
  await p.goto('http://localhost:8000/index.html?allheroes=1&boss=zorvath&inicio=0'+q);await p.waitForTimeout(1200);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1500);
  if(modo==='desligada'){ok(await p.evaluate(()=>typeof ArenaZorvath==='undefined'&&typeof ZorvathArte==='undefined'),'Caçada desligada: nem a arena nem a arte do Zorvath carregam');await p.close();continue}
  if(modo==='semtema'){ok(await p.evaluate(()=>typeof ArenaZorvath==='undefined'),'?zorarena=0 volta ao pátio padrão');await p.close();continue}
  await p.click('[data-hunt-home]');await p.waitForTimeout(500);await p.click('[data-hunt-team=solo]');await p.click('[data-hunt-start]');
  await p.waitForFunction(()=>state==='fight'||state==='count',null,{timeout:20000});await p.waitForTimeout(3500);
  const r=await p.evaluate(async()=>{
   await new Promise(r=>{let t=0;const iv=setInterval(()=>{if(ArenaZorvath.pronto()||++t>80){clearInterval(iv);r()}},100)});await new Promise(r=>setTimeout(r,600));
   const g=groundCache,c=g.getContext('2d'),px=(x,y)=>[...c.getImageData(Math.round(x*W),Math.round(y*H),1,1).data];
   const centro=px(.5,.5),canto=px(.8,.7);
   return{ativo:ArenaZorvath.ativo(),pronto:ArenaZorvath.pronto(),W,H,gc:[g.width,g.height],pilares:pillars.length,centro,canto,erros:window.__errosLaco.n,
    nPil:integratedDepth().filter(e=>e.kind==='pillar').length}});
  ok(r.ativo&&r.pronto,'com ?cacada=1&semsala=1 a Caçada do Zorvath usa a arena temática');
  ok(r.gc[0]===r.W&&r.gc[1]===r.H,`o piso é do tamanho da arena (${r.gc})`);
  // o piso do salão é azul-índigo escuro (nada de rosa/magenta vivo, para os avisos do chefe aparecerem)
  const [rr,gg,bb]=r.canto;ok(bb>rr&&bb>gg&&rr<90&&gg<90&&bb<140,`piso azul-índigo escuro (RGB ${r.canto})`);
  ok(r.pilares===6&&r.nPil===6,`os ${r.pilares} pilares são desenhados (${r.nPil} entradas de pilar)`);
  ok(r.erros===0,`sem erros no laço do jogo (${r.erros})`);
  await p.close()}
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2).join('|'));await b.close()})();
