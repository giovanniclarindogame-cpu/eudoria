'use strict';
const NINJA22_ART={smoke:rwImage('assets/ninja_v22/smoke.webp'),electric:rwImage('assets/ninja_v22/electric.webp'),slash:rwImage('assets/ninja_v22/slash.webp')};
const ninja22Descriptions=[
 'Avança e corta por 60 de dano. Se acertar, toque novamente em 1 por até 0,7s para um corte de retorno de 40 de dano.',
 'Cria um clone com 1 HP por até 3s e recua. Ele corre até o inimigo, desfere um corte de 35 de dano e desaparece em fumaça.',
 'Coloca um selo até 220 de distância. Arma após 0,45s e dura 8s: causa 55 de dano e paralisa por 1,2s. Até dois selos ativos.',
 'Troca de posição com o clone até 340 de distância. Sem clone, esquiva 90 para trás e deixa uma imagem residual. Destinos respeitam obstáculos.',
 'Por 4s, observa o próximo especial que causar dano, exceto ultimates. Toque novamente para usar a cópia uma vez com 75% do dano. Não anula o dano recebido.',
 'Carrega eletricidade na mão e avança até 340. Para no primeiro inimigo e descarrega 230 de dano. Uma cópia guardada é consumida no acerto para mais 70 de dano.'
];
CHAMPIONS[1].kit.forEach((id,i)=>skills[id].desc=ninja22Descriptions[i]);
skills[CHAMPIONS[1].kit[5]].release=.45;skills[CHAMPIONS[1].kit[5]].duration=1.25;
function ninja22Follow(a,id){return a?.skin===1&&skills[id]?.slot===0&&(reworkState(a).ninjaFollowUntil||0)>clock&&a.hp>0&&state==='fight'&&a.root<=0&&!a.guard&&(!a.rwCast||a.rwCast.slot===0&&a.rwCast.released);}
const ninja22Ready=rwReady;rwReady=function(a,id){return ninja22Follow(a,id)||ninja22Ready(a,id);};
const ninja22Cast=rwCast;rwCast=function(a,id,manual){const follow=ninja22Follow(a,id);if(follow){a.rwCast=null;a.cast=a.skillLock=a.actionRecovery=a.punchTime=0;a.cd[id]=0;reworkState(a).ninjaFollowUntil=0;}const ok=ninja22Cast(a,id,manual);if(ok&&a.skin===1&&a.rwCast)a.rwCast.returnCut=follow;return ok;};
function ninja22Smoke(a,x=a.x,y=a.y){rwFx(a,1,x,y,'ninja-smoke',.65,{size:100});}
const ninja22Release=rwRelease;
rwRelease=function(a,q){if(a.skin!==1)return ninja22Release(a,q);const s=reworkState(a),angle=q.angle,slot=q.slot;
 if(slot===0){if(!q.returnCut)move(a,Math.cos(angle)*20,Math.sin(angle)*20);const hits=rwArc(a,angle,95,q.returnCut?40:60,0,1.9,5);s.ninjaFollowUntil=hits&&!q.returnCut?clock+.7:0;rwFx(a,0,a.x,a.y,'ninja-cut',.25,{angle,reverse:q.returnCut,follow:true});}
 if(slot===1){const old=originalClone(a);if(old){old.life=0;ninja22Smoke(a,old.x,old.y);}const o=actor(a.x,a.y,[],a.color);Object.assign(o,{ninja22:true,v10Clone:true,owner:a,skin:1,team:a.team,hp:1,max:1,life:3,age:0,attacks:0,inv:0,kit:[]});objects.push(o);ninja22Smoke(a);move(a,-Math.cos(angle)*38,-Math.sin(angle)*38);}
 if(slot===2){const own=objects.filter(o=>o.v10Trap&&o.owner===a&&o.life>0);if(own.length>=2)own[0].life=0;const pt=q.target;if(pt&&!rwObstacle(pt.x,pt.y,12))objects.push({ninja22:true,v10Trap:true,owner:a,x:pt.x,y:pt.y,r:30,hp:45,max:45,life:8,age:0});}
 if(slot===3){const clone=originalClone(a),from={x:a.x,y:a.y};if(clone){if(dist(a,clone)>340||!originalFreePoint(a,clone.x,clone.y)){a.cd[q.id]=1;return;}a.x=clone.x;a.y=clone.y;clone.x=from.x;clone.y=from.y;}else{rwDash(a,angle+Math.PI,90,.18,()=>{}, {slot});rwFx(a,3,from.x,from.y,'ninja-afterimage',.35,{angle});}a.inv=.25;ninja22Smoke(a,from.x,from.y);ninja22Smoke(a);}
 if(slot===4){if(s.copy){const copy=s.copy;s.copy=null;originalCopy(a,copy,angle);a.cd[q.id]=Math.max(1,skills[copy.id].cd*.5);}else s.eye=4;rwFx(a,4,a.x,a.y,'ninja-eye',.5,{follow:true});}
 if(slot===5){rwDash(a,angle,340,.42,()=>{}, {slot,onStep(from){const d=Reforged.dashes.find(d=>d.owner===a);if(!d||a.rwCast!==q){if(d)d.finished=true;return;}const target=opponents(a).find(t=>t.hp>0&&lineDistance(t.x,t.y,from.x,from.y,a.x+Math.cos(angle)*25,a.y+Math.sin(angle)*25)<a.r+t.r&&rwVisible(a,t));if(target){d.finished=true;const copied=!!s.copy;if(hit(target,230+(copied?70:0),a,22,angle,q.id)){if(copied)s.copy=null;rwFx(a,5,target.x,target.y,'ninja-electric',.55,{size:copied?135:100});}}}});}
};
const ninja22Step=step;step=function(dt){const active=state==='fight';ninja22Step(dt);if(!active||state!=='fight')return;
 for(const o of objects){if(!o.ninja22||o.life<=0)continue;o.age+=dt;
 if(o.v10Clone){if(o.owner.hp<=0){o.life=0;ninja22Smoke(o.owner,o.x,o.y);continue;}const t=opponents(o.owner).filter(t=>t.hp>0).sort((a,b)=>dist(o,a)-dist(o,b))[0];if(!t)continue;o.a=o.dojoFacingAngle=Math.atan2(t.y-o.y,t.x-o.x);o.moving=!o.attacks&&dist(o,t)>65;o.gait=(o.gait||0)+dt*14;if(o.moving)move(o,Math.cos(o.a)*180*dt,Math.sin(o.a)*180*dt);if(!o.attacks&&dist(o,t)<90&&rwVisible(o,t)){o.attacks=1;o.strikeAge=0;hit(t,35,o.owner,3,o.a,o.owner.kit[1]);rwFx(o.owner,0,t.x,t.y,'ninja-cut',.25,{angle:o.a});}if(o.attacks){o.strikeAge+=dt;if(o.strikeAge>.28){o.life=0;ninja22Smoke(o.owner,o.x,o.y);}}else if(o.life<dt*2)ninja22Smoke(o.owner,o.x,o.y);}
 if(o.v10Trap&&o.age>=.45){const t=opponents(o.owner).find(t=>t.hp>0&&dist(t,o)<o.r+t.r&&rwVisible(o,t));if(t){if(hit(t,55,o.owner,0,0,o.owner.kit[2])){t.root=Math.max(t.root,1.2);rwCancelCharge(t);}rwFx(o.owner,2,t.x,t.y,'ninja-electric',.6,{size:95});o.life=0;}}
 }
};
function ninja22Effect(g,key,phase,x,y,size){const im=NINJA22_ART[key];if(!im.naturalWidth)return;g.drawImage(astralSoftCell(im,Math.min(23,Math.floor(clamp(phase,0,.999)*24))),x-size/2,y-size/2,size,size);}
const ninja22FX=rwPaintFX;rwPaintFX=function(e){if(e.skin!==1)return ninja22FX(e);const u=e.age/e.duration,x=e.follow?e.owner.x:e.x,y=e.follow?e.owner.y:e.y;ctx.save();
 if(e.kind==='ninja-afterimage'){ctx.translate(x,y);ctx.globalAlpha=(1-u)*.5;dojoPaintBody(ctx,6,72,e.angle);}
 else if(e.kind==='ninja-cut'){ctx.translate(x,y-24);orientSkillSprite(ctx,e.angle);if(e.reverse)ctx.scale(1,-1);ninja22Effect(ctx,'slash',u,32,0,100);}
 else if(e.kind==='ninja-eye'||e.kind==='copied'){ctx.globalAlpha=1-u;ctx.fillStyle='#ff5477';ctx.beginPath();ctx.arc(x+5,y-48,3+u*2,0,TAU);ctx.fill();}
 else if(e.kind.includes('smoke')||e.kind==='departure'||e.kind==='arrival')ninja22Effect(ctx,'smoke',u,x,y-24,e.size||100);
 else ninja22Effect(ctx,'electric',u,x,y-26,e.size||80);ctx.restore();};
const ninja22Body=rwPaintBody;rwPaintBody=function(g,a,size,t){if(a.skin!==1)return ninja22Body(g,a,size,t);if(a.v10Clone&&a.attacks){g.save();g.translate(0,-3.5*size/72);const ok=dojoPaintStrike(g,Math.min(23,Math.floor(a.strikeAge/.28*24)),size*rwSizeFactors[1],a.a);g.restore();return ok;}if(a.rwCast?.slot===5){g.save();g.translate(0,-3.5*size/72);const q=a.rwCast,pose=q.age<q.release?5:[2,2,0,1,1,0][Math.floor(q.age*24)%6];const ok=dojoPaintBody(g,pose,size*rwSizeFactors[1],q.angle);g.restore();return ok;}return ninja22Body(g,a,size,t);};
const ninja22Depth=integratedDepth;integratedDepth=function(){const list=ninja22Depth().filter(e=>e.kind!=='seal');for(const o of objects)if(o.v10Trap&&o.life>0)list.push({kind:'ninja-seal',y:o.y-1,priority:0,paint(){const progress=clamp(o.age/.45,0,1);ctx.save();ctx.translate(o.x,o.y);ctx.scale(1,.5);ctx.strokeStyle=o.age<.45?'#8b9fa9':'#88dfff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,30,-Math.PI/2,-Math.PI/2+TAU*progress);ctx.stroke();for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.strokeRect(14,-4,8,8);}ctx.restore();}});
 for(const a of actors){if(a.skin!==1||a.hp<=0)continue;const q=a.rwCast,s=reworkState(a);if(q?.slot===5)list.push({y:a.y+.5,priority:4,paint(){const phase=q.age<q.release?clamp(q.age/q.release*.35,0,.35):.25+(vfxTime*2%1)*.2;ninja22Effect(ctx,'electric',phase,a.x+Math.cos(q.angle)*23,a.y-28+Math.sin(q.angle)*10,45);}});if(s.eye>0||s.copy)list.push({y:a.y+.7,priority:4,paint(){ctx.save();ctx.fillStyle=s.copy?'#ffd786':'#ff4669';ctx.fillRect(a.x+4,a.y-48,4,3);ctx.restore();}});}
 return list.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0));};
const ninja22Icon=icon;icon=function(id){const s=skills[id];return s?.champion===1?`<span class="skill-art reforged-icon" aria-hidden="true" style="background-image:url('assets/ninja_v22/icon-${s.slot}.webp')"></span>`:ninja22Icon(id);};
const ninja22UI=updateUI;updateUI=function(){ninja22UI();if(p?.skin!==1)return;const copy=reworkState(p).copy,button=$('#equipped')?.children[4],signature=copy?String(copy.id):'empty';if(button&&button.dataset.copyIcon!==signature){button.dataset.copyIcon=signature;const el=button.querySelector('.skill-art');if(el)el.outerHTML=copy?icon(copy.id):icon(p.kit[4]);}if(button)button.setAttribute('aria-label',copy?'Usar cópia: '+skills[copy.id].name:'Olho Copiador');};
const ninja22Control=skillControlState;skillControlState=function(a,s){const result=ninja22Control(a,s);if(ninja22Follow(a,s.id))Object.assign(result,{ready:true,locked:false,text:'2º CORTE',remaining:0,fraction:0});return result;};
const ninja22Details=openChampionDetails;openChampionDetails=function(id){ninja22Details(id);$('#heroDetail')?.classList.toggle('ninja-detail',Number(id)===1);};
// The normal touch binding blocks cooldowns before rwCast can accept the return cut.
const ninja22Bind=bindSkill;bindSkill=function(btn,index){if(p?.skin!==1||index!==0)return ninja22Bind(btn,index);
 btn.addEventListener('pointerdown',e=>{if(aimGesture||!rwReady(p,p.kit[0]))return;e.preventDefault();btn.setPointerCapture(e.pointerId);aimGesture={index:0,x:e.clientX,y:e.clientY,a:aim(p),pointer:e.pointerId,dragged:false,dx:0,dy:0,stickRadius:80};});
 btn.addEventListener('pointermove',e=>{const q=aimGesture;if(q?.pointer!==e.pointerId)return;e.preventDefault();q.dx=e.clientX-q.x;q.dy=e.clientY-q.y;if(Math.hypot(q.dx,q.dy)>4){q.dragged=true;q.a=Math.atan2(q.dy,q.dx);}});
 btn.addEventListener('pointerup',e=>{const q=aimGesture;if(q?.pointer!==e.pointerId)return;e.preventDefault();aimGesture=null;cast(p,p.kit[0],q.dragged?q.a:undefined);});
 for(const type of ['pointercancel','lostpointercapture'])btn.addEventListener(type,e=>{if(aimGesture?.pointer===e.pointerId)aimGesture=null;});
};
