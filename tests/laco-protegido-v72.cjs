// O laço do jogo nunca morre: uma exceção na simulação, no desenho ou numa peça desenhada é registrada e o jogo continua (cronômetro anda, arena desenha).
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:900,height:420}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'));window.__rel=[]});
 await p.route(/feedback\/enviar/,r=>{try{window.__x=1}catch{};r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'})});
 await p.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent('ws://localhost:1'));await p.waitForTimeout(900);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
 await p.evaluate(()=>{matchMode='1v1';battleActivity='training';account.activeChampion=2;selected=[...CHAMPIONS[2].kit];start();state='fight';count=0});
 await p.waitForTimeout(1200);
 const t0=await p.evaluate(()=>({tempo:time,ok:true}));
 // 1) exceção na simulação (step) em todos os quadros
 const r1=await p.evaluate(async()=>{const orig=window.__stepOrig=step;let n=0;step=function(dt){n++;if(n%2===0)throw new Error('falha de teste na simulação');return orig.apply(this,arguments)};
  const e0=window.__errosLaco.n,t0=clock;await new Promise(r=>setTimeout(r,1500));step=orig;return{erros:window.__errosLaco.n-e0,andou:clock-t0}});
 ok(r1.erros>0&&r1.andou>.3,`exceção na simulação não mata o laço: ${r1.erros} erros registrados e a luta continuou andando (${r1.andou.toFixed(1)} s)`);
 // 2) exceção numa peça desenhada: o resto da arena continua sendo desenhado
 const r2=await p.evaluate(async()=>{const prev=integratedDepth;integratedDepth=function(){const l=prev();l.push({kind:'teste-quebrado',y:1e9,priority:0,paint(){throw new Error('peça quebrada de teste')}});return l};
  const e0=window.__errosLaco.n;await new Promise(r=>setTimeout(r,800));integratedDepth=prev;
  const c=document.getElementById('arena'),g=c.getContext('2d');const cores=new Set();for(let y=Math.floor(c.height*.3);y<c.height*.9;y+=14)for(let x=0;x<c.width;x+=14){const d=g.getImageData(x,y,1,1).data;cores.add(d[0]>>4<<8|d[1]>>4<<4|d[2]>>4)}
  return{erros:window.__errosLaco.n-e0,cores:cores.size,vistos:window.__errosLaco.lista.map(x=>x.msg).join('|')}});
 ok(r2.erros>0&&r2.cores>25,`peça quebrada não apaga a arena: o resto continua desenhado (${r2.cores} cores) e o erro foi registrado (${r2.vistos.slice(0,60)})`);
 // 3) exceção no desenho inteiro: o jogo continua e volta ao normal quando o erro passa
 const r3=await p.evaluate(async()=>{const orig=draw;draw=function(){throw new Error('desenho quebrado de teste')};const e0=window.__errosLaco.n;await new Promise(r=>setTimeout(r,600));draw=orig;const t1=clock;await new Promise(r=>setTimeout(r,900));
  const c=document.getElementById('arena'),g=c.getContext('2d');const cores=new Set();for(let y=Math.floor(c.height*.3);y<c.height*.9;y+=14)for(let x=0;x<c.width;x+=14){const d=g.getImageData(x,y,1,1).data;cores.add(d[0]>>4<<8|d[1]>>4<<4|d[2]>>4)}
  return{erros:window.__errosLaco.n-e0,voltou:cores.size>25,andou:clock-t1}});
 ok(r3.erros>0&&r3.voltou&&r3.andou>.3,`desenho quebrado por um instante: o jogo não congela e a arena volta sozinha (${r3.erros} erros)`);
 // 4) o erro novo é relatado automaticamente (no máximo 4 por sessão)
 const rel=await p.evaluate(()=>({relatos:window.__errosLaco.relatos}));
 ok(rel.relatos>=1&&rel.relatos<=4,`o erro é relatado automaticamente para eu ver a causa (${rel.relatos} relato(s), máximo 4)`);
 // 5) Ronin com passo inválido (NaN) não lança exceção
 const r5=await p.evaluate(()=>{p.skin=2;p.moving=true;p.rwStride=NaN;p.gait=NaN;let erro=null;try{const c=document.createElement('canvas').getContext('2d');drawAnimatedFighter(c,p,72,1)}catch(e){erro=e.message}return{erro}});
 ok(r5.erro===null,'Ronin com passo de andar inválido (NaN) não gera exceção'+(r5.erro?' — '+r5.erro:''));
 ok(errs.length===0,'nenhum erro vazou para a página '+errs.slice(0,2).join('|'));
 await b.close()})();
