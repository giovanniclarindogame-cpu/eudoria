const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000/?allheroes=1');
  await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
  await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Revisão');await page.locator('#profileForm button[type=submit]').click();
  const report=await page.evaluate(async()=>{
   state='paused';await Promise.all([CORSAIR36_BODY,BODY24['ninja-base'],BODY24['astral-base']].map(i=>i.decode()));
   const c=document.createElement('canvas');c.width=1050;c.height=570;const g=c.getContext('2d');g.fillStyle='#172b30';g.fillRect(0,0,c.width,c.height);const measurements=[];
   for(const [i,skin]of [0,1,7].entries()){
    const portrait=new Image();portrait.src=championArt(CHAMPIONS[skin]);await portrait.decode();
    const scale=Math.min(300/portrait.width,350/portrait.height);g.drawImage(portrait,i*350+(350-portrait.width*scale)/2,8,portrait.width*scale,portrait.height*scale);
    const actor36=actor(0,0,CHAMPIONS[skin].kit,'white');actor36.skin=skin;
    const sprite=document.createElement('canvas');sprite.width=sprite.height=180;const s=sprite.getContext('2d');s.translate(90,140);drawAnimatedFighter(s,actor36,72,0);
    const d=s.getImageData(0,0,180,180).data;let left=180,right=-1,top=180,bottom=-1,area=0;
    for(let y=0;y<180;y++)for(let x=0;x<180;x++)if(d[(y*180+x)*4+3]>170){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);area++;}
    measurements.push({skin,width:right-left+1,height:bottom-top+1,area});
    g.imageSmoothingEnabled=false;g.drawImage(sprite,i*350+85,350,180,180);g.fillStyle='#f4dda5';g.font='18px sans-serif';g.fillText(CHAMPIONS[skin].name,i*350+35,552);
   }
   return {measurements,url:c.toDataURL()};
  });
  const [astral,ninja,corsair]=report.measurements;
  assert.ok(Math.abs(corsair.height-ninja.height)<=2,'same standing height');
  assert.ok(corsair.width>=ninja.width*.85&&corsair.width<=ninja.width*1.15,'compact silhouette width '+JSON.stringify(report.measurements));
  assert.ok(corsair.area>=ninja.area*.8&&corsair.area<=ninja.area*1.25,'comparable body mass '+JSON.stringify(report.measurements));
  fs.writeFileSync('/tmp/corsair37-roster.png',Buffer.from(report.url.split(',')[1],'base64'));
  for(const width of [1280,844]){
   await page.setViewportSize({width,height:width===1280?720:390});
   await page.evaluate(()=>{state='paused';account.activeChampion=7;V3Kof.open('league')});
   await page.waitForFunction(()=>document.querySelector('[data-face="7"]')?.src.startsWith('data:image/webp'));
   const face=await page.locator('[data-face="7"]').getAttribute('src');
   fs.writeFileSync('/tmp/corsair37-face.webp',Buffer.from(face.split(',')[1],'base64'));
   assert.ok(await page.locator('.kx-art.left img').evaluate(i=>i.complete&&i.naturalWidth>0));
   await page.screenshot({path:`/tmp/corsair37-selection-${width}.png`});
   await page.evaluate(()=>{document.querySelector('[data-kof-back]').click();state='paused';equipChampion(7,false);beginProgression('training');arenaQA.begin();practiceOptions.free=true;practiceOptions.dummy='still';reworkState(p).value=100;state='fight';updateUI();draw()});
   const buttons=await page.locator('#equipped .skill:not(.v3-hidden) .skill-art, #attack .skill-art').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect(),b=el.closest('button').getBoundingClientRect();return {src:getComputedStyle(el).backgroundImage,w:r.width/b.width,h:r.height/b.height}}));
   assert.equal(buttons.length,5,'three attacks, ultimate and dash');
   assert.ok(buttons.every(b=>b.src.includes('corsair_v36/icon-')&&b.src.includes('v=37')&&b.w>=.7&&b.h>=.7),'icons fill real buttons '+JSON.stringify(buttons));
   await page.screenshot({path:`/tmp/corsair37-combat-${width}.png`});
  }
  assert.deepEqual(errors,[]);console.log('PASS v37: compact width/mass matches Ninja, same height, face crop in actual league selection, five filled skill buttons on desktop/mobile.',report.measurements);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
