'use strict';
/*
 * Loja, presente inicial e rodízio semanal (progressão v3).
 * - A conta começa sem campeões: o primeiro acesso dá 1 campeão de presente (sorteado).
 * - Todo campeão custa HERO_PRICE moedas (≈ 1 semana de jogo diário). Diamantes (💎) ficam bloqueados por enquanto.
 * - 3 campeões ficam liberados de graça por semana (sorteio igual para todos, muda toda segunda-feira) — dá para jogá-los sem comprar.
 * - Campeões não liberados aparecem bloqueados em Campeões e nas telas de seleção.
 */
(function(){
const $q=s=>document.querySelector(s);
const fmt=n=>Number(n||0).toLocaleString('pt-BR');
const owned=id=>heroOwned(id);
const freeNow=id=>!owned(id)&&heroesFreeThisWeek().includes(id);
const usable=id=>heroUsable(id);

/* ---------- janelinha simples (confirmação / presente) ---------- */
function modal(html,cls=''){
 $q('#ljModal')?.remove();
 const m=document.createElement('div');m.id='ljModal';m.className='lj-modal '+cls;m.innerHTML=`<div class="lj-dialog" role="dialog" aria-modal="true">${html}</div>`;
 document.body.appendChild(m);return m;
}
const closeModal=()=>$q('#ljModal')?.remove();

/* ---------- presente inicial ---------- */
function giftModal(id){
 const c=CHAMPIONS[id];
 modal(`<span class="lj-gift-tag">🎁 PRESENTE INICIAL</span><img src="${championArt(c)}" alt="${escapeHTML(c.name)}"><h2>${escapeHTML(c.name)}</h2><p>É seu! Todo campeão novo custa ${fmt(HERO_PRICE)} moedas na Loja, e 3 campeões ficam liberados de graça a cada semana.</p><button class="gold" data-lj-close>Começar</button>`,'gift');
}
function claimGift(){
 if(!account.profile||!account.giftPending||ALL_HEROES_DEBUG)return false;
 const id=Math.floor(random01()*CHAMPIONS.length);
 account.ownedHeroes=[...new Set([...(account.ownedHeroes||[]),id])];account.giftPending=false;account.activeChampion=id;
 normalizeChampions();saveAccount();
 try{showScreen('home')}catch{}
 giftModal(id);return true;
}
showFirstSummon=function(){normalizeChampions();showScreen('home');claimGift()};

/* ---------- compra ---------- */
function buyHero(id){
 const c=CHAMPIONS[id];if(!c||owned(id))return false;
 if((account.coins||0)<HERO_PRICE){toast(`Faltam ${fmt(HERO_PRICE-(account.coins||0))} moedas para ${c.name}.`);return false}
 account.coins-=HERO_PRICE;account.ownedHeroes=[...new Set([...(account.ownedHeroes||[]),id])];
 normalizeChampions();saveAccount();
 toast(`${c.name} é seu!`);
 return true;
}
function confirmBuy(id){
 const c=CHAMPIONS[id];if(!c||owned(id))return;
 if((account.coins||0)<HERO_PRICE){toast(`Faltam ${fmt(HERO_PRICE-(account.coins||0))} moedas para ${c.name}.`);return}
 modal(`<h2>Comprar ${escapeHTML(c.name)}?</h2><p>Custa <b>${fmt(HERO_PRICE)} 🪙</b>. Você tem ${fmt(account.coins)}.</p><div class="lj-actions"><button class="ghost" data-lj-close>Cancelar</button><button class="gold" data-lj-do="${id}">Comprar</button></div>`);
}

/* ---------- tela da Loja ---------- */
function countdown(){
 const ms=Math.max(0,nextFreeRotation()-Date.now()),d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5);
 return d>0?`${d}d ${h}h`:`${h}h`;
}
function heroCard(c){
 const own=owned(c.id),free=freeNow(c.id);
 return `<article class="lj-card ${own?'own':''}" style="--hero:${c.color}"><div class="lj-art"><img src="${championArt(c)}" alt="" draggable="false">${free?'<span class="lj-tag">GRÁTIS NA SEMANA</span>':''}</div><strong>${escapeHTML(c.name)}</strong>${own?'<span class="lj-own">✓ SEU</span>':`<button class="gold lj-buy" data-lj-buy="${c.id}">🪙 ${fmt(HERO_PRICE)}</button><button class="lj-gem-btn" disabled title="Em breve">💎 bloqueado</button>`}</article>`;
}
renderShop=function(){
 normalizeChampions();
 const free=heroesFreeThisWeek();
 $q('#shopScreen').innerHTML=`<div class="lj"><header class="lj-head"><button class="ghost" data-nav="home">← Início</button><div><span class="eyebrow">ELDORIA</span><h1>Loja</h1></div><div class="lj-wallet"><span class="lj-coin">🪙 ${fmt(account.coins)}</span><span class="lj-gem" title="Diamantes: em breve">💎 ${fmt(account.crystals||0)} <small>bloqueado</small></span></div></header>
 <section class="lj-sec"><h2>Grátis da semana <small>renova em ${countdown()}</small></h2><div class="lj-free">${free.map(id=>{const c=CHAMPIONS[id];return `<button class="lj-freecard" data-hero-open="${id}" style="--hero:${c.color}"><img src="${championArt(c)}" alt="" draggable="false"><span><strong>${escapeHTML(c.name)}</strong><small>${owned(id)?'Você já tem':'Jogue de graça'}</small></span></button>`}).join('')}</div></section>
 <section class="lj-sec"><h2>Campeões <small>${fmt(HERO_PRICE)} moedas cada · 💎 bloqueado por enquanto</small></h2><div class="lj-grid">${CHAMPIONS.map(heroCard).join('')}</div></section></div>`;
};

/* ---------- aba "Loja" no menu lateral ---------- */
const prevNav=renderLobbyNav;
renderLobbyNav=function(){
 const r=prevNav.apply(this,arguments);
 try{
  const nav=$q('#lobbyNav');
  if(appScreen==='home'&&nav&&!nav.hidden&&!nav.querySelector('[data-nav="shop"]')){
   const lib=nav.querySelector('[data-nav="library"]');
   const b=document.createElement('button');b.dataset.nav='shop';b.innerHTML=`${royalIcon('shop')}<span>Loja</span>`;
   (lib||nav.firstElementChild).after(b);
  }
 }catch(e){console.error('[Eldoria] menu Loja',e)}
 return r;
};
const prevShow=showScreen;
showScreen=function(name){
 if(name==='shop'&&account.profile){
  prevShow('library');
  try{$q('#selection').hidden=true;$q('#loadout').hidden=true;$q('#shopScreen').hidden=false;appScreen='shop';document.body.dataset.screen='shop';renderShop();renderLobbyNav();scrollTo(0,0)}catch(e){console.error('[Eldoria] Loja',e)}
  return;
 }
 return prevShow.apply(this,arguments);
};

/* ---------- campeões bloqueados em Campeões e no detalhe ---------- */
const prevCard=rosterCard;
rosterCard=function(c){
 let html=prevCard(c);
 const own=owned(c.id),free=freeNow(c.id);
 if(own)return html;
 const badge=free?'<span class="lj-badge free">GRÁTIS NA SEMANA</span>':`<span class="lj-badge lock">🔒 ${fmt(HERO_PRICE)} 🪙</span>`;
 html=html.replace('class="hero-card ',`class="hero-card ${free?'week-free':'locked'} `);
 const k=html.lastIndexOf('</button>');
 return k>=0?html.slice(0,k)+badge+html.slice(k):html;
};
const prevDetail=openChampionDetails;
openChampionDetails=function(id){
 const r=prevDetail.apply(this,arguments);
 try{
  const el=$q('#heroDetail');id=Number(id);
  if(el){
   const head=el.querySelector('.hero-detail-head>span');
   if(!owned(id)){
    if(freeNow(id)){if(head)head.textContent='Grátis nesta semana'}
    else{
     if(head)head.textContent='🔒 Bloqueado';
     el.querySelector('[data-hero-test]')?.remove();
     const b=el.querySelector('[data-hero-confirm]');if(b){b.textContent=`Comprar · ${fmt(HERO_PRICE)} 🪙`;b.dataset.ljBuy=id}
    }
   }
  }
 }catch(e){console.error('[Eldoria] detalhe bloqueado',e)}
 return r;
};

/* ---------- cliques ---------- */
document.addEventListener('click',e=>{
 if(e.target.closest('[data-lj-close]')){e.stopImmediatePropagation();closeModal();return}
 const doBuy=e.target.closest('[data-lj-do]');
 if(doBuy){e.stopImmediatePropagation();const id=+doBuy.dataset.ljDo;closeModal();if(buyHero(id)){if(appScreen==='shop')renderShop();else{closeHeroDetail();showScreen('library')}}return}
 const buy=e.target.closest('[data-lj-buy]');
 if(buy){e.stopImmediatePropagation();confirmBuy(+buy.dataset.ljBuy);return}
},true);

window.V3Loja={buyHero,claimGift,heroesFreeThisWeek,HERO_PRICE,renderShop};
// contas que já existiam: entrega o presente depois que a tela de entrada é fechada
if(!ALL_HEROES_DEBUG){
 const t=setInterval(()=>{
  if(!account.giftPending){clearInterval(t);return}
  const w=$q('#welcomeScreen'),shown=w&&!w.hidden&&getComputedStyle(w).display!=='none';
  if(account.profile&&!shown){clearInterval(t);claimGift()}
 },400);
}
})();
