'use strict';
const KI_ORB_IMAGE=rwImage('assets/reforged_v10/ki-orb.webp');
const ASTRAL_COMBO_VFX=rwImage('assets/reforged_v10/astral-combo-vfx.webp');
const ASTRAL_WAVE_ART=Object.fromEntries(['charge','beam','impact'].map(k=>[k,rwImage('assets/reforged_v10/wave-'+k+'.webp')]));
const ASTRAL14_ART=Object.fromEntries(['body','blink','aura','solar','blast'].map(k=>[k,rwImage('assets/reforged_v10/astral14-'+k+'.webp')]));
CHAMPION_HEROES.astral='assets/astral_v18/portrait.webp';
const astralPreviousChampionArt=championArt;
championArt=c=>c.id===0?CHAMPION_HEROES.astral:astralPreviousChampionArt(c);
const ASTRAL18_SOLAR=rwImage('assets/astral_v18/solar-fx.webp');
function astralSolarFX(g,blast,phase,x,y,size){
 if(!ASTRAL18_SOLAR.naturalWidth)return;const f=(blast?12:0)+Math.min(11,Math.floor(phase*12));
 g.drawImage(ASTRAL18_SOLAR,f%6*256,Math.floor(f/6)*256,256,256,x-size/2,y-size/2,size,size);
}
function astral14Cell(g,key,frame,x,y,w,h=w){
 const im=ASTRAL14_ART[key];if(!im.naturalWidth)return false;
 const f=clamp(Math.floor(frame),0,23);g.imageSmoothingEnabled=false;g.drawImage(im,f%6*128,Math.floor(f/6)*128,128,128,x,y,w,h);return true;
}
function astral14Pose(q){
 if(q.slot===1){
  if(q.age<q.release+.05)return 8;
  const times=q.comboTimes||[];for(let i=0;i<times.length;i++){
   const t=times[i];if(q.age<t-.045)return i%2*3;
   if(q.age<t+.035)return i%2*3+1;
   if(q.age<t+.075)return i%2*3+2;
  }return 5;
 }
 if(q.slot===3)return q.age<q.release?7+Math.min(2,Math.floor(q.age/q.release*3)):q.age<.17?10:11;
 if(q.slot===4)return q.holding?12+(q.age<.18?0:1+Math.floor(q.age*8)%3):q.age<q.release?12:16;
 if(q.slot===5)return q.age<.15?18:q.age<.3?19:q.age<q.release?20+Math.floor(q.age*6)%2:q.age<q.release+.3?22:23;
 return 0;
}
function astral14Body(g,a,size,q){
 const d=astralDirection(q.angle),im=astralImages[(astralWorn(a)?'worn-':'')+'cast-'+d.name];if(!im.naturalWidth)return false;
 let row=0,pose=0;
 if(q.slot===1){row=1;const times=q.comboTimes||[],i=times.findIndex(t=>q.age<t+.075);pose=q.comboDashing?4:i<0?7:q.age<times[i]-.045?3:q.age<times[i]+.035?(i%2?6:5):3;}
 if(q.slot===3){row=2;pose=q.age<q.release?2:7;}
 if(q.slot===4){row=4;pose=q.age<.16?1:3;}
 if(q.slot===5){row=5;pose=q.age<.15?1:q.age<.3?2:q.age<q.release?3:q.age<q.release+.18?4:7;}
 const k=size/64;g.save();g.scale(d.flip,1);g.imageSmoothingEnabled=false;
 // Same source, scale and foot anchor as the regular fighter; omit baked-in FX outside the body.
 g.drawImage(im,pose*160+48,row*160+50,72,66,-32*k,-64*k+12,72*k,66*k);g.restore();return true;
}
function paintAstral14FX(g,e){
 const u=clamp(e.age/e.duration,0,.999),x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y;
 g.save();
 if(e.kind==='astral-depart'||e.kind==='astral-arrive'){
  const size=e.size||75;
  astral14Cell(g,'blink',u*24,x-size/2,y-32-size/2,size);
 }else if(e.kind==='astral-awaken'||e.kind==='astral-aura-end'){
  const ending=e.kind==='astral-aura-end',size=ending?94:80+Math.sin(u*Math.PI)*48;
  g.globalAlpha=ending?(1-u)*.55:Math.sin(u*Math.PI)*.65;
  astral14Cell(g,'aura',u*24,x-size/2,y-size*.78,size);
 }else if(e.kind==='astral-solar-flight'){
  const travel=clamp(u/.88,0,1),size=75+e.stage*25;
  const sx=e.from.x+(x-e.from.x)*travel,sy=e.from.y+(y-15-e.from.y)*travel-Math.sin(travel*Math.PI)*45;
  astral14Cell(g,'solar',u*24,sx-size/2,sy-size/2,size);
  astralSolarFX(g,false,(e.age*2)%1,sx,sy,size*1.3);
 }else if(e.kind==='astral-solar-contact'){
  const size=75+e.stage*25;astral14Cell(g,'solar',18+u*5,x-size/2,y-15-size*.5*(1-u*.35),size,size*(1-u*.35));astralSolarFX(g,false,u,x,y-15,size*1.3);
 }else if(e.kind==='astral-solar-blast'){
  const size=e.radius*2.3;
  g.globalAlpha=e.age>1.3?(e.duration-e.age)/.5:1;
  astralSolarFX(g,true,u,x,y-size*.18,size);
 }
 g.restore();
}
function paintSolarPreparation(g,a,q){
 const progress=clamp(q.age/q.release,0,1),size=(75+(q.stage||0)*25)*Math.min(1,progress*1.3);
 g.save();astral14Cell(g,'solar',progress*23,a.x-size/2,a.y-105-size/2,size);astralSolarFX(g,false,(q.age*2)%1,a.x,a.y-105,size*1.3);g.restore();
}
function paintSolarMarker(g,x,y,r,alpha=.25){
 g.save();g.globalAlpha=alpha;g.fillStyle='#0b223a';g.strokeStyle='#a4eeff';g.lineWidth=2;
 g.beginPath();g.ellipse(x,y,r,r*.48,0,0,TAU);g.fill();g.stroke();g.restore();
}
function waveCell(g,key,frame,x,y,w,h=w){
 const im=ASTRAL_WAVE_ART[key];if(!im.naturalWidth)return;
 const f=clamp(Math.floor(frame),0,23);g.drawImage(im,f%6*128,Math.floor(f/6)*128,128,128,x,y,w,h);
}
function paintWaveCharge(g,a,q){
 if(q.holding&&q.age<.2)return;
 const d=astralDirection(q.angle),charge=q.charge||0;
 const move=q.holding?0:clamp((q.age/q.release-.55)/.45,0,1),hand=astralWaveOrigin(a,q.angle);
 const x=(a.x+(d.name==='side'?-7*d.flip:0))*(1-move)+hand.x*move,y=(a.y+(d.name==='back'?-27:-17))*(1-move)+(hand.y-28)*move;
 const frame=charge<.8?Math.floor(charge/.8*18):18+Math.floor(q.age*18)%6;
 g.save();g.imageSmoothingEnabled=false;
 const size=32+charge*14;waveCell(g,'charge',frame,x-size/2,y-size/2,size);g.restore();
}
function paintConcentratedWave(g,e){
 if(e.owner.hp<=0||!e.owner.copySource&&e.owner.rwCast!==e.cast)return;
 const {from,to}=astralWavePath(e.owner,e.angle,e.range),length=dist(from,to);if(length<1)return;
 const u=clamp(e.age/e.duration,0,1),envelope=Math.min(1,e.age/.06,(1-u)/.18);
 const height=(72+e.charge*44+e.stage*14)*Math.max(0,envelope),travel=Math.min(length,length*e.age/.05),frame=Math.floor(u*24);
 g.save();g.translate(from.x,from.y-28);orientSkillSprite(g,e.angle);g.imageSmoothingEnabled=false;
 // Repeat square texture tiles, cropping the last tile to the actual reach.
 const tile=72;for(let x=0;x<travel;x+=tile){
  const w=Math.min(tile,travel-x),im=ASTRAL_WAVE_ART.beam;if(!im.naturalWidth)break;
  const f=frame%24;g.drawImage(im,f%6*128+2,Math.floor(f/6)*128+16,124*w/tile,112,x,-height/2,w,height);
 }
 waveCell(g,'charge',18+frame%6,-height*.225,-height*.225,height*.45);
 waveCell(g,'impact',frame,travel-height*.32,-height*.4,height*.8);
 g.restore();
}
function paintWaveBody(g,a,size,q){
 const d=astralDirection(q.angle),im=astralImages[(astralWorn(a)?'worn-':'')+'cast-'+d.name];if(!im.naturalWidth)return false;
 const beamAge=q.age-q.release;
 const pose=q.holding?(q.age<.12?1:q.age<.2?2:3):q.age<q.release?(q.age<q.release*.55?3:4):beamAge<.7?4:7;
 const k=size/64;g.save();g.scale(d.flip,1);g.imageSmoothingEnabled=false;
 if(!q.holding&&beamAge>=0&&beamAge<.15)g.translate(-3*Math.sin(beamAge/.15*Math.PI),0);
 // Only the fighter region: the old sheet includes baked-in lines outside the hands.
 g.drawImage(im,pose*160+48,50,64,66,-32*k,-64*k+12,64*k,66*k);g.restore();return true;
}
function paintKiOrb(g,e,impact=false){
 if(!KI_ORB_IMAGE.naturalWidth)return;
 const frame=Math.floor((e.age*28+(e.volleyIndex||0))%4),stage=e.stage||0,size=impact?e.size*(1+e.age*2.2):e.size;
 g.save();g.translate(Math.round(e.x),Math.round(e.y-28));orientSkillSprite(g,e.angle||0);g.imageSmoothingEnabled=false;
 if(stage===1)g.filter='sepia(.42) saturate(1.7)';if(stage===2)g.filter='brightness(1.35) saturate(1.4)';
 if(impact)g.globalAlpha=Math.max(0,1-e.age/e.duration);
 g.drawImage(KI_ORB_IMAGE,frame*32,0,32,32,-size/2,-size/2,size,size);g.restore();
}
function paintAstralComboVFX(g,e,row){
 if(!ASTRAL_COMBO_VFX.naturalWidth)return;
 const u=clamp(e.age/e.duration,0,.999),frame=Math.min(7,Math.floor(u*8)),size=e.size||96;
 g.save();g.translate(Math.round(e.x),Math.round(e.y-28));g.imageSmoothingEnabled=false;
 if(row===1)orientSkillSprite(g,e.angle||0);
 g.drawImage(ASTRAL_COMBO_VFX,frame*64,row*64,64,64,-size/2,-size/2,size,size);g.restore();
}
const originalBody=rwPaintBody;
const ORIGINAL_BODY_ROWS={0:[1,3,0,2,4,5],2:[1,1,0,2,4,5],3:[1,0,0,2,4,5],4:[0,1,2,4,0,5],5:[0,1,2,2,3,5]};
rwPaintBody=function(g,a,size=72,t=vfxTime){
 if(a.skin>=6)return originalBody(g,a,size,t);
 const s=reworkState(a),q=a.rwCast,dash=Reforged.dashes.find(d=>d.owner===a&&!d.finished),angle=q?.angle??(a.moving?a.rwFacing:a.a)??0;
 let frame=q?clamp(q.age<q.release?Math.floor(q.age/q.release*12):12+Math.floor((q.age-q.release)/(q.duration-q.release)*12),0,23):0;
 if(a.skin===0&&q?.slot===1&&Number.isInteger(q.comboFrame))frame=[3,5,8,11,14,17,20,22][q.comboFrame%8];
 if(q?.holding)frame=q.slot===4?4+Math.floor(t*8)%4:Math.min(9,Math.floor(q.charge*9));
 g.save();g.translate(0,-3.5*size/72);
 const scalar=size*rwSizeFactors[a.skin];
 if(a.skin===5&&(q?.slot===5||s.pactAdult>0)){
  const im=rwImage('assets/reforged_v10/hunter-adult.webp');if(im.naturalWidth){const f=q?.slot===5?frame:22,k=size/72;g.scale(Math.cos(angle)<0?-1:1,1);g.imageSmoothingEnabled=false;g.drawImage(im,f%6*128,Math.floor(f/6)*128,128,128,-64*k,12-118*k,128*k,128*k);g.restore();return true;}
 }
 if(a.skin===0&&s.stage>0)g.filter=s.stage===1?'brightness(1.12) saturate(1.25)':'brightness(1.24) saturate(1.4)';
 if(s.spiritForm>0)g.filter='contrast(1.15) saturate(1.6)';
 if(dash?.leap)g.translate(0,-Math.sin(clamp(dash.age/dash.duration,0,1)*Math.PI)*28*size/72);
 if(q?.holding)g.translate(Math.sin(t*40)*.5*size/72,Math.cos(t*30)*.35*size/72);
 const paintActor={...a,astralFacing:angle,eclipseFacing:angle,rpFacing:angle,dojoFacingAngle:angle};
 let result;
 if(q){
  const pose={index:ORIGINAL_BODY_ROWS[a.skin]?.[q.slot]||0,age:q.age,duration:q.duration,frame,angle};
  if(a.skin===0)result=q.slot===2?paintWaveBody(g,paintActor,scalar,q):q.slot>0?astral14Body(g,paintActor,scalar,q):astralPaint(g,paintActor,scalar,pose);
  else if(a.skin===4)result=eclipsePaint(g,paintActor,scalar,pose);
  else if(a.skin===1){const before=dojoWornContext;dojoWornContext=dojoIsWorn(a);try{if(q.slot===0||q.slot===5)result=dojoPaintStrike(g,frame,scalar,angle);else{dojoGestureFrame(g,[31,27,37,35,35,48][q.slot],frame,scalar,angle);result=true;}}finally{dojoWornContext=before;}}
  else if(a.skin===5&&q.slot===2){const orbit=frame/24*TAU;result=rpPaint(g,{...paintActor,rpFacing:orbit,punchTime:.2,punchSide:1},scalar);}
  else result=rpPaint(g,paintActor,scalar,pose);
 }else result=rwOldFighter(g,paintActor,scalar,t);
 if(a.skin===2&&(s.value>=60||s.spiritForm>0)){g.save();g.globalAlpha=.6;g.translate(Math.cos(angle)<0?-19:19,-24);if(Math.cos(angle)<0)g.scale(-1,1);g.strokeStyle=s.spiritForm>0?'#ff3a70':'#c4dcff';g.lineWidth=s.spiritForm>0?5:3;g.beginPath();g.moveTo(-3,12);g.lineTo(12,-23);g.stroke();g.restore();}
 g.restore();return result;
};
const originalFX=rwPaintFX;
rwPaintFX=function(e){if(e.skin>=6)return originalFX(e);const u=clamp(e.age/e.duration,0,.999),x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y;
 if(e.skin===0&&e.slot===5&&e.kind==='impact')return;
 if(e.kiOrb){paintKiOrb(ctx,e,true);return;}
 if(e.kind.startsWith('astral-')){paintAstral14FX(ctx,e);return;}
 if(e.kind==='combo-teleport'){paintAstralComboVFX(ctx,e,0);return;}
 if(e.kind==='combo-impact'){paintAstralComboVFX(ctx,e,1);return;}
 if(e.kind==='concentrated-wave'){paintConcentratedWave(ctx,e);return;}
 if(e.kind==='wave-impact'){
  ctx.save();ctx.translate(e.x,e.y-35);orientSkillSprite(ctx,e.angle);ctx.imageSmoothingEnabled=false;
  waveCell(ctx,'impact',u*24,-e.size/2,-e.size/2,e.size);ctx.restore();return;
 }
 if(e.kind==='warning'){ctx.save();ctx.strokeStyle=identityKit(e.skin).color;ctx.fillStyle=e.skin===4?'#20274c44':'#e5b75622';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.ellipse(x,y,e.radius,e.radius*.6,0,0,TAU);ctx.fill();ctx.stroke();ctx.restore();return;}
 const size=e.size||(e.kind==='sky'?200:115),ground=['sky','trap-fire','seal','domain'].includes(e.kind)||e.skin===3&&e.slot===2;
 const offset=e.kind==='cast'&&![4,5].includes(e.slot)?35:0;
 rwSprite(ctx,e.skin,e.slot,x+Math.cos(e.angle||0)*offset,y-(ground?size*.3:32),size,u,e.angle||0,e.kind==='dash',1,e.stage??e.owner?.identity?.stage);
};
const originalSprite=rwSprite;
rwSprite=function(g,skin,slot,x,y,size,phase,angle=0,directional=false,alpha=1,stage=0){g.save();if(skin===0){if(stage===1)g.filter='sepia(.55) saturate(1.5)';if(stage===2)g.filter='brightness(1.25) saturate(1.4)';}originalSprite(g,skin,slot,x,y,size,phase,angle,directional,alpha);g.restore();};
const originalDepth=integratedDepth;
integratedDepth=function(){const all=objects;let list;objects=all.filter(o=>!o.v10Clone&&!o.v10Trap&&!o.v10Domain);try{list=originalDepth();}finally{objects=all;}
 for(const e of Reforged.projectiles)if(e.kiOrb)list.push({kind:'ki-orb',y:e.y,priority:5,paint:()=>paintKiOrb(ctx,e)});
 for(const o of objects){if(o.life<=0||o.hp===0)continue;
  if(o.v10Clone)list.push({kind:'clone',y:o.y,priority:1,paint:()=>{ctx.save();ctx.translate(o.x,o.y);ctx.globalAlpha=.65*Math.min(1,o.age/.15,o.life/.3);drawAnimatedFighter(ctx,o,72);ctx.restore();}});
  if(o.v10Trap)list.push({kind:'seal',y:o.y-1,priority:0,paint:()=>rwSprite(ctx,1,2,o.x,o.y-18,85,.28+(o.age*.4%1)*.2)});
  if(o.v10Domain)list.push({kind:'domain',y:o.y-180,priority:-1,paint:()=>{ctx.save();ctx.fillStyle='#050a26aa';ctx.beginPath();ctx.ellipse(o.x,o.y,o.r,o.r*.65,0,0,TAU);ctx.fill();rwSprite(ctx,4,5,o.x,o.y-50,o.r*2.3,.28+(o.age*.4%1)*.4,0,false,.85);ctx.restore();}});
 }
 for(const a of actors){if(a.hp<=0||a.skin>=6)continue;const s=reworkState(a),q=a.rwCast;
  if(a.skin===0&&(s.stage>0||q?.holding&&q.slot===4))list.push({y:a.y-.5,priority:0,paint:()=>{
   const charging=q?.holding&&q.slot===4,size=charging?100+s.stage*12:82+s.stage*5;
   ctx.save();ctx.globalAlpha=charging?.6:s.stage===2?.22:.12;
   astral14Cell(ctx,'aura',Math.floor(vfxTime*(charging?22:12))%24,a.x-size/2,a.y-size*.78,size);ctx.restore();
  }});
  if(a.skin===0&&q?.slot===5&&q.age<q.release){list.push({y:a.y+.4,priority:4,paint:()=>paintSolarPreparation(ctx,a,q)});list.push({y:q.target.y-1,priority:0,paint:()=>paintSolarMarker(ctx,q.target.x,q.target.y,80+(q.stage||0)*35)});}
  if(a.skin===0&&q?.slot===2&&(q.holding||q.age<q.release))list.push({y:a.y+.5,priority:3,paint:()=>paintWaveCharge(ctx,a,q)});
  else if(q?.holding&&!(a.skin===0&&q.slot===4))list.push({y:a.y+.5,priority:3,paint:()=>rwSprite(ctx,a.skin,q.slot,a.x+Math.cos(q.angle)*27,a.y-30,60+q.charge*60,.08+q.charge*.25,q.angle,true)});
  if(s.spiritForm>0||s.breathing>0||s.instinct>0)list.push({y:a.y-.3,priority:0,paint:()=>rwSprite(ctx,a.skin,4,a.x,a.y-32,115,.25+(vfxTime*.5%1)*.4,0,false,.55)});
  if(a.skin===1&&(s.eye>0||s.copy))list.push({y:a.y+.2,priority:3,paint:()=>rwSprite(ctx,1,4,a.x+27,a.y-49,48,.3+(vfxTime*.3%1)*.25)});
  if(s.barrier)list.push({y:a.y+.3,priority:3,paint:()=>rwSprite(ctx,4,4,a.x,a.y-28,135,.27+(vfxTime*.25%1)*.3,0,false,.38)});
 }
 for(const e of OriginalCombat.burns)if(e.remaining>0&&e.target.hp>0)list.push({y:e.target.y+.4,priority:4,paint:()=>rwSprite(ctx,3,0,e.target.x,e.target.y-12,38+e.stacks*4,.35+(vfxTime*.9%1)*.2,0,false,.75)});
 for(const e of Reforged.effects)if(e.kind==='astral-solar-flight'||e.kind==='astral-solar-contact')list.push({y:e.y-1,priority:0,paint:()=>paintSolarMarker(ctx,e.x,e.y,e.radius,.3)});
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0)||(a.serial||0)-(b.serial||0));
};
const originalArtPreload=reworkPreload;
reworkPreload=function(skin){originalArtPreload(skin);if(skin===5)rwImage('assets/reforged_v10/hunter-adult.webp');};
reworkPreload(account.activeChampion);
if(window.arenaQA)Object.assign(arenaQA,{step,hit,drawAnimatedFighter});


const originalWorld=drawModeWorld;drawModeWorld=function(){originalWorld();if(objects.some(o=>o.v10Domain&&o.life>0)){ctx.save();ctx.fillStyle='#03082038';ctx.fillRect(0,0,W,H);ctx.restore();}};
