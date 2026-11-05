'use strict';
// Artwork uses the same world coordinates as movement, hitboxes and depth sorting.
const SANCTUARY_ART={};
const SANCTUARY_FLOOR={x:64,y:224,w:1408,h:656};
let sanctuaryGround=null;
for(const [key,file] of Object.entries({scene:'santuario',dummy:'fantoche',lantern:'lanterna'})){
 const im=new Image();SANCTUARY_ART[key]=im;
 im.onload=()=>{if(key!=='dummy'&&p){groundCache=null;buildArenaBackground();}};
 im.src='assets/arena_v15/'+file+'.webp';
}
const sanctuaryBackgroundFallback=buildArenaBackground;
buildArenaBackground=function(){
 const im=SANCTUARY_ART.scene;
 if(!im.naturalWidth||!SANCTUARY_ART.lantern.naturalWidth){sanctuaryBackgroundFallback();return;}
 if(groundCache===sanctuaryGround&&groundCache?.width===W&&groundCache?.height===H)return;
 groundCache=document.createElement('canvas');groundCache.width=W;groundCache.height=H;
 const g=groundCache.getContext('2d'),f=SANCTUARY_FLOOR;
 g.imageSmoothingEnabled=false;g.drawImage(im,f.x,f.y,f.w,f.h,0,0,W,H);
 pillarCache=document.createElement('canvas');pillarCache.width=W;pillarCache.height=H;
 sanctuaryGround=groundCache;backgroundBuilds++;
};
const sanctuarySceneryFallback=drawArenaScenery;
drawArenaScenery=function(){
 const im=SANCTUARY_ART.scene;if(!im.naturalWidth||!SANCTUARY_ART.lantern.naturalWidth){sanctuarySceneryFallback();return;}
 const f=SANCTUARY_FLOOR,sx=W/f.w,sy=H/f.h;
 ctx.save();ctx.fillStyle='#102633';ctx.fillRect(0,0,cw,ch);
 ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(im,-f.x*sx,-f.y*sy,im.naturalWidth*sx,im.naturalHeight*sy);ctx.restore();
};
const sanctuaryDepth=integratedDepth;
integratedDepth=function(){
 const list=sanctuaryDepth();if(groundCache!==sanctuaryGround||!SANCTUARY_ART.lantern.naturalWidth)return list;
 const entries=list.filter(e=>e.kind!=='pillar');
 for(const o of pillars)entries.push({kind:'pillar',y:o.y,priority:0,paint:()=>{
  const size=o.r*4;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ellipse(o.x,o.y+5,o.r+3,o.r*.45,'#08162066');
  // The sprite's plinth spans half its cell, matching the collision diameter.
  ctx.drawImage(SANCTUARY_ART.lantern,o.x-size/2,o.y-size*.83,size,size);ctx.restore();
 }});
 return entries.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0)||(a.serial||0)-(b.serial||0));
};
function sanctuaryDummyFrame(a){
 // Animation timers are simulation time, so pausing also freezes the mannequin.
 if(a.hitReact>0)return 12+clamp(Math.floor((1-a.hitReact/(a.skin>=6?.3:.16))*6),0,5);
 if(a.guard||a.blockFlash>0)return 8+(a.blockFlash>0?1:Math.floor(vfxTime*3)%3);
 if(a.punchTime>0)return 18+clamp(Math.floor((1-a.punchTime/.24)*6),0,5);
 return Math.floor(vfxTime*5)%6;
}
const sanctuaryDummyFallback=drawTrainingDummy;
drawTrainingDummy=function(a){
 const im=SANCTUARY_ART.dummy;if(!im.naturalWidth){sanctuaryDummyFallback(a);return;}
 const frame=sanctuaryDummyFrame(a),size=90;
 ctx.save();ctx.translate(a.x,a.y);
 ellipse(0,9,19,7,'#06100c88');
 ctx.save();ctx.translate(0,8);ctx.scale(1,.42);drawTeamMarker(a);ctx.restore();
 if(a.root>0)outline(0,8,23,'#c6b6e8');
 // Flip horizontally only: aiming up or left never rotates the body.
 ctx.scale(Math.cos(a.a)>0?-1:1,1);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(im,frame%6*128,Math.floor(frame/6)*128,128,128,-size/2,9-size*.92,size,size);
 ctx.restore();
};
const sanctuaryUI=updateUI;
updateUI=function(){
 sanctuaryUI();if(!p)return;
 const target=enemy(p);
 if(target?.trainingDummy){
  const resource=document.querySelector('#enemyResource');if(resource)resource.textContent='ALVO DE TREINO';
 }
};
document.querySelector('.arena-caption').textContent='SANTUÁRIO DAS CEREJEIRAS';
