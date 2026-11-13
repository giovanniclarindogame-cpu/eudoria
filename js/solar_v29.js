'use strict';
// Solar artwork only: the existing Chama/burn/collision/balance rules stay in combate_seis/v3.
const SOLAR29_BODY=rwImage('assets/solar_v29/body.webp?v=29');
const SOLAR29_FX=Object.fromEntries(['slash','tiger','pillar','dash','phoenix','impact','aura'].map(key=>[key,rwImage(`assets/solar_v29/${key}.webp?v=29`)]));
const solar29Cells=new Map();
let solar29Registration=null;

function solar29Register(){
 if(solar29Registration)return solar29Registration;
 if(!SOLAR29_BODY.complete||!SOLAR29_BODY.naturalWidth)return null;
 const c=document.createElement('canvas');c.width=c.height=1254;
 const g=c.getContext('2d');g.drawImage(SOLAR29_BODY,0,0);
 const data=g.getImageData(0,0,1254,1254).data,frames=[];
 for(let i=0;i<36;i++){
  const x=i%6*209,y=Math.floor(i/6)*209;let top=209,bottom=-1;
  for(let yy=0;yy<209;yy++)for(let xx=0;xx<209;xx++)if(data[((y+yy)*1254+x+xx)*4+3]>170){top=Math.min(top,yy);bottom=Math.max(bottom,yy);}
  if(bottom<0)return null;
  frames.push({x,y,top,bottom});
 }
 return solar29Registration={frames,height:Math.max(...frames.slice(0,6).map(f=>f.bottom-f.top+1))};
}
function solar29Pose(a,t){
 const q=a.rwCast,angle=q?.angle??a.rwFacing??a.a??0;
 let frame=Math.floor(t*4)%6,idle=false;
 if(a.hp<=0||a.knockedDown)frame=33;
 else if(a.hitReact>0)frame=a.hitReact>.12?30:31;
 else if(a.guard)frame=34;
 else if(a.dodgeTime>0)frame=35;
 else if(q){
  const before=q.holding||q.age<q.release,recovery=q.age>q.duration-.15;
  if(q.slot===0)frame=before?24:recovery?29:26;
  else if(q.slot===1)frame=before?25:recovery?29:27;
  else if(q.slot===2)frame=before?25:recovery?29:28;
  else if(q.slot===3)frame=before?24:recovery?29:35;
  else if(q.slot===4)frame=34;
  else frame=before?25:Reforged.dashes.some(d=>d.owner===a&&!d.finished)?35:29;
 }else if(a.punchTime>0)frame=24+clamp(Math.floor((1-a.punchTime/.24)*6),0,5);
 else if(a.moving)frame=(Math.abs(Math.sin(angle))>.65?(Math.sin(angle)>0?12:18):6)+Math.floor(a.rwStride??a.gait??0)%6;
 else idle=true;
 return {frame,idle,angle};
}
function solar29Body(g,a,size=72,t=vfxTime){
 const reg=solar29Register();if(!reg)return false;
 const pose=solar29Pose(a,t),f=reg.frames[pose.frame],k=size/72*73/reg.height;
 g.save();g.imageSmoothingEnabled=false;
 g.translate(0,9*size/72);g.scale(Math.cos(pose.angle)<0?-1:1,1);
 const breath=pose.idle?Math.sin(t*2.6)*.012:0;
 g.scale(1-breath*.25,1+breath);
 // Fixed root and exported baseline: a long sword or fluttering cape never recenters the body.
 g.drawImage(SOLAR29_BODY,f.x,f.y,209,209,-104.5*k,-193*k,209*k,209*k);
 g.restore();return true;
}
const solar29OldBody=rwPaintBody;
rwPaintBody=function(g,a,size=72,t=vfxTime){return a.skin===3?solar29Body(g,a,size,t)||solar29OldBody(g,a,size,t):solar29OldBody(g,a,size,t);};

function solar29Cell(key,frame){
 const im=SOLAR29_FX[key];if(!im?.complete||!im.naturalWidth)return null;
 const f=clamp(Math.floor(frame),0,23),id=key+':'+f;
 if(solar29Cells.has(id))return solar29Cells.get(id);
 const c=document.createElement('canvas');c.width=c.height=256;
 const g=c.getContext('2d');g.drawImage(im,f%6*256,Math.floor(f/6)*256,256,256,0,0,256,256);
 // Square feathering preserves the phoenix wing/tail silhouette, including the corners.
 g.globalCompositeOperation='destination-in';
 for(const vertical of [false,true]){
  const mask=g.createLinearGradient(0,0,vertical?0:256,vertical?256:0);
  mask.addColorStop(0,'#fff0');mask.addColorStop(.0625,'#fff0');mask.addColorStop(.125,'#fff');
  mask.addColorStop(.875,'#fff');mask.addColorStop(.9375,'#fff0');mask.addColorStop(1,'#fff0');
  g.fillStyle=mask;g.fillRect(0,0,256,256);
 }
 solar29Cells.set(id,c);return c;
}
function solar29Effect(g,key,frame,x,y,size,angle=0,directional=false,alpha=1,flipY=false){
 const cell=solar29Cell(key,frame);if(!cell)return false;
 g.save();g.translate(x,y);g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;
 if(directional)orientSkillSprite(g,angle);else if(Math.cos(angle)<0)g.scale(-1,1);
 if(flipY)g.scale(1,-1);   // o arco desce da guarda alta até a frente, como a espada
 g.drawImage(cell,-size/2,-size/2,size,size);g.restore();return true;
}
const solar29OldSprite=rwSprite;
rwSprite=function(g,skin,slot,x,y,size,phase,angle=0,directional=false,alpha=1,stage=0){
 if(skin!==3)return solar29OldSprite(g,skin,slot,x,y,size,phase,angle,directional,alpha,stage);
 if(slot===4)return; // The aura layer below owns its birth, sustain and expiry.
 const burn=slot===0&&size<=64;
 solar29Effect(g,burn?'aura':['slash','tiger','pillar','dash','aura','phoenix'][slot],burn?8+Math.floor(vfxTime*16)%8:phase*24,x,y,size,angle,directional,alpha);
};

// Translate the existing effect events; do not schedule damage or change cooldowns here.
const solar29OldFx=rwFx;
rwFx=function(a,slot,x,y,kind,duration,extra={}){
 if(a.skin===3){
  if(kind==='cast'&&slot===0){kind='solar-cut';duration=.34;}
  else if(kind==='cast'&&slot===4)return;
  else if(kind==='dash'&&(slot===3||slot===5))return;
  else if(kind==='warning'&&slot===2){kind='solar-pillar-warning';extra={...extra,size:(extra.radius||65)*3.3};}
  else if(kind==='impact'&&slot===2){kind='solar-pillar';extra={...extra,size:(extra.size||117)*1.83};}
 }
 return solar29OldFx(a,slot,x,y,kind,duration,extra);
};
const solar29OldRelease=rwRelease;
rwRelease=function(a,q){
 const result=solar29OldRelease(a,q);
 if(a.skin!==3||![3,5].includes(q.slot))return result;
 const dash=Reforged.dashes.find(d=>d.owner===a&&!d.finished);
 if(!dash)return result;
 dash.solar29=true;
 const priorStep=dash.onStep,priorDone=dash.done;let nextTrail=0;
 dash.onStep=function(from){
  priorStep?.(from);
  if(dash.travel>=nextTrail){nextTrail=dash.travel+42;rwFx(a,q.slot,from.x,from.y,'solar-trail',.36,{skin:3,angle:q.angle,size:q.slot===5?130:96});}
 };
 dash.done=function(){
  priorDone?.();
  if(a.hp>0)rwFx(a,q.slot,a.x,a.y,q.slot===5?'solar-phoenix-end':'solar-dash-end',.36,{skin:3,angle:q.angle});
 };
 return result;
};
const solar29OldHit=hit;
hit=function(target,amount,owner,knock=0,angle=0,id=-1){
 const ok=solar29OldHit(target,amount,owner,knock,angle,id);
 if(ok&&owner?.skin===3&&!originalDot&&[0,1,3,5].includes(skills[id]?.slot)){
  rwFx(owner,skills[id].slot,target.x,target.y,'solar-contact',.5,{angle,size:skills[id].slot===5?160:76});
 }
 return ok;
};
const solar29OldPaint=rwPaintFX;
rwPaintFX=function(e){
 if(e.skin!==3)return solar29OldPaint(e);
 const u=clamp(e.age/e.duration,0,1),x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y,angle=e.angle||0;
 if(e.kind==='solar-cut')solar29Effect(ctx,'slash',u*24,x+Math.cos(angle)*30,y+Math.sin(angle)*30-20,124,angle,true,1,true);
 else if(e.kind==='solar-pillar-warning'||e.kind==='solar-pillar'){
  const frame=e.kind==='solar-pillar-warning'?Math.min(7,u*8):8+u*16;
  solar29Effect(ctx,'pillar',frame,x,y-e.size*.33,e.size);
 }else if(e.kind==='solar-trail')solar29Effect(ctx,'dash',8+u*16,x,y-18,e.size,angle,true,.7);
 else if(e.kind==='solar-dash-end')solar29Effect(ctx,'dash',16+u*8,x,y-18,112,angle,true);
 else if(e.kind==='solar-phoenix-end')solar29Effect(ctx,'phoenix',16+u*8,x,y-32,238,angle,true,1-u*.4);
 else if(e.kind==='solar-contact'||e.kind==='impact')solar29Effect(ctx,'impact',u*24,x,y-24,e.size||85,angle,false);
};
const solar29OldDepth=integratedDepth;
integratedDepth=function(){
 const projectiles=Reforged.projectiles;let list;
 Reforged.projectiles=projectiles.filter(e=>e.skin!==3);
 try{list=solar29OldDepth();}finally{Reforged.projectiles=projectiles;}
 for(const e of projectiles)if(e.skin===3&&e.life>0)list.push({kind:'solar-projectile',y:e.y,priority:3,paint(){
  const remaining=(e.range-e.travel)/e.speed;
  const frame=e.age<.14?e.age/.14*8:remaining<.15?16+(1-remaining/.15)*8:8+Math.floor(e.age*24)%8;
  solar29Effect(ctx,'tiger',frame,e.x,e.y-28,e.size||125,e.angle,true);
 }});
 for(const d of Reforged.dashes)if(d.solar29&&!d.finished&&d.owner.hp>0){
  const a=d.owner,ult=d.slot===5;
  list.push({kind:ult?'solar-phoenix-flight':'solar-dash-flight',y:a.y-.4,priority:0,paint(){
   solar29Effect(ctx,ult?'phoenix':'dash',8+Math.floor(d.age*24)%8,a.x,a.y-(ult?32:18),ult?238:126,d.angle,true,ult?.94:.9);
  }});
 }
 for(const a of actors){
  if(a.skin!==3||a.hp<=0)continue;
  const s=reworkState(a),q=a.rwCast;
  if(s.breathing>0)list.push({kind:'solar-breathing',y:a.y-.5,priority:0,paint(){
   const elapsed=7-s.breathing;
   const frame=elapsed<.35?elapsed/.35*8:s.breathing<.6?16+(1-s.breathing/.6)*8:8+Math.floor(vfxTime*16)%8;
   solar29Effect(ctx,'aura',frame,a.x,a.y-36,122,0,false,.8);
  }});
  if(q?.slot===5&&q.age<q.release){
   list.push({kind:'solar-cinematic',y:-10000,priority:-5,paint(){paintUltimateShade(a,clamp(q.age/q.release,0,1));}});
   list.push({kind:'solar-phoenix-birth',y:a.y-.4,priority:0,paint(){
    solar29Effect(ctx,'phoenix',q.age/q.release*8,a.x,a.y-32,238,q.angle,true,.8);
   }});
  }
 }
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0));
};
const solar29OldCinematic=ultimateCinematicActor;
ultimateCinematicActor=function(){return solar29OldCinematic()||actors.find(a=>a.hp>0&&a.skin===3&&a.rwCast?.slot===5);};

const solar29OldIcon=icon;
icon=function(id){const s=skills[id];return s?.champion===3?`<span class="skill-art reforged-icon" aria-hidden="true" style="background-image:url('assets/solar_v29/icon-${s.slot}.webp?v=29')"></span>`:solar29OldIcon(id);};
const solar29OldArt=championArt;
championArt=c=>c.id===3?'assets/solar_v29/portrait.webp?v=29':solar29OldArt(c);
CHAMPION_HEROES.solar='assets/solar_v29/portrait.webp?v=29';
SKINS[3].desc='Cabelo laranja-dourado, capa branca com detalhes solares, armadura dourada e espada com brilho de brasa.';
const solar29OldDetail=openChampionDetails;
openChampionDetails=function(id){solar29OldDetail(id);$('#heroDetail')?.classList.toggle('solar-detail',Number(id)===3);};
