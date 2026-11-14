// Fim de luta: K.O. em câmera lenta, queda, VOCÊ VENCEU/PERDEU e depois o resumo; pausa numa tela só.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const p=await (await br.newContext({viewport:{width:844,height:390},hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Giovanni');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1500);
 const go=(s,act='casual')=>p.evaluate(({s,act})=>{matchMode='1v1';battleActivity=act;account.champions=[0,1,2,3,4,5,6,7,8,9];account.activeChampion=s;selected=[...CHAMPIONS[s].kit];selected.forEach(i=>{if(!account.owned.includes(i))account.owned.push(i)});account.build=[...selected];start();state='fight';count=0;document.getElementById('countdown').style.display='none'},{s,act});
 // vitória
 await go(0);await p.waitForTimeout(500);
 await p.evaluate(()=>{b.cd=b.cd.map(()=>999);b.root=999;b.x=p.x+60;b.y=p.y;b.hp=2;b.inv=0;hit(b,50,p,0,0,-1)});
 await p.waitForTimeout(300);
 const a=await p.evaluate(()=>({seq:!!KoV3.seq,speed:dojoSpeed,state,txt:document.querySelector('#koBanner .ko-txt').textContent,vis:!document.getElementById('koBanner').hidden,out:getComputedStyle(document.getElementById('outcome')).display}));
 ok(a.seq&&a.speed<.5&&a.state==='fight'&&a.txt==='K.O.'&&a.vis&&a.out==='none','K.O.: câmera lenta, banner K.O. e o resumo ainda não aparece');
 await p.waitForTimeout(2300);
 const f=await p.evaluate(()=>({frame:v3KoFrame(b),age:b.koAge,speed:dojoSpeed,txt:document.querySelector('#koBanner .ko-txt').textContent}));
 ok(f.frame===33&&f.age>.4&&f.speed===1,'o derrotado terminou caído no chão e a velocidade voltou ao normal');
 ok(f.txt==='VOCÊ VENCEU','banner de vitória: '+f.txt);
 await p.waitForTimeout(2200);
 const e=await p.evaluate(()=>({state,out:getComputedStyle(document.getElementById('outcome')).display,ban:document.getElementById('koBanner').hidden,title:document.getElementById('resultTitle').textContent}));
 ok(e.state==='end'&&e.out==='flex'&&e.ban,'depois do banner aparece o resumo da partida ('+e.title+')');
 // derrota
 await go(1);await p.waitForTimeout(500);
 await p.evaluate(()=>{p.hp=2;p.inv=0;b.cd=b.cd.map(()=>999);b.root=999;hit(p,60,b,0,0,-1)});
 await p.waitForTimeout(3600);
 ok(await p.evaluate(()=>document.querySelector('#koBanner .ko-txt').textContent==='VOCÊ PERDEU'),'banner de derrota');
 // queda animada
 ok(await p.evaluate(()=>{const f=[];p.koAge=0.05;f.push(v3KoFrame(p));p.koAge=.2;f.push(v3KoFrame(p));p.koAge=.6;f.push(v3KoFrame(p));return f.join()==='30,32,33'}),'sequência de queda: reação, queda, caído');
 // tempo esgotado vai direto ao resumo
 await go(0);await p.waitForTimeout(400);
 await p.evaluate(()=>{time=0.05});await p.waitForTimeout(600);
 ok(await p.evaluate(()=>state==='end'&&!KoV3.seq),'tempo esgotado: sem K.O., vai direto ao resumo');
 // treino não tem K.O.
 await go(0,'training');await p.waitForTimeout(400);
 await p.evaluate(()=>{b.hp=1;hit(b,50,p,0,0,-1)});await p.waitForTimeout(500);
 ok(await p.evaluate(()=>!KoV3.seq&&state!=='end'),'no treino o K.O. não é acionado');
 // pausa numa tela só
 for(const act of ['casual','training']){
  await go(0,act);await p.waitForTimeout(400);await p.evaluate(()=>togglePause());await p.waitForTimeout(300);
  const m=await p.evaluate(()=>{const d=document.querySelector('#pause .dialog'),r=d.getBoundingClientRect();return{fits:r.top>=0&&r.bottom<=innerHeight,noScroll:d.scrollHeight<=d.clientHeight+1}});
  ok(m.fits&&m.noScroll,`pausa (${act}) cabe na tela sem rolagem`);
  await p.evaluate(()=>togglePause());
 }
 await go(0);await p.waitForTimeout(400);await p.evaluate(()=>{time=0.01});await p.waitForTimeout(800);
 const oc=await p.evaluate(()=>{const d=document.querySelector('#outcome .dialog'),r=d.getBoundingClientRect();return{fits:r.top>=0&&r.bottom<=innerHeight,noScroll:d.scrollHeight<=d.clientHeight+1}});
 ok(oc.fits&&oc.noScroll,'resultado da partida cabe na tela sem rolagem');
 ok(errs.length===0,'sem erros '+errs.slice(0,2));
 await br.close();
})();
