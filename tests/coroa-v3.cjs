// Disputa da Coroa (4 lutadores) + séries de promoção, rivais com nome e renomeação do KOF.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const pg=await (await br.newContext({viewport:{width:1000,height:450},hasTouch:true})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1');await pg.waitForTimeout(900);await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 // arenas → seleção
 let r=await pg.evaluate(()=>{showArenaModes();const b=document.querySelector('[data-arena-mode="ffa"]');return{name:b?b.closest('article,.arena-mode,div')?.textContent.slice(0,140):null}});
 ok(/Disputa da Coroa/.test(r.name||''),'a lista de Arenas mostra "Disputa da Coroa"');
 await pg.evaluate(()=>document.querySelector('[data-arena-mode="ffa"]').click());await pg.waitForTimeout(500);
 r=await pg.evaluate(()=>({small:document.querySelector('.kx-title small')?.textContent,foe:document.querySelectorAll('.kx-team.right .kx-row').length,rows:document.querySelectorAll('.kx-team.left .kx-row').length}));
 ok(r.small==='DISPUTA DA COROA'&&r.foe===3&&r.rows===1,'seleção: 1 vaga para você e 3 rivais ocultos');
 // início
 await pg.evaluate(()=>document.querySelector('[data-kof-go]').click());await pg.waitForTimeout(900);
 r=await pg.evaluate(()=>{window.requestAnimationFrame=()=>0;return{n:actors.length,teams:actors.map(a=>a.team).join(),hero:actors.every(a=>V3API.isHero(a)),skins:new Set(actors.map(a=>a.skin)).size,cards:document.querySelectorAll('.cs-card').length,enemyHidden:getComputedStyle(document.querySelector('.fighterhud.enemy')).display==='none',time:Math.round(time),sp:V3Modes.special,series:V3Series.state.on}});
 ok(r.n===4&&r.teams==='0,1,2,3'&&r.hero&&r.skins===4&&r.cards===3&&r.enemyHidden&&r.time===120&&r.sp==='crown'&&!r.series,'começa com 4 lutadores de heróis diferentes, cada um num time, placar de 3 rivais e sem rounds');
 // elimina rival com cura
 r=await pg.evaluate(()=>{for(let i=0;i<900&&state!=='fight';i++)step(1/60);const c=actors[2];p.hp=500;c.lastHitBy=p;c.inv=0;c.hp=0;for(let i=0;i<3;i++)step(1/60);return{healed:Math.round(p.hp),order:V3Crown.state.order.length,card:document.querySelectorAll('.cs-card.dead').length,state}});
 ok(r.healed>=640&&r.healed<=660&&r.order===1&&r.card===1&&r.state==='fight','derrubar um rival cura 15% da vida (500 → ~650) e o placar marca o rival caído');
 // último de pé = coroa
 r=await pg.evaluate(()=>{const coins0=account.coins,w0=account.wins;actors[1].hp=0;actors[3].hp=0;for(let i=0;i<3;i++)step(1/60);const mid=state;for(let i=0;i<150;i++)step(1/60);return{mid,state,title:document.getElementById('resultTitle').textContent,coins:account.coins-coins0,wins:account.wins-w0,out:getComputedStyle(document.getElementById('outcome')).display}});
 ok(r.state==='end'&&r.title==='A COROA É SUA!'&&r.coins===150&&r.wins===1&&r.out==='flex','último de pé: A COROA É SUA, +150 moedas e vitória registrada');
 // jogador cai em 3º
 await pg.evaluate(()=>document.getElementById('rematch').click());await pg.waitForTimeout(700);
 r=await pg.evaluate(()=>{for(let i=0;i<900&&state!=='fight';i++)step(1/60);actors[2].hp=0;for(let i=0;i<3;i++)step(1/60);p.inv=0;p.hp=0;for(let i=0;i<3;i++)step(1/60);for(let i=0;i<150;i++)step(1/60);return{title:document.getElementById('resultTitle').textContent,state}});
 ok(r.title==='Terceiro lugar'&&r.state==='end','"Jogar novamente" recomeça; cair depois de um rival dá 3º lugar ('+r.title+','+r.state+')');
 // tempo esgotado
 await pg.evaluate(()=>document.getElementById('rematch').click());await pg.waitForTimeout(700);
 r=await pg.evaluate(()=>{for(let i=0;i<900&&state!=='fight';i++)step(1/60);actors.forEach((a,i)=>a.hp=[900,300,600,100][i]);time=0;for(let i=0;i<150;i++)step(1/60);return{title:document.getElementById('resultTitle').textContent}});
 ok(r.title==='A COROA É SUA!','tempo esgotado: quem tem mais vida leva a coroa');
 // Liga ranqueada
 r=await pg.evaluate(()=>{showScreen('league')});await pg.waitForTimeout(300);
 await pg.click('[data-lg-tab="ffa"]');
 r=await pg.evaluate(()=>({txt:document.querySelector('.lg-side')?.textContent,play:document.querySelector('[data-lg-play]')?.textContent}));
 ok(/1º \+30/.test(r.txt)&&/1º \+30 \/ 4º −20/.test(r.play),'aba Disputa da Coroa mostra os pontos por colocação');
 await pg.click('[data-lg-play]');await pg.waitForTimeout(500);
 ok(await pg.evaluate(()=>V3Liga.state.pending==='ffa'&&document.querySelector('.kx-title small')?.textContent==='DISPUTA DA COROA'),'Lutar na Liga abre a seleção e marca como ranqueada');
 await pg.evaluate(()=>document.querySelector('[data-kof-go]').click());await pg.waitForTimeout(900);
 r=await pg.evaluate(()=>{for(let i=0;i<900&&state!=='fight';i++)step(1/60);const pts0=V3Liga.rec('ffa').points;actors.slice(1).forEach(a=>a.hp=0);for(let i=0;i<4;i++)step(1/60);for(let i=0;i<150;i++)step(1/60);return{ranked:V3Crown.state.ranked,pts:V3Liga.rec('ffa').points-pts0,hist:V3Liga.rec('ffa').hist[0],text:document.getElementById('resultText').textContent,cleared:V3Liga.state.ranked}});
 ok(r.ranked&&r.pts===30&&r.hist.place===1&&/Liga Disputa da Coroa: \+30/.test(r.text)&&r.cleared===null,'luta ranqueada: 1º lugar dá +30 no ranking próprio e aparece no resultado');
 // pontos por colocação
 r=await pg.evaluate(()=>{const x=V3Liga.store().modes.ffa;x.points=100;x.streak=0;x.promo=null;x.shield=0;V3Liga.awardPlacement(2);const a=V3Liga.rec('ffa').points;V3Liga.awardPlacement(3);const b=V3Liga.rec('ffa').points;V3Liga.awardPlacement(4);const c=V3Liga.rec('ffa').points;return{a,b,c}});
 ok(r.a===115&&r.b===110&&r.c===90,`2º +15, 3º −5, 4º −20 (${r.a},${r.b},${r.c})`);
 // série de promoção
 r=await pg.evaluate(()=>{const x=V3Liga.store().modes['2v2'];account.league.points=0;x.points=70;x.streak=0;x.promo=null;x.shield=0;
  const out={};const win=()=>V3Liga.settleMode('2v2',{win:true,draw:false,delta:20,streakWin:true});const lose=()=>V3Liga.settleMode('2v2',{win:false,draw:false,delta:-8});
  win();out.capped=x.points;out.promo=JSON.stringify(x.promo);
  win();out.s1=JSON.stringify(x.promo);const t=win();out.up=x.points;out.shield=x.shield;out.noPromo=x.promo===null;out.text=/PROMOÇÃO para Prata/.test(t);
  lose();out.afterShield=x.points;      // protegida: não cai abaixo de 75
  // série perdida
  x.points=74;x.promo=null;x.shield=0;win();   // abre série? 74+20>=75 → sim
  lose();lose();out.lost=x.points;out.lostPromo=x.promo===null;
  return out});
 ok(r.capped===74&&r.promo==='{"target":1,"w":0,"l":0}'&&r.up===75&&r.shield===2&&r.noPromo&&r.text,'série de promoção: ao passar de 75 fica em 74 e abre melhor de 3; vencer 2 promove para Prata');
 ok(r.afterShield===75&&r.lost===50&&r.lostPromo,`proteção após subir (não cai de divisão) e série perdida volta uma subdivisão (${r.afterShield}, ${r.lost})`);
 // rivais com nome e renomeação
 r=await pg.evaluate(()=>{showScreen('league');return 0});await pg.waitForTimeout(200);
 await pg.click('[data-lg-tab="2v2"]');
 const rv=await pg.evaluate(()=>document.querySelector('.lg-side')?.textContent);
 ok(/Rival da divisão: (Dupla do Pátio|Irmãos da Aurora)/.test(rv),'Duplas tem rival com nome por divisão');
 await pg.click('[data-lg-tab="kof"]');
 ok(/Rival da divisão: (Trio Iniciante|Esquadrão da Aurora)/.test(await pg.evaluate(()=>document.querySelector('.lg-side')?.textContent)),'Trio tem rival com nome por divisão');
 const kofText=await pg.evaluate(()=>{V3Kof.open();const t=document.body.innerText;const lab=document.querySelector('.kx-title small')?.textContent;showArenaModes();return{lab,anyKof:/\bKOF\b/.test(document.body.innerText)||/\bKOF\b/.test(t)}});
 ok(kofText.lab==='TRIO DE CAMPEÕES · 3×3'&&!kofText.anyKof,'o nome "KOF" não aparece mais no jogo (agora Trio de Campeões)');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,2));
 await br.close();
})();
