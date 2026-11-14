const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{for(const legacy of [true,false]){
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:8000/'+(legacy?'?legacy=1':''));await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
 await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Centelha');await page.locator('#profileForm button[type=submit]').click();
 await page.evaluate(async()=>{
  await Promise.all([HEIR33_BODY,...Object.values(HEIR33_FX),HUNTER32_BODY,ECLIPSE30_BODY,SOLAR29_BODY,ICHIGO27_BODY,...Object.values(BODY24)].map(i=>i.decode()));
  window.setup33=()=>{state='paused';equipChampion(6,false);beginProgression('training');arenaQA.begin();practiceOptions.free=false;practiceOptions.dummy='still';pillars=[];objects=[];p.x=350;p.y=300;b.x=420;b.y=300;b.hp=b.max=10000;p.inv=b.inv=0;joy.x=joy.y=0;};
  window.advance33=t=>{for(let i=0;i<Math.ceil(t*240);i++)step(1/240)};
  window.paint33=()=>{state='paused';updateUI();draw()};
  window.seen33=new Set();const old=heir33Effect;heir33Effect=function(...args){seen33.add(args[1]);return old(...args)};
 });
 await page.evaluate(legacy=>{
  const check=(v,m)=>{if(!v)throw Error(m)};
  for(const angle of [0,Math.PI]){
   setup33();p.a=angle;b.x=p.x+Math.cos(angle)*70;reworkState(p).value=40;
   check(cast(p,p.kit[1],angle),'kick accepted');advance33(.16);paint33();check(p.hits>0,'kick damages in both directions');check(window.COMBAT_V3?reworkState(p).value>=40:reworkState(p).value===26,'kick reduces overload by14 (legacy) / no longer empties it (v3)');check(heir33Pose(p).frame===26,'kick uses kick pose');
   setup33();b.x=p.x+Math.cos(angle)*70;check(rwBeginCharge(p,angle,0),'charge accepted');advance33(.8);paint33();check(p.rwCast.holding&&p.hits===0,'holding has no premature damage');
   state='fight';check(rwReleaseCharge(p,angle),'charge releases');advance33(.22);paint33();check(p.hits>0,'charged punch hits');check(Reforged.effects.some(e=>e.kind==='heir-contact'&&e.slot===0),'punch contact at enemy');check(reworkState(p).value>20&&reworkState(p).value<30,'charge overload retained');
  }
  setup33();rwBeginCharge(p,0,0);advance33(.4);hit(p,60,b,0,0,b.kit[0]);check(!p.rwCast,'damage interrupts held charge');
  setup33();b.x=900;cast(p,p.kit[0],0);advance33(.3);paint33();check(!Reforged.effects.some(e=>e.kind==='heir-contact'),'miss has no false contact');
  setup33();b.x=610;check(cast(p,p.kit[2],0),'ricochet accepted');advance33(.3);paint33();check(p.x>350&&heir33Pose(p).lift>0,'jump moves and lifts body');check(integratedDepth().some(e=>e.kind==='heir-leap-trail'),'jump trail rendered');
  state='fight';advance33(.6);paint33();check(p.x>590&&p.hits>0,'second landing damages');check(Reforged.effects.some(e=>e.slot===2&&e.kind==='impact'),'landing effect');
  if(legacy){
   setup33();b.x=600;check(cast(p,p.kit[3],0),'legacy wind accepted');advance33(.3);paint33();check(Reforged.projectiles.some(e=>e.skin===6&&e.slot===3),'wind projectile retained');state='fight';advance33(.5);paint33();check(p.hits>0,'wind projectile contact');
   setup33();check(cast(p,p.kit[4],0),'power toggle accepted');advance33(.3);paint33();check(reworkState(p).empowered,'power activated');state='fight';advance33(.3);check(p.hp<1000&&reworkState(p).value>0,'power still costs life and gains overload');check(cast(p,p.kit[4],0),'power turns off');paint33();check(!reworkState(p).empowered&&Reforged.effects.some(e=>e.kind==='heir-aura-off'),'aura dissipates');
  }else{
   setup33();b.x=900;joy.x=1;check(V3API.doDash(p),'v3 dash accepted');advance33(.08);paint33();check(p.x>350&&heir33Pose(p).frame===35,'dash moves with lunge pose');check(Reforged.effects.some(e=>e.kind==='heir-dash'),'dash trail follows fighter');
   state='fight';advance33(.2);paint33();check(p.x>510,'full dash distance retained');
  }
  setup33();check(!cast(p,p.kit[5],0),'ultimate still needs full overload');reworkState(p).value=100;const hp=p.hp;
  check(cast(p,p.kit[5],0),'ultimate accepted with full bar');advance33(.3);paint33();check(p.hp===hp&&p.hits===0,'ultimate damage waits for release');check(integratedDepth().some(e=>e.kind==='heir-windup'),'ultimate has visible charging effect');check(reworkState(p).value===0&&reworkState(p).arm>0,'ultimate bar and arm cost retained');
  state='fight';advance33(.36);paint33();check(p.hits>0,'ultimate damage');check(p.hp<=hp*.05&&p.hp>0,'ultimate leaves5%HP');check(heir33Pose(p).frame===25,'ultimate punch pose');state='fight';advance33(1.5);paint33();check(!p.rwCast&&!integratedDepth().some(e=>e.kind==='heir-windup'),'ultimate cleans up');
  setup33();p.hp=0;check(heir33Pose(p,vfxTime).frame===32,'K.O. starts falling');check(heir33Pose(p,vfxTime+.3).frame===33,'K.O. ends lying down');
  if(!legacy){const frames=[];for(const age of [.05,.2,.6]){p.koAge=age;frames.push(heir33Pose(p).frame)}check(frames.join(',')==='30,32,33','arcade K.O. follows slow-motion reaction/fall/lying sequence');p.koAge=undefined;}
  let corpsePainted=false;const drawBody=heir33Body;heir33Body=function(...args){if(args[1]===p)corpsePainted=true;return drawBody(...args)};integratedDrawActor(p);heir33Body=drawBody;check(corpsePainted,'dead actor remains visible in actual renderer');
  p.hp=100;check(heir33Pose(p,vfxTime+.4).frame<6,'revival clears K.O.');p.hp=0;check(heir33Pose(p,vfxTime+.5).frame===32,'next K.O. restarts falling');
  setup33();reworkState(p).value=100;cast(p,p.kit[5],0);advance33(.2);p.hp=0;check(!integratedDepth().some(e=>e.kind==='heir-windup'),'death stops charging effect');
  for(const key of HEIR33_KEYS)if(legacy||key!=='aura')check(seen33.has(key),key+' was rendered');
  check(championArt(CHAMPIONS[6]).includes('heir_v33/portrait'),'new portrait');for(let i=0;i<6;i++)check(icon(p.kit[i]).includes('heir_v33/icon-'+i),'new icon '+i);
 },legacy);
 // The outcome freezes the simulation, but the visible fall must still settle.
 await page.evaluate(()=>{setup33();state='end';p.hp=0;heir33Pose(p);});
 await page.waitForTimeout(300);
 assert.equal(await page.evaluate(()=>heir33Pose(p).frame),33,'K.O. settles with frozen simulation');
 await page.evaluate(()=>{state='paused';draw()});await page.screenshot({path:`/tmp/heir-ko-${legacy?'legacy':'v3'}.png`});
 if(!legacy){
  const report=await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=1540;canvas.height=220;const g=canvas.getContext('2d');g.fillStyle='#26372b';g.fillRect(0,0,1540,220);const heights=[],soles=[];
   for(let skin=0;skin<7;skin++){
    const a=actor(0,0,CHAMPIONS[skin].kit,'white');a.skin=skin;
    const c=document.createElement('canvas');c.width=c.height=180;const ink=c.getContext('2d');ink.translate(90,140);drawAnimatedFighter(ink,a,72,0);const d=ink.getImageData(0,0,180,180).data;let top=180,bottom=-1;
    for(let y=0;y<180;y++)for(let x=0;x<180;x++)if(d[(y*180+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y)}
    heights.push(bottom-top+1);soles.push(bottom);g.imageSmoothingEnabled=false;g.drawImage(c,skin*220,0,220,200);g.fillStyle='#ffe2a0';g.font='14px sans-serif';g.fillText(CHAMPIONS[skin].name,skin*220+8,212);
   }return {heights,soles,url:canvas.toDataURL()};
  });
  assert.ok(report.heights.every(h=>Math.abs(h-report.heights[6])<=2),'matched roster heights '+report.heights);assert.ok(report.soles.every(y=>Math.abs(y-report.soles[6])<=1),'matched ground '+report.soles);
  fs.writeFileSync('/tmp/heir-seven-fighters.png',Buffer.from(report.url.split(',')[1],'base64'));
  for(const [name,slot,time]of [['kick',1,.16],['punch',0,.24],['leap',2,.3],['ultimate-charge',5,.3],['ultimate',5,.68],['dash',3,.09]]){
   await page.evaluate(({slot,time})=>{setup33();joy.x=1;if(slot===5)reworkState(p).value=100;slot===3?V3API.doDash(p):cast(p,p.kit[slot],0);advance33(time);paint33()},{slot,time});await page.screenshot({path:`/tmp/heir-${name}.png`});
  }
  for(const width of [1280,844]){
   await page.setViewportSize({width,height:width===1280?720:390});await page.evaluate(()=>{setup33();state='paused';openChampionDetails(6)});await page.waitForFunction(()=>[...document.querySelectorAll('#heroDetail img')].every(i=>i.complete&&i.naturalWidth));
   assert.ok(await page.locator('#heroDetail').evaluate(e=>getComputedStyle(e).backgroundImage.includes('heir_v33')));assert.equal(await page.locator('#heroDetail [data-hero-skill]').count(),4);
   await page.screenshot({path:`/tmp/heir-selection-${width}.png`});await page.evaluate(()=>{closeHeroDetail();setup33();paint33()});
   assert.ok(await page.locator('#attack .skill-art').evaluate(e=>getComputedStyle(e).backgroundImage.includes('heir_v33/icon-3.webp')),'dash artwork');await page.screenshot({path:`/tmp/heir-arena-${width}.png`});
  }
  // Finish an actual duel through the shared arcade K.O. flow, including the banner.
  await page.evaluate(()=>{setup33();battleActivity='casual';matchMode='1v1';b.cd.fill(999);b.root=999;p.hp=1;p.inv=0;hit(p,60,b,0,0,-1);step(1/60);});
  await page.waitForTimeout(300);
  assert.ok(await page.evaluate(()=>!!KoV3.seq&&p.koAge!==undefined&&heir33Pose(p).frame!==33),'slow-motion K.O. begins visibly');
  await page.waitForTimeout(2400);
  assert.equal(await page.evaluate(()=>heir33Pose(p).frame),33,'Herdeiro lies down during outcome banner');
  assert.equal(await page.locator('#koBanner .ko-txt').textContent(),'VOCÊ PERDEU');await page.screenshot({path:'/tmp/heir-ko-arcade.png'});
  await page.waitForTimeout(1800);
  assert.equal(await page.evaluate(()=>state),'end');assert.ok(await page.locator('#outcome').isVisible(),'final result remains functional');
 }
 assert.deepEqual(errors,[]);await page.close();console.log('PASS Heir '+(legacy?'legacy':'v3')+': effects, charge/cancel, directional hits, double jump, wind/dash, overload and ultimate costs, falling/lying K.O., selection and icons.');
 }}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
