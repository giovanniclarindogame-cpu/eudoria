const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),sharp=require('sharp');
const root='assets/alquimista_v38/',effects=['block','wall','throw','impact','colossus','steel','shatter','spikes','lance','aim','charge'];
function lossless(d){for(let p=12;p+8<=d.length;){const tag=d.toString('ascii',p,p+4),n=d.readUInt32LE(p+4);if(tag==='VP8L')return true;if(tag==='VP8 ')return false;p+=8+n+(n&1)}return false}
async function verifyAssets(){
 const files={portrait:[760,1140],body:[1254,1254],skills:[1254,1254],reference:[1536,1024],background:[1536,1024]};for(let i=0;i<5;i++)files['icon-'+i]=[256,256];for(const k of effects)files[k]=[1536,1024];
 for(const [name,size]of Object.entries(files)){const p=root+name+'.webp',m=await sharp(p).metadata();assert.deepEqual([m.width,m.height],size,name);assert.ok(lossless(fs.readFileSync(p)),name+' lossless');if(name!=='background'&&!name.startsWith('icon-'))assert.ok(m.hasAlpha,name+' alpha');}
 const manifest=JSON.parse(fs.readFileSync(root+'manifest.json'));
 assert.equal(manifest.files.length,Object.keys(files).length);
 for(const record of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(root+record.file)).digest('hex'),record.sha256,record.file+' manifest hash');
 for(const name of ['body','skills',...effects]){
  const body=name==='body'||name==='skills',side=body?209:256,count=body?36:24,hashes=new Set(),heights=[];
  for(let f=0;f<count;f++){
   const d=await sharp(root+name+'.webp').extract({left:f%6*side,top:Math.floor(f/6)*side,width:side,height:side}).ensureAlpha().raw().toBuffer();let top=side,bottom=-1,visible=0,plate=0;
   for(let y=0;y<side;y++)for(let x=0;x<side;x++){
    const i=(y*side+x)*4,a=d[i+3];if(a>10)visible++;if(a>170){top=Math.min(top,y);bottom=Math.max(bottom,y)}
    const margin=body?8:16;if(x<margin||y<margin||x>=side-margin||y>=side-margin)assert.equal(a,0,`${name}/${f}: transparent margin`);
    if(!body&&a>10&&Math.min(d[i],d[i+1],d[i+2])>190&&Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2])<25)plate++;
   }
   assert.ok(visible>4,`${name}/${f}: nonempty`);
   if(body){assert.ok(Math.abs(bottom-193)<=1,`${name}/${f}: grounded at 193 (got ${bottom})`);if(f<6)heights.push(bottom-top+1)}
   else{assert.ok(visible<side*side*.65,`${name}/${f}: no opaque backing`);assert.ok(plate<side*side*.12,`${name}/${f}: no white plate`)}
   hashes.add(crypto.createHash('sha256').update(d).digest('hex'));
  }
  assert.equal(hashes.size,count,name+' distinct frames');if(body)assert.ok(Math.max(...heights)<=173,name+' max idle height');
 }
 console.log('PASS assets: 21 lossless WebPs, exact dimensions, 72 poses +264 FX frames, grounded feet, transparent margins, no backing plates.');
}
const {chromium}=require('playwright');
async function boot(page){
 await page.goto('http://127.0.0.1:8000/index.html?allheroes=1');await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
 await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Artífice');await page.locator('#profileForm button[type=submit]').click();
}
async function mechanics(page){return page.evaluate(()=>{
 window.requestAnimationFrame=()=>0;Math.random=()=>.99;matchMode='1v1';battleActivity='training';account.activeChampion=9;selected=[...CHAMPIONS[9].kit];start();state='fight';count=0;
 const K=p.kit,out={},reset=(angle=0)=>{rwClear();objects.length=0;p.cd=p.cd.map(()=>0);Object.assign(p,{cast:0,actionRecovery:0,skillLock:0,root:0,rwCast:null,v3dashCD:0,hp:1000,max:1000,mp:1000,inv:0,hitReact:0,guard:false,x:300,y:300,a:angle,rwFacing:angle});Object.assign(b,{hp:1e6,max:1e6,inv:0,root:9999,x:600,y:300});},run=n=>{for(let i=0;i<n;i++)step(1/60)},fresh=()=>{p.cd=p.cd.map(()=>0);p.cast=0;p.actionRecovery=0;p.skillLock=0;p.root=0;p.rwCast=null},snap=o=>o&&({x:+o.x.toFixed(3),y:+o.y.toFixed(3),w:o.w,h:o.h,hp:o.hp,max:o.max,life:+o.life.toFixed(3),size:o.size,dmg:o.dmg,materials:o.materials});
 reset();out.palma=cast(p,K[0],0);run(30);out.block=snap(objects.find(o=>o.material&&o.life>0));fresh();out.throw=cast(p,K[0],0);run(18);out.projectile=Reforged.projectiles.filter(o=>o.skin===9).map(o=>({dmg:o.dmg,range:o.range,r:o.r,size:o.size}));run(80);out.throwDamage=1e6-b.hp;
 reset();b.x=380;out.blade=cast(p,K[1],0);run(60);out.bladeDamage=1e6-b.hp;
 out.walls=[];for(const angle of [0,Math.PI/2]){reset(angle);out.walls.push({cast:cast(p,K[3],angle)});run(40);out.walls.at(-1).object=snap(objects.find(o=>o.wall&&o.life>0))}
 reset();joy.x=1;joy.y=0;out.dash=V3API.doDash(p);run(40);out.dashEnd={x:p.x,y:p.y,cd:+p.v3dashCD.toFixed(3),block:snap(objects.find(o=>o.material&&o.life>0))};joy.x=0;
 reset();rwCreateBlock(p,390,240);rwCreateBlock(p,430,360);out.ult=cast(p,K[5],0);run(60);out.colossus=snap(objects.find(o=>o.colossus&&o.life>0));out.materialsAfterUlt=objects.filter(o=>o.material&&o.life>0).length;run(720);out.colossusExpired=!objects.some(o=>o.colossus&&o.life>0);out.colossusDamage=1e6-b.hp;
 out.cooldowns=K.map(id=>skills[id].cd);out.uiSlots=V3API.V2[9];return out;
})}
async function verifyGame(){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const control=await browser.newPage({viewport:{width:1280,height:720}});await control.route('**/js/alquimista_arte_v38.js*',route=>route.fulfill({contentType:'application/javascript',body:''}));await boot(control);const before=await mechanics(control);await control.close();
  const checkPage=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];checkPage.on('pageerror',e=>errors.push(e.message));await boot(checkPage);const after=await mechanics(checkPage);assert.deepEqual(after,before,'art must preserve all construction, damage, lifetime, projectile, cooldown and dash results');assert.ok(after.block&&after.walls.every(w=>w.object)&&after.colossus&&after.throwDamage>0&&after.bladeDamage>0&&after.colossusExpired,'real mechanics exercised '+JSON.stringify(after));await checkPage.close();
  const page=await browser.newPage({viewport:{width:1280,height:720}}),requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await boot(page);
  const report=await page.evaluate(async()=>{
   state='paused';const raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;Math.random=()=>.99;
   await Promise.all([ALQUIMISTA38_BODY,ALQUIMISTA38_SKILLS,...Object.values(ALQUIMISTA38_FX),BODY24['ninja-base'],CORSAIR36_BODY,CAVALEIRO37_BODY].map(im=>im.decode()));
   const check=(v,m)=>{if(!v)throw Error(m)},c=document.createElement('canvas');c.width=1400;c.height=570;const g=c.getContext('2d');g.fillStyle='#25312e';g.fillRect(0,0,c.width,c.height);const measurements=[];
   for(const [i,skin]of [1,7,8,9].entries()){
    const im=new Image();im.src=championArt(CHAMPIONS[skin]);await im.decode();const k=Math.min(300/im.width,350/im.height);g.drawImage(im,i*350+(350-im.width*k)/2,8,im.width*k,im.height*k);
    const a=actor(0,0,CHAMPIONS[skin].kit,'white');a.skin=skin;const s=document.createElement('canvas');s.width=s.height=180;const sg=s.getContext('2d');sg.translate(90,140);drawAnimatedFighter(sg,a,72,0);const d=sg.getImageData(0,0,180,180).data;let l=180,r=-1,t=180,b=-1,area=0;for(let y=0;y<180;y++)for(let x=0;x<180;x++)if(d[(y*180+x)*4+3]>170){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);area++}measurements.push({skin,width:r-l+1,height:b-t+1,area});g.imageSmoothingEnabled=false;g.drawImage(s,i*350+85,350);g.fillStyle='#f4dda5';g.font='18px sans-serif';g.fillText(CHAMPIONS[skin].name,i*350+20,552);
   }
   matchMode='1v1';battleActivity='training';account.activeChampion=9;selected=[...CHAMPIONS[9].kit];start();state='fight';count=0;
   const K=p.kit,reset=(angle=0)=>{rwClear();objects.length=0;Object.assign(p,{cd:p.cd.map(()=>0),cast:0,actionRecovery:0,skillLock:0,root:0,rwCast:null,v3dashCD:0,hp:1000,max:1000,mp:1000,inv:0,hitReact:0,guard:false,punchTime:0,dodgeTime:0,moving:false,x:300,y:300,a:angle,rwFacing:angle});Object.assign(b,{hp:1e6,max:1e6,inv:0,root:9999,x:650,y:450});};
   const rows=[];
   for(const angle of [0,Math.PI])for(const slot of [0,1,3,'dash',5]){
    reset(angle);if(slot===5){rwCreateBlock(p,390,240);rwCreateBlock(p,430,360)}
    if(slot==='dash'){joy.x=Math.cos(angle);joy.y=0}
    check(slot==='dash'?V3API.doDash(p):cast(p,K[slot],angle),'actual cast '+slot);
    const frames=new Set();for(let n=0;n<90;n++){const pose=alc38Pose(p);if(pose.skillFrame!==undefined)frames.add(pose.skillFrame);integratedDepth();step(1/60)}joy.x=0;
    const row=({0:0,1:1,3:2,dash:3,5:4})[slot];check([...frames].some(f=>Math.floor(f/6)===row),'actual row '+slot);rows.push({slot,angle,frames:[...frames]});
   }
   reset();const block=rwCreateBlock(p,400,240),wallH=rwCreateBlock(p,500,380,true,Math.PI/2),wallV=rwCreateBlock(p,650,240,true,0);check(block&&wallH&&wallV,'construction fixtures');
   const proof=document.createElement('canvas');proof.width=900;proof.height=400;const pg=proof.getContext('2d');pg.fillStyle='#34463d';pg.fillRect(0,0,900,400);const objectsTest=[block,wallH,wallV,{colossus:true,x:760,y:320,age:1,size:185,hp:500,max:500,life:8,owner:p}];
   for(const [i,o]of objectsTest.entries()){
    const before=JSON.stringify(o,(k,v)=>k==='owner'?null:v);const draw=[];const fake={save(){},restore(){},translate(x,y){draw.push({xy:[x,y]})},rotate(a){draw.push({rotation:a})},drawImage(...args){draw.push({image:args[0].src,args:args.slice(1)})}};
    check(alc38Construct(fake,o,10),'construction atlas loaded');check(draw[0].xy[0]===o.x&&draw[0].xy[1]===o.y,'real object position');check(JSON.stringify(o,(k,v)=>k==='owner'?null:v)===before,'visual draw mutated construction');check(draw.some(v=>v.image?.includes(o.colossus?'colossus.webp':o.wall?'wall.webp':'block.webp')),'correct construction sheet');if(o===wallV)check(draw.some(v=>v.rotation===Math.PI/2),'vertical wall orientation');
    const clone={...o,x:110+i*215,y:260,age:1};alc38Construct(pg,clone,10);pg.strokeStyle='#ffda7b';if(!o.colossus)pg.strokeRect(clone.x-o.w/2,clone.y-o.h/2,o.w,o.h);pg.fillStyle='#f4dda5';pg.font='15px sans-serif';pg.fillText(o.colossus?'Colosso 185':o.wall?'Muralha '+o.w+'×'+o.h:'Bloco 30×30',clone.x-65,345);
   }
   integratedDepth();rwDestroy(block);check(integratedDepth().some(n=>n.kind==='alc38-collapse'),'real destruction plays collapse');const dead=integratedDepth().filter(n=>n.kind==='alc38-collapse');dead.forEach(n=>n.paint());clock+=.51;check(!integratedDepth().some(n=>n.kind==='alc38-collapse'),'visual collapse expires');
   reset();p.hitReact=.2;check(alc38Pose(p).frame===30,'damage');p.hitReact=.1;check(alc38Pose(p).frame===31,'damage recovery');p.hitReact=0;p.guard=true;check(alc38Pose(p).frame===34,'guard');p.guard=false;p.hp=0;delete p.koAge;check(alc38Pose(p,0).frame===32&&alc38Pose(p,1).frame===33,'fall/corpse');reset();
   window.requestAnimationFrame=raf;return {measurements,rows,comparison:c.toDataURL(),constructs:proof.toDataURL()};
  });
  const ninja=report.measurements[0],a=report.measurements[3];assert.ok(Math.abs(a.height-ninja.height)<=3,'same idle height '+JSON.stringify(report.measurements));assert.ok(a.width>=ninja.width*.8&&a.width<=ninja.width*1.2,'compact width '+JSON.stringify(report.measurements));assert.ok(a.area>=ninja.area*.75&&a.area<=ninja.area*1.3,'compact mass '+JSON.stringify(report.measurements));
  fs.writeFileSync('/tmp/alquimista38-roster.png',Buffer.from(report.comparison.split(',')[1],'base64'));fs.writeFileSync('/tmp/alquimista38-constructs.png',Buffer.from(report.constructs.split(',')[1],'base64'));
  for(const width of [1280,844]){
   await page.setViewportSize({width,height:width===1280?720:390});await page.evaluate(()=>{state='paused';account.activeChampion=9;V3Kof.open('league')});await page.waitForFunction(()=>document.querySelector('[data-face="9"]')?.src.startsWith('data:image/webp'));
   await page.waitForFunction(()=>{const c=document.querySelector('.kof-sprite[data-skin="9"]');return c&&c.getContext('2d').getImageData(0,0,200,160).data.some((v,i)=>i%4===3&&v>0)});
   assert.ok(await page.locator('.kx-art.left img').evaluate(i=>i.complete&&i.src.includes('alquimista_v38')));await page.screenshot({path:`/tmp/alquimista38-selection-${width}.png`});
   await page.evaluate(()=>{document.querySelector('[data-kof-back]').click();state='paused';equipChampion(9,false);beginProgression('training');arenaQA.begin();practiceOptions.free=true;practiceOptions.dummy='still';state='fight';updateUI();draw()});
   const buttons=await page.locator('#equipped .skill:not(.v3-hidden) .skill-art, #attack .skill-art').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect(),b=el.closest('button').getBoundingClientRect();return {src:getComputedStyle(el).backgroundImage,w:r.width/b.width,h:r.height/b.height}}));assert.equal(buttons.length,5);assert.ok(buttons.every(b=>b.src.includes('alquimista_v38/icon-')&&b.w>=.7&&b.h>=.7),'five filled actual buttons '+JSON.stringify(buttons));for(let n=0;n<5;n++)assert.ok(buttons.some(b=>b.src.includes('icon-'+n+'.webp')),'icon mapping '+n);await page.screenshot({path:`/tmp/alquimista38-combat-${width}.png`});
  }
  const future=['steel','shatter','spikes','lance','aim','charge'];assert.ok(!requests.some(u=>future.some(k=>u.includes('/alquimista_v38/'+k+'.webp'))),'future atlas sheets are not integrated');assert.deepEqual(errors,[]);
  console.log('PASS integration: mechanics identical with/without art, actual pose slots both ways, original construction dimensions/health/duration, collapse, K.O., compact body, face crop and five filled icons on desktop/mobile; six future sheets remain inactive.',report.measurements);
 }finally{await browser.close()}
}
(async()=>{if(!process.argv.includes('--game-only'))await verifyAssets();if(!process.argv.includes('--assets-only'))await verifyGame()})().catch(e=>{console.error(e);process.exitCode=1});
