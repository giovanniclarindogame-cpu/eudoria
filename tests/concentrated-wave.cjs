const {chromium}=require('playwright'),assert=require('node:assert/strict'),sharp=require('sharp'),crypto=require('node:crypto');
(async()=>{
 for(const name of ['charge','beam','impact']){
  const file=`assets/reforged_v10/wave-${name}.webp`,m=await sharp(file).metadata();
  assert.equal(m.width,768);assert.equal(m.height,512);assert.ok(m.hasAlpha);
  const frames=new Set();for(let f=0;f<24;f++){
   const data=await sharp(file).extract({left:f%6*128,top:Math.floor(f/6)*128,width:128,height:128}).raw().toBuffer();
   frames.add(crypto.createHash('sha256').update(data).digest('hex'));
  }assert.equal(frames.size,24);
 }
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.originalCombatQA&&!document.querySelector('#integrationLoading'));
  await page.locator('#profileName').fill('Onda');await page.locator('#profileForm button[type=submit]').click();
  await page.evaluate(async()=>{
   await Promise.all(Object.values(ASTRAL_WAVE_ART).map(im=>im.decode()));
   window.waveAdvance=t=>{for(let i=0;i<Math.ceil(t*120);i++)step(1/120)};
   window.waveSetup=(angle=0,stage=0)=>{
    state='paused';equipChampion(0,false);beginProgression('training');arenaQA.begin();practiceOptions.free=false;practiceOptions.dummy='still';pillars=[];objects=[];
    p.x=520;p.y=330;b.x=p.x+Math.cos(angle)*200;b.y=p.y+Math.sin(angle)*200;b.max=b.hp=10000;p.inv=b.inv=0;
    Object.assign(reworkState(p),{value:100,stage});rwBeginCharge(p,angle,2);
   };
  });
  const result=await page.evaluate(()=>{
   const check=(v,m)=>{if(!v)throw Error(m)};const damage=[];
   for(const stage of [0,1,2])for(const angle of [0,Math.PI,Math.PI/2,-Math.PI/2]){
    waveSetup(angle,stage);waveAdvance(1.49);check(p.rwCast.holding,'holding until limit');rwReleaseCharge(p,angle);const q=p.rwCast;
    waveAdvance(.25);const e=Reforged.effects.find(e=>e.kind==='concentrated-wave');check(e&&e.duration===.7,'separate sustained beam');
    const path=astralWavePath(p,angle,e.range);check(dist(path.from,p)>0,'starts at hands');waveAdvance(.9);
    check(p.damage>200&&!p.rwCast,'damage and recovery in every direction');check(!Reforged.effects.some(e=>e.kind==='concentrated-wave'),'effect expires');damage.push(p.damage);
   }
   waveSetup();waveAdvance(.1);rwReleaseCharge(p);waveAdvance(1.2);const short=p.damage;
   check(damage[0]>short*1.5,'full charge is stronger');
   waveSetup();waveAdvance(1.55);check(!p.rwCast.holding,'auto-release at 1.5 seconds');
   waveSetup();waveAdvance(.5);rwReleaseCharge(p);waveAdvance(.3);const before=p.damage;cast(p,p.kit[3],Math.PI);waveAdvance(1);
   check(p.damage===before,'cancel stops remaining damage');
   waveSetup();pillars=[{x:620,y:330,r:30}];waveAdvance(.5);rwReleaseCharge(p);waveAdvance(1.2);check(p.damage===0,'wall blocks beam damage');
   waveSetup();p.hp=0;waveAdvance(.2);check(!p.rwCast,'death cancels charge');
   return {directions:12,short,full:damage[0]};
  });
  for(const [name,angle,phase]of [['charge',0,'charge'],['right',0,'fire'],['left',Math.PI,'fire']]){
   await page.evaluate(({angle,phase})=>{waveSetup(angle);waveAdvance(1.2);if(phase==='fire'){rwReleaseCharge(p,angle);waveAdvance(.45)}state='paused';draw()},{angle,phase});
   await page.screenshot({path:`/tmp/onda-${name}.png`});
  }
  await page.setViewportSize({width:844,height:390});await page.evaluate(()=>draw());await page.screenshot({path:'/tmp/onda-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS 72 sprite frames, charge, 12 stage/direction cases, wall, cancel, death, desktop/mobile renders',result);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
