'use strict';
// Wide arena: keep the full battlefield visible and reserve space for the HUD.
configureArenaSize=function(){
 W=matchMode==='2v2'?1440:1280;H=matchMode==='2v2'?630:560;
 pillars=[{x:88,y:130,r:23},{x:W-88,y:130,r:23},{x:88,y:H-130,r:23},{x:W-88,y:H-130,r:23}];
};
let courtyardWide=false;
updateArenaCamera=function(){
 if(!cw||!ch)return;
 const top=window.battleTop?battleTop():(ch<520?58:88);
 if(courtyardWide||cw<ch){
  scale=Math.min((cw-20)/W,(ch-top-24)/H);ox=(cw-W*scale)/2;oy=top+(ch-top-H*scale)/2;return;
 }
 // Follow the fighter at a readable scale. Controls overlay the outer corners.
 scale=Math.min(1.38,Math.max(cw/1100,(ch-top)/585));
 const focus=p?.hp>0?p:actors.find(a=>a.team===p?.team&&a.hp>0)||p;
 const x=focus?.x??W/2,y=focus?.y??H/2;
 ox=cw*.43-x*scale;oy=top+(ch-top)*.43-y*scale;
};
// The HUD already displays names and HP; no duplicate overlays on the sprites.
drawActorStatus=function(){};
const cameraButton=document.createElement('button');
cameraButton.id='arenaZoom';cameraButton.type='button';cameraButton.textContent='−';
cameraButton.setAttribute('aria-label','Ver arena inteira');cameraButton.setAttribute('aria-pressed','false');
cameraButton.onclick=()=>{courtyardWide=!courtyardWide;cameraButton.textContent=courtyardWide?'+':'−';cameraButton.setAttribute('aria-pressed',String(courtyardWide));cameraButton.setAttribute('aria-label',courtyardWide?'Aproximar câmera':'Ver arena inteira');resize();};
document.querySelector('#battle').appendChild(cameraButton);
function courtyardRandom(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function courtyardTree(g,x,y,size,seed){
 const rand=courtyardRandom(seed);
 g.save();g.translate(x,y);g.scale(size,size);
 g.strokeStyle='#382b35';g.lineCap='round';g.lineWidth=13;
 g.beginPath();g.moveTo(0,65);g.lineTo(-5,8);g.lineTo(-30,-28);g.moveTo(-5,10);g.lineTo(27,-27);g.stroke();
 for(let i=0;i<70;i++){
  const a=rand()*Math.PI*2,r=Math.sqrt(rand())*64;
  g.fillStyle=['#753854','#a34d75','#cd709a','#ed9abb','#ffc4d7'][Math.floor(rand()*5)];
  g.beginPath();g.arc(Math.cos(a)*r,Math.sin(a)*r*.65-20,7+rand()*12,0,TAU);g.fill();
 }
 g.restore();
}
function courtyardLantern(g,x,y,s=1){
 g.save();g.translate(x,y);g.scale(s,s);
 const glow=g.createRadialGradient(0,-20,1,0,-20,34);glow.addColorStop(0,'#ffd18488');glow.addColorStop(1,'#ffae4200');g.fillStyle=glow;g.fillRect(-34,-54,68,68);
 g.fillStyle='#62556a';g.fillRect(-14,5,28,7);g.fillRect(-6,-20,12,28);
 g.fillStyle='#ad8d7d';g.fillRect(-16,-39,32,28);g.fillStyle='#ffe3a4';g.fillRect(-11,-35,22,18);
 g.strokeStyle='#5d4652';g.lineWidth=3;g.strokeRect(-11,-35,22,18);g.beginPath();g.moveTo(0,-35);g.lineTo(0,-17);g.stroke();
 g.fillStyle='#3e394e';g.beginPath();g.moveTo(-25,-39);g.lineTo(0,-57);g.lineTo(25,-39);g.closePath();g.fill();g.fillStyle='#bc9b82';g.fillRect(-22,-39,44,3);g.restore();
}
function drawArenaScenery(){
 const g=ctx,rand=courtyardRandom(623);
 const sky=g.createLinearGradient(0,0,0,ch);sky.addColorStop(0,'#171a32');sky.addColorStop(.55,'#454454');sky.addColorStop(1,'#222336');g.fillStyle=sky;g.fillRect(0,0,cw,ch);
 const top=oy+35*scale,left=ox,right=ox+W*scale;
 // Temple façade and stairway above the playable courtyard.
 g.fillStyle='#353042';g.fillRect(left,0,right-left,top);
 for(let x=left+45;x<right;x+=95){g.fillStyle='#694c4c';g.fillRect(x,0,13,top-5);g.fillStyle='#a78170';g.fillRect(x+2,0,3,top-5);g.fillStyle='#171b30';g.fillRect(x+19,65,67,Math.max(4,top-70));}
 const roof=Math.max(45,top-58);g.fillStyle='#232b40';g.beginPath();g.moveTo(left-15,roof);g.lineTo(left+50,roof-26);g.lineTo(right-50,roof-26);g.lineTo(right+15,roof);g.closePath();g.fill();g.strokeStyle='#827083';g.lineWidth=3;g.stroke();
 for(let x=left;x<right;x+=18){g.strokeStyle='#4f5169';g.beginPath();g.moveTo(x,roof-21);g.lineTo(x-7,roof-1);g.stroke();}
 for(let i=0;i<4;i++){g.fillStyle=i%2?'#8b7e89':'#625f73';g.fillRect(cw/2-115-i*10,top-22+i*6,230+i*20,6);}
 const treeSize=Math.max(.55,Math.min(1.4,cw/1100));
 courtyardTree(g,left+16,top+15,treeSize,12);courtyardTree(g,right-16,top+15,treeSize,44);
 courtyardTree(g,left+8,ch-45,treeSize*.85,64);courtyardTree(g,right-8,ch-45,treeSize*.85,99);
 for(const x of [left+145,right-145])courtyardLantern(g,x,top-6,.8);
 // Sparse petals; decoration only, outside collision logic.
 g.fillStyle='#edb2c788';for(let i=0;i<26;i++){const x=rand()*cw,y=(rand()*ch+vfxTime*(5+rand()*6))%ch;g.beginPath();g.ellipse(x+Math.sin(vfxTime*.4+i)*9,y,3,1.4,.5,0,TAU);g.fill();}
}
const courtyardPriorBackground=buildArenaBackground;
buildArenaBackground=function(){
 const old=groundCache;courtyardPriorBackground();if(old===groundCache)return;
 const g=groundCache.getContext('2d'),pg=pillarCache.getContext('2d'),rand=courtyardRandom(9354);
 g.clearRect(0,0,W,H);g.fillStyle='#373943';g.fillRect(22,22,W-44,H-44);
 const colors=['#77727b','#817b82','#8a8089','#736e78','#8c8287','#797783'];
 for(let y=35,row=0;y<H-35;y+=64,row++)for(let x=35-(row%2)*43;x<W-35;x+=86){
  const l=Math.max(x,35),w=Math.min(x+83,W-35)-l,h=Math.min(61,H-35-y);if(w<=0)continue;
  g.fillStyle=colors[Math.floor(rand()*colors.length)];g.fillRect(l,y,w,h);
  g.fillStyle='#d9c6c333';g.fillRect(l+2,y+2,w-4,2);g.fillStyle='#302e4144';g.fillRect(l,y+h-3,w,3);
  if(rand()<.33){g.strokeStyle='#4d4b5b';g.lineWidth=1;g.beginPath();g.moveTo(l+15,y);g.lineTo(l+25,y+16);g.lineTo(l+21,y+25);g.stroke();}
  if(rand()<.44){g.fillStyle='#62785b';for(let i=0;i<4;i++)g.fillRect(l+rand()*w,y+h-2,3+rand()*5,3);}
 }
 // Inlaid central star remains flat and never obstructs movement.
 g.save();g.translate(W/2,H/2);g.strokeStyle='#d8c7bb55';g.lineWidth=2;g.beginPath();g.arc(0,0,100,0,TAU);g.stroke();g.beginPath();for(let i=0;i<16;i++){const a=i*TAU/16-Math.PI/2,r=i%2?40:86;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();g.stroke();g.restore();
 for(let i=0;i<160;i++){const x=35+rand()*(W-70),y=35+rand()*(H-70);if(x>180&&x<W-180&&rand()>.12)continue;g.fillStyle=rand()>.5?'#d89eb6':'#f2bfd0';g.beginPath();g.ellipse(x,y,2+rand()*2,1.2,rand()*3,0,TAU);g.fill();}
 g.strokeStyle='#b0a0a0';g.lineWidth=3;g.strokeRect(30,30,W-60,H-60);
 // Four lantern plinths match the exact collision footprints and depth ordering.
 pg.clearRect(0,0,W,H);
 for(const o of pillars){pg.fillStyle='#24243766';pg.beginPath();pg.ellipse(o.x+6,o.y+8,o.r+8,o.r*.6,0,0,TAU);pg.fill();courtyardLantern(pg,o.x,o.y,1);}
 const shade=g.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#22284022');shade.addColorStop(.45,'#ffffff00');shade.addColorStop(1,'#24233833');g.fillStyle=shade;g.fillRect(30,30,W-60,H-60);
};
// Point toward an opponent outside the close camera without labelling the sprite.
drawArenaMap=function(){
 if(!p||courtyardWide||p.hp<=0)return;
 const target=enemy(p);if(!target||target===p)return;
 const x=target.x*scale+ox,y=target.y*scale+oy;
 if(x>=24&&x<=cw-24&&y>=80&&y<=ch-20)return;
 const tx=Math.max(26,Math.min(cw-26,x)),ty=Math.max(ch<520?92:120,Math.min(ch-210,y));
 ctx.save();ctx.translate(tx,ty);ctx.rotate(Math.atan2(y-ty,x-tx));ctx.fillStyle='#ffd496';ctx.strokeStyle='#172338';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-8,-8);ctx.lineTo(-8,8);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();
};
const courtyardUpdate=updateUI;
updateUI=function(){
 courtyardUpdate();if(!p||!b)return;
 for(const [selector,a] of [['.fighterhud:not(.enemy)',p],['.fighterhud.enemy',enemy(p)]]){
  const hud=document.querySelector(selector);if(!hud)continue;
  let portrait=hud.querySelector('.arena-portrait');if(!portrait){portrait=document.createElement('img');portrait.className='arena-portrait';portrait.alt='';hud.prepend(portrait);}
  const src=(window.v3FaceSrc&&window.v3FaceSrc(a))||(a.trainingDummy?'assets/arena_v15/fantoche-retrato.webp':'assets/portraits/campeao_'+String(a.skin+1).padStart(2,'0')+'.webp');if(portrait.getAttribute('src')!==src)portrait.src=src;
 }
};
document.querySelector('.arena-caption').textContent='PÁTIO DAS CEREJEIRAS';
window.addEventListener('resize',()=>{if(p)resize();});

for(const mode of Object.values(ARENA_MODES)){const teams=['zone','guardian'].some(id=>ARENA_MODES[id]===mode);mode.w=teams?1440:1280;mode.h=teams?630:560;}
