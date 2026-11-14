// Marcas passivas por herói: Ronin e Caçador acumulam marcas, estados de Solar/Herdeiro/Corsário/Cavaleiro, Alquimista perto de blocos, texto no detalhe.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const p=await (await br.newContext({viewport:{width:844,height:390},hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Giovanni');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1500);
 const FIGHT=s=>p.evaluate(s=>{matchMode='1v1';battleActivity='casual';account.champions=[0,1,2,3,4,5,6,7,8,9];account.activeChampion=s;selected=[...CHAMPIONS[s].kit];selected.forEach(i=>{if(!account.owned.includes(i))account.owned.push(i)});account.build=[...selected];start();state='fight';count=0;document.getElementById('countdown').style.display='none';b.skin=0;b.kit=[...CHAMPIONS[0].kit];b.cd=b.cd.map(()=>999);b.root=999;b.hp=b.max=100000;b.inv=0;b.x=p.x+70;b.y=p.y},s);
 // texto no detalhe
 for(let i=0;i<10;i++){const t=await p.evaluate(i=>{openChampionDetails(i);const e=document.querySelector('#heroDetail .v3-marca-txt');const r=e?e.textContent:'';closeHeroDetail();return r},i);ok(/Marca ·/.test(t),`herói ${i}: detalhe mostra a marca (${t.slice(8,40)})`)}
 // Ronin: marcas e bônus de dano; levar dano zera
 await FIGHT(2);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const dmg=()=>{const h=b.hp;hit(b,100,p,0,0,p.kit[0]);return h-b.hp};const base=dmg();for(let i=0;i<4;i++)dmg();const five=p.v3m;const bonus=dmg();const before=p.v3m;hit(p,10,b,0,0,-1);return{base,five,bonus,before,after:p.v3m}});
 ok(r.five===5||r.before===5,`Ronin: cortes seguidos acumulam 5 marcas (${r.five})`);
 ok(r.bonus>r.base*1.2,`Ronin: marcas aumentam o dano (${r.base.toFixed(0)} → ${r.bonus.toFixed(0)})`);
 ok(r.after===0,'Ronin: levar dano zera as marcas');
 // Caçador: presa marcada
 await FIGHT(5);await p.waitForTimeout(300);
 const g=await p.evaluate(()=>{const dmg=()=>{const h=b.hp;hit(b,100,p,0,0,p.kit[1]);return h-b.hp};const a1=dmg(),a2=dmg(),a3=dmg(),a4=dmg();return{a1,a2,a3,a4,n:p.v3f.n}});
 ok(g.n===3&&g.a4>g.a1*1.2,`Caçador: mesmo alvo acumula marcas (${g.a1.toFixed(0)} → ${g.a4.toFixed(0)})`);
 // estados
 for(const [id,th,name] of [[3,80,'Solar'],[6,60,'Herdeiro'],[7,70,'Corsário'],[8,70,'Cavaleiro']]){
  await FIGHT(id);await p.waitForTimeout(300);
  const s=await p.evaluate(({th})=>{const st=reworkState(p);st.value=th-5;step(1/60);const off=MarcasV3.stateOn(p);const v0=identitySpeed(p);st.value=th+5;st.lastGain=clock;step(1/60);const on=MarcasV3.stateOn(p);return{off,on,gain:p.v3on}},{th});
  ok(!s.off&&s.on&&s.gain,`${name}: marca liga com recurso em ${th} ou mais`);
 }
 await FIGHT(6);await p.waitForTimeout(300);
 const hs=await p.evaluate(()=>{const st=reworkState(p);st.value=30;st.lastGain=clock;const a=identitySpeed(p);st.value=80;st.lastGain=clock;const b2=identitySpeed(p);return{a,b2}});
 ok(hs.b2>hs.a*1.15,'Herdeiro: Sobrecarga alta dá +20% de velocidade');
 // Cavaleiro: menos dano recebido
 await FIGHT(8);await p.waitForTimeout(300);
 const cv=await p.evaluate(()=>{p.hp=p.max=5000;p.inv=0;const dmg=()=>{const h=p.hp;hit(p,100,b,0,0,-1);return h-p.hp};reworkState(p).value=10;const a=dmg();reworkState(p).value=90;reworkState(p).lastGain=clock;const c=dmg();return{a,c}});
 ok(cv.c<cv.a*.9,`Cavaleiro: com Cosmo alto recebe menos dano (${cv.a.toFixed(0)} → ${cv.c.toFixed(0)})`);
 // Alquimista: terreno amigo
 await FIGHT(9);await p.waitForTimeout(300);
 const al=await p.evaluate(()=>{p.hp=p.max=5000;p.inv=0;const dmg=()=>{const h=p.hp;hit(p,100,b,0,0,-1);return h-p.hp};objects.length=0;b.x=p.x+300;const a=dmg();const blk=rwCreateBlock(p,p.x-55,p.y,false,0);const near=MarcasV3.nearOwnBlocks(p);const c=dmg();return{a,c,near,made:!!blk}});
 ok(al.near&&al.c<al.a*.9,`Alquimista: perto dos blocos recebe menos dano (${al.a.toFixed(0)} → ${al.c.toFixed(0)})`);
 // rival: Eclipse mantém distância
 await FIGHT(0);await p.waitForTimeout(300);
 const kit=await p.evaluate(()=>{b.skin=4;b.kit=[...CHAMPIONS[4].kit];b.cd=b.cd.map(()=>999);b.root=0;b.x=p.x+60;b.y=p.y;const d0=dist(b,p);for(let i=0;i<60;i++){ai(1/60,b);step(1/60)}return{d0,d1:dist(b,p)}});
 ok(kit.d1>kit.d0+15,`rival Eclipse recua para manter distância (${kit.d0.toFixed(0)} → ${kit.d1.toFixed(0)})`);
 ok(errs.length===0,'sem erros '+errs.slice(0,2));
 await br.close();
})();
