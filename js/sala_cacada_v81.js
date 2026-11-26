'use strict';
/*
 * v81 — sala de escolha da Caçada do Dia (dois amigos contra o chefe): layout próprio, com o salão do trono ao fundo, os dois campeões
 * em cartões à esquerda, o Zorvath animado à direita e o VS dourado no meio. online_v45.js chama SalaCacada.html(...) quando o modo é "cacada".
 */
(function(){
const estrelas=n=>'★'.repeat(n)+'☆'.repeat(5-n);
function carta(c,p,pronto,meu,esc,artSrc){
 const id=c?c.id:null,nome=p?esc(p.name):'Esperando…';
 return `<div class="c81-slot ${meu?'meu':''} ${pronto?'pronto':''} ${c?'':'vazio'}" style="--hero:${c?c.color:'#6b7fb8'}">
  <div class="v46-fighter blue"><i class="v46-plat"></i>${c?`<canvas class="v46-sprite" data-skin="${id}" width="200" height="200" aria-label="${esc(c.name)}"></canvas>`:'<span class="v46-q">?</span>'}</div>
  <div class="c81-plate"><i class="c81-st">${pronto?'✓ PRONTO':'escolhendo'}</i><b>${c?esc(c.name):pronto?'Pronto!':'Escolhendo…'}</b><small>${nome}${meu?' <em>(você)</em>':''}</small></div></div>`;
}
function html(o){
 const {mc,me,mate,matePick,ready,mateReady,secs,bottom,esc,artSrc,solo}=o;
 const mateC=matePick!=null?CHAMPIONS[matePick]:null;
 let def={name:'Zorvath',title:'Imperador Cristalino',stars:5,hp:4600};
 try{const d=HuntAPI.bossOfDay();def={name:d.name,title:d.title,stars:d.stars,hp:d.hpDuo||d.hp}}catch{}
 setTimeout(inicia,0);setTimeout(heroisLoop,0);
 return `<div class="v46-sel c81" style="--me:${mc.color}">
  <div class="c81-stage">
   <header class="c81-banner"><b>${esc(def.name)}</b><em>${esc(def.title)} <i>${estrelas(def.stars)}</i></em></header>
   <div class="c81-team"><span class="c81-tag">${solo?'VOCÊ':'SUA DUPLA'}</span><div class="c81-row">${carta(mc,me,ready,true,esc,artSrc)}${solo?'':carta(mateC,mate,mateReady,false,esc,artSrc)}</div></div>
   <div class="c81-vs"><i>VS</i></div>
   <div class="c81-boss"><span class="c81-tag red">O CHEFE</span><canvas class="c81-cv" width="320" height="300" aria-label="${esc(def.name)}"></canvas>
    <div class="c81-chips"><span>3 formas</span><span>Vida ${def.hp}</span><span>5:00</span>${o.sem?'':`<span class="t">⏱ <b id="v45Qt">${secs} s</b></span>`}</div></div>
  </div>
  ${bottom}
 </div>`;
}
let raf=0;
function inicia(){
 if(raf)return;
 const t0=performance.now();
 const lace=now=>{
  const cv=document.querySelector('canvas.c81-cv');
  if(!cv){raf=0;return}
  const g=cv.getContext('2d'),t=(now-t0)/1000;g.clearRect(0,0,320,300);
  g.save();g.globalCompositeOperation='lighter';
  const ag=g.createRadialGradient(160,150,6,160,150,150);ag.addColorStop(0,'rgba(255,98,168,.35)');ag.addColorStop(.5,'rgba(184,107,255,.25)');ag.addColorStop(1,'rgba(184,107,255,0)');g.fillStyle=ag;g.fillRect(0,0,320,300);
  for(let i=0;i<18;i++){const k=(t*(.4+(i%5)*.07)+i/18)%1,x=160+Math.sin(i*5.3+t*1.7)*(40+k*30),y=280-k*220,s=Math.max(2,Math.round(6*(1-k)));g.globalAlpha=(1-k)*.8;g.fillStyle=i%3?'#b86bff':'#ff62a8';g.fillRect(Math.round(x),Math.round(y),s,s)}
  g.restore();
  try{ZorvathSprite.paint(g,'idle',Math.floor(t*4)%4,{x:160,y:288,scale:5.3,form:1,flip:true,filter:'drop-shadow(0 0 10px #b86bff88)'})}catch{}
  raf=requestAnimationFrame(lace);
 };
 raf=requestAnimationFrame(lace);
}

/* bonecos animados dos campeões (a mesma pintura da seleção online) para a versão offline */
let rafH=0,preFeito=false;const retratos={};
function pre(){if(preFeito)return;preFeito=true;try{loadSkinAtlas()}catch{}for(const c of CHAMPIONS){try{reworkPreload(c.id)}catch{}}}   // baixa a arte de todos (como a seleção online)
function heroisLoop(){
 if(rafH)return;
 pre();
 const lace=()=>{
  const cs=document.querySelectorAll('#caca81off canvas.v46-sprite');
  if(!cs.length){rafH=0;return}
  const t=performance.now()/1000;
  cs.forEach(c=>{const g=c.getContext('2d');g.clearRect(0,0,200,200);g.save();g.translate(100,172);g.fillStyle='rgba(4,10,40,.45)';g.beginPath();g.ellipse(0,8,34,9,0,0,6.2832);g.fill();g.imageSmoothingEnabled=false;
   const keep=lobbyActor.skin;lobbyActor.skin=+c.dataset.skin;try{drawAnimatedFighter(g,lobbyActor,150,t)}catch{}lobbyActor.skin=keep;g.restore();
   // enquanto a arte animada de um campeão ainda baixa (o Astral demora), mostra o retrato dele no lugar
   if(!c._pronto){
    let n=0;try{const d=g.getImageData(60,30,80,110).data;for(let i=3;i<d.length;i+=16)if(d[i]>40)n++}catch{}
    if(n>40)c._pronto=true;
    else{const id=+c.dataset.skin,im=retratos[id]||(retratos[id]=Object.assign(new Image(),{src:art(id)}));
     if(im.complete&&im.naturalWidth){const h=150,w=im.naturalWidth*h/im.naturalHeight;g.save();g.globalAlpha=.9;g.drawImage(im,100-w/2,172-h+6,w,h);g.restore()}}
   }});
  rafH=requestAnimationFrame(lace);
 };
 rafH=requestAnimationFrame(lace);
}
const esc2=x=>String(x).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const face=id=>{try{return(window.v3FaceSrc&&v3FaceSrc({skin:id,kit:CHAMPIONS[id].kit}))||championArt(CHAMPIONS[id])}catch{return''}};
const art=id=>{try{return championArt(CHAMPIONS[id])}catch{return''}};
// Solo e Dupla com aliado bot: mesma sala, sem servidor. "ir" começa a caçada com o campeão escolhido.
function abrirOffline(team,ir){
 if(document.querySelector('#caca81off'))return;
 const duo=team!=='solo',dono=(window.account&&account.champions)||CHAMPIONS.map(c=>c.id);
 let heroi=Number.isInteger(account.activeChampion)?account.activeChampion:0;
 const outroQue=h=>{const o=CHAMPIONS.map(c=>c.id).filter(i=>i!==h);return o[Math.floor(Math.random()*o.length)]};
 let aliado=duo?outroQue(heroi):null;
 const el=document.createElement('div');el.id='caca81off';el.setAttribute('role','dialog');el.setAttribute('aria-label','Caçada do Dia');document.body.appendChild(el);
 const fecha=()=>{el.remove();document.body.classList.remove('c81-open')};
 const render=()=>{
  const mc=CHAMPIONS[heroi],nome=(account.profile&&account.profile.name)||'Você';
  const tiles=CHAMPIONS.map(c=>{const own=dono.includes(c.id),on=c.id===heroi;return `<button class="v46-tile ${on?'on':''} ${own?'':'locked'}" data-c81-hero="${c.id}" ${own?'':'disabled'} aria-pressed="${on}" title="${esc2(c.name)}" style="--hero:${c.color}"><img src="${esc2(face(c.id))}" alt="" draggable="false"></button>`}).join('');
  const bottom=`<div class="v46-bottom"><span class="v45-ping">${duo?'Aliado bot':'Solo'}</span><div class="v46-grid" role="listbox" aria-label="Seu campeão">${tiles}</div><button class="v46-go" data-c81="go">PRONTO</button></div>`;
  el.innerHTML=`<header class="v43-top v45-top"><button class="v40-round v43-back" data-c81="back" aria-label="Voltar"><svg class="v40i" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L10 16l10 10"/></svg></button><b>CAÇADA DO DIA</b><span class="v45-tag">${duo?'DUPLA · BOT':'SOLO'}</span></header>`+
   html({mc,me:{name:nome},mate:duo?{name:'Aliado bot'}:null,matePick:aliado,ready:true,mateReady:true,secs:0,bottom,esc:esc2,artSrc:art,solo:!duo,sem:true});
 };
 render();document.body.classList.add('c81-open');
 el.addEventListener('click',e=>{
  const h=e.target.closest('[data-c81-hero]');
  if(h){const id=+h.dataset.c81Hero;if(id===heroi)return;heroi=id;if(duo&&aliado===heroi)aliado=outroQue(heroi);try{equipChampion(heroi,false)}catch{}render();return}
  const a=e.target.closest('[data-c81]');if(!a)return;
  if(a.dataset.c81==='back'){fecha();return}
  if(a.dataset.c81==='go'){try{equipChampion(heroi,false)}catch{}window.__huntAllyHero=duo?aliado:null;fecha();ir()}
 });
}
window.SalaCacada={html,abrirOffline,pre};
})();
