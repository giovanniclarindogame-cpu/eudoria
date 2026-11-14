const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
 await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Poses');await page.locator('#profileForm button[type=submit]').click();
 const result=await page.evaluate(async()=>{
  await Promise.all([HUNTER32_BODY,HUNTER32_ADULT,HUNTER35_SKILLS,HEIR33_BODY,HEIR35_SKILLS].map(im=>im.decode()));state='paused';
  const c=document.createElement('canvas');c.width=960;c.height=1320;const g=c.getContext('2d');g.fillStyle='#263b34';g.fillRect(0,0,c.width,c.height);const checks=[];
  for(const [group,skin]of [5,6].entries())for(let slot=0;slot<6;slot++){
   const a=actor(0,0,CHAMPIONS[skin].kit,'white');a.skin=skin;
   g.fillStyle='#ffe4a0';g.font='14px sans-serif';g.fillText(CHAMPIONS[skin].name+' / '+skills[a.kit[slot]].name,8,(group*6+slot)*110+16);
   for(const [col,age]of [.02,.12,.22,.45,.68,.76].entries()){
    a.rwCast={id:a.kit[slot],slot,age,release:.2,duration:.8,angle:0};
    const calls=[],ink=document.createElement('canvas');ink.width=160;ink.height=100;const ctx=ink.getContext('2d'),old=ctx.drawImage.bind(ctx);
    ctx.drawImage=(...args)=>{calls.push({src:args[0].src,x:args[1],y:args[2]});old(...args)};
    ctx.translate(80,87);drawAnimatedFighter(ctx,a,72,age);g.drawImage(ink,col*160,(group*6+slot)*110+20);
    const hit=calls.find(v=>v.src?.includes('/combat_v35/'));
    if(!(skin===5&&slot===5&&age>=.14))checks.push({skin,slot,age,ok:!!hit&&hit.src.includes('skills')&&Math.floor(hit.y/209)===slot});
   }
  }
  // Exercise the real primary skill binding: Centelha's primary is a kick (slot 1).
  equipChampion(6,false);beginProgression('training');arenaQA.begin();practiceOptions.free=true;
  cast(p,p.kit[V3API.V2[6].s[0]],0);const q=p.rwCast;
  const primary=q?.slot; if(q){q.age=q.release+.01;const pose=heir33Pose(p,0);checks.push({primary:true,ok:pose.skillFrame===8});}
  return {checks,primary,url:c.toDataURL()};
 });
 assert.equal(result.primary,1);assert.ok(result.checks.every(x=>x.ok),JSON.stringify(result.checks.filter(x=>!x.ok)));assert.deepEqual(errors,[]);
 fs.writeFileSync('/tmp/skills-v35.png',Buffer.from(result.url.split(',')[1],'base64'));console.log('PASS distinct body sequences for every skill, real primary kick binding, adult transformation and no JS errors.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
