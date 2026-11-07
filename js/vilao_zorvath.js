'use strict';
/*
 * ZORVATH — Imperador Cristalino (sprite em pixel art desenhado por código).
 * Vilão original no arquétipo do tirano que luta contido e vai liberando formas.
 *
 * Arquivo independente do motor (PREVIA_VILAO.html também o usa). Cada quadro é
 * 64×64 pixels (ampliado 2× no jogo, mesma densidade dos campeões), olhando para a
 * direita; o motor espelha. Ele FLUTUA: os pés ficam ~6px acima do chão.
 * Três formas: 1 Contido (largo, chifres), 2 Liberto (alto, cabeça alongada),
 * 3 Perfeito (esguio, calota roxa). KaeltharSprite foi removido junto com o Kaelthar.
 */
const ZorvathSprite=(()=>{
 const S=64,GY=58,CX=32,HOV=6;
 const C={ink:'#150b24',
  w:'#efeaf6',wS:'#b7abd0',wH:'#ffffff',
  p:'#7a45b0',pS:'#4b2877',pH:'#aa74e6',pD:'#2e1650',
  bone:'#d7cde6',boneS:'#9a8bb6',
  gem:'#ff3a6e',gemH:'#ffc2d4',gemS:'#a01238',
  eye:'#ff2e5a',eyeH:'#fff0f4',glow:'#ff62a8',aura:'#b86bff'};

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

 /* ---------- formas ---------- */
 const FORM=[null,
  {shW:8,hipW:5,arm:4,leg:4,hl:4,al:6.2,tail:3,head:5},   // 1 Contido
  {shW:6.5,hipW:4.5,arm:3,leg:3,hl:4,al:6.8,tail:3,head:4}, // 2 Liberto
  {shW:5.5,hipW:4,arm:3,leg:3,hl:4.2,al:7,tail:2,head:4}   // 3 Perfeito
 ];

 /* ---------- poses ---------- */
 const FY=GY-HOV;                                         // pés flutuando
 const base=()=>({hipY:41,sy:30,lean:0,headDy:0,hF:[CX+5,35],hB:[CX-3,36],fF:[CX+3,FY],fB:[CX-3,FY],
  tail:null,sway:0,orb:null,glow:0,mouth:0,brow:0,cross:false,finger:false,bob:0,shake:0});
 const POSES={
  idle:{n:4,fn:i=>({...base(),cross:true,hF:[CX-2,34],hB:[CX+6,35.5],bob:[0,-1,-1,0][i],sway:[0,1,2,1][i]-1})},
  glide:{n:4,fn:i=>({...base(),lean:3,hipY:42,bob:[0,-1,0,-1][i],hF:[CX-5,37],hB:[CX-6,34],fF:[CX-4,FY-1],fB:[CX-9,FY-3],sway:[2,3,2,1][i]})},
  guard:{n:2,fn:i=>({...base(),lean:1,sy:31,hipY:42,hF:[CX+9,28],hB:[CX+9,31.5],cross:true,glow:i*.5,bob:-i})},
  punch:{n:6,fn:(i,side)=>{
    const ext=[0,.15,1,1,.45,.1][i],lean=[0,-1,3,4,2,0][i];
    const hit=[CX+23,CX+21][side],lo=[33,32][side],keep=side?[CX+8,32]:[CX+7,34];
    const ex=[CX+6+(hit-CX-6)*ext,35-(35-lo)*ext];
    const o={...base(),lean,fF:[CX+6,FY],fB:[CX-5,FY]};
    if(side===0){o.hF=ex;o.hB=keep}else{o.hB=ex;o.hF=keep}
    o.sway=-ext*3;return o}},
  hit:{n:2,fn:i=>({...base(),lean:i?-3:-2,sy:30+(i?1:0),headDy:-1+i,hF:[CX+7,i?27:30],hB:[CX+1,i?29:32],brow:2,mouth:i?2:1,sway:-2,shake:1})},
  dodge:{n:1,fn:()=>({...base(),lean:-4,hipY:43,sy:33,headDy:2,hF:[CX-7,40],hB:[CX-10,36],fF:[CX+9,FY],fB:[CX-10,FY-2],sway:3})},
  stun:{n:2,fn:i=>({...base(),lean:4,sy:34+i,hipY:44,headDy:3+i*.5,hF:[CX+6,46],hB:[CX,45],mouth:2,brow:-1,sway:-1+i,shake:1,bob:2})},
  power:{n:4,fn:i=>({...base(),hipY:43,sy:33,headDy:-1,hF:[CX+8,44],hB:[CX-7,44],glow:1,mouth:2,brow:1,shake:1,bob:[0,-1,-2,-1][i],sway:[1,-1,2,-2][i]})},
  beam:{n:4,fn:i=>{
    if(i===0)return{...base(),lean:-1,hF:[CX+7,25],hB:[CX-4,36],finger:true,glow:.5,brow:1,fF:[CX+3,FY],fB:[CX-4,FY]};
    if(i===1)return{...base(),lean:0,hF:[CX+11,28],hB:[CX-4,36],finger:true,glow:1,brow:1,orb:[CX+14,28,2]};
    if(i===2)return{...base(),lean:3,hF:[CX+22,31],hB:[CX-6,37],finger:true,glow:1,brow:1,mouth:1,sway:-3};
    return{...base(),lean:1,hF:[CX+13,33],hB:[CX-3,36],finger:true,sway:-1}}},
  disc:{n:4,fn:i=>{
    if(i===0)return{...base(),lean:-1,hF:[CX+3,18],hB:[CX-4,37],glow:.5,brow:1};
    if(i===1)return{...base(),lean:-1,hF:[CX+3,13],hB:[CX-4,37],glow:.8,brow:1,orb:[CX+3,8,0]};
    if(i===2)return{...base(),lean:4,hF:[CX+19,28],hB:[CX-7,36],glow:1,brow:1,mouth:1,sway:-3};
    return{...base(),lean:2,hF:[CX+12,33],hB:[CX-3,36]}}},
  whip:{n:4,fn:i=>{
    if(i===0)return{...base(),lean:-3,hipY:42,sy:31,hF:[CX+3,37],hB:[CX-6,33],tail:[CX-14,FY-8],brow:1};
    if(i===1)return{...base(),lean:-1,hipY:42,hF:[CX+6,36],hB:[CX-6,36],tail:[CX-7,FY-16],glow:.6,brow:1};
    if(i===2)return{...base(),lean:4,hF:[CX+8,36],hB:[CX-6,37],tail:[CX+27,FY-8],brow:1,mouth:1,glow:1};
    return{...base(),lean:2,tail:[CX+14,FY-4],hF:[CX+5,35],hB:[CX-3,36]}}},
  psy:{n:3,fn:i=>({...base(),lean:1,hF:[CX+15,30],hB:[CX+4,33],glow:.7+i*.3,brow:1,mouth:i?1:0,bob:[0,-1,-1][i]})},
  burst:{n:3,fn:i=>{
    if(i<2)return{...base(),hipY:43,sy:33,headDy:1,hF:[CX+6,43],hB:[CX-5,43],glow:.5+i*.5,brow:1,shake:1};
    return{...base(),lean:-2,sy:29,headDy:-2,hF:[CX+16,36],hB:[CX-14,36],glow:1,mouth:2,brow:1,sway:-3,bob:-2}}},
  nova:{n:4,fn:i=>{
    if(i===0)return{...base(),lean:-1,hF:[CX+3,20],hB:[CX-5,37],glow:.6,brow:1};
    if(i<3)return{...base(),lean:-1,hF:[CX+2,12],hB:[CX-6,36],glow:1,brow:1,mouth:i===2?2:1,shake:i===2?1:0,bob:-1};
    return{...base(),lean:5,hF:[CX+16,34],hB:[CX-7,38],glow:1,brow:1,mouth:1,sway:-4}}},
  dead:{n:1,fn:()=>({...base(),lean:-3,sy:31,headDy:-1,hF:[CX+7,30],hB:[CX+1,33],brow:2,mouth:1})}
 };

 /* ---------- corpo ---------- */
 function draw(g,P,form){
  const F=FORM[form],lean=P.lean,sy=P.sy,hipY=P.hipY;
  g.save();g.translate(P.shake?(Math.random()<.5?-1:1):0,P.bob);
  const sxF=CX+lean+F.shW*.55,sxB=CX+lean-F.shW*.55,syA=sy+1.5,hx=CX+lean+1,hy=sy-6+P.headDy;
  const skin=C.w,skinS=C.wS,pur=C.p,purS=C.pS,purH=C.pH;
  const final=form===3;
  // cauda
  {
   const bx=CX-F.hipW+1,by=hipY+1,tip=P.tail||[CX-12-form+P.sway,FY-7-P.sway*.5];
   const mx=(bx+tip[0])/2-(P.tail?0:2),my=Math.max(by,tip[1])+(P.tail?-4:3);
   const N=16,pts=[];
   for(let i=0;i<=N;i++){const t=i/N,x=(1-t)*(1-t)*bx+2*(1-t)*t*mx+t*t*tip[0],y=(1-t)*(1-t)*by+2*(1-t)*t*my+t*t*tip[1];pts.push([x,y])}
   for(let i=0;i<N;i++){const t=i/N,w=Math.max(1,Math.round(F.tail*(1-t*.6)));limb(g,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],w,t>.72?pur:skin)}
   rect(g,pts[N][0],pts[N][1],1,1,purH);
  }
  const leg=(hx0,t,back)=>{
   const k=ik(hx0,hipY,t[0],t[1],5.2,5.2,-1);
   limb(g,hx0,hipY,k.ex,k.ey,F.leg,back?skinS:skin);
   limb(g,k.ex,k.ey,k.x,k.y-1,F.leg,back?skinS:skin);
   if(form>1){limb(g,k.ex,k.ey,k.x,k.y-1,F.leg,back?purS:pur)}
   rect(g,k.x-2,k.y-1,5,2,back?purS:pur);rect(g,k.x+2,k.y,2,1,purH);
  };
  leg(CX-F.hipW*.45,P.fB,true);
  const arm=(sx,t,front)=>{
   const k=ik(sx,syA,t[0],t[1],F.al,F.al,1);
   limb(g,sx,syA,k.ex,k.ey,F.arm,front?skin:skinS);
   limb(g,k.ex,k.ey,k.x,k.y,F.arm,front?(form>1?pur:skin):(form>1?purS:skinS));
   if(front)dot(g,k.ex,k.ey-1,C.wH);
   if(P.finger&&front){limb(g,k.x,k.y,k.x+3,k.y,1,C.wH);dot(g,k.x+4,k.y,C.glow)}
   else{rect(g,k.x-1,k.y-1,3,3,front?skin:skinS);dot(g,k.x+1,k.y-1,front?C.wH:skin)}
  };
  if(!P.cross)arm(sxB,P.hB,false);
  // tronco
  const tw=F.shW,ww=F.hipW;
  poly(g,[[CX+lean-tw,sy],[CX+lean+tw,sy],[CX+lean+ww,hipY+1],[CX-ww,hipY+1]],skin);
  poly(g,[[CX+lean+tw*.4,sy+2],[CX+lean+tw,sy],[CX+lean+ww,hipY+1],[CX+ww*.3,hipY+1]],skinS);
  if(form===1){
   poly(g,[[CX+lean-tw,sy],[CX+lean+tw,sy],[CX+lean+tw-1,sy+8],[CX+lean,sy+10],[CX+lean-tw+1,sy+8]],pur);
   poly(g,[[CX+lean+1,sy+1],[CX+lean+tw,sy+1],[CX+lean+tw-1,sy+7],[CX+lean+1,sy+9]],purS);
   rect(g,CX+lean-tw+1,sy+1,4,2,purH);
   for(let i=0;i<3;i++)rect(g,CX+lean-3+i*2,sy+11+i,2,1,skinS);
  }else if(form===2){
   poly(g,[[CX+lean-tw,sy],[CX+lean+tw,sy],[CX+lean+tw-1,sy+7],[CX+lean,sy+9],[CX+lean-tw+1,sy+7]],pur);
   poly(g,[[CX+lean+1,sy+1],[CX+lean+tw,sy+1],[CX+lean+tw-1,sy+6],[CX+lean+1,sy+8]],purS);
   rect(g,CX+lean-tw+1,sy+1,3,2,purH);
  }else{
   rect(g,CX+lean-2,sy+3,5,2,wS(skinS));rect(g,CX+lean-tw+1,sy+2,3,2,C.wH);
   dot(g,CX+lean-1,sy+7,skinS);dot(g,CX+lean+2,sy+7,skinS);
  }
  // cinto
  rect(g,CX+lean*.5-ww,hipY-1,ww*2+1,2,purS);rect(g,CX+lean*.5-ww,hipY-1,ww*2+1,1,pur);
  leg(CX+F.hipW*.45,P.fF,false);
  // ombreiras
  if(form===1){
   poly(g,[[sxF-3,sy+2],[sxF-2,sy-2],[sxF+3,sy-5],[sxF+6,sy-1],[sxF+6,sy+4],[sxF-1,sy+5]],pur);
   poly(g,[[sxF+2,sy-1],[sxF+6,sy-1],[sxF+6,sy+4],[sxF+2,sy+4]],purS);
   dot(g,sxF,sy-2,purH);dot(g,sxF+1,sy-3,purH);dot(g,sxF+3,sy-5,C.bone);dot(g,sxF+4,sy-6,C.bone);
   poly(g,[[sxB-5,sy+2],[sxB-4,sy-1],[sxB,sy-3],[sxB+1,sy+3]],purS);
  }else if(form===2){
   poly(g,[[sxF-2,sy+3],[sxF-1,sy-2],[sxF+3,sy-6],[sxF+5,sy-2],[sxF+5,sy+4]],pur);
   dot(g,sxF+3,sy-6,C.bone);dot(g,sxF+3,sy-7,C.bone);rect(g,sxF,sy-2,2,1,purH);
   poly(g,[[sxB-4,sy+3],[sxB-3,sy-1],[sxB,sy-4],[sxB+1,sy+3]],purS);
  }else{
   poly(g,[[sxF-2,sy+3],[sxF-1,sy-2],[sxF+2,sy-5],[sxF+5,sy-3],[sxF+5,sy+3]],pur);
   rect(g,sxF,sy-2,3,1,purH);dot(g,sxF+2,sy-1,C.gem);dot(g,sxF+2,sy,C.gemH);
   poly(g,[[sxB-4,sy+3],[sxB-3,sy-1],[sxB,sy-3],[sxB+1,sy+3]],purS);dot(g,sxB-1,sy,C.gemS);
  }
  // pescoço e cabeça
  rect(g,hx-1,sy-3,3,3,skinS);
  const hw=F.head;
  poly(g,[[hx-hw,hy-4],[hx+hw,hy-4],[hx+hw+1,hy-1],[hx+hw-1,hy+3],[hx-2,hy+4],[hx-hw,hy+1]],skin);
  poly(g,[[hx-hw,hy],[hx-2,hy+4],[hx+hw-1,hy+3],[hx+1,hy+1]],skinS);
  // cabeça por forma
  if(form===1){
   poly(g,[[hx-hw-1,hy-3],[hx-hw+1,hy-5],[hx,hy-6],[hx+hw,hy-5],[hx+hw+1,hy-3],[hx+hw-1,hy-4],[hx,hy-5]],purS);
   poly(g,[[hx-3,hy-4],[hx-6,hy-7],[hx-10,hy-15],[hx-7,hy-9],[hx-2,hy-6]],C.bone);poly(g,[[hx-5,hy-6],[hx-9,hy-14],[hx-6,hy-9]],C.boneS);
   poly(g,[[hx+3,hy-4],[hx+6,hy-7],[hx+9,hy-14],[hx+7,hy-9],[hx+2,hy-6]],C.bone);poly(g,[[hx+6,hy-6],[hx+8,hy-13],[hx+7,hy-9]],C.boneS);
  }else if(form===2){
   poly(g,[[hx-hw,hy-3],[hx-hw-2,hy-5],[hx-hw-1,hy-9],[hx,hy-8],[hx+hw-1,hy-5],[hx+hw,hy-3]],skin);
   poly(g,[[hx-hw-2,hy-5],[hx-hw-1,hy-9],[hx-2,hy-8],[hx-3,hy-4]],skinS);
   poly(g,[[hx-3,hy-6],[hx-5,hy-9],[hx-7,hy-13],[hx-4,hy-9],[hx-1,hy-6]],C.bone);
   poly(g,[[hx+2,hy-6],[hx+5,hy-9],[hx+7,hy-12],[hx+5,hy-8],[hx+3,hy-5]],C.bone);
   rect(g,hx-1,hy-8,3,2,pur);dot(g,hx,hy-7,C.gem);
  }else{
   poly(g,[[hx-hw-1,hy-2],[hx-hw-3,hy-6],[hx-hw-1,hy-10],[hx+1,hy-11],[hx+hw,hy-8],[hx+hw+1,hy-4],[hx+hw-1,hy-3],[hx,hy-6],[hx-hw+1,hy-4]],pur);
   poly(g,[[hx-hw-3,hy-6],[hx-hw-1,hy-10],[hx-2,hy-10],[hx-2,hy-6]],purS);
   rect(g,hx-2,hy-9,4,1,purH);dot(g,hx+2,hy-7,C.gem);dot(g,hx+2,hy-8,C.gemH);dot(g,hx-3,hy-7,C.gem);
  }
  // rosto: olhos vermelhos e sobrancelha severa
  const bw=P.brow,gl=P.glow>.6;
  rect(g,hx,hy,3,2,gl?C.eyeH:'#2a1236');rect(g,hx+1,hy,2,2,C.eye);dot(g,hx+1,hy,C.ink);
  dot(g,hx-1,hy-2,C.ink);dot(g,hx,hy-2,C.ink);dot(g,hx+1,hy-2+(bw>0?1:0),C.ink);dot(g,hx+2,hy-2+(bw>0?1:0),C.ink);dot(g,hx+3,hy-1,C.ink);
  const my=hy+3;
  if(P.mouth===2){rect(g,hx+1,my-1,3,2,'#4b1030');dot(g,hx+2,my-1,C.wH)}
  else if(P.mouth===1){rect(g,hx+2,my,3,1,'#7a2c4a')}
  else{rect(g,hx+2,my,2,1,'#7a2c4a');dot(g,hx+4,my-1,skinS)}
  dot(g,hx-3,hy+2,skinS);
  // braço da frente
  if(P.cross)arm(sxB,P.hB,false);
  arm(sxF,P.hF,true);
  if(P.orb&&P.orb[2]>0){const[ox,oy,r]=P.orb;disc(g,ox,oy,r+1,C.aura);disc(g,ox,oy,r,C.glow);disc(g,ox,oy,Math.max(1,r-1),'#fff')}
  g.restore();
 }
 function wS(c){return c}

 /* ---------- contorno e cache ---------- */
 const cache=new Map();let external=null;
 function outline(c){
  const g=c.getContext('2d'),w=c.width,h=c.height,im=g.getImageData(0,0,w,h),d=im.data,out=new Uint8ClampedArray(d);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;if(d[i+3]>40)continue;
   const n=(x>0&&d[i-4+3]>40)||(x<w-1&&d[i+4+3]>40)||(y>0&&d[i-w*4+3]>40)||(y<h-1&&d[i+w*4+3]>40);
   if(n){out[i]=0x15;out[i+1]=0x0b;out[i+2]=0x24;out[i+3]=255}
  }
  g.putImageData(new ImageData(out,w,h),0,0);
 }
 function make(name,i,side,form){
  const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  if(name==='dead'){
   const t=document.createElement('canvas');t.width=t.height=S;const tg=t.getContext('2d');draw(tg,POSES.hit.fn(1),form);outline(t);
   g.translate(CX+4,GY+2);g.rotate(-Math.PI/2);g.translate(-CX,-GY);g.drawImage(t,0,0);return c;
  }
  const def=POSES[name];draw(g,def.fn(i%def.n,side),form);outline(c);return c;
 }
 function frame(name,i=0,opt={}){
  const side=opt.side?1:0,form=Math.min(3,Math.max(1,opt.form||1)),n=POSES[name]?.n||1,k=name+'|'+(i%n)+'|'+side+'|'+form;
  let c=cache.get(k);if(!c){c=make(name,i,side,form);cache.set(k,c)}return c;
 }
 function paint(g,name,i,o={}){
  const{x=0,y=0,scale=2,flip=false,alpha=1,form=1,side=0}=o;
  const c=external?external.frame(name,i,{form,side}):frame(name,i,{form,side});if(!c)return;
  g.save();g.imageSmoothingEnabled=false;g.globalAlpha*=alpha;g.translate(x,y);if(flip)g.scale(-1,1);
  if(o.filter)g.filter=o.filter;
  g.drawImage(c,-CX*scale,-GY*scale,S*scale,S*scale);g.restore();
 }
 function layout(){return Object.entries(POSES).map(([name,d])=>({name,frames:d.n,variants:name==='punch'?2:1}))}
 function sheet(cols=8,form=1){
  const items=[];for(const{name,frames,variants}of layout())for(let v=0;v<variants;v++)for(let i=0;i<frames;i++)items.push({name,i,side:v});
  const rows=Math.ceil(items.length/cols),c=document.createElement('canvas');c.width=cols*S;c.height=rows*S;
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  items.forEach((it,n)=>g.drawImage(frame(it.name,it.i,{side:it.side,form}),(n%cols)*S,Math.floor(n/cols)*S));
  return{canvas:c,items,cols};
 }
 function useSheet(provider){external=provider||null;cache.clear()}
 return{S,GY,CX,HOV,POSES,frame,paint,layout,sheet,useSheet,C,disc,rect};
})();
if(typeof window!=='undefined')window.ZorvathSprite=ZorvathSprite;
