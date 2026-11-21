// Clone de Fumaça inteligente, fratura do Herdeiro, buff do Goku e alcance das ultimates.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const p=await (await br.newContext({viewport:{width:844,height:390},hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8000/index.html?allheroes=1');await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Giovanni');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1500);
 const FIGHT=(s,foe=4)=>p.evaluate(({s,foe})=>{matchMode='1v1';battleActivity='casual';account.champions=[0,1,2,3,4,5,6,7,8,9];account.activeChampion=s;selected=[...CHAMPIONS[s].kit];selected.forEach(i=>{if(!account.owned.includes(i))account.owned.push(i)});account.build=[...selected];start();state='fight';count=0;document.getElementById('countdown').style.display='none';b.skin=foe;b.kit=[...CHAMPIONS[foe].kit];b.cd=b.cd.map(()=>999);b.root=9999;b.hp=b.max=90000;b.inv=0;window.requestAnimationFrame=()=>0},{s,foe});
 /* ---- clone ---- */
 await FIGHT(1);
 const c1=await p.evaluate(()=>{p.cd=p.cd.map(()=>0);p.x=300;p.y=H/2;b.x=700;b.y=H/2;cast(p,p.kit[1],0);for(let i=0;i<70;i++)step(1/60);const c=originalClone(p);return{has:!!c,smart:c?.v3smart,life:c?.life}});
 ok(c1.has&&c1.smart&&c1.life>1e6,'clone nasce inteligente e sem duração limitada');
 const c2=await p.evaluate(()=>{for(let i=0;i<60*14;i++){step(1/60);b.root=9999;b.x=700;b.y=H/2}return{alive:!!originalClone(p)}});
 ok(c2.alive,'clone continua vivo depois de 14 s sem receber golpe');
 // ataca em brecha
 // sincronia: sem o Ninja atacar, o clone não golpeia
 const c3a=await p.evaluate(()=>{const cl=originalClone(p);cl.x=b.x-70;cl.y=b.y;cl.cdB=0;p.v3atkAt=-9;b.actionRecovery=2;b.root=9999;const hp0=b.hp;for(let i=0;i<40;i++){step(1/60);b.actionRecovery=2;b.x=700;b.y=H/2;p.v3atkAt=-9}return{dmg:hp0-b.hp}});
 ok(c3a.dmg===0,'clone em sincronia: não ataca sozinho se o Ninja não usou habilidade');
 const c3=await p.evaluate(()=>{const cl=originalClone(p);p.x=b.x-120;p.y=b.y;cl.off=null;cl.px=p.x;cl.py=p.y;cl.x=p.x+20;cl.y=p.y-85;cl.cdB=0;b.actionRecovery=2;b.root=9999;const hp0=b.hp;p.v3atkSlot=0;p.v3atkAng=Math.atan2(b.y-cl.y,b.x-cl.x);p.v3atkSeq=(p.v3atkSeq||0)+1;for(let i=0;i<40;i++){p.v3atkAt=clock;step(1/60);b.actionRecovery=2;b.x=700;b.y=H/2}return{dmg:hp0-b.hp,alive:!!originalClone(p)}});
 ok(c3.dmg>0&&c3.alive,`o clone repete o golpe do Ninja (dano ${c3.dmg.toFixed(0)}) e não some ao atacar`);
 // dano reduzido: comparar com o golpe do próprio Ninja
 const c4=await p.evaluate(()=>{const cl=originalClone(p);p.x=b.x-120;p.y=b.y;cl.off=null;cl.px=p.x;cl.py=p.y;cl.x=p.x+20;cl.y=p.y-85;cl.cdB=0;b.actionRecovery=2;b.hp=b.max;const hp0=b.hp;p.v3atkSlot=0;p.v3atkAng=Math.atan2(b.y-cl.y,b.x-cl.x);p.v3atkSeq=(p.v3atkSeq||0)+1;cl.seenSeq=p.v3atkSeq-1;for(let i=0;i<30;i++){p.v3atkAt=clock;step(1/60);b.actionRecovery=2;b.x=700;b.y=H/2;if(b.hp<hp0)break}const cd=hp0-b.hp;
  p.x=b.x-70;p.y=b.y;b.hp=b.max;const h1=b.hp;rwRelease(p,{id:p.kit[0],slot:0,age:0,charge:.7,snapshot:100,stage:2,health:p.hp,angle:0,duration:.5,release:.2,target:{x:b.x,y:b.y}});return{clone:cd,own:h1-b.hp}});
 ok(c4.clone>0&&c4.clone<c4.own*.8,`dano do clone é reduzido (${c4.clone.toFixed(0)} contra ${c4.own.toFixed(0)} do Ninja)`);
 // imita: anda junto com o Ninja mantendo o afastamento, olha para onde ele mira e copia a pose de andar
 const c5=await p.evaluate(()=>{const cl=originalClone(p);cl.x=p.x+10;cl.y=p.y-90;cl.off=null;step(1/60);const off0={x:cl.x-p.x,y:cl.y-p.y};const a0={x:cl.x,y:cl.y},p0=p.x;let moveOwner=0;for(let i=0;i<30;i++){p.x+=4;p.moving=true;p.a=0.7;step(1/60)}
  const dx=cl.x-a0.x;moveOwner=p.x-p0;const off1={x:cl.x-p.x,y:cl.y-p.y};return{dx,moveOwner,dOff:Math.hypot(off1.x-off0.x,off1.y-off0.y),face:cl.a,moving:cl.moving}});
 ok(Math.abs(c5.dx-c5.moveOwner)<12&&c5.dOff<12&&Math.abs(c5.face-0.7)<.05&&c5.moving,`o clone anda junto com o Ninja (${c5.dx.toFixed(0)} de ${c5.moveOwner}), mantém o afastamento (variou ${c5.dOff.toFixed(1)}), olha para onde ele mira e copia a pose de andar`);
 // some ao receber golpe
 const c6=await p.evaluate(()=>{const cl=originalClone(p);cl.inv=0;cl.x=500;cl.y=H/2;const r=hit(cl,5,b,0,0,-1);for(let i=0;i<3;i++)step(1/60);return{alive:!!originalClone(p)}});
 ok(!c6.alive,'clone some ao receber qualquer golpe');
 /* ---- Herdeiro ---- */
 await FIGHT(6);
 const h1=await p.evaluate(()=>{const s=reworkState(p);s.value=100;s.arm=0;p.cd=p.cd.map(()=>0);p.cast=0;p.actionRecovery=0;p.skillLock=0;p.root=0;p.hp=p.max;p.x=300;p.y=H/2;b.x=300+190;b.y=H/2;b.hp=b.max=90000;const hp0=p.hp;const r=cast(p,p.kit[5],0);for(let i=0;i<150;i++){step(1/60);b.x=490;b.y=H/2;b.root=9999}
  return{r,hpKept:p.hp>=hp0-1,arm:s.arm,frac:s.fractured,dmg:90000-b.hp,reason:rwResourceReason(p,0),reason5:rwResourceReason(p,5),sym:integratedDepth().some(e=>e.kind==='v3-fratura')}});
 ok(h1.r&&h1.hpKept,'ultimate do Herdeiro não tira vida');
 ok(h1.dmg>0,`ultimate acerta o alvo a 190 de distância (dano ${h1.dmg.toFixed(0)})`);
 ok(h1.arm>3&&h1.arm<=6&&h1.reason==='Fratura'&&h1.reason5==='Fratura','fratura de 6s: ataques com o braço ficam inválidos e a skill mostra "Fratura" ('+h1.arm.toFixed(1)+'s)');
 ok(h1.sym,'símbolo de fratura aparece sobre o personagem');
 const h2=await p.evaluate(()=>{const s=reworkState(p);for(let i=0;i<60*20;i++)step(1/60);return{arm:s.arm}});
 ok(h2.arm===0,'a fratura da ultimate passa depois de 6s');
 const h3=await p.evaluate(()=>{p.cd=p.cd.map(()=>0);p.cast=0;p.actionRecovery=0;p.skillLock=0;b.x=p.x+60;return cast(p,p.kit[1],0)});
 ok(h3===true,'o Chute Relâmpago (sem braço) continua disponível com a fratura');
 /* ---- Caçador: ultimate alcança ~230 ---- */
 await FIGHT(5);
 const k1=await p.evaluate(()=>{const s=reworkState(p);s.value=100;p.cd=p.cd.map(()=>0);p.cast=0;p.actionRecovery=0;p.skillLock=0;p.root=0;p.hp=p.max;p.x=300;p.y=H/2;b.x=300+215;b.y=H/2;b.hp=b.max=90000;cast(p,p.kit[5],0);for(let i=0;i<200;i++){step(1/60);b.x=515;b.y=H/2;b.root=9999}return{dmg:90000-b.hp}});
 ok(k1.dmg>0,`ultimate do Caçador acerta a 215 de distância, perto do fim da explosão (dano ${k1.dmg.toFixed(0)})`);
 /* ---- Goku: buff de 6 s ---- */
 ok(await p.evaluate(()=>V3API.POWER_TIME===6),'Modo Poder do Goku dura 6 s');
 ok(errs.length===0,'sem erros '+errs.slice(0,2));
 await br.close();
})();
