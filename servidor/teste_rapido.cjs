// Fumaça: dois clientes Node entram na fila, recebem a partida, mandam comandos e recebem o estado.
const WebSocket=require('ws');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const url=process.argv[2]||'ws://localhost:8787';
function cliente(nome,hero){return new Promise(res=>{const ws=new WebSocket(url);const c={ws,nome,msgs:{},snaps:0,ult:null,match:null,fim:false};
 ws.on('open',()=>{ws.send(JSON.stringify({t:'hello',v:3,p:{name:nome,hero,lv:3,tier:1,league:'Prata'}}));ws.send(JSON.stringify({t:'fila'}))});
 ws.on('message',d=>{const m=JSON.parse(d);c.msgs[m.t]=(c.msgs[m.t]||0)+1;if(m.t==='snap'){c.snaps++;c.ult=m}if(m.t==='match')c.match=m;if(m.t==='over')c.fim=m});
 ws.on('close',()=>{c.fechou=true});res(c)})}
(async()=>{
 const A=await cliente('Ana',2),B=await cliente('Beto',4);
 await sleep(4000);
 console.log('match A:',JSON.stringify(A.match),'\nmatch B slot:',B.match?.slot,'rival:',B.match?.them?.name);
 // Ana anda para a direita, Beto usa habilidade
 A.ws.send(JSON.stringify({t:'in',x:1,y:0,l:1,a:0,g:0}));await sleep(1500);
 B.ws.send(JSON.stringify({t:'act',f:'cast',a:3.14,x:0,y:0,args:[]}));await sleep(300);
 const s=A.ult;console.log('estado A: estado',s?.st,'| meu x,y',s?.g.x,s?.g.y,'| rival',s?.h.x,s?.h.y,'| snaps',A.snaps,B.snaps,'| msgs A',JSON.stringify(A.msgs));
 const r=await fetch('http://localhost:8787/saude').then(r=>r.json());console.log('saude:',JSON.stringify(r));
 A.ws.close();B.ws.close();await sleep(500);process.exit(0)})();
