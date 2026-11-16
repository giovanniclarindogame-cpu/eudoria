// Níveis e atributos: painel na página do campeão, bônus só na campanha, duelo nivelado, XP e subida de nível.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const p=await (await br.newContext({viewport:{width:1000,height:450}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1400);
 // curva de atributos
 const st=await p.evaluate(()=>{const a=V3Levels.stats(1),b=V3Levels.stats(10);return{a,b}});
 ok(st.a.hp===1000&&st.a.atk===1&&st.b.hp===1450&&Math.abs(st.b.atk-1.36)<1e-9&&Math.abs(st.b.crit-.113)<1e-9,'nível 1 = atributos base; nível 10 = +45% vida, +36% ataque/defesa, crítico 11,3%');
 // painel
 await p.evaluate(()=>{account.heroLv={0:{lv:4,xp:130}};openChampionDetails(0)});await p.waitForTimeout(500);
 const pan=await p.evaluate(()=>({t:document.querySelector('#heroDetail .nv-box')?.textContent||'',n:document.querySelectorAll('#heroDetail .nv-stat').length}));
 ok(pan.n===5&&/NÍVEL 4/.test(pan.t)&&/130\/220 XP/.test(pan.t)&&/1\.150/.test(pan.t),'painel mostra nível, XP e os 5 atributos');
 // duelo: nivelado, sem bônus
 const d=await p.evaluate(()=>{closeHeroDetail();account.heroLv={0:{lv:10,xp:0}};account.activeChampion=0;matchMode='1v1';battleActivity='casual';arenaModeId=null;start();return{max:p.max,stats:!!p.v3stats}});
 ok(d.max===1000&&!d.stats,'duelo usa atributos nivelados (nível 10 não dá bônus)');
 // campanha: bônus
 await p.evaluate(()=>{ArcadeAPI.setSave({team:'solo',sel:'vhalor',cleared:{zorvath:99}});ArcadeAPI.startStage()});await p.waitForTimeout(900);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;state='fight';count=0});
 const c=await p.evaluate(()=>({mode:modeRun&&modeRun.id,max:p.max,atk:p.v3stats&&p.v3stats.atk,foe:!!actors.filter(a=>a!==p).find(a=>a.v3stats),lv:p.v3lv}));
 ok(c.mode==='stage'&&c.max===1450&&Math.abs(c.atk-1.36)<1e-9&&!c.foe&&c.lv===10,'Cruzada: o herói nível 10 recebe os bônus; inimigos não');
 // dano e defesa
 const V3DMG=await p.evaluate(()=>V3_DMG_MUL[0]);
 const dm=await p.evaluate(()=>{Math.random=()=>.99;const t=spawnModeActor(1,'Alvo',p.x+90,p.y,1e6);actors.push(t);t.inv=0;t.guard=false;const h0=t.hp;hit(t,100,p,0,0,0);const dealt=h0-t.hp;
  p.inv=0;p.hp=p.max;const q=t;const hp0=p.hp;hit(p,100,q,0,0,0);return{dealt,taken:hp0-p.hp}});
 ok(Math.abs(dm.dealt-100*1.36*V3DMG)<1.5&&Math.abs(dm.taken-100/1.36)<1.5,`ataque e defesa aplicados (causa ${dm.dealt.toFixed(0)}, recebe ${dm.taken.toFixed(0)} do mesmo golpe base)`);
 // XP e subida de nível
 const x=await p.evaluate(()=>{account.heroLv={2:{lv:1,xp:0}};const r1=V3Levels.gainXp(2,90);const r2=V3Levels.gainXp(2,30);return{r1,r2,rec:account.heroLv[2]}});
 ok(x.r1.ups===0&&x.r2.ups===1&&x.rec.lv===2&&x.rec.xp===20,'XP acumula e sobe do nível 1 para o 2 ao passar de 100');
 const mx=await p.evaluate(()=>{account.heroLv={2:{lv:9,xp:0}};const r=V3Levels.gainXp(2,99999);const r2=V3Levels.gainXp(2,50);return{r,r2,lv:account.heroLv[2].lv}});
 ok(mx.lv===10&&mx.r2.maxed&&mx.r2.gain===0,'nível máximo é 10 e não passa disso');
 // fim da Cruzada: dá XP e mostra no resultado
 const e=await p.evaluate(()=>{account.heroLv={0:{lv:1,xp:0}};p.hp=p.max;endArenaMode(true,false);return{txt:document.getElementById('resultText').textContent,xp:account.heroLv[0]}});
 ok(/\+140 XP/.test(e.txt)&&e.xp.xp===40&&e.xp.lv===2,'vencer a Cruzada dá +140 XP, mostra no resultado e sobe de nível (100 XP): '+e.txt.slice(-70));
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,2));
 await br.close();
})();
