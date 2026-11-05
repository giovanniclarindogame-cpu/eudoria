'use strict';
const OriginalCombat={burns:[],serial:0};
const originalState=reworkState;
reworkState=function(a){const s=originalState(a);if(a.skin<6&&!s.originalInitialized){Object.assign(s,{originalInitialized:true,stage:0,spiritForm:0,breathing:0,instinct:0,eye:0,copy:null,barrier:false,barrierEnergy:240,barrierBroken:0,barrierHit:-10,pactAdult:0});if(a.skin===0)s.value=35;}return s;};
const originalResource=reworkResource;
reworkResource=function(a){if(a.skin>=6)return originalResource(a);const s=reworkState(a),k=reworkKit(a);if(!k)return null;
 if(a.skin===1)return{label:s.copy?'Cópia: '+skills[s.copy.id].name:s.eye>0?'Olho aberto '+Math.ceil(s.eye)+'s':'Cópia vazia',value:s.copy?1:0,max:1,color:k.color,textOnly:true};
 if(a.skin===4)return{label:s.barrierBroken>0?'Barreira quebrada '+Math.ceil(s.barrierBroken)+'s':'Barreira '+(s.barrier?'ativa':'desligada'),value:s.barrierEnergy,max:240,color:k.color};
 if(a.skin===5)return{label:a.rwCast?.holding?'Carga '+Math.round(a.rwCast.charge*100)+'%':s.instinct>0?'Instinto '+Math.ceil(s.instinct)+'s':'Pacto · segure 1',value:a.rwCast?.charge*100||0,max:100,color:k.color,textOnly:!a.rwCast?.holding};
 return{label:a.skin===0?'Ki · '+['Base','Desperto','Supremo'][s.stage]:k.resource,value:s.value,max:100,color:k.color};
};
function originalGainKi(a,n){const s=reworkState(a);s.value=clamp(s.value+n,0,100);if(s.stage===0&&s.value>=40)s.stage=1;if(s.stage===1&&s.value>=80)s.stage=2;}
const originalSpeed=identitySpeed;
identitySpeed=function(a){const s=reworkState(a);return originalSpeed(a)*(a.skin===0?1+s.stage*.12:1)*(s.spiritForm>0?1.15:1)*(s.barrier?.72:1);};
function originalClone(a){return objects.find(o=>o.v10Clone&&o.owner===a&&o.life>0&&o.hp>0);}
const originalOpponents=opponents;
opponents=function(a){return [...originalOpponents(a),...objects.filter(o=>o.v10Clone&&o.life>0&&o.hp>0&&o.team!==a.team)];};
const originalEnemy=enemy;
enemy=function(a){const choices=originalOpponents(a);if(a!==p){const clone=objects.filter(o=>o.v10Clone&&o.life>0&&o.hp>0&&o.team!==a.team&&dist(a,o)<250).sort((u,v)=>dist(a,u)-dist(a,v))[0];if(clone)return clone;}const result=originalEnemy(a);return result?.v10Clone?(choices.sort((u,v)=>dist(a,u)-dist(a,v))[0]||result):result;};
const originalReason=rwResourceReason;
rwResourceReason=function(a,slot){if(a.skin>=6)return originalReason(a,slot);const s=reworkState(a);
 if(a.skin===0){const cost=[10,18,20,8,0,35][slot];if(s.value<cost)return cost+' KI';}
 if(a.skin===1){if(slot===3&&!originalClone(a)&&!originalSwapShot(a))return 'Sem alvo';if(slot===4&&s.eye>0&&!s.copy)return 'Olho aberto';}
 if(a.skin===2){const cost=[0,0,15,0,40,70][slot];if(s.value<cost)return cost+' PRE';if(slot===4&&s.spiritForm>0)return 'Ativo';}
 if(a.skin===3){if(slot===5&&s.value<50)return '50 CHA';if(slot===4&&s.breathing>0)return 'Ativo';}
 if(a.skin===4&&slot===4&&!s.barrier){if(s.barrierBroken>0)return 'Quebrada';if(s.barrierEnergy<50)return '50 BAR';}
 if(a.skin===5&&slot===4&&s.instinct>0)return 'Ativo';
 return '';
};
const originalReady=rwReady;
rwReady=function(a,id){const skill=skills[id];if(!a||!skill?.reworked||a.skin!==skill.champion)return false;
 if(state!=='fight'||a.hp<=0||!a.kit.includes(id)||!opponents(a).length)return false;
 if(a.skin===0&&skill.slot===3)return a.cd[id]<=0&&!rwResourceReason(a,3);
 if(a.skin===4&&skill.slot===4&&reworkState(a).barrier)return true;
 if(a.root>0)return false;return originalReady(a,id);
};
const originalCommit=rwCommit;
rwCommit=function(a,q){if(a.skin>=6)return originalCommit(a,q);const s=reworkState(a);q.snapshot=s.value;q.stage=s.stage;q.health=a.hp;
 if(a.skin===0)s.value=Math.max(0,s.value-[10,18,20,8,0,35][q.slot]);
 if(a.skin===2){if(q.slot===2||q.slot===5)s.value=0;if(q.slot===4)s.value-=40;}
 if(a.skin===3){q.burnStacks=Math.max(0,...OriginalCombat.burns.filter(e=>e.owner===a&&e.target.hp>0&&e.remaining>0).map(e=>e.stacks));if(q.slot===5)s.value=0;}
 a.cd[q.id]=skills[q.id].cd;a.a=q.angle;
};
const originalCast=rwCast;
rwCast=function(a,id,manual){const sk=skills[id];if(!sk||a.skin>=6)return originalCast(a,id,manual);
 if(a.skin===4&&sk.slot===4&&reworkState(a).barrier){reworkState(a).barrier=false;a.cd[id]=.7;return true;}
 if(a.skin===0&&sk.slot===3&&rwReady(a,id)){rwCancelCharge(a);a.rwCast=null;a.cast=a.skillLock=a.actionRecovery=a.punchTime=a.root=a.dodgeTime=a.dash=0;Reforged.dashes=Reforged.dashes.filter(d=>d.owner!==a);Reforged.tasks=Reforged.tasks.filter(t=>t.owner!==a);a.guard=false;}
 const result=originalCast(a,id,manual);if(result&&a.rwCast)a.rwCast.action=++OriginalCombat.serial;return result;
};
function originalChargeTick(a,q,dt){if(a.skin>=6)return false;q.charge=clamp(q.age/(skills[q.id].holdMax||1.6),0,1);
 if(a.skin===0&&q.slot===4){originalGainKi(a,30*dt);if(q.age>=6)rwReleaseCharge(a);return true;}
 if(q.age>=skills[q.id].holdMax)rwReleaseCharge(a);return true;
}
const originalChargeRelease=rwReleaseCharge;
rwReleaseCharge=function(a,angle){if(a?.skin===0&&a.rwCast?.holding&&a.rwCast.slot===4){a.cd[a.kit[4]]=1;rwCancelCharge(a);return true;}return originalChargeRelease(a,angle);};
function originalFreePoint(a,x,y){return !rwObstacle(x,y,a.r)&&!actors.some(t=>t!==a&&t.hp>0&&dist(t,{x,y})<a.r+t.r+3);}
function originalBlink(a,angle,range,beside=false){const from={x:a.x,y:a.y};let target;
 if(beside){const foe=enemy(a);if(!foe||dist(a,foe)>range+50||!rwVisible(a,foe))return false;for(const off of [Math.PI/2,-Math.PI/2,Math.PI,0]){const x=foe.x+Math.cos(angle+off)*48,y=foe.y+Math.sin(angle+off)*48;if(dist(a,{x,y})<=range&&originalFreePoint(a,x,y)){target={x,y};break;}}}
 else{for(let d=4;d<=range;d+=4){const x=from.x+Math.cos(angle)*d,y=from.y+Math.sin(angle)*d;if(rwObstacle(x,y,a.r))break;if(originalFreePoint(a,x,y))target={x,y};}}
 if(!target)return false;a.x=target.x;a.y=target.y;a.inv=Math.max(a.inv,.22);rwFx(a,3,from.x,from.y,'departure',.55,{size:105,angle});rwFx(a,3,a.x,a.y,'arrival',.55,{size:95,angle});return true;
}
function originalSwapShot(a){return [...Reforged.projectiles,...shots,...integratedCustomProjectiles()].filter(e=>e.life>0&&e.owner&&e.owner.team!==a.team&&dist(a,e)<=340&&originalFreePoint(a,e.x,e.y)).sort((u,v)=>dist(a,u)-dist(a,v))[0];}
function originalCopy(a,copy,angle){if(!copy||!skills[copy.id]?.reworked)return false;
 const source=skills[copy.id],proxy=Object.create(a);proxy.skin=source.champion;proxy.kit=[...CHAMPIONS[source.champion].kit];proxy.identity=undefined;proxy.copySource=a;proxy.copyScale=.75;proxy.rwCast=null;
 for(const key of ['x','y','hp','damage','hits','kills'])Object.defineProperty(proxy,key,{get:()=>a[key],set:v=>{a[key]=v},configurable:true});
 const st=reworkState(proxy);st.value=100;st.stage=2;
 const q={id:source.id,slot:source.slot,age:0,charge:.7,snapshot:100,stage:2,health:a.hp,angle,duration:source.duration,release:source.release,target:rwEnd(a,angle,Math.min(source.range||200,dist(a,enemy(a)))),burnStacks:3,spent:50};
 const beforeHP=a.hp;rwRelease(proxy,q);if(a.hp<beforeHP)a.hp=Math.max(1,beforeHP-(beforeHP-a.hp)*.5);return true;
}
function originalBurn(target,owner,stacks=1){if(target.v10Clone)return;let burn=OriginalCombat.burns.find(e=>e.target===target&&e.owner===owner);if(!burn){burn={target,owner,stacks:0,remaining:0,tick:.5};OriginalCombat.burns.push(burn);}burn.stacks=Math.min(5,burn.stacks+stacks);burn.remaining=reworkState(owner).breathing>0?7:4;}
const sixLaunch=rwLaunch;rwLaunch=function(a,slot,angle,range,speed,damage,r=12,extra={}){return sixLaunch(a,slot,angle,range,speed,damage,r,{stage:a.skin===0?reworkState(a).stage:undefined,...extra});};
const originalRelease=rwRelease;
rwRelease=function(a,q){if(a.skin>=6)return originalRelease(a,q);const s=reworkState(a),slot=q.slot,angle=q.angle,stage=q.stage||0,snapshot=q.snapshot||0,damage=n=>a.skin===3?n*(1+(q.burnStacks||0)*.1):n;
 const end=d=>rwEnd(a,angle,d),area=(x,y,r,n,k=10)=>rwArea(a,x,y,r,damage(n),slot,k);
 const fx=(kind='cast',duration=.8,extra={})=>rwFx(a,slot,a.x,a.y,kind,duration,{angle,stage,follow:kind==='cast',...extra});
 if(a.skin===0){
  if(slot===0){
   const count=5+stage*2,spread=[-5,4,-2,5,0,-4,3,-1,4];
   for(let i=0;i<count;i++)rwLater(a,i*.075,()=>{
    const shotAngle=angle+spread[i]*.006,orb=rwLaunch(a,slot,shotAngle,470,520+stage*65,12+stage*3,8,{size:24+stage*3,splash:stage===2&&i>=count-2?28:0,stage,kiOrb:true,volleyIndex:i});
    orb.x+=Math.cos(angle)*4-Math.sin(angle)*spread[i];orb.y+=Math.sin(angle)*4+Math.cos(angle)*spread[i];
   });
  }
  if(slot===1){if(!originalBlink(a,angle,260,true))return;const target=enemy(a),an=Math.atan2(target.y-a.y,target.x-a.x);for(let i=0;i<4+stage*2;i++)rwLater(a,i*.085,()=>{rwArc(a,an,100,15+stage*3,slot,2.8,2);rwFx(a,slot,target.x,target.y,'impact',.3,{size:70+stage*8,angle:an});});}
  if(slot===2){const range=380+stage*60,to=end(range),ticks=6+stage*2,total=(90+150*(q.charge||0))*(1+stage*.2);rwFx(a,slot,to.x,to.y,'beam',.7,{from:{x:a.x,y:a.y},size:70+(q.charge||0)*55+stage*15,angle,stage});for(let i=0;i<ticks;i++)rwLater(a,i*.065,()=>rwLine(a,a,to,18+stage*8+(q.charge||0)*15,total/ticks,slot,3));}
  if(slot===3)originalBlink(a,angle,150+stage*30);
  if(slot===4){originalGainKi(a,28);fx('cast',.8,{stage});}
  if(slot===5){const target=q.target,r=80+stage*35;rwFx(a,slot,target.x,target.y,'warning',.65,{radius:r});rwFx(a,slot,target.x,target.y,'sky',1.15,{size:r*2.1,stage});rwLater(a,.65,()=>area(target.x,target.y,r,220+stage*70,35));}
 }else if(a.skin===1){
  if(slot===0){rwArc(a,angle,95,60,slot,1.8,5);fx('cast',.45,{size:95});}
  if(slot===1){const old=originalClone(a);if(old)old.life=0;const clone=actor(a.x,a.y,[...a.kit],a.color);Object.assign(clone,{kind:'v10clone',v10Clone:true,owner:a,skin:1,team:a.team,label:'Clone',hp:80,max:80,life:3,age:0,cd:.35,attacks:0,inv:0,kit:[...a.kit]});objects.push(clone);move(a,-Math.cos(angle)*42,-Math.sin(angle)*42);rwFx(a,slot,clone.x,clone.y,'smoke',.8,{size:115});}
  if(slot===2){const own=objects.filter(o=>o.v10Trap&&o.owner===a&&o.life>0);if(own.length>=2)own[0].life=0;const pt=q.target||end(160);if(!rwObstacle(pt.x,pt.y,12)){objects.push({kind:'v10trap',v10Trap:true,owner:a,x:pt.x,y:pt.y,r:30,hp:45,max:45,life:8,age:0});rwFx(a,slot,pt.x,pt.y,'seal',.6,{size:90});}}
  if(slot===3){const clone=originalClone(a),projectile=originalSwapShot(a),target=clone||projectile;if(target&&originalFreePoint(a,target.x,target.y)){const from={x:a.x,y:a.y};a.x=target.x;a.y=target.y;if(clone){clone.x=from.x;clone.y=from.y;}else target.life=0;a.inv=.25;rwFx(a,slot,from.x,from.y,'departure',.6,{size:110});rwFx(a,slot,a.x,a.y,'arrival',.6,{size:110});}else a.cd[q.id]=1;}
  if(slot===4){if(s.copy){const copy=s.copy;s.copy=null;originalCopy(a,copy,angle);a.cd[q.id]=Math.max(1,skills[copy.id].cd*.5);}else{s.eye=6;fx('cast',.55,{size:70});}}
  if(slot===5){const copy=s.copy;s.copy=null;rwDash(a,angle,340,.5,()=>{if(copy)originalCopy(a,copy,angle);},{slot,pierce:true,damage:230,exposed:0});fx('dash',.8,{size:150});}
 }else if(a.skin===2){
  if(slot===0){rwArc(a,angle,110+snapshot*.4,78,slot,2.2,28);fx('cast',.65,{size:125+snapshot*.3});}
  if(slot===1){for(let i=0;i<2;i++)rwLater(a,i*.16,()=>{for(const t of opponents(a))if(dist(a,t)<115&&t.guard)t.st=Math.max(0,t.st-32);rwArc(a,angle,115,42,slot,2.2,5);});fx('cast',.65,{size:120});}
  if(slot===2){rwLaunch(a,slot,angle,380+snapshot,460,70+snapshot*1.5,15+snapshot*.12,{size:80+snapshot*.8});}
  if(slot===3){a.inv=.25;rwDash(a,angle,180,.25,()=>{}, {slot});fx('dash',.5,{size:100});}
  if(slot===4){s.spiritForm=7;fx('cast',.85,{size:130});}
  if(slot===5)rwLaunch(a,slot,angle,560,470,210+snapshot*1.6,30,{size:155+snapshot*.6,piercing:true,knock:45});
 }else if(a.skin===3){
  if(slot===0){rwArc(a,angle,115,damage(55),slot,2.2,8);fx('cast',.6,{size:120});}
  if(slot===1)rwLaunch(a,slot,angle,420,400,damage(95),20,{size:125});
  if(slot===2){const target=q.target;rwFx(a,slot,target.x,target.y,'warning',.5,{radius:65});rwLater(a,.5,()=>area(target.x,target.y,65,100,12));}
  if(slot===3){rwDash(a,angle,260,.38,()=>{}, {slot,pierce:true,damage:damage(80),exposed:0});fx('dash',.65,{size:125});}
  if(slot===4){s.breathing=7;fx('cast',.8,{size:125});}
  if(slot===5){rwDash(a,angle,600,.85,()=>{}, {slot,pierce:true,damage:damage(240),exposed:0});a.inv=.35;fx('dash',1.2,{size:230});}
 }else if(a.skin===4){
  if(slot===0){rwArc(a,angle,135,65,slot,2.6,95);fx('cast',.6,{size:145});}
  if(slot===1){const target=enemy(a);if(target&&dist(a,target)<=300&&rwVisible(a,target)){hit(target,45,a,0,angle,q.id);const toward=Math.atan2(a.y-target.y,a.x-target.x);move(target,Math.cos(toward)*Math.min(110,Math.max(0,dist(a,target)-52)),Math.sin(toward)*Math.min(110,Math.max(0,dist(a,target)-52)));rwFx(a,slot,target.x,target.y,'impact',.8,{size:125});}}
  if(slot===2)rwLaunch(a,slot,angle,430,210,165,19,{size:105,splash:85,knock:28});
  if(slot===3)originalBlink(a,angle,240,true);
  if(slot===4){s.barrier=true;fx('cast',.7,{size:135});}
  if(slot===5){const pt=q.target;rwFx(a,slot,pt.x,pt.y,'warning',.6,{radius:150});rwLater(a,.6,()=>{objects.push({kind:'v10domain',v10Domain:true,owner:a,x:pt.x,y:pt.y,r:150,life:3,age:0,cd:0});});}
 }else if(a.skin===5){
  if(slot===0){rwArc(a,angle,100+(q.charge||0)*25,65+195*(q.charge||0),slot,1.8,15+(q.charge||0)*65);fx('cast',.7,{size:105+(q.charge||0)*70});}
  if(slot===1){rwArc(a,angle,85,48,slot,1.7,6);fx('cast',.35,{size:85});}
  if(slot===2){rwArc(a,angle,125,70,slot,TAU,25);fx('cast',.7,{size:200});}
  if(slot===3){rwDash(a,angle,230,.4,()=>area(a.x,a.y,65,95,18),{slot,leap:true});fx('dash',.8,{size:115});}
  if(slot===4){s.instinct=6;fx('cast',.55,{size:90});}
  if(slot===5){s.pactAdult=q.duration-q.release;rwArc(a,angle,165,80+q.health*.7,slot,2.3,70);a.hp=Math.max(1,a.hp-q.health*.8);fx('cast',1.1,{size:240});}
 }
};
let originalRanged=false,originalDot=false;
const originalProjectile=rwAdvanceProjectile;
rwAdvanceProjectile=function(e,dt){originalRanged=true;try{return originalProjectile(e,dt);}finally{originalRanged=false;}};
const originalHit=hit;
hit=function(target,amount,owner,knock=0,angle=0,id=-1){
 if(!owner)return originalHit(target,amount,owner,knock,angle,id);
 if(!target||target.hp<=0||state!=='fight'||sameTeam(target,owner))return false;
 if(target.v10Clone){if(target.inv>0)return false;target.hp=Math.max(0,target.hp-amount);if(!target.hp){target.life=0;rwFx(target.owner,1,target.x,target.y,'smoke',.6,{size:100});}return true;}
 const ts=reworkState(target),os=reworkState(owner),special=skills[id]?.reworked;
 if(!originalDot){if(owner.copyScale)amount*=owner.copyScale;if(owner.skin===0)amount*=1+os.stage*.12;if(os.spiritForm>0)amount*=1.45;if(owner.skin===3&&os.breathing>0)amount*=1.3;if(owner.skin===2&&skills[id]?.slot===1&&target.guard)amount*=1.65;
  if(target.skin===0&&target.rwCast?.holding&&target.rwCast.slot===4)amount*=1.2;
 }
 if(target.skin===4&&ts.barrier&&target.inv<=0&&(originalRanged||special&&dist(target,owner)>120)){
  const absorbed=Math.min(ts.barrierEnergy,amount);ts.barrierEnergy-=absorbed;amount-=absorbed;ts.barrierHit=clock;rwFx(target,4,target.x,target.y,'barrier-hit',.4,{size:125});
  if(ts.barrierEnergy<=0){ts.barrier=false;ts.barrierBroken=4;ts.exposed=4;if(target===p)toast('Barreira quebrada: exposto por 4s');}
  if(amount<=0)return false;
 }
 const before=target.hp,result=originalHit(target,amount,owner,knock,angle,id),lost=before-target.hp;
 if(result&&lost>0&&!originalDot){
  if(target.skin===0)originalGainKi(target,Math.min(5,lost*.04));if(owner.skin===0)originalGainKi(owner,id<0?6:2);
  if(owner.skin===2&&(id<0||[0,1].includes(skills[id]?.slot)))os.value=Math.min(100,os.value+14);
  if(owner.skin===3){os.value=Math.min(100,os.value+15);os.lastGain=clock;originalBurn(target,owner,skills[id]?.slot===5?4:1);}
  if(target.skin===1&&ts.eye>0&&special&&!owner.copySource){ts.copy={id};ts.eye=0;target.cd[target.kit[4]]=0;rwFx(target,4,target.x,target.y,'copied',.6,{size:80});if(target===p)toast('Copiado: '+skills[id].name+' · use 5');}
  if(target.skin===5&&target.rwCast?.holding){rwCancelCharge(target);target.cd[target.kit[0]]=1;if(target===p)toast('Carga interrompida');}
 }return result;
};
const originalHurtObjects=hurtConstructs;
hurtConstructs=function(owner,x,y,r,damage,angle=0,arc=TAU){originalHurtObjects(owner,x,y,r,damage,angle,arc);for(const o of objects){if(!o.v10Trap||o.life<=0||sameTeam(owner,o.owner)||dist({x,y},o)>r+o.r)continue;const delta=Math.abs(Math.atan2(Math.sin(Math.atan2(o.y-y,o.x-x)-angle),Math.cos(Math.atan2(o.y-y,o.x-x)-angle)));if(delta<arc/2&&rwVisible({x,y},o)){o.hp-=damage;if(o.hp<=0)o.life=0;}}};
const originalDodge=dodge;
dodge=function(a){const s=reworkState(a);if(s.domainLock>0)return false;if(a.skin!==5||s.instinct<=0)return originalDodge(a);const before=a.st;a.st+=10;const result=originalDodge(a);if(result){a.inv+=.12;a.dodgeCD*=.6;}else a.st=before;return result;};
const originalClear=rwClear;
rwClear=function(){OriginalCombat.burns=[];originalClear();};
const originalStep=step;
step=function(dt){const active=state==='fight',generation=Reforged.generation;originalStep(dt);if(!active||state!=='fight'||generation!==Reforged.generation)return;
 for(const a of actors){if(a.hp<=0)continue;const s=reworkState(a);s.domainLock=Math.max(0,(s.domainLock||0)-dt);if(a.skin>=6)continue;
  for(const k of ['spiritForm','breathing','instinct','eye','barrierBroken','pactAdult'])s[k]=Math.max(0,s[k]-dt);
  if(a.skin===0&&s.stage>0&&!(a.rwCast?.holding&&a.rwCast.slot===4)){s.value=Math.max(0,s.value-(s.stage===2?12:7)*dt);if(s.value===0){s.stage--;s.value=s.stage?30:0;}}
  if(a.skin===3&&clock-s.lastGain>2.5)s.value=Math.max(0,s.value-18*dt);
  if(a.skin===4&&!s.barrier&&s.barrierBroken<=0&&clock-s.barrierHit>3)s.barrierEnergy=Math.min(240,s.barrierEnergy+24*dt);
 }
 for(const o of objects){if(o.life<=0)continue;
  if(o.v10Clone){o.age+=dt;o.cd-=dt;const t=opponents(o.owner).filter(e=>e.hp>0).sort((u,v)=>dist(o,u)-dist(o,v))[0];if(!t)continue;o.a=Math.atan2(t.y-o.y,t.x-o.x);o.moving=dist(o,t)>65;if(o.moving)move(o,Math.cos(o.a)*150*dt,Math.sin(o.a)*150*dt);if(o.cd<=0&&dist(o,t)<95&&o.attacks<3&&rwVisible(o,t)){o.attacks++;o.cd=.65;o.punchTime=.22;hit(t,22,o.owner,3,o.a,o.owner.kit[1]);rwFx(o.owner,0,t.x,t.y,'impact',.3,{size:65});}o.punchTime=Math.max(0,o.punchTime-dt);}
  if(o.v10Trap){o.age+=dt;const t=opponents(o.owner).find(t=>t.hp>0&&dist(t,o)<o.r+t.r);if(t){if(hit(t,55,o.owner,0,0,o.owner.kit[2])){t.root=Math.max(t.root,1.2);rwCancelCharge(t);}rwFx(o.owner,2,o.x,o.y,'trap-fire',.85,{size:140});o.life=0;}}
  if(o.v10Domain){o.age+=dt;o.cd-=dt;for(const t of opponents(o.owner))if(t.hp>0&&dist(t,o)<=o.r&&rwVisible(o,t)){t.root=Math.max(t.root,.12);reworkState(t).domainLock=.15;rwCancelCharge(t);if(o.cd<=0)hit(t,20,o.owner,0,0,o.owner.kit[5]);}if(o.cd<=0)o.cd=1;}
 }
 for(const e of OriginalCombat.burns){e.remaining-=dt;e.tick-=dt;if(e.remaining>0&&e.target.hp>0&&e.owner.hp>0&&e.tick<=0){e.tick=.5;originalDot=true;try{hit(e.target,e.stacks*3,e.owner,0,0,e.owner.kit[0]);}finally{originalDot=false;}}}
 OriginalCombat.burns=OriginalCombat.burns.filter(e=>e.remaining>0&&e.target.hp>0&&e.owner.hp>0);
};
const originalAI=ai;
ai=function(dt,a=b){if(a&&a.skin<6&&!a.trainingDummy){a.leagueAI={...a.leagueAI,gap:[210,130,85,85,250,70][a.skin]};}originalAI(dt,a);if(a.skin>=6||a.trainingDummy||a.hp<=0||a.rwCast||a.cast>0||a.guard)return;a.originalThink=(a.originalThink||0)-dt;if(a.originalThink>0)return;a.originalThink=.75;const s=reworkState(a);let slot=null;
 if(a.skin===0&&s.value<30){rwBeginCharge(a,aim(a),4);return;}
 if(a.skin===1){if(s.copy||s.eye<=0)slot=4;else if(!originalClone(a))slot=1;}
 if(a.skin===2&&s.value>=70)slot=5;else if(a.skin===2&&s.value>=40&&s.spiritForm<=0)slot=4;
 if(a.skin===3&&s.value>=50)slot=5;else if(a.skin===3&&s.breathing<=0)slot=4;
 if(a.skin===4&&!s.barrier&&s.barrierEnergy>=100)slot=4;
 if(a.skin===5&&s.instinct<=0)slot=4;
 if(slot!==null&&rwReady(a,a.kit[slot]))cast(a,a.kit[slot]);
};
window.originalCombatQA={state:reworkState,runtime:OriginalCombat,gainKi:originalGainKi,copy:originalCopy,clone:originalClone,blink:originalBlink,get kits(){return ORIGINAL_REWORK_KITS;}};

