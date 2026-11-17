'use strict';
/*
 * Cenário v41 da tela inicial — arena em camadas (geradas no Canva a partir da arena de batalha):
 * céu · montanhas e templo · muro com lanternas · chão em perspectiva com o emblema · moldura de lanternas e cerejeiras.
 * Animação: céu andando devagar, profundidade (parallax) com o toque/mouse ou um balanço suave, lanternas tremeluzindo,
 * pétalas caindo e pássaros cruzando o céu. Respeita "Animações da tela inicial" desligado (fica parado).
 * Também posiciona o campeão sobre o emblema do chão.
 */
(function(){
const ART='assets/inicio_v41/';
// posições das lanternas (detectadas automaticamente no recorte das camadas — assets/inicio_v41/meta.json)
const LIGHTS={
 muro:[[0.0101,0.5388],[0.2437,0.5397],[0.4786,0.5397],[0.7137,0.5397],[0.9498,0.5396]],
 chao:[[0.0305,0.4726],[0.9644,0.4709]],
 frente:[[0.0756,0.4459],[0.9212,0.4858]]
};
const EMBLEM=[0.5,0.43];   // centro do emblema no chão (fração da imagem)
const motion=()=>{try{return lobbyMotionEnabled()}catch{return true}};
let S=null;

// medidas das camadas (px da imagem original) e frações da altura da tela
const IMG={muro:[1920,531],distante:[1920,526],chao:[1920,1080],frente:[1920,1080]};
const LAYOUT={wallBottom:.6,wallH:.27,farBottom:.585,farH:.46,floorTop:.585,frontH:.86,frontCut:.2,floorSquash:.42,floorCut:.18};
const lamp=(x,y,cls='')=>`<i class="v41-lamp ${cls}" style="left:${x*100}%;top:${y*100}%;--d:${(Math.random()*2).toFixed(2)}s"></i>`;
function mount(ui){
 const sc=ui.querySelector('.v41-scene');if(!sc)return;
 sc.innerHTML=`<div class="v41-box">
  <div class="v41-layer v41-sky" data-depth=".12"><img src="${ART}ceu.webp?v=1" alt="" draggable="false"></div>
  <div class="v41-layer v41-far" data-depth=".3"></div>
  <div class="v41-floor-wrap" data-depth=".75"><div class="v41-floor"><img src="${ART}chao.webp?v=1" alt="" draggable="false">${LIGHTS.chao.map(([x,y])=>lamp(x,y)).join('')}<i class="v41-mark" style="left:${EMBLEM[0]*100}%;top:${EMBLEM[1]*100}%"></i></div></div>
  <div class="v41-layer v41-wall" data-depth=".55"></div>
  <canvas class="v41-fx"></canvas>
  <div class="v41-layer v41-front v41-front-l" data-depth="1.2">${LIGHTS.frente.filter(l=>l[0]<.5).map(([x,y])=>lamp(x/LAYOUT.frontCut,y)).join('')}</div>
  <div class="v41-layer v41-front v41-front-r" data-depth="1.2">${LIGHTS.frente.filter(l=>l[0]>.5).map(([x,y])=>lamp((x-(1-LAYOUT.frontCut))/LAYOUT.frontCut,y)).join('')}</div>
 </div>`;
 if(S)S.stop();
 S=start(ui,sc);
}
function start(ui,sc){
 const box=sc.querySelector('.v41-box'),layers=[...sc.querySelectorAll('.v41-layer,.v41-floor-wrap')],fx=sc.querySelector('.v41-fx'),g=fx.getContext('2d');
 let raf=0,alive=true,px=0,py=0,tx=0,ty=0,W=0,H=0,last=performance.now();
 const petals=[],birds=[];
 function fit(){
  W=ui.clientWidth;H=ui.clientHeight;if(!W||!H)return;const L=LAYOUT,E=40;   // medidas sem o zoom da tela (ui_escala)   // E: sobra lateral para o parallax
  box.style.cssText=`left:${-E}px;top:0;width:${W+2*E}px;height:${H}px`;
  const wallH=H*L.wallH,wallW=wallH*IMG.muro[0]/IMG.muro[1],wall=sc.querySelector('.v41-wall');
  wall.style.cssText+=`;top:${H*L.wallBottom-wallH}px;height:${wallH}px;background-size:${wallW}px ${wallH}px`;
  // lanternas do muro, repetidas a cada ladrilho do muro
  const n=Math.ceil((W+2*E)/wallW)+2,off=((W+2*E)/2-wallW/2)%wallW-wallW;
  wall.innerHTML=Array.from({length:n},(_,k)=>LIGHTS.muro.map(([x,y])=>`<i class="v41-lamp" style="left:${off+k*wallW+x*wallW}px;top:${y*100}%;--d:${((k*5+x*7)%2).toFixed(2)}s"></i>`).join('')).join('');
  wall.style.backgroundPosition=`${off}px 0`;
  const farH=H*L.farH,far=sc.querySelector('.v41-far');far.style.cssText+=`;top:${H*L.farBottom-farH}px;height:${farH}px;background-size:auto ${farH}px`;
  const fw=Math.max(W*1.25,H*1.9),floorWrap=sc.querySelector('.v41-floor-wrap');
  const imgH=fw*IMG.chao[1]/IMG.chao[0],SQ=L.floorSquash,CUT=L.floorCut;
  floorWrap.style.cssText=`left:${(W+2*E-fw)/2}px;top:${H*L.floorTop-CUT*imgH*SQ}px;width:${fw}px;height:${imgH*SQ}px`;
  sc.querySelector('.v41-floor').style.transform=`scaleY(${SQ})`;
  const fh=H*L.frontH,fwid=fh*IMG.frente[0]/IMG.frente[1]*L.frontCut;
  for(const el of sc.querySelectorAll('.v41-front')){el.style.cssText+=`;top:${H-fh}px;height:${fh}px;width:${fwid}px;background-size:auto ${fh}px`}
  const dpr=Math.min(2,devicePixelRatio||1);fx.width=Math.round((W+2*E)*dpr);fx.height=Math.round(H*dpr);g.setTransform(dpr,0,0,dpr,0,0);
  placeHero();
 }
 function placeHero(){
  const mark=sc.querySelector('.v41-mark'),stage=ui.querySelector('.v41-stage');if(!mark||!stage)return;
  const m=mark.getBoundingClientRect(),u=ui.getBoundingClientRect(),k=u.width/(ui.clientWidth||u.width)||1;
  stage.style.left=(m.left+m.width/2-u.left)/k+'px';stage.style.top=(m.top+m.height/2-u.top)/k+'px';
 }
 const onMove=e=>{const r=ui.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*2;ty=((e.clientY-r.top)/r.height-.5)*2};
 ui.addEventListener('pointermove',onMove,{passive:true});
 const onTilt=e=>{if(e.gamma==null)return;tx=Math.max(-1,Math.min(1,e.gamma/25));ty=Math.max(-1,Math.min(1,(e.beta-45)/25))};
 addEventListener('deviceorientation',onTilt,{passive:true});
 const ro=new ResizeObserver(fit);ro.observe(ui);fit();setTimeout(placeHero,60);
 // imagens carregadas mudam o tamanho do chão: reposiciona o campeão
 sc.querySelectorAll('img').forEach(im=>{if(!im.complete)im.addEventListener('load',()=>{placeHero()},{once:true})});
 function spawnPetal(init){const bw=box.clientWidth,bh=box.clientHeight;petals.push({x:Math.random()*bw*1.2-bw*.1,y:init?Math.random()*bh:-12,s:3+Math.random()*4,vx:14+Math.random()*22,vy:18+Math.random()*24,a:Math.random()*6.28,va:(Math.random()-.5)*3,w:Math.random()*6.28})}
 for(let i=0;i<26;i++)spawnPetal(true);
 function spawnBirds(){const bh=box.clientHeight,y=bh*(.08+Math.random()*.18),dir=Math.random()<.5?1:-1,n=3+Math.floor(Math.random()*4),x0=dir>0?-40:box.clientWidth+40;for(let i=0;i<n;i++)birds.push({x:x0-dir*i*18,y:y+(i%2?8:-4)*i*.6,vx:dir*(38+Math.random()*10),f:Math.random()*6.28,s:.8+Math.random()*.4})}
 let nextBirds=1.5;
 function frame(t){
  if(!alive)return;raf=requestAnimationFrame(frame);
  if(!ui.isConnected||ui.closest('[hidden]')||document.hidden){return}
  const dt=Math.min(.05,(t-last)/1000);last=t;
  const mv=motion();
  if(mv){
   const idle=Math.sin(t/2600)*.35;   // balanço suave quando ninguém mexe
   px+=((tx||idle)-px)*Math.min(1,dt*3);py+=((ty||0)-py)*Math.min(1,dt*3);
  }
  for(const L of layers){const d=+L.dataset.depth||0;L.style.transform=`translate3d(${(-px*14*d).toFixed(2)}px,${(-py*6*d).toFixed(2)}px,0)`}
  const sky=layers[0];if(sky&&mv){sky.firstChild.style.transform=`translateX(${(Math.sin(t/14000)*1.6).toFixed(3)}%) scale(1.05)`}
  // efeitos
  const bw=box.clientWidth,bh=box.clientHeight;g.clearRect(0,0,bw,bh);
  if(!mv){return}
  nextBirds-=dt;if(nextBirds<=0){spawnBirds();nextBirds=7+Math.random()*8}
  g.strokeStyle='rgba(40,30,70,.7)';g.lineWidth=1.6;g.lineCap='round';
  for(let i=birds.length-1;i>=0;i--){const b=birds[i];b.x+=b.vx*dt;b.f+=dt*9;const w=6*b.s,fl=Math.sin(b.f)*3*b.s;
   g.beginPath();g.moveTo(b.x-w,b.y-fl);g.quadraticCurveTo(b.x-w*.4,b.y-fl*.2-2,b.x,b.y);g.quadraticCurveTo(b.x+w*.4,b.y-fl*.2-2,b.x+w,b.y-fl);g.stroke();
   if(b.x<-60||b.x>bw+60)birds.splice(i,1)}
  for(let i=petals.length-1;i>=0;i--){const p=petals[i];p.w+=dt*1.6;p.x+=(p.vx+Math.sin(p.w)*16)*dt;p.y+=p.vy*dt;p.a+=p.va*dt;
   g.save();g.translate(p.x-px*10,p.y);g.rotate(p.a);g.scale(1,.55+.45*Math.sin(p.w*2));g.fillStyle='rgba(255,182,206,.92)';g.beginPath();g.ellipse(0,0,p.s,p.s*.6,0,0,6.283);g.fill();g.fillStyle='rgba(255,226,236,.9)';g.beginPath();g.ellipse(-p.s*.3,-p.s*.15,p.s*.35,p.s*.2,0,0,6.283);g.fill();g.restore();
   if(p.y>bh+12||p.x>bw+20){petals.splice(i,1);spawnPetal(false)}}
 }
 raf=requestAnimationFrame(frame);
 return{stop(){alive=false;cancelAnimationFrame(raf);ro.disconnect();removeEventListener('deviceorientation',onTilt)},placeHero,fit,get petals(){return petals.length}};
}
window.CenaV41={mount,get state(){return S},LIGHTS,EMBLEM};
})();
