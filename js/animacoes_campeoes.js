'use strict';
// Shared by the game and the animation studio. The feet remain on a fixed anchor.
const EldoriaMotion = (() => {
 const keys=['spark','tide','star','steel'];
 const peaks={bolt:10,whip:9,dash:10,float:10,power:9,legacy:10,stretch:13,barrage:10,sling:10,armor:10,steam:10,king:11,meteors:10,comet:10,wings:14,aegis:10,cosmos:12,pegasus:10,lance:11,wall:11,spikes:11,blade:10,repair:11,cathedral:11};
 const clamp=x=>Math.max(0,Math.min(1,x));
 const frameAt=(frames,p)=>frames[Math.min(frames.length-1,Math.floor(clamp(p)*frames.length))];
 function sample(a,t=0){
  const key=keys[a.skin-6];if(!key)return null;
  const track=a.dojoMotion||{};
  const angle=track.facing??a.a??0;
  const pose={state:'idle',source:key+'-states',frame:0,progress:0,offsetX:0,offsetY:0,tilt:0,facing:Math.cos(angle)<-.1?-1:1};
  if(a.hitReact>0){
   const u=clamp(1-a.hitReact/.30);
   return {...pose,state:'hurt',frame:frameAt([30,30,31,32,33,35],u),progress:u,offsetX:-Math.sin(u*Math.PI)*2.5};
  }
  const cast=a.dojo4Cast;
  if(cast?.skill){
   const q=cast.skill,age=Math.max(0,cast.age||0),peak=peaks[q.type]||10;
   const release=q.release,total=q.duration,recovery=release+(total-release)*.58;
   let frame;
   // Anticipation, contact held for readability, then a concise recovery.
   if(age<release)frame=Math.min(peak-1,Math.floor(clamp(age/release)*(peak-1)));
   else if(age<release+.09)frame=peak;
   else if(age<recovery)frame=frameAt([peak,Math.min(peak+1,15),Math.min(peak+2,15)],(age-release-.09)/Math.max(.01,recovery-release-.09));
   else frame=frameAt([16,17,20,23],(age-recovery)/Math.max(.01,total-recovery));
   return {...pose,state:'cast',source:key+'-'+q.type,frame,progress:clamp(age/total),facing:Math.cos(cast.angle??angle)<-.1?-1:1};
  }
  if(a.dodgeTime>0||a.dash>0){
   const u=clamp(1-(a.dodgeTime>0?a.dodgeTime/.22:a.dash/.36));
   return {...pose,state:'dodge',frame:frameAt([7,8,9,10,11],u),progress:u,tilt:.10*Math.sin(u*Math.PI),offsetY:-Math.sin(u*Math.PI)*4};
  }
  if(a.guard)return {...pose,state:'guard',frame:34};
  if(a.punchTime>0){
   const u=clamp(1-a.punchTime/.24);
   return {...pose,state:'punch',frame:frameAt([24,25,26,26,27,28,29],u),progress:u,offsetX:Math.sin(u*Math.PI)*2};
  }
  if(a.moving){
   const direction=track.direction??angle,sy=Math.sin(direction);
   const row=sy<-.65?3:sy>.65?2:1;
   const stride=track.stride??a.gait??0;
   const cycle=((stride%6)+6)%6;
   return {...pose,state:'walk',frame:row*6+Math.floor(cycle),progress:cycle/6,facing:row===1?(Math.cos(direction)<0?-1:1):1};
  }
  return {...pose,frame:frameAt([0,1,2,3,2,1],((t*.65)%1+1)%1),offsetY:-Math.sin(t*2.5)*.45};
 }
 function track(a,before){
  const dx=a.x-before.x,dy=a.y-before.y,distance=Math.hypot(dx,dy);
  const m=a.dojoMotion||(a.dojoMotion={facing:a.a||0,direction:a.a||0,stride:0});
  const action=a.dojo4Cast||a.guard||a.punchTime>0||a.hitReact>0||a.dodgeTime>0||a.dash>0;
  if(!action){a.moving=distance>.02;if(a.moving){m.direction=Math.atan2(dy,dx);m.facing=m.direction;m.stride=(m.stride+distance/16)%6;}}
  else if(a.dojo4Cast)m.facing=a.dojo4Cast.angle;
  else if(a.dodgeTime>0)m.facing=a.dodgeA;
  else if(a.hitReact<=0)m.facing=a.a;
 }
 function castFrame(q){
  const age=q.age,release=q.skill.release,total=q.skill.duration;
  if(age<release)return Math.min(2,Math.floor(age/release*3));
  if(age<release+.12)return 3;
  if(age<release+(total-release)*.64)return 4;
  return 5;
 }
 return {sample,track,keys,castFrame};
})();
if(typeof module!=='undefined')module.exports=EldoriaMotion;
