'use strict';
/*
 * Anfitrião do servidor — roda DENTRO do jogo sem tela (uma janela jsdom por partida), no mesmo lugar onde, na sala entre amigos,
 * rodava o jogo de quem criou a sala. Aqui os DOIS jogadores são remotos: o campeão do jogador 0 é o "p" e o do jogador 1 é o "b".
 *  - comandos (andar, mirar, defender) chegam por SRV.input e movem os campeões a cada passo;
 *  - ações (golpe, habilidade, carga, esquiva, dash) chegam por SRV.act, são conferidas, executadas aqui e repetidas no outro jogador;
 *  - o estado (posição, velocidade, vida, MP, stamina, recargas) sai 30 vezes por segundo para cada jogador, do ponto de vista dele;
 *  - cada nocaute ou fim de tempo vira uma mensagem "end" (o duelo é melhor de 3 rodadas); no fim da última rodada sai "over".
 * Fala com o Node por window.__net(slot, textoJSON); slot -1 = os dois.
 * Mesmas mensagens e mesmo formato da sala entre amigos (js/online_luta_v46.js), então o navegador trata o servidor como o anfitrião.
 */
(function(){
const SRV=window.__SRV={on:false,over:false,inp:[{x:0,y:0,l:0,a:0,g:0},{x:0,y:0,l:0,a:0,g:0}],snapT:0,roundDone:false,acts:0,rejected:0};
const r3=v=>Math.round(v*1000)/1000,r1=v=>Math.round(v*10)/10,num=(v,lo,hi,d=0)=>Number.isFinite(+v)?Math.max(lo,Math.min(hi,+v)):d;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const net=(slot,msg)=>window.__net(slot,JSON.stringify(msg));
const actor=s=>s?b:p;

// interface desligada: o servidor não desenha nada
for(const f of ['updateUI','announce','toast','hydrateSkillIcons','refreshModeKit','drawStrips'])window[f]=function(){};
ai=function(){};                       // os dois lados são pessoas
togglePause=function(){};              // sem pausa no online

SRV.start=function(o){
 const R=Math.random;Math.random=rng(o.seed);
 try{lobbyPrefs.mode='1v1';queueMatch('1v1')}finally{Math.random=R}
 V3Modes.swapHero(p,o.h0,1000);V3Modes.swapHero(b,o.h1,1000);
 p.label=String(o.n0||'Jogador 1');b.label=String(o.n1||'Jogador 2');
 SRV.on=true;SRV.over=false;SRV.roundDone=false;SRV.snapT=0;
 return state;
};

/* ---------- comandos ---------- */
SRV.input=function(slot,m){
 const i=SRV.inp[slot];if(!i||!m)return;
 i.x=num(m.x,-1,1);i.y=num(m.y,-1,1);i.l=num(m.l,0,1);i.a=num(m.a,-7,7);i.g=m.g?1:0;
};
function drive(a,i,dt){
 if(!a||state!=='fight'||a.hp<=0)return;
 try{setGuard(a,!!i.g)}catch{}
 a.moving=i.l>.06&&!a.guard;
 if(a.moving&&a.cast<=0&&a.root<=0&&a.dodgeTime<=0&&a.dash<=0){
  const B=a.buff||{};
  const speed=150*(typeof identitySpeed==='function'?identitySpeed(a):1)*(B.storm>0?1.25:1)*(B.astralPower>0?1.25:1)*(B.rpMask>0?.8:1)*(B.rpBreath>0?1.35:1)*(B.armor>0?.8:1)*(a.slow>0?.55:1)*(B.wings>0?1.35:1);
  move(a,i.x*speed*dt,i.y*speed*dt);
 }
 a.a=i.a;
}

/* ---------- ações ---------- */
const OK={basic:1,cast:1,rwBeginCharge:1,rwReleaseCharge:1,dodge:1,dash:1};
const cleanArg=v=>{
 if(typeof v==='number')return Number.isFinite(v)?v:0;
 if(v&&typeof v==='object'){const o={};for(const k of ['pointAim','angle','x','y','charge']){if(k in v)o[k]=k==='pointAim'?!!v[k]:num(v[k],-10000,10000)}return o}
 return v==null?undefined:(typeof v==='boolean'?v:0);
};
SRV.act=function(slot,m){
 if(!SRV.on||state!=='fight'||!m||!OK[m.f]){SRV.rejected++;return}
 const a=actor(slot);if(!a||a.hp<=0)return;
 const args=(Array.isArray(m.args)?m.args:[]).slice(0,3).map(cleanArg);
 if(Number.isFinite(m.a))a.a=num(m.a,-7,7);
 if(Number.isFinite(m.x)&&Number.isFinite(m.y)&&Math.hypot(a.x-m.x,a.y-m.y)<70){a.x=m.x;a.y=m.y}   // a posição do cliente só vale perto da do servidor
 let ok=true;
 try{
  if(m.f==='dash')ok=window.v3Dash?window.v3Dash(a):false;
  else if(m.f==='cast'){if(!a.kit.includes(args[0])){SRV.rejected++;return}ok=window.cast(a,...args)}
  else ok=window[m.f](a,...args);
 }catch(e){return}
 if(ok!==false){SRV.acts++;net(1-slot,{t:'act',f:m.f,a:r3(a.a||0),x:r1(a.x),y:r1(a.y),args})}
};

/* ---------- estado ---------- */
function trackVel(a,dt){
 if(!a||!(dt>0))return;const v=a.v47||(a.v47={x:a.x,y:a.y,vx:0,vy:0});
 let vx=(a.x-v.x)/dt,vy=(a.y-v.y)/dt;if(Math.hypot(vx,vy)>900)vx=vy=0;
 v.vx=v.vx*.5+vx*.5;v.vy=v.vy*.5+vy*.5;v.x=a.x;v.y=a.y;
}
const pack=a=>({vx:Math.round(a.v47?.vx||0),vy:Math.round(a.v47?.vy||0),x:r1(a.x),y:r1(a.y),a:r3(a.a||0),hp:Math.round(a.hp),mx:a.max,mp:Math.round(a.mp),st:Math.round(a.st),g:a.guard?1:0,mv:a.moving?1:0,cd:a.kit.map(id=>Math.round((a.cd[id]||0)*100)/100)});
// cada jogador recebe "h" = o rival e "g" = ele mesmo (é o mesmo formato que o convidado da sala recebe do anfitrião)
function snap(){
 const P=pack(p),B=pack(b),c=r3(count),tm=r1(time);
 net(0,{t:'snap',st:state,c,tm,h:B,g:P});
 net(1,{t:'snap',st:state,c,tm,h:P,g:B});
}
function winner(){
 const el=document.getElementById('resultTitle'),t=el?el.textContent:'';
 if(/é sua/.test(t))return 0;if(/aprendizado/.test(t))return 1;return -1;
}

/* ---------- passo, fim de rodada ---------- */
const prevStep=step;
step=function(dt){
 prevStep(dt);
 if(!SRV.on)return;
 if(state==='count')SRV.roundDone=false;
 drive(p,SRV.inp[0],dt);drive(b,SRV.inp[1],dt);
 trackVel(p,dt);trackVel(b,dt);
 SRV.snapT-=dt;if(SRV.snapT<=0){SRV.snapT=1/30;snap()}
 if(state==='end'&&!SRV.over){SRV.over=true;net(-1,{t:'over',w:winner()})}
};
const prevFinish=finish;
finish=function(){
 const tell=SRV.on&&!SRV.roundDone&&state!=='end';
 const r=prevFinish.apply(this,arguments);
 if(tell){
  SRV.roundDone=true;const P=pack(p),B=pack(b),tm=r1(time);
  net(0,{t:'end',h:B,g:P,tm});net(1,{t:'end',h:P,g:B,tm});
 }
 return r;
};
SRV.tick=function(dt){step(dt)};
// só nos testes (TESTE=1 no servidor): ajusta a vida para acabar a rodada rápido
SRV.debug=function(m){if(m.hp0!=null)p.hp=+m.hp0;if(m.hp1!=null)b.hp=+m.hp1};
})();
