'use strict';
/*
 * Sobrevivência — battle royale solo com 8 lutadores (você + 7 bots).
 *  - Todos começam no nível 1 SEM habilidade ativa. Cada nível dá 1 ponto: libere uma habilidade por vez
 *    (a ultimate só depois de liberar as outras 5).
 *  - Experiência vem de monstros do mapa e de lutadores derrotados.
 *  - A zona segura fecha em fases, sempre para um ponto aleatório do mapa; fora dela há dano de gás.
 *  - Ideias extras: cura ao subir de nível, suprimentos na nova zona, monstros que soltam comida, ranking e minimapa.
 * Os monstros e a IA dos bots usam os mesmos motores da Cruzada Arcade (sprites) e do duelo (IA dos bots).
 */
(function(){
const MAP_W=3600,MAP_H=2800,CX=MAP_W/2,CY=MAP_H/2,R0=2350;     // mapa ~1,9x maior; tudo abaixo escala junto
// XP acumulada para o nível 1..10. Níveis 2-7 dão 1 ponto de habilidade; 8-10 dão bônus de vida e dano.
const LV_XP=[0,60,150,270,420,600,820,1080,1380,1720];
const MAX_LV=10,SKILL_LV=7,LV_BONUS={hp:.08,dmg:.06};
// fases da zona: espera, fechamento, raio final e dano por segundo (fração da vida máxima)
const ZONES=[{wait:75,shrink:34,r:1400,dps:.012},{wait:48,shrink:28,r:920,dps:.025},{wait:36,shrink:22,r:590,dps:.045},{wait:28,shrink:18,r:320,dps:.075},{wait:18,shrink:14,r:120,dps:.12}];
const NAMES=['Kaito','Lyra','Bruto','Sora','Vex','Nami','Dante','Ryu','Mika','Zed'];
const MON={
 s:{hp:100,dmg:12,speed:88,r:15,scale:2,xp:12,windup:.5,cd:1.5,reach:46,aggro:250},
 m:{hp:190,dmg:19,speed:84,r:17,scale:2.15,xp:26,windup:.55,cd:1.8,reach:50,aggro:290},
 e:{hp:310,dmg:26,speed:90,r:19,scale:2.4,xp:40,windup:.55,cd:1.7,reach:54,aggro:300},
 b:{hp:430,dmg:38,speed:62,r:24,scale:2.9,xp:60,windup:.95,cd:2.6,reach:78,aggro:320}
};
const MAXR={s:0,m:0,e:1500,b:950};                    // distância máxima do centro por tipo de monstro (0 = qualquer lugar)
const MON_LOOK={s:0,m:1,b:2,e:3};
const RADAR=900;                                   // o minimapa só mostra rivais a até esta distância (ou quem acabou de te acertar)
const FOODS={apple:{heal:.18,name:'Maçã'},meat:{heal:.35,name:'Carne'}};

let R=null,layout=null;
const isRoy=()=>modeRun&&modeRun.id==='survival'&&modeRun.roy;
const rnd=(a,b)=>a+Math.random()*(b-a);
const players=()=>actors.filter(a=>a.roy);
const alive=()=>actors.filter(a=>a.roy&&a.hp>0);
// rivais que o jogador "sabe" onde estão: perto dele, ou quem o acertou nos últimos 4 segundos
function radar(){
 if(!R||!p)return[];
 const hitBy=p.lastHit&&clock-p.lastHit.t<4?p.lastHit.by:null;
 return alive().filter(a=>a!==p&&(Math.hypot(a.x-p.x,a.y-p.y)<=RADAR||a===hitBy));
}
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};

/* ------------------------------ mapa ------------------------------ */
function makeLayout(){
 const id=Math.floor(Math.random()*1e9),r=rng(id),pil=[];
 for(let i=0;i<300&&pil.length<44;i++){
  const x=rnd(150,MAP_W-150),y=rnd(150,MAP_H-150),rad=rnd(26,46);
  if(Math.hypot(x-CX,y-CY)<130)continue;
  if(pil.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+rad+120))continue;
  pil.push({x,y,r:rad,kind:r()<.6?'tree':'rock'});
 }
 return{id,pillars:pil,seed:id};
}
// Terreno em blocos de 512 px, criados só quando a câmera os vê (um canvas único de 3600x2800 deixava cada quadro lento)
const TS=512;
let terrain=null;
function buildTerrain(){
 const r=rng(layout.seed),F={blots:[],lakes:[],trails:[],flowers:[]};
 for(let i=0;i<480;i++){const rad=40+r()*140;F.blots.push({x:r()*MAP_W,y:r()*MAP_H,rad,rot:r()*3,col:['#2f5c3d22','#1d3a2822','#4a5a3022','#3a4a2a22'][i%4]})}
 for(let k=0;k<5;k++)F.lakes.push({x:r()*MAP_W,y:r()*MAP_H,rad:90+r()*160,rot:r()*3});
 for(let k=0;k<14;k++)F.trails.push({p:[r()*MAP_W,r()*MAP_H,r()*MAP_W,r()*MAP_H,r()*MAP_W,r()*MAP_H,r()*MAP_W,r()*MAP_H],wide:k<7});
 for(let i=0;i<1700;i++)F.flowers.push({x:r()*MAP_W,y:r()*MAP_H,w:2+r()*3,h:2+r()*3,col:['#7ac26a55','#e8d36a66','#c46a8a55','#9ad8ff44'][i%4]});
 terrain={F,tiles:new Map(),cols:Math.ceil(MAP_W/TS),rows:Math.ceil(MAP_H/TS)};
 return terrain;
}
function makeTile(ix,iy){
 const F=terrain.F,x0=ix*TS,y0=iy*TS,c=document.createElement('canvas');c.width=c.height=TS;const g=c.getContext('2d');
 g.translate(-x0,-y0);
 const gr=g.createLinearGradient(0,0,MAP_W,MAP_H);gr.addColorStop(0,'#254a34');gr.addColorStop(.5,'#2b5238');gr.addColorStop(1,'#223f2c');g.fillStyle=gr;g.fillRect(x0,y0,TS,TS);
 const hit=(x,y,r)=>x+r>x0&&x-r<x0+TS&&y+r>y0&&y-r<y0+TS;
 for(const b of F.blots)if(hit(b.x,b.y,b.rad)){g.fillStyle=b.col;g.beginPath();g.ellipse(b.x,b.y,b.rad,b.rad*.6,b.rot,0,TAU);g.fill()}
 for(const l of F.lakes)if(hit(l.x,l.y,l.rad)){g.fillStyle='#1d4a5a88';g.beginPath();g.ellipse(l.x,l.y,l.rad,l.rad*.55,l.rot,0,TAU);g.fill();g.strokeStyle='#8ad0e044';g.lineWidth=4;g.stroke()}
 g.lineCap='round';
 for(const t of F.trails){g.strokeStyle=t.wide?'#6a5a3c55':'#8a7a5a22';g.lineWidth=t.wide?50:20;g.beginPath();g.moveTo(t.p[0],t.p[1]);g.bezierCurveTo(t.p[2],t.p[3],t.p[4],t.p[5],t.p[6],t.p[7]);g.stroke()}
 for(const f of F.flowers)if(f.x>=x0&&f.x<x0+TS&&f.y>=y0&&f.y<y0+TS){g.fillStyle=f.col;g.fillRect(f.x,f.y,f.w,f.h)}
 g.strokeStyle='#0a1a10';g.lineWidth=24;g.strokeRect(0,0,MAP_W,MAP_H);
 return c;
}
function drawTerrain(){
 if(!terrain)return;
 const x0=Math.max(0,Math.floor((-ox/scale)/TS)),x1=Math.min(terrain.cols-1,Math.floor(((cw-ox)/scale)/TS));
 const y0=Math.max(0,Math.floor((-oy/scale)/TS)),y1=Math.min(terrain.rows-1,Math.floor(((ch-oy)/scale)/TS));
 for(let iy=y0;iy<=y1;iy++)for(let ix=x0;ix<=x1;ix++){
  const k=iy*terrain.cols+ix;let t=terrain.tiles.get(k);if(!t){t=makeTile(ix,iy);terrain.tiles.set(k,t)}
  ctx.drawImage(t,ix*TS,iy*TS,TS+1,TS+1);
 }
}
function paintObstacle(o){
 ctx.save();
 ctx.fillStyle='#06100c66';ctx.beginPath();ctx.ellipse(o.x,o.y+o.r*.7,o.r*1.1,o.r*.45,0,0,TAU);ctx.fill();
 if(o.kind==='tree'){ctx.fillStyle='#4a3420';ctx.fillRect(o.x-5,o.y-4,10,o.r*.9);ctx.fillStyle='#1c4a2a';ctx.beginPath();ctx.arc(o.x,o.y-o.r*.5,o.r*1.05,0,TAU);ctx.fill();ctx.fillStyle='#2d6a3c';ctx.beginPath();ctx.arc(o.x-o.r*.25,o.y-o.r*.75,o.r*.6,0,TAU);ctx.fill();ctx.fillStyle='#4a8a50';ctx.beginPath();ctx.arc(o.x-o.r*.35,o.y-o.r*.9,o.r*.28,0,TAU);ctx.fill()}
 else{ctx.fillStyle='#5c6068';ctx.beginPath();ctx.ellipse(o.x,o.y-o.r*.1,o.r,o.r*.8,0,0,TAU);ctx.fill();ctx.fillStyle='#8a8f98';ctx.beginPath();ctx.ellipse(o.x-o.r*.2,o.y-o.r*.35,o.r*.55,o.r*.4,0,0,TAU);ctx.fill();ctx.fillStyle='#3a3d44';ctx.fillRect(o.x-o.r*.8,o.y+o.r*.35,o.r*1.6,3)}
 ctx.restore();
}

/* ------------------------------ zona ------------------------------ */
function nextZoneTarget(from,rt){
 // novo círculo totalmente dentro do atual, em ponto aleatório do mapa
 for(let i=0;i<40;i++){
  const x=rnd(rt*.6,MAP_W-rt*.6),y=rnd(rt*.6,MAP_H-rt*.6),dx=x-from.x,dy=y-from.y,d=Math.hypot(dx,dy),max=Math.max(0,from.r-rt);
  if(d<=max)return{x,y,r:rt};
  if(i>30){const k=max/d;return{x:from.x+dx*k,y:from.y+dy*k,r:rt}}
 }
 return{x:from.x,y:from.y,r:rt};
}
function startZonePhase(i){
 const z=R.zone;z.phase=i;z.state='wait';z.t=0;z.from={x:z.c.x,y:z.c.y,r:z.c.r};z.to=nextZoneTarget(z.c,ZONES[i].r);
 if(i>0){
  banner('ZONA FECHANDO PARA OUTRO PONTO','Veja o círculo branco no mapa','zone');
  // suprimentos no novo centro
  for(let k=0;k<2;k++)dropFood(k?'meat':'apple',z.to.x+rnd(-70,70),z.to.y+rnd(-70,70));
 }else banner('A PARTIDA COMEÇOU','Sem habilidades: mate monstros, suba de nível e libere uma por ponto','intro');
}
function updateZone(dt){
 const z=R.zone;
 if(z.phase>=ZONES.length)return;
 const P=ZONES[z.phase];z.t+=dt;
 if(z.state==='wait'){if(z.t>=P.wait){z.state='shrink';z.t=0;banner('A ZONA ESTÁ FECHANDO','Corra para dentro do círculo','zone')}}
 else{
  const k=clamp(z.t/P.shrink,0,1);
  z.c={x:z.from.x+(z.to.x-z.from.x)*k,y:z.from.y+(z.to.y-z.from.y)*k,r:z.from.r+(z.to.r-z.from.r)*k};
  if(k>=1){z.c={...z.to};
   if(z.phase+1<ZONES.length)startZonePhase(z.phase+1);
   else{z.phase=ZONES.length;z.state='final'}}
 }
}
const gasDps=()=>{const z=R.zone;const P=ZONES[Math.min(z.phase,ZONES.length-1)];return P.dps*(z.state==='shrink'||z.phase>=ZONES.length?1.4:1)};
const inZone=a=>Math.hypot(a.x-R.zone.c.x,a.y-R.zone.c.y)<=R.zone.c.r-8;

/* ------------------------------ XP, nível e habilidades ------------------------------ */
function initRoy(a,isBot){
 a.roy={lv:1,xp:0,pts:0,unlocked:new Set(),kills:0,bot:isBot,name:a.label,dead:false,place:0};
}
function lvOfXp(xp){let lv=1;for(let i=1;i<LV_XP.length;i++)if(xp>=LV_XP[i])lv=i+1;return lv}
function canUnlock(a,id){
 const ro=a.roy;if(!ro||ro.pts<=0||ro.unlocked.has(id))return false;
 const idx=a.kit.indexOf(id);if(idx<0)return false;
 if(idx===5)return a.kit.slice(0,5).every(k=>ro.unlocked.has(k));
 return true;
}
function unlock(a,id){
 if(!canUnlock(a,id))return false;
 a.roy.unlocked.add(id);a.roy.pts--;
 if(a===p){toast('Habilidade liberada: '+skills[id].name)}
 ring(a.x,a.y,60,'#f2ca5c',.5);spark(a.x,a.y,'#f2ca5c',12);
 return true;
}
function botUnlock(a){
 const ro=a.roy;let n=0;
 while(ro.pts>0&&n++<7){
  const pool=a.kit.slice(0,5).filter(id=>!ro.unlocked.has(id));
  const id=pool.length?pool[Math.floor(Math.random()*pool.length)]:a.kit[5];
  if(!unlock(a,id))break;
 }
}
function addXP(a,xp){
 const ro=a.roy;if(!ro||a.hp<=0||ro.lv>=MAX_LV&&false)return;
 ro.xp+=xp;
 const lv=Math.min(MAX_LV,lvOfXp(ro.xp));
 while(ro.lv<lv){
  ro.lv++;
  if(ro.lv<=SKILL_LV)ro.pts++;
  else{const gain=Math.round(1000*LV_BONUS.hp);a.max+=gain;a.hp+=gain;ro.dmgMul=1+LV_BONUS.dmg*(ro.lv-SKILL_LV);if(a===p)toast('Nível '+ro.lv+': +vida e +dano')}
  const heal=a.max*.2;a.hp=Math.min(a.max,a.hp+heal);
  float(a.x,a.y-70,'NÍVEL '+ro.lv+(ro.lv>SKILL_LV?' · +VIDA/DANO':'!'),'#f2ca5c');ring(a.x,a.y,70,'#f2ca5c',.6);spark(a.x,a.y,'#f2ca5c',18);
  if(a===p){if(ro.lv<=SKILL_LV)toast('Nível '+ro.lv+' · 1 ponto: toque numa habilidade para liberar');combatSound?.('heal',1)}
 }
 if(ro.bot)botUnlock(a);
}

/* ------------------------------ monstros ------------------------------ */
function spawnMonster(tier,x,y){
 const cfg=MON[tier],defs=ArcadeAPI.roster(),def=defs[Math.floor(Math.random()*defs.length)];
 const L=ArcadeAPI.mobLooks(def)[MON_LOOK[tier]],names=[...ArcadeAPI.THEMES[def.id].names,ArcadeAPI.ELITE[def.id].name];
 const a=actor(x,y,[],def.color||'#c04bff');
 a.team=99;a.boss=true;a.trainingDummy=true;a.skin=0;a.r=cfg.r;a.max=a.hp=cfg.hp;a.inv=.2;
 a.label=names[MON_LOOK[tier]];
 a.rmob={tier,cfg,look:L,cd:rnd(.5,1.5),windup:0,t:0,face:Math.PI,walk:Math.random()*6,home:{x,y},wander:{x:x,y:y,t:0},flash:0,target:null,aggro:false};
 actors.push(a);R.mobs.push(a);
 return a;
}
function pickSpot(minFrom,inside,maxR){
 for(let i=0;i<80;i++){
  let x,y;
  if(inside){const z=R.zone.c,an=rnd(0,TAU),d=Math.sqrt(Math.random())*(z.r-80);x=z.x+Math.cos(an)*d;y=z.y+Math.sin(an)*d}
  else{x=rnd(120,MAP_W-120);y=rnd(120,MAP_H-120)}
  if(x<80||y<80||x>MAP_W-80||y>MAP_H-80)continue;
  if(blocked(x,y,30))continue;
  if(maxR&&Math.hypot(x-CX,y-CY)>maxR)continue;           // monstros fortes ficam perto do centro; as bordas têm só os fracos
  if(players().some(a=>a.hp>0&&Math.hypot(a.x-x,a.y-y)<minFrom))continue;
  return{x,y};
 }
 return{x:CX+rnd(-200,200),y:CY+rnd(-200,200)};
}
function nearestRoy(a,maxD){let best=null,bd=maxD;for(const t of alive()){const d=Math.hypot(t.x-a.x,t.y-a.y);if(d<bd){bd=d;best=t}}return best?{t:best,d:bd}:null}
function monsterAI(dt,a){
 const m=a.rmob;if(!m||a.hp<=0)return;
 a.moving=false;
 const cfg=m.cfg;
 if(!nearestRoy(a,1400)&&a.hitReact<=0)return;           // ninguém por perto: não gasta processamento
 m.walk+=dt*6;m.flash=Math.max(0,m.flash-dt);
 if(a.hitReact>.01){m.windup=0;m.t=0;return}
 if(m.windup>0){
  m.t+=dt;const T=m.target;
  if(T&&T.hp>0)a.a=Math.atan2(T.y-a.y,T.x-a.x);
  if(!m.done&&m.t/m.windup>=.55){
   m.done=true;
   const ang=a.a,radius=m.tier==='b'?cfg.reach+14:cfg.reach+8;
   for(const t of alive()){
    const d=Math.hypot(t.x-a.x,t.y-a.y);if(d>radius+t.r)continue;
    const an=Math.atan2(t.y-a.y,t.x-a.x);if(m.tier!=='b'&&Math.cos(an-ang)<.15)continue;
    hit(t,cfg.dmg,a,m.tier==='b'?30:10,an,-1);
   }
   if(m.tier==='b'){ring(a.x,a.y,radius,'#ffffff',.45)}else spark(a.x+Math.cos(ang)*28,a.y+Math.sin(ang)*28,'#ffffff',5);
  }
  if(m.t>=m.windup){m.windup=0;m.t=0;m.done=false;m.cd=cfg.cd*rnd(.85,1.3)}
  return;
 }
 m.cd-=dt;
 const q=nearestRoy(a,m.aggro?cfg.aggro*1.8:cfg.aggro);
 let sp=cfg.speed*(a.slow>0?.55:1);
 if(q){
  m.aggro=true;m.target=q.t;const ang=Math.atan2(q.t.y-a.y,q.t.x-a.x);a.a=ang;m.face=ang;
  if(q.d>cfg.reach-8&&a.root<=0){const c=move(a,Math.cos(ang)*sp*dt,Math.sin(ang)*sp*dt);if(c)move(a,Math.cos(ang+1.1)*sp*dt,Math.sin(ang+1.1)*sp*dt);a.moving=true}
  if(m.cd<=0&&q.d<cfg.reach+(m.tier==='b'?6:4)){m.windup=cfg.windup;m.t=0;m.done=false}
 }else{
  m.aggro=false;m.target=null;
  m.wander.t-=dt;
  if(m.wander.t<=0){m.wander={x:m.home.x+rnd(-110,110),y:m.home.y+rnd(-110,110),t:rnd(2.5,5)}}
  const d=Math.hypot(m.wander.x-a.x,m.wander.y-a.y);
  if(d>12){const ang=Math.atan2(m.wander.y-a.y,m.wander.x-a.x);m.face=ang;move(a,Math.cos(ang)*sp*.45*dt,Math.sin(ang)*sp*.45*dt);a.moving=true}
 }
}
function drawMonster(a){
 const m=a.rmob;
 let pose;
 if(a.hp<=0)pose={name:'dead',i:0};
 else if(a.hitReact>0)pose={name:'hit',i:a.hitReact>.08?0:1};
 else if(m.windup>0){const k=clamp(m.t/m.windup,0,.999);pose={name:'punch',i:Math.floor(k*6),side:0}}
 else if(a.moving)pose={name:'walk',i:Math.floor(m.walk)%6};
 else pose={name:'idle',i:Math.floor(clock*4+a.x*.01)%4};
 ctx.save();ctx.translate(a.x,a.y);
 ctx.fillStyle='#06100c99';ctx.beginPath();ctx.ellipse(0,12,m.cfg.r+7,9*m.cfg.scale/2.2,0,0,TAU);ctx.fill();
 if(m.windup>0){const k=clamp(m.t/m.windup,0,1),rad=m.cfg.reach+10;ctx.globalAlpha=.16+.28*k;ctx.fillStyle='#ffd0a0';ctx.beginPath();ctx.arc(0,6,rad,0,TAU);ctx.fill();ctx.globalAlpha=.55;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(0,6,rad,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1}
 ctx.translate(0,10);
 const f=a.flash>0||m.flash>0?'brightness(2.1) saturate(.5)':'';   // sem filtro no estado normal: ctx.filter é muito caro para dezenas de sprites
 BossSprite.paint(ctx,m.look,pose.name,pose.i,{x:0,y:0,scale:m.cfg.scale,flip:Math.cos(m.face)<0,side:pose.side||0,filter:f});
 ctx.restore();
 if(a.hp<a.max){const w=m.tier==='b'?40:28;ctx.save();ctx.translate(a.x,a.y-(m.tier==='b'?86:60));ctx.fillStyle='#10061be0';ctx.fillRect(-w/2,0,w,6);ctx.fillStyle=m.tier==='b'?'#ff9a5a':'#e86a6a';ctx.fillRect(-w/2+1,1,(w-2)*clamp(a.hp/a.max,0,1),4);ctx.restore()}
}

/* ------------------------------ comida ------------------------------ */
function dropFood(kind,x,y){R.food.push({kind,x:clamp(x,60,MAP_W-60),y:clamp(y,60,MAP_H-60),t:Math.random()*6})}
function updateFood(dt){
 for(const f of R.food){
  f.t+=dt;if(f.taken)continue;
  for(const a of alive()){
   if(a.hp<a.max&&Math.hypot(a.x-f.x,a.y-f.y)<30){
    f.taken=true;const fd=FOODS[f.kind],amt=Math.round(a.max*fd.heal);a.hp=Math.min(a.max,a.hp+amt);
    float(a.x,a.y-60,'+'+amt,'#9dffb0');ring(a.x,a.y,50,'#9dffb0',.45);
    break;
   }
  }
 }
 R.food=R.food.filter(f=>!f.taken);
}
function paintFood(f){
 const bob=Math.sin(f.t*3)*2.5;
 ctx.save();ctx.translate(f.x,f.y);ctx.fillStyle='#06100c88';ctx.beginPath();ctx.ellipse(0,5,12,4,0,0,TAU);ctx.fill();
 ctx.translate(0,-9+bob);const px=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h)};
 if(f.kind==='apple'){px(-6,-6,12,12,'#c8322a');px(-7,-4,14,8,'#c8322a');px(-4,-5,4,3,'#ff7a6a');px(-1,-10,2,5,'#5a3a1a');px(1,-10,5,3,'#4fb04a')}
 else{px(-9,-7,16,14,'#a85a2a');px(-7,-9,12,18,'#a85a2a');px(-5,-8,5,4,'#e09a5a');px(7,-4,8,3,'#f2ead0');px(14,-6,3,7,'#f2ead0')}
 ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35+.25*Math.sin(f.t*5);ctx.fillStyle='#9dffb0';ctx.fillRect(-1,-22,2,5);
 ctx.restore();
}

/* ------------------------------ avisos e HUD ------------------------------ */
function banner(big,small,kind){
 let el=document.getElementById('royBanner');
 if(!el){el=document.createElement('div');el.id='royBanner';el.setAttribute('role','status');document.getElementById('battle').appendChild(el)}
 el.className='';void el.offsetWidth;el.innerHTML=`<b>${big}</b>${small?`<small>${small}</small>`:''}`;el.className='show '+(kind||'');
}
function feed(text,mine){
 R.feed.unshift({text,t:0,mine});R.feed=R.feed.slice(0,4);renderFeed();
}
function renderFeed(){
 const el=document.getElementById('royFeed');if(!el||!R)return;
 el.innerHTML=R.feed.map(f=>`<div class="${f.mine?'mine':''}">${f.text}</div>`).join('');
}
function ensureHud(){
 let h=document.getElementById('royHud');
 if(!h){
  h=document.createElement('div');h.id='royHud';
  h.innerHTML=`<div class="roy-top"><canvas id="royMap" width="80" height="62" aria-label="Minimapa"></canvas>
   <div class="roy-lv"><div class="roy-row"><b id="royLv">NV 1</b><em id="royPts" hidden></em></div><i><u id="royXp"></u></i><small id="royXpT"></small></div></div><div id="royFeed" aria-live="polite"></div>`;
  document.getElementById('battle').appendChild(h);
 }
 h.hidden=false;return h;
}
function hudUpdate(){
 const ro=p.roy;if(!ro)return;
 const next=ro.lv>=MAX_LV?null:LV_XP[ro.lv],prev=LV_XP[ro.lv-1];
 const q=id=>document.getElementById(id);
 q('royLv').textContent='NV '+ro.lv+(ro.lv>=MAX_LV?' MÁX':'');
 q('royXp').style.width=(next?100*(ro.xp-prev)/(next-prev):100)+'%';
 q('royXpT').textContent=next?`${ro.xp-prev}/${next-prev}`:'máx';
 const pts=q('royPts');pts.hidden=ro.pts<=0;if(ro.pts>0)pts.textContent='★ '+ro.pts;
 // botões das habilidades
 document.querySelectorAll('#equipped .skill').forEach((el,i)=>{
  const id=p.kit[i],un=ro.unlocked.has(id),can=canUnlock(p,id);
  el.classList.toggle('roy-lock',!un);el.classList.toggle('roy-can',can);
  el.dataset.royUlt=i===5?'1':'';
 });
 // minimapa
 const c=q('royMap'),g=c.getContext('2d'),sx=c.width/MAP_W,sy=c.height/MAP_H;
 g.clearRect(0,0,c.width,c.height);g.fillStyle='#0b1a12cc';g.fillRect(0,0,c.width,c.height);
 g.save();g.beginPath();g.rect(0,0,c.width,c.height);g.clip();
 const z=R.zone;
 g.fillStyle='#8a2a4a55';g.fillRect(0,0,c.width,c.height);
 g.globalCompositeOperation='destination-out';g.beginPath();g.ellipse(z.c.x*sx,z.c.y*sy,z.c.r*sx,z.c.r*sy,0,0,TAU);g.fill();g.globalCompositeOperation='source-over';
 g.fillStyle='#2a5a3a66';g.beginPath();g.ellipse(z.c.x*sx,z.c.y*sy,z.c.r*sx,z.c.r*sy,0,0,TAU);g.fill();
 g.strokeStyle='#ffffffcc';g.lineWidth=1;g.beginPath();g.ellipse(z.c.x*sx,z.c.y*sy,z.c.r*sx,z.c.r*sy,0,0,TAU);g.stroke();
 if(z.state==='wait'&&z.to){g.setLineDash([3,3]);g.strokeStyle='#fff';g.beginPath();g.ellipse(z.to.x*sx,z.to.y*sy,z.to.r*sx,z.to.r*sy,0,0,TAU);g.stroke();g.setLineDash([])}
 // raio de detecção (rivais fora dele ficam escondidos)
 g.strokeStyle='#ffffff30';g.lineWidth=1;g.beginPath();g.ellipse(p.x*sx,p.y*sy,RADAR*sx,RADAR*sy,0,0,TAU);g.stroke();
 for(const a of radar()){const d=Math.hypot(a.x-p.x,a.y-p.y);g.globalAlpha=clamp(1.15-d/(RADAR*1.25),.35,1);g.fillStyle='#ff6a6a';g.fillRect(a.x*sx-1.5,a.y*sy-1.5,3,3)}
 g.globalAlpha=1;
 g.fillStyle='#fff';g.fillRect(p.x*sx-2.5,p.y*sy-2.5,5,5);g.strokeStyle='#f2ca5c';g.strokeRect(p.x*sx-3.5,p.y*sy-3.5,7,7);
 g.restore();
}

/* ------------------------------ criação da partida ------------------------------ */
const prevPrepare=prepareArenaMode;
prepareArenaMode=function(){
 prevPrepare();
 if(arenaModeId!=='survival'||!modeRun)return;
 const ids=CHAMPIONS.map(c=>c.id).filter(id=>id!==p.skin).sort(()=>Math.random()-.5);
 const names=NAMES.slice().sort(()=>Math.random()-.5);
 const start=Math.random()*TAU,mine=Math.floor(Math.random()*8);
 const spots=[...Array(8)].map((_,i)=>{const an=start+i*TAU/8;return{x:CX+Math.cos(an)*1180,y:CY+Math.sin(an)*920}});
 actors=[p];
 R=modeRun.roy={t:0,zone:{phase:0,state:'wait',t:0,c:{x:CX,y:CY,r:R0},from:{x:CX,y:CY,r:R0},to:{x:CX,y:CY,r:R0}},mobs:[],food:[],corpses:[],feed:[],kills:0,over:false,placement:0,alive:8,tagT:0};
 p.team=0;p.label=account.profile?.name||'Você';p.max=p.hp=1000;p.x=spots[mine].x;p.y=spots[mine].y;p.inv=2;initRoy(p,false);
 let k=0;
 for(let i=0;i<8;i++){
  if(i===mine)continue;
  const c=ids[k%ids.length];
  const a=spawnModeActor(i+1,names[k%names.length],spots[i].x,spots[i].y,1000,[...CHAMPIONS[c].kit]);
  a.skin=c;a.champion=c;a.kit=[...CHAMPIONS[c].kit];a.cd=a.cd.map(()=>0);a.inv=2;
  actors.push(a);initRoy(a,true);k++;
 }
 for(const [t,n] of [['s',38],['m',24],['e',12],['b',10]])for(let i=0;i<n;i++){const sp=pickSpot(360,false,MAXR[t]);spawnMonster(t,sp.x,sp.y)}
 startZonePhase(0);
 p.cd=p.cd.map(()=>0);
 R.layoutId=layout&&layout.id;
};
const prevConfigure=configureArenaSize;
configureArenaSize=function(){
 prevConfigure();
 if(arenaModeId==='survival'&&battleActivity!=='training'){W=MAP_W;H=MAP_H;layout=makeLayout();pillars=layout.pillars.map(o=>({x:o.x,y:o.y,r:o.r}))}
};
const prevBG=buildArenaBackground;
buildArenaBackground=function(){
 if(arenaModeId!=='survival'||battleActivity==='training'||!layout)return prevBG();
 if(groundCache&&groundCache.__roy===layout.id)return;
 buildTerrain();
 groundCache=document.createElement('canvas');groundCache.width=groundCache.height=1;groundCache.__roy=layout.id;   // o chão é desenhado em blocos (drawTerrain)
 pillarCache=document.createElement('canvas');pillarCache.width=pillarCache.height=1;backgroundBuilds++;
};

/* ------------------------------ passo ------------------------------ */
function award(killer,victim,isPlayer){
 const src=killer&&(killer.roy?killer:killer.owner&&killer.owner.roy?killer.owner:null);
 return src;
}
function recent(v){return v.lastHit&&clock-v.lastHit.t<9?v.lastHit.by:null}
function royStep(dt){
 R.t+=dt;modeRun.elapsed+=dt;
 updateZone(dt);updateFood(dt);
 // gás
 const dps=gasDps();
 for(const a of alive()){
  if(!inZone(a)){
   a.hp-=a.max*dps*dt;a.gasFlash=(a.gasFlash||0)+dt;
   if(a.gasFlash>.8){a.gasFlash=0;float(a.x,a.y-56,'GÁS','#ff6aa0')}
  }
 }
 // gás também mata os monstros (eles não renascem)
 for(const a of R.mobs){
  if(a.hp>0&&!inZone(a)){a.hp-=a.max*Math.max(dps,.03)*1.6*dt;a.flash=.08;a.rmob.flash=.08;if(a.hp<=0)a.gasDeath=true}
 }
 // monstros mortos → XP e comida
 for(const a of R.mobs){
  if(a.hp<=0&&!a.dead){
   a.dead=true;const m=a.rmob;
   const stolen=a.gasDeath&&!(a.lastHit&&clock-a.lastHit.t<4);       // morreu no gás sem ninguém ter batido há pouco: sem XP nem comida
   const k=stolen?null:award(recent(a),a);
   R.corpses.push({x:a.x,y:a.y,t:0,look:m.look,scale:m.cfg.scale,r:m.cfg.r,flip:Math.cos(m.face)<0});
   ring(a.x,a.y,46,'#ffffff',.35);spark(a.x,a.y,'#ffe0a0',10);
   if(k){addXP(k,m.cfg.xp);if(k===p)float(a.x,a.y-48,'+'+m.cfg.xp+' XP','#9ad8ff')}
   if(!stolen&&Math.random()<(m.tier==='b'?.7:m.tier==='e'?.4:m.tier==='m'?.3:.18))dropFood(m.tier==='b'||m.tier==='e'?'meat':Math.random()<.5?'meat':'apple',a.x,a.y);
  }
 }
 actors=actors.filter(a=>!(a.rmob&&a.dead));R.mobs=R.mobs.filter(a=>!a.dead);
 for(const c of R.corpses)c.t+=dt;R.corpses=R.corpses.filter(c=>c.t<.9);
 // lutadores derrotados
 for(const a of players()){
  if(a.hp<=0&&!a.roy.dead){
   a.roy.dead=true;
   const left=alive().length;a.roy.place=left+1;
   const k=award(recent(a),a);
   if(k&&k!==a){k.roy.kills++;addXP(k,70+25*a.roy.lv);if(k===p)R.kills++}
   const by=recent(a),cause=k&&k!==a?'player':by&&by.rmob?'mob':'zone';
   R.causes=R.causes||{player:0,mob:0,zone:0};R.causes[cause]++;
   const killerName=cause==='player'?k.roy.name:cause==='mob'?by.label:'a zona';
   feed(`<b>${killerName}</b> eliminou <b>${a.roy.name}</b>`,k===p||a===p);
   ring(a.x,a.y,90,'#ff6a6a',.6);spark(a.x,a.y,'#ff6a6a',24);
   if(a===p){R.deathBy=killerName;R.deathCause=cause}
  }
 }
 // fim
 const left=alive();
 if(window.RoyaleAPI&&RoyaleAPI.noEnd){if(left.length<=1&&!R.over){R.over=true;R.placement=0;modeRun.settled=true;state='end'}return}   // modo de simulação: só termina com 1 vivo
 if(p.hp<=0){if(!R.over){R.over=true;R.placement=p.roy.place||left.length+1;endArenaMode(false)}return}
 if(left.length===1&&left[0]===p){if(!R.over){R.over=true;R.placement=1;endArenaMode(true)}return}
 if(time<=0){if(!R.over){R.over=true;const sorted=[...left].sort((a,b2)=>b2.hp-a.hp);R.placement=sorted.indexOf(p)+1;endArenaMode(R.placement===1)}}
}
const prevStep=stepArenaMode;
stepArenaMode=function(dt){
 if(!isRoy())return prevStep(dt);
 return royStep(dt);
};

/* ------------------------------ IA ------------------------------ */
const prevGuardianAI=guardianAI;
guardianAI=function(dt,a){if(a.rmob)monsterAI(dt,a);else prevGuardianAI(dt,a)};
const offscreen=a=>{const m=120,l=-ox/scale-m,r=(cw-ox)/scale+m,t=-oy/scale-m-80,b2=(ch-oy)/scale+m;return a.x<l||a.x>r||a.y<t||a.y>b2};
const prevDrawActor=integratedDrawActor;
integratedDrawActor=function(a){if(isRoy()&&a!==p&&offscreen(a))return;return prevDrawActor(a)};
const prevDrawGuardian=drawGuardian;
drawGuardian=function(a){if(a.rmob)drawMonster(a);else prevDrawGuardian(a)};
const prevAI=ai;
const free=a=>!a.guard&&a.cast<=0&&a.root<=0&&a.dash<=0&&a.dodgeTime<=0;
function goTo(a,x,y,dt,sp=145){const ang=Math.atan2(y-a.y,x-a.x);const c=move(a,Math.cos(ang)*sp*dt,Math.sin(ang)*sp*dt);if(c)move(a,Math.cos(ang+1.1)*sp*dt,Math.sin(ang+1.1)*sp*dt);a.a=ang;a.moving=true}
function botMelee(dt,a,t){
 // sem habilidade liberada o bot luta só com o golpe básico, de perto (a IA padrão de campeões à distância nunca chegaria perto)
 const d=Math.hypot(t.x-a.x,t.y-a.y),ang=Math.atan2(t.y-a.y,t.x-a.x);
 a.a=ang;a.think-=dt;a.moving=false;
 if(free(a)&&d>58)goTo(a,t.x,t.y,dt,140*(a.slow>0?.55:1));
 if(d<76&&typeof basic==='function')basic(a);
 if(a.think<=0){a.think=.45+Math.random()*.3;if(t.rmob?t.rmob.windup>0&&d<110:t.punchTime>0&&d<110){if(Math.random()<.35&&typeof dodge==='function')dodge(a)}}
}
// escolhe o alvo que vale a pena: XP boa e perto; evita monstro grande sem nível; ataca rival fraco ou machucado
function botTarget(a){
 const ro=a.roy,hpf=a.hp/a.max,late=R.zone.phase>=2,aggr=R.zone.phase>=1||R.t>40;   // a partir da 1ª zona fechando, os bots caçam rivais pelo mapa todo
 let best=null,bs=-1e9;
 for(const t of actors){
  if(t===a||t.hp<=0)continue;
  const d=Math.hypot(t.x-a.x,t.y-a.y);if(d>(aggr&&t.roy?3200:900))continue;
  let sc=-d;
  if(t.rmob){
   const m=t.rmob;
   if(m.tier==='b'&&(ro.lv<4||hpf<.55)&&m.target!==a)continue;       // não procura monstro grande sem nível/vida
   if(m.tier==='e'&&(ro.lv<2||hpf<.45)&&m.target!==a)continue;
   sc+=m.cfg.xp*4-(late?260:0);
  }else if(t.roy){
   const rs=t.roy.unlocked.size,ms=ro.unlocked.size;
   if(hpf<.4&&rs>=ms&&d>150)continue;                                 // machucado: não procura briga com igual ou mais forte
   sc+=(late?420:aggr?300:120)+(t.hp<t.max*.5?260:0)+(ms>rs?140:0)-(rs>ms+1?220:0);
  }
  if(sc>bs){bs=sc;best=t}
 }
 return best;
}
ai=function(dt,a=b){
 if(!isRoy()||!a||!a.roy||!a.roy.bot||a.hp<=0)return prevAI(dt,a);
 const z=R.zone.c;
 // 1) fugir do gás (e já ir para dentro enquanto a zona fecha)
 if(!inZone(a)||Math.hypot(a.x-z.x,a.y-z.y)>z.r-40&&R.zone.state==='shrink'){
  if(free(a)){goTo(a,z.x,z.y,dt,150);return}
 }
 const ro=a.roy,hpf=a.hp/a.max,near=nearestFoe(a,120);
 // 1b) muito ferido com monstro em cima: foge (os monstros são mais lentos) em direção à zona/comida
 if(hpf<.38&&free(a)){
  const mon=R.mobs.find(m=>m.hp>0&&Math.hypot(m.x-a.x,m.y-a.y)<230);
  if(mon){let tx=z.x,ty=z.y;let f=null,bd=700;for(const o of R.food){const d=Math.hypot(o.x-a.x,o.y-a.y);if(d<bd){bd=d;f=o}}if(f){tx=f.x;ty=f.y}
   const away=Math.atan2(a.y-mon.y,a.x-mon.x),to=Math.atan2(ty-a.y,tx-a.x),ang=Math.cos(to-away)>0?to:away;
   move(a,Math.cos(ang)*155*dt,Math.sin(ang)*155*dt);a.a=ang;a.moving=true;return}
 }
 // 2) ferido e sem inimigo em cima: vai buscar comida
 if(hpf<.5&&!near&&free(a)){
  let f=null,bd=620;for(const o of R.food){const d=Math.hypot(o.x-a.x,o.y-a.y);if(d<bd){bd=d;f=o}}
  if(f){goTo(a,f.x,f.y,dt,150);return}
 }
 // 3) alvo do momento
 const t=botTarget(a);
 if(!t){
  // 4) sem ninguém por perto: procura monstros (XP) ou anda pela zona
  if(!free(a))return prevAI(dt,a);
  ro.way=ro.way&&clock<ro.way.t&&Math.hypot(ro.way.x-a.x,ro.way.y-a.y)>40?ro.way:null;
  if(!ro.way){
   let m=null,bd=1900;for(const o of R.mobs){if(o.hp<=0)continue;if((o.rmob.tier==='b'&&ro.lv<4)||(o.rmob.tier==='e'&&ro.lv<2))continue;const d=Math.hypot(o.x-a.x,o.y-a.y);if(d<bd){bd=d;m=o}}
   if(m&&inZone(m))ro.way={x:m.x,y:m.y,t:clock+4};
   else{const an=Math.random()*TAU,dd=Math.random()*(z.r*.6);ro.way={x:z.x+Math.cos(an)*dd,y:z.y+Math.sin(an)*dd,t:clock+5}}
  }
  goTo(a,ro.way.x,ro.way.y,dt,145);return;
 }
 // 5) lutar
 if(ro.unlocked.size===0){botMelee(dt,a,t);return}
 const d=Math.hypot(t.x-a.x,t.y-a.y);
 if(d>300&&free(a)){goTo(a,t.x,t.y,dt,145);return}
 return prevAI(dt,a);
};
function nearestFoe(a,r){for(const t of actors){if(t===a||t.hp<=0)continue;if(Math.hypot(t.x-a.x,t.y-a.y)<r&&(t.rmob||t.roy))return t}return null}
// só pode usar as habilidades já liberadas
const prevCast=cast;
let lockToast=0;
cast=function(a,id,manual){
 if(isRoy()&&a&&a.roy&&!a.roy.unlocked.has(id)){
  if(a===p&&performance.now()-lockToast>900){lockToast=performance.now();toast(a.roy.pts>0?'Toque na habilidade para liberar (1 ponto)':'Habilidade bloqueada: suba de nível')}
  return false;
 }
 return prevCast(a,id,manual);
};
// quem causou o dano (para dar a XP)
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 if(isRoy()&&o&&o.roy&&o.roy.dmgMul&&t!==o)n*=o.roy.dmgMul;
 const before=t&&t.hp,r=prevHit(t,n,o,k,an,id);
 if(isRoy()&&t&&o&&o!==t&&t.hp<before)t.lastHit={by:o.roy?o:o.owner&&o.owner.roy?o.owner:o,t:clock};
 return r;
};

/* ------------------------------ liberar habilidade tocando no botão ------------------------------ */
let swallowUntil=0;
function equippedHandler(e){
 if(!isRoy())return;
 const el=e.target.closest&&e.target.closest('#equipped .skill');if(!el)return;
 const i=[...document.querySelectorAll('#equipped .skill')].indexOf(el),id=p.kit[i];
 const now=performance.now();
 if(!p.roy.unlocked.has(id)){
  e.stopPropagation();e.preventDefault();
  if(e.type==='pointerdown'||e.type==='touchstart'||e.type==='mousedown'||e.type==='click'){
   if(now>swallowUntil&&canUnlock(p,id)){unlock(p,id);swallowUntil=now+380;hudUpdate()}
   else if(now>swallowUntil&&now-lockToast>900){lockToast=now;toast(p.roy.pts>0?(i===5?'A ultimate só libera depois das outras 5 habilidades':'Esta não pode ser liberada agora'):'Habilidade bloqueada: suba de nível para ganhar um ponto')}
  }
  return;
 }
 if(now<swallowUntil){e.stopPropagation();e.preventDefault()}   // não deixa o toque que liberou já disparar a habilidade
}
['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup','click'].forEach(t=>document.addEventListener(t,equippedHandler,true));

/* ------------------------------ desenho ------------------------------ */
const prevWorld=drawModeWorld;
drawModeWorld=function(){
 prevWorld();
 if(!isRoy())return;
 drawTerrain();
 const z=R.zone.c;
 ctx.save();
 // gás: tudo fora do círculo (só a parte visível)
 const gx0=-ox/scale-60,gy0=-oy/scale-60,gx1=(cw-ox)/scale+60,gy1=(ch-oy)/scale+60;
 ctx.beginPath();ctx.rect(gx0,gy0,gx1-gx0,gy1-gy0);ctx.arc(z.x,z.y,Math.max(1,z.r),0,TAU,true);
 ctx.fillStyle='#b0206055';ctx.fill('evenodd');
 ctx.strokeStyle='#ff6aa0';ctx.lineWidth=5;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(z.x,z.y,Math.max(1,z.r),0,TAU);ctx.stroke();
 // próxima zona
 const zz=R.zone;
 if(zz.state==='wait'&&zz.to&&zz.phase<ZONES.length){ctx.globalAlpha=.9;ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.setLineDash([22,14]);ctx.lineDashOffset=-clock*40;ctx.beginPath();ctx.arc(zz.to.x,zz.to.y,zz.to.r,0,TAU);ctx.stroke();ctx.setLineDash([])}
 ctx.restore();
};
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(!isRoy())return list;
 const vx0=-ox/scale-80,vx1=(cw-ox)/scale+80,vy0=-oy/scale-120,vy1=(ch-oy)/scale+80;
 // corte: o motor base desenha tudo, mesmo o que está a milhares de pixels da câmera; aqui só o que pode aparecer
 for(let i=list.length-1;i>=0;i--){const e=list[i];if(e.kind==='pillar'||e.y<vy0-260||e.y>vy1+260)list.splice(i,1)}
 for(const o of layout.pillars)if(o.x>vx0&&o.x<vx1&&o.y>vy0&&o.y<vy1)list.push({kind:'roy-obs',y:o.y+o.r*.6,priority:2,paint(){paintObstacle(o)}});
 for(const f of R.food)list.push({kind:'roy-food',y:f.y,priority:1,paint(){paintFood(f)}});
 for(const c of R.corpses)list.push({kind:'roy-corpse',y:c.y-1,priority:0,paint(){
  const k=clamp(c.t/.9,0,1);ctx.save();ctx.translate(c.x,c.y);ctx.globalAlpha=(1-k)*(Math.floor(c.t*18)%2?.55:1);ctx.translate(0,10);
  BossSprite.paint(ctx,c.look,'dead',0,{scale:c.scale,flip:c.flip,filter:'brightness('+(1+(1-k)*1.4)+')'});ctx.restore()}});
 // nome, nível e vida dos lutadores
 for(const a of alive()){
  if(a===p)continue;
  list.push({kind:'roy-tag',y:a.y+2,priority:8,paint(){
   ctx.save();ctx.translate(a.x,a.y-64);
   ctx.fillStyle='#10061be0';ctx.fillRect(-24,0,48,6);ctx.fillStyle='#e86a6a';ctx.fillRect(-23,1,46*clamp(a.hp/a.max,0,1),4);
   ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.strokeText(a.roy.name+' · '+a.roy.lv,0,-4);ctx.fillStyle='#fff';ctx.fillText(a.roy.name+' · '+a.roy.lv,0,-4);
   ctx.restore()}});
 }
 return list.sort((x,y)=>x.y-y.y||(x.priority||0)-(y.priority||0));
};
const prevCam=updateArenaCamera;
updateArenaCamera=function(){
 if(!isRoy()||!cw||!ch)return prevCam();
 const top=window.battleTop?battleTop():(ch<520?58:88);
 scale=clamp(Math.min(cw/1000,(ch-top)/560),.6,1.4);
 const vw=cw/scale,vh=(ch-top)/scale;
 const fx=clamp(p.x,vw/2,MAP_W-vw/2),fy=clamp(p.y,vh/2,MAP_H-vh/2);
 ox=cw/2-fx*scale;oy=top+(ch-top)/2-fy*scale;
};
const prevHUD=modeHUD;
modeHUD=function(){
 prevHUD();
 if(!isRoy())return;
 const el=$('#modeObjective'),z=R.zone;
 let zt;
 if(z.phase>=ZONES.length)zt='zona final';
 else{const P=ZONES[z.phase],rest=Math.max(0,Math.ceil((z.state==='wait'?P.wait:P.shrink)-z.t));zt=(z.state==='wait'?'zona fecha em ':'fechando · ')+Math.floor(rest/60)+':'+String(rest%60).padStart(2,'0')}
 el.hidden=false;el.textContent=`Sobrevivência · ${alive().length}/8 vivos · ☠ ${R.kills} · ${zt}`;
 const mid=$('.mid-hud small');if(mid)mid.textContent='ROYALE';
};
const prevUI=updateUI;
updateUI=function(){
 prevUI();
 if(!isRoy()||!p||!p.roy)return;
 ensureHud();hudUpdate();
 const hp=document.querySelector('#bhp');
 const t=enemy(p);if(t&&t.rmob&&hp)hp.textContent=Math.ceil(100*Math.max(0,t.hp)/t.max)+'%';
 if(t&&t.rmob){const er=document.querySelector('#enemyResource');if(er)er.textContent='MONSTRO'}
};
const prevStart=start;
start=function(){
 const r=prevStart.apply(this,arguments);
 const h=document.getElementById('royHud');
 if(isRoy()){
  $('#teamHud').hidden=true;$('#battle').dataset.arena='survival';
  const eb=document.querySelector('#outcome .eyebrow');if(eb)eb.textContent='SOBREVIVÊNCIA ENCERRADA';
  ensureHud();renderFeed();
  setTimeout(()=>{if(isRoy())banner('SOBREVIVÊNCIA','8 lutadores · só um fica de pé','intro')},50);
 }else if(h)h.hidden=true;
 return r;
};
const prevEnd=endArenaMode;
endArenaMode=function(win,draw){
 if(!isRoy()||modeRun.settled)return prevEnd(win,draw);
 const place=R.placement||(win?1:alive().length+1),kills=R.kills,lv=p.roy.lv,sec=Math.round(modeRun.elapsed);
 prevEnd(win,draw);
 // bônus por colocação e abates (respeita o limite diário de moedas)
 const bonus=(place===2?60:place===3?30:0)+kills*10;
 let extra=0;
 if(bonus>0){try{extra=awardMatchCoins(bonus);saveAccount()}catch{}}
 const mmss=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
 const medal=['','🥇','🥈','🥉'][place]||'';
 $('#resultTitle').textContent=place===1?'🥇 1º LUGAR · ÚLTIMO EM PÉ!':`${medal?medal+' ':''}${place}º LUGAR`;
 const why=place===1?'Você venceu os 7 rivais.':R.deathCause==='zone'?'A zona pegou você.':R.deathCause==='mob'?`${R.deathBy} derrubou você.`:`${R.deathBy||'Alguém'} eliminou você.`;
 $('#resultText').textContent=`Sobrevivência · ${why} Nível ${lv}, ${kills} abate${kills===1?'':'s'}.${extra?` Bônus: +${extra} moedas.`:''} `+$('#resultText').textContent.replace(/^[^·]*·\s*/,'');
 $('#stats').innerHTML=`<span>${place}º de 8</span><span>${mmss(sec)}</span><span>${kills} abates</span><span>NV ${lv}</span>`;
 const h=document.getElementById('royHud');if(h)h.hidden=true;
};
document.addEventListener('click',e=>{if(e.target.closest('#leave,#change,#rematch')){const h=document.getElementById('royHud');if(h)h.hidden=true}});

window.RoyaleAPI={
 noEnd:false,
 get R(){return R},ZONES,LV_XP,MON,MAP_W,MAP_H,
 canUnlock,unlock,addXP,spawnMonster,alive,players,inZone,radar,RADAR,
 gasDps:()=>R?gasDps():0
};
})();
