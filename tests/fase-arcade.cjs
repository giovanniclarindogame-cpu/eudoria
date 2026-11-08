// Cruzada Arcade: lobby, fase em rolagem, ondas, comida, chefe (nível médio), dupla com regra oculta, vitória e derrota.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
async function boot(b,vp){
 const ctx=await b.newContext({viewport:vp,reducedMotion:'reduce'});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('c:'+m.text().slice(0,150))});
 await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(800);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1400);
 return{ctx,p,errs};
}
const run=(p,fn,arg)=>p.evaluate(fn,arg);
(async()=>{
 const b=await chromium.launch();
 /* ---------- lobby ---------- */
 for(const vp of [{width:844,height:390},{width:1280,height:720}]){
  const tag=`${vp.width}x${vp.height}`;
  const {ctx,p,errs}=await boot(b,vp);
  await p.evaluate(()=>showArenaModes());await p.waitForTimeout(400);
  ok(await p.locator('[data-arena-mode]').count()===8,`${tag}: 8 modos na tela de Arenas`);
  ok(await p.locator('[data-arena-mode="draft"]').count()===0,`${tag}: "Escolha de Campeão" foi removido`);
  ok(await p.locator('[data-arena-mode="stage"]').count()===1,`${tag}: "Cruzada Arcade" no lugar dele`);
  await p.click('[data-arena-mode="stage"]');await p.waitForTimeout(600);
  ok(await p.locator('[data-arc-stage]').count()===10,`${tag}: 10 fases no lobby`);
  ok(await p.locator('[data-arc-stage].lock').count()===9,`${tag}: só a primeira fase começa liberada`);
  await p.click('[data-arc-stage="vhalor"]',{force:true});
  ok(await p.evaluate(()=>ArcadeAPI.save.sel)==='zorvath',`${tag}: fase bloqueada não pode ser escolhida`);
  const fit=await p.evaluate(()=>{const pg=document.querySelector('.arc-page'),m=document.querySelector('#modeScreen');return m.scrollHeight<=m.clientHeight+2&&[...pg.querySelectorAll('*')].every(e=>{const r=e.getBoundingClientRect();return !r.width||r.bottom<=innerHeight+2})});
  ok(fit,`${tag}: lobby cabe na tela sem rolar`);
  ok(await p.locator('[data-arc-mob]').count()===3,`${tag}: mostra os 3 tipos de monstro da fase`);
  await p.click('[data-arc-team="duo"]');ok(await p.evaluate(()=>ArcadeAPI.save.team)==='duo',`${tag}: escolha de dupla é lembrada`);
  ok(!/dobro|2x|dobra/i.test(await p.locator('.arc-page').innerText()),`${tag}: regra oculta da dupla não aparece no lobby`);
  ok(errs.length===0,`${tag}: lobby sem erros ${errs.join('|')}`);
  await ctx.close();
 }

 /* ---------- fase solo ---------- */
 {
  const {ctx,p,errs}=await boot(b,{width:844,height:390});
  await p.evaluate(()=>{ArcadeAPI.setSave({team:'solo',sel:'vhalor',cleared:{zorvath:99}});ArcadeAPI.startStage()});await p.waitForTimeout(800);
  const r=await p.evaluate(()=>{window.requestAnimationFrame=()=>0;state='fight';count=0;const S=ArcadeAPI.S;
   return{mode:modeRun.id,W,H,actors:actors.length,def:S.def.id,mul:S.mul}});
  ok(r.mode==='stage'&&r.W===4400&&r.actors===1&&r.def==='vhalor'&&r.mul===1,'solo: fase carregada com só o jogador, mapa largo e chefe escolhido');
  // onda 1
  const w=await p.evaluate(()=>{const S=ArcadeAPI.S;p.x=ArcadeAPI.TRIG[0]+10;for(let i=0;i<200;i++){step(1/60)}return{phase:S.phase,wave:S.wave,mobs:S.mobs.length,types:S.mobs.map(a=>a.mob.type).join(''),hp:S.mobs.map(a=>a.max).join(','),lock:S.lockCx}});
  ok(w.phase==='fight'&&w.wave===0&&w.mobs===3,'onda 1 começa ao chegar no ponto e tem 3 monstros');
  ok(w.hp.split(',').every(x=>+x===150),'solo: vida normal dos monstros (150)');
  const clampT=await p.evaluate(()=>{const S=ArcadeAPI.S;p.x=S.camX+5000;step(1/60);const edge=S.camX+S.viewW/2;const r1=p.x<=edge;p.x=-500;step(1/60);return r1&&p.x>=S.camX-S.viewW/2});
  ok(clampT,'o jogador não sai da tela durante a luta (tela travada)');
  const names=await p.evaluate(()=>ArcadeAPI.S.mobs.map(a=>a.label));
  ok(names.every(n=>n==='Ninja Sem Rosto'),'monstros do universo do chefe (Vhalor → ninjas sem rosto)');
  // limpar onda: dá "AVANTE" e solta comida depois da onda 2
  const c1=await p.evaluate(()=>{const S=ArcadeAPI.S;for(const m of [...S.mobs])m.hp=0;for(let i=0;i<30;i++)step(1/60);return{phase:S.phase,mobs:S.mobs.length,kills:S.kills,go:!document.getElementById('arcGo').hidden,food:S.food.length}});
  ok(c1.phase==='walk'&&c1.mobs===0&&c1.kills===3&&c1.go,'onda limpa: aparece AVANTE ▶ e a tela destrava');
  const c2=await p.evaluate(()=>{const S=ArcadeAPI.S;p.x=ArcadeAPI.TRIG[1]+10;for(let i=0;i<120;i++)step(1/60);for(const m of [...S.mobs])m.hp=0;for(const q of S.queue)q.t=0;for(let i=0;i<200;i++){step(1/60);for(const m of [...S.mobs])m.hp=0}return{wave:S.wave,phase:S.phase,food:S.food.map(f=>f.kind)}});
  ok(c2.wave===1&&c2.phase==='walk'&&c2.food.includes('apple'),'depois da onda 2 aparece comida (maçã) no caminho');
  // comer
  const eat=await p.evaluate(()=>{const S=ArcadeAPI.S;p.hp=300;const f=S.food[0];p.x=f.x;p.y=f.y;step(1/60);return{hp:p.hp,left:S.food.length}});
  ok(eat.hp>300&&eat.left===0,'pegar comida recupera vida e some do chão');
  const full=await p.evaluate(()=>{const S=ArcadeAPI.S;S.food.push({kind:'meat',x:p.x,y:p.y,t:0});p.hp=p.max;step(1/60);return S.food.length});
  ok(full===1,'com a vida cheia a comida fica no chão para depois');
  ok(errs.length===0,'solo: sem erros de JavaScript '+errs.join('|'));
  // chefe
  const bs=await p.evaluate(()=>{const S=ArcadeAPI.S;S.food.length=0;S.nextTrig=4;S.phase='walk';for(const m of [...S.mobs])m.hp=0;p.x=ArcadeAPI.BOSS_TRIG+10;p.inv=99;p.hp=p.max;for(let i=0;i<300;i++)step(1/60);
   const R=modeRun.gb;return{phase:S.phase,boss:!!R,noP2:R&&R.noPhase2,dmg:R&&R.dmgScale,max:S.bossA.max,defhp:S.def.hp,inActors:actors.includes(S.bossA)}});
  ok(bs.phase==='boss'&&bs.boss&&bs.noP2&&bs.inActors,'ao chegar no fim aparece o chefe, só com a 1ª fase (sem transformação)');
  ok(bs.max<bs.defhp*.5&&bs.dmg<1,`chefe em nível médio (vida ${bs.max} de ${bs.defhp}, dano x${bs.dmg})`);
  const half=await p.evaluate(()=>{const S=ArcadeAPI.S;S.bossA.hp=S.bossA.max*.4;for(let i=0;i<5;i++)step(1/60);return{food:S.food.map(f=>f.kind),phase:modeRun.gb.phase}});
  ok(half.food.includes('meat')&&half.phase===1,'chefe abaixo de 50%: carne no chão e continua na fase 1');
  // vitória
  const hunt0=await p.evaluate(()=>JSON.stringify(HuntAPI.loadSave()));
  const win=await p.evaluate(()=>{const S=ArcadeAPI.S;S.bossA.hp=0;for(let i=0;i<60*4&&state==='fight';i++)step(1/60);return{state,title:document.getElementById('resultTitle').textContent,text:document.getElementById('resultText').textContent,save:ArcadeAPI.save}});
  ok(win.state==='end'&&win.title==='Fase concluída!','vitória: "Fase concluída!"');
  ok(win.save.cleared.vhalor>0&&/liberada: Kuroen/.test(win.text),'vitória: recorde salvo e próxima fase (Kuroen) liberada');
  ok(await p.evaluate(()=>JSON.stringify(HuntAPI.loadSave()))===hunt0,'a vitória na fase não mexe nos recordes da Caçada do Dia');
  ok(errs.length===0,'chefe/vitória sem erros de JavaScript '+errs.join('|'));
  await ctx.close();
 }

 /* ---------- derrota + Zorvath (motor próprio) + dupla ---------- */
 {
  const {ctx,p,errs}=await boot(b,{width:844,height:390});
  await p.evaluate(()=>{ArcadeAPI.setSave({team:'solo',sel:'zorvath',cleared:{}});ArcadeAPI.startStage()});await p.waitForTimeout(600);
  const z=await p.evaluate(()=>{window.requestAnimationFrame=()=>0;state='fight';count=0;const S=ArcadeAPI.S;S.nextTrig=4;S.phase='walk';p.x=ArcadeAPI.BOSS_TRIG+10;p.inv=99;for(let i=0;i<300;i++)step(1/60);
   const R=modeRun.hunt;const hp0=S.bossA.max;S.bossA.hp=hp0*.2;p.inv=99;for(let i=0;i<120;i++)step(1/60);
   return{hunt:!!R,noForms:R&&R.noForms,form:R&&R.form,max:hp0}});
  ok(z.hunt&&z.noForms&&z.form===1,'Zorvath: só a forma 1 (não se transforma mesmo com pouca vida)');
  const lose=await p.evaluate(()=>{p.inv=0;p.hp=0;for(let i=0;i<30&&state==='fight';i++)step(1/60);return{title:document.getElementById('resultTitle').textContent,cleared:ArcadeAPI.save.cleared}});
  ok(lose.title==='A horda venceu.'&&!lose.cleared.zorvath,'derrota: "A horda venceu." e a fase não é marcada como concluída');
  await ctx.close();
 }
 {
  const {ctx,p,errs}=await boot(b,{width:844,height:390});
  await p.evaluate(()=>{ArcadeAPI.setSave({team:'duo',sel:'zorvath',cleared:{}});ArcadeAPI.startStage()});await p.waitForTimeout(600);
  const d=await p.evaluate(()=>{window.requestAnimationFrame=()=>0;state='fight';count=0;const S=ArcadeAPI.S;
   p.x=ArcadeAPI.TRIG[0]+10;for(let i=0;i<200;i++)step(1/60);
   return{actors:actors.filter(a=>a.team===0).length,mul:S.mul,hp:S.mobs.map(a=>a.max).join(','),bhp:document.getElementById('bhp').textContent,team:!document.getElementById('teamHud').hidden}});
  ok(d.actors===2&&d.team,'dupla: jogador + aliado bot, com painel de equipe');
  ok(d.mul===2&&d.hp.split(',').every(x=>+x===300),'dupla: monstros com o DOBRO de vida (regra oculta)');
  ok(/%$/.test(d.bhp),'o HUD mostra a vida do inimigo em % (não revela o dobro)');
  const bd=await p.evaluate(()=>{const S=ArcadeAPI.S;S.nextTrig=4;S.phase='walk';for(const m of [...S.mobs])m.hp=0;p.x=ArcadeAPI.BOSS_TRIG+10;p.inv=99;for(let i=0;i<300;i++)step(1/60);return{max:S.bossA.max,def:S.def.hp}});
  ok(bd.max===Math.round(bd.def*.36)*2,`dupla: chefe também com o dobro (${bd.max})`);
  ok(errs.length===0,'dupla: sem erros de JavaScript '+errs.join('|'));
  await ctx.close();
 }

 /* ---------- os 10 universos ---------- */
 {
  const {ctx,p,errs}=await boot(b,{width:844,height:390});
  const res=await p.evaluate(()=>{
   const out=[];
   for(const d of ArcadeAPI.roster()){
    const L=ArcadeAPI.mobLooks(d),th=ArcadeAPI.THEMES[d.id];
    const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');let drew=true;
    try{for(const l of L)for(const pose of ['idle','walk','punch','s0','hit','dead'])BossSprite.paint(g,l,pose,0,{x:48,y:80,scale:1})}catch(e){drew=String(e)}
    out.push([d.id,!!th,th&&th.names.length===3,L.length===3,drew]);
   }
   return out});
  ok(res.length===10&&res.every(r=>r[1]&&r[2]&&r[3]&&r[4]===true),'os 10 chefes têm universo próprio: 3 monstros desenhados em todas as poses ('+res.filter(r=>r[4]!==true).map(r=>r[0]+':'+r[4]).join(',')+')');
  ok(errs.length===0,'universos sem erros '+errs.join('|'));
  await ctx.close();
 }
 await b.close();
})();
