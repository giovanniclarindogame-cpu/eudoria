'use strict';
/*
 * Modo KOF (3 contra 3): cada lado escolhe 3 lutadores e a ordem de entrada; um de cada vez luta.
 * Quem vence continua com a vida que tem (não enche); quem cai dá lugar ao próximo do time. Vence o time que derrubar os 3.
 */
(function(){
if(!window.COMBAT_V3||!window.V3Modes)return;
const M=window.V3Modes,$q=s=>document.querySelector(s);
const FIGHT_TIME=99;
let K=null,pick=[],sel=-1;

const faceOf=id=>championArt(CHAMPIONS[id]);
// arte de combate em repouso (animada) nos cartões de seleção
const sprite=id=>`<canvas class="kof-sprite" data-skin="${id}" width="200" height="200" aria-hidden="true"></canvas>`;
const idleActors={};
const idleActor=id=>idleActors[id]||(idleActors[id]={...skinPreviewActor,skin:id,color:CHAMPIONS[id].color});
let spriteLoop=false;
function paintSprites(){
 const cs=document.querySelectorAll('.kof-screen canvas.kof-sprite');
 if(!cs.length){spriteLoop=false;return}
 const t=performance.now()/1000;
 cs.forEach(c=>{const g=c.getContext('2d');g.clearRect(0,0,200,200);g.save();g.translate(100,172);g.fillStyle='#04120d88';g.beginPath();g.ellipse(0,8,34,9,0,0,6.2832);g.fill();g.imageSmoothingEnabled=false;
  // repouso: o corpo respira e balança de leve (o pose do combate é um quadro fixo, então a animação é feita aqui)
  const id=+c.dataset.skin,ph=id*1.7,w=Math.sin(t*2.1+ph);
  g.rotate(w*.03);g.scale(1+.012*Math.sin(t*4.2+ph),1+.02*Math.sin(t*4.2+ph+1.57));g.translate(0,-Math.abs(Math.sin(t*2.1+ph))*2.2);
  try{drawAnimatedFighter(g,idleActor(id),150,t)}catch{}g.restore()});
 requestAnimationFrame(paintSprites);
}
function startSprites(){if(spriteLoop)return;spriteLoop=true;for(const c of CHAMPIONS){try{reworkPreload(c.id)}catch{}}try{loadSkinAtlas()}catch{}requestAnimationFrame(paintSprites)}
function slotHtml(i){
 const id=pick[i];
 return `<div class="kof-slot ${id!==undefined?'full':''} ${sel===i?'sel':''}" data-kof-slot="${i}"><span class="kof-n">${i+1}º</span>${id!==undefined?`${sprite(id)}<b>${CHAMPIONS[id].name}</b><span class="kof-mv"><button data-kof-mv="${i},-1" aria-label="Mover para antes">◀</button><button data-kof-mv="${i},1" aria-label="Mover para depois">▶</button></span>`:'<em>vazio</em>'}</div>`;
}
function selectHtml(){
 return `<div class="kof-screen"><header class="kof-head"><button class="ghost" data-kof-back>← Arenas</button><div><span class="eyebrow">KOF · 3 CONTRA 3</span><h1>Monte seu time</h1></div><button class="gold" data-kof-go ${pick.length===3?'':'disabled'}>Lutar</button></header>
 <p class="kof-hint">Toque em 3 lutadores. A ordem dos espaços é a ordem de entrada: use ◀ ▶ para trocar. Quem vence continua com a vida que tem.</p>
 <div class="kof-slots">${[0,1,2].map(slotHtml).join('')}</div>
 <div class="kof-grid">${CHAMPIONS.map(c=>`<button class="kof-hero ${pick.includes(c.id)?'picked':''}" data-kof-pick="${c.id}" style="--hero:${c.color}">${sprite(c.id)}<span>${c.name}</span></button>`).join('')}</div></div>`;
}
function render(){const el=$q('#modeScreen');el.innerHTML=selectHtml();el.hidden=false;startSprites()}
function open(){
 pick=[];sel=-1;
 showScreen('home');appScreen='arenas';document.body.dataset.screen='arenas';
 $q('#homeScreen').hidden=true;document.body.style.overflow='hidden';
 render();try{renderLobbyNav()}catch{}
}
document.addEventListener('click',e=>{
 const el=$q('#modeScreen');if(!el||el.hidden||!el.querySelector('.kof-screen'))return;
 if(e.target.closest('[data-kof-back]')){e.stopImmediatePropagation();showArenaModes();return}
 const mv=e.target.closest('[data-kof-mv]');
 if(mv){e.stopImmediatePropagation();const [i,d]=mv.dataset.kofMv.split(',').map(Number),j=i+d;if(j>=0&&j<pick.length){[pick[i],pick[j]]=[pick[j],pick[i]]}render();return}
 const hero=e.target.closest('[data-kof-pick]');
 if(hero){e.stopImmediatePropagation();const id=+hero.dataset.kofPick;const k=pick.indexOf(id);if(k>=0)pick.splice(k,1);else if(pick.length<3)pick.push(id);render();return}
 const slot=e.target.closest('[data-kof-slot]');
 if(slot&&!e.target.closest('button')){e.stopImmediatePropagation();const i=+slot.dataset.kofSlot;if(pick[i]!==undefined){pick.splice(i,1);render()}return}
 if(e.target.closest('[data-kof-go]')){e.stopImmediatePropagation();if(pick.length===3)begin([...pick]);return}
},true);

function begin(mine){
 const pool=CHAMPIONS.map(c=>c.id).filter(id=>!mine.includes(id));
 const foes=[];while(foes.length<3){const k=Math.floor(Math.random()*pool.length);foes.push(pool.splice(k,1)[0])}
 K={mine,foes,hpM:[1000,1000,1000],hpF:[1000,1000,1000],iM:0,iF:0,fights:0};
 M.pending='kof';battleActivity='casual';matchMode='1v1';arenaModeId=null;modeRun=null;
 $q('#modeScreen').hidden=true;
 start();
 M.special='kof';
 M.swapHero(p,mine[0],1000);M.swapHero(b,foes[0],1000);
 p.label=account.profile?.name||'Você';b.label=M.heroName(foes[0]);
 M.rebuildPlayerUI();time=FIGHT_TIME;
 drawStrips();
 M.banner('KOF · 3 CONTRA 3',M.heroName(mine[0])+' × '+M.heroName(foes[0]),2400);
}

/* ---------- faixas com o time dos dois lados ---------- */
const hud=$q('#battle .hud');
function mkStrip(cls){const d=document.createElement('div');d.className='kof-strip '+cls;d.hidden=true;hud?.appendChild(d);return d}
const sM=mkStrip('mine'),sF=mkStrip('foe');
function drawStrips(){
 const on=M.special==='kof'&&K;
 sM.hidden=sF.hidden=!on;if(!on)return;
 const mk=(ids,hps,cur)=>ids.map((id,i)=>`<span class="${i===cur?'cur':''} ${hps[i]<=0?'dead':''}" title="${CHAMPIONS[id].name}"><img src="${faceOf(id)}" alt=""><i style="width:${Math.max(0,Math.min(100,hps[i]/10))}%"></i></span>`).join('');
 sM.innerHTML=mk(K.mine,K.hpM,K.iM);sF.innerHTML=mk(K.foes,K.hpF,K.iF);
}
const prevUI=updateUI;
updateUI=function(){prevUI();if(M.special==='kof'&&K){K.hpM[K.iM]=Math.max(0,p.hp);K.hpF[K.iF]=Math.max(0,b.hp);drawStrips()}else if(!sM.hidden)drawStrips()};

/* ---------- fim de cada luta ---------- */
function handler(cb){
 if(M.special!=='kof'||!K)return false;
 let lp=p.hp<=0,lb=b.hp<=0;
 if(!lp&&!lb){const rp=p.hp/p.max,rb=b.hp/b.max;if(Math.abs(rp-rb)<1e-4){lp=lb=true}else if(rp<rb)lp=true;else lb=true}
 K.hpM[K.iM]=lp?0:Math.max(1,p.hp);K.hpF[K.iF]=lb?0:Math.max(1,b.hp);
 const nm=lp?K.iM+1:K.iM,nf=lb?K.iF+1:K.iF;
 if(nm>=3||nf>=3){
  let win=nf>=3;if(nm>=3&&nf>=3)win=Math.random()<.5;
  if(win){b.hp=0;p.hp=Math.max(1,K.hpM[K.iM]||1)}else{p.hp=0;b.hp=Math.max(1,K.hpF[K.iF]||1)}
  const lost=win?K.foes.length:K.mine.length;
  M.special=null;drawStrips();cb();
  const rt=$q('#resultText');if(rt)rt.textContent=(win?'KOF vencido! Os 3 rivais caíram. ':'Seu time caiu no KOF. ')+rt.textContent;
  return true;
 }
 K.iM=nm;K.iF=nf;K.fights++;
 M.clearField();
 const hpWinnerM=lp?null:p.hp,hpWinnerF=lb?null:b.hp;
 if(lp){M.swapHero(p,K.mine[K.iM],1000)}else{M.resetFighter(p)}
 if(lb){M.swapHero(b,K.foes[K.iF],1000)}else{M.resetFighter(b)}
 if(hpWinnerM!==null)p.hp=hpWinnerM;if(hpWinnerF!==null)b.hp=hpWinnerF;
 p.x=W*.22;p.y=H*.5;b.x=W*.78;b.y=H*.5;b.a=Math.PI;p.a=0;
 b.label=M.heroName(K.foes[K.iF]);
 M.rebuildPlayerUI();time=FIGHT_TIME;M.startCount(2.8);drawStrips();
 const who=lp&&lb?'Os dois lados trocam de lutador':lp?'Entra '+M.heroName(K.mine[K.iM]):'Entra '+M.heroName(K.foes[K.iF])+' (rival)';
 M.banner('PRÓXIMO',who+' · '+M.heroName(K.mine[K.iM])+' × '+M.heroName(K.foes[K.iF]),2300);
 return true;
}
handler.label=win=>M.special==='kof'&&K?[win?'RIVAL DERRUBADO':'LUTADOR DERRUBADO',(win?'Seu time continua com a vida que tem':'Entra o próximo do seu time')]:null;
V3Hooks.add(handler);
window.V3Kof={open,get state(){return K},begin};
})();
