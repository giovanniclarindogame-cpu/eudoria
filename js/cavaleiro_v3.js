'use strict';
/*
 * Cavaleiro do Firmamento (herói 8) — pacote de jogabilidade v3: cavaleiro de COMBO.
 *  - O Cosmo tem 3 ESTÁGIOS (0–39 · 40–79 · 80–100): cada estágio dá +15% de dano. Gastar pouco não derruba o estágio,
 *    porque acertar devolve Cosmo; a ultimate gasta tudo e fica mais forte no estágio alto.
 *  - Rajada Estelar: enche mais Cosmo e mostra o contador de combo.
 *  - Cometa Veloz: 10 de Cosmo, recarga de 2 s, +25% de dano, preparo um pouco mais longo (legível).
 *  - Chute Crescente: 8 de Cosmo, recarga de 3 s (acaba a trava infinita); golpes no rival no ar causam +30%.
 *  - Investida Galopante (dash): grátis; deixa o rival EXPOSTO (símbolo visível). Cometa, Chute ou a ultimate consomem a marca (+20%).
 *  - Constelação Radiante: 5/7/9 meteoros que perseguem o alvo + um meteoro final grande, com a constelação desenhada no chão.
 * O multiplicador de dano do herói subiu de 0,65 para o valor em V3_DMG_MUL[8] (js/combate_v3b.js).
 */
(function(){
if(!window.COMBAT_V3||!window.V3API)return;
const {isHero}=V3API,H=8,KIT=CHAMPIONS[H].kit;
const STAGE_AT=[40,80],STAGE_MUL=[1,1.15,1.3],COST={1:10,2:8};
const on=a=>!!a&&isHero(a)&&a.skin===H;
const stageOf=v=>v>=STAGE_AT[1]?2:v>=STAGE_AT[0]?1:0;
const fmt=n=>String(Math.round(n));

/* ---------- recargas, tempos e textos ---------- */
skills[KIT[1]].cd=2;skills[KIT[1]].release=.3;skills[KIT[1]].duration=.62;
skills[KIT[2]].cd=3;
{
 const f=(window.V3_DMG_MUL&&V3_DMG_MUL[H])||1;
 skills[KIT[0]].desc=`Três socos de ${fmt(20*f)} de dano. Cada acerto sobe o combo (a sequência seguinte sai mais rápida) e enche o Cosmo. Rival no ar leva +30%.`;
 skills[KIT[1]].desc=`Gasta 10 de Cosmo. Cometa de ${fmt(125*f)} de dano, alcance 390, recarga de 2s. Rival no ar leva +30%; consome a marca Exposto (+20%).`;
 skills[KIT[2]].desc=`Gasta 8 de Cosmo. Chute de ${fmt(65*f)} de dano que lança o rival ao ar por 0,7s. Recarga de 3s. Consome a marca Exposto (+20%).`;
 skills[KIT[3]].desc=`Sem custo. Atravessa o rival por até 230, causa ${fmt(55*f)} de dano e o deixa Exposto por 2s (+25% de dano recebido).`;
 skills[KIT[5]].desc=`Consome todo o Cosmo (mínimo 35). 5, 7 ou 9 meteoros de ${fmt(22*f)} perseguem o alvo e um meteoro final de ${fmt(90*f)} fecha a constelação. Mais forte a cada estágio do Cosmo.`;
 for(const k of [0,1,2,3,5])skills[KIT[k]].v3scaled=true;
}

/* ---------- custo de Cosmo ---------- */
const prevReason=rwResourceReason;
rwResourceReason=function(a,slot){
 if(on(a)&&COST[slot]!==undefined)return reworkState(a).value<COST[slot]?COST[slot]+' COS':'';
 return prevReason.apply(this,arguments);
};
const prevCommit=rwCommit;
rwCommit=function(a,q){
 if(!on(a))return prevCommit.apply(this,arguments);
 const st=reworkState(a),v0=st.value;
 const r=prevCommit.apply(this,arguments);
 if(COST[q.slot]!==undefined)st.value=Math.max(0,v0-COST[q.slot]);
 if(q.slot===5)a.v3cavUlt={stage:stageOf(v0),until:clock+3.2};
 return r;
};

/* ---------- dano: estágios, golpe no ar, marca Exposto ---------- */
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 let air=false,expo=false;
 if(on(o)&&t&&t!==o&&o.team!==t.team&&n>0){
  const s=reworkState(o),ts=reworkState(t);
  const ult=id===KIT[5]&&o.v3cavUlt&&clock<=o.v3cavUlt.until;
  let f=STAGE_MUL[ult?o.v3cavUlt.stage:stageOf(s.value)];
  if(s.value>=100)f/=1.2;                                  // o motor antigo já dá +20% com Cosmo cheio
  if(id===KIT[1])f*=1.25;
  if((id===KIT[0]||id===KIT[1])&&ts.air>0){f*=1.3;air=true}
  if(ts.exposed>0&&(id===KIT[1]||id===KIT[2]||id===KIT[5])){f*=1.2;expo=true}
  n*=f;
 }
 const cav=on(o),v0=cav?reworkState(o).value:0;
 const before=t&&t.hp,r=prevHit.call(this,t,n,o,k,an,id);
 if(cav&&id===KIT[5]){const st=reworkState(o);if(st.value>v0)st.value=v0}      // a ultimate gasta o Cosmo de verdade: os meteoros não devolvem
 if(r&&t&&before>t.hp&&on(o)){
  if(id===KIT[0])try{rwGain(o,3.5)}catch{}
  if(air&&clock-(o.v3cavAirFx||-9)>.5){o.v3cavAirFx=clock;try{float(t.x,t.y-74,'NO AR!','#a8dcff')}catch{}}
  if(expo){reworkState(t).exposed=0;try{float(t.x,t.y-74,'EXPOSTO!','#ffe27a');combatImpact?.(1.2)}catch{}}
 }
 return r;
};

/* ---------- ultimate: meteoros que perseguem o alvo + meteoro final ---------- */
const ULTS=[];
const prevRelease=rwRelease;
rwRelease=function(a,q){
 if(!(on(a)&&q.slot===5))return prevRelease.apply(this,arguments);
 const stage=stageOf(q.snapshot||0),n=[5,7,9][stage],tgt=enemy(a),fix=q.target||{x:a.x+Math.cos(q.angle)*200,y:a.y+Math.sin(q.angle)*200};
 const where=()=>(tgt&&tgt!==a&&tgt.hp>0)?tgt:fix;
 try{rwFx(a,5,a.x,a.y,'cast',q.duration-q.release,{follow:true,angle:q.angle})}catch{}
 const U={a,pts:[],t0:clock,final:null,boom:0,end:clock+.2+n*.1+1.4};ULTS.push(U);
 for(let i=0;i<n;i++)rwLater(a,.2+i*.1,()=>{
  const c=where(),ang=i*2.399963,r=14+(i%3)*15,x=c.x+Math.cos(ang)*r,y=c.y+Math.sin(ang)*r*.7;
  U.pts.push({x,y,t:clock});rwArea(a,x,y,50,22,5,3);
 });
 rwLater(a,.2+n*.1+.05,()=>{const c=where();U.final={x:c.x,y:c.y,t:clock};try{rwFx(a,5,c.x,c.y,'warning',.5,{radius:95})}catch{}});
 rwLater(a,.2+n*.1+.55,()=>{if(!U.final)return;rwArea(a,U.final.x,U.final.y,95,90,5,30);U.boom=clock;try{combatImpact?.(1.7)}catch{}});
};

/* ---------- desenho: estágios, combo, preparo do cometa, marca Exposto, constelação ---------- */
const STAR='#a8dcff',GOLD='#ffe27a';
function star(x,y,r,col,a=1){ctx.save();ctx.globalAlpha*=a;ctx.fillStyle=col;ctx.beginPath();for(let k=0;k<8;k++){const ang=k*Math.PI/4-Math.PI/2,rr=k%2?r*.42:r;ctx.lineTo(x+Math.cos(ang)*rr,y+Math.sin(ang)*rr)}ctx.closePath();ctx.fill();ctx.restore()}
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(typeof actors==='undefined'||!actors)return list;
 // constelação no chão (por baixo dos lutadores)
 for(let i=ULTS.length-1;i>=0;i--)if(clock>ULTS[i].end||clock<ULTS[i].t0)ULTS.splice(i,1);
 for(const U of ULTS)list.unshift({kind:'v3-cav-const',y:-1e8,priority:-8,paint(){
  ctx.save();ctx.globalCompositeOperation='lighter';
  const P=U.pts;
  ctx.strokeStyle=STAR;ctx.lineWidth=1.5;
  for(let k=1;k<P.length;k++){const al=Math.max(0,1-(clock-P[k].t)/1.2);ctx.globalAlpha=.55*al;ctx.beginPath();ctx.moveTo(P[k-1].x,P[k-1].y);ctx.lineTo(P[k].x,P[k].y);ctx.stroke()}
  for(const pnt of P){const al=Math.max(0,1-(clock-pnt.t)/1.2);star(pnt.x,pnt.y,6,'#eaf6ff',.9*al)}
  if(U.final){const k=Math.min(1,(clock-U.final.t)/.5),al=U.boom?Math.max(0,1-(clock-U.boom)/.5):1;
   ctx.globalAlpha=.5*al;ctx.strokeStyle=GOLD;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(U.final.x,U.final.y,95*(1.25-.25*k),95*(1.25-.25*k)*.42,0,0,Math.PI*2);ctx.stroke();
   for(const pnt of P){ctx.globalAlpha=.35*al*k;ctx.beginPath();ctx.moveTo(pnt.x,pnt.y);ctx.lineTo(U.final.x,U.final.y);ctx.stroke()}
   star(U.final.x,U.final.y,8+k*8,GOLD,.9*al)}
  ctx.restore();
 }});
 for(const a of actors){
  if(a.hp<=0)continue;
  // marca EXPOSTO em qualquer lutador
  let ex=0;try{ex=a.identity?.exposed||0}catch{}
  if(ex>0)list.push({kind:'v3-exposed',y:99995+a.y*.001,priority:9,paint(){
   const pul=.6+.4*Math.sin(clock*12);
   ctx.save();ctx.translate(a.x,a.y-86);ctx.globalAlpha=.55+.45*pul;
   ctx.strokeStyle=GOLD;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,-6);ctx.lineTo(7,-6);ctx.lineTo(7,1);ctx.lineTo(0,8);ctx.lineTo(-7,1);ctx.closePath();ctx.stroke();
   ctx.beginPath();ctx.moveTo(-2,-6);ctx.lineTo(2,-1);ctx.lineTo(-2,2);ctx.lineTo(1,8);ctx.stroke();      // rachadura no escudo
   ctx.font='700 8px system-ui';ctx.textAlign='center';ctx.fillStyle=GOLD;ctx.fillText('EXPOSTO',0,-10);
   ctx.restore();
  }});
  if(!on(a))continue;
  list.push({kind:'v3-cav-hud',y:99996+a.y*.001,priority:9,paint(){
   const s=reworkState(a),stg=stageOf(s.value);
   ctx.save();
   // estágios do Cosmo: 3 estrelas acima da barra
   for(let k=0;k<3;k++)star(a.x-9+k*9,a.y-69,k<=stg?4.2:3,k<=stg?(stg===2?GOLD:STAR):'#2a3a4a',k<=stg?1:.8);
   // contador de combo da Rajada
   if(s.combo>=2&&s.comboTime>0){const k=Math.min(1,s.comboTime/1.4);ctx.globalAlpha=.4+.6*k;ctx.font='800 13px system-ui';ctx.textAlign='left';ctx.lineWidth=3;ctx.strokeStyle='#06101ccc';ctx.strokeText('×'+s.combo,a.x+27,a.y-58);ctx.fillStyle=s.combo>=6?GOLD:STAR;ctx.fillText('×'+s.combo,a.x+27,a.y-58)}
   // preparo do Cometa: estrela se formando no punho
   const q=a.rwCast;
   if(q&&q.slot===1&&q.age<q.release){const k=q.age/q.release;ctx.globalCompositeOperation='lighter';star(a.x+Math.cos(q.angle)*20,a.y-24+Math.sin(q.angle)*14,3+k*8,'#eaf6ff',.5+.5*k)}
   ctx.restore();
  }});
 }
 return list;
};
window.CavaleiroV3={stageOf,STAGE_MUL,COST,ULTS};
})();
