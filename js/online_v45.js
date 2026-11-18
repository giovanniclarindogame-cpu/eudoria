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
const loaded={};
function loadLib(k){return loaded[k]||(loaded[k]=new Promise((ok,bad)=>{const s=document.createElement('script');s.src=LIB[k];s.onload=ok;s.onerror=()=>{loaded[k]=null;bad(new Error('não carregou '+k))};document.head.appendChild(s)}))}
const newCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(CODE_LEN)),b=>ABC[b%ABC.length]).join('');
const cleanCode=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/[O]/g,'0').replace(/[I]/g,'1').slice(0,CODE_LEN);
const ICO={
 back:'<path d="M19 6l-10 10 10 10"/>',plus:'<path d="M16 6v20M6 16h20"/>',door:'<path d="M8 28V5h14v23M8 28h18M17 17h1"/><path d="M22 5l5 3v20"/>',
 qr:'<rect x="5" y="5" width="8" height="8" rx="1"/><rect x="19" y="5" width="8" height="8" rx="1"/><rect x="5" y="19" width="8" height="8" rx="1"/><path d="M19 19h3v3h-3zM24 24h3v3h-3zM19 26v1M26 19v1"/>',
 copy:'<rect x="10" y="10" width="16" height="17" rx="2"/><path d="M6 21V7a2 2 0 0 1 2-2h12"/>',share:'<circle cx="24" cy="7" r="3.5"/><circle cx="8" cy="16" r="3.5"/><circle cx="24" cy="25" r="3.5"/><path d="M11 14.5l10-6M11 17.5l10 6"/>',
 cam:'<path d="M4 10h6l2-3h8l2 3h6v15H4z"/><circle cx="16" cy="17" r="5"/>',wifi:'<path d="M4 12a17 17 0 0 1 24 0M8 16.5a11 11 0 0 1 16 0M12 21a5 5 0 0 1 8 0"/><circle cx="16" cy="25" r="1.4"/>',
 check:'<path d="M6 17l6 6 14-14"/>',x:'<path d="M8 8l16 16M24 8 8 24"/>'
};
const svg=k=>`<svg class="v40i" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k]}</svg>`;

/* ---------- estado ---------- */
const S={view:'home',mode:null,role:null,code:'',peer:null,conn:null,pc:null,me:null,them:null,ready:false,theirReady:false,rtt:null,err:'',pingT:0,count:0,scan:null,offerCode:'',answerCode:'',busy:''};

/* ---------- perfil enviado ao outro jogador ---------- */
function myHero(){try{return currentChampion().id}catch{return 0}}
function profile(){
 const C=window.ContaV42,key=C?.photoKey?.()||'auto';
 let tier=0,league='Bronze';try{const pts=V3Liga.rec('1v1').points||0;tier=V3Liga.divOf(pts);league=V3Liga.rankName(pts)}catch{}
 return{v:PROTO,name:account.profile?.name||'Lutador',lv:C?.rec?.().lv||1,frame:C?.frameId?.()||'azul',photo:key==='auto'?'h'+(S.me?.hero??myHero()):key,hero:S.me?.hero??myHero(),tier,league};
}
function owned(){try{return CHAMPIONS.filter(c=>(account.champions||[]).includes(c.id)).map(c=>c.id)}catch{return[0]}}

/* ---------- transporte (PeerJS ou canal WebRTC do QR) ---------- */
// ?netlag=ms simula atraso de rede (só para testes): cada mensagem sai metade desse tempo depois
const NETLAG=Math.max(0,+new URLSearchParams(location.search).get('netlag')||0);
function send(o){try{if(S.conn?.send){if(NETLAG){const c=S.conn;setTimeout(()=>{try{c.send(o)}catch{}},NETLAG/2)}else S.conn.send(o);return true}}catch(e){console.warn('[Eldoria online] envio',e)}return false}
function attach(conn){
 S.conn=conn;
 conn.onData=d=>onMsg(d);
 S.me={...profile()};S.ready=false;S.theirReady=false;S.them=null;
 send({t:'hello',p:profile()});
 clearInterval(S.pingT);S.pingT=setInterval(()=>send({t:'ping',at:performance.now()}),2000);
 go('lobby');
}
function peerConnAdapter(c){const a={send:o=>c.send(o),close:()=>c.close()};c.on('data',d=>a.onData?.(d));c.on('close',()=>lost('O outro jogador saiu da sala.'));c.on('error',()=>lost('A conexão caiu.'));return a}
function channelAdapter(ch){const a={send:o=>ch.send(JSON.stringify(o)),close:()=>ch.close()};ch.onmessage=e=>{try{a.onData?.(JSON.parse(e.data))}catch{}};ch.onclose=()=>lost('O outro jogador saiu.');return a}
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
  case'bye':lost('O outro jogador saiu da sala.');break;
  default:try{window.OnlineV46?.onMsg(m)}catch(e){console.error('[Eldoria online] luta',e)}
 }
}
const validHero=h=>Number.isInteger(+h)&&CHAMPIONS[+h]?+h:0;
function sanitize(p={}){return{name:String(p.name||'Lutador').slice(0,16),lv:Math.max(1,Math.min(100,+p.lv||1)),frame:/^[a-z]{2,10}$/.test(p.frame)?p.frame:'azul',photo:/^[hs]\d+$/.test(p.photo||'')?p.photo:'h0',hero:validHero(p.hero),tier:Math.max(0,Math.min(5,+p.tier||0)),league:String(p.league||'Bronze').slice(0,20)}}
function lost(msg){if(!S.conn&&!S.pc)return;try{window.OnlineV46?.abort(msg)}catch{}cleanup();S.err=msg;try{toast(msg)}catch{}go('home')}
function cleanup(){
 clearInterval(S.pingT);clearInterval(S.count);stopScan();
 try{S.conn&&send({t:'bye'})}catch{}
 const c=S.conn;S.conn=null;try{c?.close()}catch{}
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
function pick(id){if(!owned().includes(id)||S.ready)return;S.me.hero=id;if(S.me.photo?.[0]==='h'&&(window.ContaV42?.photoKey?.()||'auto')==='auto')S.me.photo='h'+id;send({t:'pick',hero:id,photo:S.me.photo});render()}
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
function sideChip(p,me,ready){
 if(!p)return `<div class="v46-chip ${me?'left':'right'} wait"><span class="v45-dots"><i></i><i></i><i></i></span><b>Esperando o amigo…</b></div>`;
 return `<div class="v46-chip ${me?'left':'right'} ${ready?'ready':''}">${avatar(p,'sm')}<span><b>${esc(p.name)}${me?' <em>(você)</em>':''}</b><small>Nv ${p.lv} · <span class="v43-rank" data-tier="${p.tier}">${esc(p.league)}</span></small></span><i class="v46-st">${ready?svg('check')+'PRONTO':'escolhendo'}</i></div>`;
}
function lobbyHtml(){
 const me=S.me,th=S.them,mine=owned(),mc=CHAMPIONS[me.hero]||CHAMPIONS[0],tc=th?CHAMPIONS[th.hero]:null;
 const tiles=CHAMPIONS.map(c=>{const own=mine.includes(c.id),on=me.hero===c.id,foe=th&&th.hero===c.id;return `<button class="v46-tile ${on?'on':''} ${own?'':'locked'} ${foe?'foe':''}" data-v45-hero="${c.id}" ${own&&!S.ready?'':'disabled'} aria-pressed="${on}" title="${esc(c.name)}${own?'':' · bloqueado'}" style="--hero:${c.color}"><img data-face="${c.id}" src="${esc(faceSrc(c.id))}" alt="">${foe?'<i class="v46-foe-mark" aria-hidden="true">RIVAL</i>':''}</button>`}).join('');
 return `<div class="v46-sel" style="--me:${mc.color};--th:${tc?.color||'#e2264d'}">
  <div class="v46-stage">
   <div class="v46-art left"><img src="${esc(artSrc(mc.id))}" alt=""></div>
   <div class="v46-art right ${th?'':'empty'}">${th?`<img src="${esc(artSrc(tc.id))}" alt="">`:''}</div>
   <div class="v46-mid">
    <div class="v46-fighter blue"><i class="v46-plat"></i><canvas class="v46-sprite" data-skin="${mc.id}" width="200" height="200" aria-hidden="true"></canvas></div>
    <div class="v46-vs"><b>VS</b><small>1×1</small></div>
    <div class="v46-fighter red"><i class="v46-plat"></i>${th?`<canvas class="v46-sprite flip" data-skin="${tc.id}" width="200" height="200" aria-hidden="true"></canvas>`:'<span class="v46-q">?</span>'}</div>
   </div>
   ${sideChip(me,true,S.ready)}${sideChip(th,false,S.theirReady)}
  </div>
  <div class="v46-names"><div class="v46-name blue">${esc(mc.name)}</div><div class="v46-hint">${S.ready?'Esperando o amigo ficar pronto…':'Toque para escolher seu lutador'}</div><div class="v46-name red">${tc?esc(tc.name):'? ? ?'}</div></div>
  <div class="v46-bottom"><span class="v45-ping">${svg('wifi')}<b id="v45Ping">${S.rtt==null?'…':S.rtt+' ms'}</b></span><div class="v46-grid" role="listbox" aria-label="Seu campeão">${tiles}</div>
   <button class="v46-go ${S.ready?'cancel':''}" data-v45="ready" ${th?'':'disabled'}>${S.ready?'CANCELAR':'PRONTO'}</button></div>
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
 const top=(title,back='home')=>`<header class="v43-top v45-top"><button class="v40-round v43-back" data-v45-back="${back}" aria-label="Voltar">${svg('back')}</button><b>${title}</b><span class="v45-tag">1×1</span></header>`;
 const err=S.err?`<p class="v45-err" role="alert">${esc(S.err)}</p>`:'';
 const busy=S.busy?`<p class="v45-busy"><span class="v45-spin"></span>${esc(S.busy)}</p>`:'';
 switch(S.view){
 case'home':return top('ONLINE','close')+`<div class="v45-body v45-home">${err}
  <div class="v45-big">
   <button class="v45-choice create" data-v45="create">${svg('plus')}<b>Criar sala</b><small>Receba um código e chame um amigo</small></button>
   <button class="v45-choice join" data-v45="join">${svg('door')}<b>Entrar na sala</b><small>Digite o código do seu amigo</small></button>
  </div>
  <button class="v45-near" data-v45="near">${svg('qr')}<span><b>Jogar perto · QR code</b><small>Sem internet: mesmo Wi-Fi ou roteador do celular</small></span></button>
  <p class="v45-note">Duelo 1×1 com um amigo. A luta online sincronizada chega na próxima atualização: por enquanto vocês já entram juntos na sala e escolhem os campeões.</p></div>`;
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
 case'lobby':return top('SALA '+(S.mode==='near'?'PERTO':S.code))+lobbyHtml();
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
  if(b.dataset.v45Back){const to=b.dataset.v45Back;if(to==='close')return close();if(to==='lobby')return go('lobby');cleanup();S.err='';return go(to)}
  if(b.dataset.v45Hero!=null)return pick(+b.dataset.v45Hero);
  const a=b.dataset.v45;if(!a)return;
  S.err='';
  if(a==='create')return createRoom();
  if(a==='join'){cleanup();return go('join')}
  if(a==='enter')return joinRoom($q('#v45Code')?.value);
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

window.OnlineV45={send,render,go,owned,profile,state:S,open,close,pack,unpack,cleanCode,_createRoom:createRoom,_join:joinRoom,_nearHostRead:nearHostRead,_nearGuestRead:nearGuestRead};
})();
