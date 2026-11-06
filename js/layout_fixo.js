'use strict';
const fullscreenSymbol='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/></svg>';
const fullscreenHomeRender=renderLobbyHome;
renderLobbyHome=function(){fullscreenHomeRender();const settings=$('#openLobbySettings');if(settings&&!$('#restoreFullscreen'))settings.insertAdjacentHTML('afterend',`<button id="restoreFullscreen" class="royal-settings" data-enter-fullscreen aria-label="Tela cheia" title="Tela cheia">${fullscreenSymbol}</button>`);};
const pauseFullscreen=document.createElement('button');pauseFullscreen.type='button';pauseFullscreen.dataset.enterFullscreen='';pauseFullscreen.className='pause-fullscreen';pauseFullscreen.setAttribute('aria-label','Tela cheia');pauseFullscreen.innerHTML=fullscreenSymbol;$('#pause .dialog')?.appendChild(pauseFullscreen);
document.addEventListener('click',async event=>{if(event.target.closest('[data-enter-fullscreen]')&&!await window.eldoriaDisplay?.enter())document.dispatchEvent(new CustomEvent('eldoria-fullscreen-fallback'));});
const fixedNavItems=[['home','Início','home'],['library','Campeões','crest'],['training','Dojo','swords'],['arenas','Arenas','compass'],['missions','Missões','quest'],['league','Liga','crown']];
renderLobbyNav=function(){
 const nav=$('#lobbyNav');if(!account.profile||$('#battle').style.display==='block'){nav.hidden=true;return;}
 const current=appScreen==='arenas'?'arenas':appScreen;nav.hidden=false;nav.className='royal-nav fixed-nav';
 nav.innerHTML=fixedNavItems.map(([id,label,icon])=>{const action=id==='arenas'?'data-open-modes':id==='missions'?'data-royal-missions':`data-nav="${id}"`,selected=current===id;return `<button ${action} class="${selected?'current':''}" ${selected?'aria-current="page"':''}>${royalIcon(icon)}<span>${label}</span></button>`;}).join('');
};
simpleHeader=function(title,subtitle=''){return `<header class="simple-header"><div><span class="simple-wordmark">ELDORIA</span><h1>${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}</div></header>`;};
document.addEventListener('click',event=>{
 const navigation=event.target.closest('[data-nav],[data-open-modes],[data-royal-missions]');if(navigation&&document.body.classList.contains('hero-detail-open'))closeHeroDetail();
 if(event.target.closest('[data-royal-missions]')){if(appScreen!=='home')showScreen('home');requestAnimationFrame(()=>{$('#journeyHome')?.scrollIntoView({behavior:lobbyMotionEnabled()?'smooth':'auto',block:'nearest'});$('#journeyHome')?.focus({preventScroll:true});});}
});
const fixedLayoutBoot=integrationBoot;
integrationBoot=async function(){
 await fixedLayoutBoot();if(account.profile)showScreen('home');
 const form=$('#profileForm'),submit=form.onsubmit;form.onsubmit=event=>{submit(event);if(account.profile&&form.closest('#profileScreen').hidden)showScreen('home');};renderLobbyNav();
 const enter=$('#welcomeEnter');if(enter){enter.disabled=false;enter.textContent='ENTRAR';}
};
const landscapeGate=document.createElement('div');landscapeGate.id='landscapeGate';landscapeGate.setAttribute('role','status');landscapeGate.innerHTML='<div><span aria-hidden="true">↻</span><strong>Gire o celular</strong><p>Eldoria foi criada para jogar na horizontal.</p></div>';document.body.appendChild(landscapeGate);
const welcomeScreen=document.createElement('section');welcomeScreen.id='welcomeScreen';welcomeScreen.setAttribute('aria-label','Entrada de Eldoria');
welcomeScreen.innerHTML=`<div class="welcome-panel"><div class="welcome-crest" aria-hidden="true">${royalIcon('crest')}</div><span class="welcome-eyebrow">ARENA DOS CAMPEÕES</span><h1>Bem-vindo à Eldoria Arena</h1><p>Seu próximo duelo começa aqui.</p><button id="welcomeEnter" type="button" disabled>CARREGANDO…</button></div>`;
document.body.appendChild(welcomeScreen);
$('#welcomeEnter').addEventListener('click',async event=>{
 const button=event.currentTarget;button.disabled=true;button.textContent='ENTRANDO…';
 const fullscreen=await window.eldoriaDisplay?.enter?.();
 if(fullscreen===false&&matchMedia('(pointer:coarse)').matches)document.dispatchEvent(new CustomEvent('eldoria-fullscreen-fallback'));
 welcomeScreen.classList.add('is-leaving');setTimeout(()=>welcomeScreen.remove(),450);
 if(account.profile)showScreen('home');
});
