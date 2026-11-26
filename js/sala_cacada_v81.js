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
 const {mc,me,mate,matePick,ready,mateReady,secs,bottom,esc,artSrc}=o;
 const mateC=matePick!=null?CHAMPIONS[matePick]:null;
 let def={name:'Zorvath',title:'Imperador Cristalino',stars:5,hp:4600};
 try{const d=HuntAPI.bossOfDay();def={name:d.name,title:d.title,stars:d.stars,hp:d.hpDuo||d.hp}}catch{}
 setTimeout(inicia,0);
 return `<div class="v46-sel c81" style="--me:${mc.color}">
  <div class="c81-stage">
   <header class="c81-banner"><small>CAÇADA DO DIA</small><b>${esc(def.name)}</b><em>${esc(def.title)} <i>${estrelas(def.stars)}</i></em></header>
   <div class="c81-team"><span class="c81-tag">SUA DUPLA</span><div class="c81-row">${carta(mc,me,ready,true,esc,artSrc)}${carta(mateC,mate,mateReady,false,esc,artSrc)}</div></div>
   <div class="c81-vs"><i>VS</i></div>
   <div class="c81-boss"><span class="c81-tag red">O CHEFE</span><canvas class="c81-cv" width="320" height="300" aria-label="${esc(def.name)}"></canvas>
    <div class="c81-chips"><span>3 formas</span><span>Vida ${def.hp}</span><span>5:00</span><span class="t">⏱ <b id="v45Qt">${secs} s</b></span></div></div>
  </div>
  ${bottom}
 </div>`;
}
let raf=0;
function inicia(){
 if(raf)return;
 const t0=performance.now();
 const lace=now=>{
  const cv=document.querySelector('#onlineV45:not([hidden]) canvas.c81-cv');
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
window.SalaCacada={html};
})();
