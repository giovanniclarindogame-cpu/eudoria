'use strict';
/*
 * Telas v43 — Campeões, Loja e Dojo no mesmo visual da tela inicial e da tela de modos:
 * fundo da arena desfocado em azul, barra de topo com voltar (o #backHome de sempre), título dourado e carteira,
 * cartões azuis com borda dourada e etiqueta amarela com o nome em marrom. Só muda a aparência: o conteúdo e os
 * botões continuam sendo desenhados pelos arquivos de antes (menus_simples.js, loja_v3.js, jogo.js).
 */
(function(){
const $q=s=>document.querySelector(s);
const esc=s=>typeof escapeHTML==='function'?escapeHTML(String(s)):String(s);
const n=v=>{try{return lobbyWalletNumber(v)}catch{return String(v||0)}};
const ICO={
 coin:'<circle cx="16" cy="16" r="11"/><path d="M16 9v14M12 12.5c0-2 8-2 8 0s-8 2-8 5 8 2.5 8 0"/>',
 gem:'<path d="M9 5h14l5 7-12 15L4 12z"/><path d="M4 12h24M12 5l-3 7 7 15 7-15-3-7"/>',
 search:'<circle cx="14" cy="14" r="8"/><path d="M20 20l7 7"/>'
};
const svg=(k,c='')=>`<svg class="v40i ${c}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k]}</svg>`;
const SCREENS={selection:{title:'CAMPEÕES'},shopScreen:{title:'LOJA'},trainingScreen:{title:'DOJO'}};
function owned(){try{return CHAMPIONS.filter(c=>(account.champions||[]).includes(c.id)).length}catch{return 0}}
function topHtml(id){
 const wallet=`<span class="v43-wallet"><span>${svg('coin','v40gold')}<b>${n(account.coins)}</b></span><span>${svg('gem','v40blue')}<b>${n(account.crystals||0)}</b></span></span>`;
 const extra=id==='selection'?`<span class="v43-count">${owned()}/${CHAMPIONS.length}</span><span class="v43-search-slot"></span>`:'';
 return `<span class="v43-back-slot" aria-hidden="true"></span><b>${SCREENS[id].title}</b><span class="v43-top-r">${extra}${wallet}</span>`;
}
function ensureTop(sec){
 if(!sec||!account?.profile)return;
 let top=sec.querySelector(':scope>.v43-scrtop');
 if(!top){top=document.createElement('header');top.className='v43-top v43-scrtop';sec.prepend(top)}
 const search=sec.querySelector('.hero-search');   // a busca sobe para a barra do topo (guardada antes de redesenhar)
 top.innerHTML=topHtml(sec.id);
 if(sec.id==='selection'){const slot=top.querySelector('.v43-search-slot'),s=search;if(slot&&s){const inp=s.querySelector('input');if(inp)inp.placeholder='Buscar';if(!s.querySelector('svg'))s.querySelector('span')?.insertAdjacentHTML('afterbegin',svg('search'));slot.replaceWith(s)}}
}
// os arquivos antigos trocam o conteúdo inteiro da tela: recoloca a barra sempre que isso acontece
for(const id of Object.keys(SCREENS)){
 const sec=document.getElementById(id);if(!sec)continue;
 new MutationObserver(()=>{if(!sec.querySelector(':scope>.v43-scrtop'))ensureTop(sec)}).observe(sec,{childList:true});
}
const prevShow=showScreen;
showScreen=function(){const r=prevShow.apply(this,arguments);try{for(const id of Object.keys(SCREENS)){const s=document.getElementById(id);if(s&&!s.hidden)ensureTop(s)}}catch(e){console.error('[Eldoria] telas v43',e)}return r};
if(!document.querySelector('.v43-bg')){const bg=document.createElement('div');bg.className='v43-bg';bg.setAttribute('aria-hidden','true');document.body.prepend(bg)}
window.TelasV43={ensureTop};
})();
