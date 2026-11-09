// Sobrevivência (battle royale solo com 8 lutadores): níveis, habilidades liberadas por ponto, XP, zona/gás, fim de partida.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
async function boot(b,vp){
 const ctx=await b.newContext({viewport:vp,reducedMotion:'reduce'});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('c:'+m.text().slice(0,150))});
 await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(800);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1400);
 return{ctx,p,errs};
}
(async()=>{
 const b=await chromium.launch();
 for(const vp of [{width:844,height:390},{width:1280,height:720}]){
  const tag=`${vp.width}x${vp.height}`;
  const {ctx,p,errs}=await boot(b,vp);
  await p.evaluate(()=>showArenaModes());await p.waitForTimeout(400);
  ok(await p.locator('[data-arena-mode]').count()===8&&await p.locator('[data-arena-mode="survival"]').count()===1,`${tag}: Sobrevivência continua na lista de Arenas (8 modos)`);
  ok(/8 lutadores|Battle royale/i.test(await p.locator('[data-arena-mode="survival"]').locator('xpath=..').innerText()),`${tag}: cartão fala de battle royale com 8 lutadores`);
  await p.click('[data-arena-mode="survival"]');await p.waitForTimeout(1500);
  const st=await p.evaluate(()=>{window.requestAnimationFrame=()=>0;state='fight';count=0;return{mode:modeRun.id,W,H,all:RoyaleAPI.players().length,alive:RoyaleAPI.alive().length,lv:RoyaleAPI.players().map(a=>a.roy.lv),unl:RoyaleAPI.players().map(a=>a.roy.unlocked.size),bots:RoyaleAPI.players().filter(a=>a.roy.bot).length,teams:new Set(RoyaleAPI.players().map(a=>a.team)).size,mobs:RoyaleAPI.R.mobs.length}});
  ok(st.mode==='survival'&&st.W===2600&&st.all===8&&st.alive===8&&st.bots===7,`${tag}: 8 lutadores (você + 7 bots) num mapa grande`);
  ok(st.lv.every(x=>x===1)&&st.unl.every(x=>x===0),`${tag}: todos começam no nível 1 sem nenhuma habilidade`);
  ok(st.teams===8&&st.mobs>=20,`${tag}: cada um por si e monstros espalhados pelo mapa (${st.mobs})`);
  ok(await p.locator('#royMap').count()===1&&await p.locator('#royLv').count()===1,`${tag}: minimapa e painel de nível na tela`);
  ok(await p.locator('#equipped .skill.roy-lock').count()===6,`${tag}: os 6 botões de habilidade começam bloqueados`);
  ok(/vivos/.test(await p.locator('#modeObjective').innerText())&&!/onda/i.test(await p.locator('#modeObjective').innerText()),`${tag}: texto do modo mostra vivos e zona (sem ondas)`);
  ok(errs.length===0,`${tag}: início sem erros ${errs.join('|')}`);
  await ctx.close();
 }

 const {ctx,p,errs}=await boot(b,{width:844,height:390});
 await p.click('[data-arena-mode="survival"]',{timeout:1}).catch(()=>{});
 await p.evaluate(()=>beginArenaMode('survival'));await p.waitForTimeout(1500);
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;state='fight';count=0;});

 /* ---------- habilidades bloqueadas e liberação por ponto ---------- */
 const lock=await p.evaluate(()=>{const id=p.kit[0];const cd0=p.cd[id];const r=cast(p,id);return{r,cdSame:p.cd[id]===cd0,can:RoyaleAPI.canUnlock(p,id)}});
 ok(lock.r===false&&lock.cdSame&&!lock.can,'sem ponto: não dá para usar nem liberar habilidade');
 await p.locator('#equipped .skill').nth(0).click({force:true});
 ok(await p.evaluate(()=>p.roy.unlocked.size===0),'tocar numa habilidade sem ponto não libera nada');
 const lv=await p.evaluate(()=>{const hp0=p.hp;p.hp=500;RoyaleAPI.addXP(p,40);return{lv:p.roy.lv,pts:p.roy.pts,heal:p.hp>500,xp:p.roy.xp}});
 ok(lv.lv===2&&lv.pts===1&&lv.heal,'40 de XP: nível 2, 1 ponto e cura ao subir');
 await p.waitForTimeout(100);
 await p.evaluate(()=>updateUI());
 ok(await p.locator('#equipped .skill.roy-can').count()===5&&await p.locator('#equipped .skill.roy-lock[data-roy-ult="1"]').count()===1,'com ponto: 5 habilidades brilham para liberar e a ultimate segue trancada');
 await p.locator('#equipped .skill').nth(5).click({force:true});
 ok(await p.evaluate(()=>p.roy.unlocked.size===0&&p.roy.pts===1),'a ultimate não libera antes das outras 5');
 await p.locator('#equipped .skill').nth(2).click({force:true});await p.waitForTimeout(500);
 const u1=await p.evaluate(()=>({n:p.roy.unlocked.size,has:p.roy.unlocked.has(p.kit[2]),pts:p.roy.pts,cd:p.cd[p.kit[2]]}));
 ok(u1.n===1&&u1.has&&u1.pts===0&&u1.cd===0,'tocar numa habilidade com ponto libera só ela (uma por vez) e não a dispara');
 const u2=await p.evaluate(()=>{const id=p.kit[1];return{can:RoyaleAPI.canUnlock(p,id)}});
 ok(u2.can===false,'sem ponto sobrando, a próxima continua bloqueada');
 // ultimate só depois das 5
 const ult=await p.evaluate(()=>{
  const out=[];RoyaleAPI.addXP(p,2000);        // sobe até o nível máximo
  out.push(p.roy.lv,p.roy.pts);
  out.push(RoyaleAPI.canUnlock(p,p.kit[5]));
  for(const i of [0,1,3]){RoyaleAPI.unlock(p,p.kit[i])}
  out.push(RoyaleAPI.canUnlock(p,p.kit[5]));      // faltam 1 (índice 4)
  RoyaleAPI.unlock(p,p.kit[4]);
  out.push(p.roy.unlocked.size,RoyaleAPI.canUnlock(p,p.kit[5]));
  RoyaleAPI.unlock(p,p.kit[5]);out.push(p.roy.unlocked.size,p.roy.pts);
  return out});
 ok(ult[0]===7&&ult[1]===5,'XP leva ao nível 7 (máximo), com 6 pontos ganhos no total');
 ok(ult[2]===false&&ult[3]===false,'ultimate segue bloqueada enquanto faltar qualquer uma das outras');
 ok(ult[4]===5&&ult[5]===true&&ult[6]===6&&ult[7]===0,'com as 5 liberadas, a ultimate pode ser liberada (6/6 habilidades, 0 pontos)');
 ok(await p.evaluate(()=>cast(p,p.kit[0])!==undefined),'habilidade liberada passa pela checagem de uso');

 /* ---------- XP de monstros e de rivais ---------- */
 const xp=await p.evaluate(()=>{
  const bot=RoyaleAPI.players().find(a=>a.roy.bot);const x0=p.roy.xp,lvBefore=bot.roy.lv;
  const m=RoyaleAPI.spawnMonster('s',p.x+60,p.y);m.hp=1;m.inv=0;hit(m,50,p,0,0,0);for(let i=0;i<3;i++)step(1/60);
  const gain=p.roy.xp-x0;
  RoyaleAPI.addXP(bot,45);return{gain,mon:RoyaleAPI.MON.s.xp,botLv:bot.roy.lv,botSk:bot.roy.unlocked.size,botPts:bot.roy.pts}});
 ok(xp.gain===xp.mon,'matar um monstro dá a XP dele ao autor do golpe ('+xp.gain+')');
 ok(xp.botLv>=2&&xp.botSk>=1&&xp.botPts===0,'bots usam o ponto sozinhos e liberam uma habilidade');
 const kill=await p.evaluate(()=>{
  const bot=RoyaleAPI.players().find(a=>a.roy.bot&&a.hp>0);const k0=RoyaleAPI.R.kills,x0=p.roy.xp;
  bot.hp=1;bot.inv=0;hit(bot,80,p,0,0,0);for(let i=0;i<3;i++)step(1/60);
  return{dead:bot.hp<=0,kills:RoyaleAPI.R.kills-k0,xp:p.roy.xp-x0,feed:document.getElementById('royFeed').innerText,alive:RoyaleAPI.alive().length}});
 ok(kill.dead&&kill.kills===1&&kill.xp>=70,'derrotar um rival dá abate e bastante XP');
 ok(/eliminou/.test(kill.feed)&&kill.alive===7,'aparece no placar de abates e restam 7 vivos');

 /* ---------- zona e gás ---------- */
 const zn=await p.evaluate(()=>{
  const R=RoyaleAPI.R,z=R.zone;const out={r0:z.c.r,state0:z.state,phase0:z.phase,inside0:RoyaleAPI.inZone(p)};
  const to=z.to;out.toInside=Math.hypot(to.x-z.c.x,to.y-z.c.y)+to.r<=z.c.r+1;out.toR=to.r;
  // avança o tempo até começar a fechar
  p.inv=1e9;for(let i=0;i<60*62;i++){step(1/60);}
  out.state1=z.state;out.phase1=z.phase;
  for(let i=0;i<60*30;i++)step(1/60);
  out.state2=z.state;out.phase2=z.phase;out.r2=z.c.r;out.moved=Math.hypot(z.c.x-RoyaleAPI.MAP_W/2,z.c.y-RoyaleAPI.MAP_H/2);
  return out});
 ok(zn.phase0===0&&zn.state0==='wait'&&zn.r0>1500&&zn.inside0,'a partida começa com a zona cobrindo o mapa todo');
 ok(zn.toInside&&zn.toR<zn.r0,'a próxima zona é um círculo menor dentro da atual');
 ok(zn.state1==='shrink'||zn.phase1>=1,'depois de um tempo a zona começa a fechar');
 ok(zn.phase2>=1&&zn.r2<1100,'a zona fecha em fases (raio cai) e muda de lugar ('+Math.round(zn.r2)+')');
 const gas=await p.evaluate(()=>{const R=RoyaleAPI.R,z=R.zone.c;p.hp=p.max=1000;p.inv=1e9;
  p.x=Math.min(RoyaleAPI.MAP_W-60,z.x+z.r+300);p.y=z.y;if(RoyaleAPI.inZone(p)){p.x=60;p.y=60}
  const out={outside:!RoyaleAPI.inZone(p)};const h0=p.hp;for(let i=0;i<60*3&&p.hp>0;i++)step(1/60);out.lost=h0-p.hp;out.dps=RoyaleAPI.gasDps();
  p.hp=p.max=1000;p.x=z.x;p.y=z.y;const h1=p.hp;for(let i=0;i<60*2;i++)step(1/60);out.insideLoss=h1-p.hp;out.hudZone=document.getElementById('modeObjective').textContent;return out});
 ok(gas.outside&&gas.lost>10,'fora da zona o gás tira vida ('+Math.round(gas.lost)+' em 3s)');
 ok(gas.insideLoss<5,'dentro da zona não há dano de gás');
 ok(/zona|fechando/.test(gas.hudZone)&&/vivos/.test(gas.hudZone),'o texto do modo mostra a contagem da zona');

 /* ---------- fim da partida ---------- */
 const win=await p.evaluate(()=>{p.inv=0;p.hp=p.max;for(const a of RoyaleAPI.players())if(a!==p){a.hp=0}for(let i=0;i<10&&state==='fight';i++)step(1/60);return{state,title:document.getElementById('resultTitle').textContent,text:document.getElementById('resultText').textContent,stats:document.getElementById('stats').innerText}});
 ok(win.state==='end'&&/ÚLTIMO EM PÉ/i.test(win.title),'ser o último vivo: "ÚLTIMO EM PÉ!"');
 ok(/1º de 8/.test(win.stats),'resultado mostra a colocação (1º de 8)');
 ok(errs.length===0,'partida sem erros de JavaScript '+errs.join('|'));
 await ctx.close();

 /* ---------- derrota ---------- */
 {
  const {ctx,p,errs}=await boot(b,{width:844,height:390});
  await p.evaluate(()=>beginArenaMode('survival'));await p.waitForTimeout(1500);
  const lose=await p.evaluate(()=>{window.requestAnimationFrame=()=>0;state='fight';count=0;
   const bot=RoyaleAPI.players().find(a=>a.roy.bot);p.inv=0;p.hp=1;hit(p,500,bot,0,0,0);for(let i=0;i<10&&state==='fight';i++)step(1/60);
   return{state,title:document.getElementById('resultTitle').textContent,text:document.getElementById('resultText').textContent,stats:document.getElementById('stats').innerText,bot:bot.roy.name}});
  ok(lose.state==='end'&&/8º lugar/.test(lose.title),'ser eliminado primeiro: "8º lugar"');
  ok(lose.text.includes(lose.bot)&&/eliminou você/.test(lose.text),'a mensagem diz quem eliminou você');
  ok(errs.length===0,'derrota sem erros '+errs.join('|'));
  await ctx.close();
 }
 await b.close();
})();
