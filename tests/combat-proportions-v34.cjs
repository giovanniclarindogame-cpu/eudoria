const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),sharp=require('sharp');
(async()=>{
 // Both packed atlases must keep every pose inside its own cell.
 for(const file of ['assets/hunter_v32/body.webp','assets/spark_v34/body.webp']){
  const im=sharp(file),meta=await im.metadata();assert.deepEqual([meta.width,meta.height],[1254,1254]);
  for(let f=0;f<36;f++){
   const d=await im.clone().extract({left:f%6*209,top:Math.floor(f/6)*209,width:209,height:209}).ensureAlpha().raw().toBuffer();let visible=0;
   for(let y=0;y<209;y++)for(let x=0;x<209;x++){
    const a=d[(y*209+x)*4+3];if(a>170)visible++;
    if(x<4||x>=205||y<4||y>=205)assert.equal(a,0,`${file} frame ${f}: clipped cell`);
   }
   assert.ok(visible>100,`${file} frame ${f}: empty`);
  }
 }
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
  await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Proporções');await page.locator('#profileForm button[type=submit]').click();
  const report=await page.evaluate(async()=>{
   await Promise.all([HUNTER32_BODY,HUNTER32_ADULT,HEIR33_BODY,...Object.values(BODY24)].map(im=>im.decode()));
   state='paused';
   const sheet=document.createElement('canvas');sheet.width=960;sheet.height=720;const g=sheet.getContext('2d');
   g.fillStyle='#24342e';g.fillRect(0,0,sheet.width,sheet.height);const idle=[],samples=[];
   for(const [column,skin]of [0,5,6].entries()){
    const base=actor(0,0,CHAMPIONS[skin].kit,'white');base.skin=skin;
    const poses=[{}, {moving:true,rwFacing:0,rwStride:2}, {moving:true,rwFacing:Math.PI/2,rwStride:3}, {moving:true,rwFacing:-Math.PI/2,rwStride:2}, {rwCast:{id:base.kit[1],slot:1,age:.3,release:.2,duration:.7,angle:0}}, {hitReact:.06}, {dodgeTime:.1}, {hp:0,koAge:1}];
    g.fillStyle='#ffe5a6';g.font='18px sans-serif';g.fillText(CHAMPIONS[skin].name,column*320+10,26);
    for(const [row,pose]of poses.entries())for(const facing of [0,Math.PI]){
     const c=document.createElement('canvas');c.width=c.height=160;const ink=c.getContext('2d');ink.translate(80,120);
     const a={...base,...pose,a:facing,rwFacing:pose.rwFacing??facing};if(a.rwCast)a.rwCast={...a.rwCast,angle:facing};
     drawAnimatedFighter(ink,a,72,0);const d=ink.getImageData(0,0,160,160).data;let top=160,bottom=-1,count=0;
     for(let y=0;y<160;y++)for(let x=0;x<160;x++)if(d[(y*160+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y);count++}
     samples.push({skin,row,facing,count});if(row===0&&facing===0)idle.push({skin,height:bottom-top+1,bottom});
     // Each 160px capture has 72px of visible body: crop transparent padding for the comparison.
     g.drawImage(c,0,40,160,90,column*320+(facing?160:0),row*85+36,160,85);
    }
   }
   return {idle,samples,url:sheet.toDataURL()};
  });
  assert.ok(report.samples.every(s=>s.count>100),'all directions and combat states render');
  assert.ok(report.idle.every(s=>Math.abs(s.height-report.idle[0].height)<=2),'same standing height '+JSON.stringify(report.idle));
  assert.ok(report.idle.every(s=>Math.abs(s.bottom-report.idle[0].bottom)<=1),'same ground contact '+JSON.stringify(report.idle));
  fs.writeFileSync('/tmp/combat-proportions-v34.png',Buffer.from(report.url.split(',')[1],'base64'));
  for(const viewport of [{width:1280,height:720},{width:844,height:390}]){
   await page.setViewportSize(viewport);
   await page.evaluate(()=>{equipChampion(6,false);beginProgression('training');arenaQA.begin();state='paused';p.x=400;p.y=300;b.x=600;b.y=300;updateUI();draw()});
   await page.screenshot({path:`/tmp/spark-v34-arena-${viewport.width}.png`});
  }
  assert.deepEqual(errors,[]);console.log('PASS 72 atlas cells, 48 rendered poses/directions, matched reference height/feet, desktop/mobile arena, no asset or JS errors.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
