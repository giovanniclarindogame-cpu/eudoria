// Slice generated sprite atlases and register their feet for engine use.
const sharp=require('sharp'),path=require('node:path'),fs=require('node:fs/promises');
const root=path.join(__dirname,'..');
const sources={portraits:'exec-96ee90c4-4238-4d8d-969f-8322ace579eb',spark:'exec-4085b6ba-93b6-4efa-8545-b65fbd94b792',tide:'exec-a2ed51b0-922a-4acb-994e-25401675ec47',star:'exec-641022c5-4952-4fe3-91fc-f77988546db7',steel:'exec-ae52c753-53c4-4ee7-9f0d-6c7c632f957e'};
const file=key=>path.join(process.env.ELDORIA_GENERATED_DIR||'/workspace/generated_images',sources[key]+'.png');
async function bounds(buffer){const{data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=info.width,y0=info.height,x1=0,y1=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>160){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}let footMin=info.width,footMax=0;for(let y=y1-15;y<=y1;y++)for(let x=x0;x<=x1;x++)if(data[(y*info.width+x)*4+3]>160){footMin=Math.min(footMin,x);footMax=Math.max(footMax,x)}return{x0,y0,x1,y1,height:y1-y0+1,anchor:(footMin+footMax)/2};}
(async()=>{
 const m=await sharp(file('portraits')).metadata();
 for(let i=0;i<10;i++){const col=i%5,row=Math.floor(i/5),left=Math.round(col*m.width/5),top=Math.round(row*m.height/2),width=Math.round((col+1)*m.width/5)-left,height=Math.round((row+1)*m.height/2)-top;await sharp(await sharp(file('portraits')).extract({left,top,width,height}).png().toBuffer()).trim().resize(360,440,{fit:'contain',background:'#00000000'}).webp({quality:94}).toFile(path.join(root,'assets/champions_v7',String(i+1).padStart(2,'0')+'.webp'));}
 console.log('Imported ten champion portraits.');
})().catch(e=>{console.error(e);process.exit(1)});
