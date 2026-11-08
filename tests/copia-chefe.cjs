// Kakashi (Ninja das Brumas) copia a habilidade do chefe com o Olho Copiador e a usa com o botão 5.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const b=await chromium.launch();
 for(const boss of ['zorvath','vhalor','kuroen']){
  const ctx=await b.newContext({viewport:{width:844,height:390},reducedMotion:'reduce'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://localhost:8000/index.html?boss=${boss}`);await p.waitForTimeout(700);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1400);
    await p.evaluate(()=>{beginArenaMode('guardian')});await p.waitForTimeout(500);await p.evaluate(()=>document.querySelector('[data-hunt-start]').click());await p.waitForTimeout(4600);
  await p.evaluate(()=>{p.skin=1;p.kit=[...CHAMPIONS[1].kit]});
  // abre o olho e faz o chefe usar a habilidade s0 acertando o jogador
  await p.evaluate(()=>{const s=reworkState(p);s.eye=6;s.copy=null;p.inv=0;p.hp=p.max=3000;p.guard=false;(huntQA.state.def.generic?huntQA.forceG:huntQA.force)('s0')});
  await p.evaluate(()=>{const R=huntQA.state;const a=R.a;p.x=a.x+40;p.y=a.y;});
  await p.waitForTimeout(2500);
  let copied=await p.evaluate(()=>{const c=reworkState(p).copy;return c?{id:c.id,name:skills[c.id].name}:null});
  if(!copied){ // garante o cenário: acerto direto durante a habilidade
   await p.evaluate(()=>{const R=huntQA.state;const s=reworkState(p);s.eye=6;R.act={id:'s0',t:0};BossCopy.landed(R,p)});
   copied=await p.evaluate(()=>{const c=reworkState(p).copy;return c?{id:c.id,name:skills[c.id].name}:null});
  }
  ok(copied&&copied.id.startsWith('boss:'),`${boss}: com o olho aberto, a habilidade do chefe é copiada (${copied&&copied.name})`);
  ok(await p.evaluate(()=>reworkState(p).eye===0),`${boss}: o olho se fecha depois de copiar`);
  const label=await p.evaluate(()=>document.querySelector('#equipped').children[4]?.getAttribute('aria-label'));
  await p.evaluate(()=>updateUI());
  ok(/cópia/i.test(await p.evaluate(()=>document.querySelector('#equipped').children[4]?.getAttribute('aria-label')||'')),`${boss}: o botão 5 vira "Usar cópia"`);
  const hp0=await p.evaluate(()=>{const R=huntQA.state;R.a.inv=0;R.shield=0;R.a.hp=R.a.max;return R.a.hp});
  let after;
  for(let i=0;i<4;i++){
   await p.evaluate(()=>{const R=huntQA.state;if(R.def.mech?.immune?.(R))return;const a=R.a;a.inv=0;R.shield=0;p.x=a.x-110;p.y=a.y;p.a=0;p.cd[p.kit[4]]=0;const s=reworkState(p);if(!s.copy)s.copy={id:BossCopy.key(R.def,R.def.skills.find(x=>x.id==='s0'))};rwCast(p,p.kit[4],true)});
   await p.waitForTimeout(1600);
   after=await p.evaluate(()=>{const R=huntQA.state;return{hp:R.a.hp,copy:reworkState(p).copy}});
   if(after.hp<hp0)break;
  }
  ok(after.copy===null,`${boss}: usar o 5 gasta a cópia`);
  ok(after.hp<hp0,`${boss}: a habilidade copiada causa dano no chefe (${Math.round(hp0-after.hp)})`);
  ok(errs.length===0,`${boss}: sem erros de JavaScript ${errs.join('|')}`);
  await ctx.close();
 }
 await b.close();
})();
