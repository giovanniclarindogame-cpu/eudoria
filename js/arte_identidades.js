'use strict';
// 24 individually drawn cells per technique, shared isometric ground plane.
const REWORK_ART=new Map();
// Arquivos antigos do Goku (geração reforged_v10) que foram removidos: qualquer pedido deles vira uma imagem vazia
const REMOVED_ART=new Set(["assets/reforged_v10/astral-0.webp", "assets/reforged_v10/astral-1.webp", "assets/reforged_v10/astral-2.webp", "assets/reforged_v10/astral-3.webp", "assets/reforged_v10/astral-4.webp", "assets/reforged_v10/astral-5.webp", "assets/reforged_v10/astral-0-icon.webp", "assets/reforged_v10/astral-1-icon.webp", "assets/reforged_v10/astral-2-icon.webp", "assets/reforged_v10/astral-3-icon.webp", "assets/reforged_v10/astral-4-icon.webp", "assets/reforged_v10/astral-5-icon.webp", "assets/reforged_v10/astral-combo-vfx.webp", "assets/reforged_v10/astral14-blast.webp", "assets/reforged_v10/astral14-body.webp"]);
function rwImage(file){if(REMOVED_ART.has(file))file='assets/ui/vazio.webp';if(!REWORK_ART.has(file)){const im=new Image();im.src=file;REWORK_ART.set(file,im);}return REWORK_ART.get(file);}
function reworkPreload(skin){const k=identityKit(skin);if(!k)return;if(skin>=6)rwImage(`assets/dojo4/${k.key}-states.webp`);for(let i=0;i<6;i++){rwImage(`assets/${k.assets||'reforged_v9'}/${k.key}-${i}.webp`);rwImage(`assets/${k.assets||'reforged_v9'}/${k.key}-${i}-icon.webp`);}}
function orientSkillSprite(g,angle=0){const left=Math.cos(angle)<0;g.rotate(left?Math.atan2(-Math.sin(angle),-Math.cos(angle)):angle);if(left)g.scale(-1,1);}
championArt=c=>`assets/champions_v7/${String(c.id+1).padStart(2,'0')}.webp`;
const rwOldIcon=icon;
icon=function(id){const s=skills[id];return s?.reworked?`<span class="skill-art reforged-icon" aria-hidden="true" style="background-image:url('assets/${identityKit(s.champion).assets||'reforged_v9'}/${identityKit(s.champion).key}-${s.slot}-icon.webp')"></span>`:rwOldIcon(id);};
const rwOldFighter=drawAnimatedFighter;
const rwSizeFactors=[73/65,73/65,73/66,73/66,73/66,73/66,1,1,73/71,73/64];
function rwBodyPose(a,t){
 const facing=a.rwCast?.angle??(a.moving?a.rwFacing:a.a)??0,q=a.rwCast;
 let frame=Math.floor((t*3)%6),dx=0,dy=0,tilt=0;
 if(a.hitReact>0){frame=30+Math.min(3,Math.floor((.3-a.hitReact)/.3*4));dx=-2;}
 else if(a.guard)frame=34;
 else if(a.dodgeTime>0){frame=8;dy=-3;tilt=-.12;}
 else if(q){
  // Character identity comes from its canonical poses; the motion is sampled at 24 phases.
  const phase=q.holding?Math.min(7,Math.floor(q.charge*8)):Math.min(23,Math.floor(q.age/q.duration*24));
  const pose=skills[q.id].pose,u=phase/23,attack=Math.sin(Math.PI*u),release=q.holding?0:clamp((q.age-q.release+.1)/.18,0,1);
  frame=q.holding?34:24+[0,0,0,0,1,1,1,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0][phase];
  dx=q.holding?-2:Math.round((release*5-2)*Math.sin(Math.PI*u));dy=Math.round(attack*2);
  if(pose==='kick'){frame=6+[0,0,1,1,1,2,2,3,3,3,3,4,4,4,4,5,5,5,4,3,2,1,0,0][phase];tilt=-attack*.18;dy=-Math.round(attack*6);}
  if(pose==='forge'||pose==='summon'){frame=phase<7?34:phase<18?27:29;dy=Math.round(attack*4);}
  if(pose==='buff'){frame=phase<8?34:phase<18?26:0;dy=-Math.round(attack*2);}
  if(pose==='barrage'){frame=24+(Math.floor(phase/2)%6);dx=Math.round(Math.sin(phase*1.7)*2);}
 }
 else if(a.punchTime>0)frame=24+Math.min(5,Math.floor((1-a.punchTime/.27)*6));
 else if(a.moving){const angle=a.rwFacing??facing;frame=(Math.abs(Math.sin(angle))>.65?(Math.sin(angle)>0?12:18):6)+Math.floor(a.rwStride||0)%6;}
 const d=Reforged.dashes.find(d=>d.owner===a&&d.leap&&!d.finished);if(d){dy-=Math.sin(Math.min(1,d.age/d.duration)*Math.PI)*24;frame=8;}
 const air=a.identity?.air;if(air>0)dy-=Math.sin(Math.PI*air/(a.identity.airTotal||.7))*25;
 return{frame:clamp(frame,0,35),facing:Math.cos(facing)<0?-1:1,dx,dy,tilt};
}
function rwPaintBody(g,a,size=72,t=vfxTime){
 if(a.skin<6){g.save();g.translate(0,-3.5*size/72);const result=rwOldFighter(g,a,size*rwSizeFactors[a.skin],t);g.restore();return result;}
 const kit=reworkKit(a);if(!kit)return rwOldFighter(g,a,size,t);
 const im=rwImage(`assets/dojo4/${kit.key}-states.webp`);if(!im.naturalWidth)return false;
 const m=rwBodyPose(a,t),factor=size/85*rwSizeFactors[a.skin];g.save();g.imageSmoothingEnabled=false;g.scale(m.facing,1);g.translate(m.dx*size/72,m.dy*size/72);g.rotate(m.tilt);
 g.drawImage(im,m.frame%6*128,Math.floor(m.frame/6)*128,128,128,-64*factor,9-118*factor,128*factor,128*factor);g.restore();return true;
}
drawAnimatedFighter=function(g,a,size=72,t=vfxTime){
 if(!a)return false;
 // Detailed atlases render directly at the destination canvas resolution, like
 // the training dummy. The 56px intermediate grid discards their painted detail.
 if(a.skin>=0&&a.skin<4)return rwPaintBody(g,a,size,t);
 return EldoriaPixels.paint(g,(ink,native)=>rwPaintBody(ink,a,native,t),size);
};
function rwSprite(g,skin,slot,x,y,size,phase,angle=0,directional=false,alpha=1){
 const k=identityKit(skin);if(!k)return;const im=rwImage(`assets/${k.assets||'reforged_v9'}/${k.key}-${slot}.webp`);if(!im.naturalWidth)return;
 const f=clamp(Math.floor(phase*24),0,23);g.save();g.translate(Math.round(x),Math.round(y));if(directional)orientSkillSprite(g,angle);else if(Math.cos(angle)<0)g.scale(-1,1);g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;
 g.drawImage(im,f%6*128,Math.floor(f/6)*128,128,128,-size/2,-size/2,size,size);g.restore();
}
function rwPaintFX(e){
 const u=clamp(e.age/e.duration,0,.999),x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y;
 if(e.kind==='construct'||e.kind==='summon')return; // Persistent object itself plays its birth.
 if(e.kind==='warning'){ctx.save();ctx.strokeStyle='#a6ceff';ctx.globalAlpha=.4;ctx.setLineDash([5,7]);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,e.radius,e.radius*.55,0,0,TAU);ctx.stroke();ctx.restore();return;}
 if(e.kind==='cast'&&([0,3,5].includes(e.slot)&&e.skin===6||e.skin===7&&e.slot!==4||e.skin===8&&[1,3,5].includes(e.slot)||e.skin===9&&[0,2,3,5].includes(e.slot)))return;
 if(e.kind==='tether'||e.kind==='anchor'){
  const from=e.followOwner?{x:e.followOwner.x,y:e.followOwner.y}:e.from,d=Math.hypot(x-from.x,y-from.y),a=Math.atan2(y-from.y,x-from.x),stretch=e.kind==='anchor'?1:Math.sin(Math.PI*Math.min(1,u*1.2));
  const tip={x:from.x+(x-from.x)*stretch,y:from.y+(y-from.y)*stretch};
  ctx.save();ctx.lineCap='round';ctx.lineWidth=e.slot===2?15:9;ctx.strokeStyle='#3f302c';ctx.beginPath();ctx.moveTo(from.x,from.y-27);ctx.lineTo(tip.x,tip.y-27);ctx.stroke();ctx.strokeStyle='#d7a174';ctx.lineWidth=e.slot===2?10:5;ctx.stroke();ctx.restore();
  rwSprite(ctx,e.skin,e.slot,tip.x,tip.y-28,e.size||90,u,a,true);return;
 }
 const size=e.size||(e.slot===4?100:e.kind==='cast'?110:95),ground=e.skin===9&&[0,2,3,5].includes(e.slot)||e.skin===6&&e.slot===2||e.skin===8&&e.slot===5;
 rwSprite(ctx,e.skin,e.slot,x+(e.kind==='cast'&&e.slot!==4?Math.cos(e.angle)*34:0),y-(ground?size*.29:32),size,e.kind==='break'?.72+u*.27:u,e.angle,false,e.kind==='break'?1-u:1);
}
function rwPaintConstruct(o){
 const age=clock-o.created,slot=o.wall?3:0,size=o.colossus?o.size:o.wall?100:77,phase=o.colossus?o.age<.8?o.age/.8*.5:.5+(Math.sin(o.age*5)+1)*.12:Math.min(.95,Math.max(0,age/.7*.82));
 if(o.wall){const n=3;for(let i=0;i<n;i++){const delta=(i-1)*36;rwSprite(ctx,9,3,o.x+(o.w>o.h?delta:0),o.y+(o.h>o.w?delta:0)-27,78,phase);}}
 else rwSprite(ctx,9,o.colossus?5:slot,o.x,o.y-size*.3,size,phase,o.angle||0);
 if(o.hp<o.max){ctx.fillStyle='#11242b';ctx.fillRect(o.x-20,o.y+9,40,4);ctx.fillStyle=sameTeam(o.owner,p)?'#82dfb1':'#ef9479';ctx.fillRect(o.x-20,o.y+9,40*o.hp/o.max,4);}
}
const rwOldObjects=vfxDrawObjects;
vfxDrawObjects=function(){const all=objects;objects=all.filter(o=>!o.material&&!o.colossus);try{rwOldObjects();}finally{objects=all;}};
const rwOldDepth=integratedDepth;
integratedDepth=function(){
 const all=objects;let list;objects=all.filter(o=>!o.material&&!o.colossus);try{list=rwOldDepth();}finally{objects=all;}
 for(const o of objects)if((o.material||o.colossus)&&o.hp>0&&o.life>0)list.push({kind:'reforged-object',y:o.y,priority:1,paint:()=>rwPaintConstruct(o)});
 for(const e of Reforged.effects)list.push({kind:'reforged-fx',y:e.follow?e.owner.y+.5:e.y+.5,priority:3,serial:e.id,paint:()=>rwPaintFX(e)});
 for(const e of Reforged.projectiles)if(!e.kiOrb)list.push({kind:'reforged-projectile',y:e.y,priority:3,paint:()=>rwSprite(ctx,e.skin,e.slot,e.x,e.y-28,e.size||88,.3+(e.age*1.7%1)*.35,e.angle,true,1,e.bankai?1:e.stage)});
 for(const a of actors){if(a.hp<=0||!reworkKit(a))continue;const s=reworkState(a),q=a.rwCast;
  if(q?.holding&&a.skin>=6)list.push({y:a.y+.7,priority:4,paint:()=>rwSprite(ctx,6,0,a.x+Math.cos(q.angle)*25,a.y-30,65+q.charge*25,.12+q.charge*.24,q.angle,true)});
  const active=s.empowered||s.turbo>0||s.cosmic>0||s.iron>0||a.skin===8&&s.value>=100;
  if(active)list.push({y:a.y-.2,priority:0,paint:()=>rwSprite(ctx,a.skin,4,a.x,a.y-24,94,.28+(vfxTime*.65%1)*.38,0,false,.65)});
 }
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0)||(a.serial||0)-(b.serial||0));
};
const rwOldEquip=equipChampion;equipChampion=function(id,navigate=true){reworkPreload(id);return rwOldEquip(id,navigate);};
for(const skin of [account.activeChampion,6,7,8,9])reworkPreload(skin);
window.arenaPixelQA={height:EldoriaPixels.height,source:rwPaintBody};
window.reworkArtQA={images:REWORK_ART,pose:rwBodyPose,sprite:rwSprite,frames:24,preload:reworkPreload,orient:orientSkillSprite};
if(window.arenaQA)Object.assign(arenaQA,{step,hit,drawAnimatedFighter});
