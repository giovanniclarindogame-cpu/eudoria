// Cena de transformação do chefe: congela a luta (offline), treme, barras de cinema, título, aproxima a câmera, clarão na troca do corpo e desfaz.
// O lobby e a sala só mostram a forma 1.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const errs=[];
 const p=await (await b.newContext({viewport:{width:915,height:412},deviceScaleFactor:2})).newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await p.goto('http://localhost:8000/index.html?allheroes=1&inicio=0&semsala=1');await p.waitForTimeout(1200);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1600);
 await p.click('[data-hunt-home]');await p.waitForTimeout(1500);
 // lobby: só a forma 1
 const lob=await p.evaluate(async()=>{const forms=new Set();const o=ZorvathSprite.paint;ZorvathSprite.paint=function(g,n,i,op){forms.add(op&&op.form);return o.apply(this,arguments)};await new Promise(r=>setTimeout(r,5000));ZorvathSprite.paint=o;return[...forms]});
 ok(lob.length===1&&lob[0]===1,'o lobby mostra só a forma 1 do chefe durante um ciclo inteiro (formas vistas: '+lob+')');
 await p.click('[data-hunt-team=solo]');await p.click('[data-hunt-start]');await p.waitForTimeout(900);
 await p.waitForFunction(()=>state==='fight',null,{timeout:25000});await p.waitForTimeout(2500);
 // dispara a transformação
 const r=await p.evaluate(async()=>{
  const out={},c0=clock,z0=scale;const R=modeRun.hunt;b.hp=b.max*.6;
  const t0=performance.now();let iniciou=null,maxZoom=0,maxShake=0,clockFrozen=null,flash=false,titulo='',barras=false,fimOn=null;
  while(performance.now()-t0<5600){
   const e=document.querySelector('#cine82');
   if(e&&e.classList.contains('on')&&iniciou===null){iniciou=performance.now()-t0;out.c0=clock;titulo=e.querySelector('.c82-title b').textContent+'|'+e.querySelector('.c82-title em').textContent;}
   if(iniciou!==null&&clockFrozen===null&&performance.now()-t0>iniciou+560)clockFrozen=Math.abs(clock-out.c0);
   if(e){const h=parseFloat(getComputedStyle(e.querySelector('.c82-bar.top')).height);if(h>(+barras||0))barras=h}
   maxZoom=Math.max(maxZoom,scale/z0);maxShake=Math.max(maxShake,combatShake);
   if(document.querySelector('#cine82 .c82-flash.forte'))flash=true;
   await new Promise(r=>setTimeout(r,16));
  }
  await new Promise(r=>setTimeout(r,500));const e=document.querySelector('#cine82');
  return{iniciou:iniciou&&Math.round(iniciou),titulo,barras,clockFrozen,maxZoom:+maxZoom.toFixed(3),maxShake:Math.round(maxShake),flash,fim:!e||!e.classList.contains('on'),scaleFim:+(scale/z0).toFixed(3),form:R.form,shown:R.shown,vistas:CineV82.S.vistas,Sz:CineV82.S.zoom,Son:CineV82.S.on,st:state}});
 console.log('CINE',JSON.stringify(r));
 ok(r.iniciou!==null&&r.iniciou<800,'a cena começa logo que o chefe se transforma ('+r.iniciou+' ms)');
 ok(r.clockFrozen!==null&&r.clockFrozen<.08,'a luta congela no início da cena (o relógio andou só '+(r.clockFrozen&&r.clockFrozen.toFixed(3))+' s em 0,56 s)');
 ok(/FORMA 2/.test(r.titulo)&&/LIBERTO/.test(r.titulo),'o título mostra a forma: '+r.titulo);
 ok(r.barras>20,'as barras de cinema descem ('+r.barras+')');
 ok(r.maxShake>=8,'a tela treme (tremor máximo '+r.maxShake+')');
 ok(r.maxZoom>1.1,'a câmera aproxima do chefe (zoom máximo '+r.maxZoom+'x)');
 ok(r.flash,'há um clarão forte na hora em que o corpo muda');
 ok(r.fim&&r.Sz===0&&!r.Son,'tudo se desfaz depois (câmera volta, cena some)');
 ok(r.shown===2&&r.vistas===1,'o corpo mudou para a forma 2 e a cena rodou uma vez');
 await p.screenshot({path:'/tmp/claude-0/cine_fim.png'});
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2).join('|'));await b.close()})();
