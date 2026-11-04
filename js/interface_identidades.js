'use strict';
const rwUltText=['100 Sobrecarga','40+ Elasticidade','35+ Cosmo','Material no campo'];
const rwPriorControl=skillControlState;
skillControlState=function(a,s){
 if(!s?.reworked)return rwPriorControl(a,s);
 const cooldown=Math.max(0,a.cd[s.id]||0),reason=rwResourceReason(a,s.slot),recovery=Math.max(a.cast||0,a.skillLock||0,a.actionRecovery||0,a.punchTime||0),ready=rwReady(a,s.id),holding=a.rwCast?.holding&&s.slot===0;
 const text=holding?'SOLTE':a.skin===6&&s.slot===4&&reworkState(a).empowered?'DESLIGAR':reason|| (cooldown>0?Math.ceil(cooldown)+'':recovery>0?'·':'');
 return {ready:ready||holding,noMana:false,locked:!ready,remaining:holding?0:Math.max(cooldown,recovery),text,cooldown,fraction:holding?a.rwCast.charge:s.cd?clamp(cooldown/s.cd,0,1):0};
};
const rwPriorProfile=aimProfileV4;
aimProfileV4=function(a,id){const s=skills[id];if(!s?.reworked)return rwPriorProfile(a,id);if(s.slot===4||a.skin===9&&s.slot===5)return{kind:'self'};if(a.skin===8&&s.slot===5)return{kind:'circle',max:350,radius:140};return{kind:'arrow'};};
const rwPriorBind=bindSkill;
bindSkill=function(btn,index){
 if(index!==0||p?.skin!==6)return rwPriorBind(btn,index);
 let pointer=null;
 btn.addEventListener('pointerdown',e=>{if(state!=='fight'||pointer!==null)return;e.preventDefault();if(!rwBeginCharge(p))return;pointer=e.pointerId;btn.setPointerCapture(pointer);aimGesture={index:0,x:e.clientX,y:e.clientY,a:aim(p),pointer,dragged:false,dx:0,dy:0,stickRadius:80};});
 btn.addEventListener('pointermove',e=>{if(e.pointerId!==pointer||!aimGesture)return;const dx=e.clientX-aimGesture.x,dy=e.clientY-aimGesture.y;if(Math.hypot(dx,dy)>6){aimGesture.dragged=true;aimGesture.dx=dx;aimGesture.dy=dy;aimGesture.a=Math.atan2(dy,dx);if(p.rwCast?.holding)p.rwCast.angle=aimGesture.a;}});
 btn.addEventListener('pointerup',e=>{if(e.pointerId!==pointer)return;e.preventDefault();const angle=aimGesture?.dragged?aimGesture.a:aim(p);pointer=null;aimGesture=null;rwReleaseCharge(p,angle);});
 for(const type of ['pointercancel','lostpointercapture'])btn.addEventListener(type,e=>{if(pointer!==e.pointerId)return;pointer=null;aimGesture=null;rwCancelCharge(p);});
};
let rwKeyHeld=false;
addEventListener('keydown',e=>{if(e.code!=='Digit1'||p?.skin!==6||state!=='fight'||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;e.preventDefault();e.stopImmediatePropagation();if(!rwKeyHeld&&!e.repeat){rwKeyHeld=true;rwBeginCharge(p);}},true);
addEventListener('keyup',e=>{if(e.code!=='Digit1'||!rwKeyHeld)return;e.preventDefault();e.stopImmediatePropagation();rwKeyHeld=false;if(state==='fight')rwReleaseCharge(p);else rwCancelCharge(p);},true);
const rwPriorInputs=clearInputs;clearInputs=function(){rwKeyHeld=false;if(p)rwCancelCharge(p);rwPriorInputs();};
addEventListener('blur',()=>{rwKeyHeld=false;if(p)rwCancelCharge(p);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){rwKeyHeld=false;if(p)rwCancelCharge(p);}});
const rwPriorDetail=detailSkillText;
detailSkillText=function(c,i){const s=skills[c.kit[i]],k=REWORK_KITS[c.id-6];if(!k)return rwPriorDetail(c,i);return `<b>${i===5?'ULT · ':''}${escapeHTML(s.name)}</b><p>${escapeHTML(s.desc)}</p><span>${i===5?rwUltText[c.id-6]:k.resource}${s.cd?' · '+s.cd+'s de recarga':' · sem recarga'}</span>`;};
const rwPriorDetails=openChampionDetails;
openChampionDetails=function(id){rwPriorDetails(id);const k=REWORK_KITS[id-6];if(!k)return;const heading=$('#heroDetail .simple-kit-heading');if(heading)heading.textContent=k.resource+' · '+k.style;};
const rwPriorBuild=renderLobbyBuild;
renderLobbyBuild=function(){rwPriorBuild();const c=currentChampion();if(c?.id<6)return;const foot=$('#lobbyBuild .lobby-build-foot>span');if(foot)foot.textContent=REWORK_KITS[c.id-6].resource+' · ULT: '+rwUltText[c.id-6];};
const rwPriorUI=updateUI;
updateUI=function(){rwPriorUI();if(!p)return;
 for(const [prefix,a]of [['p',p],['b',b]]){const r=a&&reworkResource(a),bar=$('#'+prefix+'mbar');if(!bar)continue;bar.style.background=r?r.color:'';bar.parentElement.setAttribute('aria-label',r?`${r.label}: ${Math.floor(r.value)} de ${r.max}`:'Mana');if(r){bar.style.width=100*r.value/r.max+'%';bar.parentElement.title=r.label;}}
 const r=reworkResource(p);if(r){const s=reworkState(p),status=s.arm>0?' · BRAÇO '+Math.ceil(s.arm)+'s':s.finger>0?' · DEDO '+Math.ceil(s.finger)+'s':s.tired>0?' · CANSADO':s.turbo>0?' · TURBO':s.empowered?' · ENERGIZADO':s.cosmic>0?' · COSMO DESPERTO':'';$('#resText').textContent=`${r.label.toUpperCase()} ${Math.floor(r.value)}/${r.max}${status}`;}
 const enemyLabel=$('#enemyResource');if(enemyLabel){const er=b&&reworkResource(b);enemyLabel.textContent=er?er.label+' '+Math.floor(er.value)+'/'+er.max:'';}
};
const rwPriorPracticeSettings=practiceSettingsMarkup;
practiceSettingsMarkup=function(prefix){const html=rwPriorPracticeSettings(prefix);return currentChampion()?.id>=6?html.replace('Energia infinita e habilidades sem recarga','Sem recarga (mantém o recurso do campeão)'):html;};
const rwPriorPrepare=prepareProgressionMatch;
prepareProgressionMatch=function(){rwPriorPrepare();if(battleActivity!=='training'||!reworkKit(p))return;$('#trainingPause .setting-hint')?.remove();$('#trainingPause').insertAdjacentHTML('beforeend','<button class="gold" data-fill-resource>Encher recurso do campeão</button>');};
document.addEventListener('click',e=>{if(!e.target.closest('[data-fill-resource]')||battleActivity!=='training'||!reworkKit(p))return;
 if(p.skin===9){let made=0;for(let d=80;d<=240&&made<3;d+=60)for(let angle=0;angle<TAU&&made<3;angle+=Math.PI/3)if(rwCreateBlock(p,p.x+Math.cos(angle)*d,p.y+Math.sin(angle)*d))made++;}
 else reworkState(p).value=100;
 reworkState(p).arm=0;reworkState(p).finger=0;p.cd=p.cd.map(()=>0);toast('Recurso preparado para testar');updateUI();
});
const enemyResource=document.createElement('div');enemyResource.id='enemyResource';$('.fighterhud.enemy').append(enemyResource);
const style=document.createElement('style');style.textContent=`.reforged-icon{display:block!important;width:100%;height:100%;background-size:cover;background-position:center;border-radius:inherit;image-rendering:pixelated}.skill .cool{font-size:clamp(9px,1.35vw,17px)}#resText,#enemyResource{font-size:9px;line-height:1.2;color:#e1e3cb;white-space:nowrap}#enemyResource{text-align:right;margin-top:3px}.simple-kit-heading{font-size:clamp(11px,1.4vw,17px)!important}`;document.head.append(style);
