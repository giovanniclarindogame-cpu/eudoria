// Kakashi copia habilidades (inclusive ultimates) dos campeões rivais nos duelos: ao ser atingido e ao ver o lançamento.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:844,height:390}});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html');await pg.waitForTimeout(800);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('input','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 await pg.evaluate(()=>{matchMode='1v1';battleActivity='casual';start()});await pg.waitForTimeout(4600);
 const r=await pg.evaluate(()=>{
  const out={};
  p.skin=1;p.kit=[...CHAMPIONS[1].kit];b.skin=0;b.kit=[...CHAMPIONS[0].kit];
  const ult=CHAMPIONS[0].kit[5],spec=CHAMPIONS[0].kit[0];
  const reset=()=>{for(const x of [p,b]){x.rwCast=null;x.cast=0;x.skillLock=0;x.actionRecovery=0;x.punchTime=0;x.guard=false}const s=reworkState(p);s.copy=null;s.eye=6;p.inv=0;p.hp=p.max=3000;b.hp=b.max=100000;b.inv=0;b.x=p.x+300;b.y=p.y;p.cd=p.cd.map(()=>0);b.cd=b.cd.map(()=>0)};
  reset();hit(p,40,b,0,0,ult);out.hitUlt=reworkState(p).copy?.id===ult;
  reset();rwCast(b,spec,true);out.seeSpecial=reworkState(p).copy?.id===spec;out.seeNoDamage=p.hp===p.max;
  reset();reworkState(b).value=100;reworkState(b).stage=2;b.mp=120;out.ultReady=rwReady(b,ult);rwCast(b,ult,true);out.seeUlt=reworkState(p).copy?.id===ult;
  reset();b.x=p.x+900;rwCast(b,spec,true);out.farNoCopy=reworkState(p).copy===null;
  reset();reworkState(p).eye=0;rwCast(b,spec,true);out.eyeClosedNoCopy=reworkState(p).copy===null;
  // usa a cópia da ult
  reset();b.x=p.x+130;reworkState(p).copy={id:ult};rwCast(p,p.kit[4],true);
  return out});
 await pg.waitForTimeout(300);
 ok(r.hitUlt,'ultimate do rival é copiada ao ser atingido');
 ok(r.seeSpecial,'habilidade do rival é copiada só de ver o lançamento');
 ok(r.seeNoDamage,'sem tomar dano ao copiar de longe');
 ok(r.ultReady,'(preparo) rival tem recurso para a ultimate');ok(r.seeUlt,'ultimate do rival é copiada ao ver o lançamento');
 ok(r.farNoCopy,'rival longe demais não é copiado');
 ok(r.eyeClosedNoCopy,'com o olho fechado não copia');
 ok(errs.length===0,'sem erros de JavaScript '+errs.join('|'));
 await br.close();
})();
