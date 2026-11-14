const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),sharp=require('sharp');
const root='assets/heir_v33/',effects=['kick','charge','punch','leap','dash','aura','limit','impact'];
function lossless(d){for(let p=12;p+8<=d.length;){const tag=d.toString('ascii',p,p+4),n=d.readUInt32LE(p+4);if(tag==='VP8L')return true;if(tag==='VP8 ')return false;p+=8+n+(n&1)}return false}
(async()=>{
 const files={portrait:[760,1140],body:[1254,1254],background:[1536,1024]};for(let i=0;i<6;i++)files['icon-'+i]=[256,256];for(const k of effects)files[k]=[1536,1024];
 for(const [name,size]of Object.entries(files)){const p=root+name+'.webp',m=await sharp(p).metadata();assert.deepEqual([m.width,m.height],size,name);assert.ok(lossless(fs.readFileSync(p)),name+' lossless');if(name!=='background')assert.ok(m.hasAlpha,name+' alpha');}
 for(const name of ['body',...effects]){
  const body=name==='body',side=body?209:256,count=name==='body'?36:24,hashes=new Set(),heights=[];
  for(let f=0;f<count;f++){
   const d=await sharp(root+name+'.webp').extract({left:f%6*side,top:Math.floor(f/6)*side,width:side,height:side}).ensureAlpha().raw().toBuffer();let top=side,bottom=-1,visible=0,plate=0;
   for(let y=0;y<side;y++)for(let x=0;x<side;x++){
    const i=(y*side+x)*4,a=d[i+3];if(a>10)visible++;if(a>170){top=Math.min(top,y);bottom=Math.max(bottom,y)}
    const margin=body?4:16;if(x<margin||y<margin||x>=side-margin||y>=side-margin)assert.equal(a,0,`${name}/${f}: transparent margin`);
    if(!body&&a>10&&Math.min(d[i],d[i+1],d[i+2])>190&&Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2])<25)plate++;
   }
   assert.ok(visible>4,`${name}/${f}: nonempty`);
   if(body){assert.ok(Math.abs(bottom-193)<=1,`${name}/${f}: grounded at 193 (got ${bottom})`);if(f<6)heights.push(bottom-top+1)}
   else{assert.ok(visible<side*side*.65,`${name}/${f}: no opaque backing`);assert.ok(plate<side*side*.12,`${name}/${f}: no white plate`)}
   hashes.add(crypto.createHash('sha256').update(d).digest('hex'));
  }
  assert.equal(hashes.size,count,name+' distinct frames');if(body)assert.equal(Math.max(...heights),173,name+' max idle height');
 }
 console.log('PASS Heir: 17 lossless WebPs, exact sizes, 36 body + 192 FX distinct frames, grounded feet, transparent gutters, no white plates.');
})().catch(e=>{console.error(e);process.exit(1)});
