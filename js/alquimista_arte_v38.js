'use strict';
// Presentation only: all casts, collisions, materials, damage and lifetimes remain owned by the combat engine.
const ALQUIMISTA38_ROOT='assets/alquimista_v38/';
const ALQUIMISTA38_BODY=rwImage(ALQUIMISTA38_ROOT+'body.webp?v=38');
const ALQUIMISTA38_SKILLS=rwImage(ALQUIMISTA38_ROOT+'skills.webp?v=38');
const ALQUIMISTA38_ACTIVE=['block','wall','throw','impact','colossus'];
const ALQUIMISTA38_FX=Object.fromEntries(ALQUIMISTA38_ACTIVE.map(k=>[k,rwImage(ALQUIMISTA38_ROOT+k+'.webp?v=38')]));
const alc38Falls=new WeakMap(),alc38Bounds=new WeakMap(),alc38Objects=new Map();
let alc38Generation=-1;
const alc38Hero=a=>a?.skin===9&&!a.boss&&!a.trainingDummy&&!a.mob&&!a.rmob;
function alc38Pose(a,t=vfxTime){
 const q=a.rwCast,angle=q?.angle??a.rwFacing??a.a??0;
 if(a.hp<=0||a.knockedDown){
  if(a.koAge!==undefined&&typeof v3KoFrame==='function')return {frame:v3KoFrame(a),angle};
  let f=alc38Falls.get(a);if(!f||f.generation!==Reforged.generation){f={t,wall:performance.now(),generation:Reforged.generation};alc38Falls.set(a,f)}
  return {frame:Math.max(t-f.t,state==='end'?(performance.now()-f.wall)/1000:0)<.24?32:33,angle};
 }
 alc38Falls.delete(a);
 if(a.hitReact>0)return {frame:a.hitReact>.12?30:31,angle};
 if(a.guard)return {frame:34,angle};
 const dash=Reforged.dashes.find(d=>d.owner===a&&!d.finished);
 if(dash)return {skillFrame:18+combat35Phase(dash.age,.025,dash.duration),angle:dash.angle};
 if(q){const row=({0:0,1:1,2:1,3:2,4:4,5:4})[q.slot];return {skillFrame:row*6+combat35Phase(q.age,q.release,q.duration,q.holding),angle}}
 if(a.dodgeTime>0)return {frame:35,angle};
 if(a.punchTime>0)return {frame:24+clamp(Math.floor((1-a.punchTime/.24)*6),0,5),angle};
 if(state==='end'&&a===p&&a.hp>0)return {skillFrame:30+Math.floor(t*3)%6,angle};
 const row=Math.abs(Math.sin(angle))>.65?(Math.sin(angle)>0?2:3):1;
 return {frame:a.moving?row*6+Math.floor(a.rwStride??a.gait??t*10)%6:Math.floor(t*4)%6,angle};
}
function alc38Body(g,a,size=72,t=vfxTime){
 const pose=alc38Pose(a,t),im=pose.skillFrame===undefined?ALQUIMISTA38_BODY:ALQUIMISTA38_SKILLS,h=combat35Height(im);if(!h)return false;
 const frame=pose.skillFrame??pose.frame,k=size/72*73/h;
 g.save();g.imageSmoothingEnabled=false;g.translate(0,9*size/72);g.scale(Math.cos(pose.angle)<0?-1:1,1);
 g.drawImage(im,frame%6*209,Math.floor(frame/6)*209,209,209,-104.5*k,-193*k,209*k,209*k);g.restore();return true;
}
const alc38OldBody=rwPaintBody,alc38OldFighter=drawAnimatedFighter,alc38OldActor=integratedDrawActor;
rwPaintBody=function(g,a,size=72,t=vfxTime){return alc38Hero(a)?alc38Body(g,a,size,t)||alc38OldBody(g,a,size,t):alc38OldBody(g,a,size,t)};
drawAnimatedFighter=function(g,a,size=72,t=vfxTime){return alc38Hero(a)?alc38Body(g,a,size,t)||alc38OldFighter(g,a,size,t):alc38OldFighter(g,a,size,t)};
integratedDrawActor=function(a){if(!alc38Hero(a)||a.hp>0)return alc38OldActor(a);ctx.save();ctx.translate(a.x,a.y);ellipse(0,9,22,6,'#06100c88');alc38Body(ctx,a);ctx.restore()};
function alc38Effect(g,key,frame,x,y,size,angle=0,directional=false,alpha=1){
 const im=ALQUIMISTA38_FX[key];if(!im?.complete||!im.naturalWidth)return false;
 const f=clamp(Math.floor(frame),0,23);g.save();g.translate(x,y);if(directional)orientSkillSprite(g,angle);g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;
 g.drawImage(im,f%6*256,Math.floor(f/6)*256,256,256,-size/2,-size/2,size,size);g.restore();return true;
}
function alc38Registration(im){
 if(!im.complete||!im.naturalWidth)return null;if(alc38Bounds.has(im))return alc38Bounds.get(im);
 const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d',{willReadFrequently:true}),frames=[];
 for(let f=0;f<24;f++){
  g.clearRect(0,0,256,256);g.drawImage(im,f%6*256,Math.floor(f/6)*256,256,256,0,0,256,256);
  const d=g.getImageData(0,0,256,256).data;let left=256,right=-1,top=256,bottom=-1;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(d[(y*256+x)*4+3]>170){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
  frames.push({left,right,top,bottom,width:Math.max(1,right-left+1),height:Math.max(1,bottom-top+1)});
 }
 const ref={frames,width:Math.max(...frames.slice(8,16).map(f=>f.width)),height:Math.max(...frames.slice(8,16).map(f=>f.height))};alc38Bounds.set(im,ref);return ref;
}
// Golem em 4 ângulos (frente, 3/4, perfil, costas) × parado/andando/atacando — assets/alquimista_v38/golem4.webp (gerado no Canva).
const ALC38_GOLEM4=rwImage(ALQUIMISTA38_ROOT+'golem4.webp?v=40');
// Golem animado v40 (gerado no Canva, fundo verde removido e borda encolhida 1 px — sem linha branca):
// assets/alquimista_v38/golem_v40.webp, 9 colunas × 6 linhas de 256: linhas 0–3 = frente, 3/4, perfil (direita), costas
// com quadros 0 parado · 1–4 caminhada · 5–8 soco; linha 4 = formação; linha 5 = desmoronamento.
const ALC40_GOLEM=rwImage(ALQUIMISTA38_ROOT+'golem_v40.webp?v=1');
const alc40Ready=()=>ALC40_GOLEM.complete&&ALC40_GOLEM.naturalWidth>0&&!/[?&]golem40=0/.test(location.search);
function alc40Draw(g,o,row,frame,flip,bob=0){
 const k=o.size/214;g.save();g.translate(o.x,o.y);g.imageSmoothingEnabled=true;
 if(typeof g.beginPath==='function'){g.save();g.globalAlpha=.32;g.fillStyle='#06100c';g.beginPath();g.ellipse(0,6,o.size*.34,o.size*.11,0,0,Math.PI*2);g.fill();g.restore()}
 if(flip)g.scale(-1,1);
 g.drawImage(ALC40_GOLEM,frame*256,row*256,256,256,-128*k,9-242*k-bob,256*k,256*k);g.restore();return true;
}
function alc40Golem(g,o,attack){
 const an=o.angle||0,c=Math.cos(an),sn=Math.sin(an);
 const row=sn>.75?0:sn>.35?1:sn<-.75?3:2,flip=(row===1||row===2)&&c<0;
 const moved=o.v3lx!=null&&Math.hypot(o.x-o.v3lx,o.y-o.v3ly)>.05;o.v3lx=o.x;o.v3ly=o.y;
 if(moved)o.v3walkT=vfxTime;const walking=vfxTime-(o.v3walkT??-9)<.15;
 const frame=attack?5+Math.min(3,Math.floor(attack.age/.4*4)):walking?1+Math.floor(vfxTime*8)%4:0;
 const r2=row===2&&frame===0?1:row;   // parado de lado: a pose de 3/4 lê melhor que o perfil fino
 return alc40Draw(g,o,r2,frame,flip);
}
function alc38Golem4(g,o,attack){
 if(alc40Ready())return alc40Golem(g,o,attack);
 const im=ALC38_GOLEM4;if(!im.complete||!im.naturalWidth)return false;
 const an=o.angle||0,c=Math.cos(an),sn=Math.sin(an);
 const col=sn>.75?0:sn>.35?1:sn<-.75?3:2,flip=(col===1||col===2)&&c<0;
 const moved=o.v3lx!=null&&Math.hypot(o.x-o.v3lx,o.y-o.v3ly)>.05;o.v3lx=o.x;o.v3ly=o.y;
 if(moved)o.v3walkT=vfxTime;const walking=vfxTime-(o.v3walkT??-9)<.15;
 const row=attack?2:walking?(Math.floor(vfxTime*5)%2):0,k=o.size/212,bob=walking?Math.abs(Math.sin(vfxTime*Math.PI*5))*2:0;
 const c2=row===0&&col===2?1:col;   // parado de lado: a pose de 3/4 lê melhor que o perfil fino
 g.save();g.translate(o.x,o.y);g.imageSmoothingEnabled=false;
 if(typeof g.beginPath==='function'){g.save();g.globalAlpha=.32;g.fillStyle='#06100c';g.beginPath();g.ellipse(0,6,o.size*.34,o.size*.11,0,0,Math.PI*2);g.fill();g.restore()}
 if(flip)g.scale(-1,1);
 g.drawImage(im,c2*256,row*256,256,256,-128*k,9-240*k-bob,256*k,256*k);g.restore();return true;
}
function alc38Construct(g,o,forcedFrame=null){
 const key=o.colossus?'colossus':o.wall?'wall':'block',im=ALQUIMISTA38_FX[key],reg=alc38Registration(im);if(!reg)return false;
 const age=o.age??clock-o.created,birth=o.colossus ? .8 : .7;
 const attack=o.colossus&&Reforged.effects.find(e=>e.kind==='golem-hit'&&e.owner===o.owner&&e.age<.4&&Math.hypot(e.x-o.x,e.y-o.y)<o.size);
 const activeFrame=o.colossus?(attack?12+Math.min(3,Math.floor(attack.age/.4*4)):8+Math.floor(o.age*8)%4):8+Math.floor(vfxTime*4)%8;
 if(o.colossus&&alc40Ready()){
  if(forcedFrame!=null&&forcedFrame>=16)return alc40Draw(g,o,5,Math.min(8,Math.floor((forcedFrame-16)*9/8)),false);   // desmoronando
  if(forcedFrame==null&&age<birth)return alc40Draw(g,o,4,Math.min(8,Math.floor(age/birth*9)),false);                   // formando
 }
 if(o.colossus&&forcedFrame==null&&age>=birth&&o.hp>0&&o.life>0&&alc38Golem4(g,o,attack||null))return true;
 const frame=forcedFrame??(age<birth?Math.min(7,Math.floor(age/birth*8)):activeFrame),f=clamp(frame,0,23),box=reg.frames[f];
 const vertical=o.wall&&o.h>o.w,extent=o.colossus?o.size:o.wall?Math.max(o.w,o.h):o.w,k=extent/(o.colossus?reg.height:reg.width);
 // Real collider width determines the visible construction width. Keep its base
 // at the collider's front edge; rotate the horizontal wall for the vertical one.
 g.save();g.translate(o.x,o.y);if(vertical)g.rotate(Math.PI/2);g.imageSmoothingEnabled=false;
 if(o.colossus&&typeof g.beginPath==='function'){g.save();g.globalAlpha=.32;g.fillStyle='#06100c';g.beginPath();g.ellipse(0,6,o.size*.34,o.size*.11,0,0,Math.PI*2);g.fill();g.restore()}if(o.colossus&&Math.cos(o.angle||0)<-.15)g.scale(-1,1);
 const base=o.colossus?9:o.wall?Math.min(o.w,o.h)/2:o.h/2;
 g.drawImage(im,f%6*256,Math.floor(f/6)*256,256,256,-(box.left+box.right)/2*k,base-box.bottom*k,256*k,256*k);g.restore();
 return true;
}
const alc38OldConstruct=rwPaintConstruct;
rwPaintConstruct=function(o){
 if(!(o.material||o.colossus)||!alc38Construct(ctx,o))return alc38OldConstruct(o);
 if(o.hp<o.max){ctx.fillStyle='#11242b';ctx.fillRect(o.x-20,o.y+9,40,4);ctx.fillStyle=sameTeam(o.owner,p)?'#82dfb1':'#ef9479';ctx.fillRect(o.x-20,o.y+9,40*o.hp/o.max,4)}
};
const alc38OldSprite=rwSprite;
rwSprite=function(g,skin,slot,x,y,size,phase,angle=0,directional=false,alpha=1,stage=0){
 if(skin!==9)return alc38OldSprite(g,skin,slot,x,y,size,phase,angle,directional,alpha,stage);
 // Only the existing thrown block is a projectile. Future steel, aim, lance,
 // spikes and ultimate-charge atlases are deliberately not connected to play.
 if(directional&&slot===0)return alc38Effect(g,'throw',8+Math.floor(phase*24)%8,x,y,size,angle,true,alpha);
 if(slot===4)return true;
 return alc38Effect(g,'impact',phase*24,x,y,size,angle,false,alpha);
};
const alc38OldPaint=rwPaintFX;
rwPaintFX=function(e){
 if(e.skin!==9)return alc38OldPaint(e);
 if(['construct','summon','cast'].includes(e.kind))return; // body and real objects supply these drawings
 const u=clamp(e.age/e.duration,0,1),x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y;
 if(e.kind==='break'){
  // Observed real constructions use their exact footprint and death sequence.
  if([...alc38Objects.values()].some(v=>v.death!==null&&Math.abs(v.o.x-x)<1&&Math.abs(v.o.y-y)<1))return;
  return alc38Effect(ctx,e.slot===5?'colossus':e.slot===3?'wall':'block',16+u*8,x,y-12,e.size||70);
 }
 if(e.kind==='ninja-afterimage')return alc38Effect(ctx,'impact',16+u*8,x,y,48,e.angle,false,1-u);
 return alc38Effect(ctx,'impact',u*24,x,y-(e.kind==='alc38-contact'?24:8),e.size||65,e.angle);
};
const alc38OldHit=hit;
hit=function(target,amount,owner,knock=0,angle=0,id=-1){
 const before=target?.hp,result=alc38OldHit(target,amount,owner,knock,angle,id),skill=skills[id];
 if(result&&target?.hp<before&&alc38Hero(owner)&&!originalDot&&skill?.champion===9)rwFx(owner,skill.slot,target.x,target.y,'alc38-contact',.35,{size:skill.slot===5?85:60,angle});
 return result;
};
const alc38OldDepth=integratedDepth;
integratedDepth=function(){
 if(alc38Generation!==Reforged.generation){alc38Objects.clear();alc38Generation=Reforged.generation}
 const list=alc38OldDepth(),live=new Set(objects);
 for(const o of objects)if((o.material||o.colossus)&&o.hp>0&&o.life>0&&!alc38Objects.has(o))alc38Objects.set(o,{o,death:null});
 for(const [o,entry]of alc38Objects){
  if(entry.death===null&&(!live.has(o)||o.hp<=0||o.life<=0))entry.death=clock;
  if(entry.death!==null){const age=clock-entry.death,dur=o.colossus&&alc40Ready()?.9:.5;if(age>=dur||age<0){alc38Objects.delete(o);continue}list.push({kind:'alc38-collapse',y:o.y,priority:1,paint:()=>alc38Construct(ctx,o,Math.min(23,16+Math.floor(age/dur*8)))});}
 }
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0));
};
const alc38OldIcon=icon;
icon=function(id){const s=skills[id];if(s?.champion!==9)return alc38OldIcon(id);const n=({0:0,1:1,2:1,3:2,4:4,5:4})[s.slot];return `<span class="skill-art reforged-icon alquimista-skill-art" aria-hidden="true" style="background-image:url('${ALQUIMISTA38_ROOT}icon-${n}.webp?v=38')"></span>`};
const alc38OldArt=championArt;
championArt=c=>c.id===9?ALQUIMISTA38_ROOT+'portrait.webp?v=38':alc38OldArt(c);
CHAMPION_HEROES.steel=ALQUIMISTA38_ROOT+'portrait.webp?v=38';
const alc38OldDetail=openChampionDetails;
openChampionDetails=function(id){alc38OldDetail(id);$('#heroDetail')?.classList.toggle('alquimista-detail',Number(id)===9)};
const alc38OldPreload=reworkPreload;
reworkPreload=function(skin){if(skin!==9)return alc38OldPreload(skin);for(const key of ['body','skills','portrait','golem4',...ALQUIMISTA38_ACTIVE,...Array.from({length:5},(_,i)=>'icon-'+i)])rwImage(ALQUIMISTA38_ROOT+key+'.webp?v=38')};
function alc38FaceCrop(im){const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d'),k=im.naturalWidth/760;g.imageSmoothingQuality='high';g.drawImage(im,210*k,50*k,380*k,380*k,0,0,96,96);return c.toDataURL('image/webp',.95)}
if(window.v3FaceSrc){const old=window.v3FaceSrc,im=rwImage(ALQUIMISTA38_ROOT+'portrait.webp?v=38');let face=null;window.v3FaceSrc=function(a){if(!alc38Hero(a)||!Array.isArray(a.kit)||a.kit.length!==6)return old(a);if(!face&&im.complete&&im.naturalWidth)face=alc38FaceCrop(im);return face};const crop=window.v3FaceCrop;window.v3FaceCrop=im=>im.src.includes('/alquimista_v38/')?alc38FaceCrop(im):crop(im)}
