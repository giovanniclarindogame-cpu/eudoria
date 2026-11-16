// Monstros v3: os 41 monstros da Cruzada têm arte própria (pixel art 96×96), todas as poses desenham algo e a fase usa a arte nova.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const pg=await (await br.newContext({viewport:{width:1000,height:450}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1');await pg.waitForTimeout(900);await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 const r=await pg.evaluate(()=>{
  const fams=HuntAPI.ROSTER.map(d=>d.id),keys=MobArt.keys(),missing=[],blank=[],same=[];
  for(const f of fams)for(const t of ['g','r','b','e'])if(!MobArt.has(f+':'+t))missing.push(f+':'+t);
  const count=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>40)n++;return n};
  const sig=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i+=16)h=(h*31+d[i]+d[i+1]*3+d[i+2]*7)|0;return h};
  const t0=performance.now();let frames=0;
  const idle={};
  for(const k of keys){for(const [p,n] of Object.entries(MobArt.FRAMES))for(let i=0;i<n;i++){const c=MobArt.frame(k,p,i);frames++;if(count(c)<120&&!(k==='xerath:s'&&count(c)>=60))blank.push(k+'|'+p+'|'+i)}
   idle[k]=sig(MobArt.frame(k,'idle',0));
   if(sig(MobArt.frame(k,'walk',1))===sig(MobArt.frame(k,'walk',4)))same.push(k+' walk');
   if(sig(MobArt.frame(k,'idle',0))===sig(MobArt.frame(k,'hit',1)))same.push(k+' hit')}
  const ms=performance.now()-t0;
  const uniq=new Set(Object.values(idle)).size;
  return{n:keys.length,missing,blank:blank.slice(0,5),same:same.slice(0,5),uniq,frames,ms:Math.round(ms),size:MobArt.S}});
 ok(r.n===41&&r.missing.length===0,`41 monstros com arte própria: 10 famílias × 4 tipos + a formiguinha (${r.n})`);
 ok(r.size===96,'grade de 96×96 (o pintor antigo usava 64×64)');
 ok(r.blank.length===0,'todas as poses de todos os monstros desenham alguma coisa '+r.blank.join(','));
 ok(r.uniq===41,`nenhum monstro é igual a outro (${r.uniq} desenhos diferentes parados)`);
 ok(r.same.length===0,'andar e levar dano mudam o desenho (animação de verdade) '+r.same.join(','));
 ok(r.ms<6000,`gerar os ${r.frames} quadros leva ${r.ms} ms (uma vez só; depois fica em cache)`);
 // na fase
 await pg.evaluate(()=>{const cl={};for(const d of HuntAPI.ROSTER)cl[d.id]=99;ArcadeAPI.setSave({team:'solo',sel:'kuroen',cleared:cl});ArcadeAPI.startStage()});await pg.waitForTimeout(1200);
 const g=await pg.evaluate(()=>{window.requestAnimationFrame=()=>0;state='fight';count=0;p.hp=p.max=1e6;const TR=[760,1460];
  for(let w=0;w<2;w++){p.x=TR[w]+30;p.y=300;for(let i=0;i<240;i++){step(1/60);if(w<1)for(const a of actors)if(a.mob&&a.hp>0)a.hp=0}}
  for(let i=0;i<150;i++)step(1/60);let err=null;try{draw()}catch(e){err=String(e)}
  const mobs=actors.filter(a=>a.mob&&a.hp>0);
  // mata um para gerar o corpo caído e desenha de novo
  if(mobs[0])mobs[0].hp=0;for(let i=0;i<5;i++)step(1/60);try{draw()}catch(e){err=err||String(e)}
  return{arts:mobs.map(a=>a.mob.art),err,corpse:ArcadeAPI.S.corpses.length>0&&!!ArcadeAPI.S.corpses[0].art}});
 ok(g.arts.length>=3&&g.arts.every(a=>/^kuroen:[grbe]$/.test(a))&&!g.err,`na fase os monstros usam a arte nova da família do chefe (${[...new Set(g.arts)].join(', ')})`);
 ok(g.corpse,'o corpo caído também usa a arte nova');
 // prévia no lobby da Cruzada
 const lb=await pg.evaluate(()=>{showArenaModes();document.querySelector('[data-arena-mode="stage"]').click();const cs=[...document.querySelectorAll('[data-arc-mob]')];return{n:cs.length,painted:cs.every(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>40)n++;return n>80})}});
 ok(lb.n===4&&lb.painted,'o lobby da Cruzada mostra os 4 monstros da fase com a arte nova');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,2));
 await br.close();
})();
