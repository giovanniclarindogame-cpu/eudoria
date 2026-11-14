'use strict';
/*
 * Fim de luta em estilo arcade (duelos 1×1 e 2×2 que terminam por nocaute):
 * câmera lenta no último golpe, "K.O.", o derrotado cai no chão, depois "VOCÊ VENCEU" / "VOCÊ PERDEU"
 * e só então aparece o resumo da partida. Tempo esgotado e empates seguem direto para o resumo.
 */
(function(){
if(!window.COMBAT_V3)return;
const battle=document.getElementById('battle');
const banner=document.createElement('div');banner.id='koBanner';banner.hidden=true;banner.innerHTML='<b class="ko-txt"></b><i class="ko-sub"></i>';
const flash=document.createElement('div');flash.id='koFlash';
battle.append(flash,banner);
const txt=banner.querySelector('.ko-txt'),sub=banner.querySelector('.ko-sub');
let seq=null;
const now=()=>performance.now();

// quadros da queda (reação → queda → caído) usados pelos corpos dos campeões
window.v3KoFrame=function(a){
 const t=a.koAge;
 if(t===undefined)return 33;
 return t<.14?30:t<.4?32:33;
};

function reset(){
 seq=null;dojoSpeed=1;banner.hidden=true;banner.className='';flash.className='';
 for(const a of actors||[])a.koAge=undefined;
}
function show(kind,text,subtext){
 banner.hidden=false;banner.className=kind;txt.textContent=text;sub.textContent=subtext||'';
 void banner.offsetWidth;banner.classList.add('in');
}
const prevFinish=finish;
finish=function(){
 if(modeRun||battleActivity==='training'||state==='end')return;
 if(seq)return;
 const ours=actors.filter(a=>a.team===0&&a.hp>0).length,theirs=actors.filter(a=>a.team===1&&a.hp>0).length;
 const ko=(ours===0)!==(theirs===0);   // só um lado caiu
 if(!ko||time<=0)return prevFinish();
 const win=ours>0;
 seq={t0:now(),phase:0,win};
 clearInputs();
 dojoSpeed=.2;
 combatImpact?.(2);flash.className='go';
 show('ko','K.O.','');
};
const prevStep=step;
step=function(dt){
 if(seq){
  clearInputs();
  const t=(now()-seq.t0)/1000;
  for(const a of actors){if(a.hp<=0){a.koAge=(a.koAge||0)+dt;a.inv=Math.max(a.inv,0)}}
  if(seq.phase===0&&t>1.1){seq.phase=1;dojoSpeed=1}
  if(seq.phase===1&&t>2.3){seq.phase=2;show(seq.win?'win':'lose',seq.win?'VOCÊ VENCEU':'VOCÊ PERDEU',seq.win?'A arena é sua.':'Tente de novo.')}
  if(seq.phase===2&&t>4){const w=seq;seq=null;dojoSpeed=1;banner.hidden=true;prevFinish();return}
 }
 prevStep(dt);
};
// o derrotado continua visível, caindo e ficando no chão (por padrão o jogo some com quem tem 0 de vida)
const prevDrawActor=integratedDrawActor;
integratedDrawActor=function(a){
 if(a.hp<=0&&a.koAge!==undefined&&!a.boss&&!a.trainingDummy){
  ctx.save();ctx.translate(a.x,a.y);ellipse(0,12,20,8,'#06100c99');ctx.globalAlpha=1;
  try{drawAnimatedFighter(ctx,a)}catch(e){}
  ctx.restore();return;
 }
 return prevDrawActor(a);
};
const prevStart=start;
start=function(){reset();return prevStart.apply(this,arguments)};
const prevShow=showScreen;
showScreen=function(){reset();return prevShow.apply(this,arguments)};
window.KoV3={get seq(){return seq},reset};
})();
