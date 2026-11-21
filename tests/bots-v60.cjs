// Bots no online: (A) fila sem encher → bot entra e luta de verdade; (B) jogador sai no meio → bot assume; volta pelo RECONECTAR → bot sai; (C) Coroa com 1 jogador + 3 bots.
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8797,SRV='ws://localhost:'+PORT;
(async()=>{
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'1',ESPERA_BOT:'2500',TEMPO_VOLTA:'60000'},stdio:['ignore','pipe','pipe']});let svlog='';sv.stdout.on('data',d=>svlog+=d);sv.stderr.on('data',d=>svlog+=d);
 const saude=()=>fetch('http://localhost:'+PORT+'/saude').then(r=>r.json());
 for(let i=0;i<40;i++){try{await saude();break}catch{await sleep(250)}}
 const br=await chromium.launch();const errs=[];
 async function ctx(){return br.newContext({viewport:{width:900,height:480}})}
 async function entrar(c,name,hero){const pg=await c.newPage();pg.on('pageerror',e=>errs.push(name+': '+e.message));
  await pg.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent(SRV));await pg.waitForTimeout(900);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName',name);await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2000);await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());
  await pg.evaluate(h=>equipChampion(h,false),hero);return pg}
 const comecar=async(pg,modo)=>{await pg.evaluate(m=>{InicioV40.choose(m);showScreen('home')},modo);await sleep(400);await pg.click('[data-v40-play]')};
 const emSala=pg=>pg.waitForFunction(()=>OnlineV45.state.fase==='sala'&&!(document.querySelector('#onlineV45')?.hidden??true),null,{timeout:40000});
 const emLuta=pg=>pg.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight',null,{timeout:60000});

 /* ---- A: 1 jogador no 1×1, depois de 2,5 s um bot entra ---- */
 const cA=await ctx();const A=await entrar(cA,'Ana',2);
 const t0=Date.now();await comecar(A,'duelo');await emSala(A);
 ok(Date.now()-t0>2000,`o bot só entra depois de esperar (${Math.round((Date.now()-t0)/1000)} s)`);
 await sleep(400);
 ok(await A.evaluate(()=>/Bot /.test(document.querySelector('.v46-chip.right').textContent)),'a sala mostra o rival como "Bot ..."');
 await A.click('[data-v45="ready"]');await emLuta(A);
 const sh=await saude();ok(sh.partidasComBot===1,'o servidor conta a partida com bot');
 const lab=await A.evaluate(()=>b.label);ok(/^Bot /.test(lab),`o rival na luta é o ${lab}`);
 await sleep(9000);
 const luta=await A.evaluate(()=>({hp:Math.round(p.hp),acts:OnlineV46.match.acts,d:Math.round(Math.hypot(p.x-b.x,p.y-b.y)),bhp:Math.round(b.hp)}));
 ok(luta.hp<1000&&luta.acts>0,`o bot luta de verdade (Ana ficou com ${luta.hp} de vida, ${luta.acts} golpes dele apareceram na tela dela, distância ${luta.d})`);
 await cA.close();await sleep(500);

 /* ---- B: dois jogadores; o Beto sai, o bot assume; ele volta pelo RECONECTAR ---- */
 const c1=await ctx(),c2=await ctx();
 const P1=await entrar(c1,'Caio',2);let P2=await entrar(c2,'Duda',4);
 await comecar(P1,'duelo');await sleep(300);await comecar(P2,'duelo');
 await emSala(P1);await emSala(P2);await P1.click('[data-v45="ready"]');await P2.click('[data-v45="ready"]');
 await emLuta(P1);await emLuta(P2);await sleep(1500);
 ok(await P2.evaluate(()=>!!localStorage.getItem('eldoria.partida')),'durante a partida fica guardado que há uma partida em andamento');
 await P2.close();await sleep(1200);
 ok(await P1.evaluate(()=>/\(bot\)/.test(b.label)),`o outro jogador vê que um bot assumiu o campeão de quem saiu (${await P1.evaluate(()=>b.label)})`);
 await sleep(5000);
 const botLuta=await P1.evaluate(()=>({hp:Math.round(p.hp),acts:OnlineV46.match.acts}));
 ok(botLuta.hp<1000||botLuta.acts>0,`o bot controla o campeão de quem saiu (Caio perdeu vida: ${botLuta.hp}, golpes vistos: ${botLuta.acts})`);
 // volta
 P2=await c2.newPage();P2.on('pageerror',e=>errs.push('Duda2: '+e.message));
 await P2.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent(SRV));await P2.waitForTimeout(2500);
 await P2.evaluate(()=>{document.querySelector('#welcomeEnter')?.click()});await P2.waitForTimeout(2500);await P2.evaluate(()=>document.querySelector('#ljModal')?.remove());
 await P2.waitForFunction(()=>document.querySelector('[data-v40-play]'),null,{timeout:20000});await P2.waitForTimeout(800);
 const lbl=await P2.evaluate(()=>document.querySelector('[data-v40-play]').textContent);
 ok(/RECONECTAR/.test(lbl),`depois de sair, o botão do início vira "${lbl.trim().slice(0,30)}"`);
 await P2.click('[data-v40-play]');
 await emLuta(P2);
 await sleep(1500);
 ok(await P2.evaluate(()=>OnlineV46.match.on&&p.hp>0&&V3Modes&&true),'ele volta para a luta em andamento');
 await sleep(800);
 ok(await P1.evaluate(()=>!/\(bot\)/.test(b.label)),'o bot sai do controle: o outro jogador vê o nome sem "(bot)"');
 const q=await Promise.all([P1,P2].map(pg=>pg.evaluate(()=>({me:[p.x,p.y],riv:[b.x,b.y]}))));
 ok(Math.hypot(q[0].me[0]-q[1].riv[0],q[0].me[1]-q[1].riv[1])<30&&Math.hypot(q[1].me[0]-q[0].riv[0],q[1].me[1]-q[0].riv[1])<30,'as duas telas voltam a mostrar os lutadores nos mesmos lugares');
 // quem voltou controla: anda e o outro vê
 const y0=await P1.evaluate(()=>b.y);await P2.evaluate(()=>{joy={x:0,y:(p.y<H/2?1:-1)}});await sleep(900);await P2.evaluate(()=>{joy={x:0,y:0}});await sleep(500);
 const y1=await P1.evaluate(()=>b.y);ok(Math.abs(y1-y0)>40,`quem voltou controla o campeão de novo (o outro viu ele andar ${Math.round(Math.abs(y1-y0))} px)`);
 await c1.close();await c2.close();

 /* ---- C: Disputa da Coroa com 1 jogador + 3 bots ---- */
 const cC=await ctx();const C=await entrar(cC,'Eva',5);
 await comecar(C,'coroa');await emSala(C);
 ok(await C.evaluate(()=>document.querySelectorAll('.v46-chip').length===4&&[...document.querySelectorAll('.v46-chip.right')].every(c=>/Bot /.test(c.textContent))),'a sala da Coroa tem 3 bots');
 await C.click('[data-v45="ready"]');await C.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight'&&V3Crown.state.on,null,{timeout:60000});
 await C.waitForFunction(()=>V3Crown.state.crown.holder,null,{timeout:30000}).catch(()=>{});
 const co=await C.evaluate(()=>({h:V3Crown.state.crown.holder?.label||null,bots:V3Crown.state.players.filter(a=>/^Bot /.test(a.label)).length}));
 ok(co.bots===3&&co.h&&/^Bot /.test(co.h),`na Coroa os bots correm atrás da coroa (${co.h} pegou)`);
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,4).join(' | '));
 if(process.exitCode)console.log(svlog.slice(-700));
 await br.close();sv.kill();
})();
