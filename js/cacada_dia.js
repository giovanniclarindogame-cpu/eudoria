'use strict';
/*
 * CAÇADA DO DIA — chefe diferente a cada dia, 1 ou 2 jogadores (dupla = você + aliado bot).
 * Substitui a antiga "Caçada ao Guardião". Primeiro chefe: KAELTHAR, Príncipe da Brasa Violeta.
 * Para criar outro chefe: adicione uma definição em ROSTER (ver KAEL) e um painter de sprite.
 */
(()=>{
const KEY='eldoria.cacada.v1';
const PK='#ff4f86',VI='#c04bff';

/* ============================== chefes ============================== */
const KAEL={
 id:'kaelthar',name:'Kaelthar',title:'Príncipe da Brasa Violeta',color:VI,
 hp:3200,hpDuo:4200,stars:4,difficulty:'Extrema',
 story:'Último herdeiro de uma linhagem guerreira que nunca aceitou ser o segundo. Ele deixa o rival chegar perto só para humilhá-lo — e cada golpe que sente alimenta o seu orgulho.',
 system:['Orgulho','Cada golpe que ele acerta ou recebe enche o Orgulho. Com 100, ele desperta a Ascensão Violeta por 10s: mais rápido, mais forte e com ataques ampliados. Ao fim, fica Exausto por 3s: sem defesa e recebendo 35% a mais de dano. Abaixo de 50% de vida, ele se enfurece.'],
 tips:[
  'Aposte nos pilares do centro: o Canhão do Príncipe para neles.',
  'Ele defende golpes de frente. Habilidades fortes quebram a guarda dele.',
  'Não troque golpes à toa: atacar demais enche o Orgulho dele.',
  'Na Ascensão, mantenha distância. Quando ele ficar Exausto, ataque com tudo.'
 ],
 skills:[
  {id:'s0',name:'Rajada Orgulhosa',icon:'volley',cd:7,desc:'Leque de 5 esferas violetas (9 ao ascender). Contorne pelas laterais ou use esquiva.'},
  {id:'s1',name:'Investida Real',icon:'dash',cd:8.5,desc:'Marca uma linha no chão e avança por ela com 125 de dano. Saia da linha ou esquive no último instante.'},
  {id:'s2',name:'Estrondo Real',icon:'shock',cd:11,desc:'Onda de choque ao redor dele que quebra a guarda. Na fúria, uma segunda onda atinge quem fugiu longe demais.'},
  {id:'s3',name:'Chuva Estelar',icon:'meteor',cd:12,desc:'Marca vários pontos do chão e derruba meteoros em ondas. Fique em movimento.'},
  {id:'s4',name:'Ascensão Violeta',icon:'ascend',cd:26,desc:'Usada quando o Orgulho chega a 100. Aura violeta por 10s; depois, Exaustão de 3s. É a sua janela de ataque.'},
  {id:'s5',name:'Canhão do Príncipe',icon:'cannon',cd:19,desc:'Carrega um raio enorme que trava a mira e quebra qualquer guarda. Pilares bloqueiam o raio.'}
 ],
 basics:[
  {name:'Soco do Príncipe',icon:'punch',desc:'Combo de 3 golpes (4 ao ascender). O último empurra com força.'},
  {name:'Guarda Soberba',icon:'guard',desc:'Bloqueia de frente. Gasta stamina e, se acabar, a guarda quebra.'},
  {name:'Passo Relâmpago',icon:'step',desc:'Esquiva curta com invulnerabilidade ao ver um golpe se formando.'}
 ]
};
const ROSTER=[KAEL];

/* ============================== persistência ============================== */
function loadSave(){
 const d={team:'duo',best:{},wins:{},tries:{}};
 try{return Object.assign(d,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return d}
}
function writeSave(s){try{localStorage.setItem(KEY,JSON.stringify(s));return true}catch{return false}}
let save=loadSave();

function dayIndex(now=new Date()){return Math.floor((now.getTime()-now.getTimezoneOffset()*60000)/864e5)}
function bossOfDay(now=new Date()){return ROSTER[dayIndex(now)%ROSTER.length]}
function msToMidnight(){const n=new Date(),m=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1);return m-n}
function clock3(ms){const s=Math.max(0,Math.floor(ms/1000));return[Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(v=>String(v).padStart(2,'0')).join(':')}
function mmss(sec){sec=Math.max(0,Math.round(sec));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')}

/* ============================== ícones em pixel art ============================== */
const iconCache={};
function skillIcon(kind){
 if(iconCache[kind])return iconCache[kind];
 const c=document.createElement('canvas');c.width=c.height=24;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const K=KaeltharSprite,r=K.rect;
 const L=(x0,y0,x1,y1,col)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);g.fillStyle=col;for(let i=0;i<=n;i++)g.fillRect(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),1,1)};
 const D=(x,y,rad,col)=>K.disc(g,x,y,rad,col);
 const gold='#f2ca5c',goldS='#b8912f',hot='#ff62a8',vio='#c04bff',vioD='#6d2a9e',white='#fff4ff';
 const glow=(x,y,rad)=>{D(x,y,rad+1,vioD);D(x,y,rad,vio);D(x,y,Math.max(1,rad-1),hot);D(x,y,Math.max(0,rad-2),white)};
 if(kind==='volley'){glow(7,12,3);for(const[y,s]of[[5,2],[12,3],[19,2]]){L(10,12,18,y,vioD);glow(19,y,s)}}
 else if(kind==='dash'){for(let i=0;i<4;i++)L(2,6+i*4,12+i*2,6+i*4,i%2?vioD:vio);D(17,12,4,hot);D(17,12,2,white);L(14,6,21,12,gold);L(14,18,21,12,gold)}
 else if(kind==='shock'){for(const[rad,col]of[[10,vioD],[7,vio],[4,hot]]){g.strokeStyle=col;g.lineWidth=2;g.beginPath();g.arc(12,12,rad,0,6.3);g.stroke()}D(12,12,2,white)}
 else if(kind==='meteor'){L(4,3,13,14,vioD);L(6,2,15,13,vio);glow(15,15,4);for(const[x,y]of[[3,19],[20,6],[21,20]])r(g,x,y,2,2,gold)}
 else if(kind==='ascend'){const fl=[[12,2],[15,8],[19,5],[17,13],[20,19],[12,21],[4,19],[7,13],[5,5],[9,8]];g.fillStyle=vio;g.beginPath();g.moveTo(...fl[0]);for(const p of fl)g.lineTo(...p);g.closePath();g.fill();D(12,13,5,hot);D(12,13,3,white);for(let i=0;i<5;i++)r(g,2+i*4,22-(i%2)*2,2,2,gold)}
 else if(kind==='cannon'){r(g,2,10,5,4,goldS);r(g,2,10,5,1,gold);for(const[h,col]of[[8,vioD],[6,vio],[3,hot],[1,white]])r(g,7,12-h/2,16,h,col);glow(21,12,2)}
 else if(kind==='punch'){r(g,5,8,12,8,gold);r(g,5,8,12,2,'#fff1a9');r(g,17,9,3,6,goldS);r(g,3,10,3,4,goldS);L(1,6,4,8,vio);L(1,18,4,16,vio)}
 else if(kind==='guard'){L(6,5,18,19,gold);L(18,5,6,19,goldS);r(g,5,4,4,3,gold);r(g,15,4,4,3,goldS);g.strokeStyle=vio;g.lineWidth=1;g.beginPath();g.arc(12,12,9,-1.2,1.2);g.stroke()}
 else if(kind==='step'){for(let i=0;i<3;i++){g.globalAlpha=.3+i*.3;r(g,3+i*5,6,5,12,i===2?hot:vio)}g.globalAlpha=1;L(14,12,21,12,gold);L(18,8,21,12,gold);L(18,16,21,12,gold)}
 else if(kind==='pride'){D(12,12,9,vioD);D(12,12,7,vio);L(6,15,12,5,gold);L(12,5,18,15,gold);L(8,15,16,15,gold);r(g,11,16,2,3,gold)}
 return iconCache[kind]=c.toDataURL();
}
const iconImg=(kind,cls='hunt-ico')=>`<img class="${cls}" src="${skillIcon(kind)}" alt="" draggable="false">`;

/* retrato (busto) gerado a partir do sprite */
let bustURL=null;
function bust(asc=false){
 if(bustURL&&!asc)return bustURL;
 const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const bg=g.createRadialGradient(48,40,6,48,48,70);bg.addColorStop(0,'#4a2275');bg.addColorStop(1,'#120a22');g.fillStyle=bg;g.fillRect(0,0,96,96);
 g.drawImage(KaeltharSprite.frame('idle',0,{asc}),15,11,36,36,0,0,96,96);
 const u=c.toDataURL();if(!asc)bustURL=u;return u;
}
/* ============================== lobby ============================== */
let lobbyDef=null,artRaf=0,timerInt=0,selectedSkill=null;
function stars(n){return '★'.repeat(n)+'☆'.repeat(5-n)}
function weekStrip(def){
 const names=['dom','seg','ter','qua','qui','sex','sáb'],now=new Date(),out=[];
 for(let i=0;i<7;i++){
  const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i),boss=i===0?def:null;
  out.push(`<div class="hunt-day ${i===0?'today':'locked'}"><small>${i===0?'hoje':names[d.getDay()]}</small><b>${boss?boss.name:'?'}</b><span>${i===0?'Disponível':'Em breve'}</span></div>`);
 }
 return out.join('');
}
function lobbyMarkup(def){
 const rec=save.best[def.id],wins=save.wins[def.id]||0,tries=save.tries[def.id]||0;
 const prize=ARENA_MODES.guardian.prize;
 const skillBtn=(s,i)=>`<button class="hunt-skill" data-hunt-skill="${i}" aria-label="${s.name}">${iconImg(s.icon)}<span>${s.name}</span></button>`;
 const basic=(s,i)=>`<button class="hunt-skill basic" data-hunt-basic="${i}" aria-label="${s.name}">${iconImg(s.icon)}<span>${s.name}</span></button>`;
 return `<div class="hunt-page" style="--boss:${def.color}">
 <header class="hunt-top"><button class="ghost" data-open-modes>← Arenas</button><div class="hunt-title"><span class="eyebrow">CAÇADA DO DIA</span><h1>${def.name}</h1></div><div class="hunt-timer" title="O chefe muda à meia-noite, no horário do seu aparelho">⏳ Novo chefe em <b id="huntTimer">${clock3(msToMidnight())}</b></div></header>
 <div class="hunt-body">
  <section class="hunt-stage"><canvas id="huntArt" width="420" height="340" aria-label="${def.name}, ${def.title}"></canvas>
   <div class="hunt-plate"><strong>${def.name}</strong><span>${def.title}</span><em>Dificuldade ${def.difficulty} <i>${stars(def.stars)}</i></em></div></section>
  <section class="hunt-info">
   <article class="hunt-card"><span class="eyebrow">CHEFE DE HOJE</span><p>${def.story}</p>
    <div class="hunt-chips"><span>2 fases</span><span>${mmss(ARENA_MODES.guardian.seconds)} de limite</span><span>◉ até ${prize} moedas</span><span>Vida ${save.team==='solo'?def.hp:def.hpDuo}</span></div></article>
   <article class="hunt-card"><span class="eyebrow">SISTEMA PRÓPRIO · ${def.system[0].toUpperCase()}</span>
    <div class="hunt-pride">${iconImg('pride','hunt-ico big')}<div><div class="pride-demo"><i></i></div><p>${def.system[1]}</p></div></div></article>
   <article class="hunt-card"><span class="eyebrow">6 HABILIDADES</span><div class="hunt-skills">${def.skills.map(skillBtn).join('')}</div>
    <span class="eyebrow" style="margin-top:12px;display:block">GOLPE, DEFESA E ESQUIVA</span><div class="hunt-skills three">${def.basics.map(basic).join('')}</div>
    <p class="hunt-skilldesc" id="huntSkillDesc" role="status">Toque em uma habilidade para ver como ela funciona.</p></article>
   <article class="hunt-card"><span class="eyebrow">COMO VENCER</span><ul class="hunt-tips">${def.tips.map(t=>`<li>${t}</li>`).join('')}</ul></article>
   <article class="hunt-card"><span class="eyebrow">CHEFES DA SEMANA</span><div class="hunt-week">${weekStrip(def)}</div></article>
  </section>
 </div>
 <footer class="hunt-foot">
  <div class="hunt-team" role="group" aria-label="Equipe"><button data-hunt-team="solo" class="${save.team==='solo'?'on':''}" aria-pressed="${save.team==='solo'}"><b>Solo</b><small>só você</small></button><button data-hunt-team="duo" class="${save.team==='duo'?'on':''}" aria-pressed="${save.team==='duo'}"><b>Dupla</b><small>com aliado bot</small></button><button class="off" disabled><b>Amigo</b><small>online · em breve</small></button></div>
  <div class="hunt-record"><small>Melhor tempo</small><b>${rec?mmss(rec):'—'}</b><small>${wins} vitória${wins===1?'':'s'} · ${tries} tentativa${tries===1?'':'s'}</small></div>
  <button class="gold hunt-go" data-hunt-start>⚔ INICIAR CAÇADA</button>
 </footer></div>`;
}
function openHuntLobby(){
 lobbyDef=bossOfDay();save=loadSave();
 showArenaModes();appScreen='hunt';document.body.dataset.screen='hunt';
 $('#modeScreen').innerHTML=lobbyMarkup(lobbyDef);$('#modeScreen').scrollTop=0;
 selectedSkill=null;startArt();
}
function startArt(){
 cancelAnimationFrame(artRaf);clearInterval(timerInt);
 const def=lobbyDef;
 timerInt=setInterval(()=>{const el=$('#huntTimer');if(!el||$('#modeScreen').hidden||appScreen!=='hunt'){clearInterval(timerInt);return}el.textContent=clock3(msToMidnight())},1000);
 const t0=performance.now();
 const loop=now=>{
  const cv=$('#huntArt');if(!cv||$('#modeScreen').hidden||appScreen!=='hunt'){artRaf=0;return}
  const g=cv.getContext('2d'),t=(now-t0)/1000;
  g.imageSmoothingEnabled=false;g.clearRect(0,0,420,340);
  // fundo do salão do chefe
  const bg=g.createRadialGradient(210,230,10,210,200,260);bg.addColorStop(0,'#3b1b5c');bg.addColorStop(.5,'#1a0f2e');bg.addColorStop(1,'#0a0714');g.fillStyle=bg;g.fillRect(0,0,420,340);
  g.fillStyle='#ffffff10';for(let i=0;i<26;i++){const x=(i*97+Math.floor(t*6*(1+i%3)))%420,y=(i*53)%200;g.fillRect(x,y,2,2)}
  // piso rúnico
  g.save();g.translate(210,300);g.scale(1,.28);g.strokeStyle='#c04bff55';g.lineWidth=5;for(const r of[150,115,80]){g.beginPath();g.arc(0,0,r,0,6.3);g.stroke()}
  g.rotate(t*.3);g.strokeStyle='#ff62a855';g.lineWidth=4;g.beginPath();for(let i=0;i<6;i++){const a=i/6*6.283;g.lineTo(Math.cos(a)*118,Math.sin(a)*118)}g.closePath();g.stroke();g.restore();
  // ciclo de pose: descanso → habilidades (mostra as formas do chefe)
  const cyc=[['idle',2.4,0],['s0',1.4,0],['idle',1.2,0],['s2',1.4,0],['idle',1,0],['s4',1.6,1],['s5',1.8,0]],total=cyc.reduce((s,c)=>s+c[1],0);
  let u=t%total,pose='idle',asc=0,lt=0;for(const[n,d,a]of cyc){if(u<d){pose=n;asc=a;lt=u;break}u-=d}
  const frames=KaeltharSprite.POSES[pose].n;
  let fi=pose==='idle'?Math.floor(t*4)%frames:pose==='s0'?(lt<.4?0:lt<.7?1:lt<.85?2:3):pose==='s2'?(lt<.4?0:lt<.7?1:lt<.95?2:3):pose==='s4'?Math.min(2,Math.floor(lt/.5)):(lt<.5?0:lt<1?1:lt<1.25?2:lt<1.45?3:4);
  const power=asc||pose==='s2'||pose==='s5'||pose==='s0'?1:.25;
  g.save();g.globalCompositeOperation='lighter';
  const ag=g.createRadialGradient(210,170,6,210,170,150);ag.addColorStop(0,'rgba(255,98,168,'+(.4*power)+')');ag.addColorStop(.5,'rgba(192,75,255,'+(.25*power)+')');ag.addColorStop(1,'rgba(192,75,255,0)');g.fillStyle=ag;g.fillRect(0,0,420,340);
  for(let i=0;i<22;i++){const k=(t*(.45+(i%5)*.07)+i/22)%1,x=210+Math.sin(i*5.3+t*1.7)*(48+k*26),y=312-k*230,s=Math.max(2,Math.round(7*(1-k)));g.globalAlpha=(1-k)*(.35+.65*power);g.fillStyle=i%3?'#c04bff':'#ff62a8';g.fillRect(Math.round(x),Math.round(y),s,s)}
  g.restore();
  KaeltharSprite.paint(g,pose,fi,{x:210,y:312,scale:6,asc:!!asc,filter:'drop-shadow(0 0 10px #c04bff88)'});
  artRaf=requestAnimationFrame(loop);
 };
 artRaf=requestAnimationFrame(loop);
}
document.addEventListener('click',e=>{
 const team=e.target.closest('[data-hunt-team]');
 if(team&&appScreen==='hunt'){save.team=team.dataset.huntTeam;writeSave(save);
  document.querySelectorAll('[data-hunt-team]').forEach(b=>{const on=b===team;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
  const chip=document.querySelectorAll('.hunt-chips span')[3];if(chip)chip.textContent='Vida '+(save.team==='solo'?lobbyDef.hp:lobbyDef.hpDuo);return}
 const sk=e.target.closest('[data-hunt-skill],[data-hunt-basic]');
 if(sk&&appScreen==='hunt'){const s=sk.dataset.huntSkill!==undefined?lobbyDef.skills[sk.dataset.huntSkill]:lobbyDef.basics[sk.dataset.huntBasic];
  document.querySelectorAll('.hunt-skill').forEach(b=>b.classList.toggle('on',b===sk));
  $('#huntSkillDesc').innerHTML=`<b>${s.name}</b> — ${s.desc}`+(s.cd?` <i>Recarga ${s.cd}s.</i>`:'');return}
 if(e.target.closest('[data-hunt-start]')&&appScreen==='hunt'){startHunt()}
});
let launching=false;
function startHunt(){
 save=loadSave();save.tries[lobbyDef.id]=(save.tries[lobbyDef.id]||0)+1;writeSave(save);
 cancelAnimationFrame(artRaf);clearInterval(timerInt);
 launching=true;try{beginArenaMode('guardian')}finally{launching=false}
}
const prevBegin=beginArenaMode;
beginArenaMode=function(id){
 if(id==='guardian'&&!launching){
  if(!account?.profile)return false;
  if(!validOwnedKit(selected)){showScreen('library');announce('Equipe seis Ecos desbloqueados.');return false}
  openHuntLobby();return true;
 }
 return prevBegin(id);
};

/* textos dos menus de modos */
ARENA_MODES.guardian.name='Caçada do Dia';
ARENA_MODES.guardian.prize=300;
ARENA_MODES.guardian.seconds=300;
ARENA_MODES.guardian.copy='Um chefe diferente a cada dia. Enfrente-o sozinho ou em dupla com um aliado bot. Duas fases e sistema próprio; sem reaparecimento.';
if(typeof SIMPLE_MODE_COPY!=='undefined')SIMPLE_MODE_COPY.guardian=['Chefe do dia','Um vilão diferente a cada dia. Solo ou em dupla.'];

/* ============================== arena ============================== */
let lastHuntArena=false;
const prevCfg=configureArenaSize;
configureArenaSize=function(){
 prevCfg();
 const hunt=arenaModeId==='guardian'&&battleActivity!=='training';
 if(hunt||lastHuntArena)groundCache=null;
 lastHuntArena=hunt;
 if(hunt)pillars=[...pillars,{x:W*.36,y:H*.5,r:27},{x:W*.64,y:H*.5,r:27}];
};

/* câmera: enquadra jogador e chefe juntos */
const prevCam=updateArenaCamera;
updateArenaCamera=function(){
 const R=modeRun&&modeRun.hunt;
 if(!R||courtyardWide||cw<ch||!p||!cw)return prevCam();
 const pts=actors.filter(a=>a.hp>0&&(a===p||a===R.a));if(pts.length<2)return prevCam();
 const top=ch<520?58:88,xs=pts.map(a=>a.x),ys=pts.map(a=>a.y);
 const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 const fit=Math.min((cw-330)/(x1-x0+200),(ch-top-150)/(y1-y0+180));
 scale=clamp(fit,Math.min(.7,(cw-20)/W),1.38);
 const cx=(x0+x1)/2,cy=(y0+y1)/2;
 ox=cw*.5-cx*scale;oy=top+(ch-top)*.45-cy*scale;
 ox=W*scale>cw?clamp(ox,cw-W*scale,0):(cw-W*scale)/2;
 oy=H*scale>ch-top?clamp(oy,ch-H*scale,top):top+(ch-top-H*scale)/2;
};
/* ============================== estado do chefe ============================== */
const hunt=()=>modeRun&&modeRun.hunt;
const prevPrepare=prepareArenaMode;
prepareArenaMode=function(){
 prevPrepare();
 if(arenaModeId!=='guardian'||!modeRun)return;
 const def=bossOfDay(),solo=loadSave().team==='solo';
 const ally=actors.find(a=>a!==p&&a!==b&&a.team===0);
 actors=solo||!ally?[p,b]:[p,b,ally];
 time=ARENA_MODES.guardian.seconds;
 b.boss=true;b.huntBoss=true;b.team=1;b.label=def.name;b.r=25;b.max=b.hp=solo?def.hp:def.hpDuo;b.a=Math.PI;b.st=100;
 p.x=W*.16;p.y=H*.5;if(ally&&!solo){ally.x=W*.16;ally.y=H*.78;ally.label='Aliado'}
 b.x=W*.8;b.y=H*.5;
 modeRun.hunt=b.hunt={
  def,a:b,solo,pride:0,asc:0,exh:0,p2:false,act:null,rest:1.4,guardT:0,guardCD:0,dodgeCD:0,strafe:1,strafeT:2,walk:0,face:Math.PI,
  cds:{s0:1.5,s1:5,s2:8,s3:7,s4:0,s5:12},tele:[],orbs:[],beam:null,cannon:null,ghosts:[],pose:null,dying:0,landed:0,glow:0,aggro:0,aggroT:0,banner:0,intro:false
 };
 b.kit=[0,1,2,3,4,5].map(i=>i);
};
const prevStart=start;
start=function(){
 const r=prevStart.apply(this,arguments);
 const eb=document.querySelector('#outcome .eyebrow');if(eb)eb.textContent=arenaModeId==='guardian'?'CAÇADA ENCERRADA':'DUELO ENCERRADO';
 if(modeRun?.hunt){$('#teamHud').hidden=modeRun.hunt.solo;
  const def=modeRun.hunt.def;
  $('#botkit').innerHTML=def.skills.map(s=>`<span title="${s.name}">${iconImg(s.icon,'hunt-mini')}</span>`).join('');
  $('#battle').dataset.arena='hunt';
 }
 return r;
};

/* ============================== utilidades de combate ============================== */
const ang=(a,t)=>Math.atan2(t.y-a.y,t.x-a.x);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const foes=A=>opponents(A);
function pickTarget(R,A){
 const list=foes(A);if(!list.length)return null;
 R.aggroT-=1/60;
 if(R.aggroT<=0||!list.includes(R.aggro)){R.aggroT=3+Math.random()*3;R.aggro=list.length>1&&Math.random()<.4?list[1]:list[0]}
 const near=list.sort((x,y)=>dist(A,x)-dist(A,y))[0];
 return dist(A,near)<110?near:R.aggro;
}
function bossHit(t,dmg,knock,angle,opt={}){
 const R=hunt(),A=R.a;if(t.hp<=0||A.hp<=0)return false;
 const n=dmg*(R.asc>0?1.25:1)*(R.p2?1.08:1);
 if(opt.breakGuard&&t.guard&&t.inv<=0)breakGuard(t);
 const ok=hit(t,n,A,knock,angle,-1);
 if(ok){R.landed++;if(R.asc<=0&&R.exh<=0)R.pride=Math.min(100,R.pride+(opt.pride??5))}
 return ok;
}
function addTele(o){const R=hunt();R.tele.push(Object.assign({t:0,dur:1,color:PK},o))}
function rayEnd(x,y,a,max=700){let d=0,px=x,py=y;while(d<max){const nx=x+Math.cos(a)*(d+10),ny=y+Math.sin(a)*(d+10);if(blocked(nx,ny,3))break;px=nx;py=ny;d+=10}return{x:px,y:py,len:d}}
function shock(A,r,dmg,knock,r0=0){
 ring(A.x,A.y,r,PK,.55);ring(A.x,A.y,r*.7,VI,.45);spark(A.x,A.y,VI,22);combatImpact(1.7);combatSound('heavy',1.3);
 for(const t of foes(A)){const d=dist(A,t);if(d<r+t.r&&d>=r0)bossHit(t,dmg,knock,ang(A,t),{breakGuard:true,pride:8})}
}
function fireOrb(A,a,speed,dmg=52){
 const R=hunt();R.orbs.push({x:A.x+Math.cos(a)*28,y:A.y-8+Math.sin(a)*28,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:11,dmg,life:2.6,t:0});
}
function meteorWave(A,R){
 const spots=[];
 for(const t of foes(A)){
  spots.push({x:t.x,y:t.y});
  const o=Math.random()*TAU,d=70+Math.random()*50;spots.push({x:t.x+Math.cos(o)*d,y:t.y+Math.sin(o)*d});
 }
 const o=Math.random()*TAU;spots.push({x:A.x+Math.cos(o)*(160+Math.random()*120),y:A.y+Math.sin(o)*(120+Math.random()*80)});
 for(const s of spots){
  const x=clamp(s.x,70,W-70),y=clamp(s.y,70,H-70);
  addTele({kind:'meteor',x,y,r:64,dur:1.05,onDone:()=>{
   ring(x,y,64,PK,.5);ring(x,y,38,VI,.4);spark(x,y,'#ffd0ee',16);combatImpact(1.1);combatSound('heavy',1);
   for(const t of foes(A))if(dist(t,{x,y})<64+t.r)bossHit(t,92,45,Math.atan2(t.y-y,t.x-x),{pride:5});
  }});
 }
}

/* ============================== ações do chefe ============================== */
const ACT={};
ACT.basic=(dt,A,R,T,a)=>{
 if(!a.init){a.init=1;a.N=R.asc>0?4:3;a.k=0}
 const st=.2,gap=.42,dur=st+(a.N-1)*gap+.5;
 const k=Math.min(a.N-1,Math.max(0,Math.floor((a.t-(st-.2))/gap)));
 const local=(a.t-(k*gap))/(gap);
 R.pose={name:'punch',i:clamp(Math.floor(local*6),0,5),side:k%2};
 if(!a.stop&&a.k<a.N&&a.t>=st+a.k*gap){
  const i=a.k++;A.a=ang(A,T);R.face=A.a;
  move(A,Math.cos(A.a)*14,Math.sin(A.a)*14);
  const last=i===a.N-1,reach=92+T.r;let landed=false;
  for(const t of foes(A)){
   const d=dist(A,t),diff=Math.abs(wrap(ang(A,t)-A.a));
   if(d<reach&&diff<1.0&&bossHit(t,[32,36,44,72][i],last?70:12,ang(A,t),{pride:5}))landed=true;
  }
  combatSound(last?'heavy':'hit',last?1.2:.9);
  if(!landed)a.stop=true;
 }
 return a.t>=(a.stop?st+a.k*gap+.25:dur);
};
ACT.s0=(dt,A,R,T,a)=>{
 if(!a.init){a.init=1;a.ang=ang(A,T)}
 if(a.t<.5){a.ang=ang(A,T);A.a=a.ang;R.face=a.ang}
 R.pose={name:'s0',i:a.t<.25?0:a.t<.5?1:a.t<.65?2:3};R.glow=Math.max(R.glow,.6);
 if(!a.f1&&a.t>=.5){a.f1=true;const c=R.asc>0?9:5,sp=.95;
  for(let i=0;i<c;i++)fireOrb(A,a.ang+(i-(c-1)/2)*(sp/(c-1)),330+(i%2)*30);combatSound('hit',1)}
 if(R.p2&&!a.f2&&a.t>=.95){a.f2=true;const q=ang(A,T);A.a=q;R.face=q;for(let i=-1;i<=1;i++)fireOrb(A,q+i*.09,430,46)}
 return a.t>=(R.p2?1.45:1.05);
};
ACT.s1=(dt,A,R,T,a)=>{
 if(!a.init){a.init=1;a.ang=ang(A,T);a.len=clamp(dist(A,T)+90,300,500);A.a=a.ang;R.face=a.ang;
  addTele({kind:'line',x:A.x,y:A.y,a:a.ang,len:a.len,w:58,dur:.65})}
 if(a.t<.65){R.pose={name:'s1',i:a.t<.3?0:1};return false}
 if(!a.go){a.go=1;a.dist=0;a.hits=new Set();combatSound('heavy',1.1)}
 if(!a.stop){
  const mv=1150*dt,bx=A.x,by=A.y,blockedNow=move(A,Math.cos(a.ang)*mv,Math.sin(a.ang)*mv);
  a.dist+=Math.hypot(A.x-bx,A.y-by);
  R.ghosts.push({x:A.x,y:A.y,face:R.face,life:.22,max:.22});
  for(const t of foes(A))if(!a.hits.has(t)&&dist(A,t)<A.r+t.r+14){a.hits.add(t);bossHit(t,125,70,a.ang,{pride:8})}
  if(blockedNow||a.dist>=a.len){a.stop=1;a.rec=a.t;ring(A.x,A.y,50,VI,.4);spark(A.x,A.y,PK,10)}
 }
 R.pose={name:'s1',i:a.stop?3:2};
 return !!a.stop&&a.t-a.rec>.55;
};
ACT.s2=(dt,A,R,T,a)=>{
 const w=.8;
 if(!a.init){a.init=1;addTele({kind:'circle',follow:A,r:185,dur:w})}
 R.pose=a.t<w?{name:'s2',i:a.t<.4?0:1}:{name:'s2',i:a.t<w+.2?2:3};R.glow=Math.max(R.glow,a.t<w?a.t/w:1);
 if(!a.f1&&a.t>=w){a.f1=1;shock(A,185,105,90)}
 if(R.p2){
  if(!a.t2&&a.t>=w+.15){a.t2=1;addTele({kind:'ring',x:A.x,y:A.y,r:290,r0:185,dur:.55})}
  if(!a.f2&&a.t>=w+.7){a.f2=1;shock(A,290,85,70,185)}
 }
 return a.t>=w+(R.p2?1.25:.6);
};
ACT.s3=(dt,A,R,T,a)=>{
 const waves=R.p2?3:2;
 if(!a.init){a.init=1;a.next=.55;a.w=0}
 R.pose={name:'s3',i:a.t<.25?0:a.t<.5?1:a.w>=waves?3:2};R.glow=Math.max(R.glow,.5);
 if(a.w<waves&&a.t>=a.next){a.w++;a.next+=.85;meteorWave(A,R)}
 return a.w>=waves&&a.t>=a.next-.85+1.3;
};
ACT.s4=(dt,A,R,T,a)=>{
 if(!a.init){a.init=1;A.inv=Math.max(A.inv,1.25);addTele({kind:'circle',follow:A,r:150,dur:.55,color:VI})}
 R.pose={name:'s4',i:Math.min(2,Math.floor(a.t/.4))};R.glow=1;
 if(!a.f&&a.t>=.55){a.f=1;R.asc=10;R.pride=0;R.exh=0;
  ring(A.x,A.y,150,'#ffffff',.6);ring(A.x,A.y,100,PK,.5);spark(A.x,A.y,'#e6baff',30);combatImpact(2);combatSound('crit',1.4);
  for(const t of foes(A)){const d=dist(A,t);if(d<150+t.r)bossHit(t,30,90,ang(A,t),{pride:0})}
  float(A.x,A.y-80,'ASCENSÃO VIOLETA','#e6baff');toast('Kaelthar despertou a Ascensão Violeta!')}
 return a.t>=1.2;
};
ACT.s5=(dt,A,R,T,a)=>{
 if(!a.init){a.init=1;a.shot=0;a.sub=0;a.ang=ang(A,T);a.phase='charge';a.shots=R.p2?2:1}
 a.sub+=dt;
 const ch=a.shot===0?1.5:.75,fireDur=.55;
 if(a.phase==='charge'){
  if(a.sub<ch*.62)a.ang+=wrap(ang(A,T)-a.ang)*Math.min(1,dt*(a.shot?5:2.6));
  A.a=a.ang;R.face=a.ang;R.glow=Math.max(R.glow,.4+a.sub/ch*.6);
  R.cannon={a:a.ang,k:a.sub/ch,locked:a.sub>=ch*.62};
  R.pose={name:'s5',i:a.sub<.5?0:a.sub<1?1:2};
  if(a.sub>=ch){
   a.phase='fire';a.sub=0;a.hit=new Set();R.cannon=null;
   const o={x:A.x+Math.cos(a.ang)*26,y:A.y-6+Math.sin(a.ang)*26},e=rayEnd(o.x,o.y,a.ang);
   R.beam={x:o.x,y:o.y,ex:o.x+Math.cos(a.ang)*e.len,ey:o.y+Math.sin(a.ang)*e.len,a:a.ang,t:0,dur:fireDur,w:R.p2?86:68};
   combatImpact(2);combatSound('crit',1.5);
  }
  return false;
 }
 if(a.phase==='fire'){
  R.pose={name:'s5',i:a.sub<.2?3:4};R.glow=1;
  const B=R.beam;
  if(B)for(const t of foes(A))if(!a.hit.has(t)&&lineDistance(t.x,t.y,B.x,B.y,B.ex,B.ey)<B.w/2+t.r*.6){a.hit.add(t);bossHit(t,240,60,a.ang,{breakGuard:true,pride:10})}
  if(a.sub>=fireDur){
   if(a.shot+1<a.shots){a.shot++;a.phase='charge';a.sub=0;R.beam=null}
   else{a.phase='rest';a.sub=0;R.beam=null}
  }
  return false;
 }
 R.pose={name:'s5',i:4};
 return a.sub>=.6;
};

/* ============================== IA do chefe ============================== */
function startAct(R,id,extra){R.act=Object.assign({id,t:0},extra);R.rest=0}
function cdReady(R,k){return R.cds[k]<=0}
function bossMove(A,R,angle,speed,dt){
 A.a=angle;R.face=angle;A.moving=true;R.walk+=dt*speed/16;
 move(A,Math.cos(angle)*speed*dt,Math.sin(angle)*speed*dt);
}
function huntAI(dt,A){
 const R=A.hunt;A.moving=false;
 if(R.dying||state!=='fight')return;
 const T=pickTarget(R,A);if(!T)return;
 const d=dist(A,T),toT=ang(A,T);
 if(A.root>0&&A.guardBreak<=0)A.root=Math.min(A.root,.22);
 A.slow=Math.min(A.slow,.6);
 if(!R.intro){R.intro=true;toast(R.def.name.toUpperCase()+' · '+R.def.title);float(A.x,A.y-80,R.def.name.toUpperCase(),'#e6baff')}
 if(R.act){
  R.act.t+=dt;
  if(ACT[R.act.id](dt,A,R,T,R.act)){
   const was=R.act.id;R.act=null;R.pose=null;R.glow=0;
   R.rest=(R.p2?.25:.5)+Math.random()*(R.p2?.25:.45)+(was==='s5'||was==='s1'?.2:0);
  }
  return;
 }
 if(A.root>0||A.guardBreak>0||R.exh>0||A.dodgeTime>0){setGuard(A,false);return}
 const speed=118*(R.asc>0?1.3:1)*(R.p2?1.08:1)*(A.slow>0?.6:1);
 // defesa
 if(A.guard){
  R.guardT-=dt;A.a=aim(A);R.face=A.a;
  if(R.guardT<=0||A.st<10){setGuard(A,false);R.guardCD=2.0}
  return;
 }
 const threat=T.cast>0||T.rwCast||T.punchTime>0||(T.guard===false&&T.basic>0);
 // esquiva (passo relâmpago)
 if(R.dodgeCD<=0&&threat&&d<300&&Math.random()<dt*1.1){
  const side=Math.random()<.5?1:-1,a=toT+side*Math.PI/2;
  A.dodgeTime=.2;A.dodgeA=a;A.inv=Math.max(A.inv,.22);R.dodgeCD=3.2;R.face=toT;return;
 }
 // guarda
 if(R.guardCD<=0&&threat&&d<130&&A.st>35&&Math.random()<dt*2){
  if(setGuard(A,true)){R.guardT=.5+Math.random()*.6;return}
 }
 // decisão de ataque
 if(R.rest<=0){
  const forced=R.pride>=100&&cdReady(R,'s4');
  if(forced){startAct(R,'s4',{});return}
  const opts=[];
  if(cdReady(R,'s5')&&d>160)opts.push(['s5',3]);
  if(cdReady(R,'s0')&&d>120)opts.push(['s0',3]);
  if(cdReady(R,'s1')&&d>110&&d<520)opts.push(['s1',3]);
  if(cdReady(R,'s3'))opts.push(['s3',2.4]);
  if(cdReady(R,'s2')&&d<240)opts.push(['s2',3.6]);
  if(d<96+T.r)opts.push(['basic',4.5]);
  if(opts.length){
   let sum=opts.reduce((s,o)=>s+o[1],0),r=Math.random()*sum,pick=opts[0][0];
   for(const[id,w]of opts){r-=w;if(r<=0){pick=id;break}}
   const cd={s0:7,s1:8.5,s2:11,s3:12,s5:19}[pick];
   if(cd)R.cds[pick]=cd;
   if(pick==='basic')R.cds.basicLast=0;
   startAct(R,pick,{});return;
  }
 }
 // movimento: aproxima, mantém distância média e circula
 R.strafeT-=dt;if(R.strafeT<=0){R.strafe=Math.random()<.5?1:-1;R.strafeT=1.5+Math.random()*2}
 A.a=toT;R.face=toT;
 if(d>250)bossMove(A,R,toT,speed,dt);
 else if(d<95+T.r&&R.rest>0)bossMove(A,R,toT+Math.PI,speed*.7,dt);
 else if(d>130)bossMove(A,R,toT+R.strafe*(Math.PI/2.6),speed*.8,dt);
 else if(R.rest<=0.15&&d>=95+T.r)bossMove(A,R,toT,speed,dt);
}
const prevGuardianAI=guardianAI;
guardianAI=function(dt,a){if(a.hunt)huntAI(dt,a);else prevGuardianAI(dt,a)};

/* ============================== passo da arena ============================== */
const prevStepMode=stepArenaMode;
stepArenaMode=function(dt){
 const R=hunt();if(!R)return prevStepMode(dt);
 const A=R.a;modeRun.elapsed+=dt;
 // recargas
 const cdRate=(R.asc>0?1.35:1)*(R.p2?1.15:1);
 for(const k of Object.keys(R.cds))if(R.cds[k]>0)R.cds[k]-=dt*cdRate;
 R.rest=Math.max(-1,R.rest-dt);R.guardCD-=dt;R.dodgeCD-=dt;
 R.glow=Math.max(0,R.glow-dt*2.2);
 if(A.hp>0){
  // Orgulho decai devagar
  if(R.asc<=0&&R.exh<=0)R.pride=Math.max(0,R.pride-.8*dt);
  // Ascensão e Exaustão
  if(R.asc>0){R.asc-=dt;R.pride=0;if(R.asc<=0){R.asc=0;R.exh=3;R.act=null;R.pose=null;float(A.x,A.y-80,'EXAUSTO!','#ffd0ee');toast('Kaelthar está exausto — ataque agora!');ring(A.x,A.y,70,'#ffd0ee',.5)}}
  else if(R.exh>0){R.exh=Math.max(0,R.exh-dt)}
  // Fase 2
  if(!R.p2&&A.hp<A.max*.5){
   R.p2=true;R.tele=[];R.beam=null;R.cannon=null;setGuard(A,false);startAct(R,'s4',{});R.act.fury=true;
   float(A.x,A.y-95,'FÚRIA','#ff9ac4');toast('O Príncipe se enfurece! Fase 2');
  }
 }
 // telegraphs
 for(const t of R.tele){t.t+=dt;if(t.follow){t.x=t.follow.x;t.y=t.follow.y}}
 const done=R.tele.filter(t=>t.t>=t.dur);R.tele=R.tele.filter(t=>t.t<t.dur);for(const t of done)t.onDone?.(t);
 // esferas
 for(const o of R.orbs){
  o.t+=dt;o.life-=dt;const steps=Math.ceil(Math.hypot(o.vx,o.vy)*dt/8)||1;
  for(let i=0;i<steps&&o.life>0;i++){
   o.x+=o.vx*dt/steps;o.y+=o.vy*dt/steps;
   if(blocked(o.x,o.y,o.r*.4)){o.life=0;spark(o.x,o.y,VI,6);break}
   for(const t of foes(A))if(dist(t,o)<t.r+o.r&&t.inv<=0){bossHit(t,o.dmg,14,Math.atan2(o.vy,o.vx),{pride:3});o.life=0;spark(o.x,o.y,PK,8);break}
  }
 }
 R.orbs=R.orbs.filter(o=>o.life>0);
 if(R.beam){R.beam.t+=dt;if(R.beam.t>=R.beam.dur)R.beam=null}
 for(const g of R.ghosts)g.life-=dt;R.ghosts=R.ghosts.filter(g=>g.life>0);
 // aliado bot desvia dos avisos
 for(const ally of actors)if(ally.team===0&&ally!==p&&ally.hp>0&&ally.root<=0){
  for(const t of R.tele){
   if(t.kind==='line'){const e={x:t.x+Math.cos(t.a)*t.len,y:t.y+Math.sin(t.a)*t.len};if(lineDistance(ally.x,ally.y,t.x,t.y,e.x,e.y)<t.w/2+30){const n=t.a+Math.PI/2*(Math.sin(ally.y-t.y)>0?1:-1);move(ally,Math.cos(n)*170*dt,Math.sin(n)*170*dt)}}
   else{const d=dist(ally,t);if(d<t.r+30&&d>(t.r0||0)-20){const n=Math.atan2(ally.y-t.y,ally.x-t.x);move(ally,Math.cos(n)*170*dt,Math.sin(n)*170*dt)}}
  }
 }
 // fim
 if(A.hp<=0){
  if(!R.dying){R.dying=.001;R.tele=[];R.orbs=[];R.beam=null;R.cannon=null;R.act=null;setGuard(A,false);
   ring(A.x,A.y,160,'#ffffff',.8);ring(A.x,A.y,100,PK,.7);spark(A.x,A.y,'#e6baff',40);combatImpact(2);toast(R.def.name+' foi derrotado!')}
  R.dying+=dt;if(R.dying>2.1)endArenaMode(true);
  return;
 }
 if(!actors.some(a=>a.team===0&&a.hp>0)||time<=0)endArenaMode(false);
};

/* dano recebido pelo chefe: Orgulho, Exaustão, Ascensão e resistência a empurrões */
const prevHit=hit;
hit=function(t,n,owner,knock=0,angle=0,id){
 const R=t?.huntBoss&&hunt();
 if(!R)return prevHit(t,n,owner,knock,angle,id);
 if(R.exh>0)n*=1.35;else if(R.asc>0)n*=.88;
 if(R.act&&R.act.id==='s4'&&t.inv>0)return false;
 const before=t.hp,ok=prevHit(t,n,owner,knock*.25,angle,id);
 if(ok&&R.asc<=0&&R.exh<=0)R.pride=Math.min(100,R.pride+Math.min(9,(before-t.hp)*.055+1));
 return ok;
};

/* ============================== desenho ============================== */
function poseOf(a,R){
 if(a.hp<=0)return{name:'dead',i:0};
 if(R.exh>0||a.guardBreak>0)return{name:'tired',i:Math.floor(clock*3)%2};
 if(a.dodgeTime>0)return{name:'dodge',i:0};
 if(R.act&&R.pose)return R.pose;
 if(a.hitReact>0)return{name:'hit',i:a.hitReact>.08?0:1};
 if(a.guard)return{name:'guard',i:a.blockFlash>0?1:0};
 if(a.moving)return{name:'walk',i:Math.floor(R.walk)%6};
 return{name:'idle',i:Math.floor(clock*4)%4};
}
function drawAura(R,A,strength){
 if(strength<=.02)return;
 ctx.save();ctx.globalCompositeOperation='lighter';
 const g=ctx.createRadialGradient(0,-26,4,0,-26,70);g.addColorStop(0,`rgba(255,98,168,${.5*strength})`);g.addColorStop(.55,`rgba(192,75,255,${.3*strength})`);g.addColorStop(1,'rgba(192,75,255,0)');
 ctx.fillStyle=g;ctx.fillRect(-80,-100,160,140);
 for(let i=0;i<12;i++){
  const k=(clock*(.8+(i%4)*.12)+i/12)%1,x=Math.sin(i*6.1+clock*2.2)*(20+k*8),y=8-k*86,s=Math.max(2,Math.round(7*(1-k)));
  ctx.globalAlpha=(1-k)*Math.min(1,strength+.2);ctx.fillStyle=i%3?VI:'#ff62a8';ctx.fillRect(Math.round(x),Math.round(y),s,s);
 }
 ctx.restore();
}
function drawKael(a){
 const R=a.hunt,pose=poseOf(a,R);
 ctx.save();ctx.translate(a.x,a.y);
 ctx.fillStyle='#06100c99';ctx.beginPath();ctx.ellipse(0,12,27,9,0,0,TAU);ctx.fill();
 if(R.exh>0){ctx.strokeStyle='#ffd0ee';ctx.globalAlpha=.5+.4*Math.sin(clock*12);ctx.beginPath();ctx.ellipse(0,12,34,12,0,0,TAU);ctx.stroke();ctx.globalAlpha=1}
 const aura=R.asc>0?1:Math.max(R.glow,R.pride>=70?.28+(R.pride-70)/60:R.pride/400);
 drawAura(R,a,aura);
 ctx.translate(0,10);
 if(a.inv>0&&!R.act)ctx.globalAlpha=.55+Math.sin(clock*40)*.2;
 const f=a.flash>0?'brightness(2.1) saturate(.5)':R.exh>0?'saturate(.65) brightness(.92)':'';
 KaeltharSprite.paint(ctx,pose.name,pose.i,{x:0,y:0,scale:2,flip:Math.cos(R.face)<0,asc:R.asc>0||pose.name==='s4',side:pose.side||0,filter:f});
 ctx.restore();
 // barra de Orgulho sobre a cabeça
 ctx.save();ctx.translate(a.x,a.y-84);
 ctx.fillStyle='#10061be0';ctx.fillRect(-26,0,52,6);
 ctx.fillStyle=R.asc>0?'#fff':R.exh>0?'#6a6a8a':R.pride>=70?PK:VI;ctx.fillRect(-25,1,R.asc>0?Math.max(0,50*R.asc/10):50*R.pride/100,4);
 ctx.strokeStyle='#e8c787aa';ctx.lineWidth=1;ctx.strokeRect(-26.5,-.5,53,7);
 ctx.restore();
}
const prevDrawGuardian=drawGuardian;
drawGuardian=function(a){if(a.huntBoss&&a.hunt)drawKael(a);else prevDrawGuardian(a)};

function drawTele(t){
 const k=clamp(t.t/t.dur,0,1),pulse=.5+.5*Math.sin(clock*18);
 ctx.save();
 if(t.kind==='line'){
  ctx.translate(t.x,t.y);ctx.rotate(t.a);
  ctx.fillStyle=t.color+'22';ctx.fillRect(0,-t.w/2,t.len,t.w);
  ctx.fillStyle=t.color+'44';ctx.fillRect(0,-t.w/2,t.len*k,t.w);
  ctx.strokeStyle=t.color;ctx.globalAlpha=.55+.4*pulse;ctx.lineWidth=2;ctx.strokeRect(0,-t.w/2,t.len,t.w);
 }else{
  ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,TAU);
  if(t.r0)ctx.arc(t.x,t.y,t.r0,0,TAU,true);
  ctx.fillStyle=t.color+(t.kind==='meteor'?'30':'1c');ctx.fill('evenodd');
  ctx.globalAlpha=.5+.4*pulse;ctx.strokeStyle=t.color;ctx.lineWidth=3;ctx.setLineDash([10,7]);ctx.lineDashOffset=-clock*40;ctx.stroke();ctx.setLineDash([]);
  ctx.globalAlpha=.3;ctx.fillStyle=t.color;ctx.beginPath();ctx.arc(t.x,t.y,Math.max(0,t.r*k),0,TAU);if(t.r0)ctx.arc(t.x,t.y,Math.max(0,Math.min(t.r0,t.r*k)),0,TAU,true);ctx.fill('evenodd');
  if(t.kind==='meteor'){ctx.globalAlpha=.9;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(t.x-8,t.y);ctx.lineTo(t.x+8,t.y);ctx.moveTo(t.x,t.y-8);ctx.lineTo(t.x,t.y+8);ctx.stroke()}
 }
 ctx.restore();
}
const prevWorld=drawModeWorld;
drawModeWorld=function(){
 prevWorld();
 const R=hunt();if(!R)return;
 for(const t of R.tele)drawTele(t);
 const c=R.cannon;
 if(c&&R.a.hp>0){
  const A=R.a,o={x:A.x+Math.cos(c.a)*26,y:A.y-6+Math.sin(c.a)*26},e=rayEnd(o.x,o.y,c.a),w=68;
  ctx.save();ctx.translate(o.x,o.y);ctx.rotate(c.a);
  ctx.fillStyle=PK+(c.locked?'30':'1a');ctx.fillRect(0,-w/2,e.len,w);
  ctx.globalAlpha=.55+.45*Math.sin(clock*(c.locked?30:14));ctx.strokeStyle=c.locked?'#fff':PK;ctx.lineWidth=c.locked?3:2;ctx.strokeRect(0,-w/2,e.len,w);
  ctx.globalAlpha=.4;ctx.fillStyle=PK;ctx.fillRect(0,-w/2*c.k,e.len,w*c.k);
  ctx.restore();
 }
};
function paintOrb(o){
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let i=1;i<=5;i++){ctx.globalAlpha=.1*(6-i);ctx.fillStyle=VI;const s=o.r*(.8+i*.35);ctx.beginPath();ctx.arc(o.x-o.vx*.012*i,o.y-o.vy*.012*i,s*.6,0,TAU);ctx.fill()}
 ctx.globalAlpha=1;ctx.fillStyle=VI;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,TAU);ctx.fill();
 ctx.fillStyle='#ff62a8';ctx.beginPath();ctx.arc(o.x,o.y,o.r*.66,0,TAU);ctx.fill();
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(o.x,o.y,o.r*.32,0,TAU);ctx.fill();
 ctx.restore();
}
function paintBeam(B){
 const k=B.t/B.dur,fade=k>.7?1-(k-.7)/.3:1,fl=.85+Math.random()*.3;
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(B.x,B.y);ctx.rotate(B.a);
 const len=Math.hypot(B.ex-B.x,B.ey-B.y);
 for(const[m,col,al]of[[1,'#6d2a9e',.45],[.72,VI,.6],[.46,'#ff62a8',.8],[.2,'#ffffff',1]]){
  ctx.globalAlpha=al*fade;ctx.fillStyle=col;const w=B.w*m*fl;ctx.fillRect(0,-w/2,len,w);
 }
 ctx.globalAlpha=fade;ctx.fillStyle='#fff';
 for(let i=0;i<14;i++){const x=((i*83+clock*900)%len),y=Math.sin(i*3.7+clock*30)*B.w*.4;ctx.fillRect(x,y,6,3)}
 ctx.restore();
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade*.8;const g=ctx.createRadialGradient(B.ex,B.ey,2,B.ex,B.ey,B.w*.9);g.addColorStop(0,'#fff');g.addColorStop(.4,PK);g.addColorStop(1,'rgba(192,75,255,0)');ctx.fillStyle=g;ctx.fillRect(B.ex-B.w,B.ey-B.w,B.w*2,B.w*2);ctx.restore();
}
function paintMeteor(t){
 const k=t.t/t.dur;if(k<.6)return;const q=(k-.6)/.4,y=t.y-(1-q)*300,x=t.x+(1-q)*120;
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let i=0;i<7;i++){ctx.globalAlpha=.55-i*.07;ctx.fillStyle=i%2?VI:'#ff62a8';ctx.beginPath();ctx.arc(x+i*10*(120/300),y-i*10,16-i,0,TAU);ctx.fill()}
 ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,7+q*4,0,TAU);ctx.fill();ctx.restore();
}
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth(),R=hunt();
 if(!R)return list;
 for(const g of R.ghosts)list.push({kind:'kael-ghost',y:g.y-1,priority:0,paint(){ctx.save();ctx.translate(g.x,g.y+10);ctx.globalAlpha=g.life/g.max*.45;KaeltharSprite.paint(ctx,'s1',2,{scale:2,flip:Math.cos(g.face)<0,filter:'hue-rotate(40deg) brightness(1.4)'});ctx.restore()}});
 for(const o of R.orbs)list.push({kind:'kael-orb',y:o.y,priority:3,paint(){paintOrb(o)}});
 for(const t of R.tele)if(t.kind==='meteor')list.push({kind:'kael-meteor',y:99998,priority:5,paint(){paintMeteor(t)}});
 if(R.beam){const B=R.beam;list.push({kind:'kael-beam',y:99999,priority:6,paint(){paintBeam(B)}})}
 if(R.dying>0){const A=R.a,k=clamp(R.dying/2,0,1);list.push({kind:'kael-dying',y:A.y,priority:2,paint(){
  ctx.save();ctx.translate(A.x,A.y);ctx.fillStyle='#06100c99';ctx.beginPath();ctx.ellipse(0,12,27,9,0,0,TAU);ctx.fill();ctx.translate(0,10);
  ctx.globalAlpha=1-k*.85;KaeltharSprite.paint(ctx,'dead',0,{scale:2,flip:Math.cos(R.face)<0,filter:'brightness('+(1+(1-k)*1.5)+')'});ctx.restore();
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(A.x,A.y);for(let i=0;i<14;i++){const u=(k*1.4+i/14)%1;ctx.globalAlpha=(1-u)*(1-k*.6);ctx.fillStyle=i%2?VI:'#ff62a8';ctx.fillRect(Math.sin(i*4.1)*u*60,-u*90,5,5)}ctx.restore();
 }})}
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0));
};

/* ============================== HUD e resultado ============================== */
const prevUI=updateUI;
updateUI=function(){
 prevUI();
 const R=hunt();if(!R||!p)return;
 const A=R.a;
 const pt=document.querySelector('.fighterhud.enemy .arena-portrait'),bu=bust();if(pt&&pt.src!==bu)pt.src=bu;
 $('.fighterhud.enemy .title b').textContent=R.def.name.toUpperCase()+' · '+R.def.title;
 const er=$('#enemyResource');if(er)er.textContent='ORGULHO '+Math.floor(R.pride)+'/100'+(R.asc>0?' · ASCENDIDO':R.exh>0?' · EXAUSTO':'')+(R.p2?' · FÚRIA':'');
 const mb=$('#bmbar');if(mb){mb.parentElement.style.visibility='';mb.style.width=(R.asc>0?R.asc*10:R.pride)+'%';mb.style.background=R.asc>0?'#fff':R.exh>0?'#6a6a8a':'linear-gradient(90deg,#c04bff,#ff4f86)'}
 const sb=$('#bsbar');if(sb)sb.style.width=A.st+'%';
};
const prevModeHUD=modeHUD;
modeHUD=function(){
 prevModeHUD();
 const R=hunt();if(!R)return;
 const A=R.a;
 $('#modeObjective').hidden=true;
 const s=$('.mid-hud small');if(s)s.textContent='CAÇADA · FASE '+(R.p2?2:1);
};
const prevEnd=endArenaMode;
endArenaMode=function(win,draw){
 const R=hunt(),first=R&&modeRun&&!modeRun.settled;
 prevEnd(win,draw);
 if(!R||!first)return;
 const id=R.def.id;save=loadSave();
 let extra='';
 if(win){
  const sec=modeRun.elapsed;save.wins[id]=(save.wins[id]||0)+1;
  const old=save.best[id];if(!old||sec<old){save.best[id]=Math.round(sec);extra=old?' Novo recorde de tempo!':' Primeiro recorde registrado.'}
  writeSave(save);
  $('#resultTitle').textContent=R.def.name+' foi derrotado!';
  $('#resultText').textContent=`Caçada do Dia · ${R.def.name} · ${mmss(sec)}.${extra} `+$('#resultText').textContent.replace(/^[^·]*·\s*/,'');
 }else{
  writeSave(save);
  $('#resultTitle').textContent='O Príncipe prevaleceu.';
  $('#resultText').textContent=`${R.def.name} ainda tem ${Math.ceil(Math.max(0,R.a.hp))} de vida. Observe os avisos no chão, use os pilares e ataque quando ele ficar Exausto. `+$('#resultText').textContent.replace(/^[^·]*·\s*/,'');
 }
 $('#change').textContent='Trocar campeão';
};

/* ganchos de teste */
window.huntQA={get state(){return modeRun?.hunt},bossOfDay,ROSTER,lobby:openHuntLobby,force(id){const R=hunt();if(!R)return;R.act=null;R.tele=[];R.rest=0;startAct(R,id,{})},cd:ACT};
})();
