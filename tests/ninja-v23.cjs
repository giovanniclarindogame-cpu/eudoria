const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:8000');
  await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
  await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Ninja');await page.locator('#profileForm button[type=submit]').click();
  await page.evaluate(async()=>{
   await Promise.all([...Object.values(NINJA23_ART),...Object.values(DOJO_STRIKE_IMAGES)].map(i=>i.decode()));
   window.setupNinja23=()=>{state='paused';equipChampion(1,false);beginProgression('training');arenaQA.begin();practiceOptions.free=false;practiceOptions.dummy='still';pillars=[];objects=[];p.x=470;p.y=340;b.x=650;b.y=340;p.inv=b.inv=0;b.hp=b.max=10000;};
   window.advanceNinja23=t=>{for(let i=0;i<Math.ceil(t*240);i++)step(1/240);};
  });
  await page.evaluate(()=>{
   const check=(v,m)=>{if(!v)throw Error(m)};
   setupNinja23();b.skin=1;b.kit=[...CHAMPIONS[1].kit];
   check(!integratedDepth().some(e=>e.kind==='ninja-copy-eye'),'no inactive indicator');
   reworkState(p).eye=4;reworkState(b).eye=4;
   check(integratedDepth().filter(e=>e.kind==='ninja-copy-eye').length===2,'eye visible for BOTH teams');
   reworkState(p).eye=0;reworkState(p).copy={id:CHAMPIONS[0].kit[0]};
   check(integratedDepth().filter(e=>e.kind==='ninja-copy-eye').length===2,'stored copy remains visible');
   reworkState(p).copy=null;b.hp=0;
   check(!integratedDepth().some(e=>e.kind==='ninja-copy-eye'),'consumed copy and dead actor have no eye');
   for(const angle of [0,Math.PI,Math.PI/2,-Math.PI/2]){
    setupNinja23();b.x=p.x+Math.cos(angle)*180;b.y=p.y+Math.sin(angle)*180;
    cast(p,p.kit[5],angle);advanceNinja23(.3);
    check(ninja23ThunderFrame(p.rwCast)<=7&&p.hits===0,'charge before contact');
    advanceNinja23(.17);check(ninja23ThunderFrame(p.rwCast)>=8,'directional dash poses');
    advanceNinja23(.2);check(p.hits===1&&p.rwCast.thunderHitAge!==undefined,'contact controls hit pose');
    check(Reforged.effects.some(e=>e.kind==='ninja-thunder-impact'),'impact only on successful contact');
    advanceNinja23(.7);check(!p.rwCast&&p.hits===1,'recovers without repeated damage');
   }
   setupNinja23();b.y=550;cast(p,p.kit[5],0);advanceNinja23(1);
   check(p.hits===0&&!Reforged.effects.some(e=>e.kind==='ninja-thunder-impact'),'miss has no impact');
   check(ninja23ThunderFrame(p.rwCast)>=19,'miss recovers');
  });
  await page.evaluate(()=>{state='paused';arenaQA.showScreen('library');openChampionDetails(1)});
  await page.locator('#heroDetail img').first().evaluate(i=>i.decode());
  assert.ok(await page.locator('#heroDetail img').first().evaluate(i=>i.naturalWidth>1000&&i.src.includes('ninja_v23')));
  await page.screenshot({path:'/tmp/ninja23-portrait.png'});
  await page.evaluate(()=>{closeHeroDetail();setupNinja23();b.skin=1;b.kit=[...CHAMPIONS[1].kit];b.x=700;reworkState(p).eye=3;reworkState(b).copy={id:CHAMPIONS[0].kit[0]};state='paused';draw()});
  await page.screenshot({path:'/tmp/ninja23-eyes.png'});
  for(const [label,time,angle]of [['charge',.34,0],['run',.49,0],['hit',.75,0],['left',.75,Math.PI],['front',.64,Math.PI/2],['back',.64,-Math.PI/2]]){
   await page.evaluate(({time,angle})=>{setupNinja23();b.x=p.x+Math.cos(angle)*180;b.y=p.y+Math.sin(angle)*180;cast(p,p.kit[5],angle);advanceNinja23(time);state='paused';draw()},{time,angle});
   await page.screenshot({path:`/tmp/ninja23-${label}.png`});
  }
  assert.deepEqual(errors,[]);console.log('PASS eye visibility/lifecycle for both teams; ultimate charge/contact/recovery in four directions; miss without impact; high-resolution portrait; no JS or asset errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
