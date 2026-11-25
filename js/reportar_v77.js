'use strict';
/*
 * v77 — botão "Reportar bug" na luta (🐞 logo abaixo do tempo). Ao tocar, o jogador pode escrever uma linha (opcional) e enviar:
 * o relatório da partida (modo, online, estado, arena/câmera, lutadores, erros do jogo, eventos recentes, aparelho) + uma foto pequena da arena.
 * Vai para o mesmo feedback do servidor (tipo "bug"): POST /feedback/enviar. ?reportar=0 desliga.
 */
(function(){
if(/[?&]reportar=0/.test(location.search))return;
const $q=s=>document.querySelector(s),safe=(f,d)=>{try{return f()}catch{return d}};
const base=()=>{const u=(new URLSearchParams(location.search).get('servidor')||window.ELDORIA_SERVIDOR||'').trim();return u.replace(/^ws/,'http').replace(/\/+$/,'')};

/* ---- eventos recentes (anel de 40): estado da luta, tela, rede, erros ---- */
const EV=[],t0=performance.now();
const ev=(e)=>{EV.push([+((performance.now()-t0)/1000).toFixed(1),String(e).slice(0,90)]);if(EV.length>40)EV.shift()};
let ultEstado='',ultOn='',ultFase='';
setInterval(()=>safe(()=>{
  if(typeof state==='string'&&state!==ultEstado){ev('estado '+ultEstado+'→'+state+' (relógio '+(+clock).toFixed(1)+')');ultEstado=state}
  const on=safe(()=>OnlineV46.match.on?'on':'off','?'),fase=safe(()=>OnlineV45.state.fase||'-','-');
  if(on!==ultOn){ev('partida online '+on);ultOn=on}if(fase!==ultFase){ev('online fase '+fase);ultFase=fase}
}),250);
addEventListener('resize',()=>ev('resize '+innerWidth+'x'+innerHeight+' canvas '+safe(()=>Math.round(cw)+'x'+Math.round(ch),'?')));
addEventListener('orientationchange',()=>ev('orientação'));
document.addEventListener('visibilitychange',()=>ev('aba '+document.visibilityState));
document.addEventListener('fullscreenchange',()=>ev('tela cheia '+(document.fullscreenElement?'on':'off')));
addEventListener('online',()=>ev('rede voltou'));addEventListener('offline',()=>ev('rede caiu'));
const prevAv=window.avisoErroLaco;window.avisoErroLaco=function(n){safe(()=>{if(n<=3||n%50===0)ev('erro do laço #'+n)});return prevAv&&prevAv.apply(this,arguments)};

/* ---- relatório ---- */
function montar(){
  const R={};
  R.versao=safe(()=>(document.querySelector('script[src*="jogo.js"]')?.src.match(/v=(\d+)/)||[])[1],'?');
  R.quando=new Date().toISOString();
  R.partida={estado:safe(()=>state),relogio:safe(()=>+(+clock).toFixed(1)),tempo:safe(()=>Math.round(time)),contagem:safe(()=>+(+count).toFixed(1)),modo:safe(()=>matchMode),atividade:safe(()=>battleActivity),
    arena:safe(()=>typeof modeRun!=='undefined'&&modeRun?modeRun.id:null),coroa:safe(()=>!!V3Crown.state.on),especial:safe(()=>V3Modes.special||null)};
  R.online=safe(()=>{const s=OnlineV45.state,m=OnlineV46.match;return{fase:s.fase,mode:s.mode,modo:s.modo,papel:s.role,rtt:s.rtt,vaga:s.sala&&s.sala.slot,jogando:!!m.on,procurando:!!s.procurando,diag:safe(()=>JSON.stringify(m.diag).slice(0,500))}});
  R.arena=safe(()=>{const m=ctx.getTransform();return{W,H,cw:+cw.toFixed(1),ch:+ch.toFixed(1),escala:+scale.toFixed(3),ox:+ox.toFixed(1),oy:+oy.toFixed(1),canvas:[canvas.width,canvas.height],css:(r=>[Math.round(r.width),Math.round(r.height),Math.round(r.left),Math.round(r.top)])(canvas.getBoundingClientRect()),matriz:[m.a,m.b,m.c,m.d,m.e,m.f].map(x=>+x.toFixed(2)),camAmpla:safe(()=>!!courtyardWide)}});
  R.lutadores=safe(()=>actors.map(a=>({n:String(a.label||'').slice(0,14),skin:a.skin,eq:a.team,hp:Math.round(a.hp),x:Math.round(a.x),y:Math.round(a.y),ia:!!a.bot})).slice(0,8));
  R.erros={laco:safe(()=>window.__errosLaco.lista.map(e=>e.msg+' @ '+e.pilha).slice(-6)),total:safe(()=>window.__errosLaco.n),pagina:safe(()=>FeedbackV66.erros.slice())};
  R.eventos=EV.slice(-30);
  R.desempenho={quadroMs:safe(()=>+vfxFrameCost.toFixed(1)),efeitos:safe(()=>vfxQuality),memoriaMB:safe(()=>Math.round(performance.memory.usedJSHeapSize/1048576))};
  R.aparelho={ua:navigator.userAgent.slice(0,140),tela:innerWidth+'x'+innerHeight,dpr:devicePixelRatio||1,toque:'ontouchstart' in window,orient:safe(()=>screen.orientation.type),telaCheia:!!document.fullscreenElement,
    rede:safe(()=>{const c=navigator.connection;return c?{tipo:c.effectiveType,rtt:c.rtt,economia:c.saveData}:null}),polir:!/polir=0/.test(location.search)};
  return R;
}
function captura(){
  return safe(()=>{const c=$q('#arena');if(!c||!c.width)return null;const w=480,h=Math.round(w*c.height/c.width),o=document.createElement('canvas');o.width=w;o.height=h;o.getContext('2d').drawImage(c,0,0,w,h);
    let q=.5,u=o.toDataURL('image/jpeg',q);while(u.length>70000&&q>.2){q-=.1;u=o.toDataURL('image/jpeg',q)}return u.length<90000?u:null},null);
}

/* ---- janelinha + envio ---- */
let pausei=false,ultEnvio=0,foto=null;
function fechar(){const el=$q('#bug77');if(el)el.remove();if(pausei){pausei=false;safe(()=>{if(state==='paused')togglePause()})}}
async function enviar(texto,msg,btn){
  if(Date.now()-ultEnvio<15000){msg.textContent='Espere alguns segundos para enviar outro.';return}
  if(!base()){msg.textContent='O servidor ainda não está configurado.';return}
  btn.disabled=true;msg.textContent='Enviando…';
  const rel=montar();
  const corpo=(com)=>JSON.stringify({tipo:'bug',nota:0,texto:('[PARTIDA] '+(texto||'sem descrição')+' · '+(rel.partida.coroa?'coroa':rel.partida.modo)+(rel.online&&rel.online.jogando?' online':' offline')+' · '+rel.partida.estado).slice(0,800),ctx:safe(()=>FeedbackV66.contexto(),{}),relatorio:rel,captura:com?foto:undefined});
  const post=(b)=>fetch(base()+'/feedback/enviar',{method:'POST',headers:{'content-type':'application/json'},body:b});
  try{
    let r;try{r=await post(corpo(true))}catch{r=null}
    if(!r||!r.ok){if(r&&r.status===429){msg.textContent='Muitos envios seguidos. Espere um minuto.';btn.disabled=false;return}r=await post(corpo(false))}   // servidor antigo: manda sem a foto
    if(r.status===429){msg.textContent='Muitos envios seguidos. Espere um minuto.';btn.disabled=false;return}
    if(!r.ok)throw new Error('http '+r.status);
    ultEnvio=Date.now();ev('relatório enviado');
    $q('#bug77 .b77-card').innerHTML='<b class="b77-ok">✓ Relatório enviado</b><p>Obrigado! Ele leva os dados da partida e uma foto da arena para eu achar o problema.</p><div class="b77-row"><button class="b77-b ok" data-b77="x">Voltar à luta</button></div>';
  }catch{btn.disabled=false;msg.textContent='Não consegui enviar agora. Confira a internet e tente de novo.'}
}
function abrir(){
  if($q('#bug77'))return;
  const b=$q('#battle');if(!b)return;
  foto=captura();ev('botão reportar');
  const online=safe(()=>!!OnlineV46.match.on,false);
  if(!online&&safe(()=>state==='fight')){pausei=true;safe(()=>togglePause())}
  const el=document.createElement('div');el.id='bug77';el.setAttribute('role','dialog');el.setAttribute('aria-label','Reportar bug');
  el.innerHTML=`<div class="b77-card"><b>Reportar problema</b><p>Vai junto o relatório da partida (modo, erros, aparelho) e uma foto da arena. ${online?'A luta continua.':'A luta fica em pausa.'}</p>
   <textarea maxlength="300" rows="2" placeholder="O que aconteceu? (opcional)"></textarea>
   <div class="b77-row"><button class="b77-b ok" data-b77="enviar">Enviar relatório</button><button class="b77-b" data-b77="x">Cancelar</button></div><p class="b77-msg" role="status"></p></div>`;
  el.addEventListener('click',e=>{const k=e.target.dataset&&e.target.dataset.b77;if(e.target===el||k==='x'){fechar();return}if(k==='enviar')enviar(el.querySelector('textarea').value.trim(),el.querySelector('.b77-msg'),e.target)});
  b.appendChild(el);
}
function montaBotao(){
  const bt=$q('#battle');if(!bt)return setTimeout(montaBotao,500);
  if($q('#bugBtn77'))return;
  const btn=document.createElement('button');btn.id='bugBtn77';btn.type='button';btn.textContent='🐞';btn.setAttribute('aria-label','Reportar bug');btn.title='Reportar bug';
  btn.addEventListener('click',e=>{e.stopPropagation();abrir()});
  for(const t of ['pointerdown','touchstart','mousedown'])btn.addEventListener(t,e=>e.stopPropagation());
  bt.appendChild(btn);
  // fica logo abaixo do tempo, ao lado esquerdo do botão de pausa (que já ocupa o centro): acompanha o tamanho e a posição dele
  const pos=()=>{const ps=$q('#pauseBtn');if(!ps||!ps.offsetParent)return;const a=ps.getBoundingClientRect(),b=bt.getBoundingClientRect();if(!a.width)return;
    const z=b.width/(bt.offsetWidth||b.width)||1,w=a.width/z;
    btn.style.cssText=`left:${(a.left-b.left)/z-w-6}px;top:${(a.top-b.top)/z}px;width:${w}px;height:${a.height/z}px`};
  pos();setInterval(pos,700);addEventListener('resize',pos);
}
montaBotao();
window.ReportarV77={montar,captura,abrir,eventos:EV};
})();
