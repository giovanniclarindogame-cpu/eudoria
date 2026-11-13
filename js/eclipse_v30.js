'use strict';
// Visual adapters only: damage, movement, resources and cooldowns stay in the combat engine.
const ECLIPSE30_BODY=rwImage('assets/eclipse_v30/body.webp?v=31');
const ECLIPSE30_KEYS=['repulse','attract','red','teleport','barrier','domain'];
const ECLIPSE30_FX=Object.fromEntries([...ECLIPSE30_KEYS,'impact'].map(k=>[k,rwImage(`assets/eclipse_v30/${k}.webp?v=${k==='repulse'?33:30}`)]));
let eclipse30Registration=null;
function eclipse30Register(){
 if(eclipse30Registration)return eclipse30Registration;
 if(!ECLIPSE30_BODY.complete||!ECLIPSE30_BODY.naturalWidth)return null;
 const c=document.createElement('canvas');c.width=c.height=1254;const g=c.getContext('2d');g.drawImage(ECLIPSE30_BODY,0,0);
 const data=g.getImageData(0,0,1254,1254).data;let top=209,bottom=-1;
 for(let y=0;y<209;y++)for(let x=0;x<209;x++)if(data[(y*1254+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y);}
 return bottom<0?null:(eclipse30Registration={height:bottom-top+1});
}
function eclipse30Body(g,a,size=72,t=vfxTime){
 const reg=eclipse30Register();if(!reg)return false;
 const q=a.rwCast,angle=q?.angle??a.rwFacing??a.a??0;let frame=Math.floor(t*4)%6,idle=false;
 if(a.hp<=0||a.knockedDown)frame=33;
 else if(a.hitReact>0)frame=a.hitReact>.12?30:31;
 else if(a.guard)frame=34;
 else if(a.dodgeTime>0)frame=35;
 else if(q){const before=q.holding||q.age<q.release,recovery=q.age>q.duration-.15;frame=q.slot===3?35:q.slot===4?34:before?(q.slot===5?34:25):recovery?29:q.slot===0?26:q.slot===1?27:28;}
 else if(a.punchTime>0)frame=24+clamp(Math.floor((1-a.punchTime/.24)*6),0,5);
 else if(a.moving)frame=(Math.abs(Math.sin(angle))>.65?(Math.sin(angle)>0?12:18):6)+Math.floor(a.rwStride??a.gait??0)%6;
 else idle=true;
 const k=size/72*73/reg.height,breath=idle?Math.sin(t*2.6+4)*.012:0;
 g.save();g.imageSmoothingEnabled=false;g.translate(0,9*size/72);g.scale(Math.cos(angle)<0?-1:1,1);g.scale(1-breath*.25,1+breath);
 g.drawImage(ECLIPSE30_BODY,frame%6*209,Math.floor(frame/6)*209,209,209,-104.5*k,-193*k,209*k,209*k);g.restore();return true;
}
const eclipse30OldBody=rwPaintBody;
rwPaintBody=function(g,a,size=72,t=vfxTime){return a.skin===4?eclipse30Body(g,a,size,t)||eclipse30OldBody(g,a,size,t):eclipse30OldBody(g,a,size,t);};
// Limpa a névoa branca de baixa opacidade das folhas (ela aparecia como uma placa quadrada) e suaviza as bordas da célula.
// A barreira usa máscara circular para a bolha não ficar com cara de quadrado.
const eclipse30Clean=new Map();
function eclipse30Cell(key,f){
 const id=key+':'+f;let c=eclipse30Clean.get(id);if(c)return c;
 const im=ECLIPSE30_FX[key];
 c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
 g.drawImage(im,f%6*256,Math.floor(f/6)*256,256,256,0,0,256,256);
 // Repulsion now has clean source alpha; do not alter its ring or fragments.
 if(key==='repulse'){eclipse30Clean.set(id,c);return c;}
 const data=g.getImageData(0,0,256,256),d=data.data,round=key==='barrier';
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const i=(y*256+x)*4;let a=d[i+3];if(!a)continue;
  const r=d[i],gg=d[i+1],b=d[i+2],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);
  // névoa: quase branca e pouco opaca
  if(!round&&a<=64&&mn>190&&mx-mn<40)a=0;
  else if(!round&&a<=64&&mn>190)a*=.4;
  let f2;
  if(round){const rr=Math.hypot(x-127.5,y-127.5)/128;f2=Math.max(0,Math.min(1,(1-rr)/.22))}
  else{const e=Math.min(x,y,255-x,255-y);f2=Math.max(0,Math.min(1,e/22))}
  d[i+3]=a*f2;
 }
 g.putImageData(data,0,0);eclipse30Clean.set(id,c);return c;
}
function eclipse30Effect(g,key,frame,x,y,size,angle=0,directional=false,alpha=1){
 const im=ECLIPSE30_FX[key];if(!im?.complete||!im.naturalWidth)return false;const f=clamp(Math.floor(frame),0,23);
 g.save();g.translate(x,y);g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;if(directional)orientSkillSprite(g,angle);
 g.drawImage(eclipse30Cell(key,f),0,0,256,256,-size/2,-size/2,size,size);g.restore();return true;
}
const eclipse30OldSprite=rwSprite;
rwSprite=function(g,skin,slot,x,y,size,phase,angle=0,directional=false,alpha=1,stage=0){
 if(skin!==4)return eclipse30OldSprite(g,skin,slot,x,y,size,phase,angle,directional,alpha,stage);
 if(slot===4)return; // The state-aware barrier layer below owns the bubble.
 return eclipse30Effect(g,ECLIPSE30_KEYS[slot],phase*24,x,y,size,angle,directional,alpha);
};
const eclipse30OldPaint=rwPaintFX;
rwPaintFX=function(e){
 if(e.skin!==4)return eclipse30OldPaint(e);
 const u=clamp(e.age/e.duration,0,1),x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y;
 if(e.kind==='warning'){
  eclipse30OldPaint(e);
  // Grow the domain visibly throughout its remaining dodge window.
  if(e.slot===5&&e.owner.hp>0)eclipse30Effect(ctx,'domain',8,x,y-40,50+u*((e.radius||150)*2.3-50),0,false,.85);
  return;
 }
 if(e.slot===4)return;
 if(e.kind==='departure'||e.kind==='arrival')return eclipse30Effect(ctx,'teleport',u*24,x,y-30,115);
 const key=e.kind==='impact'?(e.slot===1?'attract':e.slot===2?'red':'impact'):ECLIPSE30_KEYS[e.slot];
 const frame=e.kind==='impact'&&e.slot===2?16+u*8:u*24;
 eclipse30Effect(ctx,key,frame,x+(e.kind==='cast'?Math.cos(e.angle||0)*32:0),y-28,e.size||110,e.angle||0,false);
};
const eclipse30OldDepth=integratedDepth;
integratedDepth=function(){
 const projectiles=Reforged.projectiles;let list;
 Reforged.projectiles=projectiles.filter(e=>e.skin!==4);
 try{list=eclipse30OldDepth();}finally{Reforged.projectiles=projectiles;}
 list=list.filter(e=>e.kind!=='domain');
 for(const e of projectiles)if(e.skin===4&&e.life>0)list.push({kind:'eclipse-projectile',y:e.y,priority:3,paint(){
  eclipse30Effect(ctx,'red',e.age<.16?e.age/.16*8:8+Math.floor(e.age*24)%8,e.x,e.y-28,e.size||105,e.angle,true);
 }});
 for(const o of objects)if(o.v10Domain&&o.life>0&&o.owner.hp>0)list.push({kind:'eclipse-domain',y:o.y-180,priority:-1,paint(){
  const f=o.life<.6?16+(1-o.life/.6)*8:8+Math.floor(o.age*16)%8;
  eclipse30Effect(ctx,'domain',f,o.x,o.y-40,o.r*2.3,0,false,.85);
 }});
 for(const a of actors){if(a.skin!==4||a.hp<=0)continue;const s=reworkState(a);
  const q=a.rwCast;
  if(q?.slot===5&&q.age<q.release)list.push({kind:'eclipse-charge',y:a.y+.4,priority:4,paint(){
   const u=clamp(q.age/q.release,0,1);
   eclipse30Effect(ctx,'domain',8,a.x+Math.cos(q.angle)*20,a.y-23+Math.sin(q.angle)*8,24+u*26,0,false,.9);
  }});
  const birth=Reforged.effects.find(e=>e.owner===a&&e.slot===4&&e.kind==='cast'&&e.age<e.duration);
  if(s.barrier||s.barrierBroken>3.5)list.push({kind:'eclipse-barrier',y:a.y+.3,priority:3,paint(){
   const f=!s.barrier?16+(4-s.barrierBroken)/.5*8:birth?birth.age/birth.duration*8:clock-s.barrierHit<.4?8+(1-s.barrierEnergy/240)*7:6+Math.floor(vfxTime*4)%2;
   eclipse30Effect(ctx,'barrier',f,a.x,a.y-28,128,0,false,.55);
  }});
 }
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0));
};
const eclipse30OldHit=hit;
hit=function(target,amount,owner,knock=0,angle=0,id=-1){
 const ok=eclipse30OldHit(target,amount,owner,knock,angle,id);
 if(ok&&owner?.skin===4&&!originalDot&&skills[id]?.champion===4)rwFx(owner,skills[id].slot,target.x,target.y,'eclipse-contact',.35,{angle,size:75});
 return ok;
};
const eclipse30PaintContact=rwPaintFX;
rwPaintFX=function(e){if(e.kind==='eclipse-contact')return eclipse30Effect(ctx,'impact',e.age/e.duration*24,e.x,e.y-28,e.size||75);return eclipse30PaintContact(e);};
const eclipse30OldIcon=icon;
icon=function(id){const s=skills[id];return s?.champion===4?`<span class="skill-art reforged-icon" aria-hidden="true" style="background-image:url('assets/eclipse_v30/icon-${s.slot}.webp?v=30')"></span>`:eclipse30OldIcon(id);};
const eclipse30OldArt=championArt;
championArt=c=>c.id===4?'assets/eclipse_v30/portrait.webp?v=31':eclipse30OldArt(c);
CHAMPION_HEROES.eclipse='assets/eclipse_v30/portrait.webp?v=31';
const eclipse30OldDetail=openChampionDetails;
openChampionDetails=function(id){eclipse30OldDetail(id);$('#heroDetail')?.classList.toggle('eclipse-detail',Number(id)===4);};
