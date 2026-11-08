'use strict';
/*
 * Menu v2.
 * 1) Texto abaixo do JOGAR curto, com "Regras" para ver o resto.
 * 2) Fora da tela inicial o menu lateral some (a tela usa toda a largura) e um botão de voltar
 *    aparece no canto superior direito (o CSS faz o resto: css/menu_v2.css).
 */
(()=>{
 const prevMode=updateLobbyMode;
 updateLobbyMode=function(){
  prevMode();
  const el=$('#lobbyModeCopy');
  if(!el||$('#lobbyModeSelect')?.value==='arenas'||!validOwnedKit(selected))return;
  const team=lobbyPrefs.mode==='2v2',win=dailyIncomeQuote(team?200:100).reward,loss=dailyIncomeQuote(team?50:25).reward;
  el.innerHTML=`<span class="mode-short">${team?'2×2':'1×1'} contra bots · vitória: +${win} moedas</span> <button type="button" class="mode-info" data-mode-info aria-expanded="false">Regras</button><span class="mode-more" hidden>Derrota: +${loss} moedas. ${dailyIncomeText()}</span>`;
 };
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-mode-info]');if(!b)return;
  const more=b.parentElement.querySelector('.mode-more'),open=more.hidden;
  more.hidden=!open;b.setAttribute('aria-expanded',String(open));b.textContent=open?'Ocultar':'Regras';
 });

 /*
  * Santuário da tela inicial: usa a ilustração grande do campeão (a mesma de Campeões/Dojo) em vez do corpo
  * pixelado de combate, que é pequeno. O corpo pixelado continua existindo só dentro da batalha.
  */
 function heroArtURL(){try{return championArt(currentChampion())}catch{return''}}
 function paintHeroArt(){
  const btn=document.querySelector('.royal-hero');if(!btn)return;
  let img=btn.querySelector('.royal-hero-art');
  if(!img){btn.innerHTML='<img class="royal-hero-art" alt="" draggable="false">';img=btn.firstElementChild}
  const url=heroArtURL();if(img.getAttribute('src')!==url)img.setAttribute('src',url);
  img.alt=currentChampion().name;
 }
 const prevHomeArt=renderLobbyHome;
 renderLobbyHome=function(){prevHomeArt.apply(this,arguments);paintHeroArt()};
 const prevBuild=renderLobbyBuild;
 renderLobbyBuild=function(){prevBuild.apply(this,arguments);paintHeroArt()};
 const back=document.createElement('button');
 back.id='backHome';back.type='button';back.dataset.nav='home';
 back.setAttribute('aria-label','Voltar ao início');back.title='Voltar ao início';
 back.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>';
 document.body.appendChild(back);
 // Dentro do detalhe de um campeão, voltar fecha o detalhe e mostra a lista (não vai ao início).
 document.addEventListener('click',e=>{
  if(!e.target.closest('#backHome')||!document.body.classList.contains('hero-detail-open'))return;
  e.preventDefault();e.stopImmediatePropagation();closeHeroDetail();
 },true);
 if(typeof updateLobbyMode==='function'&&document.getElementById('lobbyModeSelect'))updateLobbyMode();
})();
