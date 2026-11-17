'use strict';
/*
 * Herdeiro da Centelha (herói 6) — pacote de jogabilidade v3: até onde aguentar a Sobrecarga.
 *  - ZONA DE POTÊNCIA: a Sobrecarga ganha faixas visíveis (barra sobre o herói). De 60 a 85 ele fica mais forte e
 *    rápido (marca Sobrecarga Viva) sem custo; acima de 85 a energia queima: perde vida aos poucos e a cada ganho.
 *    Passar de 100 continua quebrando o braço por 3 s.
 *  - CHUTE DE ALÍVIO: o Chute Relâmpago usado acima de 85 descarrega 20 de Sobrecarga e causa +40% de dano.
 *  - RICOCHETE: o Salto Ricochete quica nas paredes, colunas e bordas: o salto que bate reflete na direção oposta e
 *    cada quique dá +40% ao impacto final.
 *  - ULTIMATE MENOS PUNITIVA: o Limite Rompido quebra o braço por 6 s, não mais até o fim da luta.
 * ?herdeiro=0 desliga o pacote (para comparar).
 */
(function(){
if(!window.COMBAT_V3||!window.V3API||/[?&]herdeiro=0/.test(location.search))return;
const {isHero}=V3API,H=6,KIT=CHAMPIONS[H].kit;
const ZONE=[60,85],BURN_HP=10,VENT=20,VENT_MUL=1.4,BOUNCE_MUL=.4,ULT_FRACTURE=6;
const on=a=>!!a&&isHero(a)&&a.skin===H&&!a.copySource;
window.HERDEIRO_V3={ULT_FRACTURE};

{const f=(window.V3_DMG_MUL&&V3_DMG_MUL[H])||1,r=n=>String(Math.round(n*f));
 skills[KIT[1]].desc=`Chute rápido de ${r(46)} de dano. CHUTE DE ALÍVIO: acima de 85 de Sobrecarga, descarrega 20 e causa +40% de dano.`;
 skills[KIT[2]].desc=`Dois saltos de até 130; o segundo termina com impacto de ${r(90)} de dano. RICOCHETE: o salto que bate em parede, coluna ou borda quica para o outro lado, e cada quique dá +40% ao impacto.`;
 skills[KIT[5]].desc=`Exige 85 de Sobrecarga. Soco de ${r(371)} de dano; consome a barra e quebra o braço por ${ULT_FRACTURE}s.`;
 for(const k of [1,2,5])skills[KIT[k]].v3scaled=true;
}

/* ---------- zona de potência: só paga vida acima de 85 ---------- */
const prevGain=rwGain;
rwGain=function(a,amount,payHealth=true){
 if(on(a)&&reworkState(a).value<ZONE[1])payHealth=false;
 return prevGain.call(this,a,amount,payHealth);
};

/* ---------- chute de alívio ---------- */
const prevCommit=rwCommit;
rwCommit=function(a,q){
 const vent=on(a)&&q.slot===1&&reworkState(a).value>ZONE[1];
 const r=prevCommit.apply(this,arguments);
 if(vent){const st=reworkState(a);st.value=Math.max(0,st.value-VENT);q.v3vent=true;a.v3ventFx=clock}
 if(on(a)&&q.slot===2)a.v3ric={b:0,angle:null,t:clock};
 return r;
};

/* ---------- ricochete ---------- */
function reflect(a,angle){
 const px=a.x+Math.cos(angle)*(a.r+8),py=a.y+Math.sin(angle)*(a.r+8);
 const bx=rwObstacle(px,a.y,0),by=rwObstacle(a.x,py,0);
 let an=angle;
 if(bx||!by)an=Math.PI-an;
 if(by)an=-an;
 return an;
}
const prevDash=rwDash;
rwDash=function(a,angle,distance,duration,done,extra={}){
 if(!(on(a)&&extra.leap&&extra.slot===2&&a.v3ric))return prevDash.apply(this,arguments);
 const R=a.v3ric;if(R.angle!=null)angle=R.angle;
 const d=prevDash.call(this,a,angle,distance,duration,function(){
  if(d.travel<distance-8&&R.b<2){R.b++;R.angle=reflect(a,angle);a.v3bounceFx={t:clock,x:a.x,y:a.y};try{float(a.x,a.y-80,'RICOCHETE ×'+R.b,'#5dff9a')}catch{}}
  else R.angle=angle;
  return done?.apply(this,arguments);
 },extra);
 return d;
};

/* ---------- dano ---------- */
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 let vent=false,bounce=0;
 if(on(o)&&n>0&&t&&t!==o){
  if(id===KIT[1]&&o.rwCast?.v3vent){n*=VENT_MUL;vent=true}
  if(id===KIT[2]&&o.v3ric&&o.v3ric.b>0&&clock-o.v3ric.t<1.5){bounce=o.v3ric.b;n*=1+BOUNCE_MUL*bounce}
 }
 const r=prevHit.call(this,t,n,o,k,an,id);
 if(r&&vent&&!o.rwCast.v3ventFloat){o.rwCast.v3ventFloat=true;try{float(t.x,t.y-78,'ALÍVIO!','#5dff9a')}catch{}}
 return r;
};

/* ---------- passo: a energia queima acima de 85; fratura da ultimate por 6 s ---------- */
const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(state!=='fight')return;
 for(const a of actors){
  if(!on(a)||a.hp<=0)continue;
  const st=reworkState(a);
  if(st.value>ZONE[1]&&typeof rwSelfDamage==='function')rwSelfDamage(a,Math.min(a.hp-1,BURN_HP*dt));
  if(st.fractured&&st.arm>ULT_FRACTURE){st.arm=ULT_FRACTURE;st.fractured=false}
 }
};

/* ---------- desenho: barra de zonas sobre o herói, quique ---------- */
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(typeof actors==='undefined'||!actors)return list;
 for(const a of actors){
  if(!on(a)||a.hp<=0)continue;
  const st=reworkState(a),bf=a.v3bounceFx&&clock-a.v3bounceFx.t<.35?a.v3bounceFx:null,vf=clock-(a.v3ventFx??-9)<.4;
  list.push({kind:'v3-herdeiro',y:99988+a.y*.001,priority:9,paint(){
   ctx.save();
   const w=40,x0=a.x-w/2,y0=a.y-80,v=Math.max(0,Math.min(100,st.value));
   ctx.globalAlpha=.9;ctx.fillStyle='#0a1a12';ctx.fillRect(x0-1,y0-1,w+2,6);
   ctx.fillStyle='#21452f';ctx.fillRect(x0+w*ZONE[0]/100,y0,w*(ZONE[1]-ZONE[0])/100,4);
   ctx.fillStyle='#4a1818';ctx.fillRect(x0+w*ZONE[1]/100,y0,w*(100-ZONE[1])/100,4);
   const hot=v>ZONE[1],good=v>=ZONE[0]&&!hot;
   ctx.fillStyle=hot?(Math.sin(clock*18)>0?'#ff5a5a':'#ffb0a0'):good?'#5dff9a':'#9fd8b4';ctx.fillRect(x0,y0,w*v/100,4);
   if(st.arm>0){ctx.font='800 8px system-ui';ctx.textAlign='center';ctx.fillStyle='#ff8a7a';ctx.fillText('FRATURA '+Math.ceil(st.arm)+'s',a.x,y0-4)}
   if(vf){const k=(clock-a.v3ventFx)/.4;ctx.globalAlpha=1-k;ctx.strokeStyle='#5dff9a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x,a.y-24,14+k*30,0,Math.PI*2);ctx.stroke()}
   if(bf){const k=(clock-bf.t)/.35;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-k;ctx.strokeStyle='#5dff9a';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(bf.x,bf.y,10+k*36,(10+k*36)*.5,0,0,Math.PI*2);ctx.stroke()}
   ctx.restore();
  }});
 }
 return list;
};
window.HerdeiroV3={ZONE,VENT,BOUNCE_MUL,ULT_FRACTURE,reflect};
})();
