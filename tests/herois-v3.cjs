// Pacote de jogabilidade dos 5 primeiros heróis: Guerreiro Astral, Ninja das Brumas, Ronin Carmesim, Guardião Solar, Lutador do Eclipse.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const pg=await (await br.newContext({viewport:{width:1000,height:450}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1');await pg.waitForTimeout(900);await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 const r=await pg.evaluate(()=>{
  const o={};window.requestAnimationFrame=()=>0;Math.random=()=>.99;
  const setup=h=>{matchMode='1v1';battleActivity='training';account.activeChampion=h;selected=[...CHAMPIONS[h].kit];start();state='fight';count=0;reset()};
  const reset=(bx=385)=>{p.cd=p.cd.map(()=>0);p.cast=0;p.actionRecovery=0;p.skillLock=0;p.root=0;p.rwCast=null;p.v3dashCD=0;p.hp=p.max=1000;p.inv=0;p.guard=false;
   b.hp=b.max=1e6;b.inv=0;b.root=9999;b.guard=false;b.cd=b.cd.map(()=>0);p.x=300;p.y=300;b.x=bx;b.y=300;p.a=0;reworkState(p).ichigoFollowUntil=0;Reforged.projectiles.length=0;Reforged.dashes.length=0;OriginalCombat.burns.length=0};
  const run=(n,pin=true)=>{for(let i=0;i<n;i++){step(1/60);if(pin){b.x=b.x;}}};
  const dmgOf=f=>{const h0=b.hp;f();return h0-b.hp};

  /* ---------- Ronin ---------- */
  setup(2);{const K=p.kit;
   reset();p.v3ronLast=clock;o.ronNormal=dmgOf(()=>{cast(p,K[0],0);run(40)});
   reset();p.v3ronLast=clock-2;o.ronSheathed=RoninV3.sheathed(p);o.ronDraw=dmgOf(()=>{cast(p,K[0],0);run(40)});
   reset();run(70);p.v3ronLast=clock;const st=reworkState(p);st.value=0;V3API.doDash(p);run(2);p.cd[K[0]]=1.5;hit(p,50,b,0,0,b.kit[0]);
   o.ronPerfect={cd:p.cd[K[0]],pre:Math.round(st.value),sheath:RoninV3.sheathed(p)||!!p.rwCast};
   reset();run(60);p.v3m=4;p.v3mT=clock;p.inv=0;hit(p,40,b,0,0,b.kit[0]);o.ronMarks=p.v3m;
  }
  /* ---------- Guardião Solar ---------- */
  setup(3);{const K=p.kit;
   reset();o.solBase=dmgOf(()=>{hit(b,100,p,0,0,K[2])});
   reset();originalBurn(b,p,5);step(1/60);o.solCap=SolarV3.burnOf(b,p).stacks;o.solIgnite=dmgOf(()=>{hit(b,100,p,0,0,K[2])});o.solConsumed=!SolarV3.burnOf(b,p)||SolarV3.burnOf(b,p).stacks===0;
   reset(700);b.root=9999;V3API.doDash(p);run(30);o.solTrail=SolarV3.TRAILS.length;const tr=SolarV3.TRAILS[0];if(tr){const m=tr.pts[Math.floor(tr.pts.length/2)];b.x=m.x;b.y=m.y}
   OriginalCombat.burns.length=0;o.solTrailDmg=dmgOf(()=>{for(let i=0;i<70;i++){step(1/60);if(tr){const m=tr.pts[Math.floor(tr.pts.length/2)];b.x=m.x;b.y=m.y}}});o.solTrailBurn=!!SolarV3.burnOf(b,p);
  }
  /* ---------- Lutador do Eclipse ---------- */
  setup(4);{const K=p.kit;
   reset();b.root=0;o.eclMid=dmgOf(()=>{hit(b,62,p,95,0,K[0])});o.eclMidRoot=b.root;
   reset();b.root=0;b.x=W-60;p.x=b.x-70;o.eclWall=dmgOf(()=>{hit(b,62,p,95,0,K[0])});o.eclWallRoot=b.root;
   reset(620);b.root=9999;cast(p,K[2],0);run(70);o.eclSphere=!!EclipseV3.liveSphere(p);const e=EclipseV3.liveSphere(p);if(e){b.x=e.x+30;b.y=e.y}
   o.eclDet=dmgOf(()=>{o.eclDetOk=cast(p,K[2],0)});o.eclGone=!EclipseV3.liveSphere(p);
   // a barreira do computador segue a regra do jogador: só sobe com o teleporte
   const bs=reworkState(b);b.skin=4;b.kit=[...CHAMPIONS[4].kit];
  }
  setup(0);{
   // computador Eclipse: sem teleporte, sem barreira
   b.trainingDummy=false;b.skin=4;b.kit=[...CHAMPIONS[4].kit];b.identity=undefined;const bs=reworkState(b);bs.barrierEnergy=240;run(30);o.botBarrier=bs.barrier;
   b.root=0;b.cast=0;b.v3dashCD=0;V3API.doDash(b);run(2);o.botBarrierDash=bs.barrier;
  }
  /* ---------- Guerreiro Astral ---------- */
  setup(0);{const K=p.kit,s=reworkState(p);
   reset();s.value=0;s.powerT=0;p.v3kiHold=true;run(60);o.gKi=Math.round(s.value);o.gHoldRoot=p.root>0;
   const hh=dmgOf.call(null,()=>{});
   reset();p.v3kiHold=true;const h0=p.hp;b.inv=0;hit(p,100,b,0,0,b.kit[0]);o.gTake=Math.round(h0-p.hp);p.v3kiHold=false;reset();const h1=p.hp;hit(p,100,b,0,0,b.kit[0]);o.gTake0=Math.round(h1-p.hp);
   reset(360);b.root=0;s.powerT=0;s.value=99;p.v3pw=false;o.gBurst=dmgOf(()=>{originalGainKi(p,20);step(1/60)});o.gPower=s.powerT>0;
   reset();s.powerT=0;s.value=0;cast(p,K[0],0);o.gRajCd0=+p.cd[K[0]].toFixed(2);reset();s.powerT=5;cast(p,K[0],0);o.gRajCd=+p.cd[K[0]].toFixed(2);s.powerT=0;
   reset();s.powerT=0;s.value=60;rwBeginCharge(p,0,2);const hm=skills[K[2]].holdMax||1.6;run(Math.round(hm*.88*60));rwReleaseCharge(p,0);o.gPerfect=!!p.rwCast?.v3perfect;
   reset();s.powerT=0;s.value=60;rwBeginCharge(p,0,2);run(20);rwReleaseCharge(p,0);o.gNotPerfect=!p.rwCast?.v3perfect;
   reset();s.powerT=5;s.value=60;rwBeginCharge(p,0,2);run(3);rwReleaseCharge(p,0);o.gPowerCharge=p.rwCast?.charge;
  }
  /* ---------- Ninja das Brumas ---------- */
  setup(1);{const K=p.kit;b.trainingDummy=false;b.skin=2;b.kit=[...CHAMPIONS[2].kit];
   reset();o.nCast=cast(p,K[4],0);run(3);const x0=p.x;o.nRead=hit(p,80,b,0,Math.PI,b.kit[0]);o.nMoved=Math.round(Math.abs(p.x-x0));o.nHp=p.hp;o.nBack=p.v3back>clock;o.nCopy=!!reworkState(p).copy;
   reset();p.v3back=-9;o.nBase=dmgOf(()=>{hit(b,60,p,0,0,K[0])});reset();p.v3back=clock+1;b.root=0;o.nBackDmg=dmgOf(()=>{hit(b,60,p,0,0,K[0])});o.nBackRoot=b.root;
   reset();p.v3readUntil=0;run(60);p.inv=0;const hp0=p.hp;hit(p,50,b,0,0,b.kit[0]);o.nLate=p.hp<hp0;
   o.sync=window.NINJA_V3_SYNC;
  }
  return o});
 console.log(JSON.stringify(r));
 // Ronin
 ok(r.ronSheathed&&r.ronDraw>r.ronNormal*1.3,`Ronin: Saque após 0,8s parado dá +40% no Corte Rápido (${r.ronNormal} → ${r.ronDraw})`);
 ok(r.ronPerfect.cd===0&&r.ronPerfect.pre>=20,`Ronin: esquiva perfeita no Passo zera o Corte e dá Pressão (${JSON.stringify(r.ronPerfect)})`);
 ok(r.ronMarks===2,`Ronin: levar dano tira 2 marcas do Ritmo da Lâmina, não todas (4 → ${r.ronMarks})`);
 // Solar
 ok(r.solCap===4,`Solar: no máximo 4 brasas por alvo (${r.solCap})`);
 ok(r.solIgnite>r.solBase+70&&r.solConsumed,`Solar: Ignição da Coluna consome as brasas com dano extra (${Math.round(r.solBase)} → ${Math.round(r.solIgnite)})`);
 ok(r.solTrail===1&&r.solTrailDmg>0&&r.solTrailBurn,`Solar: o Passo deixa rastro de fogo que fere e acende brasa (${Math.round(r.solTrailDmg)} de dano)`);
 // Eclipse
 ok(r.eclWall>r.eclMid*1.3&&r.eclWallRoot>=.45&&r.eclMidRoot<.45,`Eclipse: Repulsão contra a parede causa choque e atordoa (${Math.round(r.eclMid)} → ${Math.round(r.eclWall)})`);
 ok(r.eclSphere&&r.eclDetOk&&r.eclDet>100&&r.eclGone,`Eclipse: tocar de novo detona a Esfera Rubra no ar (${Math.round(r.eclDet)} de dano)`);
 ok(r.botBarrier===false&&r.botBarrierDash===true,'Eclipse do computador: barreira só com o teleporte, como o jogador');
 // Guerreiro
 ok(r.gKi>=20&&r.gKi<=30&&r.gHoldRoot,`Guerreiro: concentrar parado carrega ≈25 de Ki por segundo (${r.gKi})`);
 ok(r.gTake>r.gTake0*1.15,`Guerreiro: recebe +20% de dano enquanto concentra (${r.gTake0} → ${r.gTake})`);
 ok(r.gPower&&r.gBurst>0,`Guerreiro: entrar no Modo Poder solta uma explosão (${Math.round(r.gBurst)} de dano)`);
 ok(r.gRajCd>0&&r.gRajCd<=r.gRajCd0*.55,`Guerreiro: Rajada com metade da recarga no Modo Poder (${r.gRajCd0} → ${r.gRajCd})`);
 ok(r.gPerfect&&r.gNotPerfect,'Guerreiro: soltura perfeita só no fim da carga da Onda');
 ok(r.gPowerCharge===1,'Guerreiro: no Modo Poder a Onda sai com carga máxima');
 // Ninja
 ok(r.nCast&&r.nRead===false&&r.nHp===1000&&r.nMoved>20&&r.nBack&&r.nCopy,`Ninja: Leitura esquiva, reaparece atrás do atacante e copia o golpe (moveu ${r.nMoved})`);
 ok(r.nBackDmg>r.nBase*1.2&&r.nBackRoot>=.3,`Ninja: golpe pelas costas causa +25% e atordoa (${Math.round(r.nBase)} → ${Math.round(r.nBackDmg)})`);
 ok(r.nLate,'Ninja: fora da janela de leitura, o golpe acerta normalmente');
 ok(r.sync>0,'Ninja: clone em sincronia ativo');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,3));
 await br.close();
})();
