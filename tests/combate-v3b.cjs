// Melhorias do combate v3: auxílio de mira, feedback, aviso de golpes, anel do Goku, marca do clone, dashes com identidade.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const p=await (await br.newContext({viewport:{width:844,height:390},hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Giovanni');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1400);
 const FIGHT=s=>p.evaluate(s=>{matchMode='1v1';battleActivity='casual';account.champions=[0,1,2,3,4,5,6,7,8,9];account.activeChampion=s;selected=[...CHAMPIONS[s].kit];selected.forEach(i=>{if(!account.owned.includes(i))account.owned.push(i)});account.build=[...selected];start();state='fight';count=0;document.getElementById('countdown').style.display='none';b.skin=4;b.kit=[...CHAMPIONS[4].kit];b.hp=b.max=5000},s);
 await FIGHT(0);await p.waitForTimeout(300);
 // mira
 const m=await p.evaluate(()=>{p.x=300;p.y=300;b.x=600;b.y=300+300*Math.tan(.2);const t=Math.atan2(b.y-p.y,b.x-p.x);const r=aimSelectionV4({index:1,dragged:true,a:0,dx:30,dy:0,stickRadius:44,x:0,y:0});const far=aimSelectionV4({index:1,dragged:true,a:Math.PI,dx:-30,dy:0,stickRadius:44});return{t,a:r.angle,far:far.angle}});
 ok(Math.abs(m.a-m.t)<.04,'arrastar quase na direção do inimigo encaixa a mira nele');
 ok(Math.abs(Math.abs(m.far)-Math.PI)<.05,'arrastar para outro lado não é desviado');
 // esquiva
 const d=await p.evaluate(()=>{texts=[];p.inv=.3;hit(p,50,b,0,0,-1);return texts.some(t=>t.t==='ESQUIVOU!')});
 ok(d,'dash que esquiva um golpe mostra ESQUIVOU!');
 // aviso de golpes
 const tl=await p.evaluate(async()=>{V3B.tele.length=0;p.hp=p.max=5000;b.x=p.x+100;b.y=p.y;let seen=false,list=false;for(let i=0;i<150&&!seen;i++){await new Promise(r=>setTimeout(r,40));b.x=p.x+100;b.y=p.y;if(V3B.tele.length){seen=true;list=integratedDepth().some(e=>e.kind==='v3-tele')}}return{n:seen?1:0,list}});
 ok(tl.n===1&&tl.list,'golpe do inimigo cria aviso no chão');
 // anel do Goku
 const g=await p.evaluate(()=>{reworkState(p).value=40;updateUI();const r=document.querySelector('#equipped .skill[data-arc="0"] .v3-ring');return r&&r.style.getPropertyValue('--pw')});
 ok(g==='0.4','anel do botão 1 mostra o ki do Goku');
 ok(await p.evaluate(()=>{const s=reworkState(p);s.powerT=3;updateUI();return document.getElementById('equipped').classList.contains('v3-power')}),'Modo Poder deixa os botões dourados');
 // Kakashi: marca do clone
 await FIGHT(1);await p.waitForTimeout(300);
 await p.evaluate(()=>{p.cd=p.cd.map(()=>0);cast(p,p.kit[1],0)});
 await p.waitForFunction(()=>V3API.hasClone(p),null,{timeout:4000}).catch(()=>{});
 ok(await p.evaluate(()=>integratedDepth().some(e=>e.kind==='v3-swap')),'clone do Kakashi recebe marca ⇄ 2');
 // dashes
 await FIGHT(6);await p.waitForTimeout(300);
 const h=await p.evaluate(()=>{p.x=400;p.y=300;b.x=440;b.y=300;p.v3dashCD=0;p.cast=0;p.root=0;joy.x=-1;joy.y=0;const x0=b.x;V3API.doDash(p);return b.x-x0});
 ok(h>30,'Herdeiro: dash empurra quem está perto');
 await FIGHT(9);await p.waitForTimeout(300);
 const al=await p.evaluate(()=>{p.v3dashCD=0;p.cast=0;p.root=0;joy.x=1;joy.y=0;const n0=objects.length;V3API.doDash(p);window.__n0=n0;return 0});
 await p.waitForTimeout(900);
 const alN=await p.evaluate(()=>objects.length-window.__n0);
 ok(alN>=1,'Alquimista: dash deixa um bloco de pedra');
 ok(errs.length===0,'sem erros '+errs.slice(0,2));
 await br.close();
})();
