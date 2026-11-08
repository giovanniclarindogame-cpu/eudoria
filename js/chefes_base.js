'use strict';
/*
 * BASE DOS CHEFES DA CAÇADA DO DIA.
 *  - BossSprite: desenha qualquer chefe humanoide em pixel art 64×64 (ampliado ~2,3× no jogo) a partir de um
 *    "visual" (look): cor da pele, cabelo, máscara, armadura, capa, asas, chifres, arma…
 *  - BossIcons: ícones 24×24 das habilidades, gerados por forma + duas cores.
 * O Zorvath (js/vilao_zorvath.js) tem sprite próprio; os outros 9 chefes usam esta base.
 */
const BossSprite=(()=>{
 const S=64,GY=58,CX=32;
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

 /* ---------- poses (mesmos nomes do motor: idle, walk, guard, punch, hit, dodge, tired, s0..s5, dead) ---------- */
 const base=()=>({hipY:46,sy:34,lean:0,headDy:0,hF:[CX+7,37],hB:[CX-3,38],fF:[CX+5,GY],fB:[CX-5,GY],
  sway:0,orb:null,flare:0,mouth:0,brow:0,cross:false,glow:0,bob:0,shake:0});
 const sine=(i,n,a=1)=>Math.sin(i/n*Math.PI*2)*a;
 const POSES={
  idle:{n:4,fn:i=>({...base(),cross:true,hF:[CX-4,37.5],hB:[CX+7,38.5],sy:34+[0,0,1,1][i]*.6,headDy:[0,0,1,1][i]*.6,sway:sine(i,4)})},
  walk:{n:6,fn:i=>{const p=i/6*Math.PI*2,s=Math.sin(p),c=Math.cos(p);return{...base(),lean:1,hipY:46-Math.abs(s)*.8,hF:[CX+10+s*2,36+c],hB:[CX+6-s*2,38-c],fF:[CX+4+s*7,GY-Math.max(0,c)*3.4],fB:[CX-4-s*7,GY-Math.max(0,-c)*3.4],sway:s}}},
  guard:{n:2,fn:i=>({...base(),hipY:48,sy:37,lean:2,headDy:1,hF:[CX+10,32],hB:[CX+10,35.5],fF:[CX+7,GY],fB:[CX-5,GY],glow:i*.5,cross:true})},
  punch:{n:6,fn:(i,side)=>{
    const ext=[0,.15,1,1,.45,.1][i],lean=[0,-1,3,4,2,0][i],hit=[CX+25,CX+23][side],lo=[35.5,34.5][side],keep=side?[CX+9,35]:[CX+8,36.5];
    const ex=[CX+7+(hit-CX-7)*ext,37-(37-lo)*ext];
    const o={...base(),lean,hipY:46+(i===2||i===3?1:0),fF:[CX+8,GY],fB:[CX-7,GY]};
    if(side===0){o.hF=ex;o.hB=keep}else{o.hB=ex;o.hF=keep}
    o.sway=-ext*2;return o}},
  hit:{n:2,fn:i=>({...base(),lean:i?-3:-2,sy:34+(i?1:0),headDy:-1+i,hF:[CX+8,i?30:33],hB:[CX+2,i?32:35],brow:2,mouth:i?2:1,sway:-2,shake:1})},
  dodge:{n:1,fn:()=>({...base(),lean:-3,hipY:49,sy:38,headDy:2,hF:[CX-6,44],hB:[CX-9,40],fF:[CX+11,GY],fB:[CX-10,GY-2],sway:3})},
  tired:{n:2,fn:i=>({...base(),lean:4,sy:39+i*.8,hipY:48,headDy:3+i*.5,hF:[CX+7,50],hB:[CX+1,49],mouth:2,brow:-1,sway:-1+i,shake:1})},
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
  s3:{n:4,fn:i=>{const up=[18,12,11,22][i];return{...base(),lean:-1,hipY:46,sy:34,headDy:-1,hF:[CX+4,up],hB:[CX-5,41],orb:i<3?[CX+4,up-6-(i===2?2:0),2+i]:null,fF:[CX+5,GY],fB:[CX-5,GY],glow:i<3?.5+i*.25:1,mouth:i===3?1:0,brow:1,sway:1}}},
  s4:{n:3,fn:i=>({...base(),hipY:48,sy:37-i,headDy:-i,hF:[CX+7,48],hB:[CX-6,48],fF:[CX+9,GY],fB:[CX-9,GY],flare:i+1,glow:1,mouth:2,brow:1,sway:i,shake:1})},
  s5:{n:5,fn:i=>{
    if(i<2)return{...base(),lean:-2,hipY:48,sy:37,headDy:1,hF:[CX-6,39],hB:[CX-3,41],orb:[CX-9,40,2+i*2],fF:[CX+8,GY],fB:[CX-9,GY],glow:.6+i*.4,brow:1,sway:2};
    if(i===2)return{...base(),lean:1,hipY:48,sy:37,hF:[CX+11,36],hB:[CX+9,38],orb:[CX+14,37,4],fF:[CX+9,GY],fB:[CX-9,GY],glow:1,brow:1};
    return{...base(),lean:i===3?5:4,hipY:48,sy:36,hF:[CX+22,34.5],hB:[CX+20,36.5],orb:i===3?[CX+26,35.5,5]:null,fF:[CX+11,GY],fB:[CX-11,GY],glow:1,mouth:1,brow:1,sway:-4}}},
  dead:{n:1,fn:()=>({...base(),lean:-3,sy:35,headDy:-1,hF:[CX+8,33],hB:[CX+2,36],fF:[CX+8,GY],fB:[CX-8,GY],brow:2,mouth:1})}
 };

 /* ---------- valores padrão de um visual ---------- */
 function fill(L){
  const d={skin:'#e4a87c',skinS:'#b97b59',skinH:'#f3c799',
   hair:{type:'spiky',c:'#1f1334',h:'#5a3796',h2:'#a06ae8'},
   torso:{c:'#a82a47',s:'#701a31',h:'#dc4f70',trim:'#f2ca5c',trimS:'#b8912f',trimH:'#fff1a9',gem:null},
   under:{c:'#252250',s:'#171436',h:'#3b367c'},boots:{c:'#1d1a3d',trim:'#f2ca5c'},
   glove:{c:'#f2ca5c',s:'#b8912f',h:'#fff1a9'},sleeve:null,belt:'#f2ca5c',
   cape:null,mask:null,eyes:{c:'#fff6dc',iris:'#ff3f72'},extras:[],weapon:null,aura:{a:'#c04bff',b:'#ff62a8'},ink:'#140b22'};
  const o={...d,...L};
  for(const k of['hair','torso','under','boots','glove'])o[k]={...d[k],...(L[k]||{})};
  o.eyes={...d.eyes,...(L.eyes||{})};o.extras=L.extras||[];
  return o;
 }

 /* ---------- corpo ---------- */
 function draw(g,P,L){
  const lean=P.lean,sy=P.sy,hipY=P.hipY,sway=P.sway,T=L.torso,U=L.under,H=L.hair,has=k=>L.extras.includes(k);
  const sxF=CX+lean+4,sxB=CX+lean-4,syA=sy+1.5,hx=CX+lean+1,hy=sy-6+P.headDy;
  g.save();g.translate(P.shake?(Math.random()<.5?-1:1):0,P.bob||0);
  // asas (atrás de tudo)
  if(has('wings')){
   const w=L.wing||{c:'#bfe8ff',s:'#6fb0d8'},fl=Math.round(sway*1.5);
   g.save();g.globalAlpha=.78;
   poly(g,[[CX+lean-3,sy],[CX+lean-18,sy-14+fl],[CX+lean-24,sy-4+fl],[CX+lean-14,sy+8],[CX+lean-4,sy+8]],w.c);
   poly(g,[[CX+lean-3,sy+2],[CX+lean-14,sy-6+fl],[CX+lean-17,sy+2],[CX+lean-6,sy+7]],w.s);
   g.restore();
  }
  // halo atrás da cabeça
  if(has('halo')){const hc=L.haloC||'#ffd84a';for(let a=0;a<14;a++){const t=a/14*Math.PI*2;dot(g,hx+Math.cos(t)*11,hy-4+Math.sin(t)*11,hc)}for(let a=0;a<8;a++){const t=a/8*Math.PI*2+.4;limb(g,hx+Math.cos(t)*11,hy-4+Math.sin(t)*11,hx+Math.cos(t)*15,hy-4+Math.sin(t)*15,1,hc)}}
  // capa
  if(L.cape){
   const cw=Math.round(sway*1.6),cp=L.cape,len=L.capeLen||9;
   poly(g,[[CX+lean-2,sy-1],[CX+lean-8,sy+1],[CX-13+cw,hipY+len-5],[CX-9+cw,hipY+len],[CX-5+Math.round(cw*.5),hipY+len-5],[CX-1,hipY-1]],cp.b);
   poly(g,[[CX+lean-3,sy],[CX+lean-7,sy+2],[CX-11+cw,hipY+len-7],[CX-7+cw,hipY+len-3],[CX-3,hipY]],cp.a);
   limb(g,CX+lean-5,sy+2,CX-8+cw,hipY+len-5,1,cp.c);
  }
  const leg=(hx0,t,back)=>{
   const k=ik(hx0,hipY,t[0],t[1],6.6,6.6,-1);
   limb(g,hx0,hipY,k.ex,k.ey,4,back?U.s:U.c);limb(g,k.ex,k.ey,k.x,k.y-1,4,L.boots.c);
   rect(g,k.x-2,k.y-3,5,1,L.boots.trim);rect(g,k.x-2,k.y-1,6,2,L.boots.c);dot(g,k.x+3,k.y,L.boots.trim);
   dot(g,k.ex+1,k.ey-1,back?U.c:U.h);
  };
  leg(CX-2.5,P.fB,true);
  const sl=L.sleeve,GL=L.glove;
  const arm=(sx,t,front)=>{
   const k=ik(sx,syA,t[0],t[1],6.8,6.8,1);
   limb(g,sx,syA,k.ex,k.ey,3,sl?(front?sl.c:sl.s):(front?L.skin:L.skinS));
   limb(g,k.ex,k.ey,k.x,k.y,3,front?GL.c:GL.s);
   if(front)dot(g,k.ex,k.ey-1,GL.h);
   rect(g,k.x-1,k.y-1,3,3,front?GL.h:GL.c);rect(g,k.x,k.y,2,2,front?GL.c:GL.s);
   return k;
  };
  if(!P.cross)arm(sxB,P.hB,false);
  // tronco
  poly(g,[[CX+lean-7,sy],[CX+lean+7,sy],[CX+lean+5,hipY+1],[CX-4,hipY+1]],U.c);
  poly(g,[[CX+lean+3,sy+3],[CX+lean+6,sy+1],[CX+lean+5,hipY],[CX+3,hipY]],U.s);
  poly(g,[[CX+lean-7,sy],[CX+lean+7,sy],[CX+lean+6,sy+8],[CX+lean+2,sy+10],[CX+lean-2,sy+10],[CX+lean-6,sy+8]],T.c);
  poly(g,[[CX+lean+1,sy+1],[CX+lean+6,sy+1],[CX+lean+5,sy+7],[CX+lean+2,sy+9],[CX+lean+1,sy+6]],T.s);
  rect(g,CX+lean-6,sy+1,5,2,T.h);
  if(T.gem){poly(g,[[CX+lean-1,sy+3],[CX+lean+2,sy+6],[CX+lean-1,sy+9],[CX+lean-4,sy+6]],T.gem);dot(g,CX+lean-2,sy+5,'#fff')}
  else{poly(g,[[CX+lean-1,sy+3],[CX+lean+2,sy+6],[CX+lean-1,sy+9],[CX+lean-4,sy+6]],T.trim);dot(g,CX+lean-2,sy+5,T.trimH)}
  rect(g,CX+lean-7,sy,14,1,T.trim);
  rect(g,CX+lean*.6-5,hipY-2,11,2,L.belt);rect(g,CX-1,hipY-2,3,2,T.trimH);
  leg(CX+2.5,P.fF,false);
  // ombreiras
  rect(g,sxF-1,sy-2,7,4,T.c);rect(g,sxF-1,sy-3,7,1,T.trim);rect(g,sxF+4,sy-2,2,5,T.s);rect(g,sxF,sy-2,3,1,T.h);
  rect(g,sxB-5,sy-1,5,3,T.s);rect(g,sxB-5,sy-2,5,1,T.trimS);
  if(has('spikes')){poly(g,[[sxF,sy-3],[sxF+2,sy-8],[sxF+4,sy-3]],T.trim);poly(g,[[sxF+3,sy-3],[sxF+6,sy-7],[sxF+7,sy-3]],T.trimS);poly(g,[[sxB-5,sy-2],[sxB-4,sy-6],[sxB-2,sy-2]],T.trimS)}
  // pescoço e cabeça
  rect(g,hx-1,sy-3,3,3,L.skinS);
  const hooded=H.type==='hood',fullMask=L.mask&&L.mask.type==='full';
  const skin=hooded?'#120d18':L.skin;
  poly(g,[[hx-4,hy-4],[hx+4,hy-4],[hx+5,hy-1],[hx+3,hy+3],[hx-2,hy+4],[hx-4,hy+1]],skin);
  if(!hooded){poly(g,[[hx-4,hy],[hx-2,hy+4],[hx+3,hy+3],[hx+1,hy+1]],L.skinS);rect(g,hx-4,hy-1,2,3,L.skinS);dot(g,hx-3,hy,L.skin)}
  // rosto
  const bw=P.brow,ey=hy,E=L.eyes;
  if(fullMask){
   poly(g,[[hx-4,hy-4],[hx+4,hy-4],[hx+5,hy-1],[hx+3,hy+3],[hx-2,hy+4],[hx-4,hy+1]],L.mask.c);
   rect(g,hx+1,hy-1,2,2,'#0a0610');dot(g,hx+2,hy-1,E.iris);
   if(L.mask.mark)limb(g,hx-2,hy-3,hx+3,hy+2,1,L.mask.mark);
  }else{
   rect(g,hx,ey,3,2,hooded?'#0a0610':E.c);rect(g,hx+2,ey,1,2,E.iris);dot(g,hx+2,ey,'#2a0a14');
   if(!hooded){const bl=bw>0?1:0;dot(g,hx-1,ey-2,L.ink);dot(g,hx,ey-2,L.ink);dot(g,hx+1,ey-2+bl,L.ink);dot(g,hx+2,ey-2+bl,L.ink);dot(g,hx+3,ey-1,L.ink);dot(g,hx+5,ey+1,L.skinS)}
   const my=hy+3;
   if(L.mask&&L.mask.type==='half'){rect(g,hx-3,hy+1,8,4,L.mask.c);rect(g,hx-3,hy+1,8,1,L.mask.mark||L.mask.c);dot(g,hx+1,hy+4,L.mask.mark||'#888');dot(g,hx+3,hy+4,L.mask.mark||'#888')}
   else if(P.mouth===2){rect(g,hx+1,my-1,3,2,'#5a1020');dot(g,hx+2,my-1,'#fff2dc')}
   else if(P.mouth===1)rect(g,hx+2,my,3,1,'#7a2c3a');
   else{rect(g,hx+2,my,2,1,'#7a2c3a');dot(g,hx+4,my-1,L.skinS)}
   if(L.mask&&L.mask.type==='eyepatch'){rect(g,hx+1,hy-1,3,3,'#0a0610');limb(g,hx-4,hy-3,hx+5,hy-1,1,'#0a0610')}
  }
  if(has('scar'))limb(g,hx+2,hy-3,hx+4,hy+2,1,'#8a2a2a');
  if(has('tattoo')){dot(g,hx+1,hy-3,'#1a1a22');dot(g,hx+3,hy+1,'#1a1a22');dot(g,hx-1,hy+2,'#1a1a22');rect(g,hx,hy-4,1,2,'#1a1a22')}
  if(has('thirdEye')){dot(g,hx+1,hy-4,'#ff3a3a');dot(g,hx+1,hy-3,'#a01010')}
  if(has('beard')){poly(g,[[hx-3,hy+2],[hx+4,hy+2],[hx+4,hy+7],[hx+1,hy+9],[hx-2,hy+7]],L.beardC||'#161014');dot(g,hx+3,hy+3,'#2a2024')}
  // cabelo / capuz
  const f=P.flare;
  if(H.type==='spiky'||H.type==='wild'){
   const hh=[[-5,1],[-6,-4],[-9-f,-8-f],[-5,-7],[-7-f,-13-f*2],[-3,-10],[-3-f,-17-f*2],[0,-11],[2,-18-f*2],[4,-10],[8+f,-15-f*2],[6,-6],[8+f,-8-f],[7,-1],[5,-3],[4,-6],[0,-5],[-2,-4]].map(([x,y])=>[hx+x,hy+y]);
   poly(g,hh,H.c);
   poly(g,[[hx-3,hy-6],[hx-3-f,hy-15-f*2],[hx-1,hy-8],[hx+1,hy-6]],H.h);poly(g,[[hx+3,hy-7],[hx+2,hy-16-f*2],[hx+4,hy-8]],H.h);
   limb(g,hx-6,hy-5,hx-7-f,hy-11-f*2,1,H.h2);limb(g,hx+6,hy-5,hx+8+f,hy-12-f*2,1,H.h2);
  }else if(H.type==='long'){
   const sw=Math.round(sway*1.3);
   poly(g,[[hx-5,hy-3],[hx-8+sw,hy+6],[hx-10+sw,hy+16],[hx-5+sw,hy+14],[hx-2,hy+4],[hx-2,hy-2]],H.c);
   poly(g,[[hx-6+sw,hy+4],[hx-9+sw,hy+14],[hx-6+sw,hy+13],[hx-4,hy+3]],H.h);
   poly(g,[[hx-5,hy+1],[hx-6,hy-5],[hx-3,hy-8],[hx+3,hy-9],[hx+6,hy-6],[hx+7,hy-2],[hx+5,hy-4],[hx+2,hy-6],[hx-1,hy-5],[hx-3,hy-3]],H.c);
   poly(g,[[hx-3,hy-6],[hx+1,hy-8],[hx+4,hy-6],[hx+1,hy-6]],H.h);limb(g,hx-2,hy-8,hx+2,hy-9,1,H.h2);
  }else if(H.type==='slick'){
   poly(g,[[hx-5,hy+1],[hx-6,hy-5],[hx-3,hy-9],[hx+3,hy-9],[hx+6,hy-6],[hx+6,hy-3],[hx+2,hy-6],[hx-2,hy-5],[hx-3,hy-2]],H.c);
   poly(g,[[hx-4,hy-6],[hx,hy-8],[hx+4,hy-6]],H.h);
  }else if(H.type==='hood'){
   poly(g,[[hx-6,hy+3],[hx-7,hy-4],[hx-4,hy-9],[hx+2,hy-11],[hx+6,hy-7],[hx+7,hy+1],[hx+4,hy+4],[hx+4,hy-2],[hx+1,hy-4],[hx-3,hy-3],[hx-4,hy+3]],H.c);
   poly(g,[[hx-5,hy-4],[hx-3,hy-8],[hx+2,hy-9],[hx+1,hy-6]],H.h);
  }else if(H.type==='crown'){
   poly(g,[[hx-5,hy+1],[hx-6,hy-5],[hx-3,hy-9],[hx+3,hy-9],[hx+6,hy-6],[hx+6,hy-2],[hx+2,hy-6],[hx-2,hy-5]],H.c);
  }else if(H.type==='antenna'){
   limb(g,hx-2,hy-5,hx-5,hy-13,1,H.c);limb(g,hx+2,hy-5,hx+6,hy-13,1,H.c);disc(g,hx-5,hy-14,1,H.h);disc(g,hx+6,hy-14,1,H.h);
  }
  if(has('horns')){poly(g,[[hx-4,hy-5],[hx-7,hy-9],[hx-9,hy-15],[hx-5,hy-9],[hx-3,hy-6]],L.hornC||'#e8e0d0');poly(g,[[hx+3,hy-5],[hx+6,hy-9],[hx+8,hy-14],[hx+4,hy-9],[hx+2,hy-6]],L.hornC||'#e8e0d0')}
  if(has('crown')){const cc=L.crownC||'#f2ca5c';rect(g,hx-5,hy-6,11,2,cc);poly(g,[[hx-5,hy-6],[hx-4,hy-11],[hx-2,hy-6]],cc);poly(g,[[hx-1,hy-6],[hx+1,hy-13],[hx+3,hy-6]],cc);poly(g,[[hx+3,hy-6],[hx+5,hy-11],[hx+6,hy-6]],cc);dot(g,hx+1,hy-7,L.crownGem||'#ff3a6e')}
  if(has('hat')){const hc=L.hatC||'#17151a',ht=L.hatTrim||'#c9a64a';poly(g,[[hx-10,hy-4],[hx-6,hy-6],[hx+8,hy-6],[hx+12,hy-4],[hx+8,hy-5],[hx-6,hy-5]],hc);poly(g,[[hx-6,hy-5],[hx-4,hy-12],[hx+4,hy-13],[hx+7,hy-5]],hc);rect(g,hx-6,hy-6,13,1,ht);dot(g,hx,hy-9,ht);dot(g,hx+1,hy-10,ht)}
  // braço da frente (+ arma)
  if(P.cross)arm(sxB,P.hB,false);
  const kF=arm(sxF,P.hF,true);
  if(L.weapon){
   const W=L.weapon;let dx=kF.x-kF.ex,dy=kF.y-kF.ey;const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
   if(P.cross||(dx<.3&&Math.abs(dy)<.6)){dx=.5;dy=-.85}
   const len=W.len||18,x0=kF.x,y0=kF.y;
   limb(g,x0-dx*3,y0-dy*3,x0+dx*2,y0+dy*2,2,W.hilt||'#2a1a14');
   limb(g,x0+dx*2,y0+dy*2,x0+dx*(len),y0+dy*(len),W.type==='staff'?2:1,W.c||'#c8d4e0');
   if(W.type!=='staff')limb(g,x0+dx*3,y0+dy*3,x0+dx*(len-1),y0+dy*(len-1),1,W.h||'#fff');
   rect(g,x0+dx*2-1,y0+dy*2-1,3,3,W.guard||'#c9a64a');
   if(W.glow)for(let i=4;i<len;i+=3)dot(g,x0+dx*i+(dy)*1.5,y0+dy*i-(dx)*1.5,W.glow);
   if(W.type==='staff')disc(g,x0+dx*(len+1),y0+dy*(len+1),2,W.tip||'#a06ae8');
  }
  if(P.orb){const[ox,oy,r]=P.orb;disc(g,ox,oy,r+1,L.aura.a);disc(g,ox,oy,r,L.aura.b);disc(g,ox,oy,Math.max(1,r-2),'#fff')}
  g.restore();
 }

 /* ---------- contorno e cache ---------- */
 const cache=new Map();
 function outline(c,ink){
  const g=c.getContext('2d'),w=c.width,h=c.height,im=g.getImageData(0,0,w,h),d=im.data,out=new Uint8ClampedArray(d);
  const r=parseInt(ink.slice(1,3),16),gg=parseInt(ink.slice(3,5),16),bb=parseInt(ink.slice(5,7),16);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;if(d[i+3]>40)continue;
   const n=(x>0&&d[i-4+3]>40)||(x<w-1&&d[i+4+3]>40)||(y>0&&d[i-w*4+3]>40)||(y<h-1&&d[i+w*4+3]>40);
   if(n){out[i]=r;out[i+1]=gg;out[i+2]=bb;out[i+3]=255}
  }
  g.putImageData(new ImageData(out,w,h),0,0);
 }
 function make(L,name,i,side){
  const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  if(name==='dead'){
   const t=document.createElement('canvas');t.width=t.height=S;const tg=t.getContext('2d');draw(tg,POSES.hit.fn(1),L);outline(t,L.ink);
   g.translate(CX+4,GY+2);g.rotate(-Math.PI/2);g.translate(-CX,-GY);g.drawImage(t,0,0);return c;
  }
  const def=POSES[name];draw(g,def.fn(i%def.n,side),L);outline(c,L.ink);return c;
 }
 function prep(look){if(!look._full)Object.defineProperty(look,'_full',{value:fill(look),enumerable:false});return look._full}
 function frame(look,name,i=0,opt={}){
  const L=prep(look),side=opt.side?1:0,n=POSES[name]?.n||1,k=(look.id||'x')+'|'+name+'|'+(i%n)+'|'+side;
  let c=cache.get(k);if(!c){c=make(L,name,i,side);cache.set(k,c)}return c;
 }
 function paint(g,look,name,i,o={}){
  const{x=0,y=0,scale=2,flip=false,alpha=1,side=0}=o;
  const c=frame(look,name,i,{side});
  g.save();g.imageSmoothingEnabled=false;g.globalAlpha*=alpha;g.translate(x,y);if(flip)g.scale(-1,1);
  if(o.filter)g.filter=o.filter;
  g.drawImage(c,-CX*scale,-GY*scale,S*scale,S*scale);g.restore();
 }
 function layout(){return Object.entries(POSES).map(([name,d])=>({name,frames:d.n,variants:name==='punch'?2:1}))}
 return{S,GY,CX,POSES,frame,paint,layout,prep,disc,rect};
})();

/* ---------- ícones 24×24 por forma e cores ---------- */
const BossIcons=(()=>{
 const cache={};
 function make(shape,c1='#c04bff',c2='#ff62a8'){
  const key=shape+c1+c2;if(cache[key])return cache[key];
  const c=document.createElement('canvas');c.width=c.height=24;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const r=BossSprite.rect,D=(x,y,rad,col)=>BossSprite.disc(g,x,y,rad,col);
  const L=(x0,y0,x1,y1,col)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);g.fillStyle=col;for(let i=0;i<=n;i++)g.fillRect(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),1,1)};
  const W='#fff4ff',gold='#f2ca5c';
  const glow=(x,y,rad)=>{D(x,y,rad+1,c1);D(x,y,rad,c2);D(x,y,Math.max(0,rad-2),W)};
  switch(shape){
   case'fan':glow(5,12,2);for(const[y,s]of[[4,2],[12,3],[20,2]]){L(8,12,18,y,c1);glow(19,y,s)}break;
   case'dash':for(let i=0;i<4;i++)L(2,6+i*4,12+i*2,6+i*4,i%2?c1:c2);glow(17,12,3);L(14,6,21,12,gold);L(14,18,21,12,gold);break;
   case'ring':for(const[rad,col]of[[10,c1],[7,c2],[4,c1]]){g.strokeStyle=col;g.lineWidth=2;g.beginPath();g.arc(12,12,rad,0,6.3);g.stroke()}D(12,12,2,W);break;
   case'blast':D(12,12,9,c1);D(12,12,6,c2);D(12,12,3,W);for(const[x,y]of[[2,2],[21,3],[2,21],[21,21]])r(g,x,y,2,2,gold);break;
   case'rain':L(5,2,12,14,c1);L(10,1,17,13,c2);glow(16,16,4);for(const[x,y]of[[3,19],[20,6],[21,20]])r(g,x,y,2,2,gold);break;
   case'beam':r(g,1,11,3,2,gold);for(const[h,col]of[[6,c1],[4,c2],[1,W]])r(g,4,12-h/2,19,h,col);glow(21,12,2);break;
   case'mark':g.strokeStyle=c1;g.lineWidth=2;g.beginPath();g.arc(12,12,9,0,6.3);g.stroke();g.beginPath();g.arc(12,12,5,0,6.3);g.stroke();D(12,12,2,c2);L(1,12,5,12,c2);L(19,12,23,12,c2);L(12,1,12,5,c2);L(12,19,12,23,c2);break;
   case'vortex':for(let t=0;t<30;t++){const a=t*.5,rr=1+t*.33;g.fillStyle=t%2?c1:c2;g.fillRect(Math.round(12+Math.cos(a)*rr),Math.round(12+Math.sin(a)*rr),2,2)}D(12,12,2,W);break;
   case'blink':for(let i=0;i<3;i++){g.globalAlpha=.3+i*.3;r(g,3+i*5,5,5,14,i===2?c2:c1)}g.globalAlpha=1;L(15,12,21,12,gold);L(18,8,21,12,gold);L(18,16,21,12,gold);break;
   case'zone':g.fillStyle=c1+'88';g.beginPath();g.arc(12,13,9,0,6.3);g.fill();for(const[x,h]of[[6,8],[11,12],[16,7]]){poly2(g,x,h,c2)}break;
   case'buff':{const fl=[[12,2],[15,8],[19,5],[17,13],[20,19],[12,21],[4,19],[7,13],[5,5],[9,8]];g.fillStyle=c1;g.beginPath();g.moveTo(...fl[0]);for(const p of fl)g.lineTo(...p);g.closePath();g.fill();D(12,13,5,c2);D(12,13,3,W);break}
   case'clones':for(let i=0;i<3;i++){g.globalAlpha=.4+i*.3;D(6+i*6,10,3,i===2?c2:c1);r(g,4+i*6,14,5,6,i===2?c2:c1)}g.globalAlpha=1;break;
   case'combo':r(g,5,8,12,8,gold);r(g,5,8,12,2,'#fff1a9');r(g,17,9,3,6,c1);r(g,3,10,3,4,c2);L(1,6,4,8,c1);L(1,18,4,16,c1);break;
   case'nova':D(12,12,10,c1);D(12,12,8,c2);D(12,12,5,W);for(const[x,y]of[[3,3],[21,4],[2,20],[22,21]])r(g,x,y,2,2,gold);L(12,0,12,3,gold);L(12,21,12,24,gold);L(0,12,3,12,gold);L(21,12,24,12,gold);break;
   case'orbit':for(let i=0;i<5;i++){const a=i/5*6.28;glow(Math.round(12+Math.cos(a)*7),Math.round(12+Math.sin(a)*7),1)}D(12,12,2,c1);break;
   case'guard':L(6,5,18,19,gold);L(18,5,6,19,c1);r(g,5,4,4,3,gold);r(g,15,4,4,3,c1);g.strokeStyle=c2;g.lineWidth=1;g.beginPath();g.arc(12,12,9,-1.2,1.2);g.stroke();break;
   case'step':for(let i=0;i<3;i++){g.globalAlpha=.3+i*.3;r(g,3+i*5,6,5,12,i===2?c2:c1)}g.globalAlpha=1;L(14,12,21,12,gold);L(18,8,21,12,gold);L(18,16,21,12,gold);break;
   case'system':D(12,12,9,c1);D(12,12,7,c2);D(12,12,3,W);L(12,1,12,5,gold);L(12,19,12,23,gold);L(1,12,5,12,gold);L(19,12,23,12,gold);break;
   default:D(12,12,8,c1);D(12,12,4,c2)
  }
  return cache[key]=c.toDataURL();
 }
 function poly2(g,x,h,col){g.fillStyle=col;g.beginPath();g.moveTo(x,22);g.lineTo(x+2,22-h);g.lineTo(x+4,22);g.closePath();g.fill()}
 return{make};
})();
if(typeof window!=='undefined'){window.BossSprite=BossSprite;window.BossIcons=BossIcons}
