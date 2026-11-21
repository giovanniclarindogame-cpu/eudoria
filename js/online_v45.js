'use strict';
/*
 * Online v45 — etapa 1: salas para jogar 1×1 com um amigo.
 *  - CRIAR SALA / ENTRAR NA SALA (internet): PeerJS (js/lib/peerjs-1.5.5.min.js). Quem cria recebe um código de 5 letras
 *    (o id no PeerJS é "eldoria-sala-<código>"), pode copiar ou compartilhar o link (?sala=CÓDIGO abre direto a sala).
 *    O servidor público do PeerJS só apresenta os dois aparelhos; depois a conexão é direta (WebRTC).
 *  - JOGAR PERTO (QR code, sem internet): WebRTC sem servidor. O anfitrião mostra um QR com a "oferta", o amigo lê com a câmera,
 *    mostra o QR da "resposta" e o anfitrião lê. Funciona no mesmo Wi-Fi ou no roteador de um dos celulares.
 *    Sem câmera: os mesmos códigos podem ser copiados e colados.
 *  - SALA DE ESPERA: os dois veem foto, moldura, nível de conta e campeão um do outro; cada um escolhe o campeão e marca "Pronto".
 *    Com os dois prontos, contagem 3-2-1. A luta online sincronizada é a etapa 2 (ainda não feita): por enquanto aparece o aviso
 *    com o tempo de resposta da conexão.
 *  - ?peerhost=host:porta usa outro servidor PeerJS (testes locais).
 */
(function(){
const $q=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LIB={peer:'js/lib/peerjs-1.5.5.min.js',qr:'js/lib/qrcode-generator-2.0.4.js',jsqr:'js/lib/jsqr-1.4.0.js'};
const PREFIX='eldoria-sala-',ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',CODE_LEN=5,PROTO=2;
// servidor de partidas (fila de partida rápida): endereço em js/config_servidor.js ou ?servidor=ws://...; vazio = recurso desligado
const SERVIDOR=(new URLSearchParams(location.search).get('servidor')||window.ELDORIA_SERVIDOR||'').trim(),PROTO_SRV=3;
const loaded={};
function loadLib(k){return loaded[k]||(loaded[k]=new Promise((ok,bad)=>{const s=document.createElement('script');s.src=LIB[k];s.onload=ok;s.onerror=()=>{loaded[k]=null;bad(new Error('não carregou '+k))};document.head.appendChild(s)}))}
const newCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(CODE_LEN)),b=>ABC[b%ABC.length]).join('');
const cleanCode=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/[O]/g,'0').replace(/[I]/g,'1').slice(0,CODE_LEN);
const ICO={
 back:'<path d="M19 6l-10 10 10 10"/>',plus:'<path d="M16 6v20M6 16h20"/>',door:'<path d="M8 28V5h14v23M8 28h18M17 17h1"/><path d="M22 5l5 3v20"/>',
 qr:'<rect x="5" y="5" width="8" height="8" rx="1"/><rect x="19" y="5" width="8" height="8" rx="1"/><rect x="5" y="19" width="8" height="8" rx="1"/><path d="M19 19h3v3h-3zM24 24h3v3h-3zM19 26v1M26 19v1"/>',
 copy:'<rect x="10" y="10" width="16" height="17" rx="2"/><path d="M6 21V7a2 2 0 0 1 2-2h12"/>',share:'<circle cx="24" cy="7" r="3.5"/><circle cx="8" cy="16" r="3.5"/><circle cx="24" cy="25" r="3.5"/><path d="M11 14.5l10-6M11 17.5l10 6"/>',
 cam:'<path d="M4 10h6l2-3h8l2 3h6v15H4z"/><circle cx="16" cy="17" r="5"/>',wifi:'<path d="M4 12a17 17 0 0 1 24 0M8 16.5a11 11 0 0 1 16 0M12 21a5 5 0 0 1 8 0"/><circle cx="16" cy="25" r="1.4"/>',
 check:'<path d="M6 17l6 6 14-14"/>',bolt:'<path d="M18 3L7 18h8l-2 11 12-16h-8z"/>',x:'<path d="M8 8l16 16M24 8 8 24"/>'
};
const svg=k=>`<svg class="v40i" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k]}</svg>`;

/* ---------- estado ---------- */
const S={view:'home',mode:null,role:null,code:'',peer:null,conn:null,pc:null,me:null,them:null,ready:false,theirReady:false,rtt:null,err:'',pingT:0,count:0,scan:null,offerCode:'',answerCode:'',busy:''};

/* ---------- perfil enviado ao outro jogador ---------- */
function myHero(){try{const id=currentChampion().id,o=owned();return o.includes(id)?id:o[0]}catch{return 0}}
function profile(){
 const C=window.ContaV42,key=C?.photoKey?.()||'auto';
 let tier=0,league='Bronze';try{const pts=V3Liga.rec('1v1').points||0;tier=V3Liga.divOf(pts);league=V3Liga.rankName(pts)}catch{}
 return{v:PROTO,name:account.profile?.name||'Lutador',lv:C?.rec?.().lv||1,frame:C?.frameId?.()||'azul',photo:key==='auto'?'h'+(S.me?.hero??myHero()):key,hero:S.me?.hero??myHero(),tier,league};
}
// online: só vale o que é da conta (comprados + os 3 grátis da semana). A fase de testes que libera tudo no resto do jogo não vale aqui
function owned(){try{
 if(ALL_HEROES_DEBUG)return CHAMPIONS.map(c=>c.id);
 const ok=new Set([...(account.ownedHeroes||[]),...heroesFreeThisWeek()]);
 const l=CHAMPIONS.filter(c=>ok.has(c.id)).map(c=>c.id);return l.length?l:[0]}catch{return[0]}}

/* ---------- transporte (PeerJS ou canal WebRTC do QR) ---------- */
// ?netlag=ms simula atraso de rede (só para testes): cada mensagem sai metade desse tempo depois
const NETLAG=Math.max(0,+new URLSearchParams(location.search).get('netlag')||0);
function send(o){try{if(S.conn?.send){if(NETLAG){const c=S.conn;setTimeout(()=>{try{c.send(o)}catch{}},NETLAG/2)}else S.conn.send(o);return true}}catch(e){console.warn('[Eldoria online] envio',e)}return false}
/* canal rápido (v48): um segundo canal na MESMA conexão WebRTC, sem ordem e sem reenvio (como UDP nos jogos). Posição e comandos
   vão por ele: um pacote perdido não trava os seguintes; o próximo já traz a informação nova. Golpes, rodadas e resultado
   continuam no canal garantido. "negotiated" com o mesmo id nos dois lados: abre sem nova troca de sinais. */
const NETLOSS=Math.min(.9,Math.max(0,+new URLSearchParams(location.search).get('netloss')||0));   // perda simulada (testes)
function openFast(conn){
 S.fast=null;S.fastIn=0;S.fastSeq={};
 try{
  const pc=conn.pc?.();if(!pc||!pc.createDataChannel)return;
  const ch=pc.createDataChannel('eldoria-rapido',{negotiated:true,id:47,ordered:false,maxRetransmits:0});
  ch.onopen=()=>{if(S.conn===conn)S.fast=ch};
  ch.onclose=()=>{if(S.fast===ch)S.fast=null};
  ch.onmessage=e=>{if(S.conn!==conn)return;let m;try{m=JSON.parse(e.data)}catch{return}
   // sem ordem: descarta o que chegar atrasado (mais velho que o último do mesmo tipo)
   const k=m.t,last=S.fastSeq[k]??-1;if(Number.isFinite(m.q)){if(m.q<=last)return;S.fastSeq[k]=m.q}
   S.fastIn++;onMsg(m)};
 }catch(e){console.warn('[Eldoria online] canal rápido',e)}
}
let fastSeqOut=0;
function sendFast(o){
 const ch=S.fast;
 if(!ch||ch.readyState!=='open')return send(o);   // sem canal rápido: usa o garantido
 o.q=++fastSeqOut;const txt=JSON.stringify(o);
 if(NETLOSS&&Math.random()<NETLOSS)return true;
 try{if(NETLAG)setTimeout(()=>{try{ch.readyState==='open'&&ch.send(txt)}catch{}},NETLAG/2);else ch.send(txt);return true}catch{return send(o)}
}
function attach(conn){
 S.conn=conn;openFast(conn);
 conn.onData=d=>onMsg(d);
 S.me={...profile()};S.ready=false;S.theirReady=false;S.them=null;
 send({t:'hello',p:profile()});
 clearInterval(S.pingT);S.pingT=setInterval(()=>send({t:'ping',at:performance.now()}),2000);
 go('lobby');
}
function peerConnAdapter(c){const a={pc:()=>c.peerConnection,send:o=>c.send(o),close:()=>c.close()};c.on('data',d=>a.onData?.(d));c.on('close',()=>lost('O outro jogador saiu da sala.'));c.on('error',()=>lost('A conexão caiu.'));return a}
function channelAdapter(ch){const a={pc:()=>S.pc,send:o=>ch.send(JSON.stringify(o)),close:()=>ch.close()};ch.onmessage=e=>{try{a.onData?.(JSON.parse(e.data))}catch{}};ch.onclose=()=>lost('O outro jogador saiu.');return a}
/* ---------- partida rápida pelo servidor ---------- */
// tela de seleção da partida rápida (a mesma da sala entre amigos): escolhe o campeão e só então procura o rival
/* ---------- partida pelo servidor ----------
 * 1) PROCURAR: o botão JOGAR começa a busca em segundo plano (fica "Procurando rivais…") e você continua usando o jogo;
 * 2) SALA: quando os rivais são achados, abre a tela de escolha do campeão (30 s; PRONTO confirma; no futuro: banimentos);
 * 3) LUTA: com todos prontos o servidor monta a partida (tela de carregamento) e a luta começa. */
const avisar=()=>{try{document.dispatchEvent(new Event('eldoria-busca'))}catch{}};
// token da sessão: o servidor reconhece quem volta a uma partida pelo mesmo token
const TOK=(()=>{try{let t=localStorage.getItem('eldoria.tok');if(!t||!/^[A-Za-z0-9_-]{8,40}$/.test(t)){t=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');localStorage.setItem('eldoria.tok',t)}return t}catch{return Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('')}})();
const FLAG='eldoria.partida';
// partida em andamento que o jogador deixou (fechou o jogo, caiu a conexão): o botão JOGAR vira RECONECTAR por até 20 min
function partidaAberta(){try{const f=JSON.parse(localStorage.getItem(FLAG)||'null');if(f&&Date.now()-f.t<20*60*1000&&f.tok===TOK)return f}catch{}return null}
const podeReconectar=()=>!!SERVIDOR&&!S.procurando&&!(window.OnlineV46&&OnlineV46.match.on)&&!!partidaAberta();
function abrirSocket(aoHello){
 let sock;try{sock=new WebSocket(SERVIDOR)}catch{falhaSrv('Endereço do servidor inválido.');return null}
 S.ws=sock;avisar();
 const timer=setTimeout(()=>{if(S.ws===sock&&sock.readyState!==1)falhaSrv('Servidor indisponível no momento. Tente de novo em instantes.')},9000);
 sock.onopen=()=>{
  clearTimeout(timer);if(S.ws!==sock)return;
  S.conn={pc:()=>null,send:o=>sock.send(JSON.stringify(o)),close:()=>sock.close()};
  sock.send(JSON.stringify({t:'hello',v:PROTO_SRV,build:window.ELDORIA_BUILD||1,sala:1,tok:TOK,p:profile()}));
  S.pingT=setInterval(()=>send({t:'ping',at:performance.now()}),2000);
 };
 sock.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(S.ws===sock)onSrv(m)};
 sock.onclose=()=>{clearTimeout(timer);if(S.ws!==sock)return;if(S.conn)lost('Conexão com o servidor perdida.');else falhaSrv('Não foi possível conectar ao servidor.')};
 sock.onerror=()=>{};
 S.aoHello=aoHello;
 return sock;
}
function procurar(modo){
 if(!SERVIDOR){try{toast('O servidor de partidas ainda não está configurado.')}catch{}return false}
 if(modo==='1v1'||modo==='2v2'||modo==='trio'||modo==='coroa')S.modo=modo;if(!['2v2','trio','coroa'].includes(S.modo))S.modo='1v1';
 cleanup();S.team=null;S.mode='server';S.role='guest';S.err='';S.busy='';S.qt=Date.now();S.online=0;S.fila=0;S.fase='fila';S.procurando=true;S.sala=null;S.me={...profile()};S.them=null;S.ready=S.theirReady=false;
 return !!abrirSocket(()=>send({t:'fila',p:profile(),modo:S.modo}));
}
// volta para a partida que ficou aberta no servidor (um bot estava no seu lugar)
function reconectar(){
 const f=partidaAberta();
 if(!SERVIDOR||!f){S.reconectando=false;avisar();return false}
 cleanup();S.team=null;S.mode='server';S.role='guest';S.err='';S.modo=f.modo||S.modo;S.fase='reconectando';S.procurando=false;S.reconectando=true;S.sala=null;S.me={...profile()};S.them=null;
 return !!abrirSocket(()=>send({t:'reconectar'}));
}
// desistir da busca (ou sair da sala de escolha)
function cancelar(){
 try{send({t:'cancelar'})}catch{}
 cleanup();S.procurando=false;S.fase=null;S.sala=null;S.err='';
 const el=$q('#onlineV45');if(el&&S.mode==='server'){el.hidden=true;document.body.classList.remove('v45-open')}
 avisar();
}
const stats0=()=>{};
function falhaSrv(msg){
 cleanup();S.procurando=false;S.fase=null;S.sala=null;S.err=msg;
 try{toast(msg)}catch{}
 const el=$q('#onlineV45');if(el&&S.mode==='server'){el.hidden=true;document.body.classList.remove('v45-open')}
 avisar();
}
function abrirSala(){
 try{document.querySelectorAll('#v40Modes').forEach(m=>m.hidden=true);document.body.classList.remove('v40-modes-open')}catch{}
 const el=root();el.hidden=false;document.body.classList.add('v45-open');
 clearInterval(S.qTimer);S.qTimer=setInterval(()=>{const e=$q('#v45Qt');if(e)e.textContent=Math.max(0,Math.ceil((S.sala.fim-Date.now())/1000))+' s'},400);
 go('lobby');
}
function onSrv(m){
 switch(m.t){
  case'hello':
   if((S.modo==='2v2'||S.modo==='trio'||S.modo==='coroa')&&!(m.modos||[]).includes(S.modo)){falhaSrv('O servidor ainda está sendo atualizado para este modo. Tente de novo em alguns minutos.');break}
   S.online=m.online||0;{const f=S.aoHello;S.aoHello=null;if(f)f()}avisar();break;
  case'fila':S.online=m.online||S.online;S.fila=m.n;S.precisa=m.precisa||2;avisar();break;
  case'cheio':S.busy='Servidor cheio: você continua na fila…';break;
  case'ocioso':break;
  case'erro':falhaSrv(m.m==='versao'||m.m==='atualizar'?'Seu jogo está desatualizado. Atualize o jogo (ou a página) e tente de novo.':'O servidor recusou a conexão.');break;
  case'sala':{
   const ps=Array.isArray(m.ps)?m.ps:[],slot=m.slot|0,n=ps.length;
   S.fase='sala';S.procurando=false;S.ready=S.theirReady=false;S.err='';
   S.sala={slot,modo:m.modo,ps:ps.map(x=>sanitize(x)),fim:Date.now()+(+m.ms||30000),picks:{},ready:{},n};
   S.them=S.sala.ps[S.modo==='coroa'?(slot+1)%4:n>2?(slot<2?2:0):1-slot]||null;
   if(S.modo==='trio'){S.team=defaultTeam();S.me={...S.me,hero:S.team[0]}}
   S.me={...profile()};avisar();abrirSala();if(S.modo==='trio')send({t:'pick',team:S.team});break}
  case'nada':   // a partida que ficou aberta já terminou
   try{localStorage.removeItem(FLAG)}catch{}
   S.reconectando=false;falhaSrv('Essa partida já terminou.');break;
  case'volta':  // de volta à luta: o bot sai do controle, o jogo recria a luta e o servidor manda o estado
   S.me={...profile()};S.them=sanitize(m.them||(Array.isArray(m.ps)?m.ps[m.slot<2?2:0]:null));S.busy='';S.err='';S.procurando=false;S.reconectando=false;S.fase='jogo';clearInterval(S.qTimer);
   try{stats0()}catch{}
   try{window.OnlineV46.beginServer(m)}catch(e){console.error('[Eldoria online] volta',e);falhaSrv('Não foi possível voltar à partida.')}
   avisar();break;
  case'pick':if(S.sala){S.sala.picks[m.s|0]=validHero(m.hero);render()}break;
  case'ready':if(S.sala){S.sala.ready[m.s|0]=!!m.v;if(S.sala.n===2)S.theirReady=!!m.v;render()}break;
  case'match':
   S.me={...profile()};S.them=sanitize(m.them||(Array.isArray(m.ps)?m.ps[m.slot<2?2:0]:null));S.busy='';S.err='';S.procurando=false;S.fase='jogo';clearInterval(S.qTimer);
   try{window.OnlineV46.beginServer(m)}catch(e){console.error('[Eldoria online] partida',e);falhaSrv('Não foi possível começar a partida.')}
   avisar();break;
  default:onMsg(m);
 }
}
function onMsg(m){
 if(!m||typeof m!=='object')return;
 switch(m.t){
  case'hello':if(m.p?.v!==PROTO){S.err='O outro jogador está com outra versão do jogo. Atualizem a página.';}S.them=sanitize(m.p);render();break;
  case'pick':if(S.them){S.them.hero=validHero(m.hero);S.them.photo=m.photo&&/^[hs]\d+$/.test(m.photo)?m.photo:S.them.photo}S.theirReady=false;render();break;
  case'ready':S.theirReady=!!m.v;render();if(S.role==='host')maybeStart();break;
  case'start':countdown();break;
  case'ping':send({t:'pong',at:m.at});break;
  case'pong':S.rtt=Math.max(1,Math.round(performance.now()-m.at));updatePing();break;
  case'full':S.err='Essa sala já está cheia.';cleanup();go('join');break;
  case'bye':lost(S.mode==='server'?'O rival saiu da partida.':'O outro jogador saiu da sala.');break;
  default:try{window.OnlineV46?.onMsg(m)}catch(e){console.error('[Eldoria online] luta',e)}
 }
}
const validHero=h=>Number.isInteger(+h)&&CHAMPIONS[+h]?+h:0;
function sanitize(p={}){return{name:String(p.name||'Lutador').slice(0,16),lv:Math.max(1,Math.min(100,+p.lv||1)),frame:/^[a-z]{2,10}$/.test(p.frame)?p.frame:'azul',photo:/^[hs]\d+$/.test(p.photo||'')?p.photo:'h0',hero:validHero(p.hero),tier:Math.max(0,Math.min(5,+p.tier||0)),league:String(p.league||'Bronze').slice(0,20)}}
function lost(msg){
 if(!S.conn&&!S.pc)return;try{window.OnlineV46?.abort(msg)}catch{}
 const srv=S.mode==='server';cleanup();S.err=msg;try{toast(msg)}catch{}
 if(srv){S.procurando=false;S.fase=null;S.sala=null;const el=$q('#onlineV45');if(el){el.hidden=true;document.body.classList.remove('v45-open')}avisar();return}
 go('home')}
function cleanup(){
 clearInterval(S.pingT);clearInterval(S.count);clearInterval(S.qTimer);stopScan();
 try{const w=S.ws;S.ws=null;w&&w.close()}catch{}
 try{S.conn&&send({t:'bye'})}catch{}
 const c=S.conn;S.conn=null;try{S.fast?.close()}catch{}S.fast=null;try{c?.close()}catch{}
 const pc=S.pc;S.pc=null;try{pc?.close()}catch{}
 const p=S.peer;S.peer=null;try{p?.destroy()}catch{}
 S.them=null;S.ready=S.theirReady=false;S.rtt=null;S.offerCode=S.answerCode='';S.code='';S.role=null;S.mode=null;S.busy='';
}

/* ---------- PeerJS ---------- */
function peerOpts(){const h=new URLSearchParams(location.search).get('peerhost');if(!h)return{debug:0};const [host,port]=h.split(':');return{host,port:+port||9000,path:'/',secure:false,debug:0}}
async function createRoom(tries=0){
 cleanup();S.mode='net';S.role='host';S.err='';S.busy='Criando sala…';go('create');
 try{await loadLib('peer')}catch{return fail('Não foi possível carregar a conexão online. Verifique a internet.')}
 const code=newCode(),peer=new Peer(PREFIX+code,peerOpts());S.peer=peer;
 peer.on('open',()=>{if(S.peer!==peer)return;S.code=code;S.busy='';render()});
 peer.on('connection',c=>{
  if(S.peer!==peer)return;
  if(S.conn){c.on('open',()=>{c.send({t:'full'});setTimeout(()=>c.close(),300)});return}
  c.on('open',()=>{if(S.peer===peer)attach(peerConnAdapter(c))});
 });
 peer.on('error',e=>{if(S.peer!==peer)return;if(e.type==='unavailable-id'&&tries<3)return createRoom(tries+1);if(S.conn)return;fail(netError(e))});
 peer.on('disconnected',()=>{if(S.peer===peer&&!S.conn)try{peer.reconnect()}catch{}});
}
async function joinRoom(raw){
 const code=cleanCode(raw);
 if(code.length!==CODE_LEN){S.err=`O código tem ${CODE_LEN} letras e números.`;return go('join')}
 cleanup();S.mode='net';S.role='guest';S.code=code;S.err='';S.busy='Entrando na sala '+code+'…';go('join');
 try{await loadLib('peer')}catch{return fail('Não foi possível carregar a conexão online. Verifique a internet.','join')}
 const peer=new Peer(peerOpts());S.peer=peer;
 const timer=setTimeout(()=>{if(S.peer===peer&&!S.conn)fail('A sala não respondeu. Confira o código e tente de novo.','join')},15000);
 peer.on('open',()=>{
  const c=peer.connect(PREFIX+code,{reliable:true});
  c.on('open',()=>{clearTimeout(timer);if(S.peer===peer)attach(peerConnAdapter(c))});
 });
 peer.on('error',e=>{clearTimeout(timer);if(S.peer!==peer||S.conn)return;fail(e.type==='peer-unavailable'?'Sala não encontrada. Confira o código.':netError(e),'join')});
}
function netError(e){const t=e?.type||'';if(t==='network'||t==='server-error'||t==='socket-error'||t==='socket-closed')return'Sem conexão com o servidor online. Verifique a internet ou use "Jogar perto".';if(t==='browser-incompatible')return'Este navegador não suporta o modo online.';return'Não foi possível conectar ('+(t||'erro')+').'}
function fail(msg,view){const keepCode=view==='join'?S.code:'';cleanup();S.code=keepCode;S.err=msg;go(view||'home')}

/* ---------- Jogar perto: WebRTC com QR ---------- */
async function pack(kind,sdp){
 const bytes=new TextEncoder().encode(sdp);
 let out=bytes,z='0';
 if(window.CompressionStream){try{out=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());z='1'}catch{}}
 let b='';for(const x of out)b+=String.fromCharCode(x);
 return `EL${PROTO}${kind}${z}`+btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function unpack(txt){
 const m=/^EL(\d)([oa])([01])([A-Za-z0-9_-]+)$/.exec(String(txt||'').trim());if(!m)throw new Error('Código inválido');
 if(+m[1]!==PROTO)throw new Error('Versão diferente do jogo');
 const bin=atob(m[4].replace(/-/g,'+').replace(/_/g,'/')),u=Uint8Array.from(bin,c=>c.charCodeAt(0));
 let bytes=u;if(m[3]==='1')bytes=new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
 return{kind:m[2],sdp:new TextDecoder().decode(bytes)};
}
function waitIce(pc,ms=3500){return new Promise(ok=>{if(pc.iceGatheringState==='complete')return ok();const t=setTimeout(ok,ms);pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(t);ok()}})})}
function nearPc(){
 const pc=new RTCPeerConnection({iceServers:[]});S.pc=pc;
 pc.addEventListener('connectionstatechange',()=>{if(S.pc===pc&&['failed'].includes(pc.connectionState)&&!S.conn)fail('Não conectou. Confiram se os dois estão no mesmo Wi-Fi ou no roteador do celular.','near')});
 return pc;
}
function watchChannel(ch){ch.onopen=()=>{if(S.pc)attach(channelAdapter(ch))}}
async function nearHost(){
 cleanup();S.mode='near';S.role='host';S.err='';S.busy='Preparando o QR…';go('nearHost');
 try{
  const pc=nearPc(),ch=pc.createDataChannel('eldoria',{ordered:true});watchChannel(ch);
  await pc.setLocalDescription(await pc.createOffer());await waitIce(pc);
  if(S.pc!==pc)return;S.offerCode=await pack('o',pc.localDescription.sdp);S.busy='';render();
 }catch(e){console.error(e);fail('Não foi possível preparar a conexão perto.','near')}
}
async function nearGuestRead(txt){
 let d;try{d=await unpack(txt)}catch(e){S.err=e.message==='Versão diferente do jogo'?'O outro celular está com outra versão do jogo.':'Esse não é o QR do anfitrião.';return render()}
 if(d.kind!=='o'){S.err='Esse é o QR de resposta. Leia o QR do anfitrião.';return render()}
 cleanup();S.mode='near';S.role='guest';S.err='';S.busy='Preparando a resposta…';go('nearGuest');
 try{
  const pc=nearPc();pc.ondatachannel=e=>watchChannel(e.channel);
  await pc.setRemoteDescription({type:'offer',sdp:d.sdp});await pc.setLocalDescription(await pc.createAnswer());await waitIce(pc);
  if(S.pc!==pc)return;S.answerCode=await pack('a',pc.localDescription.sdp);S.busy='';render();
 }catch(e){console.error(e);fail('O QR lido não funcionou. Gere um novo no anfitrião.','near')}
}
async function nearHostRead(txt){
 let d;try{d=await unpack(txt)}catch{S.err='Esse não é o QR de resposta do seu amigo.';return render()}
 if(d.kind!=='a'){S.err='Esse é o seu próprio QR. Leia o QR que aparece no celular do amigo.';return render()}
 try{await S.pc.setRemoteDescription({type:'answer',sdp:d.sdp});S.busy='Conectando…';S.err='';render()}catch(e){console.error(e);S.err='Não deu para usar essa resposta. Comecem de novo.';render()}
}

/* ---------- QR: desenhar e ler ---------- */
async function drawQr(el,text){
 try{await loadLib('qr')}catch{el.innerHTML='<p>Não foi possível gerar o QR.</p>';return}
 const q=qrcode(0,'L');q.addData(text,'Byte');q.make();
 const n=q.getModuleCount(),m=4,px=Math.max(3,Math.floor(300/(n+m*2))),cv=document.createElement('canvas');cv.width=cv.height=(n+m*2)*px;
 const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cv.width,cv.height);g.fillStyle='#111';
 for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))g.fillRect((c+m)*px,(r+m)*px,px,px);
 cv.className='v45-qr-canvas';cv.setAttribute('aria-label','QR code da conexão');el.replaceChildren(cv);
}
async function startScan(onText){
 stopScan();
 const box=$q('#v45Scan');if(!box)return;
 box.innerHTML=`<video playsinline muted autoplay></video><i class="v45-scan-frame"></i>`;
 const video=box.querySelector('video');
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false})}catch(e){box.innerHTML=`<p class="v45-note">Não foi possível abrir a câmera. Use "Colar código".</p>`;return}
 video.srcObject=stream;
 let detector=null;try{if('BarcodeDetector' in window&&(await BarcodeDetector.getSupportedFormats()).includes('qr_code'))detector=new BarcodeDetector({formats:['qr_code']})}catch{}
 if(!detector){try{await loadLib('jsqr')}catch{}}
 const cv=document.createElement('canvas'),g=cv.getContext('2d',{willReadFrequently:true});
 const sc={stream,alive:true};S.scan=sc;
 const tick=async()=>{
  if(!sc.alive)return;
  try{
   if(video.readyState>=2){
    let txt=null;
    if(detector){const r=await detector.detect(video);txt=r[0]?.rawValue||null}
    else if(window.jsQR){const w=video.videoWidth,h=video.videoHeight,k=Math.min(1,640/Math.max(w,h));cv.width=w*k;cv.height=h*k;g.drawImage(video,0,0,cv.width,cv.height);const r=jsQR(g.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height,{inversionAttempts:'dontInvert'});txt=r?.data||null}
    if(txt&&/^EL\d/.test(txt)){stopScan();try{navigator.vibrate?.(60)}catch{}onText(txt);return}
   }
  }catch{}
  setTimeout(tick,180);
 };
 tick();
}
function stopScan(){const sc=S.scan;S.scan=null;if(!sc)return;sc.alive=false;try{sc.stream.getTracks().forEach(t=>t.stop())}catch{}}

/* ---------- sala de espera ---------- */
const defaultTeam=()=>{const f=myHero();return [f,...owned().filter(x=>x!==f)].slice(0,3)};
function pick(id){if(!owned().includes(id)||S.ready)return;
 if(S.mode==='server'&&S.modo==='trio'){   // Trio: até 3 campeões, a ordem é a de entrada; com 3, tocar em outro troca o último
  const t=S.team||(S.team=defaultTeam()),k=t.indexOf(id);
  if(k>=0){if(t.length>1)t.splice(k,1)}else if(t.length<3)t.push(id);else t[2]=id;
  S.me.hero=t[0];send({t:'pick',team:t});render();return}S.me.hero=id;if(S.me.photo?.[0]==='h'&&(window.ContaV42?.photoKey?.()||'auto')==='auto')S.me.photo='h'+id;send({t:'pick',hero:id,photo:S.me.photo});render()}
function moveTeam(i,d){const t=S.team,j=i+d;if(S.ready||!t||j<0||j>=t.length)return;[t[i],t[j]]=[t[j],t[i]];S.me.hero=t[0];send({t:'pick',team:t});render()}
function toggleReady(){if(!S.conn||!S.them)return;S.ready=!S.ready;send({t:'ready',v:S.ready});render();if(S.role==='host')maybeStart()}
function maybeStart(){if(S.ready&&S.theirReady&&S.role==='host'){send({t:'start'});countdown()}}
function countdown(){
 clearInterval(S.count);let n=3;go('count');const el=()=>$q('#v45Count');if(el())el().textContent=n;
 S.count=setInterval(()=>{n--;if(n>0){if(el())el().textContent=n;return}clearInterval(S.count);S.ready=S.theirReady=false;
  if(window.OnlineV46){if(S.role==='host')OnlineV46.hostGo();else go('wait')}else go('stage2')},800);
}
function updatePing(){const el=$q('#v45Ping');if(el){el.textContent=S.rtt==null?'…':S.rtt+' ms';el.dataset.q=S.rtt<80?'bom':S.rtt<180?'ok':'ruim'}}

/* ---------- sala de espera: mesma pegada da seleção do modo offline (retratos, bonecos animados, VS, grade de rostos) ---------- */
const faceSrc=id=>{try{return(window.v3FaceSrc&&v3FaceSrc({skin:id,kit:CHAMPIONS[id].kit}))||championArt(CHAMPIONS[id])}catch{return''}};
const artSrc=id=>{try{return championArt(CHAMPIONS[id])}catch{return''}};
function sideChip(p,me,ready,up){up=up===true?1:up||0;
 if(!p)return `<div class="v46-chip ${me?'left':'right'} wait"><span class="v45-dots"><i></i><i></i><i></i></span><b>Esperando o amigo…</b></div>`;
 return `<div class="v46-chip ${me?'left':'right'} ${up?'up'+up:''} ${ready?'ready':''}">${avatar(p,'sm')}<span><b>${esc(p.name)}${me?' <em>(você)</em>':''}</b><small>Nv ${p.lv} · <span class="v43-rank" data-tier="${p.tier}">${esc(p.league)}</span></small></span><i class="v46-st">${ready?svg('check')+'PRONTO':'escolhendo'}</i></div>`;
}
// emblema "VS" desenhado em SVG: anel dourado, metade azul e metade vermelha, raio no meio
const VS_SVG=`<svg viewBox="0 0 140 140" aria-hidden="true"><defs>
 <linearGradient id="vsG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#ffc83d"/><stop offset="1" stop-color="#e07c00"/></linearGradient>
 <linearGradient id="vsB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#58b0ff"/><stop offset="1" stop-color="#1b3fa8"/></linearGradient>
 <linearGradient id="vsR" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a8c"/><stop offset="1" stop-color="#b3153a"/></linearGradient></defs>
 <circle cx="70" cy="70" r="66" fill="url(#vsG)"/><circle cx="70" cy="70" r="58" fill="#13205a"/>
 <path d="M70 14A56 56 0 0 0 70 126Z" fill="url(#vsB)"/><path d="M70 14A56 56 0 0 1 70 126Z" fill="url(#vsR)"/>
 <path d="M76 12L58 62h16L60 128 90 56H72Z" fill="#fff6c2" stroke="#ffb21e" stroke-width="3" stroke-linejoin="round"/>
 <circle cx="70" cy="70" r="56" fill="none" stroke="#ffe9a0" stroke-width="2.5" opacity=".7"/>
 <text x="70" y="92" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="62" font-weight="900" fill="url(#vsG)" stroke="#4a2800" stroke-width="7" paint-order="stroke" stroke-linejoin="round" letter-spacing="-2">VS</text></svg>`;
function lobbyHtml(){
  const srv=S.mode==='server',sa=srv?S.sala:null,ffa=srv&&S.modo==='coroa'&&!!sa,x2=!!sa&&sa.n>2&&!ffa,trio=srv&&S.modo==='trio'&&!!S.team;
 const me=S.me,th=S.them,mine=owned(),mc=CHAMPIONS[trio?S.team[0]:me.hero]||CHAMPIONS[0];
 const tc=(!srv&&th)?CHAMPIONS[th.hero]:null;   // pelo servidor, o campeão do rival só aparece quando a luta começa
 const mateSlot=sa?sa.slot^1:0,matePick=x2?sa.picks[mateSlot]:null;
 const tiles=CHAMPIONS.map(c=>{const own=mine.includes(c.id),ord=trio?S.team.indexOf(c.id):-1,on=trio?ord>=0:me.hero===c.id,foe=tc&&tc.id===c.id;return `<button class="v46-tile ${on?'on':''} ${own?'':'locked'} ${foe?'foe':''}" data-v45-hero="${c.id}" ${own&&!S.ready?'':'disabled'} aria-pressed="${on}" title="${esc(c.name)}${own?'':' · bloqueado'}" style="--hero:${c.color}"><img data-face="${c.id}" src="${esc(faceSrc(c.id))}" alt="">${ord>=0?`<b class="v46-ord">${ord+1}</b>`:''}${foe?'<i class="v46-foe-mark" aria-hidden="true">RIVAL</i>':''}</button>`}).join('');
 const spr=(id,cls='')=>`<canvas class="v46-sprite ${cls}" data-skin="${id}" width="200" height="200" aria-hidden="true"></canvas>`;
 // lado de cada jogador na sala de escolha (2×2): eu e meu parceiro à esquerda, os dois rivais à direita
 let chips;
 if(ffa){const outros=sa.ps.map((_,i)=>i).filter(i=>i!==sa.slot);
  chips=sideChip(me,true,S.ready)+outros.map((i,k)=>sideChip(sa.ps[i],false,!!sa.ready[i],k)).join('')}
 else if(x2){const me0=sa.slot,foes=sa.ps.map((_,i)=>i).filter(i=>(i>>1)!==(me0>>1));
  chips=sideChip(me,true,S.ready)+sideChip(sa.ps[mateSlot],true,!!sa.ready[mateSlot],true)+sideChip(sa.ps[foes[0]],false,!!sa.ready[foes[0]])+sideChip(sa.ps[foes[1]],false,!!sa.ready[foes[1]],true)}
 else if(trio){
  const row=i=>{const id=S.team[i];return id!=null?`<div class="v46-trow"><i>${i+1}º</i><img src="${esc(faceSrc(id))}" alt=""><span>${esc(CHAMPIONS[id].name)}</span><em><button data-v45-mv="${i},-1" ${S.ready?'disabled':''} aria-label="Entra antes">◀</button><button data-v45-mv="${i},1" ${S.ready?'disabled':''} aria-label="Entra depois">▶</button></em></div>`:`<div class="v46-trow empty"><i>${i+1}º</i><span>— escolha —</span></div>`};
  chips=`<div class="v46-trio ${S.ready?'ready':''}"><h3>SEU TIME · ordem de entrada</h3>${[0,1,2].map(row).join('')}</div>`+sideChip(th,false,S.theirReady)}
 else chips=sideChip(me,true,S.ready)+sideChip(th,false,S.theirReady);
 const secs=sa?Math.max(0,Math.ceil((sa.fim-Date.now())/1000)):0;
 const mid=ffa?`<div class="v46-fighter blue"><i class="v46-plat"></i>${spr(mc.id)}</div>
    <div class="v46-vs">${VS_SVG}<small>4P</small></div>
    ${[0,1,2].map(()=>'<div class="v46-fighter red"><i class="v46-plat"></i><span class="v46-q">?</span></div>').join('')}`
  :x2?`<div class="v46-fighter blue"><i class="v46-plat"></i>${spr(mc.id)}</div>
    <div class="v46-fighter blue"><i class="v46-plat"></i>${matePick!=null?spr(matePick):'<span class="v46-q">?</span>'}</div>
    <div class="v46-vs">${VS_SVG}<small>2×2</small></div>
    <div class="v46-fighter red"><i class="v46-plat"></i><span class="v46-q">?</span></div><div class="v46-fighter red"><i class="v46-plat"></i><span class="v46-q">?</span></div>`
  :`<div class="v46-fighter blue"><i class="v46-plat"></i>${spr(mc.id)}</div>
    <div class="v46-vs">${VS_SVG}<small>${trio?'3×3':'1×1'}</small></div>
    <div class="v46-fighter red"><i class="v46-plat"></i>${tc?spr(tc.id,'flip'):'<span class="v46-q">?</span>'}</div>`;
 return `<div class="v46-sel" style="--me:${mc.color};--th:${tc?.color||'#e2264d'}">
  <div class="v46-stage">
   <div class="v46-art left"><img src="${esc(artSrc(mc.id))}" alt=""></div>
   <div class="v46-art right ${tc?'':'empty'}">${tc?`<img src="${esc(artSrc(tc.id))}" alt="">`:''}</div>
   <div class="v46-mid ${x2||ffa?'x2':''}">${mid}</div>
   ${chips}
  </div>
  <div class="v46-names"><div class="v46-name blue">${esc(mc.name)}</div><div class="v46-hint">${srv?`<span class="v46-time">⏱ <b id="v45Qt">${secs} s</b></span>`:S.ready?'Esperando o amigo ficar pronto…':''}</div><div class="v46-name red">${tc?esc(tc.name):'? ? ?'}</div></div>
  <div class="v46-bottom"><span class="v45-ping">${svg('wifi')}<b id="v45Ping">${S.rtt==null?'…':S.rtt+' ms'}</b></span><div class="v46-grid" role="listbox" aria-label="Seu campeão">${tiles}</div>
   <button class="v46-go ${S.ready?'cancel':''}" data-v45="ready" ${(trio?S.team.length===3:(srv||th))?'':'disabled'}>${S.ready?'CANCELAR':trio&&S.team.length<3?S.team.length+'/3':'PRONTO'}</button></div>
 </div>`;
}
// bonecos animados em repouso (o mesmo desenho da seleção offline)
let spriteLoop=false;
function paintSprites(){
 const cs=document.querySelectorAll('#onlineV45:not([hidden]) canvas.v46-sprite');
 if(!cs.length){spriteLoop=false;return}
 const t=performance.now()/1000;
 cs.forEach(c=>{const g=c.getContext('2d');g.clearRect(0,0,200,200);g.save();g.translate(100,172);g.fillStyle='rgba(4,10,40,.45)';g.beginPath();g.ellipse(0,8,34,9,0,0,6.2832);g.fill();g.imageSmoothingEnabled=false;
  const keep=lobbyActor.skin;lobbyActor.skin=+c.dataset.skin;try{drawAnimatedFighter(g,lobbyActor,150,t)}catch{}lobbyActor.skin=keep;g.restore()});
 document.querySelectorAll('#onlineV45 img[data-face]').forEach(im=>{const u=faceSrc(+im.dataset.face);if(u&&im.getAttribute('src')!==u)im.setAttribute('src',u)});
 requestAnimationFrame(paintSprites);
}
function startSprites(){if(spriteLoop||!document.querySelector('#onlineV45 canvas.v46-sprite'))return;spriteLoop=true;for(const c of CHAMPIONS){try{reworkPreload(c.id)}catch{}}try{loadSkinAtlas()}catch{}requestAnimationFrame(paintSprites)}

/* ---------- telas ---------- */
const avatar=(p,size='lg')=>{try{return ContaV42.avatar(size,p.photo,p.frame)}catch{return''}};
function playerCard(p,me,ready){
 if(!p)return `<div class="v45-player wait"><span class="v45-dots"><i></i><i></i><i></i></span><b>Esperando…</b></div>`;
 const c=CHAMPIONS[p.hero]||CHAMPIONS[0];let art='';try{art=championArt(c)}catch{}
 return `<div class="v45-player ${ready?'ready':''}"><div class="v45-ptop">${avatar(p,'md')}<span><b>${esc(p.name)}${me?' <em>(você)</em>':''}</b><small>Nível ${p.lv} · <span class="v43-rank" data-tier="${p.tier}">${esc(p.league)}</span></small></span></div>
  <div class="v45-hero"><img src="${esc(art)}" alt="" draggable="false"><span>${esc(c.name)}</span></div>
  <div class="v45-state">${ready?`${svg('check')} PRONTO`:'Escolhendo…'}</div></div>`;
}
function view(){
 const top=(title,back='home')=>`<header class="v43-top v45-top"><button class="v40-round v43-back" data-v45-back="${back}" aria-label="Voltar">${svg('back')}</button><b>${title}</b><span class="v45-tag">${S.mode==='server'&&S.modo==='2v2'?'2×2':S.mode==='server'&&S.modo==='trio'?'3×3':S.mode==='server'&&S.modo==='coroa'?'4P':'1×1'}</span></header>`;
 const err=S.err?`<p class="v45-err" role="alert">${esc(S.err)}</p>`:'';
 const busy=S.busy?`<p class="v45-busy"><span class="v45-spin"></span>${esc(S.busy)}</p>`:'';
 switch(S.view){
 case'home':return top('ONLINE','close')+`<div class="v45-body v45-home">${err}
  ${SERVIDOR?`<button class="v45-quick" data-v45="quick">${svg('bolt')}<span><b>Partida rápida</b><small>Lute contra um jogador online</small></span></button>`:''}
  <div class="v45-big">
   <button class="v45-choice create" data-v45="create">${svg('plus')}<b>Criar sala</b><small>Receba um código e chame um amigo</small></button>
   <button class="v45-choice join" data-v45="join">${svg('door')}<b>Entrar na sala</b><small>Digite o código do seu amigo</small></button>
  </div>
  <button class="v45-near" data-v45="near">${svg('qr')}<span><b>Jogar perto · QR code</b><small>Sem internet: mesmo Wi-Fi ou roteador do celular</small></span></button>
  <p class="v45-note">Duelo 1×1 melhor de 3. Com um amigo: crie uma sala, entre com o código ou jogue perto.</p></div>`;
 case'queue':return top('PARTIDA RÁPIDA','home')+`<div class="v45-body v45-center">${err}<span class="v45-spin big"></span><b class="v45-qtitle">${esc(S.busy||'Procurando um rival…')}</b>
  <small class="v45-qsub">${S.online?`${S.online} jogador${S.online>1?'es':''} online`:''}</small><p class="v45-wait"><span id="v45Qt">${Math.floor((Date.now()-S.qt)/1000)} s</span></p>
  <button class="v45-btn blue" data-v45="qcancel">Cancelar</button></div>`;
 case'create':return top('CRIAR SALA')+`<div class="v45-body v45-center">${err}${busy}
  ${S.code?`<span class="v45-label">CÓDIGO DA SALA</span><div class="v45-code" aria-label="Código ${S.code.split('').join(' ')}">${S.code.split('').map(c=>`<i>${c}</i>`).join('')}</div>
  <div class="v45-row"><button class="v45-btn blue" data-v45="copy">${svg('copy')}Copiar</button><button class="v45-btn green" data-v45="share">${svg('share')}Compartilhar</button></div>
  <p class="v45-wait"><span class="v45-dots"><i></i><i></i><i></i></span>Esperando seu amigo entrar…</p>`:''}</div>`;
 case'join':return top('ENTRAR NA SALA')+`<div class="v45-body v45-center">${err}
  <label class="v45-label" for="v45Code">CÓDIGO DA SALA</label>
  <input id="v45Code" class="v45-input" maxlength="${CODE_LEN+2}" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" placeholder="ABC12" value="${esc(S.code)}">
  ${busy||`<button class="v45-btn gold" data-v45="enter">Entrar</button>`}</div>`;
 case'near':return top('JOGAR PERTO')+`<div class="v45-body v45-home">${err}
  <p class="v45-note">${svg('wifi')} Liguem os dois no mesmo Wi-Fi, ou um liga o roteador do celular e o outro se conecta nele. Não precisa de internet.</p>
  <div class="v45-big">
   <button class="v45-choice create" data-v45="nearHost">${svg('qr')}<b>Mostrar meu QR</b><small>Você é o anfitrião</small></button>
   <button class="v45-choice join" data-v45="nearGuest">${svg('cam')}<b>Ler QR do amigo</b><small>Aponte a câmera para o QR dele</small></button>
  </div></div>`;
 case'nearHost':return top('JOGAR PERTO','near')+`<div class="v45-body v45-qrpage">${err}${busy}
  ${S.offerCode?`<div class="v45-step"><span class="v45-num">1</span><b>Seu amigo lê este QR</b><div class="v45-qr" id="v45Qr"></div><button class="v45-link" data-v45="copyOffer">${svg('copy')}Sem câmera? Copiar código</button></div>
  <div class="v45-step"><span class="v45-num">2</span><b>Depois, leia o QR que aparecer no celular dele</b><div class="v45-scan" id="v45Scan"><button class="v45-btn blue" data-v45="scanAnswer">${svg('cam')}Abrir câmera</button></div>
   <details class="v45-paste"><summary>Colar código</summary><textarea id="v45Paste" rows="3" placeholder="Cole aqui o código do amigo"></textarea><button class="v45-btn gold" data-v45="pasteAnswer">Usar código</button></details></div>`:''}</div>`;
 case'nearGuest':return top('JOGAR PERTO','near')+`<div class="v45-body v45-qrpage">${err}${busy}
  ${S.answerCode?`<div class="v45-step"><span class="v45-num">2</span><b>Mostre este QR para o anfitrião</b><div class="v45-qr" id="v45Qr"></div><button class="v45-link" data-v45="copyAnswer">${svg('copy')}Sem câmera? Copiar código</button><p class="v45-wait"><span class="v45-dots"><i></i><i></i><i></i></span>Esperando o anfitrião ler…</p></div>`
  :`<div class="v45-step"><span class="v45-num">1</span><b>Leia o QR do anfitrião</b><div class="v45-scan" id="v45Scan"><button class="v45-btn blue" data-v45="scanOffer">${svg('cam')}Abrir câmera</button></div>
   <details class="v45-paste"><summary>Colar código</summary><textarea id="v45Paste" rows="3" placeholder="Cole aqui o código do anfitrião"></textarea><button class="v45-btn gold" data-v45="pasteOffer">Usar código</button></details></div>`}</div>`;
 case'lobby':return top(S.mode==='server'?(S.modo==='2v2'?'EQUIPES 2×2':S.modo==='trio'?'TRIO DE CAMPEÕES':S.modo==='coroa'?'DISPUTA DA COROA':'DUELO 1×1'):'SALA '+(S.mode==='near'?'PERTO':S.code),S.mode==='server'?'sair':'home')+(S.err?err:'')+lobbyHtml();
 case'count':return `<div class="v45-count"><span>A luta começa em</span><b id="v45Count">3</b></div>`;
 case'wait':return `<div class="v45-count"><span class="v45-spin"></span><span>Entrando na arena…</span></div>`;
 case'stage2':return top('SALA '+(S.mode==='near'?'PERTO':S.code),'lobby')+`<div class="v45-body v45-center">
  <div class="v45-vs small">${playerCard(S.me,true,true)}<span class="v45-vsx">VS</span>${playerCard(S.them,false,true)}</div>
  <p class="v45-okmsg">${svg('check')} Conexão funcionando · <b id="v45Ping">${S.rtt==null?'…':S.rtt+' ms'}</b></p>
  <p class="v45-note">A luta online sincronizada é a próxima etapa e ainda não está pronta. Vocês continuam conectados: voltem à sala para trocar de campeão.</p>
  <button class="v45-btn gold" data-v45="toLobby">Voltar à sala</button></div>`;
 }
 return'';
}
function root(){let el=$q('#onlineV45');if(!el){el=document.createElement('section');el.id='onlineV45';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-label','Online');document.body.appendChild(el);bind(el)}return el}
function render(){
 const el=root();if(el.hidden)return;
 const keep=$q('#v45Code')?.value,pv=S.view,pasteOpen=$q('.v45-paste')?.open,pasteVal=$q('#v45Paste')?.value;
 el.innerHTML=`<div class="v45-wrap">${view()}</div>`;
 if(el.dataset.view===pv&&pasteOpen&&$q('.v45-paste')){$q('.v45-paste').open=true;$q('#v45Paste').value=pasteVal||''}
 el.dataset.view=S.view;
 if(keep!=null&&$q('#v45Code')&&S.view==='join'&&!S.busy)$q('#v45Code').value=cleanCode(keep)||S.code;
 const qr=$q('#v45Qr');if(qr)drawQr(qr,S.view==='nearHost'?S.offerCode:S.answerCode);
 if(S.view==='join'&&!S.busy)setTimeout(()=>$q('#v45Code')?.focus(),50);
 startSprites();
 updatePing();
}
function go(v){stopScan();S.view=v;render()}
function open(opt={}){
 const el=root();el.hidden=false;document.body.classList.add('v45-open');
 try{window.InicioV40&&document.querySelectorAll('#v40Modes').forEach(m=>m.hidden=true);document.body.classList.remove('v40-modes-open')}catch{}
 if(S.conn&&['lobby','stage2','count'].includes(S.view))return render();
 S.err='';if(opt.code){S.code=cleanCode(opt.code);joinRoom(S.code)}else go('home');
}
function close(){cleanup();S.err='';const el=$q('#onlineV45');if(el)el.hidden=true;document.body.classList.remove('v45-open');try{if(appScreen==='home')renderLobbyHome()}catch{}}
async function copy(t,msg){try{await navigator.clipboard.writeText(t);toast(msg||'Copiado!')}catch{prompt('Copie:',t)}}
function shareLink(){return location.origin+location.pathname+'?sala='+S.code}
function bind(el){
 el.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.v45Back){const to=b.dataset.v45Back;if(to==='sair')return cancelar();if(to==='close')return close();if(to==='lobby')return go('lobby');cleanup();S.err='';return go(to)}
  if(b.dataset.v45Mv){const [i,d]=b.dataset.v45Mv.split(',').map(Number);return moveTeam(i,d)}
  if(b.dataset.v45Hero!=null)return pick(+b.dataset.v45Hero);
  const a=b.dataset.v45;if(!a)return;
  S.err='';
  if(a==='create')return createRoom();
  if(a==='join'){cleanup();return go('join')}
  if(a==='enter')return joinRoom($q('#v45Code')?.value);
  if(a==='quick')return procurar(S.modo);
  if(a==='near'){cleanup();return go('near')}
  if(a==='nearHost')return nearHost();
  if(a==='nearGuest'){cleanup();S.mode='near';S.role='guest';return go('nearGuest')}
  if(a==='copy')return copy(S.code,'Código copiado!');
  if(a==='share'){const url=shareLink(),text=`Vem lutar comigo no Eldoria! Sala ${S.code}: ${url}`;if(navigator.share){try{await navigator.share({title:'Eldoria',text,url})}catch{}}else window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener');return}
  if(a==='copyOffer')return copy(S.offerCode,'Código copiado!');
  if(a==='copyAnswer')return copy(S.answerCode,'Código copiado!');
  if(a==='scanOffer')return startScan(t=>nearGuestRead(t));
  if(a==='scanAnswer')return startScan(t=>nearHostRead(t));
  if(a==='pasteOffer')return nearGuestRead($q('#v45Paste')?.value);
  if(a==='pasteAnswer')return nearHostRead($q('#v45Paste')?.value);
  if(a==='ready')return toggleReady();
  if(a==='toLobby')return go('lobby');
 });
 el.addEventListener('input',e=>{if(e.target.id==='v45Code'){const v=cleanCode(e.target.value);if(e.target.value!==v)e.target.value=v}});
 el.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='v45Code')joinRoom(e.target.value);if(e.key==='Escape'&&!S.conn)close()});
}
addEventListener('beforeunload',()=>{try{send({t:'bye'})}catch{}});

/* ---------- link ?sala=CÓDIGO ---------- */
(function fromLink(){
 const code=cleanCode(new URLSearchParams(location.search).get('sala'));if(code.length!==CODE_LEN)return;
 let n=0;const t=setInterval(()=>{n++;
  if(n>240)return clearInterval(t);
  try{if(account?.profile&&appScreen==='home'&&!$q('#welcomeEnter:not([hidden])')&&!$q('#ljModal')){clearInterval(t);const u=new URLSearchParams(location.search);u.delete('sala');history.replaceState(null,'',location.pathname+(u.toString()?'?'+u:''));open({code})}}catch{}
 },500);
})();

// começar qualquer outra luta (treino, bots...) enquanto a busca está na fila cancela a busca
const prevStartBusca=start;
start=function(){if(S.procurando&&S.fase==='fila'&&!window.OnlineV46?.match.on)cancelar();return prevStartBusca.apply(this,arguments)};
window.OnlineV45={tok:TOK,procurar,cancelar,reconectar,podeReconectar,partidaAberta,flag:FLAG,selecionar:procurar,sendFast,send,render,go,owned,profile,state:S,open,close,pack,unpack,cleanCode,_createRoom:createRoom,_join:joinRoom,_nearHostRead:nearHostRead,_nearGuestRead:nearGuestRead};
})();
