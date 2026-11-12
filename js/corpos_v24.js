'use strict';
const BODY24=Object.fromEntries(['astral-base','ninja-base','astral-skills','ninja-skills','ground'].map(k=>[k,rwImage('assets/corpos_v24/'+k+'.webp')]));
const body24Registration=new Map();
function body24Register(key){
 if(body24Registration.has(key))return body24Registration.get(key);
 // naturalWidth can become available before a WebP finishes loading. Do not
 // cache measurements from a partially decoded atlas during the first lobby draw.
 const im=BODY24[key];if(!im.complete||!im.naturalWidth)return null;
 const rows=key.endsWith('base')?6:4,c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
 const g=c.getContext('2d');g.drawImage(im,0,0);const pixels=g.getImageData(0,0,c.width,c.height).data,frames=[];
 for(let i=0;i<6*rows;i++){
  const x=Math.round(i%6*c.width/6),y=Math.round(Math.floor(i/6)*c.height/rows),w=Math.round((i%6+1)*c.width/6)-x,h=Math.round((Math.floor(i/6)+1)*c.height/rows)-y;
  let top=h,bottom=0;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(pixels[((y+yy)*c.width+x+xx)*4+3]>170){top=Math.min(top,yy);bottom=Math.max(bottom,yy);}
  frames.push({x,y,w,h,bottom,height:bottom-top});
 }
 const standing=(rows===6?frames.slice(0,6):frames.slice(18,23)).map(f=>f.height).sort((a,b)=>a-b),height=standing[Math.floor(standing.length/2)];
 const result={frames,height};body24Registration.set(key,result);return result;
}
function body24Draw(g,a,size,t){
 const name=a.skin===0?'astral':'ninja',q=a.rwCast,angle=q?.angle??a.rwFacing??a.a??0;
 let key=name+'-base',frame=0,idle=false;
 if(a.hp<=0||a.knockedDown)frame=33;
 else if(a.hitReact>0)frame=30+Math.min(1,Math.floor((.3-a.hitReact)*8));
 else if(a.guard)frame=34;
 else if(a.dodgeTime>0)frame=35;
 else if(q){
  key=name+'-skills';let phase=q.holding?0:q.age<q.release?0:q.age<q.release+.15?1:q.age<q.duration-.15?2:3;
  if(a.skin===0&&q.slot===1&&q.comboFrame!==undefined)phase=[1,2][q.comboFrame%2];
  if(a.skin===0&&q.slot===2&&!q.holding&&q.age>=q.release)phase=q.age<q.duration-.15?2:3;
  if(a.skin===0&&q.slot===5)phase=q.age<q.release?1:2;
  if(a.skin===1&&q.slot===5)phase=q.holding||q.age<q.release?0:q.thunderHitAge!==undefined?(q.age-q.thunderHitAge<.21?2:3):q.thunderEndAge!==undefined?3:1;
  frame=phase*6+q.slot;
 }else if(a.v10Clone&&a.attacks)frame=24+Math.min(5,Math.floor(a.strikeAge/.28*6));
 else if(a.punchTime>0)frame=24+Math.min(5,Math.floor((1-a.punchTime/.27)*6));
 else if(a.moving){const row=Math.abs(Math.sin(angle))>.65?(Math.sin(angle)>0?2:3):1;frame=row*6+Math.floor(a.rwStride??a.gait??t*10)%6;}
 else{idle=true;frame=Math.floor(t*4)%6;}
 // Both new bodies use the measured 73px standing height of the other fighters.
 const reg=body24Register(key);if(!reg)return false;const f=reg.frames[frame],k=size/72*73/reg.height;
 g.save();g.imageSmoothingEnabled=false;g.scale(Math.cos(angle)<0?-1:1,1);
 // Breathing pivots at the feet; no vertical translation or levitation.
 const breath=idle?Math.sin(t*2.6+(a.skin||0))*.012:0;g.translate(0,9*size/72);g.scale(1-breath*.25,1+breath);
 if(a.skin===0&&reworkState(a).stage>0)g.filter=reworkState(a).stage===1?'brightness(1.12) saturate(1.25)':'brightness(1.24) saturate(1.4)';
 g.drawImage(BODY24[key],f.x,f.y,f.w,f.h,-f.w*k/2,-f.bottom*k,f.w*k,f.h*k);g.restore();return true;
}
const body24Previous=rwPaintBody;rwPaintBody=function(g,a,size=72,t=vfxTime){if(a.skin===0||a.skin===1)return body24Draw(g,a,size,t)||body24Previous(g,a,size,t);return body24Previous(g,a,size,t);};
// Match the new extended palm; projectile physics and drawing share this origin.
astralWaveOrigin=function(a,angle){return{x:a.x+(Math.cos(angle)<0?-30:30),y:a.y+8};};
const thunder24=skills[CHAMPIONS[1].kit[5]];thunder24.holdMax=2;thunder24.desc='Segure para acumular relâmpago nas mãos abaixadas. Solte para avançar, rachando o chão pelo caminho. Causa de 230 a 330 de dano conforme a carga; uma cópia guardada acrescenta 70 no acerto. Carga máxima em 2s.';
const charge24Tick=originalChargeTick;originalChargeTick=function(a,q,dt){if(a.skin===1&&q.slot===5){q.charge=clamp(q.age/2,0,1);return true;}return charge24Tick(a,q,dt);};
const release24Charge=rwReleaseCharge;rwReleaseCharge=function(a,angle){const held=a?.skin===1&&a.rwCast?.slot===5&&a.rwCast.holding;const ok=release24Charge(a,angle);if(held&&ok){a.rwCast.release=.08;}return ok;};
// Keep the existing contact rules and copy bonus. Scale only this charged attack.
const hit24=hit;hit=function(target,amount,owner,knock=0,angle=0,id=-1){if(owner?.skin===1&&id===owner.kit[5]&&owner.rwCast?.slot===5)amount+=Math.round(100*(owner.rwCast.charge||0));return hit24(target,amount,owner,knock,angle,id);};
const release24=rwRelease;rwRelease=function(a,q){const result=release24(a,q);if(a.skin===1&&q.slot===5){const dash=Reforged.dashes.find(d=>d.owner===a&&!d.finished);if(dash){const prior=dash.onStep;let remaining=0;dash.onStep=function(from){prior?.(from);const length=dist(from,a);for(let n=32-remaining;n<=length;n+=32)rwFx(a,5,from.x+(a.x-from.x)*n/Math.max(1,length),from.y+(a.y-from.y)*n/Math.max(1,length),'thunder-ground',1.25,{size:72});remaining=(remaining+length)%32;};}}return result;};
const depth24=integratedDepth;integratedDepth=function(){const list=depth24();for(const e of Reforged.effects)if(e.kind==='thunder-ground')list.push({y:e.y-1000,priority:-1,paint(){ctx.save();ctx.globalCompositeOperation='multiply';ctx.globalAlpha=Math.min(.8,(1-e.age/e.duration)*2);const im=BODY24.ground;if(im.naturalWidth)ctx.drawImage(astralSoftCell(im,Math.min(23,4+Math.floor(e.age/e.duration*20))),e.x-36,e.y-36,72,72);ctx.restore();}});
 for(const a of actors){const q=a.rwCast;if(a.skin===1&&q?.slot===5&&(q.holding||q.age<q.release))list.push({kind:'ninja-charge-24',y:a.y+.5,priority:4,paint(){const power=q.charge||0;const frame=4+Math.floor(vfxTime*18)%8;ninja23Sprite(ctx,'impact',frame,a.x+Math.cos(q.angle)*10,a.y-12,22+power*25);}});}
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0));};
const fx24=rwPaintFX;rwPaintFX=function(e){if(e.kind==='thunder-ground')return;if(e.skin===1&&e.kind==='ninja-afterimage'){ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=(1-e.age/e.duration)*.4;body24Draw(ctx,{...e.owner,rwCast:null,moving:true,rwFacing:e.angle},72,vfxTime);ctx.restore();return;}return fx24(e);};
