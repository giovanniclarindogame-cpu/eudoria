// Revanche no online: os mesmos jogadores jogam de novo (mesmas vagas). Com humanos, só começa quando TODOS pedem; contra bot, na hora.
// Também confere a tela de resultado: um único "Procurar outro rival", layout dentro da tela, "O rival saiu".
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8787,SRV='ws://localhost:'+PORT;
(async()=>{
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'2',ESPERA_BOT:'1500',DEBUG_REV:process.env.DEBUG_REV||''},stdio:process.env.DEBUG_REV?['ignore','inherit','inherit']:'ignore'});
 for(let i=0;i<50;i++){try{await fetch('http://localhost:'+PORT+'/saude');break}catch{await sleep(200)}}
 const br=await chromium.launch();const errs=[];
 async function jogador(nome,hero,vp={width:915,height:412}){const pg=await (await br.newContext({viewport:vp})).newPage();pg.on('pageerror',e=>errs.push(nome+': '+e.message));
  await pg.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
  await pg.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent(SRV));await pg.waitForTimeout(900);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName',nome);await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2000);await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());
  await pg.evaluate(h=>equipChampion(h,false),hero);return pg}
 const busca=async(pg)=>{await pg.evaluate(()=>{InicioV40.choose('duelo');showScreen('home')});await sleep(300);await pg.click('[data-v40-play]')};
 const naSala=pg=>pg.waitForFunction(()=>OnlineV45.state.fase==='sala'&&!(document.querySelector('#onlineV45')?.hidden??true),null,{timeout:40000});
 const emLuta=pg=>pg.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight',null,{timeout:60000});
 const resultadoVisivel=pg=>pg.evaluate(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none');
 // termina a luta: acaba as rodadas com o gancho de teste (vida do jogador de vaga 1 = 0)
 async function terminar(A,alvo=1){for(let k=0;k<5&&!(await resultadoVisivel(A));k++){await A.waitForFunction(()=>state==='fight'&&p.hp>0&&b.hp>0,null,{timeout:20000}).catch(()=>{});await sleep(500);await A.evaluate(s=>OnlineV45.send({t:'teste',hp0:s===0?0:undefined,hp1:s===1?0:undefined}),alvo);await sleep(2600)}
  await A.waitForFunction(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:30000});await sleep(500)}
 const botoes=pg=>pg.evaluate(()=>[...document.querySelectorAll('#outcome .dialog>button')].filter(b=>b.offsetParent).map(b=>({id:b.id,t:b.textContent.trim(),dis:b.disabled,cls:b.className})));

 /* ===== 1) dois humanos ===== */
 const A=await jogador('Ana',2),B=await jogador('Beto',4);
 await busca(A);await sleep(300);await busca(B);await naSala(A);await naSala(B);
 const vaga0=await Promise.all([A,B].map(pg=>pg.evaluate(()=>({slot:OnlineV45.state.sala.slot,rival:OnlineV45.state.sala.ps.map(x=>x.name).join('/')}))));
 for(const pg of [A,B]){await pg.click('[data-v45="ready"]');await sleep(150)}
 await emLuta(A);await emLuta(B);
 await terminar(A,1);await B.waitForFunction(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:20000});await sleep(400);
 const bA=await botoes(A),bB=await botoes(B);
 ok(bA.filter(b=>/outro rival/i.test(b.t)).length===1,`resultado: só UM botão "Procurar outro rival" (${bA.map(b=>b.t).join(' | ')})`);
 ok(bA[0]&&/Revanche/.test(bA.find(b=>b.id==='rematch').t)&&/Sair/.test(bA.find(b=>b.id==='resultHub').t),'resultado: botões Revanche, Procurar outro rival, Compartilhar e Sair');
 const caixa=await A.evaluate(()=>{const d=document.querySelector('#outcome .dialog').getBoundingClientRect();return{t:Math.round(d.top),b:Math.round(d.bottom),h:innerHeight,l:Math.round(d.left),r:Math.round(d.right),w:innerWidth}});
 ok(caixa.t>=0&&caixa.b<=caixa.h&&caixa.l>=0&&caixa.r<=caixa.w,`resultado: o cartão cabe inteiro na tela de celular (topo ${caixa.t}, base ${caixa.b} de ${caixa.h})`);
 await A.screenshot({path:'/tmp/claude-0/resultado_novo.png'});
 // Ana pede revanche; Beto vê que ela quer
 await A.click('#rematch');await sleep(700);
 const a1=(await botoes(A)).find(b=>b.id==='rematch'),b1=(await botoes(B)).find(b=>b.id==='rematch');
 ok(/Esperando/.test(a1.t)&&a1.dis,`Ana pediu a revanche: o botão dela mostra "${a1.t}" e fica parado`);
 ok(/rival quer/i.test(b1.t)&&/rev-quer/.test(b1.cls)&&!b1.dis,`Beto vê "${b1.t}" e o botão pulsa`);
 ok(await A.evaluate(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none'),'a revanche NÃO começa enquanto só um pediu');
 await B.screenshot({path:'/tmp/claude-0/resultado_quer.png'});
 // Beto aceita: os dois voltam à sala de escolha, nas mesmas vagas e contra os mesmos jogadores
 await B.click('#rematch');
 await naSala(A);await naSala(B);
 const vaga1=await Promise.all([A,B].map(pg=>pg.evaluate(()=>({slot:OnlineV45.state.sala.slot,rival:OnlineV45.state.sala.ps.map(x=>x.name).join('/'),res:getComputedStyle(document.querySelector('#outcome')).display}))));
 ok(vaga1.every((v,i)=>v.slot===vaga0[i].slot&&v.rival===vaga0[i].rival),`revanche: mesmas vagas e mesmos jogadores (Ana=vaga ${vaga1[0].slot}, Beto=vaga ${vaga1[1].slot})`);
 ok(vaga1.every(v=>v.res==='none'),'revanche: a tela de resultado fecha e a sala de escolha aparece');
 for(const pg of [A,B]){await pg.click('[data-v45="ready"]');await sleep(150)}
 await emLuta(A);await emLuta(B);
 const novo=await Promise.all([A,B].map(pg=>pg.evaluate(()=>({st:state,hp:[Math.round(p.hp),Math.round(b.hp)],round:(document.body.innerText.match(/ROUND \d/)||[])[0]}))));
 ok(novo.every(n=>n.st==='fight'&&n.hp[0]>=900&&n.hp[1]>=900),`a nova luta começa do zero nos dois (vida ${novo.map(n=>n.hp.join('x')).join(' e ')})`);
 // 2) o rival sai: quem esperava vê "O rival saiu"
 await terminar(A,1);await B.waitForFunction(()=>getComputedStyle(document.querySelector('#outcome')).display!=='none',null,{timeout:20000});await sleep(400);
 await A.click('#rematch');await sleep(600);
 await B.evaluate(()=>document.querySelector('#resultHub').click());await sleep(900);
 const a2=(await botoes(A)).find(b=>b.id==='rematch');
 ok(/saiu/i.test(a2.t)&&a2.dis,`o rival saiu: o botão da Ana mostra "${a2.t}" e não deixa esperar à toa`);
 await A.screenshot({path:'/tmp/claude-0/resultado_saiu.png'});
 await A.context().close();await B.context().close();await sleep(500);

 /* ===== 3) contra bot: revanche na hora ===== */
 const C=await jogador('Caio',6);
 await busca(C);await naSala(C);await C.click('[data-v45="ready"]');await emLuta(C);
 const rivalBot=await C.evaluate(()=>OnlineV45.state.sala.ps.map(x=>x.name).join('/'));
 await terminar(C,1);
 await C.click('#rematch');await naSala(C);
 const rivalBot2=await C.evaluate(()=>OnlineV45.state.sala.ps.map(x=>x.name).join('/'));
 ok(rivalBot===rivalBot2&&/Bot /.test(rivalBot2),`contra bot a revanche é imediata e o rival é o mesmo (${rivalBot2})`);
 await C.click('[data-v45="ready"]');await emLuta(C);ok(true,'e a luta da revanche contra o bot começa');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,2).join('|'));
 await br.close();sv.kill();
})();
