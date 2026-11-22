// Celular: a tela de Campeões rola com o dedo começando em QUALQUER lugar (em cima de um cartão, entre cartões, na borda).
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();
 for(const [w,h] of [[915,412],[1000,450],[844,390],[667,375]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,hasTouch:true,isMobile:true});const p=await ctx.newPage();const cdp=await ctx.newCDPSession(p);
  await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('sem tela cheia no teste'));Element.prototype.webkitRequestFullscreen=undefined});   // o jogo pede tela cheia ao entrar; no teste isso encolhe a janela para 800 px e os toques além disso caem fora
  await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(900);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
  await p.evaluate(()=>showScreen('library'));await p.waitForTimeout(1200);
  await p.evaluate(()=>{const b=document.querySelector('[data-tut-go]');if(b){let e=b;while(e.parentElement&&getComputedStyle(e).position!=='fixed')e=e.parentElement;e.style.display='none'}});await p.waitForTimeout(300);
  const pos=()=>p.evaluate(()=>Math.round(document.querySelector('#selection').scrollTop));
  const arrasta=async(x,y,dy)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+dy*i/10}]});await new Promise(r=>setTimeout(r,16))}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await new Promise(r=>setTimeout(r,400))};
  const alvos=await p.evaluate(()=>{const c=[...document.querySelectorAll('#selection .hero-card')].slice(0,5).map(e=>e.getBoundingClientRect());const c0=c[0],c1=c[1];
   return{arte:[c0.left+c0.width/2,c0.top+60],nome:[c1.left+c1.width/2,c1.bottom-18],entre:[(c0.right+c1.left)/2,c0.top+80],borda:[12,c0.top+80],ultimo:[c[4].left+c[4].width/2,c[4].top+60]}});
  for(const [nome,desc] of [['arte','em cima da imagem de um cartão'],['nome','em cima do nome de um cartão'],['entre','entre dois cartões'],['borda','na borda da tela'],['ultimo','em cima do último cartão da fileira']]){
   await p.evaluate(()=>{document.querySelector('#selection').scrollTop=0});await p.waitForTimeout(150);
   const [x,y]=alvos[nome];await arrasta(x,y,-150);const d=await pos();ok(d>60,`${w}x${h}: rola com o dedo começando ${desc} (rolou ${d}px)`);
  }
  // tocar (sem arrastar) num cartão ainda abre o campeão
  await p.evaluate(()=>{document.querySelector('#selection').scrollTop=0});await p.waitForTimeout(150);
  await p.touchscreen.tap(alvos.arte[0],alvos.arte[1]);await p.waitForTimeout(600);
  ok(await p.evaluate(()=>!!document.querySelector('#heroDetail,.hero-detail')&&!(document.querySelector('#detailDialog')?.hidden??false)||detailChampion!==null),`${w}x${h}: um toque rápido no cartão ainda abre o campeão`);
  await ctx.close();
 }
 await b.close()})();
