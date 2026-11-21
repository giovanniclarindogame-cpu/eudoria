// Kakashi (Ninja, herói 1) com a IA difícil contra outros heróis também na IA difícil: taxa de vitória, dano causado por luta e tempo perto do rival.
// uso: node tests/simulacao-kakashi.cjs [partidas por lado]
const {chromium}=require('playwright');
const N=+process.argv[2]||4;
(async()=>{const br=await chromium.launch();const pg=await (await br.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1&semcarga=1');await pg.waitForTimeout(800);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('input','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 const res=await pg.evaluate(async({N})=>{
  window.BOT_SIM_P=true;let seed=7;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const out={};
  for(const O of [0,2,3,4,5,6,7,8,9]){
   let w=0,l=0,d=0,dmg=0,near=0,tot=0,n=0,tg=0,rd=0,px=0,py=0;
   for(let side=0;side<2;side++)for(let m=0;m<N;m++){
    matchMode='1v1';battleActivity='casual';start();window.requestAnimationFrame=()=>0;
    const kp=side===0,K=kp?p:b,E=kp?b:p;
    p.skin=kp?1:O;p.kit=[...CHAMPIONS[p.skin].kit];b.skin=kp?O:1;b.kit=[...CHAMPIONS[b.skin].kit];
    p.hp=p.max=b.hp=b.max=1000;p.cd=p.cd.map(()=>0);b.cd=b.cd.map(()=>0);p.oldBot=b.oldBot=false;
    state='fight';count=0;time=180;let steps=0;
    px=K.x;py=K.y;
    while(state==='fight'&&time>0&&p.hp>0&&b.hp>0&&steps<10800){ai(1/60,p);ai(1/60,b);step(1/60);steps++;tot++;const dd=Math.hypot(p.x-b.x,p.y-b.y);if(dd<130)near++;
     if(dd<200&&dd>1){const vx=K.x-px,vy=K.y-py,ux=(E.x-K.x)/dd,uy=(E.y-K.y)/dd,r=vx*ux+vy*uy,t=Math.abs(-vx*uy+vy*ux);rd+=Math.abs(r);tg+=t}px=K.x;py=K.y}
    const hk=K.hp/K.max,he=E.hp/E.max;n++;dmg+=1000-E.hp;
    if(Math.abs(hk-he)<1e-4)d++;else if(hk>he)w++;else l++;
   }
   out[O]={w,l,d,dano:Math.round(dmg/n),perto:Math.round(100*near/tot)+'%',rodeia:Math.round(100*tg/Math.max(1e-6,tg+rd))+'%'};
  }
  return out},{N});
 let W=0,L=0;for(const k of Object.keys(res)){W+=res[k].w;L+=res[k].l;console.log('Kakashi x',k,JSON.stringify(res[k]))}
 console.log('TOTAL vitórias',W,'derrotas',L,errs.slice(0,2));
 await br.close()})();
