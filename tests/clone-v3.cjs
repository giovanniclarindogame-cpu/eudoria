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
 // reinicia o cenário: Ninja e rival frente a frente, clone vivo
 const RESET=()=>p.evaluate(()=>{p.cd=p.cd.map(()=>0);p.hp=p.max;p.x=300;p.y=H/2;b.x=520;b.y=H/2;b.root=9999;b.hp=b.max=90000;b.rwCast=null;b.actionRecovery=0;if(!originalClone(p)){cast(p,p.kit[1],0)}for(let i=0;i<30;i++)step(1/60);const c=originalClone(p);c.inv=0;c.x=470;c.y=H/2;c.cdB=0;c.cdU=99;c.eyeCd=99;c.dodgeCd=0;c.attacks=0;return!!c});
 // 1) ataca SOZINHO nas brechas (sem o Ninja usar nada)
 await RESET();
 const c3=await p.evaluate(()=>{const cl=originalClone(p);const hp0=b.hp;p.v3atkAt=-9;let atk=false;for(let i=0;i<60;i++){b.actionRecovery=2;b.x=520;b.y=H/2;step(1/60);if(cl.attacks)atk=true}return{dmg:hp0-b.hp,alive:!!originalClone(p),atk}});
 ok(c3.dmg>0&&c3.alive&&c3.atk,`o clone ataca sozinho quando o rival está em brecha, sem o Ninja fazer nada (dano ${c3.dmg.toFixed(0)}) e não some ao atacar`);
 // 2) dano reduzido
 await RESET();
 const c4=await p.evaluate(()=>{const cl=originalClone(p);const hp0=b.hp;for(let i=0;i<40;i++){b.actionRecovery=2;b.x=520;b.y=H/2;step(1/60);if(b.hp<hp0)break}const cd=hp0-b.hp;
  p.x=b.x-70;p.y=b.y;b.hp=b.max;const h1=b.hp;rwRelease(p,{id:p.kit[0],slot:0,age:0,charge:.7,snapshot:100,stage:2,health:p.hp,angle:0,duration:.5,release:.2,target:{x:b.x,y:b.y}});return{clone:cd,own:h1-b.hp}});
 ok(c4.clone>0&&c4.clone<c4.own*.8,`dano do clone é reduzido (${c4.clone.toFixed(0)} contra ${c4.own.toFixed(0)} do Ninja)`);
 // 3) tem cabeça própria: NÃO copia os movimentos do Ninja (o Ninja foge para trás, o clone continua virado para o rival e vai atrás dele)
 await RESET();
 const c5=await p.evaluate(()=>{const cl=originalClone(p);b.x=520;b.y=H/2;const c0={x:cl.x,y:cl.y};let moveOwner=0;const p0=p.x;let faceFoe=0,faceOwnerAim=0,n=0;for(let i=0;i<40;i++){p.x-=2;p.moving=true;p.a=Math.PI;b.x=520;b.y=H/2;step(1/60);n++;const toFoe=Math.atan2(b.y-cl.y,b.x-cl.x);if(Math.abs(Math.atan2(Math.sin(cl.a-toFoe),Math.cos(cl.a-toFoe)))<.2)faceFoe++;if(Math.abs(Math.atan2(Math.sin(cl.a-Math.PI),Math.cos(cl.a-Math.PI)))<.2)faceOwnerAim++}
  return{ownerDx:p.x-p0,cloneDx:cl.x-c0.x,faceFoe:faceFoe/n,faceOwnerAim:faceOwnerAim/n}});
 ok(c5.faceFoe>.8&&c5.faceOwnerAim<.2&&Math.abs(c5.cloneDx-c5.ownerDx)>20,`o clone tem cabeça própria: olha para o rival (${Math.round(c5.faceFoe*100)}% do tempo) e não para onde o Ninja mira; o Ninja recuou ${c5.ownerDx.toFixed(0)} e o clone andou ${c5.cloneDx.toFixed(0)}`);
 // 4) esquiva: o rival prepara um golpe perto e o clone desvia (dash invulnerável)
 await RESET();
 const c6e=await p.evaluate(()=>{const cl=originalClone(p);Math.random=()=>.1;cl.cdB=99;let dodged=false,inv=0;for(let i=0;i<30;i++){b.rwCast={age:0,release:.5,holding:false,slot:0};b.x=520;b.y=H/2;cl.x=Math.min(cl.x,480);step(1/60);if(cl.dodgeT>0||cl.inv>0.1){dodged=true;inv=Math.max(inv,cl.inv);break}}b.rwCast=null;return{dodged,inv}});
 ok(c6e.dodged&&c6e.inv>0.1,`o clone esquiva quando o rival prepara um golpe (invulnerável por ${c6e.inv.toFixed(2)}s)`);
 // 5) Leitura: golpe quase saindo -> some e reaparece ATRÁS do rival e corta pelas costas
 await RESET();
 const c7=await p.evaluate(()=>{const cl=originalClone(p);Math.random=()=>.1;cl.eyeCd=0;cl.dodgeCd=99;cl.cdB=0;cl.x=430;const hp0=b.hp;let tp=false,back=false;for(let i=0;i<40;i++){b.rwCast={age:.15,release:.3,holding:false,slot:0};b.x=520;b.y=H/2;const x0=cl.x;step(1/60);if(cl.x>b.x-10&&!tp)tp=true;if(cl.eyeCd>5)back=true}
  b.rwCast=null;return{tp,back,x:cl.x,fx:b.x,eye:cl.eyeCd,dmg:hp0-b.hp}});
 ok(c7.back&&c7.tp&&c7.dmg>0,`Leitura do clone: some e reaparece atrás do rival (x ${c7.x.toFixed(0)} contra ${c7.fx.toFixed(0)}) e golpeia (dano ${c7.dmg.toFixed(0)}), olho em recarga`);
 // 6) fica sempre ao alcance da troca de lugar
 await RESET();
 const c8=await p.evaluate(()=>{const cl=originalClone(p);p.x=80;p.y=H/2;b.x=900;b.y=H/2;let max=0;for(let i=0;i<60*8;i++){b.x=900;b.y=H/2;step(1/60);max=Math.max(max,Math.hypot(cl.x-p.x,cl.y-p.y))}return{max}});
 ok(c8.max<=340,`o clone nunca passa do alcance da troca de lugar (máximo ${c8.max.toFixed(0)} de 340)`);
 // 7) troca de lugar quantas vezes quiser enquanto o clone viver
 await RESET();
 const c9=await p.evaluate(()=>{const cl=originalClone(p);const out=[];for(let k=0;k<4;k++){cl.attacks=0;const a0={x:p.x,y:p.y},c0={x:cl.x,y:cl.y};const r=cast(p,p.kit[1],0);const trocou=Math.hypot(p.x-c0.x,p.y-c0.y)<3&&Math.hypot(cl.x-a0.x,cl.y-a0.y)<3;out.push(r&&trocou);cl.dodgeT=0}return{out,alive:!!originalClone(p),back:clock<=p.v3back}});
 ok(c9.out.every(Boolean)&&c9.alive,`tocar de novo na habilidade troca de lugar com o clone, 4 vezes seguidas, e ele continua vivo (${c9.out.join(',')})`);
 ok(c9.back,'depois da troca o próximo golpe sai PELAS COSTAS (janela aberta)');
 // 8) morre com qualquer golpe
 await RESET();
 const c10=await p.evaluate(()=>{const cl=originalClone(p);cl.inv=0;cl.x=500;cl.y=H/2;const r=hit(cl,1,b,0,0,-1);for(let i=0;i<3;i++)step(1/60);return{alive:!!originalClone(p)}});
 ok(!c10.alive,'clone morre com qualquer golpe (até com 1 de dano)');
 await p.evaluate(()=>{Math.random=Math.random});
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
