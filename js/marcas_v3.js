'use strict';
/*
 * Marcas de combate: uma característica passiva por herói (sem botão extra), para cada um ter jeito próprio de lutar.
 * Também dá comportamento próprio aos rivais controlados pelo computador.
 */
(function(){
if(!window.COMBAT_V3||!window.V3API)return;
const {isHero}=V3API;
const TAU=Math.PI*2;
const nowT=()=>clock;

const MARCAS={
 0:['Modo Poder','Usar habilidades enche o ki; no máximo, ganha poder extra por 4 s.'],
 1:['Troca Ardilosa','O clone troca de lugar com ele e o dash deixa uma imagem residual.'],
 2:['Ritmo da Lâmina','Cortes seguidos acumulam até 5 marcas (+6% de dano cada); levar dano zera.'],
 3:['Brasa Viva','Com Chama em 80 ou mais: +30% de dano de fogo e +10% de velocidade.'],
 4:['Barreira Cósmica','O teleporte levanta a barreira por 1,6 s. Atração + Esfera Rubra faz combo.'],
 5:['Presa Marcada','Acertar o mesmo alvo em sequência acumula até 3 marcas (+8% de dano cada).'],
 6:['Sobrecarga Viva','Com Sobrecarga em 60 ou mais: +15% de dano e +20% de velocidade.'],
 7:['Ímpeto','Com Elasticidade em 70 ou mais: +12% de dano, +12% de velocidade e recargas 35% mais rápidas.'],
 8:['Brilho Estelar','Com Cosmo em 70 ou mais: +10% de dano e 15% menos dano recebido.'],
 9:['Terreno Amigo','Perto dos próprios blocos de pedra, recebe 15% menos dano.']
};
const THRESH={3:80,6:60,7:70,8:70};
const stateOn=a=>{if(!isHero(a)||!THRESH[a.skin])return false;try{return reworkState(a).value>=THRESH[a.skin]}catch{return false}};
const nearOwnBlocks=a=>objects.some(o=>o.material&&o.owner===a&&o.hp>0&&o.life>0&&dist(o,a)<100);

/* ---------- dano ---------- */
const prevHit=hit;
hit=function(t,n,o,k,an,id){
 if(n>0&&o&&t&&o!==t&&o.team!==t.team){
  if(isHero(o)){
   let f=1;
   if(o.skin===2&&o.v3m>0)f*=1+.06*o.v3m;
   if(o.skin===5&&o.v3f&&o.v3f.t===t&&clock-o.v3f.at<=4)f*=1+.08*o.v3f.n;
   if(o.skin===6&&stateOn(o))f*=1.15;
   if(o.skin===7&&stateOn(o))f*=1.12;
   if(o.skin===8&&stateOn(o))f*=1.10;
   n*=f;
  }
  if(isHero(t)){
   if(t.skin===8&&stateOn(t))n*=.85;
   if(t.skin===9&&nearOwnBlocks(t))n*=.85;
   if(t.skin===2&&t.v3m>0&&n>0)t.v3m=0;
  }
 }
 const before=t&&t.hp,r=prevHit(t,n,o,k,an,id);
 if(r&&t&&before>t.hp&&o&&isHero(o)&&o.kit.includes(id)&&o.team!==t.team){
  if(o.skin===2&&id===o.kit[0]){o.v3m=(clock-(o.v3mT||-9)<=2.5)?Math.min(5,(o.v3m||0)+1):1;o.v3mT=clock}
  if(o.skin===5){const f=o.v3f;o.v3f=(f&&f.t===t&&clock-f.at<=4)?{t,n:Math.min(3,f.n+1),at:clock}:{t,n:1,at:clock}}
 }
 return r;
};

/* ---------- velocidade ---------- */
const prevSpeed=identitySpeed;
identitySpeed=function(a){
 let v=prevSpeed(a);
 if(isHero(a)){
  if(a.skin===3&&stateOn(a))v*=1.1;
  if(a.skin===6&&stateOn(a))v*=1.2;
  if(a.skin===7&&stateOn(a))v*=1.12;
 }
 return v;
};

/* ---------- passo: estados passivos, recargas e rivais ---------- */
const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(state!=='fight')return;
 for(const a of actors){
  if(!isHero(a)||a.hp<=0)continue;
  const on=stateOn(a);a.v3on=on;
  if(a.skin===2&&a.v3m>0&&clock-(a.v3mT||0)>2.5)a.v3m=0;
  if(a.skin===3&&on){const s=reworkState(a);s.breathing=Math.max(s.breathing||0,.45)}
  if(a.skin===7&&on)a.cd=a.cd.map(c=>Math.max(0,c-dt*.35));
 }
};

/* ---------- indicadores visuais ---------- */
const COLORS={2:'#ff5a6a',3:'#ffb347',5:'#7be0a8',6:'#5dff9a',7:'#ff9a5a',8:'#ffe27a',9:'#c9b89a'};
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth();
 for(const a of actors){
  if(!isHero(a)||a.hp<=0)continue;
  const col=COLORS[a.skin];if(!col)continue;
  const pips=a.skin===2?(a.v3m||0):a.skin===5&&a.v3f&&a.v3f.t&&clock-a.v3f.at<=4?a.v3f.n:0;
  const ring=a.v3on||(a.skin===9&&nearOwnBlocks(a));
  if(!pips&&!ring)continue;
  list.push({kind:'v3-marca',y:a.y+.2,priority:1,paint(){
   ctx.save();
   if(ring){ctx.translate(a.x,a.y+11);ctx.scale(1,.42);ctx.strokeStyle=col;ctx.globalAlpha=.55+.3*Math.sin(clock*7);ctx.lineWidth=3;ctx.shadowColor=col;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(0,0,24+Math.sin(clock*7)*1.5,0,TAU);ctx.stroke()}
   else{for(let i=0;i<pips;i++){ctx.fillStyle=col;ctx.strokeStyle='#08141e';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(a.x-(pips-1)*4.5+i*9,a.y-68,3.4,0,TAU);ctx.fill();ctx.stroke()}}
   ctx.restore();
  }});
 }
 return list.sort((u,v)=>u.y-v.y||(u.priority||0)-(v.priority||0));
};

/* ---------- rivais do computador: cada um luta do seu jeito ---------- */
const prevAI=ai;
ai=function(dt,a=b){
 const r=prevAI(dt,a);
 if(!a||a===p||a.hp<=0||state!=='fight'||!isHero(a)||a.cast>0||a.root>0||a.rwCast)return r;
 const foe=enemy(a);if(!foe||foe.hp<=0||foe===a)return r;
 const d=dist(a,foe),ang=Math.atan2(foe.y-a.y,foe.x-a.x);
 if(a.skin===4&&d<150){move(a,-Math.cos(ang)*55*dt,-Math.sin(ang)*55*dt)}            // Eclipse mantém distância
 else if((a.skin===5||a.skin===6||a.skin===7)&&d>200){move(a,Math.cos(ang)*40*dt,Math.sin(ang)*40*dt)}   // Caçador, Herdeiro e Corsário avançam sobre o alvo
 return r;
};

/* ---------- ícone da marca no fim da fila de habilidades; clicar mostra os detalhes como nas habilidades ---------- */
const ICON={
 0:'<path d="M17 3 7 18h7l-2 11 11-16h-7z" fill="currentColor" fill-opacity=".25"/><circle cx="16" cy="16" r="12" fill="none" stroke-dasharray="3 3"/>',
 1:'<path d="M5 12h17M17 7l5 5-5 5M27 21H10M15 16l-5 5 5 5" fill="none"/>',
 2:'<path d="M6 26 22 6l4 3L10 28z" fill="currentColor" fill-opacity=".25"/><circle cx="8" cy="7" r="1.6" fill="currentColor"/><circle cx="14" cy="5" r="1.6" fill="currentColor"/><circle cx="20" cy="3.6" r="1.6" fill="currentColor"/>',
 3:'<path d="M16 3c1 5-5 7-5 13a5 5 0 0 0 10 0c0-2-1-3-2-4 0 2-1 3-2 3 2-4 1-8-1-12z" fill="currentColor" fill-opacity=".3"/><path d="M12 24a4 4 0 0 0 8 0" fill="none"/>',
 4:'<circle cx="16" cy="16" r="11" fill="currentColor" fill-opacity=".12"/><path d="m16 8 2 6 6 .5-4.6 4 1.6 6-5-3.4-5 3.4 1.6-6-4.6-4 6-.5z" fill="currentColor" fill-opacity=".35"/>',
 5:'<path d="M8 6c0 9 3 15 8 20 5-5 8-11 8-20-3 3-5 4-8 4s-5-1-8-4z" fill="currentColor" fill-opacity=".25"/><path d="M13 12l3 7 3-7" fill="none"/>',
 6:'<circle cx="16" cy="16" r="12" fill="none" stroke-dasharray="2 3"/><path d="M18 5 9 17h6l-2 10 10-14h-6z" fill="currentColor" fill-opacity=".35"/>',
 7:'<path d="M5 22c4-9 6 5 10-4s6 5 12-6" fill="none"/><path d="M23 7l5 5-6 2" fill="none"/>',
 8:'<path d="m16 3 3.5 8.5L28 12l-6.5 5.5L23.5 27 16 22l-7.5 5 2-9.5L4 12l8.5-.5z" fill="currentColor" fill-opacity=".3"/>',
 9:'<rect x="4" y="18" width="10" height="9" rx="1" fill="currentColor" fill-opacity=".3"/><rect x="16" y="18" width="10" height="9" rx="1" fill="currentColor" fill-opacity=".3"/><rect x="10" y="7" width="10" height="9" rx="1" fill="currentColor" fill-opacity=".3"/>'
};
window.v3MarkIcon=id=>`<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[id]||''}</svg>`;
const prevDetails=openChampionDetails;
openChampionDetails=function(id){
 prevDetails(id);
 const el=document.getElementById('heroDetail'),m=MARCAS[Number(id)];if(!el||!m)return;
 const kit=el.querySelector('.hero-kit');if(!kit||kit.querySelector('.mark-btn'))return;
 const b=document.createElement('button');b.type='button';b.className='mark-btn';b.dataset.heroMark=String(id);
 b.setAttribute('aria-label','Marca: '+m[0]);b.setAttribute('aria-pressed','false');b.title='Marca · '+m[0];
 b.innerHTML=window.v3MarkIcon(Number(id));
 kit.appendChild(b);
};
document.addEventListener('click',e=>{
 const kit=e.target.closest&&e.target.closest('#heroDetail .hero-kit');if(!kit)return;
 const mb=e.target.closest('.mark-btn');
 if(!mb){kit.querySelector('.mark-btn')?.classList.remove('active');kit.querySelector('.mark-btn')?.setAttribute('aria-pressed','false');return}
 const m=MARCAS[+mb.dataset.heroMark];if(!m)return;
 kit.querySelectorAll('.active').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false')});
 mb.classList.add('active');mb.setAttribute('aria-pressed','true');
 const t=document.getElementById('heroSkillCopy');
 if(t)t.innerHTML=`<b>MARCA · ${m[0]}</b><p>${m[1]}</p><span>Passiva <i>·</i> sem botão, vale durante toda a luta</span>`;
});
window.MarcasV3={MARCAS,THRESH,stateOn,nearOwnBlocks};
})();
