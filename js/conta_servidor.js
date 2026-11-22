'use strict';
/*
 * Conta com código de recuperação (cliente). Ver servidor/contas.cjs.
 *  - A conta é criada quando o jogador pede (Menu › Minha conta) ou na primeira vez que procura uma partida online. O servidor devolve um CÓDIGO
 *    (ex. K7QM-2XPA-9WDT-H4NC); o jogo o guarda neste aparelho (localStorage "eldoria.conta") e mostra para o jogador copiar.
 *  - O progresso (as chaves do localStorage que contam) é enviado ao servidor sozinho: ao abrir, a cada 25 s se mudou, ao esconder a página.
 *    Em outro aparelho, "Entrar com um código" traz o progresso de volta. Se dois aparelhos gravaram, vale o mais novo (o servidor avisa).
 *  - O servidor usa a conta para conferir os campeões liberados nas partidas online.
 */
(function(){
const KEYS=['eldoria-champions-v1','eldoria.retencao.v1','eldoria.cacada.v1','eldoria.arcade.v1','eldoria-lobby-v18','ecos-loadout'];
const REG='eldoria.conta';
const base=()=>{const u=(new URLSearchParams(location.search).get('servidor')||window.ELDORIA_SERVIDOR||'').trim();return u.replace(/^ws/,'http').replace(/\/+$/,'')};
const lerReg=()=>{try{return JSON.parse(localStorage.getItem(REG)||'null')}catch{return null}};
const gravarReg=r=>{try{localStorage.setItem(REG,JSON.stringify(r))}catch{}};
const tem=()=>!!lerReg()?.codigo;
const codigo=()=>lerReg()?.codigo||null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function pacote(){const ch={};for(const k of KEYS){try{const v=localStorage.getItem(k);if(v!=null)ch[k]=v}catch{}}return ch}
const texto=ch=>JSON.stringify(KEYS.map(k=>ch[k]??null));
async function api(rota,corpo){
 const b=base();if(!b)throw new Error('sem servidor');
 const r=await fetch(b+rota,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(corpo)});
 let j={};try{j=await r.json()}catch{}return{...j,status:r.status};
}
let emVoo=null;
function agora(){return Date.now()}

/* ---------- criar / entrar / sincronizar ---------- */
async function criar(){
 const ch=pacote(),r=await api('/conta/criar',{chaves:ch});
 if(!r.codigo)throw new Error(r.erro||'falhou');
 gravarReg({codigo:r.codigo,versao:r.versao,enviado:texto(ch),em:agora()});
 return r.codigo;
}
function aplicar(chaves,versao,cod){
 for(const k of KEYS){try{if(chaves[k]!=null)localStorage.setItem(k,chaves[k]);else localStorage.removeItem(k)}catch{}}
 gravarReg({codigo:cod,versao,enviado:texto(pacote()),em:agora()});
 location.reload();
}
async function entrarComCodigo(c){
 const r=await api('/conta/entrar',{codigo:c});
 if(r.status===404)return false;
 if(!r.chaves)throw new Error(r.erro||'falhou');
 aplicar(r.chaves,r.versao,String(c).toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/(.{4})(?=.)/g,'$1-'));
 return true;
}
async function sincronizar(forcar){
 const reg=lerReg();if(!reg?.codigo||!base())return 'sem';
 if(emVoo)return emVoo;
 emVoo=(async()=>{
  try{
   const ch=pacote(),t=texto(ch);
   if(!forcar&&t===reg.enviado)return 'igual';
   const r=await api('/conta/salvar',{codigo:reg.codigo,chaves:ch,base:reg.versao});
   if(r.status===200){gravarReg({...reg,versao:r.versao,enviado:t,em:agora()});return 'salvo'}
   if(r.status===409&&r.chaves){aplicar(r.chaves,r.versao,reg.codigo);return 'trocado'}   // outro aparelho gravou depois: fica o mais novo
   if(r.status===404)return 'sumiu';
   return 'erro';
  }catch{return 'offline'}
  finally{emVoo=null}
 })();
 return emVoo;
}
// antes de jogar online: garante conta (cria na primeira vez) e que o servidor já sabe os campeões atuais
async function garantir(){
 if(/[?&]allheroes=1/.test(location.search)||!base())return codigo();
 if(!tem()){try{await criar();try{toast('Conta criada! Seu código está em Menu › Minha conta.')}catch{}}catch{return null}}
 else await sincronizar();
 return codigo();
}
async function iniciar(){
 const reg=lerReg();if(!reg?.codigo||!base())return;
 try{
  const r=await api('/conta/entrar',{codigo:reg.codigo});
  if(r.status===200&&r.chaves){
   if(r.versao>reg.versao){
    // outro aparelho gravou depois: traz o progresso (só recarrega se for diferente do que está aqui)
    if(texto(r.chaves)!==texto(pacote()))return aplicar(r.chaves,r.versao,reg.codigo);
    gravarReg({...reg,versao:r.versao,enviado:texto(pacote()),em:agora()});
   }else await sincronizar();
  }
 }catch{}
}
setInterval(()=>{if(!document.hidden)sincronizar()},25000);
document.addEventListener('visibilitychange',()=>{if(document.hidden)sincronizar()});
addEventListener('pagehide',()=>{ // última chance: envia sem esperar resposta
 const reg=lerReg();if(!reg?.codigo||!base())return;const ch=pacote();if(texto(ch)===reg.enviado)return;
 try{navigator.sendBeacon(base()+'/conta/salvar',new Blob([JSON.stringify({codigo:reg.codigo,chaves:ch,base:reg.versao})],{type:'text/plain'}))}catch{}
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciar,300));else setTimeout(iniciar,300);

/* ---------- janela "Minha conta" ---------- */
function janela(){
 let el=document.getElementById('v55Conta');
 if(!el){el=document.createElement('div');el.id='v55Conta';el.className='v40-sheet';el.hidden=true;document.body.appendChild(el);
  el.addEventListener('click',async e=>{
   const b=e.target.closest('button');
   if(e.target===el||(b&&b.dataset.contaX!=null)){el.hidden=true;return}
   if(!b)return;
   const msg=t=>{const m=el.querySelector('.conta-msg');if(m)m.textContent=t||''};
   if(b.dataset.contaCriar!=null){b.disabled=true;msg('Criando a conta…');try{await criar();desenhar()}catch{b.disabled=false;msg('Não consegui falar com o servidor. Tente de novo em instantes.')}return}
   if(b.dataset.contaCopiar!=null){try{await navigator.clipboard.writeText(codigo());msg('Código copiado!')}catch{prompt('Copie seu código:',codigo())}return}
   if(b.dataset.contaDividir!=null){const t=`Meu código da conta no Eldoria: ${codigo()}`;if(navigator.share){try{await navigator.share({title:'Eldoria',text:t})}catch{}}else{try{await navigator.clipboard.writeText(t);msg('Texto copiado!')}catch{prompt('Copie:',t)}}return}
   if(b.dataset.contaEntrar!=null){
    const v=el.querySelector('#v55Cod').value.trim();if(v.replace(/[^A-Za-z0-9]/g,'').length<16){msg('O código tem 16 letras e números (ex.: K7QM-2XPA-9WDT-H4NC).');return}
    if(!confirm('Entrar com este código troca o progresso deste aparelho pelo da conta. Continuar?'))return;
    b.disabled=true;msg('Entrando…');
    try{const ok=await entrarComCodigo(v);if(!ok){b.disabled=false;msg('Código não encontrado. Confira as letras e tente de novo.')}}catch{b.disabled=false;msg('Não consegui falar com o servidor. Tente de novo em instantes.')}
   }
  });
 }
 return el;
}
function desenhar(){
 const el=janela(),reg=lerReg(),ok=base();
 const entrar=`<div class="conta-bloco"><span class="conta-rot">JÁ TENHO UM CÓDIGO</span><input id="v55Cod" class="conta-input" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX"><button class="conta-btn azul" data-conta-entrar>Entrar com este código</button></div>`;
 el.innerHTML=`<div class="v40-sheet-card conta-card"><header><b>Minha conta</b><button class="v40-round" data-conta-x aria-label="Fechar"><svg class="v40i" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 8l16 16M24 8 8 24"/></svg></button></header><div class="v40-sheet-body conta-body">
 ${!ok?'<p class="conta-p">O servidor de partidas ainda não está configurado.</p>':reg?.codigo?`
  <span class="conta-rot">SEU CÓDIGO</span>
  <div class="conta-codigo" aria-label="Seu código de recuperação">${esc(reg.codigo)}</div>
  <div class="conta-linha"><button class="conta-btn" data-conta-copiar>Copiar</button><button class="conta-btn azul" data-conta-dividir>Compartilhar</button></div>
  <p class="conta-p">Guarde este código: com ele você entra na sua conta em qualquer aparelho e recupera moedas, campeões e nível. <b>Quem tiver o código entra na sua conta</b>, e se você perdê-lo não dá para recuperar.</p>
  <p class="conta-ok">✓ Progresso salvo no servidor${reg.em?' · '+new Date(reg.em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''}</p>
  <details class="conta-det"><summary>Entrar com outro código</summary>${entrar}</details>`
 :`<p class="conta-p">Hoje seu progresso fica só <b>neste aparelho</b>: se você limpar o navegador, perde tudo. Crie sua conta para guardar o progresso e entrar de outro aparelho com um <b>código</b>. Não precisa de e-mail nem de senha.</p>
  <button class="conta-btn grande" data-conta-criar>Criar minha conta</button>${entrar}`}
 <p class="conta-msg" role="status"></p></div></div>`;
 el.hidden=false;
}
window.ContaSrv={tem,codigo,criar,sincronizar,garantir,entrarComCodigo,abrir:desenhar,pacote,KEYS};
})();
