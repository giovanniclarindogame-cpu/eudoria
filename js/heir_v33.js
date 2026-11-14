'use strict';
// Art-only adapters: the existing engine owns damage, overload and movement.
const HEIR33_BODY=rwImage('assets/heir_v33/body.webp?v=33');
const HEIR33_KEYS=['kick','charge','punch','leap','dash','aura','limit','impact'];
const HEIR33_FX=Object.fromEntries(HEIR33_KEYS.map(k=>[k,rwImage(`assets/heir_v33/${k}.webp?v=33`)]));
let heir33Height=0;
const heir33Falls=new WeakMap();
function heir33Register(){
 if(heir33Height)return heir33Height;
 if(!HEIR33_BODY.complete||!HEIR33_BODY.naturalWidth)return 0;
 const c=document.createElement('canvas');c.width=c.height=209;const g=c.getContext('2d');g.drawImage(HEIR33_BODY,0,0);
 const d=g.getImageData(0,0,209,209).data;let top=209,bottom=-1;
 for(let y=0;y<209;y++)for(let x=0;x<209;x++)if(d[(y*209+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(bottom>=0)heir33Height=bottom-top+1;return heir33Height;
}
function heir33Pose(a,t=vfxTime){
 const q=a.rwCast,angle=q?.angle??a.rwFacing??a.a??0;
 let frame=Math.floor(t*4)%6;
 const dash=Reforged.dashes.find(d=>d.owner===a&&!d.finished);
 if(a.hp<=0||a.knockedDown){
  if(a.hp<=0&&a.koAge!==undefined&&typeof v3KoFrame==='function')return {frame:v3KoFrame(a),angle,lift:0};
  let fall=heir33Falls.get(a);
  if(!fall||fall.generation!==Reforged.generation){fall={t,wall:performance.now(),generation:Reforged.generation};heir33Falls.set(a,fall);}
  // The result screen stops simulation time; let only the final fall finish there.
  const age=Math.max(t-fall.t,state==='end'?(performance.now()-fall.wall)/1000:0);
  return {frame:age<.24?32:33,angle,lift:0};
 }
 heir33Falls.delete(a);
 if(a.hitReact>0)frame=a.hitReact>.12?30:31;
 else if(a.guard)frame=34;
 else if(dash)frame=dash.leap?27:35;
 else if(a.dodgeTime>0)frame=35;
 else if(q){
  const before=q.holding||q.age<q.release,recovery=q.age>q.duration-.15;
  if(q.slot===0||q.slot===5)frame=before?24:recovery?29:25;
  else if(q.slot===1)frame=before?24:recovery?29:26;
  else if(q.slot===2)frame=before?31:29;
  else if(q.slot===3)frame=before?24:recovery?29:25;
  else frame=34;
 }else if(a.punchTime>0)frame=24+clamp(Math.floor((1-a.punchTime/.24)*6),0,5);
 else if(a.moving)frame=(Math.abs(Math.sin(angle))>.65?(Math.sin(angle)>0?12:18):6)+Math.floor(a.rwStride??a.gait??t*10)%6;
 const air=a.identity?.air||0,lift=dash?.leap?Math.sin(clamp(dash.age/dash.duration,0,1)*Math.PI)*26:air>0?Math.sin(Math.PI*air/(a.identity.airTotal||.7))*25:0;
 return {frame,angle,lift};
}
function heir33Body(g,a,size=72,t=vfxTime){
 const height=heir33Register();if(!height)return false;
 const pose=heir33Pose(a,t),k=size/72*73/height;
 g.save();g.imageSmoothingEnabled=false;g.translate(0,(9-pose.lift)*size/72);g.scale(Math.cos(pose.angle)<0?-1:1,1);
 g.drawImage(HEIR33_BODY,pose.frame%6*209,Math.floor(pose.frame/6)*209,209,209,-104.5*k,-193*k,209*k,209*k);g.restore();return true;
}
const heir33OldBody=rwPaintBody;
rwPaintBody=function(g,a,size=72,t=vfxTime){return a.skin===6?heir33Body(g,a,size,t)||heir33OldBody(g,a,size,t):heir33OldBody(g,a,size,t);};
// The old actor renderer skips defeated fighters entirely, so render this K.O. explicitly.
const heir33OldActor=integratedDrawActor;
integratedDrawActor=function(a){
 if(a.skin!==6||a.hp>0||a.boss||a.trainingDummy)return heir33OldActor(a);
 ctx.save();ctx.translate(a.x,a.y);ellipse(0,9,22,6,'#06100c88');heir33Body(ctx,a);ctx.restore();
};
function heir33Effect(g,key,frame,x,y,size,angle=0,directional=false,alpha=1){
 const im=HEIR33_FX[key];if(!im?.complete||!im.naturalWidth)return false;
 const f=clamp(Math.floor(frame),0,23);g.save();g.translate(x,y);g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;if(directional)orientSkillSprite(g,angle);
 g.drawImage(im,f%6*256,Math.floor(f/6)*256,256,256,-size/2,-size/2,size,size);g.restore();return true;
}
const heir33OldSprite=rwSprite;
rwSprite=function(g,skin,slot,x,y,size,phase,angle=0,directional=false,alpha=1,stage=0){
 if(skin!==6)return heir33OldSprite(g,skin,slot,x,y,size,phase,angle,directional,alpha,stage);
 const frame=slot===0?clamp((phase-.12)/.24,0,1)*15:slot===4?8+clamp((phase-.28)/.38,0,.999)*8:phase*24;
 return heir33Effect(g,['charge','kick','leap','dash','aura','limit'][slot],frame,x,y,size,angle,directional,alpha);
};
const heir33OldPaint=rwPaintFX;
rwPaintFX=function(e){
 if(e.skin!==6)return heir33OldPaint(e);
 const u=clamp(e.age/e.duration,0,1),x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y,angle=e.angle||0;
 if(e.kind==='heir-contact')return heir33Effect(ctx,e.slot===0?'punch':'impact',u*24,x,y-28,e.size||80,angle,false);
 if(e.kind==='heir-takeoff')return heir33Effect(ctx,'leap',u*8,x,y-20,100);
 if(e.kind==='heir-landing'||e.slot===2&&e.kind==='impact')return heir33Effect(ctx,'leap',14+u*10,x,y-24,e.size||115);
 if(e.kind==='heir-dash')return heir33Effect(ctx,'dash',u*24,x,y-27,125,angle,true);
 if(e.kind==='heir-aura-off')return heir33Effect(ctx,'aura',16+u*8,x,y-30,115,0,false,.65);
 if(e.kind==='warning')return heir33OldPaint(e);
 if(e.slot===0){if(e.kind==='cast')return heir33Effect(ctx,'charge',16+u*8,x+Math.cos(angle)*30,y-30+Math.sin(angle)*30,75,angle,true);return;}
 if(e.slot===1)return heir33Effect(ctx,'kick',8+u*16,x+Math.cos(angle)*32,y-25+Math.sin(angle)*32,110,angle,true);
 if(e.slot===2||e.slot===4)return;
 if(e.slot===3){if(e.kind==='impact')return heir33Effect(ctx,'impact',u*24,x,y-28,e.size||80);return;}
 if(e.slot===5&&e.kind==='impact')return heir33Effect(ctx,'limit',8+u*16,x,y-30,e.size||230,angle,false);
};
const heir33OldHit=hit;
hit=function(target,amount,owner,knock=0,angle=0,id=-1){
 const ok=heir33OldHit(target,amount,owner,knock,angle,id),s=skills[id];
 if(ok&&owner?.skin===6&&!originalDot&&s?.champion===6)rwFx(owner,s.slot,target.x,target.y,'heir-contact',s.slot===0?.45:.28,{angle,size:s.slot===0?100+(owner.rwCast?.charge||0)*55:s.slot===5?100:65});
 return ok;
};
const heir33OldDash=rwDash;
rwDash=function(a,angle,distance,duration,done,extra={}){
 if(a.skin!==6)return heir33OldDash(a,angle,distance,duration,done,extra);
 if(extra.leap){
  rwFx(a,2,a.x,a.y,'heir-takeoff',.16,{angle});
  return heir33OldDash(a,angle,distance,duration,()=>{
   const serial=Reforged.serial;done?.();
   if(!Reforged.effects.some(e=>e.id>serial&&e.owner===a&&e.slot===2&&e.kind==='impact'))rwFx(a,2,a.x,a.y,'heir-landing',.3,{size:90});
  },extra);
 }
 if(extra.slot===3)rwFx(a,3,a.x,a.y,'heir-dash',duration,{angle,follow:true});
 return heir33OldDash(a,angle,distance,duration,done,extra);
};
const heir33OldCast=rwCast;
rwCast=function(a,id,manual){
 const ending=a?.skin===6&&skills[id]?.slot===4&&reworkState(a).empowered,result=heir33OldCast(a,id,manual);
 if(result&&ending)rwFx(a,4,a.x,a.y,'heir-aura-off',.28,{follow:true});return result;
};
const heir33OldDepth=integratedDepth;
integratedDepth=function(){
 const list=heir33OldDepth();
 for(const a of actors){if(a.skin!==6||a.hp<=0)continue;const q=a.rwCast;
  if(q&&!q.holding&&q.age<q.release&&[0,1,3,4,5].includes(q.slot))list.push({kind:'heir-windup',y:a.y+(q.slot===4?-.2:.7),priority:4,paint(){
   const u=clamp(q.age/q.release,0,1),key=['charge','kick',null,'dash','aura','limit'][q.slot],self=q.slot===4;
   heir33Effect(ctx,key,u*8,a.x+(self?0:Math.cos(q.angle)*25),a.y-30+(self?0:Math.sin(q.angle)*25),self?115:q.slot===5?75+u*60:80,q.angle,!self&&q.slot!==5,.85);
  }});
  const leap=Reforged.dashes.find(d=>d.owner===a&&d.leap&&!d.finished);
  if(leap)list.push({kind:'heir-leap-trail',y:a.y-.3,priority:0,paint(){heir33Effect(ctx,'leap',8+clamp(leap.age/leap.duration,0,.999)*4,a.x,a.y-25,100,0,false,.6);}});
 }
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0)||(a.serial||0)-(b.serial||0));
};
const heir33OldIcon=icon;
icon=function(id){const s=skills[id];return s?.champion===6?`<span class="skill-art reforged-icon" aria-hidden="true" style="background-image:url('assets/heir_v33/icon-${s.slot}.webp?v=33')"></span>`:heir33OldIcon(id);};
const heir33OldArt=championArt;
championArt=c=>c.id===6?'assets/heir_v33/portrait.webp?v=33':heir33OldArt(c);
CHAMPION_HEROES.spark='assets/heir_v33/portrait.webp?v=33';
const heir33OldDetail=openChampionDetails;
openChampionDetails=function(id){heir33OldDetail(id);$('#heroDetail')?.classList.toggle('heir-detail',Number(id)===6);};
const heir33OldPreload=reworkPreload;
reworkPreload=function(skin){if(skin!==6)return heir33OldPreload(skin);for(const key of ['body','portrait',...HEIR33_KEYS,...Array.from({length:6},(_,i)=>'icon-'+i)])rwImage(`assets/heir_v33/${key}.webp?v=33`);};
