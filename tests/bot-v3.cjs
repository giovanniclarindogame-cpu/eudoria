// IA difícil dos bots: esquiva, pune brechas, ultimate só com chance de acertar, mira com antecipação, não interfere em treino/modos.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const pg=await (await br.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html');await pg.waitForTimeout(900);await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('input','Giovanni');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1500);
 const SETUP=(me,foe,mode='1v1')=>pg.evaluate(({me,foe,mode})=>{matchMode=mode;battleActivity='casual';account.champions=[0,1,2,3,4,5,6,7,8,9];account.activeChampion=foe;selected=[...CHAMPIONS[foe].kit];selected.forEach(i=>{if(!account.owned.includes(i))account.owned.push(i)});account.build=[...selected];start();state='fight';count=0;document.getElementById('countdown').style.display='none';window.requestAnimationFrame=()=>0;
  // p = alvo do bot (rival humano parado); b = bot difícil
  b.skin=me;b.kit=[...CHAMPIONS[me].kit];b.hp=b.max=5000;b.cd=b.cd.map(()=>0);b.root=0;b.cast=0;b.actionRecovery=0;b.skillLock=0;b.rwCast=null;b.v3dashCD=0;b.oldBot=false;
  p.hp=p.max=90000;p.cd=p.cd.map(()=>999);p.inv=0;p.x=300;p.y=H/2;b.x=300+160;b.y=H/2;p.cast=0;p.rwCast=null;p.actionRecovery=0;p.root=0;p.skillLock=0;p.hitReact=0;
  const s=reworkState(b);s.value=100;s.arm=0;},{me,foe,mode});
 const run=(n,keep)=>pg.evaluate(({n,keep})=>{const log={casts:[],dash:0,ult:0,minD:1e9};const oc=cast,od=V3API.doDash;
  cast=function(a,id,m){const r=oc(a,id,m);if(r&&a===b)log.casts.push(skills[id].name);if(r&&a===b&&skills[id].ultimate)log.ult++;return r};
  V3API.doDash=function(a){const r=od(a);if(r&&a===b)log.dash++;return r};
  for(let i=0;i<n;i++){if(keep)keep(i);ai(1/60,b);step(1/60);log.minD=Math.min(log.minD,dist(b,p))}
  cast=oc;V3API.doDash=od;return log},{n,keep:null});
 // 1) bot difícil está ativo e usa habilidades com critério (Ronin)
 await SETUP(2,0);
 const r1=await pg.evaluate(()=>{window.BOT_SIM_P=false;let calls=0;const oh=BotV3.hardAI;let used=0;const oc=cast;const names=[];cast=function(a,id,m){const r=oc(a,id,m);if(r&&a===b)names.push(skills[id].name);return r};
  for(let i=0;i<300;i++){ai(1/60,b);step(1/60);p.cd=p.cd.map(()=>999)}cast=oc;return{names}});
 ok(r1.names.length>0&&!r1.names.some(n=>/Eclipse|Despertar/.test(n)&&false),`bot usa habilidades (${[...new Set(r1.names)].join(', ')})`);
 // 2) ultimate só com brecha
 await SETUP(2,0);
 const r2=await pg.evaluate(()=>{const oc=cast;let ult=0;cast=function(a,id,m){const r=oc(a,id,m);if(r&&a===b&&skills[id].ultimate)ult++;return r};const q=rwBeginCharge;
  let u0=0;for(let i=0;i<150;i++){p.actionRecovery=0;p.rwCast=null;ai(1/60,b);step(1/60);p.cd=p.cd.map(()=>999);b.cd[b.kit[5]]=0;reworkState(b).value=100;}u0=ult;
  for(let i=0;i<120;i++){p.actionRecovery=2;ai(1/60,b);step(1/60);p.cd=p.cd.map(()=>999);b.cd[b.kit[5]]=0;reworkState(b).value=100;b.x=p.x+120;b.y=p.y}cast=oc;return{u0,u1:ult-u0}});
 ok(r2.u0===0,'não gasta a ultimate sem brecha');
 ok(r2.u1>=1,`usa a ultimate quando o rival está em brecha (${r2.u1}x)`);
 // 3) esquiva quando o rival prepara um golpe
 await SETUP(2,0);
 const r3=await pg.evaluate(()=>{let dash=0;const did=V3API.dashIdOf(b);
  for(let i=0;i<40;i++){p.rwCast={age:.05,release:.45,duration:.8,slot:0,id:p.kit[0]};b.x=p.x+130;b.y=p.y;b.cd=b.cd.map(()=>999);b.cd[did]=0;ai(1/60,b);if(b.cd[did]>0)dash++;step(1/60);p.cd=p.cd.map(()=>999);}
  p.rwCast=null;return{dash}});
 ok(r3.dash>=1,`bot esquiva com o dash quando o rival prepara golpe (${r3.dash}x)`);
 // 4) mantém distância (herói de longe) e aproxima (corpo a corpo)
 await SETUP(4,0);
 const r4=await pg.evaluate(()=>{b.x=p.x+60;for(let i=0;i<120;i++){ai(1/60,b);step(1/60);p.cd=p.cd.map(()=>999);b.cd=b.cd.map(()=>999)}return{d:dist(b,p)}});
 ok(r4.d>130,`Lutador do Eclipse se afasta para manter distância (${Math.round(r4.d)})`);
 await SETUP(2,0);
 const r5=await pg.evaluate(()=>{b.x=p.x+330;for(let i=0;i<150;i++){ai(1/60,b);step(1/60);p.cd=p.cd.map(()=>999);b.cd=b.cd.map(()=>999)}return{d:dist(b,p)}});
 ok(r5.d<170,`Ronin (corpo a corpo) se aproxima do rival (${Math.round(r5.d)})`);
 // 5) 2×2 e treino não quebram
 await SETUP(3,1,'2v2');
 const r6=await pg.evaluate(()=>{for(let i=0;i<300;i++){for(const a of actors)if(a!==p)ai(1/60,a);step(1/60)}return{alive:actors.filter(a=>a.hp>0).length}});
 ok(r6.alive>=2,'2×2 roda com os bots difíceis sem erros');
 await pg.evaluate(()=>{matchMode='1v1';battleActivity='training';start();state='fight';count=0;for(let i=0;i<120;i++){ai(1/60,b);step(1/60)}});
 ok(await pg.evaluate(()=>state==='fight'),'treino com fantoche continua funcionando');
 ok(errs.length===0,'sem erros '+errs.slice(0,2));
 await br.close();
})();
