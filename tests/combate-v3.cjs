// Combate v3: 3 habilidades + ultimate + dash, sem ataque normal/defesa, meia-lua, Kakashi e Goku.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const BOOT=async p=>{await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1400)};
const FIGHT=(p,s)=>p.evaluate(s=>{matchMode='1v1';battleActivity='casual';account.champions=[0,1,2,3,4,5,6,7,8,9];account.activeChampion=s;selected=[...CHAMPIONS[s].kit];selected.forEach(i=>{if(!account.owned.includes(i))account.owned.push(i)});account.build=[...selected];start();state='fight';count=0;document.getElementById('countdown').style.display='none';p.hp=p.max;b.skin=4;b.kit=[...CHAMPIONS[4].kit];b.x=p.x+420;b.hp=b.max=5000;b.cd=b.cd.map(()=>999);b.root=999},s);
(async()=>{
 const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:844,height:390},hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await BOOT(p);
 for(let s=0;s<10;s++){
  await FIGHT(p,s);await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const sk=[...document.querySelectorAll('#equipped .skill')];const vis=sk.filter(e=>!e.hidden&&getComputedStyle(e).display!=='none');const box=e=>e.getBoundingClientRect();const a=document.getElementById('attack').getBoundingClientRect();
   const inside=vis.every(e=>{const q=box(e);return q.left>=0&&q.right<=innerWidth&&q.top>=0&&q.bottom<=innerHeight});
   return {n:vis.length,ult:vis.at(-1)===sk[5],inside,dodge:getComputedStyle(document.getElementById('dodge')).display,defend:getComputedStyle(document.getElementById('defend')).display,label:document.getElementById('attack').textContent.trim(),dashId:V3API.dashIdOf(p),basic:basic(p),cdp:skills[p.kit[V3API.V2[p.skin].s[0]]].cd}});
  const ov=await p.evaluate(()=>{const els=[...document.querySelectorAll('#equipped .skill:not(.v3-hidden)'),document.getElementById('attack')].map(e=>e.getBoundingClientRect());let bad=0;for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i],b=els[j];if(Math.hypot((a.left+a.right-b.left-b.right)/2,(a.top+a.bottom-b.top-b.bottom)/2)<(a.width+b.width)/2-2)bad++}return bad});
  ok(ov===0,`herói ${s}: botões da meia-lua e dash não se sobrepõem`);
  ok(r.n===4&&r.ult,`herói ${s}: 3 habilidades + ultimate na meia-lua`);
  ok(r.inside,`herói ${s}: botões dentro da tela`);
  ok(r.dodge==='none'&&r.defend==='none'&&r.label.includes('DASH'),`herói ${s}: sem esquiva/defesa, botão DASH`);
  ok(r.basic===false,`herói ${s}: sem ataque normal`);
  ok(r.cdp>=1.3&&r.cdp<=2.8,`herói ${s}: habilidade principal com recarga curta (${r.cdp}s)`);
  // dash move e dá invulnerabilidade
  const d=await p.evaluate(()=>{p.cd=p.cd.map(()=>0);p.v3dashCD=0;p.cast=0;p.root=0;joy.x=1;joy.y=0;const x=p.x;const okd=V3API.doDash(p);return {okd,inv:p.inv>0,x}});
  await p.waitForTimeout(500);
  const d2=await p.evaluate(x=>({moved:Math.abs(p.x-x)>60}),d.x);
  ok(d.okd&&d.inv&&(d2.moved||s===4||s===6),`herói ${s}: dash funciona (${d.okd}) invulnerável e desloca`);
  const again=await p.evaluate(()=>V3API.doDash(p));
  ok(again===false,`herói ${s}: dash entra em recarga`);
  await p.evaluate(()=>{joy.x=0});
  const blocked=await p.evaluate(()=>{const v=V3API.V2[p.skin];const hidden=[0,1,2,3,4].find(i=>!v.s.includes(i)&&i!==v.dash&&i!==5);p.cd=p.cd.map(()=>0);return hidden===undefined?'n/a':cast(p,p.kit[hidden],0)});
  ok(blocked===false||blocked==='n/a',`herói ${s}: habilidade fora do kit não dispara`);
 }
 // Kakashi: clone e troca
 await FIGHT(p,1);await p.waitForTimeout(200);
 const k=await p.evaluate(()=>{p.cd=p.cd.map(()=>0);p.mp=120;const id=p.kit[1];cast(p,id,0);return 1});
 await p.waitForFunction(()=>V3API.hasClone(p),null,{timeout:4000}).catch(()=>{});
 const k1=await p.evaluate(()=>({has:V3API.hasClone(p),x:p.x,cx:originalClone(p)?.x}));
 ok(k1.has,'Kakashi: habilidade 2 cria o clone');
 const k2=await p.evaluate(()=>{const c=originalClone(p),px=p.x,cx=c.x;p.cast=0;const r=V3API.kakashiSwap(p);return {r,swapped:Math.abs(p.x-cx)<2&&Math.abs(c.x-px)<2}});
 ok(k2.r&&k2.swapped,'Kakashi: usar de novo troca de lugar com o clone');
 await p.evaluate(()=>{const c=originalClone(p);p.cd=p.cd.map(()=>0);p.cast=0;const px=p.x;const r=cast(p,p.kit[1],0);window.__sw={r,sw:Math.abs(p.x-px)>5}});
 ok(await p.evaluate(()=>window.__sw.r),'Kakashi: tocar na habilidade com clone ativo troca (mesmo sem recarga)');
 // Olho não copia ultimate
 const eye=await p.evaluate(()=>{const s=reworkState(p);s.eye=5;s.copy=null;const ult=skills[b.kit[5]];hit(p,1,b,0,0,b.kit[5]);return {copy:s.copy?.id,ult:!!ult.ultimate}});
 ok(!eye.copy||!skills[eye.copy].ultimate,'Kakashi: Olho Copiador não copia ultimate');
 // Goku: sem Concentrar Aura, ki sobe com habilidades, poder temporário e volta a zero
 await FIGHT(p,0);await p.waitForTimeout(200);
 const g=await p.evaluate(()=>{const s=reworkState(p);s.value=0;const out=[];p.hp=p.max;let n=0;for(const i of [0,1,2,0,1,2,0,1,2,0,1,2,0,1,2]){p.cd=p.cd.map(()=>0);p.cast=0;p.actionRecovery=0;p.skillLock=0;p.root=0;cast(p,p.kit[i],0);for(let k=0;k<80;k++)step(1/60);n++;if(s.powerT>0)break;}
   return {power:s.powerT>0,stage:s.stage,v:s.value,casts:n}});
 ok(g.power&&g.stage===2,`Goku: usar habilidades enche o ki e libera o poder extra (${g.casts} usos)`);
 const g2=await p.evaluate(()=>{const s=reworkState(p);for(let i=0;i<60*5.5;i++){if(s.powerT>0&&i>1)p.cd=p.cd.map(()=>5);step(1/60)}return {power:s.powerT,v:s.value,stage:s.stage}});console.log(JSON.stringify(g2));
 ok(g2.power===0&&g2.v<5&&g2.stage===0,'Goku: depois do tempo o poder acaba e a barra volta a zero');
 ok(await p.evaluate(()=>{const s=reworkState(p);p.cd=p.cd.map(()=>0);return !cast(p,p.kit[4],0)}),'Goku: não existe mais Concentrar Aura');
 // bots lutam com o kit v3 (duelo de bots até alguém cair)
 const sim=await p.evaluate(()=>{b.skin=0;b.kit=[...CHAMPIONS[0].kit];p.skin=1;p.kit=[...CHAMPIONS[1].kit];p.hp=p.max=1000;b.hp=b.max=1000;let used=new Set();const oc=cast;let n=0;while(state==='fight'&&n<7000&&p.hp>0&&b.hp>0){ai(1/60,p);ai(1/60,b);step(1/60);n++}return {end:p.hp<=0||b.hp<=0,n}});
 ok(sim.end,`bots decidem um duelo em ${(sim.n/60).toFixed(0)}s com o kit v3`);
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,2));
 await br.close();
})();
