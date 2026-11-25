// v73: números de dano por força, causa do dano, esquiva perfeita geral, aviso do rival, treino, apresentação, controles ajustáveis, resumo/XP, aviso de falha.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:915,height:412},hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await p.route(/feedback\/enviar/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));
 await p.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent('ws://localhost:1'));await p.waitForTimeout(900);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
 // ---------- duelo normal ----------
 await p.evaluate(()=>{matchMode='1v1';battleActivity='duel';account.activeChampion=3;selected=[...CHAMPIONS[3].kit];start()});
 await p.waitForFunction(()=>state==='count',null,{timeout:8000});await p.waitForTimeout(250);
 ok(await p.evaluate(()=>!!document.querySelector('#intro73')&&/VS/.test(document.querySelector('#intro73').textContent)),'apresentação "VOCÊ VS RIVAL" aparece ao começar a luta');
 await p.screenshot({path:'/tmp/claude-0/v73_intro.png'});
 await p.waitForTimeout(1300);
 ok(await p.evaluate(()=>!document.querySelector('#intro73')),'a apresentação some sozinha em 1,5 s');
 await p.evaluate(()=>{state='fight';count=0;b.hp=1000;p.hp=1000;p.inv=0;b.inv=0});
 // números de dano por força
 const num=await p.evaluate(()=>{const o={};for(const n of [10,30,45,120]){b.hp=1000;b.inv=0;texts.length=0;hit(b,n,p,0,0,-1);const t=texts.find(x=>typeof x.t==='number');o[n]={pop:t&&t.pop||1,cor:t&&t.color}}return o});
 ok(num[10].pop===1&&num[30].pop>=1&&num[45].pop>=num[30].pop&&num[120].pop>num[45].pop&&num[120].cor!==num[10].cor,`número de dano cresce com a força: ${JSON.stringify(Object.fromEntries(Object.entries(num).map(([k,v])=>[k,v.pop])))}`);
 const imp=await p.evaluate(()=>{combatHitStop=0;combatShake=0;b.hp=1000;b.inv=0;hit(b,120,p,0,0,-1);return{hs:combatHitStop,sh:combatShake}});
 ok(imp.hs>=.1&&imp.sh>=8,`golpe enorme: pausa ${imp.hs}s e tremor ${imp.sh}`);
 const imp2=await p.evaluate(()=>{fx.length=0;b.hp=1000;b.inv=0;hit(b,120,p,0,0,-1);const i=fx.find(f=>f.kind==='impact');return i?{pw:i.power,sy:i.sy>i.y}:null});
 ok(imp2&&imp2.pw>1.5&&imp2.sy,'golpe forte cria a faísca de contato (impacto) desenhada por cima do boneco');
 // causa do dano: pelas costas
 const costas=await p.evaluate(()=>{state='fight';p.hp=1000;p.inv=0;p.guard=false;p.st=100;p.dodgeCD=0;p.a=0;b.x=p.x-80;b.y=p.y;texts.length=0;PolimentoV73.S.causeAt=-9;hit(p,40,b,0,0,-1);return texts.map(t=>t.t).filter(t=>typeof t==='string')});
 ok(costas.includes('PELAS COSTAS'),'levar golpe de trás mostra "PELAS COSTAS": '+costas.join(','));
 const sem=await p.evaluate(()=>{p.hp=1000;p.inv=0;p.a=Math.atan2(b.y-p.y,b.x-p.x);p.st=5;texts.length=0;PolimentoV73.S.causeAt=-9;hit(p,40,b,0,0,-1);return texts.map(t=>t.t).filter(t=>typeof t==='string')});
 ok(sem.includes('SEM STAMINA'),'levar golpe sem stamina mostra "SEM STAMINA": '+sem.join(','));
 // esquiva perfeita
 const dp=await p.evaluate(()=>{p.hp=1000;p.st=30;p.inv=0;p.dodgeCD=0;p.dodgeTime=0;state='fight';b.x=p.x+80;b.y=p.y;dodge(p);const st0=p.st;const r=hit(p,60,b,0,0,-1);return{r,hp:p.hp,st0,st1:p.st,cd:p.dodgeCD}});
 ok(dp.r===false&&dp.hp===1000&&dp.st1>dp.st0&&dp.cd<=.8,`esquiva perfeita: sem dano, stamina ${dp.st0}→${dp.st1}, recarga ${dp.cd}`);
 const dp2=await p.evaluate(()=>{const st=p.st;hit(p,60,b,0,0,-1);return p.st===st});
 ok(dp2,'a mesma esquiva só premia uma vez');
 // aviso do rival
 const av=await p.evaluate(async()=>{b._wf73=false;b.cast=.5;b.hp=1000;texts.length=0;await new Promise(r=>setTimeout(r,200));const o=texts.some(t=>t.t==='!');b.cast=0;return o});
 ok(av,'rival preparando golpe mostra o aviso padrão "!"');
 // ---------- controles ajustáveis ----------
 await p.evaluate(()=>{document.querySelector('#pauseBtn').click()});await p.waitForTimeout(300);
 ok(await p.evaluate(()=>!!document.querySelector('#c73Btn')&&getComputedStyle(document.querySelector('#pause')).display!=='none'),'menu de pausa tem "Ajustar controles"');
 await p.evaluate(()=>document.querySelector('#c73Btn').click());await p.waitForTimeout(200);
 const antes=await p.evaluate(()=>{const r=document.querySelector('#stick').getBoundingClientRect();return{x:r.left,y:r.top,w:r.width}});
 await p.mouse.move(antes.x+antes.w/2,antes.y+antes.w/2);await p.mouse.down();await p.mouse.move(antes.x+antes.w/2+60,antes.y+antes.w/2-20,{steps:6});await p.mouse.up();
 const depois=await p.evaluate(()=>{const r=document.querySelector('#stick').getBoundingClientRect();return{x:r.left,y:r.top}});
 ok(Math.abs(depois.x-antes.x-60)<6&&Math.abs(depois.y-antes.y+20)<6,`arrastar move o analógico (${Math.round(depois.x-antes.x)}, ${Math.round(depois.y-antes.y)})`);
 await p.click('[data-c=mais]');const esc=await p.evaluate(()=>getComputedStyle(document.querySelector('#stick')).scale);ok(+esc>1,'"Maior" aumenta os controles (escala '+esc+')');
 await p.click('[data-c=inv]');const inv=await p.evaluate(()=>{const w=document.querySelector('#battle').getBoundingClientRect(),a=document.querySelector('#attack').getBoundingClientRect();return a.left+a.width/2<w.width/2});
 ok(inv,'"Inverter lados" leva o botão de ataque para a esquerda');
 await p.screenshot({path:'/tmp/claude-0/v73_controles.png'});
 await p.click('[data-c=rest]');
 const rest=await p.evaluate(()=>{const r=document.querySelector('#stick').getBoundingClientRect();return Math.abs(r.left-0)>=0&&getComputedStyle(document.querySelector('#stick')).translate});ok(rest==='none'||rest==='0px','"Restaurar" volta ao padrão ('+rest+')');
 await p.click('[data-c=ok]');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>getComputedStyle(document.querySelector('#pause')).display!=='none'&&document.querySelector('#c73bar').hidden),'"Concluir" volta ao menu de pausa');
 await p.evaluate(()=>document.querySelector('#resume').click());await p.waitForTimeout(200);
 // ---------- resultado: resumo + XP ----------
 const xp=await p.evaluate(async()=>{state='fight';p.damage=300;p.hits=7;PolimentoV73.S.backDealt=3;PolimentoV73.S.maxHit=88;b.hp=0;finish();await new Promise(r=>{const t0=performance.now(),i=setInterval(()=>{if(state==='end'||performance.now()-t0>9000){clearInterval(i);setTimeout(r,1200)}},100)});
  const o=document.querySelector('#outcome');return{vis:getComputedStyle(o).display,res:document.querySelector('#res73')?.innerText||null,fit:(()=>{const d=document.querySelector('#outcome .dialog').getBoundingClientRect();return[Math.round(d.top),Math.round(d.bottom)]})()}});
 ok(xp.vis!=='none'&&/pelas costas/.test(xp.res||'')&&/300 de dano/.test(xp.res||''),'resultado mostra o resumo: '+JSON.stringify((xp.res||'').slice(0,90)));
 ok(/XP/.test(xp.res||'')&&/Nível/.test(xp.res||''),'resultado mostra a barra de XP');
 ok(xp.fit[0]>=0&&xp.fit[1]<=412,'o cartão ainda cabe na tela ('+xp.fit+')');
 await p.screenshot({path:'/tmp/claude-0/v73_resultado.png'});
 // ---------- aviso de falha repetida ----------
 await p.evaluate(()=>{leave();});await p.waitForTimeout(300);
 await p.evaluate(()=>{matchMode='1v1';battleActivity='duel';selected=[...CHAMPIONS[3].kit];start()});await p.waitForFunction(()=>state==='count',null,{timeout:8000});await p.evaluate(()=>{state='fight';count=0});await p.waitForTimeout(500);
 await p.evaluate(()=>{window.__d=drawArenaScenery;drawArenaScenery=function(){throw new Error('quebra de teste v73')}});await p.waitForTimeout(1800);
 const fa=await p.evaluate(()=>({aviso:!!document.querySelector('#falha73'),botoes:[...document.querySelectorAll('#falha73 button')].map(x=>x.textContent)}));
 ok(fa.aviso&&fa.botoes.includes('Reiniciar luta'),'falha repetida mostra aviso com "Reiniciar luta": '+fa.botoes.join('/'));
 await p.evaluate(()=>{drawArenaScenery=window.__d});
 await p.click('#falha73 [data-f=re]');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>clock<2&&!document.querySelector('#falha73')),'"Reiniciar luta" recomeça a luta');
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2).join('|'));
 await b.close()})();
