// Perfil v42: nível da conta (XP em partidas, treino, presente, missões), rank com cor, foto e moldura, tela de perfil.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const SHOT=process.env.SHOT||'';
(async()=>{
 const br=await chromium.launch();
 for(const [w,h,touch] of [[844,390,true],[1280,720,false]]){
  const pg=await (await br.newContext({viewport:{width:w,height:h},hasTouch:touch})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8000/index.html?allheroes=1');await pg.waitForTimeout(900);await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2200);
  const tag=`[${w}×${h}]`;
  const chip=await pg.evaluate(()=>({lv:document.querySelector('.v42-chip .v42-lv')?.textContent,ava:!!document.querySelector('.v42-chip .v42-ava'),tier:document.querySelector('.v41-league')?.dataset.tier,bg:getComputedStyle(document.querySelector('.v41-league')).backgroundImage}));
  ok(chip.lv==='1'&&chip.ava,`${tag} balão do nome mostra foto com moldura e nível ${chip.lv}`);
  ok(chip.tier==='0'&&/217, 144, 89/.test(chip.bg),`${tag} balão da liga cor de bronze no Bronze`);
  const tiers=await pg.evaluate(()=>{const out=[];for(const pts of [100,170,240]){account.league.points=pts;showScreen('home');out.push(document.querySelector('.v41-league').dataset.tier)}account.league.points=0;showScreen('home');return out});
  ok(tiers.join()==='1,2,3',`${tag} prata, ouro e platina trocam a cor (${tiers})`);
  // XP
  const xp=await pg.evaluate(async()=>{const c=ContaV42;const g=c.gain(130,'teste');const coins=account.coins;
   const o=document.querySelector('#outcome');document.querySelector('#resultTitle').textContent='A arena é sua.';document.querySelector('#resultText').textContent='Vitória!';o.style.display='flex';await new Promise(r=>setTimeout(r,60));
   const t1=c.rec().total;o.style.display='flex';o.style.opacity='1';await new Promise(r=>setTimeout(r,60));const t2=c.rec().total;
   o.style.display='none';await new Promise(r=>setTimeout(r,30));document.querySelector('#resultTitle').textContent='Um novo aprendizado.';o.style.display='flex';await new Promise(r=>setTimeout(r,60));o.style.display='none';
   return{g,coins,t1,t2,t3:c.rec().total,txt:document.querySelector('#resultText').textContent,lv:c.rec().lv}});
  ok(xp.g.ups===1&&xp.g.lv===2&&xp.coins>=70,`${tag} 130 XP sobe a conta para o nível 2 e dá moedas`);
  ok(xp.t1===230&&xp.t2===230&&xp.t3===250,`${tag} 1ª vitória do dia +100 (dobro), sem pagar em dobro, derrota +20 (${xp.t1}/${xp.t2}/${xp.t3})`);
  // tela de perfil
  await pg.evaluate(()=>showScreen('home'));await pg.waitForTimeout(300);
  await pg.click('.v42-chip');await pg.waitForTimeout(400);
  const pf=await pg.evaluate(()=>{const s=document.querySelector('#perfilV42');const vis=q=>{const e=document.querySelector(q);if(!e)return false;const b=e.getBoundingClientRect();return b.width>0&&b.bottom<=innerHeight+1&&b.right<=innerWidth+1&&b.top>=-1};
   return{open:s&&!s.hidden,name:document.querySelector('#v42Name')?.value,photos:document.querySelectorAll('[data-photo]').length,save:vis('.v42-save'),back:vis('.v42-back'),big:vis('.v42-big')}});
  ok(pf.open&&pf.name==='Teste'&&pf.photos>=17&&pf.save&&pf.back&&pf.big,`${tag} perfil abre com nome, ${pf.photos} fotos, botões na tela`);
  await pg.click('[data-photo="s3"]');await pg.click('[data-v42-tab="molduras"]');await pg.waitForTimeout(200);
  const fr=await pg.evaluate(()=>({n:document.querySelectorAll('[data-frame-pick]').length,locked:document.querySelectorAll('[data-frame-pick]:disabled').length}));
  ok(fr.n===9&&fr.locked===7,`${tag} 9 molduras, 7 bloqueadas no nível 2`);
  await pg.click('[data-frame-pick="bronze"]');
  if(SHOT)await pg.screenshot({path:`${SHOT}/perfil_${w}.png`});
  await pg.fill('#v42Name','X');await pg.click('[data-v42-save]');
  ok(await pg.evaluate(()=>/2 a 16/.test(document.querySelector('#v42Err').textContent)),`${tag} nome curto é recusado`);
  await pg.fill('#v42Name','Novo Nome');await pg.click('[data-v42-save]');await pg.waitForTimeout(500);
  const sv=await pg.evaluate(()=>({p:account.profile,closed:document.querySelector('#perfilV42').hidden,chipName:document.querySelector('.v42-chip b')?.textContent,frame:document.querySelector('.v42-chip .v42-ava')?.dataset.frame,sym:!!document.querySelector('.v42-chip .v42-sym'),stored:JSON.parse(localStorage.getItem(SAVE_KEY)||'{}').profile}));
  ok(sv.closed&&sv.p.name==='Novo Nome'&&sv.p.photo==='s3'&&sv.p.frame==='bronze'&&sv.chipName==='Novo Nome'&&sv.frame==='bronze'&&sv.sym,`${tag} salvar troca nome, foto e moldura no início`);
  ok(sv.stored&&sv.stored.frame==='bronze',`${tag} perfil gravado no aparelho`);
  if(SHOT)await pg.screenshot({path:`${SHOT}/inicio42_${w}.png`});
  ok(!errs.length,`${tag} sem erros (${errs.slice(0,2).join(' | ')})`);
 }
 await br.close();
})();
