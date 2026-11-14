'use strict';
// Hunter artwork adapters. Combat damage, charge interruption, costs and cooldowns stay in the engine.
const HUNTER32_BODY=rwImage('assets/combat_v35/hunter-body.webp?v=35');
const HUNTER35_SKILLS=rwImage('assets/combat_v35/hunter-skills.webp?v=35');
const HUNTER32_ADULT=rwImage('assets/hunter_v32/adult.webp?v=32');
const HUNTER32_KEYS=['punch','charge','heavy','rod','jump','oath','impact'];
const HUNTER32_FX=Object.fromEntries(HUNTER32_KEYS.map(k=>[k,rwImage(`assets/hunter_v32/${k}.webp?v=32`)]));
const hunter32Registrations=new Map();
function hunter32Register(adult=false){
 const key=adult?'adult':'body';if(hunter32Registrations.has(key))return hunter32Registrations.get(key);
 const im=adult?HUNTER32_ADULT:HUNTER32_BODY;if(!im.complete||!im.naturalWidth)return null;
 const c=document.createElement('canvas');c.width=1254;c.height=adult?836:1254;const g=c.getContext('2d');g.drawImage(im,0,0);
 const d=g.getImageData(0,0,c.width,209).data;let top=209,bottom=-1;
 for(let y=0;y<209;y++)for(let x=0;x<209;x++)if(d[(y*1254+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(bottom<0)return null;const reg={height:bottom-top+1};hunter32Registrations.set(key,reg);return reg;
}
function hunter32Pose(a,t){
 const q=a.rwCast,angle=q?.angle??a.rwFacing??a.a??0,s=reworkState(a);
 const adult=a.hp>0&&!a.knockedDown&&(q?.slot===5&&q.age>=.14||s.pactAdult>0);
 let frame=Math.floor(t*4)%6;
 if(a.hp<=0||a.knockedDown)frame=(a.hp<=0&&typeof v3KoFrame==='function')?v3KoFrame(a):33;
 else if(a.hitReact>0)frame=a.hitReact>.12?30:31;
 else if(adult){
  if(q?.slot===5){
   if(q.age<.28)frame=Math.min(5,Math.floor(q.age/.28*6));
   else if(q.age<q.release)frame=6+clamp(Math.floor((q.age-.28)/Math.max(.01,q.release-.28)*6),0,5);
   else if(q.age<q.release+.27)frame=12+clamp(Math.floor((q.age-q.release)/.27*6),0,5);
   else frame=18+clamp(Math.floor((q.age-q.release-.27)/Math.max(.01,q.duration-q.release-.27)*6),0,5);
  }else frame=18+Math.floor(t*8)%6;
 }else if(a.guard)frame=34;
 else if(a.dodgeTime>0)frame=35;
 else if(q){
  const before=q.holding||q.age<q.release,recovery=q.age>q.duration-.15;
  if(q.slot===0)frame=before?24+Math.floor(t*6)%2:recovery?29:27;
  else if(q.slot===1)frame=before?24:recovery?29:26;
  else if(q.slot===2)frame=before?25:recovery?29:28;
  else if(q.slot===3)frame=35;
  else frame=34;
 }else if(a.punchTime>0)frame=24+clamp(Math.floor((1-a.punchTime/.24)*6),0,5);
 else if(a.moving)frame=(Math.abs(Math.sin(angle))>.65?(Math.sin(angle)>0?12:18):6)+Math.floor(a.rwStride??a.gait??t*10)%6;
 // A hit reaction must use the normal atlas, whose final row contains these states.
 const dash=Reforged.dashes.find(d=>d.owner===a&&!d.finished);
 const skillFrame=a.hp<=0||a.knockedDown||a.hitReact>0||a.guard||adult?undefined:dash?18+combat35Phase(dash.age,.08,dash.duration):q?q.slot*6+combat35Phase(q.age,q.release,q.duration,q.holding):undefined;
 return {adult:adult&&a.hitReact<=0,frame,angle,skillFrame};
}
function hunter32Body(g,a,size=72,t=vfxTime){
 const pose=hunter32Pose(a,t),reg=hunter32Register(pose.adult);if(!reg)return false;
 const q=a.rwCast,skillHeight=pose.skillFrame!==undefined?combat35Height(HUNTER35_SKILLS):0,im=skillHeight?HUNTER35_SKILLS:pose.adult?HUNTER32_ADULT:HUNTER32_BODY,frame=skillHeight?pose.skillFrame:pose.frame;
 const grown=pose.adult?clamp(((q?.age??1)-.14)/.22,0,1):0,k=size/72*(73+grown*30)/(skillHeight||reg.height);
 const leap=Reforged.dashes.find(d=>d.owner===a&&d.leap&&!d.finished);
 g.save();g.imageSmoothingEnabled=false;g.translate(0,9*size/72-(leap?Math.sin(clamp(leap.age/leap.duration,0,1)*Math.PI)*28*size/72:0));g.scale(Math.cos(pose.angle)<0?-1:1,1);
 g.drawImage(im,frame%6*209,Math.floor(frame/6)*209,209,209,-104.5*k,-193*k,209*k,209*k);g.restore();return true;
}
const hunter32OldBody=rwPaintBody;
rwPaintBody=function(g,a,size=72,t=vfxTime){return a.skin===5?hunter32Body(g,a,size,t)||hunter32OldBody(g,a,size,t):hunter32OldBody(g,a,size,t);};
function hunter32Effect(g,key,frame,x,y,size,angle=0,directional=false,alpha=1){
 const im=HUNTER32_FX[key];if(!im?.complete||!im.naturalWidth)return false;
 const f=clamp(Math.floor(frame),0,23);g.save();g.translate(x,y);g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;if(directional)orientSkillSprite(g,angle);
 g.drawImage(im,f%6*256,Math.floor(f/6)*256,256,256,-size/2,-size/2,size,size);g.restore();return true;
}
const hunter32OldSprite=rwSprite;
rwSprite=function(g,skin,slot,x,y,size,phase,angle=0,directional=false,alpha=1,stage=0){
 if(skin!==5)return hunter32OldSprite(g,skin,slot,x,y,size,phase,angle,directional,alpha,stage);
 // The existing holding layer gives .08–.33 for charge level 0–1.
 const frame=slot===0?clamp((phase-.08)/.25,0,1)*15:phase*24;
 return hunter32Effect(g,['charge','punch','rod','jump','oath','oath'][slot],frame,x,y,size,angle,directional,alpha);
};
const hunter32OldPaint=rwPaintFX;
rwPaintFX=function(e){
 if(e.skin!==5)return hunter32OldPaint(e);
 const u=clamp(e.age/e.duration,0,1),x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y,angle=e.angle||0;
 if(e.kind==='hunter-contact')return hunter32Effect(ctx,e.slot===0?'heavy':'impact',u*24,x,y-26,e.size||85,angle,false);
 if(e.kind==='hunter-takeoff')return hunter32Effect(ctx,'jump',u*8,x,y-8,100);
 if(e.slot===3){if(e.kind==='impact')return hunter32Effect(ctx,'jump',16+u*8,x,y-8,e.size||120);return;}
 if(e.slot===5)return; // The cast-aware layer owns the transformation aura.
 if(e.kind==='warning')return hunter32OldPaint(e);
 const key=e.slot===0?'punch':e.slot===1?'punch':e.slot===2?'rod':e.slot===4?'oath':'impact';
 const forward=e.slot<=1?32:0;
 return hunter32Effect(ctx,key,u*24,x+Math.cos(angle)*forward,y-26+Math.sin(angle)*forward,e.size||110,angle,e.slot<=1,e.slot===4?.5:1);
};
const hunter32OldRelease=rwRelease;
rwRelease=function(a,q){
 const result=hunter32OldRelease(a,q);
 if(a.skin===5&&q.slot===3)rwFx(a,3,a.x,a.y,'hunter-takeoff',.18,{size:100,angle:q.angle});
 return result;
};
const hunter32OldHit=hit;
hit=function(target,amount,owner,knock=0,angle=0,id=-1){
 const ok=hunter32OldHit(target,amount,owner,knock,angle,id),s=skills[id];
 if(ok&&owner?.skin===5&&!originalDot&&s?.champion===5)rwFx(owner,s.slot,target.x,target.y,'hunter-contact',s.slot===0?.5:.3,{angle,size:s.slot===0?110+(owner.rwCast?.charge||0)*60:s.slot===5?160:75});
 return ok;
};
const hunter32OldDepth=integratedDepth;
integratedDepth=function(){
 const list=hunter32OldDepth();
 for(const a of actors){if(a.skin!==5||a.hp<=0)continue;const q=a.rwCast;
  if(q?.slot===5)list.push({kind:'hunter-oath',y:a.y-.3,priority:0,paint(){
   const f=q.age<q.release?q.age/q.release*8:q.age<q.duration-.25?8+Math.floor(vfxTime*24)%8:16+clamp((q.age-q.duration+.25)/.25,0,1)*8;
   hunter32Effect(ctx,'oath',f,a.x,a.y-40,160,0,false,.8);
  }});
  const leap=Reforged.dashes.find(d=>d.owner===a&&d.leap&&!d.finished);
  if(leap)list.push({kind:'hunter-leap-shadow',y:a.y-1,priority:0,paint(){hunter32Effect(ctx,'jump',8+clamp(leap.age/leap.duration,0,.999)*8,a.x,a.y+4,85,0,false,.65);}});
 }
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0));
};
const hunter32OldIcon=icon;
icon=function(id){const s=skills[id];return s?.champion===5?`<span class="skill-art reforged-icon" aria-hidden="true" style="background-image:url('assets/hunter_v32/icon-${s.slot}.webp?v=32')"></span>`:hunter32OldIcon(id);};
const hunter32OldArt=championArt;
championArt=c=>c.id===5?'assets/hunter_v32/portrait.webp?v=32':hunter32OldArt(c);
CHAMPION_HEROES.hunter='assets/hunter_v32/portrait.webp?v=32';
const hunter32OldDetail=openChampionDetails;
openChampionDetails=function(id){hunter32OldDetail(id);$('#heroDetail')?.classList.toggle('hunter-detail',Number(id)===5);};
const hunter32OldPreload=reworkPreload;
reworkPreload=function(skin){if(skin!==5)return hunter32OldPreload(skin);for(const key of ['body','adult','portrait',...HUNTER32_KEYS,...Array.from({length:6},(_,i)=>'icon-'+i)])rwImage(key==='body'?'assets/combat_v35/hunter-body.webp?v=35':`assets/hunter_v32/${key}.webp?v=32`);};
