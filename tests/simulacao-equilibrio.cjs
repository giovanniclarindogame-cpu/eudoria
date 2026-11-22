// Todos contra todos (IA difícil dos dois lados, lados trocados): taxa de vitória de cada herói e quando cada um solta a 1ª ultimate.
// uso: node tests/simulacao-equilibrio.cjs [lutas por lado] [?query extra, ex.: equilibrio=0]
const {chromium}=require('playwright');
const N=+process.argv[2]||1,Q=process.argv[3]||'';
(async()=>{const br=await chromium.launch();const pg=await (await br.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://localhost:8000/index.html?allheroes=1&semcarga=1'+(Q?'&'+Q:''));await pg.waitForTimeout(800);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('input','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 const res=await pg.evaluate(async({N})=>{
  window.BOT_SIM_P=true;let seed=11;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const W={},L={},D={},ult1={},ultN={},dur={};for(let h=0;h<10;h++){W[h]=L[h]=D[h]=ultN[h]=0;ult1[h]=[];dur[h]=[]}
  for(let a=0;a<10;a++)for(let c=a+1;c<10;c++)for(let side=0;side<2;side++)for(let m=0;m<N;m++){
   matchMode='1v1';battleActivity='casual';start();window.requestAnimationFrame=()=>0;
   const A=side?b:p,B=side?p:b;
   V3Modes.swapHero(A,a,1000);V3Modes.swapHero(B,c,1000);A.skin=a;B.skin=c;
   try{window.V3Balance&&V3Balance.aplicar&&[A,B].forEach(x=>V3Balance.aplicar(x))}catch{}
   state='fight';count=0;time=120;let steps=0;const first={};
   const oc=cast;cast=function(x,id,mn){const r=oc(x,id,mn);if(r&&skills[id]?.ultimate&&first[x.skin]===undefined)first[x.skin]=steps/60;return r};
   while(state==='fight'&&time>0&&p.hp>0&&b.hp>0&&steps<7300){ai(1/60,p);ai(1/60,b);step(1/60);steps++}
   cast=oc;
   const ha=A.hp/A.max,hb=B.hp/B.max;
   if(Math.abs(ha-hb)<1e-4){D[a]++;D[c]++}else if(ha>hb){W[a]++;L[c]++}else{W[c]++;L[a]++}
   for(const h of [a,c]){dur[h].push(steps/60);if(first[h]!==undefined)ult1[h].push(first[h])}
  }
  const out={};for(let h=0;h<10;h++){const n=W[h]+L[h]+D[h];out[h]={nome:CHAMPIONS[h].name,v:W[h],d:L[h],e:D[h],taxa:Math.round(100*W[h]/Math.max(1,n)),ult1:ult1[h].length?+(ult1[h].reduce((x,y)=>x+y,0)/ult1[h].length).toFixed(1):null,ultsLuta:+(ult1[h].length/Math.max(1,n)).toFixed(2)}}
  return out},{N});
 for(const h of Object.keys(res)){const o=res[h];console.log(String(h).padEnd(2),o.nome.padEnd(26),`vit ${String(o.v).padStart(2)} der ${String(o.d).padStart(2)} emp ${o.e} · taxa ${String(o.taxa).padStart(3)}% · 1ª ult aos ${o.ult1===null?'—':o.ult1+' s'} (soltou em ${Math.round(100*o.ultsLuta)}% das lutas)`)}
 console.log(errs.slice(0,2));await br.close()})();
