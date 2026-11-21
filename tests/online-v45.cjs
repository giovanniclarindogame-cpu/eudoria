// Online v45: criar/entrar em sala pelo PeerJS (servidor local), link ?sala=, sala cheia, sala de espera (perfil, campeão, pronto,
// contagem), saída do outro jogador, e "Jogar perto" pelo QR (WebRTC sem servidor, códigos colados) + QR legível.
// Precisa do pacote "peer" (npm i peer) no NODE_PATH: sobe um servidor PeerJS em localhost:9000.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const {ExpressPeerServer}=require('peer'),express=require('express'),app=express(),srv=app.listen(9000,'127.0.0.1');app.use('/',ExpressPeerServer(srv,{path:'/'}));await sleep(500);
 const br=await chromium.launch({args:['--use-fake-ui-for-media-stream']});
 const errs=[];
 async function player(name,w,h,extra=''){
  const ctx=await br.newContext({viewport:{width:w,height:h},hasTouch:w<900,permissions:['clipboard-read','clipboard-write']});
  const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(name+': '+e.message));
  await pg.goto('http://localhost:8000/index.html?allheroes=1&peerhost=localhost:9000'+extra);await pg.waitForTimeout(900);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName',name);await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2200);
  await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());return pg;
 }
 const A=await player('Ana',844,390),B=await player('Beto',1280,720);
 // a tela de salas entre amigos continua existindo por dentro (OnlineV45.open), mas não tem mais cartão: o Duelo 1×1 vai direto à seleção
 await A.evaluate(()=>OnlineV45.open());await A.waitForTimeout(500);
 ok(await A.evaluate(()=>!document.querySelector('#onlineV45').hidden&&document.querySelectorAll('[data-v45="create"],[data-v45="join"],[data-v45="near"]').length===3),'a tela com Criar sala, Entrar na sala e Jogar perto abre');
 await A.click('[data-v45="create"]');
 await A.waitForFunction(()=>OnlineV45.state.code.length===5,null,{timeout:10000});
 const code=await A.evaluate(()=>OnlineV45.state.code);
 ok(/^[A-Z2-9]{5}$/.test(code)&&await A.evaluate(()=>document.querySelectorAll('.v45-code i').length===5),'Criar sala mostra o código de 5 letras: '+code);
 await B.evaluate(()=>OnlineV45.open());await B.click('[data-v45="join"]');await B.fill('#v45Code',code.toLowerCase());await B.click('[data-v45="enter"]');
 await A.waitForFunction(()=>OnlineV45.state.view==='lobby'&&OnlineV45.state.them,null,{timeout:10000});await B.waitForFunction(()=>OnlineV45.state.view==='lobby'&&OnlineV45.state.them,null,{timeout:10000});
 const la=await A.evaluate(()=>({them:OnlineV45.state.them?.name,cards:document.querySelectorAll('.v46-chip:not(.wait)').length})),lb=await B.evaluate(()=>OnlineV45.state.them?.name);
 ok(la.them==='Beto'&&lb==='Ana'&&la.cards===2,'os dois entram na sala de espera e veem o nome um do outro');
 await sleep(2500);
 ok(await A.evaluate(()=>OnlineV45.state.rtt>0),'tempo de resposta (ping) medido: '+await A.evaluate(()=>OnlineV45.state.rtt)+' ms');
 await B.click('[data-v45-hero="4"]');await sleep(500);
 ok(await A.evaluate(()=>OnlineV45.state.them.hero===4&&/Eclipse/.test(document.querySelector('.v46-name.red').textContent)),'campeão escolhido pelo amigo aparece na tela do outro');
 // terceiro jogador: sala cheia
 const C=await player('Caio',844,390);await C.evaluate(c=>OnlineV45.open({code:c}),code);
 await C.waitForFunction(()=>/cheia/.test(OnlineV45.state.err),null,{timeout:10000}).catch(()=>{});
 ok(await C.evaluate(()=>/cheia/.test(OnlineV45.state.err)),'terceiro jogador recebe "sala cheia"');
 ok(await A.evaluate(()=>OnlineV45.state.them?.name==='Beto'),'a sala continua com os dois primeiros');
 await A.click('[data-v45="ready"]');await sleep(300);
 ok(await B.evaluate(()=>OnlineV45.state.theirReady===true),'"Pronto" de um aparece no outro');
 await B.click('[data-v45="ready"]');
 await A.waitForFunction(()=>window.OnlineV46?.match.on,null,{timeout:8000});await B.waitForFunction(()=>window.OnlineV46?.match.on,null,{timeout:8000});
 ok(true,'com os dois prontos: contagem 3-2-1 e a luta começa nos dois');
 await A.evaluate(()=>OnlineV46.backToLobby(false));await B.evaluate(()=>OnlineV46.backToLobby(false));await sleep(300);
 ok(await A.evaluate(()=>OnlineV45.state.view==='lobby'&&!document.querySelector('#onlineV45').hidden),'voltar da luta leva de novo para a sala');
 // saída
 await B.evaluate(()=>OnlineV45.close());
 await A.waitForFunction(()=>OnlineV45.state.view==='home'&&/saiu/.test(OnlineV45.state.err),null,{timeout:8000}).catch(()=>{});
 ok(await A.evaluate(()=>OnlineV45.state.view==='home'&&/saiu/.test(OnlineV45.state.err)),'quando o amigo sai, o outro volta com o aviso "saiu da sala"');
 // código errado
 await B.evaluate(()=>OnlineV45.open());await B.click('[data-v45="join"]');await B.fill('#v45Code','ZZZZZ');await B.click('[data-v45="enter"]');
 await B.waitForFunction(()=>/não encontrada|não respondeu/.test(OnlineV45.state.err),null,{timeout:20000}).catch(()=>{});
 ok(await B.evaluate(()=>/não encontrada|não respondeu/.test(OnlineV45.state.err)),'código que não existe: "Sala não encontrada"');
 await B.evaluate(()=>OnlineV45.close());await A.evaluate(()=>OnlineV45.close());
 // link ?sala=
 await A.evaluate(()=>OnlineV45.open());await A.click('[data-v45="create"]');await A.waitForFunction(()=>OnlineV45.state.code.length===5,null,{timeout:10000});
 const code2=await A.evaluate(()=>OnlineV45.state.code);
 const D=await player('Duda',1280,720,'&sala='+code2);
 await D.waitForFunction(()=>OnlineV45.state.view==='lobby'&&OnlineV45.state.them,null,{timeout:15000}).catch(()=>{});
 ok(await D.evaluate(()=>OnlineV45.state.them?.name==='Ana'),'abrir o link ?sala= entra direto na sala');
 await D.evaluate(()=>OnlineV45.close());await A.evaluate(()=>OnlineV45.close());
 // Jogar perto (QR): sem servidor, colando os códigos
 await A.evaluate(()=>OnlineV45.open());await A.click('[data-v45="near"]');await A.click('[data-v45="nearHost"]');
 await A.waitForFunction(()=>OnlineV45.state.offerCode,null,{timeout:10000});await A.waitForSelector('.v45-qr-canvas');
 const offer=await A.evaluate(()=>OnlineV45.state.offerCode);
 const qrOk=await A.evaluate(async()=>{await new Promise((ok,bad)=>{const s=document.createElement('script');s.src='js/lib/jsqr-1.4.0.js';s.onload=ok;s.onerror=bad;document.head.appendChild(s)});const c=document.querySelector('.v45-qr-canvas'),g=c.getContext('2d'),d=g.getImageData(0,0,c.width,c.height);return jsQR(d.data,c.width,c.height)?.data===OnlineV45.state.offerCode});
 ok(qrOk,`QR do anfitrião é legível e contém a oferta (${offer.length} caracteres)`);
 await B.evaluate(()=>OnlineV45.open());await B.click('[data-v45="near"]');await B.click('[data-v45="nearGuest"]');
 await B.click('.v45-paste summary');await B.fill('#v45Paste',offer);await B.click('[data-v45="pasteOffer"]');
 await B.waitForFunction(()=>OnlineV45.state.answerCode,null,{timeout:10000});
 const answer=await B.evaluate(()=>OnlineV45.state.answerCode);
 await A.click('.v45-paste summary');await A.fill('#v45Paste',offer);await A.click('[data-v45="pasteAnswer"]');await sleep(200);
 ok(await A.evaluate(()=>/próprio QR/.test(OnlineV45.state.err)),'anfitrião lendo o próprio QR recebe aviso');
 await A.fill('#v45Paste',answer);await A.click('[data-v45="pasteAnswer"]');
 await A.waitForFunction(()=>OnlineV45.state.view==='lobby'&&OnlineV45.state.them,null,{timeout:10000}).catch(()=>{});
 await B.waitForFunction(()=>OnlineV45.state.view==='lobby'&&OnlineV45.state.them,null,{timeout:10000}).catch(()=>{});
 ok(await A.evaluate(()=>OnlineV45.state.them?.name==='Beto'&&OnlineV45.state.mode==='near')&&await B.evaluate(()=>OnlineV45.state.them?.name==='Ana'),'Jogar perto: conectam pelo QR sem servidor e entram na sala');
 if(process.env.SHOT){await A.screenshot({path:process.env.SHOT+'/on_lobby_844.png'});await B.screenshot({path:process.env.SHOT+'/on_lobby_1280.png'})}
 await B.evaluate(()=>OnlineV45.close());await A.waitForFunction(()=>OnlineV45.state.view==='home',null,{timeout:8000}).catch(()=>{});
 ok(await A.evaluate(()=>OnlineV45.state.view==='home'),'Jogar perto: saída do amigo também é avisada');
 ok(!errs.length,'sem erros de JavaScript '+errs.slice(0,3).join(' | '));
 await br.close();srv.close?.();process.exit(process.exitCode||0);
})();
