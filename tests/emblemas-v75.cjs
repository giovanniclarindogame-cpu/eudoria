// Emblemas dos campeões: aparecem em todos os cartões e na página do campeão, carregam, não cobrem o texto e podem ser desligados.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const errs=[];
 for(const off of [false,true]){
  const p=await (await b.newContext({viewport:{width:915,height:412}})).newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
  await p.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent('ws://localhost:1')+(off?'&emblemas=0':''));await p.waitForTimeout(900);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
  await p.evaluate(()=>showScreen('selection'));await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>{const cs=[...document.querySelectorAll('.hero-card')];return{n:cs.length,emb:cs.filter(c=>c.querySelector('.hero-emblem')).length,carregou:cs.every(c=>{const i=c.querySelector('.hero-emblem');return !i||(i.complete&&i.naturalWidth>0)}),
    cobreTexto:cs.some(c=>{const i=c.querySelector('.hero-emblem'),t=c.querySelector('.hero-card-copy strong');if(!i||!t)return false;const a=i.getBoundingClientRect(),d=t.getBoundingClientRect();return !(a.right<d.left||a.left>d.right||a.bottom<d.top||a.top>d.bottom)})}});
  if(off){ok(r.emb===0,'?emblemas=0 desliga os emblemas');await p.close();continue}
  ok(r.n===10&&r.emb===10&&r.carregou,`10 cartões com emblema carregado (${r.emb}/${r.n})`);ok(!r.cobreTexto,'o emblema não cobre o nome do campeão');
  const h0=await p.evaluate(()=>{document.querySelector('[data-hero-open="3"]').click();return null});await p.waitForTimeout(900);
  const d=await p.evaluate(()=>{const e=document.querySelector('#heroDetail .hero-kit button.mark-btn .champ-emblem-ult'),btn=document.querySelector('#heroDetail .hero-kit>button.mark-btn'),voltar=document.querySelector('#heroDetail [data-hero-back]');if(!e)return null;
   const a=e.getBoundingClientRect(),v=voltar.getBoundingClientRect();
   return{dentro:a.top>=0&&a.right<=innerWidth&&a.bottom<=innerHeight&&a.width>20,carregou:e.complete&&e.naturalWidth>0,src:e.getAttribute('src'),antigoOculto:[...btn.children].filter(x=>x.tagName!=='SMALL'&&x!==e).every(x=>x.style.display==='none'),
    semEmblemaNoCanto:!document.querySelector('#heroDetail .champ-emblem-big'),naoCobreVoltar:!(a.right<v.left||a.left>v.right||a.bottom<v.top||a.top>v.bottom)}});
  ok(d&&d.dentro&&d.carregou&&d.antigoOculto&&d.semEmblemaNoCanto&&!d.naoCobreVoltar,'página do campeão: emblema no botão da marca, sem emblema ao lado do voltar '+JSON.stringify(d));
  await p.click('#heroDetail .hero-kit button[data-hero-skill="2"]');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>!!document.querySelector('#heroDetail .hero-kit button.mark-btn .champ-emblem-ult')),'o emblema continua no botão da marca depois de trocar de habilidade');
  await p.close()}
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2).join('|'));await b.close()})();
