const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),sharp=require('sharp');
const root='assets/cavaleiro_v37/',effects=['punch','comet','kick','dash','meteor','final','constellation','exposed','stage'];
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
 console.log('PASS assets: 19 lossless WebPs, exact dimensions, 72 poses +216 FX frames, grounded feet, transparent margins, no backing plates.');
}
const {chromium}=require('playwright');
async function verifyGame(){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('cavaleiro_v37'))missing.push(r.url())});
  await page.goto('http://127.0.0.1:8000/index.html?allheroes=1');
  await page.waitForFunction(()=>window.arenaQA&&!document.querySelector('#integrationLoading'));
  await page.locator('#welcomeEnter').click();await page.locator('#profileName').fill('Cavaleiro');await page.locator('#profileForm button[type=submit]').click();
  const report=await page.evaluate(async()=>{
   state='paused';window.cav37TestRAF=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;Math.random=()=>.99;
   await Promise.all([CAVALEIRO37_BODY,CAVALEIRO37_SKILLS,...Object.values(CAVALEIRO37_FX),CORSAIR36_BODY,BODY24['ninja-base']].map(i=>i.decode()));
   const check=(v,m)=>{if(!v)throw Error(m)},measurements=[];
   const c=document.createElement('canvas');c.width=1050;c.height=570;const g=c.getContext('2d');g.fillStyle='#172b30';g.fillRect(0,0,c.width,c.height);
   for(const [i,skin]of [1,7,8].entries()){
    const portrait=new Image();portrait.src=championArt(CHAMPIONS[skin]);await portrait.decode();
    const scale=Math.min(300/portrait.width,350/portrait.height);g.drawImage(portrait,i*350+(350-portrait.width*scale)/2,8,portrait.width*scale,portrait.height*scale);
    const a=actor(0,0,CHAMPIONS[skin].kit,'white');a.skin=skin;const spr=document.createElement('canvas');spr.width=spr.height=180;const sg=spr.getContext('2d');sg.translate(90,140);drawAnimatedFighter(sg,a,72,0);
    const d=sg.getImageData(0,0,180,180).data;let l=180,r=-1,t=180,b=-1,area=0;
    for(let y=0;y<180;y++)for(let x=0;x<180;x++)if(d[(y*180+x)*4+3]>170){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);area++}
    measurements.push({skin,width:r-l+1,height:b-t+1,area});g.imageSmoothingEnabled=false;g.drawImage(spr,i*350+85,350);g.fillStyle='#f4dda5';g.font='18px sans-serif';g.fillText(CHAMPIONS[skin].name,i*350+20,552);
   }
   matchMode='1v1';battleActivity='training';account.activeChampion=8;selected=[...CHAMPIONS[8].kit];start();state='fight';count=0;
   const K=p.kit,reset=(cos=100,angle=0)=>{
    rwClear();CavaleiroV3.ULTS.length=0;reworkState(p).value=cos;
    Object.assign(p,{cd:p.cd.map(()=>0),cast:0,actionRecovery:0,skillLock:0,root:0,rwCast:null,v3dashCD:0,hp:1000,max:1000,inv:0,v3cavUlt:null,hitReact:0,guard:false,punchTime:0,dodgeTime:0,moving:false,x:300,y:300,a:angle,rwFacing:angle});
    Object.assign(b,{hp:1e6,max:1e6,inv:0,root:9999,x:300+Math.cos(angle)*85,y:300});reworkState(b).air=0;reworkState(b).exposed=0;
   };
   const rows=[];let cometCharge=false,contact=false,flight=false,impact=false,constellation=false;
   for(const angle of [0,Math.PI])for(const slot of [0,1,2,3,5]){
    reset(100,angle);check(slot===3?V3API.doDash(p):cast(p,K[slot],angle),'cast '+slot);
    const frames=new Set();
    for(let n=0;n<160;n++){
     const pose=cav37Pose(p);if(pose.skillFrame!==undefined)frames.add(pose.skillFrame);
     if(slot===1&&p.rwCast&&p.rwCast.age<.29){check(!Reforged.projectiles.some(v=>v.owner===p),'Comet fired before preparation');cometCharge=cometCharge||p.rwCast.age>.2}
     contact=contact||Reforged.effects.some(e=>e.kind==='cav37-contact');
     const nodes=integratedDepth();let draws=[];const drawEffect=cav37Effect;
     cav37Effect=function(...args){draws.push(args.slice(1));return drawEffect(...args)};
     const tasksBefore=Reforged.tasks.map(t=>t.remaining).join();
     try{for(const node of nodes)if(['v3-cav-hud','v3-exposed','v3-cav-const','cav37-falling','cav37-dash'].includes(node.kind))node.paint();for(const e of Reforged.effects)if(e.skin===8)rwPaintFX(e)}finally{cav37Effect=drawEffect}
     check(tasksBefore===Reforged.tasks.map(t=>t.remaining).join(),'visual drawing changed gameplay schedule');
     flight=flight||draws.some(d=>['meteor','final'].includes(d[0])&&d[1]<8);
     impact=impact||draws.some(d=>['meteor','final'].includes(d[0])&&d[1]>=8);
     constellation=constellation||draws.some(d=>d[0]==='constellation');
     step(1/60);b.x=300+Math.cos(angle)*85;b.y=300;
    }
    const row=slot===5?4:slot;check([...frames].some(f=>Math.floor(f/6)===row),'missing actual pose row '+slot);rows.push({slot,angle,frames:[...frames]});
   }
   check(cometCharge&&contact&&flight&&impact&&constellation,'missing actual charge/contact/meteor/constellation');
   reset();
   // Each impact's bright core is registered to the real hit location.
   for(const key of ['meteor','final'])for(let frame=8;frame<24;frame++){
    const im=CAVALEIRO37_FX[key],anchor=CAVALEIRO37_IMPACT_ANCHORS[key][frame-8],calls=[];
    const fake={globalAlpha:1,save(){},restore(){},translate(x,y){calls.push([x,y])},rotate(){},drawImage(...args){calls.push(args)}};
    cav37Effect(fake,key,frame,420,300,100,100,0,1,anchor[1]/256,anchor[0]/256);
    check(calls[0][0]===420&&calls[0][1]===300&&calls[1][0]===im,'impact target/image');
    check(Math.abs(calls[1][5]+anchor[0]/256*100)<.001&&Math.abs(calls[1][6]+anchor[1]/256*100)<.001,'impact core anchor');
   }
   const stars=[];
   for(const value of [0,50,90]){reworkState(p).value=value;const seen=[],old=cav37Effect;cav37Effect=(...a)=>{seen.push(a);return true};try{cav37Hud(p)}finally{cav37Effect=old}check(seen.length===3,'three stage stars');check(seen.every((a,i)=>a[3]===p.x-9+i*9&&a[4]===p.y-69),'stage positions');stars.push(seen.map(a=>Math.floor(a[2]/8)))}
   check(JSON.stringify(stars)==='[[1,0,0],[1,1,0],[2,2,2]]','stage atlas bands '+JSON.stringify(stars));
   reworkState(b).exposed=1;let exposed=[];const old=cav37Effect;cav37Effect=(...a)=>{exposed.push(a);return true};try{integratedDepth().filter(n=>n.kind==='v3-exposed').forEach(n=>n.paint())}finally{cav37Effect=old}
   check(exposed[0]?.[1]==='exposed'&&exposed[0][3]===b.x&&exposed[0][4]===b.y-86,'Exposed sprite/position');reworkState(b).exposed=0;check(!integratedDepth().some(n=>n.kind==='v3-exposed'),'expired exposed removed');
   p.hitReact=.2;check(cav37Pose(p).frame===30,'damage');p.hitReact=.1;check(cav37Pose(p).frame===31,'damage recovery');p.hitReact=0;p.guard=true;check(cav37Pose(p).frame===34,'guard');p.guard=false;p.hp=0;delete p.koAge;check(cav37Pose(p,0).frame===32&&cav37Pose(p,1).frame===33,'fall and corpse');
   reset();
   window.requestAnimationFrame=window.cav37TestRAF;
   return {measurements,rows,stars,comparison:c.toDataURL()};
  });
  const [ninja,,knight]=report.measurements;
  assert.ok(Math.abs(knight.height-ninja.height)<=2,'same standing height '+JSON.stringify(report.measurements));
  assert.ok(knight.width>=ninja.width*.8&&knight.width<=ninja.width*1.2,'compact width '+JSON.stringify(report.measurements));
  assert.ok(knight.area>=ninja.area*.75&&knight.area<=ninja.area*1.3,'comparable body mass '+JSON.stringify(report.measurements));
  fs.writeFileSync('/tmp/cavaleiro37-roster.png',Buffer.from(report.comparison.split(',')[1],'base64'));
  for(const width of [1280,844]){
   await page.setViewportSize({width,height:width===1280?720:390});
   await page.evaluate(()=>{state='paused';account.activeChampion=8;V3Kof.open('league')});
   await page.waitForFunction(()=>document.querySelector('[data-face="8"]')?.src.startsWith('data:image/webp'));
   await page.waitForFunction(()=>{const c=document.querySelector('.kof-sprite[data-skin="8"]');return c&&c.getContext('2d').getImageData(0,0,200,160).data.some((v,i)=>i%4===3&&v>0)});
   const face=await page.locator('[data-face="8"]').getAttribute('src');fs.writeFileSync('/tmp/cavaleiro37-face.webp',Buffer.from(face.split(',')[1],'base64'));
   assert.ok(await page.locator('.kx-art.left img').evaluate(i=>i.complete&&i.src.includes('cavaleiro_v37')));
   await page.screenshot({path:`/tmp/cavaleiro37-selection-${width}.png`});
   await page.evaluate(()=>{document.querySelector('[data-kof-back]').click();state='paused';equipChampion(8,false);beginProgression('training');arenaQA.begin();practiceOptions.free=true;practiceOptions.dummy='still';reworkState(p).value=100;state='fight';updateUI();draw()});
   const buttons=await page.locator('#equipped .skill:not(.v3-hidden) .skill-art, #attack .skill-art').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect(),b=el.closest('button').getBoundingClientRect();return {src:getComputedStyle(el).backgroundImage,w:r.width/b.width,h:r.height/b.height}}));
   assert.equal(buttons.length,5);assert.ok(buttons.every(b=>b.src.includes('cavaleiro_v37/icon-')&&b.w>=.7&&b.h>=.7),'filled skill slots');
   assert.ok(buttons.some(b=>b.src.includes('icon-3.webp'))&&buttons.some(b=>b.src.includes('icon-4.webp')),'dash and ultimate icons');
   await page.screenshot({path:`/tmp/cavaleiro37-combat-${width}.png`});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('PASS integration: actual casts in both directions, 0.3s Comet preparation, hit effects, scheduled falling/impact meteors, stage/Exposed sprites, K.O., face crop and five filled buttons on desktop/mobile.',report.measurements);
 }finally{await browser.close()}
}
(async()=>{if(!process.argv.includes('--game-only'))await verifyAssets();if(!process.argv.includes('--assets-only'))await verifyGame()})().catch(e=>{console.error(e);process.exitCode=1});
