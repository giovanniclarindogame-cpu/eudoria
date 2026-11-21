// Servidor de partidas v49: fila, partida calculada no servidor, comandos/ações, vida só pelo servidor, melhor de 3, jogar de novo, saída.
// Sobe o servidor (servidor/servidor.cjs, TESTE=1) na porta 8790 e abre jogadores em navegadores. Pacote "ws" e "jsdom" em servidor/node_modules.
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8790,SRV='ws://localhost:'+PORT;
(async()=>{
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'2'},stdio:['ignore','pipe','pipe']});let svlog='';sv.stdout.on('data',d=>svlog+=d);sv.stderr.on('data',d=>svlog+=d);
 const saude=()=>fetch('http://localhost:'+PORT+'/saude').then(r=>r.json());
 for(let i=0;i<40;i++){try{await saude();break}catch{await sleep(250)}}
 const br=await chromium.launch();const errs=[];
 async function player(name,w=844,h=390){const pg=await (await br.newContext({viewport:{width:w,height:h},hasTouch:w<900})).newPage();pg.on('pageerror',e=>errs.push(name+': '+e.message));
  await pg.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent(SRV));await pg.waitForTimeout(900);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName',name);await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2200);await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());return pg}
 const A=await player('Ana',1000,560),B=await player('Beto');
 await A.evaluate(()=>{equipChampion(2,false)});await B.evaluate(()=>{equipChampion(4,false)});
 await A.evaluate(()=>OnlineV45.open());
 ok(await A.evaluate(()=>!!document.querySelector('[data-v45="quick"]')),'com o servidor configurado aparece o botão "Partida rápida"');
 await A.click('[data-v45="quick"]');await sleep(1200);
 ok(await A.evaluate(()=>OnlineV45.state.view==='queue'&&/Procurando/.test(document.querySelector('.v45-qtitle').textContent)),'sozinho na fila: "Procurando um rival…"');
 ok((await saude()).fila===1,'o servidor mostra 1 jogador na fila');
 await B.evaluate(()=>OnlineV45.open());await B.click('[data-v45="quick"]');
 await A.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight',null,{timeout:20000});await B.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight',null,{timeout:20000});
 const ia=await A.evaluate(()=>({p:p.skin,b:b.skin,mode:OnlineV45.state.mode,rival:OnlineV45.state.them.name})),ib=await B.evaluate(()=>({p:p.skin,b:b.skin,rival:OnlineV45.state.them.name}));
 ok(ia.p===2&&ia.b===4&&ib.p===4&&ib.b===2&&ia.mode==='server'&&ia.rival==='Beto'&&ib.rival==='Ana','os dois são pareados: Ana (Ronin) × Beto (Eclipse), cada um controla o seu');
 const sh=await saude();ok(sh.partidas===1&&sh.fila===0&&sh.jogadores===2,`servidor: ${sh.partidas} partida, ${sh.jogadores} jogadores, fila ${sh.fila}`);
 await sleep(1000);
 const pos=async()=>({a:await A.evaluate(()=>({me:[p.x,p.y],riv:[b.x,b.y]})),b:await B.evaluate(()=>({me:[p.x,p.y],riv:[b.x,b.y]}))});
 let q=await pos();ok(Math.hypot(q.a.me[0]-q.b.riv[0],q.a.me[1]-q.b.riv[1])<20&&Math.hypot(q.b.me[0]-q.a.riv[0],q.b.me[1]-q.a.riv[1])<20&&q.a.me[0]<q.b.me[0],'as duas telas mostram os campeões nos mesmos lugares (Ana à esquerda, Beto à direita)');
 // Ana anda: o servidor move e o Beto vê
 const bx0=await B.evaluate(()=>b.x);await A.evaluate(()=>{joy={x:0,y:1}});await sleep(900);await A.evaluate(()=>{joy={x:0,y:0}});await sleep(500);
 const by1=await B.evaluate(()=>b.y);q=await pos();
 ok(Math.abs(by1-280)>60&&Math.hypot(q.a.me[0]-q.b.riv[0],q.a.me[1]-q.b.riv[1])<30,`Ana anda e o Beto vê (${Math.round(Math.abs(by1-280))} px; diferença entre as telas ${Math.hypot(q.a.me[0]-q.b.riv[0],q.a.me[1]-q.b.riv[1]).toFixed(1)})`);
 // habilidade de um aparece no outro
 const n0=await B.evaluate(()=>OnlineV46.match.acts);await A.evaluate(()=>{p.cd=p.cd.map(()=>0);p.mp=120;cast(p,p.kit[0])});await sleep(600);
 ok(await B.evaluate(n=>OnlineV46.match.acts>n,n0),'habilidade da Ana é repetida na tela do Beto (via servidor)');
 // dano pelo servidor: Ana corre até o Beto e solta habilidades
 await A.evaluate(()=>{joy={x:1,y:0}});let dano=false;
 for(let i=0;i<40&&!dano;i++){await A.evaluate(()=>{p.cd=p.cd.map(()=>0);p.mp=120;cast(p,p.kit[0])});await sleep(350);dano=await B.evaluate(()=>p.hp<1000)}
 await A.evaluate(()=>{joy={x:0,y:0}});await sleep(400);
 const hpB=await B.evaluate(()=>p.hp),hpA=await A.evaluate(()=>b.hp);
 ok(dano&&Math.abs(hpA-hpB)<80,`o dano da Ana chega ao Beto pela vida do servidor (Beto vê ${hpB}; Ana vê ${hpA})`);
 // rodadas: acaba a rodada com o gancho de teste (vida do Beto = 0)
 const roundEnd=async(slotLoses)=>{await A.evaluate(s=>OnlineV45.send({t:'teste',hp0:s===0?0:undefined,hp1:s===1?0:undefined}),slotLoses)};
 let rodadas=0;
 const visivel=pg=>pg.evaluate(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none');
 for(let k=0;k<4&&!(await visivel(A));k++){
  // espera a rodada (nova) começar de verdade nos dois e a luta estar valendo
  await A.waitForFunction(()=>state==='fight'&&p.hp>0&&b.hp>0,null,{timeout:20000}).catch(()=>{});
  await B.waitForFunction(()=>state==='fight'&&p.hp>0&&b.hp>0,null,{timeout:20000}).catch(()=>{});
  if(process.env.DBG)console.log('DBG antes do KO',rodadas+1,JSON.stringify(await A.evaluate(()=>({st:state,t:Math.round(time),hp:[Math.round(p.hp),Math.round(b.hp)],round:(document.body.innerText.match(/ROUND \d/)||[])[0]}))),'| B',JSON.stringify(await B.evaluate(()=>({st:state,t:Math.round(time),hp:[Math.round(p.hp),Math.round(b.hp)]}))));
  await sleep(500);await roundEnd(1);rodadas++;
  // a sequência de K.O. leva ~5 s: espera o fim da rodada (resultado final ou nova contagem)
  await A.waitForFunction(()=>state==='count'||getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:20000}).catch(()=>{});
 }
 await A.waitForFunction(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:20000}).catch(()=>{});
 await B.waitForFunction(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:20000}).catch(()=>{});
 if(process.env.DBG||!(await visivel(B)))console.log('DBG B:',JSON.stringify(await B.evaluate(()=>OnlineV46.match.diag)),'\nDBG B estado:',JSON.stringify(await B.evaluate(()=>({st:state,hp:[Math.round(p.hp),Math.round(b.hp)],rd:OnlineV46.match.roundDone,on:OnlineV46.match.on,out:getComputedStyle(document.querySelector('#outcome')).display,paused:document.querySelector('#pause').style.display,t:Math.round(time)}))),'| A:',JSON.stringify(await A.evaluate(()=>({st:state,out:getComputedStyle(document.querySelector('#outcome')).display}))));
 const ta=await A.evaluate(()=>document.querySelector('#resultTitle').textContent),tb=await B.evaluate(()=>document.querySelector('#resultTitle').textContent);
 ok(/é sua/.test(ta)&&/aprendizado/.test(tb),`melhor de 3 em ${rodadas} rodadas: Ana vê "${ta}" e Beto vê "${tb}"`);
 ok(await B.evaluate(()=>/XP/.test(document.querySelector('#resultText').textContent)),'o perdedor também recebe XP de conta');
 await sleep(500);ok((await saude()).partidasTerminadas>=1,'o servidor registrou a partida como terminada');
 ok(await A.evaluate(()=>document.querySelector('#rematch').textContent==='Procurar outro rival'&&document.querySelector('#resultHub').textContent==='Sair'),'tela de resultado: "Procurar outro rival" e "Sair"');
 // jogar de novo: os dois voltam à fila e são pareados de novo
 await A.click('#rematch');await sleep(500);await B.click('#rematch');
 await A.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight',null,{timeout:25000});await B.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight',null,{timeout:25000});
 ok(true,'"Procurar outro rival": os dois voltam à fila e entram numa nova partida');
 // saída no meio da luta
 await B.close();
 await A.waitForFunction(()=>/saiu/.test(OnlineV45.state.err),null,{timeout:8000}).catch(()=>{});
 ok(await A.evaluate(()=>/saiu/.test(OnlineV45.state.err)&&!OnlineV46.match.on),'se o rival sai no meio da luta, o outro volta com o aviso');
 await sleep(800);const f=await saude();ok(f.partidas===0,`a partida é encerrada no servidor (ativas: ${f.partidas})`);
 ok(f.erros===0&&f.ticksTarde<=3,`saúde do servidor: erros ${f.erros}, ticks atrasados ${f.ticksTarde} de ${f.ticks}, tick médio ${f.tickMedio} ms`);
 ok(!errs.length,'sem erros de JavaScript nos navegadores '+errs.slice(0,3).join(' | '));
 await br.close();sv.kill();process.exit(process.exitCode||0);
})();
