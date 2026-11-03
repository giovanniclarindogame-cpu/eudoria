// Slice generated sprite atlases and register their feet for engine use.
const sharp=require('sharp'),path=require('node:path'),fs=require('node:fs/promises');
const root=path.join(__dirname,'..');
const sources={portraits:'exec-96ee90c4-4238-4d8d-969f-8322ace579eb',spark:'exec-4085b6ba-93b6-4efa-8545-b65fbd94b792',tide:'exec-a2ed51b0-922a-4acb-994e-25401675ec47',star:'exec-641022c5-4952-4fe3-91fc-f77988546db7',steel:'exec-ae52c753-53c4-4ee7-9f0d-6c7c632f957e'};
const file=key=>path.join(process.env.ELDORIA_GENERATED_DIR||'/workspace/generated_images',sources[key]+'.png');
async function bounds(buffer){const{data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=info.width,y0=info.height,x1=0,y1=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>160){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}let footMin=info.width,footMax=0;for(let y=y1-15;y<=y1;y++)for(let x=x0;x<=x1;x++)if(data[(y*info.width+x)*4+3]>160){footMin=Math.min(footMin,x);footMax=Math.max(footMax,x)}return{x0,y0,x1,y1,height:y1-y0+1,anchor:(footMin+footMax)/2};}
(async()=>{
 const m=await sharp(file('portraits')).metadata();
 for(let i=0;i<10;i++){const col=i%5,row=Math.floor(i/5),left=Math.round(col*m.width/5),top=Math.round(row*m.height/2),width=Math.round((col+1)*m.width/5)-left,height=Math.round((row+1)*m.height/2)-top;await sharp(await sharp(file('portraits')).extract({left,top,width,height}).png().toBuffer()).trim().resize(360,440,{fit:'contain',background:'#00000000'}).webp({quality:94}).toFile(path.join(root,'assets/champions_v7',String(i+1).padStart(2,'0')+'.webp'));}
 const manifest={cell:128,columns:6,rows:6,feet:[64,118],sources,frames:{}};
 for(const key of ['spark','tide','star','steel']){
  const m=await sharp(file(key)).metadata(),parts=[];manifest.frames[key]=[];
  for(let row=0;row<6;row++){
   let ratio;
   for(let col=0;col<6;col++){
    const left=Math.round(col*m.width/6),top=Math.round(row*m.height/6),width=Math.round((col+1)*m.width/6)-left,height=Math.round((row+1)*m.height/6)-top;
    const cell=await sharp(file(key)).extract({left,top,width,height}).png().toBuffer(),b=await bounds(cell);if(col===0)ratio=85/b.height;
    const w=Math.round(width*ratio),h=Math.round(height*ratio),offsetX=Math.round(64-b.anchor*ratio),lift=(row===2||key==='spark'&&row===3)&&col>=3&&col<=4?7:0,offsetY=Math.round(118-b.y1*ratio-lift);
    const scaled=await sharp(cell).resize(w,h).png().toBuffer();
    // Keep fixed atlas cells even if a generated follow-through reaches their margin.
    const cropLeft=Math.max(0,-offsetX),cropTop=Math.max(0,-offsetY),cw=Math.min(w-cropLeft,128-Math.max(0,offsetX)),ch=Math.min(h-cropTop,128-Math.max(0,offsetY));
    const input=await sharp(scaled).extract({left:cropLeft,top:cropTop,width:cw,height:ch}).png().toBuffer();parts.push({input,left:col*128+Math.max(0,offsetX),top:row*128+Math.max(0,offsetY)});manifest.frames[key].push({row,col,height:b.height,sourceAnchor:b.anchor});
   }
  }
  await sharp({create:{width:768,height:768,channels:4,background:'#00000000'}}).composite(parts).webp({lossless:true}).toFile(path.join(root,'assets/skills_v7',key+'-cast.webp'));
 }
 await fs.writeFile(path.join(root,'assets/skills_v7/manifest.json'),JSON.stringify(manifest,null,2));console.log('Imported ten portraits and 144 registered cast frames.');
})().catch(e=>{console.error(e);process.exit(1)});
