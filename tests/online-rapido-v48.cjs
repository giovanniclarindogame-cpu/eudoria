// Online v48: canal rápido sem garantia (posição/comandos) e atraso igual para os dois, com rede ruim simulada
// (?netlag=160 ms de ida e volta, ?netloss=0.25 dos pacotes do canal rápido perdidos). Servidor PeerJS local (pacote "peer").
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const {ExpressPeerServer}=require('peer'),express=require('express'),app=express(),srv=app.listen(9000,'127.0.0.1');app.use('/',ExpressPeerServer(srv,{path:'/'}));await sleep(400);
 const br=await chromium.launch();const errs=[];
 async function player(name){const pg=await (await br.newContext({viewport:{width:1000,height:560}})).newPage();pg.on('pageerror',e=>errs.push(name+': '+e.message));
  await pg.goto('http://localhost:8000/index.html?allheroes=1&peerhost=localhost:9000&netlag=160&netloss=0.25');await pg.waitForTimeout(900);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName',name);await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2200);await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());return pg}
 const A=await player('Ana'),B=await player('Beto');
 await A.evaluate(()=>OnlineV45.open());await A.click('[data-v45="create"]');await A.waitForFunction(()=>OnlineV45.state.code.length===5,null,{timeout:10000});
 await B.evaluate(c=>OnlineV45.open({code:c}),await A.evaluate(()=>OnlineV45.state.code));
 await A.waitForFunction(()=>OnlineV45.state.them,null,{timeout:15000});await B.waitForFunction(()=>OnlineV45.state.them,null,{timeout:15000});
 ok(await A.evaluate(()=>OnlineV45.state.fast?.readyState==='open')&&await B.evaluate(()=>OnlineV45.state.fast?.readyState==='open'),'canal rápido (sem ordem e sem reenvio) aberto nos dois');
 await sleep(2500);
 await A.click('[data-v45="ready"]');await sleep(300);await B.click('[data-v45="ready"]');
 await A.waitForFunction(()=>OnlineV46.match.on&&state==='fight',null,{timeout:20000});await B.waitForFunction(()=>OnlineV46.match.on&&state==='fight',null,{timeout:20000});await sleep(1500);
 const rtt=await A.evaluate(()=>OnlineV45.state.rtt),d=await A.evaluate(()=>OnlineV46.hostDelay());
 ok(d>=60&&d<=90,`atraso igual ligado no anfitrião: ${Math.round(d)} ms (ida e volta ${rtt} ms)`);
 ok(await B.evaluate(()=>OnlineV46.hostDelay()===0),'quem entrou não ganha atraso extra');
 ok(await B.evaluate(()=>OnlineV45.state.fastIn>20),'estado da luta chega pelo canal rápido ('+await B.evaluate(()=>OnlineV45.state.fastIn)+' pacotes)');
 // movimento do anfitrião espera o atraso
 const y0=await A.evaluate(()=>p.y);await A.evaluate(()=>{joy={x:0,y:1}});
 const early=await A.evaluate(()=>new Promise(r=>setTimeout(()=>r(p.y),25)));
 await sleep(500);const late=await A.evaluate(()=>p.y);await A.evaluate(()=>{joy={x:0,y:0}});
 ok(Math.abs(early-y0)<2&&late-y0>40,`anfitrião começa a andar depois do atraso igual (25 ms: ${Math.round(early-y0)} px; 500 ms: ${Math.round(late-y0)} px)`);
 // habilidade do anfitrião também espera
 const r=await A.evaluate(()=>new Promise(res=>{p.cd=p.cd.map(()=>0);p.mp=120;const id=p.kit[0];cast(p,id);const now=p.cd[id];setTimeout(()=>res([now,p.cd[id]]),200)}));
 ok(r[0]===0&&r[1]>0,`habilidade do anfitrião vale depois do atraso (recarga logo após: ${r[0]}; 200 ms depois: ${r[1].toFixed(2)})`);
 // com 25% de perda, as posições continuam batendo
 await sleep(800);await B.evaluate(()=>{joy={x:1,y:0}});await A.evaluate(()=>{joy={x:-1,y:0}});await sleep(900);await B.evaluate(()=>{joy={x:0,y:0}});await A.evaluate(()=>{joy={x:0,y:0}});await sleep(900);
 const a=await A.evaluate(()=>({h:[p.x,p.y],g:[b.x,b.y]})),g=await B.evaluate(()=>({h:[b.x,b.y],g:[p.x,p.y]}));
 const dh=Math.hypot(a.h[0]-g.h[0],a.h[1]-g.h[1]),dg=Math.hypot(a.g[0]-g.g[0],a.g[1]-g.g[1]);
 ok(dh<25&&dg<35,`com 25% dos pacotes perdidos as posições continuam batendo (diferença ${dh.toFixed(1)} / ${dg.toFixed(1)} px)`);
 // nocaute ainda funciona (vai pelo canal garantido)
 for(let k=0;k<4;k++){if(await A.evaluate(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none'))break;
  await A.waitForFunction(()=>state==='fight'&&b.hp>0,null,{timeout:15000}).catch(()=>{});await A.evaluate(()=>{b.hp=5;b.inv=0;b.guard=false;hit(b,200,p,0,0)});
  await A.waitForFunction(()=>state!=='fight'||getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:15000}).catch(()=>{})}
 await B.waitForFunction(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:15000}).catch(()=>{});
 ok(/é sua/.test(await A.evaluate(()=>resultTitle.textContent))&&/aprendizado/.test(await B.evaluate(()=>resultTitle.textContent)),'duelo termina certo nos dois com rede ruim');
 ok(!errs.length,'sem erros de JavaScript '+errs.slice(0,3).join(' | '));
 await br.close();srv.close();process.exit(process.exitCode||0);
})();
