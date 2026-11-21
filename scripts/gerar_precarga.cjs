// Gera js/precarga_dados.js: para cada campeão, as artes (carga sob demanda) que ele usa numa luta de verdade.
// A tela de carregamento (js/carregamento_v51.js) baixa e prepara essa lista antes de a luta começar.
// Como roda: o jogo no navegador (precisa do site em http://localhost:8000), cada herói luta contra ele mesmo, usa TODAS as habilidades
// (inclusive a ultimate), o dash e a esquiva; tudo que passou a ser baixado nesse intervalo entra na lista dele.
// Uso:  node scripts/gerar_precarga.cjs     (rode de novo quando trocar as artes dos heróis)
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://localhost:8000';
(async()=>{
 const br=await chromium.launch();const out={};
 for(let h=0;h<10;h++){
  const pg=await (await br.newContext({viewport:{width:844,height:390}})).newPage();
  await pg.goto(BASE+'/index.html?allheroes=1');await sleep(1000);
  await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Gerador');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForSelector('.v40-home',{timeout:60000});await sleep(1500);
  const antes=await pg.evaluate(()=>[...LazyArt.porUrl].filter(([k,im])=>im.__lz.on).map(([k])=>k));
  await pg.evaluate(h=>{showScreen('home');try{RetQA.set({tutorial:true})}catch{};equipChampion(h,false);lobbyPrefs.mode='1v1';queueMatch('1v1');V3Modes.swapHero(b,h,1000)},h);
  await pg.waitForFunction(()=>state==='count'||state==='fight'||state==='loading',null,{timeout:30000});
  await pg.evaluate(()=>{if(state==='loading'){state='count';count=3.4}});
  await pg.waitForFunction(()=>state==='fight',null,{timeout:30000});
  for(let t=0;t<14;t++){
   await pg.evaluate(t=>{try{ai(1/30,p)}catch{};p.cd=p.cd.map(()=>0);p.mp=120;p.hp=Math.max(150,p.hp);p.max=Math.max(p.max,1000);b.hp=b.max;
     const id=p.kit[t%p.kit.length];try{cast(p,id)}catch{};if(t%3===0){try{window.v3Dash&&v3Dash(p)}catch{}}if(t%5===0){try{dodge(p)}catch{}}},t);
   await sleep(650);
  }
  const depois=await pg.evaluate(()=>[...LazyArt.porUrl].filter(([k,im])=>im.__lz.on).map(([k])=>k));
  const set=new Set(antes);out[h]=depois.filter(u=>!set.has(u));
  console.log('herói',h,':',out[h].length,'artes');await pg.close();
 }
 await br.close();
 const tot=new Set(Object.values(out).flat());
 const txt=`'use strict';\n// GERADO por scripts/gerar_precarga.cjs — não edite à mão. Para cada campeão, as artes (carga sob demanda) usadas numa luta.\nwindow.PRECARGA=${JSON.stringify(out)};\n`;
 fs.writeFileSync(path.join(__dirname,'..','js','precarga_dados.js'),txt);
 console.log('arquivos distintos:',tot.size,'| escrito js/precarga_dados.js (',Math.round(txt.length/1024),'KB )');
 process.exit(0)})();
