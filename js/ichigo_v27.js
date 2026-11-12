'use strict';
const ICHIGO27_BODY=rwImage('assets/ichigo_v27/body.webp?v=28');
const ICHIGO27_FX=Object.fromEntries(['slash','getsuga','shunpo','bankai','getsuga-final','impact'].map(key=>[key,rwImage(`assets/ichigo_v27/${key}.webp?v=28`)]));
const ichigo27Kit=[
 ['Corte Rápido','Avança e corta por 55 de dano. Ao acertar, use 1 novamente em até 0,65s para um corte ascendente de 40. Um retorno por uso; recarga mantida.',4,110,.16,.48],
 ['Quebra de Guarda','Prepara um corte vertical de 95 de dano. No contato frontal retira 45 de Stamina da guarda. Preparação e recuperação deixam espaço para esquivar.',7,115,.48,1.05],
 ['Getsuga Tenshō','Segure 3 por até 1,4s. Solte uma meia-lua de 85 a 165 de dano e alcance de 360 a 480. Custa 25 de Pressão; a carga deixa você parado.',8,480,.2,.85],
 ['Shunpo','Avança 180 na direção escolhida com breve invulnerabilidade. Cancela a recuperação dos dois primeiros cortes. Paredes bloqueiam o avanço.',6,180,.03,.3],
 ['Bankai','Custa 40 de Pressão. Por 7s: +20% de dano, +15% de velocidade, cortes mais rápidos e Getsuga negro com bordas vermelhas.',20,0,.32,.7],
 ['Getsuga Final','Exige 70 de Pressão e consome a barra. Prepara uma meia-lua negra de 210 + 1,6 por ponto de dano. Atravessa lutadores uma vez por alvo; paredes bloqueiam. Recuperação longa.',28,560,.75,1.65]
];
CHAMPIONS[2].kit.forEach((id,i)=>{const [name,desc,cd,range,release,duration]=ichigo27Kit[i];Object.assign(skills[id],{name,desc,cd,range,release,duration});});
skills[CHAMPIONS[2].kit[2]].holdMax=1.4;
CHAMPIONS[2].ult=ichigo27Kit[5][0];
CHAMPIONS[2].summary='Cortes geram Pressão. Encadeie um segundo golpe, quebre a guarda e carregue a onda espiritual. Bankai acelera os cortes e desperta a lua carmesim.';
identityKit(2).summary=CHAMPIONS[2].summary;
const ichigo27Icon=icon;icon=function(id){const s=skills[id];return s?.champion===2?`<span class="skill-art reforged-icon" aria-hidden="true" style="background-image:url('assets/ichigo_v27/icon-${s.slot}.webp?v=28')"></span>`:ichigo27Icon(id);};
function ichigo27Follow(a,id){return a?.skin===2&&id===a.kit[0]&&state==='fight'&&a.hp>0&&!a.guard&&a.root<=0&&a.dodgeTime<=0&&(reworkState(a).ichigoFollowUntil||0)>clock&&(!a.rwCast||a.rwCast.slot===0&&a.rwCast.released);}
function ichigo27CancelReady(a,id){return a?.skin===2&&id===a.kit[3]&&a.rwCast?.released&&a.rwCast.slot<2&&!(a.cd[id]>0)&&a.hp>0&&state==='fight'&&!a.guard&&a.root<=0;}
const ichigo27Ready=rwReady;rwReady=function(a,id){return ichigo27Follow(a,id)||ichigo27CancelReady(a,id)||ichigo27Ready(a,id);};
const ichigo27Reason=rwResourceReason;rwResourceReason=function(a,slot){if(a.skin===2){const s=reworkState(a),cost=[0,0,25,0,40,70][slot];if(s.value<cost)return cost+' PRE';if(slot===4&&s.spiritForm>0)return 'Ativo';return '';}return ichigo27Reason(a,slot);};
const ichigo27Commit=rwCommit;rwCommit=function(a,q){if(a.skin!==2)return ichigo27Commit(a,q);const s=reworkState(a);q.snapshot=s.value;q.bankai=s.spiritForm>0;s.value=q.slot===5?0:Math.max(0,s.value-[0,0,25,0,40,0][q.slot]);a.cd[q.id]=skills[q.id].cd;a.a=q.angle;};
const ichigo27Cast=rwCast;rwCast=function(a,id,manual){const follow=ichigo27Follow(a,id),cd=a?.cd[id]||0;const ok=ichigo27Cast(a,id,manual);if(ok&&a.skin===2&&a.rwCast){const q=a.rwCast;q.returnCut=follow;reworkState(a).ichigoFollowUntil=0;if(follow)a.cd[id]=cd;if(q.bankai&&q.slot<2){q.release*=.8;q.duration*=.8;a.cast=a.skillLock=q.duration;}}return ok;};
// Never create the wave beyond a wall beside the caster.
const ichigo27Launch=rwLaunch;rwLaunch=function(a,slot,angle,range,speed,damage,r=12,extra={}){const e=ichigo27Launch(a,slot,angle,range,speed,damage,r,extra);if(a.skin===2&&(!rwVisible(a,e)||rwObstacle(e.x,e.y,0)))e.life=0;return e;};
const ichigo27Release=rwRelease;rwRelease=function(a,q){if(a.skin!==2)return ichigo27Release(a,q);const s=reworkState(a),an=q.angle;
 if(q.slot===0){if(!q.returnCut)move(a,Math.cos(an)*18,Math.sin(an)*18);const count=rwArc(a,an,110,q.returnCut?40:55,0,1.7,5);s.ichigoFollowUntil=count&&!q.returnCut?clock+.65:0;rwFx(a,0,a.x,a.y,'ichigo-cut',.24,{follow:true,angle:an,reverse:q.returnCut});}
 if(q.slot===1){for(const t of opponents(a)){const d=Math.atan2(t.y-a.y,t.x-a.x)-an;if(t.hp>0&&t.inv<=0&&t.guard&&dist(a,t)<115+t.r&&Math.cos(d)>Math.cos(.7)&&Math.cos(Math.atan2(a.y-t.y,a.x-t.x)-t.a)>.15&&rwVisible(a,t)){t.st=Math.max(0,t.st-45);if(t.st<=0)breakGuard(t);}}rwArc(a,an,115,95,1,1.4,18);rwFx(a,1,a.x,a.y,'ichigo-heavy',.35,{follow:true,angle:an});}
 if(q.slot===2)rwLaunch(a,2,an,360+120*q.charge,510,85+80*q.charge,16+10*q.charge,{size:70+35*q.charge,bankai:q.bankai});
 if(q.slot===3){
  const from={x:a.x,y:a.y};a.inv=.18;
  const dash=rwDash(a,an,180,.2,()=>{},{slot:3});let nextEcho=48;
  dash.onStep=()=>{if(dash.travel>=nextEcho){nextEcho+=48;rwFx(a,3,a.x,a.y,'ichigo-afterimage',.3,{angle:an});}};
  rwFx(a,3,from.x,from.y,'ichigo-afterimage',.3,{angle:an});
 }
 if(q.slot===4){s.spiritForm=7;rwFx(a,4,a.x,a.y,'ichigo-awaken',.6,{follow:true});}
 if(q.slot===5){rwLaunch(a,5,an,560,500,210+q.snapshot*1.6,30,{size:155,piercing:true,knock:35,bankai:true});combatImpact(1.5);}
};
// Keep the existing damage pipeline, with a smaller Bankai bonus.
const ichigo27Hit=hit;hit=function(target,amount,owner,knock=0,angle=0,id=-1){const held=target?.skin===2&&target.rwCast?.holding&&target.rwCast.slot===2,cutCD=held?target.cd[target.kit[0]]:0;if(owner?.skin===2&&reworkState(owner).spiritForm>0)amount*=1.2/1.45;const ok=ichigo27Hit(target,amount,owner,knock,angle,id);if(held&&!target.rwCast){target.cd[target.kit[0]]=cutCD;target.cd[target.kit[2]]=Math.max(target.cd[target.kit[2]],1);}if(ok&&owner?.skin===2&&id===owner.kit[5]){combatImpact(2);rwFx(owner,5,target.x,target.y,'ichigo-impact',.35,{angle});}return ok;};
const ichigo27Control=skillControlState;skillControlState=function(a,s){const v=ichigo27Control(a,s);if(ichigo27Follow(a,s.id))Object.assign(v,{ready:true,locked:false,text:'2º CORTE',remaining:0,fraction:0});else if(ichigo27CancelReady(a,s.id))Object.assign(v,{ready:true,locked:false,text:'SHUNPO',remaining:0,fraction:0});return v;};
const ichigo27Bind=bindSkill;bindSkill=function(btn,index){if(p?.skin!==2||![0,3].includes(index))return ichigo27Bind(btn,index);btn.addEventListener('pointerdown',e=>{if(aimGesture||!rwReady(p,p.kit[index]))return;e.preventDefault();btn.setPointerCapture(e.pointerId);aimGesture={index,x:e.clientX,y:e.clientY,a:aim(p),pointer:e.pointerId,dragged:false,dx:0,dy:0,stickRadius:80};});btn.addEventListener('pointermove',e=>{const q=aimGesture;if(q?.pointer!==e.pointerId)return;q.dx=e.clientX-q.x;q.dy=e.clientY-q.y;if(Math.hypot(q.dx,q.dy)>4){q.dragged=true;q.a=Math.atan2(q.dy,q.dx);}});btn.addEventListener('pointerup',e=>{const q=aimGesture;if(q?.pointer!==e.pointerId)return;e.preventDefault();aimGesture=null;cast(p,p.kit[index],q.dragged?q.a:undefined);});for(const type of ['pointercancel','lostpointercapture'])btn.addEventListener(type,e=>{if(aimGesture?.pointer===e.pointerId)aimGesture=null;});};
let ichigo27Registration=null;
function ichigo27Register(){if(ichigo27Registration)return ichigo27Registration;if(!ICHIGO27_BODY.complete||!ICHIGO27_BODY.naturalWidth)return null;const c=document.createElement('canvas');c.width=ICHIGO27_BODY.naturalWidth;c.height=ICHIGO27_BODY.naturalHeight;const g=c.getContext('2d');g.drawImage(ICHIGO27_BODY,0,0);const data=g.getImageData(0,0,c.width,c.height).data;const frames=[];for(let i=0;i<36;i++){const x=Math.round(i%6*c.width/6),y=Math.round(Math.floor(i/6)*c.height/6),w=Math.round((i%6+1)*c.width/6)-x,h=Math.round((Math.floor(i/6)+1)*c.height/6)-y;let top=h,bottom=0,left=w,right=0;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(data[((y+yy)*c.width+x+xx)*4+3]>170){top=Math.min(top,yy);bottom=Math.max(bottom,yy);left=Math.min(left,xx);right=Math.max(right,xx);}frames.push({x,y,w,h,top,bottom,left,right});}const heights=frames.slice(0,6).map(f=>f.bottom-f.top).sort((a,b)=>a-b);const bankai=document.createElement('canvas');bankai.width=c.width;bankai.height=c.height;const bg=bankai.getContext('2d');bg.filter='contrast(1.2) saturate(.7)';bg.drawImage(c,0,0);return ichigo27Registration={frames,height:heights[5],bankai};}
function ichigo27Body(g,a,size=72,t=vfxTime){
 const reg=ichigo27Register();if(!reg)return false;
 const q=a.rwCast,angle=q?.angle??a.rwFacing??a.a??0;let frame=Math.floor(t*4)%6,idle=false;
 if(a.hp<=0||a.knockedDown)frame=33;
 else if(a.hitReact>0)frame=a.hitReact>.12?30:31;
 else if(a.guard)frame=34;
 else if(a.dodgeTime>0)frame=35;
 else if(q){
  if(q.slot===0)frame=q.age<q.release?25:q.age>=q.duration-.12?29:q.returnCut?27:26;
  else if(q.slot===1)frame=q.age<q.release?24:q.age<q.duration-.22?28:29;
  else if(q.slot===2)frame=q.holding||q.age<q.release?24:q.age<q.duration-.15?26:29;
  else if(q.slot===3)frame=35;
  else if(q.slot===4)frame=34;
  else frame=q.age<q.release?24:q.age<q.release+.3?28:29;
 }else if(a.punchTime>0)frame=24+clamp(Math.floor((1-a.punchTime/.24)*6),0,5);
 else if(a.moving)frame=(Math.abs(Math.sin(angle))>.65?(Math.sin(angle)>0?12:18):6)+Math.floor(a.rwStride??a.gait??0)%6;
 else idle=true;
 const f=reg.frames[frame],k=size/72*73/reg.height;
 g.save();g.imageSmoothingEnabled=false;g.scale(Math.cos(angle)<0?-1:1,1);
 // Fixed cell root: extending the sword must not recenter the fighter.
 // Breathing pivots at the soles, matching the Astral and Ninja renderers.
 const breath=idle?Math.sin(t*2.6+2)*.012:0;
 g.translate(0,9*size/72);g.scale(1-breath*.25,1+breath);
 g.drawImage(reworkState(a).spiritForm>0?reg.bankai:ICHIGO27_BODY,f.x,f.y,f.w,f.h,-f.w/2*k,-f.bottom*k,f.w*k,f.h*k);
 g.restore();return true;
}
const ichigo27OldBody=rwPaintBody;rwPaintBody=function(g,a,size=72,t=vfxTime){return a.skin===2?ichigo27Body(g,a,size,t)||ichigo27OldBody(g,a,size,t):ichigo27OldBody(g,a,size,t);};
// All effects use 24 painted frames; the same transparent edge treatment as Astral.
function ichigo27Effect(g,key,frame,x,y,size,angle=0,directional=false,alpha=1){
 const im=ICHIGO27_FX[key];if(!im?.naturalWidth)return false;
 g.save();g.translate(x,y);g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;
 if(directional)orientSkillSprite(g,angle);else if(Math.cos(angle)<0)g.scale(-1,1);
 g.drawImage(astralSoftCell(im,clamp(Math.floor(frame),0,23)),-size/2,-size/2,size,size);
 g.restore();return true;
}
const ichigo27Sprite=rwSprite;
rwSprite=function(g,skin,slot,x,y,size,phase,angle=0,directional=false,alpha=1,stage=0){
 if(skin!==2)return ichigo27Sprite(g,skin,slot,x,y,size,phase,angle,directional,alpha,stage);
 const key=['slash','slash','getsuga','shunpo','bankai','getsuga-final'][slot];
 // Active Bankai is painted once by the shared persistent-aura layer.
 if(slot===4)return ichigo27Effect(g,key,8+Math.floor(vfxTime*14)%8,x,y-8,size,0,false,alpha);
 ichigo27Effect(g,key,phase*24,x,y,slot===5?size*1.25:size,angle,directional,alpha);
};
const ichigo27FX=rwPaintFX;
rwPaintFX=function(e){
 if(e.skin!==2)return ichigo27FX(e);
 const u=clamp(e.age/e.duration,0,1),x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y,angle=e.angle||0;
 if(e.kind==='ichigo-afterimage'){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=(1-u)*.45;
  ctx.filter='sepia(1) saturate(4) hue-rotate(155deg)';
  ichigo27Body(ctx,{...e.owner,rwCast:null,hitReact:0,guard:false,dodgeTime:1,rwFacing:angle},72,0);
  ctx.restore();ichigo27Effect(ctx,'shunpo',u*24,x,y-24,112,angle,true,.85);
 }else if(e.kind==='ichigo-cut'||e.kind==='ichigo-heavy'){
  const heavy=e.kind==='ichigo-heavy',offset=heavy?38:32;
  // Start on the sword at contact; follow-through is handed to the painted frames.
  ichigo27Effect(ctx,'slash',u*24,x+Math.cos(angle)*offset,y+Math.sin(angle)*offset-28,heavy?126:104,angle+(heavy?.75:e.reverse?-.55:0),true);
 }else if(e.kind==='ichigo-impact'||e.kind==='impact'){
  ichigo27Effect(ctx,'impact',u*24,x,y-28,e.kind==='ichigo-impact'?150:e.size||80,angle,false);
 }else if(e.kind==='ichigo-awaken'){
  // Birth frames merge into the sustained aura instead of shrinking on activation.
  ichigo27Effect(ctx,'bankai',Math.min(15,u*16),x,y-40,138,0,false,1-u);
 }
};
// Melee hits need their own contact sprite, not a second copy of the sword arc.
const ichigo28Hit=hit;
hit=function(target,amount,owner,knock=0,angle=0,id=-1){
 const ok=ichigo28Hit(target,amount,owner,knock,angle,id);
 if(ok&&owner?.skin===2&&[owner.kit[0],owner.kit[1]].includes(id))rwFx(owner,skills[id].slot,target.x,target.y,'impact',.32,{angle,size:64});
 return ok;
};
const ichigo27Depth=integratedDepth;
integratedDepth=function(){
 // Give Ronin projectiles a birth, sustained flight and dissipation, rather than
 // repeating the generic middle frames for their whole lifetime.
 const projectiles=Reforged.projectiles;let list;
 Reforged.projectiles=projectiles.filter(e=>e.skin!==2);
 try{list=ichigo27Depth();}finally{Reforged.projectiles=projectiles;}
 for(const e of projectiles)if(e.skin===2&&e.life>0)list.push({kind:'ichigo-projectile',y:e.y,priority:3,paint:()=>{
  const remaining=(e.range-e.travel)/e.speed;
  const frame=e.age<.1?e.age/.1*8:remaining<.12?16+(1-remaining/.12)*7:8+Math.floor(e.age*24)%8;
  ichigo27Effect(ctx,e.slot===5?'getsuga-final':'getsuga',frame,e.x,e.y-28,(e.size||88)*(e.slot===5?1.25:1),e.angle,true);
 }});
 for(const a of actors){
  if(a.skin!==2||a.hp<=0)continue;
  const q=a.rwCast,s=reworkState(a);
  if(q?.holding&&q.slot===2)list.push({kind:'ichigo-charge',y:a.y+.6,priority:4,paint:()=>{
   const facing=Math.cos(q.angle)<0?-1:1;
   ichigo27Effect(ctx,'getsuga',2+Math.floor(q.charge*5),a.x-facing*12,a.y-51,25+q.charge*30,q.angle,true,.85);
  }});
  if(q?.slot===5&&q.age<q.release){
   list.push({kind:'ichigo-cinematic',y:-10000,priority:-5,paint:()=>paintUltimateShade(a,clamp(q.age/q.release,0,1))});
   list.push({kind:'ichigo-final-charge',y:a.y-.4,priority:0,paint:()=>ichigo27Effect(ctx,'bankai',q.age/q.release*14,a.x,a.y-40,144,0,false,.8)});
  }
 }
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0));
};
const ichigo27Cinematic=ultimateCinematicActor;ultimateCinematicActor=function(){return ichigo27Cinematic()||actors.find(a=>a.hp>0&&a.skin===2&&a.rwCast?.slot===5);};
const ichigo27Art=championArt;championArt=c=>c.id===2?'assets/ichigo_v27/portrait.webp':ichigo27Art(c);
CHAMPION_HEROES.ronin='assets/ichigo_v27/portrait.webp';
const ichigo27Detail=openChampionDetails;openChampionDetails=function(id){ichigo27Detail(id);$('#heroDetail')?.classList.toggle('ichigo-detail',Number(id)===2);};
