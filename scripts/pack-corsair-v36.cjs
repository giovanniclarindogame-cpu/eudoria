// Technical packing only: preserve the generated anatomy and animation drawings.
// node scripts/pack-corsair-v36.cjs body|skills|icons|background|punch|... source.png
const sharp=require('sharp'),fs=require('node:fs/promises'),path=require('node:path');
const [name,source]=process.argv.slice(2),out=path.resolve(__dirname,'../assets/corsair_v36');
const effects=['punch','barrage','burst','launch','aura','charge','giant','impact'];
if(!source||!['body','skills','icons','background',...effects].includes(name))throw Error('Provide asset name and PNG');
(async()=>{
 await fs.mkdir(out,{recursive:true});const im=sharp(source),meta=await im.metadata(),options={lossless:true,effort:6};
 if(name==='background'){await im.resize(1536,1024,{fit:'cover'}).removeAlpha().webp(options).toFile(path.join(out,name+'.webp'));return;}
 const body=['body','skills'].includes(name),cols=name==='icons'?3:6,rows=name==='icons'?2:body?6:4,frames=[];
 // Generated sheets can have uneven gutters. Find the empty separators before
 // repacking; proportional slicing can pick up hair/boots from adjacent poses.
 const pixels=body?await im.clone().ensureAlpha().raw().toBuffer():null;
 function cuts(axis,count,start=0,end=axis==='y'?meta.width:meta.height){
  const extent=axis==='y'?meta.height:meta.width,result=[0];
  for(let j=1;j<count;j++){
   const target=j*extent/count,lo=Math.round(target-extent/count*.24),hi=Math.round(target+extent/count*.24),runs=[];let run=null;
   for(let i=lo;i<=hi;i++){
    let ink=0;for(let k=start;k<end;k++){const x=axis==='y'?k:i,y=axis==='y'?i:k;if(pixels[(y*meta.width+x)*4+3]>170)ink++;}
    if(!ink){if(run===null)run=i;}else if(run!==null){runs.push([run,i-1]);run=null;}
   }
   if(run!==null)runs.push([run,hi]);
   runs.sort((a,b)=>Math.abs((a[0]+a[1])/2-target)-Math.abs((b[0]+b[1])/2-target));
   if(!runs.length)throw Error('No transparent separator '+axis+j);
   result.push(Math.round((runs[0][0]+runs[0][1])/2));
  }return [...result,extent];
 }
 const ys=body?cuts('y',rows):null,xs=body?Array.from({length:rows},(_,r)=>cuts('x',cols,ys[r],ys[r+1])):null;
 for(let f=0;f<cols*rows;f++){
  const col=f%cols,row=Math.floor(f/cols),left=body?xs[row][col]:Math.round(col*meta.width/cols),top=body?ys[row]:Math.round(row*meta.height/rows),w=(body?xs[row][col+1]:Math.round((col+1)*meta.width/cols))-left,h=(body?ys[row+1]:Math.round((row+1)*meta.height/rows))-top;
  const d=await im.clone().extract({left,top,width:w,height:h}).ensureAlpha().raw().toBuffer();
  let l=w,r=-1,t=h,b=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;if(d[i+3]<=8)d.fill(0,i,i+4);
   if(d[i+3]>(body?170:20)){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
  }
  if(b<0)throw Error('Empty frame '+f);frames.push({d,w,h,box:{left:l,top:t,width:r-l+1,height:b-t+1}});
 }
 if(name==='icons'){
  for(const [f,{d,w,h}]of frames.entries())await sharp(d,{raw:{width:w,height:h,channels:4}}).resize(256,256,{kernel:'nearest'}).webp(options).toFile(path.join(out,`icon-${f}.webp`));return;
 }
 const reference=body?(name==='body'?Math.max(...frames.slice(0,6).map(f=>f.box.height)):frames[5].box.height):1;
 const k=body?Math.min(173/reference,186/Math.max(...frames.map(f=>f.box.height)),193/Math.max(...frames.map(f=>f.box.width))):1;
 const side=body?209:256,tiles=[];
 for(const [f,{d,w,h,box}]of frames.entries()){
  const raw=sharp(d,{raw:{width:w,height:h,channels:4}});
  if(name==='skills'&&f<6){
   // Arpão and the basic attack share the same six water-punch drawings.
   tiles.push({input:await sharp(path.join(out,'body.webp')).extract({left:f*209,top:4*209,width:209,height:209}).png().toBuffer(),left:f*209,top:0});continue;
  }
  if(body){
   const width=Math.round(box.width*k),height=Math.round(box.height*k);
   const x=Math.max(8,Math.min(201-width,Math.round(104.5+(box.left-w/2)*k)));
   tiles.push({input:await raw.extract(box).resize(width,height,{kernel:'nearest'}).png().toBuffer(),left:f%6*side+x,top:Math.floor(f/6)*side+194-height});
  }else tiles.push({input:await raw.resize(224,224,{kernel:'nearest'}).png().toBuffer(),left:f%6*side+16,top:Math.floor(f/6)*side+16});
 }
 await sharp({create:{width:side*6,height:side*rows,channels:4,background:'#0000'}}).composite(tiles).webp(options).toFile(path.join(out,name+'.webp'));
 console.log('Packed',name,side*6,side*rows,'lossless');
})().catch(e=>{console.error(e);process.exit(1)});
