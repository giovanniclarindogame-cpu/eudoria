'use strict';
/*
 * MONSTROS v3 — pixel art própria de cada monstro da Cruzada Arcade (41 criaturas, 10 famílias).
 *
 * Cada monstro é desenhado por código numa grade de 96×96 (o pintor antigo usava 64×64 e um único molde de humanoide
 * para todos). O motor oferece:
 *   - rampas de 5 tons com desvio de matiz (sombra puxa para o violeta, luz puxa para o amarelo);
 *   - formas sombreadas (esfera, cápsula, polígono, caixa) com luz vinda de cima/esquerda;
 *   - contorno POR PEÇA (cada parte do corpo tem seu contorno escuro da própria cor), como em pixel art feita à mão;
 *   - brilhos aditivos (olhos, magia) aplicados por cima;
 *   - esqueletos de animação: bípede, espectro flutuante, inseto e criatura amorfa.
 * Poses (mesmos nomes do motor da fase): idle(4) · walk(6) · punch(6: 4 de preparo + 2 de golpe) · s0(4: carga do disparo)
 * · hit(2) · dead(1). A família de cada monstro segue a paleta do chefe da fase.
 *
 * API: MobArt.paint(ctx, 'familia:tipo', pose, quadro, {x,y,scale,flip,filter,alpha}) — mesma convenção de escala do
 * BossSprite (o sprite ocupa 64×scale unidades do mundo, com os pés no ponto de origem).
 */
const MobArt=(()=>{
const S=96,GY=88,CX=48,TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;

/* ============================== cor ============================== */
const h2r=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return[h,s,l]}
function hsl2rgb(h,s,l){h=(((h%360)+360)%360)/360;const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q,f=t=>{t=((t%1)+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p};return[f(h+1/3),f(h),f(h-1/3)].map(v=>Math.round(clamp(v,0,1)*255))}
const pk=(r,g,b)=>((255<<24)|(b<<16)|(g<<8)|r)>>>0;
const C=hex=>pk(...h2r(hex));
// tom: k<0 escurece e puxa a matiz para o violeta; k>0 clareia e puxa para o amarelo
function tone(hex,k){
 const [r,g,b]=h2r(hex);let [h,s,l]=rgb2hsl(r,g,b);
 const target=k<0?262:52,dh=((target-h+540)%360)-180;h+=dh*Math.abs(k)*.2;
 if(k<0){l*=1+k*.74;s=clamp(s*(1-k*.22),0,1)}else{l+=(1-l)*k*.76;s*=1-k*.32}
 return pk(...hsl2rgb(h,s,l));
}
const ramp=(hex,ks=[-.74,-.4,0,.36,.7])=>ks.map(k=>tone(hex,k));
const dk=c=>{const r=c&255,g=(c>>8)&255,b=(c>>16)&255;return pk(Math.round(r*.27),Math.round(g*.23),Math.round(b*.36))};
const INK=pk(14,10,22);

/* ============================== tela de trabalho ============================== */
let T=null,FX=null;
const set=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<S&&y<S)T[y*S+x]=c};
const get=(x,y)=>(x>=0&&y>=0&&x<S&&y<S)?T[y*S+x]:0;
const pick=(R,t)=>R[clamp(Math.floor(t*R.length),0,R.length-1)];
// luz padrão: vem de cima e da esquerda
function lit(nx,ny,z){return clamp((-(nx*.5+ny*.72)+z*.52+.74)/1.72,0,.999)}

// esfera/elipse sombreada. o.t0/o.t1 limitam a faixa de tons; o.flat usa um tom só; o.clip(x,y) recorta
function ell(cx,cy,rx,ry,R,o={}){
 const x0=Math.floor(cx-rx-1),x1=Math.ceil(cx+rx+1),y0=Math.floor(cy-ry-1),y1=Math.ceil(cy+ry+1),lo=o.t0??0,hi=o.t1??1;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,d=dx*dx+dy*dy;if(d>1)continue;
  if(o.clip&&!o.clip(x,y))continue;
  let t=o.flat!==undefined?o.flat:lit(dx,dy,Math.sqrt(1-d));
  t=lo+(hi-lo)*t;
  if(o.d){const k=t*R.length,f=k-Math.floor(k);if(f>.8&&((x+y)&1)===0)t=Math.min(.999,t+1/R.length)}
  set(x,y,pick(R,t));
 }
}
// cápsula (membro) com raio variável e sombreamento cilíndrico
function cap(x0,y0,x1,y1,r0,r1,R,o={}){
 const dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy||1e-6,rm=Math.max(r0,r1);
 const ax=Math.floor(Math.min(x0,x1)-rm-1),bx=Math.ceil(Math.max(x0,x1)+rm+1),ay=Math.floor(Math.min(y0,y1)-rm-1),by=Math.ceil(Math.max(y0,y1)+rm+1);
 for(let y=ay;y<=by;y++)for(let x=ax;x<=bx;x++){
  const px=x+.5-x0,py=y+.5-y0,t=clamp((px*dx+py*dy)/L2,0,1),qx=px-dx*t,qy=py-dy*t,r=lerp(r0,r1,t),d=Math.hypot(qx,qy);
  if(d>r)continue;
  const nx=qx/r,ny=qy/r,z=Math.sqrt(Math.max(0,1-(d/r)*(d/r)));
  let tt=o.flat!==undefined?o.flat:lit(nx,ny,z);if(o.t0!==undefined)tt=o.t0+((o.t1??1)-o.t0)*tt;
  set(x,y,pick(R,tt));
 }
}
// polígono preenchido; sombreamento em gradiente (luz em cima/esquerda) ou tom fixo (o.flat)
function poly(pts,R,o={}){
 let lo=1e9,hi=-1e9,xl=1e9,xh=-1e9;for(const p of pts){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);xl=Math.min(xl,p[0]);xh=Math.max(xh,p[0])}
 const H=Math.max(1,hi-lo),W=Math.max(1,xh-xl),gy=o.gy??.55,gx=o.gx??.3,base=o.base??.78;
 for(let y=Math.floor(lo);y<=Math.ceil(hi);y++){
  const yc=y+.5,xs=[];
  for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if((a[1]<=yc&&b[1]>yc)||(b[1]<=yc&&a[1]>yc))xs.push(a[0]+(yc-a[1])/(b[1]-a[1])*(b[0]-a[0]))}
  xs.sort((m,n)=>m-n);
  for(let i=0;i+1<xs.length;i+=2)for(let x=Math.round(xs[i]);x<Math.round(xs[i+1]);x++){
   const t=o.flat!==undefined?o.flat:clamp(base-(yc-lo)/H*gy-(x+.5-xl)/W*gx,0,.999);
   set(x,y,pick(R,t));
  }
 }
}
function box(x,y,w,h,R,o={}){
 x=Math.round(x);y=Math.round(y);const m=o.m??2;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){
  let k=m;if(j===0||i===0)k=m+1;if(j===h-1||i===w-1)k=m-1;if(j===0&&i===0)k=m+1;
  set(x+i,y+j,R[clamp(k,0,R.length-1)]);
 }
}
function line(x0,y0,x1,y1,c,w=1){
 const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1)*2;
 for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;if(w<=1)set(x,y,c);else for(let a=0;a<w;a++)for(let b=0;b<w;b++)set(x-(w-1)/2+a,y-(w-1)/2+b,c)}
}
const dot=(x,y,c)=>set(x,y,c);
// curva suave por pontos (Catmull-Rom) desenhada como cápsulas encadeadas com raio variável
function tube(pts,r0,r1,R,o={}){
 const P=[];for(let i=0;i<pts.length-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
  for(let s=0;s<6;s++){const t=s/6,t2=t*t,t3=t2*t;P.push([.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)])}}
 P.push(pts[pts.length-1]);
 for(let i=0;i<P.length-1;i++){const a=i/(P.length-1),b=(i+1)/(P.length-1);cap(P[i][0],P[i][1],P[i+1][0],P[i+1][1],lerp(r0,r1,a),lerp(r0,r1,b),R,o)}
}
// brilho aditivo (aplicado depois dos pixels)
const glow=(x,y,r,hex,a=.55)=>FX.push({x,y,r,hex,a});
// Uma PEÇA: desenha num plano à parte, ganha contorno escuro da própria cor e é colada por cima do que já existe
function part(fn,ol){
 const main=T;T=new Uint32Array(S*S);fn();const L=T;T=main;
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){
  const i=y*S+x;if(L[i]){T[i]=L[i];continue}
  let n=0;
  if(x>0&&L[i-1])n=L[i-1];else if(x<S-1&&L[i+1])n=L[i+1];else if(y>0&&L[i-S])n=L[i-S];else if(y<S-1&&L[i+S])n=L[i+S];
  if(n)T[i]=ol===undefined?dk(n):ol;
 }
}
// detalhes por cima, sem contorno
const deco=fn=>fn();

/* ============================== poses ============================== */
function rigOf(pose,i){
 const R={pose,i,bob:0,lean:0,shift:0,sF:0,sB:0,upF:0,upB:0,wind:0,strike:0,cast:0,rel:0,recoil:0,sway:0,t:i/4};
 if(pose==='idle'){R.bob=[0,0,1,1][i%4];R.sway=[0,1,0,-1][i%4]}
 else if(pose==='walk'){const p=i/6*TAU,s=Math.sin(p),c=Math.cos(p);R.sF=s;R.sB=-s;R.upF=Math.max(0,c);R.upB=Math.max(0,-c);R.bob=Math.abs(s)>.6?-1:0;R.lean=1;R.sway=s;R.t=i/6}
 else if(pose==='punch'){R.wind=[.35,.65,.9,1,0,0][i%6];R.strike=[0,0,0,0,.75,1][i%6];R.lean=R.strike?3+R.strike:-2*R.wind;R.shift=R.strike*3-R.wind;R.bob=R.wind>.5?1:0;R.t=i/6}
 else if(pose==='s0'){R.cast=[.3,.6,.85,1][i%4];R.rel=i%4===3?1:0;R.lean=R.rel?2:-1;R.t=i/4}
 else if(pose==='hit'){R.recoil=i?1:.6;R.lean=-3-i;R.shift=-1-i;R.bob=i}
 return R;
}

/* ============================== esqueleto bípede ============================== */
// cinemática inversa de dois ossos (cotovelo/joelho); s=+1/-1 escolhe o lado da dobra
function ik(x0,y0,x1,y1,l1,l2,s){
 let dx=x1-x0,dy=y1-y0,d=Math.hypot(dx,dy)||.01;const mx=l1+l2-.05;
 if(d>mx){x1=x0+dx/d*mx;y1=y0+dy/d*mx;dx=x1-x0;dy=y1-y0;d=mx}
 const a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
 return{ex:x0+dx*a/d+s*(-dy/d)*h,ey:y0+dy*a/d+s*(dx/d)*h,x:x1,y:y1};
}
/*
 * biped(R, sp): monta as juntas e desenha as peças na ordem certa. sp define proporções, rampas e "ganchos" de desenho:
 *   leg, torsoH, shW (meia largura dos ombros), hipW, headR, armL, armR, legR, hunch, stride
 *   skin/arm/legc/torso/boot: rampas · hooks: back(J) torso(J) head(J) armF(J) armB(J) legF(J) legB(J) weapon(J) front(J)
 *   hands(R,J): pode sobrescrever a posição das mãos (armas de duas mãos, arcos…)
 */
function biped(R,sp){
 const leg=sp.leg??22,torsoH=sp.torsoH??17,shW=sp.shW??6,hipW=sp.hipW??4,headR=sp.headR??7,armL=sp.armL??15,armR=sp.armR??2.6,legR=sp.legR??3,stride=sp.stride??6,hunch=sp.hunch??0;
 const hipX=CX-2+R.shift,hipY=GY-leg+R.bob,shX=hipX+hunch+R.lean*.8,shY=hipY-torsoH+(R.recoil?1:0);
 const J={R,sp,hipX,hipY,shX,shY,leg,torsoH,shW,hipW,headR,armL};
 J.head={x:shX+(sp.headFwd??1)+R.lean*.25+(R.recoil?-1:0),y:shY-headR+(sp.neck??1)+(R.pose==='idle'?0:0)};
 // pés e joelhos
 const fF={x:hipX+hipW*.6+1+R.sF*stride,y:GY-R.upF*3.2},fB={x:hipX-hipW*.6-1+R.sB*stride,y:GY-R.upB*3.2};
 if(R.wind||R.strike){fF.x+=2+R.strike*2;fB.x-=3}
 if(R.recoil){fF.x+=1;fB.x-=2}
 const kF=ik(hipX+hipW*.5,hipY,fF.x,fF.y-2,leg*.52,leg*.5,-1),kB=ik(hipX-hipW*.5,hipY,fB.x,fB.y-2,leg*.52,leg*.5,-1);
 J.fF=fF;J.fB=fB;J.kF=kF;J.kB=kB;
 // ombros e mãos
 const sF={x:shX+shW*.55,y:shY+2.5},sB={x:shX-shW*.55,y:shY+2.5};
 let hF={x:sF.x+2+R.sway*.6,y:sF.y+armL-2.5},hB={x:sB.x-1-R.sway*.6,y:sB.y+armL-3};
 if(R.pose==='walk'){hF={x:sF.x+1-R.sF*5,y:sF.y+armL-3-Math.abs(R.sF)};hB={x:sB.x-1-R.sB*5,y:sB.y+armL-3-Math.abs(R.sB)}}
 if(R.wind){hF={x:sF.x-5*R.wind,y:sF.y+armL*.45-R.wind*2};hB={x:sB.x+5,y:sB.y+armL*.6}}
 if(R.strike){hF={x:sF.x+armL*(.55+.45*R.strike),y:sF.y+3-R.strike};hB={x:sB.x-3,y:sB.y+armL*.6}}
 if(R.cast){hF={x:sF.x+armL*(.5+.3*R.cast)+(R.rel?2:0),y:sF.y+1-R.cast*2};hB={x:sB.x+armL*.45,y:sB.y+armL*.4-R.cast*2}}
 if(R.recoil){hF={x:sF.x-3,y:sF.y+armL*.25};hB={x:sB.x-6,y:sB.y+armL*.3}}
 J.sF=sF;J.sB=sB;J.hF=hF;J.hB=hB;
 if(sp.hands)sp.hands(R,J);
 J.eF=ik(sF.x,sF.y,J.hF.x,J.hF.y,armL*.5,armL*.5,(sp.elbow??1));J.eB=ik(sB.x,sB.y,J.hB.x,J.hB.y,armL*.5,armL*.5,(sp.elbow??1));
 const SK=sp.skin,AR=sp.arm||sp.torso,LG=sp.legc||sp.torso,BT=sp.boot||LG,TR=sp.torso;
 const drawLeg=(k,f,dim)=>part(()=>{
  const o=dim?{t0:0,t1:.62}:{};
  cap(k===kF?hipX+hipW*.5:hipX-hipW*.5,hipY,k.ex,k.ey,legR+.6,legR,LG,o);cap(k.ex,k.ey,f.x,f.y-2.5,legR,legR-.6,sp.shin||LG,o);
  if(sp.foot)sp.foot(J,f,dim);else{ell(f.x+1.5,f.y-1.6,legR+1.6,2.1,BT,o);cap(f.x-1,f.y-1,f.x+legR+1.5,f.y-1,1.5,1.2,BT,{flat:dim?.2:.3})}
 });
 const drawArm=(s,e,h,dim)=>part(()=>{
  const o=dim?{t0:0,t1:.6}:{};
  cap(s.x,s.y,e.ex,e.ey,armR+.5,armR,AR,o);cap(e.ex,e.ey,h.x,h.y,armR,armR-.4,sp.fore||AR,o);
  ell(h.x,h.y,armR+.3,armR+.3,sp.hand||SK,o);
 });
 if(sp.back)sp.back(J);
 if(sp.weaponB)sp.weaponB(J);
 (sp.armB||(()=>drawArm(sB,J.eB,J.hB,true)))(J);
 (sp.legB||(()=>drawLeg(kB,fB,true)))(J);
 if(sp.mid)sp.mid(J);
 if(sp.torsoFn)sp.torsoFn(J);else part(()=>{
  poly([[shX-shW,shY+1],[shX+shW,shY+1],[hipX+hipW+1,hipY+1],[hipX-hipW-1,hipY+1]],TR,{base:.8,gy:.5,gx:.34});
  ell(shX,shY+2,shW,3,TR,{t0:.45,t1:1});
 });
 (sp.legF||(()=>drawLeg(kF,fF,false)))(J);
 if(sp.belt)sp.belt(J);
 if(sp.head)sp.head(J);
 if(sp.weapon)sp.weapon(J);
 (sp.armF||(()=>drawArm(sF,J.eF,J.hF,false)))(J);
 if(sp.front)sp.front(J);
 return J;
}

/* ============================== famílias e monstros ============================== */
const MOBS={};                       // 'familia:tipo' -> função (R) que desenha
const def=(key,fn)=>{MOBS[key]=fn};
// olhos padrão: 2×2 com brilho
function eye(x,y,c,gl){dot(x,y,c);dot(x+1,y,c);dot(x,y+1,dk(c));dot(x+1,y+1,c);if(gl)glow(x+1,y+.5,3.2,gl,.5)}

/* ---------- geração final ---------- */
const cache=new Map();
function rotateDead(src){
 // corpo caído: gira o quadro de "dano" 90° e apoia no chão
 const out=new Uint32Array(S*S);
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const c=src[y*S+x];if(!c)continue;const dx=x-CX,dy=y-GY,nx=Math.round(CX+20+dy*.9),ny=Math.round(GY-19-dx*.7);if(nx>=0&&ny>=0&&nx<S&&ny<S)out[ny*S+nx]=c}
 return out;
}
function render(key,pose,i){
 const fn=MOBS[key]||MOBS['xerath:g'];
 T=new Uint32Array(S*S);FX=[];
 const dead=pose==='dead';
 fn(rigOf(dead?'hit':pose,dead?1:i));
 let buf=T;
 if(dead){buf=rotateDead(T);FX=[]}
 const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
 const im=g.createImageData(S,S);new Uint32Array(im.data.buffer).set(buf);g.putImageData(im,0,0);
 if(FX.length){g.globalCompositeOperation='lighter';for(const f of FX){const gr=g.createRadialGradient(f.x,f.y,0,f.x,f.y,f.r);const [r,gg,b]=h2r(f.hex);gr.addColorStop(0,`rgba(${r},${gg},${b},${f.a})`);gr.addColorStop(1,`rgba(${r},${gg},${b},0)`);g.fillStyle=gr;g.fillRect(f.x-f.r,f.y-f.r,f.r*2,f.r*2)}g.globalCompositeOperation='source-over'}
 T=null;FX=null;return c;
}
const FRAMES={idle:4,walk:6,punch:6,s0:4,hit:2,dead:1};
function frame(key,pose,i=0){
 const n=FRAMES[pose]||1,k=key+'|'+pose+'|'+(i%n);
 let c=cache.get(k);if(!c){c=render(key,FRAMES[pose]?pose:'idle',i%n);cache.set(k,c)}return c;
}
function paint(g,key,pose,i,o={}){
 const{x=0,y=0,scale=2,flip=false,alpha=1}=o,k=scale*64/S,c=frame(key,pose,i);
 g.save();g.imageSmoothingEnabled=false;g.globalAlpha*=alpha;g.translate(x,y);if(flip)g.scale(-1,1);
 if(o.filter)g.filter=o.filter;
 g.drawImage(c,-CX*k,-GY*k,S*k,S*k);g.restore();
}
const has=key=>!!MOBS[key];
const api={S,GY,CX,FRAMES,paint,frame,has,keys:()=>Object.keys(MOBS),
 // ferramentas expostas para os arquivos de famílias
 kit:{S,GY,CX,TAU,clamp,lerp,C,tone,ramp,dk,INK,set,get,ell,cap,poly,box,line,dot,tube,glow,part,deco,biped,ik,eye,def,rigOf}};
return api;
})();
if(typeof window!=='undefined')window.MobArt=MobArt;
