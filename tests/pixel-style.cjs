const{chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.arenaPixelQA&&!document.querySelector('#integrationLoading'));await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Pixel');await page.locator('#profileForm button[type=submit]').click();
 await page.evaluate(async()=>{for(let skin=6;skin<10;skin++)reworkPreload(skin);await Promise.all([...REWORK_ART.values()].map(im=>im.decode()));});
 const result=await page.evaluate(()=>{
  const cv=document.createElement('canvas');cv.width=cv.height=320;const g=cv.getContext('2d'),reports=[];
  for(let skin=0;skin<10;skin++)for(const mode of ['idle','walk','guard','punch','cast']){
   state='paused';equipChampion(skin,false);beginProgression('training');arenaQA.begin();p.x=500;p.y=280;b.x=750;b.y=280;p.a=0;
   if(mode==='cast'){cast(p,p.kit[0],0);for(let i=0;i<33;i++)step(1/60);}else{p.moving=mode==='walk';p.gait=2;p.guard=mode==='guard';p.punchTime=mode==='punch'?.16:0;}
   g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,320,320);g.translate(160,240);g.imageSmoothingEnabled=true;drawAnimatedFighter(g,p,112,0);
   if(!g.imageSmoothingEnabled||g.getTransform().e!==160)throw Error('Renderer leaked canvas state');
   const data=g.getImageData(0,0,320,320).data;let pixels=0,uneven=0;
   for(let y=0;y<320;y+=2)for(let x=0;x<320;x+=2){let i=(y*320+x)*4;if(data[i+3])pixels++;for(const offset of [4,320*4,320*4+4])for(let c=0;c<4;c++)if(data[i+c]!==data[i+offset+c])uneven++;}
   if(pixels<100)throw Error(`Empty fighter for ${skin}/${mode}`);
   if(skin<4){
    // The detailed fighters must retain the source art at both normal and high
    // screen densities, instead of being reduced to the legacy 56px surface.
    for(const density of [1,2]){
     const render=paint=>{
      const c=document.createElement('canvas');c.width=c.height=320*density;
      const ink=c.getContext('2d');ink.scale(density,density);ink.translate(160,240);
      paint(ink,p,112,0);return ink.getImageData(0,0,c.width,c.height).data;
     };
     const actual=render(drawAnimatedFighter),expected=render(rwPaintBody);
     if(actual.some((v,i)=>v!==expected[i]))throw Error(`Lost source detail for ${skin}/${mode} at ${density}x`);
    }
    if(!uneven)throw Error(`Detailed fighter still uses coarse 2x2 grid: ${skin}/${mode}`);
   }else if(uneven)throw Error(`Inconsistent pixel grid for ${skin}/${mode}: ${pixels}, ${uneven}`);
   reports.push({skin,mode,pixels});
  }state='paused';return reports;
 });assert.equal(result.length,50);assert.deepEqual(errors,[]);console.log('PASS: four detailed fighters preserve atlas detail at 1x/2x; six legacy fighters retain their pixel grid; all five states visible with preserved canvas state');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
