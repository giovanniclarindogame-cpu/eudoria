// Disputa da Coroa (regras novas): cantos, coroa no meio, pegar encostando, passa para quem derruba, cai no chão sem autor, volta ao canto em 4 s,
// vence quem está com a coroa no fim dos 3 minutos. Modo offline (3 bots).
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const errs=[];
 const pg=await (await br.newContext({viewport:{width:900,height:480}})).newPage();pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1&semcarga=1');await pg.waitForTimeout(900);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Coroa');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2000);
 await pg.evaluate(()=>{document.querySelector('#ljModal')?.remove();try{RetQA.set({tutorial:true})}catch{}});
 await pg.evaluate(()=>V3Crown.begin());await pg.waitForTimeout(300);
 const s0=await pg.evaluate(()=>{const C=V3Crown.state;return{n:C.players.length,time,crown:[Math.round(C.crown.x),Math.round(C.crown.y)],W,H,holder:C.crown.holder,pos:C.players.map(a=>[Math.round(a.x/W*10)/10,Math.round(a.y/H*10)/10]),cards:document.querySelectorAll('.cs-card').length}});
 ok(s0.n===4&&s0.time===180&&s0.cards===4,`4 lutadores, tempo de 3 minutos (${s0.time}s) e 4 cartões no placar`);
 ok(Math.abs(s0.crown[0]-s0.W/2)<2&&Math.abs(s0.crown[1]-s0.H/2)<2&&!s0.holder,'a coroa começa no meio da arena, sem dono');
 ok(JSON.stringify(s0.pos)==='[[0.2,0.3],[0.8,0.3],[0.2,0.7],[0.8,0.7]]','cada um começa num canto');
 const run=(n)=>pg.evaluate(n=>{for(let i=0;i<n;i++)step(1/30)},n);
 await pg.evaluate(()=>{state='fight';count=0;for(const a of V3Crown.state.players)a.inv=99});
 await run(10);
 ok(await pg.evaluate(()=>!V3Crown.state.crown.holder),'longe da coroa ninguém a pega');
 // o jogador encosta na coroa
 await pg.evaluate(()=>{const C=V3Crown.state;p.x=C.crown.x+10;p.y=C.crown.y;for(const a of C.players)if(a!==p){a.x=40;a.y=40}});
 await run(3);
 ok(await pg.evaluate(()=>V3Crown.state.crown.holder===p&&document.querySelector('.cs-card.holder[data-i="0"]')!==null),'quem encosta primeiro fica com a coroa (aparece no placar, coroa sobre a cabeça)');
 await run(60);
 ok(await pg.evaluate(()=>V3Crown.state.hold[0]>1.5),'o tempo com a coroa conta para o dono');
 // um rival derruba o dono: a coroa passa para ele
 await pg.evaluate(()=>{const C=V3Crown.state,r=C.players[1];r.x=500;r.y=300;r.inv=0;p.inv=0;p.lastHitBy=r;p.hp=0});
 await run(3);
 ok(await pg.evaluate(()=>V3Crown.state.crown.holder===V3Crown.state.players[1]&&V3Crown.state.kills[1]===1),'quando o dono cai, a coroa passa para quem derrubou (e conta a queda)');
 // ele morre sem autor: a coroa cai onde ele estava
 await pg.evaluate(()=>{const C=V3Crown.state,r=C.players[1];r.lastHitBy=null;r.x=600;r.y=250;r.hp=0});
 await run(3);
 const dr=await pg.evaluate(()=>{const C=V3Crown.state;return{h:C.crown.holder,x:Math.round(C.crown.x),y:Math.round(C.crown.y)}});
 ok(!dr.h&&Math.abs(dr.x-600)<3&&Math.abs(dr.y-250)<3,'se o dono cai sem autor, a coroa fica no chão onde ele estava');
 // quem caiu volta ao canto em 4 s com a vida cheia
 await run(130);
 const rv=await pg.evaluate(()=>{const C=V3Crown.state,a=C.players[1];return{hp:Math.round(a.hp),x:Math.round(a.x),y:Math.round(a.y),home:C.home[1].map(Math.round)}});
 ok(rv.hp===1000&&Math.abs(rv.x-rv.home[0])<80&&Math.abs(rv.y-rv.home[1])<80,`depois de 4 s o lutador volta ao seu canto com a vida cheia (${JSON.stringify(rv)})`);
 // fim do tempo: quem estiver com a coroa vence
 await pg.evaluate(()=>{const C=V3Crown.state;p.hp=1000;p.cwDead=false;C.crown.holder=C.players[2];C.hold[2]=5;time=0.05;for(const a of C.players)a.inv=99});
 await run(40);
 const fim=await pg.evaluate(()=>({out:getComputedStyle(document.querySelector('#outcome')).display,t:document.querySelector('#resultTitle').textContent,tx:document.querySelector('#resultText').textContent}));
 ok(fim.out!=='none'&&!/COROA É SUA/.test(fim.t)&&/ficou com/.test(fim.tx),`no fim do tempo vence quem tem a coroa (você vê: "${fim.t}" · ${fim.tx.slice(0,48)})`);
 // recomeça e vence com a coroa
 await pg.evaluate(()=>V3Crown.begin());await pg.waitForTimeout(300);
 await pg.evaluate(()=>{state='fight';count=0;for(const a of V3Crown.state.players)a.inv=99;const C=V3Crown.state;p.x=C.crown.x;p.y=C.crown.y;for(const a of C.players)if(a!==p){a.x=40;a.y=40}});
 await run(5);await pg.evaluate(()=>{time=0.05});await run(40);
 const v2=await pg.evaluate(()=>({t:document.querySelector('#resultTitle').textContent,st:document.querySelector('#stats').textContent}));
 ok(/COROA É SUA/.test(v2.t),`terminando com a coroa você vence ("${v2.t}" · ${v2.st})`);
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,3));
 await br.close();
})();
