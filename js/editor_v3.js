'use strict';
/*
 * Editor de layout dentro da batalha (botão ✎ ao lado do tempo).
 * Arraste cada botão (habilidades 1/2/3, ultimate, dash) e o analógico; use o controle de tamanho; salve.
 * "Copiar código" gera um texto com as posições para você me mandar; "Colar código" aplica um layout recebido.
 * O layout fica salvo neste aparelho e vale para todos os heróis.
 */
(function(){
if(!window.COMBAT_V3)return;
const KEY='eldoria.layout.v3';
const battle=document.getElementById('battle');
const NAMES={s0:'Habilidade 1',s1:'Habilidade 2',s2:'Habilidade 3',s3:'Ultimate',dash:'Dash',stick:'Analógico'};
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
let work=JSON.parse(JSON.stringify(saved));
let editing=false,prev='fight',sel=null,drag=null;
const zoomOf=el=>{const w=el.offsetWidth||1;return el.getBoundingClientRect().width/w||1};
const eqBtns=()=>[...document.querySelectorAll('#equipped .skill:not(.v3-hidden)')];
const elOf=k=>k==='dash'?document.getElementById('attack'):k==='stick'?document.getElementById('stick'):eqBtns().find(e=>e.dataset.arc===k.slice(1));
const keyOf=el=>el.id==='attack'?'dash':el.id==='stick'?'stick':'s'+el.dataset.arc;
const num=v=>Math.round(v*10)/10;

function applyOne(k,cfg){
 const el=elOf(k);if(!el||!cfg)return;
 if(k==='stick'){
  if(cfg.left!=null){el.style.setProperty('left',cfg.left+'px','important');el.style.setProperty('top',cfg.top+'px','important');el.style.setProperty('bottom','auto','important')}
  if(cfg.sz){el.style.setProperty('width',cfg.sz+'px','important');el.style.setProperty('height',cfg.sz+'px','important')}
  return;
 }
 if(cfg.dx!=null){el.style.setProperty('--dx',cfg.dx+'px');el.style.setProperty('--dy',cfg.dy+'px')}
 if(cfg.sz)el.style.setProperty('--sz',cfg.sz+'px');
}
function apply(src){for(const k of Object.keys(NAMES))applyOne(k,(src||saved)[k])}
function clearInline(){
 for(const k of Object.keys(NAMES)){const el=elOf(k);if(!el)continue;
  if(k==='stick'){['left','top','bottom','width','height'].forEach(p=>el.style.removeProperty(p))}
  else el.style.removeProperty('--sz')}
}
window.V3Layout={apply:()=>apply(saved),applyStick:()=>applyOne('stick',saved.stick),get saved(){return saved},get editing(){return editing}};

/* ---------- interface ---------- */
const btn=document.createElement('button');btn.id='editBtn';btn.type='button';btn.setAttribute('aria-label','Editar layout dos botões');btn.textContent='✎';
battle.querySelector('.hud')?.appendChild(btn);
const panel=document.createElement('div');panel.id='editPanel';panel.hidden=true;
panel.innerHTML=`<div class="ep-row"><b id="epName">Toque num botão para escolher</b><label>Tamanho <input id="epSize" type="range" min="34" max="120" step="1" disabled></label></div>
<div class="ep-row"><button data-a="save">Salvar</button><button data-a="reset">Padrão</button><button data-a="copy">Copiar código</button><button data-a="paste">Colar código</button><button data-a="close">Fechar</button></div>
<textarea id="epCode" rows="3" hidden spellcheck="false" placeholder="Cole aqui o código do layout"></textarea><div class="ep-row" id="epMsg" aria-live="polite"></div>`;
battle.appendChild(panel);
const $q=s=>panel.querySelector(s);
const msg=t=>{$q('#epMsg').textContent=t};

function select(k){
 sel=k;document.querySelectorAll('.ed-sel').forEach(e=>e.classList.remove('ed-sel'));
 const el=k&&elOf(k);if(!el){$q('#epName').textContent='Toque num botão para escolher';$q('#epSize').disabled=true;return}
 el.classList.add('ed-sel');$q('#epName').textContent=NAMES[k];
 const s=$q('#epSize');s.disabled=false;s.value=Math.round(el.getBoundingClientRect().width/zoomOf(el));
}
function open(){
 if(editing||!['fight'].includes(state))return;
 editing=true;prev=state;state='paused';battle.classList.add('editing');panel.hidden=false;work=JSON.parse(JSON.stringify(saved));select(null);msg('Arraste os botões. Salve quando terminar.');
}
function close(keep){
 if(!editing)return;
 editing=false;battle.classList.remove('editing');panel.hidden=true;$q('#epCode').hidden=true;
 document.querySelectorAll('.ed-sel').forEach(e=>e.classList.remove('ed-sel'));
 if(!keep){clearInline();apply(saved)}
 if(state==='paused')state=prev;
}
btn.addEventListener('click',e=>{e.stopPropagation();editing?close(false):open()});
btn.addEventListener('pointerdown',e=>e.stopPropagation());

/* arrastar */
document.addEventListener('pointerdown',e=>{
 if(!editing)return;
 if(e.target.closest('#editPanel,#editBtn'))return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 const el=e.target.closest('#equipped .skill,#attack,#stick');
 if(!el){select(null);return}
 const k=keyOf(el);select(k);
 const z=zoomOf(el),cs=getComputedStyle(el),r=el.getBoundingClientRect();
 drag={k,el,id:e.pointerId,x:e.clientX,y:e.clientY,z,
  dx:parseFloat(el.style.getPropertyValue('--dx'))||0,dy:parseFloat(el.style.getPropertyValue('--dy'))||0,
  left:r.left/z,top:r.top/z};
 if(k==='stick'){const pr=document.getElementById('battle').getBoundingClientRect();drag.left=(r.left-pr.left)/z;drag.top=(r.top-pr.top)/z}
},true);
document.addEventListener('pointermove',e=>{
 if(!editing||!drag||e.pointerId!==drag.id)return;
 e.preventDefault();e.stopPropagation();
 const mx=(e.clientX-drag.x)/drag.z,my=(e.clientY-drag.y)/drag.z;
 const c=work[drag.k]||(work[drag.k]={});
 if(drag.k==='stick'){c.left=num(drag.left+mx);c.top=num(drag.top+my)}
 else{c.dx=num(drag.dx+mx);c.dy=num(drag.dy+my)}
 applyOne(drag.k,c);
},true);
const end=e=>{if(drag&&e.pointerId===drag.id)drag=null};
document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);

$q('#epSize').addEventListener('input',e=>{
 if(!sel)return;const c=work[sel]||(work[sel]={});c.sz=+e.target.value;
 const el=elOf(sel);if(sel!=='stick'&&c.dx==null){c.dx=parseFloat(el.style.getPropertyValue('--dx'))||0;c.dy=parseFloat(el.style.getPropertyValue('--dy'))||0}
 if(sel==='stick'&&c.left==null){const pr=battle.getBoundingClientRect(),r=el.getBoundingClientRect(),z=zoomOf(el);c.left=num((r.left-pr.left)/z);c.top=num((r.top-pr.top)/z)}
 applyOne(sel,c);
});
const code=()=>'ELDORIA-LAYOUT-V3:'+btoa(unescape(encodeURIComponent(JSON.stringify(work))));
panel.addEventListener('click',async e=>{
 const a=e.target.dataset?.a;if(!a)return;
 if(a==='save'){saved=JSON.parse(JSON.stringify(work));try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{}msg('Layout salvo neste aparelho.')}
 if(a==='reset'){work={};saved={};try{localStorage.removeItem(KEY)}catch{}clearInline();window.V3Relayout?.();select(null);msg('Voltou ao padrão (salvo).')}
 if(a==='copy'){const t=code(),ta=$q('#epCode');ta.hidden=false;ta.value=t;ta.focus();ta.select();let ok=false;try{await navigator.clipboard.writeText(t);ok=true}catch{try{ok=document.execCommand('copy')}catch{}}msg(ok?'Código copiado! Cole na conversa comigo.':'Selecione o texto da caixa e copie.')}
 if(a==='paste'){const ta=$q('#epCode');if(ta.hidden){ta.hidden=false;ta.value='';ta.focus();msg('Cole o código e toque em Colar código de novo.');return}
  try{const t=ta.value.trim().replace(/^ELDORIA-LAYOUT-V3:/,'');const o=JSON.parse(decodeURIComponent(escape(atob(t))));work=o;clearInline();apply(work);msg('Layout aplicado. Toque em Salvar para manter.')}catch{msg('Código inválido.')}}
 if(a==='close')close(false);
});
window.V3Editor={open,close,get work(){return work},code,select,applyOne};
})();
