// Em partida online, "Voltar ao início" (menu de pausa) tem que levar para a tela inicial, sem mostrar o menu antigo "ONLINE / Partida rápida / Criar sala".
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8798,SRV='ws://localhost:'+PORT;
(async()=>{
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'1',ESPERA_BOT:'2000',TEMPO_VOLTA:'60000'},stdio:['ignore','pipe','pipe']});
 const saude=()=>fetch('http://localhost:'+PORT+'/saude').then(r=>r.json());
 for(let i=0;i<40;i++){try{await saude();break}catch{await sleep(250)}}
 const br=await chromium.launch();const errs=[];
 for(const [modo,rotulo] of [['duelo','1×1'],['equipes','2×2']]){
  const c=await br.newContext({viewport:{width:900,height:480}});const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent(SRV));await pg.waitForTimeout(900);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Ana');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2000);await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());
  await pg.evaluate(()=>equipChampion(2,false));
  await pg.evaluate(m=>{InicioV40.choose(m);showScreen('home')},modo);await sleep(400);await pg.click('[data-v40-play]');
  await pg.waitForFunction(()=>OnlineV45.state.fase==='sala'&&!(document.querySelector('#onlineV45')?.hidden??true),null,{timeout:40000});
  await pg.click('[data-v45="ready"]');
  await pg.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight',null,{timeout:60000});await sleep(1500);
  // pausa -> Voltar ao início
  await pg.evaluate(()=>document.querySelector('#pauseBtn')?.click());await sleep(400);
  await pg.evaluate(()=>document.querySelector('#leave').click());
  const vistos=[];for(let i=0;i<14;i++){await sleep(500);vistos.push(await pg.evaluate(()=>({menu:!(document.querySelector('#onlineV45')?.hidden??true),tela:typeof appScreen!=='undefined'?appScreen:'?',luta:getComputedStyle(document.querySelector('#battle')).display,ctl:!!document.querySelector('[data-v40-play]')&&document.querySelector('[data-v40-play]').offsetParent!==null})))}
  const menuVisto=vistos.some(v=>v.menu),ult=vistos[vistos.length-1];
  ok(!menuVisto,`${rotulo}: depois de "Voltar ao início" o menu antigo ONLINE nunca aparece (${vistos.filter(v=>v.menu).length} de ${vistos.length} instantes)`);
  ok(ult.tela==='home'&&ult.luta==='none',`${rotulo}: fica na tela inicial (tela=${ult.tela}, luta=${ult.luta})`);
  const estado=await pg.evaluate(()=>({proc:OnlineV45.state.procurando,fase:OnlineV45.state.fase,flag:localStorage.getItem('eldoria.partida')}));
  console.log('   estado:',JSON.stringify(estado));
  await c.close();await sleep(600);
 }

 /* ---- seta "voltar" da sala de escolha (antes da luta) e durante a busca ---- */
 for(const modo of ['duelo','equipes','trio','coroa']){
  const c=await br.newContext({viewport:{width:900,height:480}});const pg=await c.newPage();pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent(SRV));await pg.waitForTimeout(900);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Bia');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2000);await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());
  await pg.evaluate(()=>equipChampion(2,false));
  await pg.evaluate(m=>{InicioV40.choose(m);showScreen('home')},modo);await sleep(400);await pg.click('[data-v40-play]');
  await pg.waitForFunction(()=>OnlineV45.state.fase==='sala'&&!(document.querySelector('#onlineV45')?.hidden??true),null,{timeout:40000});
  await pg.click('.v45-top [data-v45-back]');
  const vistos=[];for(let i=0;i<8;i++){await sleep(400);vistos.push(await pg.evaluate(()=>({menu:!(document.querySelector('#onlineV45')?.hidden??true),tela:appScreen,play:!!document.querySelector('[data-v40-play]')&&document.querySelector('[data-v40-play]').offsetParent!==null})))}
  ok(!vistos.some(v=>v.menu)&&vistos[vistos.length-1].tela==='home'&&vistos[vistos.length-1].play,`${modo}: seta voltar da sala leva à tela inicial (sem menu antigo)`);
  await c.close();await sleep(300);
 }
 ok(errs.length===0,'sem erros de JavaScript '+errs.join('|'));
 await br.close();sv.kill();
})();
