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
 for(const vp of [{width:844,height:390},{width:1280,height:720},{width:667,height:375},{width:740,height:360},{width:932,height:430}]){
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
  await p.evaluate(()=>{ArcadeAPI.setSave({sel:'xerath',cleared:{zorvath:1,vhalor:1,kuroen:1,nyxar:1,ryoku:1}});beginArenaMode('stage')});await p.waitForTimeout(500);
  const info=await p.evaluate(()=>{const i=document.querySelector('.arc-info');const kids=[...i.children].map(e=>e.getBoundingClientRect()).filter(r=>r.height>0);const ov=kids.some((r,k)=>k>0&&r.top<kids[k-1].bottom-1);return{over:i.scrollHeight-i.clientHeight,ov}});
  ok(info.over<=1&&!info.ov,`${tag}: painel da fase (com o especial) cabe e sem sobreposição`);
  ok(await p.locator('[data-arc-mob]').count()===4&&await p.locator('.arc-special').count()===1,`${tag}: mostra os 3 tipos de monstro e o ESPECIAL da fase`);
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

 /* ---------- monstros ESPECIAIS (um por universo) ---------- */
 {
  const {ctx,p,errs}=await boot(b,{width:844,height:390});
  const kinds=[['zorvath','volley'],['vhalor','blink'],['kuroen','lunge'],['nyxar','leech'],['ryoku','curse'],['xerath','split'],['rapina','drain'],['malrath','bomb'],['hadrion','homing'],['genesis','shield']];
  const out=await p.evaluate(async(kinds)=>{
   let seed=5;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const res={};
   for(const [id,kind] of kinds){
    ArcadeAPI.setSave({team:'solo',sel:id,cleared:{}});ArcadeAPI.startStage();window.requestAnimationFrame=()=>0;
    state='fight';count=0;const S=ArcadeAPI.S;S.phase='walk';S.nextTrig=0;
    const prep=()=>{p.inv=0;p.guard=false;p.hp=p.max=1000;p.x=1200;p.y=300;S.camX=1200;S.lockCx=1200};
    const adj=e=>{e.x=p.x+44;e.y=p.y;e.mob.cd=0;e.mob.windup=0;e.hitReact=0};
    const r={kind:ArcadeAPI.ELITE[id].kind};
    prep();const e=ArcadeAPI.spawnMob('e',p.x+260,p.y);e.inv=0;
    r.hp=e.max;r.label=e.label;
    if(kind==='volley'||kind==='homing'||kind==='bomb'){
     e.mob.cd=0;let seen=0,homing=false,bombs=0;
     for(let i=0;i<240;i++){p.inv=99;step(1/60);seen=Math.max(seen,S.proj.length);homing=homing||S.proj.some(o=>o.homing);bombs=Math.max(bombs,S.bombs.length)}
     r.proj=seen;r.homing=homing;r.bombs=bombs;
     if(kind==='bomb'){prep();S.bombs.length=0;S.bombs.push({x:p.x,y:p.y,t:.2,dur:.2,r:74,dmg:60,owner:e});for(let i=0;i<30;i++)step(1/60);r.bombHit=p.hp<p.max}
    }else if(kind==='blink'){
     e.x=p.x+420;e.y=p.y;e.mob.blinkCd=0;const d0=Math.hypot(e.x-p.x,e.y-p.y);p.a=0;step(1/60);r.d0=d0;r.d1=Math.hypot(e.x-p.x,e.y-p.y);r.behind=e.x<p.x
    }else if(kind==='lunge'){
     e.x=p.x+250;e.y=p.y;e.mob.cd=0;let started=false,d0=Math.hypot(e.x-p.x,e.y-p.y),dmin=d0;
     for(let i=0;i<150;i++){p.inv=0;step(1/60);started=started||!!e.mob.lunge;dmin=Math.min(dmin,Math.hypot(e.x-p.x,e.y-p.y))}
     r.started=started;r.dmin=dmin;r.d0=d0;r.hurt=p.hp<p.max
    }else if(kind==='leech'||kind==='drain'||kind==='curse'){
     adj(e);e.hp=Math.round(e.max*.5);p.mp=100;const h0=e.hp;e.mob.cd=0;
     for(let i=0;i<240&&p.hp>=p.max;i++){if(!e.mob.windup){e.x=p.x+44;e.y=p.y}step(1/60)}
     r.pHurt=p.hp<p.max;r.eHealed=e.hp>h0;r.mp=p.mp;r.slow=p.slow||0
    }else if(kind==='split'){
     e.hp=0;step(1/60);step(1/60);r.small=S.mobs.filter(a=>a.mob.small).length;r.smallHp=S.mobs.filter(a=>a.mob.small).map(a=>a.max)
    }else if(kind==='shield'){
     r.shield=e.mob.shield;const hp0=e.hp;hit(e,60,p,0,0,0);r.afterA=e.hp===hp0&&e.mob.shield<r.shield;hit(e,400,p,0,0,0);r.afterB=e.hp<hp0&&e.mob.shield===0
    }
    res[id]=r;try{leave()}catch{}
   }
   return res},kinds);
  ok(out.zorvath.proj>=3,'Capitão Cristalino (Zorvath): dispara 3 cristais em leque ('+out.zorvath.proj+')');
  ok(out.vhalor.behind&&out.vhalor.d1<110&&out.vhalor.d0>350,'Ninja Clone (Vhalor): teleporta para as costas do jogador');
  ok(out.kuroen.started&&out.kuroen.dmin<60,'Espectro Flamejante (Kuroen): avança em linha reta até o jogador');
  ok(out.nyxar.pHurt&&out.nyxar.eHealed,'Demônio Sanguessuga (Nyxar): cura-se com o dano que causa');
  ok(out.ryoku.pHurt&&out.ryoku.slow>0,'Maldição Ancestral (Ryoku): o golpe em área deixa o jogador lento');
  ok(out.xerath.small===2&&out.xerath.smallHp.every(x=>x===45),'Formiga Rainha-Guarda (Xerath): ao morrer solta 2 formigas');
  ok(out.rapina.pHurt&&out.rapina.eHealed&&out.rapina.mp<100,'Vilão Ladrão (Rapina): drena a energia e se cura');
  ok(out.malrath.bombs>=1&&out.malrath.bombHit,'Imediato Bombardeiro (Malrath): bomba com aviso que explode e machuca');
  ok(out.hadrion.homing,'Espectro Chorão (Hadrion): dispara almas que perseguem');
  ok(out.genesis.afterA&&out.genesis.afterB,'Armadura Alquímica (Gênesis): o escudo absorve os primeiros golpes e depois quebra');
  ok(Object.values(out).every(r=>r.hp===300),'especial tem 300 de vida na solo (o dobro de um soldado)');
  ok(errs.length===0,'especiais sem erros de JavaScript '+errs.join('|'));
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
    out.push([d.id,!!th,th&&th.names.length===3&&!!ArcadeAPI.ELITE[d.id],L.length===4,drew]);
   }
   return out});
  ok(res.length===10&&res.every(r=>r[1]&&r[2]&&r[3]&&r[4]===true),'os 10 chefes têm universo próprio: 3 monstros + especial desenhados em todas as poses ('+res.filter(r=>r[4]!==true).map(r=>r[0]+':'+r[4]).join(',')+')');
  ok(errs.length===0,'universos sem erros '+errs.join('|'));
  await ctx.close();
 }
 await b.close();
})();
