'use strict';
/* v75 — emblema de cada campeão (assets/emblemas_v75/emblema-N.webp, N = número do campeão - 1).
   Aparece no topo do cartão da tela dos campeões e ao lado do nome na janela "Ver 6 habilidades". ?emblemas=0 desliga. */
(function(){
if(/[?&]emblemas=0/.test(location.search))return;
const img=(id,cls)=>`<img class="${cls}" src="assets/emblemas_v75/emblema-${id}.webp" alt="" width="256" height="256" draggable="false" decoding="async">`;
if(typeof rosterCard==='function'){const prevRoster=rosterCard;rosterCard=function(c){
  const html=prevRoster.apply(this,arguments);
  try{return html.replace(/^(<button[^>]*>)/,'$1'+img(c.id,'hero-emblem'))}catch{return html}
};}
if(typeof championCard==='function'){const prevCard=championCard;
championCard=function(c){
  const html=prevCard.apply(this,arguments);
  try{return html.replace('<div class="champ-card-top">','<div class="champ-card-top has-emblem">'+img(c.id,'champ-emblem'))}catch{return html}
};}
if(typeof openChampionDetails==='function'){const prevOpen=openChampionDetails;openChampionDetails=function(id){
  const r=prevOpen.apply(this,arguments);
  try{const t=document.querySelector('#heroDetail .hero-heading')||document.querySelector('#championTitle');if(t&&!document.querySelector('.champ-emblem-big'))t.insertAdjacentHTML(t.id?'beforebegin':'afterbegin',img(id,'champ-emblem-big'))}catch{}
  return r};}
})();
