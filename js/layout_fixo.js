'use strict';
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
};
const landscapeGate=document.createElement('div');landscapeGate.id='landscapeGate';landscapeGate.setAttribute('role','status');landscapeGate.innerHTML='<div><span aria-hidden="true">↻</span><strong>Gire o celular</strong><p>Eldoria foi criada para jogar na horizontal.</p></div>';document.body.appendChild(landscapeGate);
