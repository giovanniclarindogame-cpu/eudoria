// HUD v3: barras sobre os lutadores, borda vermelha com pouca vida, analógico flutuante, cartões nos cantos.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const p=await (await br.newContext({viewport:{width:844,height:390},hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1400);
 await p.evaluate(()=>{matchMode='1v1';start();state='fight';count=0;document.getElementById('countdown').style.display='none'});await p.waitForTimeout(600);
 const d=await p.evaluate(()=>{const l=integratedDepth().filter(e=>e.kind==='v3-bar').length;const r=s=>document.querySelector(s).getBoundingClientRect();const me=r('.hud .fighterhud:not(.enemy)'),en=r('.hud .fighterhud.enemy'),mid=r('.hud .mid-hud');return{bars:l,meRight:me.right,enLeft:en.left,midL:mid.left,midR:mid.right,iw:innerWidth,meL:me.left,enR:en.right,hudH:Math.max(me.bottom,en.bottom)}});
 ok(d.bars===2,'barra de vida desenhada sobre os 2 lutadores');
 ok(d.meL<=24&&d.enR>=d.iw-24&&d.meRight<d.midL&&d.enLeft>d.midR,'cartões nos cantos opostos e tempo no meio, sem se sobrepor');
 ok(d.hudH<90,`HUD ocupa pouco espaço (${Math.round(d.hudH)}px)`);
 ok(await p.evaluate(()=>!document.getElementById('lowHpFx').classList.contains('on')),'sem alerta com vida cheia');
 await p.evaluate(()=>{p.hp=p.max*.2;updateUI()});
 ok(await p.evaluate(()=>document.getElementById('lowHpFx').classList.contains('on')&&getComputedStyle(document.getElementById('lowHpFx')).animationName==='lowHp'),'com 25% ou menos as bordas piscam em vermelho');
 await p.evaluate(()=>{p.hp=p.max;updateUI()});
 ok(await p.evaluate(()=>!document.getElementById('lowHpFx').classList.contains('on')),'alerta some ao recuperar vida');
 // analógico flutuante
 const home=await p.evaluate(()=>{const r=document.getElementById('stick').getBoundingClientRect();return[r.left,r.top]});
 await p.evaluate(()=>{const t=document.getElementById('arena');for(const type of ['pointerdown']){t.dispatchEvent(new PointerEvent(type,{pointerId:7,pointerType:'touch',clientX:200,clientY:150,bubbles:true,cancelable:true}))}});
 const fl=await p.evaluate(()=>{const s=document.getElementById('stick'),r=s.getBoundingClientRect();return{cx:r.left+r.width/2,cy:r.top+r.height/2,floating:s.classList.contains('floating'),id:stickID}});
 ok(fl.floating&&Math.abs(fl.cx-200)<3&&Math.abs(fl.cy-150)<3&&fl.id===7,'tocar na esquerda cria o analógico onde o dedo tocou');
 await p.evaluate(()=>{document.getElementById('stick').dispatchEvent(new PointerEvent('pointermove',{pointerId:7,pointerType:'touch',clientX:240,clientY:150,bubbles:true}))});
 ok(await p.evaluate(()=>joy.x>.9&&Math.abs(joy.y)<.2),'arrastar move o personagem');
 await p.evaluate(()=>{document.getElementById('stick').dispatchEvent(new PointerEvent('pointerup',{pointerId:7,pointerType:'touch',bubbles:true}))});await p.waitForTimeout(100);
 const back=await p.evaluate(()=>{const r=document.getElementById('stick').getBoundingClientRect();return[r.left,r.top,joy.x,stickID]});
 ok(Math.abs(back[0]-home[0])<2&&Math.abs(back[1]-home[1])<2&&back[2]===0&&back[3]===null,'ao soltar, o desenho volta ao lugar fixo e o movimento para');
 await p.evaluate(()=>{document.getElementById('arena').dispatchEvent(new PointerEvent('pointerdown',{pointerId:8,pointerType:'touch',clientX:700,clientY:150,bubbles:true,cancelable:true}))});
 ok(await p.evaluate(()=>stickID===null),'tocar no lado direito não cria analógico');
 await p.screenshot({path:'/tmp/claude-0/s/hud.png'});
 ok(errs.length===0,'sem erros '+errs.slice(0,2));
 await br.close();
})();
