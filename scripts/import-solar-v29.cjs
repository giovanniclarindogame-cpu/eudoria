// Pack the generated PNG artwork without changing its painted design.
// Usage: node scripts/import-solar-v29.cjs /path/to/png-sources
// Expected: body.png, portrait.png, background.png, icons.png and the seven FX PNGs.
const sharp=require('sharp');
const fs=require('node:fs/promises');
const path=require('node:path');
const source=process.argv[2],out=path.resolve(__dirname,'../assets/solar_v29');
if(!source)throw Error('Provide the folder containing the source PNGs.');
const effects=['slash','tiger','pillar','dash','phoenix','impact','aura'];
const png=name=>path.join(source,name+'.png');
const webp={lossless:true,effort:6};
function bounds(data,width,height){
 let top=height,bottom=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(bottom<0)throw Error('Empty body cell');
 return {top,bottom};
}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const body=await sharp(png('body')).metadata();
 if(body.width!==1254||body.height!==1254)throw Error('Body source must be 1254 × 1254.');
 const frames=[];
 for(let f=0;f<36;f++){
  const cell=await sharp(png('body')).extract({left:f%6*209,top:Math.floor(f/6)*209,width:209,height:209}).ensureAlpha().raw().toBuffer();
  frames.push({cell,...bounds(cell,209,209)});
 }
 // One scale for all poses; preserve the fixed root instead of centering on the sword.
 const standing=Math.max(...frames.slice(0,6).map(f=>f.bottom-f.top+1));
 const size=Math.min(189,Math.floor(209*174/standing)),bodyTiles=[];
 for(let f=0;f<36;f++){
  const scaled=await sharp(frames[f].cell,{raw:{width:209,height:209,channels:4}}).resize(size,size,{kernel:'nearest'}).raw().toBuffer();
  const b=bounds(scaled,size,size),top=193-b.bottom;
  const tile=await sharp(scaled,{raw:{width:size,height:size,channels:4}}).extract({left:0,top:0,width:size,height:Math.min(size,202-top)}).png().toBuffer();
  bodyTiles.push({input:tile,left:f%6*209+Math.floor((209-size)/2),top:Math.floor(f/6)*209+top});
 }
 await sharp({create:{width:1254,height:1254,channels:4,background:'#0000'}}).composite(bodyTiles).webp(webp).toFile(path.join(out,'body.webp'));
 await sharp(png('portrait')).resize(760,1140,{fit:'contain',background:'#0000'}).webp(webp).toFile(path.join(out,'portrait.webp'));
 await sharp(png('background')).resize(1536,1024).webp(webp).toFile(path.join(out,'background.webp'));
 for(let i=0;i<6;i++)await sharp(png('icons')).extract({left:i%3*512,top:Math.floor(i/3)*512,width:512,height:512}).resize(256,256).webp(webp).toFile(path.join(out,`icon-${i}.webp`));
 for(const key of effects){
  const meta=await sharp(png(key)).metadata();
  if(meta.width!==1536||meta.height!==1024)throw Error(`${key}: source grid must be 1536 × 1024`);
  const tiles=[];
  for(let f=0;f<24;f++){
   // Transparent gutters are part of the exported file, not just a canvas mask.
   const input=await sharp(png(key)).extract({left:f%6*256,top:Math.floor(f/6)*256,width:256,height:256}).resize(224,224,{kernel:'nearest'}).png().toBuffer();
   tiles.push({input,left:f%6*256+16,top:Math.floor(f/6)*256+16});
  }
  await sharp({create:{width:1536,height:1024,channels:4,background:'#0000'}}).composite(tiles).webp(webp).toFile(path.join(out,key+'.webp'));
 }
 console.log('Solar v29: body 36 poses, portrait 2:3, background, six icons, seven 24-frame effects. All lossless WebP.');
})().catch(e=>{console.error(e);process.exit(1);});
