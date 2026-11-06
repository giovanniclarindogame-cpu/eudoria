const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true}),errors=[];let failed=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/assets/**',route=>{const url=new URL(route.request().url());if(/\/(sprites|reforged_v10|astral_v19)\//.test(url.pathname)&&!url.searchParams.has('animation_retry')){failed++;return route.abort();}return route.continue();});
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
 await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Recuperação');await page.locator('#profileForm button[type=submit]').click();
 await page.waitForFunction(()=>animationAssetRecovery.status().ready===animationAssetRecovery.status().total);
 assert.ok(failed>20,'test must interrupt multiple animation sheets');
 await page.evaluate(()=>{equipChampion(0,false);beginProgression('training');arenaQA.begin();practiceOptions.free=true;cast(p,p.kit[0],0)});
 const first=await page.evaluate(()=>last);await page.waitForTimeout(600);assert.ok(await page.evaluate(t=>last>t,first),'animation loop must keep running');
 assert.ok(await page.evaluate(()=>KI_ORB_IMAGE.naturalWidth>0&&Object.values(astralImages).every(im=>im.naturalWidth>0)));
 await page.evaluate(()=>rwImage('assets/reforged_v9/spark-0.webp'));await page.waitForFunction(()=>rwImage('assets/reforged_v9/spark-0.webp').naturalWidth>0);
 assert.deepEqual(errors,[]);console.log('PASS transient failures recovered, canonical bodies and effects loaded, live animation loop continues; interrupted images:',failed);
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
