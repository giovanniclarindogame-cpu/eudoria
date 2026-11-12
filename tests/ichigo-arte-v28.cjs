const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const sharp = require('sharp');
const {chromium} = require('playwright');

const effects = ['slash','getsuga','shunpo','bankai','getsuga-final','impact'];
const output = '/tmp/ronin-v28';
fs.mkdirSync(output,{recursive:true});

(async()=>{
 const body = await sharp('assets/ichigo_v27/body.webp').metadata();
 assert.deepEqual([body.width,body.height,body.hasAlpha],[1254,1254,true]);
 for(const key of effects){
  const file = `assets/ichigo_v27/${key}.webp`, meta = await sharp(file).metadata();
  assert.deepEqual([meta.width,meta.height,meta.hasAlpha],[1536,1024,true],key);
  const frames = new Set();
  for(let f=0;f<24;f++){
   const cell = sharp(file).extract({left:f%6*256,top:Math.floor(f/6)*256,width:256,height:256});
   const pixels = await cell.ensureAlpha().raw().toBuffer();
   let transparent=0,visible=0;
   for(let i=3;i<pixels.length;i+=4){if(pixels[i]<5)transparent++;if(pixels[i]>100)visible++;}
   assert.ok(transparent>1000&&visible>0,`${key} frame ${f}: transparent, nonempty sprite`);
   frames.add(crypto.createHash('sha256').update(pixels).digest('hex'));
  }
  assert.equal(frames.size,24,`${key}: individually painted frames`);
 }
 for(let i=0;i<6;i++){
  const m=await sharp(`assets/ichigo_v27/icon-${i}.webp`).metadata();
  assert.deepEqual([m.width,m.height],[256,256]);
 }
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:8000');
  await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
  await page.locator('#welcomeEnter').click();
  await page.locator('#profileName').fill('Ronin');
  await page.locator('#profileForm button[type=submit]').click();
  await page.evaluate(async()=>{
   await Promise.all([ICHIGO27_BODY,...Object.values(ICHIGO27_FX),...Object.values(BODY24)].map(i=>i.decode()));
   if(!window.COMBAT_V3)throw Error('Must test the current v3 game');
   window.setup28=()=>{
    state='paused';equipChampion(2,false);beginProgression('training');arenaQA.begin();
    practiceOptions.free=false;practiceOptions.dummy='still';pillars=[];objects=[];
    p.x=400;p.y=300;b.x=470;b.y=300;b.hp=b.max=10000;p.inv=b.inv=0;
    reworkState(p).value=100;
   };
   window.advance28=t=>{for(let i=0;i<Math.ceil(t*240);i++)step(1/240);};
   window.seen28=[];
   const paint=ichigo27Effect;
   ichigo27Effect=function(...args){seen28.push({key:args[1],frame:args[2],angle:args[6]});return paint(...args);};
  });
  // Check actual v3 casts, contact effects, sustained aura and dash echoes.
  const result=await page.evaluate(()=>{
   const check=(ok,message)=>{if(!ok)throw Error(message);};
   setup28();check(cast(p,p.kit[0],0),'cut cast');advance28(.2);state='paused';draw();
   check(p.hits===1,'cut contact');check(Reforged.effects.some(e=>e.kind==='impact'),'painted melee impact');
   setup28();b.x=800;check(cast(p,p.kit[2],0),'wave cast');advance28(.3);state='paused';draw();
   check(Reforged.projectiles.some(e=>e.skin===2),'wave in flight');
   check(integratedDepth().some(e=>e.kind==='ichigo-projectile'),'new projectile renderer connected');
   setup28();p.x=650;b.x=300;check(cast(p,p.kit[2],Math.PI),'left wave');advance28(.35);state='paused';draw();
   const left=Reforged.projectiles.find(e=>e.skin===2);check(left&&left.x<620,'left wave moves left');
   setup28();b.x=800;joy.x=1;joy.y=0;check(V3API.doDash(p),'v3 Shunpo');advance28(.16);state='paused';draw();
   check(Reforged.effects.filter(e=>e.kind==='ichigo-afterimage').length>=3,'echoes follow traveled path');
   check(p.x>500,'dash distance');joy.x=joy.y=0;
   setup28();b.x=800;cast(p,p.kit[4],0);advance28(.4);state='paused';draw();
   check(reworkState(p).spiritForm>0,'Bankai active');
   setup28();b.x=800;cast(p,p.kit[5],0);advance28(.5);state='paused';draw();
   check(integratedDepth().some(e=>e.kind==='ichigo-final-charge'),'ultimate preparation');
   state='fight';advance28(.5);state='paused';draw();
   check(Reforged.projectiles.some(e=>e.slot===5),'ultimate beam');
   state='fight';advance28(.6);state='paused';draw();check(p.hits===1,'ultimate hits once');
   return [...new Set(seen28.map(e=>e.key))];
  });
  assert.deepEqual(result.sort(),effects.slice().sort(),'every new effect renders during combat');
  // Full RGBA comparison ensures a leftward shot is a horizontal mirror, not a 180° turn.
  const orientation=await page.evaluate(()=>{
   function pixels(angle){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');ichigo27Effect(g,'shunpo',10,128,128,256,angle,true);return g.getImageData(0,0,256,256).data;}
   const r=pixels(0),l=pixels(Math.PI);let error=0;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++)for(let k=0;k<4;k++)error+=Math.abs(r[(y*256+x)*4+k]-l[(y*256+255-x)*4+k]);
   const c=astralSoftCell(ICHIGO27_FX.getsuga,12),d=c.getContext('2d').getImageData(0,0,256,256).data;
   let edge=0;for(let x=0;x<256;x++)edge=Math.max(edge,d[x*4+3],d[(255*256+x)*4+3]);
   return {error:error/r.length,edge};
  });
  assert.ok(orientation.error<1,JSON.stringify(orientation));
  assert.ok(orientation.edge<6,'no rectangular glow seam at atlas boundary');
  const scale=await page.evaluate(()=>{
   const c=document.createElement('canvas');c.width=900;c.height=220;const g=c.getContext('2d');
   g.fillStyle='#142a26';g.fillRect(0,0,c.width,c.height);
   const heights=[];
   for(let skin=0;skin<3;skin++){
    const a=actor(0,0,CHAMPIONS[skin].kit,'white');a.skin=skin;
    const single=document.createElement('canvas');single.width=single.height=180;const ink=single.getContext('2d');
    ink.translate(90,130);rwPaintBody(ink,a,72,0);
    const d=ink.getImageData(0,0,180,180).data;let top=180,bottom=0;
    for(let y=0;y<180;y++)for(let x=0;x<180;x++)if(d[(y*180+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y);}
    heights.push(bottom-top+1);g.imageSmoothingEnabled=false;g.drawImage(single,skin*300,0,260,200);
    g.fillStyle='#f1dfa7';g.font='17px sans-serif';g.fillText(CHAMPIONS[skin].name,skin*300+35,205);
   }
   return {heights,reg:body24Register('astral-base'),url:c.toDataURL()};
  });
  fs.writeFileSync(`${output}/corpos.png`,Buffer.from(scale.url.split(',')[1],'base64'));
  assert.ok(Math.abs(scale.heights[2]-scale.heights[0])<=2,JSON.stringify({heights:scale.heights,reg:scale.reg}));
  for(const width of [1280,844]){
   await page.setViewportSize({width,height:width===1280?720:390});
   await page.evaluate(()=>{state='paused';openChampionDetails(2);});
   await page.waitForFunction(()=>[...document.querySelectorAll('#heroDetail img')].every(i=>i.complete&&i.naturalWidth));
   await page.screenshot({path:`${output}/selecao-${width}.png`});
   await page.evaluate(()=>{confirmChampion(true);setup28();b.x=800;reworkState(p).spiritForm=7;cast(p,p.kit[2],0);advance28(.4);state='paused';updateUI();draw();});
   await page.screenshot({path:`${output}/arena-${width}.png`});
  }
  // Touch uses the current arc layout; it must still launch the main cut.
  await page.evaluate(()=>{setup28();updateUI();});
  await page.locator('#equipped .skill[data-arc="0"]').tap();
  await page.waitForFunction(()=>p.hits>0);
  await page.evaluate(()=>{state='paused';});
  assert.deepEqual(errors,[]);
  console.log('PASS v28: 36 body cells, 144 unique VFX frames, six icons, v3 skills/dash/impacts, horizontal mirror, transparent edges, scale',scale.heights,'desktop/mobile screenshots and touch.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
