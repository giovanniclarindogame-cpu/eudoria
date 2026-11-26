// Tela de pausa no padrão azul e dourado do jogo (duelo e treino com o fantoche): cabe na tela, botões na ordem certa, nada cortado.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [modo,vw,vh] of [['treino',915,412],['treino',667,375],['duelo',915,412],['duelo',667,375]]){
  const p=await (await b.newContext({viewport:{width:vw,height:vh}})).newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
  await p.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent('ws://localhost:1'));await p.waitForTimeout(900);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
  await p.evaluate(m=>{matchMode='1v1';battleActivity=m==='treino'?'training':'duel';account.activeChampion=2;selected=[...CHAMPIONS[2].kit];start()},modo);
  await p.waitForFunction(()=>state==='count'||state==='fight',null,{timeout:25000});await p.evaluate(()=>{state='fight';count=0;document.querySelector('#intro73')?.remove()});await p.waitForTimeout(600);
  await p.click('#pauseBtn');await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const d=document.querySelector('#pause .dialog'),a=d.getBoundingClientRect(),cs=getComputedStyle(d);
   const ordem=[...d.querySelectorAll(':scope>button')].sort((x,y)=>(+getComputedStyle(x).order)-(+getComputedStyle(y).order)).map(x=>x.id||'fs');
   const bt=[...d.querySelectorAll('button')].filter(x=>x.offsetParent).map(x=>x.getBoundingClientRect());
   return{dentro:a.top>=0&&a.bottom<=innerHeight&&a.left>=0&&a.right<=innerWidth,borda:cs.borderTopColor,fundo:cs.backgroundImage.slice(0,22),ordem:ordem.join('>'),botoesOk:bt.every(x=>x.top>=a.top&&x.bottom<=a.bottom&&x.left>=a.left&&x.right<=a.right),h:Math.round(a.height),
    painel:!!document.querySelector('#trainingPause:not([hidden])')}});
  const tag=`${modo} ${vw}x${vh}`;
  ok(r.dentro&&r.botoesOk,`${tag}: a pausa cabe na tela e os botões ficam dentro do cartão (altura ${r.h})`);
  ok(/255, 212, 90/.test(r.borda)&&/radial-gradient/.test(r.fundo),`${tag}: cartão azul com borda dourada`);
  ok(r.ordem==='resume>c73Btn>vfxQuality>howTo>leave>fs','ordem dos botões: '+r.ordem);
  ok(r.painel===(modo==='treino'),`${tag}: painel "Ajustes do treino" ${modo==='treino'?'aparece':'não aparece'}`);
  await p.close()}
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2).join('|'));await b.close()})();
