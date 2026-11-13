const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const sharp=require('sharp');
const {chromium}=require('playwright');
const root='assets/solar_v29/',output='/tmp/solar-v29';
const effects=['slash','tiger','pillar','dash','phoenix','impact','aura'];
fs.mkdirSync(output,{recursive:true});
function isLossless(bytes){
 for(let at=12;at+8<=bytes.length;){const tag=bytes.toString('ascii',at,at+4),size=bytes.readUInt32LE(at+4);if(tag==='VP8L')return true;if(tag==='VP8 ')return false;at+=8+size+(size&1);}
 return false;
}
(async()=>{
 const files={body:[1254,1254],portrait:[760,1140],background:[1536,1024]};
 for(let i=0;i<6;i++)files['icon-'+i]=[256,256];
 for(const key of effects)files[key]=[1536,1024];
 for(const [key,size]of Object.entries(files)){
  const m=await sharp(root+key+'.webp').metadata();assert.deepEqual([m.width,m.height],size,key);
  assert.ok(isLossless(fs.readFileSync(root+key+'.webp')),key+' must be lossless');
  if(key!=='background')assert.ok(m.hasAlpha,key+' must have alpha');
 }
 for(const key of ['body',...effects]){
  const cell=key==='body'?209:256,count=key==='body'?36:24,hashes=new Set();
  for(let i=0;i<count;i++){
   const d=await sharp(root+key+'.webp').extract({left:i%6*cell,top:Math.floor(i/6)*cell,width:cell,height:cell}).ensureAlpha().raw().toBuffer();
   let top=cell,bottom=-1,visible=0,edge=0;
   for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
    const a=d[(y*cell+x)*4+3];
    if(a>170){top=Math.min(top,y);bottom=Math.max(bottom,y);visible++;}
    if(x<4||y<4||x>=cell-4||y>=cell-4)edge=Math.max(edge,a);
   }
   assert.ok(visible>0,`${key} frame ${i} empty`);
   assert.equal(edge,0,`${key} frame ${i} touches cell edge`);
   if(key==='body')assert.equal(bottom,193,`body frame ${i}: fixed foot baseline`);
   hashes.add(crypto.createHash('sha256').update(d).digest('hex'));
  }
  assert.equal(hashes.size,count,`${key}: unique animation cells`);
 }
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const legacy of [true,false]){
   const context=await browser.newContext({viewport:{width:1280,height:720},hasTouch:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
   await page.goto('http://127.0.0.1:8000/'+(legacy?'?legacy=1':''));
   await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
   await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Solar');await page.locator('#profileForm button[type=submit]').click();
   await page.evaluate(async()=>{
    await Promise.all([SOLAR29_BODY,ICHIGO27_BODY,...Object.values(SOLAR29_FX),...Object.values(BODY24)].map(i=>i.decode()));
    window.setup29=()=>{
     state='paused';equipChampion(3,false);beginProgression('training');arenaQA.begin();
     practiceOptions.free=false;practiceOptions.dummy='still';pillars=[];objects=[];
     p.x=350;p.y=300;b.x=420;b.y=300;b.hp=b.max=10000;p.inv=b.inv=0;
     joy.x=joy.y=0;reworkState(p).value=100;
    };
    window.advance29=t=>{for(let i=0;i<Math.ceil(t*240);i++)step(1/240);};
    window.paint29=()=>{state='paused';updateUI();draw();};
    window.seen29=new Set();const old=solar29Effect;
    solar29Effect=function(...args){seen29.add(args[1]);return old(...args);};
   });
   const report=await page.evaluate(legacy=>{
    const check=(ok,msg)=>{if(!ok)throw Error(msg);};
    setup29();check(cast(p,p.kit[0],0),'slash accepted');advance29(.2);paint29();
    check(p.hits===1&&OriginalCombat.burns[0]?.stacks===1,'slash applies burn');
    if(legacy)check(p.damage===55,'unchanged slash damage');
    else check(p.damage===Math.round(55*V3_DMG_MUL[3]),'latest v3 damage multiplier preserved');
    check(Reforged.effects.some(e=>e.kind==='solar-cut'),'slash sprite event');
    const hp=b.hp;state='fight';advance29(.6);check(b.hp<hp,'burn ticks');
    setup29();b.x=650;cast(p,p.kit[1],0);advance29(.5);paint29();
    check(Reforged.projectiles.length===1&&integratedDepth().some(e=>e.kind==='solar-projectile'),'tiger sprite in flight');
    state='fight';advance29(.8);paint29();check(p.damage>0,'tiger hits');
    setup29();p.x=650;b.x=300;cast(p,p.kit[1],Math.PI);advance29(.5);paint29();
    check(Reforged.projectiles[0]?.x<600,'left tiger');
    setup29();b.x=600;cast(p,p.kit[2],0);advance29(.4);paint29();
    check(!p.hits&&Reforged.effects.some(e=>e.kind==='solar-pillar-warning'),'pillar warning before damage');
    state='fight';advance29(.38);check(!p.hits,'warning retains 0.5s dodge window');
    advance29(.06);paint29();check(p.hits===1&&Reforged.effects.some(e=>e.kind==='solar-pillar'),'pillar erupts on contact');
    setup29();b.x=800;joy.x=1;
    check(legacy?cast(p,p.kit[3],0):V3API.doDash(p),'dash accepted');advance29(.35);paint29();
    check(p.x>440&&Reforged.effects.some(e=>e.kind==='solar-trail'),'moving flame trail');joy.x=0;
    setup29();b.x=800;pillars=[{x:450,y:300,r:25}];joy.x=1;
    legacy?cast(p,p.kit[3],0):V3API.doDash(p);advance29(.8);check(p.x<425,'dash still respects walls');joy.x=0;
    if(legacy){
     setup29();cast(p,p.kit[4],0);advance29(.4);paint29();
     check(reworkState(p).breathing>6,'breathing duration');
     check(integratedDepth().some(e=>e.kind==='solar-breathing'),'separate breathing aura');
     state='fight';advance29(.4);p.cast=p.skillLock=p.actionRecovery=0;p.rwCast=null;
     cast(p,p.kit[0],0);advance29(.2);
     check(p.damage===72&&OriginalCombat.burns[0].remaining>6,'breathing damage and extended burns preserved');
    }
    setup29();reworkState(p).value=49;check(!cast(p,p.kit[5],0),'ultimate still needs 50 flame');
    reworkState(p).value=100;b.x=550;check(cast(p,p.kit[5],0),'ultimate accepted');
    check(reworkState(p).value===0,'ultimate spends flame');advance29(.3);paint29();
    check(integratedDepth().some(e=>e.kind==='solar-phoenix-birth'),'phoenix formation');
    state='fight';advance29(.45);paint29();check(integratedDepth().some(e=>e.kind==='solar-phoenix-flight'),'phoenix follows actual dash');
    check(OriginalCombat.burns[0]?.stacks===4,'ultimate burn stack count');
    state='fight';advance29(.6);paint29();check(Reforged.effects.some(e=>e.kind==='solar-phoenix-end'),'phoenix dissipates at dash endpoint');
    setup29();b.x=900;cast(p,p.kit[5],0);advance29(.55);p.hp=0;advance29(.1);
    check(!ultimateCinematicActor()&&!integratedDepth().some(e=>e.kind==='solar-phoenix-flight'),'death clears flight/cinematic');
    state='paused';return [...seen29];
   },legacy);
   for(const key of effects.filter(k=>legacy||k!=='aura'))assert.ok(report.includes(key),`${key} rendered in ${legacy?'legacy':'v3'}`);
   const mirror=await page.evaluate(()=>{
    const sample=angle=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');solar29Effect(g,'tiger',10,128,128,256,angle,true);return g.getImageData(0,0,256,256).data;};
    const r=sample(0),l=sample(Math.PI);let error=0;
    for(let y=0;y<256;y++)for(let x=0;x<256;x++)for(let k=0;k<4;k++)error+=Math.abs(r[(y*256+x)*4+k]-l[(y*256+255-x)*4+k]);
    return error/r.length;
   });
   assert.ok(mirror<1,'left effect mirrors horizontally, never upside down');
   if(!legacy){
    const scale=await page.evaluate(()=>{
     const c=document.createElement('canvas');c.width=1000;c.height=220;const g=c.getContext('2d'),heights=[];
     g.fillStyle='#26372b';g.fillRect(0,0,1000,220);
     for(let skin=0;skin<4;skin++){
      const a=actor(0,0,CHAMPIONS[skin].kit,'white');a.skin=skin;
      const cell=document.createElement('canvas');cell.width=cell.height=180;const ink=cell.getContext('2d');ink.translate(90,140);rwPaintBody(ink,a,72,0);
      const d=ink.getImageData(0,0,180,180).data;let top=180,bottom=-1;
      for(let y=0;y<180;y++)for(let x=0;x<180;x++)if(d[(y*180+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y);}
      heights.push(bottom-top+1);g.imageSmoothingEnabled=false;g.drawImage(cell,skin*250,0,240,200);
      g.fillStyle='#ffe2a0';g.font='16px sans-serif';g.fillText(CHAMPIONS[skin].name,skin*250+20,208);
     }
     return {heights,url:c.toDataURL()};
    });
    fs.writeFileSync(output+'/corpos.png',Buffer.from(scale.url.split(',')[1],'base64'));
    assert.ok(scale.heights.every(h=>Math.abs(h-scale.heights[3])<=2),JSON.stringify(scale.heights));
    for(const width of [1280,844]){
     await page.setViewportSize({width,height:width===1280?720:390});
     await page.evaluate(()=>{state='paused';openChampionDetails(3);});
     await page.waitForFunction(()=>[...document.querySelectorAll('#heroDetail img')].every(i=>i.complete&&i.naturalWidth));
     assert.equal(await page.locator('#heroDetail [data-hero-skill]').count(),4,'preserves current 3+ULT menu');
     assert.ok(await page.locator('#heroDetail').evaluate(el=>getComputedStyle(el).backgroundImage.includes('solar_v29')));
     await page.screenshot({path:`${output}/selecao-${width}.png`});
     await page.evaluate(()=>{confirmChampion(true);setup29();b.x=750;cast(p,p.kit[5],0);advance29(.7);paint29();});
     await page.screenshot({path:`${output}/fenix-${width}.png`});
    }
    await page.evaluate(()=>{setup29();updateUI();});await page.locator('#equipped .skill[data-arc="0"]').tap();await page.waitForFunction(()=>p.hits>0);await page.evaluate(()=>state='paused');
    await page.evaluate(()=>{setup29();b.x=800;joy.x=1;updateUI();});await page.locator('#attack.v3-dash').tap();await page.waitForFunction(()=>p.x>430);await page.evaluate(()=>{state='paused';joy.x=0;});
    console.log('PASS Solar v3: current controls, touch, desktop/mobile, body scale',scale.heights);
   }
   assert.deepEqual(errors,[]);await context.close();
   console.log('PASS Solar '+(legacy?'six-slot engine':'v3 engine')+': burns, damage, pillar timing, dash/walls, phoenix, death cleanup, VFX and mirroring');
  }
  console.log('PASS all 16 WebP files lossless; exact dimensions; 36 grounded poses; 168 unique VFX frames with transparent gutters.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
