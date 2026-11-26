// Tela de carregamento da Caçada: arte do Zorvath, barra, dica do chefe; some sozinha e a luta começa.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const errs=[];
 const p=await (await b.newContext({viewport:{width:915,height:412},deviceScaleFactor:1})).newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await p.route('**/assets/chefes_v78/zorvath/forma*',async r=>{await new Promise(x=>setTimeout(x,450));r.continue()});   // rede lenta: dá tempo de ver a tela
 await p.goto('http://localhost:8000/index.html?allheroes=1&inicio=0&semsala=1');await p.waitForTimeout(1200);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1600);
 await p.click('[data-hunt-home]');await p.waitForTimeout(1500);
 await p.click('[data-hunt-team=solo]');await p.click('[data-hunt-start]');
 await p.waitForFunction(()=>{const e=document.querySelector('#carregandoV51');return e&&!e.hidden&&e.classList.contains('c51-cacada')},null,{timeout:15000});
 await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const e=document.querySelector('#carregandoV51');return{titulo:e.querySelector('header b')?.textContent,sub:e.querySelector('header em')?.textContent,dica:e.querySelector('.c51-dica')?.textContent,barra:e.querySelector('.c51-bar i')?.style.width,fundo:getComputedStyle(e.querySelector('.c51-art')).backgroundImage.slice(0,80),estado:state}});
 console.log('CARGA',JSON.stringify(r));
 ok(r.titulo==='ZORVATH'&&/Imperador/.test(r.sub),'a tela mostra o título do chefe');
 ok(/carregando\.webp/.test(r.fundo),'a arte do Zorvath está no fundo');
 ok(r.dica&&r.dica.length>20,'tem dica do chefe');
 await p.screenshot({path:'/tmp/claude-0/carga_0.png'});
 await p.waitForFunction(()=>{const e=document.querySelector('#carregandoV51');return !e||e.hidden},null,{timeout:30000});
 await p.waitForFunction(()=>state==='fight',null,{timeout:20000});
 ok(true,'a tela some sozinha e a luta começa');
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2));
 await b.close()})();
