// Caçada do Dia online: dois jogadores pelo servidor, juntos contra o Zorvath. O servidor roda o chefe; os dois navegadores veem o mesmo chefe,
// a mesma vida, os mesmos avisos de golpe; o dano de um aparece para o outro; no fim os dois veem o resultado.
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8799,SRV='ws://localhost:'+PORT;
(async()=>{
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'1'},stdio:'ignore'});
 const saude=()=>fetch('http://localhost:'+PORT+'/saude').then(r=>r.json());
 for(let i=0;i<40;i++){try{await saude();break}catch{await sleep(250)}}
 const br=await chromium.launch();const errs=[];
 async function player(name,hero){const pg=await (await br.newContext({viewport:{width:915,height:412}})).newPage();pg.on('pageerror',e=>errs.push(name+': '+e.message));
  await pg.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
  await pg.goto('http://localhost:8000/index.html?allheroes=1&cacada=1&servidor='+encodeURIComponent(SRV));await pg.waitForTimeout(900);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName',name);await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2000);await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());
  await pg.evaluate(h=>equipChampion(h,false),hero);return pg}
 const A=await player('Ana',2),B=await player('Beto',5);const P=[A,B];
 for(const pg of P){await pg.evaluate(()=>OnlineV45.procurar('cacada'));await sleep(300)}
 for(const pg of P)await pg.waitForFunction(()=>OnlineV45.state.fase==='sala'&&!(document.querySelector('#onlineV45')?.hidden??true),null,{timeout:40000});
 ok(await A.evaluate(()=>/CAÇADA/.test(document.querySelector('.v45-top b').textContent)&&document.querySelectorAll('.c81-slot').length===2&&!!document.querySelector('.c81-boss canvas')&&/Zorvath/.test(document.querySelector('.c81-banner').textContent)),'a sala da Caçada mostra a dupla à esquerda e o Zorvath à direita');
 await A.screenshot({path:'/tmp/claude-0/cac_sala.png'});
 for(const pg of P){await pg.click('[data-v45="ready"]');await sleep(150)}
 for(const pg of P)await pg.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight'&&modeRun&&modeRun.hunt,null,{timeout:60000});
 await sleep(1500);
 const est=await Promise.all(P.map(pg=>pg.evaluate(()=>({eu:p.skin,ally:actors[2].skin,boss:b.max,bhp:b.hp,guest:modeRun.hunt.guest,n:actors.length,form:modeRun.hunt.form,tm:Math.round(time),nomes:[p.label,actors[2].label].join('/')}))));
 ok(est[0].eu===2&&est[0].ally===5&&est[1].eu===5&&est[1].ally===2,`cada tela tem o seu campeão e o do parceiro (${est.map(e=>e.eu+'+'+e.ally)})`);
 ok(est.every(e=>e.guest&&e.n===3&&e.boss===4600&&e.form===1),'os dois veem o Zorvath (vida 4600, forma 1) rodando no servidor');
 ok(est[0].nomes==='Ana/Beto'&&est[1].nomes==='Beto/Ana','nomes certos nas duas telas '+est.map(e=>e.nomes));
 // posições do chefe iguais nas duas telas
 const pos=await Promise.all(P.map(pg=>pg.evaluate(()=>[Math.round(b.x),Math.round(b.y)])));
 ok(Math.hypot(pos[0][0]-pos[1][0],pos[0][1]-pos[1][1])<40,`o chefe está no mesmo lugar nas duas telas (${pos.map(x=>x)})`);
 // golpes do chefe: força uma habilidade no servidor e confere que as duas telas veem o aviso
 const test=m=>A.evaluate(m=>OnlineV45.send({t:'teste',...m}),m);
 // a vida do chefe cai no servidor e nas duas telas
 await test({hp1:2000});await sleep(900);
 const hp=await Promise.all(P.map(pg=>pg.evaluate(()=>Math.round(b.hp))));
 ok(hp.every(h=>Math.abs(h-2000)<120),`a vida do chefe é igual nas duas telas (${hp})`);
 // forma 2 aparece nas duas (cai abaixo de 70%)
 await sleep(1500);
 const formas=await Promise.all(P.map(pg=>pg.evaluate(()=>modeRun.hunt.form)));
 ok(formas.every(f=>f>=2),`a transformação do chefe aparece nas duas telas (forma ${formas})`);
 const tele=await Promise.all(P.map(pg=>pg.evaluate(async()=>{let seen=0;const t0=performance.now();while(performance.now()-t0<9000){const R=modeRun.hunt;if(R.tele.length||R.discs.length||R.beam||R.cannon||R.nova||R.act)seen++;await new Promise(r=>setTimeout(r,100));if(seen>=3)break}return seen})));
 ok(tele.every(n=>n>=1),`os avisos e golpes do chefe aparecem nas duas telas (${tele})`);
 // o fim: o chefe cai, os dois veem o resultado
 await test({hp1:1});await sleep(300);
 for(const pg of P)await pg.evaluate(()=>{p.inv=0;});
 await A.evaluate(()=>OnlineV45.send({t:'teste',hp1:0}));
 await sleep(500);
 const fim=await Promise.all(P.map(pg=>pg.waitForFunction(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:20000}).then(()=>pg.evaluate(()=>document.querySelector('#resultTitle').textContent)).catch(()=>null)));
 ok(fim.every(t=>t),`os dois veem a tela de resultado (${fim.map(t=>String(t).slice(0,32))})`);
 await A.screenshot({path:'/tmp/claude-0/cac_fim.png'});
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,3).join(' | '));
 await br.close();sv.kill()})();
