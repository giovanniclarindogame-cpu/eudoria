const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.originalCombatQA&&!document.querySelector('#integrationLoading'));await page.locator('#welcomeEnter').click();
  await page.locator('#profileName').fill('Astral');await page.locator('#profileForm button[type=submit]').click();
  await page.evaluate(async()=>{
   await Promise.all(Object.values(ASTRAL14_ART).map(im=>im.decode()));
   window.astralTestSetup=(stage=0,angle=0)=>{state='paused';equipChampion(0,false);beginProgression('training');arenaQA.begin();practiceOptions.dummy='still';practiceOptions.free=false;objects=[];pillars=[];p.x=500;p.y=340;p.a=angle;b.x=500+Math.cos(angle)*180;b.y=340+Math.sin(angle)*180;b.hp=b.max=10000;p.inv=b.inv=0;Object.assign(reworkState(p),{stage,value:[35,60,100][stage]});};
   window.astralTestAdvance=t=>{for(let i=0;i<Math.ceil(t*240);i++)step(1/240)};
  });
  const result=await page.evaluate(()=>{
   const check=(v,m)=>{if(!v)throw Error(m)},counts=[];
   for(const stage of [0,1,2])for(const angle of [0,Math.PI]){
    astralTestSetup(stage,angle);cast(p,p.kit[1],angle);const q=p.rwCast;const poses=new Set();
    while(p.rwCast){step(1/240);poses.add(astral14Pose(q));}
    check(p.hits===4+stage*2,'one damage event per punch');check(poses.has(1)&&poses.has(4)&&poses.has(2)&&poses.has(5),'both arms extend and retract');check(Math.abs(b.x-p.x)>75,'last punch knocks away');counts.push(p.hits);
   }
   astralTestSetup(2);cast(p,p.kit[1],0);astralTestAdvance(.45);cast(p,p.kit[3],Math.PI);const damage=p.damage;astralTestAdvance(1.5);check(p.damage===damage,'step cancels combo hits');
   astralTestSetup();b.x=900;const x=p.x;cast(p,p.kit[3],0);astralTestAdvance(.05);check(p.x===x&&astral14Pose(p.rwCast)>=8,'forehead pose before moving');astralTestAdvance(.04);check(p.x>x+140,'instant movement');check(Reforged.effects.some(e=>e.kind==='astral-depart')&&Reforged.effects.some(e=>e.kind==='astral-arrive'),'distinct exit and arrival');astralTestAdvance(.2);check(!p.rwCast,'step finishes in quarter second');
   astralTestSetup();pillars=[{x:570,y:340,r:20}];cast(p,p.kit[3],0);astralTestAdvance(.3);check(p.x<550,'blink stops before wall');
   astralTestSetup();rwBeginCharge(p,0,4);astralTestAdvance(.2);check(reworkState(p).stage===1&&Reforged.effects.some(e=>e.kind==='astral-awaken'),'awakening pulse');astralTestAdvance(1.5);check(reworkState(p).stage===2,'supreme reached');rwReleaseCharge(p);check(!p.rwCast&&Reforged.effects.some(e=>e.kind==='astral-aura-end'),'aura settles on release');
   astralTestSetup(2);cast(p,p.kit[5],0);astralTestAdvance(.9);check(p.damage===0&&p.rwCast.age<p.rwCast.release,'sphere gathers before launch');astralTestAdvance(.2);check(Reforged.effects.some(e=>e.kind==='astral-solar-flight')&&p.damage===0,'sphere travels visibly');astralTestAdvance(.47);check(Reforged.effects.some(e=>e.kind==='astral-solar-contact')&&p.damage===0,'contact pause');astralTestAdvance(.1);check(p.hits===1&&p.damage>0&&Reforged.effects.some(e=>e.kind==='astral-solar-blast'),'one explosion after contact');astralTestAdvance(2);check(!Reforged.effects.some(e=>e.kind.startsWith('astral-solar')),'dust and crater expire');
   astralTestSetup(2);cast(p,p.kit[5],0);astralTestAdvance(.4);cast(p,p.kit[3],Math.PI);astralTestAdvance(2);check(p.damage===0,'cancel before solar release prevents explosion');
   astralTestSetup(2);cast(p,p.kit[5],0);astralTestAdvance(1.1);cast(p,p.kit[3],Math.PI);astralTestAdvance(.7);check(p.hits===1&&Reforged.effects.some(e=>e.kind==='astral-solar-blast'),'launched sphere survives caster teleport');
   return counts;
  });
  for(const [name,slot,t]of [['combo',1,.4],['step',3,.05],['solar-charge',5,.65],['solar-flight',5,1.25],['solar-blast',5,1.85]]){
   await page.evaluate(({slot,t})=>{astralTestSetup(2);cast(p,p.kit[slot],0);astralTestAdvance(t);state='paused';draw()},{slot,t});await page.screenshot({path:`/tmp/astral14-${name}.png`});
  }
  await page.evaluate(()=>{astralTestSetup();rwBeginCharge(p,0,4);astralTestAdvance(1.2);state='paused';draw()});await page.screenshot({path:'/tmp/astral14-aura.png'});
  await page.setViewportSize({width:844,height:390});await page.evaluate(()=>draw());await page.screenshot({path:'/tmp/astral14-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS combo counts',result,'blink, aura, solar timeline, cancellation, desktop/mobile render');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
