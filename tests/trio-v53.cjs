// Trio de Campeões online: 2 jogadores, cada um com um time de 3 escolhido na sala; lutam um contra um, quem vence continua com a vida que tem.
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8793,SRV='ws://localhost:'+PORT;
(async()=>{
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'1'},stdio:['ignore','pipe','pipe']});let svlog='';sv.stdout.on('data',d=>svlog+=d);sv.stderr.on('data',d=>svlog+=d);
 const saude=()=>fetch('http://localhost:'+PORT+'/saude').then(r=>r.json());
 for(let i=0;i<40;i++){try{await saude();break}catch{await sleep(250)}}
 const br=await chromium.launch();const errs=[];
 async function player(name,hero){const pg=await (await br.newContext({viewport:{width:900,height:480}})).newPage();pg.on('pageerror',e=>errs.push(name+': '+e.message));
  await pg.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent(SRV));await pg.waitForTimeout(900);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName',name);await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2000);await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());
  await pg.evaluate(h=>equipChampion(h,false),hero);return pg}
 const A=await player('Ana',2),B=await player('Beto',4);
 for(const pg of [A,B]){await pg.evaluate(()=>{InicioV40.choose('trio');showScreen('home')});await sleep(500)}
 await A.click('[data-v40-play]');
 for(let i=0;i<50&&(await saude()).fila3!==1;i++)await sleep(100);
 ok((await saude()).fila3===1&&await A.evaluate(()=>OnlineV45.state.modo==='trio'),'o Trio entra na fila própria (fila3)');
 await B.click('[data-v40-play]');
 for(const pg of [A,B])await pg.waitForFunction(()=>OnlineV45.state.fase==='sala'&&!(document.querySelector('#onlineV45')?.hidden??true),null,{timeout:30000});
 await sleep(500);
 ok(await A.evaluate(()=>/TRIO/.test(document.querySelector('.v45-top b').textContent)&&document.querySelectorAll('.v46-trow').length===3&&OnlineV45.state.team.length===3&&OnlineV45.state.team[0]===2),'a sala do Trio mostra o time de 3 (o campeão equipado entra primeiro)');
 // Ana troca a ordem do time com ◀ ▶ e testa o bloqueio com menos de 3
 const t0=await A.evaluate(()=>OnlineV45.state.team.slice());
 await A.evaluate(()=>document.querySelector('[data-v45-mv="0,1"]').click());await sleep(200);
 ok(await A.evaluate(t0=>OnlineV45.state.team.join()===[t0[1],t0[0],t0[2]].join(),t0),`◀ ▶ muda a ordem de entrada (${t0} → ${await A.evaluate(()=>OnlineV45.state.team)})`);
 const rem=await A.evaluate(()=>OnlineV45.state.team[2]);
 await A.evaluate(id=>document.querySelector(`[data-v45-hero="${id}"]`).click(),rem);await sleep(200);
 ok(await A.evaluate(()=>document.querySelector('[data-v45="ready"]').disabled&&/2\/3/.test(document.querySelector('[data-v45="ready"]').textContent)),'com menos de 3 campeões o botão PRONTO fica bloqueado (2/3)');
 await A.evaluate(id=>document.querySelector(`[data-v45-hero="${id}"]`).click(),rem);await sleep(200);
 const timeA2=await A.evaluate(()=>OnlineV45.state.team.slice());
 await A.click('[data-v45="ready"]');await B.click('[data-v45="ready"]');
 const timeB=await B.evaluate(()=>OnlineV45.state.team.slice());
 for(const pg of [A,B])await pg.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight'&&V3Kof.state,null,{timeout:60000});
 const ka=await A.evaluate(()=>({mine:V3Kof.state.mine,foes:V3Kof.state.foes,p:p.skin,b:b.skin})),kb=await B.evaluate(()=>({mine:V3Kof.state.mine,foes:V3Kof.state.foes,p:p.skin,b:b.skin}));
 ok(ka.mine.join()===timeA2.join()&&ka.foes.join()===timeB.join()&&kb.mine.join()===timeB.join()&&kb.foes.join()===timeA2.join(),`cada tela tem o seu time e o do rival (Ana ${ka.mine} × Beto ${kb.mine})`);
 ok(ka.p===ka.mine[0]&&ka.b===ka.foes[0]&&kb.p===kb.mine[0]&&kb.b===kb.foes[0],'a 1ª luta é o 1º de cada time');
 ok(await A.evaluate(()=>document.querySelectorAll('.kof-strip span').length===6&&!document.querySelector('#roundPips:not([hidden])')),'as faixas dos times (3 + 3) aparecem e o placar de rounds do duelo não entra');
 ok(await A.evaluate(()=>{
  const before=[...document.querySelectorAll('.kof-strip img')];updateUI();
  const after=[...document.querySelectorAll('.kof-strip img')];
  return before.length===6&&before.every((el,i)=>el===after[i]);
 }),'os seis retratos são reaproveitados ao atualizar o placar');
 // derrota o 1º de Beto (slot 1): entra o 2º de Beto; Ana continua com o mesmo lutador e a vida que tinha
 await sleep(1500);
 await A.evaluate(()=>OnlineV45.send({t:'teste',hp1:0}));
 for(const pg of [A,B])await pg.waitForFunction(()=>state==='count'&&V3Kof.state.iF===1||V3Kof.state.iM===1,null,{timeout:30000});
 await sleep(800);
 const a2=await A.evaluate(()=>({p:p.skin,b:b.skin,iM:V3Kof.state.iM,iF:V3Kof.state.iF,hpp:Math.round(p.hp)})),b2=await B.evaluate(()=>({p:p.skin,b:b.skin,iM:V3Kof.state.iM,iF:V3Kof.state.iF}));
 ok(a2.iF===1&&a2.iM===0&&a2.b===timeB[1]&&a2.p===timeA2[0]&&b2.iM===1&&b2.iF===0&&b2.p===timeB[1]&&b2.b===timeA2[0],`o 1º do Beto caiu: entra o ${timeB[1]}; a Ana continua com o ${timeA2[0]} (Ana vê ${a2.p}×${a2.b}, Beto vê ${b2.p}×${b2.b})`);
 // as telas continuam em sincronia: o novo rival da Ana aparece com o mesmo estado nas duas
 await A.waitForFunction(()=>state==='fight',null,{timeout:20000});await B.waitForFunction(()=>state==='fight',null,{timeout:20000});await sleep(900);
 const q=await Promise.all([A,B].map(pg=>pg.evaluate(()=>({me:[p.x,p.y],riv:[b.x,b.y]}))));
 ok(Math.hypot(q[0].me[0]-q[1].riv[0],q[0].me[1]-q[1].riv[1])<25&&Math.hypot(q[1].me[0]-q[0].riv[0],q[1].me[1]-q[0].riv[1])<25,'depois da troca as duas telas mostram os lutadores nos mesmos lugares');
 // derruba os outros dois de Beto: Ana vence o trio
 const visivel=pg=>pg.evaluate(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none');
 for(let k=0;k<3&&!(await visivel(A));k++){
  for(const pg of [A,B])await pg.waitForFunction(()=>state==='fight'&&p.hp>0&&b.hp>0,null,{timeout:25000}).catch(()=>{});
  await sleep(600);await A.evaluate(()=>OnlineV45.send({t:'teste',hp1:0}));
  await A.waitForFunction(()=>state==='count'||getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:25000}).catch(()=>{});
 }
 for(const pg of [A,B])await pg.waitForFunction(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:25000}).catch(()=>{});
 const ta=await A.evaluate(()=>document.querySelector('#resultTitle').textContent+'|'+document.querySelector('#resultText').textContent.slice(0,60)),tb=await B.evaluate(()=>document.querySelector('#resultTitle').textContent);
 ok(/é sua/.test(ta)&&/aprendizado/.test(tb),`Ana derrubou os 3 do Beto: Ana vê "${ta}" e Beto vê "${tb}"`);
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,4).join(' | '));
 if(process.exitCode)console.log(svlog.slice(-500));
 await br.close();sv.kill();
})();
