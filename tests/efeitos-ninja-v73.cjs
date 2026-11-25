// Efeitos do Ninja das Brumas: nenhum quadro da folha pode ter borda visível (recorte reto) nem névoa forte cobrindo o quadro.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext()).newPage();
 await p.goto('http://localhost:8000/index.html');
 const folhas=['assets/ninja_v22/electric.webp','assets/ninja_v22/slash.webp','assets/ninja_v22/smoke.webp','assets/ninja_v23/copy-eye.webp','assets/ninja_v23/thunder-impact.webp','assets/ninja_v25/charge.webp','assets/ninja_v25/impact.webp','assets/reforged_v10/ninja-3.webp'];
 for(const f of folhas){
  const r=await p.evaluate(async f=>{const im=new Image();im.src=f+'?t='+Date.now();await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
   const d=g.getImageData(0,0,c.width,c.height).data,W=c.width,cw=W/6,ch=c.height/4;let borda=0,nevoa=0,tot=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<W;x++){const a=d[(y*W+x)*4+3];tot++;if(a>0&&a<=12)nevoa++;const ex=x%cw,ey=y%ch;if((ex===0||ex===cw-1||ey===0||ey===ch-1)&&a>borda)borda=a}
   return{borda,nevoa:nevoa/tot}},f);
  ok(r.borda<=8&&r.nevoa<.12,`${f}: borda dos quadros alpha máx ${r.borda}, névoa fraca ${(r.nevoa*100).toFixed(2)}%`);
 }
 await b.close()})();
