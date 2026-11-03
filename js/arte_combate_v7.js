'use strict';
// Sprite artists draw right-facing forms. A leftward shot mirrors them, never rolls them over.
function orientSkillSprite(g,angle=0){
 const left=Math.cos(angle)<0;
 g.rotate(left?Math.atan2(-Math.sin(angle),-Math.cos(angle)):angle);
 if(left)g.scale(-1,1);
}
const V7_KEYS=['spark','tide','star','steel'];
const V7_ART=new Map();
function v7Image(file){if(!V7_ART.has(file)){const im=new Image();im.src=file;V7_ART.set(file,im);}return V7_ART.get(file);}
function v7Preload(skin){if(skin<6||skin>9)return;const key=V7_KEYS[skin-6];dojo4Image(key+'-states');v7Image(`assets/skills_v7/${key}-fx.webp`);v7Image(`assets/skills_v7/${key}-cast.webp`);}
dojo4Preload=function(skin){if(skin<6||skin>9)return;dojo4Image(V7_KEYS[skin-6]+'-states');v7Preload(skin);};
championArt=c=>`assets/champions_v7/${String(c.id+1).padStart(2,'0')}.webp`;
const V7_PREVIOUS_FIGHTER=drawAnimatedFighter;
const V7_SIZE_FACTORS=[73/65,73/65,73/66,73/66,73/66,73/66,1,1,73/71,73/64];
const v7CastFrame=EldoriaMotion.castFrame;
drawAnimatedFighter=function(g,a,size=72,t=vfxTime){
 if(!a)return false;
 if(a.skin<6){g.save();g.translate(0,-3.5*size/72);const result=V7_PREVIOUS_FIGHTER(g,a,size*V7_SIZE_FACTORS[a.skin],t);g.restore();return result;}
 v7Preload(a.skin);
 const im=v7Image(`assets/skills_v7/${V7_KEYS[a.skin-6]}-cast.webp`),q=a.dojo4Cast;
 if(im.naturalWidth&&q&&!(a.hitReact>0)){
  const row=q.slot,f=v7CastFrame(q);
  const factor=size/85,facing=q?.angle??a.dojoMotion?.facing??a.a??0;
  g.save();if(Math.cos(facing)<0)g.scale(-1,1);g.imageSmoothingEnabled=false;

  g.drawImage(im,f*128,row*128,128,128,-64*factor,9-118*factor,128*factor,128*factor);g.restore();return true;
 }
 return V7_PREVIOUS_FIGHTER(g,q?{...a,dojo4Cast:null}:a,size*V7_SIZE_FACTORS[a.skin],t);
};
function v7Sprite(g,skin,slot,x,y,size,phase=0,angle=0,height=size){
 const im=v7Image(`assets/skills_v7/${V7_KEYS[skin-6]}-fx.webp`);if(!im.naturalWidth)return;
 const frame=Math.min(5,Math.max(0,Math.floor(phase*6)%6));
 g.save();g.translate(x,y);orientSkillSprite(g,angle);g.imageSmoothingEnabled=true;
 g.drawImage(im,frame*160,slot*160,160,160,-size/2,-height/2,size,height);g.restore();
}
function v7Charge(g,e,x,y,u){
 const c=CHAMPIONS[e.skin].color,r=14+u*18;g.save();g.translate(x,y-26);g.strokeStyle=c;g.lineWidth=2;g.globalAlpha=.4+u*.4;
 for(let i=0;i<5;i++){const a=i*TAU/5+u*3;g.beginPath();g.moveTo(Math.cos(a)*r*1.6,Math.sin(a)*r*1.6);g.lineTo(Math.cos(a)*r,Math.sin(a)*r);g.stroke();}
 g.beginPath();g.arc(0,0,5+u*5,0,TAU);g.fillStyle='#eaffed';g.fill();g.restore();
}
dojo4PaintEffect=function(g,e){
 const u=Math.min(.999,e.age/e.duration),x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y;
 if(e.kind==='charge'){v7Charge(g,e,x,y,u);return;}
 // Projectile skills are rendered on the moving projectile, not as a stationary duplicate.
 if(e.kind==='release'&&((e.skin===6&&e.slot===0)||(e.skin===8&&e.slot<2)||(e.skin===9&&e.slot===0)))return;
 if(e.kind==='release'&&e.slot>=3)return;
 g.save();g.globalAlpha=Math.min(1,e.age/.045)*Math.min(1,(e.duration-e.age)/.18);
 if(['stretch','whip','beam'].includes(e.kind)){
  const ax=e.fromX??e.owner.x,ay=(e.fromY??e.owner.y)-28,dx=x-ax,dy=y-28-ay,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
  const extension=e.kind==='beam'?Math.min(1,u*1.6):Math.sin(Math.min(1,u*1.2)*Math.PI);
  const tipX=ax+dx*extension,tipY=ay+dy*extension;
  if(e.kind==='whip'){
   g.beginPath();g.moveTo(ax,ay);g.bezierCurveTo(ax+dx*.25,ay+dy*.25-30*Math.sin(u*Math.PI),ax+dx*.7,ay+dy*.7+22*Math.sin(u*Math.PI),tipX,tipY);g.strokeStyle='#112031';g.lineWidth=9;g.stroke();g.strokeStyle='#77f6c2';g.lineWidth=2.5;g.stroke();v7Sprite(g,e.skin,e.slot,tipX,tipY,84,u,a);
  }else if(e.kind==='stretch'){
   g.beginPath();g.moveTo(ax,ay);g.lineTo(tipX,tipY);g.lineWidth=e.thin?7:12;g.lineCap='round';g.strokeStyle='#794b40';g.stroke();g.lineWidth=e.thin?4:8;g.strokeStyle='#efbf91';g.stroke();
   v7Sprite(g,e.skin,e.slot,tipX,tipY,e.thin?57:72,u,a);
  }else{
   g.strokeStyle='#b2e6ff77';g.lineWidth=5;g.beginPath();g.moveTo(ax,ay);g.lineTo(tipX,tipY);g.stroke();
   v7Sprite(g,e.skin,e.slot,tipX,tipY-5,140,u,a);
  }
 }else if(e.kind==='wall'){
  const wall=objects.find(o=>o.owner===e.owner&&o.kind==='wall'&&o.life>0);
  if(wall){const vertical=wall.h>wall.w;if(vertical){for(const offset of [-48,0,48])v7Sprite(g,e.skin,e.slot,x,y+offset-26,72,u,0,96);}else v7Sprite(g,e.skin,e.slot,x,y-32,155,u,0,110);}
 }else{
  const type=NOVOS_DOJO4[e.skin-6].skills[e.slot].type;
  const ground=['spikes','cathedral','legacy','king'].includes(type),trail=e.kind==='trail';
  const size=e.kind==='impact'?Math.max(130,(e.radius||75)*1.65):trail?105:e.kind==='spark'?42:90;
  v7Sprite(g,e.skin,e.slot,x,y-(ground?30:32),size,u,ground||['wings','float','armor','aegis','power','steam','cosmos','repair'].includes(type)?0:e.angle||0);
 }
 g.restore();
};
const V7_PRIOR_DEPTH=integratedDepth;
integratedDepth=function(){
 const list=V7_PRIOR_DEPTH().filter(e=>e.kind!=='dojo4-aura');
 for(const a of actors){if(a.hp<=0||a.skin<6||a.skin>9)continue;
  const pairs=a.skin===6?[[3,a.buff.dojoFloat],[4,a.buff.dojoPower]]:a.skin===7?[[3,a.buff.dojoArmor],[4,a.buff.dojoSteam]]:a.skin===8?[[3,a.buff.frostShield],[4,a.buff.dojoCosmos]]:[[3,a.buff.dojoBlade],[4,a.buff.frostShield]];
  for(const [slot,time]of pairs)if(time>0)list.push({kind:'v7-aura',y:a.y+.5,priority:3,paint:()=>{ctx.save();ctx.globalAlpha=slot===3?.65:.55;v7Sprite(ctx,a.skin,slot,a.x,a.y-34,slot===4?115:100,.25+(1+Math.sin(vfxTime*4))*.12);ctx.restore();}});
 }
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0)||(a.serial||0)-(b.serial||0));
};
const V7_PRIOR_PROJECTILES=vfxDrawProjectiles;
vfxDrawProjectiles=function(){
 const all=shots;shots=all.filter(s=>!skills[s.art]?.dojo4);try{V7_PRIOR_PROJECTILES();}finally{shots=all;}
 for(const s of all){const skill=skills[s.art];if(!skill?.dojo4)continue;
  const size=skill.dojo4.type==='comet'?94:skill.dojo4.type==='lance'?88:skill.dojo4.type==='meteors'?70:78;
  v7Sprite(ctx,skill.champion,skill.slot,s.x,s.y-27,size,.28+(1+Math.sin((s.vfxAge||clock)*16))*.14,Math.atan2(s.vy,s.vx));
 }
};
const V7_PRIOR_HIT=hit;
hit=function(target,amount,owner,knock=0,angle=0,id=-1){const result=V7_PRIOR_HIT(target,amount,owner,knock,angle,id);if(result&&skills[id]?.dojo4&&owner)dojo4Vfx(owner,skills[id].slot,target.x,target.y,'impact',.38,{radius:32,angle,skin:skills[id].champion});return result;};
const V7_PRIOR_START=start;start=function(){for(const skin of [account.activeChampion,6,7,8,9])v7Preload(skin);return V7_PRIOR_START();};
if(window.arenaQA){arenaQA.drawAnimatedFighter=drawAnimatedFighter;arenaQA.hit=hit;}
window.v7QA={orient:orientSkillSprite,castFrame:v7CastFrame,sprite:v7Sprite,preload:v7Preload,get images(){return V7_ART},factors:V7_SIZE_FACTORS};
