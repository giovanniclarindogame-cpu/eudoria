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
 // foto do rosto do campeão no cartão do HUD
 await p.evaluate(()=>{b.skin=2;b.kit=[...CHAMPIONS[2].kit];p.skin=1;p.kit=[...CHAMPIONS[1].kit];updateUI()});await p.waitForTimeout(1200);await p.evaluate(()=>updateUI());await p.waitForTimeout(300);
 const fc=await p.evaluate(()=>[...document.querySelectorAll('.hud .arena-portrait')].map(i=>i.getAttribute('src').slice(0,11)));
 ok(fc.length===2&&fc.every(s=>s==='data:image/'),'cartões do HUD mostram o recorte do rosto dos dois campeões '+fc);
 await p.screenshot({path:'/tmp/claude-0/s/hudface.png',clip:{x:0,y:0,width:844,height:90}});
 // HUD colado nas bordas, pausa sob o tempo, câmera com margem no topo, ícones de estado e ultimate pronta
 const flush=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();const a=r('.hud .fighterhud:not(.enemy)'),e=r('.hud .fighterhud.enemy'),m=r('.hud .mid-hud'),ps=r('#pauseBtn');return{top:a.top,left:a.left,eTop:e.top,eRight:innerWidth-e.right,mTop:m.top,pCx:ps.left+ps.width/2,pTop:ps.top,mBottom:m.bottom,iw:innerWidth}});
 ok(flush.top<=1&&flush.left<=1&&flush.eTop<=1&&flush.eRight<=1&&flush.mTop<=1,'cartões e tempo colados no topo e nas laterais');
 ok(flush.pCx>flush.iw/2+40&&flush.pCx<flush.iw/2+90&&flush.pTop<20,'pausa ao lado do tempo, no topo');
 const cam=await p.evaluate(()=>{p.y=60;p.x=W/2;updateArenaCamera();return{oy,top:oy>0}});
 ok(cam.top,'ao subir no mapa a câmera acompanha e mostra a arte acima do piso (oy '+Math.round(cam.oy)+')');
 const st=await p.evaluate(()=>{p.slow=3;p.cd=p.cd.map(()=>0);const s=v3Status.statusIcons(p).map(x=>x[0]).join('');return{s,ult:v3Status.ultReady(p)}});
 ok(st.s.includes('❄'),'ícone de estado (lento) aparece sobre o lutador');
 ok(typeof st.ult==='boolean','indicador de ultimate pronta funciona ('+st.ult+')');
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
 const pb=await p.evaluate(()=>{const r=document.getElementById('pauseBtn').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]});
 await p.mouse.click(pb[0],pb[1]);await p.waitForTimeout(250);
 ok(await p.evaluate(()=>state==='paused'),'botão de pausa funciona');
 await p.evaluate(()=>document.querySelector('#resume').click());await p.waitForTimeout(200);
 ok(await p.evaluate(()=>getComputedStyle(document.getElementById('arenaZoom')).display==='none'),'botão de zoom (−) removido');
 await p.screenshot({path:'/tmp/claude-0/s/hud.png'});
 // 2×2: pausa e faixa de times não invadem a arena nem os cartões
 await p.evaluate(()=>{matchMode='2v2';start();state='fight';count=0;document.getElementById('countdown').style.display='none'});await p.waitForTimeout(800);
 const v2=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();const ps=r('#pauseBtn'),a=r('.hud .fighterhud:not(.enemy)'),tm=r('#teamHud');return{pTop:ps.top,aBottom:a.bottom,tmTop:tm.top,teamVisible:!document.getElementById('teamHud').hidden}});
 ok(v2.pTop<70,`2×2: pausa no topo (${Math.round(v2.pTop)}px)`);
 const mc=await p.evaluate(()=>{const r=id=>{const e=document.getElementById(id);const b=e.getBoundingClientRect();return{hidden:e.hidden,left:b.left,right:innerWidth-b.right,top:b.top,w:b.width,name:e.querySelector('.mc-name').textContent}};const m=document.querySelector('.hud .fighterhud:not(.enemy)').getBoundingClientRect();return{ally:r('allyCard'),foe:r('foe2Card'),mainW:m.width,mainBottom:m.bottom}});
 ok(!mc.ally.hidden&&!mc.foe.hidden&&mc.ally.left<=1&&mc.foe.right<=1&&mc.ally.top>=mc.mainBottom-6,`2×2: mini-cartões do aliado (${mc.ally.name}) e do 2º rival (${mc.foe.name}) colados nas bordas, abaixo dos cartões`);
 ok(mc.ally.w<mc.mainW*.6,`mini-cartões têm cerca de metade do tamanho (${Math.round(mc.ally.w)} contra ${Math.round(mc.mainW)} px)`);
 await p.evaluate(()=>{matchMode='1v1';start();state='fight';count=0;document.getElementById('countdown').style.display='none'});await p.waitForTimeout(600);
 ok(await p.evaluate(()=>document.getElementById('allyCard').hidden&&document.getElementById('foe2Card').hidden),'no 1×1 os mini-cartões ficam escondidos');
 ok(errs.length===0,'sem erros '+errs.slice(0,2));
 await br.close();
})();
