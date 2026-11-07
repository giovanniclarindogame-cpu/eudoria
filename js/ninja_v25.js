'use strict';
const THUNDER25={charge:rwImage('assets/ninja_v25/charge.webp'),impact:rwImage('assets/ninja_v25/impact.webp')};
function thunder25Sprite(g,key,frame,x,y,size,alpha=1){const im=THUNDER25[key];if(!im.naturalWidth)return;g.save();g.globalAlpha*=alpha;g.drawImage(astralSoftCell(im,frame),x-size/2,y-size/2,size,size);g.restore();}
function thunder25Actor(){return actors.find(a=>a.hp>0&&a.skin===1&&a.rwCast?.slot===5);}
function ultimateCinematicActor(){return thunder25Actor()||actors.find(a=>a.hp>0&&a.skin===0&&a.rwCast?.slot===5);}
function ultimateCinematicPower(a){return a.skin===1?a.rwCast.charge||0:clamp(a.rwCast.age/a.rwCast.release,0,1);}
function paintUltimateShade(a,power){
 const shade=ctx.createRadialGradient(a.x,a.y-20,35,a.x,a.y-20,300);shade.addColorStop(0,'#06112800');shade.addColorStop(1,`rgba(2,7,23,${.15+power*.22})`);
 ctx.save();ctx.fillStyle=shade;ctx.fillRect(-W,-H,W*3,H*3);ctx.restore();
}
const thunder25Fx=rwFx;rwFx=function(a,slot,x,y,kind,duration,extra={}){
 if(a.skin===1&&kind==='ninja-thunder-impact'){
  duration=.85;extra={...extra,size:260+60*(a.rwCast?.charge||0)};
  combatImpact(2);combatHitStop=Math.max(combatHitStop,.14);combatShake=Math.max(combatShake,9);
  combatSound('crit',1.6);
 }
 return thunder25Fx(a,slot,x,y,kind,duration,extra);
};
const thunder25Release=rwRelease;rwRelease=function(a,q){const result=thunder25Release(a,q);if(a.skin!==1||q.slot!==5)return result;
 combatSound('heavy',1.4);
 rwFx(a,5,a.x,a.y,'ninja25-launch',.32,{size:120+60*(q.charge||0),angle:q.angle});
 const dash=Reforged.dashes.find(d=>d.owner===a&&!d.finished);
 if(dash){const old=dash.onStep;let distance=0;dash.onStep=function(from){old?.(from);distance+=dist(from,a);if(distance>=38){distance%=38;rwFx(a,5,from.x,from.y,'ninja25-trail',.24,{size:90,angle:q.angle});}};}
 return result;
};
const thunder25Paint=rwPaintFX;rwPaintFX=function(e){const u=e.age/e.duration;
 if(e.skin===1&&e.kind==='ninja-thunder-impact'){thunder25Sprite(ctx,'impact',Math.min(23,Math.floor(u*24)),e.x,e.y-28,e.size);return;}
 if(e.kind==='ninja25-launch'||e.kind==='ninja25-trail'){thunder25Sprite(ctx,'charge',12+Math.floor(u*10),e.x,e.y-20,e.size,(1-u)*.65);return;}
 return thunder25Paint(e);
};
const thunder25Depth=integratedDepth;integratedDepth=function(){const list=thunder25Depth().filter(e=>e.kind!=='ninja-charge-24');
 for(const a of actors){const q=a.rwCast;if(a.hp<=0||q?.slot!==5)continue;
  if(a.skin===0){if(q.age<q.release)list.push({kind:'astral-cinematic-light',y:-10000,priority:-5,paint(){paintUltimateShade(a,ultimateCinematicPower(a));}});continue;}
  if(a.skin!==1)continue;
  const charging=q.holding||q.age<q.release,power=q.charge||0;
  if(charging){
   list.push({kind:'ninja25-light',y:-10000,priority:-5,paint(){paintUltimateShade(a,power);}});
   const frame=power<.55?Math.min(11,Math.floor(power/.55*12)):12+Math.floor(vfxTime*22)%12;
   list.push({kind:'ninja25-halo',y:a.y-.5,priority:0,paint(){thunder25Sprite(ctx,'charge',frame,a.x,a.y-28,110+power*70,.45);}});
   list.push({kind:'ninja25-charge',y:a.y+1,priority:5,paint(){thunder25Sprite(ctx,'charge',frame,a.x+(Math.cos(q.angle)<0?-12:12),a.y-8,55+power*45);}});
  }else if(q.thunderEndAge===undefined){
   list.push({kind:'ninja25-hand',y:a.y+1,priority:5,paint(){thunder25Sprite(ctx,'charge',12+Math.floor(vfxTime*24)%12,a.x-(Math.cos(q.angle)<0?-25:25),a.y-28,85+power*25);}});
  }
 }
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0));
};
let thunder25Zoom=1,thunder25CameraTime=0;
const thunder25Camera=updateArenaCamera;updateArenaCamera=function(){thunder25Camera();
 if(!p||courtyardWide||!['fight','paused'].includes(state)){thunder25Zoom=1;thunder25CameraTime=vfxTime;return;}
 const a=ultimateCinematicActor(),q=a?.rwCast,target=q?1.04+.04*ultimateCinematicPower(a):1;
 const dt=Math.max(0,Math.min(.1,vfxTime-thunder25CameraTime));thunder25CameraTime=vfxTime;
 thunder25Zoom+=(target-thunder25Zoom)*(1-Math.exp(-dt*8));
 const x=p.x*scale+ox,y=p.y*scale+oy;scale*=thunder25Zoom;ox=x-p.x*scale;oy=y-p.y*scale;
};
const thunder25Draw=draw;draw=function(){thunder25Draw();if(!['fight','paused'].includes(state))return;
 const flash=Reforged.effects.find(e=>['ninja-thunder-impact','astral-solar-blast'].includes(e.kind)&&e.age<.09);if(!flash)return;
 ctx.save();ctx.fillStyle=`rgba(184,231,255,${.16*(1-flash.age/.09)})`;ctx.fillRect(0,0,cw,ch);ctx.restore();
};
