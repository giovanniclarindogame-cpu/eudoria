'use strict';
/*
 * v71 — tela do campeão: botão "Esquiva" (o dash do combate) com ícone, nome, descrição e recarga, ANTES de todas as habilidades; sem texto (ULT/ESQ) nos ícones.
 *  - campeões cuja esquiva é uma habilidade do kit (Astral, Ronin, Solar, Caçador, Corsário, Cavaleiro): usa o ícone, o nome e a descrição dela;
 *  - campeões com deslize próprio (Ninja, Eclipse, Herdeiro, Alquimista): texto escrito aqui, igual ao que o combate faz (js/combate_v3.js).
 */
(function(){
if(!window.COMBAT_V3||!window.V3API)return;
const V2=V3API.V2,INV='0,28 s';
const PROPRIA={
 kakashi:{nome:'Passo de Fumaça',desc:'Desliza 130 deixando uma imagem residual e uma nuvem de fumaça. Invulnerável por um instante durante o passo.',cd:V3API.DASH_CD},
 blink:{nome:'Teleporte Livre',desc:'Teleporta até 220 na direção em que você está se movendo, invulnerável por um instante. Se a Barreira Cósmica estiver inteira e com 50 de energia, o teleporte a levanta por 1,6 s.',cd:V3API.DASH_CD},
 generico:{
  6:{nome:'Deslize do Vento',desc:'Desliza 170, invulnerável por um instante. Uma rajada de vento empurra quem está perto do ponto de partida e o deixa lento por 0,6 s.',cd:3.5},
  9:{nome:'Deslize de Aço',desc:'Desliza 170, invulnerável por um instante, e deixa um bloco de pedra para trás, logo depois da partida.',cd:3.5}
 }
};
const SETA='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20l9-9 4 4 9-9M19 6h8v8"/></svg>';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function info(id){
 const c=CHAMPIONS[id],v=V2[id];if(!c||!v)return null;
 if(typeof v.dash==='number'){const sid=c.kit[v.dash],s=skills[sid];if(!s)return null;
  return{sid,nome:s.name,desc:s.desc,cd:Math.min(s.cd||V3API.DASH_CD,V3API.DASH_CD),custo:s.cost||0}}
 const p=v.dash==='generico'?PROPRIA.generico[id]:PROPRIA[v.dash];
 // ícone: o MESMO do botão de dash da batalha (js/combate_v3.js): Ninja, Eclipse e Herdeiro mostram a arte da habilidade 4 do kit; o Alquimista usa a seta
 return p?{sid:(id===1||id===4||id===6)?c.kit[3]:null,nome:p.nome,desc:p.desc,cd:p.cd,custo:0}:null;
}
const texto=d=>`<b>ESQUIVA · ${esc(d.nome)}</b><p>${esc(d.desc)}</p><span>${d.custo>0?d.custo+' MP':'Sem custo'} <i>·</i> ${String(d.cd).replace('.',',')} s de recarga <i>·</i> invulnerável ${INV}</span>`;

const prev=openChampionDetails;
openChampionDetails=function(id){
 const r=prev.apply(this,arguments);
 try{
  const el=document.getElementById('heroDetail'),d=info(Number(id));if(!el||!d)return r;
  const kit=el.querySelector('.hero-kit');if(!kit||kit.querySelector('[data-hero-esquiva]'))return r;
  const b=document.createElement('button');b.type='button';b.className='esquiva-btn';b.dataset.heroEsquiva='1';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Esquiva: '+d.nome);
  const dimg=window.V3_DASH_IMG&&window.V3_DASH_IMG[Number(id)];
  b.innerHTML=d.sid!=null?icon(d.sid):dimg?'<span class="dash-img" style="background-image:url(\''+dimg+'\')"></span>':'<span class="esq-seta">'+SETA+'</span>';   // sem texto no ícone
  kit.insertBefore(b,kit.firstChild);   // a esquiva vem ANTES de todas as habilidades (como o dash na batalha)
  kit.querySelectorAll('[data-hero-skill] small').forEach(x=>{x.textContent=''});   // sem "ULT" nem números nos ícones
 }catch(e){console.error('[Eldoria] esquiva no detalhe',e)}
 return r;
};
document.addEventListener('click',e=>{
 const el=document.getElementById('heroDetail');if(!el||!el.contains(e.target))return;
 const esq=e.target.closest('[data-hero-esquiva]'),hab=e.target.closest('[data-hero-skill]');
 if(esq){
  const d=info(typeof detailChampion!=='undefined'?detailChampion:-1);if(!d)return;
  e.stopPropagation();
  el.querySelectorAll('[data-hero-skill]').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false')});
  esq.classList.add('active');esq.setAttribute('aria-pressed','true');
  const t=document.getElementById('heroSkillCopy');if(t)t.innerHTML=texto(d);
 }else if(hab){const q=el.querySelector('[data-hero-esquiva]');if(q){q.classList.remove('active');q.setAttribute('aria-pressed','false')}}
},true);
window.EsquivaDetalhe={info,texto};
})();
