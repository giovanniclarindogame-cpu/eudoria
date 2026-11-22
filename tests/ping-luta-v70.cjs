// Ping na luta online: pílula pequena ao lado do botão de pausa; não cobre HUD nem botões; some fora da luta online.
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8791,SRV='ws://localhost:'+PORT;
(async()=>{
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'1',ESPERA_BOT:'1500'},stdio:'ignore'});
 for(let i=0;i<50;i++){try{await fetch('http://localhost:'+PORT+'/saude');break}catch{await sleep(200)}}
 const br=await chromium.launch();const errs=[];
 for(const [w,h,mob] of [[1280,720,false],[915,412,true],[667,375,true]]){
  const tag=`${w}x${h}`;
  const c=await br.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});const p=await c.newPage();p.on('pageerror',e=>errs.push(tag+': '+e.message+' @ '+String(e.stack||'').split('\n').slice(1,3).join(' | ').replace(/http:\/\/localhost:8000\//g,'')));
  await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
  await p.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent(SRV));await p.waitForTimeout(900);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName','Ana');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(2000);await p.evaluate(()=>document.querySelector('#ljModal')?.remove());
  await p.evaluate(()=>equipChampion(2,false));
  ok(await p.evaluate(()=>{const e=document.getElementById('fightPing');return !e||e.hidden}),`${tag}: na tela inicial o ping não aparece`);
  await p.evaluate(()=>{InicioV40.choose('duelo');showScreen('home')});await sleep(400);await p.click('[data-v40-play]');
  await p.waitForFunction(()=>OnlineV45.state.fase==='sala'&&!(document.querySelector('#onlineV45')?.hidden??true),null,{timeout:40000});
  await p.click('[data-v45="ready"]');
  await p.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight',null,{timeout:60000});
  await p.waitForFunction(()=>{const e=document.getElementById('fightPing');return e&&!e.hidden&&/\d+ ms/.test(e.textContent)},null,{timeout:12000});
  const r=await p.evaluate(()=>{
   const e=document.getElementById('fightPing'),a=e.getBoundingClientRect(),vis=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>2&&r.height>2};
   const cruza=(x,y)=>x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;
   const alvos=[['pausa','#pauseBtn'],['cronômetro','.mid-hud'],['barra de vida do jogador','.fighterhud:not(.enemy)'],['barra de vida do rival','.fighterhud.enemy'],['joystick','#stick'],['botão de dash','#attack'],['habilidades','#equipped .skill']];
   const batidas=[];
   for(const [nome,sel] of alvos){for(const el of document.querySelectorAll('#battle '+sel)){if(!vis(el))continue;if(cruza(a,el.getBoundingClientRect()))batidas.push(nome)}}
   return{txt:e.textContent.trim(),q:e.dataset.q,rect:[a.left,a.top,a.width,a.height].map(Math.round),dentro:a.left>=0&&a.top>=0&&a.right<=innerWidth&&a.bottom<=innerHeight,batidas:[...new Set(batidas)],larg:Math.round(a.width),alt:Math.round(a.height)}});
  ok(/^\d+ ms$/.test(r.txt)&&['bom','ok','ruim'].includes(r.q),`${tag}: mostra o ping durante a luta online ("${r.txt}", ${r.q})`);
  ok(r.dentro&&r.larg<=90&&r.alt<=22,`${tag}: é pequeno (${r.larg}×${r.alt}px) e fica dentro da tela`);
  ok(r.batidas.length===0,`${tag}: não cobre nenhum controle ou barra${r.batidas.length?' — cobre: '+r.batidas.join(', '):''}`);
  if(w===1280)await p.screenshot({path:'/tmp/claude-0/ping_pc.png'});else if(w===915)await p.screenshot({path:'/tmp/claude-0/ping_cel.png'});
  // some ao sair da luta
  await p.evaluate(()=>document.querySelector('#pauseBtn')?.click());await sleep(300);await p.evaluate(()=>document.querySelector('#leave').click());await sleep(1500);
  ok(await p.evaluate(()=>{const e=document.getElementById('fightPing');return !e||e.hidden}),`${tag}: depois de voltar ao início o ping some`);
  // luta offline (Dojo/treino): não é online, não aparece
  await p.evaluate(()=>{try{showScreen('training')}catch{}});await sleep(500);
  ok(await p.evaluate(()=>{const e=document.getElementById('fightPing');return !e||e.hidden}),`${tag}: fora da luta online (treino) não aparece`);
  await c.close();await sleep(500);
 }
 const meus=errs.filter(e=>/ping_luta|fightPing/.test(e));
 ok(meus.length===0,'o ping não gera erros de JavaScript '+meus.slice(0,3).join('|'));
 if(errs.length>meus.length)console.log('aviso (já existia, não é do ping):',[...new Set(errs.filter(e=>!meus.includes(e)).map(e=>e.replace(/^\d+x\d+: /,'').slice(0,110)))].join(' || '));
 await br.close();sv.kill();
})();
