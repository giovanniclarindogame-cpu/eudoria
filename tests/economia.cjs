// Modo economia: opção nas configurações, 30 quadros por segundo, persistência e luta funcionando.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const fps=p=>p.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();(function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/2)})()}));
const calls=p=>p.evaluate(()=>new Promise(r=>{let n=0;const o=window.step;window.step=function(){n++;return o.apply(this,arguments)};setTimeout(()=>{window.step=o;r(n/2)},2000)}));
(async()=>{
 const b=await chromium.launch();
 for(const vp of [{width:844,height:390},{width:1280,height:720}]){
  const tag=`${vp.width}x${vp.height}`;
  const ctx=await b.newContext({viewport:vp});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8000/index.html?boss=zorvath');await p.waitForTimeout(900);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1400);
  await p.click('#openLobbySettings');await p.waitForTimeout(300);
  ok(await p.locator('#ecoMode').count()===1,`${tag}: configurações têm o Modo economia`);
  ok(await p.locator('#ecoMode').isChecked()===false,`${tag}: vem desligado`);
  const fit=await p.evaluate(()=>{const d=document.querySelector('.lobby-settings-dialog').getBoundingClientRect();return d.bottom<=innerHeight+1&&d.top>=-1});
  ok(fit,`${tag}: janela de configurações cabe na tela`);
  await p.evaluate(()=>{matchMode;});
  const stepOff=await calls(p);
  await p.check('#ecoMode');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>EcoQA.on&&window.renderCap===1.5&&vfxQuality==='low'),`${tag}: ligar ativa 30 quadros, resolução 1.5 e efeitos leves`);
  const stepOn=await calls(p);
  ok(stepOff>45&&stepOn>=12&&stepOn<=34,`${tag}: quadros por segundo caem de ${stepOff} para ${stepOn} (≈30)`);
  await p.reload();await p.waitForTimeout(1500);
  ok(await p.evaluate(()=>EcoQA.on&&document.documentElement.dataset.eco==='1'),`${tag}: preferência lembrada após recarregar`);
  await p.evaluate(()=>{matchMode='2v2';start()});await p.waitForTimeout(5000);
  ok(await p.evaluate(()=>state==='fight'&&!!window.ecoMode),`${tag}: luta 2×2 roda no modo economia`);
  const cw=await p.evaluate(()=>{const c=document.getElementById('arena');return c.width/c.getBoundingClientRect().width});
  ok(cw<=1.51,`${tag}: canvas limitado a 1.5x (${cw.toFixed(2)})`);
  const t0=await p.evaluate(()=>clock);await p.waitForTimeout(2000);
  const t1=await p.evaluate(()=>clock);
  ok(t1-t0>1.7&&t1-t0<2.4,`${tag}: o tempo do jogo continua em velocidade normal (${(t1-t0).toFixed(2)}s em 2s)`);
  await p.evaluate(()=>{EcoQA.set(false)});await p.waitForTimeout(300);
  ok(await p.evaluate(()=>!EcoQA.on&&window.renderCap===undefined),`${tag}: desligar volta ao normal`);
  ok(errs.length===0,`${tag}: sem erros de JavaScript ${errs.join('|')}`);
  // proteção automática: luta lenta (45 ms por quadro) por mais de 3 s liga o modo economia sozinho
 {
  const c2=await b.newContext({viewport:vp});const p2=await c2.newPage();
  await p2.goto('http://localhost:8000/index.html');await p2.waitForTimeout(900);
  await p2.getByText('ENTRAR',{exact:true}).click();await p2.fill('input','Teste');await p2.getByText('Continuar',{exact:true}).click();await p2.waitForTimeout(1400);
  await p2.evaluate(()=>{window.requestAnimationFrame=()=>0;matchMode='1v1';start();state='fight';count=0;EcoQA.reset();EcoQA.set(false)});
  const fast=await p2.evaluate(()=>{for(let i=0;i<400;i++)EcoQA.feed(16);return EcoQA.on});
  ok(fast===false,`${tag}: luta fluida (16 ms por quadro) não liga o modo economia`);
  const slow=await p2.evaluate(()=>{for(let i=0;i<120;i++)EcoQA.feed(45);return{on:EcoQA.on,cap:window.renderCap}});
  ok(slow.on===true&&slow.cap===1.5,`${tag}: luta lenta por mais de 3 s liga o modo economia sozinho`);
  await p2.evaluate(()=>EcoQA.set(false));await c2.close();
 }
 await ctx.close();
 }
 await b.close();
})();
