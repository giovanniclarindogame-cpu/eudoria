'use strict';
/*
 * Arena do Zorvath — "Salão do Trono Cristalino" (arte do ChatGPT) na Caçada do Dia, no lugar do pátio padrão, com os 6 pilares de cristal.
 * O ambiente reage ao chefe por código: forma 2 tinge de rosa, forma 3 de violeta, e a Supernova escurece o salão enquanto carrega.
 * Só vale com a Caçada liberada (window.CACADA_LIBERADA) ou ?cacada=1. ?zorarena=0 volta ao pátio padrão.
 * assets/chefes_v78/zorvath/arena.webp (1536x1024): o piso jogável é o retângulo F; pilar.webp: um pilar de cristal (base octogonal).
 */
(function(){
if(!window.CACADA_LIBERADA||/[?&]zorarena=0/.test(location.search)||typeof buildArenaBackground!=='function'||typeof drawArenaScenery!=='function')return;
const DIR='assets/chefes_v78/zorvath/',F={x:66,y:244,w:1404,h:588};
const mk=f=>window.lazyImage?window.lazyImage(DIR+f):Object.assign(new Image(),{src:DIR+f});
const ARENA=mk('arena.webp'),PILAR=mk('pilar.webp');
const pronto=()=>ARENA.complete&&ARENA.naturalWidth>0&&PILAR.complete&&PILAR.naturalWidth>0;
const ativo=()=>{try{return arenaModeId==='guardian'&&battleActivity!=='training'&&HuntAPI.bossOfDay().id==='zorvath'}catch{return false}};
const cr=()=>{try{return modeRun&&modeRun.hunt}catch{return null}};
let meuChao=null;
for(const im of [ARENA,PILAR])im.addEventListener&&im.addEventListener('load',()=>{try{if(p&&ativo()){groundCache=null;buildArenaBackground()}}catch{}});

const prevBuild=buildArenaBackground;
buildArenaBackground=function(){
 if(!ativo()||!pronto()){meuChao=null;return prevBuild.apply(this,arguments)}
 if(groundCache&&groundCache===meuChao&&groundCache.width===W&&groundCache.height===H)return;
 groundCache=document.createElement('canvas');groundCache.width=W;groundCache.height=H;
 const g=groundCache.getContext('2d');g.imageSmoothingEnabled=true;g.drawImage(ARENA,F.x,F.y,F.w,F.h,0,0,W,H);
 pillarCache=document.createElement('canvas');pillarCache.width=W;pillarCache.height=H;
 meuChao=groundCache;try{backgroundBuilds++}catch{}
};

const prevScenery=drawArenaScenery;
drawArenaScenery=function(){
 if(!ativo()||!pronto())return prevScenery.apply(this,arguments);
 const sx=W/F.w,sy=H/F.h,R=cr();
 ctx.save();ctx.fillStyle='#0b0820';ctx.fillRect(0,0,cw,ch);
 ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=true;
 const x0=-F.x*sx,y0=-F.y*sy,w=ARENA.naturalWidth*sx,h=ARENA.naturalHeight*sy;
 ctx.drawImage(ARENA,x0,y0,w,h);
 // clima do salão: forma 2 rosada, forma 3 violeta, pulso lento; Supernova escurece
 const form=R?R.shown||R.form||1:1,t=(typeof vfxTime==='number'?vfxTime:0);
 if(form>=2){ctx.globalAlpha=(form===2?.07:.10)+.03*Math.sin(t*1.6);ctx.fillStyle=form===2?'#ff5ea8':'#9a5cff';ctx.fillRect(x0,y0,w,h)}
 if(R&&R.nova){const k=Math.min(.5,.18+.35*(R.nova.k||0));ctx.globalAlpha=k;ctx.fillStyle='#07001a';ctx.fillRect(x0,y0,w,h)}
 // poeira de cristal subindo no salão (só no fundo, acima do piso)
 ctx.globalCompositeOperation='lighter';
 for(let i=0;i<22;i++){const u=(t*(.02+(i%5)*.006)+i*.137)%1,x=x0+w*((i*.61803)%1),y=y0+h*(.2-.18*u)+Math.sin(t*.8+i)*5;
  ctx.globalAlpha=.55*Math.sin(Math.PI*u);ctx.fillStyle=i%3?'#9be8ff':'#e0c8ff';ctx.fillRect(x,y,2,2)}
 ctx.restore();
};

// pilares: o mesmo desenho nos 6 (base ≈ diâmetro da colisão)
const prevDepth=integratedDepth;
integratedDepth=function(){
 const list=prevDepth.apply(this,arguments);
 if(!ativo()||!pronto())return list;
 const entries=list.filter(e=>e.kind!=='pillar'),ratio=PILAR.naturalHeight/PILAR.naturalWidth;
 for(const o of pillars)entries.push({kind:'pillar',y:o.y,priority:0,paint(){
  const w=o.r*2.5,h=w*ratio;
  ctx.save();ctx.imageSmoothingEnabled=true;
  ctx.fillStyle='rgba(8,4,28,.45)';ctx.beginPath();ctx.ellipse(o.x+3,o.y+o.r*.45,o.r*1.15,o.r*.5,0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(PILAR,o.x-w/2,o.y+o.r*.55-h,w,h);ctx.restore();
 }});
 return entries.sort((a,b)=>a.y-b.y||(a.priority||0)-(b.priority||0)||(a.serial||0)-(b.serial||0));
};
window.ArenaZorvath={ativo,pronto,F};
})();
