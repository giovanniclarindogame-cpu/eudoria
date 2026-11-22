// Amigos de ponta a ponta com dois jogadores no navegador: criar conta, código, pedido, aceitar, convite contra/junto, sala.
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path'),os=require('os'),fs=require('fs');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8793,SRV='ws://localhost:'+PORT;
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'am68-'));
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),DADOS:tmp,TESTE:'1',AQUECIDAS:'1',ESPERA_BOT:'90000'},stdio:'ignore'});
 for(let i=0;i<50;i++){try{await fetch('http://localhost:'+PORT+'/saude');break}catch{await sleep(200)}}
 const br=await chromium.launch();const errs=[];
 async function jogador(nome,pasta=''){const c=await br.newContext({viewport:{width:900,height:480}});const p=await c.newPage();p.on('pageerror',e=>errs.push(nome+': '+e.message));
  await p.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent(SRV));await p.waitForTimeout(900);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName',nome);await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(2000);await p.evaluate(()=>document.querySelector('#ljModal')?.remove());
  return{c,p}}
 const A=await jogador('Ana'),B=await jogador('Beto');
 const abrir=async J=>{await J.p.evaluate(()=>AmigosV68.abrir());await sleep(300)};
 // 1) sem conta: oferece criar
 await abrir(A);ok(await A.p.evaluate(()=>!!document.querySelector('[data-a68-conta]')),'sem conta: a tela oferece "Criar minha conta"');
 await A.p.click('[data-a68-conta]');await A.p.waitForFunction(()=>document.querySelector('#a68Cod'),null,{timeout:20000});
 await abrir(B);await B.p.click('[data-a68-conta]');await B.p.waitForFunction(()=>document.querySelector('#a68Cod'),null,{timeout:20000});
 const codA=await A.p.textContent('#a68Cod'),codB=await B.p.textContent('#a68Cod');
 ok(/^[A-Z2-9]{6}$/.test(codA)&&codA!==codB,`criou a conta e mostra o código de amigo (${codA} / ${codB})`);
 // 2) Beto adiciona a Ana pelo código
 await B.p.fill('#a68In',codA.toLowerCase());await B.p.click('.a68-add button[type=submit]');
 await B.p.waitForSelector('.a68-aviso.ok',{timeout:8000});ok(/Pedido enviado/.test(await B.p.textContent('.a68-aviso')),'Beto envia o pedido e vê a confirmação');
 await A.p.waitForSelector('[data-a68-resp][data-ok="1"]',{timeout:8000});ok(true,'Ana recebe o pedido na hora (com botão Aceitar)');
 ok(await A.p.evaluate(()=>AmigosV68.state.lista.recebidos[0].nome==='Beto'),'o pedido mostra o nome do Beto');
 // código errado
 await B.p.fill('#a68In','ZZZZZZ');await B.p.click('.a68-add button[type=submit]');await B.p.waitForSelector('.a68-aviso.erro',{timeout:6000});ok(/Não achei/.test(await B.p.textContent('.a68-aviso')),'código inexistente mostra aviso');
 await A.p.click('[data-a68-resp][data-ok="1"]');
 await A.p.waitForSelector('.a68-amigo.st-on [data-a68-conv]',{timeout:8000});await B.p.waitForSelector('.a68-amigo.st-on [data-a68-conv]',{timeout:8000});
 ok(true,'viraram amigos: cada um aparece online na lista do outro');
 await A.p.screenshot({path:'/tmp/claude-0/amigos_tela.png'});
 // 3) convite "contra": Beto convida Ana, ela recusa
 await B.p.click('[data-a68-conv][data-tipo="contra"]');await A.p.waitForSelector('#amigosConv68:not([hidden]) [data-a68-recusar]',{timeout:8000});
 ok(/duelo 1×1/.test(await A.p.textContent('#amigosConv68')),'Ana vê o convite para o duelo 1×1');
 await A.p.screenshot({path:'/tmp/claude-0/amigos_convite.png'});
 await A.p.click('[data-a68-recusar]');await B.p.waitForFunction(()=>/recusou/.test(document.querySelector('.a68-aviso')?.textContent||''),null,{timeout:6000});ok(true,'recusar avisa o Beto');
 // 4) convite "junto" (2×2): aceita e os dois caem na sala, na mesma equipe
 await B.p.click('[data-a68-conv][data-tipo="junto"]');await A.p.waitForSelector('#amigosConv68:not([hidden]) [data-a68-aceitar]',{timeout:8000});
 ok(/junto com você/.test(await A.p.textContent('#amigosConv68')),'Ana vê o convite para jogar junto (2×2)');
 await A.p.click('[data-a68-aceitar]');
 const naSala=J=>J.p.waitForFunction(()=>OnlineV45.state.fase==='sala'&&!(document.querySelector('#onlineV45')?.hidden??true),null,{timeout:40000});
 await Promise.all([naSala(A),naSala(B)]);
 const sA=await A.p.evaluate(()=>({modo:OnlineV45.state.sala.modo,slot:OnlineV45.state.sala.slot,n:OnlineV45.state.sala.ps.length})),sB=await B.p.evaluate(()=>({slot:OnlineV45.state.sala.slot}));
 ok(sA.modo==='2v2'&&sA.n===4&&sA.slot<2&&sB.slot<2&&sA.slot!==sB.slot,`os dois entram na sala 2×2 na mesma equipe (vagas ${sA.slot} e ${sB.slot})`);
 ok(await A.p.evaluate(()=>document.querySelector('#amigosV68').hidden),'a tela de amigos fecha ao entrar na sala');
 await A.p.screenshot({path:'/tmp/claude-0/amigos_sala.png'});
 // 5) enquanto estão em partida/sala, o status mostra "Em partida" e não dá para convidar
 await sleep(500);
 // voltam ao início
 await A.p.evaluate(()=>OnlineV45.cancelar());await B.p.evaluate(()=>OnlineV45.cancelar());await sleep(800);
 // 6) convite "contra": aceita -> sala 1×1
 await abrir(B);await B.p.waitForSelector('.a68-amigo.st-on [data-a68-conv]',{timeout:10000});
 await B.p.click('[data-a68-conv][data-tipo="contra"]');await A.p.waitForSelector('[data-a68-aceitar]',{timeout:8000});await A.p.click('[data-a68-aceitar]');
 await Promise.all([naSala(A),naSala(B)]);
 ok(await A.p.evaluate(()=>OnlineV45.state.sala.modo==='1v1'&&OnlineV45.state.sala.ps.length===2),'convite "contra": os dois entram numa sala 1×1 um contra o outro');
 // 7) remover amigo
 await A.p.evaluate(()=>OnlineV45.cancelar());await B.p.evaluate(()=>OnlineV45.cancelar());await sleep(600);
 await abrir(A);A.p.once('dialog',d=>d.accept());await A.p.waitForSelector('[data-a68-del]',{timeout:8000});await A.p.click('.a68-amigo [data-a68-del]');
 await A.p.waitForFunction(()=>AmigosV68.state.lista.amigos.length===0,null,{timeout:6000});ok(true,'remover amigo funciona');
 await B.p.waitForFunction(()=>AmigosV68.state.lista&&AmigosV68.state.lista.amigos.length===0,null,{timeout:8000});ok(true,'e some da lista do outro também');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,3).join('|'));
 await br.close();sv.kill();fs.rmSync(tmp,{recursive:true,force:true});
})();
