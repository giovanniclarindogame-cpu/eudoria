'use strict';
/*
 * Amigos (v68): adicionar amigos pelo CÓDIGO DE AMIGO, ver quem está online e convidar para jogar CONTRA (duelo 1×1) ou JUNTO (2×2, os dois na mesma equipe).
 *  - Precisa da conta (ContaSrv): o código de amigo (6 letras/números) é da conta; é diferente do código de recuperação (secreto).
 *  - Uma conexão "social" leve fica aberta enquanto o jogo está aberto (só para pedidos, presença e convites); a partida usa a conexão de jogo de sempre:
 *    quando o convite é aceito os dois recebem "ir" e pedem a sala do convite (OnlineV45.procurar(modo,{cid})).
 *  - Servidor: servidor/servidor.cjs (amigos, convites) e servidor/contas.cjs (listas).
 */
(function(){
const PROTO=3;
const url=()=>(new URLSearchParams(location.search).get('servidor')||window.ELDORIA_SERVIDOR||'').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $q=s=>document.querySelector(s);
const SOC={ws:null,ok:false,tent:0,lista:null,chat:null,convites:[],msg:'',msgTipo:'',aberta:false,pingT:0,pollT:0,retry:0,ocupado:new Set()};
const NOMES_ST={on:'Online',jogo:'Em partida',off:'Offline'};

/* ---------- conexão social ---------- */
function perfil(){try{return OnlineV45.profile()}catch{return{name:account?.profile?.name||'Lutador',lv:1,photo:'h0',frame:'azul'}}}
function podeConectar(){return !!url()&&!!window.ContaSrv?.tem?.()}
function conectar(){
 if(SOC.ws||!podeConectar())return;
 let ws;try{ws=new WebSocket(url())}catch{return}
 SOC.ws=ws;
 ws.onopen=()=>{try{ws.send(JSON.stringify({t:'hello',v:PROTO,build:window.ELDORIA_BUILD||1,social:1,conta:ContaSrv.codigo(),p:perfil()}))}catch{}};
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(SOC.ws===ws)tratar(m)};
 ws.onclose=()=>{if(SOC.ws!==ws)return;SOC.ws=null;SOC.ok=false;clearInterval(SOC.pingT);clearInterval(SOC.pollT);const w=Math.min(30000,2000*Math.pow(2,SOC.retry++));setTimeout(conectar,w);redesenhar()};
 ws.onerror=()=>{};
}
function enviar(o){try{if(SOC.ws&&SOC.ws.readyState===1&&SOC.ok){SOC.ws.send(JSON.stringify(o));return true}}catch{}return false}
function ligado(){
 SOC.ok=true;SOC.retry=0;
 clearInterval(SOC.pingT);SOC.pingT=setInterval(()=>{try{SOC.ws.send(JSON.stringify({t:'ping',at:Date.now()}))}catch{}},20000);
 clearInterval(SOC.pollT);SOC.pollT=setInterval(()=>{if(SOC.aberta)enviar({t:'amigos'})},10000);   // o status de quem joga muda sem aviso: atualiza a lista a cada 10 s
 enviar({t:'amigos'});
}
function aviso(txt,tipo){SOC.msg=txt;SOC.msgTipo=tipo||'';redesenhar();clearTimeout(aviso.t);aviso.t=setTimeout(()=>{SOC.msg='';redesenhar()},4500)}

function tratar(m){
 switch(m.t){
  case'hello':if(m.social)ligado();break;
  case'erro':if(m.m==='conta'){SOC.ws&&SOC.ws.close()}break;
  case'amigos':SOC.lista=m;badge();redesenhar();break;
  case'amigo_st':{const a=SOC.lista?.amigos?.find(x=>x.id===m.id);if(a){a.st=m.st;badge();redesenhar()}break}
  case'amigo_res':{
   if(m.ok){
    if(m.removeu)aviso('Amigo removido.');
    else if(m.resp)aviso(m.aceito?`${m.quem.nome} agora é seu amigo!`:'Pedido recusado.','ok');
    else aviso(m.aceito?`${m.quem.nome} agora é seu amigo!`:`Pedido enviado para ${m.quem.nome}.`,'ok');
   }else aviso({cod:'Não achei ninguém com esse código.',proprio:'Esse é o seu próprio código.',ja:'Vocês já são amigos.',pedido:'Você já enviou um pedido para essa pessoa.',limite:'Limite de amigos ou de pedidos atingido.',nada:'Esse pedido não existe mais.'}[m.erro]||'Não deu certo.','erro');
   break}
  case'chat_hist':if(SOC.chat&&SOC.chat.id===m.id){SOC.chat.msgs=m.msgs||[];SOC.chat.carregado=true;pintarChat(true)}break;
  case'chat_msg':chegouMsg(m);break;
  case'chat_erro':aviso({rapido:'Calma! Muitas mensagens seguidas.',amigo:'Vocês não são mais amigos.',vazio:'Escreva algo primeiro.'}[m.erro]||'Não enviou.','erro');break;
  case'convite':convidado(m);break;
  case'convite_fim':SOC.convites=SOC.convites.filter(c=>c.cid!==m.cid);redesenhar();break;
  case'convite_res':{
   const n=m.quem?.nome||'Seu amigo';
   if(m.st==='enviado')aviso(`Convite enviado para ${n}. Esperando…`,'ok');
   else if(m.st==='recusado')aviso(`${n} recusou o convite.`,'erro');
   else if(m.st==='ocupado')aviso(`${n} está ocupado agora.`,'erro');
   else if(m.st==='expirou')aviso(`${n} não respondeu ao convite.`,'erro');
   else if(m.st==='erro')aviso({off:`${n} não está online.`,ocupado:`${n} está em partida.`,'voce-ocupado':'Termine sua partida antes de convidar.',amigo:'Vocês ainda não são amigos.',cheio:'Servidor cheio, tente de novo em instantes.'}[m.erro]||'Não deu para convidar.','erro');
   break}
  case'ir':irParaSala(m);break;
 }
}

/* ---------- convite recebido ---------- */
function ocupadoAgora(){try{return state==='fight'||state==='count'||(window.OnlineV45&&(OnlineV45.state.procurando||OnlineV45.state.fase==='sala'))||(window.OnlineV46&&OnlineV46.match.on)}catch{return false}}
function convidado(m){
 if(ocupadoAgora()){enviar({t:'convite_resp',cid:m.cid,ok:0,ocupado:1});return}   // no meio de uma luta ou de uma busca: recusa sem atrapalhar
 SOC.convites=SOC.convites.filter(c=>c.cid!==m.cid);
 SOC.convites.push({...m,fim:Date.now()+(m.ms||40000)});
 try{if(navigator.vibrate)navigator.vibrate(120)}catch{}
 redesenhar();badge();
}
function responder(cid,ok){
 enviar({t:'convite_resp',cid,ok:ok?1:0});
 SOC.convites=SOC.convites.filter(c=>c.cid!==cid);redesenhar();badge();
}
function irParaSala(m){
 // os dois aceitaram: abre a conexão de jogo e pede a sala do convite (a tela da sala é a de sempre)
 SOC.convites=SOC.convites.filter(c=>c.cid!==m.cid);
 fechar();
 try{document.querySelectorAll('#v40Modes,#v40Menu').forEach(x=>x.hidden=true);document.body.classList.remove('v40-modes-open')}catch{}
 try{OnlineV45.procurar(m.modo==='2v2'?'2v2':'1v1',{cid:m.cid,amigo:m.com?.nome})}catch(e){console.error('[Eldoria] amigos',e)}
 redesenhar();badge();
}

/* ---------- tela ---------- */
function faceDe(a){
 try{const mt=/^h(\d+)$/.exec(a.photo||'');const id=mt?+mt[1]:null;if(id!=null&&window.CHAMPIONS&&CHAMPIONS[id]){const u=(window.v3FaceSrc&&v3FaceSrc({skin:id,kit:CHAMPIONS[id].kit}))||championArt(CHAMPIONS[id]);if(u)return`<img src="${esc(u)}" alt="">`}}catch{}
 return`<span class="a68-ini">${esc((a.nome||'?').slice(0,1).toUpperCase())}</span>`;
}
function linhaAmigo(a){
 const pode=a.st==='on';
 return`<li class="a68-amigo st-${esc(a.st)}"><span class="a68-face">${faceDe(a)}<i class="a68-dot" aria-hidden="true"></i></span>
  <span class="a68-info"><b>${esc(a.nome)}</b><small>Nv ${a.lv|0} · ${NOMES_ST[a.st]||'Offline'}</small></span>
  <span class="a68-acoes">
   <button class="a68-chatbtn" data-a68-chat="${esc(a.id)}" aria-label="Conversar com ${esc(a.nome)}" title="Conversar">💬${a.nao?`<i class="a68-n">${a.nao>9?'9+':a.nao}</i>`:''}</button>
   <button class="a68-btn" data-a68-conv="${esc(a.id)}" data-tipo="contra" ${pode?'':'disabled'} title="Duelo 1×1 contra ${esc(a.nome)}">⚔ Contra</button>
   <button class="a68-btn azul" data-a68-conv="${esc(a.id)}" data-tipo="junto" ${pode?'':'disabled'} title="Equipe 2×2 junto com ${esc(a.nome)}">🤝 Junto</button>
   <button class="a68-x" data-a68-del="${esc(a.id)}" aria-label="Remover ${esc(a.nome)}" title="Remover amigo">✕</button>
  </span></li>`;
}
function conteudo(){
 const L=SOC.lista,tem=podeConectar();
 if(!url())return`<p class="a68-vazio">O servidor de partidas ainda não está configurado.</p>`;
 if(!tem)return`<div class="a68-vazio"><p>Para ter amigos, você precisa de uma <b>conta</b> (sem e-mail e sem senha).</p><button class="a68-btn grande" data-a68-conta>Criar minha conta</button></div>`;
 if(!SOC.ok||!L)return`<p class="a68-vazio"><span class="v45-spin"></span> Conectando…</p>`;
 const online=L.amigos.filter(a=>a.st!=='off'),off=L.amigos.filter(a=>a.st==='off');
 return`<div class="a68-cols">
  <section class="a68-col">
   <div class="a68-card"><small class="a68-rot">SEU CÓDIGO DE AMIGO</small><div class="a68-cod" id="a68Cod">${esc(L.cod)}</div>
    <div class="a68-linha"><button class="a68-btn" data-a68-copiar>Copiar</button><button class="a68-btn azul" data-a68-compartilhar>Compartilhar</button></div>
    <small class="a68-dica">Passe esse código para seu amigo. Ele digita abaixo e te manda um pedido.</small></div>
   <div class="a68-card"><small class="a68-rot">ADICIONAR AMIGO</small>
    <form class="a68-add" data-a68-form><input id="a68In" maxlength="9" placeholder="CÓDIGO DO AMIGO" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" aria-label="Código do amigo"><button class="a68-btn" type="submit">Adicionar</button></form></div>
   ${L.recebidos.length?`<div class="a68-card"><small class="a68-rot">PEDIDOS RECEBIDOS (${L.recebidos.length})</small><ul class="a68-lista">${L.recebidos.map(a=>`<li class="a68-amigo"><span class="a68-face">${faceDe(a)}</span><span class="a68-info"><b>${esc(a.nome)}</b><small>quer ser seu amigo</small></span><span class="a68-acoes"><button class="a68-btn" data-a68-resp="${esc(a.id)}" data-ok="1">Aceitar</button><button class="a68-x" data-a68-resp="${esc(a.id)}" data-ok="0" aria-label="Recusar" title="Recusar">✕</button></span></li>`).join('')}</ul></div>`:''}
   ${L.enviados.length?`<div class="a68-card"><small class="a68-rot">AGUARDANDO RESPOSTA</small><ul class="a68-lista">${L.enviados.map(a=>`<li class="a68-amigo"><span class="a68-face">${faceDe(a)}</span><span class="a68-info"><b>${esc(a.nome)}</b><small>pedido enviado</small></span><span class="a68-acoes"><button class="a68-x" data-a68-del="${esc(a.id)}" aria-label="Cancelar pedido" title="Cancelar pedido">✕</button></span></li>`).join('')}</ul></div>`:''}
  </section>
  <section class="a68-col a68-col-lista"><div class="a68-card cheio"><small class="a68-rot">MEUS AMIGOS (${L.amigos.length}) · ${L.amigos.filter(a=>a.st!=='off').length} ONLINE</small>
   ${L.amigos.length?`<ul class="a68-lista">${online.map(linhaAmigo).join('')}${off.map(linhaAmigo).join('')}</ul>`:`<p class="a68-vazio peq">Você ainda não tem amigos. Adicione pelo código ao lado!</p>`}</div></section>
 </div>`;
}
function raiz(){
 let el=$q('#amigosV68');
 if(!el){el=document.createElement('section');el.id='amigosV68';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-label','Amigos');document.body.appendChild(el);el.addEventListener('click',clique);el.addEventListener('submit',enviarForm)}
 return el;
}
function redesenhar(){
 desenharConvites();
 const el=$q('#amigosV68');if(!el||el.hidden)return;
 if(SOC.chat){atualizarCabChat();return}
 const foco=document.activeElement&&document.activeElement.id==='a68In'?document.getElementById('a68In').value:null;
 el.innerHTML=`<header class="a68-top"><button class="v40-round v43-back" data-a68-fechar aria-label="Voltar">‹</button><b>AMIGOS</b><span class="a68-estado ${SOC.ok?'on':''}">${SOC.ok?'conectado':'sem conexão'}</span></header>
  ${SOC.msg?`<p class="a68-aviso ${SOC.msgTipo}" role="status">${esc(SOC.msg)}</p>`:''}
  <div class="a68-corpo">${conteudo()}</div>`;
 if(foco!=null){const i=document.getElementById('a68In');if(i){i.value=foco;i.focus()}}
}
function abrir(){
 const el=raiz();SOC.aberta=true;el.hidden=false;document.body.classList.add('a68-open');
 try{document.querySelectorAll('#v40Modes,#v40Menu').forEach(x=>x.hidden=true);document.body.classList.remove('v40-modes-open')}catch{}
 redesenhar();
 if(window.ContaSrv?.tem?.()){conectar();if(SOC.ok)enviar({t:'amigos'})}
}
function fechar(){const el=$q('#amigosV68');SOC.aberta=false;SOC.chat=null;if(el)el.hidden=true;document.body.classList.remove('a68-open');try{if(appScreen==='home')renderLobbyHome()}catch{}}


/* ---------- chat ---------- */
const RAPIDAS=['Bora jogar? ⚔','Já vou! 👍','GG 👏','Me espera 1 min ⏳'];
const hora=ts=>{try{return new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}catch{return''}};
function amigoDe(id){return SOC.lista?.amigos?.find(a=>a.id===id)||null}
function abrirChat(id){
 const a=amigoDe(id);if(!a)return;
 SOC.chat={id,nome:a.nome,msgs:[],carregado:false};a.nao=0;badge();
 const el=raiz();
 el.innerHTML=`<header class="a68-top"><button class="v40-round v43-back" data-a68-chat-voltar aria-label="Voltar para a lista">‹</button>
   <span class="a68-face" id="a68CabFace">${faceDe(a)}<i class="a68-dot" aria-hidden="true"></i></span>
   <span class="a68-info"><b id="a68CabNome">${esc(a.nome)}</b><small id="a68CabSt"></small></span>
   <span class="a68-cab-acoes"><button class="a68-btn" data-a68-conv="${esc(id)}" data-tipo="contra" id="a68CabContra">⚔</button><button class="a68-btn azul" data-a68-conv="${esc(id)}" data-tipo="junto" id="a68CabJunto">🤝</button></span></header>
  <p class="a68-aviso" id="a68Aviso" hidden></p>
  <div class="a68-chat"><div class="a68-msgs" id="a68Msgs" aria-live="polite"><p class="a68-vazio peq">Carregando conversa…</p></div>
   <div class="a68-rapidas">${RAPIDAS.map((t,i)=>`<button class="a68-chip" data-a68-rapida="${i}">${esc(t)}</button>`).join('')}</div>
   <form class="a68-envio" data-a68-chatform><input id="a68Txt" maxlength="200" placeholder="Escreva uma mensagem…" autocomplete="off" aria-label="Mensagem"><button class="a68-btn grande" type="submit">Enviar</button></form></div>`;
 atualizarCabChat();
 enviar({t:'chat_hist',id});
 setTimeout(()=>document.getElementById('a68Txt')?.focus(),50);
}
function fecharChat(){SOC.chat=null;enviar({t:'amigos'});redesenhar()}
function atualizarCabChat(){
 const c=SOC.chat;if(!c)return;const a=amigoDe(c.id);if(!a)return;
 const st=document.getElementById('a68CabSt');if(st)st.textContent=`Nv ${a.lv|0} · ${NOMES_ST[a.st]||'Offline'}`;
 const dot=document.getElementById('a68CabFace');if(dot)dot.className='a68-face st-'+a.st;
 for(const id of ['a68CabContra','a68CabJunto']){const b=document.getElementById(id);if(b)b.disabled=a.st!=='on'}
 const av=document.getElementById('a68Aviso');if(av){av.hidden=!SOC.msg;av.textContent=SOC.msg;av.className='a68-aviso '+SOC.msgTipo}
}
function pintarChat(rolar){
 const box=document.getElementById('a68Msgs');if(!box||!SOC.chat)return;
 const perto=box.scrollHeight-box.scrollTop-box.clientHeight<80;
 const ms=SOC.chat.msgs;
 box.innerHTML=ms.length?ms.map(m=>`<div class="a68-m ${m.eu?'eu':'ele'}"><span>${esc(m.t)}</span><small>${hora(m.ts)}</small></div>`).join(''):`<p class="a68-vazio peq">Nenhuma mensagem ainda. Diga oi! 👋</p>`;
 if(rolar||perto)box.scrollTop=box.scrollHeight;
}
function enviarChat(texto){
 const c=SOC.chat;if(!c)return;
 const t=typeof texto==='string'&&/^\d+$/.test(texto)?RAPIDAS[+texto]:String(texto||'');
 if(!t.trim())return;
 if(!enviar({t:'chat',id:c.id,texto:t}))aviso('Sem conexão com o servidor.','erro');
}
function chegouMsg(m){
 // m.eu: mensagem que EU mandei (eco do servidor, vale para outros aparelhos meus); senão veio do amigo (m.de)
 const idAmigo=m.eu?m.id:m.de;
 if(SOC.chat&&SOC.chat.id===idAmigo&&SOC.aberta){
  SOC.chat.msgs.push({eu:!!m.eu,t:m.texto,ts:m.ts});if(SOC.chat.msgs.length>60)SOC.chat.msgs.shift();pintarChat(!!m.eu);
  if(!m.eu)enviar({t:'chat_lido',id:idAmigo});return;
 }
 if(m.eu)return;
 const a=amigoDe(idAmigo);if(a)a.nao=(a.nao||0)+1;
 try{toast(`💬 ${m.nome}: ${String(m.texto).slice(0,40)}`)}catch{}
 try{if(navigator.vibrate)navigator.vibrate(60)}catch{}
 badge();if(SOC.aberta&&!SOC.chat)redesenhar();
}
document.addEventListener('submit',e=>{
 if(!e.target.matches('[data-a68-chatform]'))return;e.preventDefault();
 const i=document.getElementById('a68Txt');const t=(i?.value||'').trim();if(!t)return;enviarChat(t);i.value='';i.focus();
});

/* ---------- convites na tela ---------- */
function desenharConvites(){
 let box=$q('#amigosConv68');
 if(!SOC.convites.length){if(box)box.hidden=true;return}
 if(!box){box=document.createElement('div');box.id='amigosConv68';box.setAttribute('role','alertdialog');document.body.appendChild(box);box.addEventListener('click',clique)}
 const c=SOC.convites[0],seg=Math.max(0,Math.ceil((c.fim-Date.now())/1000));
 box.hidden=false;
 box.innerHTML=`<div class="a68-conv"><small class="a68-rot">CONVITE DE AMIGO</small>
  <div class="a68-conv-quem"><span class="a68-face grande">${faceDe({photo:c.de.photo,nome:c.de.nome})}</span><div><b>${esc(c.de.nome)}</b><small>Nv ${c.de.lv|0}</small></div></div>
  <p>${c.tipo==='junto'?'quer jogar <b>junto com você</b> (equipe 2×2)':'te chamou para um <b>duelo 1×1</b>'}</p>
  <div class="a68-linha"><button class="a68-btn grande" data-a68-aceitar="${esc(c.cid)}">Aceitar (${seg}s)</button><button class="a68-btn cinza" data-a68-recusar="${esc(c.cid)}">Recusar</button></div></div>`;
}
setInterval(()=>{const antes=SOC.convites.length;SOC.convites=SOC.convites.filter(c=>c.fim>Date.now()-500);if(SOC.convites.length||antes)desenharConvites();if(antes&&!SOC.convites.length)badge()},1000);

/* ---------- ações ---------- */
function clique(e){
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-a68-fechar'))return fechar();
 if(b.hasAttribute('data-a68-conta')){try{(ContaSrv.tem()?Promise.resolve():ContaSrv.criar()).then(()=>{try{toast('Conta criada! Seu código de recuperação está em Menu › Minha conta.')}catch{}conectar();redesenhar()}).catch(()=>aviso('Não consegui criar a conta agora. Tente de novo.','erro'))}catch{}return}
 if(b.hasAttribute('data-a68-copiar')){const t=SOC.lista?.cod||'';try{navigator.clipboard.writeText(t).then(()=>aviso('Código copiado!','ok'),()=>prompt('Copie seu código:',t))}catch{prompt('Copie seu código:',t)}return}
 if(b.hasAttribute('data-a68-compartilhar')){
  const cod=SOC.lista?.cod||'',txt=`Me adiciona no Eldoria! Meu código de amigo: ${cod}`;
  if(navigator.share){navigator.share({title:'Eldoria',text:txt}).catch(()=>{})}else window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank','noopener');return}
 if(b.dataset.a68Chat)return abrirChat(b.dataset.a68Chat);
 if(b.hasAttribute('data-a68-chat-voltar')){fecharChat();return}
 if(b.dataset.a68Rapida!=null){enviarChat(b.dataset.a68Rapida);return}
 if(b.dataset.a68Conv){enviar({t:'convite',id:b.dataset.a68Conv,tipo:b.dataset.tipo});return}
 if(b.dataset.a68Del){if(confirm('Remover esse amigo (ou cancelar o pedido)?'))enviar({t:'amigo_del',id:b.dataset.a68Del});return}
 if(b.dataset.a68Resp){enviar({t:'amigo_resp',id:b.dataset.a68Resp,ok:b.dataset.ok==='1'?1:0});return}
 if(b.dataset.a68Aceitar)return responder(b.dataset.a68Aceitar,true);
 if(b.dataset.a68Recusar)return responder(b.dataset.a68Recusar,false);
}
function enviarForm(e){
 if(!e.target.matches('[data-a68-form]'))return;e.preventDefault();
 const i=document.getElementById('a68In'),cod=(i?.value||'').trim();if(!cod)return;
 if(enviar({t:'amigo_add',cod}))i.value='';else aviso('Sem conexão com o servidor. Tente de novo.','erro');
}
document.addEventListener('input',e=>{if(e.target.id==='a68In'){const v=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(e.target.value!==v)e.target.value=v}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&SOC.aberta)fechar()});

/* ---------- aviso (bolinha) no menu ---------- */
function naoLidas(){return (SOC.lista?.amigos||[]).reduce((n,a)=>n+(a.nao||0),0)}
function pendentes(){return (SOC.lista?.recebidos?.length||0)+SOC.convites.length+naoLidas()}
function badge(){
 const n=pendentes();
 const on=(SOC.lista?.amigos||[]).filter(a=>a.st!=='off').length;
 document.querySelectorAll('[data-v40-go="amigos"]').forEach(b=>{let i=b.querySelector('.a68-badge');if(n&&!i){i=document.createElement('i');i.className='a68-badge';b.appendChild(i)}if(i){i.textContent=n>9?'9+':n;i.hidden=!n}
  let sm=b.querySelector('small.a68-on');if(on&&!sm){sm=document.createElement('small');sm.className='a68-on';b.appendChild(sm)}if(sm){sm.textContent=on+' online';sm.hidden=!on}});
 document.querySelectorAll('[data-v40-menu],#openMenu,.v40-menu-btn').forEach(b=>b.classList.toggle('a68-tem',n>0));
}
document.addEventListener('eldoria-menu-aberto',badge);

/* ---------- inicia ---------- */
setInterval(()=>{if(!SOC.ws&&podeConectar())conectar()},4000);
setTimeout(()=>{if(podeConectar())conectar()},1500);
window.AmigosV68={abrir,fechar,state:SOC,conectar,enviar,responder,badge};
})();
