const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
 await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Teste');await page.locator('#profileForm button[type=submit]').click();
 await page.evaluate(async()=>{await Promise.all(Object.values(BODY24).map(i=>i.decode()));window.setup24=skin=>{state='paused';equipChampion(skin,false);beginProgression('training');arenaQA.begin();practiceOptions.free=false;practiceOptions.dummy='still';pillars=[];objects=[];p.x=400;p.y=300;b.x=650;b.y=300;b.hp=b.max=10000;p.inv=b.inv=0;};window.advance24=t=>{for(let i=0;i<Math.ceil(t*240);i++)step(1/240)};});
 for(const skin of [0,1]){await page.evaluate(skin=>{setup24(skin);state='paused';draw()},skin);await page.screenshot({path:`/tmp/body24-${skin}.png`});}
 await page.evaluate(()=>setup24(1));await page.keyboard.down('6');await page.waitForTimeout(350);
 assert.ok(await page.evaluate(()=>p.rwCast?.holding&&p.hits===0));await page.keyboard.up('6');await page.waitForTimeout(600);
 assert.ok(await page.evaluate(()=>!p.rwCast?.holding&&Reforged.effects.some(e=>e.kind==='thunder-ground')));
 await page.evaluate(()=>setup24(1));const btn=page.locator('#equipped button').nth(5),r=await btn.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.waitForTimeout(600);
 assert.ok(await page.evaluate(()=>p.rwCast?.holding&&p.rwCast.charge>.2));await page.screenshot({path:'/tmp/body24-charge.png'});await page.mouse.up();await page.waitForTimeout(250);await page.screenshot({path:'/tmp/body24-rush.png'});
 await page.evaluate(()=>{setup24(1);rwBeginCharge(p,0,5);advance24(3);if(!p.rwCast.holding||p.rwCast.charge!==1)throw Error('full charge must wait for release');rwReleaseCharge(p,0);advance24(.7);if(p.damage!==330)throw Error('charged damage '+p.damage);});
 await page.evaluate(()=>{setup24(1);rwBeginCharge(p,0,5);clearInputs();if(p.rwCast?.holding)throw Error('charge cancel on focus loss');});
 assert.deepEqual(errors,[]);console.log('PASS new bodies, keyboard and touch hold/release, full charge waits, scaled damage, ground trail, cancellation');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
