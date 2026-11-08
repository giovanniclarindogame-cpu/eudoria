const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));await page.locator('#welcomeEnter').click();
 await page.locator('#profileName').fill('Giovanni');await page.locator('#profileForm button[type=submit]').click();
 await page.evaluate(()=>{arenaQA.champions.equip(1,false);arenaQA.showScreen('home');});
 for(const viewport of [{width:1280,height:720},{width:844,height:390},{width:740,height:360},{width:667,height:375}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);
  const boxes=await page.locator('[data-royal-mode],#lobbyPlay,.royal-small-gold,#openLobbySettings,#fullscreenToggle').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {id:el.id||el.dataset.royalMode||'arenas',disabled:el.disabled,x:r.x,y:r.y,w:r.width,h:r.height,accessible:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
  for(const a of boxes){assert.ok(a.x>=0&&a.y>=0&&a.x+a.w<=viewport.width+1&&a.y+a.h<=viewport.height+1,'clipped '+a.id);assert.ok(a.accessible,'covered '+a.id);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,'overlap '+a.id+' '+b.id);}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  console.log('PASS royal lobby '+viewport.width+'x'+viewport.height+': mode cards, play and navigation accessible');
 }
 for(const mode of ['league','1v1','2v2']){
  await page.locator(`[data-royal-mode="${mode}"]`).click();assert.equal(await page.locator('#lobbyModeSelect').inputValue(),mode);
  assert.equal(await page.locator(`[data-royal-mode="${mode}"]`).getAttribute('aria-pressed'),'true');
  await page.locator('#lobbyPlay').click();await page.waitForFunction(()=>['count','fight'].includes(arenaQA.state));
  assert.equal(await page.evaluate(()=>arenaQA.actors.length),mode==='2v2'?4:2);
  await page.evaluate(()=>{arenaQA.leave();arenaQA.showScreen('home');});
 }
 await page.locator('[data-royal-mode="arenas"]').click();await page.locator('#lobbyPlay').click();assert.ok(await page.locator('#modeScreen').isVisible());assert.equal(await page.locator('[data-arena-mode]').count(),8);
 await page.evaluate(()=>arenaQA.showScreen('home'));
 for(const mode of ['online'])assert.ok(await page.locator(`[data-royal-mode="${mode}"]`).isDisabled());
 await page.locator('#openLobbySettings').click();assert.ok(await page.locator('#lobbySettings').isVisible());await page.locator('#doneLobbySettings').click();
 await page.locator('[data-royal-missions]').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'journeyHome');
 // Existing progression still awards exactly once through the new mission panel.
 const before=await page.evaluate(()=>{arenaQA.journey.complete('training');arenaQA.journey.complete('duel');arenaQA.journey.complete('build');renderJourneyHome();return arenaQA.account.crystals;});
 await page.locator('[data-journey-claim]').click();assert.equal(await page.evaluate(()=>arenaQA.account.crystals),before+125);assert.ok(await page.evaluate(()=>arenaQA.account.journey.claimed));
 const old=await page.evaluate(()=>arenaQA.account.activeChampion);await page.locator('[data-cycle-build="1"]').click();assert.notEqual(await page.evaluate(()=>arenaQA.account.activeChampion),old);
 await page.locator('.royal-build [data-champ-details]').click();assert.ok(await page.locator('#heroDetail').isVisible());await page.locator('#lobbyNav [data-nav="library"]').click();
 assert.equal(await page.locator('#fullscreenToggle').count(),0);assert.ok(await page.evaluate(()=>typeof eldoriaDisplay?.enter==='function'));
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);assert.equal(await page.locator('#landscapeGate').evaluate(el=>getComputedStyle(el).display),'grid');
 assert.deepEqual(errors,[]);console.log('PASS: real 1v1/2v2 starts, eight arenas, online disabled, settings, missions reward, champion cycling, automatic fullscreen, landscape gate, assets');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
