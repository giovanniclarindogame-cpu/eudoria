// Online v46: luta 1×1 entre dois jogadores (anfitrião manda na luta). Servidor PeerJS local (pacote "peer" no NODE_PATH).
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const {ExpressPeerServer}=require('peer'),express=require('express'),app=express(),srv=app.listen(9000,'127.0.0.1');app.use('/',ExpressPeerServer(srv,{path:'/'}));await sleep(400);
 const br=await chromium.launch();const errs=[];
 async function player(name,w,h){const pg=await (await br.newContext({viewport:{width:w,height:h},hasTouch:w<900})).newPage();pg.on('pageerror',e=>errs.push(name+': '+e.message));
  await pg.goto('http://localhost:8000/index.html?allheroes=1&peerhost=localhost:9000');await pg.waitForTimeout(900);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName',name);await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2200);await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());return pg}
 const A=await player('Ana',1280,720),B=await player('Beto',844,390);
 await A.evaluate(()=>OnlineV45.open());await A.click('[data-v45="create"]');await A.waitForFunction(()=>OnlineV45.state.code.length===5,null,{timeout:10000});
 const code=await A.evaluate(()=>OnlineV45.state.code);
 await B.evaluate(c=>OnlineV45.open({code:c}),code);
 await A.waitForFunction(()=>OnlineV45.state.them,null,{timeout:10000});await B.waitForFunction(()=>OnlineV45.state.them,null,{timeout:10000});
 await A.click('[data-v45-hero="2"]');await B.click('[data-v45-hero="4"]');await sleep(400);
 const sel=await B.evaluate(()=>({sprites:document.querySelectorAll('#onlineV45 canvas.v46-sprite').length,tiles:document.querySelectorAll('.v46-tile').length,foe:document.querySelector('.v46-tile.foe')?.dataset.v45Hero,names:[...document.querySelectorAll('.v46-name')].map(e=>e.textContent)}));
 ok(sel.sprites===2&&sel.tiles===10&&sel.foe==='2'&&/Eclipse/.test(sel.names[0])&&/Ronin/.test(sel.names[1]),'sala no estilo da seleção offline: dois bonecos, 10 rostos, rival marcado, nomes nas faixas');
 if(process.env.SHOT){await A.screenshot({path:process.env.SHOT+'/v46_sel_1280.png'});await B.screenshot({path:process.env.SHOT+'/v46_sel_844.png'})}
 await A.click('[data-v45="ready"]');await B.click('[data-v45="ready"]');
 await A.waitForFunction(()=>OnlineV46.match.on,null,{timeout:8000});await B.waitForFunction(()=>OnlineV46.match.on,null,{timeout:8000});
 const s1=await A.evaluate(()=>({p:p.skin,b:b.skin,host:OnlineV46.match.role,pause:getComputedStyle(document.querySelector('#pauseBtn')).display})),s2=await B.evaluate(()=>({p:p.skin,b:b.skin,role:OnlineV46.match.role}));
 ok(s1.p===2&&s1.b===4&&s2.p===4&&s2.b===2&&s1.host==='host'&&s2.role==='guest','cada um controla o próprio campeão (Ana: Ronin × Eclipse; Beto: Eclipse × Ronin)');
 ok(s1.pause==='none','sem botão de pausa na luta online');
 await A.waitForFunction(()=>state==='fight',null,{timeout:8000});await B.waitForFunction(()=>state==='fight',null,{timeout:8000});await sleep(400);
 const same=async()=>{const a=await A.evaluate(()=>({h:[p.x,p.y],g:[b.x,b.y]})),g=await B.evaluate(()=>({h:[b.x,b.y],g:[p.x,p.y]}));return{dh:Math.hypot(a.h[0]-g.h[0],a.h[1]-g.h[1]),dg:Math.hypot(a.g[0]-g.g[0],a.g[1]-g.g[1]),a,g}};
 let d=await same();ok(d.dh<25&&d.dg<25,`os dois veem os campeões no mesmo lugar (diferença ${d.dh.toFixed(1)} / ${d.dg.toFixed(1)})`);
 // amigo anda: o anfitrião vê
 const gx0=await A.evaluate(()=>b.x);const gy0=await A.evaluate(()=>b.y);await B.evaluate(()=>{joy={x:0,y:-1}});await sleep(900);await B.evaluate(()=>{joy={x:0,y:0}});await sleep(500);
 const gy1=await A.evaluate(()=>b.y);d=await same();
 ok(gy0-gy1>60&&d.dg<40,`o amigo anda e o anfitrião vê o movimento (${Math.round(gy0-gy1)} px; diferença entre as telas ${d.dg.toFixed(1)})`);
 const moved=await A.evaluate(()=>b.y);
 // anfitrião anda: o amigo vê
 const hy0=await B.evaluate(()=>b.y);await A.evaluate(()=>{joy={x:0,y:1}});await sleep(900);await A.evaluate(()=>{joy={x:0,y:0}});await sleep(400);
 const hy1=await B.evaluate(()=>b.y);ok(hy1-hy0>60,`o anfitrião anda e o amigo vê (${Math.round(hy1-hy0)} px)`);
 // habilidade do amigo chega ao anfitrião
 const acts0=await A.evaluate(()=>OnlineV46.match.acts);
 await B.evaluate(()=>{p.cd=p.cd.map(()=>0);p.mp=120;cast(p,p.kit[0])});await sleep(500);
 ok(await A.evaluate(n=>OnlineV46.match.acts>n,acts0),'habilidade usada pelo amigo acontece no aparelho do anfitrião');
 const acts1=await B.evaluate(()=>OnlineV46.match.acts);
 await A.evaluate(()=>{p.cd=p.cd.map(()=>0);p.mp=120;cast(p,p.kit[0])});await sleep(500);
 ok(await B.evaluate(n=>OnlineV46.match.acts>n,acts1),'habilidade do anfitrião aparece no aparelho do amigo');
 if(process.env.SHOT){await sleep(150);await A.screenshot({path:process.env.SHOT+'/v46_luta_host.png'});await B.screenshot({path:process.env.SHOT+'/v46_luta_amigo.png'})}
 // vida: quem vale é o anfitrião
 await sleep(1200);
 const hpB0=await B.evaluate(()=>p.hp);await A.evaluate(()=>{b.inv=0;b.guard=false;hit(b,200,p,0,0)});await sleep(400);
 const hpB1=await B.evaluate(()=>p.hp),hpA=await A.evaluate(()=>b.hp);
 ok(hpB1<hpB0&&Math.abs(hpB1-hpA)<2,`dano do anfitrião aparece na vida do amigo (${hpB0} → ${hpB1}; anfitrião vê ${hpA})`);
 const hostHp=await A.evaluate(()=>p.hp);await B.evaluate(()=>{hit(b,300,p,0,0)});await sleep(30);
 ok(await B.evaluate(h=>Math.abs(b.hp-h)<60,hostHp),'no aparelho do amigo um golpe local não muda a vida sozinho (espera o anfitrião)');
 // nocaute: anfitrião decide, os dois veem o resultado
 // nocautes até acabar o duelo (melhor de 3): o anfitrião decide, os dois acompanham as rodadas
 let rounds=0;
 for(let k=0;k<4;k++){
  const out=await A.evaluate(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none');if(out)break;
  await A.waitForFunction(()=>state==='fight'&&b.hp>0,null,{timeout:12000}).catch(()=>{});
  await A.evaluate(()=>{b.hp=5;b.inv=0;b.guard=false;hit(b,200,p,0,0)});rounds++;
  await A.waitForFunction(()=>state!=='fight'||getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:12000}).catch(()=>{});
  const sync=await B.evaluate(()=>state);console.log('     rodada',rounds,'anfitrião:',await A.evaluate(()=>state),'amigo:',sync);
 }
 await A.waitForFunction(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:12000}).catch(()=>{});
 await B.waitForFunction(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:12000}).catch(()=>{});
 const ta=await A.evaluate(()=>document.querySelector('#resultTitle').textContent),tb=await B.evaluate(()=>document.querySelector('#resultTitle').textContent);
 ok(/é sua/.test(ta)&&/aprendizado/.test(tb),`duelo em ${rounds} rodadas: anfitrião vê vitória ("${ta}") e o amigo derrota ("${tb}")`);
 ok(await B.evaluate(()=>/XP/.test(document.querySelector('#resultText').textContent)),'o amigo também ganha XP de conta pela partida');
 if(process.env.SHOT){await A.screenshot({path:process.env.SHOT+'/v46_end_1280.png'})}
 await B.click('#rematch');await sleep(400);
 ok(await B.evaluate(()=>!OnlineV46.match.on&&OnlineV45.state.view==='lobby'&&!document.querySelector('#onlineV45').hidden&&state==='select'),'"Revanche" volta para a sala com o amigo');
 ok(await A.evaluate(()=>document.querySelector('#resultHub').textContent==='Sair da sala'&&/Revanche/.test(document.querySelector('#rematch').textContent)),'tela de resultado com Revanche e Sair da sala');
 await A.click('#resultHub');await sleep(300);
 ok(await A.evaluate(()=>document.querySelector('#onlineV45').hidden&&!OnlineV46.match.on),'"Sair" sai da sala');
 await B.waitForFunction(()=>/saiu/.test(OnlineV45.state.err),null,{timeout:6000}).catch(()=>{});
 ok(await B.evaluate(()=>/saiu/.test(OnlineV45.state.err)),'o outro recebe o aviso de que o amigo saiu');
 ok(!errs.length,'sem erros de JavaScript '+errs.slice(0,3).join(' | '));
 await br.close();srv.close();process.exit(process.exitCode||0);
})();
