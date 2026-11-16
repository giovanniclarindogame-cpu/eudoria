// Liga v3: ranking por modo, pontos, sequência, subdivisões, histórico, temporada de 4 semanas e entrada ranqueada.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const pg=await (await br.newContext({viewport:{width:1000,height:450},hasTouch:true})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1');await pg.waitForTimeout(900);await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 // tela e abas
 await pg.evaluate(()=>showScreen('league'));await pg.waitForTimeout(500);
 let r=await pg.evaluate(()=>({tabs:[...document.querySelectorAll('[data-lg-tab]')].map(b=>b.dataset.lgTab),soon:document.querySelector('[data-lg-tab="ffa"]').classList.contains('soon'),title:document.querySelector('.lg-head h1')?.textContent,season:document.querySelector('.lg-season')?.textContent,play:document.querySelector('[data-lg-play]')?.textContent}));
 ok(r.tabs.join()==='1v1,2v2,kof,ffa'&&r.soon&&r.title==='Liga'&&/Temporada 1/.test(r.season)&&/\+25/.test(r.play),'tela da Liga: abas 1×1, Duplas, Trio e Disputa da Coroa (em breve); temporada 1; botão mostra +25/−10');
 // pontuação por modo (cada modo com seu ranking)
 r=await pg.evaluate(()=>{const out={};const sim=(mode,win,draw)=>{if(mode==='1v1'){battleActivity='league';leagueMatch={index:0,settled:false}}else{battleActivity='casual';V3Liga.state.ranked=mode}return settleLeague(win,draw)};
  account.league.points=0;
  sim('1v1',true,false);out.a=V3Liga.rec('1v1').points;                      // +25
  sim('1v1',true,false);out.b=V3Liga.rec('1v1').points;                      // +25+5 = 55
  sim('1v1',true,false);out.c=V3Liga.rec('1v1').points;                      // +25+10 = 90
  sim('1v1',false,false);out.d=V3Liga.rec('1v1').points;                     // -10 = 80
  sim('1v1',false,true);out.e=V3Liga.rec('1v1').points;                      // empate = 80
  sim('2v2',true,false);out.f=V3Liga.rec('2v2').points;                      // +20
  sim('kof',true,false);out.g=V3Liga.rec('kof').points;                      // +30
  sim('kof',false,false);out.h=V3Liga.rec('kof').points;                     // -12 = 18
  sim('2v2',false,false);sim('2v2',false,false);out.i=V3Liga.rec('2v2').points;   // 20-8-8 = 4
  sim('2v2',false,false);sim('2v2',false,false);out.j=V3Liga.rec('2v2').points;   // nunca abaixo de 0
  out.ranked=V3Liga.state.ranked;out.one=V3Liga.rec('1v1').points;
  return out});
 ok(r.a===25&&r.b===55&&r.c===90&&r.d===80&&r.e===80,`1×1: +25, depois bônus de sequência (+30, +35), derrota −10, empate 0 (${r.a},${r.b},${r.c},${r.d},${r.e})`);
 ok(r.f===20&&r.g===30&&r.h===18&&r.i===4&&r.j===0&&r.one===80,`cada modo tem seu ranking: Duplas +20/−8, Trio +30/−12, mínimo 0, o 1×1 não mistura (${r.f},${r.g},${r.h},${r.i},${r.j})`);
 ok(r.ranked===null,'a marca de luta ranqueada é limpa depois de pontuar');
 // subdivisões e histórico
 r=await pg.evaluate(()=>({n:[0,24,25,49,50,74,75,150,374,375,9999].map(p=>V3Liga.rankName(p)),hist:V3Liga.rec('1v1').hist.length,first:V3Liga.rec('1v1').hist[0]}));
 ok(r.n.join('|')==='Bronze III|Bronze III|Bronze II|Bronze II|Bronze I|Bronze I|Prata III|Ouro III|Diamante I|Mestre|Mestre'&&r.hist===5&&r.first.draw===true,'divisões com subdivisões III/II/I a cada 25 pontos; histórico guarda as últimas lutas');
 // temporada: fim paga moedas por modo e corta os pontos pela metade
 r=await pg.evaluate(()=>{const L=V3Liga.store();account.coins=0;L.season=V3Liga.seasonIndex()-1;
  account.league.points=160;L.modes['1v1'].played=3;      // Ouro (índice 2) → 500
  L.modes['2v2'].points=80;L.modes['2v2'].played=2;       // Prata (índice 1) → 300
  L.modes['kof'].points=300;L.modes['kof'].played=0;      // não jogou → 0
  const changed=V3Liga.rolloverSeason();
  return{changed,coins:account.coins,p1:account.league.points,p2:L.modes['2v2'].points,pk:L.modes.kof.points,season:L.season===V3Liga.seasonIndex(),report:!!L.report,again:V3Liga.rolloverSeason()}});
 ok(r.changed&&r.coins===800&&r.p1===80&&r.p2===40&&r.pk===150&&r.season&&r.report&&!r.again,`virada de temporada: paga 500 (Ouro 1×1) + 300 (Prata Duplas), quem não jogou não ganha, pontos caem pela metade (${r.coins} moedas)`);
 await pg.evaluate(()=>showScreen('league'));await pg.waitForTimeout(500);
 r=await pg.evaluate(()=>({modal:/TEMPORADA/.test(document.querySelector('#ljModal .lj-gift-tag')?.textContent||''),gone:!V3Liga.store().report}));
 ok(r.modal&&r.gone,'ao abrir a Liga aparece o resumo da temporada encerrada (uma vez só)');
 await pg.click('[data-lj-close]');
 // duração: 4 semanas
 r=await pg.evaluate(()=>{const e=V3Liga.seasonEnd(),n=Date.now(),d=(e-n)/864e5;const d0=new Date(e);return{d:d>0&&d<=28.1,mon:d0.getDay()===1,sameWeekly:V3Liga.seasonIndex(Date.now())===V3Liga.seasonIndex(Date.now()+864e5)||true}});
 ok(r.d&&r.mon,'a temporada termina numa segunda-feira, em até 28 dias');
 // entrada ranqueada
 for(const [tab,expect] of [['2v2','2v2'],['kof','kof']]){
  await pg.evaluate(()=>showScreen('league'));await pg.waitForTimeout(300);
  await pg.click(`[data-lg-tab="${tab}"]`);await pg.click('[data-lg-play]');await pg.waitForTimeout(500);
  r=await pg.evaluate(()=>({kx:!!document.querySelector('.kx')&&!document.getElementById('modeScreen').hidden,pending:V3Liga.state.pending,title:document.querySelector('.kx-title h1')?.textContent}));
  ok(r.kx&&r.pending===expect,`aba ${tab}: Lutar abre a seleção e marca a luta como ranqueada (${r.title})`);
  if(tab==='2v2'){
   await pg.click('[data-kof-go]');await pg.waitForTimeout(900);
   r=await pg.evaluate(()=>({ranked:V3Liga.state.ranked,mode:matchMode}));
   ok(r.ranked==='2v2'&&r.mode==='2v2','a luta de Duplas começa ranqueada');
  }
 }
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,2));
 await br.close();
})();
