// Usage: node scripts/import-eclipse-v30.cjs /path/to/source-pngs
// Technical packing only. The canonical portrait is never read or overwritten here.
const sharp=require('sharp'),fs=require('node:fs/promises'),path=require('node:path');
const source=process.argv[2],out=path.resolve(__dirname,'../assets/eclipse_v30');
if(!source)throw Error('Provide source PNG folder');
const effects=['repulse','attract','red','teleport','barrier','domain','impact'];
const input=n=>path.join(source,n+'.png'),webp={lossless:true,effort:6};
async function dimensions(n,w,h){const m=await sharp(input(n)).metadata();if(m.width!==w||m.height!==h)throw Error(n+': incorrect source dimensions');}
function bodyCell(d){
 const w=209,seen=new Uint8Array(w*w);let largest=[];
 for(let p=0;p<w*w;p++)if(!seen[p]&&d[p*4+3]>170){const group=[p];seen[p]=1;for(let q=0;q<group.length;q++){const at=group[q],x=at%w,y=Math.floor(at/w);for(let yy=Math.max(0,y-1);yy<=Math.min(w-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){const n=yy*w+xx;if(!seen[n]&&d[n*4+3]>170){seen[n]=1;group.push(n)}}}if(group.length>largest.length)largest=group;}
 if(!largest.length)throw Error('Empty body cell');const keep=new Uint8Array(w*w);for(const p of largest)keep[p]=1;
 let left=w,right=0,top=w,bottom=0;for(let p=0;p<w*w;p++){if(!keep[p])d.fill(0,p*4,p*4+4);else{const x=p%w,y=Math.floor(p/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}}
 return {d,left,top,width:right-left+1,height:bottom-top+1};
}
(async()=>{
 await fs.mkdir(out,{recursive:true});await dimensions('body',1254,1254);const frames=[];
 for(let i=0;i<36;i++)frames.push(bodyCell(await sharp(input('body')).extract({left:i%6*209,top:Math.floor(i/6)*209,width:209,height:209}).ensureAlpha().raw().toBuffer()));
 const scale=Math.min(173/Math.max(...frames.slice(0,6).map(f=>f.height)),189/Math.max(...frames.map(f=>f.height)),193/Math.max(...frames.map(f=>f.width))),tiles=[];
 for(let i=0;i<36;i++){const f=frames[i],h=i<6?[172,173,173,172,171,171][i]:Math.round(f.height*scale),w=Math.round(f.width*(i<6?h/f.height:scale));tiles.push({input:await sharp(f.d,{raw:{width:209,height:209,channels:4}}).extract({left:f.left,top:f.top,width:f.width,height:f.height}).resize(w,h,{kernel:'nearest'}).png().toBuffer(),left:i%6*209+Math.floor((209-w)/2),top:Math.floor(i/6)*209+194-h});}
 await sharp({create:{width:1254,height:1254,channels:4,background:'#0000'}}).composite(tiles).webp(webp).toFile(path.join(out,'body.webp'));
 await dimensions('icons',1536,1024);
 for(let i=0;i<6;i++)await sharp(input('icons')).extract({left:i%3*512,top:Math.floor(i/3)*512,width:512,height:512}).resize(256,256).webp(webp).toFile(path.join(out,`icon-${i}.webp`));
 await dimensions('background',1536,1024);await sharp(input('background')).webp(webp).toFile(path.join(out,'background.webp'));
 for(const name of effects){await dimensions(name,1536,1024);const tiles=[];
  for(let i=0;i<24;i++){
   const d=await sharp(input(name)).extract({left:i%6*256,top:Math.floor(i/6)*256,width:256,height:256}).ensureAlpha().raw().toBuffer();
   // Fade only source cell edges; keep the full intensity and colored glow inside.
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){const edge=Math.min(x,y,255-x,255-y),u=Math.min(1,edge/16),a=(y*256+x)*4+3;d[a]=Math.round(d[a]*u*u*(3-2*u));if(!d[a])d.fill(0,a-3,a+1);}
   tiles.push({input:await sharp(d,{raw:{width:256,height:256,channels:4}}).resize(224,224).png().toBuffer(),left:i%6*256+16,top:Math.floor(i/6)*256+16});
  }
  await sharp({create:{width:1536,height:1024,channels:4,background:'#0000'}}).composite(tiles).webp(webp).toFile(path.join(out,name+'.webp'));
 }
 console.log('Packed Eclipse v30: 15 lossless WebP files.');
})().catch(e=>{console.error(e);process.exit(1)});
