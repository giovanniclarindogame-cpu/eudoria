// Pacote de jogabilidade de Caçador Espectral, Herdeiro da Centelha, Corsário da Maré e Alquimista de Aço; heróis liberados para teste.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const pg=await (await br.newContext({viewport:{width:1000,height:450}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1');await pg.waitForTimeout(900);await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 const r=await pg.evaluate(()=>{
  const o={};window.requestAnimationFrame=()=>0;Math.random=()=>.99;
  const setup=h=>{matchMode='1v1';battleActivity='training';account.activeChampion=h;selected=[...CHAMPIONS[h].kit];start();state='fight';count=0;reset()};
  const reset=(bx=385)=>{p.cd=p.cd.map(()=>0);p.cast=0;p.actionRecovery=0;p.skillLock=0;p.root=0;p.rwCast=null;p.v3dashCD=0;p.hp=p.max=1000;p.inv=0;p.guard=false;
   b.hp=b.max=1e6;b.inv=0;b.root=9999;b.guard=false;b.cd=b.cd.map(()=>0);b.rwCast=null;p.x=300;p.y=225;b.x=bx;b.y=225;p.a=0;Reforged.projectiles.length=0;Reforged.dashes.length=0;OriginalCombat.burns.length=0;
   for(const ob of objects)if(ob.material||ob.colossus){ob.life=0;ob.hp=0}};
  const run=n=>{for(let i=0;i<n;i++)step(1/60)};
  const dmgOf=f=>{const h0=b.hp;f();return h0-b.hp};
  o.liberados=TESTE_TODOS_LIBERADOS;

  /* ---------- Caçador ---------- */
  setup(5);{const K=p.kit;
   const lvl=(frames)=>{reset();rwBeginCharge(p,0,0);run(frames);rwReleaseCharge(p,0);return {lv:p.rwCast?.v3level,ch:p.rwCast?.charge}};
   o.cLv=[lvl(20),lvl(45),lvl(80),lvl(108)];
   reset();rwBeginCharge(p,0,0);run(10);hit(p,15,b,0,Math.PI,b.kit[1]);o.cFirm=!!p.rwCast?.holding;
   reset();rwBeginCharge(p,0,0);run(10);hit(p,200,b,0,Math.PI,b.kit[1]);o.cBreak=!p.rwCast?.holding;
   reset(480);b.root=0;cast(p,K[2],0);run(30);o.cHook=Math.round(dist(p,b));o.cHookRoot=b.root>0||b.x<480;
   reset(360);b.root=0;o.cDash=dmgOf(()=>{V3API.doDash(p);run(40)});o.cPrey=p.v3f&&p.v3f.n===3;
  }
  /* ---------- Herdeiro ---------- */
  setup(6);{const K=p.kit,s=reworkState(p);
   reset();s.value=75;const h0=p.hp;rwGain(p,5);o.hZoneHp=p.hp===h0;s.value=90;run(60);o.hBurn=Math.round(h0-p.hp);
   reset();s.value=50;o.hKick=dmgOf(()=>{cast(p,K[1],0);run(30)});reset();s.value=95;o.hVent=dmgOf(()=>{cast(p,K[1],0);run(30)});o.hVentVal=Math.round(s.value);
   reset();p.x=W-120;p.y=225;b.x=300;s.value=10;cast(p,K[2],0);run(90);o.hBounce=p.v3ric?.b||0;
   reset();s.value=100;b.x=360;cast(p,K[5],0);run(40);o.hArm=Math.round(s.arm*10)/10;o.hFrac=s.fractured;
  }
  /* ---------- Corsário ---------- */
  setup(7);{const K=p.kit,s=reworkState(p);
   reset(560);b.root=9999;s.value=60;cast(p,K[0],0);let rd=false;for(let i=0;i<40&&!rd;i++){step(1/60);rd=CorsarioV3.reelReady(p)}o.kReady=CorsarioV3.reelReady(p);const d0=dist(p,b);o.kReel=dmgOf(()=>{o.kReelCast=cast(p,K[0],0);run(30)});o.kClose=Math.round(dist(p,b))<Math.round(d0)-100;
   reset(400);b.root=0;s.value=80;cast(p,K[2],0);let far=0;for(let i=0;i<20;i++){step(1/60);far=Math.max(far,dist(p,b))}run(40);o.kUndertow={far:Math.round(far),end:Math.round(dist(p,b))};
   reset(400);b.root=0;s.value=20;cast(p,K[2],0);run(60);o.kNoUndertow=Math.round(dist(p,b));
   o.kMul=V3_DMG_MUL[7];
  }
  /* ---------- Alquimista ---------- */
  setup(9);{const K=p.kit,s=reworkState(p);const A=AlquimistaV3;
   reset(700);for(let i=0;i<8;i++){p.cd=p.cd.map(()=>0);p.cast=0;p.rwCast=null;p.skillLock=0;cast(p,K[0],i*.7-2.4);run(20)}o.aCount=A.own(p).length;o.aLife=Math.max(...A.own(p).map(x=>x.life));
   reset(700);p.cd=p.cd.map(()=>0);cast(p,K[0],0);run(20);const blk=A.own(p)[0];o.aStone=!!blk&&!blk.v3steel;run(200);o.aSteel=!!blk?.v3steel;
   // arremesso do aço: mais dano
   b.x=560;b.y=225;b.root=9999;p.cd=p.cd.map(()=>0);p.cast=0;p.rwCast=null;p.skillLock=0;s.value=0;o.aSteelDmg=dmgOf(()=>{cast(p,K[0],0);run(60)});o.aEss=Math.round(s.value);
   reset(700);p.cd=p.cd.map(()=>0);cast(p,K[0],0);run(20);p.cd=p.cd.map(()=>0);p.cast=0;p.rwCast=null;p.skillLock=0;b.x=560;b.root=9999;o.aStoneDmg=dmgOf(()=>{cast(p,K[0],0);run(60)});
   // muralha em cima do rival
   reset(410);b.root=0;let mr=0;o.aLaunch=dmgOf(()=>{cast(p,K[3],0);for(let i=0;i<40;i++){step(1/60);mr=Math.max(mr,b.root)}});o.aLaunchRoot=mr>=.4;o.aWall=A.own(p).some(x=>x.wall);
   // espinhos
   const w=A.own(p).find(x=>x.wall);if(w){b.root=9999;b.x=w.x;b.y=w.y+w.h/2+b.r+2;o.aSpike=dmgOf(()=>run(30))}
   // lanças
   reset(520);for(const [x,y] of [[470,190],[470,260],[560,190]])rwCreateBlock(p,x,y);b.root=9999;p.x=420;p.cd=p.cd.map(()=>0);o.aLances=dmgOf(()=>{cast(p,K[1],0);run(40)});o.aLanceN=A.LANCES.length+0;
   // ultimate exige essência
   reset(700);rwCreateBlock(p,380,225);s.value=40;o.aUltNo=cast(p,K[5],0);s.value=100;p.cd=p.cd.map(()=>0);o.aUltYes=cast(p,K[5],0);run(60);o.aColossus=objects.some(x=>x.colossus&&x.life>0&&x.owner===p);o.aEssAfter=s.value;
  }
  return o});
 console.log(JSON.stringify(r));
 ok(r.liberados===true,'fase de testes: todos os heróis liberados por padrão');
 // Caçador
 ok(r.cLv.map(x=>x.lv).join()==='0,1,2,3',`Caçador: carga em 3 níveis (${r.cLv.map(x=>x.lv).join(',')})`);
 ok(r.cFirm&&r.cBreak,'Caçador: postura firme — golpe fraco não interrompe, golpe forte interrompe');
 ok(r.cHook<120&&r.cHookRoot,`Caçador: Fisgada puxa quem está na ponta da linha (ficou a ${r.cHook})`);
 ok(r.cPrey&&r.cDash>0&&r.cDash<120,`Caçador: Salto Selvagem com menos dano (${Math.round(r.cDash)}) e marca a presa`);
 // Herdeiro
 ok(r.hZoneHp,'Herdeiro: na zona (abaixo de 85) a Sobrecarga não custa vida');
 ok(r.hBurn>=5,`Herdeiro: acima de 85 perde vida aos poucos (${r.hBurn} em 1s)`);
 ok(r.hVent>r.hKick*1.3&&r.hVentVal<90,`Herdeiro: chute de alívio acima de 85 (+40%, ${Math.round(r.hKick)} → ${Math.round(r.hVent)}) e descarrega (${r.hVentVal})`);
 ok(r.hBounce>=1,`Herdeiro: Salto Ricochete quica na parede (${r.hBounce})`);
 ok(r.hArm<=6&&r.hFrac===false,`Herdeiro: ultimate quebra o braço por 6s (${r.hArm})`);
 // Corsário
 ok(r.kReady&&r.kReelCast&&r.kReel>0&&r.kClose,`Corsário: Arpão Fisgado puxa até o rival com soco (${Math.round(r.kReel)})`);
 ok(r.kUndertow.end<r.kUndertow.far-60,`Corsário: Ressaca arrasta o rival de volta (${r.kUndertow.far} → ${r.kUndertow.end})`);
 ok(r.kNoUndertow>120,`Corsário: sem 50 de Elasticidade não há Ressaca (${r.kNoUndertow})`);
 // Alquimista
 ok(r.aCount<=6&&r.aLife<=12,`Alquimista: no máximo 6 construções que duram 12s (${r.aCount}, ${r.aLife})`);
 ok(r.aStone&&r.aSteel,'Alquimista: bloco perto dele vira aço em 3s');
 ok(r.aSteelDmg>r.aStoneDmg*1.3&&r.aEss>=15,`Alquimista: aço arremessado causa mais dano (${Math.round(r.aStoneDmg)} → ${Math.round(r.aSteelDmg)}) e carrega Essência (${r.aEss})`);
 ok(r.aLaunch>0&&r.aLaunchRoot&&r.aWall,`Alquimista: muralha em cima do rival lança e prende (${Math.round(r.aLaunch)})`);
 ok(r.aSpike>0,`Alquimista: espinhos em quem encosta na muralha (${Math.round(r.aSpike||0)})`);
 ok(r.aLances>r.aStoneDmg*0+60,`Alquimista: Lança dos Blocos (${Math.round(r.aLances)} de dano)`);
 ok(r.aUltNo===false&&r.aUltYes&&r.aColossus&&r.aEssAfter===0,'Alquimista: Colosso exige Essência cheia e a consome');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,3));
 await br.close();
})();
