// Equipes 2×2 pelo servidor: 4 jogadores na fila, partida montada, cada um vê os 4 nos lugares certos, movimento/ações chegam a todos,
// vida só pelo servidor, melhor de 3 (Ana+Duda × Beto+Caio) e resultado certo para cada lado.
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8791,SRV='ws://localhost:'+PORT;
(async()=>{
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'1'},stdio:['ignore','pipe','pipe']});let svlog='';sv.stdout.on('data',d=>svlog+=d);sv.stderr.on('data',d=>svlog+=d);
 const saude=()=>fetch('http://localhost:'+PORT+'/saude').then(r=>r.json());
 for(let i=0;i<40;i++){try{await saude();break}catch{await sleep(250)}}
 const br=await chromium.launch();const errs=[];
 async function player(name,hero){const pg=await (await br.newContext({viewport:{width:900,height:480}})).newPage();pg.on('pageerror',e=>errs.push(name+': '+e.message+' @ '+String(e.stack).split('\n').slice(1,3).join(' <- ')));
  await pg.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent(SRV));await pg.waitForTimeout(900);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName',name);await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2000);await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());
  await pg.evaluate(h=>equipChampion(h,false),hero);return pg}
 const H=[2,4,5,7];            // Ana, Beto, Caio, Duda
 const nomes=['Ana','Beto','Caio','Duda'];
 const P=[];for(let i=0;i<4;i++)P.push(await player(nomes[i],H[i]));
 const [A,B,C,D]=P;
 await A.evaluate(()=>{InicioV40.choose('equipes');showScreen('home')});await sleep(800);
 await A.click('[data-v40-play]');await sleep(900);
 ok(await A.evaluate(()=>OnlineV45.state.procurando&&OnlineV45.state.modo==='2v2'&&/PROCURANDO/.test(document.querySelector('[data-v40-play]').textContent)),'JOGAR no Equipes 2×2 vira "Procurando rivais…"');
 ok((await saude()).fila2===1,'o servidor mostra 1 jogador na fila de 2×2');
 for(const pg of [B,C,D]){await pg.evaluate(()=>{InicioV40.choose('equipes');showScreen('home')});await sleep(500);await pg.click('[data-v40-play]');await sleep(500)}
 for(const pg of P)await pg.waitForFunction(()=>OnlineV45.state.fase==='sala'&&!(document.querySelector('#onlineV45')?.hidden??true),null,{timeout:30000});
 await sleep(400);
 ok(await A.evaluate(()=>document.querySelectorAll('.v46-fighter').length===4&&document.querySelectorAll('.v46-chip').length===4&&/EQUIPES/.test(document.querySelector('.v45-top b').textContent)&&!!document.querySelector('.v46-vs svg')),'a sala de escolha do 2×2 mostra 4 lutadores, 4 jogadores e o emblema VS');
 await B.click('[data-v45-hero="4"]');await sleep(150);
 for(const pg of P){await pg.click('[data-v45="ready"]');await sleep(150)}
 for(const pg of P)await pg.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight',null,{timeout:60000});
 const sh=await saude();ok(sh.partidas===1&&sh.fila2===0&&sh.jogadores===4,`servidor: ${sh.partidas} partida de 2×2 com ${sh.jogadores} jogadores`);
 // cada tela: eu sou p; aliado = parceiro; b e rival = adversários
 const v=await Promise.all(P.map(pg=>pg.evaluate(()=>({me:p.skin,ally:actors[2].skin,en:[actors[1].skin,actors[3].skin].sort().join(),slot:OnlineV46.match.slot,x2:OnlineV46.match.x2,mode:matchMode,lab:[p.label,actors[2].label,actors[1].label,actors[3].label]}))));
 ok(v.every((x,i)=>x.x2&&x.mode==='2v2'&&x.me===H[i]),'os quatro estão no modo 2×2 e cada um controla o seu campeão');
 const slotsOk=v.map(x=>x.slot).sort().join()==='0,1,2,3';
 const mate={0:1,1:0,2:3,3:2};
 const teamOk=v.every((x,i)=>{const s=x.slot,m=mate[s],hm=H[v.findIndex(y=>y.slot===m)],foes=[0,1,2,3].filter(k=>Math.floor(k/2)!==Math.floor(s/2)).map(k=>H[v.findIndex(y=>y.slot===k)]).sort().join();return x.ally===hm&&x.en===foes});
 ok(slotsOk&&teamOk,`cada tela mostra o parceiro e os dois adversários certos (slots ${v.map(x=>x.slot)})`);
 ok(v.every(x=>x.lab.every(l=>nomes.includes(l))),'os nomes de todos aparecem em cada tela '+JSON.stringify(v[0].lab));
 await sleep(1200);
 // mesmas posições em todas as telas (por campeão)
 const posic=async()=>Promise.all(P.map(pg=>pg.evaluate(()=>Object.fromEntries(actors.map(a=>[a.skin,[Math.round(a.x),Math.round(a.y)]])))));
 let ps=await posic();
 const maxdif=(ps)=>{let m=0;for(const h of H)for(const q of ps){m=Math.max(m,Math.hypot(q[h][0]-ps[0][h][0],q[h][1]-ps[0][h][1]))}return m};
 ok(maxdif(ps)<25,`as quatro telas mostram todos nos mesmos lugares (diferença máx. ${maxdif(ps).toFixed(1)} px)`);
 // equipes em lados opostos: Ana e Duda juntas
 const lado=(pp,h)=>pp[h][0];
 ok(Math.abs(lado(ps[0],H[0])-lado(ps[0],H[3]))<80&&Math.abs(lado(ps[0],H[1])-lado(ps[0],H[2]))<80&&lado(ps[0],H[0])<lado(ps[0],H[1]),'Ana e Duda ficam de um lado, Beto e Caio do outro');
 // Caio (slot 3, equipe 1) anda: todos veem
 const idx=v.findIndex(x=>x.slot===3);const ca=P[idx],hc=H[idx];
 const y0=ps[0][hc][1];await ca.evaluate(()=>{joy={x:0,y:-1}});await sleep(900);await ca.evaluate(()=>{joy={x:0,y:0}});await sleep(600);
 ps=await posic();
 ok(Math.abs(ps[0][hc][1]-y0)>50&&maxdif(ps)<30,`Caio anda e os outros três veem (${Math.round(Math.abs(ps[0][hc][1]-y0))} px; diferença entre telas ${maxdif(ps).toFixed(1)})`);
 // animação de andar do rival: stride avança
 // habilidade de um aparece nos outros
 const n0=await Promise.all(P.map(pg=>pg.evaluate(()=>OnlineV46.match.acts)));
 await ca.evaluate(()=>{p.cd=p.cd.map(()=>0);p.mp=120;cast(p,p.kit[0])});await sleep(700);
 const n1=await Promise.all(P.map(pg=>pg.evaluate(()=>OnlineV46.match.acts)));
 ok(n1.every((n,i)=>i===idx||n>n0[i]),'a habilidade do Caio é repetida nas telas dos outros três');
 // vida só pelo servidor: tira vida do Beto (slot 2) no servidor e todos veem
 await A.evaluate(()=>OnlineV45.send({t:'teste',hps:[null,null,400,null]}));await sleep(700);
 const hpBeto=await Promise.all(P.map(pg=>pg.evaluate(h=>{const a=actors.find(x=>x.skin===h);return Math.round(a.hp)},H[1])));
 ok(hpBeto.every(h=>Math.abs(h-400)<40),`a vida do Beto no servidor (400) aparece em todas as telas (${hpBeto})`);
 // melhor de 3: equipe 0 (slots 0 e 1) vence duas rodadas
 const visivel=pg=>pg.evaluate(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none');
 for(let k=0;k<4&&!(await visivel(A));k++){
  for(const pg of P)await pg.waitForFunction(()=>state==='fight'&&p.hp>0,null,{timeout:25000}).catch(()=>{});
  await sleep(600);await A.evaluate(()=>OnlineV45.send({t:'teste',hps:[null,null,0,0]}));
  await A.waitForFunction(()=>state==='count'||getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:25000}).catch(()=>{});
 }
 for(const pg of P)await pg.waitForFunction(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:25000}).catch(()=>{});
 const res=await Promise.all(P.map(pg=>pg.evaluate(()=>document.querySelector('#resultTitle').textContent+' | '+(document.querySelector('#resultText').textContent.match(/Placar dos rounds: \d × \d/)||[''])[0])));
 const ganhou=t=>/é sua/.test(t),perdeu=t=>/aprendizado/.test(t);
 ok(ganhou(res[0])&&ganhou(res[3])&&perdeu(res[1])&&perdeu(res[2]),`resultado: Ana e Duda vencem, Beto e Caio perdem (${res.join(' ; ')})`);
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,4).join(' | '));
 if(process.exitCode)console.log(svlog.slice(-600));
 await br.close();sv.kill();
})();
