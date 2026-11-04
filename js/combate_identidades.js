'use strict';
const Reforged={effects:[],projectiles:[],tasks:[],dashes:[],serial:0,generation:0};
function rwLater(owner,seconds,fn){Reforged.tasks.push({owner,remaining:seconds,fn});}
function rwFx(a,slot,x=a.x,y=a.y,kind='impact',duration=.8,extra={}){
 Reforged.effects.push({id:++Reforged.serial,skin:a.skin,slot,owner:a,x,y,angle:a.a,kind,age:0,duration,...extra});
 if(Reforged.effects.length>100)Reforged.effects.splice(0,Reforged.effects.length-100);
}
function rwSelfDamage(a,amount){if(a.hp<=0)return;a.hp=Math.max(0,a.hp-amount);if(a.hp<=0){a.guard=false;a.rwCast=null;reworkState(a).charge=null;if(typeof onModeDeath==='function')onModeDeath(a,enemy(a));}}
function rwGain(a,amount,payHealth=true){
 const s=reworkState(a);s.lastGain=clock;
 if(a.skin===6&&amount>0){
  const before=s.value;if(payHealth&&before>=70)rwSelfDamage(a,a.max*(.018+amount*.001));
  if(before+amount>100){s.arm=Math.max(s.arm,3);s.empowered=false;if(a===p)toast('Sobrecarga: braço lesionado por 3s');}
 }
 s.value=clamp(s.value+amount,0,100);return s.value;
}
function identityPhasing(a){return Reforged.dashes.some(d=>d.owner===a&&d.pierce&&!d.finished);}
function identitySpeed(a){const s=a.identity;if(!s)return 1;return (s.empowered?1.3:1)*(s.turbo>0?1.35:1)*(s.tired>0?.7:1)*(s.iron>0?.75:1);}
function rwObstacle(x,y,r=0,ignore=null){
 if(x<35+r||x>W-35-r||y<35+r||y>H-35-r)return true;
 if(pillars.some(o=>Math.hypot(x-o.x,y-o.y)<o.r+r))return true;
 return objects.some(o=>o!==ignore&&o.kind==='wall'&&o.life>0&&o.hp!==0&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(y-o.y)<o.h/2+r);
}
function rwVisible(from,to,ignore=null){const n=Math.ceil(dist(from,to)/8);for(let i=1;i<n;i++)if(rwObstacle(from.x+(to.x-from.x)*i/n,from.y+(to.y-from.y)*i/n,0,ignore))return false;return true;}
function rwRay(a,angle,range,ignoreOwn=false){let d=0;for(let x=5;x<=range;x+=5){const px=a.x+Math.cos(angle)*x,py=a.y+Math.sin(angle)*x,own=ignoreOwn?reworkMaterials(a).find(o=>Math.abs(px-o.x)<o.w/2+5&&Math.abs(py-o.y)<o.h/2+5):null;if(rwObstacle(px,py,4,own))break;d=x;}return d;}
function rwEnd(a,angle,range,ignoreOwn=false){const d=rwRay(a,angle,range,ignoreOwn);return{x:a.x+Math.cos(angle)*d,y:a.y+Math.sin(angle)*d};}
function rwBlockAt(x,y,r=0){return objects.find(o=>o.material&&o.hp>0&&o.life>0&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(y-o.y)<o.h/2+r);}
function rwBlockInAim(a,angle,range=260){return reworkMaterials(a).filter(o=>dist(a,o)<range&&Math.abs(Math.atan2(Math.sin(Math.atan2(o.y-a.y,o.x-a.x)-angle),Math.cos(Math.atan2(o.y-a.y,o.x-a.x)-angle)))<.32&&rwVisible(a,o,o)).sort((u,v)=>dist(a,u)-dist(a,v))[0];}
function rwCreateBlock(a,x,y,wall=false,angle=a.a){
 if(reworkMaterials(a).length>=10)return null;
 const w=wall?(Math.abs(Math.cos(angle))>.7?26:126):30,h=wall?(w===26?126:26):30;
 if(rwObstacle(x,y,Math.max(w,h)/2)||actors.some(t=>t.hp>0&&Math.abs(t.x-x)<w/2+t.r+4&&Math.abs(t.y-y)<h/2+t.r+4))return null;
 const o={kind:'wall',material:true,wall,owner:a,x,y,w,h,hp:wall?320:180,max:wall?320:180,life:24,age:0,created:clock,color:'#c1b59e'};
 objects.push(o);rwFx(a,wall?3:0,x,y,'construct',.7,{object:o});return o;
}
function rwDestroy(o,source=null){if(o.hp<=0&&o.life<=0)return;o.hp=0;o.life=0;rwFx(o.owner,o.wall?3:0,o.x,o.y,'break',.45,{size:o.wall?130:70});}
function rwDamageConstruct(o,amount,owner){if(o.hp<=0||o.life<=0||sameTeam(o.owner,owner))return false;o.hp=Math.max(0,o.hp-amount);o.flash=.15;if(!o.hp){o.life=0;rwFx(o.owner,o.material?(o.wall?3:0):5,o.x,o.y,'break',.5,{size:100});}return true;}
function rwPushBlock(o,angle,length){
 let moved=0;for(let d=0;d<length;d+=4){const dx=Math.cos(angle)*4,dy=Math.sin(angle)*4,x=o.x+dx,y=o.y+dy;
  if([[-1,-1],[1,-1],[-1,1],[1,1]].some(([sx,sy])=>rwObstacle(x+sx*o.w/2,y+sy*o.h/2,1,o)))break;
  if(actors.some(a=>a.hp>0&&Math.abs(a.x-x)<o.w/2+a.r&&Math.abs(a.y-y)<o.h/2+a.r))break;
  o.x=x;o.y=y;moved+=4;
 }return moved;
}
const rwPriorConstructs=hurtConstructs;
hurtConstructs=function(owner,x,y,r,damage,angle=0,arc=TAU){
 rwPriorConstructs(owner,x,y,r,damage,angle,arc);
 for(const o of objects){if(!(o.material||o.colossus)||o.hp<=0||o.life<=0||dist({x,y},o)>r+(o.material?Math.min(o.w,o.h)/2:35))continue;
  const delta=Math.abs(Math.atan2(Math.sin(Math.atan2(o.y-y,o.x-x)-angle),Math.cos(Math.atan2(o.y-y,o.x-x)-angle)));if(delta>arc/2||!rwVisible({x,y},o,o))continue;
  if(o.owner===owner&&o.wall&&r<=70&&damage<=40){rwPushBlock(o,angle,24);continue;}
  rwDamageConstruct(o,damage,owner);
 }
};
function rwArc(a,angle,range,damage,slot,arc=1.7,knock=8,extra={}){
 let count=0;for(const target of opponents(a)){
  const delta=Math.abs(Math.atan2(Math.sin(Math.atan2(target.y-a.y,target.x-a.x)-angle),Math.cos(Math.atan2(target.y-a.y,target.x-a.x)-angle)));
  if(target.hp<=0||dist(a,target)>range+target.r||delta>arc/2||!rwVisible(a,target))continue;
  if(hit(target,damage,a,knock,angle,a.kit[slot])){count++;if(extra.air){const s=reworkState(target);s.air=Math.max(s.air,extra.air);s.airTotal=s.air;target.root=Math.max(target.root,extra.air);}if(extra.exposed)reworkState(target).exposed=extra.exposed;}
 }
 hurtConstructs(a,a.x,a.y,range,extra.constructDamage||damage,angle,arc);return count;
}
function rwLine(a,from,to,width,damage,slot,knock=0,extra={}){
 let count=0;for(const target of opponents(a))if(target.hp>0&&lineDistance(target.x,target.y,from.x,from.y,to.x,to.y)<width+target.r&&rwVisible(from,target)){
  if(hit(target,damage,a,knock,Math.atan2(to.y-from.y,to.x-from.x),a.kit[slot])){count++;if(extra.exposed)reworkState(target).exposed=extra.exposed;}
 }return count;
}
function rwArea(a,x,y,r,damage,slot,knock=0){
 for(const target of opponents(a))if(target.hp>0&&dist(target,{x,y})<r+target.r&&rwVisible({x,y},target))hit(target,damage,a,knock,Math.atan2(target.y-y,target.x-x),a.kit[slot]);
 hurtConstructs(a,x,y,r,damage);rwFx(a,slot,x,y,'impact',.8,{size:r*1.8});
}
function rwDash(a,angle,distance,duration,done,extra={}){
 Reforged.dashes=Reforged.dashes.filter(d=>d.owner!==a);
 const d={owner:a,angle,distance,duration,age:0,travel:0,done,from:{x:a.x,y:a.y},hit:new Set(),...extra};Reforged.dashes.push(d);
 a.root=Math.max(a.root,duration);a.cast=Math.max(a.cast,duration);return d;
}
function rwLaunch(a,slot,angle,range,speed,damage,r=12,extra={}){
 const e={owner:a,skin:a.skin,slot,angle,x:a.x+Math.cos(angle)*30,y:a.y+Math.sin(angle)*30,range,speed,damage,r,travel:0,age:0,life:range/speed+.2,hit:new Set(),...extra};
 Reforged.projectiles.push(e);return e;
}
function rwResourceReason(a,slot){
 const s=reworkState(a);
 if(a.skin===6){if([0,3,5].includes(slot)&&s.arm>0)return 'Braço '+Math.ceil(s.arm)+'s';if(slot===3&&s.finger>0)return 'Dedo '+Math.ceil(s.finger)+'s';if(slot===5&&s.value<100)return '100 SOB';}
 if(a.skin===8){const cost=[0,18,12,14,25,35][slot];if(s.value<cost)return cost+' COS';if(slot===4&&s.cosmic>0)return 'Ativo';}
 if(a.skin===7){if(slot===5&&s.value<40)return '40 ELA';if(slot===4&&(s.turbo>0||s.tired>0))return s.turbo>0?'Turbo':'Cansaço';}
 if(a.skin===9){if(slot===5&&!reworkMaterials().length)return 'Material';if(slot===4&&s.iron>0)return 'Ativo';}
 return '';
}
function rwReady(a,id){
 const skill=skills[id];if(!a||!skill?.reworked||a.skin!==skill.champion||!a.kit.includes(id)||state!=='fight'||a.hp<=0||!opponents(a).length)return false;
 if(a.skin===6&&skill.slot===4&&reworkState(a).empowered)return true;
 return !rwResourceReason(a,skill.slot)&&!(a.cd[id]>0||a.cast>0||a.guard||a.skillLock>0||a.actionRecovery>0||a.punchTime>0||a.dodgeTime>0||a.rwCast);
}
function rwCommit(a,q){
 const s=reworkState(a),slot=q.slot,skill=skills[q.id];q.snapshot=s.value;
 if(a.skin===6){
  if(slot===0)rwGain(a,10+24*(q.charge||0));if(slot===1)rwGain(a,-14);if(slot===2)rwGain(a,15);if(slot===3){rwGain(a,18);s.finger=5;}
  if(slot===5){s.value=0;s.empowered=false;s.arm=4;}
 }else if(a.skin===8){
  const cost=[0,18,12,14,0,0][slot];if(slot===4||slot===5)s.value=0;else s.value=Math.max(0,s.value-cost);
 }else if(a.skin===7){if(slot===0||slot===1)rwGain(a,4);if(slot===2){q.spent=s.value/2;s.value-=q.spent;}if(slot===5)s.value=0;}
 a.cd[q.id]=skill.cd;a.a=q.angle;
}
function rwBeginCharge(a,angle=aim(a)){
 const id=a.kit[0];if(!rwReady(a,id))return false;
 const q={id,slot:0,angle,age:0,holding:true,charge:0,duration:skills[id].duration,release:skills[id].release};
 a.rwCast=q;reworkState(a).charge=q;a.cast=99;a.skillLock=99;return true;
}
function rwCancelCharge(a){if(!a?.rwCast?.holding)return;a.rwCast=null;reworkState(a).charge=null;a.cast=0;a.skillLock=0;}
function rwReleaseCharge(a,angle){
 const q=a?.rwCast;if(!q?.holding)return false;
 q.charge=clamp(q.age/1.4,0,1);q.age=0;q.holding=false;if(Number.isFinite(angle))q.angle=angle;
 reworkState(a).charge=null;rwCommit(a,q);a.cast=q.duration;a.skillLock=q.duration;return true;
}
function rwCast(a,id,manual){
 const skill=skills[id];if(!rwReady(a,id)){if(a===p){const reason=rwResourceReason(a,skill?.slot);if(reason)toast(reason);}return false;}
 const s=reworkState(a);
 if(a.skin===6&&skill.slot===4&&s.empowered){s.empowered=false;a.cd[id]=1;return true;}
 const angle=manual?.pointAim?manual.angle:typeof manual==='number'?manual:aim(a);
 const q={id,slot:skill.slot,angle,age:0,duration:skill.duration,release:skill.release,target:manual?.pointAim?{x:manual.x,y:manual.y}:rwEnd(a,angle,Math.min(skill.range,dist(a,enemy(a)))),released:false,charge:manual?.charge||0};
 if(a.skin===8&&q.slot===0){q.duration=Math.max(.32,.65-s.combo*.025);q.release=.08;}
 if(a.skin===7&&q.slot<4){q.duration/=1+s.value*.004;q.release/=1+s.value*.004;}
 rwCommit(a,q);if(a.hp<=0)return true;a.rwCast=q;a.cast=q.duration;a.skillLock=q.duration;
 if(a===p)toast(skill.name);return true;
}
const rwPriorCast=cast;
cast=function(a,id,manual){return skills[id]?.reworked?rwCast(a,id,manual):rwPriorCast(a,id,manual);};
function rwRelease(a,q){
 const s=reworkState(a),slot=q.slot,an=q.angle,snap=q.snapshot,boost=a.skin===6?1+snap*.004:1,forward=d=>({x:a.x+Math.cos(an)*d,y:a.y+Math.sin(an)*d});
 rwFx(a,slot,a.x,a.y,'cast',q.duration-q.release,{follow:true,angle:an});
 if(a.skin===6){
  if(slot===0){rwArc(a,an,90+q.charge*30,(65+125*q.charge)*boost,slot,1.8,15+q.charge*35);rwFx(a,slot,forward(60).x,forward(60).y,'impact',.55,{size:95+q.charge*55,angle:an});}
  if(slot===1)rwArc(a,an,92,48,slot,2,12);
  if(slot===2){const jump=(second)=>rwDash(a,an,130,.28,()=>{if(second)rwArea(a,a.x,a.y,65,95*boost,slot,18);else rwLater(a,.08,()=>jump(true));},{leap:true,slot});jump(false);}
  if(slot===3)rwLaunch(a,slot,an,430,570,78*boost,11);
  if(slot===4)s.empowered=true;
  if(slot===5){rwArc(a,an,150,410,slot,2.3,65);a.hp=Math.max(1,Math.min(a.hp,a.max*.05));rwFx(a,slot,forward(90).x,forward(90).y,'impact',1.05,{size:230,angle:an});combatImpact(2);}
 }else if(a.skin===7){
  const reach=220+snap*1.6;
  if(slot===0){const end=rwEnd(a,an,reach);rwFx(a,slot,end.x,end.y,'tether',.5,{from:{x:a.x,y:a.y},angle:an});rwLater(a,.12/(1+snap*.006),()=>{if(rwLine(a,a,end,20,65,slot,10))rwGain(a,8);});}
  if(slot===1){const count=3+Math.floor(snap/20);for(let i=0;i<count;i++)rwLater(a,i*.085/(1+snap*.004),()=>{const end=rwEnd(a,an+(i%2?.08:-.08),180+snap*.8);rwFx(a,slot,end.x,end.y,'tether',.28,{from:{x:a.x,y:a.y},angle:an,size:70});if(rwLine(a,a,end,20,20,slot,2))rwGain(a,3);});}
  if(slot===2){const end=rwEnd(a,an,250+snap*.9);rwFx(a,slot,end.x,end.y,'tether',.6,{from:{x:a.x,y:a.y},angle:an,size:130});rwLine(a,a,end,35,120+q.spent*1.4,slot,40+q.spent*.8);}
  if(slot===3){const edges=[{x:35,y:a.y},{x:W-35,y:a.y},{x:a.x,y:35},{x:a.x,y:H-35}],anchor=[...pillars,...objects.filter(o=>o.kind==='wall'&&o.life>0),...edges].sort((x,y)=>dist(a,x)-dist(a,y))[0];rwFx(a,slot,anchor.x,anchor.y,'anchor',.6,{followOwner:a,from:{x:a.x,y:a.y},angle:an});rwDash(a,an,320,.4,()=>{if(rwArc(a,an,80,90,slot,TAU,25))rwGain(a,18);},{slot,leap:true});}
  if(slot===4)s.turbo=5;
  if(slot===5)rwLaunch(a,slot,an,370+snap*2,450+snap,220+snap*1.5,25,{splash:80+snap*.8,knock:55,size:110+snap*1.4});
 }else if(a.skin===8){
  if(slot===0){for(let i=0;i<3;i++)rwLater(a,i*(.14/(1+s.combo*.09)),()=>{if(rwArc(a,an,105,20,slot,1.8,2)){s.combo=Math.min(12,s.combo+1);s.comboTime=1.4;}else{s.combo=0;s.comboTime=0;}});}
  if(slot===1)rwLaunch(a,slot,an,390,520,100,15);
  if(slot===2)rwArc(a,an,110,65,slot,2,5,{air:.7});
  if(slot===3)rwDash(a,an,230,.26,()=>{}, {slot,pierce:true,damage:55,exposed:2});
  if(slot===4){s.cosmic=4+snap*.04;s.cosmicPower=.25+snap*.004;}
  if(slot===5){const count=3+Math.floor(snap/12),center=q.target;rwFx(a,slot,center.x,center.y,'warning',.45,{radius:100+snap*.4});for(let i=0;i<count;i++)rwLater(a,.25+i*.09,()=>{const angle=i*2.399963,r=i?Math.sqrt(i/count)*(70+snap*.3):0;rwArea(a,center.x+Math.cos(angle)*r,center.y+Math.sin(angle)*r,53,32,slot,4);});}
 }else if(a.skin===9){
  if(slot===0){const block=rwBlockInAim(a,an);if(block){const from={x:block.x,y:block.y};rwDestroy(block);rwLaunch(a,slot,an,390,410,95,18,{...from,size:75});}else{const point=forward(78);if(!rwCreateBlock(a,point.x,point.y))if(a===p)toast('Escolha espaço livre para o bloco');}}
  if(slot===1)rwArc(a,an,115,75,slot,2.2,12,{constructDamage:250});
  if(slot===2){const end=rwEnd(a,an,330,true),distance=dist(a,end),origin={x:a.x,y:a.y};for(const block of reworkMaterials(a))if(lineDistance(block.x,block.y,a.x,a.y,end.x,end.y)<45){rwDestroy(block);rwArea(a,block.x,block.y,85,65,slot,18);}
   const struck=new Set();for(let d=45;d<=distance;d+=38){const point={x:origin.x+Math.cos(an)*d,y:origin.y+Math.sin(an)*d};rwLater(a,(d-45)/600,()=>{rwFx(a,slot,point.x,point.y,'impact',.65,{size:75});for(const target of opponents(a))if(!struck.has(target)&&target.hp>0&&dist(target,point)<45&&rwVisible(point,target)){struck.add(target);hit(target,85,a,8,an,a.kit[slot]);}if(d>distance-80)rwCreateBlock(a,point.x,point.y);});}}
  if(slot===3){const own=rwBlockInAim(a,an,220);if(own?.wall)rwPushBlock(own,an,120);else{const point=forward(110);if(!rwCreateBlock(a,point.x,point.y,true,an)&&a===p)toast('Não há espaço livre para a muralha');}}
  if(slot===4)s.iron=6;
  if(slot===5){const materials=reworkMaterials(),count=materials.length;if(!count)return;for(const o of materials)rwDestroy(o);const point=forward(95),max=300+count*45;objects.push({kind:'colossus',colossus:true,owner:a,x:point.x,y:point.y,r:28,hp:max,max,life:8,age:0,cd:.6,materials:count,size:105+Math.min(count,16)*5,dmg:42+count*8,color:'#d8c398'});rwFx(a,slot,point.x,point.y,'summon',1,{size:150+count*4});}
 }
}
const rwPriorHit=hit;
hit=function(target,amount,owner,knock=0,angle=0,id=-1){
 const ts=reworkState(target),os=owner?reworkState(owner):null;
 if(os){if(os.empowered)amount*=1.25;if(os.iron>0)amount*=1.35;if(os.cosmic>0)amount*=1+os.cosmicPower;if(owner.skin===8&&os.value>=100)amount*=1.2;if(os.tired>0)amount*=.85;}
 if(ts.iron>0)amount*=.7;if(ts.cosmic>0)amount*=.75;if(ts.exposed>0)amount*=1.25;
 if(target.skin===7&&ts.value>=60){amount*=1+ts.value*.0035;knock*=1+ts.value*.008;}
 const before=target.hp,result=rwPriorHit(target,amount,owner,knock,angle,id),damage=Math.max(0,before-target.hp);
 if(result&&damage>0){
  if(target.skin===8)rwGain(target,Math.min(18,damage*.13));
  if(owner?.skin===8)rwGain(owner,6+Math.min(5,damage*.025));
  if(target.rwCast?.holding&&damage>=45){rwCancelCharge(target);target.cd[target.kit[0]]=1;}
 }
 return result;
};
function rwAdvanceProjectile(e,dt){
 e.age+=dt;e.life-=dt;let distance=Math.min(e.speed*dt,e.range-e.travel);
 while(distance>0&&e.life>0){const d=Math.min(5,distance);distance-=d;e.travel+=d;const x=e.x+Math.cos(e.angle)*d,y=e.y+Math.sin(e.angle)*d;
  const block=rwBlockAt(x,y,e.r*.4);
  if(block){rwDamageConstruct(block,e.damage,e.owner);e.life=0;break;}
  if(rwObstacle(x,y,e.r*.3)){e.life=0;break;}e.x=x;e.y=y;
  const construct=objects.find(o=>o.colossus&&o.hp>0&&o.life>0&&!sameTeam(o.owner,e.owner)&&dist(o,e)<30+e.r);
  if(construct){rwDamageConstruct(construct,e.damage,e.owner);e.life=0;break;}
  for(const target of opponents(e.owner)){
   if(target.hp<=0||e.hit.has(target)||dist(target,e)>=target.r+e.r)continue;
   if(!e.reflected&&(target.buff.reverse>0||target.buff.mirror>0&&target.reflect>0)){const previous=e.owner;e.owner=target;e.reflected=true;e.angle=Math.atan2(previous.y-target.y,previous.x-target.x);e.x=target.x+Math.cos(e.angle)*45;e.y=target.y+Math.sin(e.angle)*45;e.hit.clear();if(target.reflect>0)target.reflect--;break;}
   e.hit.add(target);if(e.splash)rwArea(e.owner,e.x,e.y,e.splash,e.damage,e.slot,e.knock||0);else hit(target,e.damage,e.owner,e.knock||8,e.angle,REWORK_KITS[e.skin-6].skills[e.slot].id);e.life=0;break;
  }
 }if(e.travel>=e.range)e.life=0;
 if(e.life<=0)rwFx({skin:e.skin,a:e.angle},e.slot,e.x,e.y,'impact',.5,{size:e.splash?e.splash*1.7:75});
}
function rwInterceptExisting(dt){
 const existing=[...shots,...integratedCustomProjectiles()];
 for(const e of existing){if(e.life<=0)continue;const vx=e.vx??Math.cos(e.angle)*e.speed,vy=e.vy??Math.sin(e.angle)*e.speed,length=Math.hypot(vx,vy)*dt,n=Math.max(1,Math.ceil(length/4));
  for(let i=1;i<=n;i++){const x=e.x+vx*dt*i/n,y=e.y+vy*dt*i/n,block=rwBlockAt(x,y,(e.r||10)*.3);
   if(block){rwDamageConstruct(block,e.dmg||e.damage||30,e.owner);e.life=0;break;}
   const golem=objects.find(o=>o.colossus&&o.hp>0&&o.life>0&&!sameTeam(o.owner,e.owner)&&dist(o,{x,y})<30+(e.r||10));if(golem){rwDamageConstruct(golem,e.dmg||30,e.owner);e.life=0;break;}
   if(rwObstacle(x,y,1))break;
  }
 }
}
function rwClear(){Reforged.generation++;Reforged.effects.length=0;Reforged.projectiles.length=0;Reforged.tasks.length=0;Reforged.dashes.length=0;for(const a of actors){delete a.identity;delete a.rwCast;}}
const rwPriorReset=resetPractice;resetPractice=function(clear=true){rwClear();const result=rwPriorReset(clear);for(const a of actors)reworkState(a);return result;};
const rwPriorStart=start;start=function(){rwClear();const result=rwPriorStart();for(const a of actors){reworkState(a);if(reworkKit(a))reworkPreload(a.skin);}return result;};
const rwPriorStep=step;
step=function(dt){
 const fighting=state==='fight',generation=Reforged.generation;
 const before=actors.map(a=>[a,{x:a.x,y:a.y}]);if(fighting)rwInterceptExisting(dt);
 rwPriorStep(dt);if(!fighting||state!=='fight'||generation!==Reforged.generation)return;
 for(const [a,pos]of before){if(a.hp<=0){a.rwCast=null;reworkState(a).charge=null;continue;}
  const s=reworkState(a),kit=reworkKit(a),turbo=s.turbo;
  for(const name of ['arm','finger','turbo','tired','iron','cosmic','comboTime','air','exposed'])s[name]=Math.max(0,s[name]-dt);
  if(turbo>0){a.cd=a.cd.map(v=>Math.max(0,v-dt*.6));rwSelfDamage(a,15*dt);if(!s.turbo)s.tired=2;}
  if(s.empowered){rwGain(a,18*dt,false);rwSelfDamage(a,15*dt);}
  if(a.skin===7&&clock-s.lastGain>.8)s.value=Math.max(0,s.value-7*dt);
  if(a.skin===6&&s.value<100&&!s.empowered&&!a.rwCast&&clock-s.lastGain>2)s.value=Math.max(0,s.value-5*dt);
  if(!s.comboTime)s.combo=0;
  if(kit){const dx=a.x-pos.x,dy=a.y-pos.y;if(!a.rwCast&&!a.guard&&a.hitReact<=0){a.moving=Math.hypot(dx,dy)>.02;if(a.moving){a.rwFacing=Math.atan2(dy,dx);a.rwStride=((a.rwStride||0)+Math.hypot(dx,dy)/16)%6;}}}
  const q=a.rwCast;if(!q)continue;q.age+=dt;
  if(q.holding){q.charge=Math.min(1,q.age/1.4);if(q.age>=1.4)rwReleaseCharge(a);continue;}
  if(!q.released&&q.age>=q.release){q.released=true;rwRelease(a,q);}
  if(q.age>=q.duration){a.rwCast=null;a.cast=0;a.skillLock=0;}
 }
 const due=[];for(const task of Reforged.tasks){task.remaining-=dt;if(task.remaining<=0)due.push(task);}Reforged.tasks=Reforged.tasks.filter(t=>t.remaining>0);for(const task of due)if(task.owner.hp>0)task.fn();
 for(const d of Reforged.dashes){if(d.owner.hp<=0){d.finished=true;continue;}d.age+=dt;const distance=Math.min(d.distance-d.travel,d.distance/d.duration*dt),from={x:d.owner.x,y:d.owner.y};const collided=move(d.owner,Math.cos(d.angle)*distance,Math.sin(d.angle)*distance);d.travel+=dist(from,d.owner);
  if(d.pierce)for(const target of opponents(d.owner))if(!d.hit.has(target)&&lineDistance(target.x,target.y,from.x,from.y,d.owner.x,d.owner.y)<38){d.hit.add(target);if(hit(target,d.damage,d.owner,0,d.angle,d.owner.kit[d.slot]))reworkState(target).exposed=d.exposed;}
  if(collided||d.age>=d.duration||d.travel>=d.distance-1){d.finished=true;if(d.done)d.done();}
 }
 Reforged.dashes=Reforged.dashes.filter(d=>!d.finished);
 for(const e of Reforged.projectiles)rwAdvanceProjectile(e,dt);Reforged.projectiles=Reforged.projectiles.filter(e=>e.life>0);
 for(const o of objects){if(o.material){o.age+=dt;o.flash=Math.max(0,(o.flash||0)-dt);}if(o.colossus&&o.hp>0&&o.life>0){o.age+=dt;o.cd-=dt;const target=opponents(o.owner).filter(a=>a.hp>0).sort((a,b)=>dist(a,o)-dist(b,o))[0];if(!target)continue;const angle=Math.atan2(target.y-o.y,target.x-o.x);o.angle=angle;if(dist(o,target)>65){const dx=Math.cos(angle)*75*dt,dy=Math.sin(angle)*75*dt;if(!rwObstacle(o.x+dx,o.y+dy,25)){o.x+=dx;o.y+=dy;}}if(o.cd<=0&&dist(o,target)<105&&rwVisible(o,target)){o.cd=1.15;hit(target,o.dmg,o.owner,20,angle,o.owner.kit[5]);rwFx(o.owner,5,o.x,o.y,'golem-hit',.6,{size:o.size});}}}
 for(const e of Reforged.effects)e.age+=dt;Reforged.effects=Reforged.effects.filter(e=>e.age<e.duration);
};
const rwPriorAI=ai;
ai=function(dt,a=b){
 rwPriorAI(dt,a);if(!reworkKit(a)||a.trainingDummy||a.hp<=0||a.rwCast||a.cast>0||a.guard)return;
 a.identityThink=(a.identityThink||0)-dt;if(a.identityThink>0)return;a.identityThink=.65;
 const s=reworkState(a);let slot=null;
 if(!rwResourceReason(a,5)&&a.cd[a.kit[5]]<=0)slot=5;
 else if(a.skin===9&&reworkMaterials(a).length<3)slot=0;
 else if(a.skin===9&&s.iron<=0&&dist(a,enemy(a))<200)slot=4;
 else if(a.skin===6&&s.value>65&&dist(a,enemy(a))<100)slot=1;
 else if(a.skin===6&&!s.empowered&&s.value<55)slot=4;
 else if(a.skin===8&&s.value>=50&&s.cosmic<=0)slot=4;
 else if(a.skin===7&&s.turbo<=0&&s.tired<=0&&a.hp>350)slot=4;
 if(slot!==null)cast(a,a.kit[slot]);
};
const rwPriorUlt=canUseUltimate;
canUseUltimate=function(a){return reworkKit(a)?a.hp>0&&!rwResourceReason(a,5):rwPriorUlt(a);};
window.reworkQA={state:reworkState,resource:reworkResource,cast:rwCast,beginCharge:rwBeginCharge,releaseCharge:rwReleaseCharge,cancelCharge:rwCancelCharge,create:rwCreateBlock,damageConstruct:rwDamageConstruct,gain:rwGain,materials:reworkMaterials,get runtime(){return Reforged},get kits(){return REWORK_KITS}};

