'use strict';
/*
 * Combate v3 · melhorias: auxílio de mira, impacto/feedback, aviso dos golpes inimigos,
 * ajuste de equilíbrio por herói, leitura do Goku (anel de ki / Modo Poder) e do Kakashi (clone),
 * dash com identidade para Herdeiro e Alquimista.
 */
(function(){
if(!window.COMBAT_V3||!window.V3API)return;
const {isHero,V2}=V3API;
const TAU=Math.PI*2;
const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- 1. auxílio de mira: arrastar quase na direção de um inimigo encaixa nele ---------- */
const CONE=.30,AIM_RANGE=640;
function assistAngle(a,angle){
 let best=null,bd=1e9;
 for(const t of opponents(a)){
  if(t.hp<=0)continue;const d=dist(a,t);if(d>AIM_RANGE)continue;
  let diff=Math.atan2(t.y-a.y,t.x-a.x)-angle;diff=Math.atan2(Math.sin(diff),Math.cos(diff));
  const cost=Math.abs(diff)+d/4000;
  if(Math.abs(diff)<=CONE&&cost<bd){bd=cost;best=t}
 }
 return best;
}
const prevSel=aimSelectionV4;
aimSelectionV4=function(q){
 const r=prevSel(q);
 if(!p||!isHero(p)||!q.dragged||!r||r.angle===undefined)return r;
 const t=assistAngle(p,r.angle);if(!t)return r;
 const ang=Math.atan2(t.y-p.y,t.x-p.x);
 if(r.pointAim){return resolveAimV4(p,p.kit[q.index],ang,Math.min(r.profile?.max??dist(p,t),dist(p,t)))}
 return {...r,angle:ang};
};

/* ---------- 2. impacto e feedback ---------- */
const prevHit=hit;let lastDodgeFx=-9;
hit=function(t,n,o,k,an,id){
 if(isHero(t)&&t.inv>0&&o&&o.team!==t.team&&n>0&&t===p&&clock-lastDodgeFx>.7){
  lastDodgeFx=clock;float(t.x,t.y-58,'ESQUIVOU!','#8fe8ff');combatImpact?.(.5);
 }
 if(isHero(o)&&DMG[o.skin])n*=DMG[o.skin];
 const before=t&&t.hp,r=prevHit(t,n,o,k,an,id);
 if(r&&t&&before>t.hp){
  const lost=before-t.hp;
  if(o&&(o===p||t===p)&&lost>=120)combatImpact?.(lost>=260?1.7:1.2);
  if(t.hp<=0&&o&&isHero(o))combatImpact?.(1.8);
 }
 return r;
};

/* ---------- 3. aviso dos golpes inimigos ---------- */
const tele=[];
const prevCastB=cast;
cast=function(a,id,manual){
 const r=prevCastB(a,id,manual);
 if(r&&p&&a&&a!==p&&a.team!==p.team&&a.hp>0&&state==='fight'){
  const s=skills[id],dur=clampN(a.cast||.45,.3,1.1);
  if(s&&(s.range||0)>0&&!s.dash){
   const ang=aim(a,typeof manual==='number'?manual:undefined);
   tele.push({o:a,x:a.x,y:a.y,ang,r:clampN(s.range,70,520),t0:clock,t1:clock+dur,ult:!!s.ultimate});
  }
 }
 return r;
};
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 for(let i=tele.length-1;i>=0;i--)if(clock>tele[i].t1||state==='over')tele.splice(i,1);
 for(const T of tele){
  list.push({kind:'v3-tele',y:-5,priority:0,paint(){
   const k=clampN((clock-T.t0)/(T.t1-T.t0),0,1);
   ctx.save();ctx.translate(T.o.hp>0?T.o.x:T.x,T.o.hp>0?T.o.y:T.y);
   ctx.fillStyle=`rgba(255,${T.ult?60:90},60,${.10+.20*k})`;ctx.strokeStyle=`rgba(255,120,80,${.35+.4*k})`;ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,T.r*(.55+.45*k),T.ang-.42,T.ang+.42);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.restore();
  }});
 }
 // Kakashi: marca o clone quando dá para trocar de lugar
 if(p&&p.skin===1&&isHero(p)&&V3API.hasClone(p)){
  const c=originalClone(p);
  if(c)list.push({kind:'v3-swap',y:99985,priority:8,paint(){
   ctx.save();ctx.translate(c.x,c.y-48-Math.sin(clock*6)*3);ctx.fillStyle='#bfe3ff';ctx.strokeStyle='#08141e';ctx.lineWidth=3;ctx.font='bold 13px system-ui';ctx.textAlign='center';
   ctx.strokeText('⇄ 2',0,0);ctx.fillText('⇄ 2',0,0);ctx.restore();
  }});
 }
 return list.sort((u,v)=>u.y-v.y||(u.priority||0)-(v.priority||0));
};

/* ---------- 4. ajuste fino de equilíbrio por herói (multiplicador de dano) ---------- */
// multiplicador de dano por herói (índice do herói → fator), ajustado por simulação de duelos entre todos os heróis
const DMG={0:1,1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1};
try{const q=new URLSearchParams(location.search).get('dmg');if(q)q.split(',').forEach(kv=>{const [k,v]=kv.split(':');if(+v>0)DMG[+k]=+v})}catch{}
window.V3_DMG_MUL=DMG;

/* ---------- 5. Goku: anel de ki / Modo Poder no botão da habilidade 1 ---------- */
function ensureRing(){
 const b=document.querySelector('#equipped .skill[data-arc="0"]');if(!b)return null;
 let r=b.querySelector('.v3-ring');if(!r){r=document.createElement('i');r.className='v3-ring';b.appendChild(r)}
 return r;
}
const prevUIB=updateUI;
updateUI=function(){
 prevUIB();
 if(!p||!isHero(p))return;
 const eq=document.getElementById('equipped');if(!eq)return;
 if(p.skin===0){
  const s=reworkState(p),r=ensureRing();if(!r)return;
  const power=s.powerT>0;
  r.style.setProperty('--pw',String(power?clampN(s.powerT/V3API.POWER_TIME,0,1):clampN(s.value/100,0,1)));
  eq.classList.toggle('v3-power',power);r.classList.toggle('power',power);r.hidden=false;
 }else{
  const r=document.querySelector('#equipped .v3-ring');if(r)r.hidden=true;eq.classList.remove('v3-power');
 }
};
// avisa uma vez como funciona a troca do Kakashi
let swapTipShown=false;
const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(!swapTipShown&&p&&p.skin===1&&isHero(p)&&state==='fight'&&V3API.hasClone(p)){swapTipShown=true;toast('Toque na habilidade 2 de novo para trocar de lugar com o clone')}
};

window.V3B={tele,assistAngle,DMG};
})();
