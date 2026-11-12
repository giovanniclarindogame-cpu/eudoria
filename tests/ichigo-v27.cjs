const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
  // This regression suite covers the six-slot engine before the v3 HUD/balance layer.
  await page.goto('http://127.0.0.1:8000?legacy=1');
  await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
  await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Ronin');await page.locator('#profileForm button[type=submit]').click();
  await page.evaluate(async()=>{
   await Promise.all([ICHIGO27_BODY,...Object.values(BODY24),...Object.values(rpImages),...Object.values(eclipseImages)].map(i=>i.decode()));
   window.setup27=()=>{state='paused';equipChampion(2,false);beginProgression('training');arenaQA.begin();practiceOptions.free=false;practiceOptions.dummy='still';pillars=[];objects=[];p.x=400;p.y=300;b.x=470;b.y=300;b.hp=b.max=10000;p.inv=b.inv=0;};
   window.advance27=t=>{for(let i=0;i<Math.ceil(t*240);i++)step(1/240);};
  });
  await page.evaluate(()=>{
   const check=(ok,message)=>{if(!ok)throw Error(message);};
   setup27();const id=p.kit[0];check(cast(p,id,0),'first cut');advance27(.18);
   check(p.hits===1&&p.damage===55,'first cut damage');const remaining=p.cd[id];
   check(cast(p,id,0),'followup available after contact');check(p.cd[id]===remaining,'followup preserves cooldown');
   advance27(.2);check(p.hits===2&&p.damage===95,'ascending second cut');
   check(!cast(p,id,0),'no third cut');advance27(.7);check(!cast(p,id,0),'cooldown cannot be skipped');
   setup27();b.x=800;cast(p,p.kit[0],0);advance27(.2);check(!cast(p,p.kit[0],0),'miss cannot combo');
   setup27();cast(p,p.kit[0],0);advance27(1);check(!cast(p,p.kit[0],0),'followup expires');
   setup27();practiceOptions.dummy='guard';b.guard=true;b.a=Math.PI;b.st=40;b.guardPerfect=0;cast(p,p.kit[1],0);advance27(.46);check(b.hp===10000,'heavy windup');advance27(.04);check(!b.guard&&b.st<1,'heavy breaks depleted guard');check(p.damage===95,'heavy base damage after guard break');check(!rwReady(p,p.kit[0]),'heavy recovery');
   setup27();b.y=500;cast(p,p.kit[1],0);advance27(.55);check(!p.hits,'heavy misses off angle');
   setup27();cast(p,p.kit[0],0);check(!cast(p,p.kit[3],0),'cannot cancel windup');advance27(.18);b.y=500;const x=p.x;check(cast(p,p.kit[3],0),'Shunpo cancels cut recovery');advance27(.35);check(p.x>x+170,'Shunpo distance');
   setup27();pillars=[{x:470,y:300,r:20}];cast(p,p.kit[3],0);advance27(.4);check(p.x<450,'Shunpo blocked by wall');
   for(const charge of [0,.7,1.4]){
    setup27();b.x=750;reworkState(p).value=100;check(rwBeginCharge(p,0,2),'begin Getsuga charge');advance27(charge);if(p.rwCast.holding)rwReleaseCharge(p,0);
    check(reworkState(p).value===75,'Getsuga fixed cost');advance27(.22);const shot=Reforged.projectiles.find(e=>e.owner===p);check(shot&&Math.abs(shot.damage-(85+80*charge/1.4))<1,'charge scales damage');advance27(1.2);check(p.hits===1,'Getsuga hits once');
   }
   setup27();reworkState(p).value=24;check(!rwBeginCharge(p,0,2),'insufficient pressure');
   setup27();reworkState(p).value=100;rwBeginCharge(p,0,2);advance27(.5);clearInputs();check(!p.rwCast&&reworkState(p).value===100&&!p.cd[p.kit[2]],'charge cancel does not spend');
   setup27();reworkState(p).value=100;p.cd[p.kit[0]]=3;rwBeginCharge(p,0,2);hit(p,60,b,0,Math.PI,b.kit[0]);check(!p.rwCast&&p.cd[p.kit[0]]===3&&p.cd[p.kit[2]]===1,'interruption preserves cut cooldown');
   setup27();reworkState(p).value=100;const speed=identitySpeed(p);cast(p,p.kit[4],0);advance27(.8);check(reworkState(p).value===60&&reworkState(p).spiritForm>6,'Bankai cost and duration');check(Math.abs(identitySpeed(p)/speed-1.15)<.001,'Bankai speed');
   cast(p,p.kit[0],0);check(p.rwCast.duration<.4,'Bankai accelerates cuts');advance27(.16);check(p.damage===66,'Bankai damage is +20 percent');advance27(.6);
   b.x=800;cast(p,p.kit[2],0);advance27(.22);check(Reforged.projectiles.some(e=>e.bankai),'Bankai Getsuga style');advance27(7);check(!reworkState(p).spiritForm,'Bankai expires');
   setup27();reworkState(p).value=100;b.x=650;cast(p,p.kit[5],0);advance27(.5);check(ultimateCinematicActor()===p&&integratedDepth().some(e=>e.kind==='ichigo-cinematic'),'ultimate cinematic');check(reworkState(p).value===0,'ultimate consumes pressure');advance27(1.6);check(p.hits===1&&p.damage===370,'ultimate once per target');check(!ultimateCinematicActor(),'cinematic ends');
   setup27();reworkState(p).value=100;b.x=650;pillars=[{x:540,y:300,r:30}];cast(p,p.kit[5],0);advance27(2);check(!p.hits,'ultimate wall collision');
   setup27();reworkState(p).value=100;b.x=650;pillars=[{x:420,y:300,r:5}];cast(p,p.kit[5],0);advance27(2);check(!p.hits,'ultimate cannot spawn past adjacent wall');
   setup27();reworkState(p).value=100;b.y=500;cast(p,p.kit[5],0);advance27(2);check(!p.hits&&!ultimateCinematicActor(),'ultimate miss cleanup');
   setup27();reworkState(p).value=100;cast(p,p.kit[5],0);p.hp=0;check(!ultimateCinematicActor(),'death clears cinematic');
   state='paused';
  });
  // Real keyboard and touch input exercise combo overrides and charge handlers.
  for(const input of ['keyboard','touch']){
   await page.evaluate(()=>{setup27();updateUI();});
   const press=()=>input==='keyboard'?page.keyboard.press('1'):page.locator('#equipped button').nth(0).tap();
   await press();await page.waitForFunction(()=>p.hits===1);await press();await page.waitForFunction(()=>p.hits===2);await press();
   assert.ok(await page.evaluate(()=>p.hits===2&&p.cd[p.kit[0]]>2));
   await page.evaluate(()=>{state='paused';});
  }
  const sizes=await page.evaluate(()=>{
   const c=document.createElement('canvas');c.width=1200;c.height=260;const g=c.getContext('2d'),heights=[];
   for(const [i,skin]of [0,1,2,6,7,8,9].entries()){
    const a=actor(0,0,CHAMPIONS[skin].kit,'white');a.skin=skin;
    g.save();g.translate(80+i*170,175);rwPaintBody(g,a,72,0);g.restore();
    const data=g.getImageData(i*170,0,170,210).data;let top=210,bottom=0;
    for(let y=0;y<210;y++)for(let x=0;x<170;x++)if(data[(y*170+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y);}
    heights.push(bottom-top+1);g.fillStyle='white';g.font='12px sans-serif';g.fillText(CHAMPIONS[skin].name,i*170+8,225);
   }
   return {heights,url:c.toDataURL()};
  });
  assert.ok(sizes.heights[2]>=70&&sizes.heights[2]<=76,JSON.stringify(sizes.heights));
  fs.writeFileSync('/tmp/v27-scale.png',Buffer.from(sizes.url.split(',')[1],'base64'));
  for(const viewport of [{width:1280,height:720},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.evaluate(()=>{state='paused';openChampionDetails(2);});
   await page.waitForFunction(()=>[...document.querySelectorAll('#heroDetail img')].every(i=>i.complete&&i.naturalWidth));
   await page.screenshot({path:`/tmp/v27-selection-${viewport.width}.png`});
   assert.ok(await page.locator('#heroDetail').evaluate(el=>el.classList.contains('ichigo-detail')&&getComputedStyle(el).backgroundImage.includes('ichigo_v27')));
   assert.equal(await page.locator('#heroDetail .skill-art').count(),6);
  }
  await page.setViewportSize({width:1280,height:720});
  await page.evaluate(()=>{confirmChampion(true);setup27();b.x=650;reworkState(p).value=100;cast(p,p.kit[5],0);advance27(.55);state='paused';updateUI();draw();});await page.screenshot({path:'/tmp/v27-ultimate.png'});
  await page.evaluate(()=>{setup27();reworkState(p).spiritForm=7;reworkState(p).value=100;b.x=800;cast(p,p.kit[2],0);advance27(.4);state='paused';updateUI();draw();});await page.screenshot({path:'/tmp/v27-bankai.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS Ronin combo/cooldowns; guard break/recovery; charged wave/cost/cancel; Shunpo/collision; Bankai bonuses/expiry; ultimate/collision/cinematic; keyboard/touch; portraits/icons; standing heights',sizes.heights);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
