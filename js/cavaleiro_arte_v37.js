'use strict';
// Artwork only. Timing, damage, costs, targets and scheduled impacts belong to cavaleiro_v3.js.
const CAVALEIRO37_ROOT='assets/cavaleiro_v37/';
const CAVALEIRO37_KEYS=['punch','comet','kick','dash','meteor','final','constellation','exposed','stage'];
const CAVALEIRO37_BODY=rwImage(CAVALEIRO37_ROOT+'body.webp?v=37');
const CAVALEIRO37_SKILLS=rwImage(CAVALEIRO37_ROOT+'skills.webp?v=37');
const CAVALEIRO37_FX=Object.fromEntries(CAVALEIRO37_KEYS.map(k=>[k,rwImage(CAVALEIRO37_ROOT+k+'.webp?v=37')]));
// Bright-core registration keeps every explosion centered on its actual hit point.
const CAVALEIRO37_IMPACT_ANCHORS={"meteor":[[130,161],[132,151],[139,143],[134,134],[130,118],[127,121],[127,122],[125,122],[127,124],[127,123],[133,114],[129,116],[132,121],[129,122],[128,118],[119,109]],"final":[[132,164],[134,153],[132,142],[132,131],[127,123],[129,123],[132,121],[132,121],[126,118],[125,119],[123,117],[123,119],[123,120],[128,121],[131,124],[125,151]]};
const cav37Falls=new WeakMap(),cav37Flights=new WeakMap();
const cav37Hero=a=>a?.skin===8&&!a.boss&&!a.trainingDummy&&!a.mob&&!a.rmob;
function cav37Pose(a,t=vfxTime){
 const q=a.rwCast,angle=q?.angle??a.rwFacing??a.a??0;
 if(a.hp<=0||a.knockedDown){
  if(a.koAge!==undefined&&typeof v3KoFrame==='function')return {frame:v3KoFrame(a),angle};
  let fall=cav37Falls.get(a);if(!fall||fall.generation!==Reforged.generation){fall={t,wall:performance.now(),generation:Reforged.generation};cav37Falls.set(a,fall)}
  return {frame:Math.max(t-fall.t,state==='end'?(performance.now()-fall.wall)/1000:0)<.24?32:33,angle};
 }
 cav37Falls.delete(a);
 if(a.hitReact>0)return {frame:a.hitReact>.12?30:31,angle};
 if(a.guard)return {frame:34,angle};
 const dash=Reforged.dashes.find(d=>d.owner===a&&!d.finished);
 if(dash)return {skillFrame:18+combat35Phase(dash.age,.04,dash.duration),angle:dash.angle};
 if(q){
  let phase=combat35Phase(q.age,q.release,q.duration,q.holding);
  // Three legible wind-up drawings occupy the gameplay's existing 0.3 seconds.
  if(q.slot===1)phase=q.age<q.release?Math.min(2,Math.floor(q.age/q.release*3)):phase<4?3:phase;
  if(q.slot===0&&phase>=2&&phase<=3)phase=2+Math.floor((q.age-q.release)*18)%2;
  if(q.slot===5&&q.age>=q.release&&phase<4)phase=3;
  const row=q.slot===5?4:q.slot===4?5:q.slot;
  return {skillFrame:row*6+phase,angle};
 }
 if(a.dodgeTime>0)return {frame:35,angle};
 if(a.punchTime>0)return {frame:24+clamp(Math.floor((1-a.punchTime/.24)*6),0,5),angle};
 if(state==='end'&&a===p&&a.hp>0)return {skillFrame:30+Math.floor(t*3)%6,angle};
 const row=Math.abs(Math.sin(angle))>.65?(Math.sin(angle)>0?2:3):1;
 return {frame:a.moving?row*6+Math.floor(a.rwStride??a.gait??t*10)%6:Math.floor(t*4)%6,angle};
}
function cav37Body(g,a,size=72,t=vfxTime){
 const pose=cav37Pose(a,t),im=pose.skillFrame===undefined?CAVALEIRO37_BODY:CAVALEIRO37_SKILLS,h=combat35Height(im);if(!h)return false;
 const frame=pose.skillFrame??pose.frame,k=size/72*73/h;
 g.save();g.imageSmoothingEnabled=false;g.translate(0,9*size/72);g.scale(Math.cos(pose.angle)<0?-1:1,1);
 g.drawImage(im,frame%6*209,Math.floor(frame/6)*209,209,209,-104.5*k,-193*k,209*k,209*k);g.restore();return true;
}
const cav37OldBody=rwPaintBody;
rwPaintBody=function(g,a,size=72,t=vfxTime){return cav37Hero(a)?cav37Body(g,a,size,t)||cav37OldBody(g,a,size,t):cav37OldBody(g,a,size,t)};
// Bypass the old low-resolution intermediate grid for this detailed atlas.
const cav37OldFighter=drawAnimatedFighter;
drawAnimatedFighter=function(g,a,size=72,t=vfxTime){return cav37Hero(a)?cav37Body(g,a,size,t)||cav37OldFighter(g,a,size,t):cav37OldFighter(g,a,size,t)};
const cav37OldActor=integratedDrawActor;
integratedDrawActor=function(a){if(!cav37Hero(a)||a.hp>0)return cav37OldActor(a);ctx.save();ctx.translate(a.x,a.y);ellipse(0,9,22,6,'#06100c88');cav37Body(ctx,a);ctx.restore()};
function cav37Effect(g,key,frame,x,y,width,height=width,angle=0,alpha=1,originY=.5,originX=.5){
 const im=CAVALEIRO37_FX[key];if(!im?.complete||!im.naturalWidth)return false;
 const f=clamp(Math.floor(frame),0,23);g.save();g.translate(x,y);g.rotate(angle);g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;
 g.drawImage(im,f%6*256,Math.floor(f/6)*256,256,256,-width*originX,-height*originY,width,height);g.restore();return true;
}
const cav37OldSprite=rwSprite;
rwSprite=function(g,skin,slot,x,y,size,phase,angle=0,directional=false,alpha=1,stage=0){
 if(skin!==8)return cav37OldSprite(g,skin,slot,x,y,size,phase,angle,directional,alpha,stage);
 if(slot===4&&window.CavaleiroV3)return true; // Cosmo is represented by the three stage stars.
 return cav37Effect(g,['punch','comet','kick','dash','constellation','meteor'][slot],phase*24,x,y,size,size,directional?angle:0,alpha);
};
const cav37OldPaint=rwPaintFX;
rwPaintFX=function(e){
 if(e.skin!==8)return cav37OldPaint(e);
 const u=clamp(e.age/e.duration,0,1),x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y;
 if(e.kind==='cav37-contact')return cav37Effect(ctx,'punch',u*24,x,y-27,e.size||62);
 if(e.kind==='warning')return cav37Effect(ctx,'constellation',u*8,x,y,e.radius*2,e.radius*.84,0,1-u*.3);
 if(e.kind==='cast'){
  if(e.slot===2){ctx.save();ctx.translate(x+Math.cos(e.angle)*24,y-28);ctx.scale(Math.cos(e.angle)<0?-1:1,1);const drawn=cav37Effect(ctx,'kick',u*24,0,0,100);ctx.restore();return drawn}
  return; // Body atlas supplies anticipation; projectile/contact events supply impacts.
 }
 if(e.slot===5){const key=(e.size||0)>150?'final':'meteor',frame=Math.min(23,Math.floor(8+u*16)),anchor=CAVALEIRO37_IMPACT_ANCHORS[key][frame-8];return cav37Effect(ctx,key,frame,x,y,e.size||100,e.size||100,0,1,anchor[1]/256,anchor[0]/256)}
 return cav37Effect(ctx,e.slot===2?'kick':'punch',u*24,x,y-27,e.size||75);
};
const cav37OldHit=hit;
hit=function(target,amount,owner,knock=0,angle=0,id=-1){
 const hp=target?.hp,result=cav37OldHit(target,amount,owner,knock,angle,id),s=skills[id];
 if(result&&target?.hp<hp&&cav37Hero(owner)&&!originalDot&&s?.champion===8&&s.slot!==5)rwFx(owner,s.slot,target.x,target.y,'cav37-contact',.3,{angle,size:s.slot===2?78:58});
 return result;
};
// Observe the actual scheduled tasks, without adding, delaying or replacing one.
// Their remaining times drive the short falling phase before each real impact.
const cav37OldRelease=rwRelease;
rwRelease=function(a,q){
 if(!cav37Hero(a)||q.slot!==5||!window.CavaleiroV3)return cav37OldRelease(a,q);
 const before=new Set(Reforged.tasks),oldUlts=new Set(CavaleiroV3.ULTS),target=enemy(a),fallback=q.target||{x:a.x+Math.cos(q.angle)*200,y:a.y+Math.sin(q.angle)*200};
 const result=cav37OldRelease(a,q),U=CavaleiroV3.ULTS.find(u=>!oldUlts.has(u));
 if(U){const tasks=Reforged.tasks.filter(task=>task.owner===a&&!before.has(task));cav37Flights.set(U,{tasks,target,fallback,generation:Reforged.generation})}
 return result;
};
function cav37Link(from,to,alpha){
 const distance=Math.hypot(to.x-from.x,to.y-from.y);if(distance<1)return;
 cav37Effect(ctx,'constellation',12,(from.x+to.x)/2,(from.y+to.y)/2,distance,3,Math.atan2(to.y-from.y,to.x-from.x),alpha);
}
function cav37Constellation(U){
 const P=U.pts;
 for(let i=0;i<P.length;i++){
  const alpha=Math.max(0,1-(clock-P[i].t)/1.2);
  if(i)cav37Link(P[i-1],P[i],.55*alpha);
  cav37Effect(ctx,'stage',8+Math.floor(vfxTime*8)%8,P[i].x,P[i].y,16,16,0,.9*alpha);
 }
 if(U.final){
  const k=Math.min(1,(clock-U.final.t)/.5),alpha=U.boom?Math.max(0,1-(clock-U.boom)/.5):1,r=95*(1.25-.25*k);
  cav37Effect(ctx,'constellation',8+Math.floor(k*7),U.final.x,U.final.y,r*2,r*.84,0,.5*alpha);
  for(const point of P)cav37Link(point,U.final,.35*alpha*k);
  cav37Effect(ctx,'stage',16+Math.floor(k*7),U.final.x,U.final.y,(8+k*8)*2.5,(8+k*8)*2.5,0,.9*alpha);
 }
}
function cav37PaintFlights(U){
 const info=cav37Flights.get(U);if(!info||info.generation!==Reforged.generation||U.a.hp<=0)return;
 const n=info.tasks.length-2;
 for(let i=0;i<info.tasks.length;i++){
  if(i===n)continue; // This task creates the original final-impact warning.
  const task=info.tasks[i],remaining=task.remaining;if(remaining<=0||remaining>.16||!Reforged.tasks.includes(task))continue;
  let point;
  if(i>n)point=U.final;
  else{
   const c=info.target&&info.target!==U.a&&info.target.hp>0?info.target:info.fallback;
   // Visual preview of the existing spiral; gameplay still chooses the point at impact time.
   const angle=i*2.399963,r=14+i%3*15;point={x:c.x+Math.cos(angle)*r,y:c.y+Math.sin(angle)*r*.7};
  }
  if(point){const size=i>n?171:90;cav37Effect(ctx,i>n?'final':'meteor',Math.min(7,(1-remaining/.16)*8),point.x,point.y,size,size,0,1,160/256)}
 }
}
function cav37Hud(a){
 const s=reworkState(a),stage=CavaleiroV3.stageOf(s.value),f=Math.floor(vfxTime*8)%8;
 for(let k=0;k<3;k++){const lit=k<=stage,size=lit?12:9;cav37Effect(ctx,'stage',(lit?(stage===2?16:8):0)+f,a.x-9+k*9,a.y-69,size,size,0,lit?1:.8)}
 if(s.combo>=2&&s.comboTime>0){ctx.save();ctx.globalAlpha=.4+.6*Math.min(1,s.comboTime/1.4);ctx.font='800 13px system-ui';ctx.textAlign='left';ctx.lineWidth=3;ctx.strokeStyle='#06101ccc';ctx.strokeText('×'+s.combo,a.x+27,a.y-58);ctx.fillStyle=s.combo>=6?'#ffe27a':'#a8dcff';ctx.fillText('×'+s.combo,a.x+27,a.y-58);ctx.restore()}
 const q=a.rwCast;if(q?.slot===1&&q.age<q.release){const k=q.age/q.release,size=(3+k*8)*2.6;cav37Effect(ctx,'stage',8+Math.min(7,k*8),a.x+Math.cos(q.angle)*20,a.y-24+Math.sin(q.angle)*14,size,size,0,.5+.5*k)}
}
const cav37OldDepth=integratedDepth;
integratedDepth=function(){
 let list=cav37OldDepth();
 if(window.CavaleiroV3){
  list=list.filter(node=>!['v3-cav-const','v3-exposed','v3-cav-hud'].includes(node.kind));
  for(const U of CavaleiroV3.ULTS){
   list.push({kind:'v3-cav-const',y:-1e8,priority:-8,paint:()=>cav37Constellation(U)});
   list.push({kind:'cav37-falling',y:U.final?.y??U.a.y+1,priority:5,paint:()=>cav37PaintFlights(U)});
  }
  for(const a of actors){
   if(a.hp<=0)continue;
   if(a.identity?.exposed>0)list.push({kind:'v3-exposed',y:99995+a.y*.001,priority:9,paint(){
    const pul=.6+.4*Math.sin(clock*12);cav37Effect(ctx,'exposed',8+Math.floor(vfxTime*12)%8,a.x,a.y-86,24,24,0,.55+.45*pul);
    ctx.save();ctx.font='700 8px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffe27a';ctx.fillText('EXPOSTO',a.x,a.y-96);ctx.restore();
   }});
   if(cav37Hero(a))list.push({kind:'v3-cav-hud',y:99996+a.y*.001,priority:9,paint:()=>cav37Hud(a)});
  }
 }
 for(const d of Reforged.dashes)if(cav37Hero(d.owner)&&!d.finished)list.push({kind:'cav37-dash',y:d.owner.y-.2,priority:0,paint(){cav37Effect(ctx,'dash',d.age/d.duration*24,d.owner.x-Math.cos(d.angle)*25,d.owner.y-22,115,65,d.angle)}});
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0));
};
const cav37OldIcon=icon;
icon=function(id){const s=skills[id];return s?.champion===8?`<span class="skill-art reforged-icon cavaleiro-skill-art" aria-hidden="true" style="background-image:url('${CAVALEIRO37_ROOT}icon-${s.slot>=4?4:s.slot}.webp?v=37')"></span>`:cav37OldIcon(id)};
const cav37OldArt=championArt;
championArt=c=>c.id===8?CAVALEIRO37_ROOT+'portrait.webp?v=37':cav37OldArt(c);
CHAMPION_HEROES.star=CAVALEIRO37_ROOT+'portrait.webp?v=37';
const cav37OldDetail=openChampionDetails;
openChampionDetails=function(id){cav37OldDetail(id);$('#heroDetail')?.classList.toggle('cavaleiro-detail',Number(id)===8)};
const cav37OldPreload=reworkPreload;
reworkPreload=function(skin){if(skin!==8)return cav37OldPreload(skin);for(const key of ['body','skills','portrait',...CAVALEIRO37_KEYS,...Array.from({length:5},(_,i)=>'icon-'+i)])rwImage(CAVALEIRO37_ROOT+key+'.webp?v=37')};
// One explicit face crop for HUD, mini-cards and all fighter-selection modes.
function cav37FaceCrop(im){
 const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d'),k=im.naturalWidth/760;g.imageSmoothingQuality='high';
 g.drawImage(im,180*k,40*k,440*k,440*k,0,0,96,96);return c.toDataURL('image/webp',.95);
}
if(window.v3FaceSrc){
 const old=window.v3FaceSrc,im=rwImage(CAVALEIRO37_ROOT+'portrait.webp?v=37');let face=null;
 window.v3FaceSrc=function(a){if(!cav37Hero(a)||!Array.isArray(a.kit)||a.kit.length!==6)return old(a);if(!face&&im.complete&&im.naturalWidth)face=cav37FaceCrop(im);return face};
 const crop=window.v3FaceCrop;window.v3FaceCrop=im=>im.src.includes('/cavaleiro_v37/')?cav37FaceCrop(im):crop(im);
}
