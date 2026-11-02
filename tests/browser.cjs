const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.arenaQA&& !document.querySelector('#integrationLoading'));
 await page.locator('#profileName').fill('Jogador');await page.locator('#profileForm button[type=submit]').click();
 const results=await page.evaluate(()=>{
  const reports=[];
  for(let skin=6;skin<10;skin++){
   arenaQA.champions.equip(skin,false);
   for(let slot=0;slot<6;slot++){
    arenaQA.progression.begin('training');arenaQA.begin();const a=arenaQA.player,t=arenaQA.bot;
    a.x=W*.4;a.y=H*.5;t.x=a.x+175;t.y=a.y;a.a=0;
    const id=a.kit[slot],ok=dojo4QA.cast(a,id,0);if(!ok)throw Error(`cast failed ${skin}/${slot}`);
    const cast=a.dojo4Cast;
    for(let i=0;i<210;i++)dojo4QA.advance(1/60);
    if(!cast.released||a.dojo4Cast)throw Error(`cast did not complete ${skin}/${slot}`);
    if(slot===0&&a.damage<=0)throw Error(`first skill did no damage ${skin}`);
    reports.push({skin,slot,released:cast.released,damage:a.damage,state:dojo4QA.motion(a).state});
   }
   const a=arenaQA.player,t=arenaQA.bot;a.inv=0;a.buff={};arenaQA.hit(a,20,t,0,0);
   if(dojo4QA.motion(a).state!=='hurt')throw Error('missing hurt');
   for(let i=0;i<30;i++)dojo4QA.advance(1/60);
   if(dojo4QA.motion(a).state==='hurt')throw Error('stuck hurt');
  }
  state='paused';return reports;
 });
 console.log('Skills: '+results.length+'/24 complete; four offensive skills dealt damage; hurt recovered 4/4');
 await page.evaluate(()=>{arenaQA.champions.equip(6,false);arenaQA.progression.begin('training');arenaQA.begin();});
 await page.keyboard.down('w');await page.waitForTimeout(180);
 assert.equal(await page.evaluate(()=>dojo4QA.motion(arenaQA.player).state),'walk');
 assert.ok(await page.evaluate(()=>dojo4QA.motion(arenaQA.player).frame>=18));await page.keyboard.up('w');
 await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>dojo4QA.motion(arenaQA.player).state),'idle');
 await page.keyboard.down('k');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>dojo4QA.motion(arenaQA.player).frame),34);await page.keyboard.up('k');
 for(const viewport of [{width:1366,height:768},{width:844,height:390},{width:390,height:844}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(150);
  const layout=await page.evaluate(()=>{
   const {cw,ch,scale,ox,oy}=arenaQA.projection,{W,H}=arenaQA.dimensions;
   return {visible:ox>=0&&oy>=0&&ox+W*scale<=cw+.1&&oy+H*scale<=ch+.1,
    buttons:[...document.querySelectorAll('#equipped button,#attack,#defend,#dodge')].map(el=>{const r=el.getBoundingClientRect();return {visible:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===el};})};
  });
  assert.ok(layout.visible,JSON.stringify({viewport,layout}));assert.ok(layout.buttons.every(b=>b.visible&&b.hit),JSON.stringify({viewport,layout}));
  console.log('Viewport '+viewport.width+'x'+viewport.height+': field visible, 9 controls accessible');
 }
 await page.evaluate(()=>{
  for(let skin=0;skin<6;skin++){arenaQA.champions.equip(skin,false);arenaQA.progression.begin('training');arenaQA.begin();for(let i=0;i<5;i++)dojo4QA.advance(1/60);draw();}
  arenaQA.champions.equip(6,false);arenaQA.arenas.begin('zone');arenaQA.begin();for(let i=0;i<60;i++)dojo4QA.advance(1/60);if(actors.length!==4||W<=H)throw Error('2v2 landscape failed');draw();
 });
 console.log('PASS: six original champions render; 2v2 zone starts with four fighters');
 await page.setViewportSize({width:1366,height:768});
 await page.evaluate(()=>{arenaQA.progression.begin('training');arenaQA.begin();p.x=W*.43;p.y=H*.50;b.x=W*.60;b.y=H*.50;b.skin=8;b.trainingDummy=false;b.label='Cavaleiro';b.kit=[...CHAMPIONS[8].kit];dojo4Preload(8);updateUI();});
 await page.waitForTimeout(300);await page.evaluate(()=>{state='paused';});await page.screenshot({path:'/tmp/eldoria-arena-final.png'});
 await page.goto('http://127.0.0.1:8000/PREVIA_4_CAMPEOES.html');await page.locator('[data-hero="3"]').click();await page.locator('[data-mode="guard"]').click();await page.waitForTimeout(200);
 assert.equal(await page.locator('#state').textContent(),'Defesa');
 await page.locator('[data-slot="5"]').click();await page.waitForTimeout(2200);assert.equal(await page.locator('#state').textContent(),'Parado');
 assert.deepEqual(errors,[]);console.log('PASS: keyboard movement/guard, studio recovery, no JS errors or HTTP asset failures');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
