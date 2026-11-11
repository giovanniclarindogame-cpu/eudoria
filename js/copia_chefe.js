'use strict';
// Ninja das Brumas (Kakashi): o Olho Copiador agora também copia as habilidades do chefe da Caçada.
// Com o olho aberto, a próxima habilidade (não ultimate) do chefe fica guardada assim que ele a lança (ao alcance da vista)
// ou, se ele ainda não a viu, quando o acertar;
// o botão 5 a usa uma vez, com 75% do dano e metade da recarga.
(function(){
 const SCALE=.75;
 // Zorvath não usa o formato genérico `k`; mapeia cada habilidade para uma forma de ataque equivalente.
 const ZK={s0:{kind:'ring',r:130,dmg:60},s1:{kind:'fan',n:1,speed:430,dmg:70,r:14},s2:{kind:'ring',r:150,dmg:80},s3:{kind:'beam',dmg:110},s4:{kind:'ring',r:200,dmg:90}};
 const kindOf=(def,s)=>s.k||(def.id==='zorvath'?ZK[s.id]:null);
 const isUlt=(s,k)=>!k||s.cd>=28||k.kind==='nova'||k.kind==='domain';
 const key=(def,s)=>'boss:'+def.id+':'+s.id;

 // Copia a habilidade `act` do chefe para o ninja `t` (olho aberto, sem cópia guardada).
 function tryCopy(R,t,act){
  try{
   if(!t||t.skin!==1||t.hp<=0||t.copySource||typeof reworkState!=='function')return false;
   if(!act||!/^s\d$/.test(act.id))return false;
   const ts=reworkState(t);if(!(ts.eye>0)||ts.copy)return false;
   const def=R.def,s=def.skills.find(x=>x.id===act.id),k=s&&kindOf(def,s);
   if(!s||isUlt(s,k))return false;
   const id=key(def,s);
   skills[id]={id,name:s.name,type:'Cópia',cost:0,cd:s.cd,range:420,color:def.color||'#c04bff',desc:s.desc,boss:{icon:s.icon,k}};
   ts.copy={id};ts.eye=0;t.cd[t.kit[4]]=0;
   try{rwFx(t,4,t.x,t.y,'copied',.6,{size:80})}catch{}
   if(t===p)toast('Copiado do chefe: '+s.name+' · use 5');
   return true;
  }catch(e){console.error('[Eldoria] cópia do chefe',e);return false}
 }
 // Ao ser atingido (continua valendo).
 function landed(R,t){tryCopy(R,t,R?.act)}
 // Ao VER a habilidade: com o olho aberto e o chefe ao alcance da vista, copia assim que ele começa a lançá-la.
 const SIGHT=520;let lastAct=null;
 function watch(){
  if(typeof state==='undefined'||state!=='fight'||typeof modeRun==='undefined'||!modeRun)return;
  const R=modeRun.hunt||modeRun.gb;if(!R||!R.act){lastAct=null;return}
  if(R.act===lastAct)return;lastAct=R.act;
  const A=R.a;if(!A||A.hp<=0)return;
  for(const t of actors){if(t.team===A.team||t.skin!==1||t.hp<=0)continue;if(Math.hypot(t.x-A.x,t.y-A.y)<=SIGHT)tryCopy(R,t,R.act)}
 }
 setInterval(watch,40);

 function castBoss(a,copy,angle){
  const sk=skills[copy.id]?.boss;if(!sk)return false;
  const k=sk.k,dmg=(k.dmg||60)*SCALE,foe=enemy(a),tx=foe.x,ty=foe.y;
  const slot=4,self={x:a.x,y:a.y};
  switch(k.kind){
   case 'fan':{const n=Math.min(7,k.n||5),sp=k.spread||.8;for(let i=0;i<n;i++){const an=angle+(n>1?(i-(n-1)/2)*sp/(n-1):0);rwLaunch(a,slot,an,520,k.speed||430,dmg,k.r||10)}break}
   case 'beam':rwLine(a,self,rwEnd(a,angle,430),26,dmg*1.4,slot,10);rwFx(a,slot,a.x,a.y,'impact',.4,{angle});break;
   case 'dash':case 'blink':
    if(k.kind==='blink'){rwDash(a,angle+Math.PI,200,.16,()=>{},{slot});a.inv=Math.max(a.inv,.35)}
    else rwDash(a,angle,260,.3,()=>rwArea(a,a.x,a.y,75,dmg,slot,14),{slot,pierce:true});break;
   case 'rain':for(let i=0;i<5;i++){const px=tx+(Math.random()-.5)*150,py=ty+(Math.random()-.5)*150;rwFx(a,slot,px,py,'warning',.4,{radius:55});rwLater(a,.35+i*.15,()=>rwArea(a,px,py,60,dmg*.7,slot,6))}break;
   case 'blast':case 'mark':rwFx(a,slot,tx,ty,'warning',.4,{radius:80});rwLater(a,.4,()=>rwArea(a,tx,ty,85,dmg,slot,12));break;
   default:{const r=Math.min(k.r||k.r0||150,210);rwFx(a,slot,a.x,a.y,'impact',.45,{radius:r});rwArea(a,a.x,a.y,r,dmg,slot,16)}
  }
  return true;
 }
 const oc=originalCopy;
 originalCopy=function(a,copy,angle){return copy&&String(copy.id).startsWith('boss:')?castBoss(a,copy,angle):oc(a,copy,angle)};
 const oi=icon;
 icon=function(id){
  if(typeof id==='string'&&id.startsWith('boss:')){const sk=skills[id]?.boss;return `<span class="skill-art boss-copy-art" aria-hidden="true">${sk&&window.HuntAPI?HuntAPI.iconImg(sk.icon,'hunt-ico boss-copy-ico'):''}</span>`}
  return oi(id);
 };

 // Duelos: ao VER um campeão rival lançar uma habilidade (inclusive a ultimate), o olho aberto a copia.
 function copyHero(t,id){
  try{
   if(typeof reworkState!=='function'||t.skin!==1||t.hp<=0||t.copySource)return false;
   if(window.COMBAT_V3&&skills[id]?.ultimate)return false;   // o Olho Copiador não copia ultimate
   const ts=reworkState(t);if(!(ts.eye>0)||ts.copy)return false;
   ts.copy={id};ts.eye=0;t.cd[t.kit[4]]=0;
   try{rwFx(t,4,t.x,t.y,'copied',.6,{size:80})}catch{}
   if(t===p)toast('Copiado: '+skills[id].name+' · use 5');
   return true;
  }catch(e){console.error('[Eldoria] cópia de herói',e);return false}
 }
 const prevCast=rwCast;
 rwCast=function(a,id,manual){
  const ok=prevCast(a,id,manual);
  if(ok&&a&&!a.copySource&&skills[id]?.reworked&&a.skin!==undefined){
   for(const t of actors){if(t.team===a.team||t.skin!==1||t.hp<=0||t===a)continue;if(Math.hypot(t.x-a.x,t.y-a.y)<=SIGHT)copyHero(t,id)}
  }
  return ok;
 };
 window.BossCopy={landed,tryCopy,castBoss,key,SIGHT};
})();
