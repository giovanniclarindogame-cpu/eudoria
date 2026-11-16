'use strict';
/*
 * Níveis e atributos dos campeões (v3).
 * - Cada herói tem nível 1–10 (account.heroLv[id] = {lv, xp}). O XP vem da Cruzada e da Caçada.
 * - Cinco atributos: Vida, Ataque, Defesa, Velocidade e Crítico. Cada nível acima do 1º dá um bônus em % em cada um.
 * - Os bônus só valem em modos de campanha (Cruzada/Caçada). Duelos, torneio, KOF, liga e demais modos usam atributos nivelados
 *   (todos como nível 1), para o confronto ser justo. Inimigos e aliados controlados pelo jogo nunca recebem bônus.
 */
(function(){
if(!window.COMBAT_V3||!window.V3API)return;
const {isHero}=V3API;
const MAX_LV=10;
const PER={hp:.05,atk:.04,def:.04,spd:.01,crit:.007};   // por nível acima do 1º
const BASE_CRIT=.05,CRIT_MUL=1.5;
const xpNext=lv=>60+40*lv;                               // 1→2: 100 … 9→10: 420 (total 2.160)

const store=()=>account.heroLv||(account.heroLv={});
function rec(id){const s=store();const r=s[id]||(s[id]={lv:1,xp:0});r.lv=Math.max(1,Math.min(MAX_LV,Math.floor(+r.lv)||1));r.xp=Math.max(0,Math.floor(+r.xp)||0);return r}
function stats(lv){const k=Math.max(0,Math.min(MAX_LV,lv)-1);return{hp:Math.round(1000*(1+PER.hp*k)),atk:1+PER.atk*k,def:1+PER.def*k,spd:1+PER.spd*k,crit:BASE_CRIT+PER.crit*k}}
const pveMode=()=>battleActivity!=='training'&&(arenaModeId==='stage'||arenaModeId==='guardian');

/* ---------- aplica os atributos na luta (só o herói do jogador, só em modos de campanha) ---------- */
const prevStart=start;
start=function(){
 const r=prevStart.apply(this,arguments);
 try{
  if(p)p.v3stats=null;
  if(pveMode()&&p&&isHero(p)){
   const lv=rec(p.skin).lv,s=stats(lv);
   p.v3stats=s;p.v3lv=lv;p.max=s.hp;p.hp=s.hp;
  }
 }catch(e){console.error('[Eldoria] níveis',e)}
 return r;
};
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 try{
  if(o&&o.v3stats&&t&&t!==o&&t.team!==o.team&&n>0){
   n*=o.v3stats.atk;
   if(Math.random()<o.v3stats.crit){n*=CRIT_MUL;try{float(t.x,t.y-64,'CRÍTICO!','#ffd36b')}catch{}}
  }
  if(t&&t.v3stats&&o&&o!==t&&o.team!==t.team&&n>0)n/=t.v3stats.def;
 }catch{}
 return prevHit.call(this,t,n,o,k,an,id);
};
if(typeof identitySpeed==='function'){const prevSpd=identitySpeed;identitySpeed=function(a){return prevSpd.apply(this,arguments)*(a&&a.v3stats?a.v3stats.spd:1)}}

/* ---------- XP no fim da Cruzada / Caçada ---------- */
function gainXp(id,amount){
 const r=rec(id);let ups=0;
 if(r.lv>=MAX_LV){return{ups:0,gain:0,lv:r.lv,maxed:true}}
 r.xp+=amount;
 while(r.lv<MAX_LV&&r.xp>=xpNext(r.lv)){r.xp-=xpNext(r.lv);r.lv++;ups++}
 if(r.lv>=MAX_LV)r.xp=0;
 try{saveAccount()}catch{}
 return{ups,gain:amount,lv:r.lv,maxed:r.lv>=MAX_LV}
}
const prevEnd=endArenaMode;
endArenaMode=function(win,draw){
 const first=modeRun&&!modeRun.v3xp&&pveMode()&&p&&isHero(p);
 const hero=p&&p.skin;
 const r=prevEnd.apply(this,arguments);
 try{
  if(first&&modeRun){
   modeRun.v3xp=true;
   const hunt=arenaModeId==='guardian';
   const base=win?(hunt?160:140):(hunt?40:35);
   const extra=win?0:Math.min(60,Math.round((modeRun.elapsed||0)/3));
   const g=gainXp(hero,base+extra);
   const el=document.getElementById('resultText');
   if(el){
    const txt=g.maxed?`${CHAMPIONS[hero].name} já está no nível máximo.`:`${CHAMPIONS[hero].name}: +${g.gain} XP${g.ups?` · SUBIU para o nível ${g.lv}!`:` · nível ${g.lv}.`}`;
    el.textContent=el.textContent+' '+txt;
   }
   if(g.ups){try{toast(`${CHAMPIONS[hero].name} subiu para o nível ${g.lv}!`)}catch{}}
  }
 }catch(e){console.error('[Eldoria] xp',e)}
 return r;
};

/* ---------- página do campeão: nível, XP e atributos ---------- */
const pct=v=>Math.round(v*100)+'%';
function panelHtml(id){
 const r=rec(id),s=stats(r.lv),need=xpNext(r.lv),maxed=r.lv>=MAX_LV,w=maxed?100:Math.round(100*r.xp/need);
 const row=(k,label,val,gain)=>`<div class="nv-stat" title="${label}: +${gain} por nível"><span>${label}</span><b>${val}</b><i>+${gain}</i></div>`;
 return `<div class="nv-box" title="Bônus de nível valem na Cruzada e na Caçada; duelos, torneio e Trio de Campeões usam atributos nivelados. O XP vem da campanha."><div class="nv-lv"><b>NÍVEL ${r.lv}<small>/${MAX_LV}</small></b><div class="nv-xp"><i style="width:${w}%"></i></div><span>${maxed?'MÁXIMO':`${r.xp}/${need} XP`}</span></div>
 <div class="nv-stats">${row('hp','VIDA',s.hp.toLocaleString('pt-BR'),'5%')}${row('atk','ATAQUE',pct(s.atk),'4%')}${row('def','DEFESA',pct(s.def),'4%')}${row('spd','VELOC.',pct(s.spd),'1%')}${row('crit','CRÍTICO',Math.round(s.crit*1000)/10+'%','0,7')}</div>
 </div>`;
}
const prevDetails=openChampionDetails;
openChampionDetails=function(id){
 const r=prevDetails.apply(this,arguments);
 try{
  const inner=document.querySelector('#heroDetail .hero-detail-inner');
  if(inner){inner.querySelector('.nv-box')?.remove();inner.insertAdjacentHTML('beforeend',panelHtml(Number(id)));inner.classList.add('nv-on')}
 }catch(e){console.error('[Eldoria] painel de nível',e)}
 return r;
};
window.V3Levels={MAX_LV,PER,stats,rec,xpNext,gainXp,pveMode};
})();
