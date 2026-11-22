'use strict';
/*
 * Enviar feedback (Menu › Enviar feedback): o jogador escolhe o tipo (bug, ideia, elogio, outro), dá uma nota de 1 a 5 e escreve. O jogo manda junto
 * um pouco de contexto para ajudar a entender (versão, tela e modo, aparelho, herói, últimos erros do jogo). O servidor guarda (servidor/feedback.cjs).
 */
(function(){
const base=()=>{const u=(new URLSearchParams(location.search).get('servidor')||window.ELDORIA_SERVIDOR||'').trim();return u.replace(/^ws/,'http').replace(/\/+$/,'')};
const erros=[];
addEventListener('error',e=>{erros.push(String(e.message||'erro').slice(0,160)+(e.filename?' @'+String(e.filename).split('/').pop()+':'+e.lineno:''));if(erros.length>5)erros.shift()});
addEventListener('unhandledrejection',e=>{erros.push('promessa: '+String(e.reason&&e.reason.message||e.reason).slice(0,140));if(erros.length>5)erros.shift()});
const TIPOS=[['bug','🐞 Bug'],['ideia','💡 Ideia'],['elogio','⭐ Gostei'],['outro','💬 Outro']];
let tipo='bug',nota=0;
function contexto(){
 const c={};
 try{c.versao=(document.querySelector('script[src*="jogo.js"]')?.src.match(/v=(\d+)/)||[])[1]||'?'}catch{}
 try{c.tela=String(appScreen)+(typeof state!=='undefined'?' · '+state:'')}catch{}
 try{c.modo=InicioV40.current().name}catch{}
 try{c.heroi=currentChampion().name}catch{}
 try{c.perfil=account.profile.name+(window.ContaV42?' · Nv '+ContaV42.rec().lv:'')}catch{}
 try{const s=OnlineV45.state;c.online=(s.fase||'-')+(s.modo?' · '+s.modo:'')+(s.rtt!=null?' · '+s.rtt+' ms':'')}catch{}
 c.aparelho=navigator.userAgent.slice(0,120);
 c.tela_px=innerWidth+'x'+innerHeight+' @'+(devicePixelRatio||1)+(('ontouchstart' in window)?' toque':'');
 if(erros.length)c.erros=erros.slice();
 return c;
}
function janela(){
 let el=document.getElementById('v55Feedback');
 if(!el){el=document.createElement('div');el.id='v55Feedback';el.className='v40-sheet';el.hidden=true;document.body.appendChild(el);
  el.addEventListener('click',async e=>{
   const b=e.target.closest('button');
   if(e.target===el||(b&&b.dataset.fbX!=null)){el.hidden=true;return}
   if(!b)return;
   if(b.dataset.fbTipo){tipo=b.dataset.fbTipo;el.querySelectorAll('[data-fb-tipo]').forEach(x=>x.classList.toggle('on',x===b));return}
   if(b.dataset.fbNota){nota=+b.dataset.fbNota;el.querySelectorAll('[data-fb-nota]').forEach(x=>x.classList.toggle('on',+x.dataset.fbNota<=nota));return}
   if(b.dataset.fbEnviar!=null){
    const t=el.querySelector('#v55FbTexto').value.trim(),msg=el.querySelector('.conta-msg');
    if(t.length<3){msg.textContent='Escreva um pouquinho sobre o que aconteceu.';return}
    if(!base()){msg.textContent='O servidor ainda não está configurado.';return}
    b.disabled=true;msg.textContent='Enviando…';
    try{
     const r=await fetch(base()+'/feedback/enviar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tipo,nota,texto:t,ctx:contexto()})});
     if(r.status===429){msg.textContent='Muitas mensagens seguidas. Espere um minuto e tente de novo.';b.disabled=false;return}
     if(!r.ok)throw new Error('http '+r.status);
     el.querySelector('.conta-body').innerHTML='<p class="fb-ok">✓ Obrigado!</p><p class="conta-p" style="text-align:center">Recebi sua mensagem. Ela ajuda muito a melhorar o jogo.</p><button class="conta-btn grande" data-fb-x>Fechar</button>';
    }catch{b.disabled=false;msg.textContent='Não consegui enviar agora. Confira a internet e tente de novo.'}
   }
  });
 }
 return el;
}
function abrir(){
 const el=janela();tipo='bug';nota=0;
 el.innerHTML=`<div class="v40-sheet-card conta-card"><header><b>Enviar feedback</b><button class="v40-round" data-fb-x aria-label="Fechar"><svg class="v40i" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 8l16 16M24 8 8 24"/></svg></button></header><div class="v40-sheet-body conta-body">
 <span class="conta-rot">O QUE VOCÊ QUER CONTAR?</span>
 <div class="fb-chips">${TIPOS.map(([k,l],i)=>`<button class="fb-chip${i===0?' on':''}" data-fb-tipo="${k}">${l}</button>`).join('')}</div>
 <span class="conta-rot">QUÃO DIVERTIDO ESTÁ? (OPCIONAL)</span>
 <div class="fb-notas">${[1,2,3,4,5].map(n=>`<button class="fb-nota" data-fb-nota="${n}" aria-label="${n} de 5">★</button>`).join('')}</div>
 <textarea id="v55FbTexto" class="conta-input fb-texto" maxlength="800" rows="4" placeholder="Conte o que aconteceu, o que você achou ou o que poderia melhorar…"></textarea>
 <button class="conta-btn grande" data-fb-enviar>Enviar</button>
 <p class="conta-p" style="font-size:11px;opacity:.8">Junto vão seu nome de jogador, o herói, a tela e o modelo do aparelho, só para eu entender o problema.</p>
 <p class="conta-msg" role="status"></p></div></div>`;
 el.hidden=false;
}
window.FeedbackV66={abrir,contexto,erros};
})();
