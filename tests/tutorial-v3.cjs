// Tutorial do fantoche: parte 1 (fantoche parado), transição, parte 2 (fantoche revida com 4 ataques), derrota/retry e conclusão.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const pg=await (await br.newContext({viewport:{width:1000,height:450}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1');await pg.waitForTimeout(900);await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 // oferta automática desligada em ?allheroes=1; abre manualmente
 let r=await pg.evaluate(()=>{window.requestAnimationFrame=()=>0;account.coins=0;V3Tutorial.start();const T=V3Tutorial.state;
  return{on:T.on,phase:T.phase,dummy:b.trainingDummy&&b.hp===450,series:V3Series.state.on,sp:V3Modes.special,box:!document.getElementById('tutBox').hidden,mode:matchMode,act:battleActivity}});
 ok(r.on&&r.phase===1&&r.dummy&&!r.series&&r.sp==='tutorial'&&r.box&&r.mode==='1v1'&&r.act==='casual','parte 1 começa: fantoche com 450 de vida, sem rounds, caixa de dicas visível');
 // passa a contagem e confere que o fantoche fica parado
 r=await pg.evaluate(()=>{for(let i=0;i<200;i++)step(1/60);const x0=b.x,y0=b.y,hp0=p.hp;for(let i=0;i<180;i++){ai(1/60,b);step(1/60)}return{state,moved:Math.hypot(b.x-x0,b.y-y0),taken:hp0-p.hp,zones:zones.length}});
 ok(r.state==='fight'&&r.moved<1&&r.taken===0&&r.zones===0,'na parte 1 o fantoche fica parado e não ataca');
 // derruba o fantoche
 r=await pg.evaluate(()=>{b.inv=0;p.x=b.x-60;p.y=b.y;hit(b,9999,p,0,0,0);for(let i=0;i<6;i++)step(1/60);const T=V3Tutorial.state;return{trans:T.trans,death:b.tutDeath!==undefined,state,finished:state==='end'}});
 ok(r.trans===1&&r.death&&!r.finished,'dummy derrotado: toca a animação de queda e a luta NÃO termina sozinha');
 // transição para a parte 2
 r=await pg.evaluate(()=>{for(let i=0;i<200;i++)step(1/60);const T=V3Tutorial.state;return{phase:T.phase,hp:b.hp,max:b.max,php:p.hp===p.max,state,dead:b.tutDeath}});
 ok(r.phase===2&&r.hp===900&&r.php&&r.dead===undefined,'"Você está preparado": parte 2 começa com o fantoche revivido (900) e o jogador com vida cheia');
 // ataques do fantoche
 const atk=await pg.evaluate(()=>{for(let i=0;i<260;i++)step(1/60);window.__seen={zones:0,shots:0,charge:0,areas:0};
  const oShot=shot,oArea=area;let lines=0,circles=0;
  shot=function(){__seen.shots++;return oShot.apply(this,arguments)};area=function(o){if(o===b)__seen.areas++;return oArea.apply(this,arguments)};
  p.hp=p.max=1e6;let took=0,last=p.hp;const kinds=new Set();
  for(let i=0;i<60*70;i++){ai(1/60,b);step(1/60);for(const z of zones)if(z.owner===b){kinds.add(z.kind==='line'?(z.len>300?'pedra':'investida'):(z.r>100?'giro':'pancada'))}
   if(b.tutCharge)__seen.charge++;if(p.hp<last){took+=last-p.hp}last=p.hp;
   // mantém o jogador por perto, às vezes longe, para o fantoche usar todos os ataques
   if(i%420===0){p.x=b.x-(i%840?260:70);p.y=b.y}}
  shot=oShot;area=oArea;
  return{kinds:[...kinds],took,seen:__seen}});
 ok(atk.kinds.length>=4,`fantoche usa os 4 ataques com aviso no chão (${atk.kinds.join(', ')})`);
 ok(atk.took>0&&atk.seen.shots>0&&atk.seen.areas>0&&atk.seen.charge>0,`os ataques causam dano de verdade (pancada/giro por área, pedra por projétil, investida) · dano recebido ${Math.round(atk.took)}`);
 // derrota do jogador → tenta de novo
 r=await pg.evaluate(()=>{p.hp=p.max=1000;p.inv=0;hit(p,9999,b,0,0,0);for(let i=0;i<5;i++)step(1/60);const t1=V3Tutorial.state.trans;for(let i=0;i<220;i++)step(1/60);const T=V3Tutorial.state;return{t1,phase:T.phase,hp:b.hp,php:p.hp===p.max,on:T.on}});
 ok(r.t1===3&&r.phase===2&&r.hp===900&&r.php&&r.on,'se o jogador cair, o tutorial recomeça a parte 2 sem punição');
 // vitória final
 r=await pg.evaluate(()=>{for(let i=0;i<200;i++)step(1/60);b.inv=0;hit(b,9999,p,0,0,0);for(let i=0;i<6;i++)step(1/60);const t=V3Tutorial.state.trans;for(let i=0;i<260;i++)step(1/60);return{t,on:V3Tutorial.state.on,done:account.tutorialDone,coins:account.coins,home:appScreen,modal:!!document.querySelector('#ljModal'),box:document.getElementById('tutBox').hidden}});
 ok(r.t===2&&!r.on&&r.done===true&&r.coins===300&&r.home==='home'&&r.modal&&r.box,'vencer a parte 2 conclui: +300 moedas, tutorialDone, volta ao início com a janelinha de parabéns');
 // pular
 r=await pg.evaluate(()=>{account.tutorialDone=false;document.getElementById('ljModal')?.remove();return 0});
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,2));
 await br.close();
})();
