// Os 9 chefes da Caçada do Dia (além do Zorvath): lobby, 6 habilidades, mecânica própria, fase 2 e vitória.
// Uso: node tests/chefes.cjs [id ...]   (sem argumentos testa todos). Requer Playwright e servidor: python3 -m http.server 8000
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const IDS=['vhalor','kuroen','nyxar','ryoku','xerath','rapina','malrath','hadrion','genesis'];
const only=process.argv.slice(2);
(async()=>{
 const b=await chromium.launch();
 // o cartão da tela inicial cabe em qualquer tamanho, com qualquer chefe
 for(const id of (only.length?only:IDS)){
  for(const [w,h] of [[667,375],[740,360],[844,390],[1280,720]]){
   const q=await b.newPage({viewport:{width:w,height:h}});await q.goto('http://localhost:8000/index.html?boss='+id);await q.waitForTimeout(800);
   await q.getByText('ENTRAR',{exact:true}).click();await q.fill('input','Teste');await q.getByText('Continuar',{exact:true}).click();await q.waitForTimeout(1200);
   const m=await q.evaluate(()=>{const c=document.querySelector('.hunt-home').getBoundingClientRect(),bt=document.querySelector('.hunt-home .royal-small-gold').getBoundingClientRect(),t=document.querySelector('.hunt-home h2').getBoundingClientRect();return{ok:bt.bottom<=c.bottom+1&&bt.top>=c.top&&bt.right<=c.right+1&&t.right<=c.right+1&&c.bottom<=innerHeight+4&&c.right<=innerWidth+1}});
   ok(m.ok,`${id}: cartão da tela inicial cabe em ${w}x${h}`);await q.close();
  }
  const p=await b.newPage({viewport:{width:844,height:390}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8000/index.html?boss='+id);await p.waitForTimeout(1000);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1300);
  await p.evaluate(()=>beginArenaMode('guardian'));await p.waitForTimeout(700);
  const lob=await p.evaluate(()=>({title:document.querySelector('.hunt-title h1')?.textContent,skills:document.querySelectorAll('.hunt-skill:not(.basic)').length,basics:document.querySelectorAll('.hunt-skill.basic').length,sys:document.querySelector('.hunt-pride p')?.textContent.length,art:(()=>{const c=document.getElementById('huntArt'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return n})(),icons:[...document.querySelectorAll('.hunt-skill img')].every(i=>i.naturalWidth>0)}));
  ok(lob.title&&lob.skills===6&&lob.basics===3&&lob.sys>40&&lob.art>20000&&lob.icons,`${id}: lobby (${lob.title}) com 6 habilidades, 3 básicos, sistema, arte e ícones`);
  await p.evaluate(()=>document.querySelector('[data-hunt-start]').click());await p.waitForTimeout(3800);
  const st=await p.evaluate(()=>({g:!!huntQA.gstate,hp:b.hp,max:b.max,n:actors.length,name:huntQA.gstate?.def?.name}));
  ok(st.g&&st.hp===st.max&&st.n===3,`${id}: luta em dupla inicia (${st.name}, vida ${st.max})`);
  const skills=await p.evaluate(()=>huntQA.gstate.def.skills.map(s=>[s.id,s.k.kind]));
  for(const [sid,kind] of skills){
   await p.evaluate(sid=>{p.hp=1000;p.inv=6;b.inv=0;huntQA.forceG(sid)},sid);
   let done=true;try{await p.waitForFunction(()=>!huntQA.gstate.act,null,{timeout:9000,polling:100})}catch{done=false}
   await p.evaluate(()=>{p.hp=1000;p.inv=6});
   ok(done,`${id}: habilidade ${sid} (${kind}) termina sem travar`);
  }
  const hud=await p.evaluate(()=>{updateUI();return document.querySelector('#enemyResource')?.textContent});
  ok(hud&&hud.length>3,`${id}: HUD mostra a mecânica própria ("${hud}")`);
  await p.evaluate(()=>{b.hp=b.max*.4});await p.waitForTimeout(2500);
  ok(await p.evaluate(()=>huntQA.gstate.phase===2),`${id}: fase 2 ao passar de 50% de vida`);
  await p.waitForTimeout(3000);
  await p.evaluate(()=>{p.hp=1000;p.inv=0;b.hp=5;b.inv=0;b.guard=false;const R=huntQA.gstate;R.exh=0;R.shield=0;if(R.mech)R.mech.phase=R.mech.phase==='eth'?'solid':R.mech.phase;if(R.act)R.act=null});
  await p.waitForTimeout(300);
  await p.evaluate(()=>{b.inv=0;hit(b,50,p,0,0)});await p.waitForTimeout(3800);
  ok((await p.textContent('#resultTitle')).includes('foi derrotado'),`${id}: vitória mostra a tela de resultado`);
  ok(await p.evaluate(id=>!!JSON.parse(localStorage.getItem('eldoria.cacada.v1')).best[id],id),`${id}: recorde de tempo salvo`);
  ok(errs.length===0,`${id}: sem erros de JavaScript ${errs.join(' | ')}`);
  await p.close();
 }
 await b.close();
})();
