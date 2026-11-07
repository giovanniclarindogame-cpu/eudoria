'use strict';
/*
 * KAELTHAR — Príncipe da Brasa Violeta (sprite em pixel art desenhado por código).
 *
 * Arquivo independente: não depende do motor do jogo, então a página
 * PREVIA_VILAO.html também o usa. Cada quadro é desenhado em 64×64 pixels
 * (mesma densidade de pixels dos campeões quando ampliado 2×), com o chão em
 * y=58 e o personagem olhando para a direita. O motor espelha para a esquerda.
 *
 * Para trocar pela arte final (ex.: feita no ChatGPT), basta fornecer uma folha
 * com o mesmo layout de KaeltharSprite.layout() e chamar KaeltharSprite.useSheet(img).
 */
const KaeltharSprite=(()=>{
 const S=64,GY=58,CX=32;
 const C={ink:'#140b22',skin:'#e4a87c',skinS:'#b97b59',skinH:'#f3c799',
  hair:'#1f1334',hairH:'#5a3796',hairH2:'#a06ae8',hairA:'#c58cff',hairA2:'#f1d9ff',
  suit:'#252250',suitS:'#171436',suitH:'#3b367c',
  arm:'#a82a47',armS:'#701a31',armH:'#dc4f70',
  gold:'#f2ca5c',goldS:'#b8912f',goldH:'#fff1a9',
  boot:'#1d1a3d',capeA:'#55207f',capeB:'#2d1349',capeC:'#7a35aa',
  eye:'#fff6dc',iris:'#ff3f72',irisA:'#ffffff',aura:'#c04bff',aurab:'#ff62a8'};

 /* ---------- primitivas de pixel ---------- */
 function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)}
 function dot(g,x,y,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),1,1)}
 function poly(g,pts,col){
  g.fillStyle=col;let lo=1e9,hi=-1e9;for(const p of pts){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1])}
  for(let y=Math.floor(lo);y<=Math.ceil(hi);y++){
   const yc=y+.5,xs=[];
   for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if((a[1]<=yc&&b[1]>yc)||(b[1]<=yc&&a[1]>yc))xs.push(a[0]+(yc-a[1])/(b[1]-a[1])*(b[0]-a[0]))}
   xs.sort((m,n)=>m-n);
   for(let i=0;i+1<xs.length;i+=2){const x0=Math.round(xs[i]),x1=Math.round(xs[i+1]);if(x1>x0)g.fillRect(x0,y,x1-x0,1)}
  }
 }
 function limb(g,x0,y0,x1,y1,w,c){
  const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);g.fillStyle=c;
  for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;g.fillRect(Math.round(x-w/2),Math.round(y-w/2),w,w)}
 }
 function disc(g,x,y,r,c){g.fillStyle=c;for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(i*i+j*j<=r*r+r*.6)g.fillRect(Math.round(x+i),Math.round(y+j),1,1)}
 function ik(x0,y0,x1,y1,l1,l2,s){
  let dx=x1-x0,dy=y1-y0,d=Math.hypot(dx,dy)||.01;const mx=l1+l2-.05;
  if(d>mx){x1=x0+dx/d*mx;y1=y0+dy/d*mx;dx=x1-x0;dy=y1-y0;d=mx}
  const a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
  return{ex:x0+dx*a/d+s*(-dy/d)*h,ey:y0+dy*a/d+s*(dx/d)*h,x:x1,y:y1};
 }

 /* ---------- poses ---------- */
 const base=()=>({hipY:46,sy:34,lean:0,headDy:0,hF:[CX+7,37],hB:[CX-3,38],fF:[CX+5,GY],fB:[CX-5,GY],
  sway:0,orb:null,flare:0,mouth:0,brow:0,cross:false,crouch:0,glow:0,fist:true});
 function sine(i,n,amp=1){return Math.sin(i/n*Math.PI*2)*amp}
 const POSES={
  idle:{n:4,fn:i=>({...base(),cross:true,hF:[CX-4,37.5],hB:[CX+7,38.5],sy:34+[0,0,1,1][i]*.6,headDy:[0,0,1,1][i]*.6,sway:sine(i,4)})},
  walk:{n:6,fn:i=>{const p=i/6*Math.PI*2,s=Math.sin(p),c=Math.cos(p);return{...base(),lean:1,hipY:46-Math.abs(s)*.8,hF:[CX+10+s*2,36+c],hB:[CX+6-s*2,38-c],fF:[CX+4+s*7,GY-Math.max(0,c)*3.4],fB:[CX-4-s*7,GY-Math.max(0,-c)*3.4],sway:s}}},
  guard:{n:2,fn:i=>({...base(),hipY:48,sy:37,lean:2,headDy:1,hF:[CX+10,32],hB:[CX+10,35.5],fF:[CX+7,GY],fB:[CX-5,GY],glow:i*.5,cross:true})},
  punch:{n:6,fn:(i,side)=>{
    // 0-1 preparação · 2-3 extensão · 4-5 recuperação. side=0 mão da frente; side=1 mão de trás.
    const ext=[0,.15,1,1,.45,.1][i],lean=[0,-1,3,4,2,0][i];
    const hit=[CX+25,CX+23][side],lo=[35.5,34.5][side];
    const out=[CX+hit-CX,lo],keep=side?[CX+9,35]:[CX+8,36.5];
    const ex=[CX+7+(hit-CX-7)*ext,37-(37-lo)*ext];
    const o={...base(),lean,hipY:46+(i===2||i===3?1:0),fF:[CX+8,GY],fB:[CX-7,GY]};
    if(side===0){o.hF=ex;o.hB=keep}else{o.hB=ex;o.hF=keep;o.cross=false}
    o.sway=-ext*2;return o}},
  hit:{n:2,fn:i=>({...base(),lean:i?-3:-2,sy:34+(i?1:0),headDy:-1+i,hipY:46,hF:[CX+8,i?30:33],hB:[CX+2,i?32:35],fF:[CX+8,GY],fB:[CX-8,GY],brow:2,mouth:i?2:1,sway:-2})},
  dodge:{n:1,fn:()=>({...base(),lean:-3,hipY:49,sy:38,headDy:2,hF:[CX-6,44],hB:[CX-9,40],fF:[CX+11,GY],fB:[CX-10,GY-2],sway:3})},
  tired:{n:2,fn:i=>({...base(),lean:4,sy:39+i*.8,hipY:48,headDy:3+i*.5,hF:[CX+7,50],hB:[CX+1,49],fF:[CX+8,GY],fB:[CX-6,GY],mouth:2,brow:-1,sway:-1+i})},
  // habilidades
  s0:{n:4,fn:i=>{
    if(i<2)return{...base(),lean:1,hipY:47,sy:35,hF:[CX+14+i*2,34],hB:[CX+12+i*2,37],orb:[CX+17+i*2,35.5,2+i],fF:[CX+8,GY],fB:[CX-8,GY],glow:.5+i*.5,mouth:1};
    return{...base(),lean:3,hipY:47,sy:35,hF:[CX+21,33.5],hB:[CX+19,36.5],orb:i===2?[CX+25,34,4]:null,fF:[CX+9,GY],fB:[CX-9,GY],glow:1,mouth:1,brow:1,sway:-2}}},
  s1:{n:4,fn:i=>{
    if(i===0)return{...base(),lean:-2,hipY:49,sy:38,headDy:2,hF:[CX-3,43],hB:[CX+10,39],fF:[CX+10,GY],fB:[CX-10,GY],sway:2,brow:1};
    if(i===1)return{...base(),lean:-3,hipY:50,sy:39,headDy:2,hF:[CX-8,44],hB:[CX+11,40],fF:[CX+11,GY],fB:[CX-11,GY],glow:.6,sway:3,brow:1};
    if(i===2)return{...base(),lean:7,hipY:48,sy:37,headDy:2,hF:[CX+23,34],hB:[CX+11,40],fF:[CX+13,GY-3],fB:[CX-12,GY],glow:1,sway:-5,brow:1,mouth:1};
    return{...base(),lean:3,hipY:48,sy:36,hF:[CX+14,35],hB:[CX+6,38],fF:[CX+9,GY],fB:[CX-7,GY],sway:-1}}},
  s2:{n:4,fn:i=>{
    if(i<2)return{...base(),lean:0,hipY:49+i,sy:38+i,headDy:2+i,hF:[CX+6,45],hB:[CX-4,45],fF:[CX+9,GY],fB:[CX-9,GY],glow:.5+i*.5,brow:1};
    return{...base(),lean:-1,hipY:47,sy:34,headDy:-2,hF:[CX+17,24+(i===3?3:0)],hB:[CX-13,25+(i===3?3:0)],fF:[CX+11,GY],fB:[CX-11,GY],glow:1,mouth:2,brow:1,sway:-3}}},
  s3:{n:4,fn:i=>{
    const up=[18,12,11,22][i];
    return{...base(),lean:-1,hipY:46,sy:34,headDy:-1,hF:[CX+4,up],hB:[CX-5,41],orb:i<3?[CX+4,up-6-(i===2?2:0),2+i]:null,fF:[CX+5,GY],fB:[CX-5,GY],glow:i<3?.5+i*.25:1,mouth:i===3?1:0,brow:1,sway:1}}},
  s4:{n:3,fn:i=>({...base(),hipY:48,sy:37-i,headDy:-i,hF:[CX+7,48],hB:[CX-6,48],fF:[CX+9,GY],fB:[CX-9,GY],flare:i+1,glow:1,mouth:2,brow:1,fist:true,sway:i})},
  s5:{n:5,fn:i=>{
    if(i<2)return{...base(),lean:-2,hipY:48,sy:37,headDy:1,hF:[CX-6,39],hB:[CX-3,41],orb:[CX-9,40,2+i*2],fF:[CX+8,GY],fB:[CX-9,GY],glow:.6+i*.4,brow:1,sway:2};
    if(i===2)return{...base(),lean:1,hipY:48,sy:37,hF:[CX+11,36],hB:[CX+9,38],orb:[CX+14,37,4],fF:[CX+9,GY],fB:[CX-9,GY],glow:1,brow:1};
    return{...base(),lean:i===3?5:4,hipY:48,sy:36,hF:[CX+22,34.5],hB:[CX+20,36.5],orb:i===3?[CX+26,35.5,5]:null,fF:[CX+11,GY],fB:[CX-11,GY],glow:1,mouth:1,brow:1,sway:-4}}},
  dead:{n:1,fn:()=>({...base(),lean:-3,sy:35,headDy:-1,hF:[CX+8,33],hB:[CX+2,36],fF:[CX+8,GY],fB:[CX-8,GY],brow:2,mouth:1})}
 };

 /* ---------- desenho do corpo ---------- */
 function draw(g,P,asc){
  const lean=P.lean,sy=P.sy,hipY=P.hipY,sway=P.sway;
  const sxF=CX+lean+4,sxB=CX+lean-4,syA=sy+1.5,hx=CX+lean+1,hy=sy-6+P.headDy;
  const hair=asc?C.hairA:C.hair,hairH=asc?C.hairA2:C.hairH,hairH2=asc?'#fff':C.hairH2;
  // capa
  const cw=Math.round(sway*1.6);
  poly(g,[[CX+lean-2,sy-1],[CX+lean-8,sy+1],[CX-13+cw,hipY+4],[CX-9+cw,hipY+9],[CX-5+Math.round(cw*.5),hipY+4],[CX-1,hipY-1]],C.capeB);
  poly(g,[[CX+lean-3,sy],[CX+lean-7,sy+2],[CX-11+cw,hipY+2],[CX-7+cw,hipY+6],[CX-3,hipY]],C.capeA);
  limb(g,CX+lean-5,sy+2,CX-8+cw,hipY+4,1,C.capeC);
  // perna de trás
  const legIK=(hx0,tx,ty)=>ik(hx0,hipY,tx,ty,6.6,6.6,-1);
  const leg=(hx0,t,back)=>{
   const k=legIK(hx0,t[0],t[1]);
   limb(g,hx0,hipY,k.ex,k.ey,4,back?C.suitS:C.suit);limb(g,k.ex,k.ey,k.x,k.y-1,4,C.boot);
   rect(g,k.x-2,k.y-3,5,1,C.gold);rect(g,k.x-2,k.y-2,4,1,C.goldS);
   rect(g,k.x-2,k.y-1,6,2,C.boot);rect(g,k.x+3,k.y,1,1,C.gold);
   dot(g,k.ex+1,k.ey-1,back?C.suit:C.suitH);
  };
  leg(CX-2.5,P.fB,true);
  // braço de trás
  const arm=(sx,t,front)=>{
   const k=ik(sx,syA,t[0],t[1],6.8,6.8,1);
   limb(g,sx,syA,k.ex,k.ey,3,front?C.skin:C.skinS);
   limb(g,k.ex,k.ey,k.x,k.y,3,front?C.gold:C.goldS);
   if(front)dot(g,k.ex,k.ey-1,C.goldH);
   rect(g,k.x-1,k.y-1,3,3,front?C.goldH:C.gold);rect(g,k.x,k.y,2,2,front?C.gold:C.goldS);
  };
  if(!P.cross)arm(sxB,P.hB,false);
  // tronco
  poly(g,[[CX+lean-7,sy],[CX+lean+7,sy],[CX+lean+5,hipY+1],[CX-4,hipY+1]],C.suit);
  poly(g,[[CX+lean+3,sy+3],[CX+lean+6,sy+1],[CX+lean+5,hipY],[CX+3,hipY]],C.suitS);
  // peitoral
  poly(g,[[CX+lean-7,sy],[CX+lean+7,sy],[CX+lean+6,sy+8],[CX+lean+2,sy+10],[CX+lean-2,sy+10],[CX+lean-6,sy+8]],C.arm);
  poly(g,[[CX+lean+1,sy+1],[CX+lean+6,sy+1],[CX+lean+5,sy+7],[CX+lean+2,sy+9],[CX+lean+1,sy+6]],C.armS);
  rect(g,CX+lean-6,sy+1,5,2,C.armH);
  poly(g,[[CX+lean-1,sy+3],[CX+lean+2,sy+6],[CX+lean-1,sy+9],[CX+lean-4,sy+6]],C.gold);
  dot(g,CX+lean-1,sy+6,C.arm);dot(g,CX+lean-2,sy+5,C.goldH);
  rect(g,CX+lean-7,sy,14,1,C.gold);
  // cinto e saia
  rect(g,CX+lean*.6-5,hipY-2,11,2,C.gold);rect(g,CX+lean*.6-5,hipY,11,1,C.goldS);
  rect(g,CX-1,hipY-2,3,2,C.goldH);
  // pernas da frente
  leg(CX+2.5,P.fF,false);
  // ombreiras
  rect(g,sxF-1,sy-2,7,4,C.arm);rect(g,sxF-1,sy-3,7,1,C.gold);rect(g,sxF+4,sy-2,2,5,C.armS);rect(g,sxF,sy-2,3,1,C.armH);
  rect(g,sxB-5,sy-1,5,3,C.armS);rect(g,sxB-5,sy-2,5,1,C.goldS);
  // pescoço e cabeça
  rect(g,hx-1,sy-3,3,3,C.skinS);
  poly(g,[[hx-4,hy-4],[hx+4,hy-4],[hx+5,hy-1],[hx+3,hy+3],[hx-2,hy+4],[hx-4,hy+1]],C.skin);
  poly(g,[[hx-4,hy],[hx-2,hy+4],[hx+3,hy+3],[hx+1,hy+1]],C.skinS);
  rect(g,hx-4,hy-1,2,3,C.skinS);dot(g,hx-3,hy,C.skin);
  // rosto
  const bw=P.brow,ey=hy;
  rect(g,hx,ey,3,2,C.eye);rect(g,hx+2,ey,1,2,asc?C.irisA:C.iris);dot(g,hx+2,ey,asc?'#9fe6ff':'#7a0f32');
  // sobrancelha inclinada (olhar de desdém); brow>0 = franzida, brow<0 = cansada
  const bl=bw>0?1:0;
  dot(g,hx-1,ey-2-(bw<0?0:0),C.ink);dot(g,hx,ey-2,C.ink);dot(g,hx+1,ey-2+bl,C.ink);dot(g,hx+2,ey-2+bl,C.ink);dot(g,hx+3,ey-1,C.ink);
  dot(g,hx+5,ey+1,C.skinS);dot(g,hx+4,ey+2,C.skinH);
  const my=hy+3;
  if(P.mouth===2){rect(g,hx+1,my-1,3,2,'#5a1020');dot(g,hx+2,my-1,'#fff2dc')}
  else if(P.mouth===1){rect(g,hx+2,my,3,1,'#7a2c3a')}
  else{rect(g,hx+2,my,2,1,'#7a2c3a');dot(g,hx+4,my-1,C.skinS)}
  dot(g,hx-3,hy+2,C.skinS);
  // cabelo em chamas
  const f=P.flare,up=asc?2:0,hh=[
   [-5,1],[-6,-4],[-9-f,-8-f],[-5,-7],[-7-f,-13-f*2],[-3,-10],[-3-f,-17-f*2-up],[0,-11],[2,-18-f*2-up],[4,-10],[8+f,-15-f*2],[6,-6],[8+f,-8-f],[7,-1],[5,-3],[4,-6],[0,-5],[-2,-4]
  ].map(([x,y])=>[hx+x,hy+y]);
  poly(g,hh,hair);
  poly(g,[[hx-3,hy-6],[hx-3-f,hy-15-f*2-up],[hx-1,hy-8],[hx+1,hy-6]],hairH);
  poly(g,[[hx+3,hy-7],[hx+2,hy-16-f*2-up],[hx+4,hy-8]],hairH);
  limb(g,hx-6,hy-5,hx-7-f,hy-11-f*2,1,hairH2);limb(g,hx+6,hy-5,hx+8+f,hy-12-f*2,1,hairH2);
  dot(g,hx-2,hy-14-f*2-up,hairH2);
  // braço da frente
  if(P.cross)arm(sxB,P.hB,false);
  arm(sxF,P.hF,true);
  // orbe de energia
  if(P.orb){const[ox,oy,r]=P.orb;disc(g,ox,oy,r+1,C.aura);disc(g,ox,oy,r,C.aurab);disc(g,ox,oy,Math.max(1,r-2),'#fff')}
 }

 /* ---------- contorno e cache ---------- */
 const cache=new Map();let external=null;
 function outline(c){
  const g=c.getContext('2d'),w=c.width,h=c.height,im=g.getImageData(0,0,w,h),d=im.data,out=new Uint8ClampedArray(d);
  const ink=[0x14,0x0b,0x22];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;if(d[i+3]>40)continue;
   const n=(x>0&&d[i-4+3]>40)||(x<w-1&&d[i+4+3]>40)||(y>0&&d[i-w*4+3]>40)||(y<h-1&&d[i+w*4+3]>40);
   if(n){out[i]=ink[0];out[i+1]=ink[1];out[i+2]=ink[2];out[i+3]=255}
  }
  g.putImageData(new ImageData(out,w,h),0,0);
 }
 function make(name,i,side,asc){
  const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  if(name==='dead'){
   const t=document.createElement('canvas');t.width=t.height=S;const tg=t.getContext('2d');draw(tg,POSES.hit.fn(1),asc);outline(t);
   g.translate(CX+4,GY+2);g.rotate(-Math.PI/2);g.translate(-CX,-GY);g.drawImage(t,0,0);return c;
  }
  const def=POSES[name];draw(g,def.fn(i%def.n,side),asc);outline(c);return c;
 }
 function frame(name,i=0,opt={}){
  const side=opt.side?1:0,asc=!!opt.asc,n=POSES[name]?.n||1,k=name+'|'+(i%n)+'|'+side+'|'+(asc?1:0);
  let c=cache.get(k);if(!c){c=make(name,i,side,asc);cache.set(k,c)}return c;
 }
 function paint(g,name,i,o={}){
  const{x=0,y=0,scale=2,flip=false,alpha=1,asc=false,side=0}=o;
  const c=external?external.frame(name,i,{asc,side}):frame(name,i,{asc,side});if(!c)return;
  g.save();g.imageSmoothingEnabled=false;g.globalAlpha*=alpha;g.translate(x,y);if(flip)g.scale(-1,1);
  if(o.filter)g.filter=o.filter;
  g.drawImage(c,-CX*scale,-GY*scale,S*scale,S*scale);g.restore();
 }
 function layout(){return Object.entries(POSES).map(([name,d])=>({name,frames:d.n,variants:name==='punch'?2:1}))}
 function sheet(cols=8,asc=false){
  const items=[];for(const{name,frames,variants}of layout())for(let v=0;v<variants;v++)for(let i=0;i<frames;i++)items.push({name,i,side:v});
  const rows=Math.ceil(items.length/cols),c=document.createElement('canvas');c.width=cols*S;c.height=rows*S;
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  items.forEach((it,n)=>g.drawImage(frame(it.name,it.i,{side:it.side,asc}),(n%cols)*S,Math.floor(n/cols)*S));
  return{canvas:c,items,cols};
 }
 function useSheet(provider){external=provider||null;cache.clear()}
 return{S,GY,CX,POSES,frame,paint,layout,sheet,useSheet,C,disc,rect};
})();
if(typeof window!=='undefined')window.KaeltharSprite=KaeltharSprite;
