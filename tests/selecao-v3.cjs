// Tela de seleção estilo KOF também para Duelo 1×1, Equipes 2×2 e Liga offline.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const p=await (await br.newContext({viewport:{width:1000,height:450},hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const boot=async()=>{await p.goto('http://localhost:8000/index.html?allheroes=1');await p.waitForTimeout(900);
  const en=p.getByText('ENTRAR',{exact:true}).first();if(await en.isVisible()){await en.click();await p.waitForTimeout(500)}
  if(await p.locator('#profileName').isVisible()){await p.fill('#profileName','Teste');await p.getByText('Continuar',{exact:true}).click()}
  await p.waitForTimeout(1400)};
 await boot();
 const toMode=async(m)=>{await p.evaluate(m=>{showScreen('home');const s=document.getElementById('lobbyModeSelect');s.value=m;s.dispatchEvent(new Event('change',{bubbles:true}))},m);await p.waitForTimeout(300);await p.evaluate(()=>document.getElementById('lobbyPlay').click());await p.waitForTimeout(500)};
 // 1x1
 await toMode('1v1');
 let r=await p.evaluate(()=>({kx:!!document.querySelector('.kx'),title:document.querySelector('.kx-title h1')?.textContent,rows:document.querySelectorAll('.kx-team.left .kx-row').length,foe:document.querySelectorAll('.kx-team.right .kx-row').length,full:document.querySelectorAll('.kx-team.left .kx-row.full').length,go:!document.querySelector('[data-kof-go]').disabled,state:state}));
 ok(r.kx&&/LUTADOR/.test(r.title)&&r.rows===1&&r.foe===1&&r.full===1&&r.go&&r.state!=='fight','Duelo 1×1 abre a seleção com 1 vaga, já com o campeão atual e Lutar liberado');
 await p.click('[data-kof-pick="3"]');
 r=await p.evaluate(()=>({names:[...document.querySelectorAll('.kx-team.left .kx-row.full span')].map(e=>e.textContent)}));
 ok(r.names.length===1&&r.names[0]===(await p.evaluate(()=>CHAMPIONS[3].name)),'tocar em outro herói troca o escolhido (1 vaga)');
 await p.click('[data-kof-go]');await p.waitForTimeout(900);
 r=await p.evaluate(()=>({state,skin:p.skin,mode:matchMode,actors:actors.length,act:account.activeChampion}));
 ok(r.skin===3&&r.act===3&&r.mode==='1v1'&&r.actors===2&&(r.state==='count'||r.state==='fight'),'Lutar começa o duelo com o herói escolhido');
 // 2x2
 await boot();await toMode('2v2');
 r=await p.evaluate(()=>({title:document.querySelector('.kx-title h1')?.textContent,rows:document.querySelectorAll('.kx-team.left .kx-row').length,foe:document.querySelectorAll('.kx-team.right .kx-row').length}));
 ok(/DUPLA/.test(r.title)&&r.rows===2&&r.foe===2,'Equipes 2×2: seleção com vaga para você e o aliado, 2 rivais ocultos');
 await p.click('[data-kof-pick="5"]');
 await p.evaluate(()=>{const f=document.querySelectorAll('.kx-team.left .kx-row.full span');window.__n=f.length});
 await p.click('[data-kof-go]');await p.waitForTimeout(900);
 r=await p.evaluate(()=>({mode:matchMode,me:p.skin,ally:(actors.find(a=>a.team===0&&a!==p)||{}).skin,n:actors.length}));
 ok(r.mode==='2v2'&&r.n===4&&r.ally===5,`2×2: aliado escolhido entra na luta (você=${r.me}, aliado=${r.ally})`);
 // liga
 await boot();await toMode('league');
 r=await p.evaluate(()=>({kx:!!document.querySelector('.kx'),title:document.querySelector('.kx-small')?.textContent||document.querySelector('.kx-title small')?.textContent}));
 ok(r.kx&&/LIGA/.test(r.title),'Liga offline abre a seleção');
 await p.click('[data-kof-pick="2"]');await p.click('[data-kof-go]');await p.waitForTimeout(1200);
 r=await p.evaluate(()=>({state,skin:p.skin,kx:!document.getElementById('modeScreen').hidden}));
 ok(r.skin===2&&!r.kx&&(r.state==='count'||r.state==='fight'),'Liga começa com o herói escolhido');
 // voltar
 await boot();await toMode('1v1');await p.click('[data-kof-back]');await p.waitForTimeout(400);
 ok(await p.evaluate(()=>document.getElementById('modeScreen').hidden&&appScreen==='home'),'voltar leva ao início');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,2));
 await br.close();
})();
