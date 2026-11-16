'use strict';
/*
 * Disputa da Coroa — todos contra todos com 4 lutadores (você + 3 rivais) numa arena só.
 * - Sem reaparecer: quem cai está fora. Quem derruba um rival recupera 15% da vida.
 * - Termina quando você cai (a colocação é a ordem de queda), quando sobra só um de pé (a coroa!) ou em 120 s
 *   (quem tem mais vida fica à frente).
 * - Recompensa em moedas por colocação. Ranqueada: 1º +30 · 2º +15 · 3º −5 · 4º −20 (ranking próprio na Liga).
 */
(function(){
if(!window.COMBAT_V3||!window.V3Modes||!window.V3Kof)return;
const M=window.V3Modes,$q=s=>document.querySelector(s);
const TIME=120,HEAL=.15,COINS=[150,75,40,25];
const COLORS=['#8ecde3','#e6a28c','#9bd98e','#c9a0ff'];
const TITLES=['A COROA É SUA!','Segundo lugar','Terceiro lugar','Quarto lugar'];
const C={on:false,over:false,t:0,endAt:0,order:[],ranked:false,rivals:[]};

/* ---------- placar dos rivais ---------- */
const strip=document.createElement('div');strip.id='crownStrip';strip.hidden=true;
document.querySelector('#battle .hud').appendChild(strip);
function buildStrip(){
 strip.innerHTML=C.rivals.map((a,i)=>`<div class="cs-card" data-i="${i}"><img alt=""><div class="cs-body"><b></b><div class="cs-bar"><i></i></div></div><span class="cs-out">✕</span></div>`).join('');
 strip.hidden=false;updateStrip(true);
}
function updateStrip(force){
 const cards=strip.querySelectorAll('.cs-card');
 C.rivals.forEach((a,i)=>{
  const c=cards[i];if(!c)return;
  const dead=a.hp<=0;
  c.classList.toggle('dead',dead);
  c.querySelector('.cs-bar i').style.width=Math.max(0,100*a.hp/a.max)+'%';
  const n=c.querySelector('b');if(n.textContent!==a.label)n.textContent=a.label;
  const img=c.querySelector('img');
  const src=(window.v3FaceSrc&&v3FaceSrc(a))||championArt(CHAMPIONS[a.skin]);
  if(img.getAttribute('src')!==src)img.setAttribute('src',src);
 });
}

/* ---------- regras ---------- */
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 if(C.on&&t&&o&&o!==t&&n>0)t.lastHitBy=o;
 return prevHit.apply(this,arguments);
};
const prevFinish=finish;
finish=function(){if(C.on)return;return prevFinish.apply(this,arguments)};
const prevShow=showScreen;
showScreen=function(){
 if(C.on){C.on=false}
 strip.hidden=true;delete document.body.dataset.crown;
 try{$q('#rematch').onclick=start}catch{}
 return prevShow.apply(this,arguments);
};

function onElim(a){
 const k=a.lastHitBy;
 if(k&&k!==a&&k.hp>0){k.hp=Math.min(k.max,k.hp+k.max*HEAL);try{float(k.x,k.y-72,'+15% VIDA','#7dffb0')}catch{}}
 const left=actors.filter(e=>e.hp>0).length;
 if(a===p){try{M.banner('VOCÊ CAIU!',`${actors.length-C.order.indexOf(a)}º lugar`,1800)}catch{}}
 else{try{M.banner(`${a.label} CAIU`,left>1?`${left} lutadores restam`:'',1500)}catch{}}
}
function placeOfPlayer(){
 if(p.hp>0)return actors.filter(a=>a.hp>0).sort((x,y)=>y.hp-x.hp).indexOf(p)+1;
 return actors.length-C.order.indexOf(p);
}
function endCrown(){
 C.over=true;C.on=false;state='end';clearInputs();
 const place=Math.max(1,Math.min(4,placeOfPlayer()));
 account.matches++;if(place===1)account.wins++;
 const coins=awardMatchCoins(COINS[place-1]);
 let liga='';
 if(C.ranked){try{liga=V3Liga.awardPlacement(place)}catch(e){console.error(e)}V3Liga.state.ranked=null}
 try{account.journey.duel=true}catch{}
 try{saveAccount()}catch{}
 const eb=document.querySelector('#outcome .eyebrow');if(eb)eb.textContent='DISPUTA ENCERRADA';
 $q('#resultTitle').textContent=TITLES[place-1];
 const timeUp=time<=0;
 $q('#resultText').textContent=(place===1?(timeUp?'Tempo esgotado: você terminou com mais vida e leva a coroa! ':'Você foi o último de pé e leva a coroa! '):place===2?'Você chegou à final, mas a coroa ficou com outro. ':'Você caiu antes da final. ')+`+${coins} moedas.`+liga;
 $q('#stats').innerHTML=`<span>${place}º lugar</span><span>${Math.max(0,Math.round(TIME-time))}s de disputa</span><span>${Math.round(p.damage||0)} dano</span>`;
 $q('#rematch').onclick=()=>begin();
 $q('#outcome').style.display='flex';
 delete document.body.dataset.crown;strip.hidden=true;
 try{announce($q('#resultTitle').textContent)}catch{}
}
const prevStep=step;
step=function(dt){
 const r=prevStep.apply(this,arguments);
 if(!C.on||C.over)return r;
 C.t+=dt;
 if(state==='fight'){
  for(const a of actors)if(a.hp<=0&&!C.order.includes(a)){C.order.push(a);onElim(a)}
  const alive=actors.filter(a=>a.hp>0).length;
  if(!C.endAt&&(p.hp<=0||alive<=1||time<=0))C.endAt=C.t+(time<=0&&p.hp>0&&alive>1?.2:1.8);
  if(C.endAt&&C.t>=C.endAt){endCrown();return r}
 }
 updateStrip();
 return r;
};

/* ---------- início ---------- */
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function begin(){
 if(!account.profile)return;
 try{$q('#outcome').style.display='none'}catch{}
 M.pending='crown';battleActivity='casual';matchMode='1v1';arenaModeId=null;modeRun=null;
 $q('#modeScreen').hidden=true;
 start();
 M.special='crown';
 C.ranked=!!(window.V3Liga&&V3Liga.state.ranked==='ffa');
 const ids=shuffle(CHAMPIONS.map(c=>c.id).filter(id=>id!==p.skin)).slice(0,3);
 const c=spawnModeActor(2,'',0,0,1000,[]),d=spawnModeActor(3,'',0,0,1000,[]);
 actors.push(c,d);
 C.rivals=[b,c,d];
 C.rivals.forEach((a,i)=>{M.swapHero(a,ids[i],1000);a.team=i+1;a.label=M.heroName(ids[i]);a.color=COLORS[i+1];a.lastHitBy=null});
 p.color=COLORS[0];p.team=0;
 const pos=[[W*.2,H*.3],[W*.8,H*.3],[W*.2,H*.7],[W*.8,H*.7]];   // você, rival 1, rival 2, rival 3
 [p,b,c,d].forEach((a,i)=>{a.x=pos[i][0];a.y=pos[i][1]});
 try{M.faceOff()}catch{}
 time=TIME;C.on=true;C.over=false;C.t=0;C.endAt=0;C.order=[];
 document.body.dataset.crown='1';
 const sm=$q('.mid-hud small');if(sm)sm.textContent='DISPUTA DA COROA';
 buildStrip();
 try{M.banner('DISPUTA DA COROA','4 lutadores · só um fica de pé',2400)}catch{}
}
window.V3Crown={begin,state:C,TIME,COINS};
})();
