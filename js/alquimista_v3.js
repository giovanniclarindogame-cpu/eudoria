'use strict';
/*
 * Alquimista de Aço (herói 9) — pacote de jogabilidade v3: o construtor que ataca com o que constrói.
 *  - TRANSMUTAÇÃO: bloco dele que fica 3 s perto dele (até 150) vira AÇO: mais vida e, arremessado, +50% de dano
 *    e atravessa o rival. Decisão: arremessar a pedra agora ou esperar o aço.
 *  - PALMA COM MIRA: o bloco que vai ser arremessado ganha runas de mira; sem runas, a Palma cria um bloco novo.
 *    Bloco arremessado que bate em parede, coluna ou construção se estilhaça e fere em volta.
 *  - MURALHA REATIVA: erguida em cima do rival, a muralha o lança e prende por 0,5 s; quem encosta nela leva
 *    espinhos (dano e lentidão).
 *  - LANÇA DOS BLOCOS: a Lâmina de Pedra puxa uma lança de cada bloco dele perto do alvo (até 4).
 *  - MENOS ACAMPAMENTO: no máximo 6 blocos/muralhas, que duram 12 s. A marca agora é a ESSÊNCIA DA FORJA: blocos
 *    arremessados, quebrados ou desfeitos carregam a ultimate; o Colosso exige Essência cheia e usa só os blocos dele.
 * ?alquimista=0 desliga o pacote (para comparar).
 */
(function(){
if(!window.COMBAT_V3||!window.V3API||/[?&]alquimista=0/.test(location.search))return;
const {isHero}=V3API,H=9,KIT=CHAMPIONS[H].kit;
const MAX_BLOCKS=6,LIFE=12,STEEL_T=3,STEEL_R=150,STEEL_HP=260,STEEL_MUL=1.5,SHATTER_R=70,SHATTER_DMG=40,
 LAUNCH_R=70,LAUNCH_DMG=40,SPIKE_DMG=22,SPIKE_CD=1,LANCE_R=160,LANCE_MAX=4,LANCE_DMG=22,LANCE_STEEL=33,
 ESS={thrown:15,broken:10,expired:5},ESS_FULL=100;
const on=a=>!!a&&isHero(a)&&a.skin===H&&!a.copySource;
const isDot=()=>typeof originalDot!=='undefined'&&originalDot;
window.ALQUIMISTA_V3={MAX_BLOCKS,LIFE};
const ROOT='assets/alquimista_v38/';
const IMG=Object.fromEntries(['steel','shatter','spikes','lance','aim','charge'].map(k=>[k,rwImage(ROOT+k+'.webp?v=38')]));

{const f=(window.V3_DMG_MUL&&V3_DMG_MUL[H])||1,r=n=>String(Math.round(n*f));
 skills[KIT[0]].desc=`Cria um bloco de pedra à frente (até ${MAX_BLOCKS} construções, duram ${LIFE}s). Com um bloco seu na mira (runas acesas), arremessa o bloco: ${r(95)} de dano; bloco de AÇO causa +50% e atravessa. O bloco que bate em parede ou construção se estilhaça (${r(SHATTER_DMG)} em volta).`;
 skills[KIT[1]].desc=`Corte em arco de ${r(75)} de dano. LANÇA DOS BLOCOS: cada bloco seu a até 160 do alvo dispara uma lança contra ele (${r(LANCE_DMG)}, ou ${r(LANCE_STEEL)} se for aço; até 4).`;
 skills[KIT[3]].desc=`Ergue uma muralha de 320 HP por ${LIFE}s. Erguida em cima do rival, lança e prende por 0,5s (${r(LAUNCH_DMG)} de dano). Quem encosta leva espinhos (${r(SPIKE_DMG)} e lentidão).`;
 skills[KIT[5]].desc=`Exige a Essência da Forja cheia e ao menos 1 bloco seu. Junta os seus blocos num gigante por 8s; cada material aumenta tamanho, vida e força.`;
 for(const k of [0,1,3,5])skills[KIT[k]].v3scaled=true;
}

/* ---------- limite de construções e duração ---------- */
const own=a=>objects.filter(o=>o.material&&o.owner===a&&o.life>0&&o.hp>0);
const prevCreate=rwCreateBlock;
rwCreateBlock=function(a,x,y,wall=false,angle=a?.a){
 if(on(a)){const list=own(a).sort((u,v)=>(u.created||0)-(v.created||0));while(list.length>=MAX_BLOCKS){const o=list.shift();o.v3expired=true;rwDestroy(o)}}
 const o=prevCreate.apply(this,arguments);
 if(o&&on(a)){o.life=LIFE;o.v3near=0}
 return o;
};

/* ---------- essência (recurso da ultimate) ---------- */
const ess=a=>reworkState(a);
function gainEss(a,n){const s=ess(a);const was=s.value<ESS_FULL;s.value=Math.min(ESS_FULL,(s.value||0)+n);if(was&&s.value>=ESS_FULL&&a===p)try{toast('Essência cheia: o Colosso está pronto')}catch{}}
const prevResource=reworkResource;
reworkResource=function(a){if(on(a))return{label:'Essência · '+own(a).length+'/'+MAX_BLOCKS+' blocos',value:ess(a).value||0,max:ESS_FULL,color:'#e0a64a'};return prevResource.apply(this,arguments)};
const prevReason=rwResourceReason;
rwResourceReason=function(a,slot){
 if(on(a)&&slot===5){if((ess(a).value||0)<ESS_FULL)return ESS_FULL+' ESS';if(!own(a).length)return 'Material'}
 return prevReason.apply(this,arguments);
};
let ULT_OWNER=null;
const prevMaterials=reworkMaterials;
reworkMaterials=function(x=null){return prevMaterials.call(this,x??ULT_OWNER)};

/* ---------- conjurações ---------- */
const THROWN=[];
const prevRelease=rwRelease;
rwRelease=function(a,q){
 if(!on(a))return prevRelease.apply(this,arguments);
 // Palma: arremesso de bloco (aço = mais forte e atravessa)
 if(q.slot===0){
  const block=rwBlockInAim(a,q.angle),steel=!!block?.v3steel;
  if(block)block.v3thrown=true;
  const n0=Reforged.projectiles.length,r=prevRelease.apply(this,arguments);
  if(block){const e=Reforged.projectiles.slice(n0).find(e=>e.owner===a&&e.slot===0);if(e){if(steel){e.damage*=STEEL_MUL;e.piercing=true;e.v3steel=true}THROWN.push({e,a,last:{x:e.x,y:e.y}});gainEss(a,ESS.thrown)}}
  return r;
 }
 // Muralha: erguida em cima do rival, lança e prende
 if(q.slot===3){
  const pt={x:a.x+Math.cos(q.angle)*110,y:a.y+Math.sin(q.angle)*110},horiz=Math.abs(Math.cos(q.angle))<=.7;
  for(const t of opponents(a)){
   if(t.hp<=0||t.v10Clone)continue;
   const dx=Math.abs(t.x-pt.x),dy=Math.abs(t.y-pt.y),hw=(horiz?63:13)+t.r,hh=(horiz?13:63)+t.r;
   if(dx<hw&&dy<hh){
    const away=horiz?(t.y>=pt.y?Math.PI/2:-Math.PI/2):(t.x>=pt.x?0:Math.PI);
    if(hit(t,LAUNCH_DMG,a,0,away,KIT[3])){
     move(t,Math.cos(away)*(horiz?hh-dy+6:hw-dx+6),Math.sin(away)*(horiz?hh-dy+6:hw-dx+6));
     t.root=Math.max(t.root||0,.5);const ts=reworkState(t);ts.air=Math.max(ts.air||0,.5);ts.airTotal=ts.air;try{rwCancelCharge(t)}catch{}
     a.v3launchFx={t:clock,x:t.x,y:t.y};try{float(t.x,t.y-80,'LANÇADO!','#e0a64a')}catch{}
    }
   }
  }
  return prevRelease.apply(this,arguments);
 }
 // Lâmina de Pedra: lanças dos blocos
 if(q.slot===1){
  const r=prevRelease.apply(this,arguments),t=enemy(a);
  if(t&&t.hp>0&&dist(a,t)<=260){
   const src=own(a).filter(o=>!o.wall&&dist(o,t)<=LANCE_R).sort((u,v)=>dist(u,t)-dist(v,t)).slice(0,LANCE_MAX);
   src.forEach((o,i)=>{const L={a,t,from:{x:o.x,y:o.y-14},t0:clock+i*.08,dur:.2,steel:!!o.v3steel,done:false};LANCES.push(L);o.hp=Math.max(1,o.hp-o.max*.25);o.flash=.15});
  }
  return r;
 }
 if(q.slot===5){for(const o of own(a))o.v3thrown=true;ULT_OWNER=a;try{const r=prevRelease.apply(this,arguments);ess(a).value=0;return r}finally{ULT_OWNER=null}}
 return prevRelease.apply(this,arguments);
};
const LANCES=[];

/* ---------- passo: transmutação, espinhos, estilhaços, lanças, essência ---------- */
const TRACK=new Map(),spikeCD=new WeakMap();
const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(state!=='fight'){THROWN.length=0;LANCES.length=0;TRACK.clear();return}
 for(const o of objects){
  if(!o.material||!on(o.owner))continue;
  const alive=o.life>0&&o.hp>0;
  if(alive){
   TRACK.set(o,o.owner);
   // transmutação em aço
   if(!o.wall&&!o.v3steel){if(dist(o,o.owner)<=STEEL_R&&o.owner.hp>0){o.v3near=(o.v3near||0)+dt;if(o.v3near>=STEEL_T){o.v3steel=true;o.v3steelAt=clock;o.max=STEEL_HP;o.hp=STEEL_HP}}}
   // espinhos da muralha
   if(o.wall)for(const t of opponents(o.owner)){
    if(t.hp<=0||t.v10Clone)continue;
    if(Math.abs(t.x-o.x)<o.w/2+t.r+5&&Math.abs(t.y-o.y)<o.h/2+t.r+5){
     let m=spikeCD.get(t);if(!m){m=new Map();spikeCD.set(t,m)}
     if(clock-(m.get(o)??-9)<SPIKE_CD)continue;m.set(o,clock);
     if(hit(t,SPIKE_DMG,o.owner,10,Math.atan2(t.y-o.y,t.x-o.x),KIT[3])){t.slow=Math.max(t.slow||0,.8);o.v3spikeFx={t:clock,x:t.x,y:t.y}}
    }
   }
  }
 }
 // essência: construções que somem
 for(const [o,a] of TRACK){
  if(o.life>0&&o.hp>0&&objects.includes(o))continue;
  TRACK.delete(o);
  if(o.v3thrown)continue;                                   // já contou no arremesso
  gainEss(a,o.v3expired||o.hp>0?ESS.expired:ESS.broken);
 }
 // estilhaço: bloco arremessado que parou antes do fim sem acertar ninguém
 for(let i=THROWN.length-1;i>=0;i--){
  const T=THROWN[i],e=T.e;
  if(e.life>0&&Reforged.projectiles.includes(e)){T.last={x:e.x,y:e.y};continue}
  THROWN.splice(i,1);
  if(!e.hit?.size&&e.travel<e.range-12){
   rwArea(T.a,T.last.x,T.last.y,SHATTER_R,SHATTER_DMG,0,14);
   SHATTERS.push({x:T.last.x,y:T.last.y,t:clock,steel:!!e.v3steel});
  }
 }
 // lanças
 for(let i=LANCES.length-1;i>=0;i--){
  const L=LANCES[i];
  if(L.a.hp<=0){LANCES.splice(i,1);continue}
  if(!L.done&&clock>=L.t0+L.dur){
   L.done=true;L.end={x:L.t.x,y:L.t.y-20};
   if(L.t.hp>0&&rwVisible(L.from,L.t))hit(L.t,L.steel?LANCE_STEEL:LANCE_DMG,L.a,4,Math.atan2(L.t.y-L.from.y,L.t.x-L.from.x),KIT[1]);
  }
  if(clock>L.t0+L.dur+.25)LANCES.splice(i,1);
 }
 for(let i=SHATTERS.length-1;i>=0;i--)if(clock-SHATTERS[i].t>.5)SHATTERS.splice(i,1);
};
const SHATTERS=[];

/* ---------- desenho: aço, runas de mira, lanças, estilhaços, espinhos, essência ---------- */
function frameOf(im,f,x,y,size,rot=0,alpha=1){
 if(!im?.complete||!im.naturalWidth)return false;f=Math.max(0,Math.min(23,Math.floor(f)));
 ctx.save();ctx.translate(x,y);if(rot)ctx.rotate(rot);ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
 ctx.drawImage(im,f%6*256,Math.floor(f/6)*256,256,256,-size/2,-size/2,size,size);ctx.restore();return true;
}
function steelConstruct(o){
 const im=IMG.steel,reg=typeof alc38Registration==='function'?alc38Registration(im):null;if(!reg)return false;
 const age=clock-(o.v3steelAt??clock),f=age<.6?Math.min(7,Math.floor(age/.6*8)):8+Math.floor(vfxTime*4)%8,box=reg.frames[f],k=o.w/reg.width;
 ctx.save();ctx.translate(o.x,o.y);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(im,f%6*256,Math.floor(f/6)*256,256,256,-(box.left+box.right)/2*k,o.h/2-box.bottom*k,256*k,256*k);ctx.restore();
 return true;
}
const prevConstruct=rwPaintConstruct;
rwPaintConstruct=function(o){
 if(o?.material&&o.v3steel&&!o.wall&&o.life>0&&o.hp>0&&steelConstruct(o)){
  if(o.hp<o.max){ctx.fillStyle='#11242b';ctx.fillRect(o.x-20,o.y+9,40,4);ctx.fillStyle=sameTeam(o.owner,p)?'#9fd0ff':'#ef9479';ctx.fillRect(o.x-20,o.y+9,40*o.hp/o.max,4)}
  return;
 }
 return prevConstruct.apply(this,arguments);
};
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 if(typeof actors==='undefined'||!actors)return list;
 // runas de mira no bloco que a Palma vai arremessar (só para o jogador)
 if(on(p)&&p.hp>0&&state==='fight'){
  let blk=null;try{blk=rwBlockInAim(p,aim(p))}catch{}
  if(blk)list.push({kind:'v3-alq-aim',y:99986+blk.y*.001,priority:9,paint(){if(!frameOf(IMG.aim,8+Math.floor(vfxTime*10)%8,blk.x,blk.y-10,56)){ctx.save();ctx.strokeStyle='#e0a64a';ctx.lineWidth=2;ctx.strokeRect(blk.x-18,blk.y-28,36,36);ctx.restore()}}});
 }
 for(const T of THROWN)if(T.e.v3steel)list.push({kind:'v3-alq-steel-shot',y:99985+T.e.y*.001,priority:9,paint(){frameOf(IMG.steel,12+Math.floor(vfxTime*12)%4,T.e.x,T.e.y-14,42,vfxTime*12)}});
 for(const L of LANCES){if(clock<L.t0)continue;list.push({kind:'v3-alq-lance',y:99985+L.from.y*.001,priority:9,paint(){
  const to=L.end||{x:L.t.x,y:L.t.y-20},k=Math.min(1,(clock-L.t0)/L.dur),x=L.from.x+(to.x-L.from.x)*k,y=L.from.y+(to.y-L.from.y)*k,ang=Math.atan2(to.y-L.from.y,to.x-L.from.x);
  if(L.done)frameOf(IMG.lance,16+Math.min(7,(clock-L.t0-L.dur)/.25*8),to.x,to.y,70,ang);
  else if(!frameOf(IMG.lance,8+Math.floor(k*7),x,y,70,ang)){ctx.save();ctx.strokeStyle=L.steel?'#9fd0ff':'#c1b59e';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-Math.cos(ang)*18,y-Math.sin(ang)*18);ctx.lineTo(x,y);ctx.stroke();ctx.restore()}
 }})}
 for(const S of SHATTERS)list.push({kind:'v3-alq-shatter',y:99985+S.y*.001,priority:9,paint(){frameOf(IMG.shatter,8+(clock-S.t)/.5*16,S.x,S.y-10,SHATTER_R*2.2)}});
 for(const a of actors){
  if(!on(a))continue;
  for(const fx of [a.v3launchFx]){if(fx&&clock-fx.t<.5)list.push({kind:'v3-alq-launch',y:99985+fx.y*.001,priority:9,paint(){frameOf(IMG.spikes,8+(clock-fx.t)/.5*16,fx.x,fx.y-20,90)}})}
  for(const o of own(a))if(o.wall&&o.v3spikeFx&&clock-o.v3spikeFx.t<.4){const fx=o.v3spikeFx;list.push({kind:'v3-alq-spikes',y:99985+fx.y*.001,priority:9,paint(){frameOf(IMG.spikes,(clock-fx.t)/.4*16,fx.x,fx.y-10,70)}})}
  if(a.hp<=0)continue;
  list.push({kind:'v3-alq-charge',y:99984+a.y*.001,priority:9,paint(){
   const v=ess(a).value||0,band=v>=ESS_FULL?16:v>=50?8:0;
   if(!frameOf(IMG.charge,band+Math.floor(vfxTime*8)%8,a.x+26,a.y-72,30)){ctx.save();ctx.fillStyle=v>=ESS_FULL?'#ffd36a':'#e0a64a';ctx.fillRect(a.x+18,a.y-74,16*v/ESS_FULL,4);ctx.restore()}
  }});
 }
 return list;
};
// computador: usa a ultimate quando a Essência enche
const prevAI=ai;
ai=function(dt,a=b){
 const r=prevAI.apply(this,arguments);
 if(a&&a!==p&&on(a)&&a.hp>0&&state==='fight'&&!a.rwCast&&a.cast<=0&&(ess(a).value||0)>=ESS_FULL&&own(a).length>=2&&(a.cd[KIT[5]]||0)<=0){const t=enemy(a);if(t&&dist(a,t)<300)cast(a,KIT[5])}
 // muralha reativa: ergue a muralha em cima de quem chega perto
 if(a&&a!==p&&on(a)&&a.hp>0&&state==='fight'&&!a.rwCast&&a.cast<=0&&a.root<=0&&(a.cd[KIT[3]]||0)<=0){const t=enemy(a);if(t&&t.hp>0){const d=dist(a,t);if(d>80&&d<140&&Math.random()<.35){const ang=Math.atan2(t.y-a.y,t.x-a.x);a.a=ang;cast(a,KIT[3],ang)}}}
 return r;
};
window.AlquimistaV3={own,ess,gainEss,MAX_BLOCKS,LIFE,STEEL_T,LANCES,THROWN,IMG};
})();
