// Pack the generated 6x4 transparent sheet into the existing game's atlas format.
// Usage: node scripts/pack-repulse-v33.cjs /path/to/repulse.png
const sharp=require('sharp'),path=require('node:path');
(async()=>{
 const source=process.argv[2];if(!source)throw Error('Provide the generated transparent PNG');
 const m=await sharp(source).metadata();if(m.width!==1536||m.height!==1024||!m.hasAlpha)throw Error('Expected a 1536x1024 RGBA sheet');
 const tiles=[];
 for(let f=0;f<24;f++){
  const d=await sharp(source).extract({left:f%6*256,top:Math.floor(f/6)*256,width:256,height:256}).ensureAlpha().raw().toBuffer();
  // Quantize near-zero alpha left by export to exact transparency.
  for(let i=0;i<d.length;i+=4)if(d[i+3]<=8)d.fill(0,i,i+4);
  tiles.push({input:await sharp(d,{raw:{width:256,height:256,channels:4}}).resize(224,224).png().toBuffer(),left:f%6*256+16,top:Math.floor(f/6)*256+16});
 }
 await sharp({create:{width:1536,height:1024,channels:4,background:'#0000'}}).composite(tiles).webp({lossless:true,effort:6}).toFile(path.join(__dirname,'../assets/eclipse_v30/repulse.webp'));
})().catch(e=>{console.error(e);process.exit(1)});
