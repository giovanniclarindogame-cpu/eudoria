// Technical atlas packing: generated drawings retain their original anatomy and colors.
// Usage: node scripts/pack-hunter-v32.cjs /folder/with/source-pngs
const sharp=require('sharp'),fs=require('node:fs/promises'),path=require('node:path');
const source=process.argv[2],out=path.resolve(__dirname,'../assets/hunter_v32');
if(!source)throw Error('Provide source folder');
const effects=['punch','charge','heavy','rod','jump','oath','impact'];
const options={lossless:true,effort:6};
async function exists(name){try{await fs.access(path.join(source,name+'.png'));return true}catch{return false}}
async function cells(name,cols,rows){
 const im=sharp(path.join(source,name+'.png')),m=await im.metadata(),result=[];
 for(let f=0;f<cols*rows;f++){
  const x=Math.round(f%cols*m.width/cols),y=Math.round(Math.floor(f/cols)*m.height/rows),w=Math.round((f%cols+1)*m.width/cols)-x,h=Math.round((Math.floor(f/cols)+1)*m.height/rows)-y;
  const d=await im.clone().extract({left:x,top:y,width:w,height:h}).ensureAlpha().raw().toBuffer();
  for(let i=0;i<d.length;i+=4)if(d[i+3]<=8)d.fill(0,i,i+4);
  result.push({d,w,h});
 }return result;
}
function bounds({d,w,h}){let l=w,r=-1,t=h,b=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>170){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}if(b<0)throw Error('Empty cell');return {left:l,top:t,width:r-l+1,height:b-t+1};}
async function body(name,rows){
 const frames=await cells(name,6,rows),boxes=frames.map(bounds),tiles=[];
 const idleMax=Math.max(...boxes.slice(0,6).map(b=>b.height)),scale=Math.min(173/idleMax,187/Math.max(...boxes.map(b=>b.height)),193/Math.max(...boxes.map(b=>b.width)));
 for(let f=0;f<frames.length;f++){
  const {d,w,h}=frames[f],b=boxes[f],height=Math.round(b.height*scale),width=Math.round(b.width*scale);
  tiles.push({input:await sharp(d,{raw:{width:w,height:h,channels:4}}).extract(b).resize(width,height,{kernel:'nearest'}).png().toBuffer(),left:f%6*209+Math.max(4,Math.min(205-width,Math.round(104.5+(b.left-w/2)*scale))),top:Math.floor(f/6)*209+194-height});
 }
 await sharp({create:{width:1254,height:rows*209,channels:4,background:'#0000'}}).composite(tiles).webp(options).toFile(path.join(out,name+'.webp'));
 console.log('Packed',name,'idle height',Math.round(idleMax*scale));
}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 for(const [name,rows]of [['body',6],['adult',4]])if(await exists(name))await body(name,rows);
 if(await exists('icons')){const tiles=await cells('icons',3,2);for(let f=0;f<6;f++){const {d,w,h}=tiles[f];await sharp(d,{raw:{width:w,height:h,channels:4}}).resize(256,256).webp(options).toFile(path.join(out,`icon-${f}.webp`));}}
 if(await exists('background'))await sharp(path.join(source,'background.png')).resize(1536,1024).webp(options).toFile(path.join(out,'background.webp'));
 for(const name of effects)if(await exists(name)){
  const tiles=[];for(const [f,{d,w,h}]of (await cells(name,6,4)).entries())tiles.push({input:await sharp(d,{raw:{width:w,height:h,channels:4}}).resize(224,224).png().toBuffer(),left:f%6*256+16,top:Math.floor(f/6)*256+16});
  await sharp({create:{width:1536,height:1024,channels:4,background:'#0000'}}).composite(tiles).webp(options).toFile(path.join(out,name+'.webp'));console.log('Packed',name);
 }
})().catch(e=>{console.error(e);process.exit(1)});
