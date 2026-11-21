'use strict';
/*
 * Disputa da Coroa — todos contra todos, 4 lutadores (você + 3 rivais), 3 minutos.
 *  - Cada um começa num canto; uma COROA fica no meio da arena. Quem encostar primeiro fica com ela (aparece uma coroa sobre a cabeça).
 *  - Quem derruba o dono da coroa fica com ela. Se o dono cair sem que ninguém tenha dado o golpe final, a coroa cai no chão onde ele estava.
 *  - Quem cai volta ao seu canto depois de 4 s (com a vida cheia e um instante de proteção); quem derruba alguém recupera 15% da vida.
 *  - Quando os 3 minutos acabam, vence quem estiver com a coroa. Sem dono (coroa no chão), vence quem ficou mais tempo com ela.
 * Funciona de três jeitos com o mesmo código:
 *  - offline: você e 3 bots (os bots correm atrás da coroa e perseguem quem a tem);
 *  - no servidor (anfitrião.js): as regras rodam lá, com 4 jogadores de verdade;
 *  - no navegador de cada jogador (guest): só mostra o que o servidor manda (dono da coroa, tempo de cada um, quedas).
 */
(function(){
if(!window.COMBAT_V3||!window.V3Modes||!window.V3Kof)return;
const M=window.V3Modes,$q=s=>document.querySelector(s);
const TIME=180,HEAL=.15,COINS=[150,75,40,25],RESPAWN=4,PICK=32;
const COLORS=['#8ecde3','#e6a28c','#9bd98e','#c9a0ff'];
const TITLES=['A COROA É SUA!','Segundo lugar','Terceiro lugar','Quarto lugar'];
const HOME=[[.2,.3],[.8,.3],[.2,.7],[.8,.7]];   // canto de cada vaga (0 = alto-esquerda, 1 = alto-direita, 2 = baixo-esquerda, 3 = baixo-direita)
const C={on:false,over:false,guest:false,bots:false,t:0,endAt:0,ranked:false,players:[],slotOf:[0,1,2,3],home:[],
 crown:{x:0,y:0,holder:null},hold:[0,0,0,0],kills:[0,0,0,0],runner:null,sendNote:null};
const r1=v=>Math.round(v*10)/10;
const mmss=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const CROWN_SVG='<svg viewBox="0 0 32 24" aria-hidden="true"><path d="M3 20L1 6l8 7 7-11 7 11 8-7-2 14z" fill="#ffd45a" stroke="#7a4a00" stroke-width="2" stroke-linejoin="round"/><path d="M3 20h26v3H3z" fill="#ff9d1c" stroke="#7a4a00" stroke-width="2"/></svg>';

/* ---------- placar dos 4 lutadores ---------- */
const strip=document.createElement('div');strip.id='crownStrip';strip.hidden=true;
document.querySelector('#battle .hud').appendChild(strip);
function buildStrip(){
 strip.innerHTML=C.players.map((a,i)=>`<div class="cs-card" data-i="${i}" style="--cc:${COLORS[i]}"><img alt=""><div class="cs-body"><b></b><div class="cs-bar"><i></i></div><em class="cs-time">0:00</em></div><span class="cs-crown">${CROWN_SVG}</span><span class="cs-out">✕</span></div>`).join('');
 strip.hidden=false;updateStrip();
}
function updateStrip(){
 const cards=strip.querySelectorAll('.cs-card');
 C.players.forEach((a,i)=>{
  const c=cards[i];if(!c)return;
  const dead=a.hp<=0,hold=C.crown.holder===a;
  c.classList.toggle('dead',dead);c.classList.toggle('holder',hold);
  c.querySelector('.cs-bar i').style.width=Math.max(0,100*a.hp/a.max)+'%';
  const n=c.querySelector('b');if(n.textContent!==a.label)n.textContent=a.label;
  const t=c.querySelector('.cs-time'),txt=dead&&a.cwRespawn>0?'volta em '+Math.ceil(a.cwRespawn)+'s':'👑 '+mmss(C.hold[i]);if(t.textContent!==txt)t.textContent=txt;
  const img=c.querySelector('img');
  const src=(window.v3FaceSrc&&v3FaceSrc(a))||championArt(CHAMPIONS[a.skin]);
  if(img.getAttribute('src')!==src)img.setAttribute('src',src);
 });
}

/* ---------- desenho: coroa no chão e sobre a cabeça ---------- */
function crownPath(g,s){   // coroa com 3 pontas, centrada na base
 g.beginPath();g.moveTo(-15*s,0);g.lineTo(-18*s,-17*s);g.lineTo(-8*s,-8*s);g.lineTo(0,-22*s);g.lineTo(8*s,-8*s);g.lineTo(18*s,-17*s);g.lineTo(15*s,0);g.closePath();
}
function drawCrown(x,y,s,t,glow){
 const g=ctx;g.save();g.translate(x,y);
 if(glow){const r=(34+Math.sin(t*4)*4)*s;const gr=g.createRadialGradient(0,-10*s,2,0,-10*s,r);gr.addColorStop(0,'rgba(255,230,120,.75)');gr.addColorStop(1,'rgba(255,200,60,0)');g.fillStyle=gr;g.beginPath();g.arc(0,-10*s,r,0,Math.PI*2);g.fill()}
 const fill=g.createLinearGradient(0,-22*s,0,3*s);fill.addColorStop(0,'#fff2a8');fill.addColorStop(.5,'#ffc83d');fill.addColorStop(1,'#e07c00');
 g.lineJoin='round';g.lineWidth=2.4*s;g.strokeStyle='#6a3d00';crownPath(g,s);g.fillStyle=fill;g.fill();g.stroke();
 g.fillStyle='#ff9d1c';g.strokeStyle='#6a3d00';g.beginPath();g.rect(-15*s,0,30*s,6*s);g.fill();g.stroke();
 for(const [gx,gc] of [[-9,'#ff5c7a'],[0,'#5cc8ff'],[9,'#6be39a']]){g.fillStyle=gc;g.beginPath();g.arc(gx*s,3*s,2.4*s,0,Math.PI*2);g.fill()}
 g.fillStyle='#fff';for(const [px,py] of [[-18,-17],[0,-22],[18,-17]]){g.beginPath();g.arc(px*s,py*s,2.3*s,0,Math.PI*2);g.fillStyle='#fff7c8';g.fill();g.stroke()}
 g.restore();
}
const prevLayer=vfxDrawLayer;
vfxDrawLayer=function(ground){
 const r=prevLayer.apply(this,arguments);
 if(C.on&&!C.over){
  const t=performance.now()/1000,h=C.crown.holder;
  if(ground&&!h){const y=C.crown.y+Math.sin(t*3)*3;ellipse(C.crown.x,C.crown.y+4,24,8,'#00000055');drawCrown(C.crown.x,y,1.35,t,true)}
 }
 return r;
};
// coroa sobre a cabeça do dono (desenhada junto com o lutador, por cima dele)
const prevStatus=drawActorStatus;
drawActorStatus=function(a){
 const r=prevStatus.apply(this,arguments);
 if(C.on&&!C.over&&C.crown.holder===a&&a.hp>0){const t=performance.now()/1000;drawCrown(a.x,a.y-74+Math.sin(t*5)*2.5,.95,t,true)}
 return r;
};

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
 if(C.on){C.on=false;C.guest=false}
 strip.hidden=true;delete document.body.dataset.crown;
 try{$q('#rematch').onclick=start}catch{}
 return prevShow.apply(this,arguments);
};
// bots (só offline): o mais perto corre atrás da coroa no chão; os outros miram em quem está com ela
const prevAI=ai;
ai=function(dt,actor){
 if(C.on&&!C.guest){
  const a=arguments.length>1?actor:b;
  if(a&&a.cwBot&&a.hp>0&&!C.crown.holder&&C.runner===a&&state==='fight'){
   const ang=Math.atan2(C.crown.y-a.y,C.crown.x-a.x);a.a=ang;a.moving=true;
   if(a.cast<=0&&a.root<=0&&a.dodgeTime<=0&&a.dash<=0){const sp=140*(typeof identitySpeed==='function'?identitySpeed(a):1)*(a.slow>0?.55:1);const x0=a.x,y0=a.y;move(a,Math.cos(ang)*sp*dt,Math.sin(ang)*sp*dt);const d=Math.hypot(a.x-x0,a.y-y0);if(d>.02&&!a.rwCast&&!a.guard){a.rwFacing=ang;a.rwStride=((a.rwStride||0)+d/16)%6}}
   return;
  }
 }
 return prevAI.apply(this,arguments);
};
const prevEnemy=enemy;
enemy=function(a){
 if(C.on&&!C.guest&&a&&a.cwBot){const h=C.crown.holder;if(h&&h!==a&&h.hp>0&&dist(a,h)<560)return h}
 return prevEnemy.apply(this,arguments);
};
function setHolder(a,from){
 if(C.crown.holder===a)return;
 C.crown.holder=a;
 if(a){try{M.banner('👑 '+a.label,from?'tomou a coroa de '+from.label:'pegou a coroa',1400)}catch{}}
}
function dropCrown(x,y){
 C.crown.holder=null;
 C.crown.x=Math.max(70,Math.min(W-70,x));C.crown.y=Math.max(70,Math.min(H-70,y));
}
function onDeath(a,i){
 const k=a.lastHitBy&&a.lastHitBy!==a?a.lastHitBy:null,ki=k?C.players.indexOf(k):-1;
 if(k&&k.hp>0){k.hp=Math.min(k.max,k.hp+k.max*HEAL);try{float(k.x,k.y-72,'+15% VIDA','#7dffb0')}catch{}}
 if(ki>=0)C.kills[ki]++;
 if(C.crown.holder===a){
  if(k&&k.hp>0)setHolder(k,a);
  else{dropCrown(a.x,a.y);try{M.banner('A COROA CAIU!','quem encostar nela fica com ela',1400)}catch{}}
 }
 if(a===p){try{M.banner('VOCÊ CAIU!','volta em '+RESPAWN+' s',1500)}catch{}}
}
function respawn(a,i){
 try{M.resetFighter(a,{keepHp:false})}catch{}
 a.hp=a.max;a.cwDead=false;a.cwRespawn=0;a.lastHitBy=null;a.inv=2.2;
 a.x=C.home[i][0];a.y=C.home[i][1];
 a.a=Math.atan2(H/2-a.y,W/2-a.x);
}
function rules(dt){
 for(let i=0;i<C.players.length;i++){
  const a=C.players[i];
  if(a.hp<=0&&!a.cwDead){a.cwDead=true;a.cwRespawn=RESPAWN;onDeath(a,i)}
  else if(a.cwDead){a.cwRespawn-=dt;if(a.cwRespawn<=0)respawn(a,i)}
 }
 const h=C.crown.holder;
 if(!h){
  let best=null,bd=1e9;
  for(const a of C.players){if(a.hp<=0)continue;const d=Math.hypot(a.x-C.crown.x,a.y-C.crown.y);if(d<PICK+a.r&&d<bd){bd=d;best=a}}
  if(best)setHolder(best,null);
  // bot mais perto da coroa corre até ela
  if(C.players.some(a=>a.cwBot)){let rb=null,rd=1e9;for(const a of C.players){if(!a.cwBot||a.hp<=0)continue;const d=Math.hypot(a.x-C.crown.x,a.y-C.crown.y);if(d<rd){rd=d;rb=a}}C.runner=rb}
 }else if(h.hp>0){const i=C.players.indexOf(h);if(i>=0)C.hold[i]+=dt}
 if(!C.endAt&&time<=0)C.endAt=C.t+.4;
}
function rankIdx(){
 const hIdx=C.players.indexOf(C.crown.holder);
 return C.players.map((_,i)=>i).sort((x,y)=>((y===hIdx)-(x===hIdx))||(C.hold[y]-C.hold[x])||(C.kills[y]-C.kills[x]));
}
function showResult(place,holderName){
 C.over=true;C.on=false;state='end';clearInputs();
 place=Math.max(1,Math.min(4,place));
 account.matches++;if(place===1)account.wins++;
 const coins=awardMatchCoins(COINS[place-1]);
 let liga='';
 if(C.ranked){try{liga=V3Liga.awardPlacement(place)}catch(e){console.error(e)}try{V3Liga.state.ranked=null}catch{}}
 try{account.journey.duel=true}catch{}
 try{saveAccount()}catch{}
 const eb=document.querySelector('#outcome .eyebrow');if(eb)eb.textContent='DISPUTA ENCERRADA';
 $q('#resultTitle').textContent=TITLES[place-1];
 $q('#resultText').textContent=(place===1?'Você terminou com a coroa na cabeça! ':`A coroa ficou com ${holderName||'outro lutador'}. `)+`+${coins} moedas.`+liga;
 const mi=C.players.indexOf(p);
 $q('#stats').innerHTML=`<span>${place}º lugar</span><span>👑 ${mmss(C.hold[mi]||0)} com a coroa</span><span>${C.kills[mi]||0} quedas causadas</span>`;
 $q('#rematch').onclick=()=>begin();
 $q('#outcome').style.display='flex';
 delete document.body.dataset.crown;strip.hidden=true;
 try{announce($q('#resultTitle').textContent)}catch{}
}
function endCrown(){
 const rk=rankIdx(),mi=C.players.indexOf(p),holder=C.crown.holder;
 showResult(rk.indexOf(mi)+1,(holder||C.players[rk[0]])?.label);
}
const prevStep=step;
step=function(dt){
 const r=prevStep.apply(this,arguments);
 if(!C.on||C.over)return r;
 C.t+=dt;
 if(state==='fight'&&!C.guest){
  rules(dt);
  if(C.endAt&&C.t>=C.endAt){endCrown();return r}
 }
 updateStrip();
 return r;
};

/* ---------- preparar a disputa ---------- */
// heroes[slot], names[slot]; localSlots[i] = a vaga (canto) de cada lutador local [p, b, c, d]. Devolve os lutadores na ordem local.
function setup(heroes,names,localSlots=[0,1,2,3],{guest=false,bots=false}={}){
 const c=spawnModeActor(2,'',0,0,1000,[]),d=spawnModeActor(3,'',0,0,1000,[]);
 actors.push(c,d);
 const P=[p,b,c,d];
 C.players=P;C.slotOf=localSlots.slice();C.guest=guest;C.bots=bots;
 C.home=localSlots.map(s=>[W*HOME[s][0],H*HOME[s][1]]);
 P.forEach((a,i)=>{
  const s=localSlots[i];
  M.swapHero(a,heroes[s],1000);
  a.team=i;a.label=String(names[s]||'Lutador').slice(0,16);a.color=COLORS[i];a.lastHitBy=null;a.cwDead=false;a.cwRespawn=0;a.cwBot=!!bots&&a!==p;
  a.x=C.home[i][0];a.y=C.home[i][1];
 });
 try{M.faceOff()}catch{}
 C.crown={x:W/2,y:H/2,holder:null};C.hold=[0,0,0,0];C.kills=[0,0,0,0];C.runner=null;
 time=TIME;C.on=true;C.over=false;C.t=0;C.endAt=0;
 document.body.dataset.crown='1';
 const sm=$q('.mid-hud small');if(sm)sm.textContent='DISPUTA DA COROA';
 buildStrip();
 try{M.banner('DISPUTA DA COROA','pegue a coroa no meio e segure por 3 minutos',2600)}catch{}
 return P;
}
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
 setup([p.skin,...ids],[account.profile?.name||'Você',...ids.map(id=>M.heroName(id))],[0,1,2,3],{bots:true});
}

/* ---------- online ---------- */
// servidor → navegadores: dono da coroa, onde ela está, tempo de cada um e quedas (tudo por vaga, não pela ordem local)
function pack(){
 const sl=C.slotOf,inv=s=>C.players[sl.indexOf(s)];
 const out={h:sl[C.players.indexOf(C.crown.holder)]??-1,x:r1(C.crown.x),y:r1(C.crown.y),hs:[0,0,0,0],ks:[0,0,0,0],rs:[0,0,0,0]};
 for(let s=0;s<4;s++){const i=sl.indexOf(s);if(i<0)continue;out.hs[s]=r1(C.hold[i]);out.ks[s]=C.kills[i];out.rs[s]=r1(Math.max(0,C.players[i].cwRespawn||0))}
 return out;
}
function applyServer(cw){
 if(!C.on||!C.guest||!cw)return;
 const sl=C.slotOf;
 const hi=sl.indexOf(cw.h);C.crown.holder=hi>=0?C.players[hi]:null;
 C.crown.x=cw.x;C.crown.y=cw.y;
 for(let i=0;i<C.players.length;i++){const s=sl[i];C.hold[i]=cw.hs?.[s]||0;C.kills[i]=cw.ks?.[s]||0;C.players[i].cwRespawn=cw.rs?.[s]||0}
}
// classificação final calculada no servidor: lista de vagas do 1º ao 4º
function rankSlots(){return rankIdx().map(i=>C.slotOf[i])}
function finishOnline(m){
 if(!C.on||C.over||!Array.isArray(m.rk))return;
 const sl=C.slotOf,mine=sl[C.players.indexOf(p)],place=m.rk.indexOf(mine)+1;
 const hi=sl.indexOf(m.rk[0]);
 if(Array.isArray(m.hs))for(let i=0;i<4;i++){C.hold[i]=m.hs[sl[i]]||C.hold[i];C.kills[i]=(m.ks||[])[sl[i]]||C.kills[i]}
 showResult(place||4,C.players[hi]?.label);
}
window.V3Crown={begin,setup,pack,applyServer,rankSlots,finishOnline,state:C,TIME,COINS};
})();
