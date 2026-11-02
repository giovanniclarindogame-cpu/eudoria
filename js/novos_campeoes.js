'use strict';
const NOVOS_DOJO4=[
 {key:'spark',name:'Herdeiro da Centelha',subtitle:'O poder que cresce a cada passo',ref:'Força acumulada · mobilidade · controle',color:'#65e1b4',skills:[
 ['Estalo de Pressão','Projeta uma lâmina de ar eletrificado. 70 de dano; alcance 350. Sai da mão depois do soco.',16,4,350,'arrow','bolt',70,.32,.75],
 ['Laço das Sombras','Estende um chicote escuro até 290. Causa 45 de dano e puxa o alvo até 110 unidades, sem atravessar obstáculos.',20,8,290,'arrow','whip',45,.4,.95],
 ['Arranque Cinético','Avança até 240 na direção escolhida. O impacto causa 100 de dano; obstáculos interrompem a investida.',22,8,240,'arrow','dash',100,.32,.95],
 ['Passo Suspenso','Flutua por 3s, ganha 25% de velocidade e evita ataques básicos e projéteis rasteiros. Habilidades de área ainda acertam.',24,12,0,'self','float',0,.35,.8],
 ['Núcleo Pulsante','Eletrifica o corpo por 6s: +25% de dano e +20% de velocidade. A aura acompanha a silhueta sem aumentar o personagem.',28,15,0,'self','power',0,.5,1],
 ['Legado da Tempestade','Acumula energia, avança até 280 e desfere um soco sísmico: 320 de dano em uma área de 105. ULT livre no treino.',45,25,280,'arrow','legacy',320,.8,1.65]]},
 {key:'tide',name:'Corsário da Maré',subtitle:'Nenhuma corrente segura seu ímpeto',ref:'Golpes elásticos · pressão · resistência',color:'#f0b471',skills:[
 ['Punho de Maré','Estica o braço até 310 e recolhe após o contato. Causa 75 de dano e empurra o alvo. Paredes bloqueiam o golpe.',16,4,310,'arrow','stretch',75,.28,.9],
 ['Tambor de Punhos','Dispara seis socos elásticos consecutivos em até 260: 22 de dano por acerto, até 132. A sequência alterna os braços.',24,9,260,'arrow','barrage',22,.32,1.45],
 ['Estilingue do Corsário','Projeta o corpo até o ponto escolhido, no alcance de 280. A chegada causa 85 de dano em uma área de 65; obstáculos interrompem o salto.',22,9,280,'circle','sling',85,.4,1.05],
 ['Couraça de Obsidiana','Reveste os punhos e absorve até 160 de dano por 5s. Ataques básicos causam 15 de dano adicional enquanto a couraça durar.',25,13,0,'self','armor',0,.42,.85],
 ['Ritmo de Vapor','Acelera por 6s: +35% de velocidade e ataques básicos 30% mais rápidos. Vapor circula atrás e à frente do corpo.',28,15,0,'self','steam',0,.45,.9],
 ['Punho do Rei das Marés','Concentra força em um punho colossal envolto em nuvens. Golpeia o ponto escolhido até 340, causando 340 de dano numa área de 115.',45,26,340,'circle','king',340,.95,1.8]]},
 {key:'star',name:'Cavaleiro do Firmamento',subtitle:'Um coração aceso entre as estrelas',ref:'Rajadas · proteção · energia cósmica',color:'#a4cfff',skills:[
 ['Chuva Meteórica','Lança cinco meteoros em sequência na direção da mira. Cada um causa 22 de dano; alcance 390 e até 110 de dano.',20,6,390,'arrow','meteors',22,.3,1.1],
 ['Cometa de Prata','Carrega um cometa concentrado que causa 115 de dano ao primeiro alvo. Alcance 430; paredes bloqueiam.',25,9,430,'arrow','comet',115,.55,1],
 ['Asas do Firmamento','Avança até 230 com um golpe ascendente de 85 de dano. O brilho das asas acompanha o movimento; bloqueado por obstáculos.',20,8,230,'arrow','wings',85,.25,.9],
 ['Égide Estelar','Cria um escudo de 140 pontos por 4s. O primeiro projétil inimigo é refletido; ataques corpo a corpo consomem o escudo normalmente.',25,13,0,'self','aegis',0,.4,.9],
 ['Sétima Centelha','Expande o cosmo por 6s: +30% de dano e recuperação gradual de 90 HP. Sete estrelas orbitam o personagem.',30,16,0,'self','cosmos',0,.55,1],
 ['Constelação Ascendente','Invoca um corcel de energia que atravessa inimigos em linha por até 500. Causa 350 de dano a cada alvo, uma vez; para em barreiras.',45,26,500,'arrow','pegasus',350,.9,1.65]]},
 {key:'steel',name:'Alquimista de Aço',subtitle:'Toda ruína pode ganhar outra forma',ref:'Transmutação · terreno · contra-ataque',color:'#d9b77b',skills:[
 ['Lança Transmutada','Bate as mãos e molda uma lança de aço que viaja até 360, causando 80 de dano ao primeiro alvo.',18,5,360,'arrow','lance',80,.4,.9],
 ['Muralha de Ferrugem','Ergue uma parede no ponto escolhido até 220 por 5s. Bloqueia movimento e ataques dos dois lados; uma parede por vez.',25,11,220,'circle','wall',0,.5,1],
 ['Garra do Subsolo','Espinhos surgem no ponto escolhido até 300. Causam 75 de dano e prendem os inimigos por 1s numa área de 75.',23,9,300,'circle','spikes',75,.55,1.15],
 ['Braço de Mercúrio','Transforma o antebraço em lâmina por 6s. Cada ataque básico acertado produz um corte adicional de 22 de dano.',24,13,0,'self','blade',0,.4,.9],
 ['Reconstrução','Cria um escudo de 90 pontos por 4s e recupera 150 HP ao longo de 3s. O círculo de transmutação acompanha o corpo.',28,15,0,'self','repair',0,.55,1.1],
 ['Catedral de Ferro','Ergue pilares e um punho colossal no ponto escolhido até 330. Após a preparação, esmaga uma área de 120: 330 de dano e 1s de prisão.',45,27,330,'circle','cathedral',330,1,1.9]]}
].map((c,id)=>({...c,id,skills:c.skills.map((s,slot)=>({name:s[0],desc:s[1],cost:s[2],cd:s[3],range:s[4],aim:s[5],type:s[6],damage:s[7],release:s[8],duration:s[9],slot,ultimate:slot===5,art:id*6+slot}))}));

const DOJO_TIMING={
 spark:[[.5,1],[.5,1],[.5,1],[.575,1.15],[.45,.9],[.9,1.8]],
 tide:[[.5,1],[.5,1.6],[.5,1],[.45,.9],[.45,.9],[.9,1.8]],
 star:[[.5,1.3],[.675,1.35],[.55,1.1],[.45,.9],[.5,1],[.9,1.8]],
 steel:[[.5,1],[.5,1],[.65,1.3],[.45,.9],[.55,1.1],[1,1.9]]
};
for(const c of NOVOS_DOJO4)for(const s of c.skills){[s.release,s.duration]=DOJO_TIMING[c.key][s.slot];}


// As 24 técnicas, 28 spritesheets e atlas abaixo são provenientes do Dojo original.
// Nenhuma habilidade dos seis primeiros campeões é reutilizada.
const DOJO4_KEYS=['spark','tide','star','steel'];
const DOJO4_BASE=6;
const DOJO4_SKILL_START=skills.length;
const DOJO4_FILES={};
const DOJO4_FX=[];
for (let k=0;k<4;k++){
 const champion=CHAMPIONS[k+DOJO4_BASE],source=NOVOS_DOJO4[k];
 champion.kit=[];
 champion.ult=source.skills[5].name;
 champion.style=source.ref;
 champion.summary=source.subtitle;
 // A skin deve existir também no cadastro de visuais: validSkin() usa SKINS.length.
 if(!SKINS[k+DOJO4_BASE])SKINS.push({name:champion.name,color:champion.color,desc:champion.summary});
 for(let i=0;i<6;i++){
  const info=source.skills[i],id=DOJO4_SKILL_START+k*6+i;
  champion.kit.push(id);
  const rank=i===5?'S':i>=3?'A':'B';
  const ability={id,name:info.name,desc:info.desc,color:champion.color,
   cost:info.ultimate?0:info.cost,cd:info.ultimate?60:info.cd,range:info.range,
   type:info.ultimate?'Ultimate':info.aim==='self'?'Defesa':info.type==='dash'||info.type==='sling'?'Mobilidade':'Ataque',
   champion:k+DOJO4_BASE,slot:i,ultimate:i===5,rank,dojo4:info};
  skills.push(ability);
  RANK_IDS[rank].push(id);
 }
 DOJO4_FILES[source.key]=`assets/dojo4/${source.key}.webp`;
 DOJO4_FILES[source.key+'-states']=`assets/dojo4/${source.key}-states.webp`;
 for(let i=0;i<6;i++)DOJO4_FILES[source.key+'-'+source.skills[i].type]=`assets/dojo4/${source.key}-${source.skills[i].type}.webp`;
 DOJO4_FILES[source.key+'-fx']=`assets/dojo4/${source.key}-fx.webp`;
}
const DOJO4_IMAGES=new Map(),DOJO4_LOADING=new Set();
function dojo4Image(name){
 if(DOJO4_IMAGES.has(name))return DOJO4_IMAGES.get(name);
 const file=DOJO4_FILES[name];if(!file)return null;
 const im=new Image();DOJO4_IMAGES.set(name,im);im.onerror=()=>console.warn('[Novos campeões] arte indisponível:',file);im.src=file;return im;
}
function dojo4Preload(skin){if(skin<6||skin>9)return;const c=NOVOS_DOJO4[skin-6];dojo4Image(c.key+'-states');dojo4Image(c.key+'-fx');for(const s of c.skills)dojo4Image(c.key+'-'+s.type);}
// One motion controller for gameplay and the standalone preview.
function dojo4Motion(a,t=vfxTime){return EldoriaMotion.sample(a,t);}
const DOJO4_PRIOR_SKIN_PAINT=drawAnimatedFighter;
drawAnimatedFighter=function(g,a,size=72,t=vfxTime){
 if(!a||a.skin<6||a.skin>9)return DOJO4_PRIOR_SKIN_PAINT(g,a,size,t);
 dojo4Preload(a.skin);
 const m=dojo4Motion(a,t),c=NOVOS_DOJO4[a.skin-6];
 const im=dojo4Image(m.source);
 if(!im?.naturalWidth){
  // Enquanto as imagens carregam, exibir personagem provisório sem interromper lógica.
  const fallback=dojo4Image(c.key);
  if(fallback?.naturalWidth){
   const f=m.state==='hurt'?21:m.state==='punch'?23:18;
   g.save();g.drawImage(fallback,(f%6)*128,Math.floor(f/6)*128,128,128,-size*64/85,9-size*118/85,size*128/85,size*128/85);g.restore();
  }else{g.save();g.fillStyle=c.color;g.beginPath();g.ellipse(0,-size*.33,size*.20,size*.32,0,0,Math.PI*2);g.fill();g.restore();}
  return true;
 }
 const factor=size/85,frame=m.frame;
 g.save();g.imageSmoothingEnabled=false;
 // O reflexo horizontal não troca a pose durante o dano e evita inverter o sprite de costas.
 if(m.facing<0)g.scale(-1,1);
 if(m.state==='dodge')g.globalAlpha*=.78;
 if(m.state==='hurt'&&m.progress<.34)g.globalAlpha*=.85+.15*Math.cos(m.progress*Math.PI*4);
 g.translate(m.offsetX||0,m.offsetY||0);
 if(m.tilt)g.rotate(m.tilt);
 g.drawImage(im,(frame%6)*128,Math.floor(frame/6)*128,128,128,-64*factor,9-118*factor,128*factor,128*factor);
 g.restore();return true;
};
const DOJO4_ICON_PREVIOUS=icon;
icon=function(id){const s=skills[id];if(!s||s.champion<6)return DOJO4_ICON_PREVIOUS(id);
 const x=s.slot/5*100,y=(s.champion-6)/3*100;
 return `<span class="dojo-skill-icon dojo4-icon" aria-label="${escapeHTML(s.name)}" style="background-image:url('assets/dojo4/icons.webp');background-size:600% 400%;background-position:${x}% ${y}%;background-repeat:no-repeat"></span>`;
};
// A função principal da Arena e das seis lendas permanece íntegra.
const DOJO4_PRIOR_CAST=castCore;
let dojo4Serial=0;
const dojo4Effects=[];
function dojo4Targets(a,x,y,r,amount,opts={}){
 for(const target of opponents(a))if(target.hp>0&&Math.hypot(target.x-x,target.y-y)<r+target.r&&lineClear({x,y},target)){
  hit(target,amount,a,opts.knock||0,opts.angle??Math.atan2(target.y-y,target.x-x),opts.id??-1);
  if(opts.root)target.root=Math.max(target.root,opts.root);
 }
}
function dojo4Vfx(a,slot,x,y,kind='burst',duration=.6,opts={}){
 dojo4Effects.push({id:++dojo4Serial,skin:a.skin,slot,kind,x,y,ax:a.x,ay:a.y,owner:a,angle:a.a,age:0,duration,...opts});
 if(dojo4Effects.length>90)dojo4Effects.splice(0,dojo4Effects.length-90);
}
function dojo4Ray(a,angle,range){let distance=0;for(let d=5;d<=range;d+=5){if(blocked(a.x+Math.cos(angle)*d,a.y+Math.sin(angle)*d,5))break;distance=d;}return distance;}
function dojo4Destination(a,angle,range){const d=dojo4Ray(a,angle,range);return{x:a.x+Math.cos(angle)*d,y:a.y+Math.sin(angle)*d};}
function dojo4CastStart(a,id,manual){
 const s=skills[id],q=s?.dojo4;
 if(!s||!q||a.skin!==s.champion||!a.kit.includes(id)||state!=='fight'||a.hp<=0||!opponents(a).length||a.cd[id]>0||a.mp<s.cost||a.cast>0||a.skillLock>0||a.actionRecovery>0||a.dash>0||a.guard||a.punchTime>0||a.dodgeTime>0)return false;
 if(s.ultimate&&!canUseUltimate(a)){if(a===p)toast('ULT bloqueada · exige HP ≤20%');return false;}
 const angle=aim(a,manual),e=enemy(a);
 const range=q.range||0;
 const length=range?Math.min(range,manual===undefined?Math.max(65,dist(a,e)):range):0;
 const target=dojo4Destination(a,angle,length),start={x:a.x,y:a.y};
 a.a=angle;a.guard=false;a.mp-=s.cost;a.cd[id]=s.cd;a.cast=q.duration;a.skillLock=Math.max(a.skillLock,q.duration+.10);
 a.dojo4Cast={id,slot:s.slot,key:NOVOS_DOJO4[a.skin-6].key,skill:q,angle,target,start,age:0,released:false,pulses:0,complete:false};
 dojo4Preload(a.skin);
 dojo4Vfx(a,s.slot,a.x,a.y,'charge',q.release,{follow:true});
 if(a===p)toast((s.ultimate?'ULT · ':'')+s.name);
 return true;
}
castCore=function(a,id,manual){if(a?.skin>=6&&a.skin<=9)return dojo4CastStart(a,id,manual);return DOJO4_PRIOR_CAST(a,id,manual)};
const DOJO4_PRIOR_HIT=hit;
hit=function(target,amount,owner,knock=0,angle=0,id=-1){
 if(owner?.skin>=6&&owner.skin<=9){
  if(owner.buff?.dojoPower>0)amount*=1.25;
  if(owner.buff?.dojoCosmos>0)amount*=1.30;
  if(owner.buff?.dojoBlade>0&&amount<=48)amount+=22;
  if(owner.buff?.dojoArmor>0&&amount<=48)amount+=15;
 }
 if(target?.buff?.dojoFloat>0&&owner&&amount<=48)return false;
 return DOJO4_PRIOR_HIT(target,amount,owner,knock,angle,id);
};
function dojo4Release(a,q){
 const s=q.skill,slot=q.slot,key=q.key,type=s.type,angle=q.angle,dmg=s.damage,
  point=q.target, x=point.x,y=point.y, n=Math.min(s.range||350,dojo4Ray(a,angle,s.range||350));
 dojo4Vfx(a,slot,a.x+Math.cos(angle)*22,a.y+Math.sin(angle)*22,'release',.5);
 const launch=(speed,damage,r=13,range=s.range||400,extra={})=>Object.assign(shot(a,angle,speed,damage,r,CHAMPIONS[a.skin].color,range),{art:q.id,...extra});
 const dash=(range,duration=.32,impact=0,radius=65)=>{
  const dest=dojo4Destination(a,angle,range);const travel=dist(a,dest);
  a.dash=duration;a.dashA=angle;a.dashSpeed=travel/duration;a.dashDmg=0;a.dashHit=false;
  dojo4Vfx(a,slot,a.x,a.y,'trail',duration,{follow:true});
  if(impact)delay(duration,()=>{if(a.hp>0){dojo4Targets(a,a.x+Math.cos(angle)*22,a.y+Math.sin(angle)*22,radius,impact,{id:q.id,angle});dojo4Vfx(a,slot,a.x,a.y,'impact',.8);}});
 };
 const mark=(delayTime,radius,amount,opts={})=>{
  telegraph(a,x,y,radius,delayTime,()=>{if(a.hp>0){dojo4Targets(a,x,y,radius,amount,{id:q.id,...opts});dojo4Vfx(a,slot,x,y,'impact',.9,{radius});combatImpact(1.3);}},CHAMPIONS[a.skin].color);
 };
 switch(type){
 // Herdeiro: pressão, agarrão, investida, voo, carga e ultimate sísmica.
 case'bolt':launch(530,dmg,13);break;
 case'whip':{
  const end=dojo4Destination(a,angle,s.range);dojo4Vfx(a,slot,end.x,end.y,'whip',.48,{fromX:a.x,fromY:a.y});
  for(const t of opponents(a))if(lineDistance(t.x,t.y,a.x,a.y,end.x,end.y)<24+t.r&&lineClear(a,t)){
    hit(t,dmg,a,0,angle,q.id);t.root=Math.max(t.root,.5);
    const ad=Math.atan2(a.y-t.y,a.x-t.x),pull=Math.min(110,Math.max(0,dist(a,t)-55));move(t,Math.cos(ad)*pull,Math.sin(ad)*pull);
  }break;
 }
 case'dash':dash(s.range,.32,dmg,50);break;
 case'float':a.buff.dojoFloat=3;a.buff.storm=Math.max(a.buff.storm||0,3);break;
 case'power':a.buff.dojoPower=6;a.buff.storm=Math.max(a.buff.storm||0,6);break;
 case'legacy':dash(s.range,.4,0);delay(.4,()=>{if(a.hp>0){const end={x:a.x+Math.cos(angle)*40,y:a.y+Math.sin(angle)*40};dojo4Targets(a,end.x,end.y,105,dmg,{id:q.id,knock:25,angle});dojo4Vfx(a,slot,end.x,end.y,'impact',1,{radius:105});combatImpact(2);}});break;
 // Corsário: soco elástico, rajada alternada, estilingue, armadura, vapor e punho gigante.
 case'stretch':{
  const end=dojo4Destination(a,angle,s.range);dojo4Vfx(a,slot,end.x,end.y,'stretch',.55,{fromX:a.x,fromY:a.y});
  for(const t of opponents(a))if(lineDistance(t.x,t.y,a.x,a.y,end.x,end.y)<23+t.r&&lineClear(a,t))hit(t,dmg,a,15,angle,q.id);break;
 }
 case'barrage':for(let i=0;i<6;i++)delay(i*.14,()=>{if(a.hp<=0)return;const e=dojo4Destination(a,angle,s.range);dojo4Vfx(a,slot,e.x,e.y,'stretch',.34,{fromX:a.x,fromY:a.y,thin:true});for(const t of opponents(a))if(lineDistance(t.x,t.y,a.x,a.y,e.x,e.y)<22+t.r&&lineClear(a,t))hit(t,dmg,a,0,angle,q.id);});break;
 case'sling':dash(Math.min(s.range,dist(a,point)),.35,dmg,65);break;
 case'armor':a.buff.dojoArmor=5;a.buff.frostShield=Math.max(a.buff.frostShield||0,5);a.shieldHP=Math.max(a.shieldHP||0,160);break;
 case'steam':a.buff.dojoSteam=6;a.buff.storm=Math.max(a.buff.storm||0,6);break;
 case'king':mark(.65,115,dmg,{knock:55,angle});break;
 // Cavaleiro: meteoros, cometa, avanço alado, proteção, cosmo e constelação.
 case'meteors':for(let i=0;i<5;i++)delay(i*.13,()=>{if(a.hp>0){const offset=(i-2)*.025;const projectile=shot(a,angle+offset,560,dmg,10,CHAMPIONS[a.skin].color,s.range);projectile.art=q.id;dojo4Vfx(a,slot,a.x+Math.cos(angle)*30,a.y+Math.sin(angle)*30,'spark',.25);}});break;
 case'comet':launch(490,dmg,21);break;
 case'wings':dash(s.range,.35,dmg,55);break;
 case'aegis':a.buff.frostShield=Math.max(a.buff.frostShield||0,4);a.shieldHP=Math.max(a.shieldHP||0,140);a.buff.reverse=Math.max(a.buff.reverse||0,4);break;
 case'cosmos':a.buff.dojoCosmos=6;for(let i=1;i<=6;i++)delay(i,()=>{if(a.hp>0)heal(a,15)});break;
 case'pegasus':{
  const end=dojo4Destination(a,angle,s.range);dojo4Vfx(a,slot,end.x,end.y,'beam',.9,{fromX:a.x,fromY:a.y,radius:58});
  for(const t of opponents(a))if(lineDistance(t.x,t.y,a.x,a.y,end.x,end.y)<40+t.r&&lineClear(a,t))hit(t,dmg,a,30,angle,q.id);
  break;
 }
 // Alquimista: lança, muralha, espinhos, lâmina, reconstrução, catedral.
 case'lance':launch(510,dmg,14);break;
 case'wall':{
  const vertical=Math.abs(Math.cos(angle))>.7;
  const wall={kind:'wall',x,y,w:vertical?28:140,h:vertical?140:28,owner:a,life:5,color:CHAMPIONS[a.skin].color};
  if(!actors.some(t=>Math.abs(t.x-x)<wall.w/2+t.r&&Math.abs(t.y-y)<wall.h/2+t.r)){
   // Uma muralha própria por vez.
   for(const o of objects)if(o.kind==='wall'&&o.owner===a)o.life=0;
   objects.push(wall);dojo4Vfx(a,slot,x,y,'wall',5,{radius:75});
  }else if(a===p)toast('Não há espaço para erguer a muralha');break;
 }
 case'spikes':mark(.20,75,dmg,{root:1,angle});break;
 case'blade':a.buff.dojoBlade=6;break;
 case'repair':a.buff.frostShield=Math.max(a.buff.frostShield||0,4);a.shieldHP=Math.max(a.shieldHP||0,90);for(let i=1;i<=6;i++)delay(i*.5,()=>{if(a.hp>0)heal(a,25)});break;
 case'cathedral':mark(.45,120,dmg,{root:1,knock:35,angle});break;
 }
}
const DOJO4_PRIOR_STEP=step;
step=function(dt){
 const previous=new Map(actors.filter(a=>a.skin>=6&&a.skin<=9).map(a=>[a,{x:a.x,y:a.y}]));
 DOJO4_PRIOR_STEP(dt);
 if(state!=='fight')return;
 for(const [a,before] of previous)EldoriaMotion.track(a,before);
 for(const a of actors){if(a.skin<6||a.skin>9||a.hp<=0)continue;
  const cast=a.dojo4Cast;if(!cast)continue;
  cast.age+=dt;
  if(!cast.released&&cast.age>=cast.skill.release){cast.released=true;dojo4Release(a,cast);}
  if(cast.age>=cast.skill.duration){a.dojo4Cast=null;}
 }
 for(const e of dojo4Effects)e.age+=dt;
 for(let i=dojo4Effects.length-1;i>=0;i--)if(dojo4Effects[i].age>=dojo4Effects[i].duration)dojo4Effects.splice(i,1);
};
function dojo4PaintEffect(g,e){
 const key=NOVOS_DOJO4[e.skin-6]?.key;if(!key)return;
 const im=dojo4Image(key+'-fx');if(!im?.naturalWidth)return;
 const u=Math.min(1,e.age/e.duration),r=e.radius||100;
 let x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y;
 const imW=im.naturalWidth/4,imH=im.naturalHeight/6;
 let size=e.kind==='charge'?90:e.kind==='wall'?140:e.kind==='impact'?Math.max(120,r*1.8):e.kind==='beam'?170:100;
 g.save();g.imageSmoothingEnabled=false;g.globalAlpha=(1-u*.7)*.93;
 if(['beam','whip','stretch','trail'].includes(e.kind)){
  const fx=e.fromX??e.owner.x,fy=e.fromY??e.owner.y;
  const gradient=g.createLinearGradient(fx,fy,x,y);
  gradient.addColorStop(0,'#f7f4d5');gradient.addColorStop(1,CHAMPIONS[e.skin].color);
  g.strokeStyle=gradient;g.lineWidth=e.kind==='beam'?22:e.kind==='stretch'?(e.thin?8:15):e.kind==='whip'?9:6;
  g.lineCap='round';g.beginPath();g.moveTo(fx,fy-24);g.quadraticCurveTo((fx+x)/2,(fy+y)/2-32,x,y-24);g.stroke();
 }
 if(e.kind==='wall'){
  g.fillStyle='#6d6a5e';g.fillRect(x-64,y-26,128,52);g.strokeStyle='#dec9a2';g.lineWidth=3;g.strokeRect(x-64,y-26,128,52);
 }
 const frame=Math.min(3,Math.floor(u*4)),row=e.slot;
 g.translate(x,y-23);g.rotate(e.angle&&e.kind==='release'?e.angle:0);
 g.drawImage(im,frame*imW,row*imH,imW,imH,-size/2,-size/2,size,size);
 g.restore();
}
const DOJO4_PRIOR_DEPTH=integratedDepth;
integratedDepth=function(){
 const list=DOJO4_PRIOR_DEPTH();
 for(const a of actors){
  if(a.skin<6||a.skin>9||a.hp<=0)continue;
  const active=Object.entries(a.buff||{}).filter(([key,time])=>time>0&&key.startsWith('dojo'));
  for(const [name,time] of active){const types={dojoFloat:3,dojoPower:4,dojoArmor:3,dojoSteam:4,dojoCosmos:4,dojoBlade:3};const slot=types[name];if(slot===undefined)continue;
   list.push({y:a.y+1,priority:3,kind:'dojo4-aura',paint:()=>{
    const im=dojo4Image(NOVOS_DOJO4[a.skin-6].key+'-fx');if(!im?.naturalWidth)return;
    const w=im.naturalWidth/4,h=im.naturalHeight/6,f=Math.floor(vfxTime*12)%4;
    ctx.save();ctx.globalAlpha=.45;ctx.drawImage(im,f*w,slot*h,w,h,a.x-50,a.y-105,100,110);ctx.restore();
   }});
  }
 }
 for(const e of dojo4Effects)list.push({y:e.y+.25,priority:3,kind:'dojo4-effect',paint:()=>dojo4PaintEffect(ctx,e)});
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0)||(a.serial||0)-(b.serial||0));
};
const DOJO4_PRIOR_START=start;
start=function(){dojo4Effects.length=0;const result=DOJO4_PRIOR_START();for(const a of actors)dojo4Preload(a.skin);return result;};
const DOJO4_PRIOR_SPIN=equipChampion;
equipChampion=function(id,navigate=true){const result=DOJO4_PRIOR_SPIN(id,navigate);if(result)dojo4Preload(id);return result;};
window.dojo4QA={advance:dt=>step(dt), motion:dojo4Motion, get definitions(){return NOVOS_DOJO4},get effects(){return dojo4Effects},image:dojo4Image,load:dojo4Preload,cast:dojo4CastStart};

// Mantém a interface de inspeção alinhada às versões atuais das funções.
if(window.arenaQA){window.arenaQA.step=step;window.arenaQA.hit=hit;window.arenaQA.drawAnimatedFighter=drawAnimatedFighter;}
