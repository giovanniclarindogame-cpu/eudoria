// Cavaleiro do Firmamento · pacote de jogabilidade: estágios do Cosmo, custos e recargas, golpe no ar, Exposto e nova ultimate.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const pg=await (await br.newContext({viewport:{width:1000,height:450}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1');await pg.waitForTimeout(900);await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 const r=await pg.evaluate(()=>{
  const o={};
  matchMode='1v1';battleActivity='training';account.activeChampion=8;selected=[...CHAMPIONS[8].kit];start();state='fight';count=0;window.requestAnimationFrame=()=>0;Math.random=()=>.99;
  const st=()=>reworkState(p),K=p.kit;
  const reset=(cos)=>{st().value=cos;st().combo=0;p.cd=p.cd.map(()=>0);p.cast=0;p.actionRecovery=0;p.skillLock=0;p.root=0;p.rwCast=null;p.v3dashCD=0;p.hp=p.max=1000;p.inv=0;p.v3cavUlt=null;b.hp=b.max=1e6;b.inv=0;b.root=9999;const ts=reworkState(b);ts.air=0;ts.exposed=0;p.x=300;p.y=300;b.x=385;b.y=300;p.a=0};
  const run=(n)=>{for(let i=0;i<n;i++){step(1/60);b.x=385;b.y=300}};
  o.cd=[skills[K[1]].cd,skills[K[2]].cd];
  reset(9);o.cometa9=cast(p,K[1],0);reset(10);o.cometa10=cast(p,K[1],0);run(60);
  reset(7);o.chute7=cast(p,K[2],0);reset(8);o.chute8=cast(p,K[2],0);run(60);o.chuteDeNovo=cast(p,K[2],0);
  reset(0);o.dash0=V3API.doDash(p);run(60);
  // estágios: um soco da Rajada com Cosmo 0 / 50 / 90 / 100
  const one=(cos,prep)=>{reset(cos);if(prep)prep();const h0=b.hp;hit(b,100,p,0,0,K[0]);return h0-b.hp};
  const d0=one(0),d1=one(50),d2=one(90),d3=one(100);o.stage=[+(d1/d0).toFixed(3),+(d2/d0).toFixed(3),+(d3/d0).toFixed(3)];
  o.air=+(one(0,()=>{reworkState(b).air=.5})/d0).toFixed(3);
  // exposto: a Investida marca; o Cometa consome
  reset(0);V3API.doDash(p);for(let i=0;i<50;i++)step(1/60);o.expostoAposDash=reworkState(b).exposed>0;
  o.marcaVisivel=integratedDepth().some(e=>e.kind==='v3-exposed');
  {const h0=b.hp;hit(b,100,p,0,0,K[1]);o.cometaExposto=+((h0-b.hp)/d0).toFixed(3);o.expostoConsumido=reworkState(b).exposed===0}
  // ultimate por estágio
  const ult=(cos)=>{reset(cos);b.x=520;let small=0,big=0;const oa=rwArea;rwArea=function(a,x,y,rr,dmg){if(a===p){if(rr>80)big++;else small++}return oa.apply(this,arguments)};const h0=b.hp;const okc=cast(p,K[5],0);for(let i=0;i<200;i++){step(1/60);b.x=520;b.y=300}rwArea=oa;return{ok:okc,small,big,dmg:Math.round(h0-b.hp),cosmo:Math.round(st().value)}};
  o.u34=ult(34).ok;o.u36=ult(36);o.u60=ult(60);o.u100=ult(100);
  o.hud=integratedDepth().some(e=>e.kind==='v3-cav-hud');
  // marca sem bônus defensivo
  reset(100);{const h0=p.hp;hit(p,100,b,0,0,0);o.take100=Math.round(h0-p.hp)}reset(0);{const h0=p.hp;hit(p,100,b,0,0,0);o.take0=Math.round(h0-p.hp)}
  o.mul=V3_DMG_MUL[8];
  return o});
 ok(r.cd[0]===2&&r.cd[1]===3,'Cometa com recarga de 2 s e Chute com 3 s');
 ok(!r.cometa9&&r.cometa10&&!r.chute7&&r.chute8,'custos novos: Cometa 10 de Cosmo, Chute 8');
 ok(r.chuteDeNovo===false,'Chute não pode ser repetido em seguida (fim da trava infinita)');
 ok(r.dash0===true,'Investida continua sem custo');
 ok(Math.abs(r.stage[0]-1.15)<.01&&Math.abs(r.stage[1]-1.3)<.01&&Math.abs(r.stage[2]-1.3)<.01,`estágios do Cosmo: +15% e +30% de dano, sem empilhar com o bônus antigo de Cosmo cheio (${r.stage})`);
 ok(Math.abs(r.air-1.3)<.01,'golpe no rival que está no ar causa +30% ('+r.air+')');
 ok(r.expostoAposDash&&r.marcaVisivel,'Investida deixa o rival Exposto e a marca aparece sobre ele');
 ok(r.expostoConsumido&&r.cometaExposto>1.8,`o Cometa consome a marca Exposto com bônus (×${r.cometaExposto} sobre o golpe base)`);
 ok(r.u34===false&&r.u36.ok&&r.u36.small===5&&r.u60.small===7&&r.u100.small===9&&r.u36.big===1&&r.u100.big===1,`ultimate: mínimo 35 de Cosmo; 5, 7 ou 9 meteoros conforme o estágio + 1 meteoro final (${r.u36.small},${r.u60.small},${r.u100.small})`);
 ok(r.u100.dmg>r.u60.dmg&&r.u60.dmg>r.u36.dmg&&r.u100.cosmo<=5,`ultimate mais forte a cada estágio (${r.u36.dmg} / ${r.u60.dmg} / ${r.u100.dmg}) e gasta o Cosmo`);
 ok(r.hud,'estrelas de estágio e contador de combo desenhados sobre o herói');
 ok(r.take100===r.take0,'a marca não dá mais redução de dano por guardar Cosmo');
 ok(r.mul>=.8&&r.mul<=1.1,'multiplicador de dano do herói subiu (0,65 → '+r.mul+')');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,2));
 await br.close();
})();
