const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{for(const legacy of [true,false]){
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:8000/'+(legacy?'?legacy=1':''));await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
 await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Hunter');await page.locator('#profileForm button[type=submit]').click();
 await page.evaluate(async()=>{
  await Promise.all([HUNTER32_BODY,HUNTER32_ADULT,...Object.values(HUNTER32_FX),ECLIPSE30_BODY,SOLAR29_BODY,ICHIGO27_BODY,...Object.values(BODY24)].map(i=>i.decode()));
  window.setup32=()=>{state='paused';equipChampion(5,false);beginProgression('training');arenaQA.begin();practiceOptions.free=false;practiceOptions.dummy='still';pillars=[];objects=[];p.x=350;p.y=300;b.x=420;b.y=300;b.hp=b.max=10000;p.inv=b.inv=0;joy.x=joy.y=0;};
  window.advance32=t=>{for(let i=0;i<Math.ceil(t*240);i++)step(1/240)};
  window.paint32=()=>{state='paused';updateUI();draw()};
  window.seen32=new Set();const old=hunter32Effect;hunter32Effect=function(...args){seen32.add(args[1]);return old(...args)};
 });
 await page.evaluate(legacy=>{
  const check=(v,m)=>{if(!v)throw Error(m)};
  for(const angle of [0,Math.PI]){
   setup32();b.x=p.x+Math.cos(angle)*70;check(cast(p,p.kit[1],angle),'quick punch accepted');advance32(.15);paint32();check(p.hits>0,'quick punch damage');
   setup32();b.x=p.x+Math.cos(angle)*70;check(rwBeginCharge(p,angle,0),'charge accepted');advance32(.8);paint32();check(p.rwCast.holding,'holds charge');check(p.hits===0,'charge has no premature damage');state='fight';check(rwReleaseCharge(p,angle),'charge releases');advance32(.22);paint32();check(p.hits>0,'heavy punch damage');check(Reforged.effects.some(e=>e.kind==='hunter-contact'&&e.slot===0),'heavy contact at hit');
   setup32();b.x=p.x+Math.cos(angle)*70;check(cast(p,p.kit[2],angle),'rod accepted');advance32(.3);paint32();check(p.hits>0,'rod damage');
  }
  setup32();check(rwBeginCharge(p,0,0),'interruptible charge');advance32(.4);hit(p,50,b,0,0,b.kit[0]);check(!p.rwCast,'damage cancels charge');
  setup32();b.x=580;joy.x=1;check(legacy?cast(p,p.kit[3],0):V3API.doDash(p),'jump accepted');advance32(.25);paint32();check(p.x>350,'jump moves');check(integratedDepth().some(e=>e.kind==='hunter-leap-shadow'),'airborne shadow');state='fight';advance32(.45);paint32();check(p.hits>0,'landing damage');check(Reforged.effects.some(e=>e.slot===3&&e.kind==='impact'),'landing effect');
  if(legacy){setup32();check(cast(p,p.kit[4],0),'instinct accepted');advance32(.3);paint32();check(reworkState(p).instinct>0,'instinct still active');}
  setup32();const hp=p.hp;check(cast(p,p.kit[5],0),'oath accepted');advance32(.4);paint32();check(hunter32Pose(p,0).adult,'adult windup');check(integratedDepth().some(e=>e.kind==='hunter-oath'),'oath aura');check(p.hp===hp,'oath cost waits for release');state='fight';advance32(.6);paint32();check(p.hits>0,'oath damage');check(Math.abs(p.hp-hp*.2)<1,'oath retains 80% health cost');check(hunter32Pose(p,0).frame>=12,'adult punch sequence');state='fight';advance32(.8);paint32();check(!hunter32Pose(p,0).adult,'normal body restored');
  setup32();cast(p,p.kit[5],0);advance32(.3);p.hp=0;check(!integratedDepth().some(e=>e.kind==='hunter-oath'),'death clears aura');check(!hunter32Pose(p,0).adult,'death uses fallen normal body');
  for(const key of HUNTER32_KEYS)check(seen32.has(key),key+' rendered');
  check(championArt(CHAMPIONS[5]).includes('hunter_v32/portrait'),'new portrait');for(let i=0;i<6;i++)check(icon(p.kit[i]).includes('hunter_v32/icon-'+i),'icon '+i);
 },legacy);
 if(!legacy){
  const report=await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=1320;canvas.height=220;const g=canvas.getContext('2d');g.fillStyle='#26372b';g.fillRect(0,0,1320,220);const heights=[],soles=[];
   for(let skin=0;skin<6;skin++){
    const a=actor(0,0,CHAMPIONS[skin].kit,'white');a.skin=skin;
    const c=document.createElement('canvas');c.width=c.height=180;const ink=c.getContext('2d');ink.translate(90,140);drawAnimatedFighter(ink,a,72,0);const d=ink.getImageData(0,0,180,180).data;let top=180,bottom=-1;
    for(let y=0;y<180;y++)for(let x=0;x<180;x++)if(d[(y*180+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y)}
    heights.push(bottom-top+1);soles.push(bottom);g.imageSmoothingEnabled=false;g.drawImage(c,skin*220,0,220,200);g.fillStyle='#ffe2a0';g.font='14px sans-serif';g.fillText(CHAMPIONS[skin].name,skin*220+8,212);
   }return {heights,soles,url:canvas.toDataURL()};
  });
  assert.ok(report.heights.every(h=>Math.abs(h-report.heights[5])<=2),'matched roster heights '+report.heights);assert.ok(report.soles.every(y=>Math.abs(y-report.soles[5])<=1),'matched ground '+report.soles);
  fs.writeFileSync('/tmp/hunter-six-fighters.png',Buffer.from(report.url.split(',')[1],'base64'));
  for(const [name,slot,time]of [['punch',1,.15],['rod',2,.35],['jump',3,.35],['adult',5,1.02]]){
   await page.evaluate(({slot,time})=>{setup32();joy.x=1;slot===3?V3API.doDash(p):cast(p,p.kit[slot],0);advance32(time);paint32()},{slot,time});await page.screenshot({path:`/tmp/hunter-${name}.png`});
  }
  for(const width of [1280,844]){
   await page.setViewportSize({width,height:width===1280?720:390});await page.evaluate(()=>{setup32();state='paused';openChampionDetails(5)});await page.waitForFunction(()=>[...document.querySelectorAll('#heroDetail img')].every(i=>i.complete&&i.naturalWidth));
   assert.ok(await page.locator('#heroDetail').evaluate(e=>getComputedStyle(e).backgroundImage.includes('hunter_v32')));assert.equal(await page.locator('#heroDetail [data-hero-skill]').count(),4);
   await page.screenshot({path:`/tmp/hunter-selection-${width}.png`});await page.evaluate(()=>{closeHeroDetail();setup32();paint32()});
   assert.ok(await page.locator('#attack .skill-art').evaluate(e=>getComputedStyle(e).backgroundImage.includes('hunter_v32/icon-3.webp')),'dash artwork');await page.screenshot({path:`/tmp/hunter-arena-${width}.png`});
  }
 }
 assert.deepEqual(errors,[]);await page.close();console.log('PASS Hunter '+(legacy?'legacy':'v3')+': all effects, charge/cancel, hits, leap, adult transform/recovery, unchanged oath cost, selection and dash artwork.');
 }}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
