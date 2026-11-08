'use strict';
/*
 * CAÇADA DO DIA — chefe diferente a cada dia, 1 ou 2 jogadores (dupla = você + aliado bot).
 * Substitui a antiga "Caçada ao Guardião". Primeiro chefe: ZORVATH, Imperador Cristalino
 * (original, no arquétipo do tirano que luta contido e libera formas).
 * Para criar outro chefe: adicione uma definição em ROSTER (ver ZOR), um sprite e as ações em ACT.
 */
(()=>{
const KEY='eldoria.cacada.v1';
const PK='#ff4f86',VI='#b86bff';

/* ============================== chefes ============================== */
const ZOR={
 id:'zorvath',name:'Zorvath',title:'Imperador Cristalino',color:VI,
 hp:3600,hpDuo:4600,stars:5,difficulty:'Extrema',
 story:'Imperador de um império que devora mundos. Zorvath trata todo adversário como um inseto e luta contido, jurando que usa só uma fração do poder. Quando o desafio aperta, ele libera as formas — e não perdoa quem o fez chegar até lá.',
 system:['Poder Contido','Zorvath luta em 3 formas. Ao cair para 70% e 35% de vida ele se transforma, ficando mais rápido e ganhando golpes novos; cada transformação libera uma onda de choque. A forma 1 resiste mais, a final é frágil e veloz. A Supernova só vem na forma final: se você causar muito dano durante a carga, ele é interrompido e fica atordoado.'],
 tips:[
  'Forma 1 é lenta e forte de perto: mantenha distância e castigue a recuperação dela.',
  'Saia dos círculos da Pressão Psíquica: quem é preso toma o golpe seguinte.',
  'Supernova: dê muito dano de uma só vez durante a carga para interrompê-la e atordoá-lo.',
  'O Raio Perfurante não atravessa os pilares do centro.'
 ],
 skills:[
  {id:'s0',name:'Chicote de Cauda',icon:'whip',cd:5,desc:'Giro rápido que atinge tudo ao redor dele. Na forma final, vem duas vezes. Fique longe do círculo.'},
  {id:'s1',name:'Disco Cortante',icon:'disc',cd:8.5,desc:'Arremessa um disco que vai e volta, cortando nas duas passadas. Na forma final são dois discos.'},
  {id:'s2',name:'Pressão Psíquica',icon:'mind',cd:13,desc:'Marca você com um círculo; quem estiver dentro quando fecha fica preso e leva o golpe seguinte.'},
  {id:'s3',name:'Raio Perfurante',icon:'beam',cd:9,desc:'Raio fino que trava a mira e atravessa a defesa. Na forma final, dispara três vezes. Pilares bloqueiam. (Forma 2+)'},
  {id:'s4',name:'Explosão de Poder',icon:'shock',cd:15,desc:'Onda de choque que quebra a guarda. Na forma final, uma segunda onda atinge quem se afastou. (Forma 2+)'},
  {id:'s5',name:'Supernova',icon:'nova',cd:30,desc:'Carrega uma esfera gigante e a lança sobre uma área enorme. Dano alto em tudo; interrompa com muito dano. (Forma 3)'}
 ],
 basics:[
  {name:'Golpe do Imperador',icon:'punch',desc:'Combo de 3 golpes (4 na forma final), com cauda e punho. O último empurra.'},
  {name:'Guarda Soberba',icon:'guard',desc:'Bloqueia de frente. Gasta stamina e, se acabar, a guarda quebra.'},
  {name:'Piscar',icon:'step',desc:'Teleporte curto com invulnerabilidade ao ver um golpe se formando.'}
 ]
};
const ROSTER=[ZOR];

/* ============================== persistência ============================== */
function loadSave(){
 const d={team:'duo',best:{},wins:{},tries:{}};
 try{return Object.assign(d,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return d}
}
function writeSave(s){try{localStorage.setItem(KEY,JSON.stringify(s));return true}catch{return false}}
let save=loadSave();

function dayIndex(now=new Date()){return Math.floor((now.getTime()-now.getTimezoneOffset()*60000)/864e5)}
function dayBoss(now=new Date()){return ROSTER[dayIndex(now)%ROSTER.length]}
function bossOfDay(now=new Date()){const q=new URLSearchParams(location.search).get('boss');if(q){const f=ROSTER.find(b=>b.id===q);if(f)return f}return dayBoss(now)}
function msToMidnight(){const n=new Date(),m=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1);return m-n}
function clock3(ms){const s=Math.max(0,Math.floor(ms/1000));return[Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(v=>String(v).padStart(2,'0')).join(':')}
function mmss(sec){sec=Math.max(0,Math.round(sec));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')}

/* ============================== ícones em pixel art ============================== */
const iconCache={};
function skillIcon(kind){
 if(kind&&typeof kind==='object')return BossIcons.make(kind.shape,kind.c1,kind.c2);
 if(iconCache[kind])return iconCache[kind];
 const c=document.createElement('canvas');c.width=c.height=24;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const K=ZorvathSprite,r=K.rect;
 const L=(x0,y0,x1,y1,col)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);g.fillStyle=col;for(let i=0;i<=n;i++)g.fillRect(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),1,1)};
 const D=(x,y,rad,col)=>K.disc(g,x,y,rad,col);
 const gold='#f2ca5c',goldS='#b8912f',hot='#ff62a8',vio='#b86bff',vioD='#5a2d8a',white='#fff4ff',pearl='#efeaf6';
 const glow=(x,y,rad)=>{D(x,y,rad+1,vioD);D(x,y,rad,vio);D(x,y,Math.max(1,rad-1),hot);D(x,y,Math.max(0,rad-2),white)};
 if(kind==='whip'){g.strokeStyle=pearl;g.lineWidth=3;g.beginPath();g.arc(12,12,8,.4,5.6);g.stroke();g.strokeStyle=vio;g.lineWidth=2;g.beginPath();g.arc(12,12,8,4.6,5.6);g.stroke();D(19,6,2,hot);D(19,6,1,white)}
 else if(kind==='disc'){g.save();g.translate(12,12);g.scale(1,.5);D(0,0,9,vioD);D(0,0,7,hot);D(0,0,4,white);D(0,0,2,vioD);g.restore();L(2,6,7,9,vio);L(2,18,7,15,vio);L(17,4,21,6,gold)}
 else if(kind==='mind'){g.strokeStyle=vio;g.lineWidth=2;g.beginPath();g.arc(12,12,9,0,6.3);g.stroke();g.beginPath();g.arc(12,12,5,0,6.3);g.stroke();D(12,12,2,hot);L(1,12,5,12,hot);L(19,12,23,12,hot);L(12,1,12,5,hot);L(12,19,12,23,hot)}
 else if(kind==='beam'){r(g,1,11,3,2,pearl);for(const[h,col]of[[4,vioD],[3,vio],[2,hot],[1,white]])r(g,4,12-h/2,19,h,col);glow(21,12,2)}
 else if(kind==='shock'){for(const[rad,col]of[[10,vioD],[7,vio],[4,hot]]){g.strokeStyle=col;g.lineWidth=2;g.beginPath();g.arc(12,12,rad,0,6.3);g.stroke()}D(12,12,2,white)}
 else if(kind==='nova'){D(12,12,10,vioD);D(12,12,8,vio);D(12,12,6,hot);D(12,12,3,white);for(const[x,y]of[[3,3],[21,4],[2,20],[22,21]])r(g,x,y,2,2,gold);L(12,0,12,3,gold);L(12,21,12,24,gold);L(0,12,3,12,gold);L(21,12,24,12,gold)}
 else if(kind==='punch'){r(g,5,8,12,8,pearl);r(g,5,8,12,2,'#fff');r(g,17,9,3,6,vio);r(g,3,10,3,4,vioD);L(1,6,4,8,vio);L(1,18,4,16,vio)}
 else if(kind==='guard'){L(6,5,18,19,pearl);L(18,5,6,19,vio);r(g,5,4,4,3,pearl);r(g,15,4,4,3,vio);g.strokeStyle=hot;g.lineWidth=1;g.beginPath();g.arc(12,12,9,-1.2,1.2);g.stroke()}
 else if(kind==='step'){for(let i=0;i<3;i++){g.globalAlpha=.3+i*.3;r(g,3+i*5,6,5,12,i===2?hot:vio)}g.globalAlpha=1;L(14,12,21,12,gold);L(18,8,21,12,gold);L(18,16,21,12,gold)}
 else if(kind==='forms'){for(let i=0;i<3;i++){const x=3+i*7,h=6+i*3;D(x+2,19-h/2,2+i,i===2?hot:i?vio:vioD);r(g,x,21,5,1,gold)}L(3,7,20,4,gold)}
 return iconCache[kind]=c.toDataURL();
}
const iconImg=(kind,cls='hunt-ico')=>`<img class="${cls}" src="${skillIcon(kind)}" alt="" draggable="false">`;

/* retrato (busto) gerado a partir do sprite */
const bustCache={};
function bust(def=bossOfDay()){
 if(def.generic){if(bustCache[def.id])return bustCache[def.id];const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const bg=g.createRadialGradient(48,40,6,48,48,70);bg.addColorStop(0,def.look.aura.a+'88');bg.addColorStop(1,'#120a22');g.fillStyle=bg;g.fillRect(0,0,96,96);g.drawImage(BossSprite.frame(def.look,'idle',0),13,8,38,38,0,0,96,96);return bustCache[def.id]=c.toDataURL()}
 if(bustCache.zorvath)return bustCache.zorvath;
 const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const bg=g.createRadialGradient(48,40,6,48,48,70);bg.addColorStop(0,'#3d1f66');bg.addColorStop(1,'#120a22');g.fillStyle=bg;g.fillRect(0,0,96,96);
 g.drawImage(ZorvathSprite.frame('idle',0,{form:3}),13,6,38,38,0,0,96,96);
 bustCache.zorvath=c.toDataURL();return bustCache.zorvath;
}
/* ============================== lobby ============================== */
let lobbyDef=null,artRaf=0,timerInt=0,selectedSkill=null;
function stars(n){return '★'.repeat(n)+'☆'.repeat(5-n)}
function weekStrip(def){
 const names=['dom','seg','ter','qua','qui','sex','sáb'],now=new Date(),out=[];
 for(let i=0;i<7;i++){
  const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i),boss=i===0?def:dayBoss(d);
  out.push(`<div class="hunt-day ${i===0?'today':''}"><small>${i===0?'hoje':names[d.getDay()]}</small><b>${boss.name.split(',')[0]}</b><span>${i===0?'Disponível':'Em '+i+' dia'+(i>1?'s':'')}</span></div>`);
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
   <div class="hunt-tabs" role="tablist"><button role="tab" class="on" data-hunt-tab="a" aria-selected="true">Chefe</button><button role="tab" data-hunt-tab="s" aria-selected="false">Habilidades</button><button role="tab" data-hunt-tab="b" aria-selected="false">Dicas e semana</button></div>
   <div class="hunt-pane" data-hunt-pane="a">
   <article class="hunt-card"><span class="eyebrow">CHEFE DE HOJE</span><p>${def.story}</p>
    <div class="hunt-chips"><span>${def.generic?'2 fases':'3 formas'}</span><span>${mmss(ARENA_MODES.guardian.seconds)} de limite</span><span>◉ até ${prize} moedas</span><span>Vida ${save.team==='solo'?def.hp:def.hpDuo}</span></div></article>
   <article class="hunt-card"><span class="eyebrow">SISTEMA PRÓPRIO · ${def.system[0].toUpperCase()}</span>
    <div class="hunt-pride">${iconImg(def.systemIcon||'forms','hunt-ico big')}<div><div class="pride-demo"><i></i></div><p>${def.system[1]}</p></div></div></article>
   </div>
   <div class="hunt-pane" data-hunt-pane="s" hidden>
   <article class="hunt-card"><span class="eyebrow">${def.generic?'6 HABILIDADES':'6 HABILIDADES · AS NOVAS VÊM COM AS FORMAS'} · GOLPE, DEFESA E ESQUIVA</span><div class="hunt-skills nine">${def.skills.map(skillBtn).join('')}<i class="hunt-sep"></i>${def.basics.map(basic).join('')}</div>
    <p class="hunt-skilldesc" id="huntSkillDesc" role="status">Toque em uma habilidade para ver como ela funciona.</p></article>
   </div>
   <div class="hunt-pane" data-hunt-pane="b" hidden>
   <article class="hunt-card"><span class="eyebrow">COMO VENCER</span><ul class="hunt-tips">${def.tips.map(t=>`<li>${t}</li>`).join('')}</ul></article>
   <article class="hunt-card"><span class="eyebrow">CHEFES DA SEMANA</span><div class="hunt-week">${weekStrip(def)}</div></article>
   </div>
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
  g.save();g.translate(210,300);g.scale(1,.28);g.strokeStyle='#b86bff55';g.lineWidth=5;for(const r of[150,115,80]){g.beginPath();g.arc(0,0,r,0,6.3);g.stroke()}
  g.rotate(t*.3);g.strokeStyle='#ff62a855';g.lineWidth=4;g.beginPath();for(let i=0;i<6;i++){const a=i/6*6.283;g.lineTo(Math.cos(a)*118,Math.sin(a)*118)}g.closePath();g.stroke();g.restore();
  if(def.generic){
   const au=def.look.aura,cyc=def.cycle||[['idle',2.4],['s0',1.4],['idle',1.2],['s2',1.4],['idle',1],['s4',1.6],['s5',1.8]],total=cyc.reduce((x,c)=>x+c[1],0);
   let u=t%total,pose='idle',dur=1,lt=0;for(const[n,d]of cyc){if(u<d){pose=n;dur=d;lt=u;break}u-=d}
   const frames=BossSprite.POSES[pose].n,fi=pose==='idle'?Math.floor(t*4)%frames:Math.min(frames-1,Math.floor(lt/dur*frames)),power=pose==='idle'?.25:1;
   g.save();g.globalCompositeOperation='lighter';
   const ag=g.createRadialGradient(210,170,6,210,170,150);ag.addColorStop(0,au.b+Math.round(90*power).toString(16).padStart(2,'0'));ag.addColorStop(.5,au.a+Math.round(64*power).toString(16).padStart(2,'0'));ag.addColorStop(1,au.a+'00');g.fillStyle=ag;g.fillRect(0,0,420,340);
   for(let i=0;i<22;i++){const k=(t*(.45+(i%5)*.07)+i/22)%1,x=210+Math.sin(i*5.3+t*1.7)*(48+k*26),y=312-k*230,sz=Math.max(2,Math.round(7*(1-k)));g.globalAlpha=(1-k)*(.3+.6*power);g.fillStyle=i%3?au.a:au.b;g.fillRect(Math.round(x),Math.round(y),sz,sz)}
   g.restore();
   BossSprite.paint(g,def.look,pose,fi,{x:210,y:318,scale:6,filter:'drop-shadow(0 0 10px '+au.a+'88)'});
  }else{
  // ciclo: mostra as 3 formas e alguns golpes
  const cyc=[['idle',2.2,1],['whip',1.4,1],['idle',1,1],['power',1.3,2],['idle',1.4,2],['beam',1.5,2],['power',1.3,3],['idle',1.3,3],['nova',2.2,3]],total=cyc.reduce((s,c)=>s+c[1],0);
  let u=t%total,pose='idle',form=1,dur=1,lt=0;for(const[n,d,f]of cyc){if(u<d){pose=n;form=f;dur=d;lt=u;break}u-=d}
  const frames=ZorvathSprite.POSES[pose].n,fi=pose==='idle'?Math.floor(t*4)%frames:pose==='power'?Math.floor(t*6)%frames:Math.min(frames-1,Math.floor(lt/dur*frames));
  const power=pose==='idle'?.25:1;
  g.save();g.globalCompositeOperation='lighter';
  const ag=g.createRadialGradient(210,170,6,210,170,150);ag.addColorStop(0,'rgba(255,98,168,'+(.35*power)+')');ag.addColorStop(.5,'rgba(184,107,255,'+(.25*power)+')');ag.addColorStop(1,'rgba(184,107,255,0)');g.fillStyle=ag;g.fillRect(0,0,420,340);
  for(let i=0;i<22;i++){const k=(t*(.45+(i%5)*.07)+i/22)%1,x=210+Math.sin(i*5.3+t*1.7)*(48+k*26),y=312-k*230,s=Math.max(2,Math.round(7*(1-k)));g.globalAlpha=(1-k)*(.3+.6*power);g.fillStyle=i%3?'#b86bff':'#ff62a8';g.fillRect(Math.round(x),Math.round(y),s,s)}
  g.restore();
  if(pose==='nova'){g.save();g.globalCompositeOperation='lighter';const rr=14+lt/dur*34,ng=g.createRadialGradient(210,92,2,210,92,rr*1.5);ng.addColorStop(0,'#fff');ng.addColorStop(.4,'#ff62a8');ng.addColorStop(1,'rgba(184,107,255,0)');g.fillStyle=ng;g.fillRect(100,0,220,200);g.restore()}
  ZorvathSprite.paint(g,pose,fi,{x:210,y:318,scale:6,form,filter:'drop-shadow(0 0 10px #b86bff88)'});
  }
  artRaf=requestAnimationFrame(loop);
 };
 artRaf=requestAnimationFrame(loop);
}
document.addEventListener('click',e=>{
 const team=e.target.closest('[data-hunt-team]');
 if(team&&appScreen==='hunt'){save.team=team.dataset.huntTeam;writeSave(save);
  document.querySelectorAll('[data-hunt-team]').forEach(b=>{const on=b===team;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
  const chip=document.querySelectorAll('.hunt-chips span')[3];if(chip)chip.textContent='Vida '+(save.team==='solo'?lobbyDef.hp:lobbyDef.hpDuo);return}
 const tab=e.target.closest('[data-hunt-tab]');if(tab){for(const t of document.querySelectorAll('[data-hunt-tab]')){const on=t===tab;t.classList.toggle('on',on);t.setAttribute('aria-selected',String(on))}for(const pn of document.querySelectorAll('[data-hunt-pane]'))pn.hidden=pn.dataset.huntPane!==tab.dataset.huntTab;return}
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
let camKey='',camL=150,camR=300;
updateArenaCamera=function(){
 const R=modeRun&&(modeRun.hunt||modeRun.gb);
 if(!R||courtyardWide||cw<ch||!p||!cw)return prevCam();
 const pts=actors.filter(a=>a.hp>0&&(a===p||a===R.a));if(pts.length<2)return prevCam();
 // reserva as áreas dos controles (analógico à esquerda; habilidades e ações à direita)
 const key=cw+'x'+ch;
 if(key!==camKey){camKey=key;const st=document.querySelector('#stick'),cc=document.querySelector('.control-center');
  if(st){const r=st.getBoundingClientRect();camL=Math.max(40,r.right+10)}
  if(cc){const r=cc.getBoundingClientRect();camR=Math.max(120,cw-r.left+10)}}
 const top=window.battleTop?battleTop():(ch<520?58:88),xs=pts.map(a=>a.x),ys=pts.map(a=>a.y);
 const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 const freeW=cw-camL-camR,fit=Math.min(freeW/(x1-x0+170),(ch-top-120)/(y1-y0+170));
 scale=clamp(fit,Math.min(.7,(cw-20)/W),1.38);
 const cx=(x0+x1)/2,cy=(y0+y1)/2;
 ox=camL+freeW/2-cx*scale;oy=top+(ch-top)*.42-cy*scale;
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
 b.boss=true;b.huntBoss=true;b.team=1;b.label=def.name;b.r=26;b.max=b.hp=solo?def.hp:def.hpDuo;b.a=Math.PI;b.st=100;
 p.x=W*.16;p.y=H*.5;if(ally&&!solo){ally.x=W*.16;ally.y=H*.78;ally.label='Aliado'}
 b.x=W*.8;b.y=H*.5;
 if(def.generic){b.kit=[0,1,2,3,4,5];return}
 modeRun.hunt=b.hunt={
  def,a:b,solo,form:1,shown:1,exh:0,act:null,next:null,rest:1.6,guardT:0,guardCD:0,dodgeCD:0,strafe:1,strafeT:2,walk:0,face:Math.PI,
  cds:{s0:2,s1:4,s2:7,s3:5,s4:9,s5:14},tele:[],discs:[],beam:null,cannon:null,nova:null,ghosts:[],pose:null,dying:0,landed:0,glow:0,aggro:0,aggroT:0,intro:false
 };
 b.kit=[0,1,2,3,4,5];
};
const prevStart=start;
start=function(){
 const r=prevStart.apply(this,arguments);
 const eb=document.querySelector('#outcome .eyebrow');if(eb)eb.textContent=arenaModeId==='guardian'?'CAÇADA ENCERRADA':'DUELO ENCERRADO';
 const hh=modeRun?.hunt||modeRun?.gb;
 if(hh){$('#teamHud').hidden=hh.solo;
  const def=hh.def;
  $('#botkit').innerHTML=def.skills.map(s=>`<span title="${s.name}">${iconImg(s.icon,'hunt-mini')}</span>`).join('');
  $('#battle').dataset.arena='hunt';
 }
 return r;
};

/* ============================== utilidades de combate ============================== */
const ang=(a,t)=>Math.atan2(t.y-a.y,t.x-a.x);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const foes=A=>opponents(A);
const DMG=[1,1.1,1.2],TAKEN=[.85,1,1.12],SPEED=[100,122,152],PREF=[110,190,230];
function pickTarget(R,A){
 const list=foes(A);if(!list.length)return null;
 R.aggroT-=1/60;
 if(R.aggroT<=0||!list.includes(R.aggro)){R.aggroT=3+Math.random()*3;R.aggro=list.length>1&&Math.random()<.4?list[1]:list[0]}
 const near=list.sort((x,y)=>dist(A,x)-dist(A,y))[0];
 return dist(A,near)<110?near:R.aggro;
}
function bossHit(t,dmg,knock,angle,opt={}){
 const R=hunt(),A=R.a;if(t.hp<=0||A.hp<=0)return false;
 const n=dmg*DMG[R.form-1];
 if(opt.breakGuard&&t.guard&&t.inv<=0)breakGuard(t);
 const ok=hit(t,n,A,knock,angle,-1);
 if(ok)R.landed++;
 return ok;
}
function addTele(o){const R=hunt();R.tele.push(Object.assign({t:0,dur:1,color:PK},o))}
function rayEnd(x,y,a,max=760){let d=0,px=x,py=y;while(d<max){const nx=x+Math.cos(a)*(d+10),ny=y+Math.sin(a)*(d+10);if(blocked(nx,ny,3))break;px=nx;py=ny;d+=10}return{x:px,y:py,len:d}}
function shock(A,r,dmg,knock,r0=0,cx=A.x,cy=A.y){
 ring(cx,cy,r,PK,.55);ring(cx,cy,r*.7,VI,.45);spark(cx,cy,VI,22);combatImpact(1.7);combatSound('heavy',1.3);
 for(const t of foes(A)){const d=dist({x:cx,y:cy},t);if(d<r+t.r&&d>=r0)bossHit(t,dmg,knock,Math.atan2(t.y-cy,t.x-cx),{breakGuard:true})}
}

/* ============================== ações do chefe ============================== */
const ACT={};
// golpe básico: combo de cauda e punho
ACT.basic=(dt,A,R,T,a)=>{
 if(!a.init){a.init=1;a.N=R.form===3?4:3;a.k=0}
 const st=.2,gap=.42,dur=st+(a.N-1)*gap+.5;
 const k=Math.min(a.N-1,Math.max(0,Math.floor(a.t/gap)));
 R.pose={name:'punch',i:clamp(Math.floor(((a.t-k*gap)/gap)*6),0,5),side:k%2};
 if(!a.stop&&a.k<a.N&&a.t>=st+a.k*gap){
  const i=a.k++;A.a=ang(A,T);R.face=A.a;
  move(A,Math.cos(A.a)*14,Math.sin(A.a)*14);
  const last=i===a.N-1,reach=92+T.r;let landed=false;
  for(const t of foes(A)){
   const d=dist(A,t),diff=Math.abs(wrap(ang(A,t)-A.a));
   if(d<reach&&diff<1.0&&bossHit(t,[30,34,42,66][i],last?70:12,ang(A,t)))landed=true;
  }
  combatSound(last?'heavy':'hit',last?1.2:.9);
  if(!landed)a.stop=true;
 }
 return a.t>=(a.stop?st+a.k*gap+.25:dur);
};
// 1 · Chicote de Cauda: varre tudo ao redor
ACT.s0=(dt,A,R,T,a)=>{
 const R0=125,w=.55;
 if(!a.init){a.init=1;a.sweeps=R.form===3?2:1;a.n=0;a.at=w;addTele({kind:'circle',follow:A,r:R0,dur:w,color:PK})}
 R.pose={name:'whip',i:a.t<a.at-.35?0:a.t<a.at-.05?1:a.t<a.at+.25?2:3};
 if(a.n<a.sweeps&&a.t>=a.at){
  a.n++;ring(A.x,A.y,R0,PK,.35);spark(A.x,A.y,'#ffd0ee',14);combatImpact(1.3);combatSound('heavy',1.1);
  for(const t of foes(A))if(dist(A,t)<R0+t.r)bossHit(t,90,100,ang(A,t));
  if(a.n<a.sweeps){a.at+=.55;addTele({kind:'circle',follow:A,r:R0,dur:.5,color:PK})}
 }
 return a.n>=a.sweeps&&a.t>=a.at+.45;
};
// 2 · Disco Cortante: vai e volta
ACT.s1=(dt,A,R,T,a)=>{
 if(!a.init){a.init=1;a.ang=ang(A,T)}
 if(a.t<.5){a.ang=ang(A,T);A.a=a.ang;R.face=a.ang}
 R.pose={name:'disc',i:a.t<.25?0:a.t<.5?1:a.t<.75?2:3};R.glow=Math.max(R.glow,.5);
 if(!a.f&&a.t>=.5){a.f=1;const n=R.form===3?2:1,max=clamp(dist(A,T)+90,260,540);
  for(let i=0;i<n;i++){const q=a.ang+(n===1?0:(i?.3:-.3));
   R.discs.push({x:A.x+Math.cos(q)*26,y:A.y-6+Math.sin(q)*26,dx:Math.cos(q),dy:Math.sin(q),mode:'out',dist:0,max,r:17,hits:new Set(),age:0})}
  combatSound('hit',1)}
 return a.t>=.95;
};
// 3 · Pressão Psíquica: prende quem ficar no círculo
ACT.s2=(dt,A,R,T,a)=>{
 if(!a.init){a.init=1;a.caught=false;
  for(const f of foes(A)){const tl={kind:'psy',x:f.x,y:f.y,r:76,dur:.95,followUntil:.45,follow:f,color:'#ff62a8',target:f};
   tl.onDone=t=>{const v=t.target;if(v.hp>0&&dist(v,t)<t.r+v.r){a.caught=true;v.root=Math.max(v.root||0,1.3);bossHit(v,60,0,ang(A,v));float(v.x,v.y-50,'PRESO','#ffd0ee');ring(v.x,v.y,60,'#ff62a8',.45)}};
   R.tele.push(Object.assign({t:0},tl))}}
 R.pose={name:'psy',i:a.t<.35?0:a.t<.95?1:2};R.glow=Math.max(R.glow,.6);
 if(a.t<.95){A.a=ang(A,T);R.face=A.a}
 if(a.t>=1.05&&!a.dec){a.dec=1;if(a.caught)R.next=R.form>=2?'s3':'s0'}
 return a.t>=1.3;
};
// 4 · Raio Perfurante (forma 2+)
ACT.s3=(dt,A,R,T,a)=>{
 if(!a.init){a.init=1;a.shots=R.form===3?3:1;a.shot=0;a.sub=0;a.ang=ang(A,T);a.phase='charge'}
 a.sub+=dt;
 const ch=a.shot===0?.7:.5;
 if(a.phase==='charge'){
  if(a.sub<ch*.6)a.ang+=wrap(ang(A,T)-a.ang)*Math.min(1,dt*6);
  A.a=a.ang;R.face=a.ang;R.glow=Math.max(R.glow,.4+a.sub/ch*.5);
  R.cannon={a:a.ang,k:a.sub/ch,locked:a.sub>=ch*.6,w:30};R.pose={name:'beam',i:a.sub<ch*.5?0:1};
  if(a.sub>=ch){
   a.phase='fire';a.sub=0;a.hit=new Set();R.cannon=null;
   const o={x:A.x+Math.cos(a.ang)*24,y:A.y-4+Math.sin(a.ang)*24},e=rayEnd(o.x,o.y,a.ang);
   R.beam={x:o.x,y:o.y,ex:o.x+Math.cos(a.ang)*e.len,ey:o.y+Math.sin(a.ang)*e.len,a:a.ang,t:0,dur:.32,w:30};
   combatImpact(1.5);combatSound('crit',1.2);
  }
  return false;
 }
 if(a.phase==='fire'){
  R.pose={name:'beam',i:2};R.glow=1;const B=R.beam;
  if(B)for(const t of foes(A))if(!a.hit.has(t)&&lineDistance(t.x,t.y,B.x,B.y,B.ex,B.ey)<B.w/2+t.r*.6){a.hit.add(t);bossHit(t,150,50,a.ang,{breakGuard:true})}
  if(a.sub>=.32){R.beam=null;if(a.shot+1<a.shots){a.shot++;a.phase='charge';a.sub=0}else{a.phase='rest';a.sub=0}}
  return false;
 }
 R.pose={name:'beam',i:3};
 return a.sub>=.5;
};
// 5 · Explosão de Poder (forma 2+)
ACT.s4=(dt,A,R,T,a)=>{
 const w=.7;
 if(!a.init){a.init=1;addTele({kind:'circle',follow:A,r:210,dur:w})}
 R.pose=a.t<w?{name:'burst',i:a.t<.35?0:1}:{name:'burst',i:2};R.glow=Math.max(R.glow,a.t<w?a.t/w:1);
 if(!a.f1&&a.t>=w){a.f1=1;shock(A,210,95,110)}
 if(R.form===3){
  if(!a.t2&&a.t>=w+.1){a.t2=1;addTele({kind:'ring',x:A.x,y:A.y,r:310,r0:210,dur:.5})}
  if(!a.f2&&a.t>=w+.6){a.f2=1;shock(A,310,85,80,210)}
 }
 return a.t>=w+(R.form===3?1.1:.55);
};
// 6 · Supernova (forma 3): interrompível por dano
ACT.s5=(dt,A,R,T,a)=>{
 const ch=3.1,NR=300;
 if(!a.init){a.init=1;a.hp0=A.hp;R.nova={x:T.x,y:T.y,r:NR,k:0,locked:false,sphere:6,fall:0};toast('Supernova! Cause muito dano para interromper ou saia da área.')}
 const N=R.nova;
 if(!a.throw){
  if(a.t<ch*.65){const dx=T.x-N.x,dy=T.y-N.y,d=Math.hypot(dx,dy)||1,sp=Math.min(d,120*dt);N.x+=dx/d*sp;N.y+=dy/d*sp}
  N.locked=a.t>=ch*.65;N.k=a.t/ch;N.sphere=6+N.k*40;
  R.pose={name:'nova',i:a.t<.5?0:a.t<ch-.4?1:2};A.a=ang(A,T);R.face=A.a;R.glow=Math.max(R.glow,.5+.5*N.k);
  if(a.hp0-A.hp>=420){
   R.nova=null;R.exh=3.2;A.hp=Math.max(1,A.hp-150);
   ring(A.x,A.y,130,'#ffffff',.6);ring(A.x,A.y,80,PK,.5);spark(A.x,A.y,'#ffd0ee',30);combatImpact(2);combatSound('crit',1.4);
   for(const t of foes(A))if(dist(A,t)<130+t.r)bossHit(t,90,70,ang(A,t));
   float(A.x,A.y-85,'INTERROMPIDA!','#ffd0ee');toast('Supernova interrompida! Zorvath está atordoado — ataque!');
   return true;
  }
  if(a.t>=ch){a.throw=1;a.t2=0}
  return false;
 }
 a.t2+=dt;R.pose={name:'nova',i:3};if(N){N.sphere=46;N.fall=clamp(a.t2/.55,0,1)}
 if(!a.hit&&a.t2>=.55&&N){
  a.hit=1;
  ring(N.x,N.y,NR,'#ffffff',.9);ring(N.x,N.y,NR*.7,PK,.8);ring(N.x,N.y,NR*.4,VI,.7);spark(N.x,N.y,'#ffd0ee',46);combatImpact(2.2);combatSound('crit',1.6);
  for(const t of foes(A)){const d=dist(t,N);if(d<NR+t.r)bossHit(t,330,140,Math.atan2(t.y-N.y,t.x-N.x),{breakGuard:true})}
  R.nova=null;
 }
 return a.t2>=1.1;
};
// transformação de forma
ACT.xform=(dt,A,R,T,a)=>{
 if(!a.init){a.init=1;A.inv=Math.max(A.inv,2);addTele({kind:'circle',follow:A,r:190,dur:.9,color:VI})}
 R.pose={name:'power',i:Math.floor(a.t/.2)%4};R.glow=1;
 if(!a.sw&&a.t>=.7){a.sw=1;R.shown=R.form}
 if(!a.f&&a.t>=.9){a.f=1;shock(A,190,70,110);float(A.x,A.y-85,'FORMA '+R.form,'#ffd0ee');toast(R.def.name+' liberou a forma '+R.form+'!')}
 return a.t>=1.6;
};

/* ============================== IA do chefe ============================== */
function startAct(R,id,extra){R.act=Object.assign({id,t:0},extra);R.rest=0}
function cdReady(R,k){return R.cds[k]<=0}
function bossMove(A,R,angle,speed,dt){
 A.a=angle;R.face=angle;A.moving=true;R.walk+=dt*speed/16;
 move(A,Math.cos(angle)*speed*dt,Math.sin(angle)*speed*dt);
}
const COOL={s0:5,s1:8.5,s2:13,s3:9,s4:15,s5:30};
function huntAI(dt,A){
 const R=A.hunt;A.moving=false;
 if(R.dying||state!=='fight')return;
 const T=pickTarget(R,A);if(!T)return;
 const d=dist(A,T),toT=ang(A,T),f=R.form-1;
 if(A.root>0&&A.guardBreak<=0)A.root=Math.min(A.root,.22);
 A.slow=Math.min(A.slow,.6);
 if(!R.intro){R.intro=true;toast(R.def.name.toUpperCase()+' · '+R.def.title);float(A.x,A.y-85,R.def.name.toUpperCase(),'#e6baff')}
 if(R.act){
  R.act.t+=dt;
  if(ACT[R.act.id](dt,A,R,T,R.act)){
   const was=R.act.id;R.act=null;R.pose=null;R.glow=0;
   R.rest=[.85,.6,.35][f]+Math.random()*[.4,.3,.25][f]+(was==='s5'?.3:0);
  }
  return;
 }
 if(A.root>0||A.guardBreak>0||R.exh>0||A.dodgeTime>0){setGuard(A,false);return}
 const speed=SPEED[f]*(A.slow>0?.6:1);
 if(A.guard){
  R.guardT-=dt;A.a=aim(A);R.face=A.a;
  if(R.guardT<=0||A.st<10){setGuard(A,false);R.guardCD=2.0}
  return;
 }
 const threat=T.cast>0||T.rwCast||T.punchTime>0||(T.guard===false&&T.basic>0);
 if(R.dodgeCD<=0&&threat&&d<300&&Math.random()<dt*[.8,1.1,1.6][f]){
  const side=Math.random()<.5?1:-1,a=toT+side*Math.PI/2;
  A.dodgeTime=.2;A.dodgeA=a;A.inv=Math.max(A.inv,.22);R.dodgeCD=3.2;R.face=toT;return;
 }
 if(R.guardCD<=0&&threat&&d<130&&A.st>35&&Math.random()<dt*2){
  if(setGuard(A,true)){R.guardT=.5+Math.random()*.6;return}
 }
 if(R.rest<=0){
  if(R.next){const id=R.next;R.next=null;R.cds[id]=Math.max(R.cds[id],COOL[id]*.6);startAct(R,id,{});return}
  const opts=[];
  if(R.form===3&&cdReady(R,'s5'))opts.push(['s5',3.4]);
  if(R.form>=2&&cdReady(R,'s3')&&d>120)opts.push(['s3',3]);
  if(R.form>=2&&cdReady(R,'s4')&&d<280)opts.push(['s4',2.8]);
  if(cdReady(R,'s1')&&d>130)opts.push(['s1',3]);
  if(cdReady(R,'s2'))opts.push(['s2',2.4]);
  if(cdReady(R,'s0')&&d<170)opts.push(['s0',4]);
  if(d<96+T.r)opts.push(['basic',4.5]);
  if(opts.length){
   let sum=opts.reduce((s,o)=>s+o[1],0),r=Math.random()*sum,pick=opts[0][0];
   for(const[id,w]of opts){r-=w;if(r<=0){pick=id;break}}
   if(COOL[pick])R.cds[pick]=COOL[pick];
   startAct(R,pick,{});return;
  }
 }
 R.strafeT-=dt;if(R.strafeT<=0){R.strafe=Math.random()<.5?1:-1;R.strafeT=1.4+Math.random()*2}
 A.a=toT;R.face=toT;
 const pref=PREF[f];
 if(d>pref+70)bossMove(A,R,toT,speed,dt);
 else if(d<pref-60&&R.rest>0)bossMove(A,R,toT+Math.PI,speed*.75,dt);
 else if(d>pref-20)bossMove(A,R,toT+R.strafe*(Math.PI/2.7),speed*.8,dt);
 else if(R.rest<=.15)bossMove(A,R,toT,speed*.8,dt);
}
const prevGuardianAI=guardianAI;
guardianAI=function(dt,a){if(a.hunt)huntAI(dt,a);else prevGuardianAI(dt,a)};

/* ============================== passo da arena ============================== */
const prevStepMode=stepArenaMode;
stepArenaMode=function(dt){
 const R=hunt();if(!R)return prevStepMode(dt);
 const A=R.a;modeRun.elapsed+=dt;
 const rate=[1,1.15,1.35][R.form-1];
 for(const k of Object.keys(R.cds))if(R.cds[k]>0)R.cds[k]-=dt*rate;
 R.rest=Math.max(-1,R.rest-dt);R.guardCD-=dt;R.dodgeCD-=dt;
 R.glow=Math.max(0,R.glow-dt*2.2);
 if(A.hp>0){
  if(R.exh>0)R.exh=Math.max(0,R.exh-dt);
  // transformações
  const need=A.hp<A.max*.35?3:A.hp<A.max*.7?2:1;
  if(need>R.form&&!(R.act&&R.act.id==='xform')){
   R.form++;R.tele=[];R.beam=null;R.cannon=null;R.nova=null;R.discs=[];R.exh=0;setGuard(A,false);
   for(const k of['s0','s1','s2'])R.cds[k]=Math.min(R.cds[k],2.5);
   startAct(R,'xform',{});
  }
 }
 // avisos
 for(const t of R.tele){t.t+=dt;if(t.follow&&(!t.followUntil||t.t<t.followUntil)){t.x=t.follow.x;t.y=t.follow.y}}
 const done=R.tele.filter(t=>t.t>=t.dur);R.tele=R.tele.filter(t=>t.t<t.dur);for(const t of done)t.onDone?.(t);
 // discos
 for(const d of R.discs){
  d.age+=dt;
  if(d.mode==='out'){
   const sp=430*dt;d.x+=d.dx*sp;d.y+=d.dy*sp;d.dist+=sp;
   if(d.dist>=d.max||blocked(d.x,d.y,6)){d.mode='back';d.hits.clear();spark(d.x,d.y,PK,6)}
  }else{
   const dx=A.x-d.x,dy=A.y-d.y,l=Math.hypot(dx,dy)||1;d.x+=dx/l*560*dt;d.y+=dy/l*560*dt;
   if(l<30||d.age>7)d.dead=true;
  }
  for(const t of foes(A))if(!d.hits.has(t)&&dist(t,d)<t.r+d.r){d.hits.add(t);bossHit(t,85,25,Math.atan2(d.dy,d.dx))}
 }
 R.discs=R.discs.filter(d=>!d.dead);
 if(R.beam){R.beam.t+=dt;if(R.beam.t>=R.beam.dur)R.beam=null}
 for(const g of R.ghosts)g.life-=dt;R.ghosts=R.ghosts.filter(g=>g.life>0);
 if(A.dodgeTime>0)R.ghosts.push({x:A.x,y:A.y,face:R.face,life:.2,max:.2,form:R.shown});
 // aliado bot desvia dos avisos
 for(const ally of actors)if(ally.team===0&&ally!==p&&ally.hp>0&&ally.root<=0){
  for(const t of R.tele){
   if(t.kind==='line')continue;
   const d=dist(ally,t);if(d<t.r+30&&d>(t.r0||0)-20){const n=Math.atan2(ally.y-t.y,ally.x-t.x);move(ally,Math.cos(n)*170*dt,Math.sin(n)*170*dt)}
  }
  const N=R.nova;if(N){const d=dist(ally,N);if(d<N.r+20){const n=Math.atan2(ally.y-N.y,ally.x-N.x);move(ally,Math.cos(n)*190*dt,Math.sin(n)*190*dt)}}
 }
 // fim
 if(A.hp<=0){
  if(!R.dying){R.dying=.001;R.tele=[];R.discs=[];R.beam=null;R.cannon=null;R.nova=null;R.act=null;setGuard(A,false);
   ring(A.x,A.y,160,'#ffffff',.8);ring(A.x,A.y,100,PK,.7);spark(A.x,A.y,'#e6baff',40);combatImpact(2);toast(R.def.name+' foi derrotado!')}
  R.dying+=dt;if(R.dying>2.1)endArenaMode(true);
  return;
 }
 if(!actors.some(a=>a.team===0&&a.hp>0)||time<=0)endArenaMode(false);
};

/* dano recebido pelo chefe: resistência por forma e atordoamento */
const prevHit=hit;
hit=function(t,n,owner,knock=0,angle=0,id){
 const R=t?.huntBoss&&hunt();
 if(!R)return prevHit(t,n,owner,knock,angle,id);
 n*=TAKEN[R.form-1]*(R.exh>0?1.35:1);
 if(R.act&&R.act.id==='xform'&&t.inv>0)return false;
 return prevHit(t,n,owner,knock*.25,angle,id);
};

/* ============================== desenho ============================== */
function poseOf(a,R){
 if(a.hp<=0)return{name:'dead',i:0};
 if(R.exh>0||a.guardBreak>0)return{name:'stun',i:Math.floor(clock*3)%2};
 if(a.dodgeTime>0)return{name:'dodge',i:0};
 if(R.act&&R.pose)return R.pose;
 if(a.hitReact>0)return{name:'hit',i:a.hitReact>.08?0:1};
 if(a.guard)return{name:'guard',i:a.blockFlash>0?1:0};
 if(a.moving)return{name:'glide',i:Math.floor(R.walk)%4};
 return{name:'idle',i:Math.floor(clock*3)%4};
}
function drawAura(strength,form){
 if(strength<=.02)return;
 ctx.save();ctx.globalCompositeOperation='lighter';
 const g=ctx.createRadialGradient(0,-24,4,0,-24,66);g.addColorStop(0,`rgba(255,98,168,${.45*strength})`);g.addColorStop(.55,`rgba(184,107,255,${.3*strength})`);g.addColorStop(1,'rgba(184,107,255,0)');
 ctx.fillStyle=g;ctx.fillRect(-80,-100,160,140);
 for(let i=0;i<10+form*2;i++){
  const k=(clock*(.8+(i%4)*.12)+i/12)%1,x=Math.sin(i*6.1+clock*2.2)*(18+k*8),y=8-k*80,s=Math.max(2,Math.round(6*(1-k)));
  ctx.globalAlpha=(1-k)*Math.min(1,strength+.2);ctx.fillStyle=i%3?VI:'#ff62a8';ctx.fillRect(Math.round(x),Math.round(y),s,s);
 }
 ctx.restore();
}
function drawZor(a){
 const R=a.hunt,pose=poseOf(a,R);
 ctx.save();ctx.translate(a.x,a.y);
 ctx.fillStyle='#06100c99';ctx.beginPath();ctx.ellipse(0,12,26,9,0,0,TAU);ctx.fill();
 if(R.exh>0){ctx.strokeStyle='#ffd0ee';ctx.globalAlpha=.5+.4*Math.sin(clock*12);ctx.beginPath();ctx.ellipse(0,12,34,12,0,0,TAU);ctx.stroke();ctx.globalAlpha=1}
 drawAura(Math.max(R.glow,R.shown===3?.22:R.shown===2?.12:0),R.shown);
 ctx.translate(0,10);
 if(a.inv>0&&!R.act)ctx.globalAlpha=.55+Math.sin(clock*40)*.2;
 const f=a.flash>0?'brightness(2.1) saturate(.5)':R.exh>0?'saturate(.65) brightness(.92)':'';
 ZorvathSprite.paint(ctx,pose.name,pose.i,{x:0,y:0,scale:2.3,flip:Math.cos(R.face)<0,form:R.shown,side:pose.side||0,filter:f});
 ctx.restore();
 // marcadores de forma sobre a cabeça
 ctx.save();ctx.translate(a.x,a.y-92);
 for(let i=0;i<3;i++){ctx.fillStyle=i<R.form?(R.exh>0?'#6a6a8a':i===2?PK:VI):'#10061b';ctx.fillRect(-14+i*10,0,8,5);ctx.strokeStyle='#e8c787aa';ctx.lineWidth=1;ctx.strokeRect(-14.5+i*10,-.5,9,6)}
 ctx.restore();
}
const prevDrawGuardian=drawGuardian;
drawGuardian=function(a){if(a.huntBoss&&a.hunt)drawZor(a);else prevDrawGuardian(a)};

function drawTele(t){
 const k=clamp(t.t/t.dur,0,1),pulse=.5+.5*Math.sin(clock*18);
 ctx.save();
 ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,TAU);
 if(t.r0)ctx.arc(t.x,t.y,t.r0,0,TAU,true);
 ctx.fillStyle=t.color+(t.kind==='psy'?'26':'1c');ctx.fill('evenodd');
 ctx.globalAlpha=.5+.4*pulse;ctx.strokeStyle=t.color;ctx.lineWidth=3;ctx.setLineDash([10,7]);ctx.lineDashOffset=-clock*40;ctx.stroke();ctx.setLineDash([]);
 ctx.globalAlpha=.3;ctx.fillStyle=t.color;ctx.beginPath();ctx.arc(t.x,t.y,Math.max(0,t.r*k),0,TAU);if(t.r0)ctx.arc(t.x,t.y,Math.max(0,Math.min(t.r0,t.r*k)),0,TAU,true);ctx.fill('evenodd');
 if(t.kind==='psy'){ctx.globalAlpha=.9;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(t.x-t.r*.35,t.y);ctx.lineTo(t.x+t.r*.35,t.y);ctx.moveTo(t.x,t.y-t.r*.35);ctx.lineTo(t.x,t.y+t.r*.35);ctx.stroke();ctx.beginPath();ctx.arc(t.x,t.y,t.r*.5*(1-k*.5),0,TAU);ctx.stroke()}
 ctx.restore();
}
const prevWorld=drawModeWorld;
drawModeWorld=function(){
 prevWorld();
 const R=hunt();if(!R)return;
 for(const t of R.tele)drawTele(t);
 const N=R.nova;
 if(N){
  ctx.save();ctx.beginPath();ctx.arc(N.x,N.y,N.r,0,TAU);ctx.fillStyle=PK+(N.locked?'2a':'16');ctx.fill();
  ctx.globalAlpha=.55+.45*Math.sin(clock*(N.locked?26:12));ctx.strokeStyle=N.locked?'#fff':PK;ctx.lineWidth=N.locked?4:3;ctx.setLineDash([14,8]);ctx.lineDashOffset=-clock*60;ctx.stroke();ctx.setLineDash([]);
  ctx.globalAlpha=.28;ctx.fillStyle=PK;ctx.beginPath();ctx.arc(N.x,N.y,N.r*N.k,0,TAU);ctx.fill();ctx.restore();
 }
 const c=R.cannon;
 if(c&&R.a.hp>0){
  const A=R.a,o={x:A.x+Math.cos(c.a)*24,y:A.y-4+Math.sin(c.a)*24},e=rayEnd(o.x,o.y,c.a),w=c.w;
  ctx.save();ctx.translate(o.x,o.y);ctx.rotate(c.a);
  ctx.fillStyle=PK+(c.locked?'40':'22');ctx.fillRect(0,-w/2,e.len,w);
  ctx.globalAlpha=.6+.4*Math.sin(clock*(c.locked?32:14));ctx.strokeStyle=c.locked?'#fff':PK;ctx.lineWidth=c.locked?3:2;ctx.strokeRect(0,-w/2,e.len,w);
  ctx.restore();
 }
};
function paintDisc(d){
 ctx.save();ctx.translate(d.x,d.y);ctx.globalCompositeOperation='lighter';
 ctx.rotate(clock*18);ctx.scale(1,.42);
 for(const[rr,col,al]of[[d.r+7,VI,.35],[d.r+2,'#ff62a8',.9],[d.r-4,'#ffffff',1]]){ctx.globalAlpha=al;ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,rr,0,TAU);ctx.fill()}
 ctx.restore();
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.25;ctx.fillStyle=PK;ctx.beginPath();ctx.arc(d.x-d.dx*10,d.y-d.dy*10,d.r*.8,0,TAU);ctx.fill();ctx.restore();
}
function paintBeam(B){
 const k=B.t/B.dur,fade=k>.6?1-(k-.6)/.4:1,fl=.85+Math.random()*.3;
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(B.x,B.y);ctx.rotate(B.a);
 const len=Math.hypot(B.ex-B.x,B.ey-B.y);
 for(const[m,col,al]of[[1,'#5a2d8a',.5],[.66,VI,.7],[.4,'#ff62a8',.9],[.18,'#ffffff',1]]){
  ctx.globalAlpha=al*fade;ctx.fillStyle=col;const w=B.w*m*fl;ctx.fillRect(0,-w/2,len,w);
 }
 ctx.restore();
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade*.8;const g=ctx.createRadialGradient(B.ex,B.ey,2,B.ex,B.ey,B.w*.9);g.addColorStop(0,'#fff');g.addColorStop(.4,PK);g.addColorStop(1,'rgba(184,107,255,0)');ctx.fillStyle=g;ctx.fillRect(B.ex-B.w,B.ey-B.w,B.w*2,B.w*2);ctx.restore();
}
function paintNova(R){
 const N=R.nova,A=R.a;if(!N)return;
 const sx=A.x,sy=A.y-78,x=sx+(N.x-sx)*N.fall,y=sy+(N.y-sy)*N.fall,rr=N.sphere*(1+.04*Math.sin(clock*30));
 ctx.save();ctx.globalCompositeOperation='lighter';
 const g=ctx.createRadialGradient(x,y,2,x,y,rr*1.7);g.addColorStop(0,'#fff');g.addColorStop(.3,'#ff9ac4');g.addColorStop(.6,'#b86bff');g.addColorStop(1,'rgba(90,45,138,0)');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,rr*1.7,0,TAU);ctx.fill();
 ctx.globalAlpha=.9;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,rr*.45,0,TAU);ctx.fill();
 for(let i=0;i<10;i++){const q=clock*3+i*.63,rad=rr*(1.1+.4*Math.sin(clock*5+i));ctx.globalAlpha=.7;ctx.fillStyle=i%2?VI:'#ff62a8';ctx.fillRect(x+Math.cos(q)*rad-2,y+Math.sin(q)*rad-2,4,4)}
 ctx.restore();
}
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth(),R=hunt();
 if(!R)return list;
 for(const g of R.ghosts)list.push({kind:'zor-ghost',y:g.y-1,priority:0,paint(){ctx.save();ctx.translate(g.x,g.y+10);ctx.globalAlpha=g.life/g.max*.5;ZorvathSprite.paint(ctx,'dodge',0,{scale:2.3,flip:Math.cos(g.face)<0,form:g.form,filter:'hue-rotate(50deg) brightness(1.5)'});ctx.restore()}});
 for(const d of R.discs)list.push({kind:'zor-disc',y:d.y,priority:3,paint(){paintDisc(d)}});
 if(R.nova)list.push({kind:'zor-nova',y:99997,priority:5,paint(){paintNova(R)}});
 if(R.beam){const B=R.beam;list.push({kind:'zor-beam',y:99999,priority:6,paint(){paintBeam(B)}})}
 if(R.dying>0){const A=R.a,k=clamp(R.dying/2,0,1);list.push({kind:'zor-dying',y:A.y,priority:2,paint(){
  ctx.save();ctx.translate(A.x,A.y);ctx.fillStyle='#06100c99';ctx.beginPath();ctx.ellipse(0,12,26,9,0,0,TAU);ctx.fill();ctx.translate(0,10);
  ctx.globalAlpha=1-k*.85;ZorvathSprite.paint(ctx,'dead',0,{scale:2.3,flip:Math.cos(R.face)<0,form:R.shown,filter:'brightness('+(1+(1-k)*1.5)+')'});ctx.restore();
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
 const er=$('#enemyResource');if(er)er.textContent='FORMA '+R.form+'/3'+(R.exh>0?' · ATORDOADO':R.act&&R.act.id==='s5'?' · SUPERNOVA':'');
 const mb=$('#bmbar');if(mb){mb.parentElement.style.visibility='';mb.style.width=(R.form/3*100)+'%';mb.style.background=R.exh>0?'#6a6a8a':'linear-gradient(90deg,#b86bff,#ff4f86)'}
 const sb=$('#bsbar');if(sb)sb.style.width=A.st+'%';
};
const prevModeHUD=modeHUD;
modeHUD=function(){
 prevModeHUD();
 const R=hunt();if(!R)return;
 $('#modeObjective').hidden=true;
 const s=$('.mid-hud small');if(s)s.textContent='CAÇADA · FORMA '+R.form;
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
  $('#resultTitle').textContent='O Imperador prevaleceu.';
  $('#resultText').textContent=`${R.def.name} chegou à forma ${R.form} e ainda tem ${Math.ceil(Math.max(0,R.a.hp))} de vida. Saia dos círculos, use os pilares e interrompa a Supernova com muito dano. `+$('#resultText').textContent.replace(/^[^·]*·\s*/,'');
 }
 $('#change').textContent='Trocar campeão';
};

/* ============================== cartão da Caçada na tela inicial ============================== */
let homeRaf=0,homeTimer=0;
function startHomeArt(){
 cancelAnimationFrame(homeRaf);clearInterval(homeTimer);
 const hd=bossOfDay();
 const alive=()=>document.getElementById('huntHomeArt')&&appScreen==='home'&&!document.hidden;
 homeTimer=setInterval(()=>{const el=document.getElementById('huntHomeTimer');if(!el){clearInterval(homeTimer);return}el.textContent=clock3(msToMidnight())},1000);
 let last=0;
 const loop=now=>{
  const cv=document.getElementById('huntHomeArt');if(!cv){homeRaf=0;return}
  if(alive()&&now-last>48){
   last=now;const g=cv.getContext('2d'),t=now/1000;g.imageSmoothingEnabled=false;g.clearRect(0,0,200,200);
   g.save();g.globalCompositeOperation='lighter';
   const ag=g.createRadialGradient(100,100,6,100,100,95);ag.addColorStop(0,'rgba(255,98,168,.3)');ag.addColorStop(.6,'rgba(184,107,255,.2)');ag.addColorStop(1,'rgba(184,107,255,0)');g.fillStyle=ag;g.fillRect(0,0,200,200);
   for(let i=0;i<10;i++){const k=(t*(.4+(i%4)*.08)+i/10)%1,x=100+Math.sin(i*5.3+t*1.6)*(26+k*14),y=176-k*140,sz=Math.max(2,Math.round(5*(1-k)));g.globalAlpha=(1-k)*.8;g.fillStyle=i%3?'#b86bff':'#ff62a8';g.fillRect(Math.round(x),Math.round(y),sz,sz)}
   g.restore();
   if(hd.generic)BossSprite.paint(g,hd.look,'idle',Math.floor(t*3)%4,{x:100,y:176,scale:2.7});else ZorvathSprite.paint(g,'idle',Math.floor(t*3)%4,{x:100,y:176,scale:2.7,form:3});
  }
  homeRaf=requestAnimationFrame(loop);
 };
 homeRaf=requestAnimationFrame(loop);
}
const prevHome=renderLobbyHome;
renderLobbyHome=function(){
 prevHome.apply(this,arguments);
 const ex=document.querySelector('.royal-explore');if(!ex)return;
 const def=bossOfDay(),sv=loadSave(),rec=sv.best[def.id],wins=sv.wins[def.id]||0;
 const card=document.createElement('section');card.className='royal-panel hunt-home';card.setAttribute('aria-label','Caçada do Dia');
 card.innerHTML=`<canvas class="hunt-home-art" id="huntHomeArt" width="200" height="200" aria-hidden="true"></canvas><div class="hunt-home-copy"><span class="royal-eyebrow">CAÇADA DO DIA</span><h2>${def.name.split(',')[0]}</h2><small class="hunt-home-title">${def.title}</small><div class="hunt-home-meta"><span>⏳ Troca em <b id="huntHomeTimer">${clock3(msToMidnight())}</b></span><span>${rec?'Melhor tempo '+mmss(rec):'Ainda sem recorde'}${wins?' · '+wins+' vitória'+(wins>1?'s':''):''}</span></div><button class="royal-small-gold" data-hunt-home>⚔ Caçar ↗</button></div>`;
 ex.replaceWith(card);
 if(account.journey&&account.journey.claimed){
  const j=document.querySelector('#journeyHome');if(j)j.hidden=true;
  document.querySelector('.royal-bottom')?.classList.add('single');
 }
 startHomeArt();
};
document.addEventListener('click',e=>{if(e.target.closest('[data-hunt-home]'))beginArenaMode('guardian')});

window.HuntAPI={ROSTER,register(d){d.generic=true;ROSTER.push(d)},bossOfDay,dayBoss,loadSave,writeSave,mmss,clock3,iconImg,bust,skillIcon};
/* ganchos de teste */
window.huntQA={get state(){return modeRun?.hunt||modeRun?.gb},bossOfDay,ROSTER,lobby:openHuntLobby,force(id){const R=hunt();if(!R)return;R.act=null;R.tele=[];R.nova=null;R.cannon=null;R.rest=0;startAct(R,id,{})},ACT};
})();
