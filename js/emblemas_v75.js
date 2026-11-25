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
  try{
    const root=document.querySelector('#heroDetail');if(!root)return r;
    // o emblema vira o ícone do botão da MARCA do campeão (último botão da fileira de habilidades)
    const poe=()=>{const btn=root.querySelector('.hero-kit>button.mark-btn');if(!btn||btn.querySelector('.champ-emblem-ult'))return;
      btn.classList.add('has-emblem-ult');
      for(const e of [...btn.children])if(e.tagName!=='SMALL')e.style.display='none';
      btn.insertAdjacentHTML('afterbegin',img(Number(id),'champ-emblem-ult'))};
    poe();new MutationObserver(poe).observe(root,{childList:true,subtree:true});
  }catch{}
  return r};}
})();
