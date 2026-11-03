const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
 async function accessible(selector){return page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return r.width>=30&&r.height>=30&&r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});}
 assert.ok(await accessible('#profileForm button[type=submit]'),'profile submit clipped');
 await page.locator('#profileName').fill('Teste horizontal');await page.locator('#profileForm button[type=submit]').click();
 for(const viewport of [{width:844,height:390},{width:740,height:360},{width:667,height:375},{width:1366,height:768}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>arenaQA.showScreen('library'));await page.waitForTimeout(100);
  assert.equal(await page.locator('#selection .hero-card').count(),10);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow in roster');
  await page.locator('#selection .hero-card').nth(6).click();await page.waitForTimeout(100);
  assert.ok(await accessible('[data-hero-confirm]'),'select clipped '+JSON.stringify(viewport));assert.ok(await accessible('[data-hero-test]'),'dojo clipped');
  await page.locator('[data-hero-skill="5"]').click();assert.ok((await page.locator('#heroSkillCopy').textContent()).includes('Legado'));
  await page.locator('[data-hero-confirm]').click();
  assert.ok(await accessible('#lobbyPlay'),'play clipped '+JSON.stringify(viewport));
  await page.evaluate(()=>{arenaQA.progression.begin('training');arenaQA.begin();});await page.waitForTimeout(100);
  const projection=await page.evaluate(()=>({...arenaQA.projection,...arenaQA.dimensions}));
  if(viewport.width<900)assert.ok(projection.scale>.58&&projection.scale<1.1,'moderate camera zoom outside expected range');
  const controls='#equipped button,#attack,#defend,#dodge,#stick,#pauseBtn,#arenaZoom,#fullscreenToggle';
  const boxes=await page.locator(controls).evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {id:el.id||el.dataset.index,x:r.x,y:r.y,w:r.width,h:r.height,hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
  for(const box of boxes){assert.ok(box.hit,'covered control '+box.id);assert.ok(box.x>=0&&box.y>=0&&box.x+box.w<=viewport.width+1&&box.y+box.h<=viewport.height+1,'clipped control '+box.id);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,'overlap '+a.id+' '+b.id);}
  // Status overlay must not draw anything for any champion.
  assert.ok(await page.evaluate(()=>{const old=ctx.fillText;let calls=0;ctx.fillText=()=>calls++;for(const a of actors)drawActorStatus(a);ctx.fillText=old;return calls===0;}));
  await page.locator('#arenaZoom').click();const wide=await page.evaluate(()=>({...arenaQA.projection,...arenaQA.dimensions}));
  assert.ok(wide.ox>=0&&wide.oy>=0&&wide.ox+wide.W*wide.scale<=viewport.width+.1&&wide.oy+wide.H*wide.scale<=viewport.height+.1,'wide view cropped');
  await page.locator('#arenaZoom').click();
  console.log('PASS layout '+viewport.width+'x'+viewport.height+': menus, close camera, wide view, no overlapping/clipped controls or overhead labels');
 }
 await page.setViewportSize({width:844,height:390});await page.locator('#fullscreenToggle').click();
 await page.waitForFunction(()=>!!document.fullscreenElement);
 assert.equal(await page.locator('#fullscreenToggle').getAttribute('aria-pressed'),'true');
 assert.ok(await accessible('#pauseBtn'));assert.ok(await accessible('#fullscreenToggle'));
 await page.locator('#fullscreenToggle').click();await page.waitForFunction(()=>!document.fullscreenElement);
 // All menus remain horizontally contained, with vertical scroll when needed.
 for(const screen of ['training','league','shop','home']){await page.evaluate(screen=>arenaQA.showScreen(screen),screen);await page.waitForTimeout(60);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+screen);}
 await page.evaluate(()=>arenaQA.showScreen('library'));await page.locator('#selection .hero-card').nth(6).click();await page.locator('[data-hero-test]').click();
 await page.waitForFunction(()=>arenaQA.player);await page.evaluate(()=>arenaQA.begin());
 const stick=await page.locator('#stick').boundingBox();
 const before=await page.evaluate(()=>arenaQA.player.x);
 await page.mouse.move(stick.x+stick.width/2,stick.y+stick.height/2);await page.mouse.down();await page.mouse.move(stick.x+stick.width*.8,stick.y+stick.height/2);await page.waitForTimeout(250);await page.mouse.up();assert.ok(await page.evaluate(x=>arenaQA.player.x>x,before),'joystick failed');
 // Rejecting fullscreen must leave a usable UI and explain the fallback.
 await page.evaluate(()=>{document.documentElement.requestFullscreen=()=>Promise.reject(new Error('denied'));});
 await page.locator('#fullscreenToggle').click();assert.ok(await page.locator('#fullscreenStatus').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS: fullscreen entry/exit and failure fallback, menu navigation, joystick drag, no JS errors');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
