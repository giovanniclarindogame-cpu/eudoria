// Modo manutenção: a página mostra só a tela de manutenção (o jogo nem carrega), tem atalho ?semmanut=1, volta sozinha quando acaba,
// ignora arquivo ausente; e o servidor recusa partidas novas (com aviso) sem derrubar quem já está conectado.
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path');const fs=require('fs');const os=require('os');
const WebSocket=require(path.join(__dirname,'..','servidor','node_modules','ws'));
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 /* ---------- página ---------- */
 const b=await chromium.launch();const errs=[];
 const novo=async()=>{const p=await (await b.newContext({viewport:{width:915,height:412}})).newPage();p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});return p};
 const resp=(p,corpo,status=200)=>p.route('**/manutencao.json*',r=>r.fulfill({status,contentType:'application/json',body:typeof corpo==='string'?corpo:JSON.stringify(corpo)}));
 const ON={ativo:true,titulo:'EM MANUTENÇÃO',mensagem:'Estamos atualizando o Boss.',volta:'18h30'};
 // 1) desligada: o jogo abre
 let p=await novo();await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>typeof CHAMPIONS!=='undefined'&&!window.__MANUTENCAO),'com a manutenção desligada o jogo abre normalmente');
 await p.close();
 // 2) ligada: só a tela de manutenção
 p=await novo();await resp(p,ON);await p.goto('http://localhost:8000/index.html',{waitUntil:'commit'});await p.waitForTimeout(2000);
 const r=await p.evaluate(()=>({jogo:typeof CHAMPIONS!=='undefined',flag:!!window.__MANUTENCAO,h1:document.querySelector('h1')?.textContent,txt:document.querySelector('main')?.innerText.replace(/\s+/g,' '),botao:!!document.getElementById('manutVer'),scripts:document.querySelectorAll('script[src]').length}));
 console.log('MANUT',JSON.stringify(r));
 ok(!r.jogo&&r.flag,'com a manutenção ligada o jogo NÃO carrega');
 ok(r.h1==='EM MANUTENÇÃO'&&/Estamos atualizando o Boss/.test(r.txt)&&/18h30/.test(r.txt)&&r.botao,'a tela mostra título, mensagem, previsão e o botão de verificar');
 await p.screenshot({path:'/tmp/claude-0/manut_0.png'});
 // 3) volta sozinha quando acaba (botão)
 await p.unroute('**/manutencao.json*');await resp(p,{ativo:false});
 await p.click('#manutVer');await p.waitForFunction(()=>typeof CHAMPIONS!=='undefined',null,{timeout:20000});
 ok(true,'quando a manutenção acaba, "Verificar agora" abre o jogo');
 await p.close();
 // 4) ainda em manutenção: botão avisa e continua na tela
 p=await novo();await resp(p,ON);await p.goto('http://localhost:8000/index.html',{waitUntil:'commit'});await p.waitForTimeout(1500);
 await p.click('#manutVer');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>/Ainda em manutenção/.test(document.getElementById('manutSt').textContent)&&typeof CHAMPIONS==='undefined'),'se ainda não acabou, o botão avisa e a tela continua');
 await p.close();
 // 5) atalho de teste
 p=await novo();await resp(p,ON);await p.goto('http://localhost:8000/index.html?semmanut=1');await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>typeof CHAMPIONS!=='undefined'&&!window.__MANUTENCAO),'?semmanut=1 abre o jogo mesmo em manutenção');
 await p.close();
 // 6) arquivo ausente ou quebrado: abre o jogo
 for(const [nome,corpo,st] of [['ausente','',404],['quebrado','{ativo:',200],['sem campo','{"x":1}',200]]){
  p=await novo();await resp(p,corpo,st);await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(1200);
  ok(await p.evaluate(()=>typeof CHAMPIONS!=='undefined'),`arquivo ${nome}: o jogo abre normalmente`);await p.close();
 }
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2));
 await b.close();

 /* ---------- servidor ---------- */
 const arq=path.join(os.tmpdir(),'manut-teste-'+process.pid+'.json');fs.writeFileSync(arq,JSON.stringify({ativo:true,mensagem:'Voltamos já',volta:'19h'}));
 const PORT=8798;const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'1',MANUTENCAO_ARQ:arq},stdio:'ignore'});
 for(let i=0;i<40;i++){try{await fetch('http://localhost:'+PORT+'/saude');break}catch{await sleep(250)}}
 try{
  const s1=await (await fetch('http://localhost:'+PORT+'/saude')).json();
  ok(s1.manutencao===true,'/saude informa que está em manutenção');
  const conectar=()=>new Promise(res=>{const ws=new WebSocket('ws://localhost:'+PORT),msgs=[];ws.on('message',d=>msgs.push(JSON.parse(d)));ws.on('open',()=>{ws.send(JSON.stringify({t:'hello',v:3,p:{name:'Teste',hero:2,lv:3,tier:1,league:'Prata'}}));res({ws,msgs})})});
  const c=await conectar();await sleep(300);
  ok(c.msgs.some(m=>m.t==='hello'&&m.ok),'quem conecta durante a manutenção não é derrubado (recebe o hello)');
  c.ws.send(JSON.stringify({t:'fila'}));await sleep(500);
  const e=c.msgs.find(m=>m.t==='erro'&&m.m==='manutencao');
  ok(!!e&&e.texto==='Voltamos já'&&e.volta==='19h','entrar na fila é recusado com o aviso de manutenção');
  ok(!c.msgs.some(m=>m.t==='match'||m.t==='sala'),'nenhuma partida começa durante a manutenção');
  fs.writeFileSync(arq,JSON.stringify({ativo:false}));await sleep(3500);
  const s2=await (await fetch('http://localhost:'+PORT+'/saude')).json();
  ok(s2.manutencao===false,'ao desligar, o servidor volta ao normal sem reiniciar');
  c.msgs.length=0;c.ws.send(JSON.stringify({t:'fila'}));await sleep(600);
  ok(!c.msgs.some(m=>m.t==='erro'&&m.m==='manutencao'),'com a manutenção desligada a fila volta a aceitar jogadores');
  c.ws.close();
 }finally{sv.kill();try{fs.unlinkSync(arq)}catch{}}
})();
