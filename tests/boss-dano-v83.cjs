// Ícones pintados do Zorvath, lobby sem "dicas e semana", dano do chefe sentido no jogador e corpo animado nos ataques.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const errs=[];
 const p=await (await b.newContext({viewport:{width:915,height:412},deviceScaleFactor:1})).newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await p.goto('http://localhost:8000/index.html?allheroes=1&inicio=0&semsala=1');await p.waitForTimeout(1200);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1600);
 await p.click('[data-hunt-home]');await p.waitForTimeout(1500);
 const tabs=await p.evaluate(()=>[...document.querySelectorAll('[data-hunt-tab]')].map(x=>x.textContent.trim()));
 ok(tabs.join()==='Chefe,Habilidades','o lobby só tem as abas Chefe e Habilidades ('+tabs+')');
 ok(!/semana|CHEFES DA SEMANA|Dicas/i.test(await p.evaluate(()=>document.querySelector('.hunt-page').textContent)),'nenhum texto de dica/semana no lobby');
 await p.click('[data-hunt-tab=s]');await p.waitForTimeout(800);
 const ic=await p.evaluate(()=>[...document.querySelectorAll('.hunt-skill img.pint')].map(i=>i.complete&&i.naturalWidth));
 ok(ic.length===6&&ic.every(w=>w>100),'os 6 ícones pintados das habilidades carregaram ('+ic+')');
 await p.screenshot({path:'/tmp/claude-0/lobby_skills.png'});
 await p.click('[data-hunt-team=solo]');await p.click('[data-hunt-start]');await p.waitForTimeout(900);
 await p.waitForFunction(()=>state==='fight',null,{timeout:25000});await p.waitForTimeout(2000);
 const mini=await p.evaluate(()=>[...document.querySelectorAll('#botkit img')].map(i=>i.complete&&i.naturalWidth));
 ok(mini.length===6&&mini.every(w=>w>100),'ícones pintados também no HUD da luta ('+mini+')');
 // dano sentido
 const r=await p.evaluate(async()=>{
  const R=modeRun.hunt;b.x=p.x+60;b.y=p.y;p.inv=0;p.guard=false;p.blockFlash=0;
  const hp0=p.hp,x0=p.x;const okh=HuntAPI&&true;
  const e0=document.getElementById('hurt83');
  // golpe forte do chefe, igual ao do jogo
  const f=window.__bossHitTest;
  return{hp0,x0}});
 // aciona um ataque real do chefe: chicote colado no jogador
 const r2=await p.evaluate(async()=>{
  const R=modeRun.hunt;b.x=p.x+50;b.y=p.y;p.inv=0;p.guard=false;
  const hp0=p.hp;R.next='s0';R.act=null;R.cd=0;
  let react=0,vig=false,maxShake=0,sx=0,seen=new Set();const t0=performance.now();
  while(performance.now()-t0<4500){
   if(R.act)seen.add(R.act.id);
   react=Math.max(react,p.hitReact||0);maxShake=Math.max(maxShake,combatShake);
   const h=document.getElementById('hurt83');if(h&&h.classList.contains('on'))vig=true;
   if(p.hp<hp0-1&&react>0&&vig)break;
   await new Promise(r=>setTimeout(r,16));
  }
  return{lost:Math.round(hp0-p.hp),react:+react.toFixed(2),vig,maxShake:Math.round(maxShake),acts:[...seen]}});
 console.log('DANO',JSON.stringify(r2));
 ok(r2.lost>0,'o chefe tirou vida do jogador ('+r2.lost+')');
 ok(r2.react>=.3,'o personagem entra na animação de dor ('+r2.react+'s)');
 ok(r2.vig,'a borda vermelha de dano acende na tela');
 ok(r2.maxShake>=4,'a tela treme no golpe ('+r2.maxShake+')');
 // capturas do corpo do chefe durante vários ataques
 let k=0;for(const id of ['basic','s0','s1','s4']){
  await p.evaluate(id=>{const R=modeRun.hunt;p.hp=p.max;p.inv=0;b.x=p.x+130;b.y=p.y;R.next=id;R.act=null;R.cd=0},id);
  await p.waitForTimeout(id==='basic'?650:420);await p.screenshot({path:`/tmp/claude-0/ataque_${k++}.png`});
 }
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2));
 await b.close()})();
