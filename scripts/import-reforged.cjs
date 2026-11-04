// Usage: node scripts/import-reforged.cjs /path/to/generation-manifest.json
const sharp=require('sharp'),fs=require('fs');
(async()=>{const inputs=JSON.parse(fs.readFileSync(process.argv[2]));const out='assets/reforged_v9';fs.mkdirSync(out,{recursive:true});let manifest={version:9,columns:6,rows:4,frames:24,cell:128,sheets:{}};
for(const [key,{path}]of Object.entries(inputs)){
 const im=sharp(path),m=await im.metadata();
 if(key==='icons'){
 for(let row=0;row<4;row++)for(let col=0;col<6;col++)await sharp(path).extract({left:Math.round(col*m.width/6),top:Math.round(row*m.height/4),width:Math.round((col+1)*m.width/6)-Math.round(col*m.width/6),height:Math.round((row+1)*m.height/4)-Math.round(row*m.height/4)}).resize(128,128).webp({quality:92}).toFile(`${out}/${['spark','tide','star','steel'][row]}-${col}-icon.webp`);
 continue;
 }
 const cells=[];for(let row=0;row<4;row++)for(let col=0;col<6;col++){
 const cell=await sharp(path).extract({left:Math.round(col*m.width/6),top:Math.round(row*m.height/4),width:Math.round((col+1)*m.width/6)-Math.round(col*m.width/6),height:Math.round((row+1)*m.height/4)-Math.round(row*m.height/4)}).resize(128,128,{fit:'fill',kernel:'nearest'}).png().toBuffer();cells.push({input:cell,left:col*128,top:row*128});
 }
 await sharp({create:{width:768,height:512,channels:4,background:'#00000000'}}).composite(cells).webp({lossless:true}).toFile(`${out}/${key}.webp`);manifest.sheets[key]={file:`${key}.webp`,frames:24};
}
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');})();
