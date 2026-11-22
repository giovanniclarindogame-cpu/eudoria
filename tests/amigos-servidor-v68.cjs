// Sistema de amigos no servidor: código, pedido/aceite, presença, convites (contra / junto) e a partida entre amigos.
const { spawn } = require('child_process');const path=require('path'),os=require('os'),fs=require('fs');
const WebSocket=require(path.join(__dirname,'..','servidor','node_modules','ws'));
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8794,B='http://localhost:'+PORT,WS='ws://localhost:'+PORT;
let sv,tmp;
const iniciar=async()=>{sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),DADOS:tmp,TESTE:'1',AQUECIDAS:'1',ESPERA_BOT:'60000'},stdio:'ignore'});for(let i=0;i<50;i++){try{await fetch(B+'/saude');return}catch{await sleep(200)}}};
const criarConta=async nome=>{const r=await fetch(B+'/conta/criar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chaves:{'eldoria-champions-v1':JSON.stringify({profile:{name:nome}})}})});return (await r.json()).codigo};
// cliente: guarda todas as mensagens recebidas
function cli(conta,nome,{social=true,sala=false}={}){return new Promise(res=>{const ws=new WebSocket(WS),msgs=[],c={ws,msgs,
  envia:o=>ws.send(JSON.stringify(o)),
  espera:async(t,ms=4000,f=()=>true)=>{const fim=Date.now()+ms;while(Date.now()<fim){const i=msgs.findIndex(m=>m.t===t&&f(m));if(i>=0)return msgs.splice(i,1)[0];await sleep(40)}return null},
  tem:t=>msgs.some(m=>m.t===t),fecha:()=>ws.close()};
  ws.on('message',d=>msgs.push(JSON.parse(d)));
  ws.on('open',()=>{ws.send(JSON.stringify({t:'hello',v:3,build:9,social:social?1:undefined,sala:sala?1:undefined,conta,tok:'tok'+Math.random().toString(36).slice(2,12),p:{name:nome,lv:5,hero:2,photo:'h2',frame:'azul'}}));res(c)})})}
(async()=>{
 tmp=fs.mkdtempSync(path.join(os.tmpdir(),'amigos-'));await iniciar();
 const cA=await criarConta('Ana'),cB=await criarConta('Beto'),cC=await criarConta('Caio');
 const A=await cli(cA,'Ana'),B_=await cli(cB,'Beto'),C=await cli(cC,'Caio');
 ok(!!(await A.espera('hello'))&&!!(await B_.espera('hello')),'conexão social: hello ok');
 // sem conta não entra na conexão social
 const X=await cli(null,'Sem');ok(!!(await X.espera('erro')),'conexão social sem conta é recusada');
 A.envia({t:'amigos'});const la=await A.espera('amigos');B_.envia({t:'amigos'});const lb=await B_.espera('amigos');C.envia({t:'amigos'});const lc=await C.espera('amigos');
 ok(/^[A-Z2-9]{6}$/.test(la.cod)&&la.cod!==lb.cod,`cada conta tem um código de amigo (${la.cod} / ${lb.cod})`);
 // erros de pedido
 A.envia({t:'amigo_add',cod:'ZZZZZZ'});ok((await A.espera('amigo_res')).erro==='cod','código que não existe');
 A.envia({t:'amigo_add',cod:la.cod});ok((await A.espera('amigo_res')).erro==='proprio','não dá para adicionar a si mesmo');
 // pedido -> o outro vê -> aceita
 A.envia({t:'amigo_add',cod:lb.cod.toLowerCase()});const r1=await A.espera('amigo_res');ok(r1.ok===1&&r1.quem.nome==='Beto','pedido enviado (aceita minúsculas)');
 const pushB=await B_.espera('amigos',3000,m=>m.recebidos.length===1);ok(!!pushB&&pushB.recebidos[0].nome==='Ana','o outro recebe o pedido na hora');
 const pushA=await A.espera('amigos',3000,m=>m.enviados.length===1);ok(!!pushA,'quem pediu vê "aguardando"');
 A.envia({t:'amigo_add',cod:lb.cod});ok((await A.espera('amigo_res')).erro==='pedido','pedido repetido é recusado');
 B_.envia({t:'amigo_resp',id:pushB.recebidos[0].id,ok:1});const r2=await B_.espera('amigo_res');ok(r2.ok===1&&r2.aceito,'aceitar o pedido');
 const fa=await A.espera('amigos',3000,m=>m.amigos.length===1),fb=await B_.espera('amigos',3000,m=>m.amigos.length===1);
 ok(fa&&fb&&fa.amigos[0].nome==='Beto'&&fb.amigos[0].nome==='Ana'&&fa.recebidos.length+fa.enviados.length===0,'viraram amigos (mútuo) e os pedidos sumiram');
 ok(fa.amigos[0].st==='on'&&fa.amigos[0].lv===5,'status online e nível aparecem na lista');
 // pedido cruzado vira amizade na hora
 C.envia({t:'amigo_add',cod:la.cod});await C.espera('amigo_res');A.envia({t:'amigos'});const pa=await A.espera('amigos',3000,m=>m.recebidos.length===1);
 A.envia({t:'amigo_add',cod:lc.cod});const r3=await A.espera('amigo_res');ok(r3.ok===1&&r3.aceito,'se o outro já tinha pedido, adicionar vira amizade na hora');
 A.envia({t:'amigo_del',id:pa.recebidos[0].id});await A.espera('amigo_res');A.envia({t:'amigos'});ok((await A.espera('amigos',3000,m=>m.amigos.length===1))!==null,'remover amigo (Caio) deixa só o Beto');
 // convite: não amigo
 A.envia({t:'convite',id:pa.recebidos[0].id,tipo:'contra'});ok((await A.espera('convite_res')).erro==='amigo','convite para quem não é amigo é recusado');
 // convite contra -> recusa
 const idB=fa.amigos[0].id,idA=fb.amigos[0].id;
 A.envia({t:'convite',id:idB,tipo:'contra'});const env=await A.espera('convite_res');const cv=await B_.espera('convite');
 ok(env.st==='enviado'&&cv&&cv.tipo==='contra'&&cv.modo==='1v1'&&cv.de.nome==='Ana','convite "jogar contra" chega no amigo');
 B_.envia({t:'convite_resp',cid:cv.cid,ok:0});const rec=await A.espera('convite_res');ok(rec.st==='recusado','recusa avisa quem convidou');
 // convite junto -> aceita -> os dois vão para a sala
 A.envia({t:'convite',id:idB,tipo:'junto'});await A.espera('convite_res');const cv2=await B_.espera('convite');ok(cv2.modo==='2v2'&&cv2.tipo==='junto','convite "jogar junto" é 2×2');
 B_.envia({t:'convite_resp',cid:cv2.cid,ok:1});
 const irA=await A.espera('ir'),irB=await B_.espera('ir');ok(irA&&irB&&irA.cid===cv2.cid&&irA.modo==='2v2','aceitar manda "ir" para os dois');
 // cada um abre a conexão de jogo e pede a sala do convite
 const GA=await cli(cA,'Ana',{social:false,sala:true}),GB=await cli(cB,'Beto',{social:false,sala:true});await GA.espera('hello');await GB.espera('hello');
 GA.envia({t:'fila',modo:'2v2',cid:cv2.cid,p:{name:'Ana',lv:5,hero:2,photo:'h2',frame:'azul'}});
 const esp=await GA.espera('fila');ok(esp&&esp.amigo===1,'quem chega primeiro espera o amigo');
 // uma terceira pessoa com o mesmo cid não entra
 const GC=await cli(cC,'Caio',{social:false,sala:true});await GC.espera('hello');GC.envia({t:'fila',modo:'2v2',cid:cv2.cid});ok(!!(await GC.espera('nada')),'quem não foi convidado não entra na sala do convite');
 GB.envia({t:'fila',modo:'2v2',cid:cv2.cid,p:{name:'Beto',lv:5,hero:4,photo:'h4',frame:'azul'}});
 const sa=await GA.espera('sala',8000),sb=await GB.espera('sala',8000);
 ok(sa&&sb&&sa.modo==='2v2'&&sa.ps.length===4&&sa.slot<2&&sb.slot<2&&sa.slot!==sb.slot,`os dois entram na sala 2×2 na MESMA equipe (vagas ${sa&&sa.slot} e ${sb&&sb.slot}); o resto é bot`);
 ok(sa&&sa.ps.slice(2).every(p=>p.bot),'os rivais são bots');
 // status "em partida" aparece para os amigos
 await sleep(300);C.envia({t:'amigos'});
 // convite para amigo ocupado / offline
 GA.fecha();GB.fecha();await sleep(500);
 B_.fecha();await sleep(500);A.envia({t:'convite',id:idB,tipo:'contra'});ok((await A.espera('convite_res')).erro==='off','convite para amigo offline avisa');
 // a amizade sobrevive a reiniciar o servidor
 A.fecha();C.fecha();sv.kill();await sleep(800);await iniciar();
 const A2=await cli(cA,'Ana');await A2.espera('hello');A2.envia({t:'amigos'});const l2=await A2.espera('amigos');ok(l2.amigos.length===1&&l2.amigos[0].nome==='Beto'&&l2.cod===la.cod,'amizade e código continuam depois de reiniciar o servidor');
 ok(l2.amigos[0].st==='off','e o status volta a "offline" para quem não está conectado');
 A2.fecha();sv.kill();fs.rmSync(tmp,{recursive:true,force:true});
})();
