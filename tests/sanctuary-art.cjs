const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000');
  await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
  await page.locator('#profileName').fill('Santuário');
  await page.locator('#profileForm button[type=submit]').click();
  const results=await page.evaluate(async()=>{
   await Promise.all(Object.values(SANCTUARY_ART).map(im=>im.decode()));
   const check=(value,message)=>{if(!value)throw Error(message);};
   equipChampion(0,false);beginProgression('training');arenaQA.begin();state='paused';
   const advance=t=>{state='fight';for(let i=0;i<Math.ceil(t*240);i++)step(1/240);state='paused';};
   const cache=groundCache,builds=backgroundBuilds;
   for(let i=0;i<30;i++){buildArenaBackground();draw();}
   check(groundCache===cache&&backgroundBuilds===builds,'background must remain cached');
   const o=pillars[0];p.x=o.x-90;p.y=o.y;move(p,150,0);
   check(p.x<=o.x-o.r-p.r+1,'lantern must still block movement');
   p.y=o.y-50;
   let entries=integratedDepth();
   check(entries.findIndex(e=>e.kind==='actor'&&e.y===p.y)<entries.findIndex(e=>e.kind==='pillar'&&e.y===o.y),'fighter behind lantern');
   p.y=o.y+50;entries=integratedDepth();
   check(entries.findIndex(e=>e.kind==='actor'&&e.y===p.y)>entries.findIndex(e=>e.kind==='pillar'&&e.y===o.y),'fighter in front of lantern');
   resetPractice();practiceOptions.dummy='guard';advance(.05);
   check(b.guard&&sanctuaryDummyFrame(b)>=6&&sanctuaryDummyFrame(b)<12,'guard mode must use guard animation');
   practiceOptions.dummy='still';advance(.05);state='fight';hit(b,10,p,0,0,-1);state='paused';
   check(b.hitReact>0&&sanctuaryDummyFrame(b)>=12&&sanctuaryDummyFrame(b)<18,'damage must trigger hit reaction');
   advance(.35);check(sanctuaryDummyFrame(b)<6,'hit reaction must recover');
   resetPractice();p.x=b.x-55;practiceOptions.dummy='attack';advance(.04);
   check(b.punchTime>0&&sanctuaryDummyFrame(b)>=18,'attack mode must animate punches');
   resetPractice();practiceOptions.dummy='still';
   const original=ctx.drawImage,transforms=[];
   ctx.drawImage=function(im,...args){if(im===SANCTUARY_ART.dummy){const m=this.getTransform();transforms.push([m.a,m.b,m.c,m.d]);}return original.call(this,im,...args);};
   try{for(const angle of [0,Math.PI,Math.PI/2,-Math.PI/2]){b.a=angle;drawTrainingDummy(b);}}finally{ctx.drawImage=original;}
   check(transforms.every(m=>m[1]===0&&m[2]===0&&m[3]>0),'dummy must stay upright in every direction');
   updateUI();check(document.querySelector('.fighterhud.enemy .arena-portrait').getAttribute('src').includes('fantoche-retrato'),'dummy portrait');
   for(const mode of ['2v2','1v1']){matchMode=mode;configureArenaSize();buildArenaBackground();check(groundCache.width===W&&groundCache.height===H,'art must resize with mode');}
   resetPractice();p.x=W*.43;b.x=W*.59;courtyardWide=true;resize();draw();
   return {dimensions:[W,H],assets:Object.keys(SANCTUARY_ART).length};
  });
  await page.screenshot({path:'/tmp/sanctuary-wide.png'});
  await page.setViewportSize({width:844,height:390});
  await page.evaluate(()=>{courtyardWide=false;resize();draw();});
  await page.screenshot({path:'/tmp/sanctuary-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS sanctuary cache, collisions, depth, training states, upright facing, portrait, arena sizes, desktop/mobile renders',results);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
