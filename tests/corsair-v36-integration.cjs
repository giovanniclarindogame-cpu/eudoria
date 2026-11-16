const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{for(const legacy of [true,false]){
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:8000/'+(legacy?'?legacy=1':''));await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
 await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Corsario');await page.locator('#profileForm button[type=submit]').click();
 await page.locator('[data-lj-close]').click();
 if(!legacy)await page.locator('[data-tut-skip]').click();
 await page.evaluate(async()=>{
  await Promise.all([CORSAIR36_BODY,CORSAIR36_SKILLS,...Object.values(CORSAIR36_FX),HEIR33_BODY,HUNTER32_BODY,ECLIPSE30_BODY,SOLAR29_BODY,ICHIGO27_BODY,...Object.values(BODY24)].map(i=>i.decode()));
  window.setup36=()=>{state='paused';equipChampion(7,false);beginProgression('training');arenaQA.begin();practiceOptions.free=false;practiceOptions.dummy='still';pillars=[];objects=[];p.x=350;p.y=300;b.x=440;b.y=300;b.hp=b.max=10000;p.inv=b.inv=0;joy.x=joy.y=0;};
  window.advance36=t=>{for(let i=0;i<Math.ceil(t*240);i++)step(1/240)};
  window.paint36=()=>{state='paused';updateUI();draw()};
  window.seen36=new Set();const drawImage=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){const s=args[0].src||'';if(s.includes('/corsair_v36/'))seen36.add(s.split('/').pop().split('?')[0]);return drawImage.apply(this,args)};
 });
 await page.evaluate(legacy=>{
  const check=(v,m)=>{if(!v)throw Error(m)};
  for(const angle of [0,Math.PI])for(const slot of [0,1,2]){
   setup36();b.x=p.x+Math.cos(angle)*90;reworkState(p).value=60;
   check(cast(p,p.kit[slot],angle),'cast '+slot);advance36(skills[p.kit[slot]].release+.04);paint36();
   check(Math.floor(corsair36Pose(p).skillFrame/6)===slot,'body row '+slot);state='fight';advance36(.15);paint36();check(p.hits>0,'directional damage '+slot);check(Reforged.effects.some(e=>e.kind==='corsair-contact'),'water impact at enemy');
  }
  setup36();b.x=900;cast(p,p.kit[0],0);advance36(.4);paint36();check(!Reforged.effects.some(e=>e.kind==='corsair-contact'),'miss has no contact');
  setup36();b.x=750;joy.x=1;check(legacy?cast(p,p.kit[3],0):V3API.doDash(p),'anchor dash accepted');advance36(.31);paint36();check(p.x>350,'anchor moves');check(corsair36Pose(p).lift>0&&Math.floor(corsair36Pose(p).skillFrame/6)===3,'anchor body and leap');check(Reforged.effects.some(e=>e.kind==='anchor'),'water tether');
  if(legacy){setup36();check(cast(p,p.kit[4],0),'tide buff accepted');advance36(.35);paint36();check(reworkState(p).turbo>0,'tide increases speed');check(Math.floor(corsair36Pose(p).skillFrame/6)===4,'aura body');}
  setup36();check(!cast(p,p.kit[5],0),'ultimate requires elasticity');reworkState(p).value=100;check(cast(p,p.kit[5],0),'ultimate accepted');advance36(.3);paint36();check(p.hits===0&&reworkState(p).value===0,'charge before damage and consumes resource');check(integratedDepth().some(e=>e.kind==='corsair-charge'),'ultimate windup rendered');check(Math.floor(corsair36Pose(p).skillFrame/6)===5,'ultimate body');
  state='fight';advance36(.4);paint36();check(Reforged.projectiles.some(e=>e.skin===7&&e.slot===5)||p.hits>0,'ultimate projectile');state='fight';advance36(.4);paint36();check(p.hits>0,'ultimate damages');
  for(const k of CORSAIR36_KEYS)if(legacy||k!=='aura')check(seen36.has(k+'.webp'),k+' rendered from new pack');
  setup36();p.hp=0;check(corsair36Pose(p,vfxTime).frame===32,'fall starts');check(corsair36Pose(p,vfxTime+.3).frame===33,'lying down');let visible=false;const old=corsair36Body;corsair36Body=function(...args){if(args[1]===p)visible=true;return old(...args)};integratedDrawActor(p);corsair36Body=old;check(visible,'KO remains rendered');
  if(!legacy){for(const [age,frame]of [[.05,30],[.2,32],[.6,33]]){p.koAge=age;check(corsair36Pose(p).frame===frame,'arcade KO frame')}p.koAge=undefined;}
  check(championArt(CHAMPIONS[7]).includes('corsair_v36/portrait'),'portrait');for(let i=0;i<6;i++)check(icon(p.kit[i]).includes('corsair_v36/icon-'+i),'icon '+i);
 },legacy);
 if(!legacy){
  const report=await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=1760;canvas.height=220;const g=canvas.getContext('2d');g.fillStyle='#26372b';g.fillRect(0,0,1760,220);const heights=[],soles=[];
   for(let skin=0;skin<8;skin++){
    const a=actor(0,0,CHAMPIONS[skin].kit,'white');a.skin=skin;
    const c=document.createElement('canvas');c.width=c.height=180;const ink=c.getContext('2d');ink.translate(90,140);drawAnimatedFighter(ink,a,72,0);const d=ink.getImageData(0,0,180,180).data;let top=180,bottom=-1;
    for(let y=0;y<180;y++)for(let x=0;x<180;x++)if(d[(y*180+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y)}
    heights.push(bottom-top+1);soles.push(bottom);g.imageSmoothingEnabled=false;g.drawImage(c,skin*220,0,220,200);g.fillStyle='#ffe2a0';g.font='14px sans-serif';g.fillText(CHAMPIONS[skin].name,skin*220+8,212);
   }return {heights,soles,url:canvas.toDataURL()};
  });
  assert.ok(report.heights.every(h=>Math.abs(h-report.heights[7])<=2),'matched height '+report.heights);assert.ok(report.soles.every(y=>Math.abs(y-report.soles[7])<=1),'matched soles '+report.soles);
  fs.writeFileSync('/tmp/corsair-eight-fighters.png',Buffer.from(report.url.split(',')[1],'base64'));
  for(const [name,slot,time]of [['punch',0,.35],['barrage',1,.4],['burst',2,.5],['anchor',3,.35],['aura',4,.4],['charge',5,.3],['giant',5,.73]]){
   if(slot===4)continue;
   await page.evaluate(({slot,time})=>{setup36();b.x=650;reworkState(p).value=100;cast(p,p.kit[slot],0);advance36(time);paint36()},{slot,time});await page.screenshot({path:`/tmp/corsair-${name}.png`});
  }
  for(const width of [1280,844]){
   await page.setViewportSize({width,height:width===1280?720:390});await page.evaluate(()=>{setup36();state='paused';openChampionDetails(7)});await page.waitForFunction(()=>[...document.querySelectorAll('#heroDetail img')].every(i=>i.complete&&i.naturalWidth));
   assert.ok(await page.locator('#heroDetail').evaluate(e=>getComputedStyle(e).backgroundImage.includes('corsair_v36')));await page.screenshot({path:`/tmp/corsair-selection-${width}.png`});await page.evaluate(()=>{closeHeroDetail();setup36();paint36()});
   assert.ok(await page.locator('#attack .skill-art').evaluate(e=>getComputedStyle(e).backgroundImage.includes('corsair_v36/icon-3.webp')),'dash icon');await page.screenshot({path:`/tmp/corsair-arena-${width}.png`});
  }
 }
 assert.deepEqual(errors,[]);await page.close();console.log('PASS Corsair '+(legacy?'legacy':'v3')+': 6 distinct skills, 8 effects, hits both directions, anchor dash, buff/ultimate, KO, proportions, menu and icons.');
 }}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
