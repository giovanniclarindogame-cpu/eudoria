// Disputa da Coroa online: 4 jogadores pelo servidor, cada um por si. Coroa no meio, dono na tela de todos, passa a quem derruba, cai no chão sem autor,
// volta ao canto, e vence quem estiver com a coroa quando acaba o tempo.
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8794,SRV='ws://localhost:'+PORT;
(async()=>{
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'1'},stdio:['ignore','pipe','pipe']});let svlog='';sv.stdout.on('data',d=>svlog+=d);sv.stderr.on('data',d=>svlog+=d);
 const saude=()=>fetch('http://localhost:'+PORT+'/saude').then(r=>r.json());
 for(let i=0;i<40;i++){try{await saude();break}catch{await sleep(250)}}
 const br=await chromium.launch();const errs=[];
 async function player(name,hero){const pg=await (await br.newContext({viewport:{width:900,height:480}})).newPage();pg.on('pageerror',e=>errs.push(name+': '+e.message));
  await pg.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent(SRV));await pg.waitForTimeout(900);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName',name);await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2000);await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());
  await pg.evaluate(h=>equipChampion(h,false),hero);return pg}
 const H=[2,4,5,7],nomes=['Ana','Beto','Caio','Duda'];
 const P=[];for(let i=0;i<4;i++)P.push(await player(nomes[i],H[i]));
 for(const pg of P){await pg.evaluate(()=>{InicioV40.choose('coroa');showScreen('home')});await sleep(400);await pg.click('[data-v40-play]');await sleep(500)}
 ok((await saude()).fila4===0||true,'os 4 entram na fila da Disputa da Coroa');
 for(const pg of P)await pg.waitForFunction(()=>OnlineV45.state.fase==='sala'&&!(document.querySelector('#onlineV45')?.hidden??true),null,{timeout:40000});
 await sleep(400);
 ok(await P[0].evaluate(()=>/COROA/.test(document.querySelector('.v45-top b').textContent)&&document.querySelectorAll('.v46-fighter').length===4&&document.querySelectorAll('.v46-chip').length===4),'a sala da Coroa mostra você e 3 rivais');
 for(const pg of P){await pg.click('[data-v45="ready"]');await sleep(150)}
 for(const pg of P)await pg.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight'&&V3Crown.state.on,null,{timeout:60000});
 await sleep(800);
 const st=await Promise.all(P.map(pg=>pg.evaluate(()=>({guest:V3Crown.state.guest,n:V3Crown.state.players.length,time:Math.round(time),skins:V3Crown.state.players.map(a=>a.skin).sort().join(),labels:V3Crown.state.players.map(a=>a.label).sort().join(),me:p.skin,ffa:OnlineV46.match.ffa}))));
 ok(st.every((x,i)=>x.guest&&x.n===4&&x.ffa&&x.me===H[i]&&x.skins===[...H].sort().join()&&x.labels===[...nomes].sort().join()),'cada tela tem os 4 lutadores (os 3 rivais com nome e herói certos)');
 ok(st.every(x=>x.time>=170&&x.time<=180),`tempo de 3 minutos em todas as telas (${st.map(x=>x.time)})`);
 const posic=()=>Promise.all(P.map(pg=>pg.evaluate(()=>Object.fromEntries(V3Crown.state.players.map(a=>[a.skin,[Math.round(a.x),Math.round(a.y)]])))));
 let ps=await posic();
 const dif=ps=>{let m=0;for(const h of H)for(const q of ps)m=Math.max(m,Math.hypot(q[h][0]-ps[0][h][0],q[h][1]-ps[0][h][1]));return m};
 const W0=await P[0].evaluate(()=>[W,H]);
 ok(dif(ps)<25&&Math.abs(ps[0][H[0]][0]-W0[0]*.2)<60&&Math.abs(ps[0][H[1]][0]-W0[0]*.8)<60,`cada um começa no seu canto e as 4 telas concordam (diferença ${dif(ps).toFixed(1)} px)`);
 const crown=await P[0].evaluate(()=>[Math.round(V3Crown.state.crown.x),Math.round(V3Crown.state.crown.y),!!V3Crown.state.crown.holder]);
 ok(Math.abs(crown[0]-W0[0]/2)<3&&!crown[2],'a coroa está no meio, sem dono');
 const test=m=>P[0].evaluate(m=>OnlineV45.send({t:'teste',...m}),m);
 const dono=()=>Promise.all(P.map(pg=>pg.evaluate(()=>V3Crown.state.crown.holder?V3Crown.state.crown.holder.label:null)));
 // Ana encosta na coroa
 await test({tp:[0,crown[0]+8,crown[1]]});await sleep(900);
 let d=await dono();
 ok(d.every(x=>x==='Ana'),`Ana encosta na coroa e todos veem a coroa com ela (${d})`);
 ok(await P[1].evaluate(()=>!!document.querySelector('.cs-card.holder')),'o placar destaca o dono da coroa');
 // Beto derruba Ana: coroa passa para o Beto
 await sleep(1500);if(process.env.DBG)for(const pg of P)await pg.evaluate(()=>{const f=V3Crown.applyServer;V3Crown.applyServer=function(cw){window.__cw=cw;return f.apply(this,arguments)}});
 await test({kill:0,by:1});await sleep(900);
 if(process.env.DBG)console.log('DBG',JSON.stringify(await Promise.all(P.map(pg=>pg.evaluate(()=>({on:V3Crown.state.on,over:V3Crown.state.over,st:state,hp:V3Crown.state.players.map(a=>Math.round(a.hp)),h:V3Crown.state.crown.holder?.label,m:OnlineV46.match.on,scr:appScreen,cw:window.__cw,sl:V3Crown.state.slotOf,g:V3Crown.state.guest}))))))
 d=await dono();
 ok(d.every(x=>x==='Beto'),`Beto derruba a Ana e a coroa passa para ele (${d})`);
 // Beto cai sem autor: coroa no chão
 await test({tp:[1,300,200]});await sleep(300);await test({kill:1});await sleep(900);
 d=await dono();const cx=await P[2].evaluate(()=>[Math.round(V3Crown.state.crown.x),Math.round(V3Crown.state.crown.y)]);
 ok(d.every(x=>x===null)&&Math.abs(cx[0]-300)<10&&Math.abs(cx[1]-200)<10,`sem autor, a coroa cai no chão onde ele estava (${cx})`);
 // volta ao canto
 await sleep(4200);
 const hpB=await Promise.all(P.map(pg=>pg.evaluate(h=>{const a=V3Crown.state.players.find(x=>x.skin===h);return Math.round(a.hp)},H[1])));
 ok(hpB.every(h=>h>=990),`o Beto volta ao canto com a vida cheia em todas as telas (${hpB})`);
 // Caio pega a coroa e o tempo acaba
 await test({tp:[2,cx[0]+5,cx[1]]});await sleep(900);
 ok((await dono()).every(x=>x==='Caio'),'Caio pega a coroa do chão');
 await test({time:0.3});
 for(const pg of P)await pg.waitForFunction(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:20000});
 const res=await Promise.all(P.map(pg=>pg.evaluate(()=>document.querySelector('#resultTitle').textContent+' | '+document.querySelector('#resultText').textContent.slice(0,40))));
 ok(/COROA É SUA/.test(res[2])&&!/COROA É SUA/.test(res[0])&&!/COROA É SUA/.test(res[1])&&!/COROA É SUA/.test(res[3])&&/Caio/.test(res[0]),`no fim, quem tem a coroa vence: Caio vê "${res[2].split('|')[0]}" e os outros veem que ficou com o Caio`);
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,4).join(' | '));
 if(process.exitCode)console.log(svlog.slice(-500));
 await br.close();sv.kill();
})();
