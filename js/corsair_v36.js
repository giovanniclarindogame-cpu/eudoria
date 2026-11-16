'use strict';
// Corsário da Maré: original water-ribbon artwork, using the existing combat events.
const CORSAIR36_ROOT='assets/corsair_v36/';
const CORSAIR36_BODY=rwImage(CORSAIR36_ROOT+'body.webp?v=37');
const CORSAIR36_SKILLS=rwImage(CORSAIR36_ROOT+'skills.webp?v=37');
const CORSAIR36_KEYS=['punch','barrage','burst','launch','aura','charge','giant','impact'];
const CORSAIR36_FX=Object.fromEntries(CORSAIR36_KEYS.map(k=>[k,rwImage(CORSAIR36_ROOT+k+'.webp?v=37')]));
const corsair36Falls=new WeakMap();
function corsair36Pose(a,t=vfxTime){
 const q=a.rwCast,angle=q?.angle??a.rwFacing??a.a??0;
 if(a.hp<=0||a.knockedDown){
  if(a.koAge!==undefined&&typeof v3KoFrame==='function')return {frame:v3KoFrame(a),angle,lift:0};
  let fall=corsair36Falls.get(a);if(!fall||fall.generation!==Reforged.generation){fall={t,wall:performance.now(),generation:Reforged.generation};corsair36Falls.set(a,fall)}
  const age=Math.max(t-fall.t,state==='end'?(performance.now()-fall.wall)/1000:0);
  return {frame:age<.24?32:33,angle,lift:0};
 }
 corsair36Falls.delete(a);
 if(a.hitReact>0)return {frame:a.hitReact>.12?30:31,angle,lift:0};
 if(a.guard)return {frame:34,angle,lift:0};
 const dash=Reforged.dashes.find(d=>d.owner===a&&!d.finished);
 if(dash)return {frame:35,skillFrame:18+combat35Phase(dash.age,.07,dash.duration),angle:dash.angle??angle,lift:dash.leap?Math.sin(clamp(dash.age/dash.duration,0,1)*Math.PI)*26:0};
 if(q){let phase=combat35Phase(q.age,q.release,q.duration,q.holding);
  if(q.slot===1&&phase>=2&&phase<=3)phase=2+Math.floor((q.age-q.release)*20)%2;
  return {frame:24+phase,skillFrame:q.slot*6+phase,angle,lift:0};
 }
 if(a.dodgeTime>0)return {frame:35,angle,lift:0};
 if(a.punchTime>0)return {frame:24+clamp(Math.floor((1-a.punchTime/.24)*6),0,5),angle,lift:0};
 const row=Math.abs(Math.sin(angle))>.65?(Math.sin(angle)>0?2:3):1;
 return {frame:a.moving?row*6+Math.floor(a.rwStride??a.gait??t*10)%6:Math.floor(t*4)%6,angle,lift:0};
}
function corsair36Body(g,a,size=72,t=vfxTime){
 const pose=corsair36Pose(a,t),im=pose.skillFrame===undefined?CORSAIR36_BODY:CORSAIR36_SKILLS,height=combat35Height(im);if(!height)return false;
 const frame=pose.skillFrame??pose.frame,k=size/72*73/height;
 g.save();g.imageSmoothingEnabled=false;g.translate(0,(9-pose.lift)*size/72);g.scale(Math.cos(pose.angle)<0?-1:1,1);
 g.drawImage(im,frame%6*209,Math.floor(frame/6)*209,209,209,-104.5*k,-193*k,209*k,209*k);g.restore();return true;
}
const corsair36OldBody=rwPaintBody;
rwPaintBody=function(g,a,size=72,t=vfxTime){return a.skin===7?corsair36Body(g,a,size,t)||corsair36OldBody(g,a,size,t):corsair36OldBody(g,a,size,t);};
const corsair36OldActor=integratedDrawActor;
integratedDrawActor=function(a){
 if(a.skin!==7||a.hp>0||a.boss||a.trainingDummy)return corsair36OldActor(a);
 ctx.save();ctx.translate(a.x,a.y);ellipse(0,9,22,6,'#06100c88');corsair36Body(ctx,a);ctx.restore();
};
function corsair36Effect(g,key,frame,x,y,size,angle=0,directional=false,alpha=1){
 const im=CORSAIR36_FX[key];if(!im?.complete||!im.naturalWidth)return false;
 const f=clamp(Math.floor(frame),0,23);g.save();g.translate(x,y);g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;if(directional)orientSkillSprite(g,angle);
 g.drawImage(im,f%6*256,Math.floor(f/6)*256,256,256,-size/2,-size/2,size,size);g.restore();return true;
}
const corsair36OldSprite=rwSprite;
rwSprite=function(g,skin,slot,x,y,size,phase,angle=0,directional=false,alpha=1,stage=0){
 if(skin!==7)return corsair36OldSprite(g,skin,slot,x,y,size,phase,angle,directional,alpha,stage);
 return corsair36Effect(g,['punch','barrage','burst','launch','aura','giant'][slot],phase*24,x,y,size,angle,directional,alpha);
};
function corsair36Ribbon(e,u){
 let recovery=.3;
 if(e.kind==='tether'){
  const q=e.owner?.rwCast;if(!q||q.slot!==e.slot)return;
  const duration=Math.min(e.duration,q.duration-q.age+e.age);
  if(duration<=0)return;u=clamp(e.age/duration,0,1);recovery=Math.min(.8,.15/duration);
 }
 const owner=e.followOwner||e.from,from=e.kind==='anchor'?e:owner,to=e.kind==='anchor'?owner:e;
 const angle=Math.atan2(to.y-from.y,to.x-from.x),distance=Math.hypot(to.x-from.x,to.y-from.y);
 const extension=e.kind==='anchor'?1:(e.slot===0?Math.min(1,u/.22):1)*Math.min(1,(1-u)/recovery),length=distance*extension;
 const key=e.kind==='anchor'?'launch':e.slot===1?'barrage':e.slot===2?'burst':'punch',im=CORSAIR36_FX[key];
 if(!im.complete||!im.naturalWidth||length<1)return;
 const f=Math.min(23,Math.floor(u*24)),thickness=e.slot===2?70:e.slot===1?35:44;
 ctx.save();ctx.translate(from.x,from.y-27);ctx.rotate(angle);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(im,f%6*256+16,Math.floor(f/6)*256+16,224,224,0,-thickness/2,length,thickness);ctx.restore();
}
const corsair36OldPaint=rwPaintFX;
rwPaintFX=function(e){
 if(e.skin!==7)return corsair36OldPaint(e);
 const u=clamp(e.age/e.duration,0,1),x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y;
 if(e.kind==='tether'||e.kind==='anchor')return corsair36Ribbon(e,u);
 if(e.kind==='warning')return corsair36OldPaint(e);
 if(e.kind==='corsair-contact')return corsair36Effect(ctx,'impact',u*24,x,y-27,e.size||80,e.angle||0,false);
 if(e.kind==='cast'&&e.slot!==4)return;
 return corsair36Effect(ctx,e.slot===5?'giant':e.slot===4?'aura':'impact',u*24,x,y-28,e.size||100,e.angle||0,e.slot===5);
};
const corsair36OldHit=hit;
hit=function(target,amount,owner,knock=0,angle=0,id=-1){
 const ok=corsair36OldHit(target,amount,owner,knock,angle,id),s=skills[id];
 if(ok&&owner?.skin===7&&!originalDot&&s?.champion===7)rwFx(owner,s.slot,target.x,target.y,'corsair-contact',.32,{angle,size:s.slot===5?145:s.slot===2?100:65});return ok;
};
const corsair36OldDepth=integratedDepth;
integratedDepth=function(){
 const list=corsair36OldDepth();
 for(const a of actors){const q=a.rwCast;if(a.skin!==7||a.hp<=0||!q||q.slot!==5||q.age>=q.release)continue;
  list.push({kind:'corsair-charge',y:a.y-.2,priority:2,paint(){corsair36Effect(ctx,'charge',clamp(q.age/q.release,0,.999)*16,a.x-Math.cos(q.angle)*28,a.y-30,65+q.age/q.release*40,q.angle,false);}});
 }
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0));
};
const corsair36OldIcon=icon;
icon=function(id){const s=skills[id];return s?.champion===7?`<span class="skill-art reforged-icon corsair-skill-art" aria-hidden="true" style="background-image:url('${CORSAIR36_ROOT}icon-${s.slot}.webp?v=37')"></span>`:corsair36OldIcon(id);};
const corsair36OldArt=championArt;
championArt=c=>c.id===7?CORSAIR36_ROOT+'portrait.webp?v=37':corsair36OldArt(c);
CHAMPION_HEROES.tide=CORSAIR36_ROOT+'portrait.webp?v=37';
const corsair36OldDetail=openChampionDetails;
openChampionDetails=function(id){corsair36OldDetail(id);$('#heroDetail')?.classList.toggle('corsair-detail',Number(id)===7);};
const corsair36OldPreload=reworkPreload;
reworkPreload=function(skin){if(skin!==7)return corsair36OldPreload(skin);for(const key of ['body','skills','portrait',...CORSAIR36_KEYS,...Array.from({length:6},(_,i)=>'icon-'+i)])rwImage(CORSAIR36_ROOT+key+'.webp?v=37');};
