const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),sharp=require('sharp');
const root='assets/eclipse_v30/',effects=['repulse','attract','red','teleport','barrier','domain','impact'];
function lossless(d){for(let p=12;p+8<=d.length;){const tag=d.toString('ascii',p,p+4),n=d.readUInt32LE(p+4);if(tag==='VP8L')return true;if(tag==='VP8 ')return false;p+=8+n+(n&1)}return false}
(async()=>{
 const files={body:[1254,1254],background:[1536,1024]};for(let i=0;i<6;i++)files['icon-'+i]=[256,256];for(const k of effects)files[k]=[1536,1024];
 for(const [name,size] of Object.entries(files)){const p=root+name+'.webp',m=await sharp(p).metadata();assert.deepEqual([m.width,m.height],size,name);assert.ok(lossless(fs.readFileSync(p)),name+' lossless');if(name!=='background')assert.ok(m.hasAlpha,name+' alpha');}
 const heights=[];
 for(const name of ['body',...effects]){const body=name==='body',side=body?209:256,count=body?36:24,hashes=new Set();for(let i=0;i<count;i++){
  const d=await sharp(root+name+'.webp').extract({left:i%6*side,top:Math.floor(i/6)*side,width:side,height:side}).ensureAlpha().raw().toBuffer();let top=side,bottom=-1,visible=0;
  for(let y=0;y<side;y++)for(let x=0;x<side;x++){const a=d[(y*side+x)*4+3];if(a>10)visible++;if(a>170){top=Math.min(top,y);bottom=Math.max(bottom,y)}const gutter=body?4:16;if(x<gutter||y<gutter||x>=side-gutter||y>=side-gutter)assert.equal(a,0,`${name}/${i}: transparent gutter`);}
  assert.ok(visible>0,`${name}/${i}: empty`);if(body){assert.equal(bottom,193,`body/${i}: feet`);if(i<6)heights.push(bottom-top+1);}hashes.add(crypto.createHash('sha256').update(d).digest('hex'));
 }assert.equal(hashes.size,count,name+': unique frames');}
 assert.equal(Math.max(...heights),173,'idle height');
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('assets/portraits/campeao_05.webp')).digest('hex'),'eada08c8f4b473f30ee206bd9f5c63eecfdb8c113e858d8913aa14ac335518e5','canonical portrait preserved');
 console.log('PASS: 15 lossless WebPs, exact dimensions, 36 unique grounded body cells, 168 unique FX cells, transparent gutters, original portrait unchanged. Idle heights:',heights);
})().catch(e=>{console.error(e);process.exit(1)});
