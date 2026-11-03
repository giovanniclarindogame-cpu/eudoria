const {chromium}=require('playwright');const assert=require('node:assert/strict');const sharp=require('sharp');const path=require('node:path');
(async()=>{
 for(const key of ['spark','tide','star','steel'])for(const type of ['cast','fx']){
  const {data,info}=await sharp(path.join(__dirname,'../assets/skills_v7',key+'-'+type+'.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});const cell=type==='cast'?128:160;assert.equal(info.width,cell*6);assert.equal(info.height,cell*6);
  for(let row=0;row<6;row++)for(let frame=0;frame<6;frame++){let solid=0;for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){const alpha=data[((row*cell+y)*info.width+frame*cell+x)*4+3];if(alpha>160)solid++;if(type==='fx'&&(x<5||y<5||x>=cell-5||y>=cell-5))assert.equal(alpha,0,'effect bleeds into next cell');}assert.ok(solid>30,'empty '+key+'/'+type+'/'+row+'/'+frame);}
 }
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.v7QA&&!document.querySelector('#integrationLoading'));await page.locator('#profileName').fill('Artes');await page.locator('#profileForm button[type=submit]').click();
 assert.equal(await page.locator('#lobbyNav [data-nav=shop]').count(),0);
 for(const screen of ['library','training','league','arenas']){await page.evaluate(s=>s==='arenas'?showArenaModes():showScreen(s),screen);assert.ok(await page.locator('#lobbyNav').isHidden());assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#modeScreen').hidden?document.querySelector(document.body.dataset.screen==='library'?'#selection':'#'+document.body.dataset.screen+'Screen'):document.querySelector('#modeScreen')).marginLeft),'0px');}
 await page.evaluate(()=>{for(let skin=6;skin<10;skin++)v7Preload(skin)});await page.waitForFunction(()=>[...v7QA.images.values()].every(im=>im.complete&&im.naturalWidth));
 const directions=await page.evaluate(()=>{const result=[];for(const angle of [0,Math.PI,Math.PI*.8,-Math.PI*.8]){const g=document.createElement('canvas').getContext('2d');orientSkillSprite(g,angle);const m=g.getTransform();result.push({angle,x:m.a,y:m.b,up:m.d});}return result;});for(const d of directions){assert.ok(Math.abs(d.x-Math.cos(d.angle))<1e-8);assert.ok(Math.abs(d.y-Math.sin(d.angle))<1e-8);assert.ok(d.up>0,'upside-down artwork');}
 const checks=await page.evaluate(()=>{
  const results=[];
  for(let skin=6;skin<10;skin++)for(let slot=0;slot<6;slot++)for(const direction of [0,Math.PI]){
   equipChampion(skin,false);beginProgression('training');arenaQA.begin();p.x=640;p.y=280;b.x=p.x+Math.cos(direction)*150;b.y=280;p.a=direction;
   const id=p.kit[slot];if(!cast(p,id,direction))throw Error('Cast rejected '+skin+'/'+slot);const q=p.dojo4Cast,frames=new Set();
   for(let i=0;i<130;i++){if(p.dojo4Cast)frames.add(v7CastFrame(p.dojo4Cast));step(1/60);if(i%5===0)draw();}
   if(!q.released||p.dojo4Cast)throw Error('Unfinished '+skin+'/'+slot);if(slot===0&&p.damage===0)throw Error('No damage '+skin+'/'+direction);
   results.push({skin,slot,direction,frames:[...frames]});
  }state='paused';return results;
 });assert.equal(checks.length,48);for(const r of checks)assert.deepEqual(r.frames,[0,1,2,3,4,5],'missing cast pose '+JSON.stringify(r));
 const heights=await page.evaluate(()=>Array.from({length:10},(_,skin)=>{const c=document.createElement('canvas');c.width=c.height=240;const g=c.getContext('2d');g.translate(120,150);const a=actor(0,0,CHAMPIONS[skin].kit,'#fff');a.skin=skin;a.a=0;drawAnimatedFighter(g,a,72,0);const data=g.getImageData(0,0,240,240).data;let top=240,bottom=0;for(let y=0;y<240;y++)for(let x=0;x<240;x++)if(data[(y*240+x)*4+3]>160){top=Math.min(top,y);bottom=Math.max(bottom,y)}return bottom-top+1;}));assert.ok(Math.max(...heights)-Math.min(...heights)<=5,'inconsistent body heights '+heights);
 await page.evaluate(()=>{arenaQA.leave();showScreen('library')});assert.equal(await page.locator('#heroGrid img').count(),10);assert.equal(await page.locator('#heroGrid img').evaluateAll(ims=>new Set(ims.map(im=>im.src)).size),10);await page.waitForFunction(()=>[...document.querySelectorAll('#heroGrid img')].every(im=>im.complete&&im.naturalWidth));
 for(const vp of [{width:844,height:390},{width:667,height:375}]){await page.setViewportSize(vp);for(const selector of ['#fullscreenToggle','#heroGrid [data-hero-open="4"]'])assert.ok(await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'covered '+selector);}
 assert.deepEqual(errors,[]);console.log('PASS: 48 casts in both directions, six new poses per skill, upright effects, ten portraits, matched body heights '+heights.join('/')+', home-only navigation and unobscured selection');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
