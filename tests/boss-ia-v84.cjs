// Lobby da Caçada: botão volta ao lobby, tela enxuta, tentativas coerentes. IA do chefe: reage a clones, aliados próximos e a quem o machuca.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const errs=[];
 const p=await (await b.newContext({viewport:{width:915,height:412},deviceScaleFactor:1})).newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await p.goto('http://localhost:8000/index.html?allheroes=1&inicio=0&semsala=1');await p.waitForTimeout(1200);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1600);
 await p.evaluate(()=>localStorage.setItem('eldoria.cacada.v1',JSON.stringify({team:'duo',best:{zorvath:82},wins:{zorvath:2},tries:{zorvath:0}})));
 await p.click('[data-hunt-home]');await p.waitForTimeout(1500);
 /* ---------- lobby ---------- */
 const L=await p.evaluate(()=>{const q=s=>document.querySelector(s);return{voltar:q('.hunt-top .ghost')?.textContent.trim(),nav:q('.hunt-top .ghost')?.dataset.nav,timer:!!q('#huntTimer'),plateNome:!!q('.hunt-plate strong'),det:!!q('.hunt-more'),aberto:q('.hunt-more')?.open,gancho:q('.hunt-hook')?.textContent.length,rec:q('.hunt-record')?.innerText.replace(/\s+/g,' '),texto:q('.hunt-page').innerText.length}});
 console.log('LOBBY',JSON.stringify(L));
 ok(/Lobby/.test(L.voltar)&&L.nav==='home','o botão de voltar diz "Lobby" e vai para o lobby');
 ok(!L.timer,'sem "Novo chefe em…" enquanto o chefe é fixo');
 ok(!L.plateNome,'o nome do chefe não aparece repetido na placa');
 ok(L.det&&!L.aberto&&L.gancho<140,'a história e as dicas ficam recolhidas; só uma frase curta à vista');
 ok(!/tentativa/.test(L.rec)&&/2 vitórias/.test(L.rec),'o recorde não mostra "0 tentativas" com vitórias ('+L.rec+')');
 await p.screenshot({path:'/tmp/claude-0/lobby_limpo.png'});
 await p.click('.hunt-top .ghost');await p.waitForTimeout(900);
 const V=await p.evaluate(()=>({tela:document.body.dataset.screen,modo:document.querySelector('#modeScreen').hidden,home:!document.querySelector('#homeScreen').hidden}));
 ok(V.tela==='home'&&V.modo&&V.home,'voltar leva ao lobby (tela inicial), não à lista de Arenas ('+JSON.stringify(V)+')');
 /* ---------- IA do chefe ---------- */
 await p.click('[data-hunt-home]');await p.waitForTimeout(1200);
 await p.click('[data-hunt-team=duo]');await p.click('[data-hunt-start]');await p.waitForTimeout(900);
 await p.waitForFunction(()=>state==='fight',null,{timeout:25000});await p.waitForTimeout(1800);
 const ia=await p.evaluate(async()=>{
  const R=modeRun.hunt,ally=actors[2],out={};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  // o chefe fica quase parado (só mira): mexemos nas posições dos outros a cada instante
  const pos=(who,dx)=>{who.x=Math.min(W-40,Math.max(40,b.x-dx));who.y=b.y};
  const clone={v10Clone:true,life:99,hp:100,max:100,team:0,x:0,y:0,r:14,kind:'clone',owner:p};
  const cenario=async(f,ms=1300)=>{const t0=performance.now();while(performance.now()-t0<ms){f();p.inv=ally.inv=999;b.root=Math.max(b.root||0,.3);await sleep(50)}};
  // A) jogador longe, clone perto
  objects.push(clone);
  await cenario(()=>{pos(p,430);pos(ally,460);clone.x=b.x-120;clone.y=b.y+10});
  out.clone=R.aggro===clone;
  // B) sem clone: aliado perto, jogador longe
  clone.hp=0;clone.life=0;
  await cenario(()=>{pos(p,430);pos(ally,150)});
  out.aliado=R.aggro===ally;
  // C) o aliado está mais perto, mas o JOGADOR bate no chefe: a atenção vai para ele
  const ant=R.aggro;
  await cenario(()=>{pos(p,300);pos(ally,250)},900);
  out.antes=R.aggro===ally;
  for(let i=0;i<4;i++){hit(b,160,p,0,0);await sleep(40)}
  await cenario(()=>{pos(p,300);pos(ally,250)},1000);
  out.ameaca=R.aggro===p;
  // D) sem preguiça demais: troca quando alguém passa colado
  await cenario(()=>{pos(p,430);pos(ally,430)},700);
  await cenario(()=>{pos(p,100);pos(ally,430)},900);
  out.colado=R.aggro===p;
  return out});
 console.log('IA',JSON.stringify(ia));
 ok(ia.clone,'com o jogador longe, o chefe vai atrás do CLONE que está perto');
 ok(ia.aliado,'o chefe vai atrás do aliado que chega perto, mesmo com o jogador mais longe');
 ok(ia.antes&&ia.ameaca,'o aliado mais perto atrai primeiro, mas quem bate no chefe passa a ser o alvo');
 ok(ia.colado,'quem chega colado no chefe vira alvo na hora');
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2));
 await b.close()})();
