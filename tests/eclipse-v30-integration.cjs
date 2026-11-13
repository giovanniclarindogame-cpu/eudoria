const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{for(const legacy of [true,false]){
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:8000/'+(legacy?'?legacy=1':''));await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
 await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Eclipse');await page.locator('#profileForm button[type=submit]').click();
 await page.evaluate(async()=>{
  await Promise.all([ECLIPSE30_BODY,...Object.values(ECLIPSE30_FX),SOLAR29_BODY,ICHIGO27_BODY,...Object.values(BODY24)].map(i=>i.decode()));
  window.setup30=()=>{state='paused';equipChampion(4,false);beginProgression('training');arenaQA.begin();practiceOptions.free=false;practiceOptions.dummy='still';pillars=[];objects=[];p.x=350;p.y=300;b.x=430;b.y=300;b.hp=b.max=10000;p.inv=b.inv=0;joy.x=joy.y=0;};
  window.advance30=t=>{for(let i=0;i<Math.ceil(t*240);i++)step(1/240)};
  window.paint30=()=>{state='paused';updateUI();draw()};
  window.seen30=new Set();const old=eclipse30Effect;eclipse30Effect=function(...args){seen30.add(args[1]);return old(...args)};
 });
 await page.evaluate(legacy=>{
  const check=(v,m)=>{if(!v)throw Error(m)};
  setup30();cast(p,p.kit[0],0);advance30(.25);paint30();check(p.hits>0,'repulse damage');check(b.x>430,'repulse pushes');
  setup30();b.x=580;cast(p,p.kit[1],0);advance30(.35);paint30();check(b.x<580&&p.hits>0,'attract pulls and damages');
  setup30();b.x=650;cast(p,p.kit[2],0);advance30(.5);paint30();check(Reforged.projectiles.length>0,'red projectile');state='fight';advance30(1.4);paint30();check(p.hits>0,'red hits');
  setup30();b.x=550;joy.x=1;check(legacy?cast(p,p.kit[3],0):V3API.doDash(p),'teleport accepted');advance30(.15);paint30();check(p.x>350,'teleport moves');check(Reforged.effects.filter(e=>e.skin===4&&['departure','arrival'].includes(e.kind)).length===2,'one departure and arrival');
  setup30();if(legacy){cast(p,p.kit[4],0);advance30(.2)}else advance30(.1);paint30();check(reworkState(p).barrier,'barrier active');check(integratedDepth().some(e=>e.kind==='eclipse-barrier'),'new barrier renders');
  reworkState(p).barrier=false;reworkState(p).barrierBroken=3.8;paint30();check(integratedDepth().some(e=>e.kind==='eclipse-barrier'),'broken barrier renders');
  setup30();b.x=550;check(cast(p,p.kit[5],0),'domain accepted');advance30(.6);paint30();check(!objects.some(o=>o.v10Domain),'domain warning precedes zone');state='fight';advance30(.5);paint30();check(objects.some(o=>o.v10Domain),'domain zone');check(integratedDepth().some(e=>e.kind==='eclipse-domain'),'new domain renders');check(!integratedDepth().some(e=>e.kind==='domain'),'old domain removed');state='fight';advance30(1);paint30();check(p.hits>0,'domain damage');p.hp=0;check(!integratedDepth().some(e=>e.kind==='eclipse-domain'||e.kind==='eclipse-barrier'),'death clears persistent visuals');
  for(const key of ['repulse','attract','red','teleport','barrier','domain','impact'])check(seen30.has(key),key+' rendered');
  check(championArt(CHAMPIONS[4])==='assets/portraits/campeao_05.webp','fixed portrait');for(let i=0;i<6;i++)check(icon(CHAMPIONS[4].kit[i]).includes('eclipse_v30/icon-'+i),'icon '+i);
 },legacy);
 if(!legacy)for(const width of [1280,844]){
  await page.setViewportSize({width,height:width===1280?720:390});await page.evaluate(()=>{setup30();state='paused';openChampionDetails(4)});await page.waitForFunction(()=>[...document.querySelectorAll('#heroDetail img')].every(i=>i.complete&&i.naturalWidth));
  assert.ok(await page.locator('#heroDetail').evaluate(e=>getComputedStyle(e).backgroundImage.includes('eclipse_v30')));assert.equal(await page.locator('#heroDetail [data-hero-skill]').count(),4);
  await page.screenshot({path:`/tmp/eclipse-selection-${width}.png`});await page.evaluate(()=>{closeHeroDetail();setup30();advance30(.1);paint30()});await page.screenshot({path:`/tmp/eclipse-arena-${width}.png`});
 }
 assert.deepEqual(errors,[]);await page.close();console.log('PASS Eclipse '+(legacy?'legacy':'v3')+': seven effects, pushes/pulls, projectile damage, teleport, barrier, domain, death cleanup, fixed portrait, six icons, selection');
 }}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
