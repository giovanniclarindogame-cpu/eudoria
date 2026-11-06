const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Teste');await page.locator('#profileForm button[type=submit]').click();
 await page.evaluate(()=>document.exitFullscreen());await page.locator('#restoreFullscreen').click();assert.ok(await page.evaluate(()=>!!document.fullscreenElement));
 const boxes=await page.locator('#restoreFullscreen,#openLobbySettings').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}}));assert.ok(boxes.every(r=>r.x>=0&&r.right<=844&&r.bottom<=390));assert.ok(Math.abs(boxes[0].y-boxes[1].y)<2);
 await page.screenshot({path:'/tmp/v19-home.png'});
 assert.ok(await page.evaluate(()=>CHAMPIONS.every(c=>c.kit.every(id=>skills[id].futureImpact?.provisional))));
 assert.equal(await page.evaluate(()=>plannedSkillImpact(CHAMPIONS[0].kit[1],{finalHit:true}).level),'knockdown');
 assert.equal(await page.evaluate(()=>plannedSkillImpact(CHAMPIONS[0].kit[2],{charge:.2}).level),'medium');
 await page.evaluate(async()=>{await ASTRAL19_BLAST.decode();for(let f=0;f<24;f++){const c=astralSoftCell(ASTRAL19_BLAST,f),g=c.getContext('2d'),pixels=g.getImageData(0,0,256,256).data;for(let n=0;n<256;n++)for(const pos of [n,n*256,n*256+255,255*256+n])if(pixels[pos*4+3]>3)throw Error('visible atlas edge');}});
 await page.evaluate(()=>{equipChampion(0,false);beginProgression('training');arenaQA.begin();toast('Habilidade');});assert.equal(await page.locator('#toast').isVisible(),false);
 for(const stage of [0,1,2]){await page.evaluate(stage=>{Object.assign(reworkState(p),{stage,value:[20,60,100][stage]});p.rwCast={slot:4,holding:true,age:1,charge:.5,angle:0,release:.1,duration:6};state='paused';draw()},stage);await page.screenshot({path:`/tmp/v19-aura-${stage}.png`});}
 await page.evaluate(()=>{p.rwCast=null;Reforged.effects=[];rwFx(p,5,p.x+120,p.y,'astral-solar-blast',1.8,{radius:120,age:.65});draw()});await page.screenshot({path:'/tmp/v19-blast.png'});
 assert.deepEqual(errors,[]);console.log('PASS fullscreen reentry, menu fit, 60 impact profiles, hidden combat toasts, 24 seamless explosion cells, aura stages');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
