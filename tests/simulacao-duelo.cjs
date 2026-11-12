// Simulação de duelos 1x1 (IA contra IA, tempo acelerado, lados trocados). uso: node tests/simulacao-duelo.cjs <skinA> <skinB> <partidas por lado> [semente]
// skins: 0 Guerreiro Astral (Goku), 1 Ninja das Brumas (Kakashi), 2 Ronin, 3 Guardião Solar, 4 Lutador do Eclipse, 5 Caçador Espectral...
const {chromium}=require('playwright');
const A=process.argv[2]!==undefined?+process.argv[2]:1,B=process.argv[3]!==undefined?+process.argv[3]:0,N=+process.argv[4]||20;
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:844,height:390}});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html'+(process.env.DMG?'?dmg='+process.env.DMG:''));await pg.waitForTimeout(800);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('input','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 const res=await pg.evaluate(async({A,B,N,SEED})=>{
  let seed=SEED;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const out={A:{wins:0,hpSum:0,dmg:0,copies:0,ultCopies:0},B:{wins:0,hpSum:0,dmg:0},draws:0,dur:0,n:0,asP:{A:0,B:0}};
  const origCast=rwCast;
  for(let side=0;side<2;side++)for(let m=0;m<N;m++){
   matchMode='1v1';battleActivity='casual';start();
   window.requestAnimationFrame=()=>0;
   const [sp,sb]=side===0?[A,B]:[B,A];
   p.skin=sp;p.kit=[...CHAMPIONS[sp].kit];b.skin=sb;b.kit=[...CHAMPIONS[sb].kit];
   p.hp=p.max=1000;b.hp=b.max=1000;p.cd=p.cd.map(()=>0);b.cd=b.cd.map(()=>0);
   const ka=side===0?p:b, kb=side===0?b:p; // ka = campeão A
   state='fight';count=0;time=180;let steps=0,copies=0,ultCopies=0;
   const oc=window.originalCopy;
   while(state==='fight'&&time>0&&p.hp>0&&b.hp>0&&steps<11000){
    ai(1/60,p);step(1/60);steps++;
    const st=(ka.skin===1?reworkState(ka):null);
    if(st){const c=st.copy;if(c&&!ka.__seen){ka.__seen=c.id;copies++;if(skills[c.id]?.ultimate)ultCopies++}if(!c)ka.__seen=null}
   }
   const hA=ka.hp/ka.max,hB=kb.hp/kb.max;
   out.n++;out.dur+=steps/60;out.A.hpSum+=hA;out.B.hpSum+=hB;out.A.dmg+=ka.damage||0;out.B.dmg+=kb.damage||0;out.A.copies+=copies;out.A.ultCopies+=ultCopies;
   if(Math.abs(hA-hB)<.0001)out.draws++;else if(hA>hB){out.A.wins++;}else out.B.wins++;
  }
  return out},{A,B,N,SEED:+process.argv[5]||7});
 const name=i=>require('fs').existsSync?'':'';
 console.log(JSON.stringify(res),'errs',errs.slice(0,3));
 await br.close()})();
