'use strict';
/*
 * Cruzada Arcade — fase de rolagem horizontal, no estilo dos fliperamas antigos (beat 'em up).
 *  - O jogador anda para a direita; a cada ponto a tela trava e uma onda de monstros do MESMO universo do chefe aparece.
 *  - Depois de cada onda vem "AVANTE ▶"; há comida no caminho (maçã, carne, banquete) para recuperar vida.
 *  - No fim, o chefe da fase (só a 1ª forma/fase, dano reduzido: nível médio).
 *  - Solo ou dupla (aliado bot). Regra oculta: em dupla, monstros e chefe têm o dobro de vida.
 * Os monstros são atores comuns do jogo (equipe 1); só a IA e o desenho são próprios (a.mob).
 * O chefe usa os motores da Caçada (HuntAPI.makeHunt / makeGB), criados no momento certo.
 */
(function(){
const KEY='eldoria.arcade.v1';
const WORLD_W=4400,WORLD_H=700,GROUND=189/700;     // o cenário (prédios, céu) acaba em y=189; abaixo é chão até o fim da tela (mundo mais alto para cobrir abaixo da faixa de luta)
const BAND_TOP=214,BAND_BOT=350;                  // faixa onde os personagens andam (mais alta que o chão todo: o analógico e as skills ficam abaixo dela)
const BAND_MID=(BAND_TOP+BAND_BOT)/2;
const TRIG=[760,1460,2160,2860];               // pontos onde cada onda começa
const BOSS_TRIG=3560;
const FOOD_AFTER={1:'apple',2:'meat',3:'feast'};   // depois da onda i (0-based) coloca comida no caminho
// ajuste fino por chefe (nível médio): vida relativa e dano relativo
const TUNE={hadrion:{hp:.28,dmg:.14},nyxar:{hp:.3,dmg:.4},ryoku:{hp:.3,dmg:.5},xerath:{hp:.33,dmg:.5},malrath:{hp:.34,dmg:.5},genesis:{hp:.34,dmg:.5}};

/* ------------------------------ universo de cada chefe ------------------------------ */
// nomes dos 3 tipos de monstro (soldado, atirador, brutamontes) e cenário
const THEMES={
 zorvath:{tag:'Legião Cristalina',names:['Soldado Cristalino','Atirador Cristalino','Guarda Imperial'],hair:['bald','bald','spiky'],bg:{sky:['#1a0d33','#4a2a7a'],far:'#2b1850',mid:'#44267a',gnd:['#2c2145','#1a1330'],line:'#8f6bd6',deco:'spires',orb:'#ffb0ff'}},
 vhalor:{tag:'Clã das Sombras',names:['Ninja Sem Rosto','Lançador de Kunais','Samurai Sombrio'],hair:['hood','hood','slick'],bg:{sky:['#0b1022','#26325a'],far:'#0c1426',mid:'#18233f',gnd:['#1f2430','#12151d'],line:'#6a7aa8',deco:'trees',orb:'#e8eeff'}},
 kuroen:{tag:'Legião Rubra',names:['Alma Corrompida','Arqueiro Espiritual','Colosso Mascarado'],hair:['hood','long','spiky'],bg:{sky:['#33100d','#a8481f'],far:'#3a1410',mid:'#5a1d14',gnd:['#3b2018','#241210'],line:'#e0753a',deco:'pagodas',orb:'#ffd9a0'}},
 nyxar:{tag:'Hordas Noturnas',names:['Demônio Menor','Demônio Arremessador','Demônio Colosso'],hair:['spiky','long','spiky'],bg:{sky:['#0d0a24','#33205a'],far:'#150f33',mid:'#231a4d',gnd:['#241f3c','#14112a'],line:'#ff9a3a',deco:'houses',orb:'#ffb24a'}},
 ryoku:{tag:'Maldições do Santuário',names:['Maldição Menor','Maldição Atiradora','Maldição Colossal'],hair:['spiky','spiky','bald'],bg:{sky:['#150a18','#4a1a3a'],far:'#1e0d22',mid:'#33122f',gnd:['#2a1624','#180c16'],line:'#ff4f86',deco:'torii',orb:'#ff8ad0'}},
 xerath:{tag:'Colônia Quimera',names:['Formiga Soldado','Formiga Cuspidora','Formiga Capitã'],hair:['antenna','antenna','antenna'],bg:{sky:['#0d1d12','#2f5a2a'],far:'#102416',mid:'#1c3a22',gnd:['#26331c','#161f10'],line:'#8ee06a',deco:'nest',orb:'#d8ff9a'}},
 rapina:{tag:'Liga dos Vilões',names:['Vilão Furtivo','Vilão Elétrico','Vilão Titã'],hair:['slick','spiky','bald'],bg:{sky:['#120a28','#3a1a6a'],far:'#1a1038',mid:'#2a1a55',gnd:['#262338','#15131f'],line:'#b05aff',deco:'city',orb:'#e0b0ff'}},
 malrath:{tag:'Frota Sem Bandeira',names:['Pirata Sombrio','Atirador Pirata','Imediato Brutamontes'],hair:['hood','slick','bald'],bg:{sky:['#07162b','#1d4a73'],far:'#0b2038',mid:'#12304f',gnd:['#3a2f26','#221b15'],line:'#4fb5d6',deco:'masts',orb:'#cfeeff'}},
 hadrion:{tag:'Exército dos Espectros',names:['Espectro Menor','Espectro Arqueiro','Espectro Guardião'],hair:['hood','long','crown'],bg:{sky:['#031a1a','#0f4a46'],far:'#06201f',mid:'#0c3534',gnd:['#1b2a2a','#0e1717'],line:'#4fe0c8',deco:'pillars',orb:'#a8fff0'}},
 genesis:{tag:'Prole do Frasco',names:['Homúnculo','Homúnculo Atirador','Armadura Vazia'],hair:['bald','slick','bald'],bg:{sky:['#1a1408','#5a4510'],far:'#241a0a',mid:'#3d2c10',gnd:['#352b1a','#1f180e'],line:'#ffd24a',deco:'lab',orb:'#fff0b0'}}
};
// Monstro ESPECIAL de cada universo: um quarto tipo, com uma mecânica própria (aparece a partir da onda 2)
const ELITE={
 zorvath:{name:'Capitão Cristalino',kind:'volley',hair:'spiky',extras:['crown'],desc:'Dispara 3 cristais em leque.'},
 vhalor:{name:'Ninja Clone',kind:'blink',hair:'hood',extras:['scar'],desc:'Teleporta para as suas costas.'},
 kuroen:{name:'Espectro Flamejante',kind:'lunge',hair:'long',extras:['horns'],desc:'Avança em linha reta, muito rápido.'},
 nyxar:{name:'Demônio Sanguessuga',kind:'leech',hair:'long',extras:['horns'],desc:'Cura-se com o dano que causa.'},
 ryoku:{name:'Maldição Ancestral',kind:'curse',hair:'spiky',extras:['thirdEye'],desc:'Golpe em área que deixa você lento.'},
 xerath:{name:'Formiga Rainha-Guarda',kind:'split',hair:'antenna',extras:['spikes'],desc:'Ao morrer, solta 2 formigas.'},
 rapina:{name:'Vilão Ladrão',kind:'drain',hair:'slick',extras:['scar'],desc:'Drena sua energia e se cura.'},
 malrath:{name:'Imediato Bombardeiro',kind:'bomb',hair:'hood',extras:['beard'],desc:'Arremessa bombas com aviso no chão.'},
 hadrion:{name:'Espectro Chorão',kind:'homing',hair:'crown',extras:['halo'],desc:'Dispara almas que perseguem.'},
 genesis:{name:'Armadura Alquímica',kind:'shield',hair:'bald',extras:['hat'],desc:'Escudo que absorve os primeiros golpes.'}
};
const eliteOf=def=>ELITE[def.id]||ELITE.zorvath;
const RANGED_KINDS=['volley','homing','bomb'];
const TYPES={
 g:{hp:150,dmg:36,speed:96,r:16,scale:2,windup:.5,cd:1.5,reach:50},
 r:{hp:105,dmg:30,speed:80,r:16,scale:2,windup:.55,cd:2.1,keep:230},
 b:{hp:480,dmg:80,speed:62,r:24,scale:2.9,windup:.95,cd:2.6,reach:78},
 e:{hp:300,dmg:44,speed:94,r:19,scale:2.4,windup:.55,cd:2.0,reach:56,keep:210}
};
const WAVES=[
 ['g','g','g'],
 ['g','g','r','e'],
 ['g','r','r','b','e'],
 ['g','g','r','b','e','e']
];

/* ------------------------------ salvamento ------------------------------ */
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');return{team:s.team==='duo'?'duo':'solo',sel:s.sel||null,cleared:s.cleared||{},tries:s.tries||{}}}catch{return{team:'solo',sel:null,cleared:{},tries:{}}}}
function write(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}}
let save=load(),launching=false,lobbyOn=false;
const roster=()=>HuntAPI.ROSTER;
const unlocked=i=>i===0||!!save.cleared[roster()[i-1].id];
const theme=def=>THEMES[def.id]||THEMES.zorvath;
const mmss=s=>HuntAPI.mmss(s);

/* ------------------------------ sprites dos monstros ------------------------------ */
const looks={};
// Zorvath usa sprite próprio; o exército dele usa o pintor genérico com a paleta cristalina (roxo e branco).
const ZOR_LOOK={id:'zor_army',skin:'#e6dcf0',skinS:'#b3a2c8',
 hair:{type:'bald',c:'#2a1a40',h:'#4a3470',h2:'#7a5ab0'},
 torso:{c:'#5b2f9e',s:'#3a1c6a',h:'#8a5ad8',trim:'#f1ecff',trimS:'#b8a8d8',trimH:'#ffffff',gem:'#ff4f86'},
 under:{c:'#3a2468',s:'#24144a',h:'#5a3c92'},boots:{c:'#2a1a50',trim:'#f1ecff'},
 glove:{c:'#f1ecff',s:'#b8a8d8',h:'#ffffff'},belt:'#ff4f86',
 cape:null,eyes:{iris:'#ff4f86'},extras:[],weapon:null,aura:{a:'#c04bff',b:'#ff62a8'}};
function mobLooks(def){
 if(looks[def.id])return looks[def.id];
 const th=theme(def),base=def.look||ZOR_LOOK,mk=(k,over)=>{const L=JSON.parse(JSON.stringify(base));L.id=base.id+'_m'+k;L.cape=null;L.extras=[];Object.assign(L,over);return L};
 const hair=t=>({...base.hair,type:t});
 const out=[
  mk('g',{hair:hair(th.hair[0]),weapon:['kuroen','malrath','vhalor'].includes(def.id)?base.weapon:null}),
  mk('r',{hair:hair(th.hair[1]),weapon:null}),
  mk('b',{hair:hair(th.hair[2]),extras:def.id==='xerath'?['spikes']:['horns']}),
  mk('e',{hair:hair(eliteOf(def).hair),extras:eliteOf(def).extras,weapon:['kuroen','malrath','vhalor'].includes(def.id)?base.weapon:null})
 ];
 return looks[def.id]=out;
}
const typeIndex={g:0,r:1,b:2,e:3};

/* ------------------------------ estado da fase ------------------------------ */
let S=null;                              // modeRun.stage
const inStage=()=>modeRun&&modeRun.id==='stage'&&modeRun.stage;
const foes=()=>actors.filter(a=>a.team===0&&a.hp>0);
const rnd=(a,b)=>a+Math.random()*(b-a);

function newStage(def,team){
 return{def,team,duo:team==='duo',mul:team==='duo'?2:1,wave:-1,phase:'walk',nextTrig:0,camX:640,lockCx:null,viewW:900,
  queue:[],t:0,mobs:[],proj:[],bombs:[],corpses:[],food:[],kills:0,total:0,bossOn:false,bossDone:false,banner:null,goPulse:0,minionHP:0,minionHP0:1,
  bossT:0,result:null,foodGiven:{}};
}

/* ------------------------------ criação de monstros ------------------------------ */
function spawnMob(type,x,y,opt={}){
 const small=!!opt.small,el=eliteOf(S.def),isE=type==='e';
 const cfg=small?{...TYPES.g,hp:45,scale:1.5,r:12,speed:112,dmg:18,reach:42}:TYPES[type];
 const th=theme(S.def),L=mobLooks(S.def)[small?0:typeIndex[type]];
 const a=actor(x,y,[],S.def.color||'#c04bff');
 a.team=1;a.boss=true;a.trainingDummy=true;a.label=isE?el.name:small?'Formiguinha':th.names[typeIndex[type]];a.r=cfg.r;
 a.max=a.hp=Math.round(cfg.hp*S.mul);a.skin=0;a.inv=.25;
 const kind=isE?el.kind:null;
 a.mob={type,kind,small,ranged:type==='r'||(isE&&RANGED_KINDS.includes(kind)),shield:kind==='shield'?Math.round(110*S.mul):0,cfg,look:L,cd:rnd(.4,1.2),windup:0,t:0,face:Math.PI,walk:Math.random()*6,strafe:Math.random()<.5?-1:1,strafeT:rnd(1,2.5),pose:null,flash:0,drop:type==='b',blinkCd:rnd(1.5,3)};
 a.mob.shieldMax=a.mob.shield;
 actors.push(a);S.mobs.push(a);S.total++;S.minionHP+=a.max;S.minionHP0+=a.max;
 return a;
}
function viewEdges(){return{l:S.camX-S.viewW/2,r:S.camX+S.viewW/2}}
function startWave(i){
 S.wave=i;S.phase='fight';S.lockCx=S.camX;S.t=0;S.minionHP=0;S.minionHP0=0;
 const e=viewEdges(),list=WAVES[i];let n=0;
 list.forEach((type,k)=>{
  const fromLeft=i>=1&&k%3===2&&e.l>120,x=fromLeft?e.l-50-rnd(0,40):Math.min(WORLD_W-40,e.r+50+rnd(0,70));
  S.queue.push({t:.15+n*.55,type,x,y:rnd(BAND_TOP+8,BAND_BOT-8)});n++;
 });
 banner('ONDA '+(i+1)+' / '+WAVES.length,'','wave');
}
function banner(big,small,kind){
 let el=document.getElementById('arcBanner');
 if(!el){el=document.createElement('div');el.id='arcBanner';el.setAttribute('role','status');document.getElementById('battle').appendChild(el)}
 el.className='';void el.offsetWidth;el.innerHTML=`<b>${big}</b>${small?`<small>${small}</small>`:''}`;el.className='show '+(kind||'');
}
function goArrow(on){
 let el=document.getElementById('arcGo');
 if(!el){el=document.createElement('div');el.id='arcGo';el.innerHTML='AVANTE <i>▶</i>';el.hidden=true;document.getElementById('battle').appendChild(el)}
 if(el.hidden===on)el.hidden=!on;
}

/* ------------------------------ comida ------------------------------ */
const FOODS={apple:{heal:.22,name:'Maçã'},meat:{heal:.38,name:'Carne'},feast:{heal:.65,name:'Banquete'}};
function dropFood(kind,x,y){S.food.push({kind,x,y,t:Math.random()*6})}
function updateFood(dt){
 for(const f of S.food){
  f.t+=dt;if(f.taken)continue;
  for(const a of foes()){
   if(Math.hypot(a.x-f.x,a.y-f.y)<30&&a.hp<a.max){
    f.taken=true;const fd=FOODS[f.kind],amt=Math.round(a.max*fd.heal);a.hp=Math.min(a.max,a.hp+amt);
    float(a.x,a.y-60,'+'+amt+' '+fd.name.toUpperCase(),'#9dffb0');ring(a.x,a.y,60,'#9dffb0',.5);spark(a.x,a.y,'#9dffb0',16);
    if(typeof combatSound==='function')combatSound('heal',1);
    break;
   }
  }
 }
 S.food=S.food.filter(f=>!f.taken);
}
function paintFood(f){
 const bob=Math.sin(f.t*3)*2.5;
 ctx.save();ctx.translate(f.x,f.y);
 ctx.fillStyle='#06100c88';ctx.beginPath();ctx.ellipse(0,5,13,4.5,0,0,TAU);ctx.fill();
 ctx.translate(0,-9+bob);const px=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h)};
 if(f.kind==='apple'){px(-6,-6,12,12,'#c8322a');px(-7,-4,14,8,'#c8322a');px(-4,-5,4,3,'#ff7a6a');px(-1,-10,2,5,'#5a3a1a');px(1,-10,5,3,'#4fb04a')}
 else if(f.kind==='meat'){px(-9,-7,16,14,'#a85a2a');px(-7,-9,12,18,'#a85a2a');px(-5,-8,5,4,'#e09a5a');px(7,-4,8,3,'#f2ead0');px(14,-6,3,7,'#f2ead0')}
 else{px(-13,-8,26,16,'#c88a3a');px(-10,-11,20,22,'#c88a3a');px(-8,-10,8,5,'#ffd38a');px(-3,-4,6,4,'#8a5520');px(13,-3,10,4,'#f2ead0');px(21,-6,4,10,'#f2ead0');px(-14,-3,-6,4,'#f2ead0')}
 ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35+.25*Math.sin(f.t*5);ctx.fillStyle='#9dffb0';ctx.fillRect(-1,-22,2,5);ctx.fillRect(-9,-18,2,2);ctx.fillRect(7,-17,2,2);
 ctx.restore();
}

/* ------------------------------ IA dos monstros ------------------------------ */
function nearestPlayer(a){let best=null,bd=1e9;for(const t of foes()){const d=Math.hypot(t.x-a.x,t.y-a.y);if(d<bd){bd=d;best=t}}return best?{t:best,d:bd}:null}
function mobAI(dt,a){
 const m=a.mob;if(a.hp<=0||!m)return;
 m.walk+=dt*6;m.flash=Math.max(0,m.flash-dt);
 const q=nearestPlayer(a);if(!q)return;
 const T=q.t,d=q.d,ang=Math.atan2(T.y-a.y,T.x-a.x),cfg=m.cfg;
 a.moving=false;
 // avanço em linha reta do Espectro Flamejante
 if(m.lunge){
  m.lunge.t-=dt;move(a,Math.cos(m.lunge.a)*560*dt,Math.sin(m.lunge.a)*560*dt);a.moving=true;m.face=m.lunge.a;
  if(!m.lunge.hit)for(const t of foes())if(Math.hypot(t.x-a.x,t.y-a.y)<a.r+t.r+12){m.lunge.hit=true;hit(t,cfg.dmg*1.3,a,30,m.lunge.a,-1);spark(a.x,a.y,'#ffffff',8);break}
  if(m.lunge.t<=0){m.lunge=null;m.cd=cfg.cd*rnd(.9,1.3)}
  return;
 }
 if(a.hitReact>0.01){m.windup=0;m.t=0;a.moving=false;return}
 if(m.windup>0){
  m.t+=dt;a.a=ang;
  const k=m.t/m.windup;
  if(!m.done&&k>=(m.ranged?.62:.55)){m.done=true;if(m.kind==='lunge')m.lunge={t:.3,a:m.aimA,hit:false};else mobStrike(a,T,m.kind==='bomb'?ang:ang)}
  if(m.t>=m.windup){m.windup=0;m.t=0;m.done=false;if(!m.lunge)m.cd=cfg.cd*rnd(.85,1.25)}
  return;
 }
 m.cd-=dt;m.blinkCd-=dt;m.face=ang;a.a=ang;
 // Ninja Clone: some e reaparece atrás de você
 if(m.kind==='blink'&&m.blinkCd<=0&&d>150){
  const bx=clamp(T.x-Math.cos(T.a||0)*58,30,WORLD_W-30),by=clamp(T.y-Math.sin(T.a||0)*34,BAND_TOP,BAND_BOT);
  ring(a.x,a.y,40,theme(S.def).bg.line,.35);spark(a.x,a.y,theme(S.def).bg.orb,10);
  a.x=bx;a.y=by;ring(a.x,a.y,44,'#ffffff',.35);spark(a.x,a.y,theme(S.def).bg.orb,10);
  m.blinkCd=rnd(4.2,5.6);m.cd=Math.min(m.cd,.25);
  return;
 }
 const sp=cfg.speed*(a.slow>0?.55:1);
 let moveA=null;const want=m.ranged?cfg.keep:cfg.reach-12;
 if(m.ranged){
  if(d<cfg.keep-60)moveA=ang+Math.PI+m.strafe*.5;else if(d>cfg.keep+70)moveA=ang;else{m.strafeT-=dt;if(m.strafeT<=0){m.strafe*=-1;m.strafeT=rnd(1.2,2.6)}moveA=ang+m.strafe*Math.PI/2}
 }else{
  if(d>want)moveA=ang;
  else{m.strafeT-=dt;if(m.strafeT<=0){m.strafe*=-1;m.strafeT=rnd(1,2.2)}moveA=ang+m.strafe*Math.PI/2*.7}
 }
 if(moveA!==null&&a.root<=0){const c=move(a,Math.cos(moveA)*sp*dt,Math.sin(moveA)*sp*dt);if(c)move(a,Math.cos(moveA+1.1)*sp*dt,Math.sin(moveA+1.1)*sp*dt);a.moving=true}
 // ataque
 let inReach;
 if(m.kind==='lunge')inReach=d>110&&d<320;
 else if(m.ranged)inReach=d<cfg.keep+110&&d>110;
 else inReach=d<cfg.reach+(m.type==='b'?6:4)&&Math.abs(T.y-a.y)<46;
 if(m.cd<=0&&inReach){m.windup=m.kind==='lunge'?.65:cfg.windup;m.t=0;m.done=false;m.aimA=ang;m.tgt={x:T.x,y:T.y}}
}
const projBase=(a,ang,speed,dmg,r,extra={})=>({x:a.x+Math.cos(ang)*20,y:a.y-14+Math.sin(ang)*20,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,life:2.2,dmg,owner:a,r,t:0,...extra});
function mobStrike(a,T,ang){
 const m=a.mob,cfg=m.cfg,dmg=cfg.dmg*(m.dmgMul||1);
 if(m.ranged){
  if(m.kind==='volley'){for(const off of [-.3,0,.3])S.proj.push(projBase(a,ang+off,330,dmg*.7,8))}
  else if(m.kind==='homing')S.proj.push(projBase(a,ang,210,dmg*.9,11,{homing:2.3,life:3.8}));
  else if(m.kind==='bomb')S.bombs.push({x:T.x,y:T.y,t:1.15,dur:1.15,r:74,dmg:dmg*1.4,owner:a});
  else S.proj.push(projBase(a,ang,300,dmg,9));
  return;
 }
 const aoe=m.type==='b'||m.kind==='curse',radius=m.kind==='curse'?96:m.type==='b'?cfg.reach+14:cfg.reach+8;
 let landed=false;
 for(const t of foes()){
  const d=Math.hypot(t.x-a.x,t.y-a.y);
  if(d>radius+t.r)continue;
  const an=Math.atan2(t.y-a.y,t.x-a.x),front=Math.cos(an-ang);
  if(!aoe&&front<.15)continue;
  const dd=m.kind==='curse'?dmg*.75:dmg;
  if(hit(t,dd,a,m.type==='b'?34:12,an,-1)){
   landed=true;
   if(m.kind==='curse'){t.slow=Math.max(t.slow||0,1.8);float(t.x,t.y-60,'LENTO','#d89aff')}
   if(m.kind==='drain'){t.mp=Math.max(0,(t.mp||0)-30);try{const st=reworkState(t);if(typeof st.value==='number')st.value=Math.max(0,st.value-22)}catch{}float(t.x,t.y-60,'-ENERGIA','#9ad8ff')}
  }
 }
 if(landed&&(m.kind==='leech'||m.kind==='drain')){const h=Math.round(dmg*(m.kind==='leech'?.8:.5));a.hp=Math.min(a.max,a.hp+h);float(a.x,a.y-60,'+'+h,'#ff9aa8')}
 if(aoe){ring(a.x,a.y,radius,m.kind==='curse'?'#d89aff':'#ffffff',.45);if(m.type==='b')combatImpact?.(1.1)}
 else spark(a.x+Math.cos(ang)*30,a.y+Math.sin(ang)*30,'#ffffff',6);
}
function updateProj(dt){
 for(const o of S.proj){
  o.t+=dt;o.life-=dt;
  if(o.homing){
   let best=null,bd=1e9;for(const t of foes()){const d=Math.hypot(t.x-o.x,t.y-o.y);if(d<bd){bd=d;best=t}}
   if(best){const sp=Math.hypot(o.vx,o.vy),cur=Math.atan2(o.vy,o.vx),want=Math.atan2((best.y-10)-o.y,best.x-o.x);let df=Math.atan2(Math.sin(want-cur),Math.cos(want-cur));df=clamp(df,-o.homing*dt,o.homing*dt);o.vx=Math.cos(cur+df)*sp;o.vy=Math.sin(cur+df)*sp}
  }
  o.x+=o.vx*dt;o.y+=o.vy*dt;
  if(o.owner.hp<=0){o.life=0;continue}
  for(const t of foes()){
   if(Math.hypot(t.x-o.x,(t.y-10)-o.y)<t.r+o.r){hit(t,o.dmg,o.owner,10,Math.atan2(o.vy,o.vx),-1);o.life=0;spark(o.x,o.y,theme(S.def).bg.orb,8);break}
  }
 }
 S.proj=S.proj.filter(o=>o.life>0&&o.x>-40&&o.x<WORLD_W+40);
 // bombas do Imediato: avisam no chão e explodem
 for(const bm of S.bombs){
  bm.t-=dt;
  if(bm.t<=0&&!bm.done){bm.done=true;ring(bm.x,bm.y,bm.r,'#ffd29a',.5);spark(bm.x,bm.y,'#ffb24a',18);combatImpact?.(1.2);
   for(const t of foes())if(Math.hypot(t.x-bm.x,t.y-bm.y)<bm.r+t.r*.5)hit(t,bm.dmg,bm.owner,26,Math.atan2(t.y-bm.y,t.x-bm.x),-1)}
 }
 S.bombs=S.bombs.filter(bm=>!bm.done);
}

/* ------------------------------ desenho dos monstros ------------------------------ */
function mobPose(a){
 const m=a.mob;
 if(a.hp<=0)return{name:'dead',i:0};
 if(a.hitReact>0)return{name:'hit',i:a.hitReact>.08?0:1};
 if(m.windup>0){const k=clamp(m.t/m.windup,0,.999);return m.ranged?{name:'s0',i:Math.floor(k*4)}:{name:'punch',i:Math.floor(k*6),side:0}}
 if(a.moving)return{name:'walk',i:Math.floor(m.walk)%6};
 return{name:'idle',i:Math.floor(clock*4+a.x*.01)%4};
}
function drawMob(a){
 const m=a.mob,pose=mobPose(a),th=theme(S.def);
 ctx.save();ctx.translate(a.x,a.y);
 ctx.fillStyle='#06100c99';ctx.beginPath();ctx.ellipse(0,12,m.cfg.r+7,9*m.cfg.scale/2.2,0,0,TAU);ctx.fill();
 // especial: brilho do universo + escudo
 if(m.type==='e'){ctx.save();ctx.globalCompositeOperation='lighter';const gr=ctx.createRadialGradient(0,-26,4,0,-26,58);gr.addColorStop(0,th.bg.line+'66');gr.addColorStop(1,th.bg.line+'00');ctx.fillStyle=gr;ctx.fillRect(-60,-90,120,110);ctx.restore()}
 if(m.shield>0){ctx.save();ctx.globalAlpha=.35+.25*Math.sin(clock*8);ctx.strokeStyle='#9ad8ff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,-22,32,44,0,0,TAU);ctx.stroke();ctx.fillStyle='#9ad8ff22';ctx.fill();ctx.restore()}
 if(m.kind==='lunge'&&m.windup>0){const k=clamp(m.t/m.windup,0,1);ctx.save();ctx.rotate(m.aimA||0);ctx.globalAlpha=.2+.35*k;ctx.fillStyle=th.bg.line;ctx.fillRect(0,-14,300,28);ctx.globalAlpha=.7;ctx.strokeStyle='#fff';ctx.setLineDash([10,7]);ctx.strokeRect(0,-14,300,28);ctx.setLineDash([]);ctx.restore()}
 // aviso do ataque
 if(m.windup>0&&!m.ranged&&m.kind!=='lunge'){const k=clamp(m.t/m.windup,0,1),rad=m.cfg.reach+10;ctx.globalAlpha=.18+.3*k;ctx.fillStyle=th.bg.line;ctx.beginPath();ctx.arc(0,6,rad,0,TAU);ctx.fill();ctx.globalAlpha=.55;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(0,6,rad,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1}
 ctx.translate(0,10);
 const f=a.flash>0||m.flash>0?'brightness(2.1) saturate(.5)':'';   // sem filtro no estado normal (ctx.filter é caro)
 BossSprite.paint(ctx,m.look,pose.name,pose.i,{x:0,y:0,scale:m.cfg.scale,flip:Math.cos(m.face)<0,side:pose.side||0,filter:f});
 ctx.restore();
 if(a.hp<a.max||m.type==='e'){const w=m.type==='b'?40:m.type==='e'?34:m.small?18:28,h=4;ctx.save();ctx.translate(a.x,a.y-(m.type==='b'?86:m.type==='e'?70:m.small?44:60));ctx.fillStyle='#10061be0';ctx.fillRect(-w/2,0,w,h+2);ctx.fillStyle=m.type==='b'?'#ff9a5a':m.type==='e'?theme(S.def).bg.line:'#e86a6a';ctx.fillRect(-w/2+1,1,(w-2)*clamp(a.hp/a.max,0,1),h);ctx.restore()}
}
function paintProj(o){
 const th=theme(S.def).bg;
 ctx.save();ctx.translate(o.x,o.y);ctx.globalCompositeOperation='lighter';
 ctx.fillStyle=th.line+'66';ctx.beginPath();ctx.arc(0,0,o.r+5,0,TAU);ctx.fill();
 ctx.fillStyle=th.orb;ctx.beginPath();ctx.arc(0,0,o.r-2,0,TAU);ctx.fill();
 ctx.restore();
}
function paintBomb(bm){
 const k=clamp(1-bm.t/bm.dur,0,1),th=theme(S.def).bg;
 ctx.save();ctx.translate(bm.x,bm.y);
 ctx.globalAlpha=.16+.3*k;ctx.fillStyle='#ffb24a';ctx.beginPath();ctx.arc(0,0,bm.r*(.35+.65*k),0,TAU);ctx.fill();
 ctx.globalAlpha=.8;ctx.strokeStyle=k>.7&&Math.floor(clock*14)%2?'#fff':'#ffb24a';ctx.lineWidth=3;ctx.setLineDash([12,7]);ctx.beginPath();ctx.arc(0,0,bm.r,0,TAU);ctx.stroke();ctx.setLineDash([]);
 ctx.globalAlpha=1;ctx.fillStyle='#2a2430';ctx.beginPath();ctx.arc(0,-16+k*16,9,0,TAU);ctx.fill();ctx.fillStyle='#ffd29a';ctx.fillRect(-1,-30+k*16,3,6);
 ctx.restore();
}
function paintCorpse(c){
 const k=clamp(c.t/.9,0,1);
 ctx.save();ctx.translate(c.x,c.y);ctx.fillStyle='#06100c99';ctx.globalAlpha=1-k;ctx.beginPath();ctx.ellipse(0,12,c.r+6,8,0,0,TAU);ctx.fill();
 ctx.translate(0,10);ctx.globalAlpha=(1-k)*(Math.floor(c.t*18)%2?.55:1);
 BossSprite.paint(ctx,c.look,'dead',0,{scale:c.scale,flip:c.flip,filter:'brightness('+(1+(1-k)*1.4)+')'});
 ctx.restore();
}

/* ------------------------------ cenário ------------------------------ */
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
const DECO={
 spires(g,W,H,c,r){for(let x=-20;x<W;x+=70+r()*90){const h=70+r()*130,w=22+r()*26;g.fillStyle=c.far;g.beginPath();g.moveTo(x,H*GROUND);g.lineTo(x+w/2,H*GROUND-h);g.lineTo(x+w,H*GROUND);g.fill();g.fillStyle=c.mid;g.beginPath();g.moveTo(x+w*.5,H*GROUND-h);g.lineTo(x+w,H*GROUND);g.lineTo(x+w*.5,H*GROUND);g.fill()}},
 trees(g,W,H,c,r){for(let x=-20;x<W;x+=46+r()*50){const h=90+r()*110;g.fillStyle=c.far;g.fillRect(x+8,H*GROUND-h,8,h);g.beginPath();g.arc(x+12,H*GROUND-h,22+r()*14,0,TAU);g.fill();g.fillStyle=c.mid;g.beginPath();g.arc(x+18,H*GROUND-h+8,14,0,TAU);g.fill()}},
 pagodas(g,W,H,c,r){for(let x=0;x<W;x+=190+r()*130){const w=64+r()*30,y=H*GROUND;for(let k=0;k<3;k++){g.fillStyle=k%2?c.mid:c.far;g.fillRect(x+10+k*6,y-34*(k+1),w-12-k*12,28);g.beginPath();g.moveTo(x+k*4,y-34*(k+1)+2);g.lineTo(x+w/2,y-34*(k+1)-14);g.lineTo(x+w-k*4,y-34*(k+1)+2);g.fill()}}},
 houses(g,W,H,c,r){for(let x=-10;x<W;x+=60+r()*60){const w=44+r()*36,h=44+r()*70,y=H*GROUND;g.fillStyle=c.far;g.fillRect(x,y-h,w,h);g.beginPath();g.moveTo(x-4,y-h);g.lineTo(x+w/2,y-h-20);g.lineTo(x+w+4,y-h);g.fill();g.fillStyle=c.line+'88';if(r()<.6)g.fillRect(x+w*.3,y-h*.6,6,9)}},
 torii(g,W,H,c,r){for(let x=40;x<W;x+=240+r()*160){const y=H*GROUND,w=70;g.fillStyle=c.mid;g.fillRect(x,y-92,8,92);g.fillRect(x+w,y-92,8,92);g.fillStyle=c.line;g.fillRect(x-12,y-100,w+32,9);g.fillRect(x-4,y-80,w+16,6)}},
 nest(g,W,H,c,r){for(let x=-20;x<W;x+=80+r()*80){const h=60+r()*100,y=H*GROUND;g.fillStyle=c.far;g.beginPath();g.ellipse(x+30,y,34+r()*20,h,0,Math.PI,TAU);g.fill();g.fillStyle=c.mid;g.beginPath();g.ellipse(x+36,y,16,h*.6,0,Math.PI,TAU);g.fill()}},
 city(g,W,H,c,r){for(let x=-10;x<W;x+=40+r()*44){const w=34+r()*40,h=60+r()*140,y=H*GROUND;g.fillStyle=c.far;g.fillRect(x,y-h,w,h);g.fillStyle=c.mid;g.fillRect(x+w*.7,y-h,w*.3,h);g.fillStyle=c.line+'aa';for(let wy=y-h+8;wy<y-8;wy+=14)if(r()<.5)g.fillRect(x+6,wy,5,6)}},
 masts(g,W,H,c,r){for(let x=20;x<W;x+=150+r()*150){const h=120+r()*80,y=H*GROUND;g.fillStyle=c.far;g.fillRect(x,y-h,5,h);g.fillStyle=c.mid;g.beginPath();g.moveTo(x+5,y-h+8);g.lineTo(x+54,y-h*.55);g.lineTo(x+5,y-h*.4);g.fill();g.fillStyle=c.far;g.fillRect(x-14,y-h*.4-3,40,3)}},
 pillars(g,W,H,c,r){for(let x=0;x<W;x+=100+r()*110){const h=90+r()*100,y=H*GROUND;g.fillStyle=c.far;g.fillRect(x,y-h,22,h);g.fillStyle=c.mid;g.fillRect(x+16,y-h,6,h);g.fillStyle=c.far;g.fillRect(x-4,y-h-6,30,8);g.fillStyle=c.line+'55';if(r()<.5){g.beginPath();g.arc(x+11,y-h-30-r()*30,6,0,TAU);g.fill()}}},
 lab(g,W,H,c,r){for(let x=0;x<W;x+=120+r()*100){const y=H*GROUND,h=80+r()*90;g.fillStyle=c.far;g.fillRect(x,y-h,40,h);g.fillStyle=c.mid;g.fillRect(x+4,y-h+10,14,h-20);g.strokeStyle=c.line+'88';g.lineWidth=2;g.beginPath();g.arc(x+70,y-50,24,0,TAU);g.moveTo(x+70-24,y-50);g.lineTo(x+70+24,y-50);g.stroke()}}
};
function buildStageBG(def){
 const th=theme(def).bg,r=rng(9173+def.id.length*131);
 const cv=document.createElement('canvas');cv.width=WORLD_W;cv.height=WORLD_H;const g=cv.getContext('2d');
 const sky=g.createLinearGradient(0,0,0,WORLD_H*GROUND);sky.addColorStop(0,th.sky[0]);sky.addColorStop(1,th.sky[1]);g.fillStyle=sky;g.fillRect(0,0,WORLD_W,WORLD_H);
 // astro / orbe do cenário
 for(let x=260;x<WORLD_W;x+=900){const rad=34+r()*18;const gr=g.createRadialGradient(x,70,6,x,70,rad*2.2);gr.addColorStop(0,th.orb+'cc');gr.addColorStop(1,th.orb+'00');g.fillStyle=gr;g.fillRect(x-rad*2.2,0,rad*4.4,160);g.fillStyle=th.orb;g.globalAlpha=.85;g.beginPath();g.arc(x,70,rad*.55,0,TAU);g.fill();g.globalAlpha=1}
 (DECO[th.deco]||DECO.spires)(g,WORLD_W,WORLD_H,th,r);
 // chão
 const y0=WORLD_H*GROUND,gr=g.createLinearGradient(0,y0,0,WORLD_H);gr.addColorStop(0,th.gnd[0]);gr.addColorStop(1,th.gnd[1]);g.fillStyle=gr;g.fillRect(0,y0,WORLD_W,WORLD_H-y0);
 g.fillStyle=th.line+'66';g.fillRect(0,y0,WORLD_W,3);
 for(let i=1;i<6;i++){const y=y0+(WORLD_H-y0)*i/6;g.fillStyle=th.line+(i%2?'18':'10');g.fillRect(0,y,WORLD_W,1)}
 for(let x=0;x<WORLD_W;x+=120){g.fillStyle=th.line+'14';g.fillRect(x+((x/120)%2)*40,y0+4,2,WORLD_H-y0)}
 for(let i=0;i<260;i++){g.fillStyle=th.line+'22';g.fillRect(r()*WORLD_W,y0+8+r()*(WORLD_H-y0-12),2+r()*5,1)}
 // marcos de onda e do chefe (faixas no chão)
 for(const x of TRIG){g.fillStyle=th.line+'33';g.fillRect(x-2,y0+4,4,WORLD_H-y0-4)}
 g.fillStyle='#ffffff22';g.fillRect(BOSS_TRIG-3,y0+4,6,WORLD_H-y0-4);
 // luz de borda
 const v=g.createLinearGradient(0,0,0,WORLD_H);v.addColorStop(0,'#00000055');v.addColorStop(.5,'#00000000');v.addColorStop(1,'#00000066');g.fillStyle=v;g.fillRect(0,0,WORLD_W,WORLD_H);
 return cv;
}

/* ------------------------------ passo da fase ------------------------------ */
function clampActors(){
 const e=viewEdges();
 for(const a of actors){
  if(a.hp<=0)continue;
  if(a.team===0){a.x=clamp(a.x,e.l+30,e.r-30)}
  else if(a.mob){                       // monstros entram pela borda e depois ficam dentro da tela
   if(!a.mob.entered&&a.x>e.l+24&&a.x<e.r-24)a.mob.entered=true;
   if(a.mob.entered)a.x=clamp(a.x,e.l+22,e.r-22);
  }
  a.y=clamp(a.y,BAND_TOP,BAND_BOT);
 }
}
function stageStep(dt){
 modeRun.elapsed+=dt;S.t+=dt;
 const alive=foes();
 if(!alive.length||time<=0){endArenaMode(false);return}
 // spawn
 if(S.queue.length){for(const q of S.queue)if(!q.done&&S.t>=q.t){q.done=true;spawnMob(q.type,q.x,q.y)}S.queue=S.queue.filter(q=>!q.done)}
 // mortes
 for(const a of S.mobs){
  if(a.hp<=0&&!a.dead){
   a.dead=true;S.kills++;const m=a.mob;
   S.corpses.push({x:a.x,y:a.y,t:0,look:m.look,scale:m.cfg.scale,r:m.cfg.r,flip:Math.cos(m.face)<0});
   ring(a.x,a.y,50,theme(S.def).bg.line,.4);spark(a.x,a.y,theme(S.def).bg.orb,14);
   if(m.drop)dropFood('apple',a.x,clamp(a.y,BAND_TOP+10,BAND_BOT-8));
   if(m.kind==='split'&&!m.small){for(const dx of [-26,26])spawnMob('g',clamp(a.x+dx,40,WORLD_W-40),a.y,{small:true});banner('A RAINHA-GUARDA SOLTOU FORMIGAS','','wave')}
  }
 }
 actors=actors.filter(a=>!(a.mob&&a.dead));S.mobs=S.mobs.filter(a=>!a.dead);
 for(const c of S.corpses)c.t+=dt;S.corpses=S.corpses.filter(c=>c.t<.9);
 updateProj(dt);updateFood(dt);
 if(S.phase==='fight'){
  if(!S.mobs.length&&!S.queue.length){
   const food=FOOD_AFTER[S.wave];
   const e=viewEdges();
   if(food)dropFood(food,clamp(e.r-170,e.l+120,WORLD_W-120),BAND_MID+14);
   S.phase='walk';S.nextTrig=S.wave+1;S.lockCx=null;
   if(S.wave+1>=WAVES.length)banner('CAMINHO LIVRE','O chefe espera no fim da fase','go');
   else banner('ONDA SUPERADA','','go');
   for(const a of alive)a.hp=Math.min(a.max,a.hp+a.max*.04);
  }
 }
 // câmera "só para a frente"
 const lead=Math.max(...alive.map(a=>a.x));
 if(S.phase==='walk'){
  S.camX=Math.max(S.camX,Math.min(WORLD_W-S.viewW/2,lead+S.viewW*.12));
  const nextX=S.nextTrig<WAVES.length?TRIG[S.nextTrig]:BOSS_TRIG;
  goArrow(lead<nextX-120&&!S.bossOn);
  if(S.nextTrig<WAVES.length&&lead>=nextX)startWave(S.nextTrig);
  else if(S.nextTrig>=WAVES.length&&lead>=BOSS_TRIG)startBoss();
 }else goArrow(false);
 if(S.phase==='boss-intro'){
  S.bossT+=dt;
  if(S.bossT>=1.4){S.phase='boss'}
 }
 clampActors();
}

/* ------------------------------ chefe ------------------------------ */
function startBoss(){
 const def=S.def;S.phase='boss-intro';S.bossOn=true;S.bossT=0;S.lockCx=Math.min(WORLD_W-S.viewW/2,Math.max(S.camX,BOSS_TRIG-40));
 const tu=TUNE[def.id]||{},solo=!S.duo,base=Math.round(def.hp*(tu.hp||.36)),e0=viewEdges();
 const A=actor(Math.min(WORLD_W-80,e0.r-110),BAND_MID,[0,1,2,3,4,5],def.color||'#c04bff');
 A.boss=true;A.huntBoss=true;A.team=1;A.label=def.name;A.r=def.generic?30:26;A.a=Math.PI;A.st=100;A.skin=0;A.trainingDummy=true;
 A.max=A.hp=Math.round(base*S.mul);A.inv=0;
 b=A;S.bossA=A;S.bossFoodGiven=false;
 let R;
 if(def.generic){R=HuntAPI.makeGB(def,A,solo);modeRun.gb=R;R.noPhase2=true;R.dmgScale=tu.dmg||.55}
 else{R=HuntAPI.makeHunt(def,A,solo);modeRun.hunt=A.hunt=R;R.noForms=true;R.dmgScale=.6}
 R.rest=2.2;
 actors.push(A);
 const bk=document.getElementById('botkit');if(bk)bk.innerHTML=def.skills.map(s=>`<span title="${s.name}">${HuntAPI.iconImg(s.icon,'hunt-mini')}</span>`).join('');
 banner('CHEFE',def.name,'boss');toast?.('Chefe da fase: '+def.name);
}

/* ------------------------------ integração com o motor do jogo ------------------------------ */
const prevPrepare=prepareArenaMode;
prepareArenaMode=function(){
 prevPrepare();
 if(arenaModeId!=='stage'||!modeRun)return;
 const def=roster().find(d=>d.id===save.sel)||roster()[0];
 const ally=actors.find(a=>a!==p&&a!==b&&a.team===0);
 actors=save.team==='duo'&&ally?[p,ally]:[p];
 S=modeRun.stage=newStage(def,save.team);
 time=ARENA_MODES.stage.seconds;
 p.x=300;p.y=BAND_MID+8;p.a=0;p.inv=2;
 if(ally&&S.duo){ally.x=230;ally.y=BAND_BOT-14;ally.label='Aliado';ally.inv=2}
 b.hp=b.max=1000;b.team=1;b.label=theme(def).tag;
 S.camX=WORLD_W*0+640;S.nextTrig=0;
 
};
const prevConfigure=configureArenaSize;
configureArenaSize=function(){
 prevConfigure();
 if(arenaModeId==='stage'&&battleActivity!=='training'){W=WORLD_W;H=WORLD_H;pillars=[]}
};
const prevBG=buildArenaBackground;
buildArenaBackground=function(){
 if(arenaModeId!=='stage'||battleActivity==='training')return prevBG();
 const def=roster().find(d=>d.id===load().sel)||roster()[0];
 if(groundCache&&groundCache.__stage===def.id&&groundCache.width===WORLD_W)return;
 groundCache=buildStageBG(def);groundCache.__stage=def.id;
 pillarCache=document.createElement('canvas');pillarCache.width=pillarCache.height=1;
 backgroundBuilds++;
};
const prevStep=stepArenaMode;
stepArenaMode=function(dt){
 if(!inStage())return prevStep(dt);
 if(S.phase==='boss'||S.phase==='boss-intro'&&modeRun.gb||S.phase==='boss-intro'&&modeRun.hunt){
  // o motor do chefe cuida da luta; a fase só mantém a câmera, a comida e a tela
  if(S.phase==='boss-intro'){S.bossT+=dt;if(S.bossT>=1.4)S.phase='boss'}
  updateFood(dt);S.t+=dt;
  for(const c of S.corpses)c.t+=dt;S.corpses=S.corpses.filter(c=>c.t<.9);
  // comida em ponto estratégico: o chefe "derruba" carne ao passar da metade da vida
  const A=S.bossA;
  if(A&&!S.bossFoodGiven&&A.hp>0&&A.hp<A.max*.5){S.bossFoodGiven=true;const e=viewEdges();dropFood('meat',clamp((e.l+e.r)/2,e.l+140,e.r-140),BAND_MID+16);banner('COMIDA!','Pegue a carne para recuperar vida','go')}
  const r=prevStep(dt);clampActors();return r;
 }
 return stageStep(dt);
};
const prevHitFn=hit;
hit=function(t,n,o,k,an,id){
 const m=t&&t.mob;
 if(m&&m.shield>0&&n>0&&inStage()){
  const ab=Math.min(m.shield,n);m.shield-=ab;n-=ab;m.flash=.1;
  float(t.x,t.y-74,m.shield>0?'ESCUDO':'ESCUDO QUEBRADO','#9ad8ff');
  if(m.shield<=0)ring(t.x,t.y,60,'#9ad8ff',.5);
  if(n<=0)return true;
 }
 return prevHitFn(t,n,o,k,an,id);
};
const prevAI=guardianAI;
guardianAI=function(dt,a){if(a.mob)mobAI(dt,a);else prevAI(dt,a)};
const prevDraw=drawGuardian;
drawGuardian=function(a){if(a.mob)drawMob(a);else prevDraw(a)};
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(!inStage())return list;
 for(const f of S.food)list.push({kind:'arc-food',y:f.y,priority:1,paint(){paintFood(f)}});
 for(const bm of S.bombs)list.push({kind:'arc-bomb',y:bm.y-2,priority:0,paint(){paintBomb(bm)}});
 for(const o of S.proj)list.push({kind:'arc-proj',y:o.y+20,priority:3,paint(){paintProj(o)}});
 for(const c of S.corpses)list.push({kind:'arc-corpse',y:c.y-1,priority:0,paint(){paintCorpse(c)}});
 return list.sort((x,y)=>x.y-y.y||(x.priority||0)-(y.priority||0));
};
const prevCam=updateArenaCamera;
updateArenaCamera=function(){
 if(!inStage()||!cw||!ch)return prevCam();
 const top=window.battleTop?battleTop():(ch<520?58:88);
 scale=clamp(Math.min(cw/1000,(ch-top-6)/(WORLD_H*.86)),.55,1.45);
 S.viewW=cw/scale;
 const target=S.lockCx!=null?S.lockCx:S.camX;
 S.camX=S.lockCx!=null?(S.camX+(target-S.camX)*.12):S.camX;
 S.camX=clamp(S.camX,S.viewW/2,WORLD_W-S.viewW/2);
 ox=cw/2-S.camX*scale;
 // o fundo da faixa de chão fica logo acima do analógico/skills (medido uma vez por tamanho de tela)
 const key=cw+'x'+ch;
 if(key!==S.feetKey){S.feetKey=key;const st=document.querySelector('#stick');S.feetY=st?st.getBoundingClientRect().top-14:ch*.68}
 const bandH=(BAND_BOT-BAND_TOP)*scale;
 const feet=clamp(S.feetY||ch*.68,top+bandH+24,ch-40);
 oy=Math.min(top,feet-BAND_BOT*scale);
};
const prevHUD=modeHUD;
modeHUD=function(){
 prevHUD();
 if(!inStage())return;
 const el=$('#modeObjective');
 let txt;
 if(S.phase==='boss'||S.phase==='boss-intro')txt='Cruzada Arcade · CHEFE · '+S.def.name.split(',')[0];
 else if(S.phase==='fight')txt=`Cruzada Arcade · Onda ${S.wave+1}/${WAVES.length} · restam ${S.mobs.length+S.queue.length}`;
 else if(S.wave<0)txt='Cruzada Arcade · avance para a direita';
 else txt=`Cruzada Arcade · Onda ${Math.min(WAVES.length,S.wave+1)}/${WAVES.length} superada`;
 el.hidden=false;el.textContent=txt;
 const mid=$('.mid-hud small');if(mid)mid.textContent='ARCADE';
};
const prevUI=updateUI;
updateUI=function(){
 prevUI();
 if(!inStage()||!p)return;
 const t=enemy(p),el=document.querySelector('#enemyResource');
 if(el&&t?.mob)el.textContent=theme(S.def).tag.toUpperCase();
 // a vida dos inimigos aparece em %, para não revelar a regra oculta da dupla (vida em dobro)
 if(t&&(t.mob||t===S.bossA)){const hp=document.querySelector('#bhp');if(hp)hp.textContent=Math.ceil(100*Math.max(0,t.hp)/t.max)+'%'}
};
const prevEnd=endArenaMode;
endArenaMode=function(win,draw){
 if(!inStage()||modeRun.settled)return prevEnd(win,draw);
 const g=modeRun.gb,h=modeRun.hunt;modeRun.gb=modeRun.hunt=null;   // não grava recorde da Caçada
 const sec=Math.round(modeRun.elapsed);
 prevEnd(win,draw);
 modeRun.gb=g;modeRun.hunt=h;
 const def=S.def;save=load();
 let extra='';
 if(win){
  const old=save.cleared[def.id];save.cleared[def.id]=old?Math.min(old,sec):sec;
  const idx=roster().findIndex(d=>d.id===def.id),nxt=roster()[idx+1];
  extra=old?(sec<old?' Novo recorde!':''):(nxt?` Fase liberada: ${nxt.name.split(',')[0]}.`:' Cruzada completa!');
  $('#resultTitle').textContent='Fase concluída!';
  $('#resultText').textContent=`Cruzada Arcade · ${def.name} caiu em ${mmss(sec)}.${extra} `+$('#resultText').textContent.replace(/^[^·]*·\s*/,'');
 }else{
  $('#resultTitle').textContent='A horda venceu.';
  $('#resultText').textContent=`Você chegou até ${S.phase==='boss'||S.phase==='boss-intro'?'o chefe':'a onda '+Math.max(1,S.wave+1)}. Use a comida do caminho e ataque com calma. `+$('#resultText').textContent.replace(/^[^·]*·\s*/,'');
 }
 write(save);
 const eb=document.querySelector('#outcome .eyebrow');if(eb)eb.textContent='CRUZADA ENCERRADA';
 $('#stats').innerHTML=`<span>${mmss(sec)}</span><span>${S.kills} monstros</span><span>${Math.round(p.damage)} dano</span>`+$('#stats').innerHTML.split('</span>').slice(-2).join('</span>');
 goArrow(false);
};
const prevStart=start;
start=function(){
 const r=prevStart.apply(this,arguments);
 document.getElementById('arcGo')&&(document.getElementById('arcGo').hidden=true);
 if(inStage()){
  const eb=document.querySelector('#outcome .eyebrow');if(eb)eb.textContent='CRUZADA ENCERRADA';
  $('#teamHud').hidden=!S.duo;
  $('#battle').dataset.arena='stage';
  $('#botkit').innerHTML='';
  banner('FASE '+(roster().findIndex(d=>d.id===S.def.id)+1),S.def.name.split(',')[0]+' · '+theme(S.def).tag,'intro');
 }
 return r;
};
const prevLaunch=launchArenaMode;
launchArenaMode=function(){
 if(arenaModeId!=='stage')return prevLaunch();
 battleActivity='casual';matchMode=save.team==='duo'?'2v2':'1v1';$('#modeScreen').hidden=true;start();
};
const prevBegin=beginArenaMode;
beginArenaMode=function(id){
 if(id==='stage'&&!launching){
  if(!account?.profile)return false;
  if(!validOwnedKit(selected)){showScreen('library');announce('Equipe seis Ecos desbloqueados.');return false}
  openLobby();return true;
 }
 return prevBegin(id);
};

/* ------------------------------ lobby ------------------------------ */
function stageButton(d,i){
 const lock=!unlocked(i),clr=save.cleared[d.id];
 return `<button class="arc-stage${d.id===save.sel?' on':''}${lock?' lock':''}" data-arc-stage="${d.id}" ${lock?'aria-disabled="true"':''} aria-label="Fase ${i+1}, ${d.name}${lock?', bloqueada':clr?', concluída':''}">
  <img src="${HuntAPI.bust(d)}" alt=""><span class="arc-n">${i+1}</span><b>${d.name.split(',')[0]}</b><small>${lock?'🔒 conclua a anterior':clr?'✓ '+mmss(clr):'nova'}</small></button>`;
}
function infoMarkup(def,idx){
 const th=theme(def),el=eliteOf(def),clr=save.cleared[def.id];
 return `<div class="arc-boss"><span class="eyebrow">FASE ${idx+1} · ${th.tag.toUpperCase()}</span><h2>${def.name}</h2><p>${def.title} · Chefe em nível médio (só a 1ª fase da luta)</p></div>
  <div class="arc-mobs">${th.names.map((n,k)=>`<figure><canvas width="76" height="76" data-arc-mob="${k}" aria-hidden="true"></canvas><figcaption>${n}</figcaption></figure>`).join('')}<figure class="arc-elite"><canvas width="76" height="76" data-arc-mob="3" aria-hidden="true"></canvas><figcaption>${el.name}<i>ESPECIAL</i></figcaption></figure></div>
  <p class="arc-special"><b>${el.name}:</b> ${el.desc}</p>
  <div class="hunt-chips arc-chips"><span>${WAVES.length} ondas</span><span>🍖 comida no caminho</span><span>Chefe no final</span><span>${clr?'Melhor '+mmss(clr):'Sem recorde'}</span></div>`;
}
function lobbyMarkup(){
 const r=roster(),idx=Math.max(0,r.findIndex(d=>d.id===save.sel)),def=r[idx];
 return `<div class="arc-page">
 <header class="arc-top"><button class="ghost" data-open-modes>← Arenas</button><div class="arc-title"><span class="eyebrow">MODO ARCADE · SOLO OU DUPLA</span><h1>Cruzada Arcade</h1></div></header>
 <div class="arc-body">
  <section class="arc-stages" aria-label="Fases">${r.map(stageButton).join('')}</section>
  <section class="arc-info" id="arcInfo">${infoMarkup(def,idx)}</section>
 </div>
 <footer class="arc-foot">
  <div class="hunt-team" role="group" aria-label="Equipe"><button data-arc-team="solo" class="${save.team==='solo'?'on':''}" aria-pressed="${save.team==='solo'}"><b>Solo</b><small>só você</small></button><button data-arc-team="duo" class="${save.team==='duo'?'on':''}" aria-pressed="${save.team==='duo'}"><b>Dupla</b><small>com aliado bot</small></button></div>
  <p class="arc-tip">Atravesse a fase, vença cada onda e enfrente o chefe. Pegue a comida no caminho para recuperar vida.</p>
  <button class="gold hunt-go" data-arc-start>⚔ INICIAR FASE</button>
 </footer></div>`;
}
function paintMobPreviews(){
 const def=roster().find(d=>d.id===save.sel)||roster()[0],L=mobLooks(def);
 document.querySelectorAll('[data-arc-mob]').forEach(c=>{
  const k=+c.dataset.arcMob,g=c.getContext('2d');g.clearRect(0,0,76,76);g.imageSmoothingEnabled=false;
  BossSprite.paint(g,L[k],'idle',0,{x:38,y:70,scale:k===2?1.3:k===3?1.15:1.0});
 });
}
function openLobby(){
 save=load();
 if(!save.sel||!roster().some(d=>d.id===save.sel)||!unlocked(roster().findIndex(d=>d.id===save.sel)))save.sel=roster()[0].id;
 write(save);showArenaModes();appScreen='arcade';document.body.dataset.screen='arcade';lobbyOn=true;
 $('#modeScreen').innerHTML=lobbyMarkup();paintMobPreviews();
}
function startStage(){
 save=load();const k=save.tries;k[save.sel]=(k[save.sel]||0)+1;write(save);
 launching=true;try{beginArenaMode('stage')}finally{launching=false}
}
document.addEventListener('click',e=>{
 if(appScreen!=='arcade')return;
 const st=e.target.closest('[data-arc-stage]');
 if(st){
  const id=st.dataset.arcStage,i=roster().findIndex(d=>d.id===id);
  if(!unlocked(i)){toast?.('Conclua a fase anterior para liberar esta.');return}
  save.sel=id;write(save);
  document.querySelectorAll('[data-arc-stage]').forEach(b=>b.classList.toggle('on',b===st));
  $('#arcInfo').innerHTML=infoMarkup(roster()[i],i);paintMobPreviews();return;
 }
 const tm=e.target.closest('[data-arc-team]');
 if(tm){save.team=tm.dataset.arcTeam;write(save);document.querySelectorAll('[data-arc-team]').forEach(b=>{const on=b===tm;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});return}
 if(e.target.closest('[data-arc-start]'))startStage();
});

/* ------------------------------ ganchos de teste ------------------------------ */
window.ArcadeAPI={
 get S(){return S},THEMES,ELITE,TYPES,WAVES,BAND_TOP,BAND_BOT,TRIG,BOSS_TRIG,WORLD_W,WORLD_H,
 get save(){return load()},setSave(s){save={...load(),...s};write(save)},
 openLobby,startStage,roster,unlocked,
 mobLooks,spawnMob:(t,x,y)=>S&&spawnMob(t,x,y)
};
})();
