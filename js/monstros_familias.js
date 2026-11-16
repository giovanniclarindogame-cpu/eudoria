'use strict';
/*
 * As 10 famílias de monstros da Cruzada (uma por chefe). Cada família tem 4 criaturas — soldado (g), atirador (r),
 * brutamontes (b) e especial (e) — com desenho próprio, mas a mesma paleta e os mesmos materiais do chefe.
 * A Colônia Quimera tem ainda a formiguinha (s). Tudo é desenhado com as ferramentas do motor (MobArt.kit).
 */
(()=>{
const K=MobArt.kit,{S,GY,CX,TAU,clamp,lerp,C,tone,ramp,dk,INK,set,ell,cap,poly,box,line,dot,tube,glow,part,deco,biped,ik,eye,def}=K;
const sin=Math.sin,cos=Math.cos;
// haste (cabo de arma) com um filete de luz
function shaft(x0,y0,x1,y1,R,r=.9){cap(x0,y0,x1,y1,r,r,R,{t0:.2,t1:.9})}
// ângulo → ponto
const at=(x,y,a,d)=>[x+cos(a)*d,y+sin(a)*d];


/* ---------------- peças reutilizáveis de humanoides ---------------- */
// cabeça em 3/4 (olhando para a direita): crânio + queixo
function face(J,SK,o={}){const h=J.head,r=J.headR;part(()=>{ell(h.x,h.y,r,r*(o.ry||.95),SK,{d:1});ell(h.x+1.5,h.y+r*.5,r*.72,r*.5,SK,{t0:.2,t1:.85})})}
// dois olhos (o de trás e o da frente) + sobrancelha opcional
function eyes(J,c,gl,o={}){const h=J.head,r=J.headR,y=h.y+(o.dy||0);eye(h.x+r*.02,y,c,gl);eye(h.x+r*.56,y,c,gl);if(o.brow){line(h.x-r*.05,y-2,h.x+r*.3,y-1,o.brow);line(h.x+r*.5,y-1,h.x+r*.9,y-2,o.brow)}}
// espada/lâmina reta
function sword(h,ang,len,BL,GD,w=1.7){
 const [tx,ty]=at(h.x,h.y,ang,len),[gx,gy]=at(h.x,h.y,ang,3),n=ang+Math.PI/2;
 cap(h.x-cos(ang)*3,h.y-sin(ang)*3,gx,gy,1.2,1.2,GD,{t0:.2,t1:.8});
 line(gx+cos(n)*3.2,gy+sin(n)*3.2,gx-cos(n)*3.2,gy-sin(n)*3.2,GD[3],2);
 poly([[gx+cos(n)*w,gy+sin(n)*w],[tx+cos(n)*.7,ty+sin(n)*.7],[tx+cos(ang)*2.5,ty+sin(ang)*2.5],[tx-cos(n)*.7,ty-sin(n)*.7],[gx-cos(n)*w,gy-sin(n)*w]],BL,{base:.98,gy:.3,gx:.2});
 line(gx,gy,tx,ty,BL[4]);
}
// sabre curvo
function sabre(h,ang,len,BL,GD){
 const n=ang+Math.PI/2,P=[];for(let k=0;k<=6;k++){const t=k/6,d=3+t*len,b=sin(t*Math.PI)*2.6;P.push([h.x+cos(ang)*d+cos(n)*b,h.y+sin(ang)*d+sin(n)*b])}
 cap(h.x-cos(ang)*3,h.y-sin(ang)*3,h.x+cos(ang)*3,h.y+sin(ang)*3,1.2,1.2,GD,{t0:.2,t1:.8});
 tube(P,1.9,.6,BL,{t0:.35,t1:1});ell(h.x+cos(ang)*3,h.y+sin(ang)*3,2.2,2.2,GD);
}
// ângulo da arma conforme a pose
const wA=(R,idle,wind,strike)=>R.strike?strike:R.wind?lerp(idle,wind,R.wind):R.recoil?idle-.5:idle+(R.sway||0)*.03;
// capa/lenço ondulante preso num ponto
function cloth(x,y,len,wid,R0,Rg,o={}){
 const w=(Rg.sway||0)*1.2+(Rg.pose==='walk'?2:0)+(Rg.strike?4:0),a=o.ang??2.6;
 const [ex,ey]=at(x,y,a,len),[mx,my]=at(x,y,a+.25,len*.55);
 poly([[x,y-wid*.3],[x+1,y+wid*.5],[mx-w*.4,my+wid*.6],[ex-w,ey+wid*.5],[ex-w-2,ey-wid*.2],[mx-w*.4,my-wid*.5]],R0,{base:.85,gy:.4,gx:.3});
}
/*
 * Esqueleto de ESPECTRO: flutua, sem pernas; o manto termina em farrapos e numa cauda de névoa.
 * sp: hover, bodyH, shW, headR, armL, armR, robe (rampa), hem (largura da barra), hooks: back, head, armF, armB, weapon, front, robeDeco
 */
function wraith(R,sp){
 const fl=[0,-1,-2,-1][R.i%4],baseY=GY-(sp.hover??7)+fl+(R.recoil?1:0),cx=CX-2+R.shift,bodyH=sp.bodyH??32,shW=sp.shW??7,headR=sp.headR??7.5,armL=sp.armL??15,armR=sp.armR??2.2;
 const shY=baseY-bodyH,shX=cx+R.lean*.9+(sp.hunch||0);
 const J={R,sp,hipX:cx,hipY:baseY-10,shX,shY,headR,shW,armL,baseY};
 J.head={x:shX+(sp.headFwd??1)+R.lean*.25,y:shY-headR+(sp.neck??2)};
 const sF={x:shX+shW*.6,y:shY+3},sB={x:shX-shW*.6,y:shY+3};
 let hF={x:sF.x+4+R.sway*.6,y:sF.y+armL-4},hB={x:sB.x+1,y:sB.y+armL-5};
 if(R.pose==='walk'){hF={x:sF.x+6,y:sF.y+armL-6};hB={x:sB.x+3,y:sB.y+armL-6}}
 if(R.wind){hF={x:sF.x-4*R.wind,y:sF.y+armL*.4-R.wind*3};hB={x:sB.x+5,y:sB.y+armL*.6}}
 if(R.strike){hF={x:sF.x+armL*(.6+.4*R.strike),y:sF.y+3};hB={x:sB.x+6,y:sB.y+armL*.5}}
 if(R.cast){hF={x:sF.x+armL*(.5+.3*R.cast)+(R.rel?2:0),y:sF.y+1-R.cast*2};hB={x:sB.x+armL*.5,y:sB.y+armL*.35-R.cast*2}}
 if(R.recoil){hF={x:sF.x-2,y:sF.y+armL*.2};hB={x:sB.x-5,y:sB.y+armL*.3}}
 J.sF=sF;J.sB=sB;J.hF=hF;J.hB=hB;if(sp.hands)sp.hands(R,J);
 J.eF=ik(sF.x,sF.y,J.hF.x,J.hF.y,armL*.5,armL*.5,1);J.eB=ik(sB.x,sB.y,J.hB.x,J.hB.y,armL*.5,armL*.5,1);
 const RB=sp.robe,AR=sp.arm||RB,HD=sp.hand||sp.skin||RB,wv=k=>sin(R.i*1.6+k*1.3)*1.6,hem=sp.hem??9;
 const arm=(s,e,h,dim)=>part(()=>{const o=dim?{t0:0,t1:.6}:{};cap(s.x,s.y,e.ex,e.ey,armR+1,armR+.6,AR,o);cap(e.ex,e.ey,h.x,h.y,armR+.8,armR+1.6,AR,o);
  // mão ossuda saindo da manga
  for(let k=-1;k<=1;k++)line(h.x+1,h.y+k,h.x+4,h.y+k*1.8,HD[dim?1:3]);});
 if(sp.back)sp.back(J);
 (sp.armB||(()=>arm(sB,J.eB,J.hB,true)))(J);
 // cauda de névoa
 part(()=>{tube([[cx,baseY-12],[cx-4+wv(0),baseY-4],[cx-10+wv(1),baseY+1],[cx-16+wv(2),baseY+4]],hem*.7,1,RB,{t0:0,t1:.7})});
 // manto
 part(()=>{
  poly([[shX-shW,shY+1],[shX+shW,shY+1],[cx+hem+1,baseY-8],[cx-hem,baseY-8]],RB,{base:.82,gy:.55,gx:.32});
  ell(shX,shY+2.5,shW,3.2,RB,{t0:.45,t1:1});
  for(let k=0;k<5;k++){const x=cx-hem+k*(hem*2/4.4),L=3+((k*7+R.i)%3)*2+wv(k)*.5;poly([[x-.5,baseY-9],[x+2+wv(k)*.3,baseY-8+L],[x+hem*.5,baseY-9]],RB,{base:.5,gy:.5})}
 });
 if(sp.robeDeco)sp.robeDeco(J);
 if(sp.head)sp.head(J);
 if(sp.weapon)sp.weapon(J);
 (sp.armF||(()=>arm(sF,J.eF,J.hF,false)))(J);
 if(sp.front)sp.front(J);
 return J;
}
// capuz pontudo
function hood(J,R0,o={}){const h=J.head,r=J.headR;part(()=>{ell(h.x-1,h.y,r+1.5,r+1,R0,{d:1});poly([[h.x-r,h.y-2],[h.x-r-3-(o.tip||0),h.y-r-2],[h.x+1,h.y-r]],R0,{base:.7});ell(h.x-2,h.y+r*.9,r*.9,2.6,R0,{t0:0,t1:.6})});
 deco(()=>ell(h.x+2,h.y+1,r*.62,r*.7,[C(o.voidC||'#07080d'),C(o.voidC||'#0d0f16')],{flat:.4}))}

/* =====================================================================================================
 * 6 · XERATH — COLÔNIA QUIMERA (formigas): carapaça cinza-azulada, juntas e olhos verde-menta
 * ===================================================================================================== */
{
 const SH=ramp('#46536a'),SH2=ramp('#35506a'),DKS=ramp('#262d3b'),MINT=ramp('#6fe0a4'),BONE=ramp('#dcd4b6'),WING=ramp('#bfeedd'),GOLD=ramp('#e6c860'),ACID=ramp('#9df06a');
 // antenas articuladas com ponta luminosa
 function antennae(J,len=1,tipR=MINT,wob=0){
  const h=J.head,w=J.R.sway*.8+wob;
  for(const s of [0,1])part(()=>{
   const bx=h.x+1+s*3,by=h.y-J.headR+2;
   tube([[bx,by],[bx+2+s,by-6*len],[bx+7*len+s*2,by-9*len+w]],1.1,.7,DKS);
   ell(bx+8*len+s*2,by-9.4*len+w,1.5,1.5,tipR);
  });
  glow(h.x+9*len,h.y-J.headR-7*len+w,4,'#7dffb8',.35);
 }
 function mandibles(J,size=1,R=BONE){
  const h=J.head,open=J.R.wind?2*J.R.wind:J.R.strike?-1:0;
  part(()=>{tube([[h.x+3,h.y+3],[h.x+8*size,h.y+5+open],[h.x+7*size,h.y+9*size+open]],1.5*size,.6,R)});
  part(()=>{tube([[h.x+1,h.y+4],[h.x+5*size,h.y+7+open],[h.x+4*size,h.y+10*size+open]],1.3*size,.6,R,{t0:0,t1:.7})});
 }
 // abdômen listrado atrás do quadril
 function abdomen(J,rx,ry,R,o={}){
  const ax=J.hipX-rx-1+(o.dx||0),ay=J.hipY+1+(o.dy||0)-J.R.bob*.5;
  part(()=>{
   ell(ax,ay,rx,ry,R,{d:1});
   if(o.tip!==false){tube([[ax-rx+1,ay+1],[ax-rx-2,ay+3],[ax-rx-4,ay+2]],1.6,.5,R,{t0:0,t1:.6})}
   // petíolo (cintura fina)
   cap(ax+rx-1,ay-1,J.hipX-1,J.hipY-2,2,1.6,R,{t0:.1,t1:.7});
  });
  deco(()=>{for(let k=-1;k<=1;k++){const sx=ax+k*rx*.42;for(let y=-ry;y<=ry;y++){const xx=Math.round(sx+(y*y)/(ry*ry)*-1.5);if(((y+ry)/(2*ry))>.08&&Math.abs(y)<ry*Math.sqrt(1-Math.pow((sx-ax)/rx,2))-.6)set(xx,ay+y,o.stripe||DKS[1])}}});
  return{ax,ay};
 }
 const clawFoot=(R)=>(J,f,dim)=>{cap(f.x-1,f.y-2,f.x+3,f.y-.6,1.2,.7,R,{flat:dim?.15:.3});line(f.x+2,f.y-1,f.x+4,f.y,dk(R[2]))};
 function antHead(J,rx,ry,R,eyeC='#3dff8a'){
  const h=J.head;
  part(()=>{ell(h.x,h.y,rx,ry,R,{d:1});ell(h.x+rx*.5,h.y+ry*.5,rx*.55,ry*.5,R,{t0:.1,t1:.7})});
  // olho composto: órbita escura, íris luminosa em dois tons e reflexo
  deco(()=>{const ex=h.x+rx*.32,ey=h.y-ry*.05;
   ell(ex,ey,rx*.42,ry*.5,[C('#06140e'),C('#0b2418')],{flat:.3});
   ell(ex+.3,ey,rx*.3,ry*.38,[C('#11703f'),C('#1fc472'),C(eyeC),C(eyeC)],{});
   dot(ex-rx*.12,ey-ry*.2,C('#f4fff8'));dot(ex-rx*.12+1,ey-ry*.2,C('#c9ffe2'));
   // placa da testa
   for(let x=-rx*.6;x<=rx*.1;x++)if(K.get(Math.round(h.x+x),Math.round(h.y-ry*.62)))set(h.x+x,h.y-ry*.62,R[4])});
  glow(h.x+rx*.32,h.y-ry*.05,rx*.62,eyeC,.3);
 }
 // placas do tórax
 function thorax(J,rx,ry,R,gem){
  const cx=J.shX,cy=(J.shY+J.hipY)/2-1;
  part(()=>{ell(cx,cy,rx,ry,R,{d:1});ell(cx,J.hipY-1,rx*.55,2.5,R,{t0:0,t1:.6})});
  deco(()=>{for(let k=0;k<3;k++){const y=Math.round(cy-ry*.45+k*ry*.5);for(let x=Math.round(cx-rx*.75);x<=cx+rx*.8;x++)if(K.get(x,y)&&K.get(x,y+1))set(x,y,dk(R[3]))}
   if(gem){ell(cx+rx*.25,cy-ry*.2,1.8,1.8,MINT);dot(cx+rx*.25-1,cy-ry*.2-1,C('#eafff2'))}});
  if(gem)glow(cx+rx*.25,cy-ry*.2,4,'#7dffb8',.4);
 }

 /* Formiga Soldado — lanceira ágil */
 def('xerath:g',R=>{
  const spearAng=R.strike?-.08:R.wind?-.18:-1.32;
  biped(R,{leg:22,torsoH:14,shW:6,hipW:3.4,headR:8.2,armL:15,armR:2.1,legR:2.3,hunch:2,stride:6,
   skin:SH,torso:SH,arm:DKS,legc:DKS,hand:MINT,boot:DKS,foot:clawFoot(DKS),
   back:J=>{abdomen(J,9.5,7.2,SH2)},
   torsoFn:J=>thorax(J,6.6,7.8,SH,true),
   weapon:J=>part(()=>{
    const h=J.hF,[tx,ty]=at(h.x,h.y,spearAng,25),[bx,by]=at(h.x,h.y,spearAng+Math.PI,16);
    shaft(bx,by,tx,ty,BONE);
    const [px,py]=at(tx,ty,spearAng,8),[lx,ly]=at(tx,ty,spearAng+1.9,3.2),[rx,ry]=at(tx,ty,spearAng-1.9,3.2);
    poly([[px,py],[lx,ly],[tx-cos(spearAng)*2,ty-sin(spearAng)*2],[rx,ry]],MINT,{base:.95,gy:.5});
    cap(tx-cos(spearAng)*3,ty-sin(spearAng)*3,tx,ty,1.6,1.4,GOLD,{t0:.3,t1:1});
   }),
   head:J=>{antennae(J,1.1);antHead(J,9,7.4,SH);mandibles(J,1.1)},
   front:J=>{deco(()=>{dot(J.eF.ex,J.eF.ey,MINT[3]);dot(J.kF.ex,J.kF.ey,MINT[3])})}
  });
  if(R.strike)glow(CX+34,GY-36,7,'#aaffd0',.35);
 });

 /* Formiga Cuspidora — abdômen de ácido translúcido; cospe à distância */
 def('xerath:r',R=>{
  const sw=R.cast;
  biped(R,{leg:18,torsoH:13,shW:5.6,hipW:3.6,headR:7.6,armL:12,armR:2,legR:2.3,hunch:5,stride:5,headFwd:3,neck:3,
   skin:SH2,torso:SH2,arm:DKS,legc:DKS,hand:DKS,boot:DKS,foot:clawFoot(DKS),
   back:J=>{
    // bolsa de ácido: grande, brilhante, com bolhas
    const ax=J.hipX-12,ay=J.hipY-5-sw*2;
    const AC2=[C('#1d5a2a'),C('#2f8a3a'),C('#59c44e'),C('#93ea62'),C('#d2ff9a')];
    part(()=>{ell(ax,ay,11+sw,9.5+sw,AC2,{d:1});cap(ax+9,ay+4,J.hipX-1,J.hipY-2,2.4,1.8,SH2,{t0:.1,t1:.7})});
    deco(()=>{
     // líquido mais claro no fundo, bolhas e nervuras da membrana
     ell(ax-1,ay+3,7+sw,4.2,[C('#7fe05a'),C('#b6f77a')],{flat:.4,clip:(x,y)=>((x+y)&1)===0});
     ell(ax-4,ay-4,3.2,2,[C('#e9ffd0'),C('#f6ffe6')],{flat:.5});dot(ax-6,ay-2,C('#f6ffe6'));
     for(const [bx,by] of [[3,1],[-5,4],[5,-3],[0,5],[-2,0]]){dot(ax+bx,ay+by,C('#e9ffd0'));dot(ax+bx+1,ay+by+1,C('#3a9a40'))}
     for(let k=0;k<4;k++){const a0=-2.5+k*.62;for(let d=3;d<10+sw;d+=1)if(((d+k)&1)===0)dot(ax+cos(a0)*d,ay+sin(a0)*d*.86,C('#2a7a36'))}});
    glow(ax,ay,13+sw*4,'#a8ff6a',.16+sw*.3);
   },
   torsoFn:J=>thorax(J,5.4,6.6,SH2,false),
   head:J=>{
    antennae(J,.9,ACID);antHead(J,8.2,6.8,SH2,'#b6ff5a');
    const h=J.head;
    // tromba de disparo
    part(()=>{tube([[h.x+5,h.y+3],[h.x+11,h.y+4-sw],[h.x+15,h.y+3-sw*2]],2.3,1.7,DKS);ell(h.x+15.5,h.y+3-sw*2,1.8,2.2,ACID,{t0:.2,t1:.8})});
    if(sw){const r=1+sw*3.2;deco(()=>ell(h.x+17+r*.4,h.y+2-sw*2,r,r,ACID,{t0:.4,t1:1}));glow(h.x+17,h.y+2-sw*2,r*3,'#b6ff5a',.6)}
   },
   front:J=>deco(()=>{dot(J.eF.ex,J.eF.ey,ACID[3]);dot(J.kF.ex,J.kF.ey,ACID[3])})
  });
 });

 /* Formiga Capitã — colosso blindado com foices no lugar das mãos */
 def('xerath:b',R=>{
  biped(R,{leg:22,torsoH:19,shW:9.5,hipW:5.5,headR:8.5,armL:19,armR:3.4,legR:3.4,hunch:3,stride:5,neck:2,
   skin:SH,torso:SH,arm:SH,fore:DKS,legc:DKS,shin:SH,hand:DKS,boot:DKS,foot:clawFoot(SH),
   back:J=>{const a=abdomen(J,12,9,SH2);part(()=>{for(let k=0;k<3;k++){const x=a.ax-6+k*5,y=a.ay-8.5+Math.abs(k-1)*1.5;poly([[x-2,y+2],[x,y-5],[x+2,y+2]],BONE,{base:.9})}})},
   torsoFn:J=>{thorax(J,9.5,10.5,SH,true);
    // ombreiras com espinhos
    for(const s of [-1,1])part(()=>{const x=J.shX+s*8.5,y=J.shY+2;ell(x,y,5,4,SH,{d:1});poly([[x-2,y-2],[x+s*1,y-9],[x+2,y-2]],BONE,{base:.95});poly([[x+s*2,y-1],[x+s*6,y-6],[x+s*4,y+1]],BONE,{base:.85})},undefined)},
   armF:J=>part(()=>{
    const s=J.sF,e=J.eF,h=J.hF;cap(s.x,s.y,e.ex,e.ey,3.8,3.2,SH);cap(e.ex,e.ey,h.x,h.y,3.2,2.4,DKS);
    // foice
    const a=R.strike?.25:R.wind?-2.2:1.15,[tx,ty]=at(h.x,h.y,a,15),[mx,my]=at(h.x,h.y,a-.45,9);
    poly([[h.x-1,h.y-2],[mx,my],[tx,ty],[h.x+2,h.y+2]],BONE,{base:.95,gy:.4});line(h.x,h.y,tx,ty,MINT[3]);
   }),
   armB:J=>part(()=>{const s=J.sB,e=J.eB,h=J.hB;cap(s.x,s.y,e.ex,e.ey,3.6,3,SH,{t0:0,t1:.6});cap(e.ex,e.ey,h.x,h.y,3,2.2,DKS,{t0:0,t1:.6});const [tx,ty]=at(h.x,h.y,1.3,12);poly([[h.x-1,h.y-2],[h.x+4,h.y+5],[tx,ty],[h.x+2,h.y+2]],BONE,{base:.6})}),
   head:J=>{antennae(J,1.2);antHead(J,10,8.2,SH);mandibles(J,1.6);
    deco(()=>{const h=J.head;for(let k=0;k<3;k++)dot(h.x-5+k*3,h.y-6+k%2,BONE[3])})}
  });
  if(R.strike)glow(CX+26,GY-30,10,'#aaffd0',.3);
 });

 /* Formiga Rainha-Guarda — guarda real alada, com crista dourada e alabarda */
 def('xerath:e',R=>{
  const flap=[0,2,4,2][R.i%4],ang=R.strike?-.1:R.wind?-.5:-1.25,ROY=ramp('#5a4a8a');
  biped(R,{leg:24,torsoH:15,shW:6.4,hipW:3.6,headR:8,armL:16,armR:2.2,legR:2.4,hunch:1,stride:6,
   skin:SH,torso:ROY,arm:DKS,legc:DKS,hand:GOLD,boot:GOLD,foot:clawFoot(GOLD),
   back:J=>{
    // dois pares de asas translúcidas com nervuras
    for(const k of [0,1])part(()=>{
     const bx=J.shX-3,by=J.shY+3,L=k?17:23,a=-2.5+k*.55-flap*.04,[tx,ty]=at(bx,by,a,L),[m1x,m1y]=at(bx,by,a-.38,L*.62),[m2x,m2y]=at(bx,by,a+.4,L*.6);
     poly([[bx,by],[m1x,m1y],[tx,ty],[m2x,m2y]],WING,{base:.95,gy:.3,gx:.2});
     line(bx,by,tx,ty,WING[1]);line(bx,by,m1x,m1y,WING[2]);
    },C('#6aa890'));
    abdomen(J,8,6.2,ROY,{stripe:GOLD[2]});
   },
   torsoFn:J=>{thorax(J,6,7.6,ROY,true);deco(()=>{for(let x=-4;x<=4;x++)set(J.shX+x,J.shY+2+Math.abs(x)*.5,GOLD[3])})},
   weapon:J=>part(()=>{
    const h=J.hF,[tx,ty]=at(h.x,h.y,ang,27),[bx,by]=at(h.x,h.y,ang+Math.PI,17);
    shaft(bx,by,tx,ty,GOLD);
    // lâmina de alabarda + gancho
    const n=ang-Math.PI/2,[p1x,p1y]=at(tx,ty,ang,9),[p2x,p2y]=at(tx,ty,n,7),[p3x,p3y]=at(tx,ty,ang+Math.PI,5);
    poly([[p1x,p1y],[p2x,p2y],[p3x,p3y]],MINT,{base:.98,gy:.45});
    const [q1x,q1y]=at(tx,ty,n+Math.PI,4.5),[q2x,q2y]=at(q1x,q1y,ang+Math.PI,4);poly([[tx,ty],[q1x,q1y],[q2x,q2y]],BONE,{base:.8});
    ell(bx,by,1.6,1.6,MINT);
   }),
   head:J=>{antennae(J,1.15,GOLD);antHead(J,8.6,7.2,SH,'#7dffb8');mandibles(J,1.05,GOLD);
    // crista real
    part(()=>{const h=J.head;for(let k=0;k<3;k++){const x=h.x-3+k*3,hh=k===1?8:5;poly([[x-1.5,h.y-5],[x,h.y-5-hh],[x+1.5,h.y-5]],GOLD,{base:.95})}});
    deco(()=>ell(J.head.x,J.head.y-7,1.2,1.2,MINT))},
   front:J=>deco(()=>{dot(J.eF.ex,J.eF.ey,GOLD[3]);dot(J.kF.ex,J.kF.ey,GOLD[3])})
  });
  glow(CX-12,GY-52,13,'#c8ffe6',.16);
 });

 /* Formiguinha — recém-nascida, cabeçuda e nervosa (sai da Rainha-Guarda) */
 def('xerath:s',R=>{
  biped(R,{leg:10,torsoH:7,shW:3.6,hipW:2.5,headR:7,armL:7,armR:1.2,legR:1.3,hunch:2,stride:4,headFwd:2,neck:2,
   skin:SH,torso:SH2,arm:DKS,legc:DKS,hand:DKS,boot:DKS,foot:clawFoot(DKS),
   back:J=>abdomen(J,5.2,4,SH2,{tip:false}),
   torsoFn:J=>thorax(J,3.6,4.2,SH2,false),
   head:J=>{antennae(J,.7);antHead(J,7.6,6.4,SH);mandibles(J,.7)}
  });
 });
}

/* =====================================================================================================
 * 1 · ZORVATH — LEGIÃO CRISTALINA: alienígenas de pele lilás, armadura branca e roxa, cristais rosa
 * ===================================================================================================== */
{
 const SK=ramp('#c9b8e2'),AR=ramp('#5b2f9e'),WH=ramp('#cdc4e6',[-.7,-.42,-.12,.2,.62]),DK=ramp('#2a1a48'),CR=ramp('#ff5fa0'),CY=ramp('#8fe8ff');
 // cristal facetado apontando num ângulo
 function crystal(x,y,a,len,w,R0=CR){const [tx,ty]=at(x,y,a,len),n=a+Math.PI/2,[lx,ly]=at(x,y,n,w),[rx,ry]=at(x,y,n+Math.PI,w),[mx,my]=at(x,y,a,len*.45);
  poly([[lx,ly],[mx+cos(n)*w*1.1,my+sin(n)*w*1.1],[tx,ty],[x,y]],R0,{base:.98,gy:.25,gx:.1});poly([[rx,ry],[mx-cos(n)*w*1.1,my-sin(n)*w*1.1],[tx,ty],[x,y]],R0,{base:.55,gy:.3,gx:.1});line(x,y,tx,ty,R0[4])}
 // cabeça alienígena lisa, alongada para trás
 function alienHead(J,o={}){
  const h=J.head,r=J.headR;
  part(()=>{ell(h.x-2,h.y-1,r+2.5,r*.86,SK,{d:1});ell(h.x+1.5,h.y+r*.45,r*.7,r*.52,SK,{t0:.2,t1:.85});
   // placa craniana roxa
   ell(h.x-3,h.y-r*.5,r+1,r*.5,AR,{t0:.3,t1:1,clip:(x,y)=>y<h.y-r*.2})});
  deco(()=>{eye(h.x+r*.1,h.y+.5,C(o.eye||'#ff3d86'),'#ff5fa0');eye(h.x+r*.6,h.y+.5,C(o.eye||'#ff3d86'),'#ff5fa0');
   line(h.x-r*.1,h.y-1.5,h.x+r*.35,h.y-.5,DK[1]);line(h.x+r*.5,h.y-.5,h.x+r*.95,h.y-1.5,DK[1]);
   line(h.x+r*.3,h.y+r*.6,h.x+r*.7,h.y+r*.6,DK[2]);
   ell(h.x-r*.2,h.y-r*.62,1.6,1.3,CR);dot(h.x-r*.2-1,h.y-r*.62-1,C('#ffe6f2'))});
 }
 function chest(J,o={}){
  part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+1,J.hipY+1],[J.hipX-J.hipW-1,J.hipY+1]],DK,{base:.8,gy:.5});
   // peitoral branco com faixas roxas
   poly([[J.shX-J.shW+1,J.shY+1],[J.shX+J.shW,J.shY+1],[J.shX+J.shW-1,J.shY+J.torsoH*.62],[J.shX-J.shW+2,J.shY+J.torsoH*.62]],WH,{base:.95,gy:.45,gx:.3})});
  deco(()=>{for(let x=-J.shW+2;x<J.shW;x++)set(J.shX+x,J.shY+J.torsoH*.62-1,AR[2]);ell(J.shX+1,J.shY+J.torsoH*.3,1.8,1.8,CR);dot(J.shX,J.shY+J.torsoH*.3-1,C('#ffe6f2'));
   for(let x=-J.hipW;x<=J.hipW;x++)set(J.hipX+x,J.hipY,CR[2])});
  glow(J.shX+1,J.shY+J.torsoH*.3,4,'#ff5fa0',.35);
  if(o.pads)for(const s of [-1,1])part(()=>{ell(J.shX+s*(J.shW+1),J.shY+2,o.pads,o.pads*.72,WH,{d:1});ell(J.shX+s*(J.shW+1),J.shY+3.5,o.pads*.8,1.4,AR,{t0:.3,t1:.9})});
 }
 const tail=(J,len=14)=>part(()=>{const w=J.R.sway;tube([[J.hipX-2,J.hipY-1],[J.hipX-8,J.hipY+4+w],[J.hipX-len,J.hipY+2-w],[J.hipX-len-4,J.hipY-4-w]],2.2,.7,SK,{t0:0,t1:.75})});

 /* Soldado Cristalino — lâmina de cristal crescendo do antebraço */
 def('zorvath:g',R=>{
  const a=wA(R,.9,-2.2,.05);
  biped(R,{leg:22,torsoH:16,shW:6.5,hipW:4,headR:7.8,armL:15,armR:2.4,legR:2.7,
   skin:SK,torso:DK,arm:SK,fore:WH,legc:DK,shin:WH,boot:AR,hand:SK,
   back:J=>tail(J),torsoFn:J=>chest(J,{pads:4.2}),head:J=>alienHead(J),
   armF:J=>part(()=>{const s=J.sF,e=J.eF,h=J.hF;cap(s.x,s.y,e.ex,e.ey,2.9,2.5,SK);cap(e.ex,e.ey,h.x,h.y,2.8,2.4,WH);ell(h.x,h.y,2.6,2.6,SK);crystal(h.x,h.y,a,17,2.6)})
  });
  if(R.strike)glow(CX+26,GY-34,9,'#ff7ab4',.4);
 });
 /* Atirador Cristalino — canhão de cristal no braço e visor de mira */
 def('zorvath:r',R=>{
  biped(R,{leg:21,torsoH:16,shW:6.2,hipW:4,headR:7.6,armL:15,armR:2.3,legR:2.6,
   skin:SK,torso:DK,arm:SK,fore:AR,legc:DK,shin:WH,boot:AR,hand:SK,
   hands:(R,J)=>{if(!R.cast&&!R.recoil){J.hF={x:J.sF.x+9,y:J.sF.y+7}}},
   back:J=>{tail(J,11);part(()=>{box(J.shX-J.shW-5,J.shY+2,5,10,AR);crystal(J.shX-J.shW-2.5,J.shY+2,-1.57,6,2,CY)})},
   torsoFn:J=>chest(J,{pads:3.6}),
   head:J=>{alienHead(J);deco(()=>{const h=J.head;box(h.x+3,h.y-1,6,4,CY,{m:3});line(h.x-6,h.y,h.x+3,h.y,AR[3]);dot(h.x+5,h.y,C('#ffffff'))});glow(J.head.x+6,J.head.y+1,4,'#8fe8ff',.4)},
   armF:J=>part(()=>{const s=J.sF,e=J.eF,h=J.hF,a=Math.atan2(h.y-e.ey,h.x-e.ex);cap(s.x,s.y,e.ex,e.ey,2.8,2.5,SK);
    // canhão: cilindro roxo com boca de cristal
    cap(e.ex,e.ey,h.x+cos(a)*4,h.y+sin(a)*4,4,3.6,AR);cap(h.x+cos(a)*4,h.y+sin(a)*4,h.x+cos(a)*7,h.y+sin(a)*7,3.9,3.9,WH,{t0:.3,t1:1});
    ell(h.x+cos(a)*8,h.y+sin(a)*8,2.6,3.2,CR,{t0:.4,t1:1})}),
   front:J=>{if(R.cast){const a=Math.atan2(J.hF.y-J.eF.ey,J.hF.x-J.eF.ex),x=J.hF.x+cos(a)*10,y=J.hF.y+sin(a)*10,r=1+R.cast*3;deco(()=>ell(x+r*.3,y,r,r,[C('#ff5fa0'),C('#ffb0d6'),C('#fff0f8')]));glow(x,y,r*3.2,'#ff7ab4',.65)}}
  });
 });
 /* Guarda Imperial — colosso de chifres com manoplas de cristal */
 def('zorvath:b',R=>{
  biped(R,{leg:22,torsoH:21,shW:10.5,hipW:6,headR:8.2,armL:20,armR:4,legR:3.8,hunch:2,stride:5,neck:3,
   skin:SK,torso:DK,arm:SK,fore:AR,legc:DK,shin:WH,boot:AR,hand:CR,
   back:J=>{tail(J,17);part(()=>{for(let k=0;k<3;k++)crystal(J.shX-8+k*4,J.shY+2,-1.9+k*.28,10-k*1.5,2.4)})},
   torsoFn:J=>chest(J,{pads:6.4}),
   head:J=>{const h=J.head;
    for(const s of [0,1])part(()=>{tube([[h.x-3+s*5,h.y-6],[h.x-7+s*13,h.y-12],[h.x-4+s*10,h.y-17]],2.2,.6,WH)});
    alienHead(J,{eye:'#ff2a5a'})},
   armF:J=>part(()=>{const s=J.sF,e=J.eF,h=J.hF;cap(s.x,s.y,e.ex,e.ey,4.6,4,SK);cap(e.ex,e.ey,h.x,h.y,4.2,4.6,AR);ell(h.x+1,h.y,5.2,5,CR,{d:1});for(let k=-1;k<=1;k++)crystal(h.x+3,h.y+k*2.6,k*.35+(R.strike?0:.5),5.5,1.5,CR)}),
   armB:J=>part(()=>{const s=J.sB,e=J.eB,h=J.hB;cap(s.x,s.y,e.ex,e.ey,4.4,3.8,SK,{t0:0,t1:.6});cap(e.ex,e.ey,h.x,h.y,4,4.4,AR,{t0:0,t1:.6});ell(h.x+1,h.y,4.8,4.6,CR,{t0:0,t1:.6})})
  });
  if(R.strike)glow(CX+30,GY-36,11,'#ff7ab4',.35);
 });
 /* Capitão Cristalino — capa magenta, coroa de cristais e três estilhaços orbitando */
 def('zorvath:e',R=>{
  biped(R,{leg:23,torsoH:17,shW:7,hipW:4.2,headR:8,armL:16,armR:2.5,legR:2.8,
   skin:SK,torso:DK,arm:SK,fore:WH,legc:DK,shin:WH,boot:CR,hand:SK,
   back:J=>{part(()=>cloth(J.shX-4,J.shY+2,26,12,CR,R,{ang:1.95}));tail(J,12)},
   torsoFn:J=>chest(J,{pads:5}),
   head:J=>{const h=J.head;part(()=>{for(let k=0;k<4;k++)crystal(h.x-6+k*3.4,h.y-5,-1.57+(k-1.5)*.22,k%3?7:9,1.7)});alienHead(J)},
   front:J=>{const t=R.i*.9,c=R.cast;for(let k=0;k<3;k++){const a=t+k*TAU/3,x=J.hF.x+4+cos(a)*(8-c*3)+c*4,y=J.hF.y-6+sin(a)*(5-c*2);part(()=>crystal(x,y,c?0:-1.57,5+c*2,1.6));glow(x,y,4,'#ff7ab4',.4+c*.3)}}
  });
 });
}

/* =====================================================================================================
 * 2 · VHALOR — CLÃ DAS SOMBRAS: negro e vermelho, máscaras laranja
 * ===================================================================================================== */
{
 const BK=ramp('#2a2836'),BK2=ramp('#1b1a24'),RD=ramp('#d23a3a'),MK=ramp('#e07a2e'),ST=ramp('#b9c4d2'),SK=ramp('#d6b494'),STRAW=ramp('#b89a5c');
 const mask=(J,o={})=>deco(()=>{const h=J.head,r=J.headR;ell(h.x+2,h.y+.5,r*.66,r*.78,MK,{d:1});
  // marca escura e fendas dos olhos
  line(h.x+2,h.y-r*.6,h.x+2,h.y+r*.6,C('#3a1508'));eye(h.x-.5,h.y-.5,C('#1a0a08'));eye(h.x+4,h.y-.5,C('#1a0a08'));
  if(o.glow){dot(h.x,h.y,C('#ff3a2a'));dot(h.x+4.5,h.y,C('#ff3a2a'));glow(h.x+2,h.y,5,'#ff3a2a',.4)}});
 const ninjaBody=(J)=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+1,J.hipY+1],[J.hipX-J.hipW-1,J.hipY+1]],BK,{base:.8,gy:.5});ell(J.shX,J.shY+2,J.shW,3,BK,{t0:.45,t1:1})});
  deco(()=>{line(J.shX-J.shW+1,J.shY+3,J.hipX+J.hipW-1,J.hipY-3,BK[4]);line(J.shX+J.shW-1,J.shY+3,J.hipX-J.hipW+2,J.hipY-3,BK[0]);for(let x=-J.hipW-1;x<=J.hipW+1;x++){set(J.hipX+x,J.hipY-1,RD[2]);set(J.hipX+x,J.hipY,RD[1])}})};
 const wraps=(J)=>deco(()=>{for(const [k,f] of [[J.kF,J.fF]])for(let t=.25;t<.9;t+=.22){const x=Math.round(lerp(k.ex,f.x,t)),y=Math.round(lerp(k.ey,f.y-3,t));for(let d=-2;d<=2;d++)if(K.get(x+d,y))set(x+d,y,RD[1])}});

 /* Ninja Sem Rosto — capuz, máscara lisa, cachecol vermelho e tantô */
 def('vhalor:g',R=>{
  const a=wA(R,2.2,3.4,.1);
  biped(R,{leg:22,torsoH:15,shW:6,hipW:3.8,headR:7.6,armL:15,armR:2.3,legR:2.6,hunch:2,
   skin:SK,torso:BK,arm:BK,fore:BK2,legc:BK,boot:BK2,hand:BK2,
   back:J=>part(()=>cloth(J.head.x-5,J.head.y+6,20,5,RD,R,{ang:2.9})),
   torsoFn:J=>ninjaBody(J),belt:J=>wraps(J),
   head:J=>{hood(J,BK);mask(J)},
   weapon:J=>part(()=>sword(J.hF,a,13,ST,RD,1.5))
  });
 });
 /* Lançador de Kunais — chapéu de palha, pano no rosto e leque de kunais */
 def('vhalor:r',R=>{
  biped(R,{leg:21,torsoH:15,shW:5.8,hipW:3.6,headR:7.4,armL:15,armR:2.2,legR:2.5,
   skin:SK,torso:BK,arm:BK,fore:SK,legc:BK,boot:BK2,hand:SK,
   torsoFn:J=>{ninjaBody(J);deco(()=>{for(let k=0;k<4;k++){const x=J.shX-J.shW+2+k*2.6,y=J.shY+4+k*2.2;line(x,y,x+1,y+3,ST[3]);dot(x,y-1,RD[3])}})},
   head:J=>{const h=J.head,r=J.headR;face(J,SK);
    deco(()=>{eye(h.x+1,h.y-1,C('#1a0a08'));eye(h.x+5,h.y-1,C('#1a0a08'));});
    part(()=>poly([[h.x-r+1,h.y+1],[h.x+r,h.y+1],[h.x+r-1,h.y+r],[h.x-r+2,h.y+r]],RD,{base:.8}));
    // chapéu cônico de palha
    part(()=>{poly([[h.x-r-6,h.y-2],[h.x+1,h.y-r-7],[h.x+r+7,h.y-2],[h.x+r+4,h.y-.5],[h.x-r-3,h.y-.5]],STRAW,{base:.95,gy:.5,gx:.25})});
    deco(()=>{for(let k=-2;k<=2;k++)line(h.x+1,h.y-r-6,h.x+1+k*5,h.y-2,STRAW[1])})},
   front:J=>{const h=J.hF,n=R.cast?3:1;for(let k=0;k<n;k++)part(()=>{const a=(R.cast?-.25+k*.25:-1.2);const [tx,ty]=at(h.x,h.y,a,8);poly([[h.x,h.y-1],[tx,ty],[h.x,h.y+1]],ST,{base:.98});dot(h.x-1,h.y,RD[3])})}
  });
 });
 /* Samurai Sombrio — armadura laqueada, elmo com chifres e nodachi */
 def('vhalor:b',R=>{
  const a=wA(R,-1.15,-2.5,.15);
  biped(R,{leg:22,torsoH:20,shW:10,hipW:6,headR:8.4,armL:19,armR:3.6,legR:3.6,stride:5,neck:2,
   skin:SK,torso:BK,arm:BK,fore:RD,legc:BK2,shin:BK,boot:BK2,hand:BK2,
   torsoFn:J=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+2,J.hipY+2],[J.hipX-J.hipW-2,J.hipY+2]],BK,{base:.82,gy:.5})});
    // lâminas do peitoral (dō) amarradas com cordões vermelhos
    deco(()=>{for(let k=0;k<5;k++){const y=J.shY+4+k*3.4;for(let x=-J.shW+1;x<J.shW;x++){set(J.shX+x*(1-k*.05),y,BK[4]);if((x&3)===0)set(J.shX+x*(1-k*.05),y+1,RD[3])}}});
    for(const s of [-1,1])part(()=>{for(let k=0;k<3;k++)box(J.shX+s*(J.shW+1)-4,J.shY+k*3.2,8,4,k%2?RD:BK)});
    // saiote (kusazuri)
    part(()=>{for(let k=-1;k<=1;k++)box(J.hipX+k*5-3,J.hipY-1,6,7,k?BK:RD)})},
   head:J=>{const h=J.head,r=J.headR;
    part(()=>{ell(h.x,h.y,r,r*.95,BK,{d:1});box(h.x-r-2,h.y+1,r*2+4,3,BK);poly([[h.x-r-3,h.y+4],[h.x-r+3,h.y+4],[h.x-r+1,h.y+9],[h.x-r-4,h.y+8]],RD,{base:.7})});
    // chifres do elmo (kuwagata) e emblema
    for(const s of [-1,1])part(()=>tube([[h.x+1+s*2,h.y-r+1],[h.x+1+s*7,h.y-r-5],[h.x+1+s*6,h.y-r-11]],1.8,.6,MK));
    deco(()=>{ell(h.x+1,h.y-r+2,2,2,MK);ell(h.x+2.5,h.y+3,r*.55,r*.5,MK,{d:1});eye(h.x,h.y+1.5,C('#ff2a2a'),'#ff3a2a');eye(h.x+4.5,h.y+1.5,C('#ff2a2a'),'#ff3a2a');
     for(let k=0;k<3;k++)dot(h.x+1+k*1.5,h.y+6,C('#3a1508'))})},
   weapon:J=>part(()=>sword(J.hF,a,27,ST,MK,2))
  });
  if(R.strike)glow(CX+30,GY-32,10,'#ffd0c8',.3);
 });
 /* Ninja Clone — sombra viva: corpo de fumaça, olhos em brasa, duas kunais */
 def('vhalor:e',R=>{
  const SM=ramp('#3a2f52'),a=wA(R,.5,-2.4,.1);
  wraith(R,{hover:3,bodyH:33,shW:6.2,headR:7.6,armL:15,robe:SM,arm:SM,hand:RD,hem:7,
   back:J=>part(()=>cloth(J.head.x-5,J.head.y+6,22,5,RD,R,{ang:2.85})),
   head:J=>{hood(J,SM,{voidC:'#0a0712'});deco(()=>{const h=J.head;eye(h.x+.5,h.y,C('#ff5a3a'),'#ff3a2a');eye(h.x+5,h.y,C('#ff5a3a'),'#ff3a2a')})},
   weapon:J=>{for(const h of [J.hF,J.hB])part(()=>{const [tx,ty]=at(h.x,h.y,a,9);poly([[h.x,h.y-1.5],[tx,ty],[h.x,h.y+1.5]],ST,{base:.98});ell(h.x-1,h.y,1.4,1.4,RD)})},
   front:J=>{for(let k=0;k<4;k++){const x=J.hipX-8+k*5+sin(R.i+k)*2,y=J.baseY-2-k%2*3;glow(x,y,5,'#5a3f8a',.3)}}
  });
 });
}

/* =====================================================================================================
 * 3 · KUROEN — LEGIÃO RUBRA: mantos creme, carmesim e brasas; máscaras de osso
 * ===================================================================================================== */
{
 const CRM=ramp('#ddd3b8'),RED=ramp('#8a1a22'),BLK=ramp('#23202e'),EMB=ramp('#ff8a2e'),BON=ramp('#efe8d6'),FLESH=ramp('#7a2a30'),WOOD=ramp('#6a4a32');
 // máscara de osso com marcas vermelhas e olhos ocos em brasa
 const boneMask=(J,o={})=>{const h=J.head,r=J.headR;
  part(()=>{ell(h.x+1,h.y,r*(o.w||.9),r,BON,{d:1});if(o.jaw!==false)ell(h.x+2,h.y+r*.75,r*.55,r*.38,BON,{t0:.1,t1:.8})});
  deco(()=>{ell(h.x-.5,h.y-.5,1.8,2.2,[C('#1a0808'),C('#2a0c0c')],{flat:.3});ell(h.x+5,h.y-.5,1.8,2.2,[C('#1a0808'),C('#2a0c0c')],{flat:.3});dot(h.x,h.y,C('#ffb04a'));dot(h.x+5.5,h.y,C('#ffb04a'));
   line(h.x-3,h.y-r*.7,h.x-1,h.y-r*.25,RED[3]);line(h.x+7,h.y-r*.7,h.x+5.5,h.y-r*.25,RED[3]);line(h.x+2,h.y+2,h.x+2,h.y+4,RED[2]);
   for(let k=0;k<4;k++)dot(h.x-1+k*2,h.y+r*.72,C('#2a0c0c'))});
  glow(h.x+2.5,h.y-.5,6,'#ff8a2e',.4)};
 const robe=(J,R0,o={})=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+3,J.hipY+(o.len||6)],[J.hipX-J.hipW-3,J.hipY+(o.len||6)]],R0,{base:.84,gy:.5,gx:.3});ell(J.shX,J.shY+2,J.shW,3,R0,{t0:.45,t1:1})});
  deco(()=>{line(J.shX-2,J.shY+2,J.hipX+2,J.hipY-1,RED[3]);line(J.shX-1,J.shY+2,J.hipX+3,J.hipY-1,RED[1]);for(let x=-J.hipW-2;x<=J.hipW+2;x++){set(J.hipX+x,J.hipY-1,RED[2]);set(J.hipX+x,J.hipY,RED[1])}
   // barra rasgada
   for(let k=0;k<5;k++)if(k%2)set(J.hipX-J.hipW-2+k*3,J.hipY+(o.len||6),0)})};

 /* Alma Corrompida — curvada, garras longas, manto em farrapos */
 def('kuroen:g',R=>{
  biped(R,{leg:19,torsoH:15,shW:6.2,hipW:4,headR:7.8,armL:18,armR:2.2,legR:2.4,hunch:6,headFwd:4,neck:3,stride:6,
   skin:FLESH,torso:CRM,arm:CRM,fore:FLESH,legc:BLK,boot:FLESH,hand:FLESH,
   torsoFn:J=>robe(J,CRM,{len:7}),
   head:J=>{part(()=>{const h=J.head;tube([[h.x-3,h.y-5],[h.x-9,h.y-2],[h.x-12,h.y+5+R.sway]],3,1,BLK,{t0:0,t1:.7})});boneMask(J)},
   armF:J=>part(()=>{const s=J.sF,e=J.eF,h=J.hF;cap(s.x,s.y,e.ex,e.ey,3,2.6,CRM);cap(e.ex,e.ey,h.x,h.y,2.2,1.9,FLESH);ell(h.x,h.y,2.6,2.6,FLESH);
    for(let k=-1;k<=1;k++){const a=(R.strike?0:.9)+k*.4,[tx,ty]=at(h.x,h.y,a,7);line(h.x,h.y,tx,ty,BON[3]);dot(tx,ty,BON[4])}}),
   armB:J=>part(()=>{const s=J.sB,e=J.eB,h=J.hB;cap(s.x,s.y,e.ex,e.ey,2.8,2.4,CRM,{t0:0,t1:.6});cap(e.ex,e.ey,h.x,h.y,2,1.8,FLESH,{t0:0,t1:.6});for(let k=-1;k<=1;k++){const [tx,ty]=at(h.x,h.y,1+k*.4,6);line(h.x,h.y,tx,ty,BON[1])}})
  });
 });
 /* Arqueiro Espiritual — chapéu alto, talismã no rosto e arco de brasa */
 def('kuroen:r',R=>{
  biped(R,{leg:22,torsoH:16,shW:6,hipW:4,headR:7.4,armL:15,armR:2.2,legR:2.5,
   skin:FLESH,torso:CRM,arm:CRM,fore:CRM,legc:RED,boot:BLK,hand:BON,
   hands:(R,J)=>{J.hF={x:J.sF.x+11,y:J.sF.y+3};J.hB={x:J.sF.x+11-(R.cast?R.cast*11:1),y:J.sF.y+3}},
   back:J=>part(()=>{box(J.shX-J.shW-4,J.shY+1,4,13,WOOD);for(let k=0;k<3;k++)line(J.shX-J.shW-3+k,J.shY-3,J.shX-J.shW-3+k,J.shY+1,EMB[3])}),
   torsoFn:J=>robe(J,CRM,{len:9}),
   head:J=>{const h=J.head,r=J.headR;face(J,FLESH);
    part(()=>{poly([[h.x-r,h.y-3],[h.x-2,h.y-r-11],[h.x+3,h.y-r-11],[h.x+r,h.y-3]],BLK,{base:.75});box(h.x-r-1,h.y-4,r*2+2,3,BLK)});
    // talismã de papel cobrindo o rosto
    part(()=>{poly([[h.x-1,h.y-3],[h.x+6,h.y-3],[h.x+6+R.sway*.4,h.y+r+4],[h.x-1+R.sway*.4,h.y+r+4]],BON,{base:.95,gy:.3})});
    deco(()=>{for(let k=0;k<4;k++)line(h.x+1,h.y-1+k*2.6,h.x+4,h.y-1+k*2.6,RED[2]);dot(h.x+2.5,h.y+r+1,RED[3])})},
   weapon:J=>part(()=>{const h=J.hF,pull=R.cast||0;
    // arco
    tube([[h.x-1,h.y-14],[h.x+4,h.y-7],[h.x+3,h.y],[h.x+4,h.y+7],[h.x-1,h.y+14]],1.5,1.5,WOOD);
    line(h.x-1,h.y-14,J.hB.x,J.hB.y,EMB[3]);line(h.x-1,h.y+14,J.hB.x,J.hB.y,EMB[3]);
    if(pull){line(J.hB.x,J.hB.y,h.x+9,h.y,BON[3]);poly([[h.x+8,h.y-2],[h.x+13,h.y],[h.x+8,h.y+2]],EMB,{base:.98})}}),
   front:J=>{if(R.cast)glow(J.hF.x+11,J.hF.y,3+R.cast*5,'#ff8a2e',.6)}
  });
 });
 /* Colosso Mascarado — máscara de oni, corda sagrada na cintura e clava de ferro */
 def('kuroen:b',R=>{
  const a=wA(R,-.95,-2.7,.25);
  biped(R,{leg:21,torsoH:22,shW:11,hipW:6.5,headR:9.5,armL:20,armR:4.2,legR:4,hunch:3,stride:5,neck:3,
   skin:FLESH,torso:FLESH,arm:FLESH,fore:FLESH,legc:BLK,boot:FLESH,hand:FLESH,
   torsoFn:J=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+2,J.hipY+1],[J.hipX-J.hipW-2,J.hipY+1]],FLESH,{base:.84,gy:.5});ell(J.shX,J.shY+3,J.shW,4.5,FLESH,{t0:.45,t1:1});ell(J.shX+1,J.hipY-5,J.shW*.8,5.5,FLESH,{t0:.3,t1:.9})});
    deco(()=>{line(J.shX+1,J.shY+5,J.shX+1,J.hipY-9,FLESH[1]);line(J.shX-5,J.shY+8,J.shX+7,J.shY+8,FLESH[1]);
     // corda sagrada (shimenawa) com papéis
     for(let x=-J.hipW-3;x<=J.hipW+3;x++){set(J.hipX+x,J.hipY-2+((x&1)?0:1),BON[3]);set(J.hipX+x,J.hipY-1+((x&1)?0:1),BON[1])}
     for(let k=-1;k<=1;k++)poly([[J.hipX+k*5-1,J.hipY],[J.hipX+k*5+2,J.hipY],[J.hipX+k*5+3,J.hipY+5],[J.hipX+k*5,J.hipY+5]],BON,{base:.9})});
    part(()=>{poly([[J.hipX-J.hipW-3,J.hipY],[J.hipX+J.hipW+3,J.hipY],[J.hipX+J.hipW+4,J.hipY+8],[J.hipX-J.hipW-4,J.hipY+8]],RED,{base:.8})})},
   head:J=>{const h=J.head,r=J.headR;
    part(()=>tube([[h.x-4,h.y-4],[h.x-11,h.y+1],[h.x-13,h.y+10+R.sway]],4,1.4,BLK,{t0:0,t1:.7}));
    for(const s of [0,1])part(()=>tube([[h.x-2+s*7,h.y-r+2],[h.x-4+s*11,h.y-r-5],[h.x-2+s*8,h.y-r-10]],2,.6,EMB));
    boneMask(J,{w:1});
    deco(()=>{for(let k=0;k<2;k++)poly([[h.x+k*5,h.y+r*.7],[h.x+1+k*5,h.y+r*.7+4],[h.x+2+k*5,h.y+r*.7]],BON,{base:.98})})},
   weapon:J=>part(()=>{const h=J.hF,[tx,ty]=at(h.x,h.y,a,25),[bx,by]=at(h.x,h.y,a+Math.PI,5);cap(bx,by,h.x+cos(a)*6,h.y+sin(a)*6,1.6,1.8,WOOD);cap(h.x+cos(a)*6,h.y+sin(a)*6,tx,ty,2.6,4.6,BLK);
    for(let k=0;k<4;k++){const [px,py]=at(h.x,h.y,a,10+k*4.2);dot(px+sin(a)*3,py-cos(a)*3,EMB[4]);dot(px-sin(a)*3,py+cos(a)*3,EMB[2]);dot(px,py,EMB[3])}})
  });
  if(R.strike)glow(CX+30,GY-30,11,'#ff8a2e',.3);
 });
 /* Espectro Flamejante — crânio com chifres sobre um corpo de fogo */
 def('kuroen:e',R=>{
  const FIRE=[C('#7a1a10'),C('#c43a14'),C('#ff7a1e'),C('#ffb83a'),C('#fff0a0')];
  wraith(R,{hover:6,bodyH:31,shW:7,headR:8,armL:16,robe:FIRE,arm:FIRE,hand:BON,hem:8,hunch:R.strike?4:1,
   head:J=>{const h=J.head,r=J.headR;
    for(const s of [0,1])part(()=>tube([[h.x-3+s*8,h.y-r+2],[h.x-7+s*15,h.y-r-3],[h.x-5+s*12,h.y-r-10]],2,.6,BLK));
    boneMask(J);
    // labaredas no topo do crânio
    part(()=>{for(let k=0;k<3;k++){const x=h.x-3+k*3,hh=5+((k+R.i)%3)*2;poly([[x-1.5,h.y-r+1],[x+sin(R.i+k)*1.5,h.y-r-hh],[x+1.5,h.y-r+1]],FIRE,{base:.98,gy:.6})}},C('#7a1a10'))},
   front:J=>{glow(J.shX,J.shY+12,16,'#ff7a1e',.28);glow(J.hipX-8,J.baseY,9,'#ff7a1e',.3);if(R.strike)glow(J.hF.x+3,J.hF.y,9,'#ffb83a',.5)}
  });
 });
}

/* =====================================================================================================
 * 4 · NYXAR — HORDAS NOTURNAS: demônios índigo com chifres e brasas âmbar
 * ===================================================================================================== */
{
 const IN=ramp('#3a3478'),IN2=ramp('#27224f'),AM=ramp('#ff9a3a'),PAL=ramp('#cfc4e0'),BONE=ramp('#e6dcc8'),DKR=ramp('#191533'),RDD=ramp('#b8284a'),WG=ramp('#5a2a6a');
 const horns=(J,len,R0=BONE,o={})=>{const h=J.head,r=J.headR;for(const s of [0,1])part(()=>{tube([[h.x-3+s*7,h.y-r+2],[h.x-6+s*(o.out||13),h.y-r-len*.5],[h.x-4+s*(o.tip||9),h.y-r-len]],o.w||2,.6,R0)});deco(()=>{for(const s of [0,1])dot(h.x-4+s*(o.tip||9),h.y-r-len,AM[4])})};
 const dFace=(J,SKN,o={})=>{const h=J.head,r=J.headR;
  // orelhas pontudas
  part(()=>poly([[h.x-r+1,h.y-2],[h.x-r-6,h.y-6+J.R.sway*.3],[h.x-r+2,h.y+3]],SKN,{base:.6}));
  face(J,SKN);
  deco(()=>{eye(h.x+r*.02,h.y-.5,C(o.eye||'#ffb24a'),'#ff9a3a');eye(h.x+r*.56,h.y-.5,C(o.eye||'#ffb24a'),'#ff9a3a');line(h.x-r*.1,h.y-3,h.x+r*.3,h.y-1.5,DKR[1]);line(h.x+r*.5,h.y-1.5,h.x+r*.95,h.y-3,DKR[1]);
   // sorriso de presas
   for(let x=0;x<r*.9;x++){set(h.x+x,h.y+r*.5,DKR[1]);if((Math.round(x)&1)===0)set(h.x+x,h.y+r*.5+1,BONE[4])}
   if(o.tusk){poly([[h.x+1,h.y+r*.5],[h.x+2,h.y+r*.5-4],[h.x+3,h.y+r*.5]],BONE,{base:.98});poly([[h.x+6,h.y+r*.5],[h.x+7,h.y+r*.5-4],[h.x+8,h.y+r*.5]],BONE,{base:.98})}})};
 const dTail=(J,len=15)=>part(()=>{const w=J.R.sway*1.2;tube([[J.hipX-2,J.hipY],[J.hipX-9,J.hipY+5+w],[J.hipX-len,J.hipY-2-w]],1.6,.9,IN2,{t0:0,t1:.7});const x=J.hipX-len,y=J.hipY-2-w;poly([[x-4,y-3],[x+1,y],[x-2,y+3]],AM,{base:.9})});
 const loin=(J,R0=RDD)=>{part(()=>poly([[J.hipX-J.hipW-2,J.hipY-2],[J.hipX+J.hipW+2,J.hipY-2],[J.hipX+J.hipW+1,J.hipY+5],[J.hipX,J.hipY+8],[J.hipX-J.hipW-1,J.hipY+5]],R0,{base:.8}));deco(()=>{for(let x=-J.hipW-2;x<=J.hipW+2;x++)set(J.hipX+x,J.hipY-2,AM[3])})};
 const bare=(J,SKN)=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+1,J.hipY+1],[J.hipX-J.hipW-1,J.hipY+1]],SKN,{base:.84,gy:.5});ell(J.shX,J.shY+3,J.shW,4,SKN,{t0:.45,t1:1})});deco(()=>{line(J.shX+1,J.shY+5,J.shX+1,J.hipY-4,SKN[1]);line(J.shX-J.shW*.5,J.shY+7,J.shX+J.shW*.6,J.shY+7,SKN[1])})};
 const claws=(h,a,R0=BONE,n=3)=>{for(let k=0;k<n;k++){const [tx,ty]=at(h.x,h.y,a+(k-(n-1)/2)*.42,5.5);line(h.x,h.y,tx,ty,R0[3]);dot(tx,ty,R0[4])}};

 /* Demônio Menor — diabrete ágil de garras e cauda de seta */
 def('nyxar:g',R=>{
  biped(R,{leg:19,torsoH:14,shW:6.2,hipW:4,headR:8.4,armL:16,armR:2.3,legR:2.6,hunch:4,headFwd:3,neck:2,
   skin:IN,torso:IN,arm:IN,legc:IN2,boot:IN2,hand:IN,
   back:J=>dTail(J),torsoFn:J=>bare(J,IN),belt:J=>loin(J),
   head:J=>{horns(J,8);dFace(J,IN)},
   armF:J=>part(()=>{const s=J.sF,e=J.eF,h=J.hF;cap(s.x,s.y,e.ex,e.ey,2.8,2.4,IN);cap(e.ex,e.ey,h.x,h.y,2.4,2,IN);ell(h.x,h.y,2.6,2.6,IN);claws(h,R.strike?0:1)})
  });
 });
 /* Demônio Arremessador — magro, de um olho só, molda bolas de fogo âmbar */
 def('nyxar:r',R=>{
  biped(R,{leg:23,torsoH:15,shW:5.6,hipW:3.6,headR:8,armL:19,armR:1.9,legR:2.1,hunch:2,
   skin:PAL,torso:PAL,arm:PAL,legc:IN2,boot:IN2,hand:PAL,
   back:J=>dTail(J,12),torsoFn:J=>{bare(J,PAL);deco(()=>{for(let k=0;k<3;k++)line(J.shX-3,J.shY+9+k*2,J.shX+3,J.shY+9+k*2,PAL[1])})},belt:J=>loin(J,IN),
   head:J=>{horns(J,11,IN,{out:9,tip:6,w:1.6});const h=J.head,r=J.headR;face(J,PAL);
    // olho único enorme
    deco(()=>{ell(h.x+3,h.y-.5,4,4.2,[C('#1a1030'),C('#2a1a4a')],{flat:.3});ell(h.x+3.4,h.y-.5,2.8,3,[C('#b8601a'),C('#ff9a3a'),C('#ffd9a0')]);dot(h.x+3.6,h.y-.5,C('#1a0a08'));dot(h.x+2,h.y-2,C('#ffffff'));line(h.x+1,h.y+r*.6,h.x+6,h.y+r*.6,DKR[1])});glow(h.x+3.4,h.y-.5,6,'#ff9a3a',.4)},
   front:J=>{const h=J.hF,r=2+R.cast*3.4;if(R.cast||R.pose==='idle'){const rr=R.cast?r:2;part(()=>ell(h.x+rr+1,h.y-1,rr,rr,[C('#b8401a'),C('#ff7a1e'),C('#ffb83a'),C('#fff0a0')]),C('#7a2a10'));glow(h.x+rr+1,h.y-1,rr*3,'#ff9a3a',.6)}}
  });
 });
 /* Demônio Colosso — ogro de presas com clava cravejada e correntes */
 def('nyxar:b',R=>{
  const a=wA(R,-.9,-2.6,.3);
  biped(R,{leg:21,torsoH:22,shW:11.5,hipW:7,headR:9.6,armL:20,armR:4.4,legR:4.2,hunch:3,stride:5,neck:3,
   skin:IN,torso:IN,arm:IN,legc:IN2,boot:IN2,hand:IN,
   torsoFn:J=>{bare(J,IN);part(()=>ell(J.shX+2,J.hipY-6,J.shW*.82,7,IN,{t0:.3,t1:.95}));
    // correntes cruzadas e ombreira
    deco(()=>{for(let k=0;k<12;k++){const t=k/11;set(lerp(J.shX-J.shW+2,J.hipX+J.hipW,t),lerp(J.shY+3,J.hipY-3,t),k%2?AM[3]:AM[1])}});
    part(()=>{ell(J.shX-J.shW,J.shY+2,5.5,4.5,DKR,{d:1});for(let k=0;k<3;k++)poly([[J.shX-J.shW-4+k*3,J.shY],[J.shX-J.shW-3+k*3,J.shY-5],[J.shX-J.shW-2+k*3,J.shY]],AM,{base:.95})})},
   belt:J=>loin(J),
   head:J=>{horns(J,13,BONE,{out:15,tip:11,w:2.8});dFace(J,IN,{tusk:1,eye:'#ff5a3a'})},
   weapon:J=>part(()=>{const h=J.hF,[tx,ty]=at(h.x,h.y,a,24),[bx,by]=at(h.x,h.y,a+Math.PI,5);cap(bx,by,h.x+cos(a)*7,h.y+sin(a)*7,1.7,2,BONE,{t0:.1,t1:.7});cap(h.x+cos(a)*7,h.y+sin(a)*7,tx,ty,3,5.2,DKR);
    for(let k=0;k<3;k++){const [px,py]=at(h.x,h.y,a,12+k*5),n=a+Math.PI/2;poly([[px+cos(n)*3,py+sin(n)*3],[px+cos(n)*7,py+sin(n)*7],[px+cos(a)*2+cos(n)*3,py+sin(a)*2+sin(n)*3]],AM,{base:.98});poly([[px-cos(n)*3,py-sin(n)*3],[px-cos(n)*7,py-sin(n)*7],[px+cos(a)*2-cos(n)*3,py+sin(a)*2-sin(n)*3]],AM,{base:.7})}})
  });
  if(R.strike)glow(CX+30,GY-30,11,'#ff9a3a',.3);
 });
 /* Demônio Sanguessuga — pálido, asas de morcego, boca vertical cheia de presas */
 def('nyxar:e',R=>{
  const fl=[0,2,4,2][R.i%4];
  biped(R,{leg:23,torsoH:16,shW:6.4,hipW:4,headR:8.2,armL:17,armR:2.2,legR:2.5,hunch:3,headFwd:2,
   skin:PAL,torso:DKR,arm:PAL,legc:DKR,boot:DKR,hand:PAL,
   back:J=>{for(const k of [0,1])part(()=>{const bx=J.shX-3,by=J.shY+3,a0=-2.3+k*.5-fl*.05,[t1x,t1y]=at(bx,by,a0,22-k*5),[t2x,t2y]=at(bx,by,a0+.5,18-k*4),[t3x,t3y]=at(bx,by,a0+1,12);
     poly([[bx,by],[t1x,t1y],[(t1x+t2x)/2+2,(t1y+t2y)/2+3],[t2x,t2y],[(t2x+t3x)/2+2,(t2y+t3y)/2+2],[t3x,t3y]],WG,{base:.8,gy:.4});line(bx,by,t1x,t1y,WG[0]);line(bx,by,t2x,t2y,WG[1])});dTail(J,11)},
   torsoFn:J=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+1,J.hipY+1],[J.hipX-J.hipW-1,J.hipY+1]],DKR,{base:.8,gy:.5});ell(J.shX,J.shY+2,J.shW,3,DKR,{t0:.45,t1:1})});
    // boca vertical no peito, com presas
    deco(()=>{const cx=J.shX+1,cy=(J.shY+J.hipY)/2;ell(cx,cy,2.6,5.5,[C('#5a0a1e'),C('#b8284a'),C('#ff5a7a')],{});for(let k=-2;k<=2;k++){dot(cx-2.4,cy+k*2,BONE[4]);dot(cx+2.4,cy+k*2+1,BONE[4])}});
    glow(J.shX+1,(J.shY+J.hipY)/2,6,'#ff3a6a',.35+R.strike*.3)},
   head:J=>{const h=J.head,r=J.headR;part(()=>tube([[h.x-3,h.y-r+2],[h.x-10,h.y+2],[h.x-11,h.y+12+R.sway]],4,1.5,PAL,{t0:.2,t1:1}));horns(J,7,IN,{out:11,tip:8});dFace(J,PAL,{eye:'#ff3a6a'})},
   armF:J=>part(()=>{const s=J.sF,e=J.eF,h=J.hF;cap(s.x,s.y,e.ex,e.ey,2.6,2.3,PAL);cap(e.ex,e.ey,h.x,h.y,2.2,1.9,PAL);ell(h.x,h.y,2.5,2.5,PAL);claws(h,R.strike?0:.9,RDD,4)})
  });
 });
}

/* =====================================================================================================
 * 5 · RYOKU — MALDIÇÕES DO SANTUÁRIO: carne violácea, muitos olhos, bocas e marcas negras
 * ===================================================================================================== */
{
 const FL=ramp('#8a4a8a'),FL2=ramp('#5a2a6a'),PK=ramp('#ff8fb2'),BK=ramp('#1e1a2a'),TE=ramp('#efe6d8'),RD=ramp('#d62a5a'),PALE=ramp('#d9c2d0');
 // olho de maldição (branco avermelhado com pupila fendida)
 const cEye=(x,y,r,o={})=>{deco(()=>{ell(x,y,r,r*.82,[C('#5a0a2a'),C('#e8d0d8'),C('#fff4f6')],{});ell(x+(o.look||.4)*r*.4,y,r*.45,r*.6,[C('#8a0a2a'),C('#ff2a5a')],{flat:.6});line(x+(o.look||.4)*r*.4,y-r*.4,x+(o.look||.4)*r*.4,y+r*.4,C('#12040a'));dot(x-r*.4,y-r*.4,C('#ffffff'))});glow(x,y,r*1.8,'#ff2a5a',.3)};
 const maw=(x,y,w,h,open=0)=>deco(()=>{ell(x,y,w,h+open,[C('#2a0412'),C('#5a0a22'),C('#8a1a3a')],{});const n=Math.max(3,Math.round(w*1.1));for(let k=0;k<n;k++){const xx=x-w+1+k*(2*w-2)/(n-1),dy=Math.sqrt(Math.max(0,1-Math.pow((xx-x)/w,2)))*(h+open);poly([[xx-1,y-dy],[xx,y-dy+2.6],[xx+1,y-dy]],TE,{base:.98});poly([[xx-1,y+dy],[xx,y+dy-2.4],[xx+1,y+dy]],TE,{base:.8})}});
 const marks=(pts)=>deco(()=>{for(const [x0,y0,x1,y1] of pts)line(x0,y0,x1,y1,BK[1])});

 /* Maldição Menor — bola de carne com um olho gigante, boca e perninhas */
 def('ryoku:g',R=>{
  const sq=R.pose==='walk'?Math.abs(R.sF)*1.5:R.bob,cx=CX-1+R.shift+R.lean,cy=GY-17+sq*.6-(R.strike?2:0);
  // perninhas
  for(const [dx,s,up] of [[-5,R.sB,R.upB],[5,R.sF,R.upF]])part(()=>{const fx=cx+dx+s*4,fy=GY-up*3;cap(cx+dx,cy+9,fx,fy-2,2.4,2,FL2,{t0:0,t1:.7});ell(fx+1.5,fy-1.5,3.4,2,FL2,{t0:.1,t1:.7})});
  // bracinhos
  part(()=>{const a=R.strike?0:R.wind?-2.4:.9;const [hx,hy]=at(cx+9,cy+2,a,8+R.strike*6);cap(cx+8,cy+2,hx,hy,2.2,1.8,FL);for(let k=-1;k<=1;k++){const [tx,ty]=at(hx,hy,a+k*.5,4);line(hx,hy,tx,ty,TE[3])}});
  part(()=>{ell(cx,cy,13,12-sq*.5,FL,{d:1});ell(cx-3,cy+7,9,5,FL,{t0:0,t1:.6});
   // caroços
   ell(cx-9,cy-7,3.5,3,FL,{t0:.3,t1:1});ell(cx+8,cy-9,2.6,2.4,FL,{t0:.3,t1:1})});
  cEye(cx+3,cy-3,6,{look:.5});maw(cx+3,cy+7,6,1.6,R.strike*2+R.recoil*1.5);
  marks([[cx-10,cy-2,cx-6,cy+2],[cx-8,cy+3,cx-4,cy+5],[cx-2,cy-11,cx+2,cy-9]]);
  // olhinhos extras
  deco(()=>{eye(cx-7,cy-4,C('#ff2a5a'));eye(cx+10,cy+1,C('#ff2a5a'))});
 });
 /* Maldição Atiradora — cabeça flutuante de muitos olhos, tentáculos e cuspe amaldiçoado */
 def('ryoku:r',R=>{
  const fl=[0,-1,-2,-1][R.i%4],cx=CX-2+R.shift,cy=GY-36+fl+(R.recoil?2:0);
  // tentáculos pendentes
  for(let k=0;k<5;k++)part(()=>{const x=cx-8+k*4,w=sin(R.i*1.5+k)*2.4;tube([[x,cy+8],[x+w,cy+16],[x-w*.6,cy+23+(k%2)*4],[x+w,cy+29+(k%2)*5]],2,.6,k%2?FL2:FL,{t0:0,t1:.8})});
  part(()=>{ell(cx,cy,13,11,FL,{d:1});ell(cx-2,cy+6,10,5,FL,{t0:0,t1:.6});ell(cx-8,cy-8,4,3.4,FL,{t0:.3,t1:1});ell(cx+7,cy-9,3,2.6,FL,{t0:.3,t1:1})});
  cEye(cx+1,cy-3,4.4);cEye(cx+9,cy-1,2.8);cEye(cx-7,cy-1,2.6,{look:-.2});cEye(cx+5,cy-9,2);
  // boca em bico que dispara
  const c=R.cast;maw(cx+10,cy+6,3.4,2,c*2);
  marks([[cx-11,cy+2,cx-6,cy+5],[cx-4,cy-11,cx,cy-9]]);
  if(c){const r=1.5+c*3.4;part(()=>ell(cx+15+r,cy+6,r,r,[C('#5a0a2a'),C('#b8205a'),C('#ff5a8a'),C('#ffd0e0')]),C('#3a0618'));glow(cx+15+r,cy+6,r*3,'#ff2a6a',.6)}
 });
 /* Maldição Colossal — gigante de quatro braços com a boca na barriga */
 def('ryoku:b',R=>{
  biped(R,{leg:20,torsoH:23,shW:11.5,hipW:7.5,headR:7.6,armL:20,armR:4,legR:4.2,hunch:3,stride:5,neck:4,
   skin:PALE,torso:PALE,arm:PALE,legc:PALE,boot:FL2,hand:PALE,
   back:J=>{for(const s of [0,1])part(()=>{const sx=J.shX-J.shW+2+s*3,sy=J.shY+9,a=R.strike?-.4:R.wind?-2.6:-2+s*.5+R.sway*.05,[ex,ey]=at(sx,sy,a,9),[hx,hy]=at(ex,ey,a+.9,9);cap(sx,sy,ex,ey,3.4,3,PALE,{t0:0,t1:.6});cap(ex,ey,hx,hy,3,2.6,PALE,{t0:0,t1:.6});ell(hx,hy,3.4,3.4,PALE,{t0:0,t1:.6})})},
   torsoFn:J=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+2,J.hipY+1],[J.hipX-J.hipW-2,J.hipY+1]],PALE,{base:.84,gy:.5});ell(J.shX,J.shY+3,J.shW,4.5,PALE,{t0:.45,t1:1});ell(J.shX+1,J.hipY-7,J.shW*.92,8.5,PALE,{t0:.3,t1:.95,d:1})});
    maw(J.shX+2,J.hipY-7,7.5,2.4,R.strike*3+R.wind*1.5);
    marks([[J.shX-8,J.shY+4,J.shX-3,J.shY+9],[J.shX+4,J.shY+4,J.shX+9,J.shY+8],[J.shX-9,J.hipY-2,J.shX-5,J.hipY-4]]);
    cEye(J.shX-6,J.shY+8,2.2);cEye(J.shX+7,J.shY+10,2)},
   belt:J=>{part(()=>poly([[J.hipX-J.hipW-2,J.hipY-1],[J.hipX+J.hipW+2,J.hipY-1],[J.hipX+J.hipW+1,J.hipY+7],[J.hipX-J.hipW-1,J.hipY+7]],BK,{base:.8}))},
   head:J=>{const h=J.head,r=J.headR;part(()=>{ell(h.x,h.y,r,r*.9,PALE,{d:1})});
    part(()=>{for(let k=0;k<5;k++){const x=h.x-6+k*3,hh=4+((k*3)%4);poly([[x-2,h.y-r+2],[x+(k-2)*.8,h.y-r-hh],[x+2,h.y-r+2]],PK,{base:.95})}});
    cEye(h.x+1,h.y,2.2);cEye(h.x+5.5,h.y,2.2);marks([[h.x-1,h.y+3,h.x+7,h.y+3],[h.x+3,h.y-5,h.x+3,h.y-2]])}
  });
  if(R.strike)glow(CX+28,GY-34,11,'#ff5a8a',.3);
 });
 /* Maldição Ancestral — manto negro, quatro olhos, anéis de maldição girando */
 def('ryoku:e',R=>{
  wraith(R,{hover:5,bodyH:36,shW:7,headR:8,armL:17,robe:BK,arm:BK,hand:PALE,hem:8,
   robeDeco:J=>deco(()=>{for(let k=0;k<4;k++){const y=J.shY+8+k*6;for(let x=-5;x<=5;x++)if(K.get(Math.round(J.shX+x),Math.round(y)))set(J.shX+x,y+Math.abs(x)*.4,k%2?RD[2]:PK[2])}}),
   head:J=>{const h=J.head,r=J.headR;face(J,PALE);
    part(()=>{for(let k=0;k<6;k++){const x=h.x-7+k*2.8,hh=5+((k*5)%4);poly([[x-2,h.y-r+3],[x+(k-2.5)*.9,h.y-r-hh],[x+2,h.y-r+3]],PK,{base:.95})}});
    deco(()=>{eye(h.x,h.y-.5,C('#ff2a5a'),'#ff2a5a');eye(h.x+5,h.y-.5,C('#ff2a5a'),'#ff2a5a');eye(h.x+.5,h.y+3,C('#ff2a5a'));eye(h.x+5,h.y+3,C('#ff2a5a'));
     line(h.x-2,h.y+r*.7,h.x+7,h.y+r*.7,BK[1]);line(h.x+2.5,h.y-r*.9,h.x+2.5,h.y-3,BK[1])});
    cEye(h.x+2.5,h.y-r*.55,1.8)},
   front:J=>{const t=R.i*.8,cx=J.shX,cy=J.shY+14,rr=15+R.wind*4+R.strike*8;for(let k=0;k<10;k++){const a=t+k*TAU/10,x=cx+cos(a)*rr,y=cy+sin(a)*rr*.34;deco(()=>{dot(x,y,PK[3]);dot(x+1,y,RD[2])})}glow(cx,cy,rr,'#ff2a6a',.12+R.strike*.2)}
  });
 });
}

/* =====================================================================================================
 * 7 · RAPINA — LIGA DOS VILÕES: uniformes azul-marinho, metal azulado e energia roxa
 * ===================================================================================================== */
{
 const NV=ramp('#27304a'),NV2=ramp('#181d2e'),STL=ramp('#8a9ac8'),PUR=ramp('#b05aff'),SKN=ramp('#c9b4a2'),YEL=ramp('#f2e25a'),GRY=ramp('#5a6076'),SACK=ramp('#8a7a5a');
 const suit=(J,o={})=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+1,J.hipY+1],[J.hipX-J.hipW-1,J.hipY+1]],NV,{base:.82,gy:.5});ell(J.shX,J.shY+2.5,J.shW,3.4,NV,{t0:.45,t1:1})});
  deco(()=>{// emblema em V e cinto de utilidades
   const cx=J.shX+1,cy=J.shY+J.torsoH*.38;for(let k=0;k<4;k++){set(cx-k,cy-k,(o.em||PUR)[3]);set(cx+k,cy-k,(o.em||PUR)[3]);set(cx-k,cy-k+1,(o.em||PUR)[1]);set(cx+k,cy-k+1,(o.em||PUR)[1])}
   for(let x=-J.hipW-1;x<=J.hipW+1;x++){set(J.hipX+x,J.hipY-1,STL[3]);set(J.hipX+x,J.hipY,STL[1])}dot(J.hipX+1,J.hipY-1,PUR[4])})};
 const domino=(J,c=PUR)=>deco(()=>{const h=J.head,r=J.headR;for(let x=-r*.3;x<=r*.95;x++){set(h.x+x,h.y-1,NV2[1]);set(h.x+x,h.y,NV2[1]);set(h.x+x,h.y+1,NV2[2])}eye(h.x+r*.02,h.y-.5,C('#ffffff'));eye(h.x+r*.56,h.y-.5,C('#ffffff'));line(h.x+r*.2,h.y+r*.55,h.x+r*.7,h.y+r*.55,SKN[0])});

 /* Vilão Furtivo — capuz, capa curta e duas adagas */
 def('rapina:g',R=>{
  const a=wA(R,.8,-2.3,.05);
  biped(R,{leg:22,torsoH:15,shW:6.2,hipW:3.8,headR:7.8,armL:15,armR:2.3,legR:2.6,hunch:2,
   skin:SKN,torso:NV,arm:NV,fore:NV2,legc:NV2,boot:GRY,hand:NV2,
   back:J=>part(()=>cloth(J.shX-4,J.shY+2,17,9,NV2,R,{ang:2.1})),
   torsoFn:J=>suit(J),
   head:J=>{hood(J,NV,{voidC:'#0b0e18'});deco(()=>{const h=J.head;for(let x=0;x<6;x++){set(h.x+x,h.y,PUR[3]);set(h.x+x,h.y+1,PUR[1])}});glow(J.head.x+3,J.head.y,5,'#b05aff',.45)},
   weapon:J=>{part(()=>sword(J.hF,a,10,STL,PUR,1.4));part(()=>sword(J.hB,a+.5,9,STL,PUR,1.3))}
  });
 });
 /* Vilão Elétrico — cabelo em raio, óculos e manoplas faiscando */
 def('rapina:r',R=>{
  const bolt=(x,y,len,seed)=>deco(()=>{let px=x,py=y;for(let k=0;k<len;k++){const nx=px+2+((seed+k*7)%3),ny=py+(((seed+k*5)%5)-2);line(px,py,nx,ny,k%2?YEL[4]:PUR[4]);px=nx;py=ny}});
  biped(R,{leg:21,torsoH:15,shW:6.2,hipW:3.8,headR:7.8,armL:15,armR:2.4,legR:2.6,
   skin:SKN,torso:NV,arm:NV,fore:STL,legc:NV2,boot:STL,hand:YEL,
   torsoFn:J=>suit(J,{em:YEL}),
   head:J=>{const h=J.head,r=J.headR;face(J,SKN);
    part(()=>{for(let k=0;k<5;k++){const x=h.x-7+k*3.2,hh=6+((k*3)%5);poly([[x-2,h.y-r+3],[x+1+(k-2),h.y-r-hh],[x+2.5,h.y-r+3]],YEL,{base:.98,gy:.5})}});
    deco(()=>{box(h.x-1,h.y-2,4,4,STL,{m:3});box(h.x+4,h.y-2,4,4,STL,{m:3});dot(h.x,h.y-1,PUR[4]);dot(h.x+5,h.y-1,PUR[4]);line(h.x-r+1,h.y-1,h.x-1,h.y-1,NV2[1]);line(h.x+2,h.y+r*.55,h.x+6,h.y+r*.5,SKN[0])})},
   front:J=>{const h=J.hF,c=R.cast;part(()=>ell(h.x,h.y,3.6,3.6,STL,{d:1}));glow(h.x,h.y,5+c*5,'#f2e25a',.35+c*.35);bolt(h.x+2,h.y,2+Math.round(c*3),R.i*3+1);bolt(h.x+1,h.y-2,2+Math.round(c*2),R.i*5+2);
    if(c){const r=1+c*3;deco(()=>ell(h.x+6+r,h.y,r,r,[C('#b05aff'),C('#f2e25a'),C('#fffbe0')]))}}
  });
 });
 /* Vilão Titã — montanha de músculos com braços de aço */
 def('rapina:b',R=>{
  biped(R,{leg:21,torsoH:23,shW:12.5,hipW:6.5,headR:7,armL:21,armR:4.8,legR:4.2,hunch:2,stride:5,neck:3,
   skin:SKN,torso:NV,arm:STL,fore:STL,legc:NV2,boot:STL,hand:STL,
   torsoFn:J=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+1,J.hipY+1],[J.hipX-J.hipW-1,J.hipY+1]],NV,{base:.84,gy:.5});ell(J.shX,J.shY+3.5,J.shW,5,NV,{t0:.45,t1:1,d:1})});
    deco(()=>{line(J.shX+1,J.shY+6,J.shX+1,J.hipY-3,NV[1]);for(let k=0;k<3;k++)line(J.shX-4,J.shY+11+k*3.5,J.shX+6,J.shY+11+k*3.5,NV[1]);
     ell(J.shX+1,J.shY+7,3.2,3.2,PUR);dot(J.shX,J.shY+6,C('#f0e0ff'));for(let x=-J.hipW-1;x<=J.hipW+1;x++){set(J.hipX+x,J.hipY-1,STL[3]);set(J.hipX+x,J.hipY,STL[1])}});
    glow(J.shX+1,J.shY+7,6,'#b05aff',.4)},
   head:J=>{face(J,SKN);domino(J);deco(()=>{const h=J.head,r=J.headR;for(let x=-r+1;x<r;x++)if(K.get(Math.round(h.x+x),Math.round(h.y-r+1)))set(h.x+x,h.y-r+1,GRY[1])})},
   armF:J=>part(()=>{const s=J.sF,e=J.eF,h=J.hF;ell(s.x,s.y,5.8,5.4,STL,{d:1});cap(s.x,s.y,e.ex,e.ey,5,4.6,STL);cap(e.ex,e.ey,h.x,h.y,4.8,5.2,STL);ell(h.x+1,h.y,5.8,5.6,STL,{d:1});
    for(let k=0;k<3;k++){dot(lerp(s.x,e.ex,.3+k*.25),lerp(s.y,e.ey,.3+k*.25),PUR[4])}for(let k=-1;k<=1;k++)line(h.x+3,h.y+k*2.4,h.x+6,h.y+k*2.4,STL[0])}),
   armB:J=>part(()=>{const s=J.sB,e=J.eB,h=J.hB;cap(s.x,s.y,e.ex,e.ey,4.8,4.4,STL,{t0:0,t1:.6});cap(e.ex,e.ey,h.x,h.y,4.6,5,STL,{t0:0,t1:.6});ell(h.x+1,h.y,5.4,5.2,STL,{t0:0,t1:.6})})
  });
  if(R.strike)glow(CX+30,GY-36,11,'#b05aff',.3);
 });
 /* Vilão Ladrão — cartola, saco de pilhagem e luva que suga energia */
 def('rapina:e',R=>{
  biped(R,{leg:23,torsoH:16,shW:6.4,hipW:4,headR:7.8,armL:16,armR:2.4,legR:2.6,
   skin:SKN,torso:NV,arm:NV,fore:PUR,legc:NV2,boot:GRY,hand:PUR,
   back:J=>part(()=>{const x=J.shX-J.shW-6,y=J.shY+9+R.bob;ell(x,y,8,9,SACK,{d:1});poly([[x-2,y-9],[x+3,y-9],[x+2,y-13],[x-3,y-12]],SACK,{base:.8});line(x-3,y-9,x+4,y-9,GRY[1]);for(let k=0;k<3;k++)dot(x-3+k*3,y+2+k%2*3,YEL[3])}),
   torsoFn:J=>suit(J),
   head:J=>{const h=J.head,r=J.headR;face(J,SKN);domino(J);
    part(()=>{box(h.x-r-2,h.y-r+1,r*2+5,3,NV2);box(h.x-r+1,h.y-r-8,r*2-1,9,NV2)});deco(()=>{for(let x=-r+1;x<r;x++)set(h.x+x,h.y-r-1,PUR[2])})},
   front:J=>{const h=J.hF,t=R.wind+R.strike;part(()=>ell(h.x,h.y,3.4,3.4,PUR,{d:1}));glow(h.x,h.y,6+t*6,'#b05aff',.4+t*.3);
    for(let k=0;k<5;k++){const a=R.i*.9+k*1.3,d=6+((k*3+R.i)%5)*1.6;deco(()=>dot(h.x+cos(a)*d,h.y+sin(a)*d,PUR[4]))}}
  });
 });
}

/* =====================================================================================================
 * 8 · MALRATH — FROTA SEM BANDEIRA: piratas amaldiçoados; casacos negros, vermelho e ouro velho
 * ===================================================================================================== */
{
 const COAT=ramp('#2c2832'),COAT2=ramp('#1a171e'),RED=ramp('#c0303a'),GLD=ramp('#c9a64a'),SKN=ramp('#b98b66'),STL=ramp('#b8c4d0'),WOOD=ramp('#6a4a32'),WHT=ramp('#d8d2c4'),IRON=ramp('#4a4f5c'),CUR=ramp('#8a3ab8');
 const pFace=(J,o={})=>{const h=J.head,r=J.headR;face(J,SKN);
  deco(()=>{eye(h.x+r*.56,h.y-.5,C('#ffd24a'),'#ffd24a');
   if(o.patch){box(h.x-1,h.y-2,4,4,COAT2,{m:1});line(h.x-r+1,h.y-3,h.x+r,h.y-2,COAT2[1])}else eye(h.x+r*.02,h.y-.5,C('#ffd24a'),'#ffd24a');
   line(h.x+r*.2,h.y+r*.55,h.x+r*.75,h.y+r*.55,SKN[0]);
   if(o.beard){for(let y=0;y<o.beard;y++)for(let x=-r*.55+y*.4;x<=r*.95-y*.3;x++)if(((x+y)&1)===0||y<2)set(h.x+1+x,h.y+r*.5+y,COAT2[y<2?2:1])}
   if(o.scar)line(h.x+r*.5,h.y-4,h.x+r*.8,h.y+3,RED[1])})};
 const stripes=(J)=>deco(()=>{for(let k=0;k<5;k++){const y=Math.round(J.shY+4+k*2.6);for(let x=-J.shW;x<=J.shW;x++)if(K.get(Math.round(J.shX+x),y))set(J.shX+x,y,RED[k%2?1:3])}});
 const sash=(J)=>deco(()=>{for(let x=-J.hipW-1;x<=J.hipW+1;x++){set(J.hipX+x,J.hipY-2,RED[3]);set(J.hipX+x,J.hipY-1,RED[2]);set(J.hipX+x,J.hipY,RED[1])}dot(J.hipX+1,J.hipY-1,GLD[4]);dot(J.hipX+2,J.hipY-1,GLD[2])});
 const shirt=(J,R0=WHT)=>part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+1,J.hipY+1],[J.hipX-J.hipW-1,J.hipY+1]],R0,{base:.84,gy:.5});ell(J.shX,J.shY+2.5,J.shW,3.2,R0,{t0:.45,t1:1})});
 const coat=(J,len=9)=>{part(()=>{poly([[J.shX-J.shW-1,J.shY+1],[J.shX+J.shW+1,J.shY+1],[J.hipX+J.hipW+3,J.hipY+len],[J.hipX-J.hipW-4-J.R.sway*.5,J.hipY+len+1]],COAT,{base:.82,gy:.5});ell(J.shX,J.shY+2.5,J.shW+1,3.4,COAT,{t0:.45,t1:1})});
  deco(()=>{// lapelas vermelhas, botões dourados
   line(J.shX+1,J.shY+2,J.hipX+2,J.hipY+len-2,RED[2]);line(J.shX+2,J.shY+2,J.hipX+3,J.hipY+len-2,RED[1]);for(let k=0;k<4;k++)dot(J.shX+4,J.shY+5+k*3.4,GLD[4]);
   for(let x=-J.shW-1;x<=J.shW+1;x++)if((x&1)===0)set(J.shX+x,J.shY+1,GLD[3])})};

 /* Pirata Sombrio — bandana, tapa-olho, camisa listrada e alfanje */
 def('malrath:g',R=>{
  const a=wA(R,-.7,-2.4,.2);
  biped(R,{leg:21,torsoH:15,shW:6.4,hipW:4,headR:7.8,armL:15,armR:2.5,legR:2.7,
   skin:SKN,torso:WHT,arm:WHT,fore:SKN,legc:COAT,shin:COAT,boot:WOOD,hand:SKN,
   torsoFn:J=>{shirt(J);stripes(J)},belt:J=>sash(J),
   head:J=>{const h=J.head,r=J.headR;pFace(J,{patch:1});
    part(()=>{ell(h.x-1,h.y-r*.45,r+.5,r*.6,RED,{d:1,clip:(x,y)=>y<h.y-1});tube([[h.x-r+1,h.y-2],[h.x-r-5,h.y+1+R.sway*.6],[h.x-r-6,h.y+6+R.sway]],1.8,.8,RED)});
    deco(()=>{for(let k=0;k<3;k++)dot(h.x-4+k*4,h.y-r*.5,RED[4])})},
   weapon:J=>part(()=>sabre(J.hF,a,17,STL,GLD))
  });
  if(R.strike)glow(CX+26,GY-34,8,'#ffffff',.25);
 });
 /* Atirador Pirata — tricórnio, casaco comprido e pistola de pederneira */
 def('malrath:r',R=>{
  biped(R,{leg:22,torsoH:16,shW:6.6,hipW:4,headR:7.8,armL:15,armR:2.5,legR:2.6,
   skin:SKN,torso:COAT,arm:COAT,fore:COAT,legc:COAT2,boot:WOOD,hand:SKN,
   hands:(R,J)=>{if(!R.recoil)J.hF={x:J.sF.x+10+(R.cast?R.cast*3:0),y:J.sF.y+(R.cast?1:5)-(R.rel?2:0)}},
   torsoFn:J=>coat(J,10),belt:J=>sash(J),
   head:J=>{const h=J.head,r=J.headR;pFace(J,{beard:3});
    // tricórnio com debrum dourado
    part(()=>{poly([[h.x-r-5,h.y-r*.35],[h.x-r+1,h.y-r-5],[h.x+r-1,h.y-r-6],[h.x+r+6,h.y-r*.5],[h.x+r+1,h.y-r*.15],[h.x-r,h.y-r*.1]],COAT2,{base:.8,gy:.4})});
    deco(()=>{line(h.x-r-4,h.y-r*.3,h.x+r+5,h.y-r*.45,GLD[3]);dot(h.x+1,h.y-r-2,RED[4]);dot(h.x+2,h.y-r-3,RED[3])})},
   weapon:J=>part(()=>{const h=J.hF,a=R.rel?-.25:0;const [tx,ty]=at(h.x,h.y,a,11);cap(h.x-1,h.y+3,h.x+1,h.y,1.6,1.6,WOOD);cap(h.x,h.y-1,tx,ty-1,1.5,1.2,IRON,{t0:.3,t1:1});box(h.x+1,h.y-3,3,2,GLD)}),
   front:J=>{if(R.cast>.8){const x=J.hF.x+13,y=J.hF.y-1;deco(()=>{ell(x,y,3.4,2.6,[C('#ff7a1e'),C('#ffd24a'),C('#fff6c0')]);for(let k=-1;k<=1;k++)line(x+2,y+k*2,x+6,y+k*3,C('#ffd24a'))});glow(x,y,9,'#ffd24a',.6)}}
  });
 });
 /* Imediato Brutamontes — careca tatuado que usa uma âncora como arma */
 def('malrath:b',R=>{
  const a=wA(R,-.85,-2.6,.3);
  biped(R,{leg:21,torsoH:22,shW:11.5,hipW:6.8,headR:8.6,armL:20,armR:4.4,legR:4.1,hunch:2,stride:5,neck:3,
   skin:SKN,torso:SKN,arm:SKN,fore:SKN,legc:COAT,boot:WOOD,hand:SKN,
   torsoFn:J=>{shirt(J,SKN);part(()=>ell(J.shX+2,J.hipY-6,J.shW*.8,6.5,SKN,{t0:.3,t1:.95}));
    deco(()=>{line(J.shX+1,J.shY+5,J.shX+1,J.hipY-9,SKN[1]);line(J.shX-5,J.shY+8,J.shX+7,J.shY+8,SKN[1]);
     // tatuagem de âncora e cinturão
     line(J.shX+5,J.shY+10,J.shX+5,J.shY+15,CUR[2]);line(J.shX+3,J.shY+14,J.shX+7,J.shY+14,CUR[2]);dot(J.shX+5,J.shY+9,CUR[3]);
     for(let k=0;k<10;k++){const t=k/9;set(lerp(J.shX-J.shW+2,J.hipX+J.hipW,t),lerp(J.shY+3,J.hipY-3,t),WOOD[k%2?3:1])}})},
   belt:J=>{sash(J);deco(()=>box(J.hipX-1,J.hipY-3,5,5,GLD,{m:3}))},
   head:J=>{pFace(J,{beard:6,scar:1});deco(()=>{const h=J.head;dot(h.x-J.headR+1,h.y+2,GLD[4]);dot(h.x-J.headR+1,h.y+3,GLD[2])})},
   weapon:J=>part(()=>{const h=J.hF,[tx,ty]=at(h.x,h.y,a,22),[bx,by]=at(h.x,h.y,a+Math.PI,6),n=a+Math.PI/2;
    cap(bx,by,tx,ty,1.8,1.8,IRON);ell(bx,by,2.6,2.6,IRON);
    // braços da âncora
    const P=[];for(let k=0;k<=8;k++){const u=-1+k/4,q=u*8,d=22-Math.abs(u)*Math.abs(u)*7;P.push([h.x+cos(a)*d+cos(n)*q,h.y+sin(a)*d+sin(n)*q])}tube(P,2.4,2.4,IRON);
    for(const sgn of [-1,1]){const [ex,ey]=[h.x+cos(a)*15+cos(n)*8*sgn,h.y+sin(a)*15+sin(n)*8*sgn];poly([[ex-cos(a)*3,ey-sin(a)*3],[ex+cos(n)*3*sgn,ey+sin(n)*3*sgn],[ex+cos(a)*2,ey+sin(a)*2]],IRON,{base:.95})}
    line(h.x+cos(a)*4+cos(n)*5,h.y+sin(a)*4+sin(n)*5,h.x+cos(a)*4-cos(n)*5,h.y+sin(a)*4-sin(n)*5,WOOD[3],2)})
  });
  if(R.strike)glow(CX+30,GY-30,11,'#d06aff',.28);
 });
 /* Imediato Bombardeiro — capuz, barba e uma bandoleira de bombas; arremessa uma acesa */
 def('malrath:e',R=>{
  const bomb=(x,y,r,lit)=>{part(()=>{ell(x,y,r,r,IRON,{d:1});box(x-1,y-r-2,3,2,GLD)});deco(()=>{dot(x-r*.4,y-r*.4,C('#c8d2e0'));line(x,y-r-2,x+2,y-r-5,WOOD[3])});if(lit){deco(()=>{dot(x+2,y-r-6,C('#fff6c0'));dot(x+3,y-r-6,C('#ffb24a'));dot(x+2,y-r-7,C('#ff7a1e'))});glow(x+2,y-r-6,5,'#ffb24a',.7)}};
  biped(R,{leg:22,torsoH:16,shW:6.8,hipW:4.2,headR:7.8,armL:15,armR:2.6,legR:2.8,
   skin:SKN,torso:COAT,arm:COAT,fore:SKN,legc:COAT2,boot:WOOD,hand:SKN,
   hands:(R,J)=>{if(R.cast)J.hF={x:J.sF.x+2-R.cast*2+(R.rel?12:0),y:J.sF.y-9-R.cast*3+(R.rel?8:0)}},
   torsoFn:J=>{coat(J,7);deco(()=>{for(let k=0;k<9;k++){const t=k/8;set(lerp(J.shX-J.shW+1,J.hipX+J.hipW,t),lerp(J.shY+3,J.hipY-2,t),WOOD[k%2?3:1])}});
    for(let k=0;k<3;k++)bomb(lerp(J.shX-J.shW+3,J.hipX+J.hipW-1,k/2.2),lerp(J.shY+7,J.hipY-1,k/2.2),2.4,false)},
   belt:J=>sash(J),
   head:J=>{hood(J,COAT2,{voidC:'#0e0a10'});const h=J.head,r=J.headR;
    deco(()=>{ell(h.x+2.5,h.y+1,r*.55,r*.6,SKN,{t0:.1,t1:.8});eye(h.x+1,h.y,C('#d06aff'),'#d06aff');eye(h.x+5,h.y,C('#d06aff'),'#d06aff');
     for(let y=0;y<5;y++)for(let x=-2+y*.4;x<=6-y*.3;x++)if(((x+y)&1)===0||y<2)set(h.x+1+x,h.y+3+y,WHT[y<2?2:1])})},
   front:J=>{const h=J.hF;if(!R.rel)bomb(h.x+1,h.y-3,3.6,true)}
  });
 });
}

/* =====================================================================================================
 * 9 · HADRION — EXÉRCITO DOS ESPECTROS: mantos negros, chamas de alma turquesa e ossos pálidos
 * ===================================================================================================== */
{
 const RB=ramp('#1f3038'),RB2=ramp('#121c22'),TL=ramp('#3ad6c8'),BN=ramp('#d8e6e4'),ARM=ramp('#52646e'),GD=ramp('#8a9aa2'),SOUL=[C('#0e5a58'),C('#1fa89e'),C('#4fe6d6'),C('#b8fff6'),C('#f0ffff')];
 const skull=(J,o={})=>{const h=J.head,r=J.headR;
  part(()=>{ell(h.x+1,h.y-.5,r*.82,r*.86,BN,{d:1});ell(h.x+2.5,h.y+r*.62,r*.5,r*.36,BN,{t0:.1,t1:.8})});
  deco(()=>{ell(h.x-.5,h.y-.5,1.9,2.3,[C('#061414'),C('#0a2222')],{flat:.3});ell(h.x+5,h.y-.5,1.9,2.3,[C('#061414'),C('#0a2222')],{flat:.3});dot(h.x,h.y,C('#7affef'));dot(h.x+5.5,h.y,C('#7affef'));
   dot(h.x+2.5,h.y+2,C('#0a2222'));for(let k=0;k<4;k++)dot(h.x+k*1.8,h.y+r*.62,C('#0a2222'));
   if(o.tears){for(let d=0;d<o.tears;d++){dot(h.x-.5,h.y+2+d*1.5,TL[3-(d%2)]);dot(h.x+5,h.y+2+d*1.5,TL[2+(d%2)])}}});
  glow(h.x+2.5,h.y-.5,6,'#4fe6d6',.4)};
 const soulFire=(x,y,hh,i,k=0)=>{part(()=>{poly([[x-2.5,y],[x+sin(i*1.4+k)*1.6,y-hh],[x+2.5,y]],SOUL,{base:.98,gy:.6})},C('#0e5a58'));glow(x,y-hh*.4,hh*1.1,'#4fe6d6',.35)};

 /* Espectro Menor — capuz vazio, mãos de osso e farrapos */
 def('hadrion:g',R=>{
  wraith(R,{hover:7,bodyH:31,shW:6.6,headR:7.8,armL:16,robe:RB,arm:RB,hand:BN,hem:8,hunch:2,
   head:J=>{hood(J,RB,{tip:2,voidC:'#050c0e'});deco(()=>{const h=J.head;eye(h.x+.5,h.y,C('#7affef'),'#4fe6d6');eye(h.x+5,h.y,C('#7affef'),'#4fe6d6')})},
   robeDeco:J=>deco(()=>{for(let k=0;k<3;k++)line(J.shX-4+k*4,J.shY+8,J.hipX-5+k*5,J.baseY-10,RB[1])}),
   front:J=>{glow(J.hipX-8,J.baseY,8,'#3ad6c8',.25);if(R.strike)glow(J.hF.x+3,J.hF.y,7,'#b8fff6',.45)}
  });
 });
 /* Espectro Arqueiro — crânio à mostra, aljava e arco longo de corda turquesa */
 def('hadrion:r',R=>{
  wraith(R,{hover:7,bodyH:33,shW:6.4,headR:7.6,armL:16,robe:RB,arm:RB,hand:BN,hem:7,
   hands:(R,J)=>{J.hF={x:J.sF.x+11,y:J.sF.y+2};J.hB={x:J.sF.x+11-(R.cast?R.cast*11:1),y:J.sF.y+2}},
   back:J=>part(()=>{box(J.shX-J.shW-4,J.shY,4,14,ARM);for(let k=0;k<3;k++)line(J.shX-J.shW-3+k,J.shY-4,J.shX-J.shW-3+k,J.shY,TL[3])}),
   head:J=>{part(()=>{const h=J.head,r=J.headR;ell(h.x-3,h.y+1,r,r+1,RB,{d:1,clip:(x,y)=>x<h.x-1||y>h.y+r*.6})});skull(J)},
   weapon:J=>part(()=>{const h=J.hF,pull=R.cast||0;tube([[h.x-2,h.y-16],[h.x+4,h.y-8],[h.x+3,h.y],[h.x+4,h.y+8],[h.x-2,h.y+16]],1.6,1.6,BN);
    line(h.x-2,h.y-16,J.hB.x,J.hB.y,TL[3]);line(h.x-2,h.y+16,J.hB.x,J.hB.y,TL[3]);
    if(pull){line(J.hB.x,J.hB.y,h.x+9,h.y,BN[3]);poly([[h.x+8,h.y-2],[h.x+13,h.y],[h.x+8,h.y+2]],SOUL,{base:.98})}}),
   front:J=>{if(R.cast)glow(J.hF.x+11,J.hF.y,3+R.cast*5,'#4fe6d6',.6)}
  });
 });
 /* Espectro Guardião — cavaleiro fantasma de elmo coroado, escudo-torre e maça */
 def('hadrion:b',R=>{
  const a=wA(R,-.9,-2.5,.3);
  wraith(R,{hover:5,bodyH:38,shW:11,headR:8.4,armL:19,armR:3.4,robe:RB2,arm:ARM,hand:ARM,hem:12,
   back:J=>part(()=>cloth(J.shX-6,J.shY+2,26,14,RB,R,{ang:2}),undefined),
   robeDeco:J=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.shX+J.shW-2,J.shY+18],[J.shX-J.shW+2,J.shY+18]],ARM,{base:.9,gy:.5,gx:.3})});
    deco(()=>{for(let k=0;k<4;k++)for(let x=-J.shW+2;x<J.shW-1;x++)set(J.shX+x,J.shY+5+k*4,ARM[1]);ell(J.shX+1,J.shY+8,2.6,2.6,TL);dot(J.shX,J.shY+7,C('#f0ffff'))});
    glow(J.shX+1,J.shY+8,6,'#4fe6d6',.4);
    for(const s2 of [-1,1])part(()=>{ell(J.shX+s2*(J.shW+1),J.shY+2,6,4.6,ARM,{d:1});poly([[J.shX+s2*(J.shW+1)-2,J.shY-1],[J.shX+s2*(J.shW+2),J.shY-7],[J.shX+s2*(J.shW+1)+2,J.shY-1]],GD,{base:.95})})},
   head:J=>{const h=J.head,r=J.headR;
    part(()=>{ell(h.x,h.y,r,r,ARM,{d:1});box(h.x-r,h.y+r*.3,r*2+1,3,ARM)});
    // coroa do elmo e fenda do visor em chamas
    part(()=>{for(let k=0;k<4;k++)poly([[h.x-6+k*4-1.5,h.y-r+2],[h.x-6+k*4,h.y-r-5-(k%2)*2],[h.x-6+k*4+1.5,h.y-r+2]],GD,{base:.98})});
    deco(()=>{for(let x=-1;x<=7;x++){set(h.x+x,h.y,C('#061414'));set(h.x+x,h.y+1,C('#061414'))}dot(h.x+1,h.y,C('#7affef'));dot(h.x+5,h.y,C('#7affef'));line(h.x+3,h.y+2,h.x+3,h.y+r*.8,ARM[0])});
    glow(h.x+3,h.y,6,'#4fe6d6',.45)},
   weaponB:J=>part(()=>{const h=J.hB,x=h.x+7,y=h.y-4;poly([[x-6,y-12],[x+6,y-12],[x+6,y+8],[x,y+14],[x-6,y+8]],ARM,{base:.9,gy:.5,gx:.3});poly([[x-3.5,y-9],[x+3.5,y-9],[x+3.5,y+6],[x,y+10],[x-3.5,y+6]],RB,{base:.8});line(x,y-7,x,y+7,TL[3]);line(x-2.5,y-2,x+2.5,y-2,TL[3])}),
   weapon:J=>part(()=>{const h=J.hF,[tx,ty]=at(h.x,h.y,a,19),[bx,by]=at(h.x,h.y,a+Math.PI,5);cap(bx,by,tx,ty,1.5,1.5,GD);ell(tx,ty,4.6,4.6,ARM,{d:1});for(let k=0;k<6;k++){const [px,py]=at(tx,ty,k*TAU/6,6.4);poly([[tx+cos(k*TAU/6+.4)*4,ty+sin(k*TAU/6+.4)*4],[px,py],[tx+cos(k*TAU/6-.4)*4,ty+sin(k*TAU/6-.4)*4]],GD,{base:.95})}}),
   front:J=>{glow(J.hipX-10,J.baseY,10,'#3ad6c8',.25);if(R.strike)glow(CX+30,GY-32,10,'#b8fff6',.3)}
  });
 });
 /* Espectro Chorão — auréola partida, mangas longas, lágrimas de luz e almas que perseguem */
 def('hadrion:e',R=>{
  wraith(R,{hover:8,bodyH:34,shW:6.8,headR:7.8,armL:18,armR:2.6,robe:ramp('#2a4650'),arm:ramp('#2a4650'),hand:BN,hem:9,hunch:3,
   head:J=>{const h=J.head,r=J.headR;
    part(()=>{tube([[h.x-3,h.y-r+2],[h.x-10,h.y+3],[h.x-11,h.y+14+R.sway]],4,1.4,RB2,{t0:0,t1:.7})});
    skull(J,{tears:5+R.i%2});
    // auréola partida
    deco(()=>{for(let k=0;k<12;k++){if(k===3||k===4)continue;const a0=k*TAU/12;dot(h.x+1+cos(a0)*7,h.y-r-4+sin(a0)*2.4,k%2?TL[4]:TL[3])}});glow(h.x+1,h.y-r-4,8,'#4fe6d6',.3)},
   front:J=>{const c=R.cast;for(let k=0;k<3;k++){const a0=R.i*.7+k*TAU/3,x=J.shX+2+cos(a0)*(13+c*5),y=J.shY+6+sin(a0)*6;soulFire(x,y+3,5+c*3,R.i,k)}
    glow(J.hipX-8,J.baseY,8,'#3ad6c8',.25)}
  });
 });
}

/* =====================================================================================================
 * 10 · GÊNESIS — PROLE DO FRASCO: criações de alquimia; pele pálida, preto e ouro, olhos vermelhos
 * ===================================================================================================== */
{
 const PAL=ramp('#e2dccf'),BLK=ramp('#2a2a30'),GLD=ramp('#e6b94a'),RED=ramp('#e0303a'),GLS=ramp('#9fd8d0'),STL=ramp('#7a7f8c'),STL2=ramp('#4a4e5a'),LIQ=[C('#7a1a10'),C('#c43a14'),C('#ff7a2e'),C('#ffc24a')];
 // costuras
 const stitch=(x0,y0,x1,y1)=>deco(()=>{const n=Math.max(2,Math.round(Math.hypot(x1-x0,y1-y0)/2.5));for(let k=0;k<=n;k++){const x=lerp(x0,x1,k/n),y=lerp(y0,y1,k/n);dot(x,y,BLK[1]);if(k%2)dot(x+1,y-1,BLK[2])}});
 const hFace=(J,o={})=>{const h=J.head,r=J.headR;
  part(()=>{ell(h.x-1,h.y-1,r+1.5,r,PAL,{d:1});ell(h.x+2,h.y+r*.6,r*.6,r*.42,PAL,{t0:.2,t1:.85})});
  deco(()=>{ell(h.x+4,h.y,2.6,2.8,[C('#3a0a0e'),C('#5a1016')],{flat:.3});ell(h.x+4.3,h.y,1.8,2,[C('#a01a22'),C('#ff3a3a'),C('#ffb0a0')]);dot(h.x+3.4,h.y-1,C('#ffffff'));
   if(!o.one)eye(h.x-1,h.y,C('#ff3a3a'),'#ff3a3a');line(h.x+1,h.y+r*.62,h.x+6,h.y+r*.62,BLK[1]);for(let k=0;k<3;k++)dot(h.x+2+k*1.5,h.y+r*.62+1,PAL[4])});
  glow(h.x+4.3,h.y,5,'#ff3a3a',.4);stitch(h.x-r*.6,h.y-r*.75,h.x+r*.2,h.y-r*.2)};
 const flask=(x,y,r,o={})=>{part(()=>{ell(x,y,r,r,GLS,{d:1,t0:.3,t1:1});box(x-1.5,y-r-3,3,4,GLS,{m:3})},C('#2a5a58'));deco(()=>{ell(x,y+r*.25,r*.8,r*.62,LIQ,{clip:(xx,yy)=>yy>y-r*.1});dot(x-r*.4,y-r*.45,C('#ffffff'));box(x-2,y-r-4,4,1,GLD,{m:3})});if(o.glow!==false)glow(x,y,r*2,'#ff7a2e',.35)};
 const hBody=(J)=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+1,J.hipY+1],[J.hipX-J.hipW-1,J.hipY+1]],PAL,{base:.84,gy:.5});ell(J.shX,J.shY+2.5,J.shW,3.4,PAL,{t0:.45,t1:1});ell(J.shX+1,J.hipY-4,J.shW*.8,4.6,PAL,{t0:.3,t1:.9})});
  stitch(J.shX-3,J.shY+4,J.shX+4,J.hipY-3);deco(()=>{for(let x=-J.hipW-1;x<=J.hipW+1;x++){set(J.hipX+x,J.hipY-1,BLK[2]);set(J.hipX+x,J.hipY,BLK[1])}dot(J.hipX+1,J.hipY-1,GLD[4])})};

 /* Homúnculo — cabeçudo costurado, corpo franzino e um frasco preso às costas */
 def('genesis:g',R=>{
  biped(R,{leg:17,torsoH:13,shW:5.6,hipW:3.8,headR:9.4,armL:17,armR:2,legR:2.3,hunch:4,headFwd:3,neck:3,
   skin:PAL,torso:PAL,arm:PAL,legc:PAL,boot:BLK,hand:PAL,
   back:J=>{flask(J.shX-J.shW-3,J.shY+7+R.bob,4.6);deco(()=>line(J.shX-J.shW,J.shY+3,J.shX-2,J.shY+2,GLS[1]))},
   torsoFn:J=>hBody(J),
   head:J=>{hFace(J);deco(()=>{const h=J.head;for(let k=0;k<3;k++)line(h.x-4+k*3,h.y-J.headR,h.x-5+k*3,h.y-J.headR-3,BLK[2])})},
   armF:J=>part(()=>{const s=J.sF,e=J.eF,h=J.hF;cap(s.x,s.y,e.ex,e.ey,2.3,2,PAL);cap(e.ex,e.ey,h.x,h.y,2,1.8,PAL);ell(h.x,h.y,2.6,2.6,PAL);for(let k=-1;k<=1;k++){const [tx,ty]=at(h.x,h.y,(R.strike?0:.9)+k*.45,4.5);line(h.x,h.y,tx,ty,PAL[1])}})
  });
 });
 /* Homúnculo Atirador — óculos de proteção e uma seringa enorme que dispara reagente */
 def('genesis:r',R=>{
  biped(R,{leg:19,torsoH:14,shW:5.8,hipW:3.8,headR:8.8,armL:15,armR:2.1,legR:2.4,hunch:2,headFwd:2,neck:2,
   skin:PAL,torso:BLK,arm:BLK,fore:PAL,legc:BLK,boot:BLK,hand:PAL,
   hands:(R,J)=>{if(!R.recoil){J.hF={x:J.sF.x+9,y:J.sF.y+5-R.cast*2};J.hB={x:J.sF.x+2-R.cast*3,y:J.sF.y+6-R.cast*2}}},
   torsoFn:J=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+2,J.hipY+5],[J.hipX-J.hipW-2,J.hipY+5]],BLK,{base:.82,gy:.5});ell(J.shX,J.shY+2.5,J.shW,3.2,BLK,{t0:.45,t1:1})});
    deco(()=>{for(let k=0;k<3;k++)dot(J.shX+2,J.shY+5+k*3.4,GLD[4]);for(let x=-J.shW;x<=J.shW;x++)if((x&1)===0)set(J.shX+x,J.shY+1,GLD[3])})},
   head:J=>{hFace(J,{one:0});const h=J.head;deco(()=>{box(h.x-2,h.y-3,5,5,GLD,{m:3});box(h.x+3,h.y-3,5,5,GLD,{m:3});box(h.x-1,h.y-2,3,3,GLS,{m:3});box(h.x+4,h.y-2,3,3,GLS,{m:3});line(h.x-J.headR,h.y-1,h.x-2,h.y-1,BLK[1])})},
   weapon:J=>part(()=>{const h=J.hF,b=J.hB;
    // seringa: êmbolo, corpo de vidro com líquido e agulha
    cap(b.x-4,b.y,b.x,b.y,1.2,1.2,STL);box(b.x-6,b.y-3,2,6,STL);
    cap(b.x,b.y,h.x+4,h.y,3.4,3.4,GLS,{t0:.3,t1:1});cap(b.x+2+R.cast*4,b.y,h.x+3,h.y,2.2,2.2,LIQ,{t0:.3,t1:1});
    cap(h.x+4,h.y,h.x+7,h.y,2,1.4,STL);line(h.x+7,h.y,h.x+14,h.y,STL[4])}),
   front:J=>{if(R.cast){const x=J.hF.x+15,y=J.hF.y,r=1+R.cast*2.6;deco(()=>ell(x+r*.4,y,r,r,LIQ));glow(x,y,r*3,'#ff7a2e',.6)}}
  });
 });
 /* Armadura Vazia — couraça oca; no peito aberto arde o selo que a mantém de pé */
 def('genesis:b',R=>{
  const a=wA(R,-1.1,-2.5,.2);
  biped(R,{leg:22,torsoH:22,shW:11.5,hipW:6.5,headR:8,armL:20,armR:4,legR:4,stride:5,neck:1,
   skin:STL,torso:STL,arm:STL,fore:STL2,legc:STL2,shin:STL,boot:STL2,hand:STL2,
   torsoFn:J=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+2,J.hipY+1],[J.hipX-J.hipW-2,J.hipY+1]],STL,{base:.86,gy:.5,gx:.3});ell(J.shX,J.shY+3,J.shW,4.5,STL,{t0:.45,t1:1,d:1})});
    // peito aberto, vazio por dentro, com o selo de sangue
    deco(()=>{const cx=J.shX+2,cy=J.shY+11;ell(cx,cy,5.2,6.2,[C('#08080c'),C('#101016')],{flat:.4});
     for(let k=0;k<8;k++){const a0=k*TAU/8;dot(cx+cos(a0)*3.4,cy+sin(a0)*3.4,RED[3])}dot(cx,cy,RED[4]);line(cx-2,cy,cx+2,cy,RED[2]);line(cx,cy-2,cx,cy+2,RED[2]);
     for(let k=0;k<3;k++)for(let x=-J.hipW-1;x<=J.hipW+1;x++)if(K.get(Math.round(J.hipX+x),Math.round(J.hipY-2-k*3)))set(J.hipX+x,J.hipY-2-k*3,STL[1]);
     for(let x=-J.shW+1;x<J.shW;x++)if((x&3)===0)set(J.shX+x,J.shY+3,GLD[3])});
    glow(J.shX+2,J.shY+11,8,'#ff3a3a',.4);
    for(const s2 of [-1,1])part(()=>{ell(J.shX+s2*(J.shW+1),J.shY+2,6.4,5,STL,{d:1});ell(J.shX+s2*(J.shW+1),J.shY+4,5,1.5,GLD,{t0:.3,t1:.9})})},
   head:J=>{const h=J.head,r=J.headR;
    // penacho
    part(()=>tube([[h.x-1,h.y-r+1],[h.x-6,h.y-r-7],[h.x-12,h.y-r-3+R.sway]],3,1,RED,{t0:.2,t1:1}));
    part(()=>{ell(h.x,h.y,r,r,STL,{d:1});poly([[h.x+2,h.y-2],[h.x+r+3,h.y+2],[h.x+2,h.y+r]],STL,{base:.9})});
    deco(()=>{for(let k=0;k<3;k++)line(h.x+3,h.y-1+k*2.2,h.x+r+1,h.y+k*2.2,C('#08080c'));dot(h.x+5,h.y+1,RED[4]);for(let y=-r+1;y<=-1;y++)set(h.x+1,h.y+y,GLD[3])});glow(h.x+5,h.y+1,5,'#ff3a3a',.4)},
   weapon:J=>part(()=>sword(J.hF,a,28,STL,GLD,2.6))
  });
  if(R.strike)glow(CX+30,GY-32,10,'#ffd0a0',.3);
 });
 /* Armadura Alquímica — chapéu de alquimista, cajado e um círculo de transmutação como escudo */
 def('genesis:e',R=>{
  biped(R,{leg:22,torsoH:18,shW:8,hipW:4.6,headR:7.8,armL:16,armR:3,legR:3,
   skin:STL,torso:STL,arm:STL,fore:STL2,legc:STL2,shin:STL,boot:STL2,hand:GLD,
   back:J=>part(()=>cloth(J.shX-5,J.shY+2,22,11,RED,R,{ang:2})),
   torsoFn:J=>{part(()=>{poly([[J.shX-J.shW,J.shY+1],[J.shX+J.shW,J.shY+1],[J.hipX+J.hipW+2,J.hipY+1],[J.hipX-J.hipW-2,J.hipY+1]],STL,{base:.86,gy:.5,gx:.3});ell(J.shX,J.shY+3,J.shW,4,STL,{t0:.45,t1:1})});
    deco(()=>{const cx=J.shX+1,cy=J.shY+8;for(let k=0;k<3;k++){const a0=k*TAU/3-1.57;line(cx+cos(a0)*4,cy+sin(a0)*4,cx+cos(a0+TAU/3)*4,cy+sin(a0+TAU/3)*4,GLD[3])}dot(cx,cy,RED[4]);for(let x=-J.hipW-1;x<=J.hipW+1;x++)set(J.hipX+x,J.hipY-1,GLD[2])});
    for(const s2 of [-1,1])part(()=>ell(J.shX+s2*(J.shW+1),J.shY+2,4.6,3.6,GLD,{d:1}))},
   head:J=>{const h=J.head,r=J.headR;part(()=>{ell(h.x,h.y,r,r,STL,{d:1})});
    deco(()=>{for(let x=-1;x<=7;x++){set(h.x+x,h.y,C('#08080c'));set(h.x+x,h.y+1,C('#08080c'))}dot(h.x+1,h.y,RED[4]);dot(h.x+5,h.y,RED[4]);for(let k=0;k<3;k++)line(h.x+1+k*2,h.y+3,h.x+1+k*2,h.y+r*.8,STL[0])});glow(h.x+3,h.y,5,'#ff3a3a',.4);
    // chapéu pontudo de alquimista
    part(()=>{poly([[h.x-r-5,h.y-r*.5],[h.x+r+6,h.y-r*.5],[h.x+r+3,h.y-r*.15],[h.x-r-2,h.y-r*.15]],BLK,{base:.8});poly([[h.x-r+1,h.y-r*.5],[h.x-2+R.sway,h.y-r-13],[h.x+r-1,h.y-r*.5]],BLK,{base:.85,gy:.5})});
    deco(()=>{for(let x=-r+1;x<r;x++)set(h.x+x,h.y-r*.5-1,GLD[3])})},
   weapon:J=>part(()=>{const h=J.hF,a=-1.4+(R.strike?1.2:0);const [tx,ty]=at(h.x,h.y,a,22),[bx,by]=at(h.x,h.y,a+Math.PI,14);shaft(bx,by,tx,ty,GLD);ell(tx,ty,3.6,3.6,RED,{d:1});for(let k=0;k<4;k++){const [px,py]=at(tx,ty,k*TAU/4+.78,5.5);dot(px,py,GLD[4])}}),
   front:J=>{// círculo de transmutação girando à frente (escudo)
    const cx=J.shX+15,cy=J.shY+9,t=R.i*.5;deco(()=>{for(let k=0;k<20;k++){const a0=k*TAU/20+t;dot(cx+cos(a0)*5.5,cy+sin(a0)*11,k%2?GLD[4]:GLD[2])}for(let k=0;k<3;k++){const a0=t+k*TAU/3,a1=t+(k+1)*TAU/3;line(cx+cos(a0)*4,cy+sin(a0)*8,cx+cos(a1)*4,cy+sin(a1)*8,GLD[3])}});
    glow(cx,cy,13,'#e6b94a',.3);glow(J.hF.x+3,J.hF.y-20,7,'#ff3a3a',.35)}
  });
 });
}
})();
