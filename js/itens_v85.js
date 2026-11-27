'use strict';
/*
 * Acessórios (v85) — cada campeão tem 1 slot de item que dá um efeito extra na luta. TODOS os campeões podem usar TODOS os itens (pool único).
 *  - tipos:  uso (consumível, 1 por luta) · ativo (botão, com recarga) · reativo (dispara sozinho numa condição, 1 vez por luta)
 *  - conta:  account.itens = { tem:{id:true}, eq:{campeãoId:'id'} }  (a Pílula dos Deuses vem de graça; o resto se compra com moedas)
 *  - luta:   a.item = {id,def,used,cd,armed} e a.ix = efeitos temporários. Um botão ITEM aparece na luta (ou a tecla E).
 *  - online: itemUse(a,idx) é uma ação espelhada como o dash; o servidor decide (cada vaga usa o item do próprio perfil).
 * A ORDEM da lista ITENS é parte do protocolo online (índice numérico): só acrescente itens no fim.
 */
(function(){
const RAR={comum:{n:'COMUM',cor:'#9fc3ff',preco:600},raro:{n:'RARO',cor:'#c58bff',preco:1500},lendario:{n:'LENDÁRIO',cor:'#ffd45a',preco:3500}};
const TIPO={uso:'Consumível · 1 uso por luta',ativo:'Ativo',reativo:'Automático · 1 vez por luta'};
const CAT={cura:'Cura',defesa:'Defesa',ataque:'Ataque',util:'Utilidade'};
const ITENS=[
 {id:'pilula',n:'Pílula dos Deuses',o:'Dragon Ball',cat:'cura',tipo:'uso',rar:'comum',e:'💊',d:'Recupera 25% da vida na hora.'},
 {id:'doce',n:'Doce do Mestre',o:'Jujutsu Kaisen',cat:'cura',tipo:'uso',rar:'comum',e:'🍬',d:'Cura 20% da vida ao longo de 5 segundos.'},
 {id:'carne',n:'Carne com Osso',o:'One Piece',cat:'cura',tipo:'uso',rar:'comum',e:'🍖',d:'Cura 15% da vida e dá +10% de velocidade por 5 s.'},
 {id:'sangue',n:'Sangue de Atena',o:'Cavaleiros do Zodíaco',cat:'cura',tipo:'ativo',cd:60,rar:'raro',e:'🩸',d:'Por 8 s, cada golpe seu cura 8% do dano causado.'},
 {id:'escudo',n:'Escudo do Dragão',o:'Cavaleiros do Zodíaco',cat:'defesa',tipo:'ativo',cd:50,rar:'comum',e:'🛡️',d:'2 s de barreira de frente que absorve até 150 de dano.'},
 {id:'chapeu',n:'Chapéu de Palha',o:'One Piece',cat:'defesa',tipo:'ativo',cd:55,rar:'raro',e:'👒',d:'Por 4 s: não é empurrado, não tem a guarda quebrada e recebe 15% menos dano.'},
 {id:'tronco',n:'Tronco de Substituição',o:'Naruto',cat:'defesa',tipo:'ativo',cd:45,rar:'comum',e:'🌳',d:'0,6 s de invulnerável e um salto de 150 para trás, deixando um tronco.'},
 {id:'cantil',n:'Cantil do Amanhecer',o:'Fogo',cat:'defesa',tipo:'uso',rar:'raro',e:'🍶',d:'Remove lentidão, prisão e guarda quebrada e dá 2 s com 30% menos dano.'},
 {id:'licenca',n:'Licença de Hunter',o:'Hunter x Hunter',cat:'defesa',tipo:'reativo',rar:'lendario',e:'🪪',d:'Se levar um golpe fatal, fica com 8% de vida e 1,5 s de invulnerável. A ultimate fica bloqueada por 3 s.'},
 {id:'pesos',n:'Pesos de Treino',o:'Dragon Ball',cat:'ataque',tipo:'ativo',cd:60,rar:'comum',e:'🏋️',d:'Tira os pesos: 5 s de +25% de velocidade e +15% de dano, depois 1,5 s cansado.'},
 {id:'mascara',n:'Máscara Oca',o:'Bleach',cat:'ataque',tipo:'ativo',cd:70,rar:'raro',e:'👹',d:'Por 5 s: +20% de dano, mas você recebe +15% de dano.'},
 {id:'caderno',n:'Caderno de Análise',o:'Boku no Hero',cat:'ataque',tipo:'ativo',cd:60,rar:'raro',e:'📓',d:'Marca o rival mais próximo por 6 s: ele sofre +15% de dano de todas as fontes.'},
 {id:'brasa',n:'Brasa Eterna',o:'Fogo',cat:'ataque',tipo:'reativo',rar:'lendario',e:'🔥',d:'Abaixo de 30% de vida: por 6 s, +20% de dano e queima quem está perto.'},
 {id:'kon',n:'Boneco Kon',o:'Bleach',cat:'util',tipo:'ativo',cd:50,rar:'raro',e:'🧸',d:'Solta uma isca que atrai os rivais por 3 s.'},
 {id:'carta',n:'Carta de Contenção',o:'Hunter x Hunter',cat:'util',tipo:'ativo',cd:60,rar:'lendario',e:'🃏',d:'Prende o rival mais próximo por 0,8 s (no máximo 0,3 s em chefes). Não prende de novo por 3 s.'},
 {id:'venda',n:'Venda Retirada',o:'Jujutsu Kaisen',cat:'util',tipo:'ativo',cd:70,rar:'raro',e:'🕶️',d:'Por 5 s, as recargas das habilidades correm 40% mais rápido.'},
 {id:'chakra',n:'Pílula de Chakra',o:'Naruto',cat:'util',tipo:'uso',rar:'lendario',e:'🌀',d:'Zera a recarga das habilidades normais (não a ultimate).'},
 {id:'relogio',n:'Relógio de Prata',o:'Fullmetal Alchemist',cat:'util',tipo:'ativo',cd:55,rar:'raro',e:'⌚',d:'Ergue uma muralha de pedra à frente por 3 s, que bloqueia movimento e projéteis.'}
];
ITENS.forEach((d,i)=>{d.idx=i;d.preco=RAR[d.rar].preco;d.cor=RAR[d.rar].cor});
const BY=Object.fromEntries(ITENS.map(d=>[d.id,d]));
const ARTE=new Set(ITENS.map(d=>d.id));   // todos têm arte pintada em assets/itens_v85/<id>.webp (se faltar algum, tire o id daqui e ele usa o emoji)
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $q=s=>document.querySelector(s);
const SERVIDOR=()=>!!window.__SRV;

/* ---------------------------------------------------------------- conta */
function conta(){
 if(typeof account==='undefined'||!account)return null;
 let I=account.itens;if(!I||typeof I!=='object'){I=account.itens={tem:{},eq:{}}}
 I.tem=I.tem&&typeof I.tem==='object'?I.tem:{};I.eq=I.eq&&typeof I.eq==='object'?I.eq:{};
 I.tem.pilula=true;   // item inicial, de graça
 return I;
}
const salvar=()=>{try{saveAccount()}catch{}};
const tem=id=>{const I=conta();return !!(I&&I.tem[id])};
function eqDe(hero){const I=conta();const id=I&&I.eq[hero];return id&&BY[id]&&I.tem[id]?id:null}
function equipar(hero,id){const I=conta();if(!I)return false;if(id==null){delete I.eq[hero];salvar();return true}if(!BY[id]||!I.tem[id])return false;I.eq[hero]=id;salvar();return true}
function comprar(id){
 const I=conta(),d=BY[id];if(!I||!d||I.tem[id])return false;
 if(account.coins<d.preco)return false;
 account.coins-=d.preco;I.tem[id]=true;salvar();return true;
}

/* ---------------------------------------------------------------- estado na luta */
function equip(a,id){
 if(!a)return;
 a.itemFor=a.skin;a.ix={};
 if(id&&BY[id]){a.item={id,def:BY[id],used:false,cd:0,armed:true};a.itemNone=false}
 else{a.item=null;a.itemNone=true}
}
function addMod(a,k,key,m,t){const X=a.ix||(a.ix={});(X.mods=X.mods||{})[k+':'+key]={k,m,t}}   // a chave leva o tipo: um item pode dar vários efeitos
function mod(a,k){let v=1;const M=a&&a.ix&&a.ix.mods;if(M)for(const q of Object.values(M))if(q.k===k&&q.t>0)v*=q.m;return v}
function modSum(a,k){let v=0;const M=a&&a.ix&&a.ix.mods;if(M)for(const q of Object.values(M))if(q.k===k&&q.t>0)v+=q.m;return v}
function depois(a,t,fn){const X=a.ix||(a.ix={});(X.later=X.later||[]).push({t,fn})}
const foeNear=(a,r)=>{let best=null,bd=r;for(const e of opponents(a)){if(e.hp<=0||e.itemDecoy||e.v10Clone)continue;const d=dist(a,e);if(d<=bd){bd=d;best=e}}return best};
// ---- arte pintada dos efeitos (folhas 6 colunas, quadros de 320 px): auras de categoria e o Boneco Kon ----
const IMG={},CEL=320;
function img(n){let o=IMG[n];if(!o){o=IMG[n]={im:new Image(),ok:false};o.im.onload=()=>{o.ok=o.im.naturalWidth>0};o.im.src='assets/itens_v85/'+n+'.webp?v=1'}return o}
try{if(typeof Image!=='undefined'){img('auras');img('kon');img('escudo');img('tronco')}}catch{}
function quadro(n,linha,col,cx,cy,lado,ax=.5,ay=.5){const o=IMG[n];if(!o||!o.ok)return false;ctx.drawImage(o.im,col*CEL,linha*CEL,CEL,CEL,cx-lado*ax,cy-lado*ay,lado,lado);return true}
const LOG_T=1.8,SMK=[];   // o tronco dura 1,8 s: aparece (0,55 s), fica parado e some em fumaça (últimos 0,6 s)
const AUR=[],GONE=[],BRK=[],LINHA={cura:0,defesa:1,ataque:2,util:3};
let CUR=null;   // categoria do item que está sendo usado agora (para a aura)
function aura(a,cat){const o=IMG.auras;if(!o||!o.ok||LINHA[cat]==null)return false;AUR.push({a,row:LINHA[cat],t0:clock});return true}
const usaFx=(a,cor,txt,cat=CUR)=>{try{if(cat===false){if(txt)float(a.x,a.y-52,txt,cor);return}   // cat=false: o item tem efeito visual próprio (ex.: a fumaça do Tronco)
 const arte=cat&&aura(a,cat);if(!arte)ring(a.x,a.y,36,cor,.45);spark(a.x,a.y,cor,arte?6:10);if(txt)float(a.x,a.y-52,txt,cor)}catch{}};
const DEC=[];   // iscas (Boneco Kon)

const EF={
 pilula(a){heal(a,a.max*.25);usaFx(a,'#9be37a','PÍLULA');return true},
 doce(a){const X=a.ix;X.hot={rate:a.max*.2/5,t:5};usaFx(a,'#ffb6e0','DOCE');return true},
 carne(a){heal(a,a.max*.15);addMod(a,'spd','carne',1.1,5);usaFx(a,'#e9a46a','CARNE');return true},
 sangue(a){addMod(a,'ls','sangue',.08,8);usaFx(a,'#ff6a7a','VAMPIRISMO');return true},
 escudo(a){a.ix.barrier={hp:150,t:2,t0:clock,hitAt:null};usaFx(a,'#8fd2ff','ESCUDO');return true},
 chapeu(a){addMod(a,'taken','chapeu',.85,4);addMod(a,'noknock','chapeu',0,4);a.guardBreak=0;usaFx(a,'#ffd45a','CHAPÉU');return true},
 tronco(a){
  const e=foeNear(a,600),ang=e?Math.atan2(a.y-e.y,a.x-e.x):(a.a||0)+Math.PI,x0=a.x,y0=a.y;
  a.inv=Math.max(a.inv||0,.6);a.root=0;move(a,Math.cos(ang)*150,Math.sin(ang)*150);
  (a.ix.logs=a.ix.logs||[]).push({x:x0,y:y0,t:LOG_T,t0:clock});SMK.push({x:a.x,y:a.y,t0:clock});usaFx(a,'#c9a46a','SUBSTITUIÇÃO',IMG.tronco&&IMG.tronco.ok?false:undefined);return true;   // o tronco fica onde o herói estava; a fumaça de chegada aparece onde ele pousou
 },
 cantil(a){a.root=0;a.slow=0;a.guardBreak=0;a.knockedDown=false;addMod(a,'taken','cantil',.7,2);usaFx(a,'#ffb35a','CANTIL');return true},
 pesos(a){addMod(a,'spd','pesos',1.25,5);addMod(a,'dmg','pesos',1.15,5);depois(a,5,()=>addMod(a,'spd','cansado',.8,1.5));usaFx(a,'#ffd45a','SEM PESOS');return true},
 mascara(a){addMod(a,'dmg','mascara',1.2,5);addMod(a,'taken','mascara',1.15,5);usaFx(a,'#ff5a5a','MÁSCARA');return true},
 caderno(a){const e=foeNear(a,520);if(!e)return false;const X=e.ix||(e.ix={});addMod(e,'taken','caderno',1.15,6);usaFx(e,'#ff9ad0','MARCADO');return true},
 kon(a){
  const e=foeNear(a,700),ang=e?Math.atan2(e.y-a.y,e.x-a.x):(a.a||0);
  const x=clamp(a.x+Math.cos(ang)*120,50,W-50),y=clamp(a.y+Math.sin(ang)*120,50,H-50);
  const o=actor(x,y,[],a.color);
  Object.assign(o,{itemDecoy:true,owner:a,skin:a.skin,team:a.team,label:'Kon',hp:140,max:140,life:3,age:0,inv:0,kit:[]});
  DEC.push(o);usaFx(a,'#e9b86a','ISCA');ring(x,y,30,'#e9b86a',.4);return true;
 },
 carta(a){
  const e=foeNear(a,300);if(!e)return false;
  const X=e.ix||(e.ix={});if(X.ccImune>0)return false;
  const boss=!!(e.huntBoss||e.boss);
  e.root=Math.max(e.root||0,boss?.3:.8);X.ccImune=(boss?.3:.8)+3;
  usaFx(e,'#ffd45a','PRESO');return true;
 },
 venda(a){addMod(a,'cd','venda',1.4,5);usaFx(a,'#cfe3ff','SEIS OLHOS');return true},
 chakra(a){for(let i=0;i<a.kit.length-1;i++)a.cd[a.kit[i]]=0;usaFx(a,'#7fb8ff','CHAKRA');return true},
 relogio(a){
  const ang=a.a||0,x=clamp(a.x+Math.cos(ang)*100,70,W-70),y=clamp(a.y+Math.sin(ang)*100,70,H-70),vertical=Math.abs(Math.cos(ang))>.7;
  const w={kind:'wall',x,y,w:vertical?22:135,h:vertical?135:22,owner:a,life:3,color:a.color};
  if(actors.some(o=>o.hp>0&&Math.abs(o.x-x)<w.w/2+o.r&&Math.abs(o.y-y)<w.h/2+o.r))return false;
  objects.push(w);usaFx(a,'#cfd6e6','MURALHA');return true;
 }
};

function usar(a){
 if(!a||!a.item||a.hp<=0||state!=='fight')return false;
 const it=a.item,d=it.def;
 if(d.tipo==='reativo')return false;
 if(d.tipo==='uso'&&it.used)return false;
 if(it.cd>0)return false;
 let ok=false;CUR=d.cat;try{ok=EF[d.id](a,it)}catch(e){console.error('[Eldoria] item',d.id,e);return false}finally{CUR=null}
 if(!ok)return false;
 if(d.tipo==='uso')it.used=true;else it.cd=d.cd;
 try{combatSound('hit',.6)}catch{}
 return true;
}
// ação espelhada no online (o argumento é o índice do item; só os aparelhos de quem ASSISTE equipam por ele — o servidor usa o item do perfil)
window.itemUse=function(a,idx){
 if(!a)return false;
 // no aparelho de quem ASSISTE, o item usado pelo outro (humano ou bot do servidor) vale o índice que chegou
 if(!SERVIDOR()&&a!==(typeof p!=='undefined'?p:null)&&Number.isInteger(idx)&&ITENS[idx]&&(!a.item||a.item.def.idx!==idx))equip(a,ITENS[idx].id);
 return usar(a);
};

/* ---------------------------------------------------------------- bots: item sorteado + decisão de uso */
const sorteia=()=>ITENS[Math.floor(Math.random()*ITENS.length)].id;
const online=()=>{try{return !!(window.OnlineV46&&OnlineV46.match&&OnlineV46.match.on)}catch{return false}};
// onde os rivais controlados pelo jogo usam item: duelos, equipes, liga, torneio, espelho, desafio, zona e a Caçada (o aliado). Não no Treino/Dojo nem na Sobrevivência.
const modoOk=()=>{try{if(battleActivity==='training')return false;if(modeRun&&!(modeRun.hunt||['tournament','mirror','daily','zone'].includes(modeRun.id)))return false}catch{}return true};
const botBase=a=>!!a&&a!==(typeof p!=='undefined'?p:null)&&!a.itemDecoy&&!a.huntBoss&&!a.boss&&!a.mob&&!a.rmob&&!a.trainingDummy&&Array.isArray(a.kit)&&a.kit.length===6&&a.hp>0;
const botCtl=a=>{if(!botBase(a))return false;if(SERVIDOR())return !!a.srvBot;if(online())return false;return modoOk()};
function botDesejo(a){
 const it=a.item,d=it.def;
 if(d.tipo==='reativo')return false;
 if(d.tipo==='uso'&&it.used)return false;
 if(it.cd>0)return false;
 const e=foeNear(a,900);if(!e)return false;
 const dd=dist(a,e),hp=a.hp/a.max,eh=e.hp/(e.max||1000),agindo=e.cast>0||e.punchTime>0||!!e.rwCast;
 const ocupadas=(a.kit||[]).slice(0,5).filter(k=>a.cd[k]>2).length;
 switch(d.id){
  case 'pilula':return hp<.42;
  case 'doce':return hp<.6;
  case 'carne':return hp<.5;
  case 'sangue':return dd<220&&hp<.85&&eh>.2;
  case 'escudo':return dd<300&&agindo;
  case 'chapeu':return dd<220&&hp<.75;
  case 'tronco':return dd<170&&hp<.5;
  case 'cantil':return a.root>.3||a.slow>0||a.guardBreak>0;
  case 'pesos':return dd>240&&dd<600&&hp>.35;
  case 'mascara':return dd<260&&hp>.55&&eh<.9;
  case 'caderno':return dd<480&&eh>.5;
  case 'kon':return dd<320&&hp<.6;
  case 'carta':return dd<270&&(agindo||eh<.5);
  case 'venda':return ocupadas>=2&&dd<500;
  case 'chakra':return ocupadas>=3;
  case 'relogio':return dd>90&&dd<420&&(agindo||hp<.5);
 }
 return false;
}
function botAI(a,dt){
 const X=a.ix;if(!X||!a.item||a.hp<=0||state!=='fight')return;
 X.ai=(X.ai||0)-dt;if(X.ai>0)return;
 X.ai=.25+Math.random()*.3;                       // pensa ~3x por segundo e nem sempre age na hora (reação humana)
 if(botDesejo(a)&&Math.random()<.7)window.itemUse(a,a.item.def.idx);
}

/* ---------------------------------------------------------------- tempo (a cada passo) */
function tick(a,dt){
 const X=a.ix;if(!X)return;
 const it=a.item;
 if(state==='fight'){
  if(it&&it.cd>0)it.cd=Math.max(0,it.cd-dt);
  if(X.hot){const d=Math.min(dt,X.hot.t);heal(a,X.hot.rate*d);X.hot.t-=dt;if(X.hot.t<=0)X.hot=null}
  if(X.barrier){X.barrier.t-=dt;if(X.barrier.t<=0||X.barrier.hp<=0){const B=X.barrier;if(IMG.escudo&&IMG.escudo.ok)BRK.push({x:a.x,y:a.y,ang:a.a||0,t0:clock,broke:B.hp<=0});X.barrier=null}}
  if(X.ccImune>0)X.ccImune-=dt;
  if(X.noUlt>0)X.noUlt-=dt;
  const cdr=mod(a,'cd')-1;
  if(cdr>0&&a.hp>0){for(const k of a.kit||[])if(a.cd[k]>0)a.cd[k]=Math.max(0,a.cd[k]-dt*cdr);if(a.v3dashCD>0)a.v3dashCD=Math.max(0,a.v3dashCD-dt*cdr)}
  if(X.later)for(let i=X.later.length-1;i>=0;i--){const q=X.later[i];q.t-=dt;if(q.t<=0){X.later.splice(i,1);try{q.fn()}catch{}}}
  // Brasa Eterna: dispara sozinha abaixo de 30% de vida
  if(it&&it.id==='brasa'&&it.armed&&a.hp>0&&a.hp<=a.max*.3){
   it.armed=false;it.used=true;addMod(a,'dmg','brasa',1.2,6);X.burn={t:6,c:0};usaFx(a,'#ff7a2a','BRASA ETERNA','ataque');
   try{if(a===p)toast('Brasa Eterna acesa!')}catch{}
  }
  if(X.burn){X.burn.t-=dt;X.burn.c-=dt;if(X.burn.c<=0){X.burn.c=.5;for(const e of opponents(a))if(e.hp>0&&!e.itemDecoy&&dist(a,e)<120){try{hit(e,9,a,0,0)}catch{}}try{ring(a.x,a.y,110,'#ff7a2a',.3)}catch{}}if(X.burn.t<=0)X.burn=null}
  if(X.logs)for(let i=X.logs.length-1;i>=0;i--){X.logs[i].t-=dt;if(X.logs[i].t<=0)X.logs.splice(i,1)}
 }else if(state==='count'||state==='end'){
  // entre os rounds: efeitos temporários somem e as recargas voltam (o consumível já gasto continua gasto na luta toda)
  X.mods=null;X.hot=null;X.barrier=null;X.later=null;X.burn=null;X.logs=null;X.ccImune=0;X.noUlt=0;
  if(it&&it.def.tipo==='ativo')it.cd=0;
  if(it&&it.def.id==='brasa'&&!it.used)it.armed=true;
 }
 if(X.mods){for(const k of Object.keys(X.mods)){X.mods[k].t-=dt;if(X.mods[k].t<=0)delete X.mods[k]}}
}
function tickDec(dt){
 for(let i=DEC.length-1;i>=0;i--){
  const d=DEC[i];d.life-=dt;d.age+=dt;
  try{let best=null,bd=1e9;for(const e of opponents(d.owner)){if(e.itemDecoy||e.hp<=0)continue;const dd=Math.abs(e.x-d.x);if(dd<bd){bd=dd;best=e}}if(best)d.flip=best.x<d.x}catch{}   // a isca olha para o rival mais próximo
  const fim=d.life<=0||d.hp<=0;
  if(fim||!actors.includes(d.owner)||(state!=='fight'&&state!=='count')){if(fim&&IMG.kon&&IMG.kon.ok)GONE.push({x:d.x,y:d.y,flip:d.flip,t0:clock});DEC.splice(i,1)}
 }
 for(let i=GONE.length-1;i>=0;i--)if(clock-GONE[i].t0>.62)GONE.splice(i,1);
 for(let i=AUR.length-1;i>=0;i--)if(clock-AUR[i].t0>.8)AUR.splice(i,1);
 for(let i=BRK.length-1;i>=0;i--)if(clock-BRK[i].t0>.65)BRK.splice(i,1);
 for(let i=SMK.length-1;i>=0;i--)if(clock-SMK[i].t0>.65)SMK.splice(i,1);
}
// Escudo do Dragão pintado: surge (linha 0), fica ativo em loop (1), pisca ao absorver golpe (2) e quebra (3); a folha olha para a direita e gira com o herói
const ESC_L=172;
function paintEscudo(a,B){
 const o=IMG.escudo;
 if(!o||!o.ok){ctx.save();ctx.translate(a.x,a.y);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35+.35*Math.sin(clock*18);ctx.strokeStyle='#8fd2ff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,34,(a.a||0)-1.1,(a.a||0)+1.1);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();ctx.restore();return}
 const age=clock-B.t0,fim=B.t<.3?Math.max(0,B.t/.3):1;
 let row=1,col=Math.floor(clock*7)%6,hit=B.hitAt!=null&&clock-B.hitAt<.6;
 if(age<.5){row=0;col=Math.min(5,Math.floor(age/.083))}
 else if(hit){row=2;col=Math.min(5,Math.floor((clock-B.hitAt)/.1))}
 ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.a||0);
 ctx.globalAlpha=.9*fim;quadro('escudo',row,col,0,0,ESC_L);
 ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.4*fim;quadro('escudo',row,col,0,0,ESC_L);   // brilho de energia por cima
 if(hit){const k=(clock-B.hitAt)/.6,x=ESC_L*.455,g=ctx.createRadialGradient(x,0,1,x,0,26+k*26);g.addColorStop(0,'rgba(255,255,230,'+(.9*(1-k))+')');g.addColorStop(.5,'rgba(150,255,210,'+(.5*(1-k))+')');g.addColorStop(1,'rgba(150,255,210,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,0,52,0,6.2832);ctx.fill()}
 ctx.restore();
}
function paintQuebra(g){
 const age=clock-g.t0;ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.ang);
 if(g.broke){quadro('escudo',3,Math.min(5,Math.floor(age/.1)),0,0,ESC_L)}
 else{ctx.globalAlpha=Math.max(0,1-age/.3);quadro('escudo',1,Math.floor(clock*7)%6,0,0,ESC_L)}
 ctx.restore();
}
// Tronco de Substituição pintado: cai em fumaça (linha 0), parado (1), some em fumaça (2); a fumaça de chegada (3) aparece onde o herói pousa
function paintTronco(L){
 const o=IMG.tronco;
 if(!o||!o.ok){ctx.save();ctx.translate(L.x,L.y);ctx.globalAlpha=Math.min(1,L.t/.4);ctx.fillStyle='#6b4a2b';ctx.fillRect(-14,-6,28,12);ctx.fillStyle='#8a6338';ctx.fillRect(-14,-6,28,3);ctx.restore();return}
 const age=clock-L.t0;let row=1,col=Math.floor(clock*6)%6;
 if(age<.55){row=0;col=Math.min(5,Math.floor(age/.092))}
 else if(L.t<.6){row=2;col=Math.min(5,Math.floor((.6-L.t)/.1))}
 ctx.save();ctx.translate(L.x,L.y+14);quadro('tronco',row,col,0,0,128,.5,.88);ctx.restore();
}
function paintFumaca(s){ctx.save();ctx.translate(s.x,s.y+10);quadro('tronco',3,Math.min(5,Math.floor((clock-s.t0)/.1)),0,0,128,.5,.7);ctx.restore()}
// Boneco Kon pintado: aparece (linha 1), fica parado (0), leva golpe (3) e some (2); olha para o rival
function paintKon(d,gone){
 const o=IMG.kon;
 if(!o||!o.ok){   // enquanto a arte não carrega: cópia transparente do herói
  if(gone)return;ctx.save();ctx.translate(d.x,d.y);ctx.globalAlpha=.55*Math.min(1,d.age/.15,d.life/.3);try{drawAnimatedFighter(ctx,d,72)}catch{}ctx.restore();return;
 }
 let row=0,col=Math.floor(clock*7)%6;
 if(gone){row=2;col=Math.min(5,Math.floor((clock-d.t0)/.1))}
 else if(d.hitAt!=null&&clock-d.hitAt<.6){row=3;col=Math.min(5,Math.floor((clock-d.hitAt)/.1))}
 else if(d.age<.6){row=1;col=Math.min(5,Math.floor(d.age/.1))}
 ctx.save();ctx.translate(d.x,d.y+14);
 if(!gone||col<3){ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(0,0,18,6,0,0,6.2832);ctx.fill()}
 if(d.flip)ctx.scale(-1,1);
 quadro('kon',row,col,0,0,132,.5,.88);ctx.restore();
}

/* ---------------------------------------------------------------- ganchos no motor */
// velocidade
const prevSpeed=identitySpeed;
identitySpeed=function(a){const v=prevSpeed.apply(this,arguments);return a&&a.ix&&a.ix.mods?v*mod(a,'spd'):v};
// ultimate bloqueada por um instante depois da Licença de Hunter
const prevUlt=canUseUltimate;
canUseUltimate=function(a){if(a&&a.ix&&a.ix.noUlt>0)return false;return prevUlt.apply(this,arguments)};
// iscas contam como rivais
const prevOpp=opponents;
opponents=function(a){const r=prevOpp.apply(this,arguments);if(!DEC.length||!a)return r;const ex=DEC.filter(d=>d.hp>0&&d.life>0&&d.team!==a.team);return ex.length?[...r,...ex]:r};
const prevEnemy=enemy;
enemy=function(a){
 const e=prevEnemy.apply(this,arguments);if(!DEC.length||!a)return e;
 if(a===(typeof p!=='undefined'?p:null))return e&&e.itemDecoy?(foeNear(a,1e9)||e):e;   // a isca atrai os bots; o foco do jogador (a variável b) continua sendo o rival de verdade (como no clone do Kakashi)
 let best=null,bd=1e9;for(const d of DEC){if(d.hp>0&&d.life>0&&d.team!==a.team){const dd=dist(a,d);if(dd<bd){bd=dd;best=d}}}
 return best&&bd<320&&(!e||bd<dist(a,e)+140)?best:e;
};
// dano causado e recebido
const prevHit=hit;
hit=function(t,n,owner,knock=0,angle=0,id){
 if(!t)return prevHit.apply(this,arguments);
 if(t.itemDecoy){   // a isca só perde vida (não passa pelas regras de morte dos modos)
  if(t.hp<=0||state!=='fight'||(owner&&owner.team===t.team))return false;
  n=Math.round(n);t.hp-=n;t.hitAt=clock;try{float(t.x,t.y-30,n,'#f0e1ba');spark(t.x,t.y,'#e9b86a',6)}catch{}
  if(t.hp<=0)t.life=0;return true;
 }
 const ow=owner&&owner.ix,tx=t.ix;let noKnock=null;
 if(ow&&ow.mods)n*=mod(owner,'dmg');
 if(tx){
  if(tx.mods){n*=mod(t,'taken');if(mod(t,'noknock')===0){knock=0;noKnock={x:t.x,y:t.y}}}
  const B=tx.barrier;
  if(B&&B.hp>0&&B.t>0&&owner&&typeof t.a==='number'){
   const inc=Math.atan2(owner.y-t.y,owner.x-t.x),front=Math.abs(Math.atan2(Math.sin(inc-t.a),Math.cos(inc-t.a)))<1.3;
   if(front){const ab=Math.min(n,B.hp);B.hp-=ab;B.hitAt=clock;n-=ab;try{float(t.x,t.y-46,'ESCUDO '+Math.round(ab),'#8fd2ff');ring(t.x+Math.cos(t.a)*22,t.y+Math.sin(t.a)*22,26,'#8fd2ff',.25)}catch{}if(n<=0.5)return true}
  }
 }
 // Licença de Hunter: ganha uma vida extra "de mentira" enquanto o golpe é calculado; se ela acabar, o golpe era fatal
 const arm=t.item&&t.item.id==='licenca'&&t.item.armed&&t.hp>0&&state==='fight';
 const hp0=t.hp;if(arm)t.hp+=1e6;
 let r;try{r=prevHit.call(this,t,n,owner,knock,angle,id)}
 finally{
  const dealt=Math.max(0,hp0+(arm?1e6:0)-t.hp);
  if(arm)t.hp-=1e6;
  if(noKnock){t.x=noKnock.x;t.y=noKnock.y}   // o golpe também empurra um pouco por conta própria: com o Chapéu ativo isso é desfeito
  if(owner&&owner.ix&&owner.ix.mods&&dealt>0){const ls=modSum(owner,'ls');if(ls>0)heal(owner,dealt*ls)}
 }
 if(arm&&t.hp<=0){
  t.hp=Math.max(1,Math.round(t.max*.08));t.inv=Math.max(t.inv||0,1.5);t.root=0;t.hitReact=0;
  t.item.armed=false;t.item.used=true;t.ix.noUlt=3;usaFx(t,'#ffd45a','LICENÇA DE HUNTER','defesa');
  try{if(t===p)toast('Licença de Hunter! Você sobreviveu.')}catch{}
 }
 return r;
};

/* ---------------------------------------------------------------- passo */
const prevStep=step;
step=function(dt){
 const r=prevStep.apply(this,arguments);
 try{
  if(!SERVIDOR()&&typeof p!=='undefined'&&p&&(p.itemFor!==p.skin||(p.itemFor===undefined&&!p.itemNone))){equip(p,eqDe(p.skin))}
  if(!SERVIDOR()&&!online()&&modoOk())for(const a of actors)if(botBase(a)&&a.itemFor!==a.skin)equip(a,sorteia());   // os bots sorteiam o item
  for(const a of actors)if(a.ix){tick(a,dt);if(botCtl(a))botAI(a,dt)}
  tickDec(dt);
  hud();
 }catch(e){console.error('[Eldoria] itens',e)}
 return r;
};

/* ---------------------------------------------------------------- desenho */
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth.apply(this,arguments);
 try{
  for(const d of DEC)list.push({kind:'itemdecoy',y:d.y,priority:1,paint(){paintKon(d,false)}});
  for(const s of SMK)list.push({kind:'itemsmoke',y:s.y+2,priority:3,paint(){paintFumaca(s)}});
  for(const g of BRK)list.push({kind:'itembreak',y:g.y+1,priority:3,paint(){paintQuebra(g)}});
  for(const g of GONE)list.push({kind:'itemgone',y:g.y,priority:1,paint(){paintKon(g,true)}});
  for(const u of AUR){const a=u.a;if(!a||a.hp<=0)continue;list.push({kind:'itemaura',y:a.y+3,priority:3,paint(){const f=Math.min(5,Math.floor((clock-u.t0)/.13));ctx.save();ctx.globalCompositeOperation='lighter';quadro('auras',u.row,f,a.x,a.y+12,230,.5,.6);ctx.restore()}})}
  for(const a of actors){
   const X=a.ix;if(!X||a.hp<=0)continue;
   if(X.logs)for(const L of X.logs)list.push({kind:'itemlog',y:L.y,priority:1,paint(){paintTronco(L)}});
   if(X.barrier&&X.barrier.hp>0)list.push({kind:'itembarrier',y:a.y+1,priority:3,paint(){paintEscudo(a,X.barrier)}});
   if(X.mods&&X.mods['taken:caderno']&&X.mods['taken:caderno'].t>0)list.push({kind:'itemmark',y:a.y+2,priority:3,paint(){ctx.save();ctx.translate(a.x,a.y-6);ctx.strokeStyle='#ff9ad0';ctx.globalAlpha=.6+.3*Math.sin(clock*10);ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.lineDashOffset=-clock*30;ctx.beginPath();ctx.arc(0,0,30,0,6.2832);ctx.stroke();ctx.restore()}});
   if(X.burn)list.push({kind:'itemburn',y:a.y,priority:3,paint(){ctx.save();ctx.translate(a.x,a.y);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.25;ctx.fillStyle='#ff7a2a';ctx.beginPath();ctx.arc(0,0,110,0,6.2832);ctx.fill();ctx.restore()}});
  }
 }catch(e){}
 return list;
};

/* ---------------------------------------------------------------- ícones */
function icone(d,cls=''){
 if(!d)return `<span class="it85-ico vazio ${cls}"><b>+</b></span>`;
 if(ARTE.has(d.id))return `<span class="it85-ico art ${d.rar} ${cls}"><img src="assets/itens_v85/${d.id}.webp?v=1" alt="" draggable="false"></span>`;
 return `<span class="it85-ico ${d.rar} ${cls}" style="--c:${d.cor}"><b>${d.e}</b></span>`;
}

/* ---------------------------------------------------------------- botão ITEM na luta */
let btn=null,hudT=0;
function criarBtn(){
 const B=$q('#battle');if(!B)return null;
 if(btn&&btn.isConnected)return btn;
 btn=document.createElement('button');btn.id='itemBtn85';btn.type='button';btn.hidden=true;btn.setAttribute('aria-label','Usar item');
 btn.innerHTML='<span class="ic"></span><small class="lb">ITEM</small><span class="cdv"></span>';
 B.appendChild(btn);
 btn.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();usarLocal()});
 return btn;
}
function usarLocal(){
 if(typeof p==='undefined'||!p||!p.item||state!=='fight')return false;
 const ok=window.itemUse(p,p.item.def.idx);
 if(ok===false&&p.item.def.tipo==='ativo'&&p.item.cd>0){try{toast('Item em recarga: '+p.item.cd.toFixed(0)+'s')}catch{}}
 return ok;
}
function hud(){
 const now=performance.now();if(now-hudT<90)return;hudT=now;
 const b=criarBtn();if(!b)return;
 const a=(typeof p!=='undefined')?p:null,it=a&&a.item,show=!!it&&(state==='fight'||state==='count'||state==='paused');
 if(b.hidden===show)b.hidden=!show;
 if(!show)return;
 const d=it.def,ic=b.querySelector('.ic'),lb=b.querySelector('.lb'),cv=b.querySelector('.cdv');
 const key=it.id+(ARTE.has(it.id)?'a':'e');
 if(b.dataset.k!==key){b.dataset.k=key;ic.innerHTML=icone(d);b.style.setProperty('--c',d.cor)}
 let cls='',txt='ITEM',cd='';
 if(d.tipo==='reativo'){cls=it.armed?'armado':'usado';txt=it.armed?'AUTO':'USADO'}
 else if(d.tipo==='uso'){cls=it.used?'usado':'pronto';txt=it.used?'USADO':'ITEM'}
 else{if(it.cd>0){cls='recarga';cd=it.cd>=10?String(Math.ceil(it.cd)):it.cd.toFixed(1);txt='ITEM'}else cls='pronto'}
 const nc='it85-btn '+cls;if(b.className!==nc)b.className=nc;
 if(lb.textContent!==txt)lb.textContent=txt;
 if(cv.textContent!==cd)cv.textContent=cd;
}
document.addEventListener('keydown',e=>{if(e.code==='KeyE'&&!e.repeat&&state==='fight'&&!/INPUT|TEXTAREA/.test(document.activeElement?.tagName||'')){usarLocal()}});

/* ---------------------------------------------------------------- tela do campeão: slot + escolha/compra */
let heroSel=null,itemSel=null;
function slotHtml(hero){const id=eqDe(hero),d=id&&BY[id];return `${icone(d,'slot')}<small>${d?'ITEM':'ITEM'}</small>`}
function atualizaSlot(){const s=$q('#heroDetail .item85-slot');if(s&&heroSel!=null)s.innerHTML=slotHtml(heroSel)}
const prevDetails=openChampionDetails;
openChampionDetails=function(id){
 const r=prevDetails.apply(this,arguments);
 try{
  heroSel=Number(id);
  const el=document.getElementById('heroDetail'),kit=el&&el.querySelector('.hero-kit');
  if(kit&&!kit.querySelector('.item85-slot')){
   const b=document.createElement('button');b.type='button';b.className='item85-slot';b.setAttribute('aria-label','Acessório');b.title='Acessório';
   b.innerHTML=slotHtml(heroSel);kit.appendChild(b);
  }else atualizaSlot();
 }catch(e){console.error('[Eldoria] slot de item',e)}
 return r;
};
function detalhe(){
 const D=$q('#it85Det');if(!D)return;
 const d=itemSel&&BY[itemSel];
 if(!d){D.innerHTML='<p class="it85-hint">Toque em um item para ver o efeito.</p>';return}
 const I=conta(),eq=eqDe(heroSel)===d.id,tm=!!I.tem[d.id];
 let acao;
 if(eq)acao='<button class="it85-btn2 sec" data-it85="remover">Remover do campeão</button>';
 else if(tm)acao=`<button class="it85-btn2 go" data-it85="equipar">Equipar</button>`;
 else if(account.coins>=d.preco)acao=`<button class="it85-btn2 buy" data-it85="comprar">Comprar · ◉ ${d.preco}</button>`;
 else acao=`<button class="it85-btn2 off" disabled>Faltam ◉ ${d.preco-account.coins}</button>`;
 const tipo=d.tipo==='ativo'?`Ativo · recarga ${d.cd} s`:TIPO[d.tipo];
 D.innerHTML=`<div class="it85-head">${icone(d,'big')}<div><b>${esc(d.n)}</b></div></div>
  <div class="it85-chips"><span style="--c:${d.cor}">${RAR[d.rar].n}</span><span>${esc(CAT[d.cat])}</span><span>${esc(tipo)}</span></div>
  <p class="it85-desc">${esc(d.d)}</p><div class="it85-acts">${acao}</div>`;
}
function grade(){
 const I=conta(),G=$q('#itens85 .it85-grid');if(!G)return;
 G.innerHTML=ITENS.map(d=>{const tm=!!I.tem[d.id],eq=eqDe(heroSel)===d.id;
  return `<button type="button" class="it85-cell ${d.rar} ${tm?'tem':'lock'} ${eq?'eq':''} ${itemSel===d.id?'sel':''}" data-it85-item="${d.id}" aria-label="${esc(d.n)}">${icone(d)}<small>${esc(d.n)}</small>${tm?'':`<i>◉ ${d.preco}</i>`}${eq?'<em>✓</em>':''}</button>`}).join('');
 const m=$q('#itens85 .it85-coin');if(m)m.textContent='◉ '+account.coins;
}
function abrir(hero){
 heroSel=Number(hero);conta();itemSel=eqDe(heroSel)||null;
 let M=$q('#itens85');if(M)M.remove();
 M=document.createElement('div');M.id='itens85';M.className='it85';M.setAttribute('role','dialog');M.setAttribute('aria-modal','true');M.setAttribute('aria-label','Acessório do campeão');
 let nome='';try{nome=CHAMPIONS[heroSel].name}catch{}
 M.innerHTML=`<div class="it85-box"><header><b>ACESSÓRIO · ${esc(nome)}</b><span class="it85-coin"></span><button type="button" class="it85-x" data-it85="fechar" aria-label="Fechar">✕</button></header>
  <div class="it85-body"><div class="it85-grid"></div><aside id="it85Det"></aside></div></div>`;
 document.body.appendChild(M);grade();detalhe();
}
function fechar(){const M=$q('#itens85');if(M)M.remove();atualizaSlot()}
document.addEventListener('click',e=>{
 const slot=e.target.closest&&e.target.closest('.item85-slot');
 if(slot){e.preventDefault();e.stopPropagation();abrir(heroSel);return}
 const M=$q('#itens85');if(!M||!M.contains(e.target)){return}
 const cel=e.target.closest('[data-it85-item]');
 if(cel){itemSel=cel.dataset.it85Item;grade();detalhe();return}
 const ac=e.target.closest('[data-it85]');if(!ac)return;
 const a=ac.dataset.it85;
 if(a==='fechar'||e.target===M){fechar();return}
 if(a==='comprar'&&itemSel){if(comprar(itemSel)){try{toast('Item comprado!')}catch{}try{refreshWallet&&refreshWallet()}catch{}}}
 else if(a==='equipar'&&itemSel){equipar(heroSel,itemSel);try{toast('Item equipado!')}catch{}}
 else if(a==='remover'){equipar(heroSel,null)}
 grade();detalhe();atualizaSlot();
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$q('#itens85'))fechar()});

window.ItensV85={ITENS,BY,RAR,conta,tem,eqDe,equipar,comprar,equip,usar,use:usar,abrir,fechar,mod,DEC,AUR,GONE,BRK,SMK,sorteia,botDesejo,IDS:ITENS.map(d=>d.id),icone};
})();
