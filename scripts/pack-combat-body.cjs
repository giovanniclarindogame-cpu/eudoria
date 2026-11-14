// Pack a generated 6×6 transparent atlas without changing its anatomy.
// Usage: node scripts/pack-combat-body.cjs source.png assets/.../body.webp
const sharp=require('sharp'),fs=require('node:fs/promises'),path=require('node:path');
const [source,target]=process.argv.slice(2);
if(!source||!target)throw Error('Provide source PNG and target WebP');
(async()=>{
 const im=sharp(source),meta=await im.metadata(),frames=[];
 for(let f=0;f<36;f++){
  const left=Math.round(f%6*meta.width/6),top=Math.round(Math.floor(f/6)*meta.height/6);
  const width=Math.round((f%6+1)*meta.width/6)-left,height=Math.round((Math.floor(f/6)+1)*meta.height/6)-top;
  const d=await im.clone().extract({left,top,width,height}).ensureAlpha().raw().toBuffer();
  let l=width,r=-1,t=height,b=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const i=(y*width+x)*4;if(d[i+3]<=8)d.fill(0,i,i+4);
   if(d[i+3]>170){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
  }
  if(b<0)throw Error('Empty frame '+f);
  frames.push({d,width,height,box:{left:l,top:t,width:r-l+1,height:b-t+1}});
 }
 const scale=Math.min(173/Math.max(...frames.slice(0,6).map(f=>f.box.height)),187/Math.max(...frames.map(f=>f.box.height)),193/Math.max(...frames.map(f=>f.box.width)));
 const tiles=[];
 for(const [f,{d,width,height,box}]of frames.entries()){
  const w=Math.round(box.width*scale),h=Math.round(box.height*scale);
  tiles.push({input:await sharp(d,{raw:{width,height,channels:4}}).extract(box).resize(w,h,{kernel:'nearest'}).png().toBuffer(),left:f%6*209+Math.max(4,Math.min(205-w,Math.round(104.5+(box.left-width/2)*scale))),top:Math.floor(f/6)*209+194-h});
 }
 await fs.mkdir(path.dirname(target),{recursive:true});
 await sharp({create:{width:1254,height:1254,channels:4,background:'#0000'}}).composite(tiles).webp({lossless:true,effort:6}).toFile(target);
 console.log('Packed',target);
})().catch(e=>{console.error(e);process.exit(1)});
