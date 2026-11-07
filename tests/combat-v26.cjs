const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:8000');
  await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
  await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Combate');await page.locator('#profileForm button[type=submit]').click();
  await page.evaluate(async()=>{
   await Promise.all([...Object.values(BODY24),...Object.values(THUNDER25),...Object.values(rpImages),...Object.values(eclipseImages)].map(i=>i.decode()));
   window.setup26=(skin=1)=>{state='paused';equipChampion(skin,false);beginProgression('training');arenaQA.begin();practiceOptions.free=false;practiceOptions.dummy='still';pillars=[];objects=[];p.x=400;p.y=300;b.x=460;b.y=300;b.hp=b.max=10000;p.inv=b.inv=0;};
   window.advance26=t=>{for(let i=0;i<Math.ceil(t*240);i++)step(1/240);};
  });
  const sizes=await page.evaluate(()=>{
   const c=document.createElement('canvas');c.width=1200;c.height=260;const g=c.getContext('2d'),heights=[];
   for(let skin=0;skin<6;skin++){
    const a=actor(0,0,CHAMPIONS[skin].kit,'white');a.skin=skin;
    g.save();g.translate(100+skin*190,180);rwPaintBody(g,a,72,0);g.restore();
    const data=g.getImageData(skin*190,0,190,210).data;let top=210,bottom=0;
    for(let y=0;y<210;y++)for(let x=0;x<190;x++)if(data[(y*190+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y);}
    heights.push(bottom-top+1);g.fillStyle='white';g.font='14px sans-serif';g.fillText(CHAMPIONS[skin].name,skin*190+10,225);
   }
   if(Math.max(...heights)-Math.min(...heights)>4)throw Error('Inconsistent standing heights '+heights);
   return {heights,url:c.toDataURL()};
  });
  fs.writeFileSync('/tmp/v26-scale.png',Buffer.from(sizes.url.split(',')[1],'base64'));
  await page.evaluate(()=>{
   const check=(ok,message)=>{if(!ok)throw Error(message);};
   // A single legal return, then a real cooldown; repeated inputs cannot erase it.
   setup26();const id=p.kit[0];check(cast(p,id,0),'first cut');advance26(.16);
   const remaining=p.cd[id];check(remaining>3.7,'four second cooldown starts immediately');
   check(cast(p,id,0),'return cut');check(p.cd[id]===remaining,'return preserves remaining cooldown');
   for(let i=0;i<20;i++)check(!cast(p,id,0),'no third cut');advance26(.5);
   check(p.hits===2,'exactly two hits');check(!skillControlState(p,skills[id]).ready,'button shows cooldown');
   advance26(3.5);check(cast(p,id,0),'ready after full cooldown');
   setup26();b.x=800;cast(p,p.kit[0],0);advance26(.5);check(!cast(p,p.kit[0],0),'miss retains cooldown');
   setup26();cast(p,p.kit[0],0);advance26(.9);check(!cast(p,p.kit[0],0),'expired return cannot bypass cooldown');
   // All fighters share directional contact, including close diagonal targets.
   for(let skin=0;skin<10;skin++)for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const [distance,side,expected]of [[55,0,true],[35,26,true],[55,32,false],[76,0,false],[-35,0,false]]){
    setup26(skin);b.x=p.x+Math.cos(angle)*distance-Math.sin(angle)*side;b.y=p.y+Math.sin(angle)*distance+Math.cos(angle)*side;
    const before=b.hp;punch(p,angle,22);check((b.hp<before)===expected,`contact ${skin}/${angle}/${distance}/${side}`);
    check(!fx.some(e=>e.kind==='punch'),'no attack tracer');
   }
   setup26();pillars=[{x:430,y:300,r:10}];const hp=b.hp;punch(p,0,22);check(b.hp===hp,'wall blocks normal attack');
   setup26();b.guard=true;b.a=Math.PI;b.guardPerfect=0;const guardedHP=b.hp;punch(p,0,22);check(guardedHP-b.hp>0&&guardedHP-b.hp<22,'guard still reduces damage');
   setup26();b.inv=1;const invHP=b.hp;punch(p,0,22);check(b.hp===invHP,'dash invulnerability still works');
   setup26();let arcs=0;const originalArc=ctx.arc;ctx.arc=function(...args){arcs++;return originalArc.apply(this,args);};
   p.guard=false;integratedDrawActor(p);const idleArcs=arcs;arcs=0;p.guard=true;integratedDrawActor(p);ctx.arc=originalArc;check(arcs===idleArcs,'guard does not add an arc');
   setup26(0);reworkState(p).value=100;b.x=650;check(cast(p,p.kit[5],0),'Goku ultimate');advance26(.5);
   check(ultimateCinematicActor()===p&&integratedDepth().some(e=>e.kind==='astral-cinematic-light'),'Goku cinematic preparation');
   thunder25Zoom=1;thunder25CameraTime=vfxTime-.1;updateArenaCamera();check(thunder25Zoom>1,'Goku cinematic zoom');
   advance26(.6);check(!integratedDepth().some(e=>e.kind==='astral-cinematic-light'),'preparation shade ends at release');
   advance26(3);check(!ultimateCinematicActor(),'cinematic completes');
   setup26(0);reworkState(p).value=100;cast(p,p.kit[5],0);p.hp=0;check(!ultimateCinematicActor(),'death cancels cinematic');
   // Character preview must use normal cooldowns unless free mode is explicitly enabled.
   state='paused';openChampionDetails(1);practiceOptions.free=true;confirmChampion(true);check(!practiceOptions.free,'test character uses normal cooldowns');
   state='paused';
  });
  // Both keyboard and touch get one return, then the same countdown.
  for(const input of ['keyboard','touch']){
   await page.evaluate(()=>{setup26();updateUI();});
   const press=()=>input==='keyboard'?page.keyboard.press('1'):page.locator('#equipped button').nth(0).tap();
   await press();await page.waitForFunction(()=>p.hits===1);await press();await page.waitForFunction(()=>p.hits===2);await press();
   assert.ok(await page.evaluate(()=>p.hits===2&&p.cd[p.kit[0]]>2));
   await page.evaluate(()=>{state='paused';});
  }
  for(const skin of [0,1,6,9]){
   await page.evaluate(skin=>{setup26(skin);state='paused';updateUI();},skin);
   assert.equal(await page.locator('.universal-action-art').count(),3);
   const backgrounds=await page.locator('.universal-action-art').evaluateAll(els=>els.map(e=>getComputedStyle(e).backgroundPosition));
   assert.equal(new Set(backgrounds).size,3);
  }
  for(const viewport of [{width:1280,height:720},{width:844,height:390},{width:667,height:375}]){
   await page.setViewportSize(viewport);await page.evaluate(()=>{setup26();state='paused';updateUI();draw();});
   assert.ok(await page.locator('#attack,#defend,#dodge').evaluateAll(els=>els.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})));
   await page.screenshot({path:`/tmp/v26-controls-${viewport.width}.png`});
  }
  await page.setViewportSize({width:1280,height:720});
  for(const [name,skin]of [['kakashi',1],['goku',0]]){
   await page.evaluate(skin=>{setup26(skin);b.x=650;if(skin===1){rwBeginCharge(p,0,5);advance26(1.5);}else{reworkState(p).value=100;cast(p,p.kit[5],0);advance26(.7);}state='paused';updateUI();draw();},skin);
   await page.screenshot({path:`/tmp/v26-${name}-charge.png`});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS heights',sizes.heights,'; cooldown + one return on keyboard/touch; 200 directional normal attack cases; wall/guard/invulnerability; no attack/guard lines; Goku cinematic lifecycle; universal icons across champions and three viewports');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
