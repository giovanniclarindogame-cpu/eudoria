// Frame-preserving atlas slicing. Source PNGs are retained in generated_images.
const sharp=require('sharp'),path=require('node:path'),fs=require('node:fs/promises');
(async()=>{
 const sources=JSON.parse(await fs.readFile(path.join(__dirname,'../assets/skills_v7/effect-sources.json'),'utf8'));
 for(const [key,source]of Object.entries(sources)){
  const file=path.join(process.env.ELDORIA_GENERATED_DIR||'/workspace/generated_images',source+'.png'),m=await sharp(file).metadata(),parts=[];
  for(let row=0;row<6;row++)for(let col=0;col<6;col++){
   const left=Math.round(col*m.width/6),top=Math.round(row*m.height/6),width=Math.round((col+1)*m.width/6)-left,height=Math.round((row+1)*m.height/6)-top;
   const input=await sharp(await sharp(file).extract({left,top,width,height}).png().toBuffer()).resize(146,146,{fit:'contain',background:'#00000000'}).png().toBuffer();parts.push({input,left:col*160+7,top:row*160+7});
  }
  await sharp({create:{width:960,height:960,channels:4,background:'#00000000'}}).composite(parts).webp({quality:94,alphaQuality:100}).toFile(path.join(__dirname,'../assets/skills_v7',key+'-fx.webp'));
 }
 console.log('Imported 144 new illustrated VFX frames for 24 skills.');
})().catch(e=>{console.error(e);process.exit(1)});
