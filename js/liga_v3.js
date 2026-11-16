'use strict';
/*
 * Liga v3 — ranqueada com um ranking POR MODO e temporadas de 4 semanas.
 * Modos: 1×1, Duplas (2×2), Trio (3 lutadores) e Disputa da Coroa (todos contra todos, 4 jogadores; em breve).
 * - Pontos por modo: 1×1 +25/−10 · Duplas +20/−8 · Trio +30/−12 · empate 0. Sequência de vitórias dá +5 por vitória seguida (até +15).
 * - Divisões a cada 75 pontos (Bronze…Mestre), com subdivisões III · II · I de 25 em 25.
 * - Temporada de 4 semanas (começa numa segunda-feira): no fim paga moedas pela divisão de cada modo e reduz os pontos pela metade.
 * - O 1×1 continua usando account.league (pontos/vitórias/partidas); os outros modos ficam em account.liga.modes.
 * - A Liga sempre usa atributos nivelados (sem bônus de nível da campanha).
 */
(function(){
if(!window.COMBAT_V3||!window.V3Kof)return;
const $q=s=>document.querySelector(s);
const MODES=[
 {id:'1v1',name:'1×1',long:'Duelo 1×1',win:25,loss:10,kind:'league'},
 {id:'2v2',name:'Duplas',long:'Duplas 2×2',win:20,loss:8,kind:'2v2'},
 {id:'kof',name:'Trio',long:'Trio de campeões 3×3',win:30,loss:12,kind:'kof'},
 {id:'ffa',name:'Disputa da Coroa',long:'Disputa da Coroa · 4 lutadores',win:30,loss:20,kind:'crown'}
];
const MODE=Object.fromEntries(MODES.map(m=>[m.id,m]));
const SEASON_WEEKS=4,PTS_PER_DIV=75,SUB_PTS=25;
const SEASON_COINS=[150,300,500,800,1200,1800];       // por modo jogado, conforme a divisão final
const HIST_MAX=8;
const R={pending:null,ranked:null};
let tab='1v1';

/* ---------- dados ---------- */
function store(){
 if(!account.liga)account.liga={season:seasonIndex(),modes:{},past:[],report:null};
 const L=account.liga;L.modes=L.modes||{};
 for(const m of MODES)L.modes[m.id]=L.modes[m.id]||{points:0,wins:0,matches:0,streak:0,best:0,hist:[],played:0};
 return L;
}
function rec(id){
 const L=store(),m=L.modes[id];
 if(id==='1v1'){const l=account.league||(account.league={points:0,wins:0,matches:0});return{points:l.points,wins:l.wins,matches:l.matches,streak:m.streak,best:m.best,hist:m.hist,played:m.played}}
 return m;
}
function setPoints(id,pts){if(id==='1v1')account.league.points=pts;else store().modes[id].points=pts}
const divOf=pts=>Math.min(5,Math.floor(pts/PTS_PER_DIV));
const subOf=(pts,div)=>div>=5?'':['III','II','I'][Math.min(2,Math.floor((pts%PTS_PER_DIV)/SUB_PTS))];
const rankName=pts=>{const d=divOf(pts);return LEAGUE_DIVISIONS[d]+(subOf(pts,d)?' '+subOf(pts,d):'')};

/* ---------- temporada (4 semanas, começa na segunda-feira) ---------- */
function seasonIndex(now=Date.now()){return Math.floor(weekIndex(now)/SEASON_WEEKS)}
const SEASON_ANCHOR=seasonIndex(Date.UTC(2026,10,16,12));      // a 1ª temporada é a que contém 16/11/2026
const seasonNo=n=>Math.max(1,n-SEASON_ANCHOR+1);
function seasonEnd(now=Date.now()){
 const w=(seasonIndex(now)+1)*SEASON_WEEKS,days=w*7-3,u=new Date(days*864e5);
 return new Date(u.getUTCFullYear(),u.getUTCMonth(),u.getUTCDate()).getTime();
}
function rolloverSeason(){
 const L=store(),cur=seasonIndex();
 if(L.season===cur)return false;
 const rows=[];let coins=0;
 for(const m of MODES){
  if(m.soon)continue;
  const r=rec(m.id),d=divOf(r.points),played=(L.modes[m.id].played||0)>0;
  const reward=played?SEASON_COINS[d]:0;coins+=reward;
  rows.push({mode:m.id,name:m.long,rank:rankName(r.points),reward});
  setPoints(m.id,Math.floor(r.points/2));
  const x=L.modes[m.id];x.streak=0;x.played=0;
 }
 L.past=[{n:L.season,rows,coins},...(L.past||[])].slice(0,6);
 L.report={n:L.season,rows,coins};
 L.season=cur;
 account.coins=(account.coins||0)+coins;
 try{saveAccount()}catch{}
 return true;
}

/* ---------- pontuação (substitui o acerto da liga antiga) ---------- */
const FFA_PTS=[30,15,-5,-20];                          // Disputa da Coroa: pontos por colocação
const RIVALS={                                         // rivais com nome (por divisão) de Duplas e Trio
 '2v2':['Dupla do Pátio','Irmãos da Aurora','Maré e Tempestade','Inverno e Chama','Guardiões Gêmeos','Herdeiros do Eclipse'],
 kof:['Trio Iniciante','Esquadrão da Aurora','Legião das Marés','Trio do Inverno','Muralha Prismática','Coroa do Eclipse']
};
// Aplica um resultado ao ranking do modo. delta já vem calculado (vitória/derrota/colocação); a promoção de divisão exige uma série (melhor de 3).
function settleMode(id,o){
 rolloverSeason();
 const m=MODE[id],x=store().modes[id],r=rec(id),old=r.points,d0=divOf(old);
 const sign=o.draw?0:o.win?1:-1;
 let pts=old,txt='',change;
 if(o.streakWin){x.streak=(x.streak||0)+1;x.best=Math.max(x.best||0,x.streak)}else if(!o.draw&&!o.keepStreak)x.streak=0;
 if(x.promo){                                          // série de promoção em andamento: só conta vitórias e derrotas
  if(sign>0)x.promo.w++;else if(sign<0)x.promo.l++;
  const t=x.promo.target;
  if(x.promo.w>=2){pts=t*PTS_PER_DIV;x.shield=2;txt=` Série vencida: PROMOÇÃO para ${LEAGUE_DIVISIONS[t]}!`;x.promo=null}
  else if(x.promo.l>=2){pts=t*PTS_PER_DIV-SUB_PTS;txt=` Série perdida (${rankName(pts)}). Tente de novo no próximo duelo.`;x.promo=null}
  else txt=` Série de promoção para ${LEAGUE_DIVISIONS[t]}: ${x.promo.w} × ${x.promo.l}. Vença 2 de 3!`;
 }else{
  let delta=o.delta;
  pts=Math.max(0,Math.min(9999,old+delta));
  if(delta<0&&x.shield>0){pts=Math.max(pts,d0*PTS_PER_DIV);x.shield--}   // proteção logo depois de subir
  if(d0<5&&pts>=(d0+1)*PTS_PER_DIV){pts=(d0+1)*PTS_PER_DIV-1;x.promo={target:d0+1,w:0,l:0};txt=` Você chegou ao topo de ${LEAGUE_DIVISIONS[d0]}: série de promoção para ${LEAGUE_DIVISIONS[d0+1]} (melhor de 3)!`}
 }
 setPoints(id,pts);
 if(id==='1v1'){const l=account.league;l.matches++;if(sign>0)l.wins++}else{x.matches++;if(sign>0)x.wins++}
 x.played=(x.played||0)+1;
 change=pts-old;
 x.hist=[{win:sign>0,draw:!!o.draw,d:change,place:o.place||0,promo:!!x.promo,t:Date.now()},...(x.hist||[])].slice(0,HIST_MAX);
 const after=divOf(pts);
 const base=` Liga ${m.name}: ${change>0?'+':''}${change} pontos · ${rankName(pts)} (${pts} pts)${x.streak>=2&&sign>0?` · sequência de ${x.streak}`:''}.`;
 return base+txt+(after<d0?' Você caiu de divisão; recupere no próximo duelo.':'');
}
const prevSettle=settleLeague;
settleLeague=function(win,draw){
 const id=battleActivity==='league'?'1v1':R.ranked;
 if(!id)return prevSettle.apply(this,arguments);
 if(id==='1v1'){if(!leagueMatch||leagueMatch.settled)return '';leagueMatch.settled=true}
 else R.ranked=null;
 const m=MODE[id],x=store().modes[id];
 let delta=0;
 if(!draw&&win)delta=m.win+Math.min(15,5*Math.max(0,(x.streak||0)));   // bônus por vitórias seguidas
 else if(!draw)delta=-m.loss;
 return settleMode(id,{win:!!win&&!draw,draw:!!draw,delta,streakWin:!!win&&!draw});
};
// Disputa da Coroa: pontos pela colocação (1º +30 · 2º +15 · 3º −5 · 4º −20)
function awardPlacement(place){
 const x=store().modes.ffa,first=place===1;
 const bonus=first?Math.min(15,5*Math.max(0,x.streak||0)):0;
 return settleMode('ffa',{win:place<=2,draw:false,delta:FFA_PTS[place-1]+bonus,place,streakWin:first,keepStreak:place===2});
}

/* ---------- entrar numa luta ranqueada ---------- */
function play(id){
 const m=MODE[id];if(!m||m.soon)return;
 if(id==='1v1'){lobbyPrefs.mode='league';V3Kof.open('league')}
 else if(id==='2v2'){lobbyPrefs.mode='2v2';V3Kof.open('2v2')}
 else if(id==='ffa')V3Kof.open('crown');
 else V3Kof.open('kof');
 R.pending=id;         // depois de abrir (abrir limpa o resto); a luta vira ranqueada ao começar
}
const prevStart=start;
start=function(){
 const r=prevStart.apply(this,arguments);
 if(R.pending&&R.pending!=='1v1'){R.ranked=R.pending}else R.ranked=null;
 R.pending=null;
 return r;
};
const prevShow=showScreen;
showScreen=function(){R.pending=null;if(state!=='fight'&&state!=='count'&&state!=='paused')R.ranked=null;return prevShow.apply(this,arguments)};

/* ---------- tela ---------- */
const fmt=n=>Number(n||0).toLocaleString('pt-BR');
function remaining(){const ms=Math.max(0,seasonEnd()-Date.now()),d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5);return d>0?`${d}d ${h}h`:`${h}h`}
function tabsHtml(){return `<div class="lg-tabs" role="tablist">${MODES.map(m=>`<button role="tab" class="${m.id===tab?'on':''} ${m.soon?'soon':''}" data-lg-tab="${m.id}" ${m.soon?'aria-disabled="true"':''}>${m.name}${m.soon?'<small>em breve</small>':''}</button>`).join('')}</div>`}
function bodyHtml(){
 const m=MODE[tab];
 if(m.soon)return `<div class="lg-soon"><h2>Disputa da Coroa</h2><p>Todos contra todos com 4 jogadores em uma arena: cada um por si, e só um leva a coroa. Ranking próprio, com pontos por colocação. <b>Em breve.</b></p></div>`;
 const r=rec(tab),d=divOf(r.points),sub=subOf(r.points,d),next=d>=5?null:LEAGUE_DIVISIONS[d+1],into=d>=5?100:Math.round((r.points%PTS_PER_DIV)/PTS_PER_DIV*100);
 const hist=(r.hist||[]).map(h=>`<li class="${h.draw?'d':h.win?'w':'l'}"><b>${h.place?h.place+'º':h.draw?'=':h.win?'V':'D'}</b><span>${h.promo||h.d===0&&!h.draw?'série':(h.d>0?'+':'')+h.d+' pts'}</span></li>`).join('')||'<li class="none">Nenhuma luta ainda nesta temporada.</li>';
 const rival=tab==='1v1'&&typeof currentLeagueRival==='function'?currentLeagueRival():null;
 const named=RIVALS[tab]?RIVALS[tab][d]:null,promo=store().modes[tab].promo;
 const reward=SEASON_COINS[d];
 return `<div class="lg-body">
  ${promo?`<div class="lg-promo">SÉRIE DE PROMOÇÃO para ${LEAGUE_DIVISIONS[promo.target]} · melhor de 3 · ${promo.w} × ${promo.l}</div>`:''}<section class="lg-rank"><div class="lg-emblem" data-div="${d}">${lobbyEmblem(d)}</div><div class="lg-rank-txt"><span class="eyebrow">${m.long.toUpperCase()}</span><h2>${LEAGUE_DIVISIONS[d]}${sub?` <em>${sub}</em>`:''}</h2><div class="lg-bar"><i style="width:${into}%"></i></div><small>${r.points} pts${next?` · ${PTS_PER_DIV-(r.points%PTS_PER_DIV)} para ${next}`:' · divisão máxima'}</small></div></section>
  <section class="lg-stats"><div><b>${r.wins}</b><span>vitórias</span></div><div><b>${Math.max(0,r.matches-r.wins)}</b><span>derrotas</span></div><div><b>${r.streak||0}</b><span>sequência</span></div><div><b>${r.best||0}</b><span>melhor seq.</span></div></section>
  <section class="lg-side"><h3>Últimas lutas</h3><ul class="lg-hist">${hist}</ul>${rival?`<p class="lg-rival"><b>Rival da divisão:</b> ${escapeHTML(rival.name)} · ${escapeHTML(rival.style)}</p>`:''}${named?`<p class="lg-rival"><b>Rival da divisão:</b> ${escapeHTML(named)}</p>`:''}${tab==='ffa'?'<p class="lg-rival"><b>Pontos:</b> 1º +30 · 2º +15 · 3º −5 · 4º −20</p>':''}</section>
  <footer class="lg-foot"><div class="lg-reward">🪙 Fim da temporada: <b>${fmt(reward)}</b> moedas se você terminar em ${LEAGUE_DIVISIONS[d]}</div><button class="gold lg-play" data-lg-play>${promo?'Lutar · série de promoção':tab==='ffa'?'Lutar · 1º +30 / 4º −20':`Lutar · +${m.win} / −${m.loss}`}</button></footer></div>`;
}
function render(){
 if(rolloverSeason()){/* relatório aparece abaixo */}
 const L=store();
 $q('#leagueScreen').innerHTML=`<div class="lg"><header class="lg-head"><button class="ghost" data-nav="home">← Início</button><div><span class="eyebrow">RANQUEADA</span><h1>Liga</h1></div><div class="lg-season" title="A temporada dura 4 semanas e começa numa segunda-feira">Temporada ${seasonNo(L.season)}<small>termina em ${remaining()}</small></div></header>${tabsHtml()}${bodyHtml()}</div>`;
 if(L.report){const rp=L.report;L.report=null;try{saveAccount()}catch{}
  const m=document.createElement('div');m.id='ljModal';m.className='lj-modal';
  m.innerHTML=`<div class="lj-dialog" role="dialog" aria-modal="true"><span class="lj-gift-tag">TEMPORADA ${seasonNo(rp.n)} ENCERRADA</span><h2>Recompensas</h2>${rp.rows.map(r=>`<p><b>${r.name}</b>: ${r.rank} · ${r.reward?`+${fmt(r.reward)} 🪙`:'sem lutas'}</p>`).join('')}<p>Total: <b>+${fmt(rp.coins)} 🪙</b>. Seus pontos caíram pela metade na nova temporada.</p><button class="gold" data-lj-close>Continuar</button></div>`;
  document.body.appendChild(m)}
}
renderLeague=render;

document.addEventListener('click',e=>{
 const t=e.target.closest('[data-lg-tab]');
 if(t&&appScreen==='league'){e.stopImmediatePropagation();if(MODE[t.dataset.lgTab].soon){try{toast('Disputa da Coroa chega em breve.')}catch{}return}tab=t.dataset.lgTab;render();return}
 if(e.target.closest('[data-lg-play]')){e.stopImmediatePropagation();play(tab);return}
},true);

window.V3Liga={awardPlacement,settleMode,RIVALS,seasonNo,MODES,rec,divOf,subOf,rankName,seasonIndex,seasonEnd,rolloverSeason,play,render,state:R,store};
try{store();rolloverSeason()}catch(e){console.error('[Eldoria] liga',e)}
})();
