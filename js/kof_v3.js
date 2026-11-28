'use strict';
/*
 * Modo Trio de Campeões (3 contra 3): cada lado escolhe 3 lutadores e a ordem de entrada; um de cada vez luta.
 * Quem vence continua com a vida que tem (não enche); quem cai dá lugar ao próximo do time. Vence o time que derrubar os 3.
 */
(function(){
if(!window.COMBAT_V3||!window.V3Modes)return;
const M=window.V3Modes,$q=s=>document.querySelector(s);
const FIGHT_TIME=120;
let K=null,pick=[],sel=-1;
// tipos de seleção: KOF (3 lutadores) e os modos do lobby (1×1, liga, 2×2) com a mesma tela
const KINDS={
 kof:{kind:'kof',max:3,min:3,label:'TRIO DE CAMPEÕES · 3×3',title:'SELEÇÃO DE TIME',vs:'3×3',labels:['1º','2º','3º'],foe:3,side:'JOGADOR',hint:'Toque para escolher 3 · ◀ ▶ muda a ordem de entrada'},
 '1v1':{kind:'1v1',max:1,min:1,label:'DUELO 1×1',title:'SELEÇÃO DE LUTADOR',vs:'1×1',labels:['VOCÊ'],foe:1,side:'JOGADOR',hint:'Toque para escolher seu lutador'},
 league:{kind:'league',max:1,min:1,label:'LIGA OFFLINE',title:'SELEÇÃO DE LUTADOR',vs:'1×1',labels:['VOCÊ'],foe:1,side:'JOGADOR',hint:'Toque para escolher seu lutador'},
 crown:{kind:'crown',max:1,min:1,label:'DISPUTA DA COROA',title:'SELEÇÃO DE LUTADOR',vs:'4P',labels:['VOCÊ'],foe:3,side:'JOGADOR',hint:'Escolha seu lutador · 3 rivais disputam a coroa; só um fica de pé'},
 '2v2':{kind:'2v2',max:2,min:1,label:'EQUIPES 2×2',title:'SELEÇÃO DE DUPLA',vs:'2×2',labels:['VOCÊ','ALIADO'],foe:2,side:'SUA DUPLA',hint:'Escolha você e seu aliado (opcional) · ◀ ▶ troca'}
};
let PK=KINDS.kof,bypass=false,allyPick=null;

const faceOf=id=>championArt(CHAMPIONS[id]);
// arte de combate em repouso (animada) nos cartões de seleção
const sprite=id=>`<canvas class="kof-sprite" data-skin="${id}" width="200" height="200" aria-hidden="true"></canvas>`;
const idleActors={};
const idleActor=id=>idleActors[id]||(idleActors[id]={...skinPreviewActor,skin:id,color:CHAMPIONS[id].color});
let spriteLoop=false;
let foeShown=-1,faceT=0;
function paintSprites(){
 const cs=document.querySelectorAll('.kof-screen canvas.kof-sprite');
 if(!cs.length){spriteLoop=false;return}
 const t=performance.now()/1000;
 // rival misterioso: a silhueta troca de herói como num sorteio
 const fid=Math.floor(t*1.3)%CHAMPIONS.length;
 if(fid!==foeShown){foeShown=fid;document.querySelectorAll('.kof-screen [data-foe]').forEach(c=>{c.dataset.skin=fid});const im=document.querySelector('.kx-art.right img');if(im)im.src=faceOf(fid)}
 // retratos recortados do rosto (ficam prontos depois de carregar)
 if(t-faceT>.25){faceT=t;document.querySelectorAll('.kx-tile img[data-face]').forEach(im=>{try{const id=+im.dataset.face,u=window.v3FaceSrc&&v3FaceSrc({skin:id,kit:CHAMPIONS[id].kit});if(u&&im.getAttribute('src')!==u)im.setAttribute('src',u)}catch{}})}
 cs.forEach(c=>{const g=c.getContext('2d');g.clearRect(0,0,200,200);g.save();g.translate(100,172);g.fillStyle='#04120d88';g.beginPath();g.ellipse(0,8,34,9,0,0,6.2832);g.fill();g.imageSmoothingEnabled=false;
  // mesmo repouso da tela inicial: usa o ator do santuário (só ele recebe a animação de repouso), sem inclinar nem deformar
  const id=+c.dataset.skin,keep=lobbyActor.skin;lobbyActor.skin=id;
  try{drawAnimatedFighter(g,lobbyActor,150,t)}catch{}lobbyActor.skin=keep;g.restore()});
 requestAnimationFrame(paintSprites);
}
function startSprites(){if(spriteLoop)return;spriteLoop=true;for(const c of CHAMPIONS){try{reworkPreload(c.id)}catch{}}try{loadSkinAtlas()}catch{}requestAnimationFrame(paintSprites)}
let focus=0;
const BLANK='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const faceReady=id=>{try{return(window.v3FaceSrc&&v3FaceSrc({skin:id,kit:CHAMPIONS[id].kit}))||null}catch{return null}};
// retratos recortados no rosto (como no KOF): sem nome, sem trocar de imagem ao tocar
const tileHtml=c=>{const n=pick.indexOf(c.id),lock=!heroUsable(c.id);return `<button class="kx-tile ${n>=0?'picked':''} ${focus===c.id?'focus':''} ${lock?'locked':''}" data-kof-pick="${c.id}" title="${c.name}" aria-label="${c.name}" style="--hero:${c.color}"><img data-face="${c.id}" src="${faceReady(c.id)||BLANK}" alt="">${n>=0?`<i class="kx-n">${n+1}</i>`:''}</button>`};
function rowHtml(i){
 const id=pick[i];
 return `<div class="kx-row ${id!==undefined?'full':''}" data-kof-slot="${i}"><i>${PK.labels[i]}</i><span>${id!==undefined?CHAMPIONS[id].name:'— vazio —'}</span>${id!==undefined?`<em><button data-kof-mv="${i},-1" aria-label="Mover para antes">◀</button><button data-kof-mv="${i},1" aria-label="Mover para depois">▶</button></em>`:''}</div>`;
}
function selectHtml(){
 const c=CHAMPIONS[focus]||CHAMPIONS[0];
 return `<div class="kof-screen kx" style="--hero:${c.color}"><div class="kx-bg"></div>
 <button class="kx-back" data-kof-back>${PK.kind==='kof'?'← Arenas':'← Início'}</button>
 <div class="kx-title"><small>${PK.label}</small><h1>${PK.title}</h1></div>
 <button class="kx-go" data-kof-go ${pick.length>=PK.min?'':'disabled'}>${pick.length>=PK.min?'LUTAR':pick.length+'/'+PK.max}</button>
 <div class="kx-stage">
  <div class="kx-art left"><img src="${faceOf(c.id)}" alt=""></div>
  <div class="kx-mid">
   <div class="kx-fighter"><div class="kx-plat blue"></div><canvas class="kof-sprite" data-skin="${c.id}" width="200" height="200"></canvas></div>
   <div class="kx-vs"><b>VS</b><small>${PK.vs}</small></div>
   <div class="kx-fighter foe"><div class="kx-plat red"></div><canvas class="kof-sprite" data-foe="1" data-skin="0" width="200" height="200"></canvas></div>
  </div>
  <div class="kx-art right"><img src="${faceOf(0)}" alt=""></div>
  <div class="kx-team left"><h3>${PK.side}</h3>${Array.from({length:PK.max},(_,i)=>rowHtml(i)).join('')}</div>
  <div class="kx-team right"><h3>RIVAL</h3>${Array.from({length:PK.foe},(_,i)=>`<div class="kx-row foe"><i>${PK.kind==='kof'?(i+1)+'º':''}</i><span>? ? ?</span></div>`).join('')}</div>
 </div>
 <div class="kx-names"><div class="kx-name blue">${c.name}</div><div class="kx-hint">${PK.hint}</div><div class="kx-name red">? ? ?</div></div>
 <div class="kx-grid">${CHAMPIONS.map(tileHtml).join('')}</div></div>`;
}
function render(){const el=$q('#modeScreen');el.innerHTML=selectHtml();el.hidden=false;startSprites()}
function open(kind='kof'){
 PK=KINDS[kind]||KINDS.kof;
 const act=Math.max(0,Math.min(CHAMPIONS.length-1,account.activeChampion||0));
 pick=PK.kind==='kof'?[]:[act];sel=-1;focus=act;
 showScreen('home');appScreen='arenas';document.body.dataset.screen='arenas';
 $q('#homeScreen').hidden=true;document.body.style.overflow='hidden';
 render();try{renderLobbyNav()}catch{}
}
document.addEventListener('click',e=>{
 const el=$q('#modeScreen');if(!el||el.hidden||!el.querySelector('.kof-screen'))return;
 if(e.target.closest('[data-kof-back]')){e.stopImmediatePropagation();if(PK.kind==='kof'||(PK.kind==='crown'&&!(window.V3Liga&&V3Liga.state.pending)))showArenaModes();else showScreen('home');return}
 const mv=e.target.closest('[data-kof-mv]');
 if(mv){e.stopImmediatePropagation();const [i,d]=mv.dataset.kofMv.split(',').map(Number),j=i+d;if(j>=0&&j<pick.length){[pick[i],pick[j]]=[pick[j],pick[i]]}render();return}
 const hero=e.target.closest('[data-kof-pick]');
 if(hero){e.stopImmediatePropagation();const id=+hero.dataset.kofPick;if(!heroUsable(id)){focus=id;toast('Campeão bloqueado · libere na Loja ('+HERO_PRICE.toLocaleString('pt-BR')+' moedas)');render();return}const k=pick.indexOf(id);focus=id;if(k>=0){if(PK.kind==='kof'||pick.length>1)pick.splice(k,1)}else if(pick.length<PK.max)pick.push(id);else if(PK.kind!=='kof')pick[pick.length-1]=id;render();return}
 const slot=e.target.closest('[data-kof-slot]');
 if(slot&&!e.target.closest('button')){e.stopImmediatePropagation();const i=+slot.dataset.kofSlot;if(pick[i]!==undefined){pick.splice(i,1);render()}return}
 if(e.target.closest('[data-kof-go]')){e.stopImmediatePropagation();if(pick.length>=PK.min){if(PK.kind==='kof')begin([...pick]);else launchPick()}return}
},true);

// 1×1, liga e 2×2: usa o lutador escolhido (e o aliado, no 2×2) e segue o fluxo normal do lobby
function launchPick(){
 const hero=pick[0];
 try{equipChampion(hero,false)}catch{}
 if(PK.kind==='crown'){$q('#modeScreen').hidden=true;window.V3Crown?.begin();return}
 allyPick=PK.kind==='2v2'&&pick[1]!==undefined?pick[1]:null;
 $q('#modeScreen').hidden=true;
 bypass=true;try{playLobbyMode()}finally{bypass=false}
}
const prevPlay=playLobbyMode;
playLobbyMode=function(){
 const sel=$q('#lobbyModeSelect');
 if(!bypass&&sel&&sel.value!=='arenas'&&KINDS[lobbyPrefs.mode]&&lobbyPrefs.mode!=='kof'){open(lobbyPrefs.mode);return true}
 return prevPlay.apply(this,arguments);
};
const prevStartK=start;
start=function(){
 const r=prevStartK.apply(this,arguments);
 try{
  if(allyPick!==null&&matchMode==='2v2'&&!arenaModeId){
   const ally=actors.find(a=>a.team===0&&a!==p);
   if(ally){M.swapHero(ally,allyPick,1000);ally.label=M.heroName(allyPick)}
  }
 }catch(e){console.error('[Eldoria] aliado escolhido',e)}
 allyPick=null;
 return r;
};

function begin(mine){
 const pool=CHAMPIONS.map(c=>c.id).filter(id=>!mine.includes(id));
 const foes=[];while(foes.length<3){const k=Math.floor(Math.random()*pool.length);foes.push(pool.splice(k,1)[0])}
 M.pending='kof';battleActivity='casual';matchMode='1v1';arenaModeId=null;modeRun=null;
 $q('#modeScreen').hidden=true;
 start();
 setup(mine,foes);
 p.label=account.profile?.name||'Você';b.label=M.heroName(foes[0]);
}
// prepara a série com os dois times (offline: o time sorteado do rival; online: o time que o outro jogador escolheu). Chamar com a luta já criada
// e V3Modes.pending='kof' antes do start() (para o duelo em rounds não entrar junto).
function setup(mine,foes){
 K={mine,foes,hpM:[1000,1000,1000],hpF:[1000,1000,1000],iM:0,iF:0,fights:0};
 M.special='kof';
 M.swapHero(p,mine[0],1000);M.swapHero(b,foes[0],1000);
 M.rebuildPlayerUI();time=FIGHT_TIME;
 drawStrips();
 M.banner('TRIO DE CAMPEÕES · 3×3',M.heroName(mine[0])+' × '+M.heroName(foes[0]),2400);
}

/* ---------- faixas com o time dos dois lados ---------- */
const hud=$q('#battle .hud');
function mkStrip(cls){const d=document.createElement('div');d.className='kof-strip '+cls;d.hidden=true;hud?.appendChild(d);return d}
const sM=mkStrip('mine'),sF=mkStrip('foe');
function updateStrip(strip,ids,hps,current){
 while(strip.children.length>ids.length)strip.lastElementChild.remove();
 ids.forEach((id,i)=>{
  let slot=strip.children[i];
  if(!slot){
   slot=document.createElement('span');
   const img=document.createElement('img');img.alt='';
   slot.append(img,document.createElement('i'));strip.appendChild(slot);
  }
  const image=slot.firstElementChild,src=faceOf(id);
  if(image.getAttribute('src')!==src)image.src=src;
  hudAttr(slot,'title',CHAMPIONS[id].name);
  slot.classList.toggle('cur',i===current);
  slot.classList.toggle('dead',hps[i]<=0);
  slot.lastElementChild.style.width=Math.max(0,Math.min(100,hps[i]/10))+'%';
 });
}
function drawStrips(){
 const on=M.special==='kof'&&K;
 hudHidden(sM,!on);hudHidden(sF,!on);
 if(!on)return;
 updateStrip(sM,K.mine,K.hpM,K.iM);
 updateStrip(sF,K.foes,K.hpF,K.iF);
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
  const rt=$q('#resultText');if(rt)rt.textContent=(win?'Trio vencido! Os 3 rivais caíram. ':'Seu trio caiu. ')+rt.textContent;
  return true;
 }
 K.iM=nm;K.iF=nf;K.fights++;
 M.clearField();
 const hpWinnerM=lp?null:p.hp,hpWinnerF=lb?null:b.hp;
 if(lp){M.swapHero(p,K.mine[K.iM],1000)}else{M.resetFighter(p)}
 if(lb){M.swapHero(b,K.foes[K.iF],1000)}else{M.resetFighter(b)}
 if(hpWinnerM!==null)p.hp=hpWinnerM;if(hpWinnerF!==null)b.hp=hpWinnerF;
 p.x=W*.22;p.y=H*.5;b.x=W*.78;b.y=H*.5;b.a=Math.PI;p.a=0;M.faceOff();
 b.label=M.heroName(K.foes[K.iF]);
 M.rebuildPlayerUI();time=FIGHT_TIME;M.startCount(2.8);drawStrips();
 const who=lp&&lb?'Os dois lados trocam de lutador':lp?'Entra '+M.heroName(K.mine[K.iM]):'Entra '+M.heroName(K.foes[K.iF])+' (rival)';
 M.banner('PRÓXIMO',who+' · '+M.heroName(K.mine[K.iM])+' × '+M.heroName(K.foes[K.iF]),2300);
 return true;
}
handler.label=win=>M.special==='kof'&&K?[win?'RIVAL DERRUBADO':'LUTADOR DERRUBADO',(win?'Seu time continua com a vida que tem':'Entra o próximo do seu time')]:null;
V3Hooks.add(handler);
// série do Trio para quem volta no meio: o servidor manda o estado; "inverter" quando o time do servidor "meu" (vaga 0) é o rival deste navegador
const exportar=()=>K?JSON.parse(JSON.stringify(K)):null;
function importar(e,inverter){
 if(!e||!K)return;
 K=inverter?{mine:e.foes,foes:e.mine,hpM:e.hpF,hpF:e.hpM,iM:e.iF,iF:e.iM,fights:e.fights}:{...e};
 M.swapHero(p,K.mine[Math.min(2,K.iM)],1000);M.swapHero(b,K.foes[Math.min(2,K.iF)],1000);
 try{M.rebuildPlayerUI()}catch{}
 drawStrips();
}
window.V3Kof={open,PK:()=>PK,get state(){return K},begin,setup,exportar,importar};
})();
