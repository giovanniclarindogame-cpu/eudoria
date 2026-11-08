const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));await page.locator('#welcomeEnter').click();
 await page.locator('#profileName').fill('Menus');await page.locator('#profileForm button[type=submit]').click();
 async function nav(screen){if(await page.locator('#lobbyNav').isHidden()){const back=page.locator('[data-nav=home]:visible').first();await back.click();}await page.locator(`#lobbyNav [data-nav="${screen}"]`).click();}
 async function accessible(selector){assert.ok(await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'covered or clipped '+selector);}
 for(const viewport of [{width:1280,height:720},{width:844,height:390},{width:667,height:375}]){
  await page.setViewportSize(viewport);
  for(const [screen,cta] of [['training','[data-progression="training"]'],['league','[data-progression="league"]']]){
   await nav(screen);await accessible(cta);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.locator('[data-nav=home]:visible').first().click();await page.locator('#lobbyNav [data-open-modes]').click();assert.equal(await page.locator('[data-arena-mode]').count(),8);
  await page.locator('[data-arena-mode="ffa"]').scrollIntoViewIfNeeded();await accessible('[data-arena-mode="ffa"]');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  console.log('PASS secondary menus '+viewport.width+'x'+viewport.height+': primary actions accessible, arenas scrollable, no horizontal overflow');
 }
 await nav('library');await page.locator('#heroSearch').fill('Maré');assert.equal(await page.locator('.hero-card').count(),1);
 await page.locator('#heroSearch').fill('xyz');assert.equal(await page.locator('.hero-card').count(),0);assert.ok(await page.locator('.empty-roster').isVisible());
 await page.locator('#heroSearch').fill('');await page.locator('#heroGrid [data-hero-open="8"]').click();await page.locator('[data-hero-skill="5"]').click();assert.ok((await page.locator('#heroSkillCopy').textContent()).includes('Cosmo'));
 await page.locator('[data-hero-confirm]').click();assert.equal(await page.evaluate(()=>arenaQA.account.activeChampion),8);
 await nav('library');await page.locator('#heroGrid [data-hero-open="9"]').click();assert.ok((await page.locator('#heroDetail h1').textContent()).includes('Alquimista'));await page.locator('#backHome').click();
 await nav('training');await page.locator('#setupDummy').selectOption('guard');await page.locator('[data-practice-free]').check();await page.locator('[data-progression="training"]').click();
 await page.waitForFunction(()=>['count','fight'].includes(arenaQA.state));assert.deepEqual(await page.evaluate(()=>({...arenaQA.progression.options})),{dummy:'guard',free:true});
 await page.evaluate(()=>arenaQA.begin());await page.locator('#pauseBtn').click();await page.locator('#pause .simple-extra summary').click();assert.ok(await page.locator('#pause .simple-extra p').isVisible());await page.locator('#pause .simple-extra summary').click();
 await page.locator('#pause [data-practice-dummy]').selectOption('attack');assert.equal(await page.evaluate(()=>arenaQA.progression.options.dummy),'attack');await page.locator('#resume').click();
 await page.evaluate(()=>{arenaQA.leave();showScreen('league')});await page.locator('#leagueScreen summary').click();assert.ok(await page.locator('#leagueRewardText').isVisible());await page.locator('[data-progression="league"]').click();await page.waitForFunction(()=>['count','fight'].includes(arenaQA.state));assert.equal(await page.evaluate(()=>arenaQA.progression.activity),'league');
 await page.evaluate(()=>{arenaQA.leave();showScreen('home')});await page.locator('#lobbyNav [data-open-modes]').click();assert.equal(await page.locator('[data-arena-mode="draft"]').count(),0);assert.equal(await page.locator('[data-arena-mode]').count(),8);await page.locator('[data-arena-mode="stage"]').click();assert.equal(await page.locator('[data-arc-stage]').count(),10);await page.locator('[data-arc-start]').click();await page.waitForFunction(()=>['count','fight'].includes(arenaQA.state));assert.equal(await page.evaluate(()=>arenaQA.arenas.run.id),'stage');
 await page.evaluate(()=>{arenaQA.leave();showScreen('home')});await page.locator('#openLobbySettings').click();assert.equal(await page.locator('#lobbySettings h2').textContent(),'Configurações');await page.locator('#doneLobbySettings').click();
 await page.evaluate(()=>openProfile());await page.locator('#profileName').fill('Novo nome');await page.locator('#profileForm button[type=submit]').click();assert.equal(await page.evaluate(()=>arenaQA.account.profile.name),'Novo nome');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('#landscapeGate').evaluate(el=>getComputedStyle(el).display),'grid');
 assert.deepEqual(errors,[]);console.log('PASS search, champion details/select, training options/pause, league, arcade stage, settings, profile and portrait fallback');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
